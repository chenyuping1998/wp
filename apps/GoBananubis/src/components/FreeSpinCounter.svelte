<script lang="ts" module>
	export type EmitterEventFreeSpinCounter =
		| { type: 'freeSpinCounterShow' }
		| { type: 'freeSpinCounterHide' }
		| { type: 'freeSpinCounterUpdate'; current?: number; total?: number }
		// The symbol every tablet in this run will open to. 'pending' while the
		// oracle is still deciding it (the badge shows a question mark), the symbol
		// once it lands, null to clear it.
		| { type: 'runSymbol'; symbol: SymbolName | 'pending' | null };
	import type { SymbolName } from '../game/types';
</script>

<script lang="ts">
	import { GAME_FONT, GAME_FONT_WEIGHT } from '../game/fonts';
	import { MainContainer } from 'components-layout';
	import { FadeContainer } from 'components-pixi';
	import { Container, Graphics, Sprite, Text } from 'pixi-svelte';
	import type { Graphics as PixiGraphics } from 'pixi.js';
	import { stateBet } from 'state-shared';

	import { getContext } from '../game/context';
	import { SYMBOL_SIZE, SYMBOL_INFO_MAP } from '../game/constants';
	import { counterPlacement, runBadgeMain } from '../game/counterPlacement';
	import { gameText } from '../game/i18nText';
	import GoldText from './GoldText.svelte';
	import SheetMesh from './SheetMesh.svelte';
	import { buildCounterGrid, poseCounter, COUNTER, COUNTER_KNOCK_S, type CounterKnock } from '../game/meshWin/sheets';

	const context = getContext();

	// brass plaque left of the board (fs_counter_panel.png, 824×622); where it sits
	// is computed in game/counterPlacement.ts, because the oracle flies the run's
	// symbol into it and has to land in the same place
	const placement = $derived(counterPlacement(context));
	const panelSizes = $derived(placement.panelSizes);
	const position = $derived(placement.position);
	const badge = $derived(runBadgeMain(context));

	let show = $state(false);
	// `current` = spins USED + 1 (set by the updateFreeSpin handler); `total` = window size
	let current = $state(1);
	let total = $state(0);

	// ── THE RUN'S SYMBOL LIVES ON THE PLAQUE ─────────────────────────────────
	//
	// The one fact about a free round the player most needs to keep hold of is
	// which symbol every tablet will open to — and after the oracle names it, it
	// used to vanish: the player had to remember it, or watch tablets crack to
	// find out again. So it is kept: a small medal on the plaque's corner, empty
	// (a question mark) while the oracle is still spinning and filled by the tile
	// flying into it (MysteryOracle) — a payoff at the end of the reading, and a
	// reminder for every spin after.
	let runSymbol = $state<SymbolName | 'pending' | null>(null);
	let badgeAt = $state(0);
	const runAssetKey = $derived(
		runSymbol && runSymbol !== 'pending'
			? (SYMBOL_INFO_MAP as Record<string, { static: { assetKey: string } }>)[runSymbol]?.static
					.assetKey
			: undefined,
	);
	// the medal's own pop as the tile lands in it: rides the same clock as the plaque
	const badgePop = $derived.by(() => {
		const p = (now - badgeAt) / 520;
		if (!badgeAt || p < 0 || p > 1) return 0;
		return Math.sin(p * Math.PI * 0.5 + Math.PI * 0.5) * (1 - p) ** 1.2;
	});
	// round over (or a resumed round that never had an oracle): nothing to show
	$effect(() => {
		if (context.stateGame.gameType !== 'freegame' && runSymbol !== null) runSymbol = null;
	});

	const isSuperspin = $derived(stateBet.activeBetModeKey === 'SUPERSPIN');
	// superspin is hold'n'spin: what matters is how many respins REMAIN
	// (3 → 2 → 1, snapping back to 3 whenever a coin lands)
	const remaining = $derived(Math.max(0, total - (current - 1)));
	const title = $derived(isSuperspin ? gameText('respins') : gameText('freeSpins'));

	// ── the counter MOVES ────────────────────────────────────────────────────
	//
	// It was a static readout: the number changed between spins and nothing else
	// happened, including on a retrigger — the one moment in the feature where
	// the player is being handed something. A spin being spent gets a small
	// knock; spins being ADDED get a hard punch and a gold flash over the plaque,
	// because those are two different pieces of news.
	let punchAt = $state(0);
	let punchForce = $state(0);
	let now = $state(0);
	let clock = 0;

	const PUNCH_MS = 520;

	// THE PLAQUE TAKES THE KNOCK (meshWin/sheets.ts poseCounter): a ripple out
	// from the count and the ankh swinging on its loop. Knocks add, so a
	// retrigger landing on a spent spin's tap is both.
	const counterGrid = buildCounterGrid();
	let plaqueKnocks: CounterKnock[] = [];
	const plaqueClock = () => performance.now() / 1000;
	const poseThePlaque = (out: Float32Array) => poseCounter(counterGrid, plaqueKnocks, plaqueClock(), out);

	const knock = (force: number) => {
		const t = plaqueClock();
		plaqueKnocks = [...plaqueKnocks.filter((k) => t - k.at < COUNTER_KNOCK_S), { at: t, force }];
		punchAt = Date.now();
		punchForce = force;
		now = punchAt;
		clearInterval(clock);
		// a timer rather than requestAnimationFrame: rAF stops dead in a hidden
		// tab, and this runs unattended through an 18-spin feature
		clock = setInterval(() => {
			now = Date.now();
			if (now - punchAt > PUNCH_MS) {
				clearInterval(clock);
				clock = 0;
			}
		}, 16) as unknown as number;
	};

	$effect(() => () => clearInterval(clock));

	// 1 → 0 over PUNCH_MS, springy at the start
	const punch = $derived.by(() => {
		const p = (now - punchAt) / PUNCH_MS;
		if (punchAt === 0 || p < 0 || p > 1) return 0;
		return Math.sin(p * Math.PI) * (1 - p) * punchForce;
	});

	context.eventEmitter.subscribeOnMount({
		freeSpinCounterShow: () => (show = true),
		freeSpinCounterHide: () => {
			show = false;
			runSymbol = null;
		},
		runSymbol: ({ symbol }) => {
			runSymbol = symbol;
			if (symbol && symbol !== 'pending') {
				badgeAt = Date.now();
				knock(0.9);
			}
		},
		freeSpinCounterUpdate: (emitterEvent) => {
			const gained = emitterEvent.total !== undefined && emitterEvent.total > total && total > 0;
			const spent = emitterEvent.current !== undefined && emitterEvent.current !== current;
			if (emitterEvent.current !== undefined) current = emitterEvent.current;
			if (emitterEvent.total !== undefined) total = emitterEvent.total;
			if (gained) knock(1);
			else if (spent) knock(0.38);
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
			g.lineStyle(2, 0x54330a, 1);
			g.beginFill(lit ? 0xffd75e : 0x1c260c, lit ? 1 : 0.85);
			g.drawCircle(startX + i * gap, y, panelSizes.width * 0.035);
			g.endFill();
		}
	};
</script>

<MainContainer>
	<FadeContainer {show} {...position}>
		<SheetMesh
			layers={[{ key: 'gbFsPanel' }]}
			grid={counterGrid}
			artWidth={COUNTER.w}
			artHeight={COUNTER.h}
			x={panelSizes.width / 2}
			y={panelSizes.height / 2}
			width={panelSizes.width}
			height={panelSizes.height}
			pose={poseThePlaque}
		/>

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
				fill: [0xfff3bd, 0xffd75e, 0xc9821a],
				stroke: 0x54330a,
				strokeThickness: 4,
				wordWrap: false,
			}}
		/>

		<!-- the plaque takes the news too: a gold wash on a retrigger, a hint of
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
			<Container
				x={panelSizes.width * 0.5}
				y={panelSizes.height * 0.55}
				scale={1 + 0.26 * punch}
			>
				<GoldText x={0} y={0} text={remaining} fontSize={panelSizes.width * 0.3} />
			</Container>
			<Graphics draw={drawPips} />
		{:else}
			<!-- free game: current spin of total -->
			<Container
				x={panelSizes.width * 0.5}
				y={panelSizes.height * 0.58}
				scale={1 + 0.26 * punch}
			>
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

	<!-- the run's symbol, in the screen's top-right corner; fades with the plaque -->
	<FadeContainer {show}>
		{#if runSymbol && !isSuperspin}
			<!-- the medal: a stone plate in a gold rim, over the plaque's corner -->
			<Container x={badge.x} y={badge.y} scale={1 + 0.5 * badgePop}>
				<Graphics
					draw={(g) => {
						g.clear();
						const r = badge.size / 2;
						g.roundRect(-r - 3, -r - 1, r * 2 + 6, r * 2 + 6, 12).fill({ color: 0x000000, alpha: 0.4 });
						g.roundRect(-r, -r, r * 2, r * 2, 11).fill({ color: 0xe8ae3c });
						g.roundRect(-r + 4, -r + 4, r * 2 - 8, r * 2 - 8, 8).fill({ color: 0x14171a });
						g.roundRect(-r + 4, -r + 4, r * 2 - 8, r * 2 - 8, 8).stroke({
							width: 1.6,
							color: 0xfff3c4,
							alpha: 0.6,
						});
					}}
				/>
				{#if runAssetKey}
					<Sprite key={runAssetKey} anchor={0.5} width={badge.size * 0.84} height={badge.size * 0.84} />
				{:else}
					<GoldText x={0} y={0} text="?" fontSize={badge.size * 0.62} />
				{/if}
			</Container>
		{/if}

	</FadeContainer>
</MainContainer>
