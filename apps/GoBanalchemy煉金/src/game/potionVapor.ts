/** Deterministic staging shared by runtime and art review. Units: cells. */
const clamp = (v: number) => Math.min(1, Math.max(0, v));
const ease = (v: number) => {
	const k = clamp(v);
	return k * k * (3 - 2 * k);
};
export const reactionTiming = (width: number) => {
	const k = [0, 0.64, 0.76, 0.88, 1, 1.08][Math.min(5, Math.max(1, width))];
	const charge = 380,
		swap = charge + Math.round(500 * k),
		reveal = swap + 170;
	return {
		charge,
		swap,
		reveal,
		end: reveal + Math.round(900 * k),
		settle: Math.round(300 * k),
	};
};
export type ReactionTiming = ReturnType<typeof reactionTiming>;
const hash = (n: number) => {
	const x = Math.sin(n * 78.233 + 12.9898) * 43758.5453;
	return x - Math.floor(x);
};
export const vaporParticles = (reel: number) =>
	Array.from({ length: 22 }, (_, i) => ({
		reel,
		row: i % 4,
		x: (hash(reel * 53 + i) - 0.5) * 0.82,
		lag: hash(reel * 17 + i + 20) * 110,
		size: 1.45 + hash(i + 70) * 0.6,
		turn: (hash(i + 100) - 0.5) * 1.1,
		seed: hash(reel * 29 + i + 5),
	}));
export type VaporParticle = ReturnType<typeof vaporParticles>[number];
export const coverOpacity = (t: number, b: ReactionTiming) =>
	ease((t - b.charge) / (b.swap - b.charge)) *
	(1 - ease((t - b.reveal) / ((b.end - b.reveal) * 0.72)));
export const vaporPose = (p: VaporParticle, t: number, b: ReactionTiming) => {
	const grow = ease((t - b.charge + 100 - p.lag) / (b.swap - b.charge + 100));
	const clear = ease((t - b.reveal - p.lag * 0.5) / (b.end - b.reveal - p.lag * 0.5));
	const drift = Math.max(0, t - b.charge) / 1000;
	return {
		x: p.x + Math.sin(drift * 1.4 + p.seed * 6.28) * 0.12 * grow + p.x * clear * 0.4,
		y:
			p.row +
			0.55 -
			clear * (0.5 + p.seed * 0.45) -
			Math.sin(drift * 1.2 + p.seed * 5) * 0.1 * grow,
		size: p.size * grow * (1 + clear * 0.55),
		aspect: 0.94 + p.seed * 0.2,
		rotation: p.turn + drift * (p.seed - 0.5) * 0.16,
		alpha: t < 0 ? 0 : grow * (1 - clear) ** 1.8 * (0.55 + p.seed * 0.24),
	};
};
