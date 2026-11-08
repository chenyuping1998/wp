/**
 * Things that HAPPEN on the farm at night (user 2026-10-31: 背景加強 — 探照燈、雲遮月、地面薄霧、大獎時飛碟吸走乳牛).
 * Drawn the print way (ART_REQUEST §0): flat shapes, coarse halftone, ink keylines on the objects, no soft glow.
 *
 *   mist        three bands of flat, lobed mist drift across the field at different speeds (both sets)
 *   bats        a few bats flap across the sky band every BATS_EVERY s (what a portrait phone sees)
 *   (the searchlight and the moon cloud were removed 2026-11-06: user, 太像 AI)
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

// ── bats ────────────────────────────────────────────────────────────────────
// Putt's gulls, for the night (Putt BgMotion.svelte): the background is cover-cropped about its centre and a
// portrait phone sees only plate x ~650-1270 — the barn, the tower, the trees and the corn are all off screen
// there, and the sky band is what is left. Three bats cross it every BATS_EVERY s, flapping fast and jinking up
// and down the way bats do; ink strokes, the print's own idiom, nothing lit.
export const BATS_EVERY = 14, BATS_CROSS = 8.5;
const BATS = [
	{ dx: 0, dy: 0, phase: 0, w: 15, jink: 1.0 },
	{ dx: -70, dy: 26, phase: 2.1, w: 12, jink: 1.4 },
	{ dx: -128, dy: -14, phase: 4.0, w: 11, jink: 0.8 },
];
export const drawBats = (g: Graphics, t: number) => {
	const local = (t + 9) % BATS_EVERY;
	if (local > BATS_CROSS) return;
	const u = local / BATS_CROSS, n = Math.floor((t + 9) / BATS_EVERY);
	// alternate direction and height each pass so it is never the same crossing twice in a row
	const dir = n % 2 ? -1 : 1;
	const cx = dir > 0 ? -160 + u * 2240 : 2080 - u * 2240;
	const cy = 150 + 50 * hash(n) - 30 * u;
	for (const b of BATS) {
		const flap = Math.sin(t * 19 + b.phase);
		const x = cx - dir * b.dx, y = cy + b.dy + Math.sin(t * 2.7 + b.phase) * 9 * b.jink + Math.sin(t * 6.1 + b.phase * 2) * 4 * b.jink;
		const w = b.w, lift = flap * w * 0.55;
		// two scalloped wings: a bat's "m" has a notch at each wing tip
		g.moveTo(x - w, y - lift);
		g.lineTo(x - w * 0.62, y - lift * 0.55 + w * 0.12);
		g.quadraticCurveTo(x - w * 0.35, y - w * 0.28 - lift * 0.3, x, y);
		g.quadraticCurveTo(x + w * 0.35, y - w * 0.28 - lift * 0.3, x + w * 0.62, y - lift * 0.55 + w * 0.12);
		g.lineTo(x + w, y - lift);
		g.stroke({ width: 3, color: 0x0b1030, cap: 'round', join: 'round' });
		g.circle(x, y + 1, 2.4).fill(0x0b1030);
	}
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
	g.poly([tx - wTop, ty, tx + wTop, ty, tx + wBot, ty + len, tx - wBot, ty + len]).fill({ color: GREEN, alpha: 0.3 });
	for (const side of [-1, 1]) g.moveTo(tx + side * wTop, ty).lineTo(tx + side * wBot, ty + len).stroke({ width: 3, color: INK });
	for (let i = 0; i < 3; i++) {
		const v = (u * 1.6 + i / 3) % 1, y = ty + len - v * len, half = wTop + (wBot - wTop) * (1 - v);
		g.moveTo(tx - half + 4, y).lineTo(tx + half - 4, y).stroke({ width: 3, color: CREAM });
	}
};
/** the gulp: a burst at the belly as she goes in, and speed strokes when it darts off */
export const drawAbductionFx = (g: Graphics, u: number, craft: Craft) => {
	if (!craft.visible) return;
	// (no starburst as she goes in: bursts read cheap, 2026-11-06)
	const go = (u - 3.25) / 0.6;
	if (go > 0 && go < 1) for (let i = 0; i < 4; i++) {
		// strokes trailing behind it, down and to the right of its path
		const k = 1 - go, x = craft.x + 70 + i * 16, y = craft.y + 40 + i * 20;
		g.moveTo(x, y).lineTo(x + 70 * k, y + 90 * k).stroke({ width: 5, color: INK, cap: 'round' });
		g.moveTo(x, y).lineTo(x + 70 * k, y + 90 * k).stroke({ width: 2, color: CREAM, cap: 'round' });
	}
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
