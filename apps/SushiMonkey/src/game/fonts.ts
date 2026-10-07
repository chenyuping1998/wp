import { setFontKit, setLocalFonts } from 'pixi-svelte';

// Sushi Monkey's locally bundled type roles. CJK text falls through to the
// system sans stack because Bungee and Anton have no CJK glyphs.
//
// 2026-10-06: on the canvas the game is ONE display face, Bungee, for headers
// and body alike (Hacksaw norm: one face, header ~1.4x body). Anton is kept for
// numbers only, standing in for the drawn digit sets (ART_REQUEST D). Archivo is
// left to the HTML rules / paytable / buy modals, where long copy needs it.
export const GAME_FONT = '"Bungee", "OswaldCyr", "Noto Sans CJK TC", "PingFang TC", sans-serif';
export const NUMBER_FONT = '"Anton", "OswaldCyr", "Arial Narrow", sans-serif';
export const BODY_FONT = '"Archivo", "OswaldCyr", "Noto Sans CJK TC", "PingFang TC", sans-serif';
export const GAME_FONT_WEIGHT = '400' as const;

if (typeof document !== 'undefined') {
	const root = document.documentElement.style;
	root.setProperty('--gb-display-font', GAME_FONT);
	root.setProperty('--gb-body-font', BODY_FONT);
}

if (typeof document !== 'undefined') {
 const receiptFace=new FontFace('SushiReceipt', 'url(/fonts/sushi/SushiReceipt.ttf)');
 document.fonts.add(receiptFace);
 receiptFace.load().catch(()=>{});
}
setFontKit(null);
setLocalFonts(['400 16px "SushiReceipt"','400 16px "Bungee"', '400 16px "Anton"', '400 16px "Archivo"', '400 16px "OswaldCyr"']);
