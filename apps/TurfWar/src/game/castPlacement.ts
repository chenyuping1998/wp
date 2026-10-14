import { CAST_NATIVE } from '../components/CastFigure.svelte';
import type { getContext } from './context';
import { stateGame } from './stateGame.svelte';

/**
 * Where the masked bat carrier stands, in the STANDARD layout box (the space
 * CastFigureMesh maps to canvas px). Shared by the board's figure (Cast.svelte)
 * and the free-game splash, so the splash draws him exactly where the player
 * has just been looking at him.
 *
 * The splash used to pass its own main-layout numbers instead — the wrong box,
 * and at stage index 2 under its own scrim — so the entry card had no character
 * at all (2026-09-29 audit; Hard Time had the same bug).
 *
 * Same arithmetic as Cast.svelte's own derivation (documented there, constant by
 * constant); change both together.
 */
const FRAME_SCALE = 1280 / 1110;
const FRAME_INK = 0.938;
const OVERLAP = 10;
const BLEED = 1.12; // natural size before the layer envelope fit
const FEATURE_GUTTER = 60;

export const castPlacement = (context: ReturnType<typeof getContext>) => {
	const layout = context.stateGameDerived.boardLayout();
	const box = context.stateLayoutDerived.mainLayout();
	const std = context.stateLayoutDerived.mainLayoutStandard();
	const toStandard = (xInGameBox: number) =>
		std.width * 0.5 + ((xInGameBox - box.width * 0.5) * box.scale) / std.scale;
	const boardInkRight = toStandard(
		layout.x + layout.width * layout.scale * FRAME_SCALE * 0.5 * FRAME_INK,
	);
	const width = (std.width - (boardInkRight - OVERLAP)) * BLEED;
	const height = (width * CAST_NATIVE.guy.h) / CAST_NATIVE.guy.w;
	return {
		boardInkRight,
		height,
		topY: std.height * 0.145,
		x:
			boardInkRight -
			OVERLAP +
			width * 0.5 +
			(stateGame.gameType === 'freegame' ? FEATURE_GUTTER : 0),
		groundY: std.height,
		// below ~15% of the width there is no side band to stand in (portrait)
		hasSideBand: (std.width - boardInkRight) / std.width >= 0.15,
	};
};
