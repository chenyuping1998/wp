<script lang="ts">
	/**
	 * Music notes floating up off the jukebox through the free-game diner —
	 * the room is never a still picture while the free spins run (Jade
	 * Teahouse's falling petals, turned into the Diner's own thing).
	 *
	 * Drawn in PLATE pixels inside the background's FadeContainer, scaled to the
	 * plate's box exactly like BgProps, so they fade and drift with it and stay
	 * behind the board. Normal blend, ink-rimmed notes tinted from the palette
	 * (no glow: the art is comic print). Positions are a pure function of time
	 * and a fixed seed, so there is nothing to accumulate and nothing to drift.
	 */
	import { Container, Sprite, type Texture } from 'pixi.js';
	import { getContextApp, getContextParent } from 'pixi-svelte';
	import { onMount } from 'svelte';

	import { BG_CANVAS } from '../game/meshWin/bgProps';

	type Props = { x: number; y: number; width: number; height: number };
	const props: Props = $props();
	const app = getContextApp();
	const parent = getContextParent();

	const COUNT = 9;
	const [W, H] = BG_CANVAS;
	// they leave the jukebox's grille top and rise toward the ceiling
	const FROM = { x: 1183, y: 320 };
	const RISE = 300; // plate px over a note's life
	const TINTS = [0xe2342b, 0x2fb6d0, 0xff7fb0];

	// a small deterministic hash, so every session sees the same tune
	const rnd = (i: number, k: number) => {
		const v = Math.sin(i * 127.1 + k * 311.7) * 43758.5453;
		return v - Math.floor(v);
	};
	const notes = Array.from({ length: COUNT }, (_, i) => ({
		life: 3.2 + 1.6 * rnd(i, 1), // seconds
		drift: (rnd(i, 2) - 0.5) * 260, // plate px sideways over its life
		sway: 10 + 14 * rnd(i, 3),
		swayPeriod: 1.1 + 0.8 * rnd(i, 4),
		size: 34 + 18 * rnd(i, 5),
		phase: rnd(i, 6),
		tint: TINTS[i % TINTS.length],
	}));

	const root = new Container();
	root.label = 'floatingNotes';
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
				const texture = app.stateApp.loadedAssets?.dinerNote as Texture | undefined;
				if (!texture) return;
				for (const n of notes) {
					const s = new Sprite(texture);
					s.anchor.set(0.5);
					s.tint = n.tint;
					root.addChild(s);
					sprites.push(s);
				}
			}
			const t = (performance.now() - started) / 1000;
			notes.forEach((n, i) => {
				const s = sprites[i];
				const u = (t / n.life + n.phase) % 1; // 0..1 through its life
				s.position.set(
					FROM.x + n.drift * u + n.sway * Math.sin((2 * Math.PI * t) / n.swayPeriod + n.phase * 6),
					FROM.y - RISE * u,
				);
				// a bob to the beat as it rises
				s.rotation = 0.25 * Math.sin((2 * Math.PI * t) / n.swayPeriod + n.phase * 3);
				const pop = Math.min(1, u / 0.12);
				s.setSize(n.size * (0.6 + 0.4 * pop), n.size * (0.6 + 0.4 * pop));
				// pop in at the jukebox, fade out near the ceiling
				s.alpha = 0.9 * pop * Math.min(1, (1 - u) / 0.35);
			});
		};
		const ticker = app.stateApp.pixiApplication?.ticker;
		ticker?.add(tick);
		tick();
		return () => ticker?.remove(tick);
	});
</script>
