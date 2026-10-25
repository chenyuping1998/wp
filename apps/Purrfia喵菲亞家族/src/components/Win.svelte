<script lang="ts" module>
 import type {WinLevelData} from '../game/winLevelMap';
 export type EmitterEventWin={type:'winShow'}|{type:'winHide'}|{type:'winUpdate';amount:number;winLevelData:WinLevelData};
</script>
<script lang="ts">
 import {onDestroy} from 'svelte';import {Container,Sprite,Text,Graphics} from 'pixi-svelte';import type {Graphics as PixiGraphics} from 'pixi.js';
 import {MainContainer,CanvasSizeRectangle} from 'components-layout';import {stateBet} from 'state-shared';
 import {bookEventAmountToCurrencyString} from 'utils-shared/amount';import {getContext} from '../game/context';
 import {GAME_FONT} from '../game/fonts';import PressToContinue from './PressToContinue.svelte';
 const context=getContext();let show=$state(false),value=$state(0),age=$state(0),data=$state<WinLevelData>();let final=0,raf=0,timer:ReturnType<typeof setTimeout>|undefined,resolve=()=>{};
 const finish=()=>{value=final;cancelAnimationFrame(raf);clearTimeout(timer);resolve();resolve=()=>{};};
 context.eventEmitter.subscribeOnMount({winShow:()=>show=true,winHide:()=>{show=false;finish();},winUpdate:async e=>{finish();data=e.winLevelData;final=e.amount;value=0;age=0;
  const duration=stateBet.isTurbo?Math.max(850,e.winLevelData.presentDuration*.55):e.winLevelData.presentDuration;
  await new Promise<void>(done=>{resolve=done;const start=performance.now();const tick=(now:number)=>{age=(now-start)/1000;const t=Math.min(1,(now-start)/duration);value=Math.round(final*(1-(1-t)**2));if(t<1)raf=requestAnimationFrame(tick);else finish();};raf=requestAnimationFrame(tick);timer=setTimeout(finish,duration+120);});
 }});onDestroy(finish);
 const layout=$derived(context.stateLayoutDerived.mainLayout());const width=$derived(Math.min(920,layout.width*.92));
 const banner=$derived('mgWinBanner'+(data?.alias??'big').replace(/^./,c=>c.toUpperCase()));
 const names:Record<string,string>={big:'BIG WIN',superwin:'SUPER WIN',mega:'MEGA WIN',epic:'EPIC WIN',max:'MAX WIN'};
 const drawSparkles=(g:PixiGraphics)=>{g.clear();for(let i=0;i<36;i++){const a=i*2.39996,r=width*(.16+((age*.14+i*.037)% .42)),x=Math.cos(a)*r,y=Math.sin(a)*r*.65;g.star(x,y,4,2+(i%3),1).fill({color:i%2?0xffe6a0:0xffffff,alpha:.5});}};
</script>
{#if show&&data}<CanvasSizeRectangle backgroundColor={0x091221} backgroundAlpha={.72}/><MainContainer>
 <Container x={layout.width*.5} y={layout.height*.43}>
  <Graphics draw={drawSparkles}/>
  <Container scale={Math.min(1,age/.28)*(1+.04*Math.sin(Math.min(1,age/.28)*Math.PI))}>
   <Sprite key={banner} anchor={.5} width={width} height={width*194/1352}/>
   <Text anchor={.5} text={names[data.alias]??'BIG WIN'} style={{fontFamily:GAME_FONT,fontSize:width*.056,fill:0xffe6a0,stroke:{color:0x281c20,width:3}}}/>
  </Container>
  <Text y={width*.15} anchor={.5} text={bookEventAmountToCurrencyString(value)} style={{fontFamily:GAME_FONT,fontSize:width*.082,fill:0xffe6a0,stroke:{color:0x281c20,width:5},dropShadow:{color:0x000000,blur:8,distance:4,alpha:.6}}}/>
 </Container>
</MainContainer><PressToContinue onpress={finish}/>{/if}
