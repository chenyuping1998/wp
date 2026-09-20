// THE TABLET'S MULTIPLIER CARTOUCHE.
//
// One drawing, used in two places: the badge a held tablet wears on the board
// (Symbol.svelte) and the window its value rolls through while it is being
// re-drawn (MultiplierRoll.svelte). They have to be the same object — the roll
// ends by handing the number back to the board, and if the two were drawn
// separately that hand-over would be a visible change of furniture.
//
// It is a cartouche: a rounded lapis panel in a gold setting with a bead tied at
// each end, lit from above, the same stones as the Buy Bonus scarab and the win
// plaques. What it replaced was a flat near-black box, which read as a hole
// punched in the tablet for as long as the value was rolling.
import type { Graphics as PixiGraphics } from 'pixi.js';

// as fractions of SYMBOL_SIZE
export const BADGE_W = 0.72;
export const BADGE_H = 0.34;

export type BadgeOptions = {
	x: number;
	y: number;
	width: number;
	height: number;
	// 0 → 1 landing punch: brightens the rim and throws a flare around it
	punch?: number;
	// the rim is brighter once the value is settled
	lit?: boolean;
	// the seat beneath it, which the board's own badge does not need because it
	// is drawn onto an opaque plate
	shadow?: boolean;
};

export const drawMultiplierBadge = (g: PixiGraphics, options: BadgeOptions) => {
	const { x, y, width: w, height: h } = options;
	const punch = options.punch ?? 0;
	const r = h / 2;

	if (options.shadow) {
		g.roundRect(x - w / 2 - 3, y - h / 2 - 1, w + 6, h + 6, r + 3).fill({
			color: 0x000000,
			alpha: 0.38,
		});
	}
	// gold setting
	g.roundRect(x - w / 2, y - h / 2, w, h, r).fill({ color: 0x8a5c14 });
	// the stone: base, then a lighter upper half for the light from above
	const iw = w - 7;
	const ih = h - 7;
	g.roundRect(x - iw / 2, y - ih / 2, iw, ih, ih / 2).fill({ color: 0x122a5e });
	g.roundRect(x - iw / 2 + 1, y - ih / 2 + 1, iw - 2, ih * 0.5, ih / 2).fill({
		color: 0x27459a,
		alpha: 0.75,
	});
	// gold rim
	g.roundRect(x - w / 2 + 1.5, y - h / 2 + 1.5, w - 3, h - 3, r).stroke({
		width: 2.2 + 2 * punch,
		color: options.lit ? 0xffe08a : 0xe8ae3c,
		alpha: 0.85 + 0.15 * punch,
	});
	// a bead at each end, the way a cartouche is tied off
	for (const bx of [x - w / 2 + 1, x + w / 2 - 1]) {
		g.circle(bx, y, r * 0.42).fill({ color: 0xffd86a });
		g.circle(bx, y, r * 0.42).stroke({ width: 1.2, color: 0x5e4210, alpha: 0.8 });
	}
	// landing flare: the whole cartouche catches light
	if (punch > 0) {
		g.roundRect(x - w / 2 - 4, y - h / 2 - 4, w + 8, h + 8, r + 4).stroke({
			width: 6 * punch,
			color: 0xfff3c4,
			alpha: 0.55 * punch,
		});
	}
};
