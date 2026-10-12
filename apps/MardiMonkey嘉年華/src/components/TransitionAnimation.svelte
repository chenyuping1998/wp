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
	const IN = 760, HOLD = 320, OUT = 780;
	const COVER_AT = Math.max(LEAD + IN + 80, origin ? 1400 : 0);
	const TOTAL = LEAD + IN + HOLD + OUT;
	const ease = (k: number) => k * k * (3 - 2 * k);
	let elapsed = $state(0);
	let moved = false, covered = false, released = false, complete = false;
	const canvas = $derived(context.stateLayoutDerived.canvasSizes());
	// One parade cloth crosses the street. It is solid and overscanned at
	// centre, hiding every edge while the game changes scenes.
	const clothWidth = $derived(Math.max(canvas.width * 1.25, canvas.height * 2));
	const clothHeight = $derived(clothWidth / 1.6);
	const clothX = $derived.by(() => {
		const t = elapsed - LEAD;
		const start = -clothWidth / 2 - 20, mid = canvas.width / 2;
		const end = canvas.width + clothWidth / 2 + 20;
		if (t <= 0) return start;
		if (t < IN) return start + (mid - start) * ease(t / IN);
		if (t < IN + HOLD) return mid;
		return mid + (end - mid) * ease(Math.min(1, (t - IN - HOLD) / OUT));
	});
	const thrownProp = $derived.by(() => {
		if (!origin) return null;
		const k = (elapsed - 580) / 520;
		if (k < 0 || k > 1) return null;
		const board = context.stateGameDerived.boardLayout();
		return { x: origin.x + (board.x - origin.x) * k,
			y: origin.y + (board.y - origin.y) * k - Math.sin(k * Math.PI) * 220,
			rotation: -k * Math.PI * 2 };
	});
	onMount(() => {
		if (origin) context.eventEmitter.broadcast({ type: 'mascotThrow' });
		let previous = performance.now(), raf = 0;
		const tick = (now: number) => {
			elapsed += Math.min(100, Math.max(0, now - previous));
			previous = now;
			if (!moved && elapsed >= LEAD) {
				moved = true;
				context.eventEmitter.broadcast({ type: 'soundDoorSlide' });
			}
			if (!covered && elapsed >= COVER_AT) {
				covered = true;
				context.eventEmitter.broadcast({ type: 'soundDoorClack' });
				props.oncover?.();
			}
			if (!released && elapsed >= LEAD + IN + HOLD) {
				released = true;
				context.eventEmitter.broadcast({ type: 'soundDoorOpen' });
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
		<Sprite key="smTransitionWipe" anchor={0.5} x={clothX} y={canvas.height / 2}
			width={clothWidth} height={clothHeight} />
	{/if}
</Container>
