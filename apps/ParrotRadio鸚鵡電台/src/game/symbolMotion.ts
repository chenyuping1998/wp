export const clamp01=(n:number)=>Math.max(0,Math.min(1,n));
export const windowPulse=(n:number)=>Math.sin(Math.PI*clamp01(n));
export const gravityProgress = (time: number) => { const t = clamp01(time); return t * t * (0.82 + 0.18 * t); };
export const fallDuration = (rows: number, budgetMs: number) => rows <= 0 ? 0 : budgetMs * (0.72 + 0.28 * Math.sqrt(Math.min(6, rows) / 6));
const travels = new WeakMap<object, { from: number; to: number }>();
export const recordSymbolTravel = (carrier: object, from: number, to: number) => travels.set(carrier, { from, to });
export const symbolTravelBlur = (carrier: object, y: number) => {
	const move = travels.get(carrier);
	if (!move || move.to <= move.from) return 0;
	const progress = clamp01((y - move.from) / (move.to - move.from));
	return Math.min(0.55, (move.to - move.from) / 588 * 0.55) * windowPulse(progress) ** 0.6;
};

export type CascadeMove<T> = { carrier: number; from: number; to: number; rawSymbol: T; incoming: boolean };
/** Actual refill contract shared by the game and the motion review. Padding is
 * retained; the old top padding becomes the last incoming visible symbol. */
export const planCascadeColumn = <T>(column: T[], removed: number[], incoming: T[], visibleRows = 5) => {
	if (column.length !== visibleRows + 2) throw new Error('Unexpected padded column length');
	const rows = new Set(removed), vacant = [...rows].sort((a, b) => a - b);
	if (vacant.some((row) => row < 1 || row > visibleRows)) throw new Error('Cannot remove padding');
	if (!vacant.length) return { column: [...column], moves: [] as CascadeMove<T>[] };
	if (incoming.length !== vacant.length) throw new Error('Refill count does not match removed cells');
	const survivors = Array.from({ length: visibleRows }, (_, i) => i + 1).filter((row) => !rows.has(row));
	const falling = [...incoming.slice(1), column[0]];
	const moves: CascadeMove<T>[] = [
		...survivors.map((from, i) => ({ carrier: from, from, to: 1 + falling.length + i, rawSymbol: column[from], incoming: false })),
		...falling.map((rawSymbol, i) => ({ carrier: vacant[i], from: 1 - falling.length + i, to: 1 + i, rawSymbol, incoming: true })),
	];
	return { column: [incoming[0], ...falling, ...survivors.map((row) => column[row]), column[visibleRows + 1]], moves };
};

