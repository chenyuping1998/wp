<script lang="ts">
	import { Container, Sprite } from 'pixi-svelte';
	import SackBadge from './SackBadge.svelte';

	import SymbolSpine from './SymbolSpine.svelte';
	import SymbolSprite from './SymbolSprite.svelte';
	import SymbolWinAnim from './SymbolWinAnim.svelte';
	import SymbolMeshWin from './SymbolMeshWin.svelte';
	import { IDLES, MESH_LANDS, MESH_WINS } from '../game/meshWin';
	import { idleCells } from '../game/idleDirector';
	import { BOARD_DIMENSIONS } from '../game/constants';
	import { getSymbolInfo } from '../game/utils';
	import type { SymbolState, RawSymbol } from '../game/types';
	import { getContext } from '../game/context';
	import { stateGame } from '../game/stateGame.svelte';
	import { SYMBOL_SIZE } from '../game/constants';

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
		/** the padded row on its reel: only cells in view idle */
		row?: number;
	};

	const props: Props = $props();
	const context = getContext();
	const symbolInfo = $derived(getSymbolInfo({ rawSymbol: props.rawSymbol, state: props.state }));
	const isSprite = $derived(symbolInfo.type === 'sprite');
	const isWin = $derived(props.state === 'win');
	// Symbols whose win is a deforming mesh (game/meshWin/*, 2026-10-09): the
	// card stays still and the painting — or the royal's letter — leaps off it.
	// Anything without a rig keeps GB100's whole-tile win move (SymbolWinAnim).
	const isMeshWin = $derived(isWin && props.rawSymbol.name in MESH_WINS);
	const lowLetter = $derived(({ L1: 'A', L2: 'K', L3: 'Q', L4: 'J', L5: '10' } as Record<string, string>)[props.rawSymbol.name]);
	// The paintings land through their mesh (meshWin/lands.ts): the body
	// squashes on its card and the loose part reacts. SymbolMeshWin plays any
	// spec; this one reports the land complete instead of a win.
	const isMeshLand = $derived(props.state === 'land' && props.rawSymbol.name in MESH_LANDS);

	// THE IDLE ACT (game/meshWin/idles.ts, GoBananasBoat's method): while this
	// cell sits settled and in view it is on the idle director's register
	// (game/idleDirector.ts), and when it is picked it plays a small act through
	// its own mesh in place of the sprite. Anything that moves the cell — a spin,
	// a landing, a win — takes it off the register at once. A cup carrying a
	// prize stays still: its badge does not ride the mesh.
	let idleAct = $state<{ id: number } | null>(null);
	let idleId = 0;
	const idleable = $derived(
		isSprite &&
			props.state === 'static' &&
			(props.blur ?? 0) <= 0.01 &&
			!props.rawSymbol.prize &&
			props.row !== undefined &&
			props.row >= 1 &&
			props.row <= BOARD_DIMENSIONS.y &&
			props.rawSymbol.name in IDLES,
	);
	$effect(() => {
		if (!idleable) {
			idleAct = null;
			return;
		}
		return idleCells.add({
			name: props.rawSymbol.name,
			play: () => {
				if (idleAct) return false;
				idleAct = { id: ++idleId };
				return true;
			},
		});
	});

</script>

{#snippet body(oncomplete: (() => void) | undefined)}
	{#if isMeshLand}
		<SymbolMeshWin
			{symbolInfo}
			symbolName={props.rawSymbol.name}
			spec={MESH_LANDS[props.rawSymbol.name]}
			showWinFrame={false}
			fixedSpeed
			x={0}
			y={0}
			{oncomplete}
		/>
	{:else if idleAct && idleable}
		{#if lowLetter}
			<Sprite anchor={0.5} key={symbolInfo.assetKey} width={SYMBOL_SIZE * symbolInfo.sizeRatios.width} height={SYMBOL_SIZE * symbolInfo.sizeRatios.height} />
		{/if}
		{#key idleAct.id}
			<SymbolMeshWin
				{symbolInfo}
				symbolName={props.rawSymbol.name}
				spec={IDLES[props.rawSymbol.name]}
				letter={lowLetter}
				showWinFrame={false}
				x={0}
				y={0}
				oncomplete={() => (idleAct = null)}
			/>
		{/key}
	{:else if isMeshWin}
		{#if lowLetter}
			<!-- the royal's label stays put; only its letter leaps -->
			<Sprite anchor={0.5} key={symbolInfo.assetKey} width={SYMBOL_SIZE * symbolInfo.sizeRatios.width} height={SYMBOL_SIZE * symbolInfo.sizeRatios.height} />
		{/if}
		<SymbolMeshWin
			{symbolInfo}
			symbolName={props.rawSymbol.name}
			letter={lowLetter}
			reel={props.reelIndex}
			showWinFrame={props.rawSymbol.name !== 'S'}
			x={0}
			y={0}
			{oncomplete}
		/>
	{:else if isSprite && isWin}
		<!-- Win state for sprite symbols: GB100's per-symbol win move -->
		<SymbolWinAnim {symbolInfo} symbolName={props.rawSymbol.name} letter={lowLetter} x={0} y={0} {oncomplete} />
	{:else if isSprite}
		<SymbolSprite
			{symbolInfo}
			x={0}
			y={0}
			blur={props.state === 'spin' ? (props.blur ?? 1) : 0}
			landing={props.state === 'land'}
			impact={props.impact}
			letter={lowLetter}
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
	{#if !lowLetter}
		<!-- Shared menu-slip frame remains present in spin/land/win/static states. -->
		<Sprite key={props.rawSymbol.name==='H1'?'v8BackH1':props.rawSymbol.name==='H2'?'v8BackH2':props.rawSymbol.name==='S'?'v8BackS':props.rawSymbol.name==='P'?'gbPinPaper':'gbSymbolPaper'} anchor={0.5} width={SYMBOL_SIZE} height={SYMBOL_SIZE} />
	{/if}
	{@render body(props.oncomplete)}
</Container>

{#if props.rawSymbol.prize}
	<!-- Keep the value registered to the prize art's own blank label. -->
	<SackBadge prize={props.rawSymbol.prize} x={props.x ?? 0} y={props.y ?? 0} />
{/if}
