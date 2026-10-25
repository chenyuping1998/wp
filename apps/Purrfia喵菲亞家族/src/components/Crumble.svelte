<script lang="ts">
	import { onMount } from 'svelte';
	import { Container, Sprite } from 'pixi-svelte';

	import { SYMBOL_SIZE } from '../game/constants';
	import SymbolFragments from './SymbolFragments.svelte';

	
	type Props = {
		x: number;
		y: number;
		delay?: number;
		durationMs?: number;
		assetKey?: string;
		width?: number;
		height?: number;
		seed?: number;
		oncomplete: () => void;
	};

	const props: Props = $props();

	const DURATION = props.durationMs ?? 270;
	const seed = Math.random();
	const chips = Array.from({ length: 4 }, (_, i) => ({
		vx: (i - 1.5) * 0.9 + (seed - 0.5) * 0.6,
		vy: -1.1 - ((i * 7 + seed * 5) % 3) * 0.35,
		spin: (i % 2 ? 1 : -1) * (2 + seed * 3),
		size: 0.22 + ((i * 3 + seed * 7) % 4) * 0.04,
	}));

	let t = $state(0);

	onMount(() => {
		let completed = false;
		const finish = () => {
			if (!completed) {
				completed = true;
				props.oncomplete();
			}
		};
		let raf = 0;
		let start = 0;
		const tick = (now: number) => {
			if (!start) start = now + (props.delay ?? 0);
			t = Math.max(0, (now - start) / DURATION);
			if (t >= 1) {
				finish();
				return;
			}
			raf = requestAnimationFrame(tick);
		};
		raf = requestAnimationFrame(tick);
		// rAF stops in a hidden tab; never leave chips stranded
		const fallback = setTimeout(finish, DURATION + (props.delay ?? 0) + 300);
		return () => {
			cancelAnimationFrame(raf);
			clearTimeout(fallback);
		};
	});
</script>

{#if props.assetKey}<Container x={props.x} y={props.y}>
 <Sprite key={props.assetKey} anchor={.5} y={-SYMBOL_SIZE*.45*t} width={(props.width??SYMBOL_SIZE)*(1-.7*t)} height={(props.height??SYMBOL_SIZE)*(1-.7*t)} alpha={1-t}/>
 <Sprite key="catPaw" anchor={.5} y={-SYMBOL_SIZE*.52-SYMBOL_SIZE*.45*t} width={SYMBOL_SIZE*.8} height={SYMBOL_SIZE*.8} alpha={Math.sin(Math.min(1,t)*Math.PI)}/>
</Container>{/if}
