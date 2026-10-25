/** Lighting authored over the existing 256 x 144 painted background plates.
 * The middle stays quiet for the reels; moving light belongs to signs,
 * pavement, roof fixtures and the visible screen margins on a tall phone.
 * No Pixi, DOM or Svelte imports: the scene and its clock can be checked offline.
 */
export type ClubMode = 'base' | 'feature' | 'hold';
export type StagePoint = { x: number; y: number };
export type StageRect = StagePoint & { width: number; height: number };
export type StageViewport = { width: number; height: number };

const TAU = Math.PI * 2;
const clamp = (v: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));
const smooth = (v: number) => { const k = clamp(v); return k * k * (3 - 2 * k); };
const fract = (v: number) => v - Math.floor(v);

/** One visible-time clock for the plate, lighting and its mesh props. A tab
 * resume starts with zero delta, and a blocked main thread cannot make the
 * scenery jump through a long missing frame. Normal 30/60/144Hz time agrees.
 */
export class BackgroundClock {
	private previous: number | undefined;
	private elapsed = 0;
	frame(now: number, visible = true): number {
		if (!visible) { this.previous = undefined; return this.elapsed; }
		if (this.previous !== undefined) this.elapsed += clamp(now - this.previous, 0, 75);
		this.previous = Math.max(now, this.previous ?? now);
		return this.elapsed;
	}
	pause(): void { this.previous = undefined; }
}

export const CLUB_STYLE = {
	base: { bpm: 105, cyan: 0x36ddff, pink: 0xf64dd4, sweep: 15.6, beam: 0.085, particles: 12 },
	feature: { bpm: 128, cyan: 0x3af2ff, pink: 0xff48c8, sweep: 9.4, beam: 0.10, particles: 18 },
	hold: { bpm: 128, cyan: 0x63eaff, pink: 0xbe68ff, sweep: 19.2, beam: 0.065, particles: 8 },
} as const;

export type StageCues = {
	djAt: number;
	djStopAt: number;
	chestAt: number;
	fuseAt: number;
	burstAt: number;
	burstStrength: number;
	coinAt: number;
};
export const quietStageCues = (): StageCues => ({
	djAt: -Infinity, djStopAt: Infinity, chestAt: -Infinity,
	fuseAt: -Infinity, burstAt: -Infinity, burstStrength: 0, coinAt: -Infinity,
});
const envelope = (age: number, attack: number, release: number) =>
	age < 0 || !Number.isFinite(age) ? 0 : smooth(age / attack) * (1 - smooth((age - attack) / release));

export const stageBeat = (timeMs: number, bpm: number) => {
	// A round bass pulse, with a soft attack rather than an instantaneous flash.
	const phase = fract(timeMs * bpm / 60000);
	return Math.sin(Math.PI * phase) ** 8;
};

export const stageResponse = (mode: ClubMode, timeMs: number, cues: StageCues) => {
	const djAge = timeMs - cues.djAt;
	const dj = Number.isFinite(djAge) ? smooth(djAge / 180) * (1 - smooth((djAge - 2750) / 450))
		* (1 - smooth((timeMs - cues.djStopAt) / 220)) : 0;
	let chest = 0;
	for (let i = 0; i < 6; i++) chest += envelope(timeMs - cues.chestAt - 480 - i * 300, 28, 180) * (0.7 + i * 0.06);
	const burst = envelope(timeMs - cues.burstAt, 24, 560) * clamp(cues.burstStrength);
	const fuse = envelope(timeMs - cues.fuseAt, 370, 500);
	const coin = envelope(timeMs - cues.coinAt, 45, 500);
	const beat = stageBeat(timeMs, CLUB_STYLE[mode].bpm) * (1 - dj) + stageBeat(Number.isFinite(djAge) ? Math.max(0, djAge) : 0, 125) * dj;
	return { dj, chest: clamp(chest), burst, fuse, coin, beat,
		energy: clamp(0.15 * beat + 0.32 * dj + 0.25 * chest + 0.22 * burst + 0.16 * coin),
	};
};

export const projectStagePoint = (plate: StageRect, x: number, y: number): StagePoint => ({
	x: plate.x + x / 256 * plate.width,
	y: plate.y + y / 144 * plate.height,
});

type RailDefinition = { a: [number, number]; b: [number, number]; pink?: boolean };
type SignDefinition = { x: number; y: number; width: number; height: number; pink?: boolean };
const RAILS: Record<ClubMode, RailDefinition[]> = {
	base: [
		{ a: [0, 109], b: [60, 94] }, { a: [205, 96], b: [256, 107], pink: true },
		{ a: [243, 63], b: [256, 59] }, { a: [0, 37], b: [40, 49], pink: true },
	],
	feature: [
		{ a: [0, 86], b: [31, 80], pink: true }, { a: [208, 71], b: [256, 79], pink: true },
		{ a: [17, 65], b: [64, 63], pink: true }, { a: [215, 66], b: [256, 74] },
		{ a: [1, 8], b: [41, 0], pink: true },
	],
	hold: [
		{ a: [49, 25], b: [49, 80], pink: true }, { a: [207, 25], b: [207, 80] },
		{ a: [0, 55], b: [36, 62] }, { a: [220, 61], b: [256, 54] },
		{ a: [100, 5], b: [155, 5] },
	],
};
const SIGNS: Record<ClubMode, SignDefinition[]> = {
	base: [
		{ x: 56, y: 2, width: 6, height: 31 }, { x: 78, y: 0, width: 6, height: 21, pink: true },
		{ x: 224, y: 12, width: 6, height: 25 }, { x: 216, y: 54, width: 2.2, height: 17, pink: true },
	],
	feature: [
		{ x: 30, y: 63, width: 2, height: 8, pink: true }, { x: 228, y: 73, width: 3.3, height: 10 },
		{ x: 218, y: 34, width: 1.7, height: 13 }, { x: 225, y: 24, width: 1.7, height: 11, pink: true },
	],
	hold: [
		{ x: 47, y: 20, width: 3, height: 31, pink: true }, { x: 205, y: 53, width: 3, height: 26 },
		{ x: 47, y: 55, width: 3, height: 25 }, { x: 205, y: 20, width: 3, height: 30, pink: true },
	],
};

export type StageBeam = { source: StagePoint; end: StagePoint; spread: number; color: number; alpha: number };
export type StageRail = { a: StagePoint; b: StagePoint; head: StagePoint; tail: StagePoint; color: number; alpha: number; width: number };
export type StageSign = StageRect & { color: number; alpha: number; dim: number };
export type StageReflection = StagePoint & { rx: number; ry: number; color: number; alpha: number };
export type StageParticle = StagePoint & { radius: number; color: number; alpha: number; near: boolean };
export type StageRain = StagePoint & { length: number; alpha: number };

/** All collections have fixed upper bounds. This returns no growing particle
 * list, creates no textures/filters, and needs no per-cue timer.
 */
export const clubStageFrame = (mode: ClubMode, timeMs: number, plate: StageRect, viewport: StageViewport, cues: StageCues) => {
	const style = CLUB_STYLE[mode];
	const response = stageResponse(mode, timeMs, cues);
	const seconds = timeMs / 1000;
	const unit = Math.min(viewport.width / 1422, viewport.height / 800);
	const point = (x: number, y: number) => projectStagePoint(plate, x, y);
	const visible = (p: StagePoint, margin = 24) => p.x >= -margin && p.x <= viewport.width + margin && p.y >= -margin && p.y <= viewport.height + margin;
	const tall = viewport.height > viewport.width * 1.15;
	const beams: StageBeam[] = [];
	for (let i = 0; i < 4; i++) {
		const side = i % 2;
		const upper = i < 2;
		let source = mode === 'base' ? point(side ? 213 : 82, side ? 42 : 26)
			: mode === 'feature' ? point(side ? 243 : 14, 6) : point(side ? 207 : 49, 18);
		// The painted fixtures leave the screen on a tall crop. Stage lights
		// then enter from the visible top margin instead of becoming invisible.
		if (!visible(source) || !upper) source = { x: viewport.width * (side ? 0.96 : 0.04), y: viewport.height * (upper ? 0.11 : 0.36) };
		const swing = Math.sin(seconds * TAU / (style.sweep * (upper ? 1 : 1.3)) + side * 2.3 + i) * (0.06 + 0.055 * response.dj);
		const end = {
			x: viewport.width * clamp((side ? 0.89 : 0.11) + swing * (side ? -1 : 1), 0.015, 0.985),
			y: viewport.height * (upper ? 0.91 : 0.75),
		};
		const music = 0.78 + 0.22 * response.beat;
		beams.push({ source, end, spread: viewport.width * (tall ? 0.055 : 0.045) * (1 - 0.28 * response.fuse),
			color: side ? style.pink : style.cyan,
			alpha: style.beam * (upper ? 1 : 0.42) * music * (1 + 1.5 * response.energy),
		});
	}
	const rails = RAILS[mode].map((rail, i): StageRail => {
		const a = point(...rail.a), b = point(...rail.b);
		const phase = fract(seconds / (mode === 'hold' ? 3.6 : 2.6) + i * 0.29);
		const tail = Math.max(0, phase - 0.18);
		return { a, b, head: { x: a.x + (b.x - a.x) * phase, y: a.y + (b.y - a.y) * phase },
			tail: { x: a.x + (b.x - a.x) * tail, y: a.y + (b.y - a.y) * tail },
			color: rail.pink ? style.pink : style.cyan, alpha: 0.18 + 0.3 * response.energy,
			width: Math.max(1.2, plate.height / 144 * 0.25),
		};
	});
	const signs = SIGNS[mode].map((sign, i): StageSign => {
		const top = point(sign.x, sign.y);
		// A rare electrical dip is local to one sign and eases in/out. The
		// background never uses a full-screen strobe or random frame flicker.
		const phase = fract(seconds / (10.8 + i * 2.9) + i * 0.23);
		const dip = envelope(phase * 1000 - 630, 30, 100) * 0.34;
		return { ...top, width: sign.width / 256 * plate.width, height: sign.height / 144 * plate.height,
			color: sign.pink ? style.pink : style.cyan,
			alpha: clamp(0.15 + 0.20 * response.beat + 0.26 * response.energy - dip, 0.03, 0.6), dim: dip,
		};
	});
	const reflections: StageReflection[] = [];
	for (let side = 0; side < 2; side++) {
		let origin = point(side ? 219 : 43, mode === 'hold' ? 121 : mode === 'feature' ? 118 : 123);
		if (!visible(origin) || tall) origin = { x: viewport.width * (side ? 0.91 : 0.09), y: viewport.height * 0.86 };
		for (let i = 0; i < 11; i++) {
			const flow = fract(i / 11 + seconds * 0.045);
			const fade = Math.sin(flow * Math.PI);
			reflections.push({ x: origin.x + Math.sin(seconds * 0.8 + i * 2.7) * 9 * unit,
				y: origin.y + (flow - 0.5) * viewport.height * 0.23,
				rx: (11 + 30 * fade + 4 * Math.sin(seconds + i)) * unit, ry: (0.8 + flow * 1.8) * unit,
				color: side ? style.pink : style.cyan,
				alpha: (mode === 'hold' ? 0.12 : 0.15) * fade * (0.65 + 0.35 * response.beat + response.energy),
			});
		}
	}
	const particles: StageParticle[] = Array.from({ length: style.particles }, (_, i) => {
		const near = i % 3 === 0;
		const side = i % 2;
		const rise = fract(i * 0.6180339887 + seconds * (near ? 0.028 : 0.014));
		const x = viewport.width * (side ? 0.88 + 0.10 * fract(i * 0.41421) : 0.02 + 0.10 * fract(i * 0.41421));
		return { x: x + Math.sin(seconds * 0.35 + i * 2.7) * 12 * unit,
			y: viewport.height * (1.03 - rise * 1.08), near,
			radius: (near ? 2.2 : 1) * unit, color: side ? style.pink : style.cyan,
			alpha: (near ? 0.24 : 0.17) * Math.sin(rise * Math.PI) ** 2,
		};
	});
	const rain: StageRain[] = mode === 'base' ? Array.from({ length: 24 }, (_, i) => ({
		x: fract(i * 0.6180339887 - seconds * 0.005) * viewport.width,
		y: (fract(i * 0.4142135624 + seconds * (0.48 + i % 5 * 0.08)) * 1.12 - 0.06) * viewport.height,
		length: (10 + i % 4 * 5) * unit, alpha: 0.09,
	})) : [];
	return { beams, rails, signs, reflections, particles, rain, response };
};
