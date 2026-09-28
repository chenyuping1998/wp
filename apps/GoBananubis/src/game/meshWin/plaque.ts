/**
 * THE BIG-WIN PLAQUE, AS A MESH.
 *
 * A brass plaque should not bend like rubber, and this does not: every move
 * here is one a hung metal sign makes. The whole plaque already slams in with a
 * scale overshoot (Win.svelte); on top of that —
 *
 *   the IMPACT    a ripple runs out from the centre as it lands, and the crest
 *                 (the jewel and the wings on the top edge) jolts up and springs
 *                 back after the body has stopped: follow-through
 *   the AMOUNT    when the count-up lands, a second ripple goes out from the
 *                 number well and the crest jumps again
 *   the HOLD      it sways like a sign on a hook — a slight turn about its
 *                 vertical axis, drawn as perspective (the near edge grows, the
 *                 far edge shrinks) — so the plaque is never a frozen picture
 *
 * Everything scales with the tier's `mult` (1 big .. 1.8 max). The amount is
 * drawn by Win.svelte on top, undeformed, so the figure stays sharp.
 *
 * IMPORTS NOTHING: design/check_mesh_wins.mjs poses it with this exact code.
 * Coordinates are the plaque art's own pixels (1000 x 560), y DOWN.
 */

export const PLAQUE = { w: 1000, h: 560, cols: 40, rows: 22 };
/** where the number well sits (the second ripple's origin) */
const WELL: [number, number] = [500, 390];
const CENTRE: [number, number] = [500, 280];

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const smoothstep = (v: number) => {
	const t = clamp01(v);
	return t * t * (3 - 2 * t);
};
/** a decaying oscillation from 0, `hz` per second, `decay` per second */
const flick = (age: number, hz: number, decay: number) =>
	age < 0 ? 0 : Math.exp(-decay * age) * Math.sin(2 * Math.PI * hz * age);

export type PlaqueGrid = { rest: Float32Array; uvs: Float32Array; indices: Uint32Array };

/** a regular grid over a w x h picture (sheets.ts builds its pieces with it) */
export const buildGrid = (w: number, h: number, cols: number, rows: number): PlaqueGrid => {
	const V = (cols + 1) * (rows + 1);
	const rest = new Float32Array(V * 2);
	const uvs = new Float32Array(V * 2);
	for (let r = 0; r <= rows; r++)
		for (let c = 0; c <= cols; c++) {
			const v = r * (cols + 1) + c;
			rest[v * 2] = (w * c) / cols;
			rest[v * 2 + 1] = (h * r) / rows;
			uvs[v * 2] = c / cols;
			uvs[v * 2 + 1] = r / rows;
		}
	const indices = new Uint32Array(cols * rows * 6);
	for (let r = 0, k = 0; r < rows; r++)
		for (let c = 0; c < cols; c++, k += 6) {
			const a = r * (cols + 1) + c, b = a + 1, d = a + cols + 1, e = d + 1;
			indices.set([a, b, e, a, e, d], k);
		}
	return { rest, uvs, indices };
};

export const buildPlaqueGrid = (): PlaqueGrid => buildGrid(PLAQUE.w, PLAQUE.h, PLAQUE.cols, PLAQUE.rows);

/** When the plaque's entrance slam settles (Win.svelte's bannerPose: 0.34s). */
export const SLAM_S = 0.34;

/**
 * A ripple running out from `origin`: each point is pushed along the line
 * from the origin by a wave that has reached it and is dying away.
 */
const ripple = (x: number, y: number, origin: [number, number], age: number, amp: number) => {
	if (age < 0) return [0, 0];
	const dx = x - origin[0], dy = (y - origin[1]) * 1.8; // the plaque is wide: an oval wave
	const r = Math.hypot(dx, dy) || 1;
	const SPEED = 1500; // px/s
	const LAMBDA = 260;
	const front = SPEED * age;
	if (r > front + LAMBDA * 0.5) return [0, 0];
	const reached = smoothstep((front + LAMBDA * 0.5 - r) / (LAMBDA * 0.5));
	const wave = Math.sin((2 * Math.PI * (r - front)) / LAMBDA);
	// eased in over 40ms: at age 0 the wave already covers the origin, and
	// starting it at full height jumped the plaque on that one frame (the gate's
	// pop check caught it)
	const d = amp * wave * reached * Math.exp(-age * 5.5) * smoothstep(r / 120) * smoothstep(age / 0.04);
	return [(dx / r) * d, ((dy / r) * d) / 1.8];
};

/**
 * Pose the plaque. `t` is seconds since the presentation's FX clock started
 * (Win.svelte fxNow), `landAge` seconds since the count-up landed (<0 before
 * it has), `mult` the tier's intensity.
 */
export const posePlaque = (grid: PlaqueGrid, t: number, landAge: number, mult: number, out: Float32Array) => {
	const { w } = PLAQUE;
	const slamAge = t - SLAM_S;
	// the crest: kicked by the slam and again by the amount landing, springing
	const crestKick =
		-16 * mult * flick(slamAge, 3.4, 4.5) - 12 * mult * flick(landAge, 3.8, 5.5);
	// the sway: a slow turn about the vertical axis, coming in after the slam
	const swayIn = smoothstep((t - SLAM_S - 0.2) / 0.8);
	const turn = 0.035 * mult * swayIn * Math.sin(t * 1.25) + 0.02 * mult * flick(landAge, 2.2, 3.5);
	const n = grid.rest.length / 2;
	for (let v = 0; v < n; v++) {
		let x = grid.rest[v * 2], y = grid.rest[v * 2 + 1];
		const [ax, ay] = ripple(x, y, CENTRE, slamAge, 9 * mult);
		const [bx, by] = ripple(x, y, WELL, landAge, 7 * mult);
		x += ax + bx;
		y += ay + by;
		// the crest band: the top 90px, full at the very top
		y += crestKick * smoothstep((95 - grid.rest[v * 2 + 1]) / 70);
		// perspective turn: the edge turning toward us grows, the far edge shrinks
		const side = (x - CENTRE[0]) / (w / 2); // -1 .. 1
		const grow = 1 + turn * side;
		y = CENTRE[1] + (y - CENTRE[1]) * grow;
		x = CENTRE[0] + (x - CENTRE[0]) * (1 - Math.abs(turn) * 0.5);
		out[v * 2] = x;
		out[v * 2 + 1] = y;
	}
};
