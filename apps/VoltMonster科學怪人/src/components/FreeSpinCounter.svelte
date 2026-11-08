<script lang="ts" module>
	export type EmitterEventFreeSpinCounter =
		| { type: 'freeSpinCounterShow' }
		| { type: 'freeSpinCounterHide' }
		| { type: 'freeSpinCounterUpdate'; current?: number; total?: number };
</script>

<script lang="ts">
	import { GAME_FONT, GAME_FONT_WEIGHT } from '../game/fonts';
	import { verticalFill } from '../game/gradientFill';
	import { MainContainer } from 'components-layout';
	import { FadeContainer } from 'components-pixi';
	import { Container, Graphics, Text } from 'pixi-svelte';
	import type { Graphics as PixiGraphics } from 'pixi.js';
	import { stateBet } from 'state-shared';

	import { getContext } from '../game/context';
	import { SYMBOL_SIZE, HOLD_AND_SPIN_MODE_KEY } from '../game/constants';
	import { gameText } from '../game/i18nText';
	import GoldText from './GoldText.svelte';
	import PropMesh from './PropMesh.svelte';
	import { COUNTER } from '../game/meshWin';
	import { COUNTER_CANVAS, PLATE_CENTRE, plateScale, type CounterEnv } from '../game/meshWin/fsCounter';

	const context = getContext();

	// brass plaque left of the board (fs_counter_panel.png, 824×622)
	const PANEL_RATIO = 824 / 622;
	const panelWidth = $derived(SYMBOL_SIZE * 2.1);
	const panelSizes = $derived({ width: panelWidth, height: panelWidth / PANEL_RATIO });
	const isPortrait = $derived(context.stateLayoutDerived.layoutType() === 'portrait');
	const position = $derived(
		isPortrait
			? {
					// portrait: centered above the board (no room at the side)
					x: context.stateGameDerived.boardLayout().x - panelSizes.width * 0.5,
					y:
						context.stateGameDerived.boardLayout().y -
						context.stateGameDerived.boardLayout().height * 0.5 -
						panelSizes.height * 1.28 -
						SYMBOL_SIZE * 0.3,
				}
			: {
					x:
						context.stateGameDerived.boardLayout().x -
						context.stateGameDerived.boardLayout().width * 0.5 -
						panelSizes.width -
						SYMBOL_SIZE * 0.6,
					// Pinned near the top of the screen rather than to the board's top
					// edge. With the side-rail UI the Buy Bonus button is centred in
					// the left rail, and the board now fills 94% of the height — the
					// old board-relative position put this plaque straight through it.
					y: context.stateLayoutDerived.mainLayout().height * 0.05,
				},
	);

	let show = $state(false);
	// `current` = spins USED + 1 (set by the updateFreeSpin handler); `total` = window size
	let current = $state(1);
	let total = $state(0);

	const isSuperspin = $derived(context.stateGame.gameType === 'holdandspin' || stateBet.activeBetModeKey.toUpperCase() === HOLD_AND_SPIN_MODE_KEY);
	// hold and spin: what matters is how many respins REMAIN
	// (3 → 2 → 1, snapping back to 3 whenever a coin lands)
	const remaining = $derived(Math.max(0, total - (current - 1)));
	const title = $derived(isSuperspin ? gameText('respins') : gameText('freeSpins'));
	const titleSize = $derived(
		Math.min(panelSizes.width * 0.115, (panelSizes.width * 1.35) / Math.max(1, title.length)),
	);

	context.eventEmitter.subscribeOnMount({
		freeSpinCounterShow: () => (show = true),
		freeSpinCounterHide: () => (show = false),
		freeSpinCounterUpdate: (emitterEvent) => {
			if (emitterEvent.current !== undefined) current = emitterEvent.current;
			if (emitterEvent.total !== undefined) total = emitterEvent.total;
		},
	});

	// hold-and-spin pips: one slot per respin in the window, lit while still available
	//
	// v8 path API, not the v7 beginFill/lineStyle shim: with the shim every shape
	// in one Graphics takes the LAST fill set, so lit and spent pips all came out
	// the same colour.
	const drawPips = (g: PixiGraphics) => {
		g.clear();
		if (!isSuperspin || total <= 0) return;
		const gap = panelSizes.width * 0.14;
		const startX = panelSizes.width * 0.5 - ((total - 1) * gap) / 2;
		const y = panelSizes.height * 0.78;
		for (let i = 0; i < total; i++) {
			const lit = i < remaining;
			// stone rim, amber when the respin is still available, slate when spent
			g.circle(startX + i * gap, y, panelSizes.width * 0.035)
				.fill({ color: lit ? 0xffa53a : 0x22252b, alpha: lit ? 1 : 0.85 })
				.stroke({ width: 2, color: 0x6e5e4a });
		}
	};

	// THE PLATE ANSWERS THE GAME (game/meshWin/fsCounter.ts): a knock for every
	// spin used, a bulge for a retrigger (or the respins topping back up), and
	// Keyed off
	// `remaining` rather than the raw events, so the free game and the
	// hold-and-spin read the same way. The first fill (0 -> the award) is the
	// counter appearing, not a retrigger.
	let spinAt = -1;
	let retrigAt = -1;
	let lastRemaining = 0;
	$effect(() => {
		const now = remaining;
		if (show && lastRemaining > 0) {
			if (now < lastRemaining) spinAt = Date.now();
			else if (now > lastRemaining) retrigAt = Date.now();
		}
		lastRemaining = now;
	});
	let counterEnv = $state<CounterEnv>({ spinT: -1, retrigT: -1, levelT: -1 });
	$effect(() => {
		if (!show) return;
		// setInterval, not the frame loop: it keeps time in a hidden tab
		const timer = setInterval(() => {
			const t = Date.now();
			counterEnv = {
				spinT: spinAt < 0 ? -1 : t - spinAt,
				retrigT: retrigAt < 0 ? -1 : t - retrigAt,
				levelT: -1,
			};
		}, 16);
		return () => clearInterval(timer);
	});
	// the title and the count take the plate's own scale about its
	// centre, so they stay on it while it bulges
	const overlay = $derived.by(() => {
		const [sx, sy] = plateScale(counterEnv);
		const cx = (PLATE_CENTRE[0] / COUNTER_CANVAS[0]) * panelSizes.width;
		const cy = (PLATE_CENTRE[1] / COUNTER_CANVAS[1]) * panelSizes.height;
		return { x: cx * (1 - sx), y: cy * (1 - sy), sx, sy };
	});

</script>

<MainContainer>
	<FadeContainer {show} {...position}>
		<!-- drawn through its mesh (game/meshWin/fsCounter.ts), same box -->
		<PropMesh spec={COUNTER} env={counterEnv} {...panelSizes} />

		<Container x={overlay.x} y={overlay.y} scale={{ x: overlay.sx, y: overlay.sy }}>

		<!-- title on the upper plank area, auto-shrunk for long locales -->
		<Text
			anchor={0.5}
			x={panelSizes.width * 0.5}
			y={panelSizes.height * 0.33}
			text={title}
			style={{
				fontFamily: GAME_FONT,
				fontSize: titleSize,
				fontWeight: GAME_FONT_WEIGHT,
				letterSpacing: 2,
				// THE MINE'S PALETTE, not gen-1's jungle brass: the plaque under this
				// is the high symbols' slate now, and gold-on-olive type came with it
				// from a game that was green. Cream into the fuse's amber instead.
				// an array fill is pure white in pixi v8 - see game/gradientFill.ts
				fill: verticalFill([0xfff6e0, 0xffc45a, 0xc07a14], titleSize),
				stroke: 0x2a2016,
				strokeThickness: 4,
				wordWrap: false,
			}}
		/>

		{#if isSuperspin}
			<!-- big remaining-respins number (the hold'n'spin heartbeat) -->
			<GoldText
				x={panelSizes.width * 0.5}
				y={panelSizes.height * 0.55}
				text={remaining}
				fontSize={panelSizes.width * 0.3}
				fill={[0xfff6e0, 0xffc45a, 0xc07a14]}
				stroke={0x2a2016}
			/>
			<Graphics draw={drawPips} />
		{:else}
			<!-- free game: current spin of total -->
			<GoldText
				x={panelSizes.width * 0.5}
				y={panelSizes.height * 0.6}
				text={`${Math.min(current, total)} / ${total}`}
				fontSize={panelSizes.width * 0.17}
				maxWidth={panelSizes.width * 0.72}
				fill={[0xfff6e0, 0xffc45a, 0xc07a14]}
				stroke={0x2a2016}
			/>
		{/if}
		</Container>
	</FadeContainer>
</MainContainer>
