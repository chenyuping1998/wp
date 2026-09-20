// Display names for the maths' symbol codes.
//
// Shared by the pay table and the win-line readout on purpose: certification
// asked whether the payout per symbol matches the pay table, and the only way a
// player (or a reviewer) can answer that is if both surfaces call the symbol the
// same thing. Two copies of this map would eventually disagree.
export const SYMBOL_LABEL: Record<string, string> = {
	H1: 'Disco Ball',
	H2: 'Champagne',
	H3: 'Cocktail',
	H4: 'Gift',
	L1: 'A',
	L2: 'K',
	L3: 'Q',
	L4: 'J',
	W: 'Wild',
	S: 'Scatter',
};

export const symbolLabel = (code: string) => SYMBOL_LABEL[code] ?? code;
