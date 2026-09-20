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

// ── round tracing ───────────────────────────────────────────────────────────
// Opt-in per-event timing, off unless something sets `window.__HM_TRACE__`.
//
// It exists because a single base spin was measured at over 110 seconds in the
// local play shell and two rounds of reading the code produced two confident
// explanations that both turned out to be wrong — a Pixi v8 gradient-fill
// theory, and the anticipated-reel padding arithmetic (which works out to about
// ten seconds, not a hundred). The lesson is the one already written at the top
// of the handoff: measure the thing, do not reason about the thing.
//
// Each handler is wrapped rather than timing the whole round, because the whole
// round being slow is exactly what is already known. What is needed is which
// handler owns the seconds.
//
//     window.__HM_TRACE__ = []   // then spin; each entry is [type, ms]
//     console.table(window.__HM_TRACE__)
//
// Cheap enough to leave in: when the flag is unset this is one `if` per book
// event, and a round has tens of them.
// Entry AND exit, as a pair. The first version of this only wrote in `finally`,
// which meant a handler that never returns left NO row at all — and that was
// exactly the case being investigated. An empty trace could then mean either
// "the probe is broken" or "the handler never finished", and the data could not
// tell those apart; it took a separate signal (the stub's round counter) to
// distinguish them. A row on entry makes the stuck handler name itself: an
// `enter` with no matching `exit` is the culprit, and the probe proves it is
// alive at the same time.
type TraceRow = { i: number; type: string; phase: 'enter' | 'exit'; t: number; ms?: number };
let traceSeq = 0;
const traced = Object.fromEntries(
	Object.entries(bookEventHandlerMap).map(([type, handler]) => [
		type,
		async (...args: unknown[]) => {
			const trace = (globalThis as { __HM_TRACE__?: TraceRow[] }).__HM_TRACE__;
			if (!trace) return (handler as (...a: unknown[]) => unknown)(...args);
			const i = traceSeq++;
			const t0 = performance.now();
			trace.push({ i, type, phase: 'enter', t: Math.round(t0) });
			try {
				return await (handler as (...a: unknown[]) => Promise<unknown>)(...args);
			} finally {
				const t1 = performance.now();
				trace.push({ i, type, phase: 'exit', t: Math.round(t1), ms: Math.round(t1 - t0) });
			}
		},
	]),
) as typeof bookEventHandlerMap;

export const { playBookEvent, playBookEvents } = createPlayBookUtils({
	bookEventHandlerMap: traced,
});

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

const stopWinLineReplay = () => {
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
// NOTE: no 'updateGlobalMult' — Moooo's math never emits it and the handler
// was removed, so replaying one on resume would hit an undefined handler
const BOOK_EVENT_TYPES_TO_RESERVE_FOR_SNAPSHOT = [
	'freeSpinTrigger',
	'updateFreeSpin',
	'setTotalWin',
	'milkMeterInit',
	'milkMeterUpdate',
	'frameDoubling',
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
