import { stateBet } from 'state-shared';
import { createPlayBookUtils } from 'utils-book';
import { createGetEmptyPaddedBoard } from 'utils-slots';

import { SYMBOL_SIZE, REEL_PADDING, SYMBOL_INFO_MAP, BOARD_DIMENSIONS } from './constants';
import { eventEmitter } from './eventEmitter';
import type { Bet, BookEventOfType } from './typesBookEvent';
import { bookEventHandlerMap } from './bookEventHandlerMap';
import { installErrorLogging } from './errorLog';
import type { RawSymbol, SymbolState } from './types';

// general utils
export const { getEmptyBoard } = createGetEmptyPaddedBoard({ reelsDimensions: BOARD_DIMENSIONS });

installErrorLogging();

// A handler that has not finished by now is not slow, it is stuck. The longest
// legitimate event is freeSpinTrigger, which spends 3s on the scatter hold plus
// three symbol animations, a transition and the intro board — comfortably under
// this. Logged as a warning rather than acted on: the sequence may still be
// alive, and cutting it off would break a round that was going to recover.
const STALL_WARN_MS = 15000;

/**
 * Same handlers, but a throw is named before it propagates.
 *
 * The round is one long await chain, so a single handler throwing takes the
 * whole thing down: playBookEvents rejects, playBet's last line never runs, the
 * spin button is never re-enabled, and the game sits there looking frozen with
 * nothing in the console but a bare stack from inside a promise. Which handler
 * and which event is the entire diagnosis, and it is free to record here.
 */
const tracedBookEventHandlerMap = Object.fromEntries(
	Object.entries(bookEventHandlerMap).map(([type, handler]) => [
		type,
		async (bookEvent: BookEvent, context: unknown) => {
			const stall = setTimeout(
				() =>
					console.error(
						`[EmberForge] book event "${type}" has not finished after ${STALL_WARN_MS}ms — the round is stuck here`,
						bookEvent,
					),
				STALL_WARN_MS,
			);
			try {
				return await (handler as (a: unknown, b: unknown) => Promise<unknown>)(bookEvent, context);
			} catch (error) {
				console.error(`[EmberForge] book event "${type}" failed`, { bookEvent, error });
				throw error;
			} finally {
				clearTimeout(stall);
			}
		},
	]),
) as typeof bookEventHandlerMap;

export const { playBookEvent, playBookEvents } = createPlayBookUtils({
	bookEventHandlerMap: tracedBookEventHandlerMap,
});

// NOTE: there is deliberately no idle win replay here.
//
// A lines game can redraw the round's win lines while the board sits idle,
// because the board the player is looking at is the board that won. A tumble
// game cannot: every winning symbol was destroyed and replaced by the fall that
// followed, so outlining those positions again draws a cluster around symbols
// that were never part of it. The player's record of what paid is the spin
// ledger beside the board, which survives until the next spin.
export const playBet = async (bet: Bet) => {
	eventEmitter.broadcast({ type: 'clusterWinsHide' });
	stateBet.winBookEventAmount = 0;
	try {
		await playBookEvents(bet.state);
	} catch (error) {
		// Hand the spin button back whatever happened. A presentation that throws
		// has already cost the player that round's animation; leaving the button
		// dead costs them the game, and every event after the throw is skipped
		// anyway, so there is nothing left to protect by staying stuck.
		console.error('[EmberForge] round aborted', error);
	}
	eventEmitter.broadcast({ type: 'stopButtonEnable' });
};

// resume bet
//
// updateGrid is reserved because the heat grid is cumulative across a whole
// feature — resuming mid-bonus without it would put a cold board back on screen
// and every subsequent cluster would pay visibly more than the grid explains.
// Only the last one is needed: each event carries the complete grid.
const BOOK_EVENT_TYPES_TO_RESERVE_FOR_SNAPSHOT = [
	'freeSpinTrigger',
	'updateFreeSpin',
	'setTotalWin',
	'updateGrid',
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
