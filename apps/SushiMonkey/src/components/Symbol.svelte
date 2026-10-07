<script lang="ts">
	import { Container, Sprite } from 'pixi-svelte';
	import SackBadge from './SackBadge.svelte';

	import SymbolSpine from './SymbolSpine.svelte';
	import SymbolSprite from './SymbolSprite.svelte';
	import SymbolWinAnim from './SymbolWinAnim.svelte';
	import SymbolMeshWin from './SymbolMeshWin.svelte';
	import { MESH_LANDS } from '../game/meshWin';
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
	};

	const props: Props = $props();
	const context = getContext();
	const symbolInfo = $derived(getSymbolInfo({ rawSymbol: props.rawSymbol, state: props.state }));
	const isSprite = $derived(symbolInfo.type === 'sprite');
	const isWin = $derived(props.state === 'win');
	// Symbols whose win is a deforming mesh (game/meshWin/*), the GoBananubis
	// method. The rest keep GB100's win moves (SymbolWinAnim) until they get one.
	// The inherited mesh wins contain miner-specific layers. Flat ink symbols
	// use the shared motion until their own print-style win rigs are authored.
	const isMeshWin = $derived(false);
	const lowLetter = $derived(({ L1: 'A', L2: 'K', L3: 'Q', L4: 'J', L5: '10' } as Record<string, string>)[props.rawSymbol.name]);
	// The dynamite's landing is a mesh too (meshWin/landB.ts): the bundle hits
	// and squashes, the fuse whips and fizzes. SymbolMeshWin plays any spec;
	// this one reports the land complete instead of a win.
	const isMeshLand = $derived(props.state === 'land' && props.rawSymbol.name in MESH_LANDS);

</script>

{#snippet body(oncomplete: (() => void) | undefined)}
	{#if isMeshLand}
		<SymbolMeshWin
			{symbolInfo}
			symbolName={props.rawSymbol.name}
			spec={MESH_LANDS[props.rawSymbol.name]}
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
		<Sprite key={props.rawSymbol.name==='H1'?'v8BackH1':props.rawSymbol.name==='H2'?'v8BackH2':props.rawSymbol.name==='S'?'v8BackS':'gbSymbolPaper'} anchor={0.5} width={SYMBOL_SIZE} height={SYMBOL_SIZE} />
	{/if}
	{@render body(props.oncomplete)}
</Container>

{#if props.rawSymbol.prize}
	<!-- Sushi Plate value, in BET MULTIPLES as the maths sends it (5 = 5x bet).
	     The user asked for it to read at a glance (袋子的倍數太不明顯), so it is a
	     stamp, not loose type — see SackBadge. -->
	<SackBadge prize={props.rawSymbol.prize} x={props.x ?? 0} y={(props.y ?? 0) - SYMBOL_SIZE * 0.1} />
{/if}
