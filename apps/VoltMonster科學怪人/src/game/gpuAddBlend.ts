/** 2026-10-25 (user: 背景星星或房子都多了一個灰底). Under WebGPU — the app's
 * default renderer — pixi 8.8.1 blends `add` with alpha factors
 * src-alpha / one-minus-src-alpha, so every additive sprite drawn at alpha a
 * leaves the canvas alpha at 1 - a + a². The canvas is transparent
 * (backgroundAlpha 0), so the page shows through each light's whole quad: a
 * grey box round every star, the moon's halo, the barn and village windows.
 * WebGL's `add` is ONE, ONE on all four channels; make WebGPU's the same.
 * Imported by Game.svelte before the app initialises, so no pipeline has been
 * built with the old factors yet. */
import { GpuBlendModesToPixi } from 'pixi.js';

GpuBlendModesToPixi.add = {
	...GpuBlendModesToPixi.add,
	alpha: { srcFactor: 'one', dstFactor: 'one', operation: 'add' },
};
