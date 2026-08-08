import _ from 'lodash';

import { recordBookEvent, checkIsMultipleRevealEvents, type BookEventHandlerMap } from 'utils-book';
import { stateBet, stateUi } from 'state-shared';
import { waitForTimeout } from 'utils-shared/wait';

import { eventEmitter } from './eventEmitter';
import { playBookEvent } from './utils';
import { winLevelMap, type WinLevel, type WinLevelData } from './winLevelMap';
import { stateGame, stateGameDerived } from './stateGame.svelte';
import type { BookEvent, BookEventOfType, BookEventContext } from './typesBookEvent';
import type { Position } from './types';
import { BASE_ROWS, paddedReelLength } from './constants';
import config from './config';

// The math emits anticipation[reel] = (scatters landed before that reel) - 1, so
// a value of 1 means the tease starts on the *second* scatter. Free spins need
// three, so teasing that early fires on most spins and stops meaning anything.
const ANTICIPATION_MIN_SCATTERS = 3;

const gateAnticipation = (anticipation: number[]) =>
	anticipation.map((value) => (value >= ANTICIPATION_MIN_SCATTERS - 1 ? value : 0));

// A plain base-game board, sampled from the base padding strips. Used to put the
// reels back after the feature: the feature board is two rows taller, and
// leaving those symbols mounted while stateGame.rows says 3 would draw seven
// symbols into a three-row frame.
const baseIdleBoard = () =>
	(config.paddingReels.basegame as { name: string }[][]).map((strip) => {
		const start = Math.floor(Math.random() * strip.length);
		return Array.from({ length: paddedReelLength(BASE_ROWS) }, (_, i) => strip[(start + i) % strip.length]);
	});

// The winning positions of the round's last winInfo, kept so the board can keep
// showing them while it sits idle waiting for the next spin - otherwise the
// highlight vanishes a moment after it is drawn and a player who looked away has
// no way to see what actually paid. playBet owns the replay loop.
let lastWinPositions: Position[] = [];
export const getLastWinPositions = () => lastWinPositions;
export const clearLastWinPositions = () => {
	lastWinPositions = [];
};

const winLevelSoundsPlay = ({ winLevelData }: { winLevelData: WinLevelData }) => {
	if (winLevelData?.alias === 'max') eventEmitter.broadcastAsync({ type: 'uiHide' });
	if (winLevelData?.sound?.sfx) {
		eventEmitter.broadcast({ type: 'soundOnce', name: winLevelData.sound.sfx });
	}
	if (winLevelData?.type === 'big') {
		eventEmitter.broadcast({ type: 'soundBigWinBlast' });
		eventEmitter.broadcast({ type: 'soundLoop', name: 'sfx_bigwin_coinloop' });
	}
};

const winLevelSoundsStop = () => {
	eventEmitter.broadcast({ type: 'soundStop', name: 'sfx_bigwin_coinloop' });
	if (stateGame.gameType === 'freegame') {
		eventEmitter.broadcast({ type: 'soundMusic', name: 'bgm_freespin' });
	} else {
		eventEmitter.broadcast({ type: 'soundMusic', name: 'bgm_main' });
	}
	eventEmitter.broadcastAsync({ type: 'uiShow' });
};

// Ways wins have no line to draw: the symbols that took part *are* the win, and
// one position can belong to several of them (an H1 win and an L2 win share the
// wilds that carried both). Deduplicate before animating - a position animated
// twice would be waited on twice and only ever resolve once.
export const animateSymbols = async ({ positions }: { positions: Position[] }) => {
	// Only animate symbols in visible rows (1..rows) - padding rows have no
	// oncomplete callback and would freeze the game forever.
	const visiblePositions = _.uniqBy(
		positions.filter((p) => p.row >= 1 && p.row <= stateGame.rows),
		(p) => `${p.reel},${p.row}`,
	);
	if (visiblePositions.length === 0) return;
	eventEmitter.broadcast({ type: 'boardShow' });
	await eventEmitter.broadcastAsync({
		type: 'boardWithAnimateSymbols',
		symbolPositions: visiblePositions,
	});
};

export const bookEventHandlerMap: BookEventHandlerMap<BookEvent, BookEventContext> = {
	reveal: async (bookEvent: BookEventOfType<'reveal'>, { bookEvents }: BookEventContext) => {
		const isBonusGame = checkIsMultipleRevealEvents({ bookEvents });
		if (isBonusGame) {
			eventEmitter.broadcast({ type: 'stopButtonEnable' });
			recordBookEvent({ bookEvent });
		}

		stateGame.gameType = bookEvent.gameType;

		// The board the math sent is authoritative about its own height. Normally
		// boardExpand has already set this, but a resumed round can drop the player
		// straight into a feature reveal without replaying that event.
		const revealedRows = bookEvent.board[0].length - 2;
		if (revealedRows !== stateGame.rows) stateGame.rows = revealedRows;

		await stateGameDerived.enhancedBoard.spin({
			revealEvent: { ...bookEvent, anticipation: gateAnticipation(bookEvent.anticipation) },
			paddingBoard: config.paddingReels[bookEvent.gameType],
		});
		eventEmitter.broadcast({ type: 'soundScatterCounterClear' });
	},

	// Margin Call: the feature board grows two rows on every reel. Sent once,
	// after freeSpinTrigger and before the first feature reveal, so the reels are
	// already the taller size when the first feature spin sweeps in.
	boardExpand: async (bookEvent: BookEventOfType<'boardExpand'>) => {
		const rows = bookEvent.numRows[0];
		if (rows === stateGame.rows) return;
		eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_superfreespin' });
		stateGame.rows = rows;
		await eventEmitter.broadcastAsync({ type: 'boardExpandPlay', rows });
	},

	// Margin Call: LEVERAGE symbols landed and raised the running meter. Sent
	// after the reveal and before the winInfo the new value applies to, so the
	// meter is already showing the number the win was paid at.
	leverageUpdate: async (bookEvent: BookEventOfType<'leverageUpdate'>) => {
		stateGame.leverageHits = bookEvent.added;
		eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_multiplier_landing' });
		await eventEmitter.broadcastAsync({
			type: 'leverageMeterCollect',
			hits: bookEvent.added,
			leverage: bookEvent.leverage,
		});
		stateGame.leverage = bookEvent.leverage;
	},

	winInfo: async (bookEvent: BookEventOfType<'winInfo'>) => {
		eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_winlevel_small' });

		const positions = bookEvent.wins.flatMap((win) => win.positions);
		await animateSymbols({ positions });

		// Remembered for the idle replay, but only for base-game wins. The feature
		// tears the board down to base idle when it ends, so replaying a feature
		// spin's highlight afterwards would light up symbols that are no longer
		// there - and rows that no longer exist.
		lastWinPositions = stateGame.gameType === 'basegame' ? positions : [];
	},

	setTotalWin: async (bookEvent: BookEventOfType<'setTotalWin'>) => {
		stateBet.winBookEventAmount = bookEvent.amount;
	},

	freeSpinTrigger: async (bookEvent: BookEventOfType<'freeSpinTrigger'>) => {
		lastWinPositions = [];

		eventEmitter.broadcast({ type: 'soundStop', name: 'bgm_main' });
		eventEmitter.broadcast({ type: 'soundStop', name: 'sfx_anticipation' });
		eventEmitter.broadcast({ type: 'soundFreeGameBell' });
		await waitForTimeout(3000);
		eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_scatter_win_v2' });
		await animateSymbols({ positions: bookEvent.positions });
		await animateSymbols({ positions: bookEvent.positions });
		eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_superfreespin' });
		await eventEmitter.broadcastAsync({ type: 'uiHide' });
		await eventEmitter.broadcastAsync({ type: 'transition' });
		eventEmitter.broadcast({ type: 'freeSpinIntroShow' });
		eventEmitter.broadcast({ type: 'soundOnce', name: 'jng_intro_fs' });
		eventEmitter.broadcast({ type: 'soundMusic', name: 'bgm_freespin' });
		await eventEmitter.broadcastAsync({
			type: 'freeSpinIntroUpdate',
			totalFreeSpins: bookEvent.totalFs,
		});
		stateGame.gameType = 'freegame';
		// The meter is per-feature: it starts at 1x and only ever climbs from here.
		stateGame.leverage = 1;
		stateGame.leverageHits = [];
		eventEmitter.broadcast({ type: 'leverageMeterShow' });
		eventEmitter.broadcast({ type: 'freeSpinIntroHide' });
		eventEmitter.broadcast({ type: 'boardFrameGlowShow' });
		eventEmitter.broadcast({ type: 'freeSpinCounterShow' });
		stateUi.freeSpinCounterShow = true;
		eventEmitter.broadcast({
			type: 'freeSpinCounterUpdate',
			current: undefined,
			total: bookEvent.totalFs,
		});
		stateUi.freeSpinCounterTotal = bookEvent.totalFs;
		await eventEmitter.broadcastAsync({ type: 'uiShow' });
		await eventEmitter.broadcastAsync({ type: 'drawerButtonShow' });
		eventEmitter.broadcast({ type: 'drawerFold' });
	},

	updateFreeSpin: async (bookEvent: BookEventOfType<'updateFreeSpin'>) => {
		eventEmitter.broadcast({ type: 'freeSpinCounterShow' });
		stateUi.freeSpinCounterShow = true;
		eventEmitter.broadcast({
			type: 'freeSpinCounterUpdate',
			current: bookEvent.amount + 1,
			total: bookEvent.total,
		});
		stateUi.freeSpinCounterCurrent = bookEvent.amount + 1;
		stateUi.freeSpinCounterTotal = bookEvent.total;
	},

	freeSpinRetrigger: async (bookEvent: BookEventOfType<'freeSpinRetrigger'>) => {
		eventEmitter.broadcast({ type: 'soundStop', name: 'bgm_freespin' });
		eventEmitter.broadcast({ type: 'soundStop', name: 'sfx_anticipation' });
		eventEmitter.broadcast({ type: 'soundFreeGameBell' });
		await waitForTimeout(2000);
		eventEmitter.broadcast({ type: 'soundMusic', name: 'bgm_freespin' });
		eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_scatter_win_v2' });
		await animateSymbols({ positions: bookEvent.positions });
		await animateSymbols({ positions: bookEvent.positions });
		const extraSpins = Math.max(0, bookEvent.totalFs - stateUi.freeSpinCounterTotal);
		if (extraSpins > 0) {
			eventEmitter.broadcast({ type: 'freeSpinIntroShow' });
			eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_superfreespin' });
			await eventEmitter.broadcastAsync({
				type: 'freeSpinIntroUpdate',
				totalFreeSpins: bookEvent.totalFs,
				extraSpins,
			});
			eventEmitter.broadcast({ type: 'freeSpinIntroHide' });
		}
		eventEmitter.broadcast({ type: 'freeSpinCounterShow' });
		stateUi.freeSpinCounterShow = true;
		eventEmitter.broadcast({
			type: 'freeSpinCounterUpdate',
			current: stateUi.freeSpinCounterCurrent,
			total: bookEvent.totalFs,
		});
		stateUi.freeSpinCounterTotal = bookEvent.totalFs;
	},

	freeSpinEnd: async (bookEvent: BookEventOfType<'freeSpinEnd'>) => {
		const winLevelData = winLevelMap[bookEvent.winLevel as WinLevel];

		await eventEmitter.broadcastAsync({ type: 'uiHide' });
		stateGame.gameType = 'basegame';
		eventEmitter.broadcast({ type: 'boardFrameGlowHide' });
		eventEmitter.broadcast({ type: 'freeSpinOutroShow' });
		eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_youwon_panel' });
		winLevelSoundsPlay({ winLevelData });
		await eventEmitter.broadcastAsync({
			type: 'freeSpinOutroCountUp',
			amount: bookEvent.amount,
			winLevelData,
		});
		winLevelSoundsStop();
		eventEmitter.broadcast({ type: 'freeSpinOutroHide' });
		eventEmitter.broadcast({ type: 'freeSpinCounterHide' });
		stateUi.freeSpinCounterShow = false;

		// Shrink back to the basegame board. Both halves are required: the row
		// count drives the frame and the layout, and the reels are still holding
		// the feature board's seven symbols - which would be drawn into a
		// three-row frame if they were left there. The transition covers it.
		stateGame.rows = BASE_ROWS;
		stateGame.leverage = 1;
		stateGame.leverageHits = [];
		eventEmitter.broadcast({ type: 'leverageMeterHide' });
		stateGameDerived.enhancedBoard.settle(baseIdleBoard());

		await eventEmitter.broadcastAsync({ type: 'transition' });
		await eventEmitter.broadcastAsync({ type: 'uiShow' });
		await eventEmitter.broadcastAsync({ type: 'drawerUnfold' });
		eventEmitter.broadcast({ type: 'drawerButtonHide' });
	},

	setWin: async (bookEvent: BookEventOfType<'setWin'>) => {
		const winLevelData = winLevelMap[bookEvent.winLevel as WinLevel];

		eventEmitter.broadcast({ type: 'winShow' });
		winLevelSoundsPlay({ winLevelData });
		await eventEmitter.broadcastAsync({
			type: 'winUpdate',
			amount: bookEvent.amount,
			winLevelData,
		});
		winLevelSoundsStop();
		eventEmitter.broadcast({ type: 'winHide' });
	},

	finalWin: async () => {
		// finalWin is the last event of every book in every mode, so it is the one
		// place that can guarantee the round did not leave presentation state open.
		// freeSpinEnd already does all of this earlier in a feature round, and every
		// line here is idempotent.
		if (stateUi.freeSpinCounterShow) {
			eventEmitter.broadcast({ type: 'freeSpinCounterHide' });
			stateUi.freeSpinCounterShow = false;
		}
		if (stateGame.gameType !== 'basegame') {
			stateGame.gameType = 'basegame';
		}
		if (stateGame.rows !== BASE_ROWS) {
			stateGame.rows = BASE_ROWS;
			stateGameDerived.enhancedBoard.settle(baseIdleBoard());
		}
	},

	wincap: async (bookEvent: BookEventOfType<'wincap'>) => {
		stateBet.winBookEventAmount = bookEvent.amount;
		eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_winlevel_end' });
	},

	createBonusSnapshot: async (bookEvent: BookEventOfType<'createBonusSnapshot'>) => {
		const { bookEvents } = bookEvent;

		function findLastBookEvent<T>(type: T) {
			return _.findLast(bookEvents, (bookEvent) => bookEvent.type === type) as
				| BookEventOfType<T>
				| undefined;
		}

		const lastFreeSpinTriggerEvent = findLastBookEvent('freeSpinTrigger' as const);
		const lastUpdateFreeSpinEvent = findLastBookEvent('updateFreeSpin' as const);
		const lastSetTotalWinEvent = findLastBookEvent('setTotalWin' as const);

		if (lastFreeSpinTriggerEvent) await playBookEvent(lastFreeSpinTriggerEvent, { bookEvents });
		if (lastUpdateFreeSpinEvent) playBookEvent(lastUpdateFreeSpinEvent, { bookEvents });
		if (lastSetTotalWinEvent) playBookEvent(lastSetTotalWinEvent, { bookEvents });

		// Restore the board height and the leverage meter. Both are cumulative
		// across the feature, so the resumed round has to pick them up where it
		// left off rather than at their starting values: replaying only the last
		// leverageUpdate is enough because the event carries the running total,
		// not the increment.
		const lastBoardExpandEvent = findLastBookEvent('boardExpand' as const);
		if (lastBoardExpandEvent) stateGame.rows = lastBoardExpandEvent.numRows[0];

		const lastLeverageEvent = findLastBookEvent('leverageUpdate' as const);
		if (lastLeverageEvent) {
			stateGame.leverage = lastLeverageEvent.leverage;
			eventEmitter.broadcast({ type: 'leverageMeterShow' });
			eventEmitter.broadcast({
				type: 'leverageMeterRestore',
				leverage: lastLeverageEvent.leverage,
			});
		}
	},
};
