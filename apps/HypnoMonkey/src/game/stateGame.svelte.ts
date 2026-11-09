import _ from 'lodash';

import { stateBet } from 'state-shared';
import { createEnhanceBoard, createReelForCascading } from 'utils-slots';
import { createGetWinLevelDataByWinLevelAlias } from 'utils-shared/winLevel';

import { uiTheme } from 'components-ui-pixi';

import type { GameType, RawSymbol } from './types';
import { stateLayoutDerived } from './stateLayout';
import { stageLayout, stageAtBase, castPlacement, type Stage } from './stageLayout';
import { winLevelMap } from './winLevelMap';
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
const BOARD_SHRINK = 0.89;

/** The pre-bar placement: what the stage layout grows from (stageLayout.ts). */
const boardLayoutBase = () => {
	const layout = stateLayoutDerived.mainLayout();
	const usesBar = uiTheme.betBarLayout === 'compactBottom';
	const portrait=stateLayoutDerived.layoutType()==='portrait';
	const standardHeight=stateLayoutDerived.mainLayoutStandard().height;
	// Derived from the bar's own height rather than duplicated, so the two cannot
	// drift apart: the game box and the standard box cover the same screen, so the
	// strip occupies the same fraction of each.
	const barFraction = usesBar
		? (portrait?140:uiTheme.barHeight) / standardHeight
		: 0;
	return {
		x: layout.width * 0.5,
		// centred in the area above the strip, not in the whole box
		y: layout.height * (0.5 - barFraction * 0.5)+(usesBar&&!portrait?10:0),
		scale: usesBar ? BOARD_SHRINK*(portrait?1:(1-barFraction)/(1-140/standardHeight)) : 1,
		anchor: { x: 0.5, y: 0.5 },
		pivot: { x: BOARD_SIZES.width / 2, y: BOARD_SIZES.height / 2 },
		...BOARD_SIZES,
	};
};

// With the game's own bet bar (uiTheme.customLayout, the v3 console) the board
// is sized to the room the console leaves and the cast moved beside it
// (stageLayout.ts). Solved once per screen size: every board layer reads
// boardLayout() on its own.
let stageMemo: { key: string; stage: Stage } | undefined;
const stage = (): Stage => {
	const base = boardLayoutBase();
	if (!uiTheme.customLayout) return stageAtBase(base);
	const canvas = stateLayoutDerived.canvasSizes();
	const main = stateLayoutDerived.mainLayout();
	const standard = stateLayoutDerived.mainLayoutStandard();
	const portrait = stateLayoutDerived.layoutType() === 'portrait';
	const key = [canvas.width, canvas.height, portrait, main.scale, standard.scale, base.x, base.y, base.scale].join();
	if (stageMemo?.key !== key)
		stageMemo = { key, stage: stageLayout({ canvas, main, standard, portrait, base }) };
	return stageMemo.stage;
};

const boardLayout = () => {
	const base = boardLayoutBase();
	const placed = stage();
	return { ...base, x: placed.x, y: placed.y, scale: placed.scale };
};

/** Where the MG Hypnotist / FG assistant stands, board units (HypnoCastView). */
const castLayout = (freeGame: boolean) =>
	castPlacement(stage(), freeGame ? 'fg' : 'mg', stateLayoutDerived.layoutType() === 'portrait');

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
	boardLayoutBase,
	castLayout,
	stage,
	boardRaw,
	scatterLandIndex,
	enhancedBoard,
	getWinLevelDataByWinLevelAlias,
};
