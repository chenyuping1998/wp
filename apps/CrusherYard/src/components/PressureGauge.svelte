<script lang="ts" module>
	export type EmitterEventPressureGauge =
		| { type: 'pressureGaugeShow' }
		| { type: 'pressureGaugeHide' }
		/** The needle moved. `from` is the previous reading, so a repeat is silent. */
		| { type: 'pressureGaugeAdvance'; value: number; from: number };
</script>

<script lang="ts">
	import { onMount } from 'svelte';
	import { MainContainer } from 'components-layout';
	import { FadeContainer } from 'components-pixi';
	import { Container, Graphics, Sprite, Text } from 'pixi-svelte';
	import type { Graphics as PixiGraphics } from 'pixi.js';

	import { getContext } from '../game/context';
	import {
		SYMBOL_SIZE,
		GAUGE_DIAL_MAX,
		GAUGE_REDLINE,
		gaugeTierFor,
	} from '../game/constants';
	import { GAME_FONT, GAME_FONT_WEIGHT } from '../game/fonts';
	import { gameText } from '../game/i18nText';

	/**
	 * The pressure gauge: the free game's entire feature, in one readout.
	 *
	 * It gains +1 on every tumble and — unlike every tumble game in this repo
	 * before it — does NOT reset between free spins. It carries for the whole
	 * feature. That is the thing this component has to make legible, because the
	 * mechanic is invisible on the board: nothing about a cell tells you the
	 * multiplier it will pay at.
	 *
	 * Drawn as a manifold strip rather than a round dial. A round dial is the
	 * better picture of a pressure gauge and the wrong shape for the space — the
	 * only room the 6x5 board leaves is a wide, short band above it, and a dial
	 * squeezed into that band ends up smaller than its own numerals. The strip
	 * gets the same information across: a scale, a filled portion, a redline zone,
	 * and the reading.
	 *
	 * Scale runs to GAUGE_DIAL_MAX (20), not to the math's cap of 50. The books
	 * put the median feature at 7 and p99 at 17, so a scale drawn to the cap would
	 * spend two thirds of its length on readings nobody reaches, and every
	 * ordinary feature would look like it barely moved. Above the top of the scale
	 * the bar simply stays full and the numeral keeps climbing.
	 */
	const context = getContext();

	let show = $state(false);
	// 1 immediately after the needle moves, decaying to 0. Drives the flare and
	// the housing kick, so a tumble that did NOT advance the gauge (the math still
	// emits the event, clamped) sits perfectly still.
	let flare = $state(0);
	let flareStart = 0;
	let clock = $state(0);

	const value = $derived(context.stateGame.globalMult);
	const tier = $derived(gaugeTierFor(value));
	const fill = $derived(Math.max(0, Math.min(1, (value - 1) / (GAUGE_DIAL_MAX - 1))));

	const FLARE_MS = 620;

	// Geometry: a band the width of the board, sitting just above its top edge.
	const BAR_HEIGHT = SYMBOL_SIZE * 0.34;
	const GAP_ABOVE_BOARD = SYMBOL_SIZE * 0.2;

	const layout = $derived.by(() => {
		const board = context.stateGameDerived.boardLayout();
		const width = board.width * board.scale;
		const height = board.height * board.scale;
		return {
			width,
			// Scale is applied here rather than left out, so the band tracks the board
			// when the compact bet bar shrinks it. The board's own top edge is the
			// only anchor that stays correct across both layouts.
			x: board.x - width * 0.5,
			y: board.y - height * 0.5 - BAR_HEIGHT - GAP_ABOVE_BOARD,
			height: BAR_HEIGHT,
		};
	});

	// The housing shakes above the redline. Amplitude comes from the tier so it
	// steps with the colour rather than being a second, independent scale.
	const shake = $derived.by(() => {
		const amount = tier.shake + flare * 0.6;
		if (amount <= 0) return { x: 0, y: 0 };
		const magnitude = amount * 2.4;
		return {
			x: Math.sin(clock * 41) * magnitude,
			y: Math.sin(clock * 57 + 1.3) * magnitude * 0.6,
		};
	});

	const drawBar = (graphics: PixiGraphics) => {
		const { width, height } = layout;
		graphics.clear();

		// housing
		graphics.roundRect(0, 0, width, height, height * 0.28).fill({ color: 0x14140f, alpha: 0.88 });

		const inset = height * 0.2;
		const trackWidth = width - inset * 2;
		const trackHeight = height - inset * 2;

		// redline zone, drawn under the fill so a full bar covers it in its own colour
		const redlineFrom = (GAUGE_REDLINE - 1) / (GAUGE_DIAL_MAX - 1);
		graphics
			.rect(inset + trackWidth * redlineFrom, inset, trackWidth * (1 - redlineFrom), trackHeight)
			.fill({ color: 0x5c1206, alpha: 0.75 });

		// the charge itself
		if (fill > 0) {
			graphics
				.rect(inset, inset, trackWidth * fill, trackHeight)
				.fill({ color: tier.arc, alpha: 0.95 });
			graphics
				.rect(inset, inset, trackWidth * fill, trackHeight * 0.42)
				.fill({ color: tier.color, alpha: 0.28 + tier.intensity * 0.3 });
		}

		// tick per whole notch. Skipped once the notches would be under 3px apart,
		// which never happens at GAUGE_DIAL_MAX = 20 on a 588px board but would the
		// moment someone raises the scale to the cap.
		const step = trackWidth / (GAUGE_DIAL_MAX - 1);
		if (step >= 3) {
			for (let n = 1; n < GAUGE_DIAL_MAX; n += 1) {
				const x = inset + step * n;
				graphics.moveTo(x, inset).lineTo(x, inset + trackHeight);
			}
			graphics.stroke({ width: 1, color: 0x000000, alpha: 0.35 });
		}

		// needle at the current reading
		const needleX = inset + trackWidth * fill;
		graphics
			.moveTo(needleX, 0)
			.lineTo(needleX, height)
			.stroke({ width: 2.5, color: tier.color, alpha: 0.95 });

		// housing edge last, over everything
		graphics
			.roundRect(0.5, 0.5, width - 1, height - 1, height * 0.28)
			.stroke({ width: 1.5, color: 0x6b5a3a, alpha: 0.8 });
	};

	onMount(() => {
		let raf = 0;
		const tick = (now: number) => {
			clock = now / 1000;
			flare = flareStart ? Math.max(0, 1 - (now - flareStart) / FLARE_MS) : 0;
			if (flare === 0) flareStart = 0;
			raf = requestAnimationFrame(tick);
		};
		raf = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(raf);
	});

	context.eventEmitter.subscribeOnMount({
		pressureGaugeShow: () => (show = true),
		pressureGaugeHide: () => {
			show = false;
			flareStart = 0;
			flare = 0;
		},
		pressureGaugeAdvance: ({ value: next, from }) => {
			// The math emits updateGlobalMult on every tumble even when the reading is
			// unchanged, so that it stays one-to-one with tumbleBoard. Reacting to
			// that would make the gauge twitch on a clamped feature for no reason.
			if (next <= from) return;
			flareStart = performance.now();
			context.eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_gauge_tick' });
		},
	});
</script>

<MainContainer>
	<FadeContainer {show} x={layout.x + shake.x} y={layout.y + shake.y}>
		<!-- additive bloom, so a hot gauge adds light and never masks the board -->
		{#if tier.intensity > 0.2 || flare > 0}
			<Sprite
				key="fxGlow"
				anchor={{ x: 0.5, y: 0.5 }}
				x={layout.width * 0.5}
				y={layout.height * 0.5}
				width={layout.width * (1.05 + flare * 0.1)}
				height={layout.height * (3.4 + flare * 1.6)}
				tint={tier.glow}
				blendMode="add"
				alpha={0.1 + tier.intensity * 0.22 + flare * 0.3}
			/>
		{/if}

		<Graphics draw={drawBar} />

		<!-- label sits inside the housing at the left, reading is at the right -->
		<Text
			anchor={{ x: 0, y: 0.5 }}
			x={layout.height * 0.55}
			y={layout.height * 0.5}
			text={gameText('pressure')}
			style={{
				fontFamily: GAME_FONT,
				fontWeight: GAME_FONT_WEIGHT,
				fontSize: layout.height * 0.48,
				letterSpacing: 2,
				fill: 0xd8cdb4,
				stroke: { color: 0x0d0d08, width: 3 },
				wordWrap: false,
			}}
		/>

		<Container
			x={layout.width - layout.height * 0.45}
			y={layout.height * 0.5}
			scale={1 + flare * 0.22}
		>
			<Text
				anchor={{ x: 1, y: 0.5 }}
				text={`x${value}`}
				style={{
					fontFamily: GAME_FONT,
					fontWeight: GAME_FONT_WEIGHT,
					fontSize: layout.height * 0.82,
					fill: tier.color,
					stroke: { color: 0x0d0d08, width: 4 },
					wordWrap: false,
				}}
			/>
		</Container>
	</FadeContainer>
</MainContainer>
