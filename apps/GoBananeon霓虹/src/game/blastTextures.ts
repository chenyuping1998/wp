import { Texture } from 'pixi.js';

/** One small reusable alpha texture, generated once per mounted effect.
 * Six overlapping soft lobes make smoke read as volume without blur filters,
 * an extra atlas download, or a full-board render texture. */
export const createBlastSmoke = () => {
	const canvas = document.createElement('canvas');
	canvas.width = canvas.height = 128;
	const ctx = canvas.getContext('2d')!;
	for (let i = 0; i < 7; i++) {
		const angle = i * 2.39996;
		const radius = i === 0 ? 0 : 17 + (i % 3) * 3;
		const x = 64 + Math.cos(angle) * radius;
		const y = 64 + Math.sin(angle) * radius;
		const r = 30 + (i % 3) * 6;
		const gradient = ctx.createRadialGradient(x, y, 0, x, y, r);
		gradient.addColorStop(0, 'rgba(255,255,255,0.38)');
		gradient.addColorStop(0.4, 'rgba(255,255,255,0.27)');
		gradient.addColorStop(1, 'rgba(255,255,255,0)');
		ctx.fillStyle = gradient;
		ctx.fillRect(x - r, y - r, r * 2, r * 2);
	}
	return Texture.from(canvas);
};
