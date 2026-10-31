/**
 * Things that HAPPEN on the farm at night (user 2026-10-31: 背景加強 — 探照燈、雲遮月、地面薄霧、大獎時飛碟吸走乳牛).
 * Drawn the print way (ART_REQUEST §0): flat shapes, coarse halftone, ink keylines on the objects, no soft glow.
 *
 *   mist        three bands of flat, lobed mist drift across the field at different speeds (both sets)
 *   searchlight every SEARCH_EVERY s the little saucer top left switches its lamp on with a stutter, sweeps the
 *               barn and the field in front of it and snaps it off (base set: the feature has the mothership)
 *   moon cloud  every CLOUD_EVERY s a cloud slides across the moon and the whole night dims under it
 *   abduction   on a big win a saucer swoops in across the moon with a cow hanging in its beam, reels her up,
 *               and darts off — the board covers the middle of the plate, so it happens in the open sky top
 *               right, where the moon is
 *   mothership  (feature set) its six ports light one after another round the hull, a lit ring runs out
 *               across the crop circle, scan lines climb the tractor beam — mostly behind the board on a
 *               desktop, the top of the picture on a phone
 *
 * Everything is a function of time in seconds, in the 1920×1080 plate's own pixels.
 */
import type { Graphics } from 'pixi.js';

export const INK = 0x141a33, CREAM = 0xf6eed6, GREEN = 0x86e35b, LAMP = 0xf6e7a4;
export const SEARCH_EVERY = 34, CLOUD_EVERY = 46;
export const ABDUCTION_S = 4.2;

const clamp = (v: number) => Math.max(0, Math.min(1, v));
const ease = (v: number) => { const u = clamp(v); return u * u * (3 - 2 * u); };
const out3 = (v: number) => 1 - (1 - clamp(v)) ** 3;
const in2 = (v: number) => clamp(v) ** 2;
const hash = (n: number) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };

// ── mist ────────────────────────────────────────────────────────────────────
// long, low banks: wide lobes that overlap a lot, so each bank reads as one wavy-edged shape, not a string of beads
const MIST = [
	{ y: 548, h: 16, speed: 7, gap: 210, alpha: 0.09, seed: 1 },
	{ y: 590, h: 20, speed: -5, gap: 260, alpha: 0.08, seed: 7 },
] as const;
/** flat lobed banks: each bank is one path, so its overlapping lobes print as one flat shape */
export const drawMist = (g: Graphics, t: number) => {
	for (const m of MIST) {
		const span = 1920 + m.gap * 4, shift = (((t * m.speed) % span) + span) % span;
		for (let i = 0; i * m.gap < span; i++) {
			const x = ((i * m.gap + shift) % span) - m.gap * 2, w = m.gap * (1.1 + 0.5 * hash(i + m.seed)), h = m.h * (0.75 + 0.5 * hash(i * 3 + m.seed));
			g.ellipse(x, m.y + (hash(i * 7 + m.seed) - 0.5) * m.h * 0.8, w, h);
		}
		g.fill({ color: 0xa8b8e4, alpha: m.alpha });
	}
};

// ── the searchlight ─────────────────────────────────────────────────────────
/** the little saucer's belly, riding its hover (bgProps: hover [6 px, 2.5°, 1900 ms]) */
export const saucerBelly = (t: number): [number, number] => [465, 100 + 6 * Math.sin((t * 1000 * Math.PI * 2) / 1900)];
/** 0 off, 1 on: a stuttering switch-on, a sweep there and back, a snap off */
export const searchLevel = (t: number) => {
	const u = t % SEARCH_EVERY;
	if (u < 4 || u > 13.4) return 0;
	const on = u - 4;
	if (on < 0.45) return [0.06, 0.14, 0.24, 0.45].some((k, i) => on >= k && on < k + (i % 2 ? 0.1 : 0.05)) ? 0 : 1;
	return 1;
};
export const searchSpot = (t: number): [number, number] => {
	const u = clamp(((t % SEARCH_EVERY) - 4.5) / 8.6);
	// out to the far side of the barn and back, lingering at each end
	const s = 0.5 - 0.5 * Math.cos(u * Math.PI * 2);
	return [590 - 470 * s, 640 - 70 * Math.sin(u * Math.PI)];
};
export const drawSearchlight = (g: Graphics, t: number) => {
	const k = searchLevel(t);
	if (!k) return;
	const [ax, ay] = saucerBelly(t), [sx, sy] = searchSpot(t), rx = 92, ry = 24;
	// the cone: apex at the lamp, out to the spot's sides
	g.poly([ax - 7, ay, ax + 7, ay, sx + rx, sy, sx - rx, sy]).fill({ color: LAMP, alpha: 0.16 });
	// halftone in the cone, thinning toward the ground
	for (let row = 0, y = ay + 10; y < sy - 6; row++, y += 14) {
		const v = (y - ay) / (sy - ay), cx = ax + (sx - ax) * v, half = 7 + (rx - 7) * v - 6, dot = 2.6 * (1 - v * 0.7);
		for (let x = -half + (row % 2) * 7; x <= half; x += 14) g.circle(cx + x, y, dot);
	}
	g.fill({ color: LAMP, alpha: 0.42 });
	// the lit ground: a pale ellipse and a ring of denser dots
	g.ellipse(sx, sy, rx, ry).fill({ color: LAMP, alpha: 0.24 });
	g.ellipse(sx, sy, rx * 0.62, ry * 0.62).fill({ color: LAMP, alpha: 0.16 });
};

// ── the cloud over the moon ─────────────────────────────────────────────────
export const MOON_AT: [number, number, number] = [1617, 155, 125];
// the painted clouds' own make-up (sampled off the plate round the moon): a scalloped top of small lobes with a
// grey-beige moonlit rim, a flat underside, mid blue body, lighter blue halftone
const LOBES: [number, number, number][] = [
	// the scalloped crown
	...Array.from({ length: 13 }, (_, i): [number, number, number] => {
		const arch = Math.sin(((i + 0.5) / 13) * Math.PI);
		return [-180 + i * 30, 4 - arch * 44 + (i % 2) * 7, 18 + 15 * arch + 4 * Math.sin(i * 2.3)];
	}),
	// a second, lower row of small puffs so the underside is not one straight cut
	...Array.from({ length: 9 }, (_, i): [number, number, number] => [-170 + i * 42, 18 + (i % 2) * 4, 16 + 4 * Math.sin(i * 1.7)]),
];
const BASE = { left: -160, right: 172, top: -16, bottom: 28 }; // tucked up under the crown
const inCloud = (x: number, y: number) =>
	(y >= BASE.top && y <= BASE.bottom && x >= BASE.left && x <= BASE.right) || LOBES.some(([lx, ly, r]) => (x - lx) ** 2 + (y - ly) ** 2 < r * r);
export const cloudX = (t: number) => {
	const u = (t % CLOUD_EVERY) - 6;
	return u < 0 || u > 22 ? null : 2150 - (u / 22) * 1000;
};
/** how much of the moon the cloud hides, 0..1 */
export const moonCover = (t: number) => {
	const x = cloudX(t);
	return x === null ? 0 : clamp(1 - Math.abs(x - MOON_AT[0]) / 260);
};
export const drawMoonCloud = (g: Graphics, t: number) => {
	const x = cloudX(t);
	if (x === null) return;
	const y = MOON_AT[1] + 46;
	// one fill per piece: circles and a rectangle in one path wind opposite ways and punch holes in each other
	const shape = (dy: number, inset: number, color: number) => {
		for (const [dx, ly, r] of LOBES) g.circle(x + dx, y + ly + dy, r - inset).fill(color);
		g.roundRect(x + BASE.left + inset, y + BASE.top + dy, BASE.right - BASE.left - inset * 2, BASE.bottom - BASE.top, 10).fill(color);
	};
	// the moonlit rim is the cloud printed a little higher in grey-beige, under the body
	shape(-5, 0, 0xa29d8f);
	shape(0, 1, 0x31508b);
	// lighter halftone inside, densest toward the lit top
	for (let row = 0, yy = -76; yy < BASE.bottom + 8; row++, yy += 8) for (let xx = BASE.left + (row % 2) * 4; xx < BASE.right; xx += 8) {
		if (!inCloud(xx, yy) || !inCloud(xx, yy - 8)) continue;
		const r = 2.2 * (1 - (yy + 76) / 120);
		if (r > 0.5) g.circle(x + xx, y + yy, r);
	}
	g.fill(0x6a82b8);
};

// ── the abduction ───────────────────────────────────────────────────────────
export type Craft = { x: number; y: number; tilt: number; visible: boolean };
export type CowPose = { x: number; y: number; rot: number; scale: number; visible: boolean };
// over the lower half of the moon, and high enough that the beam ends above the mascot's helmet on desktop
const HOVER: [number, number] = [1690, 172];
const BELLY = 52; // from the craft sprite's centre to its belly, plate px

/** u: seconds since the big win */
export const craftAt = (u: number): Craft => {
	if (u < 0 || u > ABDUCTION_S) return { x: 0, y: 0, tilt: 0, visible: false };
	const bob = 5 * Math.sin(u * 4.4);
	if (u < 1) {
		// swooping in from the right, banked, settling level
		const k = out3(u);
		return { x: 2120 + (HOVER[0] - 2120) * k, y: 330 + (HOVER[1] - 330) * k + bob * k, tilt: -0.32 * (1 - k) + 0.05 * Math.sin(k * Math.PI), visible: true };
	}
	if (u < 3.05) return { x: HOVER[0], y: HOVER[1] + bob, tilt: 0.03 * Math.sin(u * 3), visible: true };
	// a dip, then gone up and away to the left
	const v = (u - 3.05) / 0.9;
	const dip = Math.sin(Math.PI * clamp(v / 0.3)) * 12 * (v < 0.3 ? 1 : 0);
	const go = in2((v - 0.25) / 0.75);
	return { x: HOVER[0] - 340 * go, y: HOVER[1] + bob + dip - 460 * go, tilt: 0.28 * go, visible: v < 1 };
};
export const beamLength = (u: number) => (u < 0 || u > 2.95 ? 0 : 128 * (u < 2.7 ? 1 : 1 - ease((u - 2.7) / 0.25)));
export const cowAt = (u: number, craft: Craft): CowPose => {
	if (!craft.visible || u > 2.75) return { x: 0, y: 0, rot: 0, scale: 0, visible: false };
	// she hangs at the bottom of the beam on the way in, then is reeled up into the belly
	const lift = u < 1.1 ? 0 : ease((u - 1.1) / 1.45);
	const gulp = u < 2.55 ? 1 : 1 - ease((u - 2.55) / 0.2);
	const swing = (1 - lift * 0.7) * (0.22 * Math.sin(u * 3.1) + 0.08 * Math.sin(u * 7.3));
	return {
		x: craft.x + Math.sin(u * 2.2) * 6 * (1 - lift),
		y: craft.y + BELLY + 92 - 74 * lift,
		rot: swing + craft.tilt * 0.5,
		scale: (1 - 0.35 * lift) * gulp,
		visible: gulp > 0.02,
	};
};
/** the craft's beam: the same print beam as the saucer symbol's — a green wash, halftone, inked sides */
export const drawAbductionBeam = (g: Graphics, u: number, craft: Craft) => {
	const len = beamLength(u);
	if (!craft.visible || len < 2) return;
	const tx = craft.x, ty = craft.y + BELLY - 4, wTop = 22, wBot = 22 + len * 0.34;
	g.poly([tx - wTop, ty, tx + wTop, ty, tx + wBot, ty + len, tx - wBot, ty + len]).fill({ color: GREEN, alpha: 0.32 });
	for (let row = 0, y = ty + 6; y < ty + len - 3; row++, y += 9) {
		const v = (y - ty) / len, half = wTop + (wBot - wTop) * v - 5, dot = 2.8 * (1 - v * 0.8);
		for (let x = -half + (row % 2) * 4.5; x <= half; x += 9) g.circle(tx + x, y, dot);
	}
	g.fill({ color: GREEN, alpha: 0.85 });
	for (const side of [-1, 1]) g.moveTo(tx + side * wTop, ty).lineTo(tx + side * wBot, ty + len).stroke({ width: 3, color: INK });
	for (let i = 0; i < 3; i++) {
		const v = (u * 1.6 + i / 3) % 1, y = ty + len - v * len, half = wTop + (wBot - wTop) * (1 - v);
		g.moveTo(tx - half + 4, y).lineTo(tx + half - 4, y).stroke({ width: 3, color: CREAM });
	}
};
/** the gulp: a burst at the belly as she goes in, and speed strokes when it darts off */
export const drawAbductionFx = (g: Graphics, u: number, craft: Craft) => {
	if (!craft.visible) return;
	const p = (u - 2.6) / 0.32;
	if (p > 0 && p < 1) {
		const r = 30 * (p < 0.25 ? out3(p / 0.25) * 1.15 : 1.15 - 1.15 * ease((p - 0.25) / 0.75)), cx = craft.x, cy = craft.y + BELLY;
		const pts: number[] = [];
		for (let i = 0; i < 16; i++) { const a = (i / 16) * Math.PI * 2, rr = i % 2 ? r * 0.48 : r; pts.push(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); }
		if (r > 1) g.poly(pts).fill(CREAM).stroke({ width: 3, color: INK, join: 'round' });
	}
	const go = (u - 3.25) / 0.6;
	if (go > 0 && go < 1) for (let i = 0; i < 4; i++) {
		// strokes trailing behind it, down and to the right of its path
		const k = 1 - go, x = craft.x + 70 + i * 16, y = craft.y + 40 + i * 20;
		g.moveTo(x, y).lineTo(x + 70 * k, y + 90 * k).stroke({ width: 5, color: INK, cap: 'round' });
		g.moveTo(x, y).lineTo(x + 70 * k, y + 90 * k).stroke({ width: 2, color: CREAM, cap: 'round' });
	}
};

/** a cow, side on, facing right, about 110 px nose to tail: flat print colours, ink keylines, legs dangling */
export const drawCow = (g: Graphics) => {
	const line = { width: 3.5, color: INK, join: 'round' as const, cap: 'round' as const };
	// legs first (behind the body), dangling a little apart
	for (const [x, a] of [[-34, -0.18], [-20, 0.12], [16, -0.1], [30, 0.2]] as const) {
		const ex = x + Math.sin(a) * 26, ey = 14 + Math.cos(a) * 26;
		g.moveTo(x, 10).lineTo(ex, ey).stroke({ width: 13, color: INK, cap: 'round' });
		g.moveTo(x, 10).lineTo(ex, ey).stroke({ width: 7.5, color: CREAM, cap: 'round' });
		g.circle(ex, ey + 1, 5).fill(0x3a2f2a).stroke({ width: 2, color: INK });
	}
	// tail
	g.moveTo(-44, -6).quadraticCurveTo(-60, 2, -56, 22).stroke(line);
	g.ellipse(-56, 25, 4, 6).fill(INK);
	// body
	g.roundRect(-46, -22, 92, 44, 20).fill(CREAM).stroke(line);
	// spots
	g.ellipse(-22, -8, 14, 11).fill(INK);
	g.ellipse(10, 8, 12, 8).fill(INK);
	g.ellipse(-36, 10, 7, 6).fill(INK);
	g.ellipse(22, -14, 8, 5).fill(INK);
	// udder
	g.ellipse(-4, 22, 9, 6).fill(0xf2a8a0).stroke({ width: 2.5, color: INK });
	// head, up and a little forward, alarmed
	g.roundRect(34, -42, 30, 34, 12).fill(CREAM).stroke(line);
	g.ellipse(56, -16, 13, 10).fill(0xf2a8a0).stroke({ width: 2.5, color: INK });
	g.circle(52, -16, 1.8).fill(INK);
	g.circle(60, -15, 1.8).fill(INK);
	g.circle(46, -32, 5).fill(0xffffff).stroke({ width: 2, color: INK });
	g.circle(47, -32, 2.2).fill(INK);
	// ear and horn
	g.ellipse(32, -36, 10, 5).fill(0xf2a8a0).stroke({ width: 2.5, color: INK });
	g.moveTo(42, -42).quadraticCurveTo(40, -54, 48, -56).stroke({ width: 6, color: INK, cap: 'round' });
	g.moveTo(42, -42).quadraticCurveTo(40, -54, 48, -56).stroke({ width: 2.5, color: CREAM, cap: 'round' });
};

// ── the mothership (feature set) ────────────────────────────────────────────
/** the six rim ports, in order round the hull (plate px: centre, radii) */
const PORTS: [number, number, number, number][] = [[617, 155, 27, 8], [763, 185, 24, 7], [1162, 185, 24, 7], [1309, 153, 27, 8], [1135, 107, 33, 10], [795, 109, 33, 10]];
const CIRCLE = { x: 970, y: 468, rx: 290, ry: 43 };
const BEAM = { x: 957, top: 200, bottom: 452, wTop: 40, wBot: 108 };
/** dy: the hull's hover now (bgProps mothershipDy), so the lit ports ride it */
export const drawMothership = (g: Graphics, t: number, dy: number) => {
	// the chase: the painted ports are all lit, so the chase is made by putting the ports OUT — the dark ones
	// are the hull's purple over the glass — with one lit hard (a cream core) and the one behind it dimming
	const step = t / 0.18;
	PORTS.forEach(([x, y, rx, ry], i) => {
		const behind = (((step - i) % PORTS.length) + PORTS.length) % PORTS.length;
		const k = behind < 1 ? 1 : behind < 2 ? 0.45 : 0;
		if (k < 1) g.ellipse(x, y + dy, rx * 0.92, ry * 0.92).fill({ color: 0x2c1d4e, alpha: 0.55 * (1 - k) });
		if (k > 0.9) {
			g.ellipse(x, y + dy, rx * 1.05, ry * 1.05).stroke({ width: 3, color: CREAM });
			g.ellipse(x, y + dy - ry * 0.1, rx * 0.55, ry * 0.45).fill(CREAM);
		}
	});
	// scan lines climbing the beam
	for (let i = 0; i < 4; i++) {
		const v = 1 - ((t * 0.55 + i / 4) % 1), y = BEAM.top + dy * (1 - v) + (BEAM.bottom - BEAM.top) * v, half = BEAM.wTop + (BEAM.wBot - BEAM.wTop) * v;
		g.moveTo(BEAM.x - half + 6, y).lineTo(BEAM.x + half - 6, y).stroke({ width: 3, color: CREAM, alpha: 0.35 + 0.4 * (1 - v) });
	}
	// a lit ring running out across the crop circle, dashed like the print's own rings, every 2.4 s
	const u = (t % 2.4) / 2.4, r = 0.12 + 0.88 * u, width = 5 * (1 - u) + 0.5;
	for (let i = 0; i < 18; i++) {
		const a0 = (i / 18) * Math.PI * 2 + t * 0.3, a1 = a0 + (Math.PI * 2 / 18) * 0.6;
		g.moveTo(CIRCLE.x + Math.cos(a0) * CIRCLE.rx * r, CIRCLE.y + Math.sin(a0) * CIRCLE.ry * r);
		for (let k = 1; k <= 4; k++) { const a = a0 + ((a1 - a0) * k) / 4; g.lineTo(CIRCLE.x + Math.cos(a) * CIRCLE.rx * r, CIRCLE.y + Math.sin(a) * CIRCLE.ry * r); }
		g.stroke({ width: width + 1, color: CREAM, alpha: 0.95 });
	}
};
