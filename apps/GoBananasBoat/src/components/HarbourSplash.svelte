<script lang="ts">
	import { Graphics } from 'pixi-svelte';
	import type { Graphics as PixiGraphics } from 'pixi.js';

	import { getContext } from '../game/context';
	import { dockSplash, strikeAt, SPLASH_BEATS, SPLASH_MS } from '../game/dockSplash.svelte';

	type Props = {
		// Two instances: 'back' between the background and the board, 'front'
		// over it. The depth is most of what makes it a harbour — water running
		// down BEHIND the reels puts a pier above them and sea around them.
		layer: 'back' | 'front';
	};
	const props: Props = $props();
	const context = getContext();

	// ── WATER, PAINTED THE WAY THE REST OF THE GAME IS PAINTED ─────────────────
	//
	// Harbour water, not swimming-pool blue: a grey-green teal, the colour of a
	// working dock, which is also what sits between the container steel and the
	// navy of the bet bar. One key light from the upper left, as everywhere else
	// in this game, so every drop carries a hard white highlight up and to the
	// left and a darker lower edge — that highlight is the single detail that
	// turns a blue ellipse into a drop of water.
	//
	// THE LIGHT DOES NOT TURN WITH THE DROP. Drops stretch along their fall, but
	// the highlight is placed in SCREEN space, up-left of the centre, the way
	// Boomana keeps its rocks lit from the lamp however they tumble.
	// LIGHTER THAN IT WAS, AND OUTLINED — the first pass was not seen at all.
	//
	// It used a mid teal, #5fb0bf, which is the colour of the water and also,
	// it turns out, the colour of the painted dock behind it: teal containers,
	// wet grey concrete. Measured where the streams fall, the drops sat at a
	// contrast of 1.7-2.3 against the background, at 3-7px across on a normal
	// window. A player looked straight at a buy and reported that there was no
	// water. There was; it was camouflaged.
	//
	// Two fixes, and the second matters more:
	//   · a lighter sea-foam body, so the water is brighter than anything it
	//     falls past
	//   · an INK OUTLINE on every shape, the way Go Boomana outlines its rocks.
	//     Against a background of similar value, it is the edge that separates a
	//     shape, not its fill — and a dark rim with a white highlight inside it is
	//     also exactly how a drop of water reads in comic art, which is what the
	//     rest of this game is painted as.
	const WATER = 0x9bdcea;
	const DEEP = 0x3f98ad;
	const FOAM = 0xf2fbfd;
	const SHINE = 0xffffff;
	const INK = 0x0c2a35;
	// the back layer is further off, so it sinks into the harbour haze
	const HAZE = 0x1a2a33;

	const isBack = $derived(props.layer === 'back');

	// seeded, so a splash is the same splash every time and nothing re-rolls per
	// frame — the same reason Boomana seeds its rockfall
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

	type Drop = { at: number; x: number; size: number; drift: number; v0: number };
	type Spray = { at: number; x: number; vx: number; vy: number; size: number };
	type LensDrop = { at: number; x: number; y: number; size: number; speed: number; wobble: number };

	// ── WHAT FALLS, AND WHEN ──────────────────────────────────────────────────
	//
	// Built once per layer from a seed, the way Boomana builds its rocks.
	//
	//   · STREAMS run off something just above the frame: a handful of fixed
	//     points along the top edge, each shedding a run of drops on every strike. Fixed,
	//     so the water visibly runs off the SAME places each time — which is what
	//     makes it read as water finding its way off an edge rather than as rain.
	//   · SPRAY comes up from below on the three hardest strikes: the sea slapping
	//     the pilings. It rises, stalls and falls back, and that arc is the part of
	//     the effect that makes people smile — water going UP is surprising.
	//   · LENS DROPS (front only) land on the camera and slide down it, leaving a
	//     trail. The most cinematic thing here, and the most fun; kept few, and
	//     kept to the sides, because they sit over everything.
	//
	// Front streams and spray keep OFF the middle of the board, where the Scatters
	// the player is looking at are ringing — Boomana's rule for its front rocks.
	const build = (back: boolean) => {
		const rand = seeded(back ? 4417 : 7703);
		const sideX = () => (rand() < 0.5 ? 0.03 + rand() * 0.24 : 0.73 + rand() * 0.24);

		const streams = Array.from({ length: back ? 7 : 6 }, () => (back ? 0.05 + rand() * 0.9 : sideX()));
		const drops: Drop[] = [];
		for (let s = 0; s < SPLASH_BEATS; s++) {
			for (const sx of streams) {
				// later strikes shed more: the build
				const n = (back ? 3 : 3) + Math.floor(s / 2);
				for (let k = 0; k < n; k++) {
					drops.push({
						at: strikeAt(s) + 60 + k * 55 + rand() * 50,
						x: sx + (rand() - 0.5) * 0.012,
						// 0.0135 of the height in front: ~9px across on a normal window.
						// It was 0.0075, which is 3-7px and was not seen.
						size: (back ? 0.006 : 0.0135) * (0.6 + rand() * 0.8),
						drift: (rand() - 0.5) * 0.01,
						// a little initial speed: it is pushed off, not let go
						v0: 0.04 + rand() * 0.08,
					});
				}
			}
		}

		const sprays: Spray[] = [];
		// strikes 2, 4 and 6 — every other one, harder each time
		for (const s of [1, 3, 5]) {
			const plumes = back ? 3 : 2;
			for (let p = 0; p < plumes; p++) {
				const px = back ? 0.08 + rand() * 0.84 : sideX();
				const n = (back ? 10 : 14) + s * 2;
				for (let k = 0; k < n; k++) {
					sprays.push({
						at: strikeAt(s) + rand() * 70,
						x: px + (rand() - 0.5) * 0.03,
						vx: (rand() - 0.5) * 0.18,
						// fraction of the canvas height per second
						// Up to about a third of the screen. The first pass launched at
						// 0.55-1.0 heights/s, which against this gravity peaks at under a
						// fifth of the frame — rendered, it stayed a fringe of foam along
						// the bottom edge and the moment it exists for never happened.
						vy: -(0.85 + rand() * 0.5) * (1 + s * 0.08) * (back ? 0.75 : 1),
						size: (back ? 0.0065 : 0.011) * (0.5 + rand()),
					});
				}
			}
		}

		const lens: LensDrop[] = back
			? []
			: [1, 2, 3, 4, 5].map((s) => ({
					at: strikeAt(s) + 40 + rand() * 90,
					x: sideX(),
					y: 0.08 + rand() * 0.35,
					size: 0.022 + rand() * 0.016,
					// sliding, not falling — a drop on glass clings
					speed: 0.1 + rand() * 0.1,
					wobble: rand() * Math.PI * 2,
				}));

		return { streams, drops, sprays, lens };
	};

	const scene = $derived(build(isBack));

	// Free fall, in canvas heights per second squared. Far water falls a little
	// slower on screen, as far things do.
	const gravity = (height: number) => height * (isBack ? 1.3 : 1.75);

	// One drop, stretched along its fall and lit from the upper left.
	const drawDrop = (
		g: PixiGraphics,
		cx: number,
		cy: number,
		r: number,
		stretch: number,
		alpha: number,
	) => {
		const haze = isBack ? 0.5 : 0;
		// body, taller the faster it falls
		g.ellipse(cx, cy, r, r * stretch).fill({ color: mix(WATER, HAZE, haze), alpha: 0.78 * alpha });
		// the lower edge, where the drop is thickest and darkest
		g.ellipse(cx + r * 0.12, cy + r * stretch * 0.28, r * 0.7, r * stretch * 0.55).fill({
			color: mix(DEEP, HAZE, haze),
			alpha: 0.45 * alpha,
		});
		// the ink rim — the thing that makes it visible at all against the dock
		g.ellipse(cx, cy, r, r * stretch).stroke({
			width: Math.max(1.2, r * 0.22),
			color: INK,
			alpha: (isBack ? 0.35 : 0.85) * alpha,
		});
		// the highlight, in screen space, up and to the left
		if (!isBack || r > 2.5) {
			g.circle(cx - r * 0.35, cy - r * stretch * 0.38, Math.max(0.8, r * 0.3)).fill({
				color: SHINE,
				alpha: (isBack ? 0.45 : 0.9) * alpha,
			});
		}
	};

	const draw = (g: PixiGraphics) => {
		g.clear();
		const t = dockSplash.clock;
		if (t < 0) return;
		const { width, height } = context.stateLayoutDerived.canvasSizes();
		const { drops, sprays, lens } = scene;
		const G = gravity(height);

		// NO SHEET ALONG THE TOP. There used to be a band of water across the top
		// of the frame that surged down on every strike; it was taken out on
		// request — the drops are the effect, and a coloured band over the top of
		// the scene read as part of the interface rather than as water. So the
		// pours and the drops now start at the frame's top edge, as if running off
		// something just above it, and that is the only place water comes from.
		//
		// Anchored a little ABOVE the frame rather than at y=0: the scene jolts by
		// up to ~10px on each strike, and a pour pinned exactly to the top edge
		// would show a gap between it and the edge every time the scene dropped.
		const lip = -height * 0.02;

		// THE POUR. On every strike each stream first comes off the top edge as one
		// unbroken ribbon of water, and only then breaks up into the drops below.
		//
		// Without it this read as RAIN — separate drops appearing from nowhere at
		// the top of the frame. The ribbon is what makes it water running off an
		// edge: it is attached to the top of the frame, it narrows as it falls, and
		// its top lets go a beat after the strike so the whole column drops away.
		const haze = isBack ? 0.5 : 0;
		for (let si = 0; si < scene.streams.length; si++) {
			const sx = scene.streams[si] * width;
			for (let s = 0; s < SPLASH_BEATS; s++) {
				const dt = (t - strikeAt(s) - 30) / 1000;
				if (dt < 0 || dt > 0.6) continue;
				const v = height * 0.1;
				const head = lip * 0.9 + v * dt + 0.5 * G * dt * dt;
				// the top holds on to the edge for 0.16s, then falls after the rest
				const td = Math.max(0, dt - 0.16);
				const tail = lip * 0.9 + 0.5 * G * td * td;
				if (tail > height || head - tail < 2) continue;
				// wider for the harder strikes, and it thins as it goes
				const w0 = height * (isBack ? 0.006 : 0.012) * (1 + s * 0.12);
				const w1 = w0 * 0.35;
				const alpha = 0.7 * (1 - dt / 0.6);
				// a slight lean, per stream, so the columns are not ruled lines
				const lean = (si % 2 ? 1 : -1) * height * 0.006 * dt;
				g.poly([
					sx - w0, tail,
					sx + w0, tail,
					sx + lean + w1, head,
					sx + lean - w1, head,
				])
					.fill({ color: mix(WATER, HAZE, haze), alpha })
					.stroke({ width: Math.max(1.2, w0 * 0.3), color: INK, alpha: (isBack ? 0.3 : 0.8) * alpha, join: 'round' });
				// the lit edge down its left side, as on the drops
				g.moveTo(sx - w0 * 0.45, tail)
					.lineTo(sx + lean - w1 * 0.4, head)
					.stroke({ width: Math.max(1, w0 * 0.3), color: SHINE, alpha: (isBack ? 0.25 : 0.55) * (1 - dt / 0.6) });
			}
		}

		// the streams off the top edge
		for (const d of drops) {
			const dt = (t - d.at) / 1000;
			if (dt < 0) continue;
			const vy = d.v0 * height + G * dt;
			const y = lip * 0.9 + d.v0 * height * dt + 0.5 * G * dt * dt;
			if (y > height + 20) continue;
			const x = d.x * width + d.drift * width * dt;
			const r = d.size * height;
			// stretch with speed, capped — past this a drop reads as a line
			const stretch = 1 + Math.min(2.4, vy / (height * 0.9));
			drawDrop(g, x, y, r, stretch, 1);
		}

		// the spray from below: up, stall, back down
		for (const s of sprays) {
			const dt = (t - s.at) / 1000;
			if (dt < 0 || dt > 1.3) continue;
			const x = s.x * width + s.vx * width * dt;
			const y = height + s.vy * height * dt + 0.5 * G * dt * dt;
			if (y > height + 10) continue;
			const r = s.size * height;
			const life = 1 - dt / 1.3;
			// spray is mostly foam: white-ish, and gone quickly
			g.circle(x, y, r)
				.fill({ color: mix(FOAM, HAZE, isBack ? 0.45 : 0), alpha: 0.85 * life })
				.stroke({ width: Math.max(1, r * 0.2), color: INK, alpha: (isBack ? 0.25 : 0.6) * life });
			g.circle(x - r * 0.3, y - r * 0.3, Math.max(0.6, r * 0.35)).fill({ color: SHINE, alpha: 0.7 * life });
		}

		// the drops on the lens, and the trail each one leaves
		for (const d of lens) {
			const dt = (t - d.at) / 1000;
			if (dt < 0) continue;
			// lands with a squash, then slides — slowly at first, as water clings
			const land = Math.min(1, dt / 0.12);
			const slide = d.speed * height * Math.pow(dt, 1.6);
			const x0 = d.x * width;
			const y0 = d.y * height;
			const x = x0 + Math.sin(dt * 3 + d.wobble) * d.size * height * 0.35;
			const y = y0 + slide;
			const fade = Math.min(1, Math.max(0, (SPLASH_MS - t) / 500));
			const r = d.size * height * (0.7 + 0.3 * land);
			// the trail: a narrowing wet streak from where it landed
			if (slide > r) {
				g.moveTo(x0, y0);
				g.quadraticCurveTo(x0 + (x - x0) * 0.5 + r * 0.2, (y0 + y) / 2, x, y - r);
				g.stroke({ width: r * 0.9, color: WATER, alpha: 0.18 * fade, cap: 'round' });
				g.moveTo(x0 - r * 0.2, y0);
				g.quadraticCurveTo(x0 + (x - x0) * 0.5, (y0 + y) / 2, x - r * 0.25, y - r);
				g.stroke({ width: Math.max(1, r * 0.18), color: SHINE, alpha: 0.28 * fade, cap: 'round' });
			}
			// the drop itself: squashed on landing, then a little taller as it runs
			const squash = land < 1 ? 0.6 + 0.4 * land : 1 + Math.min(0.35, slide / (height * 0.4));
			g.ellipse(x, y, r * (land < 1 ? 1.25 - 0.25 * land : 1), r * squash).fill({
				color: WATER,
				alpha: 0.4 * fade,
			});
			// a lens drop is mostly clear: a rim and a hard highlight, which is how
			// water on glass actually looks
			g.ellipse(x, y, r, r * squash).stroke({ width: Math.max(1.5, r * 0.13), color: INK, alpha: 0.7 * fade });
			g.circle(x - r * 0.38, y - r * squash * 0.4, r * 0.26).fill({ color: SHINE, alpha: 0.85 * fade });
			g.circle(x + r * 0.3, y + r * squash * 0.42, r * 0.12).fill({ color: SHINE, alpha: 0.4 * fade });
		}
	};
</script>

<Graphics {draw} />
