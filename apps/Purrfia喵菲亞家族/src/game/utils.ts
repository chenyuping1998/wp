import { stateBet } from 'state-shared';
import { createPlayBookUtils } from 'utils-book';
import { createGetEmptyPaddedBoard } from 'utils-slots';

import { waitForTimeout } from 'utils-shared/wait';

import {
	SYMBOL_SIZE,
	REEL_PADDING,
	SYMBOL_INFO_MAP,
	BOARD_DIMENSIONS,
	ROUND_END_HOLD_MS,
	ROUND_END_HOLD_MS_FAST,
} from './constants';
import { eventEmitter } from './eventEmitter';
import type { Bet, BookEvent, BookEventOfType } from './typesBookEvent';
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


const tracedBookEventHandlerMap = Object.fromEntries(
	Object.entries(bookEventHandlerMap).map(([type, handler]) => [
		type,
		async (bookEvent: BookEvent, context: unknown) => {
			const stall = setTimeout(
				() =>
					console.error(
						`[Purrfia] book event "${type}" has not finished after ${STALL_WARN_MS}ms — the round is stuck here`,
						bookEvent,
					),
				STALL_WARN_MS,
			);
			try {
				return await (handler as (a: unknown, b: unknown) => Promise<unknown>)(bookEvent, context);
			} catch (error) {
				console.error(`[Purrfia] book event "${type}" failed`, { bookEvent, error });
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
// followed, so outlining those positions again would mark symbols that were
// never part of the win.
export const playBet = async (bet: Bet) => {
	eventEmitter.broadcast({ type: 'scatterWinsHide' });
	stateBet.winBookEventAmount = 0;
	try {
		await playBookEvents(bet.state);
	} catch (error) {
		// Hand the spin button back whatever happened. A presentation that throws
		// has already cost the player that round's animation; leaving the button
		// dead costs them the game, and every event after the throw is skipped
		// anyway, so there is nothing left to protect by staying stuck.
		console.error('[Purrfia] round aborted', error);
	}
	// Let the finished board sit before the spin button comes back. Enabling it on
	// the same tick the last event resolves means an autoplay or a held spin can
	// start tearing the board down while the player is still reading it.
	await waitForTimeout(stateBet.isTurbo ? ROUND_END_HOLD_MS_FAST : ROUND_END_HOLD_MS);
	eventEmitter.broadcast({ type: 'stopButtonEnable' });
};

// resume bet
//
// a whole feature — resuming mid-bonus without it would put the plate back at ×0
// and every later spin would pay visibly more than the plate explains. Only the
const BOOK_EVENT_TYPES_TO_RESERVE_FOR_SNAPSHOT = ['freeSpinTrigger','freeSpinRetrigger','updateFreeSpin','updateTumbleWin','setTotalWin','winInfo','reveal','boxOpen','cellMults','tumbleBoard','freeSpinEnd','finalWin'];

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
