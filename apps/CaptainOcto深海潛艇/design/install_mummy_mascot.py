from pathlib import Path
import shutil, json
ROOT=Path(__file__).resolve().parent.parent
dst=ROOT/'static/assets/spines/mummyCat';dst.mkdir(parents=True,exist_ok=True)
for p in (ROOT/'design/source/mummy_delivery/mascot_built/game').iterdir():shutil.copy2(p,dst/p.name)
source=r'''<script lang="ts" module>
 export type EmitterEventMascot =
  | {type:'mascotChestBeat'} | {type:'mascotThrow'} | {type:'mascotGoggleTease'}
  | {type:'mascotWheelLook'} | {type:'mascotWheelCheer'} | {type:'mascotSunThrow'};
</script>
<script lang="ts">
 import { SpineProvider, SpineTrack } from 'pixi-svelte';
 import { onMount, onDestroy } from 'svelte';
 import { stateBet } from 'state-shared';
 import { getContext } from '../game/context';
 const context=getContext();
 const DURATION:Record<string,number>={idle:3200,wave:1800,point:1400,throw:1300,cheer:1200,laugh:1600,disappoint:1700,dance:1600};
 const placement=$derived.by(()=>{
  const l=context.stateLayoutDerived.mainLayout(),b=context.stateGameDerived.boardLayout();
  const edge=b.x+b.width*b.scale*1.28/2,gap=l.width-edge;
  if(gap<260)return null;
  const height=Math.min((l.height-(l.height-b.y*2))*.92,gap*.85*1296/785);
  return {x:edge+gap*.5,y:Math.min(b.y+b.height*b.scale*1.28/2,b.y*2-6),scale:height/648};
 });
 let animationName=$state('idle'),loop=$state(true),reset:ReturnType<typeof setTimeout>|undefined;
 let releaseTimer:ReturnType<typeof setTimeout>|undefined,releaseResolve:(()=>void)|null=null,lastAction=Date.now();
 let mounted=false,anticipating=false;
 const locked=()=>['cheer','throw','dance'].includes(animationName);
 const say=(name:'wave'|'cheer'|'laugh'|'disappoint')=>context.eventEmitter.broadcast({type:'soundMascotVoice',name});
 function idle(){clearTimeout(reset);animationName='idle';loop=true;lastAction=Date.now();}
 function play(name:string,force=false){
  if(locked()&&!force)return;
  clearTimeout(reset);animationName=name;loop=name==='idle'||name==='dance';lastAction=Date.now();
  if(!loop)reset=setTimeout(idle,DURATION[name]+30);
 }
 function released(){if(releaseResolve){const done=releaseResolve;releaseResolve=null;clearTimeout(releaseTimer);done();}}
 function sunThrow(){
  released();play('throw',true);
  return new Promise<void>(resolve=>{releaseResolve=resolve;
   // The Spine release event owns timing. A hidden canvas / portrait has no advancing track.
   releaseTimer=setTimeout(released,placement&&mounted?650:420);
  });
 }
 $effect(()=>{context.stateGame.mascotThrowOrigin=placement?{x:placement.x-190*placement.scale,y:placement.y-410*placement.scale}:null;});
 context.eventEmitter.subscribeOnMount({
  mascotChestBeat:()=>{play('cheer');say('cheer');},mascotThrow:()=>play('throw'),
  mascotGoggleTease:()=>{ /* A reaction never exposes the book outcome before reels stop. */ },
  mascotWheelLook:()=>play('point'),mascotWheelCheer:()=>{play('laugh');say('laugh');},mascotSunThrow:sunThrow,
  soundReelTensionStart:()=>{anticipating=true;play('point');},
  soundReelTensionStop:()=>{if(anticipating){anticipating=false;if(context.stateGame.scatterCounter<3){play('disappoint');say('disappoint');}}},
  winLinesShow:({lines})=>{if(animationName!=='idle')return;const won=lines.reduce((sum,line)=>sum+line.amount,0);if(won>=stateBet.betAmount*100*5){play('laugh');say('laugh');}},
  soundLoop:({name})=>{if(name==='sfx_bigwin_coinloop')play('dance',true);},
  soundStop:({name})=>{if(name==='sfx_bigwin_coinloop'&&animationName==='dance')idle();},
 });
 onMount(()=>{mounted=true;const hello=setTimeout(()=>{play('wave');say('wave');},1200);const wave=setInterval(()=>{if(animationName==='idle'&&Date.now()-lastAction>24000)play('wave');},3000);return()=>{clearTimeout(hello);clearInterval(wave);};});
 onDestroy(()=>{mounted=false;clearTimeout(reset);released();context.stateGame.mascotThrowOrigin=null;});
</script>
{#if placement}
 <SpineProvider key="gbMonkey" x={placement.x} y={placement.y} scale={placement.scale} zIndex={-1}>
  <SpineTrack trackIndex={0} {animationName} {loop} mixDuration={.12}
   listener={{event:(_entry,event)=>{if(event.data.name==='release')released();if(event.data.name==='takeoff')say('cheer');}}} />
 </SpineProvider>
{/if}
'''
(ROOT/'src/components/Mascot.svelte').write_text(source,encoding='utf-8')
p=ROOT/'src/game/bookEventHandlerMap.ts';s=p.read_text(encoding='utf-8');s=s.replace("eventEmitter.broadcast({ type: 'mascotSunThrow' });\n\t\tawait waitForTimeout(stateBet.isTurbo ? 250 : 580);","await eventEmitter.broadcastAsync({ type: 'mascotSunThrow' });")
p.write_text(s,encoding='utf-8')
p=ROOT/'src/game/assets.ts';s=p.read_text(encoding='utf-8').replace('spines/goBananasMonkey/monkey.','spines/mummyCat/mummyCat.');p.write_text(s,encoding='utf-8')
print('Installed template mummyCat, release event and eight reactions')
