import {setFontKit,setLocalFonts} from 'pixi-svelte';
export const GAME_FONT='"Blood Moon Cinzel", Georgia, serif';
export const GAME_FONT_WEIGHT='600' as const;
export const BODY_FONT='"Segoe UI", Tahoma, Arial, sans-serif';
if(typeof document!=='undefined'){
 document.documentElement.style.setProperty('--gb-display-font',GAME_FONT);
 document.documentElement.style.setProperty('--gb-body-font',BODY_FONT);
}
setFontKit(null);
setLocalFonts(['600 16px "Blood Moon Cinzel"']);
