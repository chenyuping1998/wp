<script lang="ts">
 import {onMount} from 'svelte';
 import {Container,Graphics,Text} from 'pixi-svelte';
 import TreasureBeachBackdrop from './TreasureBeachBackdrop.svelte';
 import type {Graphics as PixiGraphics} from 'pixi.js';
 import TreasureFigure from './TreasureFigure.svelte';
 import TreasureSymbol from './TreasureSymbol.svelte';
 import WaveWipe from './WaveWipe.svelte';
 import {subscribePresentationFrame} from '../game/presentationClock';
 import {FeatureOpeningTimeline,featureOpeningPose,OPENING,type OpeningSound} from '../game/featureOpening';
 let {width,height,playbackRate=1,timeScale,previewTime,title='BEACH SWEEP',oncover=()=>{},oncomplete=()=>{},onsound=()=>{}}:{width:number;height:number;playbackRate?:number;timeScale?:()=>number;previewTime?:number;title?:string;oncover?:()=>void;oncomplete?:()=>void;onsound?:(cue:OpeningSound)=>void}=$props();
 let clock=$state(0),reduced=$state(false);
 const time=$derived(previewTime??clock),pose=$derived(featureOpeningPose(time,reduced));
 const portrait=$derived(width/height<.85);
 const scale=$derived(Math.min(width/(portrait?670:1160),height/780));
 const figureX=$derived(portrait?218:610);
 const lootX=$derived(portrait?270:690);
 const titleX=$derived(portrait?335:390);
 const sceneWidth=$derived(portrait?670:1160);
 onMount(()=>{
  const timeline=new FeatureOpeningTimeline({cover:oncover,complete:oncomplete,sound:onsound});
  const preference=window.matchMedia('(prefers-reduced-motion: reduce)');
  const update=()=>{reduced=preference.matches;if(reduced&&previewTime===undefined)timeline.skip();};
  update();preference.addEventListener('change',update);
  const stop=subscribePresentationFrame(delta=>{if(previewTime!==undefined)return;timeline.advance(delta*(timeScale?.()??playbackRate));clock=timeline.time;});
  return()=>{timeline.cancel();stop();preference.removeEventListener('change',update);};
 });
 const shade=(g:PixiGraphics)=>{g.clear();g.rect(0,0,width,height).fill({color:0x163f49,alpha:.19});};
 const ground=(g:PixiGraphics)=>{
  g.clear();g.ellipse(lootX,674,110,14).fill({color:0x865e35,alpha:.16});
  if(pose.light<=0)return;
  for(let i=0;i<5;i++){
   const spread=20+i*14;
   g.poly([lootX-23,668,lootX-spread,488-i*16,lootX+spread,488-i*16,lootX+23,668]).fill({color:0xffecae,alpha:pose.light*.035});
  }
  g.ellipse(lootX,665,78,12).fill({color:0xffdf81,alpha:pose.light*.45});
  g.ellipse(lootX,665,47,6).fill({color:0xfff4c9,alpha:pose.light*.75});
 };
 const sand=(g:PixiGraphics)=>{
  g.clear();if(reduced)return;
  // Two finite, staggered emissions. Grains return to the sand plane, never
  // continue falling through it, and disappear before the surf arrives.
  for(let i=0;i<48;i++){
   const age=(time-(i<24?1180:1530)-(i%6)*24)/1000;
   if(age<0||age>.82)continue;
   const vx=((i*37)%101-50)*1.9,vy=-90-(i%7)*17;
   const dy=vy*age+240*age*age;
   if(dy>0)continue;
   const x=lootX+(i%5-2)*10+vx*age,y=665+dy,r=1.8+i%3;
   const alpha=Math.min(1,age/.06,Math.max(0,(.82-age)/.2));
   g.ellipse(x,y,r,r*.65).fill({color:i%3?0xd3a65f:0xfff0c3,alpha});
  }
  for(let i=0;i<9;i++){
   const age=(time-1620-i*50)/1000;if(age<0||age>.9)continue;
   const x=lootX+(i%3-1)*34,y=630-age*100-(i%3)*15,r=(2+Math.sin(age*Math.PI/.9)*4);
   g.moveTo(x-r,y).lineTo(x+r,y).moveTo(x,y-r).lineTo(x,y+r).stroke({color:0xfff4c9,width:1.8,alpha:Math.sin(age*Math.PI/.9)});
  }
 };
</script>
{#if time<OPENING.cover}
 <Container>
  <TreasureBeachBackdrop {width} {height} previewTime={time} {reduced}/>
  <Graphics draw={shade}/>
  <Container x={width/2} y={height/2} scale={scale*pose.camera}>
   <Container x={-sceneWidth/2} y={-390}>
    <Graphics draw={ground}/>
    <Container x={lootX-65} y={667-50*pose.chest} alpha={pose.chest} scale={.78+.22*pose.chest}>
     <TreasureSymbol name="H1" assetKey="hmH1" width={138} height={138} mode="win" time={Math.max(0,Math.min(690,time-OPENING.chestStart))} {reduced}/>
    </Container>
    <TreasureFigure who="digger" x={figureX} y={portrait?200:62} height={portrait?480:625} cue={pose.cue} previewTime={pose.actorTime}/>
    <Graphics draw={sand}/>
    <Container x={titleX} y={(portrait?90:160)+pose.titleY} alpha={pose.title}>
     <Text text="TREASURE FOUND" anchor={.5} style={{fontFamily:'Titan One',fontSize:portrait?23:27,fill:0xfff3d2,stroke:{color:0x274c52,width:4}}}/>
     <Text text={title} y={49} anchor={.5} style={{fontFamily:'Titan One',fontSize:portrait?40:48,fill:0xffedb2,stroke:{color:0x274c52,width:5}}}/>
     <Text text="THE NEXT ADVENTURE BEGINS" y={91} anchor={.5} style={{fontFamily:'Saira',fontSize:19,fill:0xfff3d2,stroke:{color:0x274c52,width:3}}}/>
    </Container>
   </Container>
  </Container>
 </Container>
{/if}
{#if time>=OPENING.wave}
 <WaveWipe {width} {height} previewTime={Math.min(1280,time-OPENING.wave)}/>
{/if}
