import _ from 'lodash';
import { stateBet } from 'state-shared';
import { createPlayBookUtils } from 'utils-book';
import { createGetEmptyPaddedBoard } from 'utils-slots';

import { waitForTimeout } from 'utils-shared/wait';

import { SYMBOL_SIZE, REEL_PADDING, SYMBOL_INFO_MAP, BOARD_DIMENSIONS } from './constants';
import { eventEmitter } from './eventEmitter';
import type { Bet, BookEventOfType } from './typesBookEvent';
import { bookEventHandlerMap, getLastWinLines, clearLastWinLines } from './bookEventHandlerMap';
import type { RawSymbol, SymbolState } from './types';

// general utils
export const { getEmptyBoard } = createGetEmptyPaddedBoard({ reelsDimensions: BOARD_DIMENSIONS });
export const { playBookEvent, playBookEvents } = createPlayBookUtils({ bookEventHandlerMap });

// ── idle win-line replay ────────────────────────────────────────────────────
// Once the round is over the board sits still until the player spins again, and
// the win lines have long since been cleared. Anyone who glanced away during the
// volley has no way to see what paid. While idle the round's lines are drawn
// again on a loop, with a real gap between passes so it reads as a repeat rather
// than a stutter.
//
// This drives the existing winLinesShow/Hide events rather than a private replay
// path, so everything that already reacts to them — the symbol win animations,
// the locked-reel highlight in ExpandingWilds — comes along for free. The round's
// sounds are fired by the winInfo handler, not by winLinesShow, so replaying does
// not re-trigger them.
const REPLAY_GAP_MS = 1600;

// Incremented to cancel: a loop only continues while it still holds the current
// token, so starting a spin invalidates any pass already in flight.
let replayToken = 0;

// Exported for the actor: a spin STARTS (onNewGameStart — the fake spin while
// the bet request is in flight) well before playBet runs with its result, and
// a replay pass that came due in that gap drew last round's win lines over
// reels already spinning. Called at both points; it is idempotent.
export const stopWinLineReplay = () => {
	replayToken += 1;
	eventEmitter.broadcast({ type: 'winLinesHide' });
};

const runWinLineReplay = async () => {
	const wins = getLastWinLines();
	if (wins.length === 0) return;
	const token = replayToken;
	// eslint-disable-next-line no-constant-condition
	while (true) {
		await waitForTimeout(REPLAY_GAP_MS);
		if (token !== replayToken) return;
		await eventEmitter.broadcastAsync({ type: 'winLinesShow', wins, fast: true });
		if (token !== replayToken) return;
		eventEmitter.broadcast({ type: 'winLinesHide' });
	}
};

export const playBet = async (bet: Bet) => {
	stopWinLineReplay();
	clearLastWinLines();
	stateBet.winBookEventAmount = 0;
	await playBookEvents(bet.state);
	eventEmitter.broadcast({ type: 'stopButtonEnable' });
	// detached: the spin button must become live now, not after the first pass
	void runWinLineReplay();
};

// resume bet
// NOTE: no 'updateGlobalMult' — GoBananas' math never emits it and the handler
// was removed, so replaying one on resume would hit an undefined handler
const BOOK_EVENT_TYPES_TO_RESERVE_FOR_SNAPSHOT = [
	'freeSpinTrigger',
	'updateFreeSpin',
	'setTotalWin',
	'newExpandingWilds',
	'updateExpandingWilds',
	'newStickySymbols',
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
export const getSymbolY = (symbolIndexOfBoard: number) => (symbolIndexOfBoard + 0.5) * SYMBOL_SIZE;

export const getSymbolInfo = ({
	rawSymbol,
	state,
}: {
	rawSymbol: RawSymbol;
	state: SymbolState;
}) => {
	return SYMBOL_INFO_MAP[rawSymbol.name][state];
};
