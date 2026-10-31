import _ from 'lodash';

import { recordBookEvent, checkIsMultipleRevealEvents, type BookEventHandlerMap } from 'utils-book';
import { stateBet, stateUi } from 'state-shared';
import { waitForTimeout } from 'utils-shared/wait';

import { eventEmitter } from './eventEmitter';
import { playBookEvent } from './utils';
import { winLevelMap, type WinLevel, type WinLevelData } from './winLevelMap';
import { stateGame, stateGameDerived } from './stateGame.svelte';
import type { BookEvent, BookEventOfType, BookEventContext } from './typesBookEvent';
import type { Position, RawSymbol, SymbolName } from './types';
import { BOARD_DIMENSIONS } from './constants';
import config from './config';
import { featureTotal } from './featureTotal';

// The math numbers the reels after the one where the third Aegis landed 1, 2,
// 3… (anticipation_triggers = 3, one short of the four that open free spins).
// Only value 1 is worth teasing: the very next reel, the single point in the
// round where one more Aegis decides the outcome.
//
// EXACTLY that value, not >=. A higher value means the feature is already won,
// nothing is left in suspense, and an anticipated reel costs real time — its
// padding is reelPaddingMultiplierAnticipated (8) against 1.2 for a normal reel,
// so it waits several times longer before it even starts falling. With >=, every
// bought round would open on a run of teased reels after the outcome was paid for.
const gateAnticipation = (anticipation: number[]) =>
	anticipation.map((value) => (value === 1 ? value : 0));

// Only these levels get the full plaque. setWin fires once per SPIN, not once per
// round, so celebrating every one would put a banner over most free spins. Small
// wins just move the ticker, which setTotalWin is already doing.
const isCelebratedWinLevel = (winLevelData: WinLevelData | undefined) =>
	winLevelData?.type === 'big';

/** One symbol reaching a paying count. */
export type ScatterWinDatum = {
	symbol: SymbolName;
	positions: Position[];
	win: number;
	overlay: Position;
};

const winLevelSoundsPlay = ({ winLevelData }: { winLevelData: WinLevelData }) => {
	if (winLevelData?.alias === 'max') eventEmitter.broadcastAsync({ type: 'uiHide' });
	if (winLevelData?.sound?.sfx) {
		eventEmitter.broadcast({ type: 'soundOnce', name: winLevelData.sound.sfx });
	}
	// Deliberately NOT switching to winLevelData.sound.bgm: switching pauses the
	// running bed and restarts it from the top afterwards. Keep it playing.
	if (winLevelData?.type === 'big') {
		eventEmitter.broadcast({
			type: 'soundBigWinBlast',
			tier: Math.min(5, Math.max(1, winLevelData.level - 5)) as 1 | 2 | 3 | 4 | 5,
		});
		eventEmitter.broadcast({
			type: 'medusaAction',
			animation: winLevelData.alias === 'max' ? 'win_max' : 'win_big',
		});
		eventEmitter.broadcast({ type: 'soundLoop', name: 'sfx_bigwin_coinloop' });
	}
};

const winLevelSoundsStop = () => {
	eventEmitter.broadcast({ type: 'soundStop', name: 'sfx_bigwin_coinloop' });
	eventEmitter.broadcast({ type: 'medusaPose', pose: 'idle' });
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
		// not carry over. Medusa's running total is NOT touched — it survives every
		// reveal inside a feature.
		stateGame.tumbleWin = 0;
		stateGame.tumbleChain = 0;
		eventEmitter.broadcast({ type: 'medusaPose', pose: 'idle' });

		eventEmitter.broadcast({ type: 'soundScatterCounterClear' });
		await stateGameDerived.enhancedBoard.spin({
			revealEvent: {
				...bookEvent,
				anticipation: gateAnticipation(bookEvent.anticipation),
			},
			paddingBoard: config.paddingReels[bookEvent.gameType] as RawSymbol[][],
		});
	},

	/**
	 * One evaluation pass. Every symbol that reached a paying count is marked and
	 * its amount shown at the centre of the group. With no wild on the strips a
	 * cell belongs to exactly one symbol's group, so there is nothing to dedupe.
	 */
	winInfo: async (bookEvent: BookEventOfType<'winInfo'>) => {
		stateGame.tumbleChain += 1;
		// A short authored reaction has anticipation, a held gesture and follow-
		// through. It finishes before the multiplier performance starts.
		if(stateGame.tumbleChain===1||stateGame.tumbleChain%3===0)
			eventEmitter.broadcast({type:'medusaAction',animation:'react_small'});

		const wins: ScatterWinDatum[] = bookEvent.wins.map((win) => ({
			symbol: win.symbol,
			positions: win.positions,
			win: win.win,
			overlay: win.meta.overlay,
		}));

		// The pluck marks the win. Stone cracks are scheduled by ScatterWins at
		// the actual petrification boundary, after the symbol's acting beat.
		eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_winlevel_standard' });

		await eventEmitter.broadcastAsync({
			type: 'scatterWinsShow',
			wins,
			pace: currentPace(),
		});
	},

	updateTumbleWin: async (bookEvent: BookEventOfType<'updateTumbleWin'>) => {
		stateGame.tumbleWin = bookEvent.amount;
	},

	/**
	 * The winning cells turn to stone and crumble, and the board refills from
	 * above. The marks are dropped first: they belong to symbols that are about to
	 * stop existing.
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
	 * Medusa's throw, after the tumbling has finished (SPEC 3).
	 *
	 * Applied only when the spin had a tumble win; otherwise every orb shatters.
	 * In the free game `mult` is the running total after this throw, so it is
	 * stored as-is. The updateTumbleWin that follows carries the multiplied amount,
	 * so the orb has to land before it does or the payout jumps with nothing on
	 * screen to explain it.
	 */
	medusaThrow: async (bookEvent: BookEventOfType<'medusaThrow'>) => {
		const isFree = stateGame.gameType === 'freegame';
		await eventEmitter.broadcastAsync({
			type: 'medusaThrow',
			multipliers: bookEvent.multipliers,
			applied: bookEvent.applied,
			mult: bookEvent.mult,
			baseWin: bookEvent.baseWin,
			totalWin: bookEvent.totalWin,
			toTotal: isFree,
			pace: currentPace(),
		});
		if (isFree && bookEvent.applied) stateGame.medusaTotal = bookEvent.mult;
	},

	/** 4+ Aegis paying on their own when the chain ended. */
	scatterWin: async (bookEvent: BookEventOfType<'scatterWin'>) => {
		eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_scatter_win_v2' });
		eventEmitter.broadcast({
			type: 'scatterBurst',
			positions: bookEvent.positions,
		});
		await animateSymbols({ positions: bookEvent.positions });
	},

	setTotalWin: async (bookEvent: BookEventOfType<'setTotalWin'>) => {
		stateBet.winBookEventAmount = bookEvent.amount;
	},

	freeSpinTrigger: async (bookEvent: BookEventOfType<'freeSpinTrigger'>) => {
		eventEmitter.broadcast({ type: 'soundStop', name: 'bgm_main' });
		eventEmitter.broadcast({ type: 'soundStop', name: 'sfx_anticipation' });
		eventEmitter.broadcast({ type: 'soundFreeGameBell' });
		eventEmitter.broadcast({ type: 'medusaAction', animation: 'fg_trigger' });
		eventEmitter.broadcast({
			type: 'scatterBurst',
			positions: bookEvent.positions,
		});
		const triggerStart = performance.now();
		await Promise.all(
			bookEvent.positions.map(async (position, index) => {
				await waitForTimeout(index * 120);
				await animateSymbols({ positions: [position] });
			}),
		);
		await waitForTimeout(Math.max(0, 2000 - (performance.now() - triggerStart)));
		eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_superfreespin' });
		await eventEmitter.broadcastAsync({ type: 'uiHide' });
		stateGame.gameType = 'freegame';
		await eventEmitter.broadcastAsync({ type: 'transition' });
		eventEmitter.broadcast({ type: 'freeSpinIntroShow' });
		eventEmitter.broadcast({ type: 'soundOnce', name: 'jng_intro_fs' });
		eventEmitter.broadcast({ type: 'soundMusic', name: 'bgm_freespin' });
		await eventEmitter.broadcastAsync({
			type: 'freeSpinIntroUpdate',
			totalFreeSpins: bookEvent.totalFs,
		});
		stateGame.gameType = 'freegame';
		// The running-total plate opens at 0 and has to be on screen before the
		// first free spin, or a second feature in one session would open showing
		// the previous feature's final total.
		stateGame.medusaTotal = 0;
		eventEmitter.broadcast({ type: 'freeSpinIntroHide' });
		eventEmitter.broadcast({ type: 'medusaTotalShow' });
		eventEmitter.broadcast({ type: 'boardFrameGlowShow' });
		eventEmitter.broadcast({ type: 'freeSpinCounterShow' });
		stateUi.freeSpinCounterShow = true;
		// `current: 1`, not undefined: the first updateFreeSpin is a moment away,
		// and undefined would leave the counter showing the last feature's value.
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
		// `amount` is already the 1-based index of the spin about to be played: the
		// math sends updateFreeSpin(amount=N) right before the Nth reveal.
		eventEmitter.broadcast({
			type: 'freeSpinCounterUpdate',
			current: bookEvent.amount,
			total: bookEvent.total,
		});
		stateUi.freeSpinCounterCurrent = bookEvent.amount;
		stateUi.freeSpinCounterTotal = bookEvent.total;
	},

	freeSpinRetrigger: async (bookEvent: BookEventOfType<'freeSpinRetrigger'>) => {
		// Same bell moment as the initial trigger: three Aegis add five spins.
		eventEmitter.broadcast({ type: 'soundStop', name: 'bgm_freespin' });
		eventEmitter.broadcast({ type: 'soundStop', name: 'sfx_anticipation' });
		eventEmitter.broadcast({ type: 'soundFreeGameBell' });
		eventEmitter.broadcast({ type: 'medusaAction', animation: 'react_small' });
		await Promise.all(
			bookEvent.positions.map(async (position, index) => {
				await waitForTimeout(index * 120);
				await animateSymbols({ positions: [position] });
			}),
		);
		eventEmitter.broadcast({ type: 'soundMusic', name: 'bgm_freespin' });
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
		// the plaque shows the WHOLE round, trigger spin included (featureTotal)
		const total = featureTotal(bookEvent.amount, bookEvent.winLevel);
		const winLevelData = winLevelMap[total.winLevel as WinLevel];

		await eventEmitter.broadcastAsync({ type: 'uiHide' });
		eventEmitter.broadcast({ type: 'medusaAction', animation: 'fg_end' });
		eventEmitter.broadcast({ type: 'soundMedusa', cue: 'glassesOn' });
		// The running-total plate stays up under the outro plaque — it is the
		// player's last look at what the feature built — and is hidden below.
		eventEmitter.broadcast({ type: 'boardFrameGlowHide' });
		eventEmitter.broadcast({ type: 'freeSpinOutroShow' });
		eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_youwon_panel' });
		winLevelSoundsPlay({ winLevelData });
		await eventEmitter.broadcastAsync({
			type: 'freeSpinOutroCountUp',
			amount: total.amount,
			winLevelData,
		});
		winLevelSoundsStop();
		eventEmitter.broadcast({ type: 'freeSpinOutroHide' });
		eventEmitter.broadcast({ type: 'freeSpinCounterHide' });
		eventEmitter.broadcast({ type: 'medusaTotalHide' });
		stateGame.medusaTotal = 0;
		stateUi.freeSpinCounterShow = false;
		stateGame.gameType = 'basegame';
		eventEmitter.broadcast({ type: 'soundMusic', name: 'bgm_main' });
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
		await eventEmitter.broadcastAsync({ type: 'winHide' });
	},

	finalWin: async () => {
		// Safety net: finalWin is the last event of every book, so it is the one
		// place that can guarantee no feature panel is left up.
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
		const lastMedusaThrowEvent = findLastBookEvent('medusaThrow' as const);

		if (lastFreeSpinTriggerEvent) await playBookEvent(lastFreeSpinTriggerEvent, { bookEvents });
		if (lastUpdateFreeSpinEvent) playBookEvent(lastUpdateFreeSpinEvent, { bookEvents });
		if (lastSetTotalWinEvent) playBookEvent(lastSetTotalWinEvent, { bookEvents });

		// Restore the running total without replaying every throw that built it. A
		// free-game medusaThrow carries the total either way (applied: the new one;
		// wasted: the unchanged one), so the last one after the trigger is enough.
		if (lastFreeSpinTriggerEvent) {
			stateGame.medusaTotal =
				lastMedusaThrowEvent && lastMedusaThrowEvent.index > lastFreeSpinTriggerEvent.index
					? lastMedusaThrowEvent.mult
					: 0;
			eventEmitter.broadcast({ type: 'medusaTotalShow' });
		}
	},
};
