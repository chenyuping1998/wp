import _ from 'lodash';

import { recordBookEvent, checkIsMultipleRevealEvents, type BookEventHandlerMap } from 'utils-book';
import { stateBet, stateUi } from 'state-shared';
import { SECOND } from 'constants-shared/time';
import { waitForTimeout } from 'utils-shared/wait';

import { eventEmitter } from './eventEmitter';
import { playBookEvent } from './utils';
import { winLevelMap, type WinLevel, type WinLevelData } from './winLevelMap';
import { stateGame, stateGameDerived } from './stateGame.svelte';
import type { BookEvent, BookEventOfType, BookEventContext } from './typesBookEvent';
import type { Position } from './types';
import { BOARD_DIMENSIONS, SUPERSPIN_CELL_SPIN } from './constants';
import config from './config';

// The math emits anticipation[reel] = (scatters landed before that reel) - 1, so
// a value of 1 means the tease starts on the *second* scatter. Free spins need
// four, so teasing that early fires on most spins and stops meaning anything.
// Require three scatters already on the board (value >= 2) before any reel
// teases. Filtering the array here — rather than in utils-slots — keeps the
// slow reel stop and the on-screen tease gated by the same condition, and
// leaves the shared package (and WildParty) untouched.
const ANTICIPATION_MIN_SCATTERS = 3;

const gateAnticipation = (anticipation: number[]) =>
	anticipation.map((value) => (value >= ANTICIPATION_MIN_SCATTERS - 1 ? value : 0));

// A plain base-game board, sampled from the base padding strips. Used to put the
// reels back after a superspin: that mode's board is full of P (coin) and X
// (empty crate) symbols which exist nowhere else, so leaving it up made the
// round look like it had not finished.
const baseIdleBoard = () =>
	(config.paddingReels.basegame as { name: string }[][]).map((strip) => {
		const start = Math.floor(Math.random() * strip.length);
		// same shape as a math reveal board: BOARD_DIMENSIONS.y visible rows plus
		// one padding row top and bottom
		return Array.from(
			{ length: BOARD_DIMENSIONS.y + 2 },
			(_, i) => strip[(start + i) % strip.length],
		);
	});

// The winLevel of the setWin the math emitted this round, or null if it emitted
// none. finalWin reuses it so the superspin total-win plaque is graded by the
// math's own classification instead of a locally invented one.
let lastWinLevel: WinLevel | null = null;

// The win lines of the round's last winInfo, kept so the board can keep showing
// them while it sits idle waiting for the next spin — otherwise the lines vanish
// a moment after they are drawn and a player who looked away has no way to see
// what actually paid. playBet owns the replay loop and its cancellation.
export type WinLineDatum = {
	lineIndex: number;
	positions: { reel: number; row: number }[];
	symbolCount: number;
};
let lastWinLines: WinLineDatum[] = [];
export const getLastWinLines = () => lastWinLines;
export const clearLastWinLines = () => {
	lastWinLines = [];
};

const winLevelSoundsPlay = ({ winLevelData }: { winLevelData: WinLevelData }) => {
	if (winLevelData?.alias === 'max') eventEmitter.broadcastAsync({ type: 'uiHide' });
	if (winLevelData?.sound?.sfx) {
		eventEmitter.broadcast({ type: 'soundOnce', name: winLevelData.sound.sfx });
	}
	// Deliberately NOT switching to winLevelData.sound.bgm. Those names
	// (bgm_winlevel_big..max) have no jungle audio file, so soundMusic routes them
	// to the template player and plays nothing — but on the way it pauses the
	// running bgm and clears currentBgm. The result was a big-win / free-game
	// total-win screen with the music bed gone silent, leaving only the 2.4s
	// coin-shimmer loop cycling on its own (the "music keeps repeating" report),
	// and — because currentBgm was cleared — the dedupe guard failed so the bgm
	// restarted from the top when it came back. Keeping the running bgm playing
	// under the blast + coin loop fixes both. (Restore this line only once real
	// win-level tracks exist in the jungle set.)
	if (winLevelData?.type === 'big') {
		// Blast accent as the big/super/mega/epic win presentation slams in
		eventEmitter.broadcast({ type: 'soundBigWinBlast' });
		eventEmitter.broadcast({ type: 'soundLoop', name: 'sfx_bigwin_coinloop' });
	}
};

const winLevelSoundsStop = () => {
	eventEmitter.broadcast({ type: 'soundStop', name: 'sfx_bigwin_coinloop' });
	if (stateBet.activeBetModeKey === 'SUPERSPIN' || stateGame.gameType === 'freegame') {
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

export const bookEventHandlerMap: BookEventHandlerMap<BookEvent, BookEventContext> = {
	reveal: async (bookEvent: BookEventOfType<'reveal'>, { bookEvents }: BookEventContext) => {
		const isBonusGame = checkIsMultipleRevealEvents({ bookEvents });
		if (isBonusGame) {
			eventEmitter.broadcast({ type: 'stopButtonEnable' });
			recordBookEvent({ bookEvent });
		}

		stateGame.gameType = bookEvent.gameType;

		if (SUPERSPIN_CELL_SPIN && bookEvent.gameType === 'superspin') {
			// Hold and spin: cells spin individually, not as columns. A column
			// sweep would drag the whole strip past the coins that are supposed to
			// be held still, which reads as the hold not holding. Settle the board
			// straight away and let SuperspinCells cover and animate each unheld
			// cell instead — held cells simply get no overlay, so nothing moves
			// behind them.
			stateGameDerived.enhancedBoard.settle(bookEvent.board);
			await eventEmitter.broadcastAsync({
				type: 'superspinCellsSpin',
				lockedKeys: stateGame.stickyPrizes.map((p) => `${p.reel},${p.row}`),
			});
			eventEmitter.broadcast({ type: 'soundScatterCounterClear' });
			return;
		}

		await stateGameDerived.enhancedBoard.spin({
			revealEvent: { ...bookEvent, anticipation: gateAnticipation(bookEvent.anticipation) },
			paddingBoard: config.paddingReels[bookEvent.gameType],
		});
		eventEmitter.broadcast({ type: 'soundScatterCounterClear' });
	},
	winInfo: async (bookEvent: BookEventOfType<'winInfo'>) => {
		eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_winlevel_small' });

		// Build win line data — each win has a lineIndex from meta
		const winLineData = bookEvent.wins.map((win) => ({
			lineIndex: win.meta.lineIndex,
			positions: win.positions,
			symbolCount: win.positions.length,
		}));

		// Every winning line runs its grenade at once; free game and turbo use the
		// short timing. WinLines owns the symbol win animations too — it fires them
		// reel by reel in each grenade's wake (and dedupes positions shared between
		// lines, which would otherwise hang waiting for a second completion).
		const isFreeGame = stateGame.gameType === 'freegame';
		await eventEmitter.broadcastAsync({ type: 'winLinesShow', wins: winLineData, fast: isFreeGame });

		eventEmitter.broadcast({ type: 'winLinesHide' });

		// Remembered for the idle replay, but only for base-game wins. A free
		// game or super spin tears the board down to base idle when it ends
		// (finalWin), so replaying a feature spin's lines afterwards would draw
		// them over symbols that are no longer there — the board the player is
		// looking at is not the board those lines were won on.
		if (stateGame.gameType === 'basegame') lastWinLines = winLineData;
		else lastWinLines = [];
	},
	setTotalWin: async (bookEvent: BookEventOfType<'setTotalWin'>) => {
		stateBet.winBookEventAmount = bookEvent.amount;
	},
	freeSpinTrigger: async (bookEvent: BookEventOfType<'freeSpinTrigger'>) => {
		// The base spin that triggered this may itself have paid, recording its win
		// lines for the idle replay. But the board is about to become a free game
		// and then be torn down to base idle, so those lines must not survive to be
		// replayed afterwards — clear them now, before any free spin that loses
		// throughout would leave them as the last thing recorded.
		lastWinLines = [];

		// Scatters landed on reels 3/4/5 — silence everything and ring the classic
		// free-game trigger bell, holding the moment for ~2s before the payoff.
		eventEmitter.broadcast({ type: 'soundStop', name: 'bgm_main' });
		eventEmitter.broadcast({ type: 'soundStop', name: 'sfx_anticipation' });
		eventEmitter.broadcast({ type: 'soundFreeGameBell' });
		// gold rings + sparks burst out of the scatters while the bell rings
		eventEmitter.broadcast({ type: 'scatterBurst', positions: bookEvent.positions });
		await waitForTimeout(3000);
		eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_scatter_win_v2' });
		// Three passes of the scatter shake — extended trigger celebration
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
		stateGame.stickyWildReels = [];
		eventEmitter.broadcast({ type: 'expandingWildsClear' });
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
	// GoBananas free game: a Wild landed and expands to fill its reel — 悟空
	// twirls the 金箍棒 while growing, then sticks for the rest of the feature.
	newExpandingWilds: async (bookEvent: BookEventOfType<'newExpandingWilds'>) => {
		if (bookEvent.newWilds.length === 0) return;
		eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_wild_explode' });
		await Promise.all(
			bookEvent.newWilds.map((wild) =>
				eventEmitter.broadcastAsync({
					type: 'expandingWildNew',
					reel: wild.reel,
					row: wild.row,
					mult: wild.mult,
				}),
			),
		);
		stateGame.stickyWildReels = _.uniq([
			...stateGame.stickyWildReels,
			...bookEvent.newWilds.map((wild) => wild.reel),
		]);
	},
	// Sticky expanded wilds re-roll their multiplier on each reveal.
	updateExpandingWilds: async (bookEvent: BookEventOfType<'updateExpandingWilds'>) => {
		if (bookEvent.existingWilds.length === 0) return;
		eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_multiplier_update' });
		await eventEmitter.broadcastAsync({
			type: 'expandingWildsUpdate',
			wilds: bookEvent.existingWilds,
		});
	},
	// GoBananas superspin: new prize coins stick to the board — every new coin
	// also resets the remaining spins (the following updateFreeSpin reflects it).
	newStickySymbols: async (bookEvent: BookEventOfType<'newStickySymbols'>) => {
		if (bookEvent.newPrizes.length === 0) return;
		eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_multiplier_landing' });
		stateGame.stickyPrizes = [
			...stateGame.stickyPrizes.filter(
				(sticky) =>
					!bookEvent.newPrizes.some((p) => p.reel === sticky.reel && p.row === sticky.row),
			),
			...bookEvent.newPrizes,
		];
		await eventEmitter.broadcastAsync({ type: 'stickyPrizesNew', prizes: bookEvent.newPrizes });
	},
	// GoBananas superspin: no spins left — tally every coin stuck to the board.
	prizeWinInfo: async (bookEvent: BookEventOfType<'prizeWinInfo'>) => {
		if (bookEvent.wins.length > 0) {
			eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_scatter_win_v2' });
			await eventEmitter.broadcastAsync({ type: 'stickyPrizesCelebrate', wins: bookEvent.wins });
		}
		stateBet.winBookEventAmount = bookEvent.totalWin;
		eventEmitter.broadcast({ type: 'freeSpinCounterHide' });
		stateUi.freeSpinCounterShow = false;
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
		// Same bell moment as the initial trigger: silence the free-game bgm,
		// ring the bell and hold ~2s, then bring the music back.
		eventEmitter.broadcast({ type: 'soundStop', name: 'bgm_freespin' });
		eventEmitter.broadcast({ type: 'soundStop', name: 'sfx_anticipation' });
		eventEmitter.broadcast({ type: 'soundFreeGameBell' });
		await waitForTimeout(3000);
		eventEmitter.broadcast({ type: 'soundMusic', name: 'bgm_freespin' });
		eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_scatter_win_v2' });
		// Three passes of the scatter shake — extended trigger celebration
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
		stateGame.stickyWildReels = [];
		// NOTE: expandingWildsClear deliberately does NOT fire here — the sticky
		// overlays must keep covering the reveal-board W stacks through the outro
		// and the idle board; the next spin clears them (actor onNewGameStart).
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
	setWin: async (bookEvent: BookEventOfType<'setWin'>) => {
		const winLevelData = winLevelMap[bookEvent.winLevel as WinLevel];
		lastWinLevel = bookEvent.winLevel as WinLevel;

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
	finalWin: async (bookEvent: BookEventOfType<'finalWin'>) => {
		// Every superspin round ends on the same TOTAL WIN plaque the free game
		// ends on, whatever it paid — including nothing. Superspin has no
		// round-end event of its own (base and bonus close on freeSpinEnd), so
		// this is the only place that can guarantee it.
		if (stateBet.activeBetModeKey === 'SUPERSPIN') {
			// A capped round never emits setWin at all, so the single best result
			// in the mode would otherwise reach the plaque with no celebration in
			// front of it. Verified against books_superspin.jsonl.zst: exactly the
			// 10 wincap books lack setWin, alongside the 1000 that pay zero.
			if (lastWinLevel === null && bookEvent.amount > 0) {
				const maxLevelData = winLevelMap[10 as WinLevel]; // 'max'
				eventEmitter.broadcast({ type: 'winShow' });
				winLevelSoundsPlay({ winLevelData: maxLevelData });
				await eventEmitter.broadcastAsync({
					type: 'winUpdate',
					amount: bookEvent.amount,
					winLevelData: maxLevelData,
				});
				winLevelSoundsStop();
				eventEmitter.broadcast({ type: 'winHide' });
				lastWinLevel = 10;
			}

			// Same sequence as freeSpinEnd, so the two features close identically.
			// No artificial hold: freeSpinOutroCountUp resolves on the player's
			// press, not on the count-up finishing, so even the zero-win plaque
			// (presentDuration 0) stays up until it is acknowledged.
			const winLevelData = winLevelMap[lastWinLevel ?? (1 as WinLevel)];
			// clear the respin plaque first so the result has the screen to itself
			eventEmitter.broadcast({ type: 'freeSpinCounterHide' });
			stateUi.freeSpinCounterShow = false;
			await eventEmitter.broadcastAsync({ type: 'uiHide' });
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

			// Back to the base game. Without this the hold-and-spin board stayed on
			// screen after the plaque was dismissed — stuck coins still overlaid,
			// reels still showing superspin-only symbols. Mirrors freeSpinEnd: swap
			// the state, then let the transition wipe cover the change.
			stateGame.stickyPrizes = [];
			eventEmitter.broadcast({ type: 'stickyPrizesClear' });
			stateGame.gameType = 'basegame';
			stateGameDerived.enhancedBoard.settle(baseIdleBoard());
			await eventEmitter.broadcastAsync({ type: 'transition' });
			await eventEmitter.broadcastAsync({ type: 'uiShow' });
		}
		lastWinLevel = null;

		// Superspin teardown safety net.
		//
		// The whole superspin presentation used to be closed inside prizeWinInfo,
		// but the math only emits prizeWinInfo (and setWin) when something was
		// actually won. ~10% of superspin books land no coin at all across all
		// three respins, and those books end:
		//     updateFreeSpin -> reveal -> setTotalWin -> finalWin
		// with no prizeWinInfo anywhere. The respin plaque was therefore never
		// hidden: it froze on screen, the round showed no result, and the stale
		// panel stayed up over the following base spins.
		//
		// finalWin is the last event of every book in every mode, so close the
		// counter here if something left it open. In the free game freeSpinEnd
		// already hides it earlier in the sequence, and this is idempotent.
		if (stateUi.freeSpinCounterShow) {
			eventEmitter.broadcast({ type: 'freeSpinCounterHide' });
			stateUi.freeSpinCounterShow = false;
		}

		// Same root cause, separate leak: gameType is only reset to 'basegame' by
		// freeSpinEnd, which superspin books never contain. It therefore stayed
		// 'superspin' after the round, and the next base spin's preSpin looked up
		// config.paddingReels['superspin'] — a key that does not exist — so it
		// padded with undefined. Reset it here too.
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

		if (lastFreeSpinTriggerEvent) await playBookEvent(lastFreeSpinTriggerEvent, { bookEvents });
		if (lastUpdateFreeSpinEvent) playBookEvent(lastUpdateFreeSpinEvent, { bookEvents });
		if (lastSetTotalWinEvent) playBookEvent(lastSetTotalWinEvent, { bookEvents });

		// Rebuild sticky expanded wilds: every newExpandingWilds adds a reel, and
		// the last updateExpandingWilds carries the grown mults of the older ones.
		// Order matters and is load-bearing — a wild that landed on the final spin
		// appears only in newExpandingWilds (it has not been grown yet), while every
		// older reel must take the update's value, not its landing value.
		const multByReel = new Map<number, number>();
		for (const event of bookEvents) {
			if (event.type === 'newExpandingWilds') {
				for (const wild of event.newWilds) multByReel.set(wild.reel, wild.mult);
			}
		}
		const lastUpdateExpandingWildsEvent = findLastBookEvent('updateExpandingWilds' as const);
		for (const wild of lastUpdateExpandingWildsEvent?.existingWilds ?? []) {
			multByReel.set(wild.reel, wild.mult);
		}
		if (multByReel.size > 0) {
			stateGame.stickyWildReels = [...multByReel.keys()];
			eventEmitter.broadcast({
				type: 'expandingWildsRestore',
				wilds: [...multByReel.entries()].map(([reel, mult]) => ({ reel, mult })),
			});
		}

		// Rebuild superspin sticky prize coins (every newStickySymbols accumulates).
		const stickyPrizeMap = new Map<string, { reel: number; row: number; prize: number }>();
		for (const event of bookEvents) {
			if (event.type === 'newStickySymbols') {
				for (const prize of event.newPrizes) {
					stickyPrizeMap.set(`${prize.reel},${prize.row}`, prize);
				}
			}
		}
		if (stickyPrizeMap.size > 0) {
			stateGame.stickyPrizes = [...stickyPrizeMap.values()];
			eventEmitter.broadcast({ type: 'stickyPrizesRestore', prizes: [...stickyPrizeMap.values()] });
		}
	},
};
