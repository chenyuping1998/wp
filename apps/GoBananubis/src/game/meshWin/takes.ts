/**
 * WHICH TAKE OF ITS WIN A SYMBOL PLAYS.
 *
 * Every symbol had one win act, and a scarab paying three spins running did
 * exactly the same thing three times — the repetition is what makes a board
 * read as clips on a loop. So a win now has two takes (SymbolMeshWin):
 *
 *   0  the act as drawn (the high pays leap, the Wild and the Scatter hop)
 *   1  the high pays TURN ROUND in the air as they leap; the Wild and the
 *      Scatter shake their whole tile instead of only hopping
 *
 * The take is picked per volley (WinLines calls nextVolley on every show,
 * the idle replay included) and per symbol, so the three scarabs on one line
 * always play the same take — a line that pays reads as one gesture — but the
 * next time that line pays it may be the other one.
 */
let volley = 0;

export const nextVolley = () => {
	volley++;
};

const hash = (s: string) => {
	let h = 2166136261;
	for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
	return h >>> 0;
};

/** 0 or 1, fixed for this symbol for the rest of this volley */
export const takeOf = (symbol: string) => hash(`${symbol}:${volley}`) % 2;
