// Buy-tile glyph for this game (2026-11-08), drawn by the bar (ui/SplitBar.svelte)
// and the rules page (ui/BarIcon.svelte). viewBox -50..50; 'ink' is the black
// stamp, 'tile' is cut back out in the tile's yellow. Shapes: d = filled path,
// c = circle [cx, cy, r], s = round-capped stroke of width w.
// coffin: the six-sided toe-pincher, a bevelled lid, a bat on the lid. Never a lightning bolt: the Turbo button wears one.
export type BuyIconShape =
	| { d: string; fill: 'ink' | 'tile' }
	| { c: [number, number, number]; fill: 'ink' | 'tile' }
	| { s: string; w: number; fill: 'ink' | 'tile' };

export const BUY_ICON: BuyIconShape[] = [
	{d:  'M-15 -45 L15 -45 L28 -18 L17 45 L-17 45 L-28 -18 Z', fill:  'ink'},
	{d:  'M-11 -38.5 L11 -38.5 L21.2 -17.4 L11.9 38.5 L-11.9 38.5 L-21.2 -17.4 Z', fill:  'tile'},
	{d:  'M-7.6 -33 L7.6 -33 L16 -16.8 L8.4 33 L-8.4 33 L-16 -16.8 Z', fill:  'ink'},
	{d:  'M 0.00 -15.88 C -1.72 -18.75 -3.68 -18.75 -4.60 -17.03 C -7.47 -21.05 -11.50 -20.48 -13.22 -15.30 C -10.35 -16.11 -8.28 -14.27 -8.05 -11.28 C -5.75 -13.35 -2.88 -13.00 0.00 -8.40 C 2.88 -13.00 5.75 -13.35 8.05 -11.28 C 8.28 -14.27 10.35 -16.11 13.22 -15.30 C 11.50 -20.48 7.47 -21.05 4.60 -17.03 C 3.68 -18.75 1.72 -18.75 0.00 -15.88 Z', fill:  'tile'},
];
