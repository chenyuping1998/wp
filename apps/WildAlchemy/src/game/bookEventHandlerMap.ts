import _ from 'lodash';

import { recordBookEvent, checkIsMultipleRevealEvents, type BookEventHandlerMap } from 'utils-book';
import { stateBet, stateUi } from 'state-shared';
import { waitForTimeout } from 'utils-shared/wait';

import { eventEmitter } from './eventEmitter';
import { playBookEvent } from './utils';
import { winLevelMap, withMaxWin, type WinLevel, type WinLevelData } from './winLevelMap';
import { stateGame, stateGameDerived, type CastCue } from './stateGame.svelte';
import type { BookEvent, BookEventOfType, BookEventContext, RevealBar } from './typesBookEvent';
import type { Position, RawSymbol } from './types';
import { BOARD_DIMENSIONS, INITIAL_BOARD } from './constants';
import { REF_TIMING } from './refTiming';
import { boardSeed, seededRandom, pickSeeded } from './seeded';
import { planMerge } from './mergePath';
import { featureScaled } from './timeScale';
import config from './config';

/**
 * Every beat here is timed from the reference game's own settings
 * (game/refTiming.ts, SPEC §2). The order of events inside a spin is the
 * math's (gamestate.py):
 *
 *   base:  reveal -> [wildTransfer] -> [winInfo -> setWin] -> setTotalWin
 *          -> [freeSpinTrigger -> updateGlobalMult]
 *   free:  updateFreeSpin -> reveal -> [wildTransfer] -> [bloodPoints]
 *          -> [updateGlobalMult -> freeSpinRetrigger]* -> [winInfo -> setWin]
 *          -> setTotalWin ... freeSpinEnd -> finalWin
 *
 * The reveal board is POST-conversion (the math has already turned the
 * successful persons into WILD), so the reels land the persons instead and
 * the real board is swapped in under the fog. The reveal handler reads one
 * event ahead to know whether this spin converts, because the character
 * raises its hand 0.4 s into the spin — before anything has landed.
 */

const LADDER = [1, 2, 3, 5, 8, 12];

// Turbo does not shorten presentation in this game (timeScale.ts: the
// reference's turbo only changes the reel stop interval and round delays).
const scaled = (ms: number) => featureScaled(ms);
const pause = (ms: number) => waitForTimeout(scaled(ms));
const featurePause = (ms: number) => waitForTimeout(featureScaled(ms));
const sec = (seconds: number) => seconds * 1000;

const cue = (kind: CastCue) => {
	stateGame.castReaction = { kind, seq: stateGame.castReaction.seq + 1 };
};

// The win lines of the round's last winInfo, kept so the board can keep showing
// them while it sits idle waiting for the next spin. playBet owns the replay.
export type WinLineDatum = {
	lineIndex: number;
	positions: { reel: number; row: number }[];
	symbolCount: number;
	win?: number;
	winWithoutMult?: number;
	multiplier?: number;
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
	if (winLevelData?.type === 'big' || (winLevelData?.presentDuration ?? 0) > 0) {
		eventEmitter.broadcast({ type: 'soundLoop', name: 'sfx_bigwin_coinloop' });
	}
};

const winLevelSoundsStop = () => {
	eventEmitter.broadcast({ type: 'soundStop', name: 'sfx_bigwin_coinloop' });
	eventEmitter.broadcast({
		type: 'soundMusic',
		name: stateGame.gameType === 'freegame' ? 'bgm_freespin' : 'bgm_main',
	});
	eventEmitter.broadcastAsync({ type: 'uiShow' });
};

/** The reels land the persons; the fog later reveals what they became. */
const preTransferBoard = (board: RawSymbol[][]): RawSymbol[][] =>
	board.map((reel) =>
		reel.map((cell) => (cell.name === 'W' && cell.from ? ({ name: cell.from } as RawSymbol) : cell)),
	);
const preTransferBars = (bars: RevealBar[]): RevealBar[] =>
	bars.map((bar) => ({
		...bar,
		symbols: bar.symbols.map((symbol) =>
			symbol.name === 'W' && symbol.from ? ({ name: symbol.from } as RawSymbol) : symbol,
		),
	}));

const animateSymbols = async ({ positions }: { positions: Position[] }) => {
	const visiblePositions = positions.filter((p) => p.row >= 0 && p.row < BOARD_DIMENSIONS.y);
	if (visiblePositions.length === 0) return;
	eventEmitter.broadcast({ type: 'boardShow' });
	await eventEmitter.broadcastAsync({
		type: 'boardWithAnimateSymbols',
		symbolPositions: visiblePositions,
	});
};

/** The reveal this event belongs to: the nearest one before it in the book. */
const revealBefore = (bookEvents: BookEvent[], index: number) =>
	_.findLast(bookEvents.slice(0, index), (event) => event.type === 'reveal') as
		| BookEventOfType<'reveal'>
		| undefined;

export const bookEventHandlerMap: BookEventHandlerMap<BookEvent, BookEventContext> = {
	reveal: async (bookEvent: BookEventOfType<'reveal'>, { bookEvents }: BookEventContext) => {
		const isBonusGame = checkIsMultipleRevealEvents({ bookEvents });
		if (isBonusGame) {
			eventEmitter.broadcast({ type: 'stopButtonEnable' });
			recordBookEvent({ bookEvent });
		}

		stateGame.gameType = bookEvent.gameType;
		// This game never teases: the reference has no anticipation at all.
		stateGame.anticipation = bookEvent.anticipation.map(() => 0);
		stateGame.bars = bookEvent.bars;
		stateGame.spinRandom = seededRandom(boardSeed(bookEvent.board));
		// last spin's blocks ride the strip off the board (Blocks.svelte); in the
		// base game the press already started that, in the free game this does
		eventEmitter.broadcast({ type: 'blocksLeave' });
		eventEmitter.broadcast({ type: 'wildTransferClear' });

		// One event ahead: does this spin convert? (SPEC §2.3 — the forecast IS
		// the promise of a WILD, so it can only be shown when one is coming.)
		const next = bookEvents[bookEvent.index + 1];
		const transfer = next && next.type === 'wildTransfer' ? next.positions : null;
		stateGame.pendingTransfer = transfer;

		let forecastFired = false;
		const forecast = transfer
			? setTimeout(() => {
					forecastFired = true;
					cue('transIn');
					eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_anticipation' });
				}, scaled(sec(REF_TIMING.transStart)))
			: undefined;

		// Blocks merge DURING the spin (SPEC §2.2): the path is seeded by the
		// previous round's board, the frames light on the reference's schedule and
		// the block's reels are told to spin on until the merge is done.
		const merge = planMerge(
			bookEvent.bars,
			seededRandom(boardSeed(stateGame.lastBoard ?? bookEvent.board)),
			BOARD_DIMENSIONS.x,
		);
		stateGame.mergeExtra = merge.extraCells;
		eventEmitter.broadcast({ type: 'mergeShow', plan: merge });

		const padding = config.paddingReels[bookEvent.gameType];
		// Reference books carry no padding rows (SPEC §3.4): fill them from the
		// padding reels with a seeded pick so a replay looks the same twice.
		const paddingPositions =
			bookEvent.paddingPositions?.length === padding.length
				? bookEvent.paddingPositions
				: (() => {
						const pick = seededRandom(boardSeed(bookEvent.board) + 1);
						return padding.map((reel) => Math.floor(pick() * reel.length));
					})();
		await stateGameDerived.enhancedBoard.spin({
			revealEvent: {
				...bookEvent,
				board: preTransferBoard(bookEvent.board),
				paddingPositions,
				// 1 on block reels only: the engine's 'anticipated' spin is what
				// carries the extra travel; there is no tease in this game
				anticipation: merge.anticipation,
			},
			paddingBoard: padding.map((reel) => reel.map((symbol) => ({ ...symbol }))),
		});
		eventEmitter.broadcast({ type: 'mergeHide' });
		stateGame.mergeExtra = [];
		stateGame.lastBoard = bookEvent.board;
		if (forecast && !forecastFired) {
			clearTimeout(forecast);
			cue('transIn');
		}

		// Big symbols over the landed cells (persons still, if a conversion follows).
		eventEmitter.broadcast({
			type: 'blocksSet',
			bars: transfer ? preTransferBars(bookEvent.bars) : bookEvent.bars,
		});
		eventEmitter.broadcast({ type: 'soundScatterCounterClear' });
		await pause(sec(REF_TIMING.showBoard));
	},

	wildTransfer: async (bookEvent: BookEventOfType<'wildTransfer'>, { bookEvents }: BookEventContext) => {
		if (bookEvent.positions.length === 0) return;
		// Reels stopped: the character leaps and dissolves into the swarm, the
		// swarm covers every person cell from a (seeded) random one outward.
		cue('transOut');
		eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_scatter_win_v2' });
		await pause(sec(REF_TIMING.transOutDissolve));

		const centreBlock = pickSeeded(bookEvent.positions, stateGame.spinRandom);
		const centre = {
			reel: centreBlock.reel + (centreBlock.size - 1) / 2,
			row: centreBlock.row + (centreBlock.size - 1) / 2,
		};
		// trans_back starts 1.5 s after trans_out, while the reveal is running
		const back = setTimeout(
			() => cue('transBack'),
			scaled(sec(REF_TIMING.trans.out + 0.5 - REF_TIMING.transOutDissolve)),
		);

		await eventEmitter.broadcastAsync({ type: 'wildTransferCover', positions: bookEvent.positions, centre });

		// Everything is hidden: put the real (converted) board under the fog.
		const reveal = revealBefore(bookEvents, bookEvent.index);
		if (reveal) {
			stateGameDerived.enhancedBoard.settle(reveal.board);
			eventEmitter.broadcast({ type: 'blocksSwap', bars: reveal.bars });
		}
		await eventEmitter.broadcastAsync({ type: 'wildTransferReveal' });
		clearTimeout(back);
		if (stateGame.castReaction.kind !== 'transBack') cue('transBack');
		stateGame.pendingTransfer = null;
		await pause(sec(REF_TIMING.wildOut[stateGame.gameType === 'freegame' ? 'freegame' : 'basegame']));
	},

	bloodPoints: async (bookEvent: BookEventOfType<'bloodPoints'>) => {
		stateGame.ladder.points = bookEvent.points;
		eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_multiplier_landing' });
		await eventEmitter.broadcastAsync({
			type: 'pointsFly',
			positions: bookEvent.positions,
			points: bookEvent.points,
		});
	},

	updateGlobalMult: async (bookEvent: BookEventOfType<'updateGlobalMult'>) => {
		stateGame.ladder.mult = bookEvent.globalMult;
		stateGame.ladder.step = Math.max(0, LADDER.indexOf(bookEvent.globalMult));
		// At feature entry this only sets the ladder (x1, or x2 for the super
		// buy); inside the feature it is the step beat: the vial bursts and the
		// giant "xN" rises (SPEC §2.5).
		if (!stateGame.featureStarted) return;
		eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_winlevel_nice' });
		await eventEmitter.broadcastAsync({ type: 'ladderStep', mult: bookEvent.globalMult });
	},

	freeSpinRetrigger: async (bookEvent: BookEventOfType<'freeSpinRetrigger'>) => {
		// +3 spins from the ladder, never from scatters: "+3 FREE SPINS" over the
		// board, the fireball hits the ladder, the vial resets (SPEC §2.5).
		eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_superfreespin' });
		await eventEmitter.broadcastAsync({ type: 'ladderPlus', totalFs: bookEvent.totalFs });
		eventEmitter.broadcast({
			type: 'freeSpinCounterUpdate',
			current: stateUi.freeSpinCounterCurrent,
			total: bookEvent.totalFs,
		});
		stateUi.freeSpinCounterTotal = bookEvent.totalFs;
	},

	winInfo: async (bookEvent: BookEventOfType<'winInfo'>) => {
		eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_winlevel_small' });
		stateGame.currentWinTotal = bookEvent.totalWin;

		// The character's reaction is tiered on the RAW line total, before the
		// ladder (SPEC §2.4). 25x and up is left to the banner.
		const odds = bookEvent.wins.reduce((sum, win) => sum + win.meta.winWithoutMult, 0) / 100;
		const random = stateGame.spinRandom;
		let reaction: CastCue | null = null;
		if (stateGame.gameType === 'basegame') {
			if (odds > 15 && odds < 25) reaction = random() < 0.5 ? 'win01' : 'win02';
		} else if (odds <= 10) reaction = 'win01';
		else if (odds <= 15) reaction = random() < 0.5 ? 'win025' : 'win02';
		else if (odds < 25) reaction = random() < 0.5 ? 'win025' : 'win03';

		await pause(sec(REF_TIMING.scoreDelay));
		if (reaction) cue(reaction);

		const winLineData = bookEvent.wins.map((win) => ({
			lineIndex: win.meta.lineIndex,
			positions: win.positions,
			symbolCount: win.positions.length,
			win: win.win,
			winWithoutMult: win.meta.winWithoutMult,
			multiplier: win.meta.multiplier,
		}));
		const isFreeGame = stateGame.gameType === 'freegame';
		await eventEmitter.broadcastAsync({ type: 'winLinesShow', wins: winLineData, fast: isFreeGame });
		eventEmitter.broadcast({ type: 'winLinesHide' });
		lastWinLines = stateGame.gameType === 'basegame' ? winLineData : [];
	},

	setTotalWin: async (bookEvent: BookEventOfType<'setTotalWin'>) => {
		stateBet.winBookEventAmount = bookEvent.amount;
	},

	freeSpinTrigger: async (bookEvent: BookEventOfType<'freeSpinTrigger'>) => {
		cue('trigger');
		lastWinLines = [];
		eventEmitter.broadcast({ type: 'soundStop', name: 'bgm_main' });
		eventEmitter.broadcast({ type: 'soundFreeGameBell' });

		// SPEC §2.6, relative to the last castle landing: frames light at 1.5 s
		// and burn, the drip falls at 4.0 s and the screen darkens.
		await featurePause(sec(REF_TIMING.enterFeature.frameIn));
		eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_scatter_win_v2' });
		eventEmitter.broadcast({ type: 'scatterBurst', positions: bookEvent.positions });
		await animateSymbols({ positions: bookEvent.positions });
		await featurePause(sec(1.0));
		eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_superfreespin' });
		await eventEmitter.broadcastAsync({ type: 'uiHide' });
		// Returns at FULL BLACK (Transition.svelte): the scene becomes the feature
		// where the player cannot see it.
		await eventEmitter.broadcastAsync({ type: 'transition' });

		stateGame.gameType = 'freegame';
		stateGame.featureStarted = false;
		stateGame.ladder = { points: 0, step: 0, mult: 1 };
		eventEmitter.broadcast({ type: 'blocksClear' });
		eventEmitter.broadcast({ type: 'boardFrameGlowShow' });

		eventEmitter.broadcast({ type: 'freeSpinIntroShow' });
		eventEmitter.broadcast({ type: 'soundOnce', name: 'jng_intro_fs' });
		eventEmitter.broadcast({ type: 'soundMusic', name: 'bgm_freespin' });
		await eventEmitter.broadcastAsync({
			type: 'freeSpinIntroUpdate',
			totalFreeSpins: bookEvent.totalFs,
		});
		eventEmitter.broadcast({ type: 'freeSpinIntroHide' });
		eventEmitter.broadcast({ type: 'freeSpinCounterShow' });
		stateUi.freeSpinCounterShow = true;
		eventEmitter.broadcast({ type: 'freeSpinCounterUpdate', current: 0, total: bookEvent.totalFs });
		stateUi.freeSpinCounterCurrent = 0;
		stateUi.freeSpinCounterTotal = bookEvent.totalFs;
		eventEmitter.broadcast({ type: 'ladderShow' });
		await eventEmitter.broadcastAsync({ type: 'uiShow' });
		await eventEmitter.broadcastAsync({ type: 'drawerButtonShow' });
		eventEmitter.broadcast({ type: 'drawerFold' });
		// SPEC §2.6: the feature scene is on screen at 10.5 s and the first spin
		// starts at 11.5 s (castle landing = 0). Measured without this hold the
		// first spin came 1.2 s early (qa/runs/ref_bonus_1b: panel 4.7, spin 10.3);
		// with a 0.8 s hold it was still 0.6 s early (ref_bonus_1c: 10.9).
		await featurePause(sec(REF_TIMING.enterFeature.firstSpin - REF_TIMING.enterFeature.scene + 0.2));
	},

	updateFreeSpin: async (bookEvent: BookEventOfType<'updateFreeSpin'>) => {
		stateGame.featureStarted = true;
		stateGame.winningCells = [];
		eventEmitter.broadcast({ type: 'winLinesHide' });
		eventEmitter.broadcast({ type: 'freeSpinCounterShow' });
		stateUi.freeSpinCounterShow = true;
		// 1-based already (the reference counts from 1)
		eventEmitter.broadcast({
			type: 'freeSpinCounterUpdate',
			current: bookEvent.amount,
			total: bookEvent.total,
		});
		stateUi.freeSpinCounterCurrent = bookEvent.amount;
		stateUi.freeSpinCounterTotal = bookEvent.total;
	},

	freeSpinEnd: async (bookEvent: BookEventOfType<'freeSpinEnd'>) => {
		const winLevelData = withMaxWin(winLevelMap[bookEvent.winLevel as WinLevel], bookEvent.amount);

		stateGame.winningCells = [];
		stateGame.debugWinLineCount = 0;
		eventEmitter.broadcast({ type: 'winLinesHide' });
		stateGameDerived.enhancedBoard.settle(stateGameDerived.boardRaw());
		eventEmitter.broadcast({ type: 'boardShow' });
		await eventEmitter.broadcastAsync({ type: 'uiHide' });
		eventEmitter.broadcast({ type: 'boardFrameGlowHide' });
		eventEmitter.broadcast({ type: 'ladderHide' });
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
		// In the black: back to the base game with a fresh board.
		stateGame.gameType = 'basegame';
		// winLevelSoundsStop() above ran while gameType was still 'freegame', so
		// it re-armed the feature music; switch back to the base-game score here,
		// where the screen actually returns to the base game.
		eventEmitter.broadcast({ type: 'soundMusic', name: 'bgm_main' });
		stateGame.winningCells = [];
		stateGame.ladder = { points: 0, step: 0, mult: 1 };
		eventEmitter.broadcast({ type: 'blocksClear' });
		stateGameDerived.enhancedBoard.settle(INITIAL_BOARD);
		await eventEmitter.broadcastAsync({ type: 'uiShow' });
		await eventEmitter.broadcastAsync({ type: 'drawerUnfold' });
		eventEmitter.broadcast({ type: 'drawerButtonHide' });
	},

	setWin: async (bookEvent: BookEventOfType<'setWin'>) => {
		const winLevelData = withMaxWin(winLevelMap[bookEvent.winLevel as WinLevel], bookEvent.amount);
		// Nothing under BIG gets a banner or a count-up (SPEC §2.7).
		if (winLevelData.type !== 'big') return;
		// Bring the whole board back up before the banner goes over it.
		stateGame.winningCells = [];
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
		if (stateUi.freeSpinCounterShow) {
			eventEmitter.broadcast({ type: 'freeSpinCounterHide' });
			stateUi.freeSpinCounterShow = false;
		}
		eventEmitter.broadcast({ type: 'ladderHide' });
		if (stateGame.gameType !== 'basegame') stateGame.gameType = 'basegame';
	},

	wincap: async (bookEvent: BookEventOfType<'wincap'>) => {
		stateBet.winBookEventAmount = bookEvent.amount;
		eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_winlevel_end' });
	},

	createBonusSnapshot: async (bookEvent: BookEventOfType<'createBonusSnapshot'>) => {
		const { bookEvents } = bookEvent;

		function findLastBookEvent<T>(type: T) {
			return _.findLast(bookEvents, (event) => event.type === type) as BookEventOfType<T> | undefined;
		}

		const lastFreeSpinTriggerEvent = findLastBookEvent('freeSpinTrigger' as const);
		const lastUpdateFreeSpinEvent = findLastBookEvent('updateFreeSpin' as const);
		const lastSetTotalWinEvent = findLastBookEvent('setTotalWin' as const);
		const lastGlobalMult = findLastBookEvent('updateGlobalMult' as const);
		const lastPoints = findLastBookEvent('bloodPoints' as const);

		if (lastFreeSpinTriggerEvent) await playBookEvent(lastFreeSpinTriggerEvent, { bookEvents });
		if (lastUpdateFreeSpinEvent) playBookEvent(lastUpdateFreeSpinEvent, { bookEvents });
		if (lastSetTotalWinEvent) playBookEvent(lastSetTotalWinEvent, { bookEvents });

		// Rebuild the ladder a resumed round left off at.
		const mult = lastGlobalMult?.globalMult ?? 1;
		stateGame.ladder = {
			points: lastPoints?.points ?? 0,
			step: Math.max(0, LADDER.indexOf(mult)),
			mult,
		};
		stateGame.featureStarted = true;
		eventEmitter.broadcast({ type: 'ladderShow' });
	},
};
