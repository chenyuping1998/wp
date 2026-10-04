/**
 * Events for the board's ACTING — the moments that make it feel like a place
 * and a character rather than fifteen cells running their own clips:
 *
 *   hitStop          the whole frame holds for a beat on a hit that matters
 *                    (HitStop.svelte): the third Scatter, a Wild, the amount
 *   cellKnock        something landed hard in a cell, and the cells round it
 *                    flinch away from it (Symbol.svelte)
 *   scatterNearMiss  the spin ended one Scatter short: he sighs, the held
 *                    Scatters' light goes out (Mascot, ScatterLand)
 *   mascotGaze       something happened in this cell: he looks at it
 *                    (MascotGaze.svelte)
 *   spinLaunch       the reels have just been sent off (ReelDust sees it)
 */
export type EmitterEventActing =
	| { type: 'hitStop'; ms: number }
	| { type: 'cellKnock'; reel: number; row: number; strength: number }
	| { type: 'scatterNearMiss' }
	| { type: 'mascotGaze'; reel: number; row: number }
	| { type: 'spinLaunch' };
