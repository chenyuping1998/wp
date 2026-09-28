<script lang="ts">
	import { Container, Sprite } from 'pixi-svelte';

	import SymbolSpine from './SymbolSpine.svelte';
	import SymbolSprite from './SymbolSprite.svelte';
	import SymbolWinAnim from './SymbolWinAnim.svelte';
	import SymbolMeshWin from './SymbolMeshWin.svelte';
	import { MESH_WINS } from '../game/meshWin';
	import { getSymbolInfo } from '../game/utils';
	import type { SymbolState, RawSymbol } from '../game/types';
	import { getContext } from '../game/context';
	import { stateGame } from '../game/stateGame.svelte';
	import {
		SYMBOL_SIZE,
		isBigPrize,
		BIG_PRIZE_FILL,
		BIG_PRIZE_STROKE,
		isMarkedSymbolName,
		unmarkSymbolName,
		GROW_MARKER_H,
		GROW_MARKER_W,
	} from '../game/constants';
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
		/** this cell is doing its idle beat on a waiting board (IdleActors) */
		idleActing?: boolean;
		/** how many reels this cell's win spans (WinWays), for the beat's size */
		winKind?: number;
	};

	const props: Props = $props();
	const context = getContext();
	const symbolInfo = $derived(getSymbolInfo({ rawSymbol: props.rawSymbol, state: props.state }));
	const isSprite = $derived(symbolInfo.type === 'sprite');
	const isWin = $derived(props.state === 'win');
	// Every symbol that can win in a ways pay acts through a deforming mesh
	// (game/meshWin/*, SymbolMeshWin) — the GoBananubis method. SymbolWinAnim's
	// pulse and bloom stay as the fallback for anything without a spec.
	// A marked cell ("H2G") is H2 with a badge on it, and acts as H2. A Scatter
	// on the Free Spins trigger plays the trigger beat instead of its win.
	const meshName = $derived.by(() => {
		const base = unmarkSymbolName(props.rawSymbol.name);
		return base === 'S' && stateGame.scatterTrigger ? 'S_TRIGGER' : base;
	});
	const isMeshWin = $derived(isWin && meshName in MESH_WINS);
	// ...and their LANDING, every spin: each lands its own way (a ring tip, a
	// hose, a banana) instead of the whole picture squashing (meshRig.landPose)
	const landName = $derived(unmarkSymbolName(props.rawSymbol.name));
	const isMeshLand = $derived(props.state === 'land' && landName in MESH_WINS);
	// ...and the idle beat of a Wild or Scatter while the board waits
	const idleName = $derived(`${landName}_IDLE`);
	const isMeshIdle = $derived(!!props.idleActing && idleName in MESH_WINS);

	// A grow marker rides on an ordinary symbol rather than being one, so the
	// maths sends "H2G" and getSymbolInfo already resolves that to H2's art. What
	// is left is the badge itself, drawn over the cell's TOP-LEFT corner.
	//
	// Top-left is reserved for it by the art spec — no symbol may depend on that
	// corner to be identified — so the badge can be placed by a constant rather
	// than dodging each symbol's composition.
	const isMarked = $derived(isMarkedSymbolName(props.rawSymbol.name));
	// sized in constants, shared with ReelGrow's launch
	const MARKER_H = GROW_MARKER_H;
	const MARKER_W = GROW_MARKER_W;

</script>

{#snippet body(oncomplete: (() => void) | undefined)}
	{#if isMeshWin}
		<SymbolMeshWin
			{symbolInfo}
			symbolName={meshName}
			reel={props.reelIndex}
			kind={meshName === 'S_TRIGGER' ? undefined : props.winKind}
			x={0}
			y={0}
			{oncomplete}
		/>
	{:else if isMeshIdle}
		<SymbolMeshWin {symbolInfo} symbolName={idleName} reel={props.reelIndex} x={0} y={0} />
	{:else if isMeshLand}
		<SymbolMeshWin
			{symbolInfo}
			beat="land"
			impact={props.impact}
			symbolName={landName}
			reel={props.reelIndex}
			x={0}
			y={0}
			{oncomplete}
		/>
	{:else if isSprite && isWin}
		<!-- Win state for sprite symbols: programmatic scale+glow animation -->
		<SymbolWinAnim {symbolInfo} x={0} y={0} {oncomplete} />
	{:else if isSprite}
		<SymbolSprite
			{symbolInfo}
			x={0}
			y={0}
			blur={props.state === 'spin' ? (props.blur ?? 1) : 0}
			landing={props.state === 'land'}
			impact={props.impact}
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

{#if isMarked}
	<!--
		The grow marker. Drawn AFTER the symbol body so it sits over it, and
		anchored to the cell's top-left rather than to the artwork's, so it lands in
		the same place whatever is underneath.

		It separates by a hard dark contour and a bright core rather than by hue,
		because it has to stay legible over all six accent colours in the set — a
		coloured glow ring would have disappeared on the ice-cyan comet and the hot
		orange scatter, which are the two it most needs to be visible over.
	-->
	<Sprite
		key="gbGrowMarker"
		anchor={0}
		x={(props.x ?? 0) - SYMBOL_SIZE / 2}
		y={(props.y ?? 0) - SYMBOL_SIZE / 2}
		width={MARKER_W}
		height={MARKER_H}
	/>
{/if}

<!-- NOTE on `multiplier`: the FREE GAME assigns one — every cell of a stretched
     reel carries multiplier = 2, which is why the ways evaluator runs with
     multiplier_strategy="symbol" and why the doubling shows up in the ways
     figure rather than as a separate multiplier field. The base game assigns
     none, so there the path is inert and every cell counts once. -->

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
