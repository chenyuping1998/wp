/**
 * Every presentation time constant, in one place, copied from the reference
 * game's own settings (new-games/wild-alchemy/SPEC.md §2). Nothing here is
 * tuned by feel: a value changes only when the spec does.
 *
 * Pixel speeds are in the reference's cell coordinates (108 x 100 px); convert
 * with `refCell` and the actual SYMBOL_SIZE before use, so timing is identical
 * at any cell size. Seconds unless the name says otherwise.
 */
export const REF_TIMING = {
	/** reference cell, px — the frame every px/s value below is measured in */
	refCell: { width: 108, height: 100 },

	// ── reels ───────────────────────────────────────────────────────────────
	/** strip speed, px/s (27 cells/s) */
	reelSpeed: 2700,
	/** stop rebound: [t, offset in cells] — reels 1-4 only; reels 5 and 6 do not rebound */
	stopBounce: [
		[0, 1],
		[0.083, -0.064],
		[0.14, -0.22],
		[0.28, 0],
	] as const,
	reelsWithoutBounce: [4, 5],
	reelStopInterval: { normal: 0.2, turbo: 0 },
	reelRun: 0.143,
	reelShowBoard: 0.383,
	showBoard: 0.383,

	// ── wide-reel merge (index = block size - 1) ────────────────────────────
	reelMergeShowWait: [0, 0, 0.4, 0.5, 0.5, 0.4],
	reelMergeInterval: [0, 0, 0.8, 0.8, 1.2, 0],
	/** merge glow frame sequence length (frames at 30 fps) */
	mergeFrameFrames: 60,
	/** only merges of 3+ reels show the glow frame */
	mergeFrameMinSize: 3,

	// ── WILD conversion ─────────────────────────────────────────────────────
	wildOut: { basegame: 0.3, freegame: 0.3 },
	/** cast starts `trans_in` this long after the spin starts */
	transStart: 0.4,
	trans: { in: 0.5, loop: 1.0, out: 1.0, back: 1.53 },
	/** cast dissolves into the swarm this far into `trans_out` */
	transOutDissolve: 0.2,
	/** fog covers / clears each cell at a delay of distance-from-centre ÷ speed (px/s) */
	fog: { inSpeed: 590, outSpeed: 295 },
	/** fog hold while every cell is covered and nothing is revealed yet */
	fogHold: 1.1,
	/** per-cell reveal clip: in, loop, success, fail */
	reveal: { in: 0.45, loop: 0.98, success: 1.02, fail: 1.0 },
	/** scene tint during the conversion */
	tint: { in: 1.0, out: 0.83 },
	forecastDelay: 0.4,

	// ── wins ────────────────────────────────────────────────────────────────
	scoreDelay: 0.7,
	scoreShowDuration: 0.7,
	/** free game: raw win shown, then "xN" pops, then the multiplied amount */
	multipleDelay: 0.25,
	multipleShow: 0.2,
	/** cast win reactions, each */
	castWin: 1.53,
	castIdle: 1.53,

	// ── free game ───────────────────────────────────────────────────────────
	energyDelay: 0.2,
	fgEnergyFly: 1.0,
	preFreePlusDelay: 0.4,
	freePlusDelay: 0.4,
	fgMsg: { multipleIn: 0.45, freeSpinsIn: 0.33 },
	/** ladder step beat, relative to the last orb entering the vial (SPEC §2.5) */
	ladder: { burst: 0.3, multipleIn: 0.4, multipleOut: 0.8, plusIn: 1.0, hit: 1.3, reset: 1.8, nextSpin: 2.0 },
	fgPanel: { in: 1.52, loop: 1.52, out: 3.02 },
	/** NG -> FG beats, relative to the last castle landing (SPEC §2.6) */
	enterFeature: { frameIn: 1.5, drip: 4.0, crest: 4.5, panel: 5.0, moon: 8.5, wipe: 9.0, scene: 10.5, firstSpin: 11.5 },
	exitFeature: { drip: 0.6, total: 6.5 },

	// ── round ───────────────────────────────────────────────────────────────
	roundDelay: {
		hasWin: { normal: 0.4, turbo: 0.28 },
		noWin: { normal: 0.4, turbo: 0 },
	},
	bigWinScoreDelay: 1.0,
	playNextVideoDelay: 1.0,

	// ── big wins ────────────────────────────────────────────────────────────
	/** bet multiples: BIG / SUPER / MEGA / EPIC (math winLevel 2-5) */
	bigWinThresholds: [25, 50, 100, 200],
	bigWin: { in: 1.17, loop: 1.17, out: 1.0 },
	/** BIG measured: smoke + count start, panel, count length, hold, fade */
	bigWinBeat: { smoke: 1.6, panel: 2.0, count: 1.4, hold: 1.2, fade: 0.4 },
} as const;

/** px/s in the reference frame -> cells per second */
export const refPxPerSecondToCells = (pxPerSecond: number) => pxPerSecond / REF_TIMING.refCell.height;

/** Euclidean distance between two cells, in reference pixels (for fog delays). */
export const refCellDistance = (a: { reel: number; row: number }, b: { reel: number; row: number }) =>
	Math.hypot((a.reel - b.reel) * REF_TIMING.refCell.width, (a.row - b.row) * REF_TIMING.refCell.height);
