<script lang="ts">
	import { onMount } from 'svelte';
	import { Container, Graphics } from 'pixi-svelte';
	import type { Graphics as PixiGraphics } from 'pixi.js';
	import { getContext } from '../game/context';

	type Props = { onblack?: () => void; oncomplete: () => void };
	const props: Props = $props();
	const context = getContext();
	const BLACK_MS = 250;
	const HOLD_MS = 900;
	const REVEAL_MS = 700;
	const TOTAL_MS = BLACK_MS + HOLD_MS + REVEAL_MS;
	let elapsed = $state(0);
	let blackFired = false;
	let completed = false;
	let raf = 0;
	const sizes = $derived(context.stateLayoutDerived.canvasSizes());
	const clamp = (n: number) => Math.max(0, Math.min(1, n));
	const blackout = $derived(
		elapsed < BLACK_MS ? clamp(elapsed / BLACK_MS) : clamp(1 - (elapsed - BLACK_MS - HOLD_MS) / REVEAL_MS),
	);
	const alarm = $derived(elapsed < BLACK_MS ? 0 : clamp(1 - (elapsed - BLACK_MS - HOLD_MS * .7) / (REVEAL_MS + HOLD_MS * .3)));

	const drawBlack = (g: PixiGraphics) => {
		g.clear();
		g.rect(0, 0, sizes.width, sizes.height);
		g.fill({ color: 0x020303, alpha: blackout });
	};
	const drawAlarm = (g: PixiGraphics) => {
		g.clear();
		if (alarm <= .01) return;
		const phase = elapsed * .0048;
		for (const side of [-1, 1]) {
			const cx = side < 0 ? 0 : sizes.width;
			const cy = sizes.height * .18;
			const a = phase * side + (side < 0 ? .15 : Math.PI - .15);
			const reach = Math.hypot(sizes.width, sizes.height) * 1.15;
			const spread = .24;
			g.moveTo(cx, cy);
			g.lineTo(cx + Math.cos(a-spread)*reach, cy + Math.sin(a-spread)*reach);
			g.lineTo(cx + Math.cos(a+spread)*reach, cy + Math.sin(a+spread)*reach);
			g.closePath();
			g.fill({ color: 0xc1272d, alpha: .22 * alarm });
		}
	};

	onMount(() => {
		context.eventEmitter.broadcast({ type: 'soundNeonZap' });
		let last = performance.now();
		const tick = (now: number) => {
			elapsed += now - last;
			last = now;
			if (!blackFired && elapsed >= BLACK_MS) { blackFired = true; props.onblack?.(); }
			if (elapsed >= TOTAL_MS) {
				if (!completed) { completed = true; props.oncomplete(); }
				return;
			}
			raf = requestAnimationFrame(tick);
		};
		raf = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(raf);
	});
</script>

<Container>
	<Graphics draw={drawBlack} />
	<Graphics draw={drawAlarm} />
</Container>
