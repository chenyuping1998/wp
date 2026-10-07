<script lang="ts">
	import { Graphics } from 'pixi-svelte';
	import type { Graphics as PixiGraphics } from 'pixi.js';

	import { getContext } from '../game/context';
	import { caveQuake, strikeAt, QUAKE_BEATS } from '../game/caveQuake.svelte';
	import {
		makeRockShape,
		mixColor,
		paintRock,
		ROCK_BODY,
		ROCK_HAZE,
		type RockShape,
	} from '../game/rockPaint';

	type Props = {
		// Two instances: 'back' between the background and the board, 'front'
		// over the board. The depth is most of what makes it a cave — rocks
		// passing BEHIND the reels put a room around them.
		layer: 'back' | 'front';
	};
	const props: Props = $props();
	const context = getContext();

	// The rocks are painted by game/rockPaint.ts, shared with MineAir's debris so
	// that a trigger's cave-in and the feature's falling chips are the same
	// stone. GRIT is the fine dust that comes with them, which stays here.
	const GRIT = 0x8a7a62;

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
		at: number; // ms, when it breaks loose
		x: number; // fraction of the canvas width
		size: number; // radius, fraction of the canvas height
		drift: number; // sideways, fraction of width per second
		spin: number; // radians per second
		spin0: number;
		shape: RockShape;
	};

	type Grit = { at: number; x: number; size: number; drift: number };

	// Most of it arrives on the later, harder strikes. The first strike only
	// shakes loose grit: the roof takes a moment to give.
	const build = (back: boolean) => {
		const rand = seeded(back ? 5813 : 9241);
		const rocks: Rock[] = [];
		const count = back ? 24 : 15;
		for (let i = 0; i < count; i++) {
			// THE ROOF GIVES AT ONCE. The first pass had nothing falling until the
			// second strike and, with the fall starting a rock's height above the
			// screen, nothing was actually IN frame for the first second - which is
			// a cave-in the player misses the start of. A third of them now break
			// loose before the first strike has even landed.
			const strike = i < (back ? 8 : 5) ? 0 : 1 + Math.floor(rand() * (QUAKE_BEATS - 1));
			rocks.push({
				at: (strike === 0 ? 100 + rand() * 260 : strikeAt(strike) + rand() * 120),
				// Most front rocks fall down the two sides, but a few cross the board
				// itself: a cave-in that only ever happened in the margins read as
				// decoration. They are brief, and the Scatters are still readable
				// through them.
				x: back
					? 0.05 + rand() * 0.9
					: i % 4 === 3
						? 0.3 + rand() * 0.4
						: rand() < 0.5
							? 0.04 + rand() * 0.26
							: 0.7 + rand() * 0.26,
				size: back ? 0.018 + rand() * 0.018 : 0.05 + rand() * 0.04,
				drift: (rand() - 0.5) * 0.03,
				spin: (rand() - 0.5) * (back ? 5 : 3.2),
				spin0: rand() * Math.PI * 2,
				shape: makeRockShape(rand),
			});
		}
		// the grit: trickles off the roof in a few streams, on every strike
		const grit: Grit[] = [];
		const streams = Array.from({ length: back ? 5 : 3 }, () => 0.08 + rand() * 0.84);
		for (let s = 0; s < QUAKE_BEATS; s++) {
			for (const sx of streams) {
				const n = back ? 5 : 4;
				for (let k = 0; k < n; k++) {
					grit.push({
						at: strikeAt(s) + k * 35 + rand() * 60,
						x: sx + (rand() - 0.5) * 0.02,
						size: (back ? 0.003 : 0.0048) * (0.6 + rand() * 0.8),
						drift: (rand() - 0.5) * 0.012,
					});
				}
			}
		}
		return { rocks, grit, streams };
	};

	const scene = $derived(build(isBack));

	// Falling: gravity chosen so a front rock crosses the screen in about 1.1s.
	// Far rocks fall a little slower on screen, as far things do.
	const fallY = (dt: number, height: number) => {
		const s = dt / 1000;
		const g = height * (isBack ? 1.25 : 1.7);
		// a real initial speed, not a drift: at 0.06 a rock took most of a second
		// to clear its own height and the fall looked like it was starting slowly
		return 0.5 * g * s * s + height * 0.3 * s;
	};

	// ms until a rock's centre passes the bottom edge, inverting fallY's
	// quadratic (it has a small linear term too)
	const fallTime = (rock: Rock, height: number) => {
		const r = rock.size * height;
		const g = height * (isBack ? 1.25 : 1.7);
		const v = height * 0.3;
		const dist = height + r * 2;
		return ((-v + Math.sqrt(v * v + 2 * g * dist)) / g) * 1000;
	};

	const drawRock = (g: PixiGraphics, rock: Rock, dt: number, width: number, height: number) => {
		const r = rock.size * height;
		const cx = rock.x * width + rock.drift * width * (dt / 1000);
		const cy = -r * 1.05 + fallY(dt, height);
		if (cy - r > height) return;
		const haze = isBack ? 0.55 : 0;

		// A streak behind it, but only once it is actually moving fast: at the top
		// of the fall the trail circles overlap the rock and read as a clump of
		// three rocks rather than as one blurred by speed.
		const speed = (fallY(dt + 16, height) - fallY(dt, height)) / 16;
		const smear = Math.min(1, Math.max(0, speed / (height * 0.0012) - 0.4));
		for (let k = 1; k <= 4 && smear > 0; k++) {
			const backDt = Math.max(0, dt - k * 26);
			const ty = -r * 1.05 + fallY(backDt, height);
			const tx = rock.x * width + rock.drift * width * (backDt / 1000);
			g.circle(tx, ty, r * (0.8 - k * 0.13)).fill({
				color: mixColor(ROCK_BODY, ROCK_HAZE, haze),
				alpha: (isBack ? 0.1 : 0.16) * smear * (1 - k / 5),
			});
		}

		paintRock(g, {
			shape: rock.shape,
			cx,
			cy,
			r,
			turn: rock.spin0 + rock.spin * (dt / 1000),
			haze,
		});
	};

	const draw = (g: PixiGraphics) => {
		g.clear();
		const t = caveQuake.clock;
		if (t < 0) return;
		const { width, height } = context.stateLayoutDerived.canvasSizes();
		const { rocks, grit, streams } = scene;

		// a little dust puffing off the roof where the streams start, on each strike
		for (let s = 0; s < QUAKE_BEATS; s++) {
			const dt = t - strikeAt(s);
			if (dt < 0 || dt > 700) continue;
			const k = dt / 700;
			for (const sx of streams) {
				const x = sx * width;
				const rr = height * (isBack ? 0.02 : 0.028) * (0.5 + k);
				g.circle(x, rr * 0.3, rr).fill({ color: mixColor(GRIT, ROCK_HAZE, isBack ? 0.5 : 0.15), alpha: 0.28 * (1 - k) });
			}
		}

		// grit: fine, pale, and quick to fade — dust, not stones
		for (const p of grit) {
			const dt = t - p.at;
			if (dt < 0 || dt > 1400) continue;
			const x = p.x * width + p.drift * width * (dt / 1000);
			const y = fallY(dt, height) * 0.8;
			if (y > height) continue;
			g.circle(x, y, p.size * height).fill({
				color: mixColor(GRIT, ROCK_HAZE, isBack ? 0.45 : 0),
				alpha: 0.85 * (1 - dt / 1400),
			});
		}

		for (const rock of rocks) {
			const dt = t - rock.at;
			if (dt < 0) continue;
			drawRock(g, rock, dt, width, height);
			// where it lands: a puff of dust at the bottom of the screen, so the
			// fall ends in something rather than just leaving the frame
			const r = rock.size * height;
			const landedFor = dt - fallTime(rock, height);
			if (landedFor > 0 && landedFor < 520) {
				const k = landedFor / 520;
				const x = rock.x * width + rock.drift * width * (dt / 1000);
				const puff = r * (1.1 + 2.2 * k);
				g.circle(x, height - puff * 0.25, puff).fill({
					color: mixColor(GRIT, ROCK_HAZE, isBack ? 0.5 : 0.1),
					alpha: (isBack ? 0.16 : 0.3) * (1 - k),
				});
			}
		}
	};
</script>

<Graphics {draw} />
