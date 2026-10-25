<script lang="ts">
 import {Container,Graphics} from 'pixi-svelte';
 import TreasureAttachment from './TreasureAttachment.svelte';
 import {scrollPose} from '../game/treasureObjectMotion';
 let {width,height,time,active,reduced=false,tint,alpha=1,debugBones=false}:{width:number;height:number;time:number;active:boolean;reduced?:boolean;tint?:number;alpha?:number;debugBones?:boolean}=$props();
 const pose=$derived(scrollPose(time,active,reduced));
 const span=$derived(width*.315*pose.open);
</script>
<Container rotation={-.12} {alpha}>
 <Container>
  <Graphics isMask draw={g=>{g.clear();g.rect(-span,-height*.36,span*2,height*.72).fill(0xffffff);}}/>
  <TreasureAttachment frameKey="mapPaper" width={width*.69} height={height*.69} {tint}/>
  <Graphics draw={g=>{g.clear();const shade=(1-pose.open)*.24;g.rect(-span,-height*.34,width*.035,height*.68).fill({color:0x703a13,alpha:shade});g.rect(span-width*.035,-height*.34,width*.035,height*.68).fill({color:0x703a13,alpha:shade});}}/>
 </Container>
 <Container x={-span} rotation={pose.roll}><TreasureAttachment frameKey="mapRollLeft" width={width*.16} height={height*.78} {tint}/></Container>
 <Container x={span} rotation={-pose.roll}><TreasureAttachment frameKey="mapRollRight" width={width*.16} height={height*.78} {tint}/></Container>
 {#if debugBones}<Graphics draw={g=>{g.clear();g.moveTo(-span,0).lineTo(span,0).stroke({color:0x13b9bf,width:1});for(const x of [-span,span])g.circle(x,0,3).fill(0xffefb2).stroke({color:0x147b87,width:1});}}/>{/if}
</Container>
