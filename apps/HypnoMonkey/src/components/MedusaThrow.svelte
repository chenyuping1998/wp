<script lang="ts" module>
	import type { WinPace } from './ScatterWins.svelte';
	import type { MedusaAnimation } from '../game/animationTimeline';

	export type EmitterEventMedusaThrow =
		| {
				type: 'hypnoThrow';
				multipliers: number[];
				applied: boolean;
				/** base: the value applied (1 when wasted); free: the running total after */
				mult: number;
				baseWin: number;
				totalWin: number;
				/** free game: orbs fly to the running-total plate, not the board */
				toTotal: boolean;
				pace: WinPace;
		  }
		| {
				/** watches riding the last refill of a winning spin (TumbleLayer) */
				type: 'hypnoWatchDrop';
				animation: MedusaAnimation;
				releaseMs: number;
				pace: WinPace;
				drops: WatchDrop[];
		  }
		| { type: 'hypnoWatchClear' }
		| { type: 'medusaTotalShow' }
		| { type: 'medusaTotalHide' };

	export type WatchDrop = { value: number; x: number; fromY: number; toY: number; delayMs: number; durationMs: number };
</script>

<script lang="ts">
	import { Container, Graphics, Sprite, Text } from 'pixi-svelte';
	import { onDestroy,onMount,tick as flushRender } from 'svelte';
	import {ColorMatrixFilter,type Graphics as PixiGraphics} from 'pixi.js';
	import { bookEventAmountToCurrencyString } from 'utils-shared/amount';

	import { getContext } from '../game/context';
	import { GAME_FONT, GAME_FONT_WEIGHT } from '../game/fonts';
	import {
		BOARD_SIZES,
		orbKeyFor,
		totalPlateLevel,
	} from '../game/constants';
	import { throwTiming, medusaAnimations, multiplierCountMs } from '../game/animationTimeline';
	import { watchCollectTiming } from '../game/hypnoWatchTiming';
	import { gravityProgress } from '../game/symbolMotion';
	import { shakeBoard } from '../game/boardShake.svelte';
	import MultiplierFx from './MultiplierFx.svelte';
	import type { MultiplierFxController } from '../game/multiplierFxScene';
	import { flightPose,impactPose,gazePose,recoil,orbColor,ORB_CHARGE_DISTANCE,type OrbVisual } from '../game/multiplierPerformance';
	import { drawMultiplierReadout } from '../game/multiplierReadout';
	import { medusaAnchors } from '../game/medusaAnchors.svelte';
	import BoardContainer from './BoardContainer.svelte';
	import { medusaEyes } from './Medusa.svelte';

	/**
	 * Medusa's thrown multiplier (SPEC 3, MEDUSA_動畫需求單 §2).
	 *
	 * Orbs leave from where Medusa stands (right of the board in landscape, above
	 * its right corner in portrait) and fly to:
	 *   · base game  — the middle of the board, where the spin's win is scaled
	 *   · free game  — the running-total plate, which then scales the spin
	 * A throw on a spin with no tumble win is wasted: each orb greys, cracks and
	 * crumbles short of its target, and nothing changes.
	 *
	 * Everything here is in board coordinates (inside BoardContainer). Medusa's
	 * own poses are driven from here through `medusaPose` events.
	 */
	const context = getContext();
	const stoneMaterial=new ColorMatrixFilter();stoneMaterial.saturate(-.6);
	let alive = true;
	const cancellations = new Set<() => void>();
	onDestroy(() => {
		context.eventEmitter.broadcast({ type: 'soundStop', name: 'sfx_multiplier_update' });
		alive = false;
		for (const cancel of [...cancellations]) cancel();
		stoneMaterial.destroy();
	});
	const broadcast: typeof context.eventEmitter.broadcast = (event) => {
		if (alive) context.eventEmitter.broadcast(event);
	};

	/** `cell`: a watch resting on the board until the chain-end settlement */
	type Orb = OrbVisual & { cell?: boolean };
	// A watch on a cell sits a little inside the symbol frame.
	const CELL_SCALE = 0.8;
	let watchesLanded: Promise<unknown> = Promise.resolve();
	// Legibility (Stone 2026-10-28): a bigger watch, its number sized to fill the
	// cream dial (half the sprite's width), and a glow in the tier colour behind
	// it so the watch reads off any symbol. Ink fill, thin cream edge: a thick
	// dark stroke would close the digits' counters.
	const WATCH_SIZE = 132;
	const DIAL_TEXT_WIDTH = WATCH_SIZE * 0.5;
	const numberSizes = new Map<number, number>();
	const numberSize = (value: number) => {
		let size = numberSizes.get(value);
		if (size) return size;
		const ctx = document.createElement('canvas').getContext('2d');
		let width = 0.62 * 100 * `×${value}`.length;
		if (ctx) {
			ctx.font = `${GAME_FONT_WEIGHT} 100px ${GAME_FONT}`;
			width = ctx.measureText(`×${value}`).width;
		}
		size = Math.min(50, (100 * DIAL_TEXT_WIDTH) / width);
		// measured before the font loaded: do not cache the fallback width
		if (document.fonts?.check?.(`100px "Titan One"`)) numberSizes.set(value, size);
		return size;
	};
	// ×100 and up land like a thunderclap: a bolt rides the watch down its
	// column, then a flash, a shock ring and a board shake (ATG 戰神賽特 study).
	const HEAVY = 100;
	// a wasted watch dulls to a cold lavender-grey before its glass cracks
	const DUD_TINT = 0xa79cbc;
	let heavy = $state<{ x: number; y: number; bolt: number; ring: number; flash: number; dim: number; color: number; seed: number } | null>(null);
	let fx=$state.raw<MultiplierFxController>();
	let reducedMotion=$state(false);
	onMount(()=>{const media=matchMedia('(prefers-reduced-motion: reduce)');const change=()=>reducedMotion=media.matches;change();media.addEventListener('change',change);return()=>media.removeEventListener('change',change);});

	let orbs = $state<Orb[]>([]);
	let gaze = $state(0);
	let gazeProgress=$state(-1);
	let baseAmount=$state('');
	let pop = $state<{ text: string; scale: number; alpha: number } | null>(null);
	let amount = $state<{ text: string; alpha: number } | null>(null);
	/** the readout's sum line gets its "=" only once every value is in */
	let formulaDone = $state(true);

	let totalShown = $state(false);
	let totalValue = $state(0);
	let totalBump = $state(0);
	let totalEnter = $state(0);
	let plateLevel = $state(0);
	let scoreBump = $state(0);
	let plateBeam = $state(0);
	let beamTarget = $state({ x: 0, y: 0 });

	const portrait = $derived(context.stateLayoutDerived.layoutType() === 'portrait');

	// orbs leave from Medusa's eyes (Medusa.svelte owns where she stands)
	const origin = $derived(medusaAnchors.ready?medusaAnchors.center:medusaEyes(portrait, BOARD_SIZES.width, BOARD_SIZES.height));
	const eyePoints=$derived(medusaAnchors.ready?[medusaAnchors.left,medusaAnchors.right]:[{x:origin.x-7,y:origin.y},{x:origin.x+7,y:origin.y}]);
	const center = { x: BOARD_SIZES.width / 2, y: BOARD_SIZES.height / 2 };
	// drawMultiplierReadout's plaque: 416 x 238 around the board centre
	const READOUT_TOP = center.y - 119;
	const READOUT_HALF_WIDTH = 208;
	const READOUT_HEIGHT = 238;

	const PLATE_WIDTH = 200;
	const PLATE_HEIGHT = PLATE_WIDTH * (320 / 512);
	// Landscape: left of the board, below the free-spin counter. Portrait: above
	// the wordmark on the frame's top-left, clear of the counter centred above it.
	const plate = $derived(
		portrait
			? { x: PLATE_WIDTH * 0.2, y: -PLATE_HEIGHT * 1.35 }
			: { x: -PLATE_WIDTH * 0.62, y: BOARD_SIZES.height * 0.45 },
	);
	// the ×N sits on the right-hand two thirds; the cameo is on the left
	const plateValue = $derived({ x: plate.x + PLATE_WIDTH * 0.17, y: plate.y });

	// A hidden tab must complete each beat exactly once, even without rAF.
	const tween = (ms: number, step: (t: number) => void) =>
		new Promise<void>((resolve) => {
			if (!alive) {
				resolve();
				return;
			}
			let done = false;
			let raf = 0;
			let fallback: ReturnType<typeof setTimeout>;
			const start = performance.now();
			const finish = () => {
				if (done) return;
				done = true;
				cancelAnimationFrame(raf);
				clearTimeout(fallback);
				cancellations.delete(finish);
				if (alive) step(1);
				resolve();
			};
			const frame = (now: number) => {
				if (done) return;
				const t = Math.min(1, (now - start) / Math.max(1, ms));
				step(t);
				if (t >= 1) finish();
				else raf = requestAnimationFrame(frame);
			};
			cancellations.add(finish);
			raf = requestAnimationFrame(frame);
			fallback = setTimeout(finish, ms + 80);
		});
	const wait = (ms: number) =>
		new Promise<void>((resolve) => {
			if (!alive) {
				resolve();
				return;
			}
			const finish = () => {
				clearTimeout(timer);
				cancellations.delete(finish);
				resolve();
			};
			const timer = setTimeout(finish, Math.max(0, ms));
			cancellations.add(finish);
		});
	const easeOut = (t: number) => 1 - (1 - t) ** 3;

	let nextId = 0;
	const update = (id: number, patch: Partial<Orb>) => {
		orbs = orbs.map((orb) => (orb.id === id ? { ...orb, ...patch } : orb));
	};

	/** Fly one orb along an arc that lifts as it travels. */
	const fly = async (
		value: number,
		to: { x: number; y: number },
		ms: number,
		stopShort: boolean,
		chargeMs: number,
	) => {
		const id = nextId++;
		const d=Math.hypot(to.x-origin.x,to.y-origin.y)||1;
		// Energy gathers in front of the face; it never hides the eye performance.
		const from={x:origin.x+(to.x-origin.x)/d*ORB_CHARGE_DISTANCE,y:origin.y+(to.y-origin.y)/d*ORB_CHARGE_DISTANCE};
		orbs = [...orbs, { id, value, ...from, scale: .12, alpha: 0, stone: 0, crack: 0,angle:0,sx:1,sy:1,trail:[],charging:true }];
		const end = stopShort
			? { x: to.x + (origin.x - to.x) * 0.14, y: to.y + (origin.y - to.y) * 0.14 }
			: to;
		await tween(chargeMs,t=>update(id,{scale:.12+.76*easeOut(t),alpha:easeOut(t)}));
		broadcast({ type:'soundMedusa',cue:'orbFly',speed:450/ms,panFrom:Math.max(-.85,Math.min(.85,(from.x-BOARD_SIZES.width/2)/BOARD_SIZES.width*1.6)),panTo:Math.max(-.85,Math.min(.85,(end.x-BOARD_SIZES.width/2)/BOARD_SIZES.width*1.6)) });
		await tween(ms, (t) => {
			update(id,{...flightPose(from,end,reducedMotion?1:t),alpha:1,charging:false});
		});
		return id;
	};

	const shatter = async (id: number, ms: number) => {
		await tween(ms * 0.45, (t) => update(id, { stone: t, crack: t }));
		const orb = orbs.find((item) => item.id === id);
		if (orb) fx?.shatter(orb,orb.value);
		orbs = orbs.filter((item) => item.id !== id);
		await wait(ms * 0.55);
	};

	const land = async (id: number, ms: number,toTotal:boolean) => {
		if(!toTotal&&amount)amount={...amount,alpha:0};
		const orb=orbs.find(item=>item.id===id);if(orb)fx?.impact(orb,orb.value,toTotal?'plate':'score');
		await tween(ms, (t) => update(id, {...impactPose(t),angle:0,trail:[]}));
		orbs = orbs.filter((orb) => orb.id !== id);
	};

	/** Fly an existing orb between two board points (the settlement, not a throw). */
	const flyBetween = async (id: number, from: { x: number; y: number }, to: { x: number; y: number }, ms: number) => {
		broadcast({ type:'soundMedusa',cue:'orbFly',speed:450/ms,panFrom:Math.max(-.85,Math.min(.85,(from.x-BOARD_SIZES.width/2)/BOARD_SIZES.width*1.6)),panTo:Math.max(-.85,Math.min(.85,(to.x-BOARD_SIZES.width/2)/BOARD_SIZES.width*1.6)) });
		await tween(ms, (t) => update(id, { ...flightPose(from, to, reducedMotion ? 1 : t), alpha: 1 }));
	};

	/** The hypnotist charges in the hole and points; each watch rides its column's refill. */
	const dropWatches = async ({ drops, animation, releaseMs, pace }: { drops: WatchDrop[]; animation: MedusaAnimation; releaseMs: number; pace: WinPace }) => {
		const fast = pace === 'turbo' || pace === 'turboFreegame';
	/** x100+ impact: thunderclap, flash, rings and a board shake (also on a wasted watch). */
	const strike = (x: number, y: number, value: number, fast: boolean) => {
		const color = orbColor(value);
		broadcast({ type: 'soundOnce', name: 'sfx_wild_explode' });
		shakeBoard(value >= 250 ? 1.8 : 1.3, fast ? 420 : 700);
		return tween(fast ? 300 : 560, (t) => {
			heavy = { x, y, bolt: Math.max(0, 1 - t * 2.4), ring: t, flash: Math.max(0, 1 - t * 2.2), dim: 0, color, seed: Math.random() * 100 };
		}).then(() => (heavy = null));
	};

		const action = medusaAnimations[animation];
		broadcast({ type: 'medusaAction', animation, releaseMs });
		broadcast({ type: 'soundMedusa', cue: 'gaze', speed: fast ? 1.5 : 1 });
		const landAt = (drop: WatchDrop) => drop.delayMs + drop.durationMs;
		const lastLand = Math.max(...drops.map(landAt));
		const lead = drops.reduce((a, b) => (landAt(a) <= landAt(b) ? a : b));
		gazeProgress = -1;
		beamTarget = { x: lead.x, y: lead.fromY };
		// The beam locks on the leading watch and follows it down its column.
		const beam = (async () => {
			await wait(action.beamAtMs);
			broadcast({ type: 'soundMedusa', cue: 'gazeBeam', speed: fast ? 1.5 : 1 });
			await tween(Math.max(120, lastLand + (fast ? 80 : 160) - action.beamAtMs), (t) => {
				gazeProgress = t;
				gaze = gazePose(t).intensity;
			});
			gaze = 0;
			gazeProgress = -1;
		})();
		await Promise.all(
			drops.map(async (drop) => {
				await wait(drop.delayMs);
				const id = nextId++;
				orbs = [...orbs, { id, value: drop.value, x: drop.x, y: drop.fromY, scale: CELL_SCALE, alpha: 0, stone: 0, crack: 0, angle: 0, sx: 1, sy: 1, trail: [], cell: true }];
				const big = drop.value >= HEAVY;
				const color = orbColor(drop.value);
				await tween(drop.durationMs, (t) => {
					const y = drop.fromY + (drop.toY - drop.fromY) * gravityProgress(t);
					// fades in as it crosses the top edge of the board
					update(id, { y, alpha: Math.max(0, Math.min(1, (y + 20) / 60)), sx: 1 - 0.06 * t, sy: 1 + 0.12 * t });
					if (drop === lead) beamTarget = { x: drop.x, y };
					if (big) heavy = { x: drop.x, y, bolt: Math.min(1, t * 4), ring: 0, flash: 0, dim: Math.min(1, t * 3), color, seed: Math.random() * 100 };
				});
				fx?.impact({ x: drop.x, y: drop.toY }, drop.value, 'orb');
				broadcast({ type: 'soundMedusa', cue: 'orbHit', value: drop.value, speed: fast ? 1.25 : 1 });
				if (big) void strike(drop.x, drop.toY, drop.value, fast);
				await tween(big ? (fast ? 160 : 300) : fast ? 90 : 160, (t) => {
					const squash = Math.sin(Math.PI * t) * (big ? 1.5 : 1);
					update(id, { y: drop.toY, alpha: 1, sx: 1 + 0.14 * squash, sy: 1 - 0.16 * squash });
				});
			}),
		);
		await beam;
	};

	/**
	 * Chain-end settlement of watches already on the board: the running total
	 * flies in first (free game), then each watch pulses and sends its value, the
	 * readout holds "win ×N" and only then pays.
	 */
	const collectWatches = async ({ mult, baseWin, totalWin, toTotal, fast }: { mult: number; baseWin: number; totalWin: number; toTotal: boolean; fast: boolean }) => {
		const watches = orbs.filter((orb) => orb.cell);
		const previous = toTotal ? totalValue : 0;
		const plan = watchCollectTiming({ turbo: fast, watchCount: watches.length, carriesTotal: toTotal && previous > 0 });
		const readout = { x: center.x, y: center.y - 37 };
		baseAmount = bookEventAmountToCurrencyString(baseWin);
		formulaDone = false;
		broadcast({ type: 'medusaAction', animation: 'react_small' });
		pop = { text: '', scale: 1, alpha: 0 };
		amount = { text: baseAmount, alpha: 0 };
		// A watch resting where the readout opens steps up above it first, so it
		// never sits on the readout's lettering.
		const covered = watches.filter((watch) => watch.y > READOUT_TOP - 44 && watch.y < READOUT_TOP + READOUT_HEIGHT + 44 && Math.abs(watch.x - center.x) < READOUT_HALF_WIDTH + 40);
		const lifts = covered.map((watch) => ({ id: watch.id, from: watch.y }));
		await tween(plan.openMs, (t) => {
			if (pop) pop = { ...pop, alpha: t };
			if (amount) amount = { ...amount, alpha: t };
			for (const lift of lifts) update(lift.id, { y: lift.from + (READOUT_TOP - 44 - lift.from) * easeOut(t) });
		});
		for (const watch of covered) watch.y = READOUT_TOP - 44;
		let shown = 0;
		const arrive = (value: number) => {
			shown = value;
			pop = { text: `×${shown}`, scale: 1, alpha: 1 };
			// the sum line now carries the base win; the paid amount comes after
			amount = null;
			void tween(fast ? 120 : 200, (t) => {
				scoreBump = recoil(t);
				if (pop) pop = { ...pop, scale: 1 + 0.12 * recoil(t) };
			});
		};
		if (plan.totalFlyMs) {
			const id = nextId++;
			orbs = [...orbs, { id, value: previous, ...plateValue, scale: 0.7, alpha: 1, stone: 0, crack: 0, angle: 0, sx: 1, sy: 1, trail: [] }];
			totalBump = 1;
			await flyBetween(id, plateValue, readout, plan.totalFlyMs);
			fx?.impact(readout, previous, 'score');
			orbs = orbs.filter((orb) => orb.id !== id);
			totalBump = 0;
			arrive(previous);
		}
		for (const [index, watch] of watches.entries()) {
			if (index > 0) await wait(Math.max(0, plan.staggerMs - plan.pulseMs));
			const from = { x: watch.x, y: watch.y };
			await tween(plan.pulseMs, (t) => update(watch.id, { scale: CELL_SCALE * (1 + 0.18 * Math.sin(Math.PI * t)) }));
			await flyBetween(watch.id, from, readout, plan.flyMs);
			fx?.impact(readout, watch.value, 'score');
			broadcast({ type: 'soundMedusa', cue: 'orbHit', value: watch.value, speed: fast ? 1.25 : 1 });
			if (watch.value >= HEAVY) shakeBoard(0.6, fast ? 260 : 380);
			orbs = orbs.filter((orb) => orb.id !== watch.id);
			arrive(shown + watch.value);
		}
		// The book is authoritative for the multiplier that pays.
		if (shown !== mult) arrive(mult);
		await wait(plan.holdMs);
		formulaDone = true;
		amount = { text: baseAmount, alpha: 1 };
		broadcast({ type: 'soundLoop', name: 'sfx_multiplier_update' });
		try {
			await Promise.all([
				countUp(baseWin, totalWin, multiplierCountMs(mult, fast)),
				(async () => {
					if (!toTotal) return;
					const from = totalValue;
					broadcast({ type: 'soundMedusa', cue: 'totalUp' });
					await tween(plan.collapseMs * 2, (t) => {
						totalValue = Math.round(from + (mult - from) * easeOut(t));
						totalBump = 1 - t;
					});
					totalValue = mult;
					plateLevel = totalPlateLevel(mult);
				})(),
			]);
		} finally {
			broadcast({ type: 'soundStop', name: 'sfx_multiplier_update' });
		}
		scoreBump = 0;
		totalBump = 0;
		broadcast({ type: 'medusaPose', pose: 'idle' });
		await wait(fast ? 120 : 360);
		await tween(plan.collapseMs, (t) => {
			if (pop) pop = { ...pop, alpha: 1 - t };
			if (amount) amount = { ...amount, alpha: 1 - t };
		});
		pop = null;
		amount = null;
	};

	const countUp = async (from: number, to: number, ms: number) => {
		await tween(ms, (t) => {
			amount = {
				text: bookEventAmountToCurrencyString(Math.round(from + (to - from) * easeOut(t))),
				alpha: 1,
			};
		});
	};
	context.eventEmitter.subscribeOnMount({
		medusaTotalShow: async () => {
			totalValue = context.stateGame.medusaTotal;
			plateLevel = totalPlateLevel(totalValue);
			totalShown = true;
			await tween(240, (t) => (totalEnter = easeOut(t)));
		},
		medusaTotalHide: () => {
			totalShown = false;
			totalValue = 0;
			totalEnter = 0;
			plateLevel = 0;
		},
		hypnoWatchDrop: (event) => {
			watchesLanded = dropWatches(event);
		},
		hypnoWatchClear: () => {
			orbs = orbs.filter((orb) => !orb.cell);
		},
		hypnoThrow: async ({ multipliers, applied, mult, baseWin, totalWin, toTotal, pace }) => {
			if (multipliers.length === 0) return;
			const fast = pace === 'turbo' || pace === 'turboFreegame';
			await watchesLanded;
			if (applied && orbs.some((orb) => orb.cell)) {
				await collectWatches({ mult, baseWin, totalWin, toTotal, fast });
				return;
			}
			orbs = orbs.filter((orb) => !orb.cell);
			const plan = throwTiming({
				freegame: toTotal,
				turbo: fast,
				applied,
				orbCount: multipliers.length,
				mult,
			});
			const action = medusaAnimations[plan.animation];
			const target = toTotal ? plateValue : center;
			baseAmount=bookEventAmountToCurrencyString(baseWin);
			gazeProgress=-1;
			beamTarget = target;
			broadcast({ type: 'medusaAction', animation: plan.animation, releaseMs: plan.releaseMs });
			await flushRender();
			broadcast({ type: 'soundMedusa', cue: 'gaze',speed:fast?1.5:1 });
			if (!toTotal && applied) {
				pop = { text: '', scale: 1, alpha: 1 };
				amount = { text: bookEventAmountToCurrencyString(baseWin), alpha: applied ? 1 : 0 };
			}

			// Gesture, beam and orbs run on one clock. Several orbs share one gaze.
			const beamAt = applied ? action.beamAtMs : Math.max(0, plan.releaseMs - 100);
			const beam = (async () => {
				if (!toTotal) {
					await wait(Math.min(plan.releaseMs, fast ? 100 : 200));
					broadcast({ type: 'soundMedusa', cue: 'peek',speed:fast?1.5:1 });
					await wait(Math.max(0, beamAt - (fast ? 100 : 200)));
				} else await wait(beamAt);
				broadcast({ type: 'soundMedusa', cue: 'gazeBeam',speed:fast?1.5:1 });
				await tween(
					Math.max(100, Math.min(action.beamEndMs, plan.lastArrivalMs) - beamAt),
					(t) => {gazeProgress=t;gaze=gazePose(t).intensity;},
				);
				gaze = 0;
				gazeProgress=-1;
			})();
			const recovery=(async()=>{if(!toTotal&&applied){await wait(Math.max(0,action.durationMs-120));broadcast({type:'soundMedusa',cue:'glassesOn',speed:fast?1.5:1});}})();
			const chargeMs=fast?70:130;
			await wait(Math.max(0,plan.releaseMs-chargeMs));
			let dudReacted = false;
			await Promise.all(
				multipliers.map(async (value, index) => {
					await wait(index * plan.staggerMs);
					// A base dud reaches board centre; a feature dud stops before the plate.
					const id = await fly(value, target, plan.flightMs, !applied && toTotal,chargeMs);
					if (applied) {
						broadcast({ type: 'soundMedusa', cue: 'orbHit', value,speed:fast?1.25:1 });
						if (toTotal) totalBump = 1;
						else scoreBump = 1;
						await land(id, plan.landMs,toTotal);
					} else {
						broadcast({ type: 'soundMedusa', cue: 'orbCrack',speed:fast?1.5:1 });
						if (!dudReacted) {
							dudReacted = true;
						// A wasted x100+ still lands with the full thunderclap before it cracks.
						const orb = orbs.find((item) => item.id === id);
						if (orb && value >= HEAVY) {
							heavy = { x: orb.x, y: orb.y, bolt: 1, ring: 0, flash: 0, dim: 1, color: orbColor(value), seed: Math.random() * 100 };
							await strike(orb.x, orb.y, value, fast);
						}
							broadcast({
								type: 'medusaAction',
								animation: 'gaze_dud',
								turbo: fast,
								holdMs: plan.endMs - plan.firstArrivalMs,
							});
							broadcast({ type: 'soundMedusa', cue: 'annoyed' });
						}
						await shatter(id, plan.shatterMs);
					}
				}),
			);
			if (!applied) {
				// Do not block a wasted multiplier on the longer successful gaze clip.
				gaze = 0;
				pop = null;
				amount = null;
				return;
			}

			if (toTotal) {
				const from = totalValue;
				broadcast({ type: 'soundMedusa', cue: 'totalUp' });
				await tween(plan.plateCountMs, (t) => {
					totalValue = Math.round(from + (mult - from) * easeOut(t));
					totalBump = 1 - t;
				});
				// Commit the book's authoritative value before sending light to score.
				totalValue = mult;
				plateLevel = totalPlateLevel(mult);
				broadcast({ type: 'soundMedusa', cue: 'plateBeam' });
				await tween(plan.beamMs, (t) => (plateBeam = Math.sin(Math.PI * t)));
				plateBeam = 0;
			}
			pop = { text: `×${mult}`, scale: 1, alpha: 1 };
			amount = { text: bookEventAmountToCurrencyString(baseWin), alpha: 1 };
			broadcast({ type: 'soundLoop', name: 'sfx_multiplier_update' });
			try {
				await Promise.all([
					tween(fast ? 120 : 200, (t) => {
							scoreBump = recoil(t);
							if(pop)pop={...pop,scale:1+.12*recoil(t)};
					}),
					countUp(baseWin, totalWin, plan.countMs),
				]);
			} finally {
				broadcast({ type: 'soundStop', name: 'sfx_multiplier_update' });
			}
			scoreBump = 0;
			totalBump = 0;
			await Promise.all([beam,recovery]);
			broadcast({ type: 'medusaPose', pose: 'idle' });
			await wait(plan.resultHoldMs);
			await tween(fast ? 90 : 150, (t) => {
				if (pop) pop = { ...pop, alpha: 1 - t };
				if (amount) amount = { ...amount, alpha: 1 - t };
			});
			pop = null;
			amount = null;
		},
	});

	const drawHeavy = (g: PixiGraphics) => {
		g.clear();
		if (!heavy) return;
		const { x, y, bolt, ring, flash, dim, color, seed } = heavy;
		const all = () => g.rect(-80, -80, BOARD_SIZES.width + 160, BOARD_SIZES.height + 160);
		// the board darkens while the bolt comes down, then whites out on impact
		if (dim > 0) all().fill({ color: 0x0b0710, alpha: 0.38 * dim });
		if (flash > 0) all().fill({ color: 0xfff6dc, alpha: 0.7 * flash });
		if (bolt > 0) {
			const top = -460;
			g.rect(x - 52, top, 104, y - top).fill({ color, alpha: 0.28 * bolt });
			g.rect(x - 20, top, 40, y - top).fill({ color: 0xffffff, alpha: 0.3 * bolt });
			const path = (k: number, spread: number) => {
				g.moveTo(x, top);
				for (let i = 1; i <= 12; i++) g.lineTo(i < 12 ? x + Math.sin(seed * k + i * 2.3) * spread : x, top + ((y - top) * i) / 12);
			};
			path(13.7, 30); g.stroke({ color, width: 26, alpha: 0.6 * bolt });
			path(13.7, 30); g.stroke({ color: 0xffffff, width: 9, alpha: bolt });
			path(7.1, 46); g.stroke({ color: 0xffffff, width: 3, alpha: 0.7 * bolt });
		}
		if (ring > 0 && ring < 1) {
			const ease = 1 - (1 - ring) ** 2;
			g.circle(x, y, 60 + 420 * ease).stroke({ color, width: 6 + 22 * (1 - ring), alpha: 1 - ring });
			g.circle(x, y, 40 + 260 * ease).stroke({ color: 0xffffff, width: 3 + 8 * (1 - ring), alpha: 0.9 * (1 - ring) });
			g.circle(x, y, 90 * (1 - ring) + 20).fill({ color: 0xffffff, alpha: 0.85 * (1 - ring) ** 2 });
		}
	};

	const drawReadoutBack = (g: PixiGraphics) => {
		drawMultiplierReadout(g,pop?.alpha??0,reducedMotion?-1:gazeProgress);
	};
</script>

<BoardContainer>
	<MultiplierFx bind:controller={fx} snapshot={{orbs,eyes:eyePoints,gaze,gazeProgress,target:beamTarget,transfer:plateBeam,plate:plateValue,score:center}}/>
	{#if totalShown}
		<Container
			x={plate.x - (1 - totalEnter) * 120}
			y={plate.y}
			alpha={totalEnter}
			scale={1 + 0.08 * totalBump}
		>
			<Sprite key={plateLevel > 1 ? 'mgTotalPlateHigh' : plateLevel > 0 ? 'mgTotalPlateMid' : 'mgTotalPlate'} anchor={0.5} width={PLATE_WIDTH} height={PLATE_HEIGHT} />
			<Text anchor={0.5} x={PLATE_WIDTH*.17} y={-28} text="TOTAL" style={{fontFamily:GAME_FONT,fontWeight:GAME_FONT_WEIGHT,fontSize:17,fill:0xffedc1,stroke:{color:0x18272b,width:3}}}/>
			<Text
				anchor={0.5}
				x={PLATE_WIDTH * 0.17}
				y={7}
				text={`×${totalValue}`}
				style={{
					fontFamily: GAME_FONT,
					fontWeight: GAME_FONT_WEIGHT,
					fontSize: totalValue>=1000?34:44,
					fill: 0xffe08a,
					stroke: { color: 0x2a1f24, width: 6 },
				}}
			/>
		</Container>
	{/if}

	<Container x={center.x} y={center.y} pivot={center} scale={1 + 0.1 * scoreBump}>
		<Graphics x={center.x} y={center.y} draw={drawReadoutBack} />
		{#if pop}
			<Text anchor={0.5} x={center.x} y={center.y-88} alpha={pop.alpha} text={pop.text?'MULTIPLIER':'BASE WIN'} style={{fontFamily:GAME_FONT,fontWeight:GAME_FONT_WEIGHT,fontSize:23,fill:0xe7d9ff,stroke:{color:0x241632,width:3}}}/>
			<Text
				anchor={0.5}
				x={center.x}
				y={center.y - 37}
				scale={pop.scale}
				alpha={pop.alpha}
				text={pop.text}
				style={{
					fontFamily: GAME_FONT,
					fontWeight: GAME_FONT_WEIGHT,
					fontSize: pop.text.length>5?66:80,
					fill: 0xffd36b,
					stroke: { color: 0x2a1f24, width: 8 },
				}}
			/>
			{#if pop.text}
				<Text anchor={0.5} x={center.x} y={center.y+25} alpha={pop.alpha} text={`${baseAmount} ${pop.text}${formulaDone ? ' =' : ''}`} style={{fontFamily:GAME_FONT,fontWeight:GAME_FONT_WEIGHT,fontSize:baseAmount.length>10?22:27,fill:0xf0ead2,stroke:{color:0x241632,width:3}}}/>
			{/if}
		{/if}
		{#if amount}
			<Text
				anchor={0.5}
				x={center.x}
				y={center.y + (pop?.text?77:5)}
				alpha={amount.alpha}
				text={amount.text}
				style={{
					fontFamily: GAME_FONT,
					fontWeight: GAME_FONT_WEIGHT,
					fontSize: amount.text.length>13?34:48,
					fill: 0xffe08a,
					stroke: { color: 0x2a1f24, width: 6 },
				}}
			/>
		{/if}
	</Container>
	<!-- over the readout: watches rest on the top row, clear of its text, and fly into it -->
	{#each orbs as orb (orb.id)}
		<Container x={orb.x} y={orb.y} alpha={orb.alpha}>
		<Container rotation={orb.angle} scale={{x:orb.scale*orb.sx,y:orb.scale*orb.sy}}>
			<Sprite
				key={orbKeyFor(orb.value)}
				anchor={{x:0.5,y:300/512}}
			{#if orb.stone === 0}
				<Sprite
					key="fxGlow"
					anchor={0.5}
					width={WATCH_SIZE * (orb.value >= HEAVY ? 2.1 : 1.75)}
					height={WATCH_SIZE * (orb.value >= HEAVY ? 2.1 : 1.75)}
					tint={orbColor(orb.value)}
					alpha={orb.value >= HEAVY ? 0.95 : 0.75}
					blendMode="add"
				/>
			{/if}
				width={WATCH_SIZE}
				height={WATCH_SIZE}
				tint={orb.stone > 0 ? DUD_TINT : 0xffffff}
				filters={orb.stone>0?[stoneMaterial]:[]}
			/>
			{#if orb.crack > 0}
				<Sprite
					key={orb.crack < 1 / 3 ? 'fxCrack1' : orb.crack < 2 / 3 ? 'fxCrack2' : 'fxCrack3'}
					anchor={0.5}
					width={WATCH_SIZE * 0.82}
					height={WATCH_SIZE * 0.82}
				/>
			{/if}
		</Container>
			<Text
				anchor={0.5}
				scale={orb.scale}
				text={`×${orb.value}`}
				style={{
					fontFamily: GAME_FONT,
					fontWeight: GAME_FONT_WEIGHT,
					fontSize: numberSize(orb.value),
					fill: 0x1a100c,
					stroke: { color: 0xfff6e2, width: 2 },
				}}
			/>
		</Container>
	{/each}
</BoardContainer>
