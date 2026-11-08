// Buy-tile glyph for this game (2026-11-08), drawn by the bar (ui/SplitBar.svelte)
// and the rules page (ui/BarIcon.svelte). viewBox -50..50; 'ink' is the black
// stamp, 'tile' is cut back out in the tile's yellow. Shapes: d = filled path,
// c = circle [cx, cy, r], s = round-capped stroke of width w.
// the monster's head: flat-top hair, zig-zag fringe, eyes, stitched grin, neck bolts. Never a lightning bolt: the Turbo button wears one.
export type BuyIconShape =
	| { d: string; fill: 'ink' | 'tile' }
	| { c: [number, number, number]; fill: 'ink' | 'tile' }
	| { s: string; w: number; fill: 'ink' | 'tile' };

export const BUY_ICON: BuyIconShape[] = [
	{d:  'M-35 17 L-26 17 L-26 27 L-35 27 Z', fill:  'ink'},
	{d:  'M35 17 L26 17 L26 27 L35 27 Z', fill:  'ink'},
	{c:  [-36, 22, 7.5], fill:  'ink'},
	{c:  [36, 22, 7.5], fill:  'ink'},
	{d:  'M-27 -30 Q-27 -38 -19 -38 L19 -38 Q27 -38 27 -30 L27 27 Q27 38 15 38 L-15 38 Q-27 38 -27 27 Z', fill:  'ink'},
	{d:  'M-27 -17 L-20 -11 L-13 -17 L-6.5 -11 L0 -17 L6.5 -11 L13 -17 L20 -11 L27 -17 L27 -12 L20 -6 L13 -12 L6.5 -6 L0 -12 L-6.5 -6 L-13 -12 L-20 -6 L-27 -12 Z', fill:  'tile'},
	{c:  [-11, 6, 5.5], fill:  'tile'},
	{c:  [11, 6, 5.5], fill:  'tile'},
	{d:  'M-13 21 L13 21 L13 25.5 L-13 25.5 Z', fill:  'tile'},
	{s:  'M-7 18 L-7 28.5 M0 18 L0 28.5 M7 18 L7 28.5', w:  2.6, fill:  'ink'},
];
