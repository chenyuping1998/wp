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
import { BOARD_DIMENSIONS, INITIAL_BOARD, BIG_WIN_X } from './constants';
import { featureScaled } from './timeScale';
import config from './config';
import { wheelState, animateWheel } from './wheelState.svelte';
import { FEATURE_TIERS } from './featureTiers';

// The math emits anticipation[reel] = (scatters landed before that reel) - 1, so
// a value of 1 means two scatters are already on the board and a value of 2
// means three.
//
// Hot Miami triggers free spins on THREE scatters (game_config.py:118 is
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

// A teasing reel scrolls the ORDINARY strip.
//
// Two attempts at a special strip, both reported as wrong by the user, and the
// second one is the more interesting failure:
//
//   all scatter        copied literally from the reference's `attention`
//                      reelset. Our scatter is a big high-contrast green burst,
//                      so a column of them is a solid slab of green with no reel
//                      left underneath — 「MG 聽牌時後面輪整輪變成 SC」.
//   one in two         interleaved with ordinary symbols to keep it reading as a
//                      reel. Still wrong, and for a reason the first version hid:
//                      at 1-in-2 the column is a REPEATING PAIR, and a scrolling
//                      two-symbol pattern reads as a broken reel rather than as a
//                      dense one — 「假轉變成兩顆有一顆 SC 很奇怪」.
//
// The reference can do it because its scatter is a small flat token and its
// attention reelset is 30 symbols deep, so the density never resolves into a
// pattern the eye can count. Ours is neither, and no density setting fixes that:
// sparse enough not to look patterned is also sparse enough not to look loaded.
//
// So the strip is left alone. The tease is still three things happening at once
// — the reel slows to 1.5x padding at 0.66 speed, the reel lights up, and the
// music ducks through a lowpass — and those three are what the reference's own
// spec lists first. The strip was the fourth, and it is the one that does not
// survive being ported to a board with symbols this large.

// A BOUGHT round does not get a tease.
//
// The feature is already paid for and the trigger is forced, so teasing it is
// theatre about an outcome that was never in doubt — and with the scatter-dense
// strip in place it looks it: every bought round showed whole reels of nothing
// but SCATTER, which is what was reported as 「BUY BONUS 聽牌時整行都是 SC 很怪」.
//
// The reference spec says the same thing in one line: anticipation is off in
// `bonus_buy` mode (and in superTurbo). Measured here, EVERY bought round arms
// anticipation — 3,000 of 3,000 books — so this was not an occasional oddity,
// it was every single purchase.
const isBoughtRound = () => stateBet.activeBetModeKey.toUpperCase() !== 'BASE';

const gateAnticipation = (anticipation: number[]) =>
	isBoughtRound()
		? anticipation.map(() => 0)
		: anticipation.map((value) => (value >= ANTICIPATION_MIN_SCATTERS - 1 ? value : 0));

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

		if (bookEvent.gameType === 'basegame') { wheelState.held = 1; wheelState.visible = false; }

		// Keep the gated magnitudes for this spin. utils-slots only ever tests
		// `> 0` (createEnhanceBoardSpin.ts:56,74) and sets a boolean
		// reelState.anticipating, so the 1-vs-2 distinction — two scatters on the
		// board vs three, i.e. "could still trigger" vs "one symbol away" — is
		// discarded before it reaches a component. Stashing it here is what lets
		// Anticipations/Anticipation tier the tease without touching the shared
		// package.
		const anticipation = gateAnticipation(bookEvent.anticipation);
		stateGame.anticipation = anticipation;

		// What scrolls past while a reel is in motion. The ordinary strip, on
		// teasing reels too — see the note on the tease strip above for why the two
		// special strips were both removed.
		const padding = config.paddingReels[bookEvent.gameType];
		await stateGameDerived.enhancedBoard.spin({
			revealEvent: { ...bookEvent, anticipation },
			paddingBoard: padding,
		});
		eventEmitter.broadcast({ type: 'soundScatterCounterClear' });
	},
	winInfo: async (bookEvent: BookEventOfType<'winInfo'>) => {
		eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_winlevel_small' });

		// How big is THIS volley? The characters' rarer faces (he pushes his
		// sunglasses down, she winks) are gated on it.
		//
		// It has to be the volley's own total, not the round's. `winBookEventAmount`
		// is the running round total, and on the 20,000× book it only becomes big
		// after the last spin has resolved — long after every symbol animation has
		// finished — so a face gated on it never appeared once, on the biggest win
		// in the game. The volley total is also the honest question: this win is
		// what the symbol is reacting to.
		stateGame.currentWinTotal = bookEvent.totalWin;
		if (bookEvent.wins.length > 0) {
			// Same 15× line SymbolWinAnim draws for its own big-win treatment, and
			// the same volley total it reads. One threshold for "this one is worth
			// a fuss" across the board: the symbol and the person beside it should
			// never disagree about whether a win was big.
			const kind = bookEvent.totalWin >= BIG_WIN_X * 100 ? 'winBig' : 'win';
			stateGame.castReaction = { kind, seq: stateGame.castReaction.seq + 1 };
		}

		// Build win line data — each win has a lineIndex from meta
		// The amount and the Frame multiplier travel with the line now.
		//
		// Two reasons, and the second one is a review finding rather than taste.
		// The reference build the user pointed at (MadLab's Nights of Miami)
		// prints the value on the winning cells, and a board that shows what it
		// paid reads as a game rather than as a diagram. And Wild Party's
		// guidelines round opened "symbol payouts do not match the paytable" on a
		// game whose maths was provably right — the reviewer could not reconcile
		// the figure because nothing on screen ever named which line paid what.
		const winLineData = bookEvent.wins.map((win) => ({
			lineIndex: win.meta.lineIndex,
			positions: win.positions,
			symbolCount: win.positions.length,
			win: win.win,
			multiplier: win.meta.multiplier,
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
		stateGame.castReaction = { kind: 'trigger', seq: stateGame.castReaction.seq + 1 };
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
		// 3000 -> 1000, and three passes of the scatter shake -> one.
		//
		// Measured against the Hacksaw spec: their whole non-interactive feature
		// entry is about 3.6 seconds, splash included. This one spent 3.0s holding
		// on the bell and then 2.9s repeating the same 970ms symbol animation three
		// times before the transition had even started — over 7 seconds to say one
		// thing, and the second and third passes say nothing the first did not.
		//
		// The hold is still there because the bell needs somewhere to ring; it is
		// now the length of the bell rather than three times it.
		await featurePause(1000);
		eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_scatter_win_v2' });
		eventEmitter.broadcast({ type: 'scatterBurst', positions: bookEvent.positions });
		await animateSymbols({ positions: bookEvent.positions });
		eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_superfreespin' });
		await eventEmitter.broadcastAsync({ type: 'uiHide' });
		// Returns at FULL BLACK (Transition.svelte). Everything from here to the
		// intro card happens where the player cannot see it, and the transition's
		// own tail reveals the changed board over the following second.
		await eventEmitter.broadcastAsync({ type: 'transition' });

		// IN THE BLACK: become the free game.
		//
		// This used to run after the intro card, which meant the transition's
		// reveal showed the BASE game — same background, same frame — and the
		// switch happened later, in plain sight, behind a card. The spec this was
		// re-timed against does the mode change while the screen is black for
		// exactly this reason: what the player sees come up out of the black
		// should already be the game they just won.
		stateGame.gameType = 'freegame';
		wheelState.held = 1;
		stateGame.stickyWildReels = [];
		eventEmitter.broadcast({ type: 'expandingWildsClear' });
		eventEmitter.broadcast({ type: 'boardFrameGlowShow' });

		// WHICH tier, one event early.
		//
		// The splash panel names the feature and explains it, and it has to know
		// which of the three this is BEFORE it is shown. The book's own `bonusTier`
		// event carries that, but it arrives one event LATER — and the intro below
		// blocks on a player press, so by the time `bonusTier` runs the panel has
		// already been dismissed. Read on a settled board it was always null, which
		// is exactly what the first version of the panel did: nothing.
		//
		// The Scatter count is the tier, by definition — 3, 4 or 5 opens Neon
		// Nights, Sunset Hits or Ocean Drive — and `positions` is the Scatters that
		// triggered it. So the same fact is available here, one event early. The
		// `bonusTier` handler still runs afterwards and still has the last word; it
		// writes the same value.
		//
		// Falls back to leaving it null rather than guessing: a bought round whose
		// book carries no trigger positions gets the plaque without the panel, which
		// is the old behaviour, rather than a panel describing the wrong feature.
		const triggerTier = FEATURE_TIERS.find(
			(entry) => entry.scatters === Math.min(4, bookEvent.positions?.length ?? 3),
		);
		if (triggerTier) stateGame.bonusTier = triggerTier.tier;

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
	multiplierWheel: async (event: BookEventOfType<'multiplierWheel'>) => {
		await animateWheel(event, stateBet.isTurbo);
	},
	updateGlobalMult: async (event: BookEventOfType<'updateGlobalMult'>) => { wheelState.held = event.globalMult; },
	bonusTier: async (event: BookEventOfType<'bonusTier'>) => {
		stateGame.bonusTier = event.tier;
		wheelState.held = event.heldMultiplier ?? 1;
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

		// The outro panel is translucent, so its background is still part of the
		// presentation. Finish the last win volley before showing it: otherwise
		// winningCells keeps most symbols dim and postWin/expanded-W layers leave
		// isolated, ghosted letters behind the TOTAL WIN card.
		stateGame.winningCells = [];
		stateGame.debugWinLineCount = 0;
		eventEmitter.broadcast({ type: 'winLinesHide' });
		eventEmitter.broadcast({ type: 'expandingWildsClear' });
		stateGameDerived.enhancedBoard.settle(stateGameDerived.boardRaw());
		eventEmitter.broadcast({ type: 'boardShow' });
		await eventEmitter.broadcastAsync({ type: 'uiHide' });
		stateGame.stickyWildReels = [];
		// Sticky Frames belong to the free game. Nothing used to remove them here,
		// so whatever was still on the grid rode through the entire outro and only
		// vanished when the next base spin's reveal fired framesClear — a beat far
		// too late, and visibly wrong behind the outro panel.
		stateGame.frames = [];
		eventEmitter.broadcast({ type: 'framesClear' });
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
		// Transition resolves at full black; switch the cast and background here so
		// the reveal returns to MG with the man already restored. Rebuild a complete
		// base board at the same hidden beat: the last free-game board can contain
		// expanded-W stacks whose overlay is being torn down, leaving apparently
		// empty cells if that board is allowed to survive into MG idle.
		stateGame.gameType = 'basegame';
		wheelState.held = 1;
		wheelState.visible = false;
		stateGame.winningCells = [];
		stateGame.stickyWildReels = [];
		eventEmitter.broadcast({ type: 'expandingWildsClear' });
		stateGameDerived.enhancedBoard.settle(INITIAL_BOARD);
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

		const lastBonusTier = findLastBookEvent('bonusTier' as const);
		if (lastBonusTier) stateGame.bonusTier = lastBonusTier.tier;
		const lastWheel = findLastBookEvent('multiplierWheel' as const);
		wheelState.held = lastWheel?.value ?? 1;
		wheelState.visible = false;
	},
};
