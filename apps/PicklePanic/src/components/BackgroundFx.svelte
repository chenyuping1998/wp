<script lang="ts">
	/**
	 * Background motion (2026-10-14 trial). Everything moves on top of the
	 * approved plates using pieces cut from those plates (design/build_bg_fx.py),
	 * so no new painting is involved. All coordinates are PLATE pixels (1920×1080);
	 * Background.svelte hands in the plate's on-screen placement.
	 *
	 *   free spins  flow   the brine gush flows (displacement over its own cut-out)
	 *               drip   drops swell at the pipe mouth and the tank nozzle, fall,
	 *                      splash and ring the puddle
	 *   base game   bubbles  bubbles rise inside the two fermentation tanks
	 *               stars    sky stars glint now and then
	 *
	 * Which ones run: ?bgfx=flow,drip,bubbles,stars | all | none (default all),
	 * so each can be judged on its own. (A rotating-beacon trial was dropped on
	 * 2026-10-15: both lamps sit behind the board at 16:9.) House style holds: flat inks, hard edges,
	 * no glow, no blur (ART_BRIEF §0).
	 */
	import * as PIXI from 'pixi.js';
	import { onMount } from 'svelte';
	import { getContextParent, getContextApp } from 'pixi-svelte';
	import meta from '../../static/assets/pickle/bg_fx_meta.json';

	type Props = { mode: 'base' | 'feature'; x: number; y: number; scale: number };
	const props: Props = $props();

	const INK = 0x20231d;
	const BRINE = 0x6a9f35;
	const BRINE_DARK = 0x31572c;
	const PAPER = 0xfff0cf;

	const wanted = (() => {
		const all = ['flow', 'drip', 'bubbles', 'stars'];
		try {
			const q = new URLSearchParams(location.search).get('bgfx');
			if (q === null || q === 'all') return new Set(all);
			if (q === 'none') return new Set<string>();
			return new Set(q.split(','));
		} catch {
			return new Set(all);
		}
	})();

	const parent = getContextParent();
	const app = getContextApp();
	const root = new PIXI.Container();
	parent.addToParent(root);
	$effect(() => {
		root.position.set(props.x, props.y);
		root.scale.set(props.scale);
	});

	const tex = (key: string) => app.stateApp.loadedAssets?.[key] as PIXI.Texture | undefined;
	const rand = (a: number, b: number) => a + Math.random() * (b - a);
	type Step = (t: number, dt: number) => void;
	const steps: Step[] = [];

	// ── FREE SPINS ────────────────────────────────────────────────────────────
	if (props.mode === 'feature') {
		// flow: the gush's own pixels, pushed along a streaky map that scrolls down
		// the stream. The map is long along the flow and short across it, so the
		// result reads as liquid running, not as a heat shimmer.
		const brineTex = tex('bgFxBrine');
		const flowTex = tex('bgFxFlow');
		if (wanted.has('flow') && brineTex && flowTex) {
			flowTex.source.addressMode = 'repeat';
			const map = new PIXI.Sprite(flowTex);
			map.scale.set(2.6);
			map.renderable = false;
			const brine = new PIXI.Sprite(brineTex);
			brine.position.set(meta.brine.x, meta.brine.y);
			const filter = new PIXI.DisplacementFilter({ sprite: map, scale: { x: 13, y: 22 } });
			brine.filters = [filter];
			root.addChild(map, brine);
			const tile = 256 * 2.6;
			steps.push((t) => {
				// down and slightly left, like the gush; a slow breathing of the
				// strength so the run surges instead of moving at constant speed
				map.y = (t * 140) % tile;
				map.x = -((t * 22) % tile);
				const surge = 1 + 0.25 * Math.sin(t * 1.7) + 0.1 * Math.sin(t * 4.3);
				filter.scale.x = 13 * surge;
				filter.scale.y = 22 * surge;
			});
		}

		// drip: three sources measured on the brine cut-out (plate px)
		if (wanted.has('drip')) {
			const layer = new PIXI.Container();
			root.addChild(layer);
			const SOURCES = [
				{ x: 226, y: 300, floor: 520, every: [1.4, 2.6], splash: false },
				{ x: 697, y: 735, floor: 878, every: [1.0, 2.0], splash: true },
				{ x: 750, y: 898, floor: 925, every: [1.8, 3.2], splash: true },
			];
			type Drop = { g: PIXI.Graphics; sx: number; y: number; vy: number; phase: 'grow' | 'fall'; age: number; floor: number; splash: boolean };
			type Bit = { g: PIXI.Graphics; x: number; y: number; vx: number; vy: number; age: number; life: number; ring?: boolean };
			const drops: Drop[] = [];
			const bits: Bit[] = [];
			const next = SOURCES.map((s) => rand(0, s.every[1]));
			const drawDrop = (g: PIXI.Graphics, r: number, stretch: number) => {
				g.clear();
				// teardrop: round bottom, pointed top, ink outline like the plate
				const h = r * 2.2 * stretch;
				g.moveTo(0, -h)
					.bezierCurveTo(r * 0.5, -h * 0.55, r, -r * 0.2, r, 0)
					.arc(0, 0, r, 0, Math.PI)
					.bezierCurveTo(-r, -r * 0.2, -r * 0.5, -h * 0.55, 0, -h)
					.fill(BRINE)
					.stroke({ width: 3, color: INK });
				g.circle(-r * 0.35, -r * 0.1, r * 0.22).fill(PAPER);
			};
			steps.push((_, dt) => {
				SOURCES.forEach((s, i) => {
					next[i] -= dt;
					if (next[i] <= 0) {
						next[i] = rand(s.every[0], s.every[1]);
						const g = new PIXI.Graphics();
						g.position.set(s.x, s.y);
						layer.addChild(g);
						drops.push({ g, sx: s.x, y: s.y, vy: 0, phase: 'grow', age: 0, floor: s.floor, splash: s.splash });
					}
				});
				for (let i = drops.length - 1; i >= 0; i--) {
					const d = drops[i];
					d.age += dt;
					if (d.phase === 'grow') {
						// swells on the lip, wobbles, lets go
						const k = Math.min(1, d.age / 0.7);
						drawDrop(d.g, 3 + 6 * k, 0.9 + 0.25 * Math.sin(d.age * 18) * (1 - k * 0.6));
						d.g.y = d.y + 6 * k;
						if (d.age > 0.75) {
							d.phase = 'fall';
							d.y += 6;
						}
					} else {
						d.vy += 2400 * dt;
						d.y += d.vy * dt;
						drawDrop(d.g, 8, 1 + Math.min(0.9, d.vy / 1400));
						d.g.y = d.y;
						if (d.y >= d.floor) {
							layer.removeChild(d.g);
							d.g.destroy();
							drops.splice(i, 1);
							if (d.splash) {
								for (let k = 0; k < 5; k++) {
									const g = new PIXI.Graphics().circle(0, 0, rand(2, 4.5)).fill(BRINE).stroke({ width: 2, color: INK });
									layer.addChild(g);
									bits.push({ g, x: d.sx, y: d.floor, vx: rand(-180, 180), vy: rand(-420, -200), age: 0, life: 0.5 });
								}
							}
							const ring = new PIXI.Graphics();
							layer.addChild(ring);
							bits.push({ g: ring, x: d.sx, y: d.floor + 4, vx: 0, vy: 0, age: 0, life: 0.9, ring: true });
						}
					}
				}
				for (let i = bits.length - 1; i >= 0; i--) {
					const b = bits[i];
					b.age += dt;
					const k = b.age / b.life;
					if (k >= 1) {
						layer.removeChild(b.g);
						b.g.destroy();
						bits.splice(i, 1);
						continue;
					}
					if (b.ring) {
						// ripple on the puddle, seen at a glance angle: a flat ellipse
						b.g.clear().ellipse(0, 0, 8 + 46 * k, (8 + 46 * k) * 0.28).stroke({ width: 2.5, color: BRINE_DARK, alpha: 1 - k });
						b.g.position.set(b.x, b.y);
					} else {
						b.vy += 1600 * dt;
						b.x += b.vx * dt;
						b.y += b.vy * dt;
						b.g.position.set(b.x, b.y);
						b.g.alpha = 1 - k * k;
					}
				}
			});
		}

	}

	// ── BASE GAME ─────────────────────────────────────────────────────────────
	if (props.mode === 'base') {
		const maskTex = tex('bgFxTank');
		if (wanted.has('bubbles') && maskTex) {
			const layer = new PIXI.Container();
			const mask = new PIXI.Sprite(maskTex);
			mask.position.set(meta.tanks.x, meta.tanks.y);
			layer.mask = mask;
			root.addChild(mask, layer);
			const bottom = meta.tanks.y + meta.tanks.h;
			type B = { g: PIXI.Graphics; x: number; y: number; v: number; r: number; ph: number };
			const bubbles: B[] = [];
			const spawn = (y?: number) => {
				const r = rand(6, 20);
				const g = new PIXI.Graphics()
					.circle(0, 0, r)
					.fill({ color: PAPER, alpha: 0.85 })
					.stroke({ width: 3, color: INK });
				g.circle(-r * 0.35, -r * 0.35, r * 0.25).fill(0xffffff);
				layer.addChild(g);
				bubbles.push({ g, x: rand(meta.tankSpan[0] + 20, meta.tankSpan[1] - 20), y: y ?? bottom + r, v: rand(35, 95), r, ph: rand(0, 6) });
			};
			for (let k = 0; k < 22; k++) spawn(rand(meta.tanks.y, bottom));
			steps.push((t, dt) => {
				for (const b of bubbles) {
					b.y -= b.v * dt;
					if (b.y < meta.tanks.y - 20) {
						b.y = bottom + b.r;
						b.x = rand(meta.tankSpan[0] + 20, meta.tankSpan[1] - 20);
					}
					b.g.position.set(b.x + Math.sin(t * 2.2 + b.ph) * 4, b.y);
				}
			});
		}

		if (wanted.has('stars')) {
			const layer = new PIXI.Container();
			root.addChild(layer);
			const glints = meta.stars.map((s: { x: number; y: number; r: number }) => {
				const g = new PIXI.Graphics();
				g.position.set(s.x, s.y);
				layer.addChild(g);
				return { g, s, at: rand(0, 6), dur: rand(0.35, 0.6) };
			});
			steps.push((t) => {
				for (const gl of glints) {
					const local = (t - gl.at) % 5.5;
					gl.g.clear();
					if (local < 0 || local > gl.dur) continue;
					// a four-point glint pops out and back, hard-edged
					const k = Math.sin((local / gl.dur) * Math.PI);
					const R = (gl.s.r + 6) * (0.6 + 1.2 * k);
					const w = R * 0.22;
					gl.g.poly([0, -R, w, -w, R, 0, w, w, 0, R, -w, w, -R, 0, -w, -w]).fill(PAPER);
				}
			});
		}
	}

	onMount(() => {
		let raf = 0;
		let last = performance.now();
		let t = 0;
		const tick = (now: number) => {
			// capped like Background.svelte: a background tab must not come back
			// to a flood of drops
			const dt = Math.min(now - last, 100) / 1000;
			last = now;
			t += dt;
			for (const s of steps) s(t, dt);
			raf = requestAnimationFrame(tick);
		};
		raf = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(raf);
	});
</script>
