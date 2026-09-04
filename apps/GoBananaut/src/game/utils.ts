import _ from 'lodash';
import { stateBet } from 'state-shared';
import { createPlayBookUtils } from 'utils-book';
import { createGetEmptyPaddedBoard } from 'utils-slots';

import { waitForTimeout } from 'utils-shared/wait';

import {
	SYMBOL_SIZE,
	REEL_PADDING,
	SYMBOL_INFO_MAP,
	BOARD_DIMENSIONS,
	unmarkSymbolName,
} from './constants';
import { eventEmitter } from './eventEmitter';
import type { Bet, BookEventOfType } from './typesBookEvent';
import { bookEventHandlerMap, getLastWinLines, clearLastWinLines } from './bookEventHandlerMap';
import type { RawSymbol, SymbolState } from './types';

/**
 * The board as it stood AFTER the last spin's detonation.
 *
 * The reveal event carries the board the reels stopped on, and the blast that
 * follows rewrites it — that order exists so the client has something to explode
 * FROM (see gamestate._spin_board). It means the last reveal alone is NOT the
 * board the round was scored on, and anything restoring a round from its book
 * has to replay the blast on top of it.
 *
 * Both restore paths were doing exactly that wrong: a resumed round whose last
 * spin blew up a reel came back showing the symbols that were there BEFORE the
 * explosion, including the dynamite itself, on a board the player had already
 * been paid for.
 *
 * Only the blast AFTER the last reveal is applied. An earlier one belongs to an
 * earlier spin and its reels have since been spun away.
 */
export const boardAfterLastGrowth = (bookEvents: Bet['state']) => {
	const lastRevealIndex = _.findLastIndex(bookEvents, (e) => e?.type === 'reveal');
	if (lastRevealIndex < 0) return undefined;
	const reveal = bookEvents[lastRevealIndex] as BookEventOfType<'reveal'>;
	const board = reveal.board.map((reel) => [...reel]);
	const after = bookEvents.slice(lastRevealIndex);

	// The reveal carries the board the reels stopped on — markers still on it, at
	// the height it was drawn at. Two events turn that into the board the round
	// was actually scored on, and a resume has to replay both in order.

	// 1. the markers fly off, leaving the ordinary symbol underneath
	const markers = _.findLast(after, (e) => e?.type === 'growMarkers') as
		| BookEventOfType<'growMarkers'>
		| undefined;
	if (markers) {
		for (const m of markers.markers) {
			const column = board[m.reel];
			if (!column?.[m.row]) continue;
			column[m.row] = { ...column[m.row], name: m.symbol };
		}
	}

	// 2. the reels stretch, and the new cells slide in
	//
	// Spliced rather than appended: a padded reel is [topPad, ...rows, bottomPad]
	// and a new cell belongs INSIDE that, above the bottom padding. newCells is
	// emitted in ascending row order per reel, so each splice lands after the one
	// before it and the padding stays last.
	const grow = _.findLast(after, (e) => e?.type === 'growReels') as
		| BookEventOfType<'growReels'>
		| undefined;
	if (grow) {
		for (const cell of grow.newCells) {
			const column = board[cell.reel];
			if (!column) continue;
			column.splice(cell.row, 0, { name: cell.symbol });
		}
	}

	return board;
};

// The heights that go with the board above. A resumed round has to restore the
// SHAPE as well as the symbols — the reels are laid out per reel from this, and
// a six-symbol column drawn as a four-row reel would spill out of its window.
export const rowsAfterLastGrowth = (bookEvents: Bet['state']) => {
	const grow = _.findLast(bookEvents, (e) => e?.type === 'growReels') as
		| BookEventOfType<'growReels'>
		| undefined;
	return grow?.rows;
};

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
// the stretch decoration in ReelGrow — comes along for free. The round's
// sounds are fired by the winInfo handler, not by winLinesShow, so replaying does
// not re-trigger them.
const REPLAY_GAP_MS = 1600;

// Incremented to cancel: a loop only continues while it still holds the current
// token, so starting a spin invalidates any pass already in flight.
let replayToken = 0;

// Exported because the round does not start at playBet. The actor plays a
// pre-spin FIRST, and in non-turbo that runs long enough for a replay pass to
// fire on top of reels that are already moving — the previous round's win
// presentation drawn over the next round's spin. boardWinAnimCancel hides what
// is on screen but cannot stop the loop, which simply waits its gap and shows
// the lines again. The loop has to be cancelled where the round begins.
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

// How often a triggering round lights his visor before the scatters land. See
// the tease's own note in Mascot.svelte for why this is not 1.
const GOGGLE_TEASE_CHANCE = 0.5;

export const playBet = async (bet: Bet) => {
	stopWinLineReplay();
	// Read the book BEFORE playing it. This is the one moment the client knows
	// the outcome and the reels have not moved yet, which is what makes a tease
	// possible at all; a frame later the reveal is already running.
	//
	// Base bets only. A bought round already told the player where it is going,
	// so a tell there is telling them something they paid to know.
	const isBaseBet = stateBet.activeBetModeKey.toUpperCase() === 'BASE';
	const willTrigger = bet.state.some((bookEvent) => bookEvent?.type === 'freeSpinTrigger');
	if (isBaseBet && willTrigger && Math.random() < GOGGLE_TEASE_CHANCE) {
		eventEmitter.broadcast({ type: 'mascotGoggleTease' });
	}
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
	// growReels carries the FULL state on every emission, not a delta, so
	// reserving it is enough — the snapshot handler reads the last one and needs
	// nothing accumulated. What it recovers is the board's SHAPE and the meter:
	// the symbols are already in the reveal, but how tall each reel had grown,
	// and which reels were doubling, are nowhere on the board.
	//
	// growMarkers is NOT reserved. It only ever un-marks cells the reveal already
	// carries, and boardAfterLastGrowth applies it from the raw event list.
	'growReels',
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
	// Unmarked first: a marked cell ("H2G") is drawn with H2's art and a marker
	// laid over it, so there is no H2G entry to look up and there should not be.
	// Without this the lookup returns undefined and the symbol renders as nothing
	// — a hole in the board wherever a marker landed.
	return SYMBOL_INFO_MAP[unmarkSymbolName(rawSymbol.name)][state];
};
