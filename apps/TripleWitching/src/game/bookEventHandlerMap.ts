import _ from 'lodash';

import { recordBookEvent, checkIsMultipleRevealEvents, type BookEventHandlerMap } from 'utils-book';
import { stateBet, stateUi } from 'state-shared';
import { waitForTimeout } from 'utils-shared/wait';

import { eventEmitter } from './eventEmitter';
import { playBookEvent } from './utils';
import { winLevelMap, type WinLevel, type WinLevelData } from './winLevelMap';
import { stateGame, stateGameDerived, displayRows } from './stateGame.svelte';
import type { BookEvent, BookEventOfType, BookEventContext } from './typesBookEvent';
import type { Position } from './types';
import { BASE_ROWS, paddedReelLength } from './constants';
import config from './config';

// Anticipation is gated by the MATHS, per game type, and must not be gated again
// here.
//
// game_config.anticipation_triggers is {basegame: 2, freegame: 1}: board.py
// starts numbering anticipated reels from the reel after the 2nd scatter in the
// base game, and after the 1st in the feature, which is exactly the intended
// behaviour. A second filter on this side - inherited from Margin Call, where
// the feature needed three scatters - dropped the first anticipated reel because
// it carries the value 1, which pushed the base game's tease out to the 3rd
// scatter and the feature's to the 2nd. It was most obvious in turbo, where
// there are fewer frames to hide the missing reel.

// A plain base-game board, sampled from the base padding strips. Used to put the
// reels back after the feature: the feature board is two rows taller, and
// leaving those symbols mounted while stateGame.rows says 3 would draw seven
// symbols into a three-row frame.
const baseIdleBoard = () =>
	(config.paddingReels.basegame as { name: string }[][]).map((strip) => {
		const start = Math.floor(Math.random() * strip.length);
		return Array.from({ length: paddedReelLength(BASE_ROWS) }, (_, i) => strip[(start + i) % strip.length]);
	});

// The winning positions of the round's last winInfo, kept so the board can keep
// showing them while it sits idle waiting for the next spin - otherwise the
// highlight vanishes a moment after it is drawn and a player who looked away has
// no way to see what actually paid. playBet owns the replay loop.
let lastWinPositions: Position[] = [];
export const getLastWinPositions = () => lastWinPositions;
export const clearLastWinPositions = () => {
	lastWinPositions = [];
};

const winLevelSoundsPlay = ({ winLevelData }: { winLevelData: WinLevelData }) => {
	if (winLevelData?.alias === 'max') eventEmitter.broadcastAsync({ type: 'uiHide' });
	if (winLevelData?.sound?.sfx) {
		eventEmitter.broadcast({ type: 'soundOnce', name: winLevelData.sound.sfx });
	}
	if (winLevelData?.type === 'big') {
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

// Ways wins have no line to draw: the symbols that took part *are* the win, and
// one position can belong to several of them (an H1 win and an L2 win share the
// wilds that carried both). Deduplicate before animating - a position animated
// twice would be waited on twice and only ever resolve once.
export const animateSymbols = async ({
	positions,
	flag = 'win',
}: {
	positions: Position[];
	// Which set to publish while this plays. Everything not in the published set
	// is dimmed by ReelSymbol, which is what makes a win legible on a full board.
	flag?: 'win' | 'scatter';
}) => {
	// Only animate symbols in visible rows (1..rows) - padding rows have no
	// oncomplete callback and would freeze the game forever.
	const visiblePositions = _.uniqBy(
		positions.filter((p) => p.row >= 1 && p.row <= stateGame.rows),
		(p) => `${p.reel},${p.row}`,
	);
	if (visiblePositions.length === 0) return;
	eventEmitter.broadcast({ type: 'boardShow' });

	stateGame.highlightActive = true;
	if (flag === 'scatter') stateGame.scatterPositions = visiblePositions;

	try {
		await eventEmitter.broadcastAsync({
			type: 'boardWithAnimateSymbols',
			symbolPositions: visiblePositions,
		});
	} finally {
		// finally, not after the await: a spin started mid-presentation rejects
		// the pending promise, and leaving the board dimmed forever is a much
		// worse bug than a highlight that ends early. clearHighlight is called on
		// every new round as well, because a promise that never settles at all
		// would not run this either.
		clearHighlight();
	}
};

// Bumped every time the highlight is torn down. Board captures it when a volley
// starts and re-checks it after each of the two points where the volley yields;
// if it has moved, the board it was lighting is gone and it must not write a
// symbol state.
//
// Without this, a spin started while a volley was mid-yield would set
// `symbolState = 'win'` on a symbol whose reel had ALREADY been reset to 'spin'
// - and nothing resets it again until the reel lands, so the win ring rode the
// spinning strip all the way down. The idle replay makes this the common case
// rather than a rare one: it re-arms every 1.6s, so an idle board is nearly
// always inside a volley when the player presses spin.
let highlightGeneration = 0;
export const getHighlightGeneration = () => highlightGeneration;

/** Drop every highlight. Safe to call at any time, from anywhere. */
export const clearHighlight = () => {
	highlightGeneration += 1;
	stateGame.highlightActive = false;
	stateGame.scatterPositions = [];
};

export const bookEventHandlerMap: BookEventHandlerMap<BookEvent, BookEventContext> = {
	reveal: async (bookEvent: BookEventOfType<'reveal'>, { bookEvents }: BookEventContext) => {
		const isBonusGame = checkIsMultipleRevealEvents({ bookEvents });
		if (isBonusGame) {
			eventEmitter.broadcast({ type: 'stopButtonEnable' });
			recordBookEvent({ bookEvent });
		}

		stateGame.gameType = bookEvent.gameType;

		// The multiplier is per spin, so it resets on every reveal rather than
		// when the feature ends. It has to happen here and not in the
		// multiplierWilds handler: that event is only sent on spins where a wild
		// actually landed, so a spin without one would otherwise keep showing the
		// previous spin's number while paying at 1x.
		stateGame.spinMultiplier = 1;
		stateGame.multiplierWildHits = [];
		eventEmitter.broadcast({ type: 'multiplierMeterReset' });

		// Three sealed bags again for a new base-game round. Reset on the reveal
		// rather than at the end of the previous round, so the ones that burst
		// stay open while the player is still looking at the win they came with.
		if (bookEvent.gameType === 'basegame') {
			eventEmitter.broadcast({ type: 'featureBagsReset' });
			eventEmitter.broadcast({ type: 'featureBagsShow' });
		}

		// The board the math sent is authoritative about its own height. Normally
		// featureSet has already set this, but a resumed round can drop the player
		// straight into a feature reveal without replaying that event.
		const revealedRows = bookEvent.board[0].length - 2;
		if (revealedRows !== stateGame.rows) stateGame.rows = revealedRows;

		await stateGameDerived.enhancedBoard.spin({
			revealEvent: bookEvent,
			paddingBoard: config.paddingReels[bookEvent.gameType],
		});
		eventEmitter.broadcast({ type: 'soundScatterCounterClear' });
	},

	// Triple Witching: the feature board grows two rows on every reel. Sent once,
	// after freeSpinTrigger and before the first feature reveal, so the reels are
	// already the right size when the first feature spin sweeps in.
	//
	// This is the only event that changes the board height or the evaluation
	// type, and it cannot arrive mid-feature: the combination is drawn once at
	// the trigger and holds for the whole run, retriggers included.
	featureSet: async (bookEvent: BookEventOfType<'featureSet'>) => {
		stateGame.activeFeatures = bookEvent.features;
		stateGame.evalType = bookEvent.evalType;

		// The meter only belongs on screen for a feature that actually has the
		// mult modifier. Shown unconditionally it would sit at 1x for the whole of
		// an expand-only run and read as broken.
		if (bookEvent.features.includes('mult')) {
			eventEmitter.broadcast({ type: 'multiplierMeterShow' });
		}

		const rows = bookEvent.numRows[0];
		if (rows === stateGame.rows) return;

		eventEmitter.broadcast({ type: 'soundSlam' });
		// stateGame.rows is the logical truth and flips now, because the next
		// reveal will arrive with a board this tall. displayRows is what the
		// layout follows, and it takes BOARD_EXPAND_MS to get there - the frame
		// grows upward out of the basegame board while debris falls through it.
		stateGame.rows = rows;
		displayRows.set(rows);
		await eventEmitter.broadcastAsync({ type: 'boardExpandPlay', rows });
	},

	// Triple Witching: the multiplier wilds that landed on THIS spin. Sent after
	// the reveal and before the winInfo the value applies to, so the meter is
	// already showing the number the win was paid at.
	//
	// The event only arrives on spins where at least one landed, so the reset to
	// 1x cannot live here - a spin with no wilds sends nothing at all and would
	// leave the previous spin's number on screen. `reveal` owns the reset.
	multiplierWilds: async (bookEvent: BookEventOfType<'multiplierWilds'>) => {
		stateGame.multiplierWildHits = bookEvent.added;
		eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_multiplier_landing' });
		await eventEmitter.broadcastAsync({
			type: 'multiplierMeterCollect',
			hits: bookEvent.added,
			multiplier: bookEvent.multiplier,
		});
		stateGame.spinMultiplier = bookEvent.multiplier;
	},

	winInfo: async (bookEvent: BookEventOfType<'winInfo'>) => {
		eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_winlevel_small' });

		const positions = bookEvent.wins.flatMap((win) => win.positions);
		await animateSymbols({ positions });

		// Remembered for the idle replay, but only for base-game wins. The feature
		// tears the board down to base idle when it ends, so replaying a feature
		// spin's highlight afterwards would light up symbols that are no longer
		// there - and rows that no longer exist.
		lastWinPositions = stateGame.gameType === 'basegame' ? positions : [];
	},

	setTotalWin: async (bookEvent: BookEventOfType<'setTotalWin'>) => {
		stateBet.winBookEventAmount = bookEvent.amount;
	},

	freeSpinTrigger: async (
		bookEvent: BookEventOfType<'freeSpinTrigger'>,
		{ bookEvents }: BookEventContext,
	) => {
		lastWinPositions = [];

		eventEmitter.broadcast({ type: 'soundStop', name: 'bgm_main' });
		eventEmitter.broadcast({ type: 'soundStop', name: 'sfx_anticipation' });
		eventEmitter.broadcast({ type: 'soundFreeGameBell' });
		// The shockwave rides the bell rather than following it - the two are one
		// beat, and a burst that arrives after the sound reads as a lag.
		eventEmitter.broadcast({ type: 'scatterTriggerShow', positions: bookEvent.positions });
		await waitForTimeout(1600);
		eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_scatter_win_v2' });
		await animateSymbols({ positions: bookEvent.positions, flag: 'scatter' });
		await animateSymbols({ positions: bookEvent.positions, flag: 'scatter' });
		eventEmitter.broadcast({ type: 'scatterTriggerHide' });

		// The bags burst here - before the transition, in the base-game room, on
		// the board the player is still looking at. This is the whole point of
		// them: the modifiers are what the scatters just won, so they have to be
		// revealed as part of the trigger rather than announced after the scene
		// has already changed.
		//
		// Which ones burst is read out of the book by looking AHEAD. The maths
		// sends featureSet after this event, not before, so by the time its own
		// handler runs the transition has already happened. Reading it early is
		// safe and is not a guess: the book is complete on the client, the
		// combination is fixed at the trigger, and createBonusSnapshot already
		// does the same kind of lookahead.
		//
		// Moving the emission earlier in the maths would be the tidier fix, but
		// it costs a full re-simulation and buys nothing the player can see.
		const featureSetEvent = bookEvents.find(
			(event) => event.type === 'featureSet' && event.index > bookEvent.index,
		) as BookEventOfType<'featureSet'> | undefined;
		if (featureSetEvent) {
			await eventEmitter.broadcastAsync({
				type: 'featureBagsBurst',
				features: featureSetEvent.features,
			});
		}

		eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_superfreespin' });
		await eventEmitter.broadcastAsync({ type: 'uiHide' });
		await eventEmitter.broadcastAsync({
			type: 'transition',
			// Same reasoning as freeSpinEnd: the scene changes while the shutters are
			// shut. gameType drives which backdrop is showing, so setting it here
			// means the feature room is already up when they open, rather than
			// cross-fading in behind the intro panel afterwards.
			oncover: () => {
				stateGame.gameType = 'freegame';
				stateGame.spinMultiplier = 1;
				stateGame.multiplierWildHits = [];
				// The bags belong to the base game. They go while the shutters are
				// shut, like everything else that changes between the two rooms.
				eventEmitter.broadcast({ type: 'featureBagsHide' });
			},
		});
		eventEmitter.broadcast({ type: 'freeSpinIntroShow' });
		eventEmitter.broadcast({ type: 'soundOnce', name: 'jng_intro_fs' });
		eventEmitter.broadcast({ type: 'soundMusic', name: 'bgm_freespin' });
		await eventEmitter.broadcastAsync({
			type: 'freeSpinIntroUpdate',
			totalFreeSpins: bookEvent.totalFs,
		});
		// The meter is NOT shown here. featureSet arrives immediately after this
		// handler and shows it only for a feature that actually carries the mult
		// modifier - four of the seven combinations do not, and a meter pinned at
		// 1x for a whole run reads as a broken one.
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
		eventEmitter.broadcast({ type: 'soundStop', name: 'bgm_freespin' });
		eventEmitter.broadcast({ type: 'soundStop', name: 'sfx_anticipation' });
		eventEmitter.broadcast({ type: 'soundFreeGameBell' });
		eventEmitter.broadcast({ type: 'scatterTriggerShow', positions: bookEvent.positions });
		await waitForTimeout(1400);
		eventEmitter.broadcast({ type: 'soundMusic', name: 'bgm_freespin' });
		eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_scatter_win_v2' });
		await animateSymbols({ positions: bookEvent.positions, flag: 'scatter' });
		eventEmitter.broadcast({ type: 'scatterTriggerHide' });
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

		// Shrink back to the basegame board, INSIDE the transition.
		//
		// All of this used to run before the transition was even started, on the
		// strength of a comment claiming the transition covered it. It did not: the
		// board visibly snapped from five rows to three, the meter vanished, and
		// only then did the alarm play - so the player saw the feature end and then
		// watched an effect whose whole job was to hide that.
		//
		// oncover runs while the circuit-breaker shutters are shut, which is the
		// only moment on screen where nothing is visible. Both halves have to
		// happen there: the row count drives the frame and the layout, and the
		// reels are still holding the feature board's seven symbols, which would be
		// drawn into a three-row frame if they were left.
		await eventEmitter.broadcastAsync({
			type: 'transition',
			oncover: () => {
				stateGame.rows = BASE_ROWS;
				displayRows.set(BASE_ROWS, { duration: 0 });
				// Back to base-game terms: no modifiers, paid as lines. The board
				// height above is only one of the three things the feature changed.
				stateGame.activeFeatures = [];
				stateGame.evalType = 'lines';
				stateGame.spinMultiplier = 1;
				stateGame.multiplierWildHits = [];
				eventEmitter.broadcast({ type: 'multiplierMeterHide' });
				eventEmitter.broadcast({ type: 'featureBagsReset' });
				eventEmitter.broadcast({ type: 'featureBagsShow' });
				stateGameDerived.enhancedBoard.settle(baseIdleBoard());
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

	finalWin: async () => {
		// finalWin is the last event of every book in every mode, so it is the one
		// place that can guarantee the round did not leave presentation state open.
		// freeSpinEnd already does all of this earlier in a feature round, and every
		// line here is idempotent.
		if (stateUi.freeSpinCounterShow) {
			eventEmitter.broadcast({ type: 'freeSpinCounterHide' });
			stateUi.freeSpinCounterShow = false;
		}
		if (stateGame.gameType !== 'basegame') {
			stateGame.gameType = 'basegame';
		}
		if (stateGame.rows !== BASE_ROWS) {
			stateGame.rows = BASE_ROWS;
			displayRows.set(BASE_ROWS, { duration: 0 });
			stateGameDerived.enhancedBoard.settle(baseIdleBoard());
		}
		if (stateGame.activeFeatures.length > 0 || stateGame.evalType !== 'lines') {
			stateGame.activeFeatures = [];
			stateGame.evalType = 'lines';
			stateGame.spinMultiplier = 1;
			stateGame.multiplierWildHits = [];
			eventEmitter.broadcast({ type: 'multiplierMeterHide' });
			eventEmitter.broadcast({ type: 'featureBagsReset' });
			eventEmitter.broadcast({ type: 'featureBagsShow' });
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

		// Restore the feature's modifiers, and with them the board height and the
		// evaluation type. featureSet is sent once per feature and carries the
		// whole state rather than a delta, so replaying the last one is enough -
		// and because the combination cannot change mid-feature, "the last one"
		// is also the only one.
		const lastFeatureSetEvent = findLastBookEvent('featureSet' as const);
		if (lastFeatureSetEvent) {
			// A resumed round rejoins mid-feature, which is past the moment the
			// bags exist for. They stay down until the feature ends.
			eventEmitter.broadcast({ type: 'featureBagsHide' });
			stateGame.activeFeatures = lastFeatureSetEvent.features;
			stateGame.evalType = lastFeatureSetEvent.evalType;
			stateGame.rows = lastFeatureSetEvent.numRows[0];
			displayRows.set(stateGame.rows, { duration: 0 });
			if (lastFeatureSetEvent.features.includes('mult')) {
				eventEmitter.broadcast({ type: 'multiplierMeterShow' });
			}
		}

		// The multiplier itself is per spin, so unlike Margin Call's meter there
		// is nothing cumulative to rebuild: a resumed round starts its next spin
		// at 1x whatever the last spin paid at, and replaying an old value would
		// show a number that no longer applies.
	},
};
