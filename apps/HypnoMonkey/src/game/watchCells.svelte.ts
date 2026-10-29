/**
 * Cells a pocket watch occupies (Stone 2026-10-29): a watch IS a cell of the
 * board, not something laid over a symbol, so the symbol in that cell is not
 * drawn while the watch holds it — lifting or breaking a watch must never
 * uncover a symbol. Keys are `${reel}:${index}` into that reel's padded
 * reelState.symbols array (1..rows are the visible cells).
 *
 * TumbleLayer covers the carrier symbol as the watch rides the refill and moves
 * the key to the landing slot; MedusaThrow covers the cell a wasted watch hits.
 * The cells stay covered through the next spin's fall-out (the watches fall
 * out with the board) and are released once that spin has landed.
 */
export const watchCells = $state({ keys: [] as string[] });

export const coverCell = (reel: number, index: number) => {
	const key = `${reel}:${index}`;
	if (!watchCells.keys.includes(key)) watchCells.keys = [...watchCells.keys, key];
};

export const uncoverCell = (reel: number, index: number) => {
	watchCells.keys = watchCells.keys.filter((key) => key !== `${reel}:${index}`);
};

export const releaseCells = () => {
	if (watchCells.keys.length) watchCells.keys = [];
};

export const isCovered = (reel: number, index: number) => watchCells.keys.includes(`${reel}:${index}`);
