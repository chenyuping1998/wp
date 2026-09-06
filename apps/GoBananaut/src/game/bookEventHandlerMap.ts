import _ from 'lodash';

import { recordBookEvent, checkIsMultipleRevealEvents, type BookEventHandlerMap } from 'utils-book';
import { stateBet, stateUi } from 'state-shared';
import { SECOND } from 'constants-shared/time';
import { waitForTimeout } from 'utils-shared/wait';

import { eventEmitter } from './eventEmitter';
import { playBookEvent, boardAfterLastGrowth, rowsAfterLastGrowth } from './utils';
import { winLevelMap, type WinLevel, type WinLevelData } from './winLevelMap';
import { stateGame, stateGameDerived } from './stateGame.svelte';
import type { BookEvent, BookEventOfType, BookEventContext } from './typesBookEvent';
import type { Position } from './types';
import {
	isBoughtMode,
	MAX_ROWS,
	BASE_ROWS,
	BOARD_ROWS_BASE,
	NUM_REELS,
	paddedReelLength,
	HOLD_AND_SPIN_MODE_KEY,
} from './constants';
import config from './config';

// WHAT THE MATH ACTUALLY EMITS, because this was gated against the wrong number.
//
// board.py finds the reel where the anticipation_triggers-th scatter landed and
// then ramps 1, 2, 3 … across every reel after it. `anticipation_triggers` is
// `min(freespin_triggers) - 1`, which in this game is TWO — so the ramp already
// means "two scatters are down and this reel is still live". The value is a
// position in that ramp; it is not a scatter count.
//
// The gate here read it as one. It required `value >= 2`, described as "three
// scatters already on the board", and its comment explained that free spins need
// FOUR — inherited from a generation where the trigger was four. This game
// triggers on THREE, so the rule amounted to: do not tease until the feature has
// already been won. It also dropped the first live reel every time, which on a
// bought round is reel 4 of the three that are still turning.
//
// So the gate keeps only the thing it can legitimately add — nothing. Any reel
// the math marked is a reel where two scatters are down and this one could still
// deliver, which is exactly when a slot should tease. Filtering here rather than
// in utils-slots keeps the slow reel stop and the on-screen tease on the same
// condition, and leaves the shared package (and WildParty) untouched.
const gateAnticipation = (anticipation: number[]) =>
	anticipation.map((value) => (value >= 1 ? value : 0));

// A plain base-game board, sampled from the base padding strips. Used to put the
// reels back after a hold and spin: that mode's board is full of P (coin) and X
// (empty crate) symbols which exist nowhere else, so leaving it up made the
// round look like it had not finished.
const baseIdleBoard = () =>
	(config.paddingReels.basegame as { name: string }[][]).map((strip) => {
		const start = Math.floor(Math.random() * strip.length);
		// BASELINE rows, not BOARD_DIMENSIONS.y. The box is six rows tall but an
		// idle base-game board is four, and building this at the box's height would
		// hand utils-slots an eight-symbol column for a six-symbol window — the
		// reel would show padding as if it were board.
		return Array.from(
			{ length: paddedReelLength(BASE_ROWS) },
			(_, i) => strip[(start + i) % strip.length],
		);
	});

// The winLevel of the setWin the math emitted this round, or null if it emitted
// none. finalWin reuses it so the hold and spin total-win plaque is graded by the
// math's own classification instead of a locally invented one.
let lastWinLevel: WinLevel | null = null;

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
	// Decided by the SCENE, never by the bet mode.
	//
	// The test used to be `activeBetModeKey === 'SUPERSPIN'`, which stays true for
	// the whole round including its ending — so after a hold and spin finished and the
	// board was already back to base game, the fast free-game bed kept playing over
	// it. The mode you bought is not where you are; gameType is.
	const onFeatureScene = stateGame.gameType === 'freegame' || stateGame.gameType === 'holdandspin';
	eventEmitter.broadcast({
		type: 'soundMusic',
		name: onFeatureScene ? 'bgm_freespin' : 'bgm_main',
	});
	eventEmitter.broadcastAsync({ type: 'uiShow' });
};

const animateSymbols = async ({ positions }: { positions: Position[] }) => {
	// Only animate symbols in visible rows — padding rows have no oncomplete
	// callback and would freeze the game forever.
	//
	// Bounded PER REEL: the maths sends positions on the board it scored, so a
	// reel still at four rows never carries a row 5, but bounding everything by
	// the six-row box would let one through if it ever did.
	const visiblePositions = positions.filter(
		(p) => p.row >= 1 && p.row <= (stateGame.growRows[p.reel] ?? BASE_ROWS),
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

		// Entering hold and spin gets the same grenade the free game gets.
		//
		// It had none: this line flipped gameType and the hold-and-spin scene
		// simply replaced the base board mid-spin, while buying free spins got a
		// full scatter celebration and a blast. Same money, two completely
		// different ways of arriving — which is the part that read as broken.
		//
		// The condition is true only on a round's FIRST hold and spin reveal: respins
		// 2 and 3 already have gameType 'hold and spin', and the round resets it to
		// 'basegame' on the way out (freeSpinEnd's cover and the finalWin safety
		// net), so the next buy trips it again.
		if (bookEvent.gameType === 'holdandspin' && stateGame.gameType !== 'holdandspin') {
			await eventEmitter.broadcastAsync({
				type: 'transition',
				cover: () => {
					stateGame.gameType = bookEvent.gameType;
					// Growth does not carry into the prize board, for the same reason it
					// does not carry into the free game: this is a different board. It
					// is also a board with nothing to stretch — hold and spin pays
					// coins, not ways — so a tall reel left standing here is a shape
					// over a mechanic that no longer exists. Buying the 50x straight
					// off a stretched base spin left the board ragged over the coins.
					stateGame.growRows = [...BOARD_ROWS_BASE];
					stateGame.growMultipliers = Array(NUM_REELS).fill(1);
					stateGame.growSteps = 0;
					eventEmitter.broadcast({ type: 'reelGrowClear' });
					// Raised here rather than by updateFreeSpin, so the scene and the
					// respin plaque arrive on the same frame the flash clears.
					eventEmitter.broadcast({ type: 'freeSpinCounterShow' });
					stateUi.freeSpinCounterShow = true;
				},
			});
		} else {
			stateGame.gameType = bookEvent.gameType;
		}

		// The board's SHAPE is sticky in the free game and cleared in the base
		// game, and that difference is the mechanic — so this cannot simply reset.
		//
		// A base-game spin starts from the baseline every time: the counter clears,
		// and the reels have to be back at four rows BEFORE they are released, or
		// the spin pads a six-symbol strip into a four-row window.
		//
		// A free-game spin keeps whatever height the run has earned. Its growReels
		// event will raise it further if this spin's markers do; until then the
		// reels spin at the height they already are.
		if (stateGame.gameType !== 'freegame') {
			stateGame.growRows = [...BOARD_ROWS_BASE];
			stateGame.growMultipliers = Array(NUM_REELS).fill(1);
			stateGame.growSteps = 0;
			// Cancels any stretch still resolving. That handler awaits across four
			// phases and only then reshapes the board, so without this a stretch
			// interrupted by the next spin wakes up later and settles the previous
			// round's shape onto the current one.
			eventEmitter.broadcast({ type: 'reelGrowClear' });
		}

		// THE BOARD IS THE AUTHORITY ON ITS OWN HEIGHT, and until now nothing read
		// it. growRows only ever moved when a growReels event moved it, which is
		// fine for a round that climbs from the baseline and wrong for one that
		// does not: a bought tier OPENS part-way up the ladder (buy_start_steps),
		// so bonus300's first free spin arrives with reel 1 already six rows tall
		// and no growth event to announce it. The client kept growRows at four,
		// drew a four-row window over a six-row column, and the tier the player
		// paid 300x for opened looking exactly like the 100x one.
		//
		// Taken from the reveal rather than from config.betModes[…].start_steps:
		// both would be right here, and only one of them cannot disagree with the
		// board that is about to be drawn. It also covers the free game's later
		// spins for free — they arrive at whatever height the run has reached.
		//
		// Hold and spin is excluded: its board is a prize grid that has nothing to
		// do with this ladder, and the transition above has just deliberately put
		// the heights back to the baseline.
		if (bookEvent.gameType !== 'holdandspin') {
			stateGame.growRows = bookEvent.board.map((reel) =>
				// a padded column is one pad, the rows, one pad
				Math.max(BASE_ROWS, Math.min(MAX_ROWS, reel.length - 2)),
			);
		}

		await stateGameDerived.enhancedBoard.spin({
			revealEvent: { ...bookEvent, anticipation: gateAnticipation(bookEvent.anticipation) },
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

		// The mascot's biggest reaction goes on the rare ways in: four or more
		// Scatters, OR a bought round. Counted here rather than in the component:
		// the count is a property of this book event, and a component that had to
		// go looking for it would be reaching across the game to find something it
		// was never handed.
		//
		// THE BUY CLAUSE IS NOT A FLOURISH, it is a regression fix. The test used
		// to be `>= 4` alone, which worked while a bought round forced FIVE
		// scatters onto the trigger board. It now forces exactly three — because
		// three is what the paytable pays the eight spins for — and the side effect
		// was that the most expensive entry in the game became the only one with no
		// reaction at all.
		//
		// It runs during the 3s bell hold, which is the only stretch of the trigger
		// long enough to watch him do it.
		if (bookEvent.positions.length >= 4 || isBoughtMode(stateBet.activeBetModeKey)) {
			eventEmitter.broadcast({ type: 'mascotChestBeat' });
		}
		await waitForTimeout(3000);
		eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_scatter_win_v2' });
		// Three passes of the scatter shake — extended trigger celebration
		eventEmitter.broadcast({ type: 'scatterBurst', positions: bookEvent.positions });
		await animateSymbols({ positions: bookEvent.positions });
		await animateSymbols({ positions: bookEvent.positions });
		await animateSymbols({ positions: bookEvent.positions });
		eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_superfreespin' });
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
				// Growth does not carry in from the base game — the maths resets it at
				// the top of run_freespin for the same reason: the spin that triggered
				// the feature has already been paid, and letting its markers seed the
				// counter would make the feature depend on the trigger board.
				//
				// A bought tier's head start is not applied here either. It arrives as
				// the feature's first growReels event, so the client is told the shape
				// rather than having to know each tier's starting step.
				stateGame.growRows = [...BOARD_ROWS_BASE];
				stateGame.growMultipliers = Array(NUM_REELS).fill(1);
				stateGame.growSteps = 0;
				eventEmitter.broadcast({ type: 'reelGrowClear' });
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
	// The markers fly off, leaving the ordinary symbols underneath.
	//
	// First of the two events that turn the revealed board into the scored one.
	// The reveal has already landed the board the reels stopped on, markers and
	// all; this is the moment they leave.
	growMarkers: async (bookEvent: BookEventOfType<'growMarkers'>) => {
		if (bookEvent.markers.length === 0) return;
		await eventEmitter.broadcastAsync({
			type: 'growMarkersLift',
			markers: bookEvent.markers,
		});
	},

	// The stretch. Reels grow taller, left to right, and the new cells slide in.
	//
	// THE STATE IS NOT SET HERE. ReelGrow applies growRows and the new symbols at
	// the moment its plume has the reel covered, so the board is never seen
	// changing shape. Setting them here instead makes the two new cells pop in on
	// the first frame and the animation becomes decoration over a change that has
	// already happened — the exact failure Boomana's blast documents having made
	// once, where a white flash was transparent for most of its life and the swap
	// read as one graphic replacing another.
	//
	// maxSteps is safe to set now: nothing draws from it during the animation.
	//
	// The write-back after the await is a BACKSTOP, not the mechanism. If ReelGrow
	// is unmounted, or the round is being replayed with animation skipped, nothing
	// would otherwise move the board to the shape the maths scored.
	growReels: async (bookEvent: BookEventOfType<'growReels'>) => {
		stateGame.growMaxSteps = bookEvent.maxSteps;
		await eventEmitter.broadcastAsync({
			type: 'reelsGrow',
			rows: bookEvent.rows,
			newCells: bookEvent.newCells,
			multipliers: bookEvent.reelMultipliers,
			steps: bookEvent.steps,
			maxSteps: bookEvent.maxSteps,
			full: bookEvent.steps >= bookEvent.maxSteps,
		});
		stateGame.growRows = [...bookEvent.rows];
		stateGame.growMultipliers = [...bookEvent.reelMultipliers];
		stateGame.growSteps = bookEvent.steps;
	},

	// GoBananas hold and spin: new prize coins stick to the board — every new coin
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
	// GoBananas hold and spin: no spins left — tally every coin stuck to the board.
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
		// A hold-and-spin round's FIRST updateFreeSpin arrives before its first reveal —
		// the maths calls update_freespin() and only then draws the board — so
		// showing the plaque here put "3 respins" on screen before the grenade had
		// even been thrown. Hold it back and let the transition's cover raise it
		// together with the board.
		//
		// The test is whether this round's scene is up yet. In the free game it
		// always is by now: freeSpinTrigger's cover sets gameType to 'freegame'
		// before any updateFreeSpin. Only a hold and spin entry is still sitting on the
		// base-game scene at this point.
		const sceneNotUpYet = stateGame.gameType === 'basegame';
		if (!sceneNotUpYet) {
			eventEmitter.broadcast({ type: 'freeSpinCounterShow' });
			stateUi.freeSpinCounterShow = true;
		}
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
		// gameType is NOT reset here — it moves to the transition's cover below.
		// Resetting it at this point dropped the player back onto the base
		// background while the outro plaque was still counting up their feature
		// win, so by the time the grenade fell the scene had already changed and
		// the blast revealed nothing. The feature should still look like the
		// feature until the blast ends it.
		// NOTE: the board's HEIGHT deliberately stays as it was. The stretched
		// reels must keep dressing the board through the outro and the idle board
		// that follows — collapsing them the instant the feature ends would take
		// the run's whole climb off screen before the player has been paid for it.
		// The next base spin resets it (see the reveal handler).
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
		// Every hold-and-spin round ends on the same TOTAL WIN plaque the free game
		// ends on, whatever it paid — including nothing. Superspin has no
		// round-end event of its own (base and bonus close on freeSpinEnd), so
		// this is the only place that can guarantee it.
		if (stateBet.activeBetModeKey === HOLD_AND_SPIN_MODE_KEY) {
			// A capped round never emits setWin at all, so the single best result
			// in the mode would otherwise reach the plaque with no celebration in
			// front of it. Verified against books_hold and spin.jsonl.zst: exactly the
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

			// Back to the base game — but inside the transition's cover, not before
			// it. The plaque is already hidden by this point, so swapping here used
			// to happen in the open: the coin board snapped to the base board, and
			// only then did the grenade start its 800ms fall. The blast covered a
			// change the player had already watched.
			//
			// Doing it in `cover` gives the sequence the round actually wants:
			// hold and spin board -> grenade falls on it -> blast -> base board.
			await eventEmitter.broadcastAsync({
				type: 'transition',
				cover: () => {
					stateGame.stickyPrizes = [];
					eventEmitter.broadcast({ type: 'stickyPrizesClear' });
					stateGame.gameType = 'basegame';
					stateGameDerived.enhancedBoard.settle(baseIdleBoard());
					// The bed changes on the same frame as the scene. winLevelSoundsStop
					// ran earlier, while gameType was still 'hold and spin', so it correctly
					// chose the feature bed then — this is the handover back.
					eventEmitter.broadcast({ type: 'soundMusic', name: 'bgm_main' });
				},
			});
			await eventEmitter.broadcastAsync({ type: 'uiShow' });
		}
		lastWinLevel = null;

		// Superspin teardown safety net.
		//
		// The whole hold and spin presentation used to be closed inside prizeWinInfo,
		// but the math only emits prizeWinInfo (and setWin) when something was
		// actually won. ~10% of hold and spin books land no coin at all across all
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
		// freeSpinEnd, which hold and spin books never contain. It therefore stayed
		// 'hold and spin' after the round, and the next base spin's preSpin looked up
		// config.paddingReels['hold and spin'] — a key that does not exist — so it
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

		// Rebuild the meter AND the board.
		//
		// The comment here used to say the board needed no rebuilding because the
		// reveal already contained the blasted symbols. That was true under the
		// original event order and stopped being true the moment the reveal was
		// moved BEFORE the blast so the client would have something to explode
		// from — after which a resumed round came back showing the pre-blast reel,
		// canister and all, on a board that had already been paid.
		// SHAPE BEFORE SYMBOLS. The reels lay themselves out per reel from
		// growRows, so settling a six-symbol column while growRows still says four
		// draws it into a four-row window and the extra cells are culled. Restore
		// the heights first, then hand over the board.
		const restoredRows = rowsAfterLastGrowth(bookEvents);
		if (restoredRows) stateGame.growRows = [...restoredRows];

		const restored = boardAfterLastGrowth(bookEvents);
		if (restored) stateGameDerived.enhancedBoard.settle(restored);

		// The meter and the doubling are not recoverable from the board at all. A
		// resumed round showing the counter back at 0 would tell the player they
		// had lost a climb they had actually made, and one showing multipliers of 1
		// on stretched reels would misstate what the next win is worth.
		const lastGrowEvent = findLastBookEvent('growReels' as const);
		if (lastGrowEvent) {
			stateGame.growMultipliers = [...lastGrowEvent.reelMultipliers];
			stateGame.growSteps = lastGrowEvent.steps;
			stateGame.growMaxSteps = lastGrowEvent.maxSteps;
		}

		// Rebuild hold and spin sticky prize coins (every newStickySymbols accumulates).
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
