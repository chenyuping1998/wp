import { Rectangle, Texture } from 'pixi.js';
import geometry from './artGeometry.json';

// The tumble splash (burst_sheet.png): one sub-texture per frame, cut once per sheet and
// shared by every burst on the board.
const cache = new WeakMap<Texture, Texture[]>();
export function splashFrames(sheet: Texture | undefined): Texture[] {
	if (!sheet) return [];
	let frames = cache.get(sheet);
	if (!frames) {
		const { frames: count, size } = geometry.burst;
		frames = Array.from({ length: count }, (_, i) => new Texture({ source: sheet.source, frame: new Rectangle(i * size, 0, size, size) }));
		cache.set(sheet, frames);
	}
	return frames;
}
