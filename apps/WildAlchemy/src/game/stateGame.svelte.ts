import _ from 'lodash';
import { createAlchemyReel } from './createAlchemyReel.svelte';
import type { Tween } from 'svelte/motion';

import { stateBet } from 'state-shared';
import { createEnhanceBoard } from 'utils-slots';
import { createGetWinLevelDataByWinLevelAlias } from 'utils-shared/winLevel';

import { uiTheme } from 'components-ui-pixi';

import type { GameType, RawSymbol, SymbolState } from './types';
import type { RevealBar, WildTransferPosition } from './typesBookEvent';
import { stateLayoutDerived } from './stateLayout';
import { winLevelMap } from './winLevelMap';
import { eventEmitter } from './eventEmitter';
import {
	SYMBOL_SIZE,
	BOARD_SIZES,
	INITIAL_BOARD,
	BOARD_DIMENSIONS,
	SPIN_OPTIONS_DEFAULT,
	SPIN_OPTIONS_FAST,
	SPIN_OPTIONS_FAST_FREEGAME,
	INITIAL_SYMBOL_STATE,
	SCATTER_LAND_SOUND_MAP,
} from './constants';

const onSymbolLand = ({ rawSymbol, reelIndex }: { rawSymbol: RawSymbol; reelIndex?: number }) => {
	if (rawSymbol.name === 'S') {
		eventEmitter.broadcast({ type: 'soundScatterCounterIncrease' });
		eventEmitter.broadcast({
			type: 'soundOnce',
			name: SCATTER_LAND_SOUND_MAP[scatterLandIndex()],
		});
	}

	// WILD never lands from the strip: it is made from a person after the reels
	// stop, and the conversion has its own sounds. The reel lands the person.
	void reelIndex;
	void rawSymbol;
};


const board = _.range(BOARD_DIMENSIONS.x).map((reelIndex) => {
	const reel = createAlchemyReel({
		reelIndex,
		symbolHeight: SYMBOL_SIZE,
		initialSymbols: INITIAL_BOARD[reelIndex],
		initialSymbolState: INITIAL_SYMBOL_STATE,
		onReelStopping: () => {
			// Every physical reel stop gets one click, including a reel carrying a
			// sticky Wild. Skipping those reels made free-game spins audibly produce
			// only two, three or four stops depending on the sticky layout. The Wild's
			// own landing pluck remains suppressed separately in onSymbolLand.

			// One click for every reel, and a raised one ONLY for a reel that is
			// teasing. The five-rung pitch ladder that used to be here (a step per
			// reel, 0.94 → 1.14) spent the rise on every losing spin, so by the time
			// a real tease arrived the ear had nothing left to notice. Reserving the
			// pitch jump for the tease is what makes it mean "this reel matters".
			//
			// `stateGame.anticipation[reelIndex]` is the per-reel magnitude for the
			// spin currently on the reels, already gated by gateAnticipation (0 for
			// reels that are not teasing), and it is set at spin start — so it is
			// still correct at the moment this reel stops, unlike reelState's own
			// flag which is cleared as part of stopping.
			const teasing = (stateGame.anticipation[reelIndex] ?? 0) > 0;
			// A merged block lands as one wide reel: one stop sound and one impact
			// for the whole block (SPEC §2.2 "大格停輪另一聲"), from its first reel.
			const block = stateGame.bars.find((bar) => bar.size > 1 && reelIndex >= bar.reel && reelIndex < bar.reel + bar.size);
			if (block && reelIndex !== block.reel) return;
			eventEmitter.broadcast({
				type: 'soundOnce',
				name: teasing || block ? 'sfx_reel_stop_tease' : 'sfx_reel_stop',
				forcePlay: !stateBet.isTurbo,
			});
			// The housing takes the hit too — a much lighter version of the win
			// recoil, so a symbol landing reads as weight arriving in the frame
			// rather than a sprite appearing. Skipped in turbo, where five recoils
			// inside half a second would just be noise.
			if (!stateBet.isTurbo) {
				eventEmitter.broadcast({ type: 'boardFrameImpact', strength: 0.12 });
			}
		},
		onSymbolLand: ({ rawSymbol }) => onSymbolLand({ rawSymbol, reelIndex }),
	});

	reel.reelState.spinOptions = () => {
		const options = reel.reelState.spinType === 'fast' ? SPIN_OPTIONS_FAST : SPIN_OPTIONS_DEFAULT;
		// A reel inside a merging block spins as 'anticipated' (game/mergePath.ts):
		// the block's first reel carries the whole merge delay as extra travel and
		// the other reels of the block add none of their own, so the engine's
		// accumulating cadence lands the block as one wide reel. Speed unchanged.
		const extra = stateGame.mergeExtra[reelIndex] ?? 0;
		const anticipatedPadding = extra < 0 ? 0 : options.reelPaddingMultiplierNormal + extra / BOARD_DIMENSIONS.y;
		// Reels 5 and 6 do not bounce (SPEC §2.1). A merged block lands as one
		// wide reel, so every reel in it follows the block's first reel.
		const block = stateGame.bars.find((bar) => reelIndex >= bar.reel && reelIndex < bar.reel + bar.size);
		const leadReel = block ? block.reel : reelIndex;
		return {
			...options,
			reelBounceSizeMulti: leadReel < 4 ? options.reelBounceSizeMulti : 0,
			reelPaddingMultiplierAnticipated: anticipatedPadding,
			reelSpinSpeedAnticipated: options.reelSpinSpeed,
		};
	};

	return reel;
});

export type Reel = (typeof board)[number];
export type ReelSymbol = Reel['reelState']['symbols'][number];

export type MultiplierSymbol = {
	initX: number;
	initY: number;
	symbolX: Tween<number>;
	symbolY: Tween<number>;
	rawSymbol: RawSymbol;
	symbolState: SymbolState;
	oncomplete: () => void;
};

export const stateGame = $state({
	board,
	gameType: 'basegame' as GameType,
	multiplierBoard: [] as (MultiplierSymbol | undefined)[][],
	scatterCounter: 0,
	/**
	 * Book-unit total of the win volley currently being presented (100 = 1× bet),
	 * written by the `winInfo` handler. Symbol presentations read it to decide
	 * whether this win is a big one — see SymbolWinAnim's big-win faces.
	 */
	currentWinTotal: 0,
	/**
	 * How many win lines are drawn right now. Debug-only bookkeeping, written by
	 * WinLines.svelte and read by `__HM_LINES__` under ?hmdebug=1 — win lines are
	 * Graphics rather than sprites, so nothing outside the game can otherwise
	 * observe them, and "a line appeared while the reels were spinning" is a bug
	 * that needs measuring rather than eyeballing.
	 */
	debugWinLineCount: 0,
	/**
	 * The cells taking part in the win volley on screen right now, or empty.
	 *
	 * Written by Board.svelte around `boardWithAnimateSymbols`, read by every
	 * symbol so the ones NOT in it can stand down: a winning board dims
	 * everything else instead of leaving twenty equally bright tiles with a thin
	 * line drawn over some of them.
	 *
	 * This is lifted from the reference build the user pointed at (MadLab's
	 * Nights of Miami, the same 5x4/14-line shape on the same engine): its
	 * winning cells stay lit and the rest go dark, which is what makes a win read
	 * as an event rather than as a line being drawn. It costs nothing and it is
	 * the single largest readability difference between the two boards.
	 */
	winningCells: [] as { reel: number; row: number }[],
	// Per-reel anticipation magnitude for the spin now on the reels, after
	// bookEventHandlerMap's gate. 0 = no tease, 1 = two scatters already landed,
	// 2+ = three or more (the trigger count), so 2+ means the next scatter pays.
	// The reel itself only carries a boolean (reelState.anticipating) because
	// utils-slots discards the magnitude; this is the Hot Miami-side copy that
	// lets the tease escalate.
	anticipation: [] as number[],
	/** the reveal's wide reels, for the big-symbol layer (SPEC §1.1) */
	bars: [] as RevealBar[],
	/** per-reel extra travel (cells) for the current spin's merging blocks; -1 = no padding of its own */
	mergeExtra: [] as number[],
	/** 0..1 scene tint while a conversion runs (WildTransfer drives it, Game.svelte draws it) */
	fogTint: 0,
	/** the previous round's final board: the merge path's seed (SPEC §2.2) */
	lastBoard: null as null | RawSymbol[][],
	/**
	 * The conversion that follows the current reveal, known at spin start: the
	 * reveal handler reads one event ahead so the character can raise its hand
	 * 0.4 s into the spin, before the reels have stopped (SPEC §2.3).
	 */
	pendingTransfer: null as null | WildTransferPosition[],
	/** a seeded generator for this spin's cosmetic choices (game/seeded.ts) */
	spinRandom: (() => 0.5) as () => number,
	/** free-game ladder: running points, step reached, multiplier in force */
	ladder: { points: 0, step: 0, mult: 1 },
	/** false between the feature's trigger and its first spin: the entry updateGlobalMult sets the ladder silently */
	featureStarted: false,

	// True while the feature splash is up. Read by Cast.svelte, which stands its
	// figure down for the duration.
	featureSplashShow: false,
	// True for as long as the win banner (BIG / SUPER / MEGA / EPIC / MAX WIN)
	// is on screen: nothing behind it may be dimmed.
	winCelebrationShow: false,
	/**
	 * What the character is asked to do, as a cue (SPEC §4). CastSpine maps cues
	 * onto the clips the current rig has; until the alchemist rig exists the
	 * Hard Time placeholder rig stands in with its two reactions.
	 */
	castReaction: { kind: 'idle' as CastCue, seq: 0 },
});

export type CastCue =
	| 'idle'
	| 'transIn'
	| 'transOut'
	| 'transBack'
	| 'win01'
	| 'win02'
	| 'win025'
	| 'win03'
	| 'trigger';

// The reel housing fills 94% of the box height (BOARD_SIZES is 590 tall and
// BoardFrame draws it at FRAME_SCALE 1.28 → 755 of 800), so a strip along the
// bottom cannot simply be laid over it. Nor can the board just be pushed up: the
// game box maps exactly onto the canvas, so anything past the top edge is
// clipped rather than spilling into the background. It is scaled down instead,
// and lifted by half of what the strip took so it stays centred in what is left.
//
// Measured rather than guessed: at 0.96 the housing landed within 2px of both
// the canvas top and the strip — visually fine but no margin at all, and a
// different viewport aspect would have pushed it under. Now that the strip is a
// framed panel rather than a flat band it is taller, and the board gives up a
// little more again. Raising this is what to try first if the board ever needs
// to be bigger; the housing bottom against uiTheme.barHeight is the limit.
//
// 2026-08-11, 0.89 → 1.12. The paragraph above reasons about the housing *box*,
// which is the wrong quantity: the box is mostly transparent margin. What the
// player sees is the ink, and every limit below is measured against that.
//
//   housing box  = BOARD_SIZES * shrink * BoardFrame's FRAME_SCALE (1.28)
//   visible ink  = housing box * 0.938   (frame_edge.png's alpha bbox fills
//                  0.938 of its 1280 square — GoBananas' fills 0.970, so the two
//                  games' shrink values are NOT comparable as raw numbers)
//   board centre = (711, 330);  available height = 800 - uiTheme.barHeight = 660
//
// Two things bind, and the vertical one is the looser of the two:
//
//   BOTTOM  ink reaches the bet bar at shrink 1.16.
//   LEFT    Buy Bonus is pinned at railWidth/2 = x 200 and drawn UI_BASE_SIZE
//           (150) * uiTheme.buyBonusRailScale wide, with buybonus_plate.png
//           filling 0.981 of its square. At the shared default scale 2.4 that
//           plate ends at x 376, while the board's ink edge is 711 - 354.2 *
//           shrink — x 397 at 0.89. Twenty pixels. THAT is what pinned the board
//           at 0.89, not the bet bar, and it is why 0.94 (tried earlier the same
//           day) was already 1px inside the plate.
//
// buyBonusRailScale is therefore 1.35 in uiTheme.ts, ending the plate at x 299.
//
// Sized against GoBananas, the only in-repo reference that matters here: it
// fills 98.8% of its available height, with 4px top and bottom. 1.12 fills 96.2%
// with 13px, and holds 15px off Buy Bonus. 1.16 would reach 99.6% but leaves 1px
// on all three limits, which is not a margin. So 1.12 is the last value with
// somewhere to fall.
//
// Cell size runs 105px at 0.89 -> 132px at 1.12, +58% in area. GoBananas' cells
// are 105px, but it is 5x5 against this game's 5x4 — filling the same height
// with one fewer row necessarily means bigger cells, so 132 vs 105 is the
// expected result of matching it, not an overshoot.
//
// Moving the board means re-checking all three together: bar below, Buy Bonus
// left, and FreeSpinCounter — which tracks the housing width in
// FreeSpinCounter.svelte precisely so it cannot be forgotten again.
//
// None of this removes the left/right whitespace, and nothing can. The board is
// 5x4 inside a 1.78 box, so it is height-bound and can never fill the width.
// Content *beside* the reels is what fills that — the backgrounds' edge
// subjects — not a bigger board.
const BOARD_SHRINK = 1.12;

// ── portrait: fit the housing between the top strip and the WIN plate ──────
//
// Portrait draws the board in the CENTRED game box and the shared controls in
// the standard box aligned to the screen's BOTTOM (LayoutPortrait), with the
// WIN plate at 670 above the standard floor. On a tall phone (390x844) the two
// boxes leave a gap between them; at 9:16 (320x568) they coincide and the WIN
// plate sat on the bottom row of symbols, and at 425x812 on the housing's lower
// edge (QA 11-11 B4/B5). The strip above the housing (cornerLogo.portraitBand:
// logo + cast in the base game, the free-game HUD in the feature) needs
// PORTRAIT_BAND_MIN px or nothing is drawn there — which is how 320x568 lost the
// flask, the points and the ladder.
//
// So in portrait the housing is kept inside [strip floor, WIN plate top − gap]:
// moved up first, and shrunk only by what does not fit, but never below the
// width at which a side band would open (Cast.svelte's 15% test). 390x844 is
// unchanged (it already fits); 425x812 shrinks ~5%; 320x568 ~19% — there the
// strip stays too thin for logo + cast, and the free-game HUD takes it as one
// row instead (hudLayout.portraitCompactStrip). The same size in both games,
// so the feature still opens at the base game's board size.
/** BoardFrame / cornerLogo: the housing's ink edge is 1.12x the reels. */
const HOUSING_INK = 1.12;
/** LayoutPortrait: WIN plate centre above the standard floor, its half-height (std units). */
const PORTRAIT_WIN_Y = 670;
const PORTRAIT_WIN_HALF = 56;
/** canvas px between the housing ink and the WIN plate */
const PORTRAIT_WIN_GAP = 8;
/** cornerLogo: the clock line + gap above the strip; the strip's minimum height */
const PORTRAIT_TOP_LINE = 38;
export const PORTRAIT_BAND_MIN = 100;

const portraitFit = (y: number, scale: number) => {
	if (stateLayoutDerived.layoutType() !== 'portrait') return { y, scale };
	const canvas = stateLayoutDerived.canvasSizes();
	const main = stateLayoutDerived.mainLayout();
	const stdW = 1080;
	const stdH = 1920;
	const stdScale = Math.min(canvas.width / stdW, canvas.height / stdH);
	const stdTop = canvas.height - stdH * stdScale;
	const bottomLimit =
		stdTop + (stdH - PORTRAIT_WIN_Y - PORTRAIT_WIN_HALF) * stdScale - PORTRAIT_WIN_GAP;
	// strip floor = housing top − 6 (cornerLogo GAP); +2 so it clears the minimum
	const topLimit = PORTRAIT_TOP_LINE + PORTRAIT_BAND_MIN + 6 + 2;
	const toCanvasY = (v: number) => main.y + (v - main.height * main.anchor) * main.scale;
	const toMainY = (c: number) => (c - main.y) / main.scale + main.height * main.anchor;
	const housingHalf = (BOARD_SIZES.height * scale * HOUSING_INK * main.scale) / 2;
	const avail = bottomLimit - topLimit;
	if (avail <= 0) return { y, scale };
	// Never so small that a side band opens beside it: Cast.svelte and
	// cornerLogo.castTopStd switch to the landscape side figure once 15% of the
	// standard width is free right of the housing ink (+4% margin).
	const minHalf = (0.5 - 0.15) * stdW * stdScale * 1.04;
	const k = Math.min(1, Math.max(avail / (housingHalf * 2), minHalf / housingHalf));
	const half = housingHalf * k;
	let centre = toCanvasY(y);
	centre = Math.max(centre, topLimit + half);
	// the WIN plate wins any conflict: never under it, even if the strip thins
	centre = Math.min(centre, bottomLimit - half);
	return { y: toMainY(centre), scale: scale * k };
};

// ── landscape: the whole housing on screen, above the bar ────────────────
//
// BOARD_SHRINK (1.12) was set for a 5x4 board. The 6x6 housing at that size is
// taller than a 16:9 screen minus the bar: at 1920x1080 its ink ran from y -51
// to 945, so the frame's top edge was off the screen and bar v3 had to shrink to
// 0.61x to clear the bottom (Dragon Tide's bar is full size). So in landscape the
// housing is kept between a small top margin and the bar's strip — moved first,
// shrunk only by what does not fit. 16:10 and 4:3 already fit and do not change.
const LANDSCAPE_TOP_MARGIN = 6;

const landscapeFit = (y: number, scale: number) => {
	if (stateLayoutDerived.layoutType() === 'portrait') return { y, scale };
	const canvas = stateLayoutDerived.canvasSizes();
	const main = stateLayoutDerived.mainLayout();
	// the bar stands on the screen's bottom edge in the standard box
	const stdScale = Math.min(canvas.width / 1920, canvas.height / 1080);
	const bottomLimit = canvas.height - uiTheme.barHeight * stdScale;
	const topLimit = LANDSCAPE_TOP_MARGIN * stdScale;
	const toCanvasY = (v: number) => main.y + (v - main.height * main.anchor) * main.scale;
	const toMainY = (c: number) => (c - main.y) / main.scale + main.height * main.anchor;
	const half = (BOARD_SIZES.height * scale * HOUSING_INK * main.scale) / 2;
	const avail = bottomLimit - topLimit;
	if (avail <= 0) return { y, scale };
	const k = Math.min(1, avail / (half * 2));
	let centre = toCanvasY(y);
	centre = Math.min(Math.max(centre, topLimit + half * k), bottomLimit - half * k);
	return { y: toMainY(centre), scale: scale * k };
};

const boardLayout = () => {
	const layout = stateLayoutDerived.mainLayout();
	const usesBar = uiTheme.betBarLayout === 'compactBottom';
	// Derived from the bar's own height rather than duplicated, so the two cannot
	// drift apart: the game box and the standard box cover the same screen, so the
	// strip occupies the same fraction of each.
	const barFraction = usesBar
		? uiTheme.barHeight / stateLayoutDerived.mainLayoutStandard().height
		: 0;
	const centre = layout.height * (0.5 - barFraction * 0.5);
	const shrink = usesBar ? BOARD_SHRINK : 1;
	// centred in the area above the strip, not in the whole box
	const fit = stateLayoutDerived.layoutType() === 'portrait' ? portraitFit(centre, shrink) : landscapeFit(centre, shrink);
	return {
		x: layout.width * 0.5,
		y: fit.y,
		scale: fit.scale,
		anchor: { x: 0.5, y: 0.5 },
		pivot: { x: BOARD_SIZES.width / 2, y: BOARD_SIZES.height / 2 },
		...BOARD_SIZES,
	};
};

const boardRaw = () =>
	board.map((reel) => reel.reelState.symbols.map((reelSymbol) => reelSymbol.rawSymbol));

const scatterLandIndex = () => {
	if (stateGame.scatterCounter > 5) return 5;
	if (stateGame.scatterCounter < 1) return 1;
	return stateGame.scatterCounter as 1 | 2 | 3 | 4 | 5;
};

const { enhanceBoard } = createEnhanceBoard();
const enhancedBoard = enhanceBoard({ board: stateGame.board });

export const { getWinLevelDataByWinLevelAlias } = createGetWinLevelDataByWinLevelAlias({
	winLevelMap,
});

export const stateGameDerived = {
	onSymbolLand,
	boardLayout,
	boardRaw,
	scatterLandIndex,
	enhancedBoard,
	getWinLevelDataByWinLevelAlias,
};

// ── debug probes ────────────────────────────────────────────────────────────
// Only attached when the page is opened with `?hmdebug=1`.
//
// Both of these earn their keep — the reel probe is what proved a stuck round
// was stuck before `motion` ever became 'spinning', and the emitter is the only
// way to summon a presentation beat that the maths produces once in thousands of
// rounds. Deleting them would mean rediscovering both the next time something is
// wrong.
//
// But a submission build is not a development build. `__HM_EMIT__` can broadcast
// any presentation event, and while it cannot touch the wallet or the maths (the
// books come from the RGS; the emitter only drives animation), a reviewer with a
// console open should not be able to make the game do arbitrary things. Behind a
// flag they are absent unless asked for, and the play shell just adds
// `&hmdebug=1` to its URL.
//
//     window.__HM_REELS__()               // motion / spinType / anticipating
//     window.__HM_EMIT__({ type: '...' }) // fire any emitter event
//     window.__HM_LINES__()               // win lines on screen right now
//     window.__HM_GAME__()                // gameType / isTurbo
//     window.__HM_TURBO__(true)           // set turbo (the toggle is canvas, not DOM)
if (typeof window !== 'undefined' && /[?&]hmdebug=1(&|$)/.test(window.location.search)) {
	(window as unknown as { __HM_REELS__: () => unknown }).__HM_REELS__ = () =>
		stateGame.board.map((reel, index) => ({
			reel: index,
			motion: reel.reelState.motion,
			spinType: reel.reelState.spinType,
			anticipating: reel.reelState.anticipating,
			// The symbols' own state, which is what actually drives the landing
			// squash. Reading it from outside is the only way to time the gap
			// between a reel arriving and its symbols reacting: measuring the
			// squash from the rendered transform cannot separate it from the
			// motion blur's vertical stretch, which is still decaying at that
			// moment and pulls the aspect ratio the other way.
			symbolState: reel.reelState.symbols[1]?.symbolState,
			// What this reel is showing. Added while checking that a teasing reel
			// scrolls the ordinary strip: the question "is there a scatter on the
			// reels that already stopped" cannot be answered from a screenshot of a
			// board mid-spin, and reading it off the rendered sprites means reading
			// motion-blurred art. Names only, and only under ?hmdebug=1.
			names: reel.reelState.symbols.map((symbol) => symbol.rawSymbol?.name),
		}));

	// Which game is on screen, and whether turbo is on. `__HM_REELS__` returns an
	// array and probes map over it, so this is a second hook rather than a field
	// on that one. Needed because reel timing is only meaningful per game type:
	// base-game turbo lands the board as a block on purpose, feature turbo does
	// not (SPIN_OPTIONS_FAST_FREEGAME.reelStaggerInTurbo), and a probe that
	// cannot tell them apart cannot check either.
	(window as unknown as { __HM_GAME__: () => unknown }).__HM_GAME__ = () => ({
		gameType: stateGame.gameType,
		isTurbo: stateBet.isTurbo,
		betMode: stateBet.activeBetModeKey,
		// How many cells are currently holding the rest of the board dim. Anything
		// other than 0 on a settled, idle board is the leak that left the screen
		// half-dark after a free game.
		dimmedBy: stateGame.winningCells.length,
		anticipation: [...stateGame.anticipation],
	});

	// Bet mode, settable — the same argument as __HM_TURBO__ below: the buy menu
	// is a Pixi overlay, and "a bought round must not tease" cannot be checked
	// from outside without being able to enter one.
	(window as unknown as { __HM_BETMODE__: (key: string) => string }).__HM_BETMODE__ = (key) => {
		stateBet.activeBetModeKey = key as typeof stateBet.activeBetModeKey;
		return stateBet.activeBetModeKey;
	};

	// Turbo, settable. The toggle is a Pixi button on the canvas, so nothing
	// outside the game can find it by label and every probe that wanted to
	// measure turbo timing had to guess at its coordinates — which is how one of
	// them ended up reporting "0 spins measured" after the button moved.
	(window as unknown as { __HM_TURBO__: (on: boolean) => boolean }).__HM_TURBO__ = (on) => {
		stateBet.isTurbo = on;
		return stateBet.isTurbo;
	};

	(window as unknown as { __HM_EMIT__: (event: unknown) => void }).__HM_EMIT__ = (event) =>
		eventEmitter.broadcast(event as Parameters<typeof eventEmitter.broadcast>[0]);

	// Cast reactions on demand (Spine cast, 2026-10-20). A searchlight or a big
	// win is a matter of luck in the stub, so the warden's point and the
	// prisoner's lean could not be looked at deliberately without this.
	//     __HM_CAST__('warden')            // as when a searchlight lands
	//     __HM_CAST__('win' | 'winBig' | 'trigger')
	(window as unknown as { __HM_CAST__: (kind: string) => void }).__HM_CAST__ = (kind) => {
		stateGame.castReaction = { kind: kind as CastCue, seq: stateGame.castReaction.seq + 1 };
	};

	// Win lines are Graphics, not sprites, so nothing outside the game can see
	// them — a screenshot catches one instant and the scene-graph probe reads
	// transforms. This counter is what makes "no line was ever drawn while a reel
	// was spinning" a measurement instead of an impression.
	(window as unknown as { __HM_LINES__: () => unknown }).__HM_LINES__ = () => ({
		count: stateGame.debugWinLineCount,
	});

	console.info('[hmdebug] __HM_REELS__, __HM_GAME__, __HM_TURBO__, __HM_EMIT__, __HM_CAST__ and __HM_LINES__ attached (audio: __HM_AUDIO__, __HM_REELSTOP__)');
}
