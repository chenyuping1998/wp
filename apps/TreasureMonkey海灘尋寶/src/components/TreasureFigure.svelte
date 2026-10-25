<script lang="ts">
 import { onMount, untrack } from 'svelte';
 import { Container, Sprite,Graphics } from 'pixi-svelte';
 import type { Graphics as PixiGraphics } from 'pixi.js';
 import rig from '../game/treasureCastRig.json';
 import { castPose, CastPerformer, type CastCue } from '../game/treasureMotion';
 import {subscribePresentationFrame} from '../game/presentationClock';
 import DetectorPanelLight from './DetectorPanelLight.svelte';
 import TreasureGaze from './TreasureGaze.svelte';
 import TreasureCastSkin from './TreasureCastSkin.svelte';
 import {castTorsoPoint} from '../game/treasureCastSkin';
 import {gazeAim,followEyes,type Aim,type EyeState} from '../game/treasureAttention';
 let {who='digger',x=0,y=0,height=680,cue='idle',sequence=0,previewTime,playbackRate=1,focus}:{who?:'digger'|'lifeguard';x?:number;y?:number;height?:number;cue?:CastCue;sequence?:number;previewTime?:number;playbackRate?:number;focus?:Aim}=$props();
 let time=$state(0),revision=$state(0),reduced=$state(false),cueStarted=$state(0);
 const performer=new CastPerformer();
 let eyes=$state<EyeState>({x:0,y:0,vx:0,vy:0});
 const aim=$derived(gazeAim(cue,previewTime??time-cueStarted,focus));
 const gaze=$derived(reduced?{x:0,y:0}:previewTime!==undefined?aim:eyes);
 const parts=$derived(rig[who]);
 const pose=$derived.by(()=>{
  revision;return previewTime!==undefined?castPose(previewTime,cue,previewTime,reduced,who):performer.sample(time,reduced);
 });
 $effect(()=>{sequence;const next=cue,cast=who;untrack(()=>{cueStarted=time;performer.trigger(time,next,cast,reduced);});revision=untrack(()=>revision+1);});
 const scale=$derived(height/700);
 const leftShoulder=$derived(castTorsoPoint(parts.arm_l.x,parts.arm_l.y,pose.chest,pose.breathX,pose.breathY,pose.shoulderY));
 const rightShoulder=$derived(castTorsoPoint(parts.arm_r.x,parts.arm_r.y,pose.chest,pose.breathX,pose.breathY,pose.shoulderY));
 const neck=$derived(castTorsoPoint(parts.head.x,parts.head.y,pose.chest,pose.breathX,pose.breathY,pose.shoulderY));
 const shadow=(g:PixiGraphics)=>{g.clear();g.ellipse(247,671,107,12).fill({color:0x765334,alpha:.1});g.ellipse(247,671,86,7).fill({color:0x765334,alpha:.09});};
 onMount(()=>{
  const preference=window.matchMedia('(prefers-reduced-motion: reduce)');
  const update=()=>reduced=preference.matches;update();preference.addEventListener('change',update);
  const stop=subscribePresentationFrame(delta=>{if(previewTime===undefined){time+=delta*playbackRate;eyes=followEyes(eyes,aim,delta*playbackRate);}});
  return()=>{stop();preference.removeEventListener('change',update);};
 });
</script>
<Container {x} {y} {scale}>
 <Graphics draw={shadow}/>
 <Container x={who==='lifeguard'?480:0} scale={{x:who==='lifeguard'?-1:1,y:1}}>
 {@const tail=parts.tail}
 <TreasureCastSkin assetKey={`treasure_${who}_tail`} part={tail} kind="tail" bend={pose.tailTip} middleBend={pose.tailMid} rotation={pose.tail}/>
 {@const legs=parts.legs}
 <!-- Foot contacts stay in world space. Every upper part inherits the waist
      pivot, preventing independent shoulder/head offsets from opening seams. -->
 <Sprite key={`treasure_${who}_legs`} x={legs.x} y={legs.y} width={legs.w} height={legs.h} anchor={{x:legs.ax,y:legs.ay}}/>
 <Container x={240} y={442} pivot={{x:240,y:442}} rotation={pose.body} scale={{x:1,y:1-pose.dy/420}}>
  {@const right=parts.arm_r}
  <Sprite key={`treasure_${who}_arm_r`} x={rightShoulder.x} y={rightShoulder.y} width={right.w} height={right.h} anchor={{x:right.ax,y:right.ay}} rotation={pose.right+pose.chest}/>
  {@const body=parts.body}
  <TreasureCastSkin assetKey={`treasure_${who}_body`} part={body} kind="body" bend={pose.chest} breathX={pose.breathX} breathY={pose.breathY} shoulderY={pose.shoulderY}/>
  {@const left=parts.arm_l}
  <Container x={leftShoulder.x} y={leftShoulder.y} rotation={pose.left+pose.chest}>
   {@const tool=parts.tool}
   <!-- Grip and handle share this transform, including interruptions. -->
   <Sprite key={`treasure_${who}_tool`} x={tool.x-left.x} y={tool.y-left.y} width={tool.w} height={tool.h} anchor={{x:tool.ax,y:tool.ay}}/>
   <Sprite key={`treasure_${who}_arm_l`} width={left.w} height={left.h} anchor={{x:left.ax,y:left.ay}}/>
   {#if who==='digger'}
    <DetectorPanelLight time={previewTime??time} scanAge={cue==='scan'?(previewTime??time-cueStarted):-1} {reduced} width={left.w} height={left.h} anchorX={left.ax} anchorY={left.ay}/>
   {/if}
  </Container>
  {@const head=parts.head}
  <!-- Neck follows the chest deformation; a small counter-rotation keeps the
       eyes steady while shoulder weight arrives after the initial look. -->
  <Container x={neck.x} y={neck.y} rotation={pose.head+pose.chest*.65}>
   <Sprite key={`treasure_${who}_${pose.blink>.65?'blink':'head'}`} width={head.w} height={head.h} anchor={{x:head.ax,y:head.ay}}/>
   {#if pose.blink<=.65}<TreasureGaze {who} dx={gaze.x} dy={gaze.y} width={head.w} height={head.h}/>{/if}
  </Container>
 </Container>
 </Container>
</Container>
