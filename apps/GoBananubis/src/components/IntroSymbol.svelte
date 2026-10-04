<script lang="ts">
	/**
	 * A symbol on the feature intro card, alive (FeatureIntro): the same mesh the
	 * board uses, at the card's own size.
	 *
	 *   'tease'  the Scatter sways from its knot for as long as the card is up —
	 *            the loop it holds on the board while a trigger is still open
	 *   'land'   a Sealed Tablet lands (the seal presses, the Eye flares): once
	 *            as the card comes up, after `delay` so a row of them lands in
	 *            turn, then again every `every` ms
	 *
	 * Drawn on top of the panel's art (onTop): the card paints its backdrop in
	 * the same container, and under it the symbol would not be seen.
	 */
	import { onMount } from 'svelte';

	import { SYMBOL_SIZE } from '../game/constants';
	import { getSymbolInfo } from '../game/utils';
	import type { RawSymbol } from '../game/types';
	import SymbolMeshWin from './SymbolMeshWin.svelte';

	type Props = {
		name: string;
		beat: 'tease' | 'land';
		x: number;
		y: number;
		size: number;
		delay?: number;
		every?: number;
	};

	const props: Props = $props();

	// the board's own info for the symbol, scaled so the mesh draws `size` wide
	const symbolInfo = $derived.by(() => {
		const info = getSymbolInfo({ rawSymbol: { name: props.name } as RawSymbol, state: 'static' });
		const r = props.size / SYMBOL_SIZE;
		return { ...info, sizeRatios: { width: r, height: r } };
	});

	let round = $state(0);
	let started = $state(props.beat === 'tease');
	onMount(() => {
		if (props.beat !== 'land') return;
		let every = 0;
		const first = setTimeout(() => {
			started = true;
			every = setInterval(() => round++, props.every ?? 2600) as unknown as number;
		}, props.delay ?? 0);
		return () => {
			clearTimeout(first);
			clearInterval(every);
		};
	});
</script>

{#if props.beat === 'tease'}
	<SymbolMeshWin
		{symbolInfo}
		beat="tease"
		active
		impact={1.05}
		symbolName={props.name}
		x={props.x}
		y={props.y}
		onTop
	/>
{:else if started}
	{#key round}
		<SymbolMeshWin
			{symbolInfo}
			beat="land"
			impact={1}
			symbolName={props.name}
			x={props.x}
			y={props.y}
			onTop
		/>
	{/key}
{:else}
	<!-- before its first landing: the mesh at rest is the drawing -->
	<SymbolMeshWin
		{symbolInfo}
		beat="land"
		impact={0}
		symbolName={props.name}
		x={props.x}
		y={props.y}
		onTop
	/>
{/if}
