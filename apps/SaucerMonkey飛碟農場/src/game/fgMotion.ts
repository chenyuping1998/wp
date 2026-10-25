/**
 * The free-game board's moves (FreeSpinAnimation / FreeSpinIntro /
 * FreeSpinOutro), as pure functions of ms so design/check_collection_motion.mjs
 * holds them to spine-generator's curve rules (2026-10-23):
 *
 *   postcardSwing  the card's swing as it lands: ONE damped spring. It was
 *                  four cubicOut tweens end to end — each stopped dead at its
 *                  turn and the next set off at full speed, a jolt per swing
 *   stampSlam      the spin count, spine-generator's text-slam: 2.4x down to
 *                  0.92x in 100ms (quartIn), sprung back to 1 at 4Hz, turning
 *                  upright from -8deg and a little past. It closed in at a
 *                  constant speed before
 *   titleIn        the title easing in (it slid at a constant speed)
 *   totalPunch     the total, once it has finished counting: a hit
 */
import { EASE, impact, springDecay } from './motionKit';

export const postcardSwing = (t: number) => 0.035 * impact(t, 250, 1.15, 0.32);

/** ms after the stamp starts when it hits the paper */
export const SLAM_HIT = 100;
const SLAM_FROM = 2.4, SLAM_TILT = (8 * Math.PI) / 180;
export const stampSlam = (t: number) => {
	if (t <= 0) return { scale: 0, rot: 0 };
	if (t < SLAM_HIT) {
		const u = EASE.quartIn(t / SLAM_HIT);
		return { scale: SLAM_FROM + (0.92 - SLAM_FROM) * u, rot: -SLAM_TILT * (1 - u) };
	}
	return { scale: 1 - 0.08 * springDecay(t, SLAM_HIT, 4, 0.4), rot: 0.15 * SLAM_TILT * impact(t, SLAM_HIT, 4, 0.4) };
};

export const titleIn = (k: number) => EASE.cubicOut(Math.max(0, Math.min(1, k)));

export const totalPunch = (t: number) => 1 + 0.12 * impact(t, 0, 4, 0.4);
