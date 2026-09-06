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
	BOARD_ROWS_BASE,
	MAX_ROWS,
	paddedReelLength,
	isBoughtMode,
	SPIN_OPTIONS_BOUGHT,
	SPIN_OPTIONS_DEFAULT,
	SPIN_OPTIONS_FAST,
	SPIN_OPTIONS_TURBO_FREEGAME,
	SPIN_OPTIONS_HOLDANDSPIN,
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
		// No suppression here, unlike gen-2. A sticky expanded wild filled its whole
		// reel with W on every reveal, so the landing pluck had to be silenced or it
		// fired five times for symbols that were already there. A SPLIT reel is not
		// like that: the symbols on it are ordinary symbols that genuinely land, and
		// only their COUNT toward the ways is doubled. So a Wild landing on a split
		// reel is a real landing and should be heard.
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
		// THIS REEL's height, which is not the board's: growth is per reel here,
		// so [6,4,4,4,4] is an ordinary board and each reel has to pad and
		// pre-spin its own strip. Margin Call is the only other game passing this
		// and its board grows uniformly, so it can read one number for all five.
		//
		// Reads stateGame, declared BELOW this array. Safe because it is only ever
		// called during a spin, long after the module finished evaluating — and
		// NOT safe if createReelForSpinning ever calls it while building the reel,
		// which would touch stateGame inside its temporal dead zone and throw
		// before a frame renders. utils-slots documents that guarantee.
		// The return type is annotated to break a CIRCULAR INFERENCE, not for
		// documentation: this closure reads stateGame, stateGame is declared below
		// this array, and without an annotation TypeScript has to infer `board`
		// from a getter that depends on something declared after it. The whole
		// chain then collapses to `any` — seven errors here and five more in the
		// components that read the board, none of them pointing at the cause.
		getReelLength: (): number =>
			paddedReelLength(stateGame.growRows[reelIndex] ?? BOARD_ROWS_BASE[reelIndex]),
		onReelStopping: () => {
			// Every reel stops audibly, including split ones — see the note in
			// onSymbolLand. Gen-2 silenced locked reels because they were a wall of
			// Wild that had not moved; a split reel spins and lands like any other.
			//
			// Each reel plays its own stop, pitched a step higher than the last
			// (see SPRITE_TO_CN in Sound.svelte). This used to be hardcoded to _1,
			// so all five reels landed on one identical click and _2.._5 were dead.
			eventEmitter.broadcast({
				type: 'soundOnce',
				name: REEL_STOP_SOUNDS[reelIndex] ?? 'sfx_reel_stop_1',
				// Superspin forces the click through in turbo as well: its stops are
				// the event, and a dropped reel-stop there is a missing beat rather
				// than one less click in a rapid sequence.
				// The free game joins hold and spin here: its reels now land one at a
				// time under turbo, and a stop you can see but not hear is worse
				// than either.
				forcePlay:
					!stateBet.isTurbo ||
					stateGame.gameType === 'holdandspin' ||
					stateGame.gameType === 'freegame',
			});
			// The housing takes the hit too — a much lighter version of the win
			// recoil, so a symbol landing reads as weight arriving in the frame
			// rather than a sprite appearing. Skipped in turbo, where five recoils
			// inside half a second would just be noise.
			// Same reasoning as the reel-stop click above — hold and spin keeps the weight
			// in its stops no matter what turbo is set to.
			if (
				!stateBet.isTurbo ||
				stateGame.gameType === 'holdandspin' ||
				stateGame.gameType === 'freegame'
			) {
				eventEmitter.broadcast({ type: 'boardFrameImpact', strength: 0.12 });
			}
		},
		onSymbolLand: ({ rawSymbol }) => onSymbolLand({ rawSymbol, reelIndex }),
	});

	reel.reelState.spinOptions = () => {
		// Checked BEFORE spinType, which is the whole point: turbo sets spinType to
		// 'fast' and every other mode obeys it. The hold-and-spin round does not —
		// it is a reveal the player is meant to read cell by cell, and at turbo
		// speed the three respins were over before that was possible.
		if (stateGame.gameType === 'holdandspin') return SPIN_OPTIONS_HOLDANDSPIN;
		// Also before spinType, and for the same reason. The free game asks for a
		// NORMAL spin even in turbo (see the reveal handler), so keying its profile
		// off spinType would have handed it the base-game timings — turbo would
		// have had no effect in the feature at all rather than too much.
		if (stateGame.gameType === 'freegame' && stateBet.isTurbo) return SPIN_OPTIONS_TURBO_FREEGAME;
		// The BASE spin of a bought round — the one that lands the three scatters.
		// Its anticipation is teasing a result the player has already bought, so it
		// gets a third of the tease. Gated on gameType as well as the mode: the
		// free spins that follow are bought too, and they have nothing to tease.
		if (stateGame.gameType === 'basegame' && isBoughtMode(stateBet.activeBetModeKey)) {
			return SPIN_OPTIONS_BOUGHT;
		}
		if (reel.reelState.spinType !== 'fast') return SPIN_OPTIONS_DEFAULT;
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
	// EVERY REEL's current height, 4..6. Set from the growReels book event, which
	// carries the full array rather than a delta precisely so this needs no
	// accumulation logic.
	//
	// The generated config's `numRows` is a static [4,4,4,4,4] and always will be
	// — the maths writes it once, at the end of the run — so this is the only
	// place the client knows how tall the board actually is.
	growRows: [...BOARD_ROWS_BASE] as number[],
	// How long the shutter has to complete its climb on the step currently being
	// presented, in ms — the part of the step AFTER the new cell is spliced in,
	// which is the only part anything is visible moving in.
	//
	// ReelGrow owns the pacing (the run accelerates and the last step lands) and
	// publishes the travel window rather than the whole step, so the phase weights
	// live in one file instead of being re-derived in the other. Published as
	// state rather than sent as an event because it is a PROPERTY of the moment,
	// not a thing that happens: a lid mounting mid-run needs to know it too.
	growTravelMs: 315,

	// Per-reel scoring multiplier, 1 or 2. A stretched reel counts double in the
	// free game and never in the base game. Sent by the maths rather than derived
	// from growRows: this is what the ways figure on screen is built from, and a
	// client that has to derive it is a client that can derive it wrongly.
	growMultipliers: Array(BOARD_DIMENSIONS.x).fill(1) as number[],

	// Steps spent on the ladder, 0..10. The board's silhouette is the real
	// progress meter here — the skyline steps down from reel 1 — but the number
	// still drives anticipation and the round-end presentation.
	growSteps: 0,
	growMaxSteps: 10,


	// hold and spin: coins stuck to the board, evaluated at the end of the round
	// (row includes the padding offset, prize is in book cents)
	stickyPrizes: [] as { reel: number; row: number; prize: number }[],
	// Where the mascot's hand is at the moment he lets go of a grenade, in
	// MAIN-LAYOUT coordinates — or null when he is not on screen at all, which is
	// every layout too narrow to stand him beside the board (see Mascot.svelte).
	//
	// Published by Mascot and read by TransitionAnimation. It goes through state
	// rather than an event because the transition needs it at the instant it
	// starts, not whenever the mascot last happened to broadcast.
	mascotThrowOrigin: null as { x: number; y: number } | null,
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
const BOARD_SHRINK = 0.89;

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
