<script lang="ts" module>
 import type {SymbolName,Position} from '../game/types';
 export type EmitterEventParrot={type:'parrotEncore';symbol:SymbolName;positions:Position[];mult:number;success:boolean}|{type:'parrotVolumeStart';volume:number}|{type:'parrotRecord';mult:number;applied:boolean;baseWin:number;totalWin:number};
</script>
<script lang="ts">
 import {Container,Graphics,Text,Sprite} from 'pixi-svelte';
 import {waitForTimeout} from 'utils-shared/wait';
 import {bookEventAmountToCurrencyString} from 'utils-shared/amount';
 import {stateBet} from 'state-shared';
 import {getContext} from '../game/context';
 import {BOARD_SIZES} from '../game/constants';
 import {GAME_FONT} from '../game/fonts';
 import {parrotText} from '../game/parrotText';
 import BoardContainer from './BoardContainer.svelte';
 const context=getContext();let cue=$state(''),showRecord=$state(false),recordAngle=$state(0),amount=$state(0),mult=$state(1);
 const wait=(normal:number,fast:number)=>waitForTimeout(stateBet.isTurbo?fast:normal);
 context.eventEmitter.subscribeOnMount({
  parrotVolumeStart:async()=>{context.eventEmitter.broadcast({type:'castPlay',name:'turn_knob',rate:stateBet.isTurbo?2.67:1});await wait(450,200);},
  parrotEncore:async e=>{
   context.eventEmitter.broadcast({type:'castPlay',name:'encore_build',rate:stateBet.isTurbo?2.86:1});context.eventEmitter.broadcast({type:'soundCue',cue:'sfx_scratch_build',priority:2});
   cue=parrotText('encore');mult=e.mult;await wait(1000,350);
   context.eventEmitter.broadcast({type:'castPlay',name:'encore_call'});context.eventEmitter.broadcast({type:'soundCue',cue:'vo_squawk_call',priority:2});
   if(context.stateGame.gameType==='freegame'){context.eventEmitter.broadcast({type:'soundCue',cue:'sfx_knob_click'});context.eventEmitter.broadcast({type:'soundCue',cue:'sfx_knob_led_'+context.stateGame.volume});}
   for(const [index,p] of e.positions.entries()){const symbol=context.stateGame.board[p.reel]?.reelState.symbols[p.row];if(!symbol)continue;symbol.rawSymbol={name:e.symbol};symbol.symbolState='land';context.eventEmitter.broadcast({type:'soundCue',cue:'sfx_flip_'+Math.min(18,index+1)});await wait(70,30);}
   await wait(350,150);if(context.stateGame.gameType==='freegame'){context.eventEmitter.broadcast({type:'castPlay',name:'turn_knob',rate:stateBet.isTurbo?2.67:1});await wait(400,150);}context.eventEmitter.broadcast({type:'castPlay',name:e.success?'encore_success':'encore_fail'});context.eventEmitter.broadcast({type:'soundCue',cue:e.success?'sfx_encore_hit':'sfx_encore_miss',priority:e.success?1:2});if(!e.success){cue=parrotText('miss');await wait(650,350);}cue='';
  },
  parrotRecord:async e=>{
   context.eventEmitter.broadcast({type:'castPlay',name:'record_pull',rate:stateBet.isTurbo?2.5:1});context.eventEmitter.broadcast({type:'soundCue',cue:'sfx_record_sleeve',priority:2});
   showRecord=true;mult=e.mult;amount=e.baseWin;cue=parrotText('record');await wait(900,400);
   for(let frame=0;frame<10;frame++){recordAngle+=(10-frame)*.17;await waitForTimeout(stateBet.isTurbo?30:40);}recordAngle=0;
   cue=`${parrotText('record')} ×${e.mult}`;context.eventEmitter.broadcast({type:'soundCue',cue:'sfx_record_reveal_t'+(e.mult>=250?4:e.mult>=50?3:e.mult>=10?2:1),priority:1});await wait(200,150);
   context.eventEmitter.broadcast({type:'castPlay',name:e.applied?'record_hit':'record_miss'});
   if(e.applied){context.eventEmitter.broadcast({type:'soundCue',cue:'sfx_record_hit',priority:1});amount=e.totalWin;await wait(650,390);}else{context.eventEmitter.broadcast({type:'soundCue',cue:'sfx_record_miss',priority:2});cue=parrotText('miss');await wait(400,250);}
   showRecord=false;cue='';
  }
 });
</script>
<BoardContainer>
 {#if context.stateGame.gameType==='freegame'}
  <Container x={context.stateLayoutDerived.layoutType()==='portrait'?65:-75} y={context.stateLayoutDerived.layoutType()==='portrait'?-110:60}>
   <Sprite key="art_knob_base" anchor={.5} width={150} height={150}/>
   {#each Array.from({length:20},(_,i)=>i) as n}{@const a=(135+n*270/19)*Math.PI/180}<Sprite key="art_knob_led" anchor={.5} x={Math.cos(a)*52} y={Math.sin(a)*52} width={15} height={15} tint={n<8?0x75ff7a:n<14?0xffdf45:0xff5369} alpha={n<context.stateGame.volume?1:.08}/>{/each}
   <Sprite key="art_knob_cap" anchor={.5} width={88} height={88} rotation={(-135+(context.stateGame.volume-1)*270/19)*Math.PI/180}/>

   <Text y={65} anchor={.5} text={`×${context.stateGame.volume}`} style={{fontFamily:GAME_FONT,fontSize:28,fill:0xffffff}}/>
  </Container>
 {/if}
 {#if cue}
  <Container x={BOARD_SIZES.width/2} y={-95}>
   <Graphics draw={g=>{g.clear();g.roundRect(-220,-32,440,64,14).fill(0x102b40).stroke({color:showRecord?0xe5f5ff:0xf2c14e,width:4});}}/>
   <Text anchor={.5} text={cue} style={{fontFamily:GAME_FONT,fontSize:28,fill:0xf2c14e}}/>
   {#if showRecord}<Container y={135} rotation={recordAngle}>
    <Sprite key="art_platinum_disc" anchor={.5} width={210} height={210}/>
    <Sprite key={'art_platinum_label_t'+(mult>=250?4:mult>=50?3:mult>=10?2:1)} anchor={.5} width={115} height={115}/>

    <Text anchor={.5} text={`×${mult}`} style={{fontFamily:GAME_FONT,fontSize:23,fill:0xffffff}}/>
   </Container><Text y={235} anchor={.5} text={bookEventAmountToCurrencyString(amount)} style={{fontFamily:GAME_FONT,fontSize:32,fill:0xffffff,stroke:{color:0x102b40,width:5}}}/>{/if}
  </Container>
 {/if}
</BoardContainer>
