<script lang="ts">
	import { Container } from 'pixi-svelte';
	import SackBadge from './SackBadge.svelte';

	import SymbolSprite from './SymbolSprite.svelte';
import RadioSymbolArt from './RadioSymbolArt.svelte';
	import SymbolWinAnim from './SymbolWinAnim.svelte';
	import SymbolMeshWin from './SymbolMeshWin.svelte';
	import { MESH_LANDS } from '../game/meshWin';
	import { getSymbolInfo } from '../game/utils';
	import type { SymbolState, RawSymbol } from '../game/types';
	import { SYMBOL_SIZE } from '../game/constants';
	import { symbolIdleFrame, idlePhase } from '../game/symbolIdleMotion';
	import { idleClock, useIdleClock } from '../game/idleClock.svelte';

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
		// board row of this cell, for the idle stagger (ReelSymbol)
		row?: number;
	};

	const props: Props = $props();
	const symbolInfo = $derived(getSymbolInfo({ rawSymbol: props.rawSymbol, state: props.state }));
	const isSprite = $derived(symbolInfo.type === 'sprite');
	const isWin = $derived(props.state === 'win');

	// Legacy mining meshes stay disabled; radio symbols use RadioSymbolArt.
	const isMeshWin = $derived(false);
	const lowLetter = undefined;
	// The dynamite's landing is a mesh too (meshWin/landB.ts): the bundle hits
	// and squashes, the fuse whips and fizzes. SymbolMeshWin plays any spec;
	// this one reports the land complete instead of a win.
	const isMeshLand = $derived(props.state === 'land' && props.rawSymbol.name in MESH_LANDS);

	// Settled board: each symbol's own idle loop + signature act
	// (game/symbolIdleMotion.ts). Only while resting, so spin/land/win own the
	// transform; the Pack badge stays put so its value is always readable.
	const idling = $derived(props.state === 'static' || props.state === 'postWinStatic');
	$effect(() => {
		if (idling || isWin) return useIdleClock();
	});
	const idle = $derived(
		idling ? symbolIdleFrame(props.rawSymbol.name, idleClock.t, idlePhase(props.reelIndex ?? 0, props.row ?? 0)) : undefined,
	);
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
  <SymbolWinAnim {symbolInfo} symbolName={props.rawSymbol.name} x={0} y={0} {oncomplete} />
 {:else if isSprite && idling}
  {#key symbolInfo.assetKey}
  <RadioSymbolArt assetKey={symbolInfo.assetKey} name={props.rawSymbol.name}
   width={SYMBOL_SIZE*symbolInfo.sizeRatios.width} height={SYMBOL_SIZE*symbolInfo.sizeRatios.height}
   ms={idleClock.t} reelMs={idleClock.t} actU={idle?.actU??-1} />
  {/key}
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

	{/if}
{/snippet}

<Container
	x={(props.x ?? 0) + (idle ? idle.dx * SYMBOL_SIZE : 0)}
	y={(props.y ?? 0) + (idle ? idle.dy * SYMBOL_SIZE : 0)}
	rotation={idle?.rotation ?? 0}
	scale={{ x: idle?.scaleX ?? 1, y: idle?.scaleY ?? 1 }}
	alpha={idle?.alpha ?? 1}
>
	{@render body(props.oncomplete)}
</Container>

{#if props.rawSymbol.prize}
	<!-- Signal Pack value, in BET MULTIPLES as the maths sends it (5 = 5x bet).
	     The user asked for it to read at a glance (袋子的倍數太不明顯), so it is a
	     stamp, not loose type — see SackBadge. -->
	<SackBadge prize={props.rawSymbol.prize} x={props.x ?? 0} y={(props.y ?? 0) - SYMBOL_SIZE * 0.1} />
{/if}
