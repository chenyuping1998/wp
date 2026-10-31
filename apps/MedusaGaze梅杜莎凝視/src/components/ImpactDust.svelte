<script lang="ts">
	// Compact, foot-anchored contact accents; no full-board shake.
	import { onMount } from 'svelte';
	import { Container, Graphics } from 'pixi-svelte';
	import { SYMBOL_SIZE } from '../game/constants';
	import { drawLandingAccent } from '../game/presentationFx';
	type Props = { x?: number; y?: number; durationMs?: number; strength?:number; oncomplete?: () => void };
	const props: Props = $props(); let t = $state(0);
	onMount(() => {
		const duration = props.durationMs ?? 135, start = performance.now(); let raf = 0, done = false;
		const finish = () => { if (!done) { done = true; t = 1; props.oncomplete?.(); } };
		const tick = (now: number) => { if (done) return; t = Math.min(1, (now - start) / duration); if (t < 1) raf = requestAnimationFrame(tick); else finish(); };
		raf = requestAnimationFrame(tick); const fallback = setTimeout(finish, duration + 100);
		return () => { done = true; cancelAnimationFrame(raf); clearTimeout(fallback); };
	});
</script>
<Container x={props.x ?? 0} y={props.y ?? 0}>
	<Graphics draw={(g) => drawLandingAccent(g,SYMBOL_SIZE,t,props.strength)} />
</Container>
