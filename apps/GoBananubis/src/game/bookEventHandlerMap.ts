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

// The math emits anticipation[reel] = (scatters landed before that reel) - 1, so
// a value of 1 means the tease starts on the *second* scatter.
//
// ONE AWAY FROM THE TRIGGER, and the trigger is the SMALLEST count that awards
// spins — three. So a reel teases once two Scatters are already down. This used
// to require three already down, which was written when the shipped game only
// ever triggered on four or more; against a three-Scatter trigger it means the
// tease fires on boards that have already won, which is the one moment it has
// nothing left to say.
//
// Read from the maths rather than fixed, so it follows freespin_triggers.
// Filtering the array here — rather than in utils-slots — keeps the slow reel
// stop and the on-screen tease gated by the same condition, and leaves the
// shared package (and WildParty) untouched.
const ANTICIPATION_MIN_SCATTERS =
	Math.min(...Object.keys(config.scatterSpins ?? { 3: 8 }).map(Number)) - 1;

// A BOUGHT ROUND HAS NOTHING TO ANTICIPATE.
//
// Every buy forces its own Scatter count (bonus four, superbonus five — see each
// mode's `scatter_triggers`), so the feature is not in doubt from the moment the
// player confirms the price. The tease is a question the round has already
// answered, and it asks it on the last three reels of every single buy: three
// slow stops, a rising loop under them, and a held beat before each one.
//
// So it is switched off there rather than shortened. Shortening keeps the shape
// of a question and just rushes it, which reads as the game being impatient with
// its own animation; removing it lets the reels stop at their normal pace and
// hands the whole moment to the bell and the mascot, which are the parts that
// are actually about arriving.
//
// The base game is untouched: that is where a Scatter landing is genuinely news.
// Upper-cased before comparing, and asking whether it is NOT base rather than
// whether it is one of the buys. stateBet defaults the key to 'BASE' but
// ResumeBet sets it from whatever the RGS hands back, and stateBet itself tries
// the key both upper- and lower-cased when it looks up the mode meta — so the
// casing is not guaranteed. A bare === 'BASE' would silently turn the base
// game's anticipation off on any resumed round the server spelled in lower case.
const isBoughtRound = () => String(stateBet.activeBetModeKey).toUpperCase() !== 'BASE';

const gateAnticipation = (anticipation: number[]) =>
	isBoughtRound()
		? anticipation.map(() => 0)
		: anticipation.map((value) => (value >= ANTICIPATION_MIN_SCATTERS - 1 ? value : 0));

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

		// Entering superspin gets the same scarab the free game gets.
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
					// Raised here rather than by updateFreeSpin, so the scene and the
					// respin plaque arrive on the same frame the flash clears.
					eventEmitter.broadcast({ type: 'freeSpinCounterShow' });
					stateUi.freeSpinCounterShow = true;
				},
			});
		} else {
			stateGame.gameType = bookEvent.gameType;
		}

		// The previous spin's Scatter holds go out with the board that carried
		// them, before this one starts dropping symbols onto it.
		eventEmitter.broadcast({ type: 'scatterLandClear' });

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

		// Build win line data — each win has a lineIndex from meta
		const winLineData = bookEvent.wins.map((win) => ({
			lineIndex: win.meta.lineIndex,
			positions: win.positions,
			symbolCount: win.positions.length,
		}));

		// Every winning line runs its scarab at once; free game and turbo use the
		// short timing. WinLines owns the symbol win animations too — it fires them
		// reel by reel in each scarab's wake (and dedupes positions shared between
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
	freeSpinTrigger: async (
		bookEvent: BookEventOfType<'freeSpinTrigger'>,
		{ bookEvents }: BookEventContext,
	) => {
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

		// EVERY trigger, not four-or-more.
		//
		// This used to be gated on `positions.length >= 4`, written when four was
		// the smallest count the shipped game awarded. Three triggers now, and it
		// is 98.6% of base entries — so the gate had quietly turned the mascot's
		// biggest reaction into something almost nobody would ever see, and the
		// two buys would have been the only reliable way to see it.
		//
		// It runs during the bell hold, which is the only stretch of the trigger
		// long enough to watch him do it.
		eventEmitter.broadcast({ type: 'mascotChestBeat' });
		// The hold is the length of the chest beat, not a round number. It was
		// 3000ms against a 2.44s animation, so every trigger ended on half a second
		// of a character standing still with nothing else happening — the one gap
		// in the sequence where the game had stopped.
		await waitForTimeout(2450);
		eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_scatter_win_v2' });
		// TWO passes of the scatter shake, not three.
		//
		// Three was padding: the same 900ms animation, three times, with nothing
		// changing between them. Two reads as an emphasis — the burst, then the
		// symbols answering it twice — and the second is where the blast now
		// arrives instead of after a third repeat nobody was still watching.
		eventEmitter.broadcast({ type: 'scatterBurst', positions: bookEvent.positions });
		await animateSymbols({ positions: bookEvent.positions });
		await animateSymbols({ positions: bookEvent.positions });
		eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_superfreespin' });
		await eventEmitter.broadcastAsync({ type: 'uiHide' });
		// Enter the feature inside the blast's white-out. The swap used to happen
		// after the intro plaque had already counted up, which meant the blast
		// cleared onto the BASE scene and the background only changed later, hidden
		// behind the plaque. Now the scarab falls on the base board and the flash
		// reveals the free game — which is what the transition is for.
		await eventEmitter.broadcastAsync({
			type: 'transition',
			cover: () => {
				stateGame.gameType = 'freegame';
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

		// READ THE SEAL — see MysteryOracle.svelte.
		//
		// The run holds one mystery symbol for every tablet it opens, and the
		// maths has already chosen it — it is not in THIS event, because
		// assign_mystery_symbols draws it lazily on the run's first sealed spin.
		// So it is read out of the BOOK, from the first mysteryReveal after this
		// trigger, the same way Go Bananas Boat reads its cargo ahead.
		//
		// Reading ahead is safe: the whole book has already arrived by the time
		// any of it is played, and this is the one moment the client knows
		// something the player has not been shown yet.
		//
		// Skipped when there is none — a run whose every spin lands zero tablets
		// is vanishingly rare, and a client-side stand-in would name a seal the
		// round never actually casts.
		const firstSeal = _.find(
			bookEvents.slice(bookEvents.indexOf(bookEvent) + 1),
			(event) => event?.type === 'mysteryReveal',
		) as BookEventOfType<'mysteryReveal'> | undefined;
		if (firstSeal) {
			await eventEmitter.broadcastAsync({ type: 'mysteryOracle', symbol: firstSeal.symbol });
		}

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
	// Go Bananubis: the sealed tablets crack, and every one of them is the same
	// symbol. Awaited, not fired and forgotten — the win lines that follow are
	// read off the revealed board, so playing them while the tablets were still
	// closed would light up cells the player has not been shown yet.
	mysteryReveal: async (bookEvent: BookEventOfType<'mysteryReveal'>) => {
		if (bookEvent.positions.length === 0 && bookEvent.held.length === 0) return;
		await eventEmitter.broadcastAsync({
			type: 'mysteryReveal',
			symbol: bookEvent.symbol,
			positions: bookEvent.positions,
			held: bookEvent.held,
		});
	},
	// GoBananas free game: a Wild landed and expands to fill its reel — 悟空
	// Which reels are already locked, sent before each free-spin reveal. It drove
	// the multiplier climb until that ladder was removed; it now only reconciles
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
		// showing the plaque here put "3 respins" on screen before the scarab had
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
		// The same bell as the entrance, SHORTER THAN THE ENTRANCE.
		//
		// It was an exact copy of the trigger — a 3s hold and three passes of the
		// shake, about 5.7s — and it happens in the middle of a run that is already
		// paced tightly, sometimes more than once. An entrance can stop the game;
		// an addition to something already running cannot, or the feature spends
		// its time announcing itself instead of playing.
		//
		// Half the hold and two passes: still the bell, still the symbols
		// answering, about 3.4s.
		eventEmitter.broadcast({ type: 'soundStop', name: 'bgm_freespin' });
		eventEmitter.broadcast({ type: 'soundStop', name: 'sfx_anticipation' });
		eventEmitter.broadcast({ type: 'soundFreeGameBell' });
		await waitForTimeout(1600);
		eventEmitter.broadcast({ type: 'soundMusic', name: 'bgm_freespin' });
		eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_scatter_win_v2' });
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
		// win, so by the time the scarab fell the scene had already changed and
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

			// Back to the base game — but inside the transition's cover, not before
			// it. The plaque is already hidden by this point, so swapping here used
			// to happen in the open: the coin board snapped to the base board, and
			// only then did the scarab start its 800ms fall. The blast covered a
			// change the player had already watched.
			//
			// Doing it in `cover` gives the sequence the round actually wants:
			// superspin board -> scarab falls on it -> blast -> base board.
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

		// Re-apply the tablet reveal, if the spin being restored had one.
		//
		// This is now the ONLY board state a resumed round has to rebuild. It used
		// to sit beside a block that restored sticky expanded wilds; those are
		// gone, and their multiplier lives on the tablets instead.
		//
		// The board is rebuilt from the last `reveal` event, whose board still
		// holds M — that is the point of the two-event split, and it means a
		// resumed round would otherwise come back showing sealed tablets that
		// never open, with win lines running through them. Only a mysteryReveal
		// AFTER the last reveal belongs to the board being restored; an earlier
		// one described a board that has since been spun away.
		const lastRevealIndex = _.findLastIndex(bookEvents, (event) => event.type === 'reveal');
		const mysteryToRestore = _.findLast(
			bookEvents,
			(event, index) => event.type === 'mysteryReveal' && index > lastRevealIndex,
		) as BookEventOfType<'mysteryReveal'> | undefined;
		if (mysteryToRestore) {
			for (const position of mysteryToRestore.held) {
				const reelSymbol = stateGame.board[position.reel]?.reelState.symbols[position.row];
				if (!reelSymbol) continue;
				reelSymbol.rawSymbol = {
					...reelSymbol.rawSymbol,
					name: mysteryToRestore.symbol,
					multiplier: position.mult,
				};
			}
			// The overlay is told explicitly now — it stopped reading the reveal
			// event when the reveal took ownership of the order things appear in
			// (see MysteryReveal), and a resumed round has no reveal to play.
			if (mysteryToRestore.held.length > 0) {
				eventEmitter.broadcast({ type: 'heldTabletsOpened' });
				eventEmitter.broadcast({
					type: 'heldTabletsShow',
					symbol: mysteryToRestore.symbol,
					cells: mysteryToRestore.held.map((cell) => ({
						reel: cell.reel,
						row: cell.row,
						mult: cell.mult,
					})),
				});
			}

			// The base game has no hold, so `held` is empty there and `positions`
			// is the whole reveal. In the feature every position is already in
			// `held`, so this second pass only ever fires outside a run.
			for (const position of mysteryToRestore.positions) {
				const reelSymbol = stateGame.board[position.reel]?.reelState.symbols[position.row];
				if (!reelSymbol) continue;
				reelSymbol.rawSymbol = { ...reelSymbol.rawSymbol, name: mysteryToRestore.symbol };
			}
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
