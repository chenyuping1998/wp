<script lang="ts">
	import { onMount } from 'svelte';
	import { Sprite } from 'pixi-svelte';

	import { SYMBOL_SIZE } from '../game/constants';
	import { getSymbolInfo } from '../game/utils';

	type Props = {
		x?: number;
		y?: number;
		symbolInfo: ReturnType<typeof getSymbolInfo>;
		oncomplete?: () => void;
	};

	const props: Props = $props();

	const DURATION = 240;
	let t = $state(0);

	onMount(() => {
		let raf = 0;
		let start = 0;
		const tick = (now: number) => {
			if (!start) start = now;
			t = Math.min(1, (now - start) / DURATION);
			if (t >= 1) {
				props.oncomplete?.();
				return;
			}
			raf = requestAnimationFrame(tick);
		};
		raf = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(raf);
	});

	// squash on impact → stretch rebound → settle
	const squash = $derived.by(() => {
		if (t < 0.35) {
			const p = t / 0.35;
			return { x: 1 + 0.1 * p, y: 1 - 0.16 * p };
		}
		if (t < 0.7) {
			const p = (t - 0.35) / 0.35;
			return { x: 1.1 - 0.16 * p, y: 0.84 + 0.22 * p };
		}
		const p = (t - 0.7) / 0.3;
		return { x: 0.94 + 0.06 * p, y: 1.06 - 0.06 * p };
	});
</script>

<Sprite
	x={props.x}
	y={(props.y ?? 0) +
		(SYMBOL_SIZE * props.symbolInfo.sizeRatios.height * (1 - squash.y)) / 2}
	anchor={0.5}
	key={props.symbolInfo.assetKey}
	width={SYMBOL_SIZE * props.symbolInfo.sizeRatios.width * squash.x}
	height={SYMBOL_SIZE * props.symbolInfo.sizeRatios.height * squash.y}
/>
