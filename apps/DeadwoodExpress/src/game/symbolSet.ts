// Which symbol art set is installed in static/assets/deadwood/symbol_*.png.
//
// v1 is the set submitted twice (2026-09-22 and the second round), rejected as
// "Low quality assets". It is kept byte-for-byte in design/_backup_symbols_v1/,
// and `design/restore_symbols_v1.sh` puts the PNGs back AND flips this switch —
// the names below describe the art, so the two must always change together.
// v2 is the redo briefed in design/SYMBOL_REDO_BRIEF.md.
export const SYMBOL_SET: 'v1' | 'v2' = 'v2';

const LABELS = {
	v1: {
		H1: 'Pocket Watch',
		H2: 'Spectral Lantern',
		H3: 'Station Bell',
		H4: 'Signal Lamp',
		H5: "Conductor's Cap",
	},
	v2: {
		H1: 'Conductor',
		H2: 'Veiled Passenger',
		H3: 'Lantern',
		H4: 'Pocket Watch',
		H5: 'Signal Lamp',
	},
} as const;

export const PREMIUM_LABELS: Record<string, string> = LABELS[SYMBOL_SET];
