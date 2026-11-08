<script lang="ts" module>
	export type EmitterEventRareRoulette = {
		type: 'rouletteShow';
		path: (number | 'UP')[];
		level: number;
		multiplier: number;
		amount: number;
	};
</script>

<script lang="ts">
	// THE END-OF-ROUND LEVEL UP ROULETTE.
	//
	// Reference: 東海龍王's RouletteView (星城抄錄/東海龍王, §6 of its notes). The
	// screen darkens, a five-second countdown runs (a tap skips it), a needle
	// spins over a fixed twelve-segment wheel — accelerating in 0.25s, slowing
	// for ~3.9s, overshooting and bouncing back over 0.8s — and stops. LEVEL UP
	// swaps in the next wheel with a 1.0 → 1.25 → 1.0 pop and spins again with
	// no second countdown. A value lights its segment, dims the rest, and the
	// award counts up.
	//
	// The book carries the whole path ("UP", "UP", 150); this only plays it.
	//
	// Volt coil hardware: design/source/volt_delivery/tesla_wheel.
	import { MainContainer } from 'components-layout';
	import { Container, Graphics, Text, Sprite } from 'pixi-svelte';
	import type { Graphics as PixiGraphics } from 'pixi.js';
	import { stateBet } from 'state-shared';
	import { waitForTimeout } from 'utils-shared/wait';
	import { bookEventAmountToCurrencyString } from 'utils-shared/amount';

	import { getContext } from '../game/context';
	import { GAME_FONT, GAME_FONT_WEIGHT } from '../game/fonts';
	import { ROULETTE_MS, ROULETTE_SEGMENTS, ROULETTE_COLORS, rouletteIndex, multLabel } from '../game/wheels.svelte';
	import type { WheelCue } from './Sound.svelte';

	const context = getContext();
	const SEG = (Math.PI * 2) / 12;
	const BOUNCE_SEG = 0.297; // 東海龍王 stateParameter.BounceOffset, in segments

	let show = $state(false);
	let fade = $state(0);
	let level = $state(1);
	let needle = $state(0); // radians, clockwise from straight up
	let countdown = $state<number | null>(null);
	let litIndex = $state<number | null>(null);
	let litPulse = $state(0);
	let pop = $state(1);
	let popFlash = $state(0);
	let amountShown = $state<number | null>(null);
	let skip: (() => void) | null = null;
	// entrance: the wheel grows in from 0.6 while the scrim fades
	let enter = $state(1);
	// the countdown digit pops 1 -> 1.5 -> 1 on every change
	let countScale = $state(1);
	// the title plate lands first (0 -> 1.11 -> 1), its words a beat later
	let titleScale = $state(1);
	let titleText = $state(1);
	// LEVEL UP! plate during the swap to the next wheel
	let levelUp = $state(0);
	// sunburst behind the wheel, one turn every 40s
	let rayAngle = $state(0);
	let rayRaf = 0;
	const startRays = () => {
		cancelAnimationFrame(rayRaf);
		const t0 = performance.now();
		const loop = (now: number) => {
			rayAngle = ((now - t0) / 40000) * Math.PI * 2;
			if (show) rayRaf = requestAnimationFrame(loop);
		};
		rayRaf = requestAnimationFrame(loop);
	};
	const cue = (c: WheelCue, extra: { level?: number; n?: number } = {}) =>
		context.eventEmitter.broadcast({ type: 'soundWheel', cue: c, ...extra });
	let lastSeg = 0;
	// 1 -> 1.5 in 0.07s -> 1 (slot-motion-recipes §2.5), not awaited
	const pulse = (set: (v: number) => void, peak = 1.5) => {
		void animate(70, (t) => set(1 + (peak - 1) * t)).then(() => animate(180, (t) => set(peak - (peak - 1) * easeOut(t))));
	};

	const main = $derived(context.stateLayoutDerived.mainLayout());
	const CX = $derived(main.width / 2);
	const CY = $derived(main.height * 0.50);
	// Include the title above the coil and the amount below it in the fit.
	const R = $derived(Math.min(main.width * 0.33, main.height * 0.28));

	const animate = (ms: number, step: (t: number) => void) =>
  new Promise<void>((resolve) => {
   let done=false, raf=0;const start=performance.now();
   const finish=()=>{if(done)return;done=true;cancelAnimationFrame(raf);clearTimeout(timer);step(1);resolve();};
   const timer=setTimeout(finish,Math.max(0,ms)+80);
   const tick=(now:number)=>{if(done)return;const t=ms<=0?1:Math.min(1,(now-start)/ms);if(t>=1){finish();return;}step(t);raf=requestAnimationFrame(tick);};
   raf=requestAnimationFrame(tick);
  });
	const easeOut = (t: number) => 1 - (1 - t) ** 3;
	const easeOutBack = (t: number) => 1 + 2.70158 * (t - 1) ** 3 + 1.70158 * (t - 1) ** 2;

	const isAuto = () => stateBet.isTurbo || stateBet.autoSpinsCounter > 0;

	const sleepOrSkip = (ms: number) =>
		new Promise<boolean>((resolve) => {
			const timer = setTimeout(() => {
				skip = null;
				resolve(false);
			}, ms);
			skip = () => {
				clearTimeout(timer);
				skip = null;
				resolve(true);
			};
		});

	// 0.25s ramp to full speed, then a long cubic slow-down that overshoots the
	// stop by BOUNCE_SEG and swings back over the bounce time.
	const spinTo = async (index: number, ms: typeof ROULETTE_MS.normal, seed: number) => {
		const jitter = (((seed * 53) % 11) / 11 - 0.5) * SEG * 0.55;
		const base = needle % (Math.PI * 2);
		const stop = index * SEG + jitter;
		const turns = 4 + (seed % 2);
		const total = turns * Math.PI * 2 + ((stop - base + Math.PI * 4) % (Math.PI * 2));
		const over = BOUNCE_SEG * SEG;
		const start = needle;
		const accelShare = ms.accel / (ms.accel + ms.spin);
		cue('sunStart');
		lastSeg = Math.floor(needle / SEG + 0.5);
		await animate(ms.accel + ms.spin, (t) => {
			// slow start, then decelerate — the shape of a speed curve that ramps
			// in 0.25s and then bleeds off
			const k = t < accelShare ? 0.5 * (t / accelShare) ** 2 * accelShare : accelShare * 0.5 + easeOut((t - accelShare) / (1 - accelShare)) * (1 - accelShare * 0.5);
			needle = start + (total + over) * k;
			const seg = Math.floor(needle / SEG + 0.5);
			if (seg !== lastSeg) {
				lastSeg = seg;
				cue('sunTick');
			}
		});
		cue('sunStop');
		await animate(ms.bounce, (t) => {
			needle = start + total + over * (1 - easeOut(t));
		});
		needle = start + total;
	};

	context.eventEmitter.subscribeOnMount({
		rouletteShow: async ({ path, level: finalLevel, amount }) => {
			const ms = isAuto() ? ROULETTE_MS.turbo : ROULETTE_MS.normal;
			level = 1;
			needle = 0;
			litIndex = null;
			amountShown = null;
			pop = 1;
			levelUp = 0;
			enter = 0.6;
			titleScale = 0;
			titleText = 0;
			show = true;
			startRays();
			context.eventEmitter.broadcast({ type: 'soundMusicDuck', on: true });
			cue('sunShow');
			// plate first (0 -> 1.11 by a third of the intro, back to 1), words a beat later
			void animate(ms.intro, (t) => {
				titleScale = t < 0.5 ? 1.11 * easeOut(t / 0.5) : 1.11 - 0.11 * ((t - 0.5) / 0.5);
				titleText = Math.max(0, Math.min(1, (t - 0.5) / 0.5));
			});
			await animate(ms.intro, (t) => {
				fade = t;
				enter = 0.6 + 0.4 * easeOutBack(t);
			});
			enter = 1;
			titleScale = 1;
			titleText = 1;

			// countdown, tap to skip
			cue('sunWait');
			for (let n = ms.count; n >= 1; n--) {
				countdown = n;
				pulse((v) => (countScale = v));
				cue('sunCount', { n });
				if (await sleepOrSkip(ms.countStep)) break;
			}
			countdown = null;
			cue('sunWaitStop');
			await waitForTimeout(ms.levelWait);

			for (let step = 0; step < path.length; step++) {
				const stop = path[step];
				const index = rouletteIndex(level, stop);
				await spinTo(index, ms, step * 7 + finalLevel * 3 + (typeof stop === 'number' ? stop : 1));
				litIndex = index;
				await animate(ms.winPulse, (t) => (litPulse = 0.5 + 0.5 * Math.sin(t * Math.PI * 4)));
				if (stop === 'UP' && step < path.length - 1) {
					await waitForTimeout(ms.levelWait);
					cue('sunLevelUp', { level: level + 1 });
					litIndex = null;
					void animate(ms.levelPop * 0.3, (t) => (levelUp = easeOutBack(t)));
					const share = 0.42 / 1.17;
					let swapped = false;
					await animate(ms.levelPop, (t) => {
						if (t >= 0.11 && !swapped) {
							swapped = true;
							level += 1;
						}
						const p = Math.min(1, t / share);
						pop = p < 0.3 ? 1 + 0.25 * (p / 0.3) : 1.25 - 0.25 * ((p - 0.3) / 0.7);
						popFlash = Math.max(0, 1 - t * 1.6);
					});
					pop = 1;
					popFlash = 0;
					await waitForTimeout(ms.levelHold);
					await animate(200, (t) => (levelUp = 1 - t));
					levelUp = 0;
				}
			}

			// award
			cue('sunWin', { level });
			cue('sunScore');
			await animate(ms.score, (t) => (amountShown = Math.round(amount * easeOut(t))));
			cue('sunScoreStop');
			amountShown = amount;
			const pulseEnd = performance.now() + ms.hold;
			await animate(ms.hold, () => (litPulse = 0.5 + 0.5 * Math.sin((pulseEnd - performance.now()) / 80)));
			context.eventEmitter.broadcast({ type: 'soundMusicDuck', on: false });
			await animate(ms.out, (t) => (fade = 1 - t));
			show = false;
			cancelAnimationFrame(rayRaf);
		},
	});

	const draw = (g: PixiGraphics) => {
  g.clear();g.rect(-main.width,-main.height,main.width*3,main.height*3).fill({color:0x020d13,alpha:.78*fade});
 };
 const discKey=$derived((`mummySunDisc${level}`) as 'mummySunDisc1'|'mummySunDisc2'|'mummySunDisc3'|'mummySunDisc4');

	const labels = $derived.by(() => {
		const segs = ROULETTE_SEGMENTS[level];
		const r = R * pop * enter;
		return segs.map((v, i) => {
			const a = -Math.PI / 2 + i * SEG;
			return {
				key: `${level}-${i}`,
				x: CX + Math.cos(a) * r * 0.74,
				y: CY + Math.sin(a) * r * 0.74,
				rot: a + Math.PI / 2,
				text: v === 'UP' ? 'LEVEL\nUP' : multLabel(v),
				alpha: fade * (litIndex !== null && litIndex !== i ? 0.45 : 1),
			};
		});
	});

	const style = (size: number, fill: number) => ({
		fontFamily: GAME_FONT,
		fontWeight: GAME_FONT_WEIGHT,
		fontSize: size,
		fill,
		align: 'center' as const,
		stroke: { color: 0x1a0d00, width: Math.max(3, size * 0.12) },
	});
</script>

{#if show}
	<MainContainer>
		<Container
			eventMode="static"
			cursor={countdown !== null ? 'pointer' : 'default'}
			onpointerup={() => skip?.()}
		>
			<Graphics {draw} />
   <Container x={CX} y={CY} scale={pop*enter} alpha={fade}>
    <Sprite key="mummyRays" anchor={.5} width={R*4.8} height={R*2.7} rotation={rayAngle} alpha={.35} blendMode="add" />
    <Sprite key="fxGlow" anchor={.5} width={R*3.5} height={R*3.5} tint={ROULETTE_COLORS[level].rim} alpha={.25+popFlash*.4} blendMode="add" />
    <Sprite key={discKey} anchor={.5} width={R*2} height={R*2} alpha={litIndex===null?1:.5} />
    {#if litIndex!==null}
     <Container>
      <Graphics isMask draw={(g:PixiGraphics)=>{g.clear();const a=-Math.PI/2+litIndex!*SEG;g.moveTo(0,0).arc(0,0,R,a-SEG/2,a+SEG/2).closePath().fill(0xffffff);}} />
      <Sprite key={discKey} anchor={.5} width={R*2} height={R*2} />
     </Container>
    {/if}
    <Sprite key="mummySunRing" anchor={.5} width={R*2.35} height={R*2.35} />
    {#if litIndex!==null}
     <Graphics draw={(g:PixiGraphics)=>{g.clear();const a=-Math.PI/2+litIndex!*SEG;g.moveTo(0,0).arc(0,0,R*.98,a-SEG*.47,a+SEG*.47).closePath().fill({color:0xffffff,alpha:.12+.09*Math.sin(rayAngle*20)**2});}} blendMode="add" />
    {/if}
    <Sprite key="mummySunNeedle" anchor={{x:.5,y:620/760}} x={0} y={0} width={R*.33} height={R*.91} rotation={needle} />
    <Sprite key="mummySunHub" anchor={.5} width={R*.33} height={R*.33} />
   </Container>
			{#each labels as s (s.key)}
				<Text
					text={s.text}
					anchor={{ x: 0.5, y: 0.5 }}
					x={s.x}
					y={s.y}
					rotation={s.rot}
					alpha={s.alpha}
					style={style(R * 0.12, ROULETTE_COLORS[level].text)}
				/>
			{/each}
   <Container x={CX} y={CY-R*1.34} scale={titleScale} alpha={fade}>
    <Sprite key="mummySunTitle" anchor={.5} width={R*2.1} height={R*.525} />
    <Text text={`LV ${level}`} anchor={.5} y={R*.3} style={style(R*.1,0xf2e8d0)} />
   </Container>
			{#if countdown !== null}
				<Text
					text={String(countdown)}
					anchor={{ x: 0.5, y: 0.5 }}
					x={CX}
					y={CY}
					alpha={fade}
					scale={countScale}
					style={style(R * 0.5, 0xffffff)}
				/>
			{/if}
   {#if levelUp>0}
    <Sprite key="mummyLevelUp" anchor={.5} x={CX} y={CY+R*.05} width={R*1.9} height={R*.798} alpha={Math.min(1,levelUp)} scale={.6+.4*levelUp} />
   {/if}
			{#if amountShown !== null}
				<Text
					text={bookEventAmountToCurrencyString(amountShown)}
					anchor={{ x: 0.5, y: 0 }}
					x={CX}
					y={CY + R * 1.16}
					alpha={fade}
					style={style(R * 0.2, 0xffe08a)}
				/>
			{/if}
		</Container>
	</MainContainer>
{/if}
