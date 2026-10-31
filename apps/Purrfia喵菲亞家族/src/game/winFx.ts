import { Texture, type Graphics } from 'pixi.js';
/**
 * The light around a winning symbol's act (user 2026-10-31). The objects inside the drawing do the acting
 * (symbolActing.ts); this only lights its beat, the way a commercial slot finishes a win — no particles, nothing
 * drawn that is not light on the symbol itself (user: 「不要有小星星那種效果，太粗糙」):
 *  - halo     a soft radial glow behind the art, up with the action and let go slowly — the symbol stepping into
 *             light, not a ring
 *  - shine    a soft diagonal band of light sweeping across the art's own pixels once, after the action: an additive
 *             copy of the art seen through a band mask (nested, so it falls off softly), so gold reads as gold and glass
 *             as glass
 *  - shadow   a contact shadow under the art that shrinks and pales as the tile lifts
 * Nothing loops; all of it is gone before the win window ends (memory: motion-restraint-pro-feel).
 * Cell px around the symbol's centre; `u` runs 0..1 over the win window like the acting.
 */
const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
const smooth = (a: number, b: number, x: number) => { const t = clamp01((x - a) / (b - a)); return t * t * (3 - 2 * t); };

export type WinFxTheme = { halo: number; shine: number };

/** the act's beats (symbolActing BEAT): the light comes up on the action and has gone by the hold */
const ACTION = 0.3, HOLD = 0.84;
const SHINE = [0.34, 0.74] as const;

let haloTex: Texture | undefined;
/** a soft radial glow: a hot core and a long falloff, no edge */
export const haloTexture = () => {
	if (haloTex) return haloTex;
	const c = document.createElement('canvas');
	c.width = c.height = 128;
	const g = c.getContext('2d')!, r = g.createRadialGradient(64, 64, 0, 64, 64, 64);
	r.addColorStop(0, 'rgba(255,255,255,0.9)');
	r.addColorStop(0.3, 'rgba(255,255,255,0.42)');
	r.addColorStop(0.62, 'rgba(255,255,255,0.12)');
	r.addColorStop(1, 'rgba(255,255,255,0)');
	g.fillStyle = r;
	g.fillRect(0, 0, 128, 128);
	return (haloTex = Texture.from(c));
};
/** the shine's band, three nested widths (cell fractions) and their share of the light: stacked, the steps read as a
 *  soft falloff from a bright core. (A soft alpha-texture mask would be one layer, but pixi's sprite masks did not
 *  pass anything on this build; stencil masks from Graphics do.) */
export const SHINE_BANDS: [number, number][] = [[0.46, 0.3], [0.28, 0.32], [0.12, 0.38]];
/** one band's mask: a tall strip tilted like light across a polished face, centred on 0,0 */
export function drawBand(g: Graphics, width: number, size: number) {
	g.clear();
	g.rect(-width * size / 2, -size * 0.95, width * size, size * 1.9).fill(0xffffff);
	g.rotation = 0.42;
}

/** how the light stands at `u`: halo alpha and scale, the shine band's position across the art (-1..1, null when
 *  off) and its strength. The low pays get less of everything. */
export function winLight(name: string, u: number) {
	const low = name.startsWith('L'), k = low ? 0.6 : name === 'S' ? 1.15 : 1;
	if (u <= 0 || u >= 1) return { halo: 0, haloScale: 1, shine: null as number | null, shineAlpha: 0 };
	const up = smooth(ACTION - 0.16, ACTION + 0.02, u), down = 1 - smooth(ACTION + 0.12, HOLD, u);
	const halo = 0.36 * k * up * down;
	const haloScale = 0.92 + 0.22 * smooth(ACTION - 0.16, HOLD, u);
	const s = (u - SHINE[0]) / (SHINE[1] - SHINE[0]);
	const shine = s > 0 && s < 1 ? -1.25 + 2.5 * (s * s * (3 - 2 * s)) : null;
	return { halo, haloScale, shine, shineAlpha: (low ? 0.5 : 0.75) * Math.sin(Math.PI * clamp01(s)) };
}

/** the contact shadow under the art: smaller and paler the higher the tile goes; `lift` is its rise in px (≤ 0) */
export function drawShadow(g: Graphics, u: number, size: number, lift: number) {
	g.clear();
	if (u <= 0 || u >= 1) return;
	const half = size / 2, up = clamp01(-lift / 12);
	g.ellipse(0, half * 0.86, half * 0.62 * (1 - 0.3 * up), half * 0.1 * (1 - 0.3 * up)).fill({ color: 0x000000, alpha: 0.22 * (1 - 0.6 * up) * Math.sin(Math.PI * u) });
}
