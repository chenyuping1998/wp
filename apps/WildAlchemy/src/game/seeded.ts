/**
 * Deterministic "performance randomness".
 *
 * The reference client decides its purely cosmetic choices (which conversion
 * clip, which win reaction, where the fog starts spreading) with a generator
 * seeded from the board, so the same round always plays the same way. Stake
 * replays require exactly that: a replayed book must look like the original.
 * Everything here is seeded from the reveal board, never from Math.random.
 */

/** FNV-1a over a string, 32-bit. */
export const hashString = (text: string): number => {
	let hash = 0x811c9dc5;
	for (let i = 0; i < text.length; i++) {
		hash ^= text.charCodeAt(i);
		hash = Math.imul(hash, 0x01000193) >>> 0;
	}
	return hash >>> 0;
};

/** mulberry32: small, fast, good enough for picking clips. Returns [0, 1). */
export const seededRandom = (seed: number) => {
	let state = seed >>> 0;
	return () => {
		state = (state + 0x6d2b79f5) >>> 0;
		let t = state;
		t = Math.imul(t ^ (t >>> 15), t | 1);
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
};

/** A board's seed: its 36 symbol names in reel-major order. */
export const boardSeed = (board: { name: string; from?: string }[][]): number =>
	hashString(board.map((reel) => reel.map((cell) => cell.from ?? cell.name).join(',')).join('/'));

/** Pick one element with a seeded generator. */
export const pickSeeded = <T>(items: readonly T[], random: () => number): T =>
	items[Math.min(items.length - 1, Math.floor(random() * items.length))];
