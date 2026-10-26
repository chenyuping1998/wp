<script lang="ts">
	// Compact contact accents, kept under this legacy component name. No smoke.
	import { onMount } from 'svelte';
	import { Container, Graphics } from 'pixi-svelte';
	type Props = { x?: number; y?: number; durationMs?: number; oncomplete?: () => void };
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
	<Graphics draw={(g) => {
		g.clear(); const alpha = (1 - t) ** 1.5;
		g.ellipse(0, 0, 14 + 17 * t, 1.2).fill({ color: 0xefe8d8, alpha: alpha * 0.30 });
		for (const side of [-1, 1]) g.moveTo(side * (12 + t * 12), -1).lineTo(side * (21 + t * 17), -3 - t * 4).stroke({ width: 1.3, color: 0xf2c14e, alpha: alpha * 0.55 });
	}} />
</Container>
