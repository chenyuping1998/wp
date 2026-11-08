// Buy-tile glyph for this game (2026-11-08), drawn by the bar (ui/SplitBar.svelte)
// and the rules page (ui/BarIcon.svelte). viewBox -50..50; 'ink' is the black
// stamp, 'tile' is cut back out in the tile's yellow. Shapes: d = filled path,
// c = circle [cx, cy, r], s = round-capped stroke of width w.
// octopus captain: peaked cap with a badge, round head, eyes, four curling tentacles. Never a lightning bolt: the Turbo button wears one.
export type BuyIconShape =
	| { d: string; fill: 'ink' | 'tile' }
	| { c: [number, number, number]; fill: 'ink' | 'tile' }
	| { s: string; w: number; fill: 'ink' | 'tile' };

export const BUY_ICON: BuyIconShape[] = [
	{s:  'M-16 12 C-25 23 -32 33 -22 41 M-6 14 C-9 27 -15 35 -7 43 M6 14 C9 27 15 35 7 43 M16 12 C25 23 32 33 22 41', w:  8, fill:  'ink'},
	{d:  'M-25 -4 C-25 -20 -14 -24 0 -24 C14 -24 25 -20 25 -4 C25 12 14 19 0 19 C-14 19 -25 12 -25 -4 Z', fill:  'ink'},
	{d:  'M-20 -25 L-27 -37 Q0 -48 27 -37 L20 -25 Z', fill:  'ink'},
	{d:  'M-21 -25 L21 -25 L21 -22 L-21 -22 Z', fill:  'tile'},
	{d:  'M-24 -22 Q0 -13 24 -22 L24 -18 Q0 -8 -24 -18 Z', fill:  'ink'},
	{c:  [0, -33, 4.2], fill:  'tile'},
	{c:  [-9.5, -3, 6], fill:  'tile'},
	{c:  [9.5, -3, 6], fill:  'tile'},
	{c:  [-8.5, -2, 2.6], fill:  'ink'},
	{c:  [10.5, -2, 2.6], fill:  'ink'},
];
