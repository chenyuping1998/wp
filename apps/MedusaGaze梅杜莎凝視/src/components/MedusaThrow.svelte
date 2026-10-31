<script lang="ts" module>
	import type { WinPace } from './ScatterWins.svelte';

	export type EmitterEventMedusaThrow =
		| {
				type: 'medusaThrow';
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
		| { type: 'medusaTotalShow' }
		| { type: 'medusaTotalHide' };
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
		STONE_COLOR,
		orbKeyFor,
		totalPlateLevel,
	} from '../game/constants';
	import { throwTiming, medusaAnimations } from '../game/animationTimeline';
	import MultiplierFx from './MultiplierFx.svelte';
	import type { MultiplierFxController } from '../game/multiplierFxScene';
	import { flightPose,orbChargePose,orbLaunchPoint,impactPose,gazePose,recoil,type OrbVisual } from '../game/multiplierPerformance';
	import { drawMultiplierReadout } from '../game/multiplierReadout';
	import { multiplierCollisionPose,drawMultiplierCollision } from '../game/multiplierCollision';
	import { medusaAnchors } from '../game/medusaAnchors.svelte';
	import BoardContainer from './BoardContainer.svelte';
	import { medusaEyes } from './Medusa.svelte';
	import {orbPower} from '../game/orbPower';

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
	const stoneMaterial=new ColorMatrixFilter();stoneMaterial.saturate(-1);
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

	type Orb = OrbVisual;
	let fx=$state.raw<MultiplierFxController>();
	let reducedMotion=$state(false);
	onMount(()=>{const media=matchMedia('(prefers-reduced-motion: reduce)');const change=()=>reducedMotion=media.matches;change();media.addEventListener('change',change);return()=>media.removeEventListener('change',change);});

	let orbs = $state<Orb[]>([]);
	let gaze = $state(0);
	let gazeProgress=$state(-1);
	let baseAmount=$state('');
	let pop = $state<{ text: string; scale: number; alpha: number } | null>(null);
	let amount = $state<{ text: string; alpha: number } | null>(null);

	let totalShown = $state(false);
	let totalValue = $state(0);
	let totalBump = $state(0);
	let totalEnter = $state(0);
	let plateLevel = $state(0);
	let scoreBump = $state(0);
	let plateBeam = $state(0);
	let beamTarget = $state({ x: 0, y: 0 });
	let transferProgress=$state(-1),collisionProgress=$state(-1);
	let transferValue=$state(0);
	let transferFrom=$state({x:0,y:0});

	const portrait = $derived(context.stateLayoutDerived.layoutType() === 'portrait');

	// orbs leave from Medusa's eyes (Medusa.svelte owns where she stands)
	const origin = $derived(medusaAnchors.ready?medusaAnchors.center:medusaEyes(portrait, BOARD_SIZES.width, BOARD_SIZES.height));
	const eyePoints=$derived(medusaAnchors.ready?[medusaAnchors.left,medusaAnchors.right]:[{x:origin.x-7,y:origin.y},{x:origin.x+7,y:origin.y}]);
	const center = { x: BOARD_SIZES.width / 2, y: BOARD_SIZES.height / 2 };
	const multiplierDock={x:center.x-142,y:center.y};
	const transferring=$derived(transferProgress>=0);
	const collisionPose=$derived(multiplierCollisionPose(transferFrom,center,Math.max(0,transferProgress)));

	const PLATE_WIDTH = 200;
	const PLATE_HEIGHT = PLATE_WIDTH * (320 / 512);
	// Landscape: left of the board, below the free-spin counter. Portrait: above
	// the board's left corner, clear of the counter centred above it.
	const plate = $derived(
		portrait
			? { x: PLATE_WIDTH * 0.45, y: -PLATE_HEIGHT * 0.72 }
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
		order = 0,
		layers = 1,
		volleyPower = value,
	) => {
		const id = nextId++;
		// Energy gathers in front of the face; it never hides the eye performance.
		const from=orbLaunchPoint(origin,to,order);
		orbs = [...orbs, { id, value, ...from, scale: .12, alpha: 0, stone: 0, crack: 0,angle:0,sx:1,sy:1,trail:[],charging:true }];
		const end = stopShort
			? { x: to.x + (origin.x - to.x) * 0.14, y: to.y + (origin.y - to.y) * 0.14 }
			: to;
		if(order===0)broadcast({type:'soundMedusa',cue:'orbCharge',value:volleyPower,speed:1});
		await tween(chargeMs,t=>update(id,orbChargePose(from,end,t)));
		const releasePoint=orbChargePose(from,end,1);
		if(order===0)broadcast({type:'soundMedusa',cue:'orbRelease',value:volleyPower,speed:1});
		broadcast({ type:'soundMedusa',cue:'orbFly',value,layers,speed:1,panFrom:Math.max(-.85,Math.min(.85,(from.x-BOARD_SIZES.width/2)/BOARD_SIZES.width*1.6)),panTo:Math.max(-.85,Math.min(.85,(end.x-BOARD_SIZES.width/2)/BOARD_SIZES.width*1.6)) });
		await tween(ms, (t) => {
			update(id,{...flightPose(releasePoint,end,reducedMotion?1:t),alpha:1,charging:false});
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
		await tween(ms, (t) => update(id, {...impactPose(t,orb?.angle??0),trail:[]}));
		orbs = orbs.filter((orb) => orb.id !== id);
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
		medusaThrow: async ({ multipliers, applied, mult, baseWin, totalWin, toTotal }) => {
			if (multipliers.length === 0) return;
			const plan = throwTiming({
				freegame: toTotal,
				turbo: false,
				applied,
				orbCount: multipliers.length,
				mult,
			});
			const action = medusaAnimations[plan.animation];
			const target = toTotal ? plateValue : multiplierDock;
			baseAmount=bookEventAmountToCurrencyString(baseWin);
			gazeProgress=-1;
			transferProgress=collisionProgress=-1;
			beamTarget = target;
			broadcast({ type: 'medusaAction', animation: plan.animation, releaseMs: plan.releaseMs });
			await flushRender();
			broadcast({ type: 'soundMedusa', cue: 'gaze',speed:1 });
			if (!toTotal && applied) {
				pop = { text: '', scale: 1, alpha: 1 };
				amount = { text: bookEventAmountToCurrencyString(baseWin), alpha: applied ? 1 : 0 };
			}

			// Gesture, beam and orbs run on one clock. Several orbs share one gaze.
			const beamAt=action.beamAtMs;
			const beam = (async () => {
				if (!toTotal) {
					await wait(Math.min(plan.releaseMs, 200));
					await wait(Math.max(0, beamAt - (200)));
				} else await wait(beamAt);
				broadcast({ type: 'soundMedusa', cue: 'gazeBeam',speed:1 });
				await tween(
					Math.max(100, Math.min(action.beamEndMs, plan.lastArrivalMs) - beamAt),
					(t) => {gazeProgress=t;gaze=gazePose(t).intensity;},
				);
				gaze = 0;
				gazeProgress=-1;
			})();
			const chargeMs=plan.chargeMs;
			await wait(Math.max(0,plan.releaseMs-chargeMs));
			let dudReacted = false;
			await Promise.all(
				multipliers.map(async (value, index) => {
					await wait(index * plan.staggerMs);
					// A base dud reaches board centre; a feature dud stops before the plate.
					const id = await fly(value, target, plan.flightMs, !applied && toTotal,chargeMs,index,multipliers.length,Math.max(...multipliers));
					if (applied) {
						broadcast({ type: 'soundMedusa', cue: 'orbHit', value,speed:1 });
						if (toTotal) totalBump = 1;
						else scoreBump = 1;
						await land(id, plan.landMs,toTotal);
					} else {
						broadcast({ type: 'soundMedusa', cue: 'orbCrack',speed:1 });
						if (!dudReacted) {
							dudReacted = true;
							broadcast({
								type: 'medusaAction',
								animation: 'gaze_dud',
								turbo: false,
								holdMs: plan.endMs - plan.firstArrivalMs,
							});
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
				// Commit the authoritative total before moving its numeral to score.
				totalValue = mult;
				plateLevel = totalPlateLevel(mult);
			}
			transferFrom=toTotal?{x:plateValue.x,y:plateValue.y+7}:multiplierDock;
			transferValue=mult;
			pop={text:'',scale:1,alpha:1};
			amount={text:bookEventAmountToCurrencyString(baseWin),alpha:1};
			broadcast({type:'soundMedusa',cue:'plateBeam'});
			await tween(plan.transferMs,t=>transferProgress=reducedMotion?1:t);
			broadcast({type:'soundMedusa',cue:'scoreCollide',value:mult});
			fx?.impact(center,mult,'orb');
			await tween(plan.collisionHoldMs,t=>{collisionProgress=t;scoreBump=reducedMotion?0:Math.sin(Math.PI*t)*.65;});
			transferProgress=collisionProgress=-1;
			pop = { text: `×${mult}`, scale: 1, alpha: 1 };
			amount = { text: bookEventAmountToCurrencyString(baseWin), alpha: 1 };
			broadcast({ type: 'soundLoop', name: 'sfx_multiplier_update' });
			try {
				await Promise.all([
					tween(200, (t) => {
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
			await Promise.all([beam]);
			// The Spine clip already queues idle; keep its breathing phase continuous.
			await wait(plan.resultHoldMs);
			await tween(200, (t) => {
				if (pop) pop = { ...pop, alpha: 1 - t };
				if (amount) amount = { ...amount, alpha: 1 - t };
			});
			pop = null;
			amount = null;
		},
	});

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
				alpha={transferring?0:1}
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

	{#each orbs as orb (orb.id)}
		<Container x={orb.x} y={orb.y} alpha={orb.alpha}>
		<Container rotation={orb.angle} scale={{x:orb.scale*orb.sx*orbPower(orb.value).bodyScale,y:orb.scale*orb.sy*orbPower(orb.value).bodyScale}}>
			<Sprite
				key={orbKeyFor(orb.value)}
				anchor={0.5}
				width={92}
				height={92}
				tint={orb.stone > 0 ? STONE_COLOR : 0xffffff}
				filters={orb.stone>0?[stoneMaterial]:[]}
			/>
			{#if orb.crack > 0}
				<Sprite
					key={orb.crack < 1 / 3 ? 'fxCrack1' : orb.crack < 2 / 3 ? 'fxCrack2' : 'fxCrack3'}
					anchor={0.5}
					width={92}
					height={92}
				/>
			{/if}
		</Container>
		</Container>
	{/each}
	{#each orbs as orb (orb.id)}
		<Container x={orb.x} y={orb.y} alpha={orb.alpha}>
			<Text
				anchor={0.5}
				scale={orb.scale*orbPower(orb.value).bodyScale}
				text={`×${orb.value}`}
				style={{
					fontFamily: GAME_FONT,
					fontWeight: GAME_FONT_WEIGHT,
					fontSize: orb.value >= 100 ? 26 : 32,
					fill: 0xffffff,
					stroke: { color: 0x2a1f24, width: 5 },
				}}
			/>
		</Container>
	{/each}

	<Container x={center.x} y={center.y} pivot={center} scale={1 + 0.1 * scoreBump}>
		<Graphics x={center.x} y={center.y} draw={drawReadoutBack} />
		{#if pop}
			<Text anchor={0.5} x={center.x} y={center.y-88} alpha={pop.alpha} text={transferring?'MULTIPLY':pop.text?'MULTIPLIER':'BASE WIN'} style={{fontFamily:GAME_FONT,fontWeight:GAME_FONT_WEIGHT,fontSize:23,fill:0xc3d5b6,stroke:{color:0x10272d,width:3}}}/>
			<Text
				anchor={0.5}
				x={center.x}
				y={center.y - 37}
				scale={pop.scale}
				alpha={pop.alpha}
				text={pop.text}
				visible={!transferring}
				style={{
					fontFamily: GAME_FONT,
					fontWeight: GAME_FONT_WEIGHT,
					fontSize: pop.text.length>5?66:80,
					fill: 0xb8ff5a,
					stroke: { color: 0x2a1f24, width: 8 },
				}}
			/>
			{#if pop.text && !transferring}
				<Text anchor={0.5} x={center.x} y={center.y+25} alpha={pop.alpha} text={`${baseAmount} ${pop.text} =`} style={{fontFamily:GAME_FONT,fontWeight:GAME_FONT_WEIGHT,fontSize:baseAmount.length>10?22:27,fill:0xf0ead2,stroke:{color:0x10272d,width:3}}}/>
			{/if}
		{/if}
		{#if amount}
			<Text
				anchor={0.5}
				x={transferring?collisionPose.score.x:center.x}
				y={transferring?collisionPose.score.y:center.y + (pop?.text?77:5)}
				scale={transferring?collisionPose.score.scale*(1-Math.max(0,collisionProgress)*.3):1}
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
	{#if transferring}
		<Text anchor={.5} x={collisionPose.mult.x} y={collisionPose.mult.y} scale={collisionPose.mult.scale} alpha={1-Math.max(0,collisionProgress)} text={`×${transferValue}`} style={{fontFamily:`${GAME_FONT},Microsoft JhengHei,sans-serif`,fontWeight:GAME_FONT_WEIGHT,fontSize:transferValue>=1000?38:48,fill:0xb8ff5a,stroke:{color:0x10272d,width:6}}}/>
	{/if}
	<Graphics draw={(g)=>drawMultiplierCollision(g,center,reducedMotion?-1:collisionProgress)} />
</BoardContainer>
