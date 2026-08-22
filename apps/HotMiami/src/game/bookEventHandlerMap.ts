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
import { FRAME_REVEAL, FRAME_CLEAR } from './frameTiming';

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

// Indices of the newFrames/updateFrames events whose Frames were already shown
// early during `reveal`. Lets those handlers skip their own entry pause.
let preShownAt = new Set<number>();

export const bookEventHandlerMap: BookEventHandlerMap<BookEvent, BookEventContext> = {
	reveal: async (bookEvent: BookEventOfType<'reveal'>, { bookEvents }: BookEventContext) => {
		const isBonusGame = checkIsMultipleRevealEvents({ bookEvents });
		if (isBonusGame) {
			eventEmitter.broadcast({ type: 'stopButtonEnable' });
			recordBookEvent({ bookEvent });
		}

		stateGame.gameType = bookEvent.gameType;

		// Base-game frames last exactly one spin: the math clears them in
		// reset_book and re-lands them per round, so nothing in the stream tells
		// the client to remove the previous round's frames. Clear them as the
		// reels start, before the newFrames for this spin arrives.
		//
		// Free-game frames are sticky and must stay put while the reels turn, so
		// they are left alone here - the updateFrames that follows every free-game
		// reveal re-states the whole set anyway.
		if (bookEvent.gameType === 'basegame') {
			stateGame.frames = [];
			eventEmitter.broadcast({ type: 'framesClear' });
		}

		// Keep the gated magnitudes for this spin. utils-slots only ever tests
		// `> 0` (createEnhanceBoardSpin.ts:56,74) and sets a boolean
		// reelState.anticipating, so the 1-vs-2 distinction — two scatters on the
		// board vs three, i.e. "could still trigger" vs "one symbol away" — is
		// discarded before it reaches a component. Stashing it here is what lets
		// Anticipations/Anticipation tier the tease without touching the shared
		// package.
		const anticipation = gateAnticipation(bookEvent.anticipation);
		stateGame.anticipation = anticipation;

		// Show this spin's Frames while the reels are still turning, instead of
		// after they have all stopped.
		//
		// The stream order is reveal -> newFrames/updateFrames, and `reveal` awaits
		// the whole spin, so the Frames could only ever appear a beat after the
		// last reel landed. Reading them out of the upcoming event and broadcasting
		// now puts them on the board as the reels come down, which is what the
		// mechanic is meant to feel like.
		//
		// The later handler still runs and is harmless: NeonFrames' `upsert` reuses
		// an existing frame object and only refreshes its multiplier, so nothing
		// animates twice. `preShownAt` just lets that handler skip its own 260ms
		// entry pause, which would otherwise stall the stream for no visible reason.
		// Bounded by the next reveal so a spin can never pull in the following
		// spin's Frames.
		const nextRevealIndex =
			bookEvents.find((event) => event.index > bookEvent.index && event.type === 'reveal')?.index ??
			Number.POSITIVE_INFINITY;
		// A single spin can carry BOTH: updateFrames re-states the sticky set and a
		// newFrames right after it adds the ones that just landed (see reveal#18 in
		// the bonus fixture). Taking only the first showed the carried-over Frames
		// and silently dropped the new ones until after the reels stopped.
		const upcoming = bookEvents.filter(
			(event) =>
				event.index > bookEvent.index &&
				event.index < nextRevealIndex &&
				(event.type === 'newFrames' || event.type === 'updateFrames'),
		);
		const merged = upcoming.flatMap((event) => ('frames' in event ? event.frames : []));
		if (merged.length > 0 && FRAME_REVEAL !== 'on-stop') {
			preShownAt = new Set(upcoming.map((event) => event.index));
			stateGame.frames = [
				...stateGame.frames.filter(
					(frame) => !merged.some((f) => f.reel === frame.reel && f.row === frame.row),
				),
				...merged,
			];
			eventEmitter.broadcast(
				FRAME_REVEAL === 'per-reel'
					? { type: 'framesPending', frames: merged }
					: { type: 'framesNew', frames: merged },
			);
		}

		await stateGameDerived.enhancedBoard.spin({
			revealEvent: { ...bookEvent, anticipation },
			paddingBoard: config.paddingReels[bookEvent.gameType],
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
	// Neon Frames landing on the grid. They sit over whichever symbol occupies
	// the position, and their multipliers add together inside a single win.
	newFrames: async (bookEvent: BookEventOfType<'newFrames'>) => {
		if (bookEvent.frames.length === 0) return;
		eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_multiplier_landing' });
		stateGame.frames = [
			...stateGame.frames.filter(
				(frame) => !bookEvent.frames.some((f) => f.reel === frame.reel && f.row === frame.row),
			),
			...bookEvent.frames,
		];
		if (preShownAt.has(bookEvent.index)) {
			preShownAt.delete(bookEvent.index);
			return;
		}
		await eventEmitter.broadcastAsync({ type: 'framesNew', frames: bookEvent.frames });
	},
	// Sticky frames carried into this spin; Neon Nights re-rolls their values.
	updateFrames: async (bookEvent: BookEventOfType<'updateFrames'>) => {
		if (bookEvent.frames.length === 0) return;
		const changed = bookEvent.frames.some((frame) =>
			stateGame.frames.some(
				(existing) =>
					existing.reel === frame.reel && existing.row === frame.row && existing.mult !== frame.mult,
			),
		);
		stateGame.frames = bookEvent.frames.map((frame) => ({ ...frame }));
		if (changed) eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_multiplier_update' });
		await eventEmitter.broadcastAsync({ type: 'framesUpdate', frames: bookEvent.frames });
	},
	// Sunset Hits / Ocean Drive: a frame that took part in a win doubles after
	// the win is paid, so this arrives after winInfo for the same spin.
	frameDoubling: async (bookEvent: BookEventOfType<'frameDoubling'>) => {
		if (bookEvent.frames.length === 0) return;
		eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_multiplier_update' });
		stateGame.frames = stateGame.frames.map((frame) => {
			const doubled = bookEvent.frames.find((f) => f.reel === frame.reel && f.row === frame.row);
			return doubled ? { ...frame, mult: doubled.mult } : frame;
		});
		await eventEmitter.broadcastAsync({ type: 'framesDoubled', frames: bookEvent.frames });
	},
	// The Collector sweeps every frame on the board, paid after the line wins.
	collectorWin: async (bookEvent: BookEventOfType<'collectorWin'>) => {
		eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_scatter_win_v2' });
		await eventEmitter.broadcastAsync({
			type: 'collectorSweep',
			position: bookEvent.position,
			frames: bookEvent.frames,
			totalMultiplier: bookEvent.totalMultiplier,
		});
		// Frames are consumed by the sweep in the base game; in the free game the
		// following updateFrames re-states whatever is still stuck to the grid.
		stateGame.frames = [];
	},
	// Announces which free-spin tier the round entered.
	bonusTier: async (bookEvent: BookEventOfType<'bonusTier'>) => {
		stateGame.bonusTier = bookEvent.tier;
		stateGame.frames = [];
		await eventEmitter.broadcastAsync({
			type: 'bonusTierEnter',
			tier: bookEvent.tier,
			seedFrames: bookEvent.seedFrames,
		});
	},
	updateFreeSpin: async (bookEvent: BookEventOfType<'updateFreeSpin'>) => {
		// updateFreeSpin is the last event of every free spin, so this is where a
		// spin's presentation actually ends. Clear the Frames here rather than
		// leaving them for the next reveal.
		//
		// Sticky Frames used to sit on the grid continuously: on a spin with no
		// Collector nothing removed them, and the next spin's updateFrames simply
		// re-stated the same set, so they never visibly went away — they just
		// appeared to hang around until the reels next moved. They are re-shown
		// during the following spin by the lookahead in `reveal`, so the set the
		// player ends up looking at is identical; only the boundary is now clean.
		if (FRAME_CLEAR === 'end-of-spin') {
			stateGame.frames = [];
			eventEmitter.broadcast({ type: 'framesClear' });
		}
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
		stateGame.stickyWildReels = [];
		// NOTE: expandingWildsClear deliberately does NOT fire here — the sticky
		// overlays must keep covering the reveal-board W stacks through the outro
		// and the idle board; the next spin clears them (actor onNewGameStart).
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

		// Rebuild the Neon Frames that are stuck to the grid. Frames accumulate
		// across the feature, updateFrames re-states the whole set for a spin,
		// and frameDoubling only revalues existing ones - so replaying them in
		// order reproduces the exact grid the player left.
		const frameMap = new Map<string, { reel: number; row: number; mult: number }>();
		const keyOf = (frame: { reel: number; row: number }) => `${frame.reel},${frame.row}`;
		for (const event of bookEvents) {
			if (event.type === 'bonusTier') {
				frameMap.clear();
			} else if (event.type === 'newFrames' || event.type === 'frameDoubling') {
				for (const frame of event.frames) frameMap.set(keyOf(frame), frame);
			} else if (event.type === 'updateFrames') {
				frameMap.clear();
				for (const frame of event.frames) frameMap.set(keyOf(frame), frame);
			}
		}
		const lastBonusTier = findLastBookEvent('bonusTier' as const);
		if (lastBonusTier) stateGame.bonusTier = lastBonusTier.tier;
		if (frameMap.size > 0) {
			stateGame.frames = [...frameMap.values()];
			eventEmitter.broadcast({ type: 'framesUpdate', frames: [...frameMap.values()] });
		}
	},
};
