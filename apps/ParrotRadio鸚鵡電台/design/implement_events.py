from pathlib import Path
APP=Path(__file__).resolve().parent.parent
def write(name,data):(APP/name).write_text(data.strip()+'\n',encoding='utf-8')
write('src/game/typesBookEvent.ts',r'''
import type {Bet as BetType} from 'utils-bet';
import type {RawSymbol,Position,SymbolName,GameType} from './types';
type E<T extends string,P={}>={index:number;type:T}&P;
export type WinDatum={symbol:SymbolName;win:number;positions:Position[];meta:{globalMult:number;clusterMult:number;winWithoutMult:number;overlay:Position}};
export type BookEvent=
 |E<'reveal',{board:RawSymbol[][];paddingPositions:number[];anticipation:number[];gameType:GameType}>
 |E<'winInfo',{totalWin:number;wins:WinDatum[]}>
 |E<'tumbleBoard',{explodingSymbols:Position[];newSymbols:RawSymbol[][]}>
 |E<'updateTumbleWin',{amount:number}>
 |E<'encore',{symbol:SymbolName;positions:Position[];volume:number|null;mult:number}>
 |E<'volumeStart',{volume:number}>
 |E<'platinumRecord',{mult:number;applied:boolean;baseWin:number;totalWin:number}>
 |E<'setTotalWin',{amount:number}>|E<'finalWin',{amount:number}>
 |E<'setWin',{amount:number;winLevel:number}>|E<'wincap',{amount:number}>
 |E<'freeSpinTrigger',{totalFs:number;positions:Position[]}>
 |E<'freeSpinRetrigger',{totalFs:number;positions:Position[]}>
 |E<'updateFreeSpin',{amount:number;total:number}>
 |E<'freeSpinEnd',{amount:number;winLevel:number}>
 |E<'createBonusSnapshot',{bookEvents:BookEvent[]}>;
export type Bet=BetType<BookEvent>;
export type BookEventOfType<T>=Extract<BookEvent,{type:T}>;
export type BookEventContext={bookEvents:BookEvent[]};
''')
write('src/game/bookEventHandlerMap.ts',r'''
import {recordBookEvent,checkIsMultipleRevealEvents,type BookEventHandlerMap} from 'utils-book';
import {stateBet,stateUi} from 'state-shared';
import {waitForTimeout} from 'utils-shared/wait';
import {eventEmitter} from './eventEmitter';
import {stateGame,stateGameDerived} from './stateGame.svelte';
import {winLevelMap,type WinLevel} from './winLevelMap';
import {featureTotal} from './featureTotal';
import {planCascadeColumn} from './symbolMotion';
import type {BookEvent,BookEventContext} from './typesBookEvent';
import type {Position,RawSymbol,SymbolName} from './types';
import config from './config';
export type ScatterWinDatum={symbol:SymbolName;positions:Position[];win:number;overlay:Position};
const updateCounter=(current:number,total:number)=>{
 stateUi.freeSpinCounterShow=true;stateUi.freeSpinCounterCurrent=current;stateUi.freeSpinCounterTotal=total;
 eventEmitter.broadcast({type:'freeSpinCounterShow'});eventEmitter.broadcast({type:'freeSpinCounterUpdate',current,total});
};
export const bookEventHandlerMap:BookEventHandlerMap<BookEvent,BookEventContext>={
 reveal:async(e,{bookEvents})=>{
  if(checkIsMultipleRevealEvents({bookEvents})){eventEmitter.broadcast({type:'stopButtonEnable'});recordBookEvent({bookEvent:e});}
  stateGame.gameType=e.gameType;stateGame.tumbleWin=0;stateGame.tumbleChain=0;stateGame.spinWin=0;stateGame.postEncoreWin=0;
  stateGame.encored=false;stateGame.encoreResult=null;stateGame.platinum=null;
  eventEmitter.broadcast({type:'scatterWinsHide'});eventEmitter.broadcast({type:'soundScatterCounterClear'});
  await stateGameDerived.enhancedBoard.spin({revealEvent:{...e,anticipation:e.anticipation.map(n=>n===1?1:0)},paddingBoard:config.paddingReels[e.gameType] as RawSymbol[][]});
 },
 winInfo:async e=>{
  stateGame.tumbleChain++;stateGame.spinWin+=e.totalWin;if(stateGame.encored){stateGame.postEncoreWin+=e.totalWin;stateGame.encoreResult=true;}
  // Amounts already contain meta.globalMult; never multiply them on the client.
  await eventEmitter.broadcastAsync({type:'scatterWinsShow',wins:e.wins,pace:stateBet.isTurbo?'turbo':'normal'});
 },
 updateTumbleWin:async e=>{stateGame.tumbleWin=e.amount;},
 tumbleBoard:async e=>{eventEmitter.broadcast({type:'scatterWinsHide'});await eventEmitter.broadcastAsync({type:'tumbleRun',explodingSymbols:e.explodingSymbols,newSymbols:e.newSymbols});},
 encore:async(e,{bookEvents})=>{
  if(stateGame.encored)throw Error('Second encore in one spin');
  eventEmitter.broadcast({type:'scatterWinsHide'});stateGame.encored=true;
  const next=bookEvents.find(v=>v.index>e.index&&['winInfo','reveal','setWin','setTotalWin','platinumRecord'].includes(v.type));
  stateGame.encoreResult=next?.type==='winInfo';if(e.volume!==null)stateGame.volume=e.volume;
  await eventEmitter.broadcastAsync({type:'parrotEncore',symbol:e.symbol,positions:e.positions,mult:e.mult,success:stateGame.encoreResult});
 },
 volumeStart:async e=>{stateGame.volume=e.volume;await eventEmitter.broadcastAsync({type:'parrotVolumeStart',volume:e.volume});},
 platinumRecord:async e=>{
  stateGame.platinum={mult:e.mult,applied:e.applied,baseWin:e.baseWin,totalWin:e.totalWin};
  await eventEmitter.broadcastAsync({type:'parrotRecord',...stateGame.platinum});
  // Authoritative updateTumbleWin follows an applied record. Records never accumulate.
 },
 setTotalWin:async e=>{stateBet.winBookEventAmount=e.amount;},
 freeSpinTrigger:async e=>{
  eventEmitter.broadcast({type:'scatterWinsHide'});await eventEmitter.broadcastAsync({type:'uiHide'});
  stateGame.gameType='freegame';stateGame.volume=1;await eventEmitter.broadcastAsync({type:'transition'});
  eventEmitter.broadcast({type:'freeSpinIntroShow'});await eventEmitter.broadcastAsync({type:'freeSpinIntroUpdate',totalFreeSpins:e.totalFs});eventEmitter.broadcast({type:'freeSpinIntroHide'});
  updateCounter(1,e.totalFs);await eventEmitter.broadcastAsync({type:'uiShow'});eventEmitter.broadcast({type:'drawerFold'});
 },
 updateFreeSpin:async e=>{updateCounter(e.amount,e.total);},
 freeSpinRetrigger:async e=>{updateCounter(stateUi.freeSpinCounterCurrent,e.totalFs);await waitForTimeout(stateBet.isTurbo?180:450);},
 freeSpinEnd:async e=>{
  const total=featureTotal(e.amount,e.winLevel);eventEmitter.broadcast({type:'freeSpinOutroShow'});
  await eventEmitter.broadcastAsync({type:'freeSpinOutroCountUp',amount:total.amount,winLevelData:winLevelMap[total.winLevel as WinLevel]});
  eventEmitter.broadcast({type:'freeSpinOutroHide'});eventEmitter.broadcast({type:'freeSpinCounterHide'});stateUi.freeSpinCounterShow=false;stateGame.gameType='basegame';stateGame.volume=1;
  await eventEmitter.broadcastAsync({type:'transition'});await eventEmitter.broadcastAsync({type:'uiShow'});
 },
 setWin:async e=>{const winLevelData=winLevelMap[e.winLevel as WinLevel];if(winLevelData?.type!=='big')return;eventEmitter.broadcast({type:'winShow'});await eventEmitter.broadcastAsync({type:'winUpdate',amount:e.amount,winLevelData});eventEmitter.broadcast({type:'winHide'});},
 finalWin:async()=>{stateGame.gameType='basegame';stateGame.volume=1;stateUi.freeSpinCounterShow=false;eventEmitter.broadcast({type:'freeSpinCounterHide'});},
 wincap:async e=>{stateBet.winBookEventAmount=e.amount;},
 createBonusSnapshot:async e=>{
  // Restore state from all historical events, with no historical animation or payments.
  stateGame.volume=1;stateGame.encored=false;stateGame.platinum=null;
  for(const prior of e.bookEvents){
   switch(prior.type){
    case 'reveal':stateGame.gameType=prior.gameType;stateGame.tumbleWin=0;stateGame.encored=false;stateGame.encoreResult=null;stateGame.platinum=null;stateGame.spinWin=0;stateGame.postEncoreWin=0;stateGameDerived.enhancedBoard.settle(prior.board);break;
    case 'encore':for(const p of prior.positions)stateGame.board[p.reel].reelState.symbols[p.row].rawSymbol={name:prior.symbol};stateGame.encored=true;if(prior.volume!==null)stateGame.volume=prior.volume;break;
    case 'tumbleBoard':for(let reel=0;reel<stateGame.board.length;reel++){const rows=prior.explodingSymbols.filter(p=>p.reel===reel).map(p=>p.row);if(rows.length){const r=stateGame.board[reel];r.setSymbolsWithRawSymbols(planCascadeColumn(r.reelState.symbols.map(s=>s.rawSymbol),rows,prior.newSymbols[reel],config.numRows[reel]).column);}}break;
    case 'winInfo':stateGame.spinWin+=prior.totalWin;if(stateGame.encored)stateGame.postEncoreWin+=prior.totalWin;break;
    case 'volumeStart':stateGame.volume=prior.volume;break;
    case 'updateTumbleWin':stateGame.tumbleWin=prior.amount;break;
    case 'setTotalWin':stateBet.winBookEventAmount=prior.amount;break;
    case 'freeSpinTrigger':stateGame.gameType='freegame';updateCounter(1,prior.totalFs);break;
    case 'updateFreeSpin':updateCounter(prior.amount,prior.total);break;
    case 'freeSpinRetrigger':updateCounter(stateUi.freeSpinCounterCurrent,prior.totalFs);break;
    case 'freeSpinEnd':case 'finalWin':stateGame.gameType='basegame';stateGame.volume=1;stateUi.freeSpinCounterShow=false;break;
   }
  }
 },
};
''')
write('src/components/ParrotFeature.svelte',r'''
<script lang="ts" module>
 import type {SymbolName,Position} from '../game/types';
 export type EmitterEventParrot={type:'parrotEncore';symbol:SymbolName;positions:Position[];mult:number;success:boolean}|{type:'parrotVolumeStart';volume:number}|{type:'parrotRecord';mult:number;applied:boolean;baseWin:number;totalWin:number};
</script>
<script lang="ts">
 import {Container,Graphics,Text} from 'pixi-svelte';
 import {waitForTimeout} from 'utils-shared/wait';
 import {bookEventAmountToCurrencyString} from 'utils-shared/amount';
 import {stateBet} from 'state-shared';
 import {getContext} from '../game/context';
 import {BOARD_SIZES} from '../game/constants';
 import {GAME_FONT} from '../game/fonts';
 import {parrotText} from '../game/parrotText';
 import BoardContainer from './BoardContainer.svelte';
 const context=getContext();let cue=$state(''),record=$state(false),recordAngle=$state(0),amount=$state(0),mult=$state(1);
 const wait=(normal:number,fast:number)=>waitForTimeout(stateBet.isTurbo?fast:normal);
 context.eventEmitter.subscribeOnMount({
  parrotVolumeStart:async()=>{await wait(450,200);},
  parrotEncore:async e=>{
   cue=parrotText('encore');mult=e.mult;await wait(1000,350);
   for(const p of e.positions){const symbol=context.stateGame.board[p.reel]?.reelState.symbols[p.row];if(!symbol)continue;symbol.rawSymbol={name:e.symbol};symbol.symbolState='land';await wait(70,30);}
   await wait(350,150);if(!e.success){cue=parrotText('miss');await wait(650,350);}cue='';
  },
  parrotRecord:async e=>{
   record=true;mult=e.mult;amount=e.baseWin;cue=parrotText('record');await wait(900,400);
   for(let frame=0;frame<10;frame++){recordAngle+=(10-frame)*.17;await waitForTimeout(stateBet.isTurbo?30:40);}recordAngle=0;
   cue=`${parrotText('record')} ×${e.mult}`;await wait(200,150);
   if(e.applied){amount=e.totalWin;await wait(650,390);}else{cue=parrotText('miss');await wait(400,250);}
   record=false;cue='';
  }
 });
</script>
<BoardContainer>
 {#if context.stateGame.gameType==='freegame'}
  <Container x={-75} y={60}>
   <Graphics draw={g=>{g.clear();g.circle(0,0,53).fill(0x101b28).stroke({color:0xf2c14e,width:4});for(let n=0;n<20;n++){const a=(150+n*300/19)*Math.PI/180;g.circle(Math.cos(a)*42,Math.sin(a)*42,3).fill(n<context.stateGame.volume?(n<8?0x6de281:n<14?0xffda65:0xff5c69):0x344153);}g.circle(0,0,23).fill(0xc59a46);const a=(150+(context.stateGame.volume-1)*300/19)*Math.PI/180;g.moveTo(0,0).lineTo(Math.cos(a)*19,Math.sin(a)*19).stroke({color:0xffffff,width:3});}}/>
   <Text y={65} anchor={.5} text={`×${context.stateGame.volume}`} style={{fontFamily:GAME_FONT,fontSize:28,fill:0xffffff}}/>
  </Container>
 {/if}
 {#if cue}
  <Container x={BOARD_SIZES.width/2} y={-95}>
   <Graphics draw={g=>{g.clear();g.roundRect(-220,-32,440,64,14).fill(0x102b40).stroke({color:record?0xe5f5ff:0xf2c14e,width:4});}}/>
   <Text anchor={.5} text={cue} style={{fontFamily:GAME_FONT,fontSize:28,fill:0xf2c14e}}/>
   {#if record}<Container y={135} rotation={recordAngle}>
    <Graphics draw={g=>{g.clear();g.circle(0,0,75).fill(0xd5e8ee).stroke({color:0xffffff,width:5});for(let r=35;r<72;r+=6)g.circle(0,0,r).stroke({color:0x8ca6b3,width:1});g.circle(0,0,29).fill(0x16334a);}}/>
    <Text anchor={.5} text={`×${mult}`} style={{fontFamily:GAME_FONT,fontSize:23,fill:0xffffff}}/>
   </Container><Text y={235} anchor={.5} text={bookEventAmountToCurrencyString(amount)} style={{fontFamily:GAME_FONT,fontSize:32,fill:0xffffff,stroke:{color:0x102b40,width:5}}}/>{/if}
  </Container>
 {/if}
</BoardContainer>
''')
print('Parrot event presentation written')
