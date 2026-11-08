// Buy-tile glyph for this game (2026-11-08), drawn by the bar (ui/MummyBar.svelte)
// and the rules page (ui/BarIcon.svelte). viewBox -50..50; 'ink' is the black
// stamp, 'tile' is cut back out in the tile's yellow. Shapes: d = filled path,
// c = circle [cx, cy, r], s = round-capped stroke of width w.
// bandaged mummy-cat head: two ears, wraps across the face, one big eye peeking through. Never a lightning bolt: the Turbo button wears one.
export type BuyIconShape =
	| { d: string; fill: 'ink' | 'tile' }
	| { c: [number, number, number]; fill: 'ink' | 'tile' }
	| { s: string; w: number; fill: 'ink' | 'tile' };

export const BUY_ICON: BuyIconShape[] = [
	{d:  'M-30 -14 L-27 -44 L-8 -27 L8 -27 L27 -44 L30 -14 C34 4 30 30 0 36 C-30 30 -34 4 -30 -14 Z', fill:  'ink'},
	{s:  'M-36 -19 L36 -29 M-36 -2 L-4 -6 M24 -10 L36 -12 M-36 15 L36 9 M-26 30 L26 24', w:  3.4, fill:  'tile'},
	{c:  [11, -3, 10], fill:  'tile'},
	{c:  [12.5, -2, 5], fill:  'ink'},
	{d:  'M-16 -1 L-4 -3 L-4 1 L-16 3 Z', fill:  'ink'},
];
