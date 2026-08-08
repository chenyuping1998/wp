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
import { BOARD_DIMENSIONS } from './constants';
import config from './config';

// The math emits anticipation[reel] = (scatters landed before that reel) - 1.
// Free spins need three scatters here, so the only reel worth teasing is one
// where exactly TWO are already down — value === 1. That is the single point in
// the round where the next symbol decides the outcome.
//
// EXACTLY 1, not >= 1, and the difference is expensive. A value of 2 or more
// means three scatters are already on the board: the feature is won, there is
// nothing left in suspense, and teasing is just delay. An anticipated reel costs
// real time — `createReelForCascading` sets its padding to
// reelPaddingMultiplierAnticipated (8) against 1.2 for a normal reel, and the
// resulting fallInDelayMultiplier is (7*8/7 - 1) = 7 against 0.2, so it waits
// reelFallInDelay * 7 = 770ms before it even starts falling, then falls slower.
//
// With `>= 1`, every bonus buy opened on `[0,0,0,1,2,3]` — three teased reels,
// roughly 2.3 seconds of dead board, on every single bought round, after the
// outcome had already been paid for. Retriggered books reached four.
const gateAnticipation = (anticipation: number[]) =>
	anticipation.map((value) => (value === 1 ? value : 0));

// Only these levels get the full plaque. setWin fires once per SPIN in this game,
// not once per round — a bonus book averages four of them — so treating every one
// as a celebration would put a banner over most free spins. Small wins just move
// the ticker, which setTotalWin is already doing.
const isCelebratedWinLevel = (winLevelData: WinLevelData | undefined) =>
	winLevelData?.type === 'big';

/**
 * One symbol reaching a paying count.
 *
 * `globalMult` is the pressure gauge reading the win was paid at, and it is
 * already inside `win` — it is carried so the readout can explain the amount,
 * not so anything downstream can multiply by it again. `meta.clusterMult` is
 * deliberately absent: it is always 1 in this game (see typesBookEvent.ts).
 */
export type ScatterWinDatum = {
	symbol: SymbolName;
	positions: Position[];
	win: number;
	globalMult: number;
	overlay: Position;
};

const winLevelSoundsPlay = ({ winLevelData }: { winLevelData: WinLevelData }) => {
	if (winLevelData?.alias === 'max') eventEmitter.broadcastAsync({ type: 'uiHide' });
	if (winLevelData?.sound?.sfx) {
		eventEmitter.broadcast({ type: 'soundOnce', name: winLevelData.sound.sfx });
	}
	// Deliberately NOT switching to winLevelData.sound.bgm: those names have no
	// audio file in the yard set, so soundMusic routes them to the template
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

/** Pace tier shared by the win marks and anything else that has four speeds. */
const currentPace = () =>
	stateGame.gameType === 'freegame'
		? stateBet.isTurbo
			? ('turboFreegame' as const)
			: ('freegame' as const)
		: stateBet.isTurbo
			? ('turbo' as const)
			: ('normal' as const);

export const bookEventHandlerMap: BookEventHandlerMap<BookEvent, BookEventContext> = {
	reveal: async (bookEvent: BookEventOfType<'reveal'>, { bookEvents }: BookEventContext) => {
		const isBonusGame = checkIsMultipleRevealEvents({ bookEvents });
		if (isBonusGame) {
			eventEmitter.broadcast({ type: 'stopButtonEnable' });
			recordBookEvent({ bookEvent });
		}

		stateGame.gameType = bookEvent.gameType;
		// A reveal starts a fresh tumble sequence; the previous chain's readout must
		// not carry over into it. The pressure gauge is deliberately NOT touched —
		// it survives every reveal inside a feature, which is the whole mechanic.
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
	 * One evaluation pass. Every symbol that reached a paying count is marked and
	 * its amount shown at the centre of the group.
	 *
	 * At most three symbols pay at once and 96% of the time it is exactly one, so
	 * unlike the cluster game this was ported from there is no volley to budget and
	 * no shared-position dedupe to do — with no wild on the strips, a cell belongs
	 * to exactly one symbol's group.
	 */
	winInfo: async (bookEvent: BookEventOfType<'winInfo'>) => {
		stateGame.tumbleChain += 1;

		const wins: ScatterWinDatum[] = bookEvent.wins.map((win) => ({
			symbol: win.symbol,
			positions: win.positions,
			win: win.win,
			globalMult: win.meta.globalMult,
			overlay: win.meta.overlay,
		}));

		// Chain position drives the pitch, so a long tumble climbs.
		eventEmitter.broadcast({ type: 'soundTumbleHit', chain: stateGame.tumbleChain });

		await eventEmitter.broadcastAsync({
			type: 'scatterWinsShow',
			wins,
			pace: currentPace(),
		});

		// Recorded in the spin ledger. This is what replaces the idle win replay a
		// lines game would use: by the time the chain ends the winning symbols have
		// been destroyed, so the only honest record of what paid is a written one.
		//
		// The count is positions.length — there is no clusterSize field on a
		// pay-anywhere win, because the paying count IS how many of the symbol were
		// on the board.
		eventEmitter.broadcast({
			type: 'spinLedgerAdd',
			entries: bookEvent.wins.map((win) => ({
				symbol: win.symbol,
				count: win.positions.length,
				win: win.win,
			})),
		});
	},

	updateTumbleWin: async (bookEvent: BookEventOfType<'updateTumbleWin'>) => {
		stateGame.tumbleWin = bookEvent.amount;
	},

	/**
	 * Clear the winning cells and refill from above. The marks are dropped first:
	 * they belong to symbols that are about to stop existing.
	 */
	tumbleBoard: async (bookEvent: BookEventOfType<'tumbleBoard'>) => {
		eventEmitter.broadcast({ type: 'scatterWinsHide' });
		eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_wild_explode' });
		await eventEmitter.broadcastAsync({
			type: 'tumbleRun',
			explodingSymbols: bookEvent.explodingSymbols,
			newSymbols: bookEvent.newSymbols,
		});
	},

	/**
	 * The pressure gauge. Free game only.
	 *
	 * Arrives at the top of every free spin and again after every tumble — and the
	 * math sends it even when the value did not change, so that the stream stays
	 * one-to-one with tumbleBoard. The previous reading is kept so the gauge can
	 * tell a real advance from a repeat; without that the dial flares on every
	 * tumble once a feature reaches the clamp.
	 */
	updateGlobalMult: async (bookEvent: BookEventOfType<'updateGlobalMult'>) => {
		const from = stateGame.globalMult;
		stateGame.previousGlobalMult = from;
		stateGame.globalMult = bookEvent.globalMult;
		eventEmitter.broadcast({
			type: 'pressureGaugeAdvance',
			value: bookEvent.globalMult,
			from,
		});
	},

	/**
	 * End of one free spin's tumbling: the nitrogen tanks still on the board.
	 *
	 * Emitted only when the spin paid AND a tank is present, so there is no
	 * "1x, nothing happened" case to suppress. The tank values are SUMMED and the
	 * sum multiplies the whole spin's win — the updateTumbleWin that follows this
	 * event carries the multiplied amount, so the assembly has to finish before it
	 * lands or the payout jumps with nothing on screen to explain it.
	 */
	boardMultiplierInfo: async (bookEvent: BookEventOfType<'boardMultiplierInfo'>) => {
		await eventEmitter.broadcastAsync({
			type: 'tankPayoutRun',
			positions: bookEvent.multInfo.positions,
			boardMult: bookEvent.winInfo.boardMult,
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
		// The gauge starts at 1 and must be on screen before the first free spin.
		// The first updateGlobalMult arrives with the reveal that follows, but the
		// feature would otherwise open on a board with no visible mechanic — and a
		// second bonus in one session would open showing the PREVIOUS feature's
		// final reading until that first update landed.
		stateGame.globalMult = 1;
		stateGame.previousGlobalMult = 1;
		eventEmitter.broadcast({ type: 'freeSpinIntroHide' });
		eventEmitter.broadcast({ type: 'pressureGaugeShow' });
		eventEmitter.broadcast({ type: 'boardFrameGlowShow' });
		eventEmitter.broadcast({ type: 'freeSpinCounterShow' });
		stateUi.freeSpinCounterShow = true;
		// `current: 1`, not undefined. The first updateFreeSpin is still a moment
		// away, and sending undefined left the counter showing whatever it held
		// from the LAST feature. One is also simply the true reading: the feature is
		// about to play spin one.
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
		eventEmitter.broadcast({
			type: 'freeSpinCounterUpdate',
			current: bookEvent.amount,
			total: bookEvent.total,
		});
		stateUi.freeSpinCounterCurrent = bookEvent.amount;
		stateUi.freeSpinCounterTotal = bookEvent.total;
	},

	freeSpinRetrigger: async (bookEvent: BookEventOfType<'freeSpinRetrigger'>) => {
		// Same bell moment as the initial trigger. Three scatters retrigger, the
		// same count that triggers, and books show it happening in roughly 9% of
		// features.
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
		// NOTE: the gauge is deliberately left on screen and at its final reading
		// under the outro plaque — it is the player's last look at what the feature
		// built. It is hidden below, after the plaque has been read.
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
		eventEmitter.broadcast({ type: 'pressureGaugeHide' });
		stateGame.globalMult = 1;
		stateGame.previousGlobalMult = 1;
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
		// Safety net. freeSpinEnd already closes the counter and the gauge in a
		// feature round, and this is idempotent; a base round that never entered the
		// feature has nothing to close. Kept because finalWin is the last event of
		// every book in every mode, so it is the only place that can guarantee no
		// panel is left up.
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
		const lastUpdateGlobalMultEvent = findLastBookEvent('updateGlobalMult' as const);

		if (lastFreeSpinTriggerEvent) await playBookEvent(lastFreeSpinTriggerEvent, { bookEvents });
		if (lastUpdateFreeSpinEvent) playBookEvent(lastUpdateFreeSpinEvent, { bookEvents });
		if (lastSetTotalWinEvent) playBookEvent(lastSetTotalWinEvent, { bookEvents });

		// Restore the gauge without replaying every tumble that built it. Set both
		// readings to the same value so the dial arrives at rest — replaying the
		// last advance would flare on reconnect for a tumble that happened minutes
		// ago. This matters more here than a heat grid did: the gauge is the only
		// record of a feature's progress, and a player who reconnects mid-feature
		// with it showing 1x has lost the thing they were watching.
		if (lastUpdateGlobalMultEvent) {
			stateGame.globalMult = lastUpdateGlobalMultEvent.globalMult;
			stateGame.previousGlobalMult = lastUpdateGlobalMultEvent.globalMult;
			eventEmitter.broadcast({ type: 'pressureGaugeShow' });
		}
	},
};
