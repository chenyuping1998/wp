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
	import { Container, Graphics, Text } from 'pixi-svelte';
	import type { Graphics as PixiGraphics } from 'pixi.js';
	import { stateBet } from 'state-shared';
	import { onDestroy } from 'svelte';

	import { getContext } from '../game/context';
	import { GOLD, GOLD_PALE, ICE_PLATE, INK } from '../game/palette';
	import { SYMBOL_SIZE } from '../game/constants';
	import { gameText } from '../game/i18nText';
	import GoldText from './GoldText.svelte';
	import PropMesh from './PropMesh.svelte';
	import { COUNTER } from '../game/meshWin';

	const context = getContext();

	// the ice-framed counter plate left of the board, snow on top and icicles
	// under it (fs_counter_panel.png, drawn by design/generate_fs_counter_frost.mjs;
	// the canvas keeps the old 824:622 ratio, so every fraction below still holds)
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
	let meshClock = $state(-1);
	let meshReset = $state(false);
	let meshRaf = 0;
	const startMeshPulse = (reset: boolean) => {
		cancelAnimationFrame(meshRaf);
		meshReset = reset;
		const started = performance.now();
		const step = (now: number) => {
			meshClock = now - started;
			if (meshClock < 900) meshRaf = requestAnimationFrame(step);
			else meshClock = -1;
		};
		meshRaf = requestAnimationFrame(step);
	};
	onDestroy(() => cancelAnimationFrame(meshRaf));

	const isSuperspin = $derived(stateBet.activeBetModeKey === 'SUPERSPIN');
	// superspin is hold'n'spin: what matters is how many respins REMAIN
	// (3 → 2 → 1, snapping back to 3 whenever a coin lands)
	const remaining = $derived(Math.max(0, total - (current - 1)));
	const title = $derived(isSuperspin ? gameText('respins') : gameText('freeSpins'));

	context.eventEmitter.subscribeOnMount({
		freeSpinCounterShow: () => (show = true),
		freeSpinCounterHide: () => {
			show = false;
			cancelAnimationFrame(meshRaf);
			meshClock = -1;
		},
		freeSpinCounterUpdate: (emitterEvent) => {
			const previousTotal = total;
			const previousRemaining = Math.max(0, total - (current - 1));
			if (emitterEvent.current !== undefined) current = emitterEvent.current;
			if (emitterEvent.total !== undefined) total = emitterEvent.total;
			startMeshPulse(total > previousTotal || (isSuperspin && remaining > previousRemaining));
		},
	});
	const numberScale = $derived(meshClock < 0 ? 1 : 1 + 0.1 * Math.sin(Math.PI * Math.min(1, meshClock / 380)));

	// superspin pips: one slot per respin in the window, lit while still available
	const drawPips = (g: PixiGraphics) => {
		g.clear();
		if (!isSuperspin || total <= 0) return;
		const gap = panelSizes.width * 0.14;
		const startX = panelSizes.width * 0.5 - ((total - 1) * gap) / 2;
		const y = panelSizes.height * 0.78;
		for (let i = 0; i < total; i++) {
			const lit = i < remaining;
			// A lit pip stays gold — it is a spin you still have, which is the
			// closest thing on this panel to an amount. The SPENT pip and the
			// outline are ground, so they move to slate: the unlit one was
			// 0x1c260c (olive) with a 0x54330a brown edge, both of which read as
			// dirt next to ice.
			//
			// This `lineStyle` is left as-is on purpose. It is followed by
			// beginFill/drawCircle/endFill, and `endFill`'s v8 shim fills AND then
			// strokes when a non-default stroke style is set — so unlike the five
			// dead sites fixed elsewhere in this app, this outline really does
			// draw. See HANDOFF.md.
			g.lineStyle(2, INK, 1);
			g.beginFill(lit ? GOLD : ICE_PLATE, lit ? 1 : 0.85);
			g.drawCircle(startX + i * gap, y, panelSizes.width * 0.035);
			g.endFill();
		}
	};
</script>

<MainContainer>
	<FadeContainer {show} {...position}>
		<PropMesh spec={COUNTER} env={{ updateT: meshClock, reset: meshReset }} {...panelSizes} />

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
				fill: [GOLD_PALE, GOLD, 0xc9821a],
				stroke: INK,
				strokeThickness: 4,
				wordWrap: false,
			}}
		/>

		{#if isSuperspin}
			<!-- big remaining-respins number (the hold'n'spin heartbeat) -->
			<Container x={panelSizes.width * 0.5} y={panelSizes.height * 0.55} scale={numberScale}>
				<GoldText text={remaining} fontSize={panelSizes.width * 0.3} />
			</Container>
			<Graphics draw={drawPips} />
		{:else}
			<!-- free game: current spin of total -->
			<Container x={panelSizes.width * 0.5} y={panelSizes.height * 0.58} scale={numberScale}>
				<GoldText
					text={`${Math.min(current, total)} / ${total}`}
					fontSize={panelSizes.width * 0.19}
					maxWidth={panelSizes.width * 0.72}
				/>
			</Container>
		{/if}
	</FadeContainer>
</MainContainer>
