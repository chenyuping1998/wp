// Buy-tile glyph for Wild Alchemy (2026-11-11), drawn by the bet bar
// (ui/MummyBar.svelte, bar v3) and by the rules page's controls guide
// (ui/BarIcon.svelte). viewBox -50..50; 'ink' is the sepia stamp, 'tile' is cut
// back out in the tile's own parchment, 'accent' is the verdigris liquid.
// Shapes: d = filled path (M/L only), c = circle [cx, cy, r], s = round-capped
// stroke of width w. Rules: game-reskin house-rules D2 item 10 (每款要有自己題材的
// 購買按鈕圖示，64 px 看得懂).
//
// A round-bottomed flask, half full of the green the alchemist holds up in the
// main game (and the free games' HUD flask fills with): what the buy buys is the
// free game, and the flask is this game's feature. Bubbles in the liquid so it
// reads as a brew rather than a bulb at 64 px. Never a lightning bolt — the
// Turbo button wears one — and never Dragon Tide's gate.
export type BuyIconFill = 'ink' | 'tile' | 'accent';
export type BuyIconShape =
	| { d: string; fill: BuyIconFill }
	| { c: [number, number, number]; fill: BuyIconFill }
	| { s: string; w: number; fill: BuyIconFill };

const BULB = { cx: 0, cy: 14, outer: 32, inner: 25 };
/** the liquid's surface, y in the viewBox (the bulb holds a bit over half) */
const SURFACE = 4;

/** half-width of the liquid's surface across the bulb's inside */
const SURFACE_HALF = Math.sqrt(BULB.inner ** 2 - (SURFACE - BULB.cy) ** 2);

/** The part of the bulb's inside below the surface, as an M/L polygon. */
const liquid = (): string => {
	const { cx, cy, inner: r } = BULB;
	// angle measured from straight up (y points down): the surface meets the
	// circle at ±a0; the liquid is the arc from a0 round the bottom (π) to 2π − a0
	const a0 = Math.acos((cy - SURFACE) / r);
	const steps = 40;
	const pts: string[] = [];
	for (let i = 0; i <= steps; i++) {
		const a = a0 + ((2 * Math.PI - 2 * a0) * i) / steps;
		pts.push(`${(cx + Math.sin(a) * r).toFixed(2)} ${(cy - Math.cos(a) * r).toFixed(2)}`);
	}
	return `M${pts.join(' L')} Z`;
};

export const BUY_ICON: BuyIconShape[] = [
	// the lip at the mouth
	{ d: 'M-16 -45 L16 -45 L16 -36 L-16 -36 Z', fill: 'ink' },
	// neck and bulb, the glass's ink
	{ d: 'M-11 -37 L11 -37 L11 -6 L-11 -6 Z', fill: 'ink' },
	{ c: [BULB.cx, BULB.cy, BULB.outer], fill: 'ink' },
	// the glass, cut back to the tile
	{ d: 'M-4.5 -38 L4.5 -38 L4.5 -6 L-4.5 -6 Z', fill: 'tile' },
	{ c: [BULB.cx, BULB.cy, BULB.inner], fill: 'tile' },
	// the brew
	{ d: liquid(), fill: 'accent' },
	// its surface line, in ink so the liquid has an edge at 64 px
	{ s: `M${(-SURFACE_HALF).toFixed(2)} ${SURFACE} L${SURFACE_HALF.toFixed(2)} ${SURFACE}`, w: 3, fill: 'ink' },
	// bubbles
	{ c: [-8, 24, 4.2], fill: 'tile' },
	{ c: [8, 30, 3.2], fill: 'tile' },
	{ c: [3, 15, 2.6], fill: 'tile' },
];
