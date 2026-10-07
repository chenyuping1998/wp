<script lang="ts">
	import { onMount } from 'svelte';
	import { CanvasSizeRectangle, MainContainer } from 'components-layout';

	import { getContext } from '../game/context';
	import FxBurst from './FxBurst.svelte';
	import TarpPeel from './TarpPeel.svelte';
	import { Container } from 'pixi-svelte';

	// Entry reveal, played once when the loading screen hands over: a quick
	// white pop and a gold burst over the board, then the five reels uncover
	// left→right in a wave.
	// the board opens under a tarp that is yanked off (TarpPeel, 2026-10-03):
	// it strains for 0.26s and is gone by ~1.0s; the burst goes with the yank
	const T_TOTAL = 1.15;
	const YANK_AT = 0.26;

	const context = getContext();

	let t = $state(0);

	onMount(() => {
		let raf = 0;
		let start = 0;
		const tick = (now: number) => {
			if (!start) start = now;
			t = (now - start) / 1000;
			if (t >= T_TOTAL) return;
			raf = requestAnimationFrame(tick);
		};
		raf = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(raf);
	});

	const flashAlpha = $derived(t < 0.16 ? 0.45 * (1 - t / 0.16) : 0);

</script>

{#if t < T_TOTAL}
	<MainContainer>
		<!-- own container: TarpPeel adds itself at its parent's end -->
		<Container>
			<TarpPeel
				x={context.stateGameDerived.boardLayout().x}
				y={context.stateGameDerived.boardLayout().y}
				width={context.stateGameDerived.boardLayout().width * 1.05}
				height={context.stateGameDerived.boardLayout().height * 1.05}
				t={t * 1000}
			/>
		</Container>
		{#if t > YANK_AT}
			<FxBurst
				x={context.stateGameDerived.boardLayout().x}
				y={context.stateGameDerived.boardLayout().y}
				scale={1.4}
				flavour="cargo"
			/>
		{/if}
	</MainContainer>
	{#if flashAlpha > 0}
		<CanvasSizeRectangle backgroundColor={0xffffff} backgroundAlpha={flashAlpha} />
	{/if}
{/if}
