import { setFontKit, setLocalFonts } from 'pixi-svelte';

// Diner Monkey: Bangers comic-book caps for display lettering; numbers stay on Anton for legibility.
export const GAME_FONT = '"Bangers", "OswaldCyr", "Noto Sans CJK TC", "PingFang TC", sans-serif';
export const NUMBER_FONT = '"Anton", "OswaldCyr", "Arial Narrow", sans-serif';
export const BODY_FONT = '"Archivo", "Noto Serif CJK TC", "PingFang TC", sans-serif';
export const GAME_FONT_WEIGHT = '400' as const;

if (typeof document !== 'undefined') {
	const root = document.documentElement.style;
	root.setProperty('--gb-display-font', GAME_FONT);
	root.setProperty('--gb-body-font', BODY_FONT);
}

setFontKit(null);
setLocalFonts(['400 16px "Bangers"', '400 16px "Anton"', '400 16px "Archivo"', '400 16px "OswaldCyr"']);
