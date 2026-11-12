import type { SkeletonData } from '../vendor/spine-core-4.3.13/index.js';
import { measureClip, readCastData, type CastRig } from './castSpine43';

/**
 * The two cast rigs (SPEC §4, house rule: one figure for the main game, a
 * different one for the free games). Packed by design/build_game_cast.py from
 * new-games/wild-alchemy/art/2026-11-10-characters/<mg|fg>/spine.
 */
export type CastWho = 'alchemist' | 'homunculus';

/** Skeleton-unit extents a placement needs (y UP, feet on 0, board on the left). */
export type CastMeasure = {
	/** crown at rest */
	height: number;
	/** furthest reach toward the board (left) and away from it, over every clip the rig has */
	left: number;
	right: number;
	/** highest point of any clip (the raised flask) */
	top: number;
};
export type CastLoaded = { rig: CastRig; data: SkeletonData; measure: CastMeasure; clips: Set<string> };

const RIG_URL: Record<CastWho, string> = {
	alchemist: new URL('../../assets/castSpine43/alchemist/cast.json', import.meta.url).href,
	homunculus: new URL('../../assets/castSpine43/homunculus/cast.json', import.meta.url).href,
};
export const CAST_PREFIX: Record<CastWho, string> = { alchemist: 'wa43mg_', homunculus: 'wa43fg_' };

const loads = new Map<CastWho, Promise<CastLoaded>>();
/** The rig, parsed and measured once per figure for the whole session. */
export const loadCast = (who: CastWho) => {
	let pending = loads.get(who);
	if (!pending) {
		pending = fetch(RIG_URL[who])
			.then((response) => {
				if (!response.ok) throw new Error(`Unable to load the ${who} cast rig: ${response.status}`);
				return response.json() as Promise<CastRig>;
			})
			.then((rig) => {
				const data = readCastData(rig);
				const clips = new Set(data.animations.map((a) => a.name));
				const boxes = new Map([...clips].map((clip) => [clip, measureClip(data, clip)]));
				const all = [...boxes.values()];
				// The crown at rest is the head's top, not the flask: measured on the
				// idle with the hand and the prop left out would need the slots; the
				// rig's canvas is 1536 tall with the crown drawn at y = 160 and the
				// floor at 1456, so the figure is 1296 units from sole to crown.
				const measure: CastMeasure = {
					height: 1296,
					left: Math.max(...all.map((b) => -b.minX)),
					right: Math.max(...all.map((b) => b.maxX)),
					top: Math.max(...all.map((b) => b.maxY)),
				};
				return { rig, data, measure, clips };
			});
		loads.set(who, pending);
	}
	return pending;
};
