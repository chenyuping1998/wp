/**
 * The brass nameplate (bonus_button.png, square canvas) — the one painted UI
 * plate in the game. Buy Bonus, the big-win plaque, the free-game plaque and
 * the spin counter all draw it, so the four read as one set of hardware.
 *
 * Fractions of the texture side, measured off the 1254px source:
 *   body     the riveted frame, 0.254..0.781 tall, 0.964 wide
 *   inset    the dark writable well inside the teal line, 0.80 × 0.355,
 *            centred 0.02 below the texture centre (the crest sits on top)
 *
 * These replace the flat octagon SVGs (win_*.svg, fs_sign.svg, fs_panel.svg):
 * a linear-gradient enamel with a gradient stroke and the tier name set in
 * Georgia inside the file — the "gradient fills / standard fonts" the review
 * lists by name.
 */
export const PLATE_KEY = 'dwBonusButton';
export const PLATE_BODY = { width: 0.964, height: 0.527, centerY: 0.0175 } as const;
export const PLATE_INSET = { width: 0.8, height: 0.355, centerY: 0.02 } as const;
