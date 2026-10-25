/** Scene coordinates stay fixed. Only clouds, night fire and statue pieces move. */
export const BACKGROUND_SIZE = { width: 1920, height: 1080 } as const;
export const CLOUD_PIXELS_PER_SECOND = BACKGROUND_SIZE.width / 5 / 60;
export const STATUE_SECONDS = 1.2;
export const STATUE_TO_MEDUSA_HEIGHT=1/5;
export const FLAME_ANCHOR_V = 1434 / 1536;
export const BACKGROUND_KEYS = ['mgBgBase', 'mgBgFree', 'mgBgCloud', 'mgBgTourist', 'mgBgIcecream', 'mgBgFlame', 'fxCrack1', 'fxCrack2', 'fxCrack3', 'fxGlow'] as const;
export const FLAME_GRID = { columns: 18, rows: 28 } as const;
export const CLOUDS = [
	{ x: 580, y: 64, width: 600, height: 200 },
	{ x: 1360, y: 84, width: 400, height: 134 },
	{ x: -980, y: 75, width: 480, height: 160 },
	{ x: -200, y: 80, width: 450, height: 150 },
] as const;
export const BRAZIERS = [{ x: 188, y: 712 }, { x: 1735, y: 712 }] as const;
export const STATUES = [
	{ key: 'mgBgTourist', x: 370, y: 1002, width: 60, height: 120, plinth: 0.895 },
	{ key: 'mgBgIcecream', x: 1743, y: 995, width: 60, height: 120, plinth: 0.89 },
] as const;
export const clamp = (t: number) => Math.max(0, Math.min(1, t));
export const ease = (t: number) => { const p = clamp(t); return p * p * (3 - 2 * p); };
// Shared irregular edges form a complete partition. All UVs retain the painted
// statue; these are fracture cuts, never replacement shapes drawn over the art.
const fractureRows = [
	[[0, 0], [0.32, 0], [0.67, 0], [1, 0]],
	[[0, 0.25], [0.35, 0.22], [0.69, 0.27], [1, 0.24]],
	[[0, 0.46], [0.29, 0.43], [0.65, 0.49], [1, 0.45]],
	[[0, 0.71], [0.39, 0.68], [0.70, 0.73], [1, 0.70]],
	[[0, 1], [0.33, 1], [0.68, 1], [1, 1]],
] as const;
export const STATUE_FRACTURE_PIECES = fractureRows.slice(0, -1).flatMap((row, y) =>
	row.slice(0, -1).map((p, x) => [p, row[x + 1], fractureRows[y + 1][x + 1], fractureRows[y + 1][x]]));
/** Fast break, readable held pose, then bottom-to-top assembly with one settle. */
const statuePieceAmount = (index: number, age: number) => {
	if (age <= 0.16 || age >= STATUE_SECONDS) return 0;
	const row = Math.floor(index / 3), column = index % 3;
	const launch = 0.16 + column * 0.008;
	const returnAt = 0.50 + (3 - row) * 0.023 + column * 0.007;
	const landAt = 0.87 + (3 - row) * 0.040 + column * 0.014;
	if (age < 0.39) return 1 - (1 - clamp((age - launch) / (0.39 - launch))) ** 3;
	if (age < returnAt) return 1;
	const t = clamp((age - returnAt) / (landAt - returnAt));
	// Back easing: a small overshoot makes the pieces click into their sockets.
	const q = t - 1, back = 1 + 2.25 * q ** 3 + 1.25 * q ** 2;
	return t >= 1 ? 0 : 1 - back;
};
export const cloudPosition = (time: number, start: number, _width: number) => {
	const margin = 600, span = BACKGROUND_SIZE.width + margin * 2;
	return ((start + time * CLOUD_PIXELS_PER_SECOND + margin) % span + span) % span - margin;
};
/** Fade in open sky before reaching the opaque foreground column masks. */
export const cloudVisibility = (x: number, width: number) => ease((x - 155 - width / 2) / 120) * ease((1770 - width / 2 - x) / 120);
export const statueEnvelope = (age: number) => {
	return { split: Math.max(...STATUE_FRACTURE_PIECES.map((_, index) => Math.abs(statuePieceAmount(index, age)))),
		crack: age >= 0.03 && age <= 0.16 ? ease((age - 0.03) / 0.035) : 0,
		crackStage: age < 0.065 ? 0 : age < 0.105 ? 1 : 2 };
};
export const statuePiecePose = (index: number, age: number, width: number, height: number) => {
	const split = statuePieceAmount(index, age), row = Math.floor(index / 3), column = index % 3;
	const dx = (column - 1) * 0.19 + (row % 2 ? -0.018 : 0.018);
	const dy = [-0.065, -0.012, 0.035, 0.055][row];
	return { x: dx * width * split,
		y: (dy * split + 0.024 * Math.max(split, 0) ** 2) * height,
		rotation: ((column - 1) * 0.19 + (row % 2 ? 0.075 : -0.075)) * split,
		depth: Math.abs(split) };
};
export const flamePoint = (u: number, v: number, time: number, seed: number) => {
	// Bottom rows remain fixed on the bowl. Independent tip timing avoids a loop
	// of the entire flame scaling up and down like a breathing halo.
	const weight = Math.max(0, (FLAME_ANCHOR_V - v) / FLAME_ANCHOR_V) ** 1.5;
	// Waves travel from the fixed root to the tips. Lateral and vertical phases
	// differ across the three painted tongues, rather than scaling a whole sprite.
	const sway = Math.sin(time * 7.3 + seed + v * 7.8) * 0.070 + Math.sin(time * 12.7 + seed * 1.8 + v * 15.2) * 0.025;
	const curl = Math.sin(time * 8.1 + seed + u * 7.4 + v * 3.0) * 0.040 + Math.sin(time * 13.7 + seed * 1.4 + u * 12.1 + v * 5.2) * 0.012;
	return { x: u - 0.5 + sway * weight, y: v - FLAME_ANCHOR_V - curl * weight };
};
/** Small upward-moving internal distortion changes the licks' bright cores. */
export const flameUV = (u: number, v: number, time: number, seed: number) => {
	const weight = Math.max(0, (FLAME_ANCHOR_V - v) / FLAME_ANCHOR_V) ** 1.5;
	return { u: u + Math.sin(time * 6.7 + v * 11 + seed) * 0.012 * weight,
		v: v + Math.sin(time * 9.4 + v * 10 + seed + u * 4) * 0.023 * weight };
};
export const mixTint = (a: number, b: number, t: number) => {
	let result = 0;
	for (const shift of [16, 8, 0]) result |= Math.round(((a >> shift) & 255) * (1 - t) + ((b >> shift) & 255) * t) << shift;
	return result;
};
