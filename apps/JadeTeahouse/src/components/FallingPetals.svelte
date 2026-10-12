<script lang="ts">
	/**
	 * Plum petals drifting down through the free-game hall. The plate already
	 * has petals painted in mid-air; these are a few more that actually fall,
	 * so the room is never a still picture while the free spins run.
	 *
	 * Drawn in PLATE pixels inside the background's FadeContainer, scaled to the
	 * plate's box exactly like BgProps, so they fade, drift and blur with it and
	 * stay behind the board. Normal blend, ink-rimmed petals (no glow: the art
	 * is screenprint). Positions are a pure function of time and a fixed seed, so
	 * there is nothing to accumulate and nothing to drift.
	 */
	import { Container, Sprite, type Texture } from 'pixi.js';
	import { getContextApp, getContextParent } from 'pixi-svelte';
	import { onMount } from 'svelte';

	import { BG_CANVAS } from '../game/meshWin/bgProps';

	type Props = { x: number; y: number; width: number; height: number };
	const props: Props = $props();
	const app = getContextApp();
	const parent = getContextParent();

	const COUNT = 16;
	const [W, H] = BG_CANVAS;

	// a small deterministic hash, so every session sees the same flurry
	const rnd = (i: number, k: number) => {
		const v = Math.sin(i * 127.1 + k * 311.7) * 43758.5453;
		return v - Math.floor(v);
	};
	const petals = Array.from({ length: COUNT }, (_, i) => ({
		x: rnd(i, 1) * W,
		speed: 38 + 34 * rnd(i, 2), // plate px per second
		sway: 18 + 26 * rnd(i, 3),
		swayPeriod: 2.6 + 2.2 * rnd(i, 4),
		spin: (rnd(i, 5) - 0.5) * 2.4,
		flip: 1.4 + 1.6 * rnd(i, 6),
		size: 20 + 16 * rnd(i, 7),
		phase: rnd(i, 8),
	}));

	const root = new Container();
	root.label = 'fallingPetals';
	parent.addToParent(root);

	$effect(() => {
		root.position.set(props.x, props.y);
		root.scale.set(props.width / W, props.height / H);
	});

	onMount(() => {
		const sprites: Sprite[] = [];
		const started = performance.now();
		const tick = () => {
			if (!sprites.length) {
				const texture = app.stateApp.loadedAssets?.jtPetal as Texture | undefined;
				if (!texture) return;
				for (const p of petals) {
					const s = new Sprite(texture);
					s.anchor.set(0.5);
					s.setSize(p.size, p.size);
					root.addChild(s);
					sprites.push(s);
				}
			}
			const t = (performance.now() - started) / 1000;
			const span = H + 120;
			petals.forEach((p, i) => {
				const s = sprites[i];
				const y = ((p.phase * span + t * p.speed) % span) - 60;
				s.position.set(p.x + p.sway * Math.sin((2 * Math.PI * t) / p.swayPeriod + p.phase * 6), y);
				s.rotation = p.spin * t + p.phase * 6;
				// tumbling: the petal turns edge-on and back
				s.scale.x = (p.size / s.texture.width) * Math.max(0.15, Math.abs(Math.cos(t * p.flip + p.phase * 4)));
				// fade in from the top edge and out near the floor
				s.alpha = 0.92 * Math.min(1, (y + 60) / 120) * Math.min(1, (H + 60 - y) / 160);
			});
		};
		const ticker = app.stateApp.pixiApplication?.ticker;
		ticker?.add(tick);
		tick();
		return () => ticker?.remove(tick);
	});
</script>
