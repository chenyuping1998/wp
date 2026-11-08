/**
 * Which bed a win lands on (2026-11-06, round 2).
 *
 * leapWin.ts stretches every leap so it touches down a whole number of
 * sixteenths in at the BASE bed's 128 BPM. The feature bed is 154 BPM, whose
 * sixteenth is 97ms rather than 117, so there the same landings fell between
 * its drums. Rather than a second set of styles, a win is played a touch faster
 * or slower — whatever puts its landing on the nearest sixteenth of the bed
 * that is actually running. On the feature bed that is the lantern 938 -> 974ms
 * (4% slower), the letters 820 -> 779 (5% quicker), the seal 1055 -> 1071.
 * On the base bed it is 1 for every leap.
 *
 * Turbo is left alone: it skips the grid wait too (WinWays), so there is
 * nothing to line up with. SymbolMeshWin plays the win at this speed and
 * WinWays times the landing clink with the same number, so they never part.
 */
import { stateBetDerived } from 'state-shared';

import { beatBpm } from './beatClock';
import { LEAP_STYLES } from './meshWin/leapWin';
import { MESH_WINS } from './meshWin';

const NEVER = 99999;

/** when a symbol's win touches down, ms at speed 1 (NEVER for none) */
export const winLandMs = (symbol: string) =>
	LEAP_STYLES[symbol]?.beats.land ?? MESH_WINS[symbol]?.landMs ?? NEVER;

/** the extra speed factor that puts this win's landing on the bed's grid */
export const gridSpeed = (symbol: string, speed: number) => {
	if (stateBetDerived.timeScale() > 1) return 1;
	const land = winLandMs(symbol);
	if (land >= NEVER) return 1;
	const at = land / speed;
	const six = 60000 / beatBpm() / 4;
	const on = Math.max(1, Math.round(at / six)) * six;
	return at / on;
};

/** when the win lands on screen, in real ms after it starts */
export const winLandAt = (symbol: string, speed: number) => {
	const land = winLandMs(symbol);
	return land >= NEVER ? NEVER : land / (speed * gridSpeed(symbol, speed));
};
