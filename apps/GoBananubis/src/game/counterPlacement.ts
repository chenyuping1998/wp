// WHERE THE FREE-SPINS PLAQUE SITS, in one place.
//
// FreeSpinCounter draws the plaque, and MysteryOracle now flies the run's symbol
// INTO it (the symbol the tablets will all open to lives on the plaque for the
// rest of the round). Both have to agree on where it is, and on where the badge
// that holds the symbol sits on it — so the layout is computed here and both
// read it, instead of the oracle keeping a copy of a formula that could drift.
//
// All in MainContainer coordinates. `toBoardLocal` converts into the space
// BoardContainer draws in (its scale and pivot), which is where the oracle lives.
import type { getContext } from './context';
import { SYMBOL_SIZE } from './constants';

type Context = ReturnType<typeof getContext>;

// brass plaque left of the board (fs_counter_panel.png, 824×622)
export const PANEL_RATIO = 824 / 622;

export const counterPlacement = (context: Context) => {
	const panelWidth = SYMBOL_SIZE * 2.1;
	const panelSizes = { width: panelWidth, height: panelWidth / PANEL_RATIO };
	const board = context.stateGameDerived.boardLayout();
	const isPortrait = context.stateLayoutDerived.layoutType() === 'portrait';
	const position = isPortrait
		? {
				// portrait: centred above the board (no room at the side)
				x: board.x - panelSizes.width * 0.5,
				y: board.y - board.height * 0.5 - panelSizes.height * 1.28 - SYMBOL_SIZE * 0.3,
			}
		: {
				x: board.x - board.width * 0.5 - panelSizes.width - SYMBOL_SIZE * 0.6,
				// Pinned near the top of the screen rather than to the board's top
				// edge. With the side-rail UI the Buy Bonus button is centred in the
				// left rail, and the board fills 94% of the height — the old
				// board-relative position put this plaque straight through it.
				y: context.stateLayoutDerived.mainLayout().height * 0.05,
			};
	return { position, panelSizes };
};

// THE RUN'S SYMBOL: a medal in the screen's top-right corner.
//
// It first hung off the free-spins plaque, and there it sat on the title and
// crowded the board. The top-right corner is empty — the mascot stands below it
// — and it is where a player looks for the round's standing information, so the
// symbol every tablet will open to lives there for the rest of the round.
//
// Portrait has no spare corner (the plaque sits above the board and the mascot
// is not beside it), so there it hangs off the plaque's right edge instead.
export const runBadgeMain = (context: Context) => {
	const size = SYMBOL_SIZE * 0.62;
	if (context.stateLayoutDerived.layoutType() === 'portrait') {
		const { position, panelSizes } = counterPlacement(context);
		return {
			x: position.x + panelSizes.width + size * 0.15,
			y: position.y + size * 0.55,
			size,
		};
	}
	const layout = context.stateLayoutDerived.mainLayout();
	return {
		x: layout.width - size * 0.75 - SYMBOL_SIZE * 0.1,
		// level with the top of the plaque on the other side
		y: layout.height * 0.05 + size * 0.5,
		size,
	};
};

// MainContainer → the space BoardContainer draws in
export const toBoardLocal = (context: Context, main: { x: number; y: number }) => {
	const layout = context.stateGameDerived.boardLayout();
	return {
		x: (main.x - layout.x) / layout.scale + layout.pivot.x,
		y: (main.y - layout.y) / layout.scale + layout.pivot.y,
		scale: layout.scale,
	};
};

// where the oracle should fly to, in board-local units, and how big the tile ends up
export const runBadgeTarget = (context: Context) => {
	const badge = runBadgeMain(context);
	const local = toBoardLocal(context, badge);
	return { x: local.x, y: local.y, size: badge.size / local.scale };
};
