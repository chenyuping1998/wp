// A pinned triangle grid, shared by symbol wins and the three landscape plates.
// UVs never move: the painted detail stays sharp while selected vertices move.
export type Grid = {
	rest: Float32Array;
	uvs: Float32Array;
	indices: Uint32Array;
	cols: number;
	rows: number;
};

export const makeGrid = (width: number, height: number, cols: number, rows: number): Grid => {
	const rest = new Float32Array((cols + 1) * (rows + 1) * 2);
	const uvs = new Float32Array(rest.length);
	const indices = new Uint32Array(cols * rows * 6);
	for (let r = 0; r <= rows; r++) for (let c = 0; c <= cols; c++) {
		const v = (r * (cols + 1) + c) * 2;
		uvs[v] = c / cols;
		uvs[v + 1] = r / rows;
		rest[v] = uvs[v] * width;
		rest[v + 1] = uvs[v + 1] * height;
	}
	for (let r = 0, k = 0; r < rows; r++) for (let c = 0; c < cols; c++, k += 6) {
		const a = r * (cols + 1) + c;
		const b = a + 1;
		const d = a + cols + 1;
		indices.set([a, b, d + 1, a, d + 1, d], k);
	}
	return { rest, uvs, indices, cols, rows };
};

const smooth = (v: number) => {
	const x = Math.max(0, Math.min(1, v));
	return x * x * (3 - 2 * x);
};
const bell = (x: number, y: number, cx: number, cy: number, rx: number, ry: number) =>
	Math.exp(-(((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2) * 2);

export const poseSymbol = (grid: Grid, out: Float32Array, name: string, seconds: number) => {
	const w = grid.rest[grid.rest.length - 2];
	const h = grid.rest[grid.rest.length - 1];
	const hit = smooth(seconds / 0.2);
	const fade = 1 - smooth((seconds - 0.66) / 0.3);
	const k = hit * fade;
	const variant = name.charCodeAt(0) + (Number(name.slice(1)) || 0);
	for (let v = 0; v < grid.rest.length / 2; v++) {
		const u = grid.uvs[v * 2], q = grid.uvs[v * 2 + 1];
		// The painted frame is fixed; only the inner subject bends. The edge
		// falloff also makes the end pose identical to the static sprite.
		const edge = smooth(Math.min(u, 1 - u, q, 1 - q) / 0.16);
		const subject = bell(u, q, 0.5, 0.49, 0.32, 0.34) * edge;
		const wave = Math.sin(seconds * 14 + q * 7 + variant * 0.3);
		const isHigh = name.startsWith('H');
		const isLow = name.startsWith('L');
		const dx = (isHigh ? 0.014 * wave : isLow ? 0.009 * wave : 0.012 * Math.sin(seconds * 11 + q * 6));
		const dy = (isHigh ? -0.027 : isLow ? -0.014 : -0.02) * Math.sin(Math.PI * smooth(seconds / 0.5)) + 0.006 * wave;
		out[v * 2] = grid.rest[v * 2] + dx * w * subject * k;
		out[v * 2 + 1] = grid.rest[v * 2 + 1] + dy * h * subject * k;
	}
};

/**
 * The three plates, alive (user 2026-10-31: 背景動態，參考高爾夫). The golf course's way: every thing that can move is
 * placed on the painting by hand and moves from where it is held — lanterns and scrolls swing about their hooks,
 * bamboo bends from its root, the maple sprigs and the foreground fronds toss — all driven by ONE wind: a steady
 * breeze that never quite repeats and, every few seconds, a gust that crosses the plate left to right, so the things
 * on the right answer a beat after the things on the left. The lanterns hang on cords and lag the wind like
 * pendulums. Indoors (the treasure room) the same field blows at 0.7: a draught.
 * The valley mist drifts slowly. The border is pinned (the cover crop must never show past the painting).
 * Coordinates are the plate's own 0..1 uv (measured on bg_base / bg_superspin at 1600x900).
 */
export const BG_GRID = { cols: 112, rows: 63 } as const;

type Pt = readonly [number, number];
type Region = (u: number, v: number) => number;
/** soft ellipse: 1 inside, fading to 0 over `soft` (in radii) */
const oval = (c: Pt, rx: number, ry: number, soft = 0.35): Region => (u, v) =>
	1 - smooth((Math.hypot((u - c[0]) / rx, (v - c[1]) / ry) - (1 - soft)) / (2 * soft));
/** soft box */
const box = (u0: number, v0: number, u1: number, v1: number, soft = 0.03): Region => (u, v) =>
	smooth((u - u0) / soft + 0.5) * smooth((u1 - u) / soft + 0.5) * smooth((v - v0) / soft + 0.5) * smooth((v1 - v) / soft + 0.5);

/** something that swings about a hook (a lantern on its cord, a scroll, a tassel): `amp` degrees at a full gust */
type Swing = { kind: 'swing'; hook: Pt; region: Region; amp: number; lag: number; light?: { at: Pt; r: number; color: number } };
/** something rooted that bends with the wind: moves `amp` (fraction of the plate's width) at a full gust, more the
 *  further it is from `root` along `up` (0..1 uv of reach) */
type Sway = { kind: 'sway'; region: Region; amp: number; root?: number; reach?: number; flutter?: number };
type Prop = Swing | Sway;

const OUTDOOR: Prop[] = [
	// lanterns: the big one at top left hangs from above the frame; two small ones under the eave; one over the valley
	{ kind: 'swing', hook: [0.165, -0.01], region: oval([0.165, 0.1], 0.046, 0.13, 0.6), amp: 2.6, lag: 0.45, light: { at: [0.165, 0.065], r: 0.1, color: 0xff7a3c } },
	{ kind: 'swing', hook: [0.115, 0.2], region: oval([0.115, 0.255], 0.032, 0.08, 0.6), amp: 3.4, lag: 0.3, light: { at: [0.115, 0.245], r: 0.05, color: 0xff7a3c } },
	{ kind: 'swing', hook: [0.185, 0.258], region: oval([0.185, 0.31], 0.03, 0.075, 0.6), amp: 3.4, lag: 0.34, light: { at: [0.185, 0.3], r: 0.045, color: 0xff7a3c } },
	{ kind: 'swing', hook: [0.686, -0.01], region: oval([0.686, 0.05], 0.032, 0.09, 0.6), amp: 3, lag: 0.4, light: { at: [0.686, 0.03], r: 0.05, color: 0xff7a3c } },
	// maple sprigs along the top
	{ kind: 'sway', region: box(0.19, 0, 0.32, 0.13, 0.07), amp: 0.003, flutter: 1 },
	{ kind: 'sway', region: box(0.47, 0, 0.67, 0.12, 0.07), amp: 0.003, flutter: 1 },
	// the bamboo: left stalks bend from the ground, the right crowns and fronds sway, the left fronds under the eave
	{ kind: 'sway', region: box(0.0, 0.0, 0.1, 1.0, 0.09), amp: 0.004, root: 1, reach: 1 },
	{ kind: 'sway', region: box(0.76, 0.0, 1.0, 0.6, 0.06), amp: 0.006, root: 0.62, reach: 0.62, flutter: 0.6 },
	{ kind: 'sway', region: oval([0.2, 0.41], 0.07, 0.05), amp: 0.005, flutter: 0.8 },
	// foreground fronds, rooted at the bottom edge
	{ kind: 'sway', region: box(0.0, 0.72, 0.26, 1.0, 0.05), amp: 0.005, root: 1, reach: 0.28, flutter: 0.6 },
	{ kind: 'sway', region: box(0.64, 0.78, 0.96, 1.0, 0.05), amp: 0.005, root: 1, reach: 0.22, flutter: 0.6 },
];
const INDOOR: Prop[] = [
	{ kind: 'swing', hook: [0.15, -0.01], region: oval([0.15, 0.1], 0.046, 0.135, 0.6), amp: 2.2, lag: 0.45, light: { at: [0.15, 0.065], r: 0.1, color: 0xff7a3c } },
	{ kind: 'swing', hook: [0.112, 0.188], region: oval([0.112, 0.245], 0.036, 0.085, 0.6), amp: 3, lag: 0.32, light: { at: [0.112, 0.235], r: 0.055, color: 0xff7a3c } },
	// the tassel under the beam, the hanging scroll on the right with its tassel, the left scroll's tassel
	{ kind: 'swing', hook: [0.725, 0.05], region: oval([0.725, 0.11], 0.024, 0.075, 0.6), amp: 4, lag: 0.3 },
	{ kind: 'swing', hook: [0.87, 0.0], region: box(0.85, 0.0, 0.89, 0.3, 0.015), amp: 1.4, lag: 0.5 },
	{ kind: 'swing', hook: [0.17, 0.455], region: oval([0.17, 0.49], 0.022, 0.06, 0.6), amp: 4, lag: 0.28 },
	// foliage at the door and the bottom right
	{ kind: 'sway', region: box(0.0, 0.24, 0.12, 0.42, 0.04), amp: 0.004, flutter: 0.8 },
	{ kind: 'sway', region: box(0.85, 0.55, 1.0, 1.0, 0.05), amp: 0.005, root: 1, reach: 0.45, flutter: 0.6 },
];
/** the candles' flames in the treasure room: light only */
const CANDLES: { at: Pt; r: number }[] = [{ at: [0.275, 0.37], r: 0.03 }, { at: [0.36, 0.6], r: 0.025 }];
const MIST = oval([0.52, 0.6], 0.25, 0.16, 0.5);

// ---------------------------------------------------------------------------- the wind (golf's bgProps.windAt)

const GUST_EVERY = 6.4, GUST_LEN = 3.0, GUST_CROSS = 1.4;
const gustAt = (t: number, u: number) => {
	const local = t - 1.2 - u * GUST_CROSS;
	if (local < 0) return 0;
	const tau = local % GUST_EVERY;
	if (tau > GUST_LEN) return 0;
	const k = tau / GUST_LEN;
	// quick lean in, slower release: the release is what reads as weight
	return k < 0.3 ? smooth(k / 0.3) : 1 - smooth((k - 0.3) / 0.7);
};
/** the wind at plate u: a breeze that never quite repeats, plus the gust, plus a slow buffet while it blows */
export const windAt = (t: number, u: number, phase = 0) => {
	const w1 = (t * Math.PI * 2) / 7.3 + phase;
	const ambient = 0.75 * Math.sin(w1) + 0.25 * Math.sin(w1 * 0.43 + phase * 2.1);
	const g = gustAt(t, u);
	return 0.55 * ambient + g + g * 0.12 * Math.sin(t / 0.42 + phase * 3);
};

export type BgLight = { x: number; y: number; r: number; color: number; alpha: number };

// Spatial masks are static. Cache them once per plate grid instead of evaluating
// every ellipse/box for 7,000 vertices on each frame; wind and painted pivots
// retain the authored animation exactly.
type BackgroundWeights = { edge: Float64Array; props: Float64Array[]; levers: Float64Array[]; mist: Float64Array };
const spatialWeights = new WeakMap<Grid, Map<boolean, BackgroundWeights>>();
const backgroundWeights = (grid: Grid, indoor: boolean): BackgroundWeights => {
 let variants=spatialWeights.get(grid);
 if (!variants) { variants=new Map(); spatialWeights.set(grid,variants); }
 const cached=variants.get(indoor); if (cached) return cached;
 const props=indoor?INDOOR:OUTDOOR, count=grid.rest.length/2;
 const result: BackgroundWeights={edge:new Float64Array(count),props:props.map(()=>new Float64Array(count)),levers:props.map(()=>new Float64Array(count)),mist:new Float64Array(count)};
 for(let v=0;v<count;v++) {
  const u=grid.uvs[v*2],q=grid.uvs[v*2+1];
  result.edge[v]=smooth(Math.min(u,1-u,q,1-q)/.06);
  let hung=0; for(const p of props) if(p.kind==='swing') hung=Math.max(hung,p.region(u,q));
  props.forEach((p,i)=>{
   result.props[i][v]=p.region(u,q)*(p.kind==='sway'?1-hung:1);
   result.levers[i][v]=p.kind==='sway'&&p.reach?smooth(((p.root??1)-q)/p.reach):1;
  });
  result.mist[v]=MIST(u,q);
 }
 variants.set(indoor,result); return result;
};

export const poseBackground = (grid: Grid, out: Float32Array, seconds: number, scene: string, lights?: BgLight[]) => {
	const w = grid.rest[grid.rest.length - 2];
	const h = grid.rest[grid.rest.length - 1];
	const indoor = scene === 'superspin';
	const props = indoor ? INDOOR : OUTDOOR;
	const spatial = backgroundWeights(grid, indoor);
	const strength = indoor ? 0.7 : 1;
	const t = seconds;
	// each prop's wind once per frame, at its own place (and a beat late for the hanging ones)
	const winds = props.map((p, i) => {
		const u = p.kind === 'swing' ? p.hook[0] : 0.5;
		return strength * windAt(t - (p.kind === 'swing' ? p.lag : 0), u, i * 1.7);
	});
	// a hanging thing's swing tops out (a cord only lets a lantern go so far) — the gust's peak would otherwise shear
	// the soft edge round it
	const angles = props.map((p, i) => (p.kind === 'swing' ? (p.amp * Math.PI / 180) * Math.tanh(winds[i]) : 0));
	for (let vtx = 0; vtx < grid.rest.length / 2; vtx++) {
		const u = grid.uvs[vtx * 2], q = grid.uvs[vtx * 2 + 1];
		// the border is pinned; the hold-down ramps over 6% of the plate, or crowns that sway hardest at the top edge (the
		// right bamboo) squeeze the last row of triangles flat
		const edge = spatial.edge[vtx];
		let dx = 0, dy = 0;
		if (edge > 0) {
			// a hanging thing owns its place: what sways behind it gives way, or the two moving apart crush the
			// triangles between them
			props.forEach((p, i) => {
				const wt = spatial.props[i][vtx];
				if (wt <= 0.001) return;
				if (p.kind === 'swing') {
					const ox = (u - p.hook[0]) * w, oy = (q - p.hook[1]) * h, a = angles[i] * wt, c = Math.cos(a), s = Math.sin(a);
					dx += ox * (c - 1) - oy * s;
					dy += ox * s + oy * (c - 1);
				} else {
					const lever = spatial.levers[i][vtx];
					const flutter = (p.flutter ?? 0) * Math.sin(t * 2.3 + u * 31 + q * 17) * 0.35;
					dx += wt * lever * p.amp * w * (winds[i] + flutter);
					dy += wt * lever * p.amp * h * 0.3 * Math.abs(winds[i]) * -0.5;
				}
			});
			if (!indoor) {
				const m = spatial.mist[vtx];
				dx += m * w * 0.008 * Math.sin(t * 0.07);
				dy += m * h * 0.002 * Math.sin(t * 0.05 + 1.3);
			}
		}
		out[vtx * 2] = grid.rest[vtx * 2] + dx * edge;
		out[vtx * 2 + 1] = grid.rest[vtx * 2 + 1] + dy * edge;
	}
	if (lights) {
		lights.length = 0;
		props.forEach((p, i) => {
			if (p.kind !== 'swing' || !p.light) return;
			// the glow follows the lantern on its cord, and breathes like a flame behind paper
			const ox = (p.light.at[0] - p.hook[0]) * w, oy = (p.light.at[1] - p.hook[1]) * h, c = Math.cos(angles[i]), s = Math.sin(angles[i]);
			const flicker = 0.85 + 0.1 * Math.sin(t * 6.1 + i * 2) + 0.05 * Math.sin(t * 13.7 + i);
			lights.push({ x: p.hook[0] * w + ox * c - oy * s, y: p.hook[1] * h + ox * s + oy * c, r: p.light.r * w, color: p.light.color, alpha: 0.32 * flicker });
		});
		if (indoor) CANDLES.forEach((cd, i) => {
			const flicker = 0.7 + 0.2 * Math.sin(t * 9.3 + i * 3) + 0.1 * Math.sin(t * 17.1 + i);
			lights.push({ x: cd.at[0] * w, y: cd.at[1] * h, r: cd.r * w, color: 0xffb060, alpha: 0.45 * flicker });
		});
	}
};
