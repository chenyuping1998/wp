<script lang="ts">
	import { Graphics } from 'pixi-svelte';
	import type { Graphics as PixiGraphics } from 'pixi.js';

	import { getContext } from '../game/context';
	import { frostQuake, strikeAt, QUAKE_BEATS, QUAKE_MS } from '../game/frostQuake.svelte';
	import { INK, ICE_EDGE, ICE_PLATE } from '../game/palette';

	type Props = {
		// Two instances: 'back' between the background and the board, 'front'
		// over it. The depth is most of what makes it weather — snow coming down
		// BEHIND the reels puts a ledge above them and open air around them.
		layer: 'back' | 'front';
	};
	const props: Props = $props();
	const context = getContext();

	// ── THE MATERIALS ──────────────────────────────────────────────────────────
	//
	// Three things fall, and they are told apart by how they MOVE more than by
	// colour — which is also what makes the effect read as physical:
	//
	//   CLUMPS   packed snow, soft and heavy: they drop and keep dropping
	//   GRAUPEL  hard ice pellets: small, bright, fast, and they BOUNCE
	//   POWDER   fine flakes: slow, swaying, still in the air after he stops
	//
	// Every hard-edged shape carries an INK rim and a white highlight up and to the
	// left, which is Go Bananas Boat's lesson from its water: a lighter body alone
	// was camouflaged against its dock, and it is the dark edge that separates a
	// shape from a busy background. The light does not turn with the shape — it is
	// placed in screen space, the way the rest of the game is lit from one lamp.
	//
	// Here the risk runs the other way from Boat's: the arctic plates are dark
	// navy, so white snow separates on value alone. The rim is kept anyway,
	// because the board and the frame are pale ice, and snow falling past them
	// needs the edge there.
	const SNOW = 0xf4faff;
	const SNOW_SHADE = 0xa9c7de;
	const PELLET = 0xd8f0ff;
	const SHINE = 0xffffff;
	// the back layer is further off, so it sinks into the cold haze
	const HAZE = ICE_PLATE;

	const isBack = $derived(props.layer === 'back');

	// seeded, so a quake is the same quake every time and nothing re-rolls per
	// frame — the same reason Boomana seeds its rockfall and Boat its water
	const seeded = (seed: number) => {
		let s = seed;
		return () => {
			s = (s * 16807) % 2147483647;
			return s / 2147483647;
		};
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

	type Clump = { at: number; x: number; size: number; drift: number; v0: number; lobes: number[] };
	type Pellet = { at: number; x: number; vx: number; v0: number; size: number };
	type Flake = { at: number; x: number; size: number; fall: number; sway: number; phase: number };

	// ── WHAT FALLS, AND WHEN ──────────────────────────────────────────────────
	//
	//   · CLUMPS slough off a handful of FIXED points along the top edge, a run
	//     on every strike. Fixed, so the snow visibly comes off the same ledges
	//     each time — which is what makes it read as snow shaken loose rather
	//     than as a snowfall.
	//   · GRAUPEL on the three hardest strikes (2, 4, 6): thrown down from the top
	//     much faster than the clumps, and it rebounds off the bottom of the frame
	//     in a short hop or two. That hop is the surprise.
	//   · POWDER is released on every strike and keeps coming down after the last
	//     one, so the scene settles rather than stopping.
	//
	// Front clumps, pellets and powder keep OFF the middle of the board, where
	// the Scatters the player is looking at are ringing — Boomana's rule for its
	// front rocks, and Boat's for its water.
	const build = (back: boolean) => {
		const rand = seeded(back ? 5519 : 8807);
		const sideX = () => (rand() < 0.5 ? 0.03 + rand() * 0.24 : 0.73 + rand() * 0.24);

		const ledges = Array.from({ length: back ? 7 : 6 }, () => (back ? 0.05 + rand() * 0.9 : sideX()));
		const clumps: Clump[] = [];
		for (let s = 0; s < QUAKE_BEATS; s++) {
			for (const lx of ledges) {
				// later strikes shed more: the build
				const n = 2 + Math.floor(s / 2);
				for (let k = 0; k < n; k++) {
					clumps.push({
						at: strikeAt(s) + 50 + k * 70 + rand() * 60,
						// wide enough that a ledge sheds a spray of clumps, not a ruled
						// column: at 0.02 the first render read as bubbles rising in lines
						x: lx + (rand() - 0.5) * 0.055,
						size: (back ? 0.007 : 0.014) * (0.6 + rand() * 0.9),
						drift: (rand() - 0.5) * 0.03,
						v0: 0.02 + rand() * 0.06,
						// three lobes, so a clump is a lump and not a ball
						lobes: [rand(), rand(), rand()],
					});
				}
			}
		}

		const pellets: Pellet[] = [];
		for (const s of [1, 3, 5]) {
			const n = (back ? 12 : 10) + s * 2;
			for (let k = 0; k < n; k++) {
				pellets.push({
					at: strikeAt(s) + rand() * 120,
					x: back ? 0.04 + rand() * 0.92 : sideX(),
					vx: (rand() - 0.5) * 0.08,
					// thrown, not dropped: already fast when it enters
					v0: 0.35 + rand() * 0.3,
					size: (back ? 0.0035 : 0.0062) * (0.6 + rand() * 0.8),
				});
			}
		}

		const powder: Flake[] = [];
		for (let s = 0; s < QUAKE_BEATS; s++) {
			const n = back ? 10 : 7;
			for (let k = 0; k < n; k++) {
				powder.push({
					at: strikeAt(s) + rand() * 260,
					x: back ? rand() : sideX(),
					size: (back ? 0.0022 : 0.0035) * (0.6 + rand()),
					// heights per second; powder barely falls
					fall: 0.08 + rand() * 0.1,
					sway: 0.008 + rand() * 0.012,
					phase: rand() * Math.PI * 2,
				});
			}
		}

		return { ledges, clumps, pellets, powder };
	};

	const scene = $derived(build(isBack));

	// Clumps fall under a softer gravity than the pellets: packed snow tumbles
	// through the air, a hard pellet cuts through it. Far things fall slower on
	// screen, as far things do.
	const gravity = (height: number, hard: boolean) =>
		height * (hard ? 2.2 : 1.45) * (isBack ? 0.75 : 1);

	const drawClump = (g: PixiGraphics, cx: number, cy: number, r: number, lobes: number[], alpha: number) => {
		const haze = isBack ? 0.45 : 0;
		const pts: [number, number, number][] = [
			[0, 0, 1],
			[-0.55 + lobes[0] * 0.2, 0.15, 0.62 + lobes[1] * 0.2],
			[0.5 + lobes[2] * 0.15, 0.25, 0.55 + lobes[0] * 0.25],
		];
		// the ink rim first, one lobe at a time, so the outline follows the lump
		for (const [dx, dy, k] of pts) {
			g.circle(cx + dx * r, cy + dy * r, r * k + Math.max(1.2, r * 0.2)).fill({
				color: INK,
				alpha: (isBack ? 0.3 : 0.8) * alpha,
			});
		}
		for (const [dx, dy, k] of pts) {
			g.circle(cx + dx * r, cy + dy * r, r * k).fill({ color: mix(SNOW, HAZE, haze), alpha: 0.95 * alpha });
		}
		// The shade sits INSIDE the lump, on its lower right, and fades into it.
		// It was a flat ellipse across the bottom, and a dome on a flat dark base
		// is a mushroom cap — which is exactly what the first render looked like.
		g.circle(cx + r * 0.28, cy + r * 0.3, r * 0.55).fill({
			color: mix(SNOW_SHADE, HAZE, haze),
			alpha: 0.45 * alpha,
		});
		// the highlight, in screen space, up and to the left
		if (!isBack || r > 2.5) {
			g.circle(cx - r * 0.35, cy - r * 0.35, Math.max(0.8, r * 0.3)).fill({
				color: SHINE,
				alpha: (isBack ? 0.4 : 0.95) * alpha,
			});
		}
	};

	const drawPellet = (g: PixiGraphics, cx: number, cy: number, r: number, alpha: number) => {
		const haze = isBack ? 0.45 : 0;
		g.circle(cx, cy, r)
			.fill({ color: mix(PELLET, HAZE, haze), alpha: 0.95 * alpha })
			.stroke({ width: Math.max(1, r * 0.3), color: INK, alpha: (isBack ? 0.3 : 0.85) * alpha });
		// the cold side: ice is blue where the light leaves it
		g.circle(cx + r * 0.25, cy + r * 0.25, r * 0.55).fill({ color: ICE_EDGE, alpha: 0.35 * alpha });
		// a hard glint — the thing that says ICE and not snow
		g.circle(cx - r * 0.35, cy - r * 0.35, Math.max(0.7, r * 0.38)).fill({
			color: SHINE,
			alpha: (isBack ? 0.5 : 1) * alpha,
		});
	};

	const draw = (g: PixiGraphics) => {
		g.clear();
		const t = frostQuake.clock;
		if (t < 0) return;
		const { width, height } = context.stateLayoutDerived.canvasSizes();
		const { clumps, pellets, powder } = scene;

		// Anchored a little ABOVE the frame rather than at y=0: the scene jolts by
		// up to ~15px on each strike, and anything pinned exactly to the top edge
		// would show a gap between it and the edge every time the scene dropped.
		const lip = -height * 0.02;

		// ── the sloughs: a short sheet of snow letting go of the ledge ──────────
		//
		// On every strike each ledge first sheds one unbroken tongue of snow, and
		// only then do the clumps below it fall. Boat found its water read as RAIN
		// without the pour attached to the top edge; snow has the same problem —
		// separate clumps appearing from nowhere is a snowfall, not a shake.
		const hazeS = isBack ? 0.45 : 0;
		const Gs = gravity(height, false);
		for (let li = 0; li < scene.ledges.length; li++) {
			const lx = scene.ledges[li] * width;
			for (let s = 0; s < QUAKE_BEATS; s++) {
				const dt = (t - strikeAt(s) - 20) / 1000;
				if (dt < 0 || dt > 0.45) continue;
				const head = lip + height * 0.05 * dt + 0.5 * Gs * dt * dt;
				const td = Math.max(0, dt - 0.12);
				const tail = lip + 0.5 * Gs * td * td;
				if (head - tail < 2) continue;
				const w0 = height * (isBack ? 0.007 : 0.014) * (1 + s * 0.1);
				const w1 = w0 * 0.55;
				const alpha = 0.9 * (1 - dt / 0.45);
				g.poly([lx - w0, tail, lx + w0, tail, lx + w1, head, lx - w1, head])
					.fill({ color: mix(SNOW, HAZE, hazeS), alpha })
					.stroke({ width: Math.max(1.2, w0 * 0.25), color: INK, alpha: (isBack ? 0.3 : 0.75) * alpha, join: 'round' });
				// a rounded, crumbling head rather than a cut edge
				g.circle(lx, head, w1 * 1.1).fill({ color: mix(SNOW, HAZE, hazeS), alpha });
			}
		}

		// ── the clumps ───────────────────────────────────────────────────────────
		for (const c of clumps) {
			const dt = (t - c.at) / 1000;
			if (dt < 0) continue;
			const y = lip + c.v0 * height * dt + 0.5 * Gs * dt * dt;
			if (y > height + 30) continue;
			const x = c.x * width + c.drift * width * dt;
			drawClump(g, x, y, c.size * height, c.lobes, 1);
		}

		// ── the graupel, and its bounce ──────────────────────────────────────────
		//
		// A pellet falls to the bottom of the frame and rebounds at 38% of its
		// speed, then again, fading as it goes. Two hops, no more: a third reads as
		// rubber rather than ice.
		const Gp = gravity(height, true);
		// THE FLOOR IS ABOVE THE BET BAR. It was 0.985 of the canvas, and the bar
		// covers roughly the bottom eighth in every layout — so the bounce, the one
		// surprising beat in the whole effect, happened out of sight behind it.
		// 0.85 is clear of the bar and, for the front layer, out to the sides of
		// the board where the pellets fall, so they land on open ground.
		const floor = height * 0.85;
		for (const p of pellets) {
			let dt = (t - p.at) / 1000;
			if (dt < 0) continue;
			const r = p.size * height;
			const v0 = p.v0 * height;
			// time to reach the floor from the lip
			const drop = floor - lip;
			const tHit = (-v0 + Math.sqrt(v0 * v0 + 2 * Gp * drop)) / Gp;
			const x = p.x * width + p.vx * width * dt;
			let y: number;
			let alpha = 1;
			if (dt < tHit) {
				y = lip + v0 * dt + 0.5 * Gp * dt * dt;
			} else {
				let vUp = (v0 + Gp * tHit) * 0.38;
				dt -= tHit;
				let hop = 0;
				while (hop < 2) {
					const tAir = (2 * vUp) / Gp;
					if (dt < tAir) break;
					dt -= tAir;
					vUp *= 0.38;
					hop++;
				}
				if (hop >= 2) continue;
				y = floor - (vUp * dt - 0.5 * Gp * dt * dt);
				alpha = hop === 0 ? 0.9 : 0.5;
			}
			drawPellet(g, x, y, r, alpha);
		}

		// ── the powder ───────────────────────────────────────────────────────────
		//
		// Soft points with no rim: powder is not a shape, it is a haze of light,
		// and outlining it turns it into polka dots. Fades out over the last
		// 900ms so the scene settles instead of the snow being switched off.
		const settle = Math.min(1, Math.max(0, (QUAKE_MS - t) / 900));
		for (const f of powder) {
			const dt = (t - f.at) / 1000;
			if (dt < 0) continue;
			const y = lip + f.fall * height * dt;
			if (y > height) continue;
			const x = f.x * width + Math.sin(dt * 2.2 + f.phase) * f.sway * width;
			const r = f.size * height;
			const fadeIn = Math.min(1, dt / 0.25);
			g.circle(x, y, r * 1.8).fill({ color: SHINE, alpha: 0.12 * fadeIn * settle });
			g.circle(x, y, r).fill({
				color: isBack ? mix(SHINE, HAZE, 0.35) : SHINE,
				alpha: (isBack ? 0.45 : 0.8) * fadeIn * settle,
			});
		}
	};
</script>

<Graphics {draw} />
