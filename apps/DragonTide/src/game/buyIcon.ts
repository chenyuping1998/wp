// Buy-tile glyph for Dragon Tide (2026-11-11), drawn by the bet bar
// (ui/MummyBar.svelte, bar v3). viewBox -50..50; 'ink' is the dark stamp, 'tile' is
// cut back out in the tile's own colour. Shapes: d = filled path, c = circle
// [cx, cy, r], s = round-capped stroke of width w. Rules: game-reskin house-rules D2
// (每款要有自己題材的購買按鈕圖示，64 px 看得懂).
//
// The Dragon Gate: what the buy buys is the free game, and the gate is the symbol that opens
// it — upswept eaves over two door leaves with ring handles. Never a lightning bolt: the
// Turbo button wears one.
export type BuyIconShape =
	| { d: string; fill: 'ink' | 'tile' }
	| { c: [number, number, number]; fill: 'ink' | 'tile' }
	| { s: string; w: number; fill: 'ink' | 'tile' };

export const BUY_ICON: BuyIconShape[] = [
	// roof finial
	{ c: [0, -39, 5], fill: 'ink' },
	// upper roof with upswept eave tips
	{ d: 'M-20 -36 L20 -36 L27 -24 Q36 -22 44 -30 L41 -14 L-41 -14 L-44 -30 Q-36 -22 -27 -24 Z', fill: 'ink' },
	// lintel
	{ d: 'M-33 -10 L33 -10 L33 -3 L-33 -3 Z', fill: 'ink' },
	// gate body
	{ d: 'M-29 -3 L29 -3 L29 38 L-29 38 Z', fill: 'ink' },
	// the two door leaves, cut back in tile colour
	{ d: 'M-21 5 L-2.5 5 L-2.5 38 L-21 38 Z', fill: 'tile' },
	{ d: 'M2.5 5 L21 5 L21 38 L2.5 38 Z', fill: 'tile' },
	// ring handles
	{ c: [-8.5, 22, 4.2], fill: 'ink' },
	{ c: [8.5, 22, 4.2], fill: 'ink' },
	{ c: [-8.5, 22, 1.7], fill: 'tile' },
	{ c: [8.5, 22, 1.7], fill: 'tile' },
	// threshold
	{ d: 'M-37 38 L37 38 L37 45 L-37 45 Z', fill: 'ink' },
];
