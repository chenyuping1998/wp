<script lang="ts" module>
	export type EmitterEventFreeSpinCounter =
		| { type: 'freeSpinCounterShow' }
		| { type: 'freeSpinCounterHide' }
		| { type: 'freeSpinCounterUpdate'; current?: number; total?: number };
</script>

<script lang="ts">
	import { GAME_FONT, GAME_FONT_WEIGHT } from '../game/fonts';
	import { MainContainer } from 'components-layout';
	import { FadeContainer } from 'components-pixi';
	import { Graphics, Sprite, Text } from 'pixi-svelte';
	import type { Graphics as PixiGraphics } from 'pixi.js';
	import { stateBet } from 'state-shared';

	import { getContext } from '../game/context';
	import { SYMBOL_SIZE } from '../game/constants';
	import { gameText } from '../game/i18nText';
	import GoldText from './GoldText.svelte';

	const context = getContext();

	// brass plaque left of the board (fs_counter_panel.png, 824×622)
	const PANEL_RATIO = 824 / 622;
	const panelWidth = $derived(SYMBOL_SIZE * 1.8);
	// BoardFrame draws the housing this much larger than the reel area, so the
	// board's real left edge is boardLayout().width * scale * this / 2 out from
	// centre — NOT half the raw width. Positioning off the raw width is what this
	// used to do, which meant the plaque stayed put while the board grew past it.
	const FRAME_SCALE = 1280 / 1000;
	const housingHalfWidth = $derived(
		context.stateGameDerived.boardLayout().width *
			context.stateGameDerived.boardLayout().scale *
			FRAME_SCALE *
			0.5,
	);
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
						housingHalfWidth -
						panelSizes.width -
						SYMBOL_SIZE * 0.1,
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

	const isSuperspin = $derived(stateBet.activeBetModeKey === 'SUPERSPIN');
	// superspin is hold'n'spin: what matters is how many respins REMAIN
	// (3 → 2 → 1, snapping back to 3 whenever a coin lands)
	const remaining = $derived(Math.max(0, total - (current - 1)));
	const title = $derived(isSuperspin ? gameText('respins') : gameText('freeSpins'));

	context.eventEmitter.subscribeOnMount({
		freeSpinCounterShow: () => (show = true),
		freeSpinCounterHide: () => (show = false),
		freeSpinCounterUpdate: (emitterEvent) => {
			if (emitterEvent.current !== undefined) current = emitterEvent.current;
			if (emitterEvent.total !== undefined) total = emitterEvent.total;
		},
	});

	// superspin pips: one slot per respin in the window, lit while still available
	const drawPips = (g: PixiGraphics) => {
		g.clear();
		if (!isSuperspin || total <= 0) return;
		const gap = panelSizes.width * 0.14;
		const startX = panelSizes.width * 0.5 - ((total - 1) * gap) / 2;
		const y = panelSizes.height * 0.78;
		for (let i = 0; i < total; i++) {
			const lit = i < remaining;
			// 0x1c260c (an unlit pip) was olive — R28 G38 B12, sampled off
			// GoBananas' frame. It is written as a ternary branch rather than a
			// named constant, which is why every jungle-palette grep missed it.
			// Pixi 8: fill and stroke are explicit calls, not state set beforehand.
			g.circle(startX + i * gap, y, panelSizes.width * 0.035);
			g.fill({ color: lit ? 0xffd75e : 0x2a1244, alpha: lit ? 1 : 0.85 });
			g.circle(startX + i * gap, y, panelSizes.width * 0.035);
			g.stroke({ width: 2, color: 0x2b0a2e, alpha: 1 });
		}
	};
</script>

<MainContainer>
	<FadeContainer {show} {...position}>
		<Sprite key="hmFsPanel" {...panelSizes} />

		<!-- title on the upper plank area, auto-shrunk for long locales -->
		<Text
			anchor={0.5}
			x={panelSizes.width * 0.5}
			y={panelSizes.height * 0.33}
			text={title}
			style={{
				fontFamily: GAME_FONT,
				fontSize: Math.min(panelSizes.width * 0.115, (panelSizes.width * 1.35) / Math.max(1, title.length)),
				fontWeight: GAME_FONT_WEIGHT,
				letterSpacing: 2,
				fill: [0xffe98a, 0xffd75e, 0xff8ede],
				stroke: 0x2b0a2e,
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
			/>
			<Graphics draw={drawPips} />
		{:else}
			<!-- free game: current spin of total -->
			<GoldText
				x={panelSizes.width * 0.5}
				y={panelSizes.height * 0.58}
				text={`${Math.min(current, total)} / ${total}`}
				fontSize={panelSizes.width * 0.19}
				maxWidth={panelSizes.width * 0.72}
			/>
		{/if}
	</FadeContainer>
</MainContainer>
