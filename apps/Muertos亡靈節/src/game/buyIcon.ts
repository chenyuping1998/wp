// Buy-tile glyph for this game (2026-11-08), drawn by the bar (ui/SplitBar.svelte)
// and the rules page (ui/BarIcon.svelte). viewBox -50..50; 'ink' is the black
// stamp, 'tile' is cut back out in the tile's yellow. Shapes: d = filled path,
// c = circle [cx, cy, r], s = round-capped stroke of width w.
// sugar skull: round cranium, flower eyes, heart nose, stitched teeth, forehead flower. Never a lightning bolt: the Turbo button wears one.
export type BuyIconShape =
	| { d: string; fill: 'ink' | 'tile' }
	| { c: [number, number, number]; fill: 'ink' | 'tile' }
	| { s: string; w: number; fill: 'ink' | 'tile' };

export const BUY_ICON: BuyIconShape[] = [
	{c:  [0, -8, 31], fill:  'ink'},
	{d:  'M-19 8 L19 8 L17 33 Q0 41 -17 33 Z', fill:  'ink'},
	{c:  [-12.5, -5, 10], fill:  'tile'},
	{c:  [12.5, -5, 10], fill:  'tile'},
	{c:  [-12.5, -5, 4.2], fill:  'ink'},
	{c:  [12.5, -5, 4.2], fill:  'ink'},
	{d:  'M0 15 C-2 11 -7 11 -6 7.5 C-5.3 5.2 -2 5.2 0 8 C2 5.2 5.3 5.2 6 7.5 C7 11 2 11 0 15 Z', fill:  'tile'},
	{d:  'M-13 21 L13 21 L12 27 L-12 27 Z', fill:  'tile'},
	{s:  'M-6.5 20 L-6.5 28 M0 20 L0 28 M6.5 20 L6.5 28', w:  2.4, fill:  'ink'},
	{c:  [0, -27, 5], fill:  'tile'},
	{c:  [0, -27, 2], fill:  'ink'},
	{c:  [-6.5, -27, 2.6], fill:  'tile'},
	{c:  [6.5, -27, 2.6], fill:  'tile'},
];
