import _ from 'lodash';

import { recordBookEvent, checkIsMultipleRevealEvents, type BookEventHandlerMap } from 'utils-book';
import { stateBet, stateBetDerived, stateUi } from 'state-shared';
import { SECOND } from 'constants-shared/time';
import { waitForTimeout } from 'utils-shared/wait';

import { eventEmitter } from './eventEmitter';
import { playBookEvent } from './utils';
import { winLevelMap, type WinLevel, type WinLevelData } from './winLevelMap';
import { stateGame, stateGameDerived } from './stateGame.svelte';
import type { BookEvent, BookEventOfType, BookEventContext } from './typesBookEvent';
import type { Position } from './types';
import { BOARD_DIMENSIONS } from './constants';
import { featureScaled } from './timeScale';
import config from './config';

// The math emits anticipation[reel] = (scatters landed before that reel) - 1, so
// a value of 1 means two scatters are already on the board and a value of 2
// means three.
//
// Moooo triggers free spins on THREE scatters (game_config.py:118 is
// {3:10, 4:10, 5:10}), and the math arms anticipation at two
// (game_config.py:121-124, min(freespin_triggers) - 1 = 2). This constant used
// to be 3, which threw that away: it was copied verbatim from GoBananas — a
// four-scatter game — along with a comment that said so. Measured over the
// 40,000 published base books weighted by lookUpTable_base_0.csv, the old gate
// teased on 3.49% of spins (1 in 28.7) and left three quarters of actual bonus
// triggers arriving with no build-up at all. At 2 it teases on 6.84% (1 in
// 14.6) and ~83% of triggering spins get a run-up.
//
// Filtering the array here — rather than in utils-slots — keeps the slow reel
// stop and the on-screen tease gated by the same condition, and leaves the
// shared package (and the sibling apps) untouched.
const ANTICIPATION_MIN_SCATTERS = 2;

const gateAnticipation = (anticipation: number[]) =>
	anticipation.map((value) => (value >= ANTICIPATION_MIN_SCATTERS - 1 ? value : 0));

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
	if (stateGame.gameType === 'freegame') {
		eventEmitter.broadcast({ type: 'soundMusic', name: 'bgm_freespin' });
	} else {
		eventEmitter.broadcast({ type: 'soundMusic', name: 'bgm_main' });
	}
	eventEmitter.broadcastAsync({ type: 'uiShow' });
};

// Same idiom as NeonFrames.svelte:64. timeScale() is 1 normally and 2 in turbo
// (state-shared/stateBet.svelte.ts), and it is read at call time rather than
// baked in, so toggling turbo takes effect on the next beat.
//
// The free-spin trigger and retrigger were the largest fixed block left in the
// game: a flat 3s hold plus three symbol passes, unchanged whether the reels
// had taken 3s or 1s to land. Both lines are inherited verbatim from GoBananas
// (:185, :289) and WildParty (:141, :251).
const scaled = (ms: number) => ms / stateBetDerived.timeScale();
const pause = (ms: number) => waitForTimeout(scaled(ms));


// The free-spin trigger and retrigger are feature beats, not grind, so they use
// the gentler turbo scale — see game/timeScale.ts. At the uniform halving the
// 3s hold became 1.5s, which is where "in turbo the free game and the bonus buy
// are a bit too fast" came from: the announcement went past before it had
// registered. It is now ~2.2s in turbo.
const featurePause = (ms: number) => waitForTimeout(featureScaled(ms));

// Symbol passes on the trigger keep their count in turbo. They used to be cut
// from three to two, but each pass is itself shortened now that SymbolWinAnim
// holds for a real duration (480ms, 355ms in turbo under the feature scale), so
// cutting the count as well took the acknowledgement down to a blink.
const featurePasses = (passes: number) => passes;

// ── Present delays, from the Densho teardown (2026-08-26) ───────────────────
//
// Densho's `spinRevealProps` carries a field this game had no equivalent of:
// `presentDelay` (0.5s normal, 0.4s turbo). It is dead air, deliberately, between
// the last reel finishing its bounce and ANYTHING being presented. Its whole
// personality — "does not tease, lets the board settle and then pays attention
// to it" — lives in that half second.
//
// Moooo had none. The board landed and the bell, the mouth, the fill, the value
// and the win lines all arrived on top of the settle, so the one beat the game
// is built around shared a frame with the reels stopping.
//
// It is UNIFORM on purpose, including on dead spins. Making it conditional on
// "is there anything coming" would be cheaper, but the length of the pause would
// then be a tell: the player learns that a long gap means a cow before the cow
// is drawn, and the reveal is spent before it happens.
const PRESENT_DELAY = 500;

// Densho's second delay, from `gridwin`: `after(hasExpand ? 0.5 : 0.2)` before
// the win lines run. A hand with an expanding wild gets 0.3s MORE quiet before
// the award than a hand without one, so the multiplier that just landed is
// allowed to be looked at before the lines start moving over it.
//
// Nothing leaks here — by this point the expansion has already been drawn, so a
// longer pause tells the player only what they can already see.
const AWARD_DELAY = 200;
const AWARD_DELAY_AFTER_EXPAND = 500;

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

		// Cows last exactly one spin — nothing in Moooo is sticky. The math lands
		// them fresh every spin and there is no event that says "the previous
		// cows are gone", so they are cleared as the reels start, before this
		// spin's `newCows` arrives.
		//
		// The Milk Meter is NOT cleared here: it persists for the whole feature,
		// which is the entire point of it, and only `milkMeterInit` resets it.
		stateGame.cows = [];
		stateGame.expandedReels = [];
		stateGame.meterChanged = [];
		eventEmitter.broadcast({ type: 'cowsClear' });

		// Keep the gated magnitudes for this spin. utils-slots only ever tests
		// `> 0` (createEnhanceBoardSpin.ts:56,74) and sets a boolean
		// reelState.anticipating, so the 1-vs-2 distinction — two scatters on the
		// board vs three, i.e. "could still trigger" vs "one symbol away" — is
		// discarded before it reaches a component. Stashing it here is what lets
		// Anticipations/Anticipation tier the tease without touching the shared
		// package.
		const anticipation = gateAnticipation(bookEvent.anticipation);
		stateGame.anticipation = anticipation;

		// Hot Miami pre-showed its Neon Frames here, reading them out of the
		// upcoming events so they appeared while the reels were still turning.
		// Moooo needs none of that: a cow IS a board symbol, written in by the
		// math before the reveal, so it arrives with its reel for free. The bell
		// and the expansion follow as their own beats, which is what the
		// mechanic is meant to feel like.

		await stateGameDerived.enhancedBoard.spin({
			revealEvent: { ...bookEvent, anticipation },
			paddingBoard: config.paddingReels[bookEvent.gameType],
		});
		eventEmitter.broadcast({ type: 'soundScatterCounterClear' });
		// The settle is over. Everything this spin has to say waits here first.
		await pause(PRESENT_DELAY);
	},
	winInfo: async (bookEvent: BookEventOfType<'winInfo'>) => {
		// Let the expansion breathe before the lines run over it — Densho's
		// `after(hasExpand ? 0.5 : 0.2)`. `stateGame.expandedReels` is set by
		// `expandCows`, which the book always emits immediately before this.
		await pause(
			stateGame.expandedReels.length > 0 ? AWARD_DELAY_AFTER_EXPAND : AWARD_DELAY,
		);
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
		await featurePause(3000);
		eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_scatter_win_v2' });
		// Three passes of the scatter shake — extended trigger celebration
		eventEmitter.broadcast({ type: 'scatterBurst', positions: bookEvent.positions });
		for (let pass = 0; pass < featurePasses(3); pass++) {
			await animateSymbols({ positions: bookEvent.positions });
		}
		eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_superfreespin' });
		await eventEmitter.broadcastAsync({ type: 'uiHide' });
		await eventEmitter.broadcastAsync({ type: 'transition' });
		eventEmitter.broadcast({ type: 'freeSpinIntroShow' });
		eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_fs_intro' });
		eventEmitter.broadcast({ type: 'soundMusic', name: 'bgm_freespin' });
		await eventEmitter.broadcastAsync({
			type: 'freeSpinIntroUpdate',
			totalFreeSpins: bookEvent.totalFs,
		});
		stateGame.gameType = 'freegame';
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
	// ── MOOOO cows ────────────────────────────────────────────────────────────
	//
	// The cow is already on the board when this arrives: the math writes it in
	// before the reveal, so it lands with the reel like any other symbol. What
	// this event adds is the BELL — which tier it is carrying.
	//
	// The bell's COLOUR shows now; its VALUE does not. That split is deliberate.
	// Only 58% of landed cows expand, so a cow that shows "100x" and then keeps
	// its mouth shut would read as the game taking something back. Showing the
	// colour keeps the tension the tier is there to create (a gold bell landing
	// is worth leaning forward for) without promising a number that may never be
	// paid. The value arrives with `expandCows`, which is also when the brief's
	// beat sheet puts it: mouth opens, reel fills, then the bell swings and the
	// multiplier lands.
	newCows: async (bookEvent: BookEventOfType<'newCows'>) => {
		if (bookEvent.cows.length === 0) return;
		stateGame.cows = bookEvent.cows.map((cow) => ({ ...cow }));
		eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_multiplier_landing' });
		await eventEmitter.broadcastAsync({ type: 'cowsLand', cows: bookEvent.cows });
	},
	// The mouths that opened.
	//
	// A cow present in the preceding `newCows` but absent here landed and stayed
	// a single symbol, because its reel crossed no win line. That is the
	// reference's conditional-expansion rule and it is the normal case, not a
	// failure: it must not be drawn as a fizzle, dimmed, or greyed out. On a dead
	// spin the cow is the only thing on the board that is doing anything.
	expandCows: async (bookEvent: BookEventOfType<'expandCows'>) => {
		if (bookEvent.reels.length === 0) return;
		stateGame.expandedReels = bookEvent.reels.map((reel) => ({ ...reel }));
		eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_wild_expand' });
		await eventEmitter.broadcastAsync({
			type: 'cowsExpand',
			reels: bookEvent.reels,
			totalMultiplier: bookEvent.totalMultiplier,
		});
	},

	// ── Milk Meter ────────────────────────────────────────────────────────────
	//
	// Opening state of the feature. `superMode` is carried by the book rather
	// than inferred from the bet mode, because Super Free Spins can also be
	// reached from the base game on four scatters — inferring it from the
	// purchase would draw the wrong meters for exactly the player who got there
	// without paying.
	milkMeterInit: async (bookEvent: BookEventOfType<'milkMeterInit'>) => {
		stateGame.meterLevels = [...bookEvent.levels];
		stateGame.meterChanged = [];
		stateGame.superMode = bookEvent.superMode;
		await eventEmitter.broadcastAsync({
			type: 'milkMeterInit',
			levels: bookEvent.levels,
			maxLevel: bookEvent.maxLevel,
			superMode: bookEvent.superMode,
		});
	},
	// A Milk Churn landed and raised a reel's floor for the rest of the feature.
	//
	// The full `levels` array is what gets stored, never `changed` applied to
	// what the client already had. The delta is only for deciding what to
	// animate. Accumulating it instead would mean one missed event desyncs the
	// meters from the maths for the whole round, and the meters are the one thing
	// on screen the player is using to judge what a reel can still pay.
	milkMeterUpdate: async (bookEvent: BookEventOfType<'milkMeterUpdate'>) => {
		stateGame.meterLevels = [...bookEvent.levels];
		stateGame.meterChanged = bookEvent.changed.map((change) => change.reel);
		if (bookEvent.changed.length === 0) return;
		eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_multiplier_update' });
		await eventEmitter.broadcastAsync({
			type: 'milkMeterUpdate',
			changed: bookEvent.changed,
			levels: bookEvent.levels,
			maxLevel: bookEvent.maxLevel,
		});
	},
	updateFreeSpin: async (bookEvent: BookEventOfType<'updateFreeSpin'>) => {
		// updateFreeSpin is the last event of every free spin, so this is where a
		// spin's presentation actually ends. Cows belong to the spin that landed
		// them, so the boundary is here.
		//
		// The Milk Meter is deliberately untouched: it is the one thing in this
		// game that persists across spins, and clearing it here would erase the
		// state the whole feature is built to accumulate.
		stateGame.cows = [];
		stateGame.expandedReels = [];
		eventEmitter.broadcast({ type: 'cowsClear' });
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
		await featurePause(3000);
		eventEmitter.broadcast({ type: 'soundMusic', name: 'bgm_freespin' });
		eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_scatter_win_v2' });
		// Three passes of the scatter shake — extended trigger celebration
		for (let pass = 0; pass < featurePasses(3); pass++) {
			await animateSymbols({ positions: bookEvent.positions });
		}
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
		// NOTE: expandingWildsClear deliberately does NOT fire here — the sticky
		// overlays must keep covering the reveal-board W stacks through the outro
		// and the idle board; the next spin clears them (actor onNewGameStart).
		// The feature is over, so the Milk Meter goes with it — this is the one
		// place it is torn down. Leaving it up would show the outro panel over a
		// set of meters describing a round that has finished.
		stateGame.cows = [];
		stateGame.expandedReels = [];
		stateGame.meterLevels = [];
		stateGame.meterChanged = [];
		stateGame.superMode = false;
		eventEmitter.broadcast({ type: 'cowsClear' });
		eventEmitter.broadcast({ type: 'milkMeterHide' });
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

		// Free-spin counter teardown safety net.
		//
		// The comment here described Hot Miami's superspin: a `prizeWinInfo` event
		// that closed the presentation, ~10% of books landing no coin across three
		// respins, and a respin plaque left frozen on screen. None of it applies —
		// Moooo emits no `prizeWinInfo` anywhere in its books, and has no respins.
		//
		// The line itself is still worth keeping, on its own merits rather than on
		// a borrowed story: `finalWin` is the last event of EVERY book in every
		// mode, so it is the one place guaranteed to run whatever else did or did
		// not happen. `freeSpinEnd` already hides the counter earlier in a normal
		// free game; this catches a round that ended some other way, and it is
		// idempotent.
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

		// Rebuild the Milk Meter.
		//
		// This is the only state in Moooo that survives a spin, so it is the only
		// thing a resume has to reconstruct — and it is the thing that must not be
		// got wrong, because the meters tell the player what each reel can still
		// pay. A resumed round showing level 1 meters on reels that had reached
		// level 3 would be the game lying about its own odds.
		//
		// Replaying in order is enough: `milkMeterInit` sets the floor for the
		// feature and every `milkMeterUpdate` carries the complete `levels` array
		// rather than a delta, so the last one seen IS the current state. Cows are
		// not rebuilt — they last one spin and the spin being resumed into will
		// land its own.
		const lastMeterEvent = [...bookEvents]
			.reverse()
			.find((event) => event.type === 'milkMeterInit' || event.type === 'milkMeterUpdate');
		const lastInit = findLastBookEvent('milkMeterInit' as const);
		if (lastMeterEvent && 'levels' in lastMeterEvent) {
			stateGame.meterLevels = [...lastMeterEvent.levels];
			stateGame.meterChanged = [];
			stateGame.superMode = lastInit ? lastInit.superMode : false;
			eventEmitter.broadcast({
				type: 'milkMeterInit',
				levels: lastMeterEvent.levels,
				maxLevel: lastMeterEvent.maxLevel,
				superMode: stateGame.superMode,
			});
		}
	},
};
