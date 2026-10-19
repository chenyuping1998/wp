// Time is in authored milliseconds; the caller applies the same Turbo scale
// as the character. Geometry is shared with the visual review renderer.
export const SWORD_SLASH_DURATION = 740;
const clamp = (v: number) => Math.max(0, Math.min(1, v));
const out = (v: number) => 1 - (1 - clamp(v)) ** 3;
export type SlashRibbon = { points: number[]; alpha: number; color: number };
export type SlashStreak = { x: number; y: number; dx: number; dy: number; alpha: number; width: number };

export function swordSlashFrame(ms: number, width: number, finale = false) {
	const ribbons: SlashRibbon[] = [];
	const streaks: SlashStreak[] = [];
	const active = ms >= 110 && ms < SWORD_SLASH_DURATION && width > 0;
	const impact = active ? Math.exp(-(((ms - 320) / 38) ** 2)) : 0;
	if (!active) return { ribbons, streaks, impact: 0, glow: 0 };
	const strength = finale ? 1.24 : 1;
	const point = (u: number, offset = 0) => ({
		x: width * (0.53 - 1.06 * u),
		y: width * (-0.14 + 0.28 * u - 0.085 * Math.sin(Math.PI * u) + 0.055) + offset,
	});
	const ribbon = (head: number, tail: number, thickness: number, alpha: number, offset: number, color: number) => {
		if (alpha < 0.001 || head <= tail) return;
		const upper: number[] = [], lower: number[] = [];
		for (let i = 0; i <= 64; i++) {
			const f = i / 64, u = tail + (head - tail) * f;
			const p = point(u, offset);
			const slope = (0.28 - 0.085 * Math.PI * Math.cos(Math.PI * u)) / -1.06;
			const normal = Math.sqrt(1 + slope * slope);
			// Asymmetric belly, needle tips; a filled silhouette rather than a
			// constant-width line with round caps at either end.
			const belly = Math.sin(Math.PI * f) ** 0.72 * (0.55 + 0.6 * f);
			const r = thickness * belly;
			upper.push(p.x - slope / normal * r, p.y + r / normal);
			lower.unshift(p.x + slope / normal * r, p.y - r / normal);
		}
		// unshift pairs above reverses pair order as a unit.
		ribbons.push({ points: [...upper, ...lower], alpha: clamp(alpha), color });
	};
	// Two-frame anticipation hairline, then fast travel and a short impact hold.
	const head = out((ms - 150) / 170);
	const tail = out((ms - 350) / 350);
	const attack = out((ms - 150) / 70);
	const fade = (1 - clamp((ms - 350) / 350)) ** 2;
	const envelope = attack * fade;
	ribbon(out((ms - 110) / 150), out((ms - 230) / 180), width * 0.0012, 0.22 * (1 - clamp((ms - 240) / 100)), -width * 0.012, 0xe8f7ff);
	// Nested low-alpha silhouettes approximate a soft bloom without a filter
	// allocation or fullscreen flash, including on mobile renderers.
	for (const [size, opacity] of [[3.8, 0.035], [2.7, 0.055], [1.8, 0.12]])
		ribbon(head, tail, width * 0.019 * size * strength, envelope * opacity, 0, 0xc9eaff);
	ribbon(head, tail, width * 0.019 * strength, envelope * 0.86, 0, 0xf3fbff);
	ribbon(head, tail, width * 0.0065 * strength, envelope, -width * 0.003, 0xffffff);
	// Offset filaments peel away after contact and disappear at different rates.
	for (let i = 0; i < 3; i++) {
		const delay = i * 22;
		const life = clamp((ms - 230 - delay) / 420);
		ribbon(out((ms - 180 - delay) / 180), out((ms - 350 - delay) / 310),
			width * (0.0018 - i * 0.00035), Math.sin(Math.PI * life) * (1 - life) * 0.55,
			width * (0.014 + i * 0.012) * (i % 2 ? -1 : 1) * out(life), 0xf0faff);
	}
	// Thin ballistic splinters, with deliberately staggered births.
	for (let i = 0; i < (finale ? 17 : 11); i++) {
		const age = (ms - 290 - i % 4 * 11) / 1000;
		if (age <= 0 || age >= 0.3) continue;
		const u = 0.15 + ((i * 0.618034) % 0.7);
		const p = point(u);
		const side = i % 2 ? -1 : 1;
		const vx = -width * (0.12 + i % 3 * 0.06);
		const vy = width * (0.16 + i % 4 * 0.055) * side;
		streaks.push({ x: p.x + vx * age, y: p.y + vy * age + width * age * age * 0.16,
			dx: vx * 0.028, dy: vy * 0.028, width: width * (i % 3 ? 0.001 : 0.002),
			alpha: Math.sin(Math.PI * clamp(age / 0.3)) * (1 - age / 0.3) * 0.8 });
	}
	return { ribbons, streaks, impact, glow: envelope * 0.12 + impact * 0.28 };
}
