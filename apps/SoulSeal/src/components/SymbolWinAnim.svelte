<script lang="ts">
	import { Container, Sprite } from 'pixi-svelte';
	import { onMount } from 'svelte';
	import { stateBet } from 'state-shared';

	import { SYMBOL_SIZE, WIN_HOLD_MS, WIN_HOLD_TURBO_MS } from '../game/constants';
	import { getSymbolInfo } from '../game/utils';

	type Props = {
		x?: number;
		y?: number;
		symbolInfo: ReturnType<typeof getSymbolInfo>;
		oncomplete?: () => void;
		// Hold at rest instead of popping. For the SCATTER, which is never a line
		// win - the only time it animates is a trigger, and a trigger already has
		// its own presentation drawn around the cell by ScatterTrigger: a breathing
		// halo with motes going round it. The symbol jumping inside that halo is a
		// second, louder effect saying the same thing, and the two do not agree
		// with each other - one is a held charge, the other is a bounce.
		//
		// The hold still runs; only the scale is suppressed. Everything the timing
		// depends on, including when oncomplete fires, is unchanged.
		still?: boolean;
	};

	const props: Props = $props();

	// Elapsed time, 0..1 over WIN_HOLD_MS.
	let t = $state(0);

	onMount(() => {
		// oncomplete is deliberately NOT called here.
		//
		// It used to be, "so the state machine isn't blocked" - but Board awaits
		// exactly that callback and then moves the symbol to 'postWinStatic', which
		// unmounts this component. Firing it on mount meant every win animation was
		// created and destroyed inside a single frame: the glow existed for about
		// 16ms and players could not tell which symbols had paid. The hold below is
		// the animation; oncomplete goes at the end of it.
		// Board awaits this, so the hold is also the pace of the spin. Turbo gets a
		// much shorter one - a base game hits about one spin in three, and a full
		// second of held highlight on every one of them is what makes turbo stop
		// feeling like turbo.
		const hold = stateBet.isTurbo ? WIN_HOLD_TURBO_MS : WIN_HOLD_MS;
		const start = performance.now();
		let raf = 0;
		const step = (now: number) => {
			t = Math.min(1, (now - start) / hold);
			if (t < 1) {
				raf = requestAnimationFrame(step);
			} else {
				props.oncomplete?.();
			}
		};
		raf = requestAnimationFrame(step);
		return () => cancelAnimationFrame(raf);
	});

	// A hard pop on arrival, then a slower breathing pulse. The pop is what the
	// eye catches; the pulse is what keeps it caught while the rest of the volley
	// lands.
	const pop = $derived(Math.exp(-14 * t) * Math.sin(t * 34));
	const pulse = $derived(0.5 + 0.5 * Math.sin(t * 16));
	const scale = $derived(props.still ? 1 : 1 + 0.3 * Math.max(0, pop) + 0.1 * pulse);
</script>

<!--
  Win presentation for sprite symbols: the scale pop and the breathing pulse,
  and nothing else.

  It used to draw a phosphor ring, a hot core and a bloom behind the art. The
  reference title has none of that - the paying symbols simply grow and keep
  breathing while everything that did not pay is dimmed, and the whole effect is
  legible because of the CONTRAST, not because of anything added on top. Three
  glowing rings on a board of ornate gold symbols read as noise.
-->
<Container x={props.x} y={props.y} {scale}>
	<Sprite
		anchor={0.5}
		key={props.symbolInfo.assetKey}
		width={SYMBOL_SIZE * props.symbolInfo.sizeRatios.width}
		height={SYMBOL_SIZE * props.symbolInfo.sizeRatios.height}
	/>
</Container>
