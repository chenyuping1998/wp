import _ from 'lodash';
import type { Tween } from 'svelte/motion';

import { stateBet } from 'state-shared';
import { createEnhanceBoard, createReelForSpinning } from 'utils-slots';
import { createGetWinLevelDataByWinLevelAlias } from 'utils-shared/winLevel';

import { uiTheme } from 'components-ui-pixi';

import type { GameType, RawSymbol, SymbolState } from './types';
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

	if (rawSymbol.name === 'W') {
		// Sticky expanded-wild reels are full of W symbols on every reveal —
		// suppress their landing plucks so only fresh Wilds are heard.
		if (reelIndex !== undefined && stateGame.stickyWildReels.includes(reelIndex)) return;
		eventEmitter.broadcast({
			type: 'soundOnce',
			name: 'sfx_multiplier_landing',
		});
	}
};

// Listed rather than built with a template literal: `sfx_reel_stop_${n}` widens
// to plain string, losing the SoundEffectName check, and would silently produce
// a name that does not exist if the reel count ever changed. The index fallback
// below covers that case too.
const REEL_STOP_SOUNDS = [
	'sfx_reel_stop_1',
	'sfx_reel_stop_2',
	'sfx_reel_stop_3',
	'sfx_reel_stop_4',
	'sfx_reel_stop_5',
] as const;

const board = _.range(BOARD_DIMENSIONS.x).map((reelIndex) => {
	const reel = createReelForSpinning({
		reelIndex,
		symbolHeight: SYMBOL_SIZE,
		initialSymbols: INITIAL_BOARD[reelIndex],
		initialSymbolState: INITIAL_SYMBOL_STATE,
		onReelStopping: () => {
			// A reel locked by a sticky expanded wild is a solid wall of Wild that
			// does not really "land" — it was already there. Firing the stop click
			// and the housing knock on it made the lock sound like a fresh drop every
			// spin, which reads wrong. Stay silent on those reels, same as the W
			// landing pluck already does (onSymbolLand). A reel that is only NOW being
			// taken over is not yet in stickyWildReels, so its genuine landing still
			// sounds — the takeover's own impact follows.
			if (stateGame.stickyWildReels.includes(reelIndex)) return;

			// Each reel plays its own stop, pitched a step higher than the last
			// (see SPRITE_TO_CN in Sound.svelte). This used to be hardcoded to _1,
			// so all five reels landed on one identical click and _2.._5 were dead.
			eventEmitter.broadcast({
				type: 'soundOnce',
				name: REEL_STOP_SOUNDS[reelIndex] ?? 'sfx_reel_stop_1',
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
		if (reel.reelState.spinType !== 'fast') return SPIN_OPTIONS_DEFAULT;
		if (stateGame.gameType === 'freegame') return SPIN_OPTIONS_FAST_FREEGAME;
		return SPIN_OPTIONS_FAST;
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
	 * How many win lines are drawn right now. Debug-only bookkeeping, written by
	 * WinLines.svelte and read by `__HM_LINES__` under ?hmdebug=1 — win lines are
	 * Graphics rather than sprites, so nothing outside the game can otherwise
	 * observe them, and "a line appeared while the reels were spinning" is a bug
	 * that needs measuring rather than eyeballing.
	 */
	debugWinLineCount: 0,
	// Per-reel anticipation magnitude for the spin now on the reels, after
	// bookEventHandlerMap's gate. 0 = no tease, 1 = two scatters already landed,
	// 2+ = three or more (the trigger count), so 2+ means the next scatter pays.
	// The reel itself only carries a boolean (reelState.anticipating) because
	// utils-slots discards the magnitude; this is the Hot Miami-side copy that
	// lets the tease escalate.
	anticipation: [] as number[],
	// reels currently locked by sticky expanded wilds (free game only)
	stickyWildReels: [] as number[],
	// superspin: coins stuck to the board, evaluated at the end of the round
	// (row includes the padding offset, prize is in book cents)
	stickyPrizes: [] as { reel: number; row: number; prize: number }[],
	// Neon Frames currently on the grid, keyed by board position. Frames are
	// positional overlays rather than symbols, so they live beside the board
	// rather than inside it.
	frames: [] as { reel: number; row: number; mult: number }[],
	bonusTier: null as null | 'neon_nights' | 'sunset_hits' | 'ocean_drive',
});

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

const boardLayout = () => {
	const layout = stateLayoutDerived.mainLayout();
	const usesBar = uiTheme.betBarLayout === 'compactBottom';
	// Derived from the bar's own height rather than duplicated, so the two cannot
	// drift apart: the game box and the standard box cover the same screen, so the
	// strip occupies the same fraction of each.
	const barFraction = usesBar
		? uiTheme.barHeight / stateLayoutDerived.mainLayoutStandard().height
		: 0;
	return {
		x: layout.width * 0.5,
		// centred in the area above the strip, not in the whole box
		y: layout.height * (0.5 - barFraction * 0.5),
		scale: usesBar ? BOARD_SHRINK : 1,
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
if (typeof window !== 'undefined' && /[?&]hmdebug=1(&|$)/.test(window.location.search)) {
	(window as unknown as { __HM_REELS__: () => unknown }).__HM_REELS__ = () =>
		stateGame.board.map((reel, index) => ({
			reel: index,
			motion: reel.reelState.motion,
			spinType: reel.reelState.spinType,
			anticipating: reel.reelState.anticipating,
		}));

	(window as unknown as { __HM_EMIT__: (event: unknown) => void }).__HM_EMIT__ = (event) =>
		eventEmitter.broadcast(event as Parameters<typeof eventEmitter.broadcast>[0]);

	// Win lines are Graphics, not sprites, so nothing outside the game can see
	// them — a screenshot catches one instant and the scene-graph probe reads
	// transforms. This counter is what makes "no line was ever drawn while a reel
	// was spinning" a measurement instead of an impression.
	(window as unknown as { __HM_LINES__: () => unknown }).__HM_LINES__ = () => ({
		count: stateGame.debugWinLineCount,
	});

	console.info('[hmdebug] __HM_REELS__, __HM_EMIT__ and __HM_LINES__ attached');
}
