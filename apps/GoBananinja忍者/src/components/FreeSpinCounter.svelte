<script lang="ts" module>
	export type EmitterEventFreeSpinCounter =
		| { type: 'freeSpinCounterShow' }
		| { type: 'freeSpinCounterHide' }
		| { type: 'freeSpinCounterUpdate'; current?: number; total?: number };
</script>

<script lang="ts">
	import { verticalFill } from '../game/gradientFill';
	import { GAME_FONT, GAME_FONT_WEIGHT } from '../game/fonts';
	import { MainContainer } from 'components-layout';
	import { FadeContainer } from 'components-pixi';
	import { Container, Graphics, Text, getContextApp } from 'pixi-svelte';
	import type { Graphics as PixiGraphics } from 'pixi.js';
	import { stateBet } from 'state-shared';
	import { onMount } from 'svelte';
	import PlaqueMesh from './PlaqueMesh.svelte';

	import { getContext } from '../game/context';
	import { SYMBOL_SIZE, HOLD_AND_SPIN_MODE_KEY } from '../game/constants';
	import { gameText } from '../game/i18nText';
	import GoldText from './GoldText.svelte';

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

	const isSuperspin = $derived(stateBet.activeBetModeKey === HOLD_AND_SPIN_MODE_KEY);
	// superspin is hold'n'spin: what matters is how many respins REMAIN
	// (3 → 2 → 1, snapping back to 3 whenever a coin lands)
	const remaining = $derived(Math.max(0, total - (current - 1)));
	const title = $derived(isSuperspin ? gameText('respins') : gameText('freeSpins'));

	// ── IT HANGS FROM ITS KNOT (2026-10-04, GoBananasBoat's counter) ─────────
	//
	// The plaque hangs on a red cord from the knot on its top edge. Every time
	// the count changes it is knocked — a swing about the knot that dies away —
	// and between knocks it never quite stops (a faint sway). Its lower edge
	// lags the swing through a mesh (PlaqueMesh `bend`), which is what makes a
	// hung sign read as heavy rather than as a card on a pin. A retrigger that
	// ADDS spins knocks harder than a spin being used.
	const KNOT = { x: 0.5, y: 0.075 };
	let clock = $state(0);
	let kickAt = -1e9;
	let kickSize = 0;
	const app = getContextApp();
	onMount(() => {
		const ticker = app.stateApp.pixiApplication?.ticker;
		const tick = () => (clock = performance.now());
		ticker?.add(tick);
		return () => ticker?.remove(tick);
	});
	const swingAt = (now: number) => {
		const c = now - kickAt;
		const knock = c < 0 ? 0 : kickSize * Math.exp(-c / 650) * Math.sin((2 * Math.PI * c) / 1100);
		return knock + 0.006 * Math.sin((2 * Math.PI * now) / 3700);
	};
	const swing = $derived(swingAt(clock));
	const bend = $derived(-((swingAt(clock) - swingAt(clock - 16)) / 16) * 80);
	const knock = (size: number) => {
		kickAt = performance.now();
		kickSize = size;
	};

	context.eventEmitter.subscribeOnMount({
		freeSpinCounterShow: () => {
			show = true;
			knock(0.05);
		},
		freeSpinCounterHide: () => (show = false),
		freeSpinCounterUpdate: (emitterEvent) => {
			const before = total;
			if (emitterEvent.current !== undefined) current = emitterEvent.current;
			if (emitterEvent.total !== undefined) total = emitterEvent.total;
			if (show) knock(total > before && before > 0 ? 0.075 : 0.035);
		},
	});

	// the cord from the knot, up off the top of the screen
	const drawCord = (g: PixiGraphics) => {
		g.clear();
		const thick = panelSizes.width * 0.022;
		const top = -panelSizes.height * 3;
		g.moveTo(0, 0).lineTo(0, top);
		g.stroke({ width: thick * 1.7, color: 0x3a0a0a, alpha: 1 });
		g.moveTo(0, 0).lineTo(0, top);
		g.stroke({ width: thick, color: 0xc4262a, alpha: 1 });
		for (let y = -thick, i = 0; y > top; y -= thick * 1.6, i++) {
			g.moveTo(-thick * 0.5, y).lineTo(thick * 0.5, y - thick * 0.8);
			g.stroke({ width: Math.max(1, thick * 0.28), color: i % 2 ? 0x7a1214 : 0xff6a5a, alpha: 0.9 });
		}
	};

	// superspin pips: one slot per respin in the window, lit while still available
	const drawPips = (g: PixiGraphics) => {
		g.clear();
		if (!isSuperspin || total <= 0) return;
		const gap = panelSizes.width * 0.14;
		const startX = panelSizes.width * 0.5 - ((total - 1) * gap) / 2;
		const y = panelSizes.height * 0.78;
		for (let i = 0; i < total; i++) {
			const lit = i < remaining;
			// PIXI v8 API, and this is a READOUT: lit and unlit pips differ only by
			// fill colour, and the v7 shim gives every shape in one Graphics the last
			// fill — so all the pips came out alike and the remaining respins could
			// not be counted off the plaque (the same bug Go Bananas Boat had)
			g.circle(startX + i * gap, y, panelSizes.width * 0.035);
			g.fill({ color: lit ? 0xffd75e : 0x1c260c, alpha: lit ? 1 : 0.85 });
			g.stroke({ width: 2, color: 0x54330a, alpha: 1 });
		}
	};
</script>

<MainContainer>
	<FadeContainer {show} {...position}>
		<!-- hung from the knot: everything below turns about it -->
		<Container x={panelSizes.width * KNOT.x} y={panelSizes.height * KNOT.y} rotation={swing}>
		<Graphics draw={drawCord} />
		<Container x={-panelSizes.width * KNOT.x} y={-panelSizes.height * KNOT.y}>
		<!-- own container: PlaqueMesh adds itself at its parent's end -->
		<Container>
			<PlaqueMesh
				key="gbFsPanel"
				width={panelSizes.width}
				height={panelSizes.height}
				pivotX={panelSizes.width * KNOT.x}
				pivotY={panelSizes.height * KNOT.y}
				{bend}
			/>
		</Container>

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
				fill: verticalFill([0xfff3bd, 0xffd75e, 0xc9821a], Math.min(panelSizes.width * 0.115, (panelSizes.width * 1.35) / Math.max(1, title.length))),
				stroke: 0x54330a,
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
		</Container>
		</Container>
	</FadeContainer>
</MainContainer>
