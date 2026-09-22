import { setFontKit, setLocalFonts } from 'pixi-svelte';

// Self-hosted, SIL OFL families: railway inscription titles and readable numerals.
export const GAME_FONT = '"Saira", "Trebuchet MS", "Segoe UI", Tahoma, Arial, sans-serif';
export const DISPLAY_FONT = '"Cinzel", Georgia, "Times New Roman", serif';
export const DISPLAY_FONT_WEIGHT = '800' as const;
export const GAME_FONT_WEIGHT = '600' as const;
export const BODY_FONT = '"Saira", "Trebuchet MS", "Segoe UI", Tahoma, Arial, sans-serif';

if (typeof document !== 'undefined') {
 const root = document.documentElement.style;
 root.setProperty('--gb-display-font', GAME_FONT);
 root.setProperty('--gb-body-font', BODY_FONT);
 root.setProperty('--hm-title-font', DISPLAY_FONT);
}
setFontKit(null);
// Exact family/weight matches app.html; wait before Pixi measures its first text.
setLocalFonts(['600 16px "Saira"', '800 16px "Cinzel"', '400 16px "Saira"']);
