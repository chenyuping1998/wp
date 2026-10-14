import { setFontKit, setLocalFonts } from 'pixi-svelte';

// Self-hosted OFL faces: street lettering for titles, clear figures for values.
//
// GAME_FONT is the shared UI package's face — the bet bar's captions and money
// figures, and GoldText's default (frame multipliers, win amounts).
//
// It was Titan One, and ART_BRIEF.md §9.5 recorded that as deliberate: the bar
// was to stay on the shared package's neutral face because the bar itself was
// staying on the neutral platform chrome. That assumption is reversed — the bar
// now wears Turf War's own skin — so the face follows it.
//
// Oswald 700 rather than the stencil TITLE direction, for what the bar actually
// contains: captions of five or six letters at ~28px and money figures that can
// run to twelve characters in one cell. A stencil face breaks its own strokes,
// which is what makes it read as spray paint at poster size and what makes it
// illegible at bar size; Oswald is condensed (so the long figures fit without
// the value auto-shrinking) with unambiguous 0/6/8/9. It is also the face
// §9.5 names for numbers, so the bar's figures and the frame multipliers now
// agree instead of being two different typefaces showing the same kind of
// value. Same family as TITLE_FONT, one weight apart — the bar reads as the
// small print of the same signage, not as a second brand.
//
// Titan One was removed from the build on 2026-10-12 (design/_legacy_assets/
// fonts_retired_20261012/); going back means restoring the file and its @font-face.
export const GAME_FONT = '"Oswald", "Arial Narrow", Arial, sans-serif';
export const GAME_FONT_WEIGHT = '700' as const;
// 2026-10-12: Orbitron (a square sci-fi face) retired from the numbers — one
// street-signage family for the whole game, as Hacksaw titles run one display
// face. Oswald's figures are the same ones the bar already reads.
export const DISPLAY_FONT = '"Oswald", "Arial Narrow", Arial, sans-serif';
export const DISPLAY_FONT_WEIGHT = '700' as const;
export const BODY_FONT = '"Saira", Arial, sans-serif';
export const TITLE_FONT = '"Oswald", "Arial Narrow", Arial, sans-serif';
export const TITLE_FONT_WEIGHT = 700;

if (typeof document !== 'undefined') {
 const root = document.documentElement.style;
 root.setProperty('--gb-display-font', GAME_FONT);
 root.setProperty('--gb-body-font', BODY_FONT);
 root.setProperty('--hm-title-font', TITLE_FONT);
 root.setProperty('--hm-number-font', DISPLAY_FONT);
}
setFontKit(null);
// Oswald is listed at both weights it is asked for: 700 for TITLE_FONT, GAME_FONT
// (the bar) and DISPLAY_FONT (numbers), 500 for the lighter runs of labels.
setLocalFonts([
 `${GAME_FONT_WEIGHT} 16px "Oswald"`,
 `${TITLE_FONT_WEIGHT} 16px "Oswald"`,
 '500 16px "Oswald"',
 '400 16px "Saira"',
]);
