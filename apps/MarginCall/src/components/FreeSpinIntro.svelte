<script lang="ts" module>
	export type EmitterEventFreeSpinIntro =
		| { type: 'freeSpinIntroShow' }
		| { type: 'freeSpinIntroHide' }
		| { type: 'freeSpinIntroUpdate'; totalFreeSpins: number; extraSpins?: number };
</script>

<script lang="ts">
	import { displayFontFor, displayWeightFor } from '../game/fonts';
	import { CanvasSizeRectangle } from 'components-layout';
	import { FadeContainer } from 'components-pixi';
	import { waitForResolve } from 'utils-shared/wait';
	import { Container, Graphics, Text } from 'pixi-svelte';
	import type { Graphics as PixiGraphics } from 'pixi.js';

	import { getContext } from '../game/context';
	import { gameText } from '../game/i18nText';
	import PressToContinue from './PressToContinue.svelte';
	import FreeSpinAnimation from './FreeSpinAnimation.svelte';
	import GoldText from './GoldText.svelte';

	const context = getContext();

	// The award, staged.
	//
	// Everything used to arrive at once: plate, title, number and caption all
	// appeared on the same frame, which means there was no moment. The number is
	// the only thing on this panel a player actually needs — it is the size of the
	// award — and it had no emphasis whatever: no roll, no punch, no sound.
	//
	// Order now: the plate seats and powers on (FreeSpinAnimation), the title
	// wipes in behind a light band, then the count rolls up and lands with a
	// burst. A retrigger takes the same path at roughly half the length, because
	// by then the player already knows what the panel is.
	let show = $state(false);
	let freeSpinsFromEvent = $state(0);
	let isRetrigger = $state(false);
	let oncomplete = $state(() => {});

	const title = gameText('freeSpins');
	const subtitle = gameText('spinsAwarded');

	/** ms since the award arrived; -1 before it does */
	let awardClock = $state(-1);
	let landed = $state(false);

	const ROLL_DELAY = 260;
	const ROLL_MS = 520;
	const PUNCH_MS = 480;

	const runAward = () => {
		landed = false;
		const compact = isRetrigger;
		const delay = compact ? 120 : ROLL_DELAY;
		const roll = compact ? 300 : ROLL_MS;
		const start = performance.now();
		let raf = 0;
		const tick = (now: number) => {
			awardClock = now - start;
			if (!landed && awardClock >= delay + roll) {
				landed = true;
				// The blast is the award landing. It is the one hard onset on this
				// panel and it belongs to the number, not to the plate.
				context.eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_winlevel_end' });
				context.eventEmitter.broadcast({ type: 'boardFrameImpact', strength: 1.9 });
			}
			if (awardClock < delay + roll + PUNCH_MS + 400) raf = requestAnimationFrame(tick);
		};
		raf = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(raf);
	};

	const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
	const easeOut = (v: number) => 1 - (1 - clamp01(v)) ** 3;

	const rollDelay = $derived(isRetrigger ? 120 : ROLL_DELAY);
	const rollMs = $derived(isRetrigger ? 300 : ROLL_MS);

	/** the count climbing to its final value */
	const shownCount = $derived.by(() => {
		if (awardClock < 0) return 0;
		const p = clamp01((awardClock - rollDelay) / rollMs);
		return Math.round(freeSpinsFromEvent * easeOut(p));
	});

	/** 0..1 after the count lands, drives the punch and the burst */
	const punch = $derived(
		awardClock < 0 ? -1 : clamp01((awardClock - rollDelay - rollMs) / PUNCH_MS),
	);
	// The award is the whole point of this panel, so the number hits hard: a 78%
	// overshoot that settles over about half a second, rather than the 42% it
	// arrived with. It is the only thing on screen at that moment, so there is
	// nothing for it to overpower.
	//
	// There is deliberately NO full-canvas flash here. One was tried and it was
	// wrong twice over: a 55% white wash across the whole screen is the visual
	// weight of a max win, which a free-spin count is not - and it washed out the
	// very number it was supposed to be emphasising. The impact comes from the
	// overshoot, the shake, the frame hit and the burst's own hot core, all of
	// which are local to the number.
	const countScale = $derived(
		punch < 0 ? 0.78 : punch === 0 ? 1 : 1 + 0.78 * Math.exp(-4.2 * punch) * Math.cos(punch * 6.4),
	);

	/** The number itself kicks, not just the plate. */
	const landShake = $derived.by(() => {
		if (punch < 0 || punch >= 0.35) return { x: 0, y: 0 };
		const amp = 13 * (1 - punch / 0.35) ** 2;
		return { x: (Math.random() - 0.5) * 2 * amp, y: (Math.random() - 0.5) * 2 * amp };
	});

	// Title wipes in behind a light band rather than simply being there.
	const titleReveal = $derived(awardClock < 0 ? 0 : clamp01(awardClock / 300));

	context.eventEmitter.subscribeOnMount({
		freeSpinIntroShow: () => {
			show = true;
			awardClock = -1;
			landed = false;
		},
		freeSpinIntroHide: () => (show = false),
		freeSpinIntroUpdate: async (emitterEvent) => {
			isRetrigger = emitterEvent.extraSpins !== undefined;
			freeSpinsFromEvent = emitterEvent.extraSpins ?? emitterEvent.totalFreeSpins;
			runAward();
			await waitForResolve((resolve) => (oncomplete = resolve));
		},
	});

	const drawBurst = (g: PixiGraphics, size: number) => {
		g.clear();
		if (punch <= 0 || punch >= 1) return;
		// a hot core that blows out and fades, under the rings
		g.circle(0, 0, size * (0.2 + 0.9 * easeOut(punch)));
		g.fill({ color: 0xeafff2, alpha: 0.28 * (1 - punch) ** 2 });
		// rings, further and heavier than before
		const r = size * (0.28 + 0.95 * easeOut(punch));
		g.circle(0, 0, r);
		g.stroke({ width: size * 0.09 * (1 - punch) + 1, color: 0xeafff2, alpha: 0.9 * (1 - punch) });
		const r2 = size * (0.22 + 0.75 * easeOut(clamp01(punch - 0.1)));
		g.circle(0, 0, r2);
		g.stroke({ width: size * 0.06 * (1 - punch) + 1, color: 0x4bd67f, alpha: 0.8 * (1 - punch) });
		// spokes: more of them, thrown further
		for (let i = 0; i < 18; i++) {
			const a = (i / 18) * Math.PI * 2 + 0.26;
			const d0 = size * (0.3 + 0.8 * easeOut(punch));
			const d1 = d0 + size * 0.22 * (1 - punch);
			g.moveTo(Math.cos(a) * d0, Math.sin(a) * d0);
			g.lineTo(Math.cos(a) * d1, Math.sin(a) * d1);
		}
		g.stroke({ width: 4, color: 0x4bd67f, alpha: 0.8 * (1 - punch), cap: 'round' });
	};
</script>

<FadeContainer {show}>
	<CanvasSizeRectangle backgroundColor={0x000000} backgroundAlpha={0.5} />

	<FreeSpinAnimation compact={isRetrigger}>
		{#snippet children({ sizes })}
			<!--
				Title in the terminal's own green. It was set in the inherited gold
				(0xffd75e over a brown stroke), which is the palette of a different
				game and the only warm thing left on this panel.
			-->
			<Container y={-sizes.height * 0.26} alpha={titleReveal}>
				<Text
					anchor={0.5}
					x={(1 - titleReveal) * sizes.width * 0.06}
					text={title}
					style={{
						fontFamily: displayFontFor(title),
						fontSize: Math.min(sizes.width * 0.13, (sizes.width * 1.5) / title.length),
						fontWeight: displayWeightFor(title),
						letterSpacing: 6,
						fill: [0xeafff2, 0x8ef0b4, 0x2ea55e],
						stroke: 0x06210f,
						strokeThickness: 6,
						dropShadow: true,
						dropShadowColor: 0x000000,
						dropShadowBlur: 10,
						dropShadowDistance: 3,
					}}
				/>
			</Container>

			<Container y={sizes.height * 0.08} x={landShake.x} >
				<Graphics draw={(g) => drawBurst(g, sizes.width * 0.24)} />
				<Container scale={countScale} y={landShake.y}>
					<GoldText text={shownCount} fontSize={sizes.width * 0.24} />
				</Container>
			</Container>

			<Text
				anchor={0.5}
				y={sizes.height * 0.32}
				alpha={clamp01((awardClock - rollDelay - rollMs) / 260)}
				text={subtitle}
				style={{
					fontFamily: displayFontFor(subtitle),
					fontSize: Math.min(sizes.width * 0.05, (sizes.width * 1.1) / subtitle.length),
					fontWeight: displayWeightFor(subtitle),
					letterSpacing: 4,
					fill: 0xcfe9da,
					stroke: 0x06210f,
					strokeThickness: 3,
				}}
			/>
		{/snippet}
	</FreeSpinAnimation>

	<PressToContinue onpress={() => oncomplete()} />
</FadeContainer>
