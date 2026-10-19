import { Texture } from 'pixi.js';

/**
 * Mip chains for every loaded sprite texture (2026-10-16, review: low quality
 * asset / 獎圖糊糊的).
 *
 * The symbols are 1254px paintings drawn into cells of ~120-260 screen px, so
 * the GPU shrinks them 5-10x. Without mipmaps a shrink like that samples a
 * scattering of texels — the painted texture turns to grit and the edges
 * crawl as a reel moves, which reads as a blurry, low-grade image. With a mip
 * chain the shrink is properly filtered and the art stays clean.
 *
 * Done here, after loading, because the loader is shared (per-game settings
 * stay in the app — GoBanalchemy's crispPlate does the same for its plates).
 * `unload()` drops any GPU copy already made, so the next frame uploads it
 * again with the chain, under WebGL or WebGPU alike.
 */
const done = new WeakSet<object>();

export const crispTexture = (texture: Texture) => {
	const source = texture.source;
	if (!source || done.has(source)) return;
	done.add(source);
	if (source.autoGenerateMipmaps) return;
	// small textures (icons, particles) are drawn near their own size
	if (Math.max(source.pixelWidth, source.pixelHeight) < 192) return;
	source.autoGenerateMipmaps = true;
	source.mipLevelCount = Math.floor(Math.log2(Math.max(source.pixelWidth, source.pixelHeight))) + 1;
	source.style.mipmapFilter = 'linear';
	source.style.maxAnisotropy = 4;
	source.unload();
};

/** every Texture in the loaded-assets map */
export const crispAll = (assets: Record<string, unknown> | undefined) => {
	for (const value of Object.values(assets ?? {})) if (value instanceof Texture) crispTexture(value);
};
