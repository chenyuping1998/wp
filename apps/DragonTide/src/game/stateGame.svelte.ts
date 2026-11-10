import _ from 'lodash';

import { stateBet } from 'state-shared';
import { createEnhanceBoard, createReelForCascading } from 'utils-slots';
import { createGetWinLevelDataByWinLevelAlias } from 'utils-shared/winLevel';

import { uiTheme } from 'components-ui-pixi';

import type { GameType, RawSymbol } from './types';
import { stateLayoutDerived } from './stateLayout';
import { winLevelMap } from './winLevelMap';
import artGeometry from './artGeometry.json';
import { eventEmitter } from './eventEmitter';
import {
	SYMBOL_SIZE,
	BOARD_SIZES,
	INITIAL_BOARD,
	BOARD_DIMENSIONS,
	SPIN_OPTIONS_DEFAULT,
	SPIN_OPTIONS_ANTICIPATED,
	SPIN_OPTIONS_FAST,
	SPIN_OPTIONS_FAST_FREEGAME,
	turbo2Options,
	INITIAL_SYMBOL_STATE,
	SCATTER_LAND_SOUND_MAP,
} from './constants';

const onSymbolLand = ({ rawSymbol }: { rawSymbol: RawSymbol; reelIndex?: number }) => {
	if (rawSymbol.name === 'S') {
		eventEmitter.broadcast({ type: 'soundScatterCounterIncrease' });
		eventEmitter.broadcast({
			type: 'soundOnce',
			name: SCATTER_LAND_SOUND_MAP[scatterLandIndex()],
		});
	}
};

// Listed rather than built with a template literal: `sfx_reel_stop_${n}` widens
// to plain string and loses the SoundEffectName check. There are six columns and
// five stop sounds, so the last reuses the top of the ladder.
const REEL_STOP_SOUNDS = [
	'sfx_reel_stop_1',
	'sfx_reel_stop_2',
	'sfx_reel_stop_3',
	'sfx_reel_stop_4',
	'sfx_reel_stop_5',
	'sfx_reel_stop_5',
] as const;

const board = _.range(BOARD_DIMENSIONS.x).map((reelIndex) => {
	// Cascading, not spinning: the board drops in and tumbles.
	const reel = createReelForCascading({
		reelIndex,
		symbolHeight: SYMBOL_SIZE,
		initialSymbols: INITIAL_BOARD[reelIndex],
		initialSymbolState: INITIAL_SYMBOL_STATE,
		onReelStopping: () => {
			eventEmitter.broadcast({
				type: 'soundOnce',
				name: REEL_STOP_SOUNDS[reelIndex] ?? 'sfx_reel_stop_1',
				forcePlay: !stateBet.isTurbo,
			});
			// A light knock on the frame so symbols landing read as weight arriving.
			// Skipped in turbo, where six knocks inside half a second are noise.
			if (!stateBet.isTurbo) {
				eventEmitter.broadcast({ type: 'boardFrameImpact', strength: 0.1 });
			}
		},
		onSymbolLand: ({ rawSymbol }) => onSymbolLand({ rawSymbol, reelIndex }),
	});

	reel.reelState.spinOptions = () => {
		// Checked before the turbo branch on purpose: a tease is worth watching even
		// in turbo, and it is the one thing in the game a player has asked to see.
		if (reel.reelState.spinType === 'anticipated') return SPIN_OPTIONS_ANTICIPATED;
		if (reel.reelState.spinType !== 'fast') return SPIN_OPTIONS_DEFAULT;
		const fast = stateGame.gameType === 'freegame' ? SPIN_OPTIONS_FAST_FREEGAME : SPIN_OPTIONS_FAST;
		return stateBet.turboLevel === 2 ? turbo2Options(fast) : fast;
	};

	return reel;
});

export type Reel = (typeof board)[number];
export type ReelSymbol = Reel['reelState']['symbols'][number];

export const stateGame = $state({
	board,
	gameType: 'basegame' as GameType,
	scatterCounter: 0,
	// Medusa's running total in the free game (SPEC 3-2). 0 outside a feature;
	// only an applied throw adds to it, and it clears when the feature ends.
	medusaTotal: 0,
	// Running total of the tumble sequence in progress, in book cents.
	tumbleWin: 0,
	// How many links the current tumble chain has resolved (1 = first win).
	tumbleChain: 0,
});

// The reel housing fills 94% of the box height, so a strip along the bottom
// cannot simply be laid over it, and the board cannot just be pushed up either:
// the game box maps exactly onto the canvas, so anything past the top edge is
// clipped rather than spilling into the background. It is scaled down instead and
// lifted by half of what the strip took so it stays centred in what is left.
// (The pre-art fit; boardStage below grows the board from it.)
const BOARD_SHRINK = 0.89;

// Board size and place (Stone 2026-11-10「感覺盤面有點小」). The fit above left open sea over
// the wordmark and between the frame's foot and the bet strip, so the board now takes the
// largest scale, up to GROW_MAX of that fit, at which every one of these still holds:
//   landscape  the wordmark stays TOP under the box top, the frame's foot WELL_GAP above the
//              strip's jade well, the frame GATE_GAP clear of the Buy Bonus gate, and the king's
//              staff at full swing EDGE inside the right edge (the board sits between the two);
//   portrait   the cast's highest act stays TOP under the box top, the frame's foot WELL_GAP
//              above the WIN plate, and the frame inside both screen sides.
// MG and FG share it (free spins never resize the board). Where nothing lets it grow (the
// near-square tablet box, whose width the cast already fills), the old fit and centre stay.
// Margins are standard-layout units; everything else is measured in board units on the art
// (frame and wordmark: boardFrameScene; cast reach: dragonCastExtents.json, MG cast / win_big).
const GROW_MAX = 1.2;
const TOP = 16, WELL_GAP = 18, GATE_GAP = 32, EDGE = 10, SIDE = 16;
const LOGO_ABOVE = 109, FRAME_BELOW = 48, FRAME_SIDE = 38;
const CAST_REACH = 1102, CAST_ABOVE_PORTRAIT = 388;
// the Buy Bonus gate spans 2 x 208 standard units per unit of buyBonusPlateScale, centred on
// the rail (measured on the art, whose palace gate fills its whole 640 canvas)
const GATE_HALF_PER_PLATE = 208;
// portrait: top of the WIN plate's art (the shared portrait controls), standard units
const PORTRAIT_CONTROLS_TOP = 1465;

type BoardPlace = { x: number; y: number; scale: number };

function boardStage(base: BoardPlace, main: { width: number; height: number }, std: { width: number; height: number }, portrait: boolean): BoardPlace {
	const k = main.width / std.width; // standard -> game units (each layout's two boxes share an aspect)
	const BW = BOARD_SIZES.width, BH = BOARD_SIZES.height;
	const cap = base.scale * GROW_MAX;
	if (portrait) {
		const top = TOP * k, foot = (PORTRAIT_CONTROLS_TOP - WELL_GAP) * k;
		const byHeight = (foot - top) / (CAST_ABOVE_PORTRAIT + BH + FRAME_BELOW);
		const byWidth = (main.width - 2 * SIDE * k) / (BW + 2 * FRAME_SIDE);
		const scale = Math.min(cap, byHeight, byWidth);
		if (scale <= base.scale) return base;
		const slack = foot - top - (CAST_ABOVE_PORTRAIT + BH + FRAME_BELOW) * scale;
		const boardTop = top + slack / 2 + CAST_ABOVE_PORTRAIT * scale;
		return { x: base.x, y: boardTop + (BH / 2) * scale, scale };
	}
	const barTop = std.height - uiTheme.barHeight;
	const well = (barTop + (0.5 - artGeometry.bar.panel.h / 2) * (uiTheme.barHeight - uiTheme.barFrameBottom)) * k;
	const gateRight = (uiTheme.railWidth * 0.5 + GATE_HALF_PER_PLATE * uiTheme.buyBonusPlateScale) * k;
	const top = TOP * k, foot = well - WELL_GAP * k, minX = gateRight + GATE_GAP * k, maxX = main.width - EDGE * k;
	const byHeight = (foot - top) / (LOGO_ABOVE + BH + FRAME_BELOW);
	const byWidth = (maxX - minX) / (FRAME_SIDE + CAST_REACH);
	const scale = Math.min(cap, byHeight, byWidth);
	if (scale <= base.scale) return base;
	// between the gate and the staff's reach; between the box top and the strip
	const boardLeft = (minX + FRAME_SIDE * scale + maxX - CAST_REACH * scale) / 2;
	const slack = foot - top - (LOGO_ABOVE + BH + FRAME_BELOW) * scale;
	const boardTop = top + slack / 2 + LOGO_ABOVE * scale;
	return { x: boardLeft + (BW / 2) * scale, y: boardTop + (BH / 2) * scale, scale };
}

const boardLayout = () => {
	const layout = stateLayoutDerived.mainLayout();
	const usesBar = uiTheme.betBarLayout === 'compactBottom';
	const portrait=stateLayoutDerived.layoutType()==='portrait';
	const standard=stateLayoutDerived.mainLayoutStandard();
	const standardHeight=standard.height;
	// Derived from the bar's own height rather than duplicated, so the two cannot
	// drift apart: the game box and the standard box cover the same screen, so the
	// strip occupies the same fraction of each.
	const barFraction = usesBar
		? (portrait?140:uiTheme.barHeight) / standardHeight
		: 0;
	const base: BoardPlace = {
		x: layout.width * 0.5,
		// centred in the area above the strip, not in the whole box
		y: layout.height * (0.5 - barFraction * 0.5)+(usesBar&&!portrait?10:0),
		scale: usesBar ? BOARD_SHRINK*(portrait?1:(1-barFraction)/(1-140/standardHeight)) : 1,
	};
	const place = usesBar ? boardStage(base, layout, standard, portrait) : base;
	return {
		...place,
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
