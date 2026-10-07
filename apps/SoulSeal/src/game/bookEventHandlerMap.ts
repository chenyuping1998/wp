import _ from 'lodash';

import { recordBookEvent, checkIsMultipleRevealEvents, type BookEventHandlerMap } from 'utils-book';
import { stateBet, stateUi } from 'state-shared';
import { waitForTimeout } from 'utils-shared/wait';

import { eventEmitter } from './eventEmitter';
import { playBookEvent } from './utils';
import { winLevelMap, type WinLevel, type WinLevelData } from './winLevelMap';
import { stateGame, stateGameDerived } from './stateGame.svelte';
import type { BookEvent, BookEventOfType, BookEventContext } from './typesBookEvent';
import type { Position } from './types';
import { CARRIER_SYMBOL, COLLECTOR_SYMBOL } from './types';
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
export const baseIdleBoard = () =>
	(config.paddingReels.basegame as { name: string }[][]).map((strip) => {
		const start = Math.floor(Math.random() * strip.length);
		return Array.from({ length: paddedReelLength(BASE_ROWS) }, (_, i) => strip[(start + i) % strip.length]);
	});

// The winning positions of the round's last winInfo, kept so the board can keep
// showing them while it sits idle waiting for the next spin - otherwise the
// highlight vanishes a moment after it is drawn and a player who looked away has
// no way to see what actually paid. playBet owns the replay loop.
let lastWinPositions: Position[] = [];
// How many reveals this book has played, and how many collects the current spin
// still owes. See the note in `reveal`.
let spinsRevealed = 0;
let collectsLeftThisSpin = 0;
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

/**
 * Should this spin play the trigger tease?
 *
 * Two conditions, and both matter:
 *
 *   1. the round DOES trigger. The tease shows the priestess and burns every
 *      talisman on the board, which is a promise; playing it on a spin that then
 *      pays nothing is a lie about an outcome, and certification treats that as
 *      one whatever the maths says. So this looks AHEAD in the book rather than
 *      guessing from the board.
 *   2. a coin, at 50%, that comes from the BOOK and not from Math.random.
 *
 * The second is the subtle one. A replay has to show what the original showed -
 * `?replay=true` re-requests the same round and the player is entitled to see the
 * same thing happen - and a round is only its book. Hashing the revealed board
 * gives a value that is fixed for that round, uniform enough across rounds to be
 * a fair coin, and free.
 */
const shouldTease = (reveal: BookEventOfType<'reveal'>, bookEvents: BookEvent[]) => {
	if (reveal.gameType !== 'basegame') return false;
	if (!bookEvents.some((event) => event.type === 'freeSpinTrigger')) return false;

	// FNV-1a over the board's symbol names and positions. Cheap, and it changes
	// completely when any one cell changes - which is what makes consecutive
	// triggering rounds alternate rather than streak.
	let hash = 0x811c9dc5;
	reveal.board.forEach((reel, reelIndex) => {
		reel.forEach((symbol, row) => {
			const token = `${reelIndex}:${row}:${symbol.name}`;
			for (let i = 0; i < token.length; i += 1) {
				hash ^= token.charCodeAt(i);
				hash = Math.imul(hash, 0x01000193);
			}
		});
	});
	return (hash >>> 0) % 2 === 0;
};

export const bookEventHandlerMap: BookEventHandlerMap<BookEvent, BookEventContext> = {
	reveal: async (bookEvent: BookEventOfType<'reveal'>, { bookEvents }: BookEventContext) => {
		// ── is this spin finished scoring? ───────────────────────────────────
		//
		// A spin that pays a LINE and then collects sends two setWin events: the
		// line's own total, and again once the sweep is added. Both used to be
		// presented, so a round paying 1x on a payline and 18x on the collect put
		// up the win plaque for the 1x, waited for the player to dismiss it, and
		// then put it up again for the 19x.
		//
		// The first one is not wrong, it is just early - it is the total so far,
		// not the total. So the presentation is held until the spin has nothing
		// left to add.
		//
		// Found by counting reveals rather than by an event index, because a
		// handler is given the whole book and not its own position in it.
		spinsRevealed += 1;
		{
			let seen = 0;
			let collects = 0;
			for (const event of bookEvents) {
				if (event.type === 'reveal') {
					seen += 1;
					if (seen > spinsRevealed) break;
				} else if (seen === spinsRevealed && event.type === 'collect') {
					collects += 1;
				}
			}
			collectsLeftThisSpin = collects;
		}

		const isBonusGame = checkIsMultipleRevealEvents({ bookEvents });
		if (isBonusGame) {
			eventEmitter.broadcast({ type: 'stopButtonEnable' });
			recordBookEvent({ bookEvent });
		}

		stateGame.gameType = bookEvent.gameType;

		// The collect state is per spin: `collect` is only sent on spins that
		// collected something, so a spin that collected nothing would otherwise
		// keep the previous spin's sweeps and carriers on screen.
		//
		// The rail is NOT reset here - it accumulates across the whole feature and
		// is only cleared when a new feature starts (collectFeatureSet).
		stateGame.sweeps = [];
		eventEmitter.broadcast({ type: 'collectReset' });

		// Carriers and collectors are read off the revealed board rather than sent
		// as their own event. The board already carries the values - `multiplier` on
		// every M - so a separate event would be a second source of truth for the
		// same fact, and the two would eventually disagree.
		//
		// The field name is the SDK's, not ours. This read `rawSymbol.cashValue`
		// until it was noticed that no talisman had ever displayed a number: the
		// maths writes `{"name": "M", "multiplier": 3}`, so the condition below was
		// false for every carrier on every board and this array was always empty.
		//
		// Rows are kept in the PADDED convention - visible rows are 1..rows, the
		// same indices winInfo uses and the same ones getSymbolY expects. The
		// padding rows above and below the window are skipped: a carrier sitting
		// in one is not on the board and must not be collected or drawn.
		stateGame.carriers = [];
		stateGame.collectors = [];
		bookEvent.board.forEach((reel, reelIndex) => {
			reel.forEach((rawSymbol, row) => {
				if (row < 1 || row > stateGame.rows) return;
				if (rawSymbol.name === CARRIER_SYMBOL && rawSymbol.multiplier !== undefined) {
					stateGame.carriers.push({ reel: reelIndex, row, value: rawSymbol.multiplier });
				}
				// The wild is the collector. It carries no value of its own, so unlike
				// the carrier there is nothing to read off it.
				if (rawSymbol.name === COLLECTOR_SYMBOL) {
					stateGame.collectors.push({ reel: reelIndex, row });
				}
			});
		});

		// The board the math sent is authoritative about its own height. Normally
		// featureSet has already set this, but a resumed round can drop the player
		// straight into a feature reveal without replaying that event.
		const revealedRows = bookEvent.board[0].length - 2;
		if (revealedRows !== stateGame.rows) stateGame.rows = revealedRows;

		// ── the tease, BEFORE the reels move ─────────────────────────────────
		//
		// It played after the reels had stopped at first, which put it between the
		// scatters landing and the feature opening - by which point the player had
		// already seen three scatters and knew. A tease that arrives after the news
		// is a recap.
		//
		// Here it fires the instant a spin or a buy is committed, so the priestess
		// and her talisman are the FIRST thing on screen and the reels turn under
		// what she promised. Awaited, so the spin cannot start underneath it.
		//
		// It still cannot lie: `shouldTease` reads the whole book, which is already
		// in hand at this point, and only plays on a round that does trigger.
		if (shouldTease(bookEvent, bookEvents)) {
			await eventEmitter.broadcastAsync({ type: 'triggerTeasePlay' });
		}

		await stateGameDerived.enhancedBoard.spin({
			revealEvent: bookEvent,
			paddingBoard: config.paddingReels[bookEvent.gameType],
			// The feature opts out of the 'fast' SPIN TYPE, not out of turbo.
			//
			// 'fast' does not mean "the same spin, quicker". It means padding zero -
			// createReelForSpinning's GET_PADDING_SIZE_MAP gives it `previous + 0` -
			// and since the stagger between reels comes ENTIRELY from padding
			// accumulating along the board, all five reels arrive at once. A turbo
			// feature spin was not a fast spin, it was a cut: the board blinked from
			// one arrangement to the next with no reel-by-reel stop at all, which is
			// what "it spins for a moment and it is over" describes.
			//
			// That is a fine trade in the base game, where a spin is a transaction.
			// It is a bad one in the feature, where every board carries multipliers
			// the player is reading and a rail that may be about to fill.
			//
			// So the feature spins padded at BOTH speeds, and turbo does its work
			// through the options instead - see stateGame.svelte.ts, which now hands
			// a turbo feature reel SPIN_OPTIONS_FAST_FREEGAME even though its spin
			// type is 'normal'.
			isTurboOverride: bookEvent.gameType === 'freegame' ? false : undefined,
		});
		eventEmitter.broadcast({ type: 'soundScatterCounterClear' });
	},

	// Soul Seal: which free-game feature this run is. Sent once after
	// freeSpinTrigger and before the first feature reveal, and never again -
	// retriggers do not re-send it, so nothing here may assume it can re-read the
	// feature mid-run.
	featureSet: async (bookEvent: BookEventOfType<'featureSet'>) => {
		stateGame.feature = bookEvent.feature;
		stateGame.minCarrierValue = bookEvent.minCarrierValue;
		stateGame.guaranteesPair = bookEvent.guaranteesPair;
		stateGame.railTotal = bookEvent.railTotal;
		eventEmitter.broadcast({ type: 'railReset' });

		// The rail belongs to `sealing` ONLY.
		//
		// `swarm` - the 300x buy, and what five scatters open - has no rail at all:
		// gamestate.py advances it only when the feature is sealing, and the two are
		// deliberate alternatives (a feature carrying both a guaranteed collect and a
		// rising multiplier compounds without bound; it was measured at 26x RTP
		// before they were separated).
		//
		// This showed it anyway. Every swarm session ran under twelve empty sockets
		// that could never fill, with three milestone rewards printed under them -
		// a scoreboard for a game that was not being played, promising spins and
		// multipliers the mode does not award.
		if (bookEvent.feature === 'sealing') {
			eventEmitter.broadcast({ type: 'railShow' });
		} else {
			eventEmitter.broadcast({ type: 'railHide' });
		}
	},

	// Soul Seal: this spin's collect resolution.
	//
	// Sent AFTER the winInfo it accompanies, because three carriers on a payline
	// both pay as a line win and trigger a sweep - the player sees the line pay,
	// then the gourd open. The order is the maths', not a presentation choice.
	//
	// The reset lives in `reveal`, not here: this event is only sent on spins that
	// actually collected, so a spin that collected nothing would otherwise leave
	// the previous spin's sweeps on screen.
	collect: async (bookEvent: BookEventOfType<'collect'>) => {
		collectsLeftThisSpin = Math.max(0, collectsLeftThisSpin - 1);
		stateGame.sweeps = bookEvent.sweeps;

		// ── say WHICH symbols paid, the way every other win does ─────────────
		//
		// A base-game collect is a line win: three spirits on a payline, paying
		// what is written on them. Every other line win in this game lights the
		// symbols that paid and steps the rest of the board back, and the collect
		// did not - so the one win type whose amount comes from the symbols
		// themselves was the one that never pointed at them.
		//
		// It used to be marked by a ring drawn round each carrier, which is not
		// something a line win does to any other symbol and was removed for that
		// reason. This is the replacement, and it is the same call the paytable
		// wins make: the carriers light, everything else dims, and only then does
		// the value leave them.
		if (bookEvent.sweeps[0]?.source.kind === 'line') {
			await animateSymbols({
				positions: bookEvent.sweeps[0].carriers.map((c) => ({ reel: c.reel, row: c.row })),
			});
		}

		eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_multiplier_landing' });
		await eventEmitter.broadcastAsync({
			type: 'collectPlay',
			sweeps: bookEvent.sweeps,
			totalWin: bookEvent.totalWin,
			collectMultiplier: bookEvent.collectMultiplier,
			cappedAt: bookEvent.cappedAt,
		});
	},

	// Soul Seal: the talisman rail advancing one slot.
	//
	// `filled` is the count after the advance, so this is a straight assignment.
	// Do not turn it into an increment: the rail survives retriggers, and a
	// locally-incremented count is exactly how it would drift from the maths.
	railAdvance: async (bookEvent: BookEventOfType<'railAdvance'>) => {
		await eventEmitter.broadcastAsync({
			type: 'railAdvancePlay',
			filled: bookEvent.filled,
			total: bookEvent.total,
			awardedFs: bookEvent.awardedFs,
			collectMultiplier: bookEvent.collectMultiplier,
		});

		// A milestone ADDS FREE SPINS, and the counter has to say so now.
		//
		// The maths is right about this and always was - checked across every book,
		// 236,546 updateFreeSpin events agree with the running total once the rail's
		// awards are counted. But `updateFreeSpin` is sent at the START of the next
		// spin, so the counter went on showing the old total for the whole of the
		// moment the rail was celebrating: the rail flashed "+8" and the readout two
		// inches away still said 8 / 8. It looked like the spins had not been added.
		//
		// They had. This is only the readout catching up when it happens rather than
		// one spin later.
		if (bookEvent.awardedFs > 0) {
			stateUi.freeSpinCounterTotal += bookEvent.awardedFs;
			eventEmitter.broadcast({
				type: 'freeSpinCounterUpdate',
				current: stateUi.freeSpinCounterCurrent,
				total: stateUi.freeSpinCounterTotal,
			});

			// And say so on a plaque. A milestone adds spins AND steps the collect
			// multiplier - the feature's biggest moment - and the only thing marking
			// it was a "+8" drifting off a rail that is already twelve small sockets.
			// Awaited, so the next spin cannot start underneath it.
			eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_superfreespin' });
			await eventEmitter.broadcastAsync({
				type: 'railMilestoneShow',
				awardedFs: bookEvent.awardedFs,
				collectMultiplier: bookEvent.collectMultiplier,
			});
		}
	},

	// Line wins, presented as the reference title does: the line, the total, and
	// the paying symbols pulsing while everything else dims.
	//
	// Both halves run TOGETHER, not one after the other. The line is static; the
	// movement all comes from the symbols, and a line that draws on before the
	// symbols react reads as two separate events rather than one.
	//
	// An earlier version dropped animateSymbols entirely, on a reading of one
	// still frame that said the reference did not dim. Consecutive frames say it
	// does, and that the paying symbols visibly grow - that dim-and-pulse IS the
	// rhythm.
	winInfo: async (bookEvent: BookEventOfType<'winInfo'>) => {
		eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_winlevel_small' });

		const positions = bookEvent.wins.flatMap((win) => win.positions);
		await Promise.all([
			eventEmitter.broadcastAsync({
				type: 'winLinesShow',
				// One polyline per win, covering only the cells that win actually
				// paid on. Drawing the whole payline would show five cells paying
				// when three did.
				lines: bookEvent.wins.map((win) => ({ positions: win.positions, win: win.win })),
				totalWin: bookEvent.totalWin,
			}),
			animateSymbols({ positions }),
		]);
		eventEmitter.broadcast({ type: 'winLinesHide' });

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
			},
		});
		eventEmitter.broadcast({ type: 'freeSpinIntroShow' });
		eventEmitter.broadcast({ type: 'soundOnce', name: 'jng_intro_fs' });
		eventEmitter.broadcast({ type: 'soundMusic', name: 'bgm_freespin' });
		await eventEmitter.broadcastAsync({
			type: 'freeSpinIntroUpdate',
			totalFreeSpins: bookEvent.totalFs,
		});
		// The rail is NOT shown here. collectFeatureSet arrives immediately after
		// this handler and owns showing and resetting it, so the rail can never be
		// on screen before the feature that gives it meaning has been announced.
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

		// Everything read off the LAST FEATURE BOARD stops being true here.
		//
		// `carriers` was only ever cleared by `reveal`, and the return to the base
		// game does not send one - the board is restored, not re-revealed. So the
		// final free spin's carriers stayed in state and CarrierValues went on
		// drawing their plaques over whatever the base board happened to be
		// showing: a "20x" hanging under a 10 of spades, on a symbol that has no
		// value and never did.
		//
		// It is the same class of mistake as the reveal/collect disagreement in
		// draw_swarm_board - two things describing one board, and only one of them
		// updated. CarrierValues now also checks each plaque against the symbol
		// actually under it, so a future desync cannot print a number again; this
		// is the fix for the desync itself.
		stateGame.carriers = [];
		stateGame.collectors = [];
		stateGame.sweeps = [];
		eventEmitter.broadcast({ type: 'collectReset' });
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
				// Back to base-game terms. The rail belongs to the feature that
				// filled it, so it goes down with it - carrying a filled rail into
				// the base game would promise a floor that no longer applies.
				stateGame.feature = null;
				stateGame.minCarrierValue = 0;
				stateGame.guaranteesPair = false;
				eventEmitter.broadcast({ type: 'railReset' });
				eventEmitter.broadcast({ type: 'railHide' });
				stateGameDerived.enhancedBoard.settle(baseIdleBoard());
			},
		});
		await eventEmitter.broadcastAsync({ type: 'uiShow' });
		await eventEmitter.broadcastAsync({ type: 'drawerUnfold' });
		eventEmitter.broadcast({ type: 'drawerButtonHide' });
	},

	setWin: async (bookEvent: BookEventOfType<'setWin'>) => {
		// Not yet: this spin still has a sweep to add, so this amount is a running
		// subtotal rather than what the spin paid. Presenting it would put the
		// plaque up twice - see the note in `reveal`. The bet bar's WIN field is
		// driven by setTotalWin and still moves, so nothing is hidden; only the
		// interruption is deferred.
		if (collectsLeftThisSpin > 0) return;

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
		spinsRevealed = 0;
		collectsLeftThisSpin = 0;
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
		// The feature branch also clears the board readings, as the backstop for a
		// round that reached the end without running freeSpinEnd. A base-game
		// round's carriers are NOT cleared here: they are still on the board and
		// still true, and a player reads them between spins.
		if (stateGame.feature !== null) {
			stateGame.feature = null;
			stateGame.carriers = [];
			stateGame.collectors = [];
			stateGame.sweeps = [];
			stateGame.minCarrierValue = 0;
			stateGame.guaranteesPair = false;
			eventEmitter.broadcast({ type: 'railReset' });
			eventEmitter.broadcast({ type: 'railHide' });
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

		// Restore which feature is running. collectFeatureSet is sent once per
		// feature and carries the whole state rather than a delta, so replaying
		// the last one is enough - and because the feature cannot change mid-run,
		// "the last one" is also the only one.
		const lastFeatureSetEvent = findLastBookEvent('featureSet' as const);
		if (lastFeatureSetEvent) {
			stateGame.feature = lastFeatureSetEvent.feature;
			stateGame.minCarrierValue = lastFeatureSetEvent.minCarrierValue;
			stateGame.guaranteesPair = lastFeatureSetEvent.guaranteesPair;
			stateGame.railTotal = lastFeatureSetEvent.railTotal;
			// Same rule as featureSet: only `sealing` has a rail. A resumed round
			// has to land in the state the round was actually in.
			if (lastFeatureSetEvent.feature === 'sealing') {
				eventEmitter.broadcast({ type: 'railShow' });
			}
		}

		// The rail, unlike the feature itself, IS cumulative - so it has to be
		// rebuilt from the last advance rather than from the feature announcement,
		// which only ever describes an empty rail.
		const lastRailEvent = findLastBookEvent('railAdvance' as const);
		if (lastRailEvent) {
			await playBookEvent(lastRailEvent, { bookEvents });
		}

		// The sweeps themselves are per spin and are NOT replayed: a resumed round
		// starts its next spin having collected nothing, and replaying an old
		// collect would pay out an animation for money already banked.
	},
};
