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
import { BOARD_DIMENSIONS } from './constants';
import config from './config';

// Scatters needed for the feature (game_config freespin_triggers: 3/4/5).
const SCATTERS_TO_TRIGGER = 3;

// The math marks every reel after the one that landed the SECOND Scatter
// (1, 2, 3...). It used to be gated to values >= 2 — a rule inherited from Go
// Boomana, whose feature needed four — which skipped the one reel that could
// actually land the third Scatter and teased the reels after it instead, at
// 2.8s each: the tease ran on reels whose outcome no longer mattered.
//
// Now: tease from the reel after the second Scatter up to and including the
// reel that lands the third. Once the feature is decided, the remaining reels
// stop normally — the trigger celebration is the payoff, not more waiting.
const gateAnticipation = (anticipation: number[], board: { name: string }[][]) => {
	let scatters = 0;
	return anticipation.map((value, reel) => {
		const teased = scatters < SCATTERS_TO_TRIGGER && value > 0;
		// visible rows only: the reveal board carries a padding row at each end
		scatters += board[reel].slice(1, -1).filter((s) => s.name === 'S').length;
		return teased ? value : 0;
	});
};

// The meter as the maths would report it at `count` Bandits.
const meterAt = (count: number) => {
	const { thresholds, mults } = config.banditMeter;
	const level = thresholds.filter((t: number) => count >= t).length;
	return { count, level, mult: mults[level], nextAt: thresholds[level] ?? null };
};

// A bought feature can open part-way up the meter (superbonus); a triggered one
// starts at zero.
const startMeterForActiveMode = () => {
	const mode = stateBet.activeBetModeKey.toLowerCase() as keyof typeof config.betModes;
	const info = config.betModes[mode] as { start_meter?: number } | undefined;
	return info?.start_meter ?? 0;
};

// The win lines of the round's last winInfo, kept so the board can keep showing
// them while it sits idle waiting for the next spin — otherwise the lines vanish
// a moment after they are drawn and a player who looked away has no way to see
// what actually paid. playBet owns the replay loop and its cancellation.
// One winning SYMBOL, not one line. A ways game has no line index — `ways` is
// the product of the per-reel counts and is the number shown to the player.
export type WinLineDatum = {
	symbol: string;
	kind: number;
	ways: number;
	win: number;
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
	// under the blast + coin loop fixes both.
	//
	// The escalation per tier now comes from soundWinTier instead: a FANFARE laid
	// OVER the running bed, one per tier and each bigger than the last. It never
	// touches the bed, which is the whole reason it can exist where per-tier
	// music could not.
	if (winLevelData?.type === 'big') {
		// Blast accent as the big/super/mega/epic win presentation slams in
		eventEmitter.broadcast({ type: 'soundBigWinBlast' });
		eventEmitter.broadcast({ type: 'soundWinTier', tier: winLevelData.alias });
		eventEmitter.broadcast({ type: 'soundLoop', name: 'sfx_bigwin_coinloop' });
	}
};

const winLevelSoundsStop = () => {
	eventEmitter.broadcast({ type: 'soundStop', name: 'sfx_bigwin_coinloop' });
	// Decided by the SCENE, never by the bet mode: the mode you bought is not
	// where you are; gameType is.
	const onFeatureScene = stateGame.gameType === 'freegame';
	eventEmitter.broadcast({
		type: 'soundMusic',
		name: onFeatureScene ? 'bgm_freespin' : 'bgm_main',
	});
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

		// Clear the previous spin's collection HERE, one line before the reels are
		// released, so its flying sacks never sit over a board that is moving.
		eventEmitter.broadcast({ type: 'banditCollectClear' });

		await stateGameDerived.enhancedBoard.spin({
			revealEvent: { ...bookEvent, anticipation: gateAnticipation(bookEvent.anticipation, bookEvent.board) },
			paddingBoard: config.paddingReels[bookEvent.gameType],
			// Turbo does not apply to the free game's reels. It still applies to
			// everything around them — no pre-spin wind-up on autoplay, the short
			// win-line volley, doubled spine timeScale — so turbo is still faster
			// here, just not instant. SPIN_OPTIONS_TURBO_FREEGAME carries the pace.
			isTurboOverride: bookEvent.gameType === 'freegame' ? false : undefined,
		});
		eventEmitter.broadcast({ type: 'soundScatterCounterClear' });
	},
	winInfo: async (bookEvent: BookEventOfType<'winInfo'>) => {
		eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_winlevel_small' });

		// One entry per winning SYMBOL, not per line — a ways game has no lines to
		// enumerate. `positions` already lists every cell that took part, which is
		// what gets lit; `ways` is the headline number.
		const winLineData = bookEvent.wins.map((win) => ({
			symbol: win.symbol,
			kind: win.kind,
			ways: win.meta.ways,
			win: win.win,
			positions: win.positions,
			symbolCount: win.positions.length,
		}));

		// Free game and turbo use the short timing. WinWays owns the symbol win
		// animations too — it fires them reel by reel (and dedupes positions shared
		// between symbols, which would otherwise hang waiting for a second
		// completion).
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

		// EVERY trigger, not just four-plus Scatters.
		//
		// This was inherited from gen-3, where it made sense: there the bought
		// tiers land different Scatter counts because the count IS the spin count,
		// so bonus200 opens on four and the mascot celebrates. Here all three
		// bought tiers pay the same eight spins and therefore all show three
		// Scatters, which made the condition dead on every buy — the chest beat
		// simply stopped existing for anyone who bought the feature, which is how
		// most players reach it.
		//
		// It runs during the 3s bell hold, which is the only stretch of the trigger
		// long enough to watch him do it; the animation is 2.68s and fits.
		eventEmitter.broadcast({ type: 'mascotChestBeat' });
		await waitForTimeout(3000);
		eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_scatter_win_v2' });
		// Three passes of the scatter shake — extended trigger celebration
		eventEmitter.broadcast({ type: 'scatterBurst', positions: bookEvent.positions });
		await animateSymbols({ positions: bookEvent.positions });
		await animateSymbols({ positions: bookEvent.positions });
		await animateSymbols({ positions: bookEvent.positions });
		// (sfx_superfreespin is the shutter's own — it played here too, twice on
		// the same frame)
		await eventEmitter.broadcastAsync({ type: 'uiHide' });
		// Enter the feature inside the blast's white-out. The swap used to happen
		// after the intro plaque had already counted up, which meant the blast
		// cleared onto the BASE scene and the background only changed later, hidden
		// behind the plaque. Now the grenade falls on the base board and the flash
		// reveals the free game — which is what the transition is for.
		await eventEmitter.broadcastAsync({
			type: 'transition',
			cover: () => {
				stateGame.gameType = 'freegame';
				// The meter opens where the mode says: superbonus starts at the first
				// rung. The maths never emits a banditMeter for that head start (it is
				// state, not an event), so the client derives it from the same number.
				stateGame.banditMeter = meterAt(startMeterForActiveMode());
				eventEmitter.broadcast({ type: 'banditCollectClear' });
			},
		});
		eventEmitter.broadcast({ type: 'freeSpinIntroShow' });
		eventEmitter.broadcast({ type: 'soundOnce', name: 'jng_intro_fs' });
		eventEmitter.broadcast({ type: 'soundMusic', name: 'bgm_freespin' });
		await eventEmitter.broadcastAsync({
			type: 'freeSpinIntroUpdate',
			totalFreeSpins: bookEvent.totalFs,
		});
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
	// The Bandits take every Sack. The ways win (winInfo/setWin) has already been
	// shown; this is the second beat of the same spin, and the setWin after it
	// carries the spin's total.
	collect: async (bookEvent: BookEventOfType<'collect'>) => {
		eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_multiplier_landing' });
		eventEmitter.broadcast({ type: 'mascotChestBeat' });
		await eventEmitter.broadcastAsync({
			type: 'banditCollect',
			// reveal positions carry a padding row on top; the math's do not
			collectors: bookEvent.collectors.map((p) => ({ reel: p.reel, row: p.row + 1 })),
			sacks: bookEvent.sacks.map((p) => ({ reel: p.reel, row: p.row + 1, value: p.value * 100 })),
			perCollector: bookEvent.perCollector,
			mult: bookEvent.mult,
			amount: bookEvent.amount,
		});
		// The WIN box. The maths writes setTotalWin BEFORE the collection, and in
		// the base game never again for that spin, so the box stopped at the
		// ways win and never counted what the Bandits took (book 671: box $0.40,
		// balance +$2.40). In free spins the next spin's setTotalWin restates the
		// same running total, so adding here only removes a one-spin lag there.
		stateBet.winBookEventAmount += bookEvent.amount;
	},
	// Free spins: this spin's Bandits were counted. A rung adds spins and raises
	// the multiplier on every LATER collection (this spin's was already paid).
	banditMeter: async (bookEvent: BookEventOfType<'banditMeter'>) => {
		stateGame.banditMeter = {
			count: bookEvent.count,
			level: bookEvent.level,
			mult: bookEvent.mult,
			nextAt: bookEvent.nextAt,
		};
		if (bookEvent.levelUp > 0) {
			eventEmitter.broadcast({ type: 'soundLadderUp', level: bookEvent.level });
			await eventEmitter.broadcastAsync({
				type: 'banditLevelUp',
				level: bookEvent.level,
				mult: bookEvent.mult,
				spinsAdded: bookEvent.spinsAdded,
			});
			eventEmitter.broadcast({
				type: 'freeSpinCounterUpdate',
				current: undefined,
				total: bookEvent.totalFs,
			});
			stateUi.freeSpinCounterTotal = bookEvent.totalFs;
		}
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
	// NO freeSpinRetrigger HANDLER, AND THAT IS DELIBERATE.
	//
	// This game has no retriggers. game_config.py keeps the free-game strip FR0
	// free of Scatters entirely — "so a scatter can never land in the feature and
	// appear to do nothing" — so the event cannot be emitted: measured, 0 in 4,000
	// bought features.
	//
	// What used to be here was a full presentation for it: stop the music, ring
	// the bell, hold 3s, three passes of the Scatter shake, then add spins. Dead
	// the day the strip was written, and misleading to anyone reading this file
	// for what the feature can do.
	//
	// If a retrigger is ever added to the maths, createPlayBookUtils logs
	// 'Missing bookEventHandler' for an unhandled event, so it fails loudly in the
	// console rather than silently skipping the round.
	freeSpinEnd: async (bookEvent: BookEventOfType<'freeSpinEnd'>) => {
		const winLevelData = winLevelMap[bookEvent.winLevel as WinLevel];

		await eventEmitter.broadcastAsync({ type: 'uiHide' });
		// gameType is NOT reset here — it moves to the transition's cover below.
		// Resetting it at this point dropped the player back onto the base
		// background while the outro plaque was still counting up their feature
		// win, so by the time the grenade fell the scene had already changed and
		// the blast revealed nothing. The feature should still look like the
		// feature until the blast ends it.
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
		await eventEmitter.broadcastAsync({
			type: 'transition',
			cover: () => {
				stateGame.gameType = 'basegame';
			},
		});
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
	finalWin: async (bookEvent: BookEventOfType<'finalWin'>) => {
		// Safety net: finalWin is the last event of every book, so close anything a
		// feature left open.
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

		if (lastFreeSpinTriggerEvent) await playBookEvent(lastFreeSpinTriggerEvent, { bookEvents });
		if (lastUpdateFreeSpinEvent) playBookEvent(lastUpdateFreeSpinEvent, { bookEvents });
		if (lastSetTotalWinEvent) playBookEvent(lastSetTotalWinEvent, { bookEvents });

		// Rebuild the meter: it is not recoverable from the board, and a resumed
		// round that showed it back at zero would tell the player they had lost a
		// climb they had actually made.
		const lastMeterEvent = findLastBookEvent('banditMeter' as const);
		if (lastMeterEvent) {
			stateGame.banditMeter = {
				count: lastMeterEvent.count,
				level: lastMeterEvent.level,
				mult: lastMeterEvent.mult,
				nextAt: lastMeterEvent.nextAt,
			};
		}
	},
};
