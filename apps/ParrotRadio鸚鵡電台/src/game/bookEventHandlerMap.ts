import {recordBookEvent,checkIsMultipleRevealEvents,type BookEventHandlerMap} from 'utils-book';
import {stateBet,stateUi} from 'state-shared';
import {waitForTimeout} from 'utils-shared/wait';
import {eventEmitter} from './eventEmitter';
import {stateGame,stateGameDerived} from './stateGame.svelte';
import {winLevelMap,type WinLevel} from './winLevelMap';
import {featureTotal} from './featureTotal';
import {planCascadeColumn} from './symbolMotion';
import type {BookEvent,BookEventContext,BookEventOfType} from './typesBookEvent';
import type {Position,RawSymbol,SymbolName} from './types';
import config from './config';
export type ScatterWinDatum={symbol:SymbolName;positions:Position[];win:number;overlay:Position};
const updateCounter=(current:number,total:number)=>{
 stateUi.freeSpinCounterShow=true;stateUi.freeSpinCounterCurrent=current;stateUi.freeSpinCounterTotal=total;
 eventEmitter.broadcast({type:'freeSpinCounterShow'});eventEmitter.broadcast({type:'freeSpinCounterUpdate',current,total});
};
export const bookEventHandlerMap:BookEventHandlerMap<BookEvent,BookEventContext>={
 reveal:async(e:BookEventOfType<'reveal'>,{bookEvents}:BookEventContext)=>{
  if(checkIsMultipleRevealEvents({bookEvents})){eventEmitter.broadcast({type:'stopButtonEnable'});recordBookEvent({bookEvent:e});}
  stateGame.gameType=e.gameType;stateGame.tumbleWin=0;stateGame.tumbleChain=0;stateGame.spinWin=0;stateGame.postEncoreWin=0;
  stateGame.encored=false;stateGame.encoreResult=null;stateGame.platinum=null;
  eventEmitter.broadcast({type:'soundReset'});
  eventEmitter.broadcast({type:'scatterWinsHide'});eventEmitter.broadcast({type:'soundScatterCounterClear'});
  await stateGameDerived.enhancedBoard.spin({revealEvent:{...e,anticipation:e.anticipation.map(n=>n===1?1:0)},paddingBoard:config.paddingReels[e.gameType] as RawSymbol[][]});
 },
 winInfo:async(e:BookEventOfType<'winInfo'>)=>{
  stateGame.tumbleChain++;stateGame.spinWin+=e.totalWin;if(stateGame.encored){stateGame.postEncoreWin+=e.totalWin;stateGame.encoreResult=true;}
  eventEmitter.broadcast({type:'soundTumbleHit',chain:stateGame.tumbleChain});
  // Amounts already contain meta.globalMult; never multiply them on the client.
  const wins=e.wins.map(win=>({symbol:win.symbol,positions:win.positions,win:win.win,overlay:win.meta.overlay}));
  await eventEmitter.broadcastAsync({type:'scatterWinsShow',wins,pace:stateBet.isTurbo?'turbo':'normal'});
 },
 updateTumbleWin:async(e:BookEventOfType<'updateTumbleWin'>)=>{stateGame.tumbleWin=e.amount;},
 tumbleBoard:async(e:BookEventOfType<'tumbleBoard'>)=>{eventEmitter.broadcast({type:'scatterWinsHide'});await eventEmitter.broadcastAsync({type:'tumbleRun',explodingSymbols:e.explodingSymbols,newSymbols:e.newSymbols});},
 encore:async(e:BookEventOfType<'encore'>,{bookEvents}:BookEventContext)=>{
  if(stateGame.encored)throw Error('Second encore in one spin');
  eventEmitter.broadcast({type:'scatterWinsHide'});stateGame.encored=true;
  const next=bookEvents.find(v=>v.index>e.index&&['winInfo','reveal','setWin','setTotalWin','platinumRecord'].includes(v.type));
  stateGame.encoreResult=next?.type==='winInfo';if(e.volume!==null)stateGame.volume=e.volume;
  await eventEmitter.broadcastAsync({type:'parrotEncore',symbol:e.symbol,positions:e.positions,mult:e.mult,success:stateGame.encoreResult});
 },
 volumeStart:async(e:BookEventOfType<'volumeStart'>)=>{stateGame.volume=e.volume;await eventEmitter.broadcastAsync({type:'parrotVolumeStart',volume:e.volume});},
 platinumRecord:async(e:BookEventOfType<'platinumRecord'>)=>{
  stateGame.platinum={mult:e.mult,applied:e.applied,baseWin:e.baseWin,totalWin:e.totalWin};
  await eventEmitter.broadcastAsync({type:'parrotRecord',...stateGame.platinum});
  // Authoritative updateTumbleWin follows an applied record. Records never accumulate.
 },
 setTotalWin:async(e:BookEventOfType<'setTotalWin'>)=>{stateBet.winBookEventAmount=e.amount;},
 freeSpinTrigger:async(e:BookEventOfType<'freeSpinTrigger'>)=>{
  eventEmitter.broadcast({type:'castPlay',name:'fg_trigger'});eventEmitter.broadcast({type:'soundCue',cue:'stinger_fg_intro',priority:1});
  eventEmitter.broadcast({type:'scatterWinsHide'});await eventEmitter.broadcastAsync({type:'uiHide'});
  stateGame.gameType='freegame';stateGame.volume=1;await eventEmitter.broadcastAsync({type:'transition'});
  eventEmitter.broadcast({type:'freeSpinIntroShow'});await eventEmitter.broadcastAsync({type:'freeSpinIntroUpdate',totalFreeSpins:e.totalFs});eventEmitter.broadcast({type:'freeSpinIntroHide'});
  updateCounter(1,e.totalFs);await eventEmitter.broadcastAsync({type:'uiShow'});eventEmitter.broadcast({type:'drawerFold'});
 },
 updateFreeSpin:async(e:BookEventOfType<'updateFreeSpin'>)=>{updateCounter(e.amount,e.total);},
 freeSpinRetrigger:async(e:BookEventOfType<'freeSpinRetrigger'>)=>{updateCounter(stateUi.freeSpinCounterCurrent,e.totalFs);await waitForTimeout(stateBet.isTurbo?180:450);},
 freeSpinEnd:async(e:BookEventOfType<'freeSpinEnd'>)=>{
  eventEmitter.broadcast({type:'castPlay',name:'fg_end'});eventEmitter.broadcast({type:'soundCue',cue:'stinger_fg_outro',priority:1});
  const total=featureTotal(e.amount,e.winLevel);eventEmitter.broadcast({type:'freeSpinOutroShow'});
  await eventEmitter.broadcastAsync({type:'freeSpinOutroCountUp',amount:total.amount,winLevelData:winLevelMap[total.winLevel as WinLevel]});
  eventEmitter.broadcast({type:'freeSpinOutroHide'});eventEmitter.broadcast({type:'freeSpinCounterHide'});stateUi.freeSpinCounterShow=false;stateGame.gameType='basegame';stateGame.volume=1;
  await eventEmitter.broadcastAsync({type:'transition'});await eventEmitter.broadcastAsync({type:'uiShow'});
 },
 setWin:async(e:BookEventOfType<'setWin'>)=>{const winLevelData=winLevelMap[e.winLevel as WinLevel];if(winLevelData?.type!=='big'){eventEmitter.broadcast({type:'castPlay',name:e.amount>=1000?'react_good':'react_small'});return;}eventEmitter.broadcast({type:'castPlay',name:winLevelData.alias==='max'?'win_max':'win_big',hold:true});eventEmitter.broadcast({type:'soundBigWinBlast',tier:Math.min(5,winLevelData.level-5) as 1|2|3|4|5});eventEmitter.broadcast({type:'winShow'});await eventEmitter.broadcastAsync({type:'winUpdate',amount:e.amount,winLevelData});eventEmitter.broadcast({type:'winHide'});eventEmitter.broadcast({type:'castPlay',name:'idle'});},
 finalWin:async()=>{stateGame.gameType='basegame';stateGame.volume=1;stateUi.freeSpinCounterShow=false;eventEmitter.broadcast({type:'freeSpinCounterHide'});},
 wincap:async(e:BookEventOfType<'wincap'>)=>{stateBet.winBookEventAmount=e.amount;},
 createBonusSnapshot:async(e:BookEventOfType<'createBonusSnapshot'>)=>{
  // Restore state from all historical events, with no historical animation or payments.
  stateGame.volume=1;stateGame.encored=false;stateGame.platinum=null;
  for(const prior of e.bookEvents){
   switch(prior.type){
    case 'reveal':stateGame.gameType=prior.gameType;stateGame.tumbleWin=0;stateGame.encored=false;stateGame.encoreResult=null;stateGame.platinum=null;stateGame.spinWin=0;stateGame.postEncoreWin=0;stateGameDerived.enhancedBoard.settle(prior.board);break;
    case 'encore':for(const p of prior.positions)stateGame.board[p.reel].reelState.symbols[p.row].rawSymbol={name:prior.symbol};stateGame.encored=true;if(prior.volume!==null)stateGame.volume=prior.volume;break;
    case 'tumbleBoard':for(let reel=0;reel<stateGame.board.length;reel++){const rows=prior.explodingSymbols.filter(p=>p.reel===reel).map(p=>p.row);if(rows.length){const r=stateGame.board[reel];r.setSymbolsWithRawSymbols(planCascadeColumn(r.reelState.symbols.map(s=>s.rawSymbol),rows,prior.newSymbols[reel],config.numRows[reel]).column);}}break;
    case 'winInfo':stateGame.spinWin+=prior.totalWin;if(stateGame.encored)stateGame.postEncoreWin+=prior.totalWin;break;
    case 'volumeStart':stateGame.volume=prior.volume;break;
    case 'platinumRecord':stateGame.platinum={mult:prior.mult,applied:prior.applied,baseWin:prior.baseWin,totalWin:prior.totalWin};break;
    case 'updateTumbleWin':stateGame.tumbleWin=prior.amount;break;
    case 'setTotalWin':stateBet.winBookEventAmount=prior.amount;break;
    case 'freeSpinTrigger':stateGame.gameType='freegame';updateCounter(1,prior.totalFs);break;
    case 'updateFreeSpin':updateCounter(prior.amount,prior.total);break;
    case 'freeSpinRetrigger':updateCounter(stateUi.freeSpinCounterCurrent,prior.totalFs);break;
    case 'freeSpinEnd':case 'finalWin':stateGame.gameType='basegame';stateGame.volume=1;stateUi.freeSpinCounterShow=false;eventEmitter.broadcast({type:'freeSpinCounterHide'});break;
   }
  }
 },
};
