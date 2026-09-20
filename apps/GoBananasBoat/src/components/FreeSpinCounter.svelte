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
	import { Container, Graphics, Sprite, Text } from 'pixi-svelte';
	import type { Graphics as PixiGraphics } from 'pixi.js';
	import { stateBet } from 'state-shared';

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
	// hold and spin: what matters is how many respins REMAIN
	// (3 → 2 → 1, snapping back to 3 whenever a coin lands)
	const remaining = $derived(Math.max(0, total - (current - 1)));
	const title = $derived(isSuperspin ? gameText('respins') : gameText('freeSpins'));

	// ── the counter MOVES ────────────────────────────────────────────────────
	//
	// It was a static readout: the number changed between spins and nothing else
	// happened, including on a retrigger, the one moment in the feature where the
	// player is being handed something. A spin being spent gets a small knock;
	// spins being ADDED get a hard punch and a light wash over the plaque, because
	// those are two different pieces of news.
	let punchAt = $state(0);
	let punchForce = $state(0);
	let now = $state(0);
	let clock = 0;

	const PUNCH_MS = 520;

	const knock = (force: number) => {
		punchAt = Date.now();
		punchForce = force;
		now = punchAt;
		clearInterval(clock);
		// a timer rather than requestAnimationFrame: rAF stops dead in a hidden
		// tab, and this runs unattended through a whole feature
		clock = setInterval(() => {
			now = Date.now();
			if (now - punchAt > PUNCH_MS) {
				clearInterval(clock);
				clock = 0;
			}
		}, 16) as unknown as number;
	};

	$effect(() => () => clearInterval(clock));

	// 1 -> 0 over PUNCH_MS, springy at the start
	const punch = $derived.by(() => {
		const p = (now - punchAt) / PUNCH_MS;
		if (punchAt === 0 || p < 0 || p > 1) return 0;
		return Math.sin(p * Math.PI) * (1 - p) * punchForce;
	});

	context.eventEmitter.subscribeOnMount({
		freeSpinCounterShow: () => (show = true),
		freeSpinCounterHide: () => (show = false),
		freeSpinCounterUpdate: (emitterEvent) => {
			const gained = emitterEvent.total !== undefined && emitterEvent.total > total && total > 0;
			const spent = emitterEvent.current !== undefined && emitterEvent.current !== current;
			if (emitterEvent.current !== undefined) current = emitterEvent.current;
			if (emitterEvent.total !== undefined) total = emitterEvent.total;
			if (gained) knock(1);
			else if (spent) knock(0.38);
		},
	});

	// hold-and-spin pips: one slot per respin in the window, lit while still available
	const drawPips = (g: PixiGraphics) => {
		g.clear();
		if (!isSuperspin || total <= 0) return;
		const gap = panelSizes.width * 0.14;
		const startX = panelSizes.width * 0.5 - ((total - 1) * gap) / 2;
		const y = panelSizes.height * 0.78;
		for (let i = 0; i < total; i++) {
			const lit = i < remaining;
			// PIXI v8 API, and this was a READOUT being drawn wrong, not just a
			// weaker effect: lit and unlit pips differ only by fill colour, and the
			// v7 shim gives every shape in the Graphics the last fill — so all the
			// pips came out the same and the player could not count their remaining
			// respins off the plaque at all.
			g.circle(startX + i * gap, y, panelSizes.width * 0.035);
			// unlit is the plaque's own steel, not the jungle olive it used to be —
			// an empty socket in the plate rather than a dark green dot on it
			g.fill({ color: lit ? 0xffd75e : 0x26323b, alpha: lit ? 1 : 0.85 });
			g.stroke({ width: 2, color: 0x54330a, alpha: 1 });
		}
	};
</script>

<MainContainer>
	<FadeContainer {show} {...position}>
		<Sprite key="gbFsPanel" {...panelSizes} />

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
				fill: verticalFill(
					[0xfff3bd, 0xffd75e, 0xc9821a],
					Math.min(panelSizes.width * 0.115, (panelSizes.width * 1.35) / Math.max(1, title.length)),
				),
				stroke: 0x54330a,
				strokeThickness: 4,
				wordWrap: false,
			}}
		/>

		<!-- the plaque takes the news too: a light wash on a retrigger, a hint of
		     one when a spin is spent -->
		<Sprite
			key="fxGlow"
			anchor={0.5}
			x={panelSizes.width * 0.5}
			y={panelSizes.height * 0.5}
			width={panelSizes.width * 1.5}
			height={panelSizes.height * 1.9}
			tint={0xffd75e}
			blendMode="add"
			alpha={0.42 * punch}
		/>

		{#if isSuperspin}
			<!-- big remaining-respins number (the hold'n'spin heartbeat) -->
			<Container x={panelSizes.width * 0.5} y={panelSizes.height * 0.55} scale={1 + 0.26 * punch}>
				<GoldText x={0} y={0} text={remaining} fontSize={panelSizes.width * 0.3} />
			</Container>
			<Graphics draw={drawPips} />
		{:else}
			<!-- free game: current spin of total -->
			<Container x={panelSizes.width * 0.5} y={panelSizes.height * 0.58} scale={1 + 0.26 * punch}>
				<GoldText
					x={0}
					y={0}
					text={`${Math.min(current, total)} / ${total}`}
					fontSize={panelSizes.width * 0.19}
					maxWidth={panelSizes.width * 0.72}
				/>
			</Container>
		{/if}
	</FadeContainer>
</MainContainer>
