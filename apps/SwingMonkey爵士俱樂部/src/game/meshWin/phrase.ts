/** Shared score for instrument deformation, ink accents and note releases. */
export const JAZZ_HITS: Record<string, number[]> = {
	H1: [240, 820],
	H2: [220, 520, 820, 1060],
	H3: [300, 490, 680, 860, 1050, 1090],
	H4: [220, 500, 780, 1040],
	W: [350, 650], S: [350, 780], P: [350],
};

/** Zero at both ends: holds after the phrase must render the exact rest pose. */
export const phraseRelease = (t: number, end = 1440) => {
	const p = Math.max(0, Math.min(1, (end - t) / 240));
	return p * p * (3 - 2 * p);
};

/** The final note finishes before the symbol is unmounted, even after a flam. */
export const noteProgress = (t: number, hit: number, end: number): number | null => {
	const life = Math.min(500, end - hit - 32);
	if (life <= 0 || t <= hit || t >= hit + life) return null;
	return (t - hit) / life;
};

/** A soft attack followed by a decaying tail; no single-frame flashes. */
export const attackEnergy = (t: number, hits: readonly number[], life = 260) => {
	let energy = 0;
	for (const hit of hits) {
		const age = (t - hit) / life;
		if (age <= 0 || age >= 1) continue;
		energy += Math.min(1, age * 7) * (1 - age) ** 2;
	}
	return Math.min(1, energy);
};
