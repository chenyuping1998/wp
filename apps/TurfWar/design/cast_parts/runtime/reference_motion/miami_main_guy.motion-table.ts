/**
 * Motion table measured from the miami_main_guy archetype (hacksaw-character-motion
 * archetype/motion_table.py). Timings, amplitudes and ratios ONLY -- the
 * research pack itself never ships (rig/PROVENANCE.md).
 *
 * Degrees, y-down renderer: + turns clockwise on screen. Sides: anatomical.
 * Shape is [ALONG the bone, ACROSS it] at the peak. Start the game at
 * k = 0.42 and sweep it against the mesh gate on YOUR rig; the reference
 * values are the full-size gesture on a Spine rig with separate limb images.
 */
export const ARCHETYPE = "miami_main_guy";
export const IDLE_MEASURED = {"arm_r": [5.105, 0, 8000, 0.0], "fore_r": [2.611, 3450, 8000, 0.0], "arm_l": [1.785, 733, 2000, 0.0], "fore_l": [4.978, 3300, 8000, 0.0], "dangle_mask": [6.69, 533, 2000, 0.0]}; // [amplitudeDeg, lagMs, periodMs, oddScale]
export const IDLE_LOOP_MS = 8000;
export const TRIGGER_MEASURED = {"bones": {"neck": [-10.58, 33], "arm_r": [10.28, 400], "fore_r": [-16.69, 0], "fore_l": [13.37, 0]}, "durationMs": 1000, "snap": 0.241, "hold": 0.465, "rise": 0.0, "lean": 0.0, "stretch": 0, "scale": {"k": 0.42, "shape": {"fore_r": [1.063, 0.797], "arm_l": [1.0, 1.23]}}};
// A ladder is a design choice, not a measurement: the same gesture at less size.
export const LADDER = { trigger: 1, winBig: 0.75, win: 0.5 };
