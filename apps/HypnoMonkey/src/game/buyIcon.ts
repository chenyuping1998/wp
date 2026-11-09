// Buy-tile glyph for Hypno Monkey (2026-11-09), drawn by the bet bar
// (ui/MummyBar.svelte, bar v3). viewBox -50..50; 'ink' is the black stamp, 'tile' is
// cut back out in the tile's own colour. Shapes: d = filled path, c = circle
// [cx, cy, r], s = round-capped stroke of width w. Template and rules:
// wp/tools/ui-bar-v4 (README 「買入按鈕圖示」).
//
// The hypnotist's pocket watch: bow ring, crown, round case, a bezel, and a
// spiral cut into the dial — the swinging watch is the show, and the
// multiplier orbs on the board are watches. The bezel is what keeps the round
// black case from reading as a bomb or a bauble. Never a lightning bolt: the
// Turbo button wears one.
export type BuyIconShape =
	| { d: string; fill: 'ink' | 'tile' }
	| { c: [number, number, number]; fill: 'ink' | 'tile' }
	| { s: string; w: number; fill: 'ink' | 'tile' };

export const BUY_ICON: BuyIconShape[] = [
	// bow ring
	{ c: [0, -35, 8], fill: 'ink' },
	// its hole
	{ c: [0, -35, 3.8], fill: 'tile' },
	// crown
	{ d: 'M-6.5 -29 L6.5 -29 L6.5 -21 L-6.5 -21 Z', fill: 'ink' },
	// case
	{ c: [0, 9, 33], fill: 'ink' },
	// bezel, cut back in tile colour
	{ c: [0, 9, 27.5], fill: 'tile' },
	// dial
	{ c: [0, 9, 24], fill: 'ink' },
	// the hypno spiral cut into the dial (arms 8.9 apart, 4.7 of ink between)
	{ s: 'M0.0 11.2 L-0.5 11.5 L-1.2 11.6 L-1.9 11.5 L-2.6 11.3 L-3.3 10.8 L-3.9 10.1 L-4.4 9.2 L-4.6 8.2 L-4.6 7.1 L-4.4 6.0 L-3.8 4.8 L-3.0 3.8 L-1.9 3.0 L-0.5 2.4 L0.9 2.2 L2.5 2.2 L4.1 2.7 L5.6 3.5 L6.9 4.7 L8.0 6.2 L8.7 8.0 L9.0 10.0 L8.9 12.0 L8.3 14.1 L7.2 16.0 L5.7 17.6 L3.8 19.0 L1.6 19.9 L-0.9 20.2 L-3.4 20.1 L-5.9 19.4 L-8.2 18.1 L-10.2 16.2 L-11.9 13.9 L-13.0 11.3 L-13.5 8.4 L-13.3 5.4 L-12.5 2.4 L-11.0 -0.3 L-8.9 -2.8 L-6.2 -4.7 L-3.1 -6.0 L0.2 -6.7 L3.7 -6.5 L7.2 -5.6 L10.4 -4.0 L13.2 -1.6 L15.5 1.4', w: 4.2, fill: 'tile' },
];
