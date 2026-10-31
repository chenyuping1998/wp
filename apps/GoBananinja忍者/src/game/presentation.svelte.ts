import type { ReelLook } from './presentationMotion';
/** One frame clock for reel deceleration and all background accents. */
export const presentation = $state({ clock: 0, energy: 0, reels: Array.from({length:5}, (): ReelLook => ({blur:0,landing:0,rail:0})) });
