import {BitmapFont} from 'pixi.js';
import {GAME_FONT} from './fonts';
export const WIN_DIGITS_FRONT='BloodMoon-WinGold';
export const WIN_DIGITS_BACK='BloodMoon-WinEmboss';
let installed=false,leases=0;
export function ensureWinCounterFonts(){
 if(installed)return;
 const base={fontFamily:GAME_FONT,fontWeight:'bold' as const,fontSize:70};
 BitmapFont.install({name:WIN_DIGITS_BACK,chars:'0123456789,.',resolution:2,padding:12,style:{...base,fill:0x69482e,stroke:{color:0x160b15,width:8},dropShadow:{color:0x000000,blur:8,distance:3}}});
 BitmapFont.install({name:WIN_DIGITS_FRONT,chars:'0123456789,.',resolution:2,padding:12,style:{...base,fill:0xffe1a0,stroke:{color:0x715239,width:1.7},dropShadow:{color:0x1c0b16,blur:3,distance:2}}});
 installed=true;
}
export function acquireWinCounterFonts(){
 ensureWinCounterFonts();leases++;
 return()=>{if(--leases===0){BitmapFont.uninstall(WIN_DIGITS_FRONT);BitmapFont.uninstall(WIN_DIGITS_BACK);installed=false;}};
}
