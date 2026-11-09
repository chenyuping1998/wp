/** Local visual acceptance only; imported solely under import.meta.env.DEV. */
import {symbolIdleClock} from '../game/symbolIdleClock.svelte';
import {stateGame} from '../game/stateGame.svelte';
import type {SymbolName} from '../game/types';
import {eventEmitter} from '../game/eventEmitter';
import {winLevelMap, type WinLevel} from '../game/winLevelMap';
export function installMotionControls(){
 const panel=document.createElement('div');panel.dataset.motionQa='true';panel.style.cssText='position:fixed;left:8px;top:24px;max-width:310px;z-index:99999;display:flex;flex-wrap:wrap;gap:3px;background:#222e;padding:6px;color:white;font:12px sans-serif';
 const button=(label:string,fn:()=>void)=>{const b=document.createElement('button');b.textContent=label;b.onclick=fn;panel.append(b);};
 const names:SymbolName[]=['H1','H2','H3','H4','L1','L2','L3','L4','L5','S'];
 button('全圖騰測試',()=>{for(let col=0;col<6;col++)for(let row=1;row<=5;row++){const symbol=stateGame.board[col].reelState.symbols[row];symbol.rawSymbol={name:names[(col*5+row-1)%10]};symbol.symbolState='static';}});
 for(const t of [0,.4,.8,1.2,2,4])button(`時間 ${t}`,()=>{symbolIdleClock.inspection=true;symbolIdleClock.seconds=t;});
 button('播放動態',()=>{symbolIdleClock.inspection=false;symbolIdleClock.reduced=false;});
 button('減少動態',()=>{symbolIdleClock.reduced=true;});
 button('MG 背景',()=>{stateGame.gameType='basegame';});button('FG 背景',()=>{stateGame.gameType='freegame';});
 for(const level of [6,7,8,9,10] as WinLevel[])button(`獎牌 ${winLevelMap[level].alias}`,()=>{eventEmitter.broadcast({type:'winShow'});eventEmitter.broadcast({type:'winUpdate',amount:123456,winLevelData:winLevelMap[level]});});
 button('關閉獎牌',()=>eventEmitter.broadcast({type:'winHide'}));
 button('FG 招牌',()=>{eventEmitter.broadcast({type:'freeSpinIntroShow'});eventEmitter.broadcast({type:'freeSpinIntroUpdate',totalFreeSpins:15});});
 button('關閉FG招牌',()=>eventEmitter.broadcast({type:'freeSpinIntroHide'}));
 button('FG 次數牌',()=>{eventEmitter.broadcast({type:'freeSpinCounterShow'});eventEmitter.broadcast({type:'freeSpinCounterUpdate',current:3,total:15});});
 button('催眠音效',()=>eventEmitter.broadcast({type:'soundMedusa',cue:'gazeBeam'}));
 button('紙片音效',()=>eventEmitter.broadcast({type:'soundTumbleHit',chain:3}));
 button('收起檢查列',()=>panel.remove());document.body.append(panel);return()=>{symbolIdleClock.inspection=false;panel.remove();};
}
