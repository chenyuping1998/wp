<script lang="ts">
	import { Sprite } from 'pixi-svelte';
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

	// THE BOARD CELL STAYS STILL WHILE IT WINS (2026-10-04).
	//
	// The win is acted by WinWays' popped copy above the scrim (SymbolMeshWin:
	// the subject leaps, flips, spins...). This cell is underneath it. It used to
	// pulse its scale and lay a warm yellow bloom over the tile, plus a grid
	// wobble — all hidden while the copy was up, and all showing the moment it
	// came down: the player saw a yellow-washed tile wobbling after every win,
	// and its pulse fought the jump. Asked for: no yellow under a winning
	// symbol. So the cell just shows its own tile (the split tile on a cut cell:
	// Symbol.svelte passes that in symbolInfo).
	onMount(() => {
		// complete immediately so the game state machine is not blocked
		props.oncomplete?.();
	});

	const w = $derived(SYMBOL_SIZE * props.symbolInfo.sizeRatios.width);
	const h = $derived(SYMBOL_SIZE * props.symbolInfo.sizeRatios.height);
</script>

<Sprite x={props.x} y={props.y} anchor={0.5} key={props.symbolInfo.assetKey} width={w} height={h} />
