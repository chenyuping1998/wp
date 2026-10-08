import { setFontKit, setLocalFonts } from 'pixi-svelte';

// Go Banandit's three locally bundled screenprint type roles. CJK text falls
// through to the system sans stack because Bungee and Anton have no CJK glyphs.
export const GAME_FONT = '"Bungee", "OswaldCyr", "Noto Sans CJK TC", "PingFang TC", sans-serif';
export const NUMBER_FONT = '"Anton", "OswaldCyr", "Arial Narrow", sans-serif';
export const BODY_FONT = '"Archivo", "OswaldCyr", "Noto Sans CJK TC", "PingFang TC", sans-serif';
export const GAME_FONT_WEIGHT = '400' as const;

if (typeof document !== 'undefined') {
	const root = document.documentElement.style;
	root.setProperty('--gb-display-font', GAME_FONT);
	root.setProperty('--gb-body-font', BODY_FONT);
}

setFontKit(null);
setLocalFonts(['400 16px "Bungee"', '400 16px "Anton"', '400 16px "Archivo"', '400 16px "OswaldCyr"']);
