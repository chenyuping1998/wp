import { stateBet } from 'state-shared';
import { createPlayBookUtils } from 'utils-book';
import { createGetEmptyPaddedBoard } from 'utils-slots';

import { waitForTimeout } from 'utils-shared/wait';

import { SYMBOL_SIZE, REEL_PADDING, SYMBOL_INFO_MAP, boardDimensions } from './constants';
import { eventEmitter } from './eventEmitter';
import { stateGame } from './stateGame.svelte';
import type { Bet, BookEventOfType } from './typesBookEvent';
import {
	bookEventHandlerMap,
	animateSymbols,
	clearHighlight,
	getLastWinPositions,
	clearLastWinPositions,
} from './bookEventHandlerMap';
import type { RawSymbol, SymbolState } from './types';

// general utils
// Built per call rather than once at module scope: the board is 3 rows in the
// basegame and 5 in the feature, so a board shape captured at load time would be
// the wrong size for half the round.
export const getEmptyBoard = () =>
	createGetEmptyPaddedBoard({ reelsDimensions: boardDimensions(stateGame.rows) }).getEmptyBoard();

export const { playBookEvent, playBookEvents } = createPlayBookUtils({ bookEventHandlerMap });

// ── idle win replay ─────────────────────────────────────────────────────────
// Once the round is over the board sits still until the player spins again, and
// the win highlight has long since cleared. Anyone who glanced away during the
// volley has no way to see what paid. While idle the round's winning symbols are
// lit again on a loop, with a real gap between passes so it reads as a repeat
// rather than a stutter. The round's sounds are fired by the winInfo handler, so
// replaying does not re-trigger them.
const REPLAY_GAP_MS = 1600;

// Incremented to cancel: a loop only continues while it still holds the current
// token, so starting a spin invalidates any pass already in flight.
let replayToken = 0;

const stopWinReplay = () => {
	replayToken += 1;
};

const runWinReplay = async () => {
	const token = replayToken;
	// eslint-disable-next-line no-constant-condition
	while (true) {
		const positions = getLastWinPositions();
		if (positions.length === 0) return;
		await waitForTimeout(REPLAY_GAP_MS);
		if (token !== replayToken) return;
		await animateSymbols({ positions });
		if (token !== replayToken) return;
	}
};

export const playBet = async (bet: Bet) => {
	stopWinReplay();
	// The idle replay is cancelled by a token, which stops the LOOP but cannot
	// unwind the animateSymbols call already awaiting inside it - and that call
	// never settles once the spin replaces the symbols it was waiting on, so its
	// own cleanup never runs. Clearing here is what actually guarantees a round
	// starts with an undimmed board.
	clearHighlight();
	clearLastWinPositions();
	stateBet.winBookEventAmount = 0;
	await playBookEvents(bet.state);
	eventEmitter.broadcast({ type: 'stopButtonEnable' });
	// detached: the spin button must become live now, not after the first pass
	void runWinReplay();
};

// resume bet
// boardExpand and leverageUpdate are both cumulative feature state - a round
// resumed mid-feature has to be put back on the taller board with the meter it
// had reached, or the first replayed reveal would spin a 7-symbol board into a
// 3-row window.
const BOOK_EVENT_TYPES_TO_RESERVE_FOR_SNAPSHOT = [
	'freeSpinTrigger',
	'updateFreeSpin',
	'setTotalWin',
	'boardExpand',
	'leverageUpdate',
];

export const convertTorResumableBet = (betToResume: Bet) => {
	const resumingIndex = Number(betToResume.event);
	const bookEventsBeforeResume = betToResume.state.filter(
		(_, eventIndex) => eventIndex < resumingIndex,
	);
	const bookEventsAfterResume = betToResume.state.filter(
		(_, eventIndex) => eventIndex >= resumingIndex,
	);

	const bookEventToCreateSnapshot: BookEventOfType<'createBonusSnapshot'> = {
		index: 0,
		type: 'createBonusSnapshot',
		bookEvents: bookEventsBeforeResume.filter((bookEvent) =>
			BOOK_EVENT_TYPES_TO_RESERVE_FOR_SNAPSHOT.includes(bookEvent.type),
		),
	};

	const stateToResume = [bookEventToCreateSnapshot, ...bookEventsAfterResume];

	return { ...betToResume, state: stateToResume };
};

// other utils
export const getSymbolX = (reelIndex: number) => SYMBOL_SIZE * (reelIndex + REEL_PADDING);
// Where a symbol actually sits in board space, for overlays that have to line up
// with the reels (the scatter alarm, the leverage chips).
//
// A reel at rest has reelY = -symbolHeight, so its symbol at index i is drawn at
// (i - 0.5) * SYMBOL_SIZE, not (i + 0.5). Getting this wrong put the scatter
// alarm one full cell below every scatter, lighting up the symbol underneath it
// instead - which reads as "non-scatter cells are lighting up".
export const getSymbolY = (symbolIndexOfBoard: number) => (symbolIndexOfBoard - 0.5) * SYMBOL_SIZE;

export const getSymbolInfo = ({
	rawSymbol,
	state,
}: {
	rawSymbol: RawSymbol;
	state: SymbolState;
}) => {
	return SYMBOL_INFO_MAP[rawSymbol.name][state];
};
