<script lang="ts">
	import { onMount } from 'svelte';
	import { Container, Sprite } from 'pixi-svelte';
	import { MainContainer } from 'components-layout';
	import { getContext } from '../game/context';

	type Props = { oncomplete: () => void; oncover?: () => void };
	const props: Props = $props();
	const context = getContext();
	const origin = context.stateGame.mascotThrowOrigin;
	const LEAD = origin ? 580 : 0;
	const IN = 900, HOLD = 380, OUT = 850;
	const COVER_AT = Math.max(LEAD + IN + 80, origin ? 1400 : 0);
	const TOTAL = LEAD + IN + HOLD + OUT;
	const ease = (k: number) => k * k * (3 - 2 * k);
	let elapsed = $state(0);
	let covered = false, complete = false;
	const canvas = $derived(context.stateLayoutDerived.canvasSizes());
	// At centre the bowling ball is larger than the screen diagonal, so the
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
	const rotation = $derived((ballX + diameter / 2) / (diameter / 2));
	const thrownProp = $derived.by(() => {
		if (!origin) return null;
		const k = (elapsed - 580) / 520;
		if (k < 0 || k > 1) return null;
		const board = context.stateGameDerived.boardLayout();
		return { x: origin.x + (board.x - origin.x) * k,
			y: origin.y + (board.y - origin.y) * k - Math.sin(k * Math.PI) * 220,
			rotation: k * Math.PI * 2 };
	});
	onMount(() => {
		if (origin) context.eventEmitter.broadcast({ type: 'mascotThrow' });
		let previous = performance.now(), raf = 0;
		let rollStarted = false;
		const tick = (now: number) => {
			elapsed += Math.min(100, Math.max(0, now - previous));
			previous = now;
			if (!rollStarted && elapsed >= LEAD) {
				rollStarted = true;
				context.eventEmitter.broadcast({ type: 'soundBowlingRoll' });
			}
			if (!covered && elapsed >= COVER_AT) {
				covered = true;
				context.eventEmitter.broadcast({ type: 'soundBowlingPins' });
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
	{#if thrownProp}
		<MainContainer>
			<Sprite key="gbP" anchor={0.5} x={thrownProp.x} y={thrownProp.y}
				rotation={thrownProp.rotation} width={150} height={150} />
		</MainContainer>
	{/if}
	{#if elapsed >= LEAD && elapsed < TOTAL}
		<Sprite key="smTransitionWipe" anchor={0.5} x={ballX} y={canvas.height / 2}
			rotation={rotation} width={diameter} height={diameter} />
	{/if}
</Container>
