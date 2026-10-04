/**
 * WHO IS ON THE REEL THAT IS FREEZING (the acts are game/meshWin/freezes.ts).
 *
 * Every settled board cell whose symbol has a freeze act registers here under
 * its reel and row (SymbolSprite), and unregisters the moment it spins or
 * lands. ExpandingWilds' freeze takeover calls `play` on a cell as the frost
 * front reaches it — and `roar` on the cell the Wild landed in — so the board
 * symbols take part in the takeover without ExpandingWilds having to know how
 * a symbol is drawn.
 */
export type FreezeKind = 'freeze' | 'roar';
type Cell = { play: (kind: FreezeKind) => boolean };

const cells = new Map<string, Cell>();
const key = (reel: number, row: number) => `${reel},${row}`;

export const freezeCells = {
	/** a settled cell that can act; returns its unregister */
	add(reel: number, row: number, cell: Cell) {
		const k = key(reel, row);
		cells.set(k, cell);
		return () => {
			if (cells.get(k) === cell) cells.delete(k);
		};
	},
	/** play the act on that cell, if anything is standing there; false if not */
	play(reel: number, row: number, kind: FreezeKind) {
		return cells.get(key(reel, row))?.play(kind) ?? false;
	},
};
