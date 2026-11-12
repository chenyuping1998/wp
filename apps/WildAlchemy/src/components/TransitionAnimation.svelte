<script lang="ts">
	/**
	 * MG ↔ FG transition (SPEC §2.6), on the delivered transition art
	 * (wildAlchemyScene/transition: drop a, sigil a, rays a):
	 *
	 *   0.00–0.45  a jade drop falls from above the screen to its centre while
	 *              the ink wash rises behind it
	 *   0.45       the drop lands: it bursts, the ray wheel and the sigil open
	 *              out from where it hit; the wash is full → `onblack` (the
	 *              caller swaps the scene in here, out of sight)
	 *   …–1.35     held: the sigil turns one way, the rays the other
	 *   1.35–2.15  the light comes up — sigil and rays swell and fade with the
	 *              wash, revealing the new scene
	 *
	 * `onblack` keeps its old meaning (Transition.svelte): it resolves when the
	 * screen is fully covered. The ink is the plates' darkest brown, not black.
	 */
	import { onMount } from 'svelte';
	import { Container, Graphics, Sprite } from 'pixi-svelte';
	import type { Graphics as PixiGraphics } from 'pixi.js';
	import { getContext } from '../game/context';

	type Props = { onblack?: () => void; oncomplete: () => void };
	const props: Props = $props();
	const context = getContext();

	const FALL_MS = 450;
	const BURST_MS = 380;
	const HOLD_MS = 520;
	const REVEAL_MS = 800;
	const TOTAL_MS = FALL_MS + BURST_MS + HOLD_MS + REVEAL_MS;
	const COVER_AT = FALL_MS; // the wash is full as the drop lands

	const INK = 0x2a1d14;

	let elapsed = $state(0);
	let blackFired = false;
	let completed = false;

	const sizes = $derived(context.stateLayoutDerived.canvasSizes());
	const unit = $derived(Math.min(sizes.width, sizes.height));
	const clamp = (n: number) => Math.max(0, Math.min(1, n));
	const easeIn = (t: number) => t * t;
	const easeOutBack = (t: number) => {
		const c = 1.6;
		return 1 + (c + 1) * (t - 1) ** 3 + c * (t - 1) ** 2;
	};

	const revealT = $derived(clamp((elapsed - FALL_MS - BURST_MS - HOLD_MS) / REVEAL_MS));
	const cover = $derived(elapsed < COVER_AT ? clamp(elapsed / COVER_AT) ** 0.8 : 1 - revealT ** 1.4);

	// the drop: falls from above the top edge to the centre, stretching as it goes
	const fallT = $derived(clamp(elapsed / FALL_MS));
	const drop = $derived.by(() => {
		const h = unit * 0.2;
		const w = h * (567 / 1024);
		const y = lerp(-h, sizes.height * 0.5, easeIn(fallT));
		const stretch = 1 + 0.25 * fallT;
		// on landing it squashes and is gone inside 120 ms
		const land = clamp((elapsed - FALL_MS) / 120);
		return {
			x: sizes.width * 0.5,
			y,
			width: w * (1 + 0.6 * land) / stretch,
			height: h * stretch * (1 - 0.7 * land),
			alpha: elapsed < FALL_MS ? 1 : 1 - land,
		};
	});

	// sigil and rays open out from the landing point
	const burstT = $derived(clamp((elapsed - FALL_MS) / BURST_MS));
	const sigil = $derived.by(() => {
		const size = unit * 0.62 * easeOutBack(burstT) * (1 + 0.35 * revealT);
		return {
			size,
			rotation: (elapsed / 1000) * 0.35,
			alpha: burstT > 0 ? 1 - revealT : 0,
		};
	});
	const rays = $derived.by(() => {
		const size = unit * 0.95 * clamp(burstT * 1.3) * (1 + 0.8 * revealT);
		return {
			size,
			rotation: -(elapsed / 1000) * 0.6,
			alpha: burstT > 0 ? 0.9 * (1 - revealT) : 0,
		};
	});

	function lerp(a: number, b: number, t: number) {
		return a + (b - a) * t;
	}

	const drawCover = (g: PixiGraphics) => {
		g.clear();
		g.rect(0, 0, sizes.width, sizes.height);
		g.fill({ color: INK, alpha: cover });
	};

	onMount(() => {
		context.eventEmitter.broadcast({ type: 'soundNeonZap' });
		let raf = 0;
		let last = performance.now();
		const tick = (now: number) => {
			elapsed += now - last;
			last = now;
			if (!blackFired && elapsed >= COVER_AT) {
				blackFired = true;
				props.onblack?.();
			}
			if (elapsed >= TOTAL_MS) {
				if (!completed) {
					completed = true;
					props.oncomplete();
				}
				return;
			}
			raf = requestAnimationFrame(tick);
		};
		raf = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(raf);
	});
</script>

<Container>
	<Graphics draw={drawCover} />
	{#if rays.alpha > 0.01}
		<Sprite
			key="waTransRays"
			anchor={0.5}
			x={sizes.width * 0.5}
			y={sizes.height * 0.5}
			width={rays.size}
			height={rays.size}
			rotation={rays.rotation}
			alpha={rays.alpha}
		/>
	{/if}
	{#if sigil.alpha > 0.01}
		<Sprite
			key="waTransSigil"
			anchor={0.5}
			x={sizes.width * 0.5}
			y={sizes.height * 0.5}
			width={sigil.size}
			height={sigil.size * (1178 / 1117)}
			rotation={sigil.rotation}
			alpha={sigil.alpha}
		/>
	{/if}
	{#if drop.alpha > 0.01}
		<Sprite
			key="waTransDrop"
			anchor={{ x: 0.5, y: 0.82 }}
			x={drop.x}
			y={drop.y}
			width={drop.width}
			height={drop.height}
			alpha={drop.alpha}
		/>
	{/if}
</Container>
