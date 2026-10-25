<script lang="ts">
	import { onMount } from 'svelte';
	import { Container, Sprite } from 'pixi-svelte';
	import { getContext } from '../game/context';

	type Props = { oncomplete: () => void; oncover?: () => void };
	const props: Props = $props();
	const context = getContext();
	// The cast no longer throws anything into the transition (user,
	// 2026-10-23, as Putt 10-18): the saucer flies in on its own, straight away.
	const LEAD = 0;
	const IN = 900, HOLD = 380, OUT = 850;
	const COVER_AT = LEAD + IN + 80;
	const TOTAL = LEAD + IN + HOLD + OUT;
	const ease = (k: number) => k * k * (3 - 2 * k);
	let elapsed = $state(0);
	let covered = false, complete = false;
	const canvas = $derived(context.stateLayoutDerived.canvasSizes());
	// At centre the saucer is larger than the screen diagonal, so the
	// base/FG scene and the character rig can be exchanged under solid ink.
	const diameter = $derived(Math.hypot(canvas.width, canvas.height) * 1.28);
	const ballX = $derived.by(() => {
		const t = elapsed - LEAD;
		const start = -diameter / 2 - 20, mid = canvas.width / 2;
		const end = canvas.width + diameter / 2 + 20;
		if (t <= 0) return start;
		if (t < IN) return start + (mid - start) * ease(t / IN);
		if (t < IN + HOLD) return mid;
		return mid + (end - mid) * ease(Math.min(1, (t - IN - HOLD) / OUT));
	});
	const rotation = $derived(Math.sin(elapsed / 280) * 0.055);
	const saucerY = $derived(canvas.height / 2 - Math.cos(elapsed / 420) * canvas.height * 0.018);
	onMount(() => {
		let previous = performance.now(), raf = 0;
		let flyStarted = false;
		const tick = (now: number) => {
			elapsed += Math.min(100, Math.max(0, now - previous));
			previous = now;
			if (!flyStarted && elapsed >= LEAD) {
				flyStarted = true;
				context.eventEmitter.broadcast({ type: 'soundSaucerFly' });
			}
			if (!covered && elapsed >= COVER_AT) {
				covered = true;
				context.eventEmitter.broadcast({ type: 'soundSaucerBeam' });
				props.oncover?.();
			}
			if (elapsed >= TOTAL) {
				if (!complete) { complete = true; props.oncomplete(); }
				return;
			}
			raf = requestAnimationFrame(tick);
		};
		raf = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(raf);
	});
</script>

<Container>
	{#if elapsed >= LEAD && elapsed < TOTAL}
		<Sprite key="smTransitionWipe" anchor={0.5} x={ballX} y={saucerY}
			rotation={rotation} width={diameter} height={diameter} />
	{/if}
</Container>
