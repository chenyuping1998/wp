from pathlib import Path
import json
ROOT=Path('E:/stake/wp/apps')
for folder,slug in [('Purrfia喵菲亞家族','purrfia'),('ParrotRadio鸚鵡電台','parrot')]:
 app=ROOT/folder;cat=slug=='purrfia'
 p=app/'design/check_assets.mjs';p.write_text(p.read_text(encoding='utf-8').replace('audio/medusa','audio/'+slug).replace('MEDUSA_AUDIO','GAME_AUDIO'),encoding='utf-8')
 # Timeline and count-up are cancellable with an explicit final state.
 win='''<script lang="ts" module>
 import type {WinLevelData} from '../game/winLevelMap';
 export type EmitterEventWin={type:'winShow'}|{type:'winHide'}|{type:'winUpdate';amount:number;winLevelData:WinLevelData};
</script>
<script lang="ts">
 import {onDestroy} from 'svelte';import {Container,Sprite,Text,Graphics} from 'pixi-svelte';
 import {MainContainer,CanvasSizeRectangle} from 'components-layout';import {stateBet} from 'state-shared';
 import {bookEventAmountToCurrencyString} from 'utils-shared/amount';import {getContext} from '../game/context';
 import {GAME_FONT} from '../game/fonts';import PressToContinue from './PressToContinue.svelte';import type {WinLevelData} from '../game/winLevelMap';
 const context=getContext();let show=$state(false),value=$state(0),age=$state(0),data=$state<WinLevelData>();let final=0,raf=0,timer:ReturnType<typeof setTimeout>|undefined,resolve=()=>{};
 const finish=()=>{value=final;cancelAnimationFrame(raf);clearTimeout(timer);resolve();resolve=()=>{};};
 context.eventEmitter.subscribeOnMount({winShow:()=>show=true,winHide:()=>{show=false;finish();},winUpdate:async e=>{finish();data=e.winLevelData;final=e.amount;value=0;age=0;
  const duration=stateBet.isTurbo?Math.max(850,e.winLevelData.presentDuration*.55):e.winLevelData.presentDuration;
  await new Promise<void>(done=>{resolve=done;const start=performance.now();const tick=(now:number)=>{age=(now-start)/1000;const t=Math.min(1,(now-start)/duration);value=Math.round(final*(1-(1-t)**2));if(t<1)raf=requestAnimationFrame(tick);else finish();};raf=requestAnimationFrame(tick);timer=setTimeout(finish,duration+120);});
 }});onDestroy(finish);
 const layout=$derived(context.stateLayoutDerived.mainLayout());const width=$derived(Math.min(920,layout.width*.92));
 const banner=$derived('mgWinBanner'+(data?.alias??'big').replace(/^./,c=>c.toUpperCase()));
 const names:Record<string,string>={big:'BIG WIN',superwin:'SUPER WIN',mega:'MEGA WIN',epic:'EPIC WIN',max:'MAX WIN'};
</script>
{#if show&&data}<CanvasSizeRectangle backgroundColor={0x091221} backgroundAlpha={.72}/><MainContainer>
 <Container x={layout.width*.5} y={layout.height*.43}>
  <Graphics draw={g=>{g.clear();for(let i=0;i<36;i++){const a=i*2.39996,r=width*(.16+((age*.14+i*.037)% .42)),x=Math.cos(a)*r,y=Math.sin(a)*r*.65;g.star(x,y,4,2+(i%3),1).fill({color:i%2?0xffe6a0:0xffffff,alpha:.5});}}/>
  <Container scale={Math.min(1,age/.28)*(1+.04*Math.sin(Math.min(1,age/.28)*Math.PI))}>
   <Sprite key={banner} anchor={.5} width={width} height={width*194/1352}/>
   <Text anchor={.5} text={names[data.alias]??'BIG WIN'} style={{fontFamily:GAME_FONT,fontSize:width*.056,fill:0xffe6a0,stroke:{color:0x281c20,width:3}}}/>
  </Container>
  <Text y={width*.15} anchor={.5} text={bookEventAmountToCurrencyString(value)} style={{fontFamily:GAME_FONT,fontSize:width*.082,fill:0xffe6a0,stroke:{color:0x281c20,width:5},dropShadow:{color:0x000000,blur:8,distance:4,alpha:.6}}}/>
 </Container>
</MainContainer><PressToContinue onpress={finish}/>{/if}
'''
 (app/'src/components/Win.svelte').write_text(win,encoding='utf-8')
 # Trigger the corresponding character actions at authoritative book events.
 p=app/'src/game/bookEventHandlerMap.ts';s=p.read_text(encoding='utf-8')
 if cat:
  s=s.replace("if (winLevelData?.type === 'big') {","if (winLevelData?.type === 'big') {\n        eventEmitter.broadcast({type:'castPlay',name:winLevelData.alias==='max'?'win_max':'win_big',hold:true});")
  s=s.replace("const winLevelSoundsStop = () => {","const winLevelSoundsStop = () => {\n    eventEmitter.broadcast({type:'castPlay',name:'idle'});")
  s=s.replace("freeSpinTrigger: async (bookEvent: BookEventOfType<'freeSpinTrigger'>) => {","freeSpinTrigger: async (bookEvent: BookEventOfType<'freeSpinTrigger'>) => {\n        eventEmitter.broadcast({type:'castPlay',name:'fg_trigger'});")
  s=s.replace("freeSpinEnd: async (bookEvent: BookEventOfType<'freeSpinEnd'>) => {","freeSpinEnd: async (bookEvent: BookEventOfType<'freeSpinEnd'>) => {\n        eventEmitter.broadcast({type:'castPlay',name:'fg_end'});\n        eventEmitter.broadcast({type:'soundCue',cue:'stinger_fg_outro',priority:1});")
 else:
  s=s.replace("if(winLevelData?.type!=='big')return;eventEmitter.broadcast({type:'winShow'});","if(winLevelData?.type!=='big'){eventEmitter.broadcast({type:'castPlay',name:e.amount>=1000?'react_good':'react_small'});return;}eventEmitter.broadcast({type:'castPlay',name:winLevelData.alias==='max'?'win_max':'win_big',hold:true});eventEmitter.broadcast({type:'soundBigWinBlast',tier:Math.min(5,winLevelData.level-5) as 1|2|3|4|5});eventEmitter.broadcast({type:'winShow'});")
  s=s.replace("eventEmitter.broadcast({type:'winHide'});},","eventEmitter.broadcast({type:'winHide'});eventEmitter.broadcast({type:'castPlay',name:'idle'});},")
  s=s.replace("freeSpinTrigger:async(e:BookEventOfType<'freeSpinTrigger'>)=>{","freeSpinTrigger:async(e:BookEventOfType<'freeSpinTrigger'>)=>{\n  eventEmitter.broadcast({type:'castPlay',name:'fg_trigger'});eventEmitter.broadcast({type:'soundCue',cue:'stinger_fg_intro',priority:1});")
  s=s.replace("freeSpinEnd:async(e:BookEventOfType<'freeSpinEnd'>)=>{","freeSpinEnd:async(e:BookEventOfType<'freeSpinEnd'>)=>{\n  eventEmitter.broadcast({type:'castPlay',name:'fg_end'});eventEmitter.broadcast({type:'soundCue',cue:'stinger_fg_outro',priority:1});")
 p.write_text(s,encoding='utf-8')

# Replace mechanism geometry with independently painted production parts.
p=ROOT/'ParrotRadio鸚鵡電台/src/components/ParrotFeature.svelte';s=p.read_text(encoding='utf-8').replace('{Container,Graphics,Text}','{Container,Graphics,Text,Sprite}')
start=s.index('   <Graphics draw=');end=s.index('\n   <Text y={65}',start)
s=s[:start]+'''   <Sprite key="art_knob_base" anchor={.5} width={150} height={150}/>
   {#each Array.from({length:20},(_,i)=>i) as n}{@const a=(135+n*270/19)*Math.PI/180}<Sprite key="art_knob_led" anchor={.5} x={Math.cos(a)*52} y={Math.sin(a)*52} width={15} height={15} tint={n<8?0x75ff7a:n<14?0xffdf45:0xff5369} alpha={n<context.stateGame.volume?1:.08}/>{/each}
   <Sprite key="art_knob_cap" anchor={.5} width={88} height={88} rotation={(-135+(context.stateGame.volume-1)*270/19)*Math.PI/180}/>
''' +s[end:]
start=s.index('    <Graphics draw=');end=s.index('\n    <Text anchor=',start)
s=s[:start]+'''    <Sprite key="art_platinum_disc" anchor={.5} width={210} height={210}/>
    <Sprite key={'art_platinum_label_t'+(mult>=250?4:mult>=50?3:mult>=10?2:1)} anchor={.5} width={115} height={115}/>
''' +s[end:]
p.write_text(s,encoding='utf-8')
