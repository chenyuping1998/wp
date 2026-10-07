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
import { BOARD_DIMENSIONS, HOLD_AND_SPIN_MODE_KEY } from './constants';
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
	// the whole round including its ending — so after a superspin finished and the
	// board was already back to base game, the fast free-game bed kept playing over
	// it. The mode you bought is not where you are; gameType is.
	const onFeatureScene = stateGame.gameType === 'freegame' || stateGame.gameType === 'superspin';
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

		// Entering superspin gets the same grenade the free game gets.
		//
		// It had none: this line flipped gameType and the hold-and-spin scene
		// simply replaced the base board mid-spin, while buying free spins got a
		// full scatter celebration and a blast. Same money, two completely
		// different ways of arriving — which is the part that read as broken.
		//
		// The condition is true only on a round's FIRST superspin reveal: respins
		// 2 and 3 already have gameType 'superspin', and the round resets it to
		// 'basegame' on the way out (freeSpinEnd's cover and the finalWin safety
		// net), so the next buy trips it again.
		if (bookEvent.gameType === 'superspin' && stateGame.gameType !== 'superspin') {
			await eventEmitter.broadcastAsync({
				type: 'transition',
				cover: () => {
					stateGame.gameType = bookEvent.gameType;
					// Splits do not carry into the prize board, for the same reason they
					// do not carry into the free game: this is a different board. It is
					// also a board with nothing to split — hold and spin pays coins, not
					// ways — so a cut left standing here is decoration over a mechanic
					// that no longer exists. Buying the 50x straight off a split base
					// spin left the gold cut lines drawn down the coin board.
					stateGame.splitReels = [];
					eventEmitter.broadcast({ type: 'reelSplitClear' });
					// Raised here rather than by updateFreeSpin, so the scene and the
					// respin plaque arrive on the same frame the flash clears.
					eventEmitter.broadcast({ type: 'freeSpinCounterShow' });
					stateUi.freeSpinCounterShow = true;
				},
			});
		} else {
			stateGame.gameType = bookEvent.gameType;
		}

		// Drop the previous spin's cuts HERE, one line before the reels are
		// released, so the board never shows an un-splitting reel standing still.
		// The base game's splits last a single spin; the feature's stick, and its
		// own splitReels event re-establishes them as the new board lands.
		if (bookEvent.gameType === 'basegame') {
			stateGame.splitReels = [];
			eventEmitter.broadcast({ type: 'reelSplitClear' });
		}

		// Cuts still standing at this point were made on an earlier spin.
		eventEmitter.broadcast({ type: 'reelSplitAge' });

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

		// Four or more Scatters is the rare way in — three is the ordinary one — so
		// that is where the mascot's biggest reaction goes. Counted here rather
		// than in the component: the count is a property of this book event, and a
		// component that had to go looking for it would be reaching across the game
		// to find something it was never handed.
		//
		// It runs during the 3s bell hold, which is the only stretch of the trigger
		// long enough to watch him do it.
		if (bookEvent.positions.length >= 4) {
			eventEmitter.broadcast({ type: 'mascotScatterSlash' });
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
				// Splits do not carry in from the base game — the maths resets them
				// at the top of run_freespin for the same reason. A bought tier's
				// starting cuts arrive as the feature's first splitReels event.
				stateGame.splitReels = [];
				eventEmitter.broadcast({ type: 'reelSplitClear' });
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
		// current: 1, NOT undefined.
		//
		// The counter component holds `current` and `total` across rounds, and
		// `undefined` means "leave it alone" — so a new feature raised the plaque
		// still carrying the spin number the LAST one finished on. It renders
		// min(current, total) / total, so a round that ended on 13 opened the next
		// one reading "12 / 12": the feature announced itself as already over.
		// Certification reported exactly this.
		//
		// 1 is the value the first updateFreeSpin would set anyway (it sends
		// amount + 1, and the first spin's amount is 0). Setting it here just
		// closes the window between raising the plaque and that event arriving —
		// a window the intro plaque, uiShow and drawerFold all sit inside.
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
	// Delta: a Machete landed and cut its reel. Every paying symbol on that reel
	// now counts twice towards the ways.
	//
	// `newReels` is animated, `allReels` is state. In the base game they are equal
	// and the cut lasts one spin. In the feature cuts stick, so only the new ones
	// get the chop animation while `allReels` is what the board must actually be
	// showing — replaying the animation for reels cut three spins ago would say
	// "this just happened" about something that did not.
	//
	// The finale spin cuts every remaining reel at once; it gets its own sound
	// because it is the feature's ending, not another machete.
	splitReels: async (bookEvent: BookEventOfType<'splitReels'>) => {
		stateGame.splitReels = bookEvent.allReels;
		if (bookEvent.newReels.length === 0) return;
		// The cue used to be raised here AND again inside ReelSplits for every reel,
		// so a two-reel split played it three times on one frame. ReelSplits owns it
		// now, because only ReelSplits knows when the blade is actually through —
		// the impact has to land on the strike, not on the wind-up.
		await Promise.all(
			bookEvent.newReels.map((reel, index) =>
				eventEmitter.broadcastAsync({
					type: 'reelSplit',
					reel,
					finale: bookEvent.finale,
					lead: index === 0,
				}),
			),
		);
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
		// A superspin round's FIRST updateFreeSpin arrives before its first reveal —
		// the maths calls update_freespin() and only then draws the board — so
		// showing the plaque here put "3 respins" on screen before the grenade had
		// even been thrown. Hold it back and let the transition's cover raise it
		// together with the board.
		//
		// The test is whether this round's scene is up yet. In the free game it
		// always is by now: freeSpinTrigger's cover sets gameType to 'freegame'
		// before any updateFreeSpin. Only a superspin entry is still sitting on the
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

		// The plaque says TOTAL WIN, so it must show what the ROUND paid.
		//
		// `bookEvent.amount` is not that. The math SDK builds this event from
		// `win_manager.freegame_wins` (src/events/events.py, freespin_end_event),
		// which counts the free spins ALONE — the win on the base spin that
		// triggered them is left out. Book bonus200 #9103 is the reported case:
		// the trigger paid 20, the free spins paid 5280, finalWin is 5300, and the
		// plaque read 52.80 against a 53.00 payout. It is not a rare shape either:
		// across the published books ~36% of feature rounds trigger off a paying
		// spin and were under-reporting.
		//
		// `stateBet.winBookEventAmount` carries the last setTotalWin, which is the
		// running ROUND total and — verified over every published book in all five
		// modes — always equals finalWin at this point. The max() is a floor, not
		// arithmetic: a resumed round that somehow reached here without a
		// setTotalWin must still not show less than the feature paid.
		const roundTotalAmount = Math.max(bookEvent.amount, stateBet.winBookEventAmount);

		await eventEmitter.broadcastAsync({ type: 'uiHide' });
		// gameType is NOT reset here — it moves to the transition's cover below.
		// Resetting it at this point dropped the player back onto the base
		// background while the outro plaque was still counting up their feature
		// win, so by the time the grenade fell the scene had already changed and
		// the blast revealed nothing. The feature should still look like the
		// feature until the blast ends it.
		stateGame.splitReels = [];
		// NOTE: reelSplitClear deliberately does NOT fire here — the split overlays
		// must keep dressing the board through the outro and the idle board that
		// follows; the next spin clears them (actor onNewGameStart).
		eventEmitter.broadcast({ type: 'boardFrameGlowHide' });
		eventEmitter.broadcast({ type: 'freeSpinOutroShow' });
		eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_youwon_panel' });
		winLevelSoundsPlay({ winLevelData });
		await eventEmitter.broadcastAsync({
			type: 'freeSpinOutroCountUp',
			amount: roundTotalAmount,
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
		// Every superspin round ends on the same TOTAL WIN plaque the free game
		// ends on, whatever it paid — including nothing. Superspin has no
		// round-end event of its own (base and bonus close on freeSpinEnd), so
		// this is the only place that can guarantee it.
		if (stateBet.activeBetModeKey === HOLD_AND_SPIN_MODE_KEY) {
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

			// Back to the base game — but inside the transition's cover, not before
			// it. The plaque is already hidden by this point, so swapping here used
			// to happen in the open: the coin board snapped to the base board, and
			// only then did the grenade start its 800ms fall. The blast covered a
			// change the player had already watched.
			//
			// Doing it in `cover` gives the sequence the round actually wants:
			// superspin board -> grenade falls on it -> blast -> base board.
			await eventEmitter.broadcastAsync({
				type: 'transition',
				cover: () => {
					stateGame.stickyPrizes = [];
					eventEmitter.broadcast({ type: 'stickyPrizesClear' });
					stateGame.gameType = 'basegame';
					stateGameDerived.enhancedBoard.settle(baseIdleBoard());
					// The bed changes on the same frame as the scene. winLevelSoundsStop
					// ran earlier, while gameType was still 'superspin', so it correctly
					// chose the feature bed then — this is the handover back.
					eventEmitter.broadcast({ type: 'soundMusic', name: 'bgm_main' });
				},
			});
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

		// Rebuild split reels. Simpler than the gen-2 sticky-wild rebuild it
		// replaces, because splitReels already carries the full state: the LAST
		// event's allReels is the answer, so there is nothing to accumulate and no
		// ordering subtlety to get wrong.
		const lastSplitEvent = findLastBookEvent('splitReels' as const);
		if (lastSplitEvent && lastSplitEvent.allReels.length > 0) {
			stateGame.splitReels = lastSplitEvent.allReels;
			eventEmitter.broadcast({ type: 'reelSplitRestore', reels: lastSplitEvent.allReels });
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
