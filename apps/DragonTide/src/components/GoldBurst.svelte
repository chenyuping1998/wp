<script lang="ts">
	import { onMount } from 'svelte';
	import { Graphics } from 'pixi-svelte';
	import type { Graphics as PixiGraphics } from 'pixi.js';

	import { SYMBOL_SIZE } from '../game/constants';

	/**
	 * A cleared symbol bursting (ATG 戰神賽特 tumble, research ATG-Seth-Capture §2):
	 * a pale-gold star of 7 spikes flares out over the first third, then fine
	 * gold motes drift upward and fade for the rest.
	 */
	type Props = { x: number; y: number; durationMs?: number; seed?: number; oncomplete: () => void };
	const props: Props = $props();
	const DURATION = props.durationMs ?? 310;
	const seed = props.seed ?? Math.random() * 100;
	const rand = (i: number) => { const v = Math.sin(seed * 12.9898 + i * 78.233) * 43758.5453; return v - Math.floor(v); };
	const SPIKES = 7;
	const spikes = Array.from({ length: SPIKES }, (_, i) => ({ angle: (i / SPIKES) * Math.PI * 2 + rand(i) * 0.5, length: 0.55 + rand(i + 9) * 0.3 }));
	const motes = Array.from({ length: 12 }, (_, i) => ({ x: (rand(i + 20) - 0.5) * 0.9, y: (rand(i + 40) - 0.5) * 0.6, rise: 0.35 + rand(i + 60) * 0.45, size: 2 + rand(i + 80) * 3 }));

	let t = $state(0);
	const ease = (k: number) => 1 - (1 - k) ** 2;
	const draw = (g: PixiGraphics) => {
		g.clear();
		const star = Math.min(1, t / 0.33);
		if (t < 0.6) {
			const r = SYMBOL_SIZE * ease(star);
			const alpha = t < 0.33 ? 1 : 1 - (t - 0.33) / 0.27;
			for (const spike of spikes) {
				const tip = r * spike.length, w = SYMBOL_SIZE * 0.09 * (1 - star * 0.4);
				const cx = Math.cos(spike.angle), cy = Math.sin(spike.angle);
				g.poly([cx * tip, cy * tip, -cy * w, cx * w, cy * w, -cx * w]).fill({ color: 0xffe9a8, alpha: 0.9 * alpha });
			}
			g.circle(0, 0, SYMBOL_SIZE * (0.2 + 0.18 * star)).fill({ color: 0xfff6d8, alpha: alpha });
		}
		const drift = Math.max(0, (t - 0.25) / 0.75);
		if (drift > 0) for (const mote of motes) {
			const k = ease(drift);
			g.circle(mote.x * SYMBOL_SIZE * (0.6 + 0.6 * k), (mote.y - mote.rise * k) * SYMBOL_SIZE, mote.size * (1 - 0.5 * drift)).fill({ color: 0xf2c75c, alpha: 1 - drift });
		}
	};

	onMount(() => {
		let done = false;
		const finish = () => { if (!done) { done = true; props.oncomplete(); } };
		let raf = 0;
		const start = performance.now();
		const tick = (now: number) => {
			t = Math.min(1, (now - start) / DURATION);
			if (t >= 1) { finish(); return; }
			raf = requestAnimationFrame(tick);
		};
		raf = requestAnimationFrame(tick);
		// rAF stops in a hidden tab; never leave a burst stranded
		const fallback = setTimeout(finish, DURATION + 300);
		return () => { cancelAnimationFrame(raf); clearTimeout(fallback); };
	});
</script>

<Graphics x={props.x} y={props.y} draw={draw} />
