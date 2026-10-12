import { ColorMatrixFilter } from 'pixi.js';

/**
 * Lift the delivered night paintings at render time. Apply one filter to the
 * whole reel presentation so static, split, landing and mesh-win versions of a
 * symbol keep the same colour and the source art stays reproducible.
 */
const makeLift = (gain: number, red: number, green: number, blue: number) => {
	const filter = new ColorMatrixFilter();
	filter.matrix = [
		gain, 0, 0, 0, red,
		0, gain, 0, 0, green,
		0, 0, gain, 0, blue,
		0, 0, 0, 1, 0,
	];
	filter.resources.colorMatrixUniforms.update();
	return filter;
};

export const makeBackgroundLighting = () => makeLift(1.03, 0.055, 0.06, 0.075);

export const makeSymbolLighting = () => {
	const filter = makeLift(0.97, 0.078, 0.082, 0.086);
	// High-pay subjects leap beyond the reel housing. Leave room for that travel.
	filter.padding = 180;
	return filter;
};
