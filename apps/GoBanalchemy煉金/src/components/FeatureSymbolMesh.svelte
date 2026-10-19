<script lang="ts">
	/**
	 * A symbol on the feature card (FeatureIntro), playing its board mesh on a
	 * loop: the static sprite, then the act through SymbolMeshWin, a rest, and
	 * again. Every mesh act ends exactly at rest (meshRig `settled`), so the
	 * hand-back to the sprite is invisible, as it is on the reels.
	 *
	 * SymbolMeshWin works in board units (SYMBOL_SIZE) and puts its layers on
	 * its grandparent, so it sits two containers down: the outer one places and
	 * scales it to `size`, the inner one is the parent it asks for.
	 */
	import { Container, Sprite } from 'pixi-svelte';
	import { onMount } from 'svelte';

	import SymbolMeshWin from './SymbolMeshWin.svelte';
	import { SYMBOL_SIZE } from '../game/constants';
	import { getSymbolInfo } from '../game/utils';
	import type { RawSymbol } from '../game/types';
	import type { MeshWinSpec } from '../game/meshWin';

	type Props = {
		symbol: string;
		/** what to play; default the symbol's win */
		spec?: MeshWinSpec;
		x: number;
		y: number;
		/** on-screen size of the symbol's art */
		size: number;
		/** ms before the first play, and between plays */
		delay?: number;
		gap?: number;
	};
	const props: Props = $props();

	const symbolInfo = $derived(getSymbolInfo({ rawSymbol: { name: props.symbol } as RawSymbol, state: 'win' }));
	const artSize = $derived(SYMBOL_SIZE * symbolInfo.sizeRatios.height);
	const scale = $derived(props.size / artSize);

	let playing = $state(false);
	let take = $state(0);
	let timer: ReturnType<typeof setTimeout> | undefined;

	const play = () => {
		take += 1;
		playing = true;
	};
	const done = () => {
		playing = false;
		timer = setTimeout(play, props.gap ?? 1400);
	};

	onMount(() => {
		timer = setTimeout(play, props.delay ?? 500);
		return () => clearTimeout(timer);
	});
</script>

<Container x={props.x} y={props.y} {scale}>
	{#if !playing}
		<Sprite key={symbolInfo.assetKey} anchor={0.5} width={artSize} height={artSize} />
	{/if}
	<Container>
		{#if playing}
			{#key take}
				<SymbolMeshWin
					{symbolInfo}
					symbolName={props.symbol}
					spec={props.spec}
					showWinFrame={false}
					x={0}
					y={0}
					oncomplete={done}
				/>
			{/key}
		{/if}
	</Container>
</Container>
