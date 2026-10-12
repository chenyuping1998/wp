<script lang="ts">
	import { onMount } from 'svelte';
	import { Container, Graphics, Sprite } from 'pixi-svelte';
	import { getContext } from '../game/context';

	type Props = { oncomplete: () => void; oncover?: () => void };
	const props: Props = $props();
	const context = getContext();
	const origin = context.stateGame.mascotThrowOrigin;
	const LEAD = origin ? 580 : 0;
	const IN = 820, HOLD = 320, OUT = 700;
	const COVER_AT = Math.max(LEAD + IN + 65, origin ? 1400 : 0);
	const TOTAL = LEAD + IN + HOLD + OUT;
	const ease = (k: number) => k * k * (3 - 2 * k);
	let elapsed = $state(0);
	let covered = false, complete = false;
	let moved = false, landed = false, removed = false;
	const canvas = $derived(context.stateLayoutDerived.canvasSizes());
	// A diner flyer leaves the mascot's hand, flutters toward the camera and
	// stops WHOLE in the middle of the screen — the full menu readable, not
	// zoomed into its burger (user, 2026-10-10) — then peels away to reveal the
	// new scene. A backdrop behind it does the covering: opaque by the time the
	// flyer lands, so the scene swaps unseen, and fading as the flyer leaves.
	const fullScale = $derived(Math.min(canvas.width / 1200, canvas.height / 1600) * 0.92);
	const backdrop = $derived.by(() => {
		if (phase < IN) return ease(Math.max(0, (phase / IN - 0.55) / 0.45));
		if (phase < IN + HOLD) return 1;
		return 1 - ease(Math.min(1, (phase - IN - HOLD) / (OUT * 0.6)));
	});
	const layout = $derived(context.stateLayoutDerived.mainLayout());
	const hand = $derived(origin ? {
		x: layout.x + (origin.x - layout.width / 2) * layout.scale,
		y: layout.y + (origin.y - layout.height / 2) * layout.scale,
	} : { x: canvas.width * 0.77, y: canvas.height * 0.62 });
	const phase = $derived(Math.max(0, elapsed - LEAD));
	const ticketX = $derived.by(() => {
		if (phase < IN) {
			const k = phase / IN;
			return hand.x + (canvas.width / 2 - hand.x) * ease(k) + Math.sin(k * Math.PI) * 36;
		}
		if (phase < IN + HOLD) return canvas.width / 2;
		const k = ease(Math.min(1, (phase - IN - HOLD) / OUT));
		return canvas.width / 2 + canvas.width * 0.88 * k;
	});
	const ticketY = $derived.by(() => {
		const t = elapsed - LEAD;
		if (t < IN) {
			const k = Math.max(0, t / IN);
			return hand.y + (canvas.height / 2 - hand.y) * ease(k) - Math.sin(k * Math.PI) * canvas.height * 0.16;
		}
		if (t < IN + HOLD) return canvas.height / 2;
		const k = ease(Math.min(1, (t - IN - HOLD) / OUT));
		return canvas.height / 2 - canvas.height * 0.56 * k;
	});
	const ticketScale = $derived.by(() => {
		const start = Math.min(canvas.width, canvas.height) * 0.12 / 1200;
		if (phase < IN) return start + (fullScale - start) * Math.pow(phase / IN, 2.2);
		if (phase < IN + HOLD) return fullScale;
		const k = ease(Math.min(1, (phase - IN - HOLD) / OUT));
		return fullScale * (1 - 0.88 * k);
	});
	const ticketRotation = $derived.by(() => {
		if (phase < IN) {
			const k = phase / IN;
			return -0.32 * (1 - ease(k)) + 0.11 * Math.sin(k * Math.PI * 4) * (1 - k);
		}
		if (phase < IN + HOLD) return 0;
		return 0.36 * ease(Math.min(1, (phase - IN - HOLD) / OUT));
	});

	onMount(() => {
		if (origin) {
			context.eventEmitter.broadcast({ type: 'mascotThrow' });
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
	{#if elapsed >= LEAD && elapsed < TOTAL}
		<Graphics alpha={backdrop} draw={(g) => {
			g.clear();
			g.rect(0, 0, canvas.width, canvas.height).fill(0x171918);
		}} />
		<Sprite key="smTransitionTicket" anchor={0.5} x={ticketX}
			y={ticketY} rotation={ticketRotation} width={1200 * ticketScale} height={1600 * ticketScale} />
	{/if}
</Container>
