/**
 * THE POTIONS BOIL (2026-10-16, user: 「有藥水的獎圖希望能做出藥水沸騰的效果」).
 *
 * The lantern's elixir (H1) and the cart's three flasks (H4) boil while the
 * symbol acts — win, landing or idle act — with bubbles rising from the bottom
 * of each glass, swelling as they climb and popping in a ring at the surface.
 * The dynamite B already boils through reagentBoil.ts.
 *
 * The bubbles ride the MESH: every point (bubble and glass outline alike) is
 * pushed through the skinned grid by bilinear interpolation, so they leap,
 * lean and slosh with the drawing they sit in, and the glass mask follows the
 * glass. No light: the bubbles are tinted with the potion's own colours.
 *
 * Pure maths only (like meshRig.ts); SymbolMeshWin.svelte draws it.
 * Coordinates are the 256 canvas of the art.
 */
import { smoothstep, type MeshWinSpec, type RigSpec } from './meshRig';

/** an elliptic chamber of glass: centre, radii — kept inside the glass rim */
export type Chamber = [number, number, number, number];

export type Potion = {
	chambers: Chamber[];
	/** bubble body, its rim, the glint and the surface ring */
	body: number;
	rim: number;
	glint: number;
	/** the rig bones that hold the liquid: they churn while it boils */
	churn: string[];
};

export const POTIONS: Record<string, Potion> = {
	// the lantern's green elixir
	H1: { chambers: [[128, 125, 40, 37]], body: 0x1c6e24, rim: 0xd8ffb0, glint: 0xf4ffe0, churn: ['elixir'] },
	// the cart's amber flasks: the big one in front, left and right behind
	H4: {
		chambers: [
			[130, 87, 28, 20],
			[88, 75, 18, 15],
			[181, 80, 15, 14],
		],
		body: 0x8a3c00,
		rim: 0xffe39a,
		glint: 0xfff6d8,
		churn: ['load'],
	},
};

/** the outline of a chamber, as a polygon */
export const chamberOutline = ([cx, cy, rx, ry]: Chamber, n = 28): [number, number][] =>
	Array.from({ length: n }, (_, i) => {
		const a = (2 * Math.PI * i) / n;
		return [cx + rx * Math.cos(a), cy + ry * Math.sin(a)];
	});

export type Bubble = { x: number; y: number; r: number; alpha: number; pop: number };

/**
 * The bubbles at time `ms`, `heat` 0..1 (a win boils hard, an idle simmers).
 * Each bubble has its own seeded column, speed and size; `pop` > 0 is the
 * ring it leaves at the surface (0..1 as it spreads and fades).
 */
export const boilAt = (potion: Potion, ms: number, heat: number): Bubble[] => {
	const k = Math.max(0, Math.min(1, heat));
	const out: Bubble[] = [];
	const s = ms / 1000;
	potion.chambers.forEach(([cx, cy, rx, ry], c) => {
		const count = Math.round((7 + 15 * k) * Math.min(1.4, Math.max(0.6, rx / 28)));
		for (let i = 0; i < count; i++) {
			const seed = (((i + 1) * 0.6180339 + c * 0.377) % 1 + 1) % 1;
			const seed2 = (((i + 1) * 0.4142135 + c * 0.733) % 1 + 1) % 1;
			// rises faster the harder it boils
			const rate = (0.9 + 0.8 * seed2) * (0.6 + 1.1 * k);
			const life = (s * rate + seed * 3.7) % 1.25;
			const bottom = cy + ry * 0.82,
				surface = cy - ry * 0.78;
			const lane = (seed - 0.5) * 1.6;
			if (life < 1) {
				const y = bottom - (bottom - surface) * life;
				// keep the column inside the ellipse at this height
				const half = rx * Math.sqrt(Math.max(0, 1 - ((y - cy) / ry) ** 2)) * 0.8;
				const x = cx + lane * half * 0.6 + Math.sin(s * (5 + 3 * seed2) + i) * 1.4 * (0.5 + k);
				const env = Math.min(1, life * 6) * Math.min(1, (1 - life) * 10);
				out.push({
					x,
					y,
					r: (1.2 + 1.9 * seed2) * (0.75 + 0.6 * life) * (0.85 + 0.5 * k) * Math.max(0.7, rx / 30),
					alpha: env * (0.35 + 0.6 * k),
					pop: 0,
				});
			} else {
				// the pop: a ring spreading on the surface
				const p = (life - 1) / 0.25;
				out.push({
					x: cx + lane * rx * 0.45,
					y: surface + 1,
					r: (2 + 2.5 * seed2) * (0.6 + 0.6 * p) * Math.max(0.7, rx / 30),
					alpha: (1 - p) * (0.3 + 0.55 * k),
					pop: p,
				});
			}
		}
	});
	return out;
};

/** where the skinned mesh puts a point of the art (bilinear over the grid) */
export const warp = (
	grid: RigSpec['grid'],
	positions: Float32Array,
	x: number,
	y: number,
): [number, number] => {
	const { x0, y0, x1, y1, cols, rows } = grid;
	const fx = Math.max(0, Math.min(cols - 1e-6, ((x - x0) / (x1 - x0)) * cols));
	const fy = Math.max(0, Math.min(rows - 1e-6, ((y - y0) / (y1 - y0)) * rows));
	const c = Math.floor(fx),
		r = Math.floor(fy);
	const u = fx - c,
		v = fy - r;
	const a = r * (cols + 1) + c,
		b = a + 1,
		d = a + cols + 1,
		e = d + 1;
	const lerp = (i: number) =>
		(1 - v) * ((1 - u) * positions[a * 2 + i] + u * positions[b * 2 + i]) +
		v * ((1 - u) * positions[d * 2 + i] + u * positions[e * 2 + i]);
	return [lerp(0), lerp(1)];
};

/** The liquid churns as it boils: a quick, small, uneven swell of the bones
 *  that hold it, on top of whatever the act does — faded in and out so the
 *  act still starts and ends on the drawing. */
export const boiling = (spec: MeshWinSpec, heat: number): MeshWinSpec => {
	const potion = POTIONS[spec.symbol.split(':')[0]];
	if (!potion) return spec;
	return {
		...spec,
		pose: (rig, t) => {
			const pose = spec.pose(rig, t);
			const env =
				heat * smoothstep(t / 160) * smoothstep((spec.durationMs - 200 - t) / 200);
			if (env <= 0) return pose;
			potion.churn.forEach((name, i) => {
				const b = pose.bones[rig.bones.findIndex((x) => x.name === name)];
				if (!b) return;
				const s = t / 1000 + i * 0.37;
				const roll = Math.sin(s * 23) * 0.6 + Math.sin(s * 37 + 1.3) * 0.4;
				b.along *= 1 + 0.018 * env * roll;
				b.across *= 1 - 0.012 * env * Math.sin(s * 29 + 0.7);
				b.dy += -0.7 * env * Math.abs(Math.sin(s * 17));
			});
			return pose;
		},
	};
};

// ---------------------------------------------------------------------------
// THE BACKGROUNDS' GLASSWARE SIMMERS (2026-10-16): the same bubbles in the
// painted flasks and tubes of the three scenes (BgBubbles.svelte). Chambers in
// the plates' own 1920 x 1080 pixels, measured on the liquid (not the glass
// above it). A gentle simmer: these are scenery, not a win.
const GREEN = { body: 0x1c6e24, rim: 0xd8ffb0, glint: 0xf4ffe0, churn: [] };
const AMBER = { body: 0x8a3c00, rim: 0xffe39a, glint: 0xfff6d8, churn: [] };
const CYAN = { body: 0x0f6a58, rim: 0xc8fff0, glint: 0xf0fffa, churn: [] };
export const BG_POTIONS: Record<'base' | 'feature' | 'vault', Potion[]> = {
	// the laboratory: the flask on the left table and the one on the shelf
	// above it; the green flask and the amber jar on the right shelves
	base: [
		{ ...GREEN, chambers: [[168, 655, 52, 26], [30, 468, 28, 26], [1824, 210, 38, 22]] },
		{ ...AMBER, chambers: [[1845, 375, 26, 40]] },
	],
	// the crystal vault's glowing tubes, left and right
	feature: [
		{ ...CYAN, chambers: [[397, 148, 34, 56], [512, 565, 24, 66], [1590, 265, 36, 86], [1508, 505, 20, 34]] },
	],
	// the treasure vault's flasks on both sides
	vault: [
		{ ...GREEN, chambers: [[60, 830, 50, 34], [35, 195, 28, 28], [1612, 398, 24, 16]] },
		{ ...AMBER, chambers: [[178, 276, 42, 24], [255, 442, 20, 18], [1842, 440, 56, 38], [1682, 374, 30, 20]] },
	],
};
