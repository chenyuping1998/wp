<script lang="ts">
 import {onMount,untrack} from 'svelte';
 import { Container,Graphics,Text } from 'pixi-svelte';
 import type { Graphics as PixiGraphics } from 'pixi.js';
 import { GAME_FONT } from '../game/fonts';
 import {motionTrack} from '../game/treasureMotion';
 import {multiplierFlip,MULTIPLIER_FLIP_MS} from '../game/treasureMechanicMotion';
 import {subscribePresentationFrame} from '../game/presentationClock';
 import {featureTimeScale} from '../game/timeScale';
 let {size=1,mult=2,time=-1,glow=1,sticky=false,duration=340,pulse=0,updateTime,previousMult,playbackRate,onflip=()=>{}}:{size?:number;mult?:number;time?:number;glow?:number;sticky?:boolean;duration?:number;pulse?:number;updateTime?:number;previousMult?:number;playbackRate?:number;onflip?:()=>void}=$props();
 const initial=untrack(()=>mult);
 let target=$state(initial),previous=$state(initial),updateElapsed=$state(-1),reduced=$state(false);
 let flipSoundFired=false;
 const flip=$derived(multiplierFlip(updateTime??updateElapsed,reduced));
 $effect(()=>{const next=mult;untrack(()=>{
  if(next===target)return;
  // Interrupt from whichever number is currently readable, without replaying
  // the frame's arrival or changing its footprint.
  previous=multiplierFlip(updateElapsed,reduced).newAlpha>=.5?target:previous;
  target=next;updateElapsed=0;flipSoundFired=false;
  if(reduced&&updateTime===undefined){flipSoundFired=true;onflip();}
 });});
 onMount(()=>{
  const preference=window.matchMedia('(prefers-reduced-motion: reduce)');
  const update=()=>reduced=preference.matches;update();preference.addEventListener('change',update);
  const stop=subscribePresentationFrame(delta=>{
   if(updateElapsed<0||updateElapsed>=MULTIPLIER_FLIP_MS||updateTime!==undefined)return;
   updateElapsed=Math.min(MULTIPLIER_FLIP_MS,updateElapsed+delta*(playbackRate??featureTimeScale()));
   if(!flipSoundFired&&updateElapsed>=MULTIPLIER_FLIP_MS*.36){flipSoundFired=true;onflip();}
  });
  return()=>{stop();preference.removeEventListener('change',update);};
 });
 const span=$derived(118*size);
 const u=$derived(time<0?1:Math.min(1,Math.max(0,time/duration)));
 const label=$derived(motionTrack(u,[[0,0],[.42,0],[.67,1.08],[.82,.97],[1,1]]));
 const reveal=$derived(motionTrack(u,[[0,0],[.12,0],[.69,1],[1,1]]));
 const draw=(g:PixiGraphics)=>{
  g.clear();const n=span*.47,weight=.8+size*.2;
  g.roundRect(-n,-n,n*2,n*2,10).fill({color:0xf3d397,alpha:.1*reveal});
  const corners=[[-n,-n],[n,-n],[n,n],[-n,n]];
  // A connected trace follows the perimeter; posts land in order rather than
  // scaling the entire square and making the evaluated footprint seem elastic.
  let length=reveal*8*n;
  for(let i=0;i<4;i++){
   const [x,y]=corners[i],[tx,ty]=corners[(i+1)%4],f=Math.min(1,Math.max(0,length/(2*n)));length-=2*n;
   if(f>0)g.moveTo(x,y).lineTo(x+(tx-x)*f,y+(ty-y)*f).stroke({color:0x2e8f96,width:3.5,alpha:.6+.3*glow});
   const phase=Math.max(0,Math.min(1,(u-i*.055)/.46));
   const drop=motionTrack(phase,[[0,-13*weight],[.6,1.5*weight],[.82,-.5],[1,0]]);
   g.ellipse(x,y+5,7,2.5).fill({color:0x9d784d,alpha:.15*phase});
   if(phase>0)g.circle(x,y+drop,5).fill({color:0xd94a38,alpha:Math.min(1,phase*4)}).stroke({width:1.7,color:0x2a1a12,alpha:Math.min(1,phase*4)});
   if(phase>0&&phase<1)for(let j=0;j<5;j++){
    const age=Math.max(0,(phase-.35)/.65),dx=(j-2)*age*(5+size),dy=-Math.sin(Math.PI*age)*(7+j%3*4)*weight;
    g.ellipse(x+dx,y+dy,1.5,1).fill({color:j%2?0xd5ad69:0xffe4b0,alpha:age>0?1-age:0});
   }
  }
  if(sticky&&reveal>.9)g.circle(n-4,-n+3,7).fill(0xd94a38).stroke({color:0x2a1a12,width:2});
 };
 const plaque=(g:PixiGraphics)=>{g.clear();g.roundRect(-36,-14,72,29,8).fill(0xfff4d7).stroke({color:0x2a1a12,width:2});};
</script>
<Container>
 <Graphics draw={draw}/>
 <Container y={span*.47-10+(1-label)*9} scale={label*(1+(reduced?0:Math.max(0,pulse)*.065))} alpha={Math.min(1,label)}>
  <Container scale={{x:1,y:flip.plateY}}><Graphics draw={plaque}/></Container>
  {#if flip.oldAlpha>0}<Text text={`${previousMult??previous}×`} y={flip.oldY} alpha={flip.oldAlpha} anchor={.5} style={{fontFamily:GAME_FONT,fontSize:20,fill:0x274c52}}/>{/if}
  <Text text={`${target}×`} y={flip.newY} scale={flip.newScale} alpha={flip.newAlpha} anchor={.5} style={{fontFamily:GAME_FONT,fontSize:20,fill:0x274c52}}/>
 </Container>
</Container>
