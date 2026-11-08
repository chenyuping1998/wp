/** Where the drifting cloud strip sits this frame (bg_base.jpg px).
 *
 * The clouds of the middle sky were cut into one strip (bg_clouds.png) that
 * wraps: it scrolls left to right with the wind, re-entering from behind the
 * lighthouse, and dissolves at both window edges before the palm crowns and the
 * umbrella. A gust pushes the whole bank a little faster for a moment. The
 * land in that band (bg_horizon.png) is drawn over it, so the clouds pass
 * behind the mountains and islands as in the painting.
 */
import { CLOUD_BAND } from './treasureCloudBand.ts';
import { windAt, type BgEnv } from './treasureBgProps.ts';

/** px per ms: a cloud crosses the window in about 1m 40s */
export const CLOUD_SPEED = 0.0125;
export const CLOUD_WIDTH = CLOUD_BAND.x1 - CLOUD_BAND.x0;

/** strip offset in [0, CLOUD_WIDTH): add to x0, and draw a second copy one
 *  width to the left */
export function cloudOffset(env: BgEnv, calm = false) {
	if (calm) return 0;
	// the gust's push, eased in so the drift starts from the painted layout
	const fade = Math.min(1, env.t / 1500);
	const push = 9 * windAt(env, (CLOUD_BAND.x0 + CLOUD_BAND.x1) / 2, 9000, 0.3) * fade * fade;
	const x = env.t * CLOUD_SPEED + push;
	return ((x % CLOUD_WIDTH) + CLOUD_WIDTH) % CLOUD_WIDTH;
}
