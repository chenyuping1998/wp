<script lang="ts" module>
	export type EmitterEventFgArcWheel =
		| { type: 'fgWheelSpin'; previous: number; value: number }
		| { type: 'fgWheelImpact'; value: number }
		| { type: 'fgWheelSet'; value: number };
</script>

<script lang="ts">
	// THE FREE-SPIN MULTIPLIER WHEEL — a half arch on the board's bottom edge.
	//
	// Reference: the 2026-11-06 recording. In the free game the arch sits at the
	// bottom of the board with the held multiplier on its centre plate. A spin
	// that connects a line raises it, the board dims, the player presses the one
	// button on top (the reference offered three faces to pick from; this game
	// has one), a strip of values runs along the arch and stops under the fixed
	// pointer, the stopped value lifts and flies into the centre plate, which
	// flashes and shows it, and the arch sinks back. Only then are the lines
	// drawn, already multiplied.
	//
	// Presentation only: the book's multiplierWheel event decided the value.
	//
	// Production mummy textures: design/source/mummy_delivery.
	import { Container, Graphics, Text, Sprite } from 'pixi-svelte';
	import type { Graphics as PixiGraphics } from 'pixi.js';
	import { stateBet } from 'state-shared';
	import { OnHotkey } from 'components-shared';
	import { waitForTimeout } from 'utils-shared/wait';

	import BoardContainer from './BoardContainer.svelte';
	import { getContext } from '../game/context';
	import { stateGame } from '../game/stateGame.svelte';
	import { GAME_FONT, GAME_FONT_WEIGHT } from '../game/fonts';
	import { BOARD_SIZES } from '../game/constants';
	import { FG_WHEEL_MS, SCARAB_MODES, buildFgStrip, multLabel, wheelState } from '../game/wheels.svelte';
	import type { WheelCue } from './Sound.svelte';
	import {onDestroy} from 'svelte';
	import {scarabSpinProgress,multiplierImpactProfile} from '../game/scarabPresentation';
	import {SCARAB_LAYOUT,scarabSector} from '../game/scarabLayout';
	import {scarabMultiplierColor} from '../game/scarabTypography';

	const context = getContext();

	const W = BOARD_SIZES.width;
	const H = BOARD_SIZES.height;
	const CX = W / 2;
	const CY = H + W * 0.015;
	const R_OUT = W * 0.4;
	const R_PLATE = W * 0.2;
	const VISIBLE = 7;
	const STEP = Math.PI / VISIBLE;
	const IDLE_SCALE = 0.5;

	// presentation state, all 0..1 unless noted
	let open = $state(0); // arch raised
	let stripAlpha = $state(0);
	let buttonAlpha = $state(0);
	let buttonBurst = $state(0);
	let pointerAlpha = $state(0);
	let settled = $state(0); // non-result segments dim
	let fly = $state(-1); // -1 off, 0..1 result tile travelling to the plate
	let flash = $state(0);
	let offset = $state(0); // strip position, in segments
	let strip = $state<number[]>([]);
	let resultIndex = $state(0);
	let shown = $state(1); // value on the centre plate
	let pulse = $state(0);
	let waitingPress: (() => void) | null = null;
	let pressTimer:ReturnType<typeof setTimeout>|undefined;
	let impactPop=$state(.1);

	// In free spins always; in the base game only while a Scarab activation is on
	// (SCARAB5 / SCARAB10 turn the wheel on a paying base spin).
	const scarabActive = $derived(SCARAB_MODES.includes(stateBet.activeBetModeKey.toUpperCase()));
	const visible = $derived(
		(context.stateGame.gameType === 'freegame' && stateBet.activeBetModeKey !== 'HOLDANDSPIN') ||
			(context.stateGame.gameType === 'basegame' && scarabActive),
	);
	const scale = $derived(IDLE_SCALE + (1 - IDLE_SCALE) * open);

	const animate = (ms: number, step: (t: number) => void) =>
  new Promise<void>((resolve) => {
   let done=false, raf=0;const start=performance.now();
   const finish=()=>{if(done)return;done=true;cancelAnimationFrame(raf);clearTimeout(timer);step(1);resolve();};
   const timer=setTimeout(finish,Math.max(0,ms)+80);
   const tick=(now:number)=>{if(done)return;const t=ms<=0?1:Math.min(1,(now-start)/ms);if(t>=1){finish();return;}step(t);raf=requestAnimationFrame(tick);};
   raf=requestAnimationFrame(tick);
  });
	const easeOut = (t: number) => 1 - (1 - t) ** 3;
	const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

	// The strip's angle for a given index: the pointer is straight up (π/2).
	const angleOf = (i: number) => Math.PI / 2 - (i - offset - (VISIBLE - 1) / 2) * STEP;

	const isAuto = () => stateBet.isTurbo || stateBet.autoSpinsCounter > 0;

	const cue = (c: WheelCue, level?: number) =>
		context.eventEmitter.broadcast({ type: 'soundWheel', cue: c, level });
	// one tick every time a segment boundary passes the pointer
	let lastSeg = 0;
	const tickPast = (o: number) => {
		const seg = Math.floor(o + 0.5);
		if (seg !== lastSeg) {
			lastSeg = seg;
			cue('scarabTick');
		}
	};

	// Where in its tile the strip stops, in tile widths (0 = dead centre).
	// Usually a little off centre; about one time in five it stops near the edge
	// next to a much bigger neighbour — the near miss. Presentation only.
	const stopOffset = (value: number) => {
		const next = strip[resultIndex + 1] ?? 0;
		const prev = strip[resultIndex - 1] ?? 0;
		const tease = (v: number) => v >= Math.max(value * 2, 12);
		if (Math.random() < 0.2) {
			if (tease(next) && (!tease(prev) || next >= prev)) return 0.34;
			if (tease(prev)) return -0.34;
		}
		return (Math.random() - 0.5) * 0.5;
	};

	const press = () => {
		if (!waitingPress) return;
		const done = waitingPress;
		waitingPress = null;
		clearTimeout(pressTimer);
		done();
	};

	const waitForPress = (timeoutMs: number) =>
		new Promise<void>((resolve) => {
			clearTimeout(pressTimer);
			waitingPress = resolve;
			if (timeoutMs > 0) pressTimer=setTimeout(press, timeoutMs);
		});

	let pulseRaf = 0;
	const startPulse = () => {
		cancelAnimationFrame(pulseRaf);
		const loop = (now: number) => {
			pulse = Math.sin(now * Math.PI * 2 / 1000);
			if (buttonAlpha > 0) pulseRaf = requestAnimationFrame(loop);
		};
		pulseRaf = requestAnimationFrame(loop);
	};
	onDestroy(()=>{cancelAnimationFrame(pulseRaf);clearTimeout(pressTimer);press();});

	context.eventEmitter.subscribeOnMount({
		fgWheelSet: ({ value }) => {
			wheelState.held = value;
			shown = value;
		},
		fgWheelSpin: async ({ previous, value }) => {
			const ms = stateBet.isTurbo ? FG_WHEEL_MS.turbo : FG_WHEEL_MS.normal;
			const built = buildFgStrip(value, previous);
			strip = built.strip;
			resultIndex = built.resultIndex;
			offset = 0;
			settled = 0;
			fly = -1;
			flash = 0;
			shown = previous;

			// 1. the board dims, 2. the arch rises out of the bottom edge
			await waitForTimeout(ms.dim);
			stateGame.winLitCells = [];
			context.eventEmitter.broadcast({ type: 'mascotWheelLook' });
			cue('scarabRise');
			await animate(ms.rise, (t) => {
				open = easeOut(t);
				stripAlpha = t;
			});

			// 3. the one button: pressed, or pressed for the player on autoplay /
			//    turbo / after a few seconds, so the round never waits forever
			buttonAlpha = 1;
			buttonBurst=0;pointerAlpha=0;
			cue('scarabWait');
			startPulse();
			if (isAuto()) await waitForTimeout(550);
			else await waitForPress(ms.buttonTimeout);
			waitingPress = null;
			cue('scarabWaitStop');
			cue('scarabPress');
			await animate(ms.burst, (t) => {
				buttonBurst = t;
				buttonAlpha = 1 - t;
				pointerAlpha = t;
			});
			buttonBurst = 0;

			// 4. the strip runs and slows, overshooting a hair and settling back
			//    onto the result — a stop dead on centre reads as computed
			const target = resultIndex - (VISIBLE - 1) / 2 + stopOffset(value);
			const overshoot = 0.18 + 0.12 * Math.random();
			lastSeg = 0;
			await animate(ms.spin, (t) => {
				offset = (target + overshoot) * scarabSpinProgress(t);
				tickPast(offset);
			});
			await animate(ms.settle, (t) => {
				offset = target + overshoot * (1 - easeInOut(t));
			});
			offset = target;
			cue('scarabStop');
			await animate(200, (t) => (settled = t));

			// 5. the stopped value lifts and flies into the centre plate
			await waitForTimeout(ms.fly);
			cue('scarabFly');
			await animate(ms.fly, (t) => (fly = easeInOut(t)));
			fly = -1;
			shown = value;
			wheelState.held = value;
			const impact=multiplierImpactProfile(value);impactPop=impact.platePop;
			context.eventEmitter.broadcast({type:'fgWheelImpact',value});
			cue('scarabMult', value >= 32 ? 3 : value >= 12 ? 2 : 1);
			if (value >= 12) context.eventEmitter.broadcast({ type: 'mascotWheelCheer' });
			await animate(Math.max(ms.flash,impact.duration), (t) => (flash = Math.sin(t * Math.PI)));
			flash = 0;
			await waitForTimeout(ms.hold);

			// 6. the arch sinks back; the lines come next
			cue('scarabSink');
			await animate(ms.sink, (t) => {
				open = 1 - easeInOut(t);
				stripAlpha = 1 - t;
				pointerAlpha = 1 - t;
			});
			settled = 0;
			stateGame.winLitCells = null;
		},
	});

	const segLabels = $derived.by(() => {
		if (stripAlpha <= 0) return [];
		const out: { key: number; x: number; y: number; rot: number; text: string; alpha: number; scale: number }[] = [];
		const rMid = W * SCARAB_LAYOUT.labelRadius;
		for (let i = 0; i < strip.length; i++) {
			const a = angleOf(i);
			if (a < SCARAB_LAYOUT.minAngle || a > SCARAB_LAYOUT.maxAngle) continue;
			if (i === resultIndex && fly >= 0) continue;
			const isResult = i === resultIndex && settled > 0;
			const edge = Math.min(1, Math.max(0, Math.min(a-SCARAB_LAYOUT.minAngle,SCARAB_LAYOUT.maxAngle-a) / (STEP*.4)));
			out.push({
				key: i,
				x: CX + Math.cos(a) * rMid,
				y: CY - Math.sin(a) * rMid,
				rot: Math.PI / 2 - a,
				text: multLabel(strip[i]),
				alpha: stripAlpha * edge * (isResult ? 1 : 1 - settled * 0.55),
				scale: isResult ? 1 + (SCARAB_LAYOUT.resultScale-1) * settled : 1,
			});
		}
		return out;
	});
	const segPlates=$derived.by(()=>{
		if(stripAlpha<=0)return [];
		const out=[];
		for(let i=0;i<strip.length;i++){
			const angle=angleOf(i),points=scarabSector(angle,W,CX,CY);
			if(!points.length)continue;
			const result=i===resultIndex,lit=result?settled:0;
			const alpha=stripAlpha*(result?1:1-settled*.55);
			out.push({key:i,points,lit,alpha,x:CX+Math.cos(angle)*W*SCARAB_LAYOUT.labelRadius,y:CY-Math.sin(angle)*W*SCARAB_LAYOUT.labelRadius,rotation:Math.PI/2-angle,texture:strip[i]>=32?'mummyTileTop':strip[i]>=12?'mummyTileHot':'mummyTile'});
		}
		return out;
	});
	const tileRim=(g:PixiGraphics,points:number[],lit:number)=>{
		g.clear();
		// Preserve the original carved stone image; the light is a thin glaze.
		if(lit>0)g.poly(points).fill({color:0xf2c65c,alpha:lit*.30});
		g.poly(points).stroke({color:0x081c21,width:W*.004,alpha:.85,alignment:1});
		g.poly(points).stroke({color:lit>0?0xffe8a1:0x9eac9c,width:W*.0014,alpha:lit>0?.95:.55,alignment:1});
	};

	const flyer = $derived.by(() => {
		if (fly < 0) return null;
		const rMid = W * SCARAB_LAYOUT.labelRadius;
		const a = angleOf(resultIndex);
		const sx = CX + Math.cos(a) * rMid;
		const sy = CY - Math.sin(a) * rMid;
		const lift = Math.sin(fly * Math.PI) * W * 0.06;
		return {
			x: sx + (CX - sx) * fly,
			y: sy + (CY + W*SCARAB_LAYOUT.plateY - sy) * fly - lift,
			scale: SCARAB_LAYOUT.resultScale + fly * (SCARAB_LAYOUT.plateSize/SCARAB_LAYOUT.labelSize-SCARAB_LAYOUT.resultScale),
			anchorY:.5,
			rotation:(Math.PI/2-a)*(1-fly),
			text: multLabel(strip[resultIndex] ?? shown),
		};
	});

	const textStyle = (size: number, fill = 0xfff3c4) => ({
		fontFamily: GAME_FONT,
		fontWeight: GAME_FONT_WEIGHT,
		fontSize: size,
		fill,
		stroke: { color: 0x2a1600, width: Math.max(3, size * 0.12) },
	});
</script>

{#if visible}
	<BoardContainer>
		<Container zIndex={20} x={CX} y={CY} pivot={{ x: CX, y: CY }} {scale}>
			<Sprite key="fxGlow" x={CX} y={CY} anchor={.5} width={R_PLATE*3} height={R_PLATE*3} tint={0xf2e8d0} blendMode="add" alpha={flash*.35} />
   <Sprite key="mummyArch" x={CX} y={CY} anchor={{x:.5,y:1}} width={R_OUT*2.16} height={R_OUT*1.16} alpha={open} />
   {#each segPlates as tile (tile.key)}
    <Container alpha={tile.alpha}>
     <!-- Clip the first-version stone sprite to the fitted annular plate. -->
     <Graphics isMask draw={(g)=>{g.clear();g.poly(tile.points).fill(0xffffff);}}/>
     <Graphics draw={(g)=>{g.clear();g.poly(tile.points).fill(0x183b3d);}}/>
     <Sprite key={tile.texture} x={tile.x} y={tile.y} rotation={tile.rotation} anchor={.5} width={W*.22} height={W*.15}/>
     <Graphics draw={(g)=>tileRim(g,tile.points,tile.lit)}/>
    </Container>
   {/each}
   <Sprite key="mummyPlate" x={CX} y={CY} anchor={.5} width={R_PLATE*2.12} height={R_PLATE*2.12} />
   <Sprite key="mummyPointer" x={CX} y={CY-R_OUT+W*.035} anchor={{x:.5,y:1}} width={W*.075} height={W*.105} alpha={pointerAlpha*open} />
   {#if buttonAlpha>0||buttonBurst>0}
    <Sprite key="mummyButton" x={CX} y={CY-R_OUT-W*.02} anchor={.5} width={W*.19*(1+.025*pulse+.3*buttonBurst)} height={W*.19*(1+.025*pulse+.3*buttonBurst)} alpha={buttonAlpha*(1-buttonBurst)} />
    <Sprite key="mummyWheelCat" x={CX} y={CY-R_OUT-W*.022} anchor={.5} width={W*.135} height={W*.135} alpha={buttonAlpha*(1-buttonBurst)} />
   {/if}
			{#each segLabels as s (s.key)}
				<Text
					text={s.text}
					anchor={{ x: 0.5, y: 0.5 }}
					x={s.x}
					y={s.y}
					rotation={s.rot}
					alpha={s.alpha}
					scale={s.scale}
					style={textStyle(W * SCARAB_LAYOUT.labelSize,scarabMultiplierColor(strip[s.key]))}
				/>
			{/each}
			<Text
				text={multLabel(shown)}
				anchor={{ x: 0.5, y: 0.5 }}
				x={CX}
				y={CY + W * SCARAB_LAYOUT.plateY}
				scale={1 + flash * impactPop}
				style={textStyle(W * SCARAB_LAYOUT.plateSize, scarabMultiplierColor(shown))}
			/>
			{#if flyer}
				<Text
					text={flyer.text}
					anchor={{ x: 0.5, y: flyer.anchorY }}
					x={flyer.x}
					y={flyer.y}
					scale={flyer.scale}
					rotation={flyer.rotation}
					style={textStyle(W * SCARAB_LAYOUT.labelSize, scarabMultiplierColor(strip[resultIndex]??shown))}
				/>
			{/if}
			{#if buttonAlpha > 0}
				<!-- desktop players press Space for everything else; the wheel's one
				     button answers it too instead of waiting out the 3 s timeout -->
				<OnHotkey hotkey="Space" onpress={press} />
				<Container
					eventMode="static"
					cursor="pointer"
					onpointerup={press}
					x={CX}
					y={CY - R_OUT - W * 0.02}
					alpha={buttonAlpha}
				>
					<Graphics
						draw={(g: PixiGraphics) => {
							g.clear();
							g.circle(0, 0, W * 0.09);
							g.fill({ color: 0x000000, alpha: 0.001 });
						}}
					/>
					<Text text={isAuto()?'SPIN STARTING':'CLICK TO SPIN'} x={0} y={-W*.135} alpha={.72+.28*pulse} anchor={{x:.5,y:.5}} style={textStyle(W*.03,0xffe5a5)} />
				</Container>
			{/if}
		</Container>
	</BoardContainer>
{/if}
