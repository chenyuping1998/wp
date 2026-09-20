<script lang="ts">
	import { Graphics } from 'pixi-svelte';
	import type { Graphics as PixiGraphics } from 'pixi.js';

	import { getContext } from '../game/context';
	import { tombQuake, strikeAt, BEATS } from '../game/tombQuake.svelte';

	/**
	 * STONE AND SAND FROM THE CEILING, on the chest beat.
	 *
	 * Ported from Go Boomana's CaveRockfall, which worked out the parts that are
	 * hard — seeded debris so a quake is the same quake every time, light that
	 * does not tumble with the rock, and two depths so debris passing BEHIND the
	 * reels puts a room around them. What changes here is what falls, and what it
	 * is lit like:
	 *
	 *   · a tomb sheds SAND before it sheds stone. The grit that trickled off a mine
	 *     roof becomes pale sand pouring in thin streams, which is the image of an
	 *     old tomb shaking that a player already carries
	 *   · the blocks are cut limestone and sandstone — the colour of the columns
	 *     in the painted hall and of the housing's trim — not a mine's wet umber.
	 *     Their ink and rim follow this game's plates: #2a2116 ink, a warm rim
	 *
	 * Two instances: 'back' between the background and the board, 'front' over
	 * the board.
	 */
	type Props = {
		layer: 'back' | 'front';
	};
	const props: Props = $props();
	const context = getContext();

	// Lit the way the hall is lit: warm from above-left (the shaft of light in
	// the painting), deep shadow down and right.
	const INK = 0x2a2116;
	const BODY = 0x8a7859;
	const SHADE = 0x5d4c33;
	const LIT = 0xc2a878;
	const RIM = 0xf2d59a;
	// sand: paler and warmer than the stone it falls off
	const SAND = 0xd9c49a;
	// the back layer is further off, so it sits deeper in the gloom
	const HAZE = 0x1c1812;

	const isBack = $derived(props.layer === 'back');

	// seeded, so a quake is the same quake every time and nothing re-rolls per frame
	const seeded = (seed: number) => {
		let s = seed;
		return () => {
			s = (s * 16807) % 2147483647;
			return s / 2147483647;
		};
	};

	type Rock = {
		at: number;
		x: number;
		size: number;
		drift: number;
		spin: number;
		spin0: number;
		angles: number[];
		radii: number[];
		stretch: number;
	};

	type Grain = { at: number; x: number; size: number; drift: number };

	// Most of the stone arrives on the later, harder strikes. The first strike
	// only shakes sand loose: the ceiling takes a moment to give.
	const build = (back: boolean) => {
		const rand = seeded(back ? 4127 : 7703);
		const rocks: Rock[] = [];
		const count = back ? 10 : 5;
		for (let i = 0; i < count; i++) {
			const strike = 1 + Math.floor(rand() * (BEATS - 1));
			// Cut stone is blockier than cave rock: fewer, straighter sides.
			const sides = 5 + Math.floor(rand() * 3);
			const steps = Array.from({ length: sides }, () => 0.7 + rand() * 0.6);
			const total = steps.reduce((a, b) => a + b, 0);
			let acc = 0;
			const angles = steps.map((step) => {
				const a = acc;
				acc += (step / total) * Math.PI * 2;
				return a;
			});
			rocks.push({
				at: strikeAt(strike) + rand() * 120,
				// Front stone keeps off the middle of the board, where the Scatters
				// the player is looking at are ringing.
				x: back
					? 0.05 + rand() * 0.9
					: rand() < 0.5
						? 0.06 + rand() * 0.22
						: 0.72 + rand() * 0.22,
				size: back ? 0.007 + rand() * 0.01 : 0.018 + rand() * 0.02,
				drift: (rand() - 0.5) * 0.03,
				spin: (rand() - 0.5) * (back ? 4.5 : 2.8),
				spin0: rand() * Math.PI * 2,
				angles,
				radii: Array.from({ length: sides }, () => 0.72 + rand() * 0.28),
				stretch: 0.6 + rand() * 0.3,
			});
		}
		// Sand pours in a few streams, on every strike, and there is MORE of it than
		// Boomana's grit — in a tomb the sand is the main event, the stone the
		// punctuation.
		const grains: Grain[] = [];
		const streams = Array.from({ length: back ? 6 : 4 }, () => 0.08 + rand() * 0.84);
		for (let s = 0; s < BEATS; s++) {
			for (const sx of streams) {
				const n = back ? 7 : 6;
				for (let k = 0; k < n; k++) {
					grains.push({
						at: strikeAt(s) + k * 30 + rand() * 60,
						x: sx + (rand() - 0.5) * 0.016,
						size: (back ? 0.0022 : 0.003) * (0.6 + rand() * 0.8),
						drift: (rand() - 0.5) * 0.008,
					});
				}
			}
		}
		return { rocks, grains, streams };
	};

	const scene = $derived(build(isBack));

	// Falling: gravity chosen so a front stone crosses the screen in about 1.1s.
	// Far debris falls a little slower on screen, as far things do.
	const fallY = (dt: number, height: number) => {
		const s = dt / 1000;
		const g = height * (isBack ? 1.25 : 1.7);
		return 0.5 * g * s * s + height * 0.06 * s;
	};

	const mix = (a: number, b: number, k: number) => {
		let out = 0;
		for (const shift of [16, 8, 0]) {
			const ca = (a >> shift) & 0xff;
			const cb = (b >> shift) & 0xff;
			out |= Math.round(ca + (cb - ca) * k) << shift;
		}
		return out;
	};

	const drawRock = (g: PixiGraphics, rock: Rock, dt: number, width: number, height: number) => {
		const r = rock.size * height;
		const cx = rock.x * width + rock.drift * width * (dt / 1000);
		const cy = -r * 2 + fallY(dt, height);
		if (cy - r > height) return;
		const turn = rock.spin0 + rock.spin * (dt / 1000);
		const cos = Math.cos(turn);
		const sin = Math.sin(turn);
		const n = rock.radii.length;
		// THE LIGHT DOES NOT TUMBLE WITH THE STONE: facets are offset in SCREEN
		// space, towards and away from the light, which does not turn.
		const outline = (k: number, ox = 0, oy = 0) =>
			rock.angles.flatMap((a, i) => {
				const lx = Math.cos(a) * rock.radii[i] * k;
				const ly = Math.sin(a) * rock.radii[i] * rock.stretch * k;
				return [cx + ox + (lx * cos - ly * sin) * r, cy + oy + (lx * sin + ly * cos) * r];
			});
		const flat = outline(1);
		const haze = isBack ? 0.55 : 0;

		g.poly(flat).fill({ color: mix(BODY, HAZE, haze) });
		g.poly(outline(0.62, r * 0.16, r * 0.18)).fill({ color: mix(SHADE, HAZE, haze), alpha: 0.8 });
		g.poly(outline(0.5, -r * 0.2, -r * 0.2)).fill({ color: mix(LIT, HAZE, haze), alpha: 0.85 });
		g.poly(flat).stroke({ width: Math.max(1.2, r * 0.17), color: INK, join: 'round' });
		// the rim, on the edges whose outward normal faces up-left
		if (!isBack || r > 6) {
			for (let i = 0; i < n; i++) {
				const ax = flat[i * 2];
				const ay = flat[i * 2 + 1];
				const bx = flat[((i + 1) % n) * 2];
				const by = flat[((i + 1) % n) * 2 + 1];
				const mx = (ax + bx) / 2 - cx;
				const my = (ay + by) / 2 - cy;
				const len = Math.hypot(mx, my) || 1;
				const facing = (-mx - my) / (len * Math.SQRT2);
				if (facing < 0.3) continue;
				g.moveTo(ax, ay)
					.lineTo(bx, by)
					.stroke({
						width: Math.max(1, r * 0.1),
						color: RIM,
						alpha: (isBack ? 0.35 : 0.85) * facing,
						cap: 'round',
					});
			}
		}
	};

	const draw = (g: PixiGraphics) => {
		g.clear();
		const t = tombQuake.clock;
		if (t < 0) return;
		const { width, height } = context.stateLayoutDerived.canvasSizes();
		const { rocks, grains, streams } = scene;

		// a puff of dust off the ceiling where each stream starts, on each strike
		for (let s = 0; s < BEATS; s++) {
			const dt = t - strikeAt(s);
			if (dt < 0 || dt > 700) continue;
			const k = dt / 700;
			for (const sx of streams) {
				const x = sx * width;
				const rr = height * (isBack ? 0.02 : 0.028) * (0.5 + k);
				g.circle(x, rr * 0.3, rr).fill({
					color: mix(SAND, HAZE, isBack ? 0.5 : 0.15),
					alpha: 0.3 * (1 - k),
				});
			}
		}

		// sand: fine, pale, and quick to fade
		for (const p of grains) {
			const dt = t - p.at;
			if (dt < 0 || dt > 1400) continue;
			const x = p.x * width + p.drift * width * (dt / 1000);
			const y = fallY(dt, height) * 0.8;
			if (y > height) continue;
			g.circle(x, y, p.size * height).fill({
				color: mix(SAND, HAZE, isBack ? 0.45 : 0),
				alpha: 0.85 * (1 - dt / 1400),
			});
		}

		for (const rock of rocks) {
			const dt = t - rock.at;
			if (dt < 0) continue;
			drawRock(g, rock, dt, width, height);
		}
	};
</script>

<Graphics {draw} />
