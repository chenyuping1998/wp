import _ from 'lodash';

import { recordBookEvent, checkIsMultipleRevealEvents, type BookEventHandlerMap } from 'utils-book';
import { stateBet, stateUi } from 'state-shared';
import { waitForTimeout } from 'utils-shared/wait';

import { eventEmitter } from './eventEmitter';
import { playBookEvent } from './utils';
import { winLevelMap, type WinLevel, type WinLevelData } from './winLevelMap';
import { stateGame, stateGameDerived } from './stateGame.svelte';
import type { BookEvent, BookEventOfType, BookEventContext } from './typesBookEvent';
import type { Position, SymbolName } from './types';
import { BOARD_DIMENSIONS, GRID_ROW_OFFSET } from './constants';
import config from './config';

// The math emits anticipation[reel] = (scatters landed before that reel) - 1, so
// a value of 1 means the tease starts on the *second* scatter. Free spins need
// four, so teasing that early fires on most spins and stops meaning anything.
// Require three scatters already on the board (value >= 2) before any reel
// teases. Filtering here — rather than in utils-slots — keeps the slow reel stop
// and the on-screen tease gated by the same condition, and leaves the shared
// package untouched.
const ANTICIPATION_MIN_SCATTERS = 3;

const gateAnticipation = (anticipation: number[]) =>
	anticipation.map((value) => (value >= ANTICIPATION_MIN_SCATTERS - 1 ? value : 0));

// Only these levels get the full plaque. setWin fires once per SPIN in this game,
// not once per round — a bonus book averages six of them — so treating every one
// as a celebration would put a banner over most free spins. Small wins just move
// the ticker, which setTotalWin is already doing.
const isCelebratedWinLevel = (winLevelData: WinLevelData | undefined) =>
	winLevelData?.type === 'big';

export type ClusterWinDatum = {
	symbol: SymbolName;
	positions: Position[];
	win: number;
	clusterMult: number;
	overlay: Position;
};

const winLevelSoundsPlay = ({ winLevelData }: { winLevelData: WinLevelData }) => {
	if (winLevelData?.alias === 'max') eventEmitter.broadcastAsync({ type: 'uiHide' });
	if (winLevelData?.sound?.sfx) {
		eventEmitter.broadcast({ type: 'soundOnce', name: winLevelData.sound.sfx });
	}
	// Deliberately NOT switching to winLevelData.sound.bgm: those names have no
	// audio file in the forge set, so soundMusic routes them to the template
	// player and plays nothing — but on the way it pauses the running bgm and
	// clears currentBgm, leaving the celebration silent under the coin loop and
	// restarting the bed from the top afterwards. Keep the running bgm playing.
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

const animateSymbols = async ({ positions }: { positions: Position[] }) => {
	// Only animate symbols in visible rows (1..numRows) — padding rows (0 and
	// numRows+1) have no oncomplete callback and would freeze the game forever.
	const visiblePositions = positions.filter((p) => p.row >= 1 && p.row <= BOARD_DIMENSIONS.y);
	if (visiblePositions.length === 0) return;
	eventEmitter.broadcast({ type: 'boardShow' });
	await eventEmitter.broadcastAsync({
		type: 'boardWithAnimateSymbols',
		symbolPositions: visiblePositions,
	});
};

/**
 * The math sends the heat grid unpadded (rows 0..6) while every position it
 * sends elsewhere is padded (rows 1..7). Shift once, here, so nothing downstream
 * has to remember which convention it is holding.
 */
const toBoardSpaceGrid = (gridMultipliers: number[][]) =>
	gridMultipliers.map((column) => {
		const shifted: number[] = new Array(column.length + GRID_ROW_OFFSET + 1).fill(0);
		column.forEach((value, row) => {
			shifted[row + GRID_ROW_OFFSET] = value;
		});
		return shifted;
	});

const coldGrid = () =>
	toBoardSpaceGrid(_.range(BOARD_DIMENSIONS.x).map(() => new Array(BOARD_DIMENSIONS.y).fill(0)));

export const bookEventHandlerMap: BookEventHandlerMap<BookEvent, BookEventContext> = {
	reveal: async (bookEvent: BookEventOfType<'reveal'>, { bookEvents }: BookEventContext) => {
		const isBonusGame = checkIsMultipleRevealEvents({ bookEvents });
		if (isBonusGame) {
			eventEmitter.broadcast({ type: 'stopButtonEnable' });
			recordBookEvent({ bookEvent });
		}

		stateGame.gameType = bookEvent.gameType;
		// A reveal starts a fresh tumble sequence; the previous chain's readout must
		// not carry over into it.
		stateGame.tumbleWin = 0;
		stateGame.tumbleChain = 0;
		eventEmitter.broadcast({ type: 'spinLedgerReset' });

		await stateGameDerived.enhancedBoard.spin({
			revealEvent: { ...bookEvent, anticipation: gateAnticipation(bookEvent.anticipation) },
			paddingBoard: config.paddingReels[bookEvent.gameType],
		});
		eventEmitter.broadcast({ type: 'soundScatterCounterClear' });
	},

	/**
	 * One evaluation pass. Every cluster that pays is outlined and its amount shown
	 * at the cluster's centre, then the symbols themselves animate. Up to 14
	 * clusters can land at once, so ClusterWins staggers them into a volley and
	 * owns the symbol animations — firing them per cluster and deduping positions
	 * shared between overlapping outlines, which would otherwise hang waiting for a
	 * second completion callback that never comes.
	 */
	winInfo: async (bookEvent: BookEventOfType<'winInfo'>) => {
		stateGame.tumbleChain += 1;

		const clusters: ClusterWinDatum[] = bookEvent.wins.map((win) => ({
			symbol: win.symbol,
			positions: win.positions,
			win: win.win,
			clusterMult: win.meta.clusterMult,
			overlay: win.meta.overlay,
		}));

		// Chain position drives the pitch, so a long tumble climbs.
		eventEmitter.broadcast({ type: 'soundTumbleHit', chain: stateGame.tumbleChain });

		// Turbo wins over everything; otherwise the free game gets its own pace,
		// which is SLOWER than base play rather than faster.
		await eventEmitter.broadcastAsync({
			type: 'clusterWinsShow',
			wins: clusters,
			pace:
				stateGame.gameType === 'freegame'
					? stateBet.isTurbo
						? 'turboFreegame'
						: 'freegame'
					: stateBet.isTurbo
						? 'turbo'
						: 'normal',
		});

		// Recorded in the spin ledger. This is what replaces the idle win replay a
		// lines game would use: by the time the chain ends the winning symbols have
		// been destroyed, so the only honest record of what paid is a written one.
		eventEmitter.broadcast({
			type: 'spinLedgerAdd',
			entries: bookEvent.wins.map((win) => ({
				symbol: win.symbol,
				count: win.clusterSize,
				win: win.win,
			})),
		});
	},

	updateTumbleWin: async (bookEvent: BookEventOfType<'updateTumbleWin'>) => {
		stateGame.tumbleWin = bookEvent.amount;
	},

	/**
	 * Clear the winning cells and refill from above. The outlines are dropped
	 * first: they belong to symbols that are about to stop existing.
	 */
	tumbleBoard: async (bookEvent: BookEventOfType<'tumbleBoard'>) => {
		eventEmitter.broadcast({ type: 'clusterWinsHide' });
		eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_wild_explode' });
		await eventEmitter.broadcastAsync({
			type: 'tumbleRun',
			explodingSymbols: bookEvent.explodingSymbols,
			newSymbols: bookEvent.newSymbols,
		});
	},

	/**
	 * Free game only: the position multipliers after the latest win. Arrives once
	 * at every reveal (all zeroes on the first spin of a feature) and again after
	 * each winning evaluation.
	 */
	updateGrid: async (bookEvent: BookEventOfType<'updateGrid'>) => {
		const next = toBoardSpaceGrid(bookEvent.gridMultipliers);
		const previous = stateGame.gridMultipliers;
		stateGame.gridMultipliers = next;
		await eventEmitter.broadcastAsync({
			type: 'gridMultipliersUpdate',
			grid: next,
			previous,
		});
	},

	setTotalWin: async (bookEvent: BookEventOfType<'setTotalWin'>) => {
		stateBet.winBookEventAmount = bookEvent.amount;
	},

	freeSpinTrigger: async (bookEvent: BookEventOfType<'freeSpinTrigger'>) => {
		eventEmitter.broadcast({ type: 'soundStop', name: 'bgm_main' });
		eventEmitter.broadcast({ type: 'soundStop', name: 'sfx_anticipation' });
		eventEmitter.broadcast({ type: 'soundFreeGameBell' });
		eventEmitter.broadcast({ type: 'scatterBurst', positions: bookEvent.positions });
		await waitForTimeout(3000);
		eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_scatter_win_v2' });
		eventEmitter.broadcast({ type: 'scatterBurst', positions: bookEvent.positions });
		await animateSymbols({ positions: bookEvent.positions });
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
		// Cold plates from the very first free spin. The first updateGrid arrives
		// with the reveal that follows, but the grid has to be on screen before then
		// or the feature opens on a board with no visible mechanic.
		stateGame.gridMultipliers = coldGrid();
		eventEmitter.broadcast({ type: 'gridMultipliersShow' });
		eventEmitter.broadcast({ type: 'freeSpinIntroHide' });
		eventEmitter.broadcast({ type: 'boardFrameGlowShow' });
		eventEmitter.broadcast({ type: 'freeSpinCounterShow' });
		stateUi.freeSpinCounterShow = true;
		// `current: 1`, not undefined. The first updateFreeSpin is still a moment
		// away, and sending undefined left the counter showing whatever it held
		// from the LAST feature — a second bonus in one session opened on the
		// previous one's final spin number until the first update arrived. One is
		// also simply the true reading: the feature is about to play spin one.
		eventEmitter.broadcast({
			type: 'freeSpinCounterUpdate',
			current: 1,
			total: bookEvent.totalFs,
		});
		stateUi.freeSpinCounterCurrent = 1;
		stateUi.freeSpinCounterTotal = bookEvent.totalFs;
		await eventEmitter.broadcastAsync({ type: 'uiShow' });
		await eventEmitter.broadcastAsync({ type: 'drawerButtonShow' });
		eventEmitter.broadcast({ type: 'drawerFold' });
	},

	updateFreeSpin: async (bookEvent: BookEventOfType<'updateFreeSpin'>) => {
		eventEmitter.broadcast({ type: 'freeSpinCounterShow' });
		stateUi.freeSpinCounterShow = true;
		// `amount` is ALREADY the 1-based index of the spin about to be played, not a
		// count of spins used. The math sends updateFreeSpin(amount=N) immediately
		// before the Nth free-game reveal — verified against the books: the first is
		// always amount=1, and the last is amount=total.
		//
		// The +1 that used to be here therefore opened the feature on "2 / 10" and
		// ran to "11 / 10" — which nobody saw only because the component clamps with
		// Math.min(current, total), so the counter skipped 1 and showed the last spin
		// twice instead of visibly overflowing.
		eventEmitter.broadcast({
			type: 'freeSpinCounterUpdate',
			current: bookEvent.amount,
			total: bookEvent.total,
		});
		stateUi.freeSpinCounterCurrent = bookEvent.amount;
		stateUi.freeSpinCounterTotal = bookEvent.total;
	},

	freeSpinRetrigger: async (bookEvent: BookEventOfType<'freeSpinRetrigger'>) => {
		// Same bell moment as the initial trigger. Three scatters is enough to
		// retrigger here (four to trigger), and books show it happening in roughly
		// 9% of features.
		eventEmitter.broadcast({ type: 'soundStop', name: 'bgm_freespin' });
		eventEmitter.broadcast({ type: 'soundStop', name: 'sfx_anticipation' });
		eventEmitter.broadcast({ type: 'soundFreeGameBell' });
		await waitForTimeout(3000);
		eventEmitter.broadcast({ type: 'soundMusic', name: 'bgm_freespin' });
		eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_scatter_win_v2' });
		await animateSymbols({ positions: bookEvent.positions });
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
		// NOTE: gridMultipliersClear deliberately does NOT fire here — the heat
		// plates stay lit under the outro plaque, which is the player's last look at
		// what the feature built. actor.onNewGameStart sweeps them on the next spin.
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
		await eventEmitter.broadcastAsync({ type: 'transition' });
		await eventEmitter.broadcastAsync({ type: 'uiShow' });
		await eventEmitter.broadcastAsync({ type: 'drawerUnfold' });
		eventEmitter.broadcast({ type: 'drawerButtonHide' });
	},

	/**
	 * Closes one spin's tumble sequence. Fires per spin, not per round, so only
	 * big-and-up gets the plaque; anything smaller has already been read out by the
	 * tumble counter and the win ticker.
	 */
	setWin: async (bookEvent: BookEventOfType<'setWin'>) => {
		const winLevelData = winLevelMap[bookEvent.winLevel as WinLevel];
		if (!isCelebratedWinLevel(winLevelData)) return;

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
		// Safety net. freeSpinEnd already closes the counter in a feature round, and
		// this is idempotent; a base round that never entered the feature has nothing
		// to close. Kept because finalWin is the last event of every book in every
		// mode, so it is the only place that can guarantee no panel is left up.
		if (stateUi.freeSpinCounterShow) {
			eventEmitter.broadcast({ type: 'freeSpinCounterHide' });
			stateUi.freeSpinCounterShow = false;
		}
		if (stateGame.gameType !== 'basegame') {
			stateGame.gameType = 'basegame';
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
		const lastUpdateGridEvent = findLastBookEvent('updateGrid' as const);

		if (lastFreeSpinTriggerEvent) await playBookEvent(lastFreeSpinTriggerEvent, { bookEvents });
		if (lastUpdateFreeSpinEvent) playBookEvent(lastUpdateFreeSpinEvent, { bookEvents });
		if (lastSetTotalWinEvent) playBookEvent(lastSetTotalWinEvent, { bookEvents });

		// Restore the heat grid without animating every step that built it: each
		// updateGrid carries the whole grid, so the last one is the whole story.
		if (lastUpdateGridEvent) {
			const grid = toBoardSpaceGrid(lastUpdateGridEvent.gridMultipliers);
			stateGame.gridMultipliers = grid;
			eventEmitter.broadcast({ type: 'gridMultipliersRestore', grid });
		}
	},
};
