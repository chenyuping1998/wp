/**
 * FLAT PIECES OF FURNITURE, AS MESHES: the free-game sign, the board's
 * housing and the free-spin counter plaque. Each is one picture on a regular
 * grid, moved the way the thing it depicts moves — a hung sign, a steel ring,
 * a plaque on a wall — and never like rubber. The big-win plaque (plaque.ts)
 * is the same method; this file shares its grid and its ripple.
 *
 *   the SIGN      (fs_sign 1280x1002) drops in on the FREE SPINS intro, a
 *                 retrigger's +N and the feature total. The drop and the swing
 *                 stay whole-sign moves (FreeSpinAnimation); on top: a ripple
 *                 out from the centre as it lands, the winged sun on its crest
 *                 jolting after the body stops and its wings drooping and
 *                 springing back, a slow breath of the wings while it hangs,
 *                 and a second ripple from the number when a total lands.
 *   the HOUSING   (frame_edge + frame_bg 1280x1280) every knock it takes
 *                 already shook it whole; now the knock also runs round the
 *                 ring as a wave FROM WHERE IT CAME — the reel that stopped,
 *                 the cell a Scatter landed in, the side the gorilla is
 *                 beating his chest on. Knocks overlap (five reel stops in a
 *                 row) and simply add.
 *   the COUNTER   (fs_counter_panel 1280x966) a spent spin taps it and a
 *                 retrigger slams it: a ripple from the count, and the ankh
 *                 hanging from its top edge swings.
 *
 * IMPORTS ONLY plaque.ts, which imports nothing: design/check_mesh_wins.mjs
 * poses all three with this exact code. Coordinates are each picture's own
 * pixels, y DOWN; times in seconds.
 */
import { buildGrid, type PlaqueGrid } from './plaque';

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const smoothstep = (v: number) => {
	const t = clamp01(v);
	return t * t * (3 - 2 * t);
};
const flick = (age: number, hz: number, decay: number) =>
	age < 0 ? 0 : Math.exp(-decay * age) * Math.sin(2 * Math.PI * hz * age);

type Wave = { speed: number; lambda: number; decay: number; oval: number };

/** a ripple out from `origin`: each point pushed along the line from the
 *  origin by the wave that has reached it, dying away; eased in over 40ms so
 *  its first frame is not a jump (the plaque's lesson) */
const wave = (x: number, y: number, origin: [number, number], age: number, amp: number, w: Wave): [number, number] => {
	if (age < 0 || amp === 0) return [0, 0];
	const dx = x - origin[0], dy = (y - origin[1]) * w.oval;
	const r = Math.hypot(dx, dy) || 1;
	const front = w.speed * age;
	if (r > front + w.lambda * 0.5) return [0, 0];
	const reached = smoothstep((front + w.lambda * 0.5 - r) / (w.lambda * 0.5));
	const s = Math.sin((2 * Math.PI * (r - front)) / w.lambda);
	const d = amp * s * reached * Math.exp(-age * w.decay) * smoothstep(r / 120) * smoothstep(age / 0.04);
	return [(dx / r) * d, ((dy / r) * d) / w.oval];
};

// ---------------------------------------------------------------------------
// the sign

export const SIGN = { w: 1280, h: 1002, cols: 40, rows: 32 };
/** when the drop first reaches its mark: FreeSpinAnimation's 700ms backOut
 *  crosses 1 at 37% of its run */
export const SIGN_IMPACT_S = 0.26;
const SIGN_CENTRE: [number, number] = [640, 560];
const SIGN_NUMBER: [number, number] = [640, 610];
/** the winged sun's jewel, which the wings turn about */
const JEWEL: [number, number] = [640, 168];
const SIGN_WAVE: Wave = { speed: 1700, lambda: 320, decay: 5.5, oval: 1.25 };

export const buildSignGrid = (): PlaqueGrid => buildGrid(SIGN.w, SIGN.h, SIGN.cols, SIGN.rows);

/** `t` s since the sign started dropping, `landAge` s since a total landed on
 *  it (<0 when none has) */
export const poseSign = (grid: PlaqueGrid, t: number, landAge: number, out: Float32Array) => {
	const hit = t - SIGN_IMPACT_S;
	// the crest keeps going down when the body stops, and springs back
	const crest = 6 * flick(hit, 3.2, 4.5) + 5 * flick(landAge, 3.6, 5.5);
	// the wing tips, px, + up: they droop on the stop (flick starts +, so
	// negated) and on a total landing, and breathe slowly while the sign hangs
	const breathe = smoothstep((t - 0.9) / 0.8);
	const lift = -9 * flick(hit, 2.4, 3.6) - 6 * flick(landAge, 2.8, 4.5) + 2.5 * breathe * Math.sin((2 * Math.PI * t) / 2.4);
	const n = grid.rest.length / 2;
	for (let v = 0; v < n; v++) {
		const x0 = grid.rest[v * 2], y0 = grid.rest[v * 2 + 1];
		const [ax, ay] = wave(x0, y0, SIGN_CENTRE, hit, 11, SIGN_WAVE);
		const [bx, by] = wave(x0, y0, SIGN_NUMBER, landAge, 8, SIGN_WAVE);
		let x = x0 + ax + bx, y = y0 + ay + by;
		// THE WINGED SUN, and only it. It is painted OVER the frame's top bar
		// (its lower feathers reach y 212, the bar starts at 185), so the crest
		// fades out down through the bar rather than stopping at it — a bar
		// that stayed put under a moving wing tore the feathers — and it is
		// windowed to the wings' own span, or the frame's corners and the empty
		// margin either side moved with it
		const span = Math.abs(x0 - JEWEL[0]);
		const band = smoothstep((222 - y0) / 55) * smoothstep((320 - span) / 40);
		y += crest * band;
		// a wing lifts about the jewel: more of it the further out
		y -= lift * band * smoothstep((span - 30) / 60) * Math.min(1, span / 280);
		out[v * 2] = x;
		out[v * 2 + 1] = y;
	}
};

// ---------------------------------------------------------------------------
// the housing

export const FRAME = { w: 1280, h: 1280, cols: 36, rows: 36 };
/** the board's 1000x1000 sits centred in the 1280 art (BoardFrame FRAME_SCALE) */
const BOARD_HALF = 500;
const FRAME_WAVE: Wave = { speed: 2600, lambda: 520, decay: 6, oval: 1 };
/** how long a knock is still moving anything, s */
export const FRAME_KNOCK_S = 0.7;

export type FrameKnock = {
	/** where it came from, in board units: -1..1 across, -1 (top) .. 1 (bottom);
	 *  past 1 is outside the board (the gorilla's side) */
	from: [number, number];
	/** s, on the same clock as poseFrame's `now` */
	at: number;
	strength: number;
};

export const buildFrameGrid = (): PlaqueGrid => buildGrid(FRAME.w, FRAME.h, FRAME.cols, FRAME.rows);

export const poseFrame = (grid: PlaqueGrid, knocks: FrameKnock[], now: number, out: Float32Array) => {
	const n = grid.rest.length / 2;
	out.set(grid.rest);
	for (const k of knocks) {
		const age = now - k.at;
		if (age < 0 || age > FRAME_KNOCK_S) continue;
		const origin: [number, number] = [FRAME.w / 2 + k.from[0] * BOARD_HALF, FRAME.h / 2 + k.from[1] * BOARD_HALF];
		// a 1.4 slam moves the steel ~8px; a 0.12 reel stop, under a pixel
		const amp = 6 * k.strength;
		for (let v = 0; v < n; v++) {
			const [dx, dy] = wave(grid.rest[v * 2], grid.rest[v * 2 + 1], origin, age, amp, FRAME_WAVE);
			out[v * 2] += dx;
			out[v * 2 + 1] += dy;
		}
	}
};

// ---------------------------------------------------------------------------
// the counter plaque

export const COUNTER = { w: 1280, h: 966, cols: 32, rows: 24 };
const COUNT_AT: [number, number] = [640, 560];
/** the ankh (measured off the art: x 602-677, y 190-292) hangs by its loop
 *  just under the frame's inner gold line (y 176-180) */
const ANKH_HANG: [number, number] = [640, 194];
const ANKH_AT: [number, number] = [640, 241];
const COUNTER_WAVE: Wave = { speed: 1500, lambda: 300, decay: 6, oval: 1.3 };

export type CounterKnock = { at: number; force: number };
export const COUNTER_KNOCK_S = 1.2;

export const buildCounterGrid = (): PlaqueGrid => buildGrid(COUNTER.w, COUNTER.h, COUNTER.cols, COUNTER.rows);

export const poseCounter = (grid: PlaqueGrid, knocks: CounterKnock[], now: number, out: Float32Array) => {
	const n = grid.rest.length / 2;
	let swing = 0;
	for (const k of knocks) swing += 9 * k.force * flick(now - k.at, 2.2, 3.2);
	const th = (swing * Math.PI) / 180;
	const cos = Math.cos(th), sin = Math.sin(th);
	for (let v = 0; v < n; v++) {
		const x0 = grid.rest[v * 2], y0 = grid.rest[v * 2 + 1];
		let x = x0, y = y0;
		for (const k of knocks) {
			const [dx, dy] = wave(x0, y0, COUNT_AT, now - k.at, 12 * k.force, COUNTER_WAVE);
			x += dx;
			y += dy;
		}
		// the ankh, and a margin of the plaque round it, turns about its loop —
		// and nothing above the loop: the first cut reached the frame's border
		// tiles and smeared them white
		const e = Math.hypot((x0 - ANKH_AT[0]) / 48, (y0 - ANKH_AT[1]) / 60);
		const w = smoothstep((1.35 - e) / 0.35) * smoothstep((y0 - 184) / 10);
		if (w > 0 && th !== 0) {
			const rx = x - ANKH_HANG[0], ry = y - ANKH_HANG[1];
			x += w * (rx * cos - ry * sin - rx);
			y += w * (rx * sin + ry * cos - ry);
		}
		out[v * 2] = x;
		out[v * 2 + 1] = y;
	}
};
