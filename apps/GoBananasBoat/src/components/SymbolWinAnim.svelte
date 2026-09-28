<script lang="ts">
	import { Container, Sprite } from 'pixi-svelte';
	import { onMount } from 'svelte';

	import { SYMBOL_SIZE } from '../game/constants';
	import { getSymbolInfo } from '../game/utils';

	type Props = {
		x?: number;
		y?: number;
		symbolInfo: ReturnType<typeof getSymbolInfo>;
		oncomplete?: () => void;
	};

	const props: Props = $props();

	// THE BOARD'S OWN CELL, WHILE ITS WIN IS PRESENTED ABOVE IT.
	//
	// The win is presented entirely by WinWays: it draws a popped copy of every
	// winning cell above the scrim — the tile acting through its mesh
	// (SymbolMeshWin), its shadow and its frame. This cell, underneath, only has
	// to be the tile.
	//
	// It used to be more: a warm bloom filled over the whole tile and pulsed,
	// with a scale pulse. Covered by the copy it did nothing — but the board
	// keeps a cell in 'win' for WIN_ANIM_MIN_MS after the copy has gone (and the
	// idle replay leaves it there between passes), and in that gap the bloom was
	// what the player saw: a yellow square on every cell that had just paid.
	// So it is the tile, still.

	onMount(() => {
		// Signal complete immediately so the game state machine is not blocked.
		props.oncomplete?.();
	});

	const w = $derived(SYMBOL_SIZE * props.symbolInfo.sizeRatios.width);
	const h = $derived(SYMBOL_SIZE * props.symbolInfo.sizeRatios.height);
</script>

<!--
	Win state for sprite symbols. Rendered at local 0,0 inside whatever container
	Symbol.svelte places — which on a split cell is a half-width one, so this
	scales with the halves automatically and needs no knowledge of the split.
-->
<Container x={props.x} y={props.y}>
	<Sprite anchor={0.5} key={props.symbolInfo.assetKey} width={w} height={h} />
</Container>
