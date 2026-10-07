// The winning symbols split into the layers their mesh wins are drawn from
// (src/game/meshWin/*, SymbolMeshWin.svelte). The method is GoBananubis's
// (wp/.claude/skills/mesh-cast-rig, "The same method on reel SYMBOLS"); what
// is different here is the plate, and every change below follows from it.
//
// For every CUT-mode symbol (h1-h4, l1-l5, s):
//
//   {n}_plate.png    the container panel with the subject lifted off it
//   {n}_subject.png  the subject alone — what the mesh deforms
//   {n}_shadow.png   a soft dark silhouette of the subject, drawn UNDER the
//                    mesh while it is lifted, so the height reads
//   {n}_sheen.png    SHEEN_FRAMES frames of light sweeping across the subject,
//                    pre-clipped to its shape, drawn additively through the SAME
//                    mesh so the light rides the deformation
//
// and for the one PANEL-mode symbol (w — the porthole portrait, which cannot
// be cut out of its glass):
//
//   w_glow.png, w_sheen.png   the art masked to the portrait, for the flash
//
// WHY THE LETTERS ARE CUT HERE, when on GoBananubis they are panels. Bubis's
// plate is plain basalt: a panel deforms the stone round a letter and nobody
// can see it. Boat's plate is CORRUGATED STEEL — hard vertical ribs — and a
// deformed panel bends the ribs, which reads at once as the tile warping. A
// stencilled letter is paint on the panel, so it is cut off it like the high
// pays, and the ribs behind it are rebuilt (see fillPlate).
//
// HOW A SUBJECT IS FOUND. Colour alone cannot do it on this plate, measured:
// the plate is blue-grey (b-r +17..27) with RUST STREAKS (r-b up to +65), the
// flags' blue cloth overlaps the plate's own blue, the lantern throws a green
// haze on the wall that overlaps its glass, and the mine's chain is exactly as
// grey as the steel. What every subject DOES have is a heavy black ink outline.
// So each subject is a generous hand-traced HULL (in the rig's 256 canvas, so
// it reads like the rig files) and a flood from outside that runs through
// anything that is not ink, but only within BAND px of the hull's edge: it
// stops on the outline, finds the true edge, and can never leak into a
// subject's bright interior through a gap in the ink.
//
// Layers are written at 512px. The rigs work in a 256 canvas (as on Bubis) and
// the UVs are normalised, so the resolution is free; 512 because Boat's cell
// is 140px and pops to 1.16x — at 2x device pixels a 256 texture would soften
// the tile the moment it starts to win.
//
// Usage: node design/make_symbol_layers.mjs E:\stake\tools\gen [h1,l1,...]

import { createRequire, register } from 'module';
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

// the meshWin modules import each other without an extension, as vite expects
register(
	'data:text/javascript,' +
		encodeURIComponent(`export async function resolve(s, c, next) {
			try { return await next(s, c); } catch (e) {
				if (s.startsWith('.') && !s.endsWith('.ts')) return next(s + '.ts', c);
				throw e;
			}
		}`),
);

const toolsDir = process.argv[2];
if (!toolsDir) throw new Error('pass the tools dir (where pngjs lives) as the first argument');
const only = process.argv[3]?.split(',');
const require = createRequire(path.join(toolsDir, 'noop.js'));
const { PNG } = require('pngjs');

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIR = path.join(appRoot, 'static/assets/sprites/goBananasSymbolsV3');
const write = (name, w, h, data) => {
	const png = new PNG({ width: w, height: h });
	png.data.set(data);
	fs.writeFileSync(path.join(DIR, name), PNG.sync.write(png));
};

export const SIZE = 512; // the layers
const CANVAS = 256; // the rigs
const K = SIZE / CANVAS;
export const SHEEN_FRAMES = 24;
export const SHEEN_COLS = 6;
export const SHEEN_CELL = 128; // the light is soft; a quarter of the layer

// --- reading the art at SIZE -------------------------------------------------
// The sources are 1024; box-filter them down (exactly 2x2 per pixel).
const readScaled = (name) => {
	const src = PNG.sync.read(fs.readFileSync(path.join(DIR, name)));
	const f = src.width / SIZE;
	if (!Number.isInteger(f)) throw new Error(`${name}: ${src.width}px does not divide into ${SIZE}`);
	const data = new Uint8Array(SIZE * SIZE * 4);
	for (let y = 0; y < SIZE; y++)
		for (let x = 0; x < SIZE; x++) {
			const acc = [0, 0, 0, 0];
			for (let dy = 0; dy < f; dy++)
				for (let dx = 0; dx < f; dx++) {
					const i = ((y * f + dy) * src.width + x * f + dx) * 4;
					for (let c = 0; c < 4; c++) acc[c] += src.data[i + c];
				}
			for (let c = 0; c < 4; c++) data[(y * SIZE + x) * 4 + c] = Math.round(acc[c] / (f * f));
		}
	return { width: SIZE, height: SIZE, data };
};

// --- shapes, in canvas px, as the rig files write them -------------------------
const inPolygon = (pts, x, y) => {
	let inside = false;
	for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
		const [xi, yi] = pts[i], [xj, yj] = pts[j];
		if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
	}
	return inside;
};
const nearLine = (pts, half, x, y) => {
	for (let i = 0; i < pts.length - 1; i++) {
		const [ax, ay] = pts[i], [bx, by] = pts[i + 1];
		const dx = bx - ax, dy = by - ay;
		const t = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy)));
		if (Math.hypot(ax + t * dx - x, ay + t * dy - y) <= half) return true;
	}
	return false;
};
const poly = (pts) => ({ kind: 'poly', pts });
const circ = (c, r) => ({ kind: 'circ', c, r });
const line = (pts, half) => ({ kind: 'line', pts, half });
const inShape = (s, x, y) =>
	s.kind === 'poly' ? inPolygon(s.pts, x, y) : s.kind === 'circ' ? Math.hypot(x - s.c[0], y - s.c[1]) <= s.r : nearLine(s.pts, s.half, x, y);

// --- what each subject is -----------------------------------------------------
//
// `hull` is traced a few px OUTSIDE the ink, never inside it; the flood finds
// the true edge. `ink` is the outline's luminance ceiling. Letters have no ink
// outline — they are cream spray paint on grey — so they use `paint` instead,
// a straight colour test, which is clean for them (paint lum ~200 against a
// plate that tops out ~130).
const SUBJECTS = {
	// the diving helmet: dome, two portholes, collar, breastplate, air hose
	h1: {
		hull: [
			circ([126, 100], 67),
			circ([78, 112], 27),
			circ([156, 112], 37),
			circ([193, 102], 14),
			poly([[62, 138], [196, 138], [196, 174], [62, 174]]),
			poly([[46, 160], [80, 154], [188, 154], [210, 170], [210, 202], [194, 218], [150, 230], [98, 230], [60, 214], [46, 192]]),
			line([[58, 166], [40, 176], [34, 196], [48, 212], [72, 216], [96, 214]], 12),
		],
		ink: 42,
	},
	// the sea mine: the ball and its nine horns. The chain stays on the plate:
	// it is the same grey as the steel and the mine hangs FROM it.
	h2: {
		hull: [
			circ([128, 135], 84),
			line([[104, 104], [72, 68]], 13),
			line([[154, 104], [188, 68]], 13),
			line([[60, 96], [30, 84]], 13),
			line([[196, 96], [226, 84]], 13),
			line([[60, 172], [36, 192]], 13),
			line([[196, 172], [220, 192]], 13),
			line([[98, 186], [74, 222]], 13),
			line([[158, 186], [182, 222]], 13),
			line([[128, 206], [128, 236]], 13),
		],
		ink: 40,
	},
	// the lantern and its wall bracket
	h3: {
		hull: [
			poly([[58, 56], [78, 38], [180, 38], [200, 56], [200, 180], [190, 202], [68, 202], [58, 180]]),
			poly([[90, 190], [138, 190], [138, 226], [90, 226]]),
		],
		// the wall bracket is as dark as the ink (lum ~25), so the rule that
		// sheds dark scraps would shed it: it is subject by fiat
		solid: [poly([[94, 194], [134, 194], [134, 222], [94, 222]])],
		ink: 40,
	},
	// the crossed signal flags: two cloths, two poles, the lashing
	h4: {
		hull: [
			poly([[70, 38], [126, 96], [130, 118], [100, 126], [86, 150], [60, 174], [44, 172], [44, 142], [10, 122], [38, 96], [60, 68]]),
			poly([[184, 38], [216, 88], [242, 118], [224, 140], [212, 172], [194, 170], [172, 150], [150, 126], [126, 118], [130, 96]]),
			line([[80, 44], [180, 206]], 10),
			line([[174, 44], [78, 206]], 10),
			line([[128, 108], [128, 164]], 10),
		],
		ink: 40,
		// the white cloth is as neutral as the steel, but far brighter (lum ~180
		// against a plate that sits ~86)
		wall: (r, g, b) => Math.max(r, g, b) - Math.min(r, g, b) > 45 || (r + g + b) / 3 > 200 || r - b > 4,
		// ...and the wall is the body, as on the scatter: cloth is blue or bright
		// white, the staffs and lashing are warm brown (r over b), and the steel is
		// always cool (b over r). Without it the cloths' painted shadow on the
		// steel, fenced in by the other staff, hung under each hem as a grey flap.
		bodyIsWall: true,
		// The two V's between the staffs, above and below the lashing, are STEEL.
		// The staffs are only ~40px apart near the crossing, so the grown hull all
		// but closed them and their insides sat deeper than the flood could reach:
		// a slab of plate came away with the flags and lit up with their flash.
		// Traced 8px in from each staff's centre line, so the staffs stay whole.
		never: [
			poly([[96, 50], [160, 50], [131, 104], [125, 104]]),
			poly([[125, 142], [131, 142], [168, 206], [88, 206]]),
		],
	},
	// the tarped crate (MysteryReveal): the tarp bundle with its ropes and the
	// crate's wooden foot. Only the subject is used — when the tarp comes off,
	// what is under it is the NEW symbol's own tile, not this plate.
	m: {
		hull: [
			poly([[20, 162], [34, 84], [76, 60], [112, 44], [162, 50], [220, 74], [226, 138], [240, 150], [234, 172], [208, 190], [152, 228], [88, 212], [54, 192], [24, 174]]),
		],
		ink: 40,
		// it flies off; nothing is drawn under it
		noShadow: true,
	},
	// the stencilled letters: cream paint, found by colour (see above)
	l1: { paint: true },
	l2: { paint: true },
	l3: { paint: true },
	l4: { paint: true },
	l5: { paint: true },
	// the banana net: the bunch, its netting, and the loose bananas at the foot.
	// The hook at the top stays on the plate — the net hangs from it — and so
	// does the SCATTER plaque under it.
	s: {
		hull: [
			poly([[30, 112], [58, 68], [100, 48], [132, 42], [166, 48], [208, 68], [228, 110], [228, 160], [226, 214], [196, 222], [168, 220], [130, 214], [80, 210], [44, 192], [30, 160]]),
		],
		ink: 44,
		// this plate is TEAL, as saturated as a subject (chroma ~57), so chroma
		// cannot be the wall. Hue can: teal is blue over red, and the bananas and
		// the rope are red over blue.
		wall: (r, g, b) => r - b > 10,
		// ...and the body is the WARM pixels, not the non-ink ones: the teal's
		// dark ribs are as dark as ink, fenced strips of plate off beside the net
		// and brought them along. A window of teal seen through the netting is a
		// hole in the subject, which is what it is.
		bodyIsWall: true,
		// the SCATTER plaque sits just under the net and stays on the plate
		never: [poly([[88, 216], [170, 216], [170, 244], [88, 244]])],
	},
};

// The frame band and anything outside it is never subject.
const INNER = { x0: 12, y0: 12, x1: 244, y1: 246 };
// The hull is grown by GROW before use, and the flood may run BAND px in from
// its edge looking for the ink. The first version used the traced hull as it
// stood with a 16px band: wherever the tracing dipped inside the ink (the
// helmet dome's top-left, the mine's crown, a flag's corner) everything past it
// counted as plate, and the flood then ate on through the bright interior. So
// the tracing is not trusted to be outside the ink: it is grown until it is.
const GROW = 8;
const BAND = 24;
// Dark pixels are kept only where they border the subject's lit BODY — the
// real outline always does. A drop shadow painted on the steel is as dark as
// ink and would otherwise come away with the subject as a floating arc.
const INK_REACH = 6;

const lumAt = (img, i) => (img.data[i * 4] + img.data[i * 4 + 1] + img.data[i * 4 + 2]) / 3;

const morph = (mask, W, H, R, grow) => {
	const pick = grow ? Math.max : Math.min;
	const tmp = new Uint8Array(W * H), out = new Uint8Array(W * H);
	for (let y = 0; y < H; y++)
		for (let x = 0; x < W; x++) {
			let v = grow ? 0 : 1;
			for (let d = -R; d <= R; d++) v = pick(v, mask[y * W + Math.min(W - 1, Math.max(0, x + d))]);
			tmp[y * W + x] = v;
		}
	for (let y = 0; y < H; y++)
		for (let x = 0; x < W; x++) {
			let v = grow ? 0 : 1;
			for (let d = -R; d <= R; d++) v = pick(v, tmp[Math.min(H - 1, Math.max(0, y + d)) * W + x]);
			out[y * W + x] = v;
		}
	return out;
};

const blur = (src, W, H, R) => {
	const tmp = new Float32Array(W * H), out = new Float32Array(W * H);
	for (let y = 0; y < H; y++)
		for (let x = 0; x < W; x++) {
			let s = 0, n = 0;
			for (let d = -R; d <= R; d++) {
				const xx = x + d;
				if (xx < 0 || xx >= W) continue;
				s += src[y * W + xx];
				n++;
			}
			tmp[y * W + x] = s / n;
		}
	for (let y = 0; y < H; y++)
		for (let x = 0; x < W; x++) {
			let s = 0, n = 0;
			for (let d = -R; d <= R; d++) {
				const yy = y + d;
				if (yy < 0 || yy >= H) continue;
				s += tmp[yy * W + x];
				n++;
			}
			out[y * W + x] = s / n;
		}
	return out;
};

// distance (px, 4-connected) from every pixel of `mask` to the nearest pixel
// outside it, capped
const depthInside = (mask, W, H, cap) => {
	const depth = new Float32Array(W * H);
	let ring = mask;
	for (let k = 1; k <= cap; k++) {
		const next = new Uint8Array(W * H);
		let any = false;
		for (let y = 1; y < H - 1; y++)
			for (let x = 1; x < W - 1; x++) {
				const i = y * W + x;
				if (ring[i] && ring[i - 1] && ring[i + 1] && ring[i - W] && ring[i + W]) {
					next[i] = 1;
					depth[i] = k;
					any = true;
				}
			}
		if (!any) break;
		ring = next;
	}
	return depth;
};

const cut = (img, spec) => {
	const W = img.width, H = img.height, N = W * H;
	const inner = (x, y) => x >= INNER.x0 * K && x < INNER.x1 * K && y >= INNER.y0 * K && y < INNER.y1 * K;
	let hard = new Uint8Array(N);

	if (spec.paint) {
		// cream paint: bright and near-neutral; the plate tops out ~130 lum
		for (let i = 0; i < N; i++) {
			const x = i % W, y = (i / W) | 0;
			if (!inner(x, y)) continue;
			const r = img.data[i * 4], g = img.data[i * 4 + 1], b = img.data[i * 4 + 2];
			hard[i] = (r + g + b) / 3 > 150 && Math.max(r, g, b) - Math.min(r, g, b) < 60 ? 1 : 0;
		}
		// the spray edge is speckled: close it, drop the loose flecks
		hard = morph(morph(hard, W, H, 2, true), W, H, 2, false);
	} else {
		let hull = new Uint8Array(N);
		for (let i = 0; i < N; i++) {
			const x = i % W, y = (i / W) | 0;
			if (!inner(x, y)) continue;
			const cx = (x + 0.5) / K, cy = (y + 0.5) / K;
			hull[i] = spec.hull.some((s) => inShape(s, cx, cy)) ? 1 : 0;
		}
		hull = morph(hull, W, H, GROW * K, true);
		for (let i = 0; i < N; i++) if (!inner(i % W, (i / W) | 0)) hull[i] = 0;
		const depth = depthInside(hull, W, H, BAND * K + 1);
		// the ink, closed so a hairline gap in the outline cannot let the flood in
		const ink = new Uint8Array(N);
		for (let i = 0; i < N; i++) ink[i] = lumAt(img, i) < spec.ink ? 1 : 0;
		const sealed = morph(morph(ink, W, H, 1, true), W, H, 1, false);
		// ...and the flood may not walk through anything that is plainly SUBJECT.
		// It used to run through anything that was not ink, and one faint gap in
		// the helmet's outline let it into the dome, where it stripped the brass
		// rim off the top (the cut began 14px inside the ink). A test for "looks
		// like the plate's average" was worse: rib shadows, highlights and rust
		// all failed it and came away with the subjects as slabs of steel. What
		// separates them, measured, is saturation: the grey steel sits at chroma
		// 18-28 (rust rarely past 64); brass, red paint, green glass and the blue
		// cloth are all 80+. Each symbol names its own wall (see SUBJECTS).
		// Chroma alone leaked on the helmet's SHADOW side: brass in shadow is dark
		// and low-chroma, passed for steel, and the flood took the porthole glass
		// and the dome's edge. Hue still tells them apart — brass is warm (r over
		// b) however dark it gets, and this steel is always cool — so warmth is a
		// wall too. Rust is warm as well, but it lies in flecks the flood walks
		// round.
		const wall = spec.wall ?? ((r, g, b) => Math.max(r, g, b) - Math.min(r, g, b) > 45 || r - b > 8);
		const blocked = (i) => wall(img.data[i * 4], img.data[i * 4 + 1], img.data[i * 4 + 2]);
		// flood from outside the hull, through steel, within the band only
		const outside = new Uint8Array(N);
		const q = [];
		for (let i = 0; i < N; i++) if (!hull[i]) outside[i] = 1;
		for (let i = 0; i < N; i++) {
			if (!hull[i]) continue;
			const x = i % W;
			if ((x > 0 && !hull[i - 1]) || (x < W - 1 && !hull[i + 1]) || !hull[i - W] || !hull[i + W]) q.push(i);
		}
		while (q.length) {
			const i = q.pop();
			if (outside[i] || sealed[i] || blocked(i) || depth[i] > BAND * K) continue;
			outside[i] = 1;
			const x = i % W;
			if (x > 0) q.push(i - 1);
			if (x < W - 1) q.push(i + 1);
			if (i >= W) q.push(i - W);
			if (i < N - W) q.push(i + W);
		}
		for (let i = 0; i < N; i++) hard[i] = outside[i] ? 0 : 1;

		// shed the dark scraps: the lit body, its big islands, and only the ink
		// within INK_REACH of it
		const body = new Uint8Array(N);
		for (let i = 0; i < N; i++) body[i] = hard[i] && (spec.bodyIsWall ? blocked(i) : !ink[i]) ? 1 : 0;
		const bodyKeep = new Uint8Array(N);
		const seenB = new Uint8Array(N);
		for (let seed = 0; seed < N; seed++) {
			if (!body[seed] || seenB[seed]) continue;
			const isl = [seed];
			seenB[seed] = 1;
			for (let k = 0; k < isl.length; k++) {
				const i = isl[k];
				const x = i % W;
				for (const n of [x > 0 ? i - 1 : -1, x < W - 1 ? i + 1 : -1, i >= W ? i - W : -1, i < N - W ? i + W : -1]) {
					if (n < 0 || !body[n] || seenB[n]) continue;
					seenB[n] = 1;
					isl.push(n);
				}
			}
			if (isl.length >= 150 * K * K) for (const i of isl) bodyKeep[i] = 1;
		}
		// A dark region is shed only if it TOUCHES THE OUTSIDE: that is the drop
		// shadow painted on the steel. Dark enclosed inside the subject — the
		// helmet's porthole glass, the shade low on the mine — is drawing, and
		// the first version of this rule punched it out as holes.
		const near = morph(bodyKeep, W, H, INK_REACH * K, true);
		const candidate = new Uint8Array(N);
		// only DARK pixels are candidates: a painted shadow is dark, and a small
		// lit piece of drawing — the red tip of the mine's bottom horn, cut off
		// from the ball by the shade under it — must never be shed with it
		// For the symbols whose body is their colour (the net, the flags), "not
		// drawing" means not that colour — steel or teal — rather than dark.
		const notDrawing = (i) => (spec.bodyIsWall ? !blocked(i) : ink[i]);
		// Close to the body only the INK is spared (the outline); plain steel
		// beside the edge is not, or it rides along as a sliver.
		for (let i = 0; i < N; i++)
			candidate[i] = hard[i] && notDrawing(i) && !bodyKeep[i] && !(near[i] && (ink[i] || !spec.bodyIsWall)) ? 1 : 0;
		const shed = new Uint8Array(N);
		const seenD = new Uint8Array(N);
		for (let seed = 0; seed < N; seed++) {
			if (!candidate[seed] || seenD[seed]) continue;
			const comp = [seed];
			seenD[seed] = 1;
			let touches = false;
			for (let k = 0; k < comp.length; k++) {
				const i = comp[k];
				const x = i % W;
				for (const n of [x > 0 ? i - 1 : -1, x < W - 1 ? i + 1 : -1, i >= W ? i - W : -1, i < N - W ? i + W : -1]) {
					if (n < 0) continue;
					if (!hard[n]) touches = true;
					if (!candidate[n] || seenD[n]) continue;
					seenD[n] = 1;
					comp.push(n);
				}
			}
			if (touches) for (const i of comp) shed[i] = 1;
		}
		// Everything the flood did not reach stays, except the shed scraps. The
		// version before kept only the big lit islands and the ink next to them,
		// which threw away every small enclosed piece of drawing: each pane of the
		// helmet's porthole glass, cool grey between brass bars, went as a hole.
		for (let i = 0; i < N; i++) if (shed[i]) hard[i] = 0;
		for (let i = 0; i < N; i++) {
			if (!spec.never) break;
			const x = i % W, y = (i / W) | 0;
			if (spec.never.some((s) => inShape(s, (x + 0.5) / K, (y + 0.5) / K))) hard[i] = 0;
		}
		for (let i = 0; i < N; i++) {
			if (!spec.solid) break;
			const x = i % W, y = (i / W) | 0;
			if (spec.solid.some((s) => inShape(s, (x + 0.5) / K, (y + 0.5) / K))) hard[i] = 1;
		}
	}

	// keep the islands big enough to be drawing, not a fleck of rust or spray
	const keep = new Uint8Array(N);
	const seen = new Uint8Array(N);
	const MIN = 60 * K * K;
	for (let seed = 0; seed < N; seed++) {
		if (!hard[seed] || seen[seed]) continue;
		const island = [seed];
		seen[seed] = 1;
		for (let k = 0; k < island.length; k++) {
			const i = island[k];
			const x = i % W;
			for (const n of [x > 0 ? i - 1 : -1, x < W - 1 ? i + 1 : -1, i >= W ? i - W : -1, i < N - W ? i + W : -1]) {
				if (n < 0 || !hard[n] || seen[n]) continue;
				seen[n] = 1;
				island.push(n);
			}
		}
		if (island.length >= MIN) for (const i of island) keep[i] = 1;
	}
	// fill enclosed holes that are small (a letter's counter is NOT small: the
	// A, the Q, the 0 keep their windows of plate)
	{
		const out = new Uint8Array(N);
		const q = [];
		for (let x = 0; x < W; x++) q.push(x, (H - 1) * W + x);
		for (let y = 0; y < H; y++) q.push(y * W, y * W + W - 1);
		while (q.length) {
			const i = q.pop();
			if (out[i] || keep[i]) continue;
			out[i] = 1;
			const x = i % W;
			if (x > 0) q.push(i - 1);
			if (x < W - 1) q.push(i + 1);
			if (i >= W) q.push(i - W);
			if (i < N - W) q.push(i + W);
		}
		const seen2 = new Uint8Array(N);
		for (let seed = 0; seed < N; seed++) {
			if (out[seed] || keep[seed] || seen2[seed]) continue;
			const region = [seed];
			seen2[seed] = 1;
			for (let k = 0; k < region.length; k++) {
				const i = region[k];
				const x = i % W;
				for (const n of [x > 0 ? i - 1 : -1, x < W - 1 ? i + 1 : -1, i >= W ? i - W : -1, i < N - W ? i + W : -1]) {
					if (n < 0 || out[n] || keep[n] || seen2[n]) continue;
					seen2[n] = 1;
					region.push(n);
				}
			}
			// ...or BRIGHT: a large enclosed region whose average is well above the
			// steel's (~86 lum) is paint — the white square on the right flag —
			// while a letter's counter, which is steel, stays a window
			let lum = 0;
			for (const i of region) lum += lumAt(img, i);
			if (region.length < 90 * K * K || lum / region.length > 140) for (const i of region) keep[i] = 1;
		}
	}
	// grow 1px so the antialiased edge comes along, then feather 2px
	const grown = morph(keep, W, H, 1, true);
	return blur(Float32Array.from(grown), W, H, 2);
};

// THE PLATE BEHIND THE SUBJECT, rebuilt column by column.
//
// Bubis fills the hole by diffusing its rim inward, which on basalt is right
// and on corrugated steel smears the ribs into a blur. The ribs run VERTICALLY,
// so the panel is (nearly) the same all the way down any one column — and a
// column's true look is its MEDIAN over the whole panel. That is what fills
// the hole: robust to the rust flecks, and to the subject's own glow and edge
// shade painted on the steel round it.
//
// The first version seeded each column from the pixels just above and below
// the hole instead. Those still carry the subject's glow and bevel, and the
// whole column inherited it: a brass stripe down the helmet's plate, a red one
// down the mine's, green down the lantern's. Now the ends only blend in over a
// few px at the hole's edge (so there is no seam), and the middle is the
// column's own median. A slight darkening toward the middle stands in for the
// contact shadow the subject cast there.
const fillPlate = (img, alpha) => {
	const W = img.width, H = img.height, N = W * H;
	const hole = new Uint8Array(N);
	for (let i = 0; i < N; i++) hole[i] = alpha[i] > 0.02 ? 1 : 0;
	// grown: the ink and the bevel shade round a subject run a little wider
	// than its cut, and a ring of it left on the plate reads as a ghost
	const big = morph(hole, W, H, 4 * K, true);
	const depth = depthInside(big, W, H, 40 * K);
	const out = Buffer.from(img.data);
	const y0 = INNER.y0 * K, y1 = INNER.y1 * K;
	const SAMPLE = 3 * K, EDGE = 6 * K;
	// The panel's typical colour, and a column median that only counts pixels
	// near it. Under the scatter's net the few clear rows left in a column are
	// mostly hook, rope and the brass plaque, and the plain median of those
	// painted a brown stripe down the teal.
	const typical = [0, 1, 2].map((c) => {
		const v = [];
		for (let y = y0; y < y1; y += 2)
			for (let x = INNER.x0 * K; x < INNER.x1 * K; x += 2) if (!big[y * W + x]) v.push(img.data[(y * W + x) * 4 + c]);
		return v.sort((p, q) => p - q)[v.length >> 1];
	});
	const plateLike = (i) =>
		Math.abs(img.data[i * 4] - typical[0]) + Math.abs(img.data[i * 4 + 1] - typical[1]) + Math.abs(img.data[i * 4 + 2] - typical[2]) < 110;
	const colMed = [];
	for (let x = 0; x < W; x++) {
		const vals = [[], [], []];
		for (let y = y0; y < y1; y++) {
			const i = y * W + x;
			if (big[i] || !plateLike(i)) continue;
			for (let c = 0; c < 3; c++) vals[c].push(img.data[i * 4 + c]);
		}
		colMed[x] = vals[0].length >= 12 * K ? vals.map((v) => v.sort((p, q) => p - q)[v.length >> 1]) : null;
	}
	for (let x = 0; x < W; x++) {
		// a column with too few clear plate pixels borrows its nearest neighbours'
		let med = colMed[x];
		for (let d = 1; !med && d < 24 * K; d++) med = colMed[x - d] ?? colMed[x + d] ?? null;
		if (!med) continue;
		let y = 0;
		while (y < H) {
			if (!big[y * W + x]) {
				y++;
				continue;
			}
			const top = y;
			while (y < H && big[y * W + x]) y++;
			const bottom = y; // first clear row below
			// the colour at each end of the run, to blend the seam — but only if it
			// IS plate: an end still tinted by the subject's rim light would
			// otherwise bleed a brass or red arc down into the fill
			const avg = (from, dir) => {
				const acc = [0, 0, 0];
				let n = 0;
				for (let k = 0; k < SAMPLE; k++) {
					const yy = from + dir * k;
					if (yy < 0 || yy >= H || big[yy * W + x]) break;
					if (!plateLike(yy * W + x)) continue;
					for (let c = 0; c < 3; c++) acc[c] += img.data[(yy * W + x) * 4 + c];
					n++;
				}
				return n ? acc.map((v) => v / n) : med;
			};
			const a = avg(top - 1, -1), b = avg(bottom, 1);
			for (let yy = top; yy < bottom; yy++) {
				const i = yy * W + x;
				const wa = Math.exp(-(yy - top) / EDGE), wb = Math.exp(-(bottom - 1 - yy) / EDGE);
				const shade = 1 - 0.08 * Math.min(1, depth[i] / (14 * K));
				for (let c = 0; c < 3; c++) {
					const v = med[c] + (a[c] - med[c]) * wa + (b[c] - med[c]) * wb;
					out[i * 4 + c] = Math.max(0, Math.min(255, Math.round(v * shade)));
				}
				out[i * 4 + 3] = 255;
			}
		}
	}
	// a touch of horizontal softening inside the hole only, so neighbouring
	// columns do not stripe where their medians differ by a level or two
	const soft = Buffer.from(out);
	for (let y = 0; y < H; y++)
		for (let x = 1; x < W - 1; x++) {
			const i = y * W + x;
			if (!big[i]) continue;
			for (let c = 0; c < 3; c++) soft[i * 4 + c] = Math.round((out[(i - 1) * 4 + c] + 2 * out[i * 4 + c] + out[(i + 1) * 4 + c]) / 4);
		}
	return soft;
};

// the sheen: a soft diagonal band crossing the subject over the frames,
// strongest on its own highlights, with a small glint near the end — Bubis's
// bake, unchanged apart from the layer size.
const bakeSheen = (img, alpha) => {
	const W = img.width, H = img.height;
	const C = SHEEN_CELL, S = W / C;
	const rows = Math.ceil(SHEEN_FRAMES / SHEEN_COLS);
	const AW = SHEEN_COLS * C;
	const atlas = new Uint8Array(AW * rows * C * 4);
	const L = (i) => 0.3 * img.data[i * 4] + 0.59 * img.data[i * 4 + 1] + 0.11 * img.data[i * 4 + 2];
	const lums = [];
	for (let i = 0; i < W * H; i++) if (alpha[i] > 0.5) lums.push(L(i));
	lums.sort((a, b) => a - b);
	const median = lums[lums.length >> 1], top = lums[Math.floor(lums.length * 0.98)];
	const gloss = (i) => 0.45 + 0.55 * Math.max(0, Math.min(1, (L(i) - median) / Math.max(1, top - median)));
	let dMin = Infinity, dMax = -Infinity, glintI = -1, glintL = -1;
	for (let i = 0; i < W * H; i++) {
		if (alpha[i] < 0.5) continue;
		const d = (i % W) + ((i / W) | 0);
		dMin = Math.min(dMin, d);
		dMax = Math.max(dMax, d);
	}
	for (let i = 0; i < W * H; i++) {
		if (alpha[i] < 0.9 || (i % W) + ((i / W) | 0) < dMin + (dMax - dMin) * 0.55) continue;
		if (L(i) > glintL) {
			glintL = L(i);
			glintI = i;
		}
	}
	const gx = glintI % W, gy = (glintI / W) | 0;
	const BAND_W = 26 * K;
	for (let f = 0; f < SHEEN_FRAMES; f++) {
		const t = f / (SHEEN_FRAMES - 1);
		const centre = dMin - BAND_W + t * (dMax - dMin + 2 * BAND_W);
		const glint = Math.max(0, 1 - Math.abs(t - 0.8) / 0.2);
		const ox = (f % SHEEN_COLS) * C, oy = Math.floor(f / SHEEN_COLS) * C;
		for (let cy = 0; cy < C; cy++)
			for (let cx = 0; cx < C; cx++) {
				let v = 0;
				for (let sy = 0; sy < S; sy++)
					for (let sx = 0; sx < S; sx++) {
						const x = cx * S + sx, y = cy * S + sy, i = y * W + x;
						if (alpha[i] <= 0) continue;
						const u = (x + y - centre) / BAND_W;
						const band = Math.exp(-u * u * 2.2);
						let star = 0;
						if (glint > 0) {
							const dx = (x - gx) / K, dy = (y - gy) / K;
							const r = Math.hypot(dx, dy);
							const cross = Math.exp(-(dx * dx) / 3) * Math.exp(-(dy * dy) / 400) + Math.exp(-(dy * dy) / 3) * Math.exp(-(dx * dx) / 400);
							star = glint * (Math.exp(-(r * r) / 30) + 0.8 * cross);
						}
						v += alpha[i] * Math.min(1, band * gloss(i) + star);
					}
				v /= S * S;
				const o = ((oy + cy) * AW + ox + cx) * 4;
				atlas[o] = 255;
				atlas[o + 1] = 250;
				atlas[o + 2] = 232;
				atlas[o + 3] = Math.round(255 * Math.min(1, v));
			}
	}
	return { atlas, width: AW, height: rows * C };
};

for (const name of Object.keys(SUBJECTS)) {
	if (only && !only.includes(name)) continue;
	const img = readScaled(`${name}.png`);
	const W = img.width, H = img.height, N = W * H;
	const alpha = cut(img, SUBJECTS[name]);

	// colour only where there is alpha: the plate's colour left under fully
	// transparent pixels is invisible and was most of these files' weight
	const subject = new Uint8Array(N * 4);
	for (let i = 0; i < N; i++) {
		const a = Math.round(255 * alpha[i]);
		if (a > 0) subject.set([img.data[i * 4], img.data[i * 4 + 1], img.data[i * 4 + 2], a], i * 4);
	}
	write(`${name}_subject.png`, W, H, subject);
	write(`${name}_plate.png`, W, H, fillPlate(img, alpha));

	// the shadow is a heavily blurred silhouette, so it is stored at a quarter
	// size (SymbolMeshWin scales it by its own texture width)
	if (!SUBJECTS[name].noShadow) {
	const soft = blur(blur(alpha, W, H, 5 * K), W, H, 5 * K);
	const SW = W / 4, SH = H / 4;
	const shadow = new Uint8Array(SW * SH * 4);
	for (let y = 0; y < SH; y++)
		for (let x = 0; x < SW; x++) {
			let v = 0;
			for (let dy = 0; dy < 4; dy++) for (let dx = 0; dx < 4; dx++) v += soft[(y * 4 + dy) * W + x * 4 + dx];
			shadow.set([6, 8, 12, Math.round(255 * Math.min(1, (v / 16) * 1.15))], (y * SW + x) * 4);
		}
	write(`${name}_shadow.png`, SW, SH, shadow);
	}

	const sheen = bakeSheen(img, alpha);
	write(`${name}_sheen.png`, sheen.width, sheen.height, sheen.atlas);

	let px = 0;
	for (let i = 0; i < N; i++) if (alpha[i] > 0.5) px++;
	console.log(`${name}: subject ${(px / (K * K)) | 0} canvas px -> ${name}_{subject,plate,shadow,sheen}.png`);
}

// ---------------------------------------------------------------------------
// the panel-mode symbols: glow + sheen, masked to the spec's `inked` region
if (!only || only.includes('w')) {
	const { MESH_WINS } = await import(pathToFileURL(path.join(appRoot, 'src/game/meshWin/index.ts')).href);
	for (const spec of Object.values(MESH_WINS)) {
		if (spec.mode !== 'panel') continue;
		const name = spec.symbol.toLowerCase();
		const art = readScaled(`${name}.png`);
		const W = art.width, H = art.height, N = W * H;
		const hard = new Float32Array(N);
		for (let i = 0; i < N; i++) {
			const inside = spec.inked([(i % W) / K, ((i / W) | 0) / K]);
			const coloured = !spec.inkColor || spec.inkColor(art.data[i * 4], art.data[i * 4 + 1], art.data[i * 4 + 2]);
			hard[i] = inside && coloured ? 1 : 0;
		}
		const mask = blur(hard, W, H, 3 * K);
		const glow = new Uint8Array(N * 4);
		for (let i = 0; i < N; i++) glow.set([art.data[i * 4], art.data[i * 4 + 1], art.data[i * 4 + 2], Math.round(255 * mask[i])], i * 4);
		write(`${name}_glow.png`, W, H, glow);
		const sheen = bakeSheen(art, mask);
		write(`${name}_sheen.png`, sheen.width, sheen.height, sheen.atlas);
		console.log(`${name}: panel -> ${name}_{glow,sheen}.png`);
	}
}
