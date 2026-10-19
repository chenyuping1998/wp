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
	// RENDER AT THE SCREEN'S RESOLUTION (2026-10-16, review: low quality asset /
	// 獎圖糊糊的). A pixi v8 filter defaults to resolution 1, and FilterSystem
	// takes the MINIMUM of the filters' and the target's — so on a phone or a
	// retina screen (devicePixelRatio 2-3) everything under this filter, i.e. the
	// whole board, every symbol and every win act, was drawn at a half or a third
	// of the screen's pixels and then stretched back up. 'inherit' follows the
	// renderer. The art itself was always sharp.
	filter.resolution = 'inherit';
	filter.antialias = 'inherit';
	return filter;
};

export const makeBackgroundLighting = () => makeLift(1.03, 0.055, 0.06, 0.075);

// The symbols' lift used to add ~0.08 to every channel, which put the darkest
// ink at ~20/255: a grey film over the whole board that read as soft focus.
// Now the gain does the brightening and the offset only keeps the shadows off
// pure black, so outlines stay dark and edges keep their contrast.

export const makeSymbolLighting = () => {
	const filter = makeLift(1.06, 0.02, 0.022, 0.026);
	// High-pay subjects leap beyond the reel housing. Leave room for that travel.
	filter.padding = 180;
	return filter;
};
