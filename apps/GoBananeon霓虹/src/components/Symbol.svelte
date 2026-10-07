<script lang="ts">
	import { Container } from 'pixi-svelte';

	import SymbolSpine from './SymbolSpine.svelte';
	import SymbolSprite from './SymbolSprite.svelte';
	import SymbolWinAnim from './SymbolWinAnim.svelte';
	import SymbolMeshWin from './SymbolMeshWin.svelte';
	import { MESH_WINS, MESH_LANDS, S_LANDS, MESH_IDLES } from '../game/meshWin';
	import { idleCells } from '../game/idleDirector';
	import { untrack } from 'svelte';
	import { getSymbolInfo } from '../game/utils';
	import type { SymbolState, RawSymbol } from '../game/types';
	import { getContext } from '../game/context';
	import { stateGame } from '../game/stateGame.svelte';
	import { SYMBOL_SIZE, BOARD_DIMENSIONS, isBigPrize, BIG_PRIZE_FILL, BIG_PRIZE_STROKE } from '../game/constants';
	import { bookEventAmountToCurrencyString } from 'utils-shared/amount';
	import GoldText from './GoldText.svelte';

	type Props = {
		x?: number;
		y?: number;
		reelIndex?: number;
		state: SymbolState;
		rawSymbol: RawSymbol;
		oncomplete?: () => void;
		loop?: boolean;
		// forwarded to SymbolSprite: reel speed 0..1, and how hard this symbol
		// lands (see ReelSymbol, which knows both the reel motion and the tier)
		blur?: number;
		impact?: number;
		/** the padded row on its reel — the idle breath's phase needs the cell */
		row?: number;
		/** the reel is teasing: lift this symbol out of the board */
		focus?: { scale: number; bloom: number };
	};

	const props: Props = $props();
	const context = getContext();
	const symbolInfo = $derived(getSymbolInfo({ rawSymbol: props.rawSymbol, state: props.state }));
	const isSprite = $derived(symbolInfo.type === 'sprite');
	const isWin = $derived(props.state === 'win');
	// Symbols whose win is a deforming mesh (game/meshWin/*), the GoBananubis
	// method. The rest keep GB100's win moves (SymbolWinAnim) until they get one.
	const isMeshWin = $derived(isWin && props.rawSymbol.name in MESH_WINS);
	// The dynamite's landing is a mesh too (meshWin/landB.ts): the bundle hits
	// and squashes, the fuse whips and fizzes. SymbolMeshWin plays any spec;
	// this one reports the land complete instead of a win.
	const isMeshLand = $derived(props.state === 'land' && props.rawSymbol.name in MESH_LANDS);
	// The Scatter lands harder with each one this spin (meshWin/landS.ts). The
	// count is read ONCE, as the landing starts: stateGame.scatterCounter has
	// already been raised for this one by the landing hook, and the ones that
	// land after it must not re-pick this one's tier mid-thud.
	const landSpec = $derived.by(() => {
		if (!isMeshLand) return undefined;
		if (props.rawSymbol.name !== 'S') return MESH_LANDS[props.rawSymbol.name];
		const n = untrack(() => context.stateGame.scatterCounter);
		return S_LANDS[n >= 3 ? 3 : n === 2 ? 2 : 1];
	});

	// THE IDLE ACT (game/meshWin/idles.ts, GoBananasBoat's system). While this
	// cell sits still on a visible row of a stopped reel and its symbol has an
	// act, it is on the idle director's register (game/idleDirector.ts); when
	// the director picks it, the act plays through SymbolMeshWin in place of
	// the sprite, exactly as the bomb's landing does, and hands back to the
	// sprite at rest.
	let idleAct = $state<number | null>(null);
	let idleId = 0;
	let idleTimer: ReturnType<typeof setTimeout> | undefined;
	const canIdle = $derived(
		props.state === 'static' &&
			isSprite &&
			props.rawSymbol.name in MESH_IDLES &&
			props.row !== undefined &&
			props.row >= 1 &&
			props.row <= BOARD_DIMENSIONS.y &&
			props.reelIndex !== undefined &&
			stateGame.board[props.reelIndex]?.reelState.motion === 'stopped',
	);
	$effect(() => {
		if (!canIdle) {
			idleAct = null;
			return;
		}
		const name = props.rawSymbol.name;
		const off = idleCells.add({
			name,
			play: () => {
				if (untrack(() => idleAct) !== null) return false;
				const mine = ++idleId;
				idleAct = mine;
				// a backstop: the act reports its own end (oncomplete below)
				clearTimeout(idleTimer);
				idleTimer = setTimeout(() => {
					if (idleAct === mine) idleAct = null;
				}, MESH_IDLES[name].durationMs + 400);
				return true;
			},
		});
		return () => {
			off();
			clearTimeout(idleTimer);
		};
	});
	const endIdle = () => (idleAct = null);
</script>

{#snippet body(oncomplete: (() => void) | undefined)}
	{#if isMeshLand}
		<SymbolMeshWin
			{symbolInfo}
			symbolName={props.rawSymbol.name}
			spec={landSpec}
			showWinFrame={false}
			x={0}
			y={0}
			{oncomplete}
		/>
	{:else if isMeshWin}
		<SymbolMeshWin
			{symbolInfo}
			symbolName={props.rawSymbol.name}
			reel={props.reelIndex}
			showWinFrame={props.rawSymbol.name !== 'S'}
			x={0}
			y={0}
			{oncomplete}
		/>
	{:else if isSprite && idleAct !== null && canIdle}
		{#key idleAct}
			<SymbolMeshWin
				{symbolInfo}
				symbolName={props.rawSymbol.name}
				spec={MESH_IDLES[props.rawSymbol.name]}
				showWinFrame={false}
				x={0}
				y={0}
				oncomplete={endIdle}
			/>
		{/key}
	{:else if isSprite && isWin}
		<!-- Win state for sprite symbols: GB100's per-symbol win move -->
		<SymbolWinAnim {symbolInfo} symbolName={props.rawSymbol.name} x={0} y={0} {oncomplete} />
	{:else if isSprite}
		<SymbolSprite
			{symbolInfo}
			x={0}
			y={0}
			blur={props.state === 'spin' ? (props.blur ?? 1) : 0}
			landing={props.state === 'land'}
			impact={props.impact}
			symbolName={props.rawSymbol.name}
			cell={props.reelIndex !== undefined && props.row !== undefined ? { reel: props.reelIndex, row: props.row } : undefined}
			focus={props.focus}
			{oncomplete}
		/>
	{:else}
		<SymbolSpine
			loop={props.loop}
			{symbolInfo}
			x={0}
			y={0}
			listener={{
				complete: oncomplete,
				event: (_, event) => {
					if (event.data?.name === 'wildExplode') {
						context.eventEmitter?.broadcast({ type: 'soundOnce', name: 'sfx_wild_explode' });
					}
				},
			}}
		/>
	{/if}
{/snippet}

<Container x={props.x ?? 0} y={props.y ?? 0}>
	{@render body(props.oncomplete)}
</Container>

<!-- NOTE: nothing in this game assigns a per-cell `multiplier`. Gen-3 used it to
     carry the machete's split, which is why the type still has the field and why
     the ways evaluator is still called with multiplier_strategy="symbol" — with
     no cell ever carrying one, that path is inert and every cell counts once.
     A blast changes a cell's SYMBOL, not its count. -->

{#if props.rawSymbol.prize}
	<!--
		Superspin coin value. This is the copy drawn on the reel as a coin lands;
		StickyPrizes draws the held ones. Both have to grade identically or a coin
		would change colour the instant it sticks — the previous pass only updated
		StickyPrizes, so high-value coins landed in plain gold and only turned
		amber a beat later.
	-->
	<GoldText
		x={props.x ?? 0}
		y={props.y ?? 0}
		text={bookEventAmountToCurrencyString(props.rawSymbol.prize)}
		fontSize={28}
		anchor={0.5}
		fill={isBigPrize(props.rawSymbol.prize) ? BIG_PRIZE_FILL : undefined}
		stroke={isBigPrize(props.rawSymbol.prize) ? BIG_PRIZE_STROKE : undefined}
	/>
{/if}
