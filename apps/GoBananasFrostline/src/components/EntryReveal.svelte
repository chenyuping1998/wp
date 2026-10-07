<script lang="ts">
	import { onMount } from 'svelte';
	import { Container } from 'pixi-svelte';
	import { CanvasSizeRectangle, MainContainer } from 'components-layout';

	import { getContext } from '../game/context';
	import FxBurst from './FxBurst.svelte';
	import IcePaneShatter, { BREAK_MS, SHATTER_END_MS } from './IcePaneShatter.svelte';

	// Entry reveal, played once when the loading screen hands over. Go Bananas
	// Boat yanks a tarp off its board; this board opens FROZEN OVER: a pane of
	// frosted ice (IcePaneShatter) shivers while cracks run out from the
	// middle, then shatters from the centre outward — a cold white flash, a
	// frost burst and the ice crack on the break — and the shards fall away.
	//
	// (It was five dark column covers fading left to right, drawn through the
	// beginFill shim — which is where the frost burst and flash came from.)
	//
	// Timed on setInterval, not rAF: rAF stops in a hidden tab, and a reveal
	// started just before the tab was hidden would leave the board under ice.
	const T_TOTAL = SHATTER_END_MS / 1000;
	const BREAK = BREAK_MS / 1000;

	const context = getContext();

	let t = $state(0);

	onMount(() => {
		const start = Date.now();
		let cracked = false;
		const id = setInterval(() => {
			t = (Date.now() - start) / 1000;
			if (!cracked && t >= BREAK) {
				cracked = true;
				context.eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_ice_crack' });
			}
			if (t >= T_TOTAL) clearInterval(id);
		}, 16);
		return () => clearInterval(id);
	});

	// the flash is ON the break, cold rather than white-hot
	const flashAlpha = $derived(t >= BREAK && t < BREAK + 0.18 ? 0.4 * (1 - (t - BREAK) / 0.18) : 0);
</script>

{#if t < T_TOTAL}
	<MainContainer>
		<!-- own container: IcePaneShatter adds itself at its parent's end -->
		<Container>
			<IcePaneShatter
				x={context.stateGameDerived.boardLayout().x}
				y={context.stateGameDerived.boardLayout().y}
				width={context.stateGameDerived.boardLayout().width * context.stateGameDerived.boardLayout().scale * 1.05}
				height={context.stateGameDerived.boardLayout().height * context.stateGameDerived.boardLayout().scale * 1.05}
				t={t * 1000}
			/>
		</Container>
		{#if t > BREAK}
			<FxBurst
				x={context.stateGameDerived.boardLayout().x}
				y={context.stateGameDerived.boardLayout().y}
				scale={1.4}
				flavour="frost"
			/>
		{/if}
	</MainContainer>
	{#if flashAlpha > 0}
		<CanvasSizeRectangle backgroundColor={0xe6f6ff} backgroundAlpha={flashAlpha} />
	{/if}
{/if}
