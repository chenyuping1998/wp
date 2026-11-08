import { setMaxResolution } from 'pixi-svelte';

/**
 * Render at no more than 2x the CSS pixel grid (2026-11-01).
 *
 * Live testing on an iPhone 12 (iOS 18.6.2) found the game killed on load with
 * Safari's "A problem repeatedly occurred". The phone reports a
 * devicePixelRatio of 3, and this game draws its whole background and its whole
 * board through filters at the renderer's resolution (sceneLighting.ts — kept
 * there because a resolution-1 filter is what made the symbols blurry in the
 * 2026-10-16 review). Every one of those targets, and the canvas and its MSAA
 * buffer, grows with the square of the ratio, and the filter pool rounds them up
 * to powers of two: a portrait screen at 3x is a 2048x4096 texture per filter
 * pass. Together with ~200 MB of decoded art that is past what iOS gives a tab.
 *
 * At 2x those targets take 44% of the memory. Desktop retina screens are 2x
 * already and are untouched; a phone at 3x loses detail nobody can see at arm's
 * length. Imported for its side effect before the pixi App initialises.
 */
setMaxResolution(2);
