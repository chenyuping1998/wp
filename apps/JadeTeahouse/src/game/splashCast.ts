// Where the Master stands on the free-spin splashes (SplashMaster.svelte), and
// the teapot he pours from. Shared so FreeSpinIntro can tell whether he is on
// screen (and wait for his pour before stamping the count) without mounting him.

type Layout = { width: number; height: number };
type Board = { x: number; y: number; width: number; height: number; scale: number };

/** gbBandit = the Master (sushiMaster spine): floor to head 882, 455 across */
export const MASTER_ART = { height: 882, width: 455 };
const MIN_GAP = 260;

/**
 * Mascot.svelte's placement rule, mirrored to the LEFT of the board: below
 * MIN_GAP of free space beside the frame (tablet, portrait) he is not drawn.
 */
export const masterPlacement = (layout: Layout, board: Board) => {
	// BoardFrame draws the housing at 1.28x the board
	const frameHalfWidth = (board.width * board.scale * 1.28) / 2;
	const frameHalfHeight = (board.height * board.scale * 1.28) / 2;
	const barHeight = layout.height - board.y * 2;
	const gapWidth = board.x - frameHalfWidth;
	if (gapWidth < MIN_GAP) return null;
	const height = Math.min((layout.height - barHeight) * 0.94, (gapWidth * 0.86 * MASTER_ART.height) / MASTER_ART.width);
	return {
		x: gapWidth / 2,
		y: Math.min(board.y + frameHalfHeight, layout.height - barHeight - 6),
		scale: height / MASTER_ART.height,
		gapWidth,
	};
};

/**
 * The teapot (sushiSymbols/h1.png) on the `prop` bone, in bone units with y
 * UP — the same numbers as design/teapot_rig.mjs, which renders the pose
 * offline (design/render_pour.mjs). Keep the two in step.
 */
export const TEAPOT = {
	x: -78,
	y: 6,
	w: 220,
	h: 220,
	spout: [-78 - 220 * 0.44, 6 + 220 * 0.2] as const,
};

/** design/pour_motion.mjs POUR, in ms */
export const POUR_MS = { flowFrom: 620, flowTo: 1780, duration: 2500 };
/** how long the stream takes to reach the board once it starts */
export const STREAM_TRAVEL_MS = 260;
