// GoBoomana context API retained; Blood Moon owns its bar/group geometry.
import {stateBloodMoon} from './bloodmoon.svelte';
import {stateLayoutDerived} from './stateLayout';
export const stateGame=$state({gameType:'basegame',stickyPrizes:[] as unknown[],blastReels:[] as number[]});
export const stateGameDerived={boardRaw:()=>stateBloodMoon.board,boardLayout:()=>({x:0,y:0,scale:1,width:648,height:600}),enhancedBoard:{settle:()=>{},stop:()=>{},preSpin:async()=>{}},getWinLevelDataByWinLevelAlias:()=>undefined};
