import type { Graphics } from 'pixi.js';
import { JAZZ_HITS } from './phrase';

/** Ink gestures follow each instrument's physical source, in its 256px canvas. */
export const drawInstrumentAccents = (g: Graphics, symbol: string, t: number) => {
	const hits = JAZZ_HITS[symbol] ?? [];
	for (let i = 0; i < hits.length; i++) {
		const p = (t - hits[i]) / 280;
		if (p <= 0 || p >= 1) continue;
		const alpha = Math.min(1, p * 8) * (1 - p) ** 1.5;
		const color = symbol === 'S' ? 0xf2b632 : 0xd9342b;
		if (symbol === 'H3') {
			// Rings spread over the drum head, alternating with the two sticks.
			g.ellipse(i % 2 ? 169 : 133, 134, 14 + p * 38, 4 + p * 10)
				.stroke({ width: 1.6, color, alpha: alpha * 0.8 });
		} else if (symbol === 'H2' || symbol === 'H4') {
			const bass = symbol === 'H2';
			const [ax, ay, bx, by] = bass ? [112, 46, 140, 158] : [92, 180, 190, 64];
			const shake = Math.sin(p * Math.PI * 12) * 5 * (1 - p);
			g.moveTo(ax, ay).quadraticCurveTo((ax + bx) / 2 + shake, (ay + by) / 2 + shake, bx, by)
				.stroke({ width: 1.2, color: 0xf3e9d2, alpha: alpha * 0.85 });
			if (!bass) g.circle(86, 176, 32 + p * 20).stroke({ width: 1.5, color, alpha: alpha * 0.65 });
		} else if (symbol === 'H1') {
			// Bell pressure leaves in curved sound marks rather than drum impacts.
			for (let arc = 0; arc < 2; arc++) {
				const radius = 25 + p * 30 + arc * 12;
				g.moveTo(185 + Math.cos(-1.3) * radius, 132 + Math.sin(-1.3) * radius)
					.arc(185, 132, radius, -1.3, -0.2)
					.stroke({ width: 2, color, alpha: alpha * (1 - arc * 0.3) });
			}
		} else if (symbol === 'S') {
			// The microphone broadcasts two gold wave fronts from its capsule.
			for (const side of [-1, 1]) {
				const center = side < 0 ? Math.PI : 0, radius = 40 + p * 27;
				g.moveTo(128 + Math.cos(center - 0.65) * radius, 86 + Math.sin(center - 0.65) * radius)
					.arc(128, 86, radius, center - 0.65, center + 0.65)
					.stroke({ width: 2.5, color, alpha });
			}
		} else if (symbol === 'W') {
			// Hat-tip emphasis stays by the brim, leaving the face unobscured.
			for (let ray = 0; ray < 4; ray++) {
				const a = -2.75 + ray * 0.72, r = 53 + p * 15;
				const x = 113 + Math.cos(a) * r, y = 68 + Math.sin(a) * r;
				g.moveTo(x, y).lineTo(x + Math.cos(a) * 9, y + Math.sin(a) * 9)
					.stroke({ width: 2.5, color, alpha });
			}
		} else {
			for (let ray = 0; ray < 5; ray++) {
				const a = -2.8 + ray * 0.62, r = 99 + p * 17;
				const x = 128 + Math.cos(a) * r, y = 132 + Math.sin(a) * r;
				g.moveTo(x, y).lineTo(x + Math.cos(a) * (9 - p * 5), y + Math.sin(a) * (9 - p * 5))
					.stroke({ width: 3 * (1 - p) + 1, color, alpha: alpha * 0.8 });
			}
		}
	}
};
