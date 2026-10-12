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
	// Let the food fill the screen long enough to register before the pot leaves.
	const IN = 780, HOLD = 850, OUT = 940;
	const COVER_AT = Math.max(LEAD + IN + 70, origin ? 1400 : 0);
	const TOTAL = LEAD + IN + HOLD + OUT;
	const ease = (k: number) => k * k * (3 - 2 * k);
	let elapsed = $state(0);
	let covered = false, complete = false;
	let moved = false, landed = false, removed = false;
	const canvas = $derived(context.stateLayoutDerived.canvasSizes());
	// The tteokbokki pot sweeps through the foreground. Its filled broth
	// covers the whole viewport at centre, so the cast changes unseen.
	const diameter = $derived(Math.hypot(canvas.width, canvas.height) * 1.08);
	const potX = $derived.by(() => {
		const t = elapsed - LEAD;
		const start = -diameter / 2 - 30, middle = canvas.width / 2;
		const end = canvas.width + diameter / 2 + 30;
		if (t <= 0) return start;
		if (t < IN) return start + (middle - start) * ease(t / IN);
		if (t < IN + HOLD) return middle;
		return middle + (end - middle) * ease(Math.min(1, (t - IN - HOLD) / OUT));
	});
	const potY = $derived(canvas.height / 2 + Math.sin(Math.min(1, Math.max(0, (elapsed - LEAD) / IN)) * Math.PI) * 38);
	const potRotation = $derived.by(() => {
		const t = elapsed - LEAD;
		if (t < 0) return -0.24;
		if (t < IN) return -0.24 + 0.24 * ease(t / IN);
		if (t < IN + HOLD) return 0;
		return 0.18 * ease(Math.min(1, (t - IN - HOLD) / OUT));
	});
	const thrownPlate = $derived.by(() => {
		if (!origin) return null;
		const k = (elapsed - 580) / 520;
		if (k < 0 || k > 1) return null;
		const board = context.stateGameDerived.boardLayout();
		return { x: origin.x + (board.x - origin.x) * k,
			y: origin.y + (board.y - origin.y) * k - Math.sin(k * Math.PI) * 220,
			rotation: -k * Math.PI * 2.2, scale: 0.9 + 0.5 * k };
	});

	onMount(() => {
		if (origin) {
			context.eventEmitter.broadcast({ type: 'mascotThrow' });
			context.eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_superfreespin' });
		}
		let previous = performance.now(), raf = 0;
		const tick = (now: number) => {
			elapsed += Math.min(100, Math.max(0, now - previous));
			previous = now;
			if (!moved && elapsed >= LEAD) {
				moved = true;
				context.eventEmitter.broadcast({ type: 'soundTransitionMove' });
			}
			if (!landed && elapsed >= LEAD + IN) {
				landed = true;
				context.eventEmitter.broadcast({ type: 'soundTransitionLand' });
			}
			if (!covered && elapsed >= COVER_AT) {
				covered = true;
				props.oncover?.();
			}
			if (!removed && elapsed >= LEAD + IN + HOLD) {
				removed = true;
				context.eventEmitter.broadcast({ type: 'soundTransitionExit' });
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
	{#if thrownPlate}
		<MainContainer>
			<Sprite key="gbP" anchor={0.5} x={thrownPlate.x} y={thrownPlate.y}
				rotation={thrownPlate.rotation} width={150 * thrownPlate.scale}
				height={150 * thrownPlate.scale} />
		</MainContainer>
	{/if}
	{#if elapsed >= LEAD && elapsed < TOTAL}
		<Sprite key="smTransitionPot" anchor={0.5} x={potX} y={potY}
			rotation={potRotation} width={diameter} height={diameter} />
		<Sprite key="smTransitionFood" anchor={0.5} x={potX} y={potY}
			rotation={potRotation} width={diameter} height={diameter} />
	{/if}
</Container>
