<script lang="ts">
	import { Container, Sprite, Graphics } from 'pixi-svelte';
	import { onMount } from 'svelte';
	import { stateBet } from 'state-shared';

	import { SYMBOL_SIZE, WIN_HOLD_MS, WIN_HOLD_TURBO_MS, MULTIPLIER_FILL } from '../game/constants';
	import { getSymbolInfo } from '../game/utils';

	type Props = {
		x?: number;
		y?: number;
		symbolInfo: ReturnType<typeof getSymbolInfo>;
		oncomplete?: () => void;
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
	const scale = $derived(1 + 0.3 * Math.max(0, pop) + 0.1 * pulse);
	// Fade the ring out over the last fifth so the symbol settles rather than
	// snapping back to plain.
	const fade = $derived(t > 0.8 ? 1 - (t - 0.8) / 0.2 : 1);

	const RING = MULTIPLIER_FILL[1];
</script>

<!--
  Win presentation for sprite symbols: a scale pop, a phosphor ring and a bloom
  behind the art. No Spine track involved - the whole set is sprite-only.
-->
<Container x={props.x} y={props.y} {scale}>
	<Graphics
		draw={(g) => {
			g.clear();
			// bloom
			g.beginFill(RING, (0.1 + 0.2 * pulse) * fade);
			g.drawCircle(0, 0, SYMBOL_SIZE * 0.62);
			g.endFill();
			// hot core
			g.beginFill(RING, (0.14 + 0.22 * pulse) * fade);
			g.drawCircle(0, 0, SYMBOL_SIZE * 0.46);
			g.endFill();
			// ring, thick enough to read at reel size
			g.lineStyle(5, RING, (0.55 + 0.45 * pulse) * fade);
			g.drawCircle(0, 0, SYMBOL_SIZE * 0.5);
			g.lineStyle(2, 0xffffff, (0.35 + 0.35 * pulse) * fade);
			g.drawCircle(0, 0, SYMBOL_SIZE * 0.44);
		}}
	/>
	<Sprite
		anchor={0.5}
		key={props.symbolInfo.assetKey}
		width={SYMBOL_SIZE * props.symbolInfo.sizeRatios.width}
		height={SYMBOL_SIZE * props.symbolInfo.sizeRatios.height}
	/>
</Container>
