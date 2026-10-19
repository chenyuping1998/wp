import type { Texture } from 'pixi.js';

/**
 * Mipmaps for a background plate (2026-10-16, 背景要清晰).
 *
 * The plates are 2560 x 1440 (design/sharpen_backgrounds.py) so the GPU only
 * ever SHRINKS them; but a shrink by ~half without mipmaps samples every other
 * texel, and with the slow drift the brass rims and glass highlights shimmer.
 * With a mip chain the shrink is filtered and the plate stays crisp and still.
 *
 * Set after loading (the loader is shared — per-game settings stay in the
 * app). `unload()` drops any GPU copy already made, so the next frame rebuilds
 * it with the mip chain, under WebGL or WebGPU alike.
 */
export const crispPlate = (texture: Texture | undefined) => {
	const source = texture?.source;
	if (!source || source.autoGenerateMipmaps) return;
	source.autoGenerateMipmaps = true;
	source.mipLevelCount = Math.floor(Math.log2(Math.max(source.pixelWidth, source.pixelHeight))) + 1;
	source.style.mipmapFilter = 'linear';
	source.unload();
};
