<script lang="ts">
	/**
	 * THE ROOM'S WEATHER (2026-11-01), for the ink-and-paper teahouse plates
	 * (design/build_ink_backgrounds.py). Three slow things, none of them a glow
	 * or a drawn shape laid on top of the art — light and air moving over the
	 * paper, and two or three birds inked in the same hand as the plate:
	 *
	 *   shade   every 28s a broad soft shadow drifts across the floor, the way a
	 *           cloud passes over the sun outside; it only darkens the paper
	 *   birds   a few ink birds cross the mountain windows on either side
	 *           (left every 23s, right every 31s), flapping, then gliding
	 *   mist    a pale band of paper-coloured haze wanders along the floor,
	 *           softening the floor's line work as it passes
	 *   leaves  (day) an inked bamboo leaf comes loose with each draught
	 *   lamps   (night) the lit lanterns and wall lamps flicker
	 *
	 * Drawn in PLATE pixels inside the background's FadeContainer and scaled to
	 * the plate's box like BgProps, so it drifts and fades with it. All
	 * positions are pure functions of one rAF clock.
	 */
	import { Container, Graphics, Sprite, type Texture } from 'pixi.js';
	import { getContextApp, getContextParent } from 'pixi-svelte';
	import { onMount } from 'svelte';

	import { BG_CANVAS } from '../game/meshWin/bgProps';

	// night (the free-spin plate): no birds and no cloud shade after dark; the
	// floor mist stays, a little stronger
	type Props = { x: number; y: number; width: number; height: number; night?: boolean };
	const props: Props = $props();
	const app = getContextApp();
	const parent = getContextParent();
	const [W, H] = BG_CANVAS;
	const INK = 0x2a2622;

	const root = new Container();
	root.label = 'bgAmbience';
	parent.addToParent(root);

	// a bird: two inked wing strokes from the body; `flap` -1..1 lifts the tips
	const drawBird = (g: Graphics, x: number, y: number, s: number, flap: number) => {
		const tip = -s * 0.55 * flap;
		const mid = -s * 0.2 - s * 0.25 * flap;
		g.moveTo(x - s, y + tip).quadraticCurveTo(x - s * 0.45, y + mid, x, y);
		g.quadraticCurveTo(x + s * 0.45, y + mid, x + s, y + tip);
		g.stroke({ width: Math.max(1.6, s * 0.16), color: INK, cap: 'round', join: 'round' });
	};

	// two flights: across the left mountain window and the right one (plate px)
	const FLIGHTS = [
		{ every: 23, dur: 7, from: [200, 250], to: [430, 190], offset: 4, birds: 3 },
		{ every: 31, dur: 8, from: [1700, 210], to: [1520, 260], offset: 15, birds: 2 },
	];
	const ease = (k: number) => k * k * (3 - 2 * k);

	// BAMBOO LEAVES (2026-11-01, user: more background motion, as Putt /
	// Saucer). When the hall's draught (meshWin/bgProps.ts `draught`) reaches a
	// bamboo stand, one inked leaf comes loose and drifts down and downwind,
	// turning over as it goes; the two stands take turns, so a leaf falls
	// every other breath. Same timing constants as the draught.
	const DRAUGHT_EVERY = 6.4, DRAUGHT_FIRST = 0.9, DRAUGHT_CROSS = 1.1;
	const STANDS = [
		{ x: 470, y: 380 },
		{ x: 1460, y: 380 },
	];
	const LEAF_S = 4.2;
	const drawLeaf = (g: Graphics, x: number, y: number, a: number, turn: number) => {
		// a lance-shaped bamboo leaf, foreshortened as it turns over (`turn` -1..1)
		const L = 26, Wd = 6 * Math.max(0.25, Math.abs(turn));
		const c = Math.cos(a), sn = Math.sin(a);
		const P = (u: number, v: number) => [x + u * c - v * sn, y + u * sn + v * c] as const;
		const tip = P(L, 0), base = P(-L * 0.55, 0), up = P(L * 0.1, -Wd), dn = P(L * 0.1, Wd);
		g.moveTo(base[0], base[1]).quadraticCurveTo(up[0], up[1], tip[0], tip[1]).quadraticCurveTo(dn[0], dn[1], base[0], base[1]);
		g.fill(0xf6f0e2).stroke({ width: 2.2, color: INK, join: 'round' });
		g.moveTo(base[0], base[1]).lineTo(tip[0], tip[1]).stroke({ width: 1.2, color: INK });
	};

	// NIGHT LAMPS: the lit lanterns and wall lamps (the paper left bare round
	// them on the night plate, design/build_ink_backgrounds.py LIGHTS) breathe
	// like flames: a little more paper light, a little less, now and then a dip
	const LAMPS = [
		[478, 64, 150], [586, 136, 120], [1335, 138, 120], [1441, 58, 150], [210, 430, 110], [1706, 430, 110],
	] as const;

	onMount(() => {
		const tex = app.stateApp.loadedAssets?.fxSoftGlow as Texture | undefined;
		const shade = tex ? new Sprite(tex) : null;
		const mist = tex ? new Sprite(tex) : null;
		if (shade) {
			shade.anchor.set(0.5);
			shade.tint = 0x3a3530;
			shade.width = 1100;
			shade.height = 520;
			root.addChild(shade);
		}
		if (mist) {
			mist.anchor.set(0.5);
			mist.tint = 0xf6f0e2;
			mist.width = 1500;
			mist.height = 170;
			root.addChild(mist);
		}
		const lamps = props.night && tex
			? LAMPS.map(([x, y, r]) => {
					const g = new Sprite(tex);
					g.anchor.set(0.5);
					g.position.set(x, y);
					g.width = g.height = r * 2.2;
					g.tint = 0xfbf4e2;
					root.addChild(g);
					return g;
				})
			: [];
		const birds = new Graphics();
		root.addChild(birds);
		const leaves = new Graphics();
		root.addChild(leaves);

		let raf = 0;
		let t = 0;
		let last = performance.now();
		const tick = (now: number) => {
			t += Math.min(now - last, 100) / 1000;
			last = now;
			root.position.set(props.x, props.y);
			root.scale.set(props.width / W, props.height / H);

			// shade: 10s crossing in every 28s, fading in and out at the ends
			if (shade) {
				const k = (t % 28) / 10;
				shade.visible = k < 1 && !props.night;
				if (shade.visible) {
					shade.x = -600 + (W + 1200) * k;
					shade.y = H * 0.76 + Math.sin(k * Math.PI) * -40;
					shade.alpha = 0.14 * Math.sin(k * Math.PI);
				}
			}
			// mist: a slow wander along the floor, breathing
			if (mist) {
				mist.x = W * 0.5 + Math.sin(t / 9) * W * 0.32;
				mist.y = H * 0.73 + Math.sin(t / 6.3) * 14;
				mist.alpha = (props.night ? 0.42 : 0.32) + 0.12 * Math.sin(t / 4.1);
			}
			// lamps (night): two unrelated flickers and a rare dip, per lamp
			lamps.forEach((g, i) => {
				const f = 0.5 + 0.3 * Math.sin(t * 7.1 + i * 2.3) * Math.sin(t * 2.9 + i) + 0.2 * Math.sin(t * 1.3 + i * 4.1);
				const dip = Math.max(0, Math.sin(t * 0.37 + i * 1.9) - 0.93) * 6;
				g.alpha = Math.max(0, 0.12 + 0.1 * f - 0.1 * dip);
			});
			// leaves: one per breath, the stands taking turns
			leaves.clear();
			if (!props.night) {
				for (let n = Math.max(0, Math.floor((t - DRAUGHT_FIRST) / DRAUGHT_EVERY) - 1); ; n++) {
					const stand = STANDS[n % 2];
					const t0 = DRAUGHT_FIRST + n * DRAUGHT_EVERY + (stand.x / W) * DRAUGHT_CROSS + 0.35;
					if (t0 > t) break;
					const u = (t - t0) / LEAF_S;
					if (u >= 1) continue;
					// carried downwind fast at first, then drifting, while it falls
					const x = stand.x + 150 * (1 - (1 - u) ** 2) + 26 * Math.sin(u * 9);
					const y = stand.y + 260 * u + 10 * Math.sin(u * 9 + 1);
					drawLeaf(leaves, x, y, 0.5 + 0.6 * Math.sin(u * 7), Math.cos(u * 11));
				}
			}
			// birds
			birds.clear();
			for (const f of props.night ? [] : FLIGHTS) {
				const local = (t + f.offset) % f.every;
				if (local > f.dur) continue;
				const k = ease(local / f.dur);
				for (let i = 0; i < f.birds; i++) {
					const lag = i * 0.06;
					const kk = Math.max(0, Math.min(1, k - lag));
					const x = f.from[0] + (f.to[0] - f.from[0]) * kk + i * 16;
					const y = f.from[1] + (f.to[1] - f.from[1]) * kk + Math.sin(kk * Math.PI * 2 + i) * 10 + i * 11;
					// flap, then glide for a stretch, then flap again
					const gliding = Math.sin(local * 0.9 + i) > 0.55;
					const flap = gliding ? 0.15 : Math.sin(local * 11 + i * 1.7);
					drawBird(birds, x, y, 13 - i * 1.5, flap);
				}
			}
			raf = requestAnimationFrame(tick);
		};
		raf = requestAnimationFrame(tick);
		return () => {
			cancelAnimationFrame(raf);
			root.removeFromParent();
			root.destroy({ children: true });
		};
	});
</script>
