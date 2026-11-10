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
				/** the spin goes on to a big-win plaque: the sum holds longer (reference) */
				bigWin?: boolean;
				pace: WinPace;
		  }
		| {
				/** watches riding the last refill of a winning spin (TumbleLayer) */
				type: 'hypnoWatchDrop';
				animation: MedusaAnimation;
				/** the caster acts this long after the event (the burst) */
				castDelayMs?: number;
				releaseMs: number;
				pace: WinPace;
				drops: WatchDrop[];
		  }
		| { type: 'hypnoWatchReveal'; pace: WinPace; count: number; top?: number }
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
	import { GAME_FONT, TITLE_FONT, GAME_FONT_WEIGHT, NUMBER_FACE_NAME } from '../game/fonts';
	import {symbolIdleClock,useSymbolIdleClock} from '../game/symbolIdleClock.svelte';
	import {
		BOARD_SIZES,
		REEL_PADDING,
		SYMBOL_SIZE,
		orbKeyFor,
		totalPlateLevel,
		watchTier,
		TOTAL_PLATE_BREATH_S,
	} from '../game/constants';
	import { watchCollectTiming } from '../game/hypnoWatchTiming';
	import { gravityProgress } from '../game/symbolMotion';
	import { shakeBoard, zoomBoard } from '../game/boardShake.svelte';
	import { getSymbolX, getSymbolY } from '../game/utils';
	import MultiplierFx from './MultiplierFx.svelte';
	import type { MultiplierFxController } from '../game/multiplierFxScene';
	import { flightPose,gazePose,recoil,orbColor,type OrbVisual } from '../game/multiplierPerformance';
	import artGeometry from '../game/artGeometry.json';
	import { drawMultiplierReadout } from '../game/multiplierReadout';
	import { medusaAnchors } from '../game/medusaAnchors.svelte';
	import BoardContainer from './BoardContainer.svelte';
	import InkText from './InkText.svelte';
	import { medusaEyes } from './Medusa.svelte';

	/** Multipliers occupy reserved cells during the drop; chain end only settles them. */
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

	/** `cell`: a watch resting on the board until the chain-end settlement;
	 * `reveal` 0: a blank watch whose value is not shown yet (undefined = shown) */
	type Orb = OrbVisual & { cell?: boolean; reveal?: number };
	// A watch on a cell sits a little inside the symbol frame.
	const CELL_SCALE = 0.8;
	// Legibility (Stone 2026-11-04, ref. 星城 天使奧丁 eyes, research/xinstar-angelodin):
	// the tier is told by the colour of the whole gem alone, and the value is
	// ONE number face for every tier — gold with a dark red edge — laid on the
	// centre of the gem and allowed to run wider than the cell (Odin: a 180 px
	// text box on a 124 px cell). The tier-coloured halo breathes on Odin's
	// 1.43 s eye loop. The halo is a plain blend: added light on the pale board
	// bleached a gold watch to a bare ring.
	const WATCH_SIZE = 132;
	const NUMBER_Y = WATCH_SIZE * 0.02;
	const NUMBER_FACE = 0xffd84a;
	const NUMBER_EDGE = 0x5a1008;
	const HALO_LOOP_S = 1.43;
	const label = (value: number) => `${value}x`;
	const numberSizes = new Map<number, number>();
	const numberSize = (value: number) => {
		let size = numberSizes.get(value);
		if (size) return size;
		const ctx = document.createElement('canvas').getContext('2d');
		let width = 0.62 * 100 * label(value).length;
		if (ctx) {
			ctx.font = `${GAME_FONT_WEIGHT} 100px ${GAME_FONT}`;
			width = ctx.measureText(label(value)).width;
		}
		size = Math.min(value >= HEAVY ? 56 : 52, (100 * WATCH_SIZE * (value >= HEAVY ? 1.3 : 1.15)) / width);
		// measured before the font loaded: do not cache the fallback width
		if (document.fonts?.check?.(`100px "${NUMBER_FACE_NAME}"`)) numberSizes.set(value, size);
		return size;
	};
	// pearl body: centre at the sprite anchor (256, 300 of 512), radius 150/512 of the sprite.
	// The delivered pearls carry their own tier colour, so nothing is painted over them.
	const DIAL_R = WATCH_SIZE * (150 / 512);
	const shade = (color: number, k: number) => {
		const ch = (shift: number) => Math.max(0, Math.min(255, Math.round(((color >> shift) & 255) * k)));
		return (ch(16) << 16) | (ch(8) << 8) | ch(0);
	};
	let watchesLanded: Promise<unknown> = Promise.resolve();
	// ×100 and up land like a thunderclap: a bolt rides the watch down its
	// column, then a flash, a shock ring and a board shake (ATG 戰神賽特 study).
	const HEAVY = 100;
	// a wasted watch dulls to a cold lavender-grey before its glass cracks
	const DUD_TINT = 0xa79cbc;
	// a blank pearl before its value is struck in: plain nacre, so the tier is not given away before the beam
	const BLANK_WATCH = 'mgOrbPurple';
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
	onMount(()=>useSymbolIdleClock());
	// the TOTAL number breathes 100% → 95% → 100%, faster at every level (Odin)
	const plateBreath=$derived(reducedMotion||plateLevel===0?0:0.5-0.5*Math.cos((symbolIdleClock.seconds/TOTAL_PLATE_BREATH_S[plateLevel])*Math.PI*2));
	const haloBreath=$derived(reducedMotion?0:Math.sin((symbolIdleClock.seconds/HALO_LOOP_S)*Math.PI*2));
	$effect(()=>{symbolIdleClock.focusPaused=orbs.length>0||pop!==null||amount!==null||gazeProgress>=0;});
	onDestroy(()=>{symbolIdleClock.focusPaused=false;});

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

	// TOTAL badge (total_1-4.png): each tier drawn so its plaque is WELL_H tall and centred
	// at (WELL_X, 0) of the container; the round window holds a pearl of the plate's tier
	const PLATE_WIDTH = 200;
	const PLATE_HEIGHT = PLATE_WIDTH * (320 / 512);
	const WELL_X = PLATE_WIDTH * (337 / 512 - 0.5), WELL_H = 58;
	const TOTAL_PLATES = artGeometry.total;
	const plateArt = $derived.by(() => {
		const tier = Math.min(3, plateLevel), g = TOTAL_PLATES[tier], k = WELL_H / g.well.h;
		return { key: `mgTotalPlate${tier + 1}`, light: tier >= 2, x: WELL_X - g.well.x * k, y: -g.well.y * k, width: g.width * k, height: g.height * k,
			window: { x: WELL_X + (g.window.x - g.well.x) * k, y: (g.window.y - g.well.y) * k, r: g.window.r * k }, wellWidth: g.well.w * k };
	});
	// Landscape: left of the board, below the free-spin counter. Portrait: above
	// the wordmark on the frame's top-left, clear of the counter centred above it.
	const plate = $derived(
		portrait
			? { x: PLATE_WIDTH * 0.2, y: -PLATE_HEIGHT * 1.35 }
			: { x: -PLATE_WIDTH * 0.76, y: BOARD_SIZES.height * 0.45 },
	);
	// the ×N sits on the plaque at the right; the pearl window is on the left
	const plateValue = $derived({ x: plate.x + WELL_X, y: plate.y + WELL_H * 0.14 });

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

	/** A wasted watch breaks where it lies and keeps its cell until the next spin. */
	const crackInPlace = async (id: number, ms: number) => {
		await tween(ms * 0.45, (t) => update(id, { stone: t, crack: t }));
		const orb = orbs.find((item) => item.id === id);
		if (orb) fx?.shatter(orb, orb.value);
		await wait(ms * 0.55);
	};

	/** Fly an existing orb between two board points (the settlement, not a throw). */
	const flyBetween = async (id: number, from: { x: number; y: number }, to: { x: number; y: number }, ms: number, cue: 'orbFly' | 'totalFly' = 'orbFly') => {
		broadcast({ type:'soundMedusa',cue,speed:450/ms,panFrom:Math.max(-.85,Math.min(.85,(from.x-BOARD_SIZES.width/2)/BOARD_SIZES.width*1.6)),panTo:Math.max(-.85,Math.min(.85,(to.x-BOARD_SIZES.width/2)/BOARD_SIZES.width*1.6)) });
		await tween(ms, (t) => update(id, { ...flightPose(from, to, reducedMotion ? 1 : t), alpha: 1 }));
	};

	/** x100+ impact: thunderclap, flash, rings and a board shake (also on a wasted watch). */
	const strike = (x: number, y: number, value: number, fast: boolean) => {
		const color = orbColor(value);
		// a handful lands at once: the board takes one big hit (massShock), each x100+ keeps its flash
		if (!mass) {
			// ATG 戰神賽特: the camera lunges at the impact while the board shakes
			zoomBoard({ x, y }, value >= 250 ? 0.2 : 0.15, fast ? 520 : 1050);
			shakeBoard(value >= 250 ? 2.3 : 1.7, fast ? 480 : 820);
		}
		fx?.impact({ x, y }, value, 'orb');
		return tween(fast ? 340 : 640, (t) => {
			heavy = { x, y, bolt: Math.max(0, 1 - t * 2.4), ring: t, flash: Math.max(0, 1 - t * 2.2), dim: 0, color, seed: Math.random() * 100 };
		}).then(() => (heavy = null));
	};

	// ATG 戰神賽特 (research ATG-Seth-Capture §3-1): a watch lands BLANK, then a
	// thin beam drops from the sky onto it, it flashes, turns to dark smoke and
	// the value comes out of the smoke, ~0.45 s. Two watches strike 0.12 s apart.
	// The beam is already the watch's tier colour (天使奧丁: Odin's bolt matches
	// the eye's colour), so the size reads a beat before the number does.
	const REVEAL_STAGGER_MS = 120;
	// Stone 11-06: a wasted throw may be a whole handful (math add_mass_throws.py).
	// From MASS watches on, the beams rain in quicker (the whole lot in about a
	// second), the board takes one big hit with the first impact, and the
	// beam/crack sounds are thinned so 25 at once still read as one storm.
	const MASS = 6;
	let mass = false, massHit = false, revealStagger = REVEAL_STAGGER_MS, lastBeamSound = 0;
	const massShock = (fast: boolean) => {
		massHit = true;
		zoomBoard({ x: BOARD_SIZES.width / 2, y: BOARD_SIZES.height / 2 }, 0.12, fast ? 700 : 1400);
		shakeBoard(2.8, fast ? 700 : 1300);
	};
	let beams = $state<{ id: number; x: number; y: number; color: number; beam: number; flash: number; smoke: number }[]>([]);
	let nextRevealAt = 0;
	// reference (天使奧丁 FX1): the strike comes 0.15 s after the pearl's cell stops
	const STRIKE_DELAY_MS = 150;
	const revealWatch = async (id: number, x: number, y: number, value: number, fast: boolean, _freegame: boolean, strikeDelayMs = 0) => {
		if (strikeDelayMs > 0) await wait(strikeDelayMs * (fast ? 0.6 : 1));
		const now = performance.now();
		const startAt = Math.max(now, nextRevealAt);
		nextRevealAt = startAt + revealStagger * (fast ? 0.6 : 1);
		await wait(startAt - now);
		const k = fast ? 0.6 : 1;
		const color = orbColor(value);
		const beamId = nextId++;
		const set = (patch: Partial<(typeof beams)[number]>) => (beams = beams.map((b) => (b.id === beamId ? { ...b, ...patch } : b)));
		beams = [...beams, { id: beamId, x, y, color, beam: 0, flash: 0, smoke: 0 }];
		const voiced = !mass || performance.now() - lastBeamSound > 90;
		if (voiced) {
			lastBeamSound = performance.now();
			broadcast({ type: 'soundMedusa', cue: 'gazeBeam', speed: fast ? 1.5 : 1 });
		}
		await tween(60 * k, (t) => set({ beam: t }));
		if (mass && !massHit) massShock(fast);
		// impact: a burst of the caster's light; x100+ also gets the thunderclap
		if (value >= HEAVY) void strike(x, y, value, fast);
		await tween(80 * k, (t) => set({ beam: 1 - t, flash: Math.sin(Math.PI * Math.min(1, t * 1.4)) }));
		await tween(180 * k, (t) => set({ beam: 0, flash: 0, smoke: t }));
		fx?.impact({ x, y }, value, 'orb');
		if (voiced) broadcast({ type: 'soundMedusa', cue: 'orbHit', value, speed: fast ? 1.25 : 1 });
		// the struck pearl rings once (its value was on it from the moment it appeared)
		await tween(130 * k, (t) => update(id, { sx: 1 + 0.12 * Math.sin(Math.PI * t), sy: 1 + 0.12 * Math.sin(Math.PI * t) }));
		update(id, { reveal: 1, sx: 1, sy: 1 });
		beams = beams.filter((b) => b.id !== beamId);
	};

	/** The hypnotist casts as the refill starts; each blank watch rides its column's refill. */
	const dropWatches = async ({ drops, animation, castDelayMs = 0, releaseMs, pace }: { drops: WatchDrop[]; animation: MedusaAnimation; castDelayMs?: number; releaseMs: number; pace: WinPace }) => {
		const fast = pace === 'turbo' || pace === 'turboFreegame';
		const freegame = pace === 'freegame' || pace === 'turboFreegame';
		// the caster acts at the burst; the pearls already ride the refill clock
		void wait(castDelayMs).then(() => {
			broadcast({ type: 'medusaAction', animation, releaseMs });
			broadcast({ type: 'soundMedusa', cue: 'gaze', value: Math.max(0, ...drops.map((drop) => drop.value)), speed: fast ? 1.5 : 1 });
		});
		nextRevealAt = 0;
		mass = false; massHit = false; revealStagger = REVEAL_STAGGER_MS;
		const order = [...drops].sort((a, b) => a.delayMs + a.durationMs - (b.delayMs + b.durationMs));
		await Promise.all(
			order.map(async (drop) => {
				await wait(drop.delayMs);
				const id = nextId++;
				orbs = [...orbs, { id, value: drop.value, x: drop.x, y: drop.fromY, scale: CELL_SCALE, alpha: 0, stone: 0, crack: 0, angle: 0, sx: 1, sy: 1, trail: [], cell: true, reveal: 1 }];
				await tween(drop.durationMs, (t) => {
					const y = drop.fromY + (drop.toY - drop.fromY) * gravityProgress(t);
					// fades in as it crosses the top edge of the board
					update(id, { y, alpha: Math.max(0, Math.min(1, (y + 20) / 60)), sx: 1 - 0.06 * t, sy: 1 + 0.12 * t });
				});
				broadcast({ type: 'soundMedusa', cue: 'pearlShow', value: drop.value, speed: fast ? 1.25 : 1 });
				await tween(fast ? 90 : 160, (t) => {
					const squash = Math.sin(Math.PI * t);
					update(id, { y: drop.toY, alpha: 1, sx: 1 + 0.14 * squash, sy: 1 - 0.16 * squash });
				});
				await revealWatch(id, drop.x, drop.toY, drop.value, fast, freegame);
			}),
		);
	};

	/**
	 * Chain-end settlement of watches already on the board: the running total
	 * flies in first (free game), then each watch pulses and sends its value, the
	 * readout holds "win ×N" and only then pays.
	 */
	const collectWatches = async ({ mult, baseWin, totalWin, toTotal, fast, bigWin = false }: { mult: number; baseWin: number; totalWin: number; toTotal: boolean; fast: boolean; bigWin?: boolean }) => {
		const watches = orbs.filter((orb) => orb.cell);
		const previous = toTotal ? totalValue : 0;
		const plan = watchCollectTiming({ turbo: fast, watchCount: watches.length, carriesTotal: toTotal && previous > 0, topTier: watches.some((watch) => watchTier(watch.value) === 5), freegame: toTotal, bigWin });
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
		const opening = tween(plan.openMs, (t) => {
			if (pop) pop = { ...pop, alpha: t };
			if (amount) amount = { ...amount, alpha: t };
			for (const lift of lifts) update(lift.id, { y: lift.from + (READOUT_TOP - 44 - lift.from) * easeOut(t) });
		}).then(() => {
			for (const watch of covered) watch.y = READOUT_TOP - 44;
		});
		// reference: the free-game TOTAL pops 0.2 s in; a base-game pearl pops with the readout
		if (plan.leadMs > 0) await opening;
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
			await flyBetween(id, plateValue, readout, plan.totalFlyMs, 'totalFly');
			fx?.impact(readout, previous, 'score');
			orbs = orbs.filter((orb) => orb.id !== id);
			totalBump = 0;
			arrive(previous);
			await wait(plan.afterTotalMs);
		}
		const flights: Promise<void>[] = [];
		for (const [index, watch] of watches.entries()) {
			// one pearl every 0.7 s, start to start (reference): in the base game the next pops
			// while the last is still in the air; all fly the same time, so they land in order
			if (index > 0) await wait(plan.staggerMs);
			flights.push(
				(async () => {
					await tween(plan.pulseMs, (t) => update(watch.id, { scale: CELL_SCALE * (1 + 0.18 * Math.sin(Math.PI * t)) }));
					// a pearl lifted clear of the readout leaves from where it was lifted to
					await opening;
					const from = { x: watch.x, y: watch.y };
					// its value flies to the readout; the watch itself keeps its cell, spent
					const copy = nextId++;
					orbs = [...orbs, { id: copy, value: watch.value, ...from, scale: CELL_SCALE, alpha: 1, stone: 0, crack: 0, angle: 0, sx: 1, sy: 1, trail: [] }];
					// ATG: the value leaves with the comet and the watch goes blank
					update(watch.id, { reveal: 0 });
					await flyBetween(copy, from, readout, plan.flyMs);
					fx?.impact(readout, watch.value, 'score');
					broadcast({ type: 'soundMedusa', cue: 'pearlAdd', value: watch.value, speed: fast ? 1.25 : 1 });
					if (watch.value >= HEAVY) shakeBoard(0.6, fast ? 260 : 380);
					orbs = orbs.filter((orb) => orb.id !== copy);
					arrive(shown + watch.value);
				})(),
			);
		}
		await Promise.all(flights);
		await opening;
		// The book is authoritative for the multiplier that pays.
		if (shown !== mult) arrive(mult);
		await wait(plan.settleMs + plan.holdMs);
		formulaDone = true;
		amount = { text: baseAmount, alpha: 1 };
		// the sum turns into the paid amount (a one-shot that rings past the count)
		broadcast({ type: 'soundOnce', name: 'sfx_multiplier_update' });
		try {
			// ATG: the readout turns into the paid amount in one beat
			await countUp(baseWin, totalWin, fast ? 120 : 220);
			void tween(fast ? 140 : 240, (t) => (scoreBump = recoil(t)));
			if (toTotal) {
				// then the TOTAL plate bursts into flame and comes back with the new total
				broadcast({ type: 'soundMedusa', cue: 'totalUp' });
				fx?.impact(plateValue, mult, 'score');
				await tween(fast ? 270 : 450, (t) => (totalBump = Math.sin(Math.PI * t)));
				totalValue = mult;
				plateLevel = totalPlateLevel(mult);
			}
		} finally {
			broadcast({ type: 'soundStop', name: 'sfx_multiplier_update' });
		}
		scoreBump = 0;
		totalBump = 0;
		broadcast({ type: 'medusaPose', pose: 'idle' });
		// reference §4.3/§4.4: a big win opens as the sum turns into the paid amount
		await wait(fast ? 120 : bigWin ? 0 : 500);
		await tween(plan.collapseMs, (t) => {
			if (pop) pop = { ...pop, alpha: 1 - t };
			if (amount) amount = { ...amount, alpha: 1 - t };
			// a watch lifted clear of the readout settles back into its own cell
			for (const lift of lifts) update(lift.id, { y: READOUT_TOP - 44 + (lift.from - (READOUT_TOP - 44)) * easeOut(t) });
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
		hypnoWatchReveal: ({ pace, count, top = 0 }) => {
			const fast = pace === 'turbo' || pace === 'turboFreegame';
			const previousRaw = new Set(context.stateGame.board.flatMap((reel) => reel.reelState.symbols.map((symbol) => symbol.rawSymbol)));
			const freegame = pace === 'freegame' || pace === 'turboFreegame';
			const animation = pace === 'freegame' ? 'fg_gaze' : pace === 'turboFreegame' ? 'fg_gaze_turbo' : fast ? 'gaze_turbo' : 'gaze';
			// reference (FirstBoardOdinShowDelay): the caster acts 0.25 s after the old board starts
			// to leave. A base spin's board has already left when its book arrives, so there he acts
			// at once; each pearl falls in with its value on it and is struck 0.15 s after it lands
			const cast = () => {
				broadcast({ type: 'medusaAction', animation });
				broadcast({ type: 'soundMedusa', cue: 'gaze', value: top, speed: fast ? 1.5 : 1 });
			};
			if (fast || context.stateGame.board.every((reel) => reel.reelState.motion === 'hanging')) cast();
			else void wait(250).then(cast);
			nextRevealAt = 0;
			mass = count >= MASS; massHit = false;
			revealStagger = mass ? Math.max(35, 1000 / count) : REVEAL_STAGGER_MS;
			const reveals: Promise<void>[] = [];
			// Follow the actual reel carriers, including turbo/stop and landing bounce.
			// The reserved raw symbol draws no totem from the moment it is installed.
			watchesLanded = new Promise<void>((resolve) => {
				const ids = new Map<string, number>();
				const impacts = new Set<string>();
				const started = performance.now();
				const follow = () => {
					if (!alive) { resolve(); return; }
					let landed = 0;
					context.stateGame.board.forEach((reel, reelIndex) => {
						reel.reelState.symbols.forEach((symbol, slot) => {
							const value = symbol.rawSymbol.watchValue;
							if (value === undefined || previousRaw.has(symbol.rawSymbol)) return;
							const key = `${reelIndex}:${slot}`;
							let id = ids.get(key);
							if (id === undefined) {
								id = nextId++; ids.set(key, id);
								orbs = [...orbs, { id, value, x: getSymbolX(reelIndex), y: symbol.symbolY.current, scale: CELL_SCALE, alpha: 0, stone: 0, crack: 0, angle: 0, sx: 1, sy: 1, trail: [], cell: true, reveal: 1 }];
							}
							const y = symbol.symbolY.current;
							update(id, { y, alpha: Math.max(0, Math.min(1, (y + 20) / 60)) });
							// reference FX1: the strike is timed off the pearl's own cell (it lands into
							// its bounce here), not off the whole column coming to rest
							if (reel.reelState.motion === 'stopped' || y >= getSymbolY(slot - 1) - SYMBOL_SIZE * 0.2) {
								landed++;
								if (!impacts.has(key)) {
									impacts.add(key);
									broadcast({ type: 'soundMedusa', cue: 'pearlShow', value, speed: fast ? 1.25 : 1 });
									reveals.push(revealWatch(id, getSymbolX(reelIndex), y, value, fast, freegame, STRIKE_DELAY_MS));
								}
							}
						});
					});
					if (landed >= count || performance.now() - started > 12000) void Promise.all(reveals).then(() => resolve());
					else requestAnimationFrame(follow);
				};
				requestAnimationFrame(follow);
			});
		},
		hypnoWatchDrop: (event) => {
			watchesLanded = dropWatches(event);
		},
		// The watches leave with the board on the next spin (actor preSpin, or the
		// reveal inside a feature): each follows its reserved carrier as it falls out,
		// same frame and curve, and goes once that reel has emptied. The reveal
		// installs new cell owners before the incoming board is drawn.
		hypnoWatchClear: () => {
			const leaving = orbs.filter((orb) => orb.cell).map((orb) => ({
				id: orb.id,
				reel: Math.round(orb.x / SYMBOL_SIZE - REEL_PADDING),
				slot: Math.round(orb.y / SYMBOL_SIZE + 0.5),
			}));
			if (!leaving.length) return;
			const follow = () => {
				if (!alive) return;
				const gone = new Set<number>();
				for (const watch of leaving) {
					const reel = context.stateGame.board[watch.reel]?.reelState;
					const symbol = reel?.symbols[watch.slot];
					if (!reel || !symbol || reel.motion === 'hanging' || reel.motion === 'fallingIn') gone.add(watch.id);
					else update(watch.id, { y: symbol.symbolY.current });
				}
				if (gone.size) orbs = orbs.filter((orb) => !gone.has(orb.id));
				if (leaving.some((watch) => orbs.some((orb) => orb.id === watch.id))) requestAnimationFrame(follow);
			};
			requestAnimationFrame(follow);
		},
		hypnoThrow: async ({ multipliers, applied, mult, baseWin, totalWin, toTotal, bigWin, pace }) => {
			if (multipliers.length === 0) return;
			const fast = pace === 'turbo' || pace === 'turboFreegame';
			await watchesLanded;
			if (applied && orbs.some((orb) => orb.cell)) {
				await collectWatches({ mult, baseWin, totalWin, toTotal, fast, bigWin });
				return;
			}
			if (applied) {
				throw new Error('Multiplier slots must enter with the symbol drop before settlement');
			}
			// These occupied their own slots during reveal. A losing spin only cracks
			// the existing multipliers; it never throws onto a completed board.
			broadcast({ type: 'medusaAction', animation: 'gaze_dud', turbo: fast });
			broadcast({ type: 'soundMedusa', cue: 'annoyed' });
			await wait(fast ? 160 : 320);
			// a handful cracks as a quick ripple with a few voices, not 25 at once
			const dead = orbs.filter((orb) => orb.cell);
			const ripple = dead.length >= MASS ? Math.min(40, 600 / dead.length) * (fast ? 0.6 : 1) : 0;
			await Promise.all(dead.map(async (orb, i) => {
				await wait(i * ripple);
				if (dead.length < MASS || i % Math.ceil(dead.length / 4) === 0) broadcast({ type: 'soundMedusa', cue: 'orbCrack', speed: fast ? 1.5 : 1 });
				await crackInPlace(orb.id, fast ? 200 : 360);
			}));
			mass = false;

		},
	});

	const drawHeavy = (g: PixiGraphics) => {
		g.clear();
		for (const b of beams) {
			if (b.beam > 0) {
				const top = -460, foot = top + (b.y - top) * Math.min(1, b.beam * 1.6);
				g.rect(b.x - 14, top, 28, foot - top).fill({ color: b.color, alpha: 0.45 * b.beam });
				g.rect(b.x - 4, top, 8, foot - top).fill({ color: 0xffffff, alpha: 0.95 * b.beam });
			}
			if (b.flash > 0) {
				g.circle(b.x, b.y, SYMBOL_SIZE * (0.45 + 0.35 * b.flash)).fill({ color: b.color, alpha: 0.55 * b.flash });
				g.circle(b.x, b.y, SYMBOL_SIZE * (0.3 + 0.2 * b.flash)).fill({ color: 0xffffff, alpha: 0.9 * b.flash });
			}
			if (b.smoke > 0 && b.smoke < 1) {
				const dark = shade(b.color, 0.45);
				for (let i = 0; i < 6; i++) {
					const a = (i / 6) * Math.PI * 2 + 0.4;
					const r = SYMBOL_SIZE * (0.12 + 0.3 * b.smoke);
					g.circle(b.x + Math.cos(a) * r, b.y + Math.sin(a) * r * 0.7 - 12 * b.smoke, SYMBOL_SIZE * (0.2 + 0.1 * b.smoke)).fill({ color: dark, alpha: 0.6 * (1 - b.smoke) });
				}
			}
		}
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
			{#if plateLevel >= 3}
				<!-- level 3 raises a water flame behind the plate, level 4 a brighter, faster one -->
				<Sprite key="fxGlow" anchor={0.5} x={WELL_X} width={PLATE_WIDTH*(plateLevel>3?1.3:1.1)*(1+0.08*plateBreath)} height={PLATE_HEIGHT*(plateLevel>3?1.9:1.6)*(1+0.08*plateBreath)} tint={plateLevel>3?0x9ff5ff:0x5fe0d0} alpha={(plateLevel>3?0.75:0.5)*(0.7+0.3*plateBreath)}/>
			{/if}
			<Sprite key={plateArt.key} x={plateArt.x} y={plateArt.y} width={plateArt.width} height={plateArt.height} />
			<!-- the window holds the plate's tier pearl, set like a jewel: body inside the rim, crown above it -->
			<Sprite key={`watchT${Math.min(5, plateLevel + 1)}`} x={plateArt.window.x} y={plateArt.window.y} anchor={{x:0.5,y:300/512}}
				width={512 * plateArt.window.r * 0.86 / 150} height={512 * plateArt.window.r * 0.86 / 150} />
			<InkText x={WELL_X} y={-WELL_H*0.27} text="TOTAL" fontSize={13} maxWidth={plateArt.wellWidth*0.8} maxHeight={11} stroke={plateArt.light?0:2} fill={plateArt.light?0x1d4a44:0xfff2d6} fontFamily={TITLE_FONT}/>
			<Container x={WELL_X} y={WELL_H*0.14} scale={1-0.05*plateBreath}>
				<InkText x={0} y={0} text={`×${totalValue}`} fontSize={40} maxWidth={plateArt.wellWidth*0.86} maxHeight={27}/>
			</Container>
		</Container>
	{/if}

	<Container x={center.x} y={center.y} pivot={center} scale={1 + 0.1 * scoreBump}>
		<Graphics x={center.x} y={center.y} draw={drawReadoutBack} />
		{#if pop}
			<Text anchor={0.5} x={center.x} y={center.y-88} alpha={pop.alpha} text={pop.text?'MULTIPLIER':'BASE WIN'} style={{fontFamily:TITLE_FONT,fontWeight:GAME_FONT_WEIGHT,fontSize:23,fill:0xffedc1,stroke:{color:0x3d1918,width:3}}}/>
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
				<Text anchor={0.5} x={center.x} y={center.y+25} alpha={pop.alpha} text={`${baseAmount} ${pop.text}${formulaDone ? ' =' : ''}`} style={{fontFamily:GAME_FONT,fontWeight:GAME_FONT_WEIGHT,fontSize:baseAmount.length>10?22:27,fill:0xf0ead2,stroke:{color:0x3d1918,width:3}}}/>
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
			{#if orb.stone === 0 && (orb.reveal ?? 1) > 0}
				<Sprite
					key="fxGlow"
					anchor={0.5}
					width={WATCH_SIZE * (orb.value >= HEAVY ? 2.2 : 1.95) * (1 + 0.07 * haloBreath)}
					height={WATCH_SIZE * (orb.value >= HEAVY ? 2.2 : 1.95) * (1 + 0.07 * haloBreath)}
					tint={watchTier(orb.value) === 5 ? 0xffd36a : orbColor(orb.value)}
					alpha={(orb.value >= HEAVY ? 0.95 : 0.85) * (0.8 + 0.2 * haloBreath) * (orb.reveal ?? 1)}
				/>
			{/if}
			<Sprite
				key={(orb.reveal ?? 1) < 0.5 ? BLANK_WATCH : orbKeyFor(orb.value)}
				anchor={{x:0.5,y:300/512}}
				width={WATCH_SIZE}
				height={WATCH_SIZE}
				tint={orb.stone > 0 ? DUD_TINT : 0xffffff}
				filters={orb.stone>0?[stoneMaterial]:[]}
			/>
			{#if orb.stone === 0 && (orb.reveal ?? 1) > 0}
				<!-- Odin's eye rim flares on the same 1.43 s loop as the halo -->
				<Graphics draw={(g) => { g.clear(); g.circle(0, 0, DIAL_R * 1.32).stroke({ color: shade(orbColor(orb.value), 1.2), width: 5, alpha: (0.45 + 0.4 * haloBreath) * (orb.reveal ?? 1) }); }} />
			{/if}
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
				y={NUMBER_Y * orb.scale}
				scale={orb.scale}
				alpha={(orb.stone > 0 ? 1 - orb.stone * 0.6 : 1) * (orb.reveal ?? 1)}
				text={label(orb.value)}
				style={{
					fontFamily: GAME_FONT,
					fontWeight: GAME_FONT_WEIGHT,
					fontSize: numberSize(orb.value),
					fill: NUMBER_FACE,
					// one edge for every tier (Odin), so the number never changes face
					stroke: { color: orb.stone > 0 ? 0x4a2205 : NUMBER_EDGE, width: 6 },
					dropShadow: { color: 0x2a0604, alpha: 0.9, angle: Math.PI / 2, distance: 3, blur: 1 },
				}}
			/>
		</Container>
	{/each}
	<Graphics draw={drawHeavy} />
</BoardContainer>
