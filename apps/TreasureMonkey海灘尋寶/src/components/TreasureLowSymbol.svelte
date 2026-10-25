<script lang="ts">
 import {Container,Graphics} from 'pixi-svelte';
 import type {Graphics as PixiGraphics} from 'pixi.js';
 import TreasureAttachment from './TreasureAttachment.svelte';
 import TreasureLetter from './TreasureLetter.svelte';
 import {letterPose} from '../game/treasureObjectMotion';
 let {name,width,height,time=0,mode='none',reduced=false,tint,alpha=1,debugBones=false}:{name:string;width:number;height:number;time?:number;mode?:'none'|'win'|'land';reduced?:boolean;tint?:number;alpha?:number;debugBones?:boolean}=$props();
 const pose=$derived(letterPose(name,time,mode,reduced));
 const letter=$derived(({L1:'A',L2:'K',L3:'Q',L4:'J'} as Record<string,'A'|'K'|'Q'|'J'>)[name]??'A');
 const frame=$derived(('low'+name) as 'lowL1'|'lowL2'|'lowL3'|'lowL4');
 const pivot=(g:PixiGraphics)=>{g.clear();const x=pose.dx*width,y=height*.055+pose.dy*height;g.moveTo(0,height*.055).lineTo(x,y).stroke({color:0x13b9bf,width:1.2});g.circle(x,y,3).fill(0xffefb2).stroke({color:0x147b87,width:1});};
</script>
<TreasureAttachment frameKey={frame} width={width*.80} height={height*.79} {tint} {alpha}/>
<Container x={pose.dx*width} y={height*.055+pose.dy*height} rotation={pose.angle} scale={{x:pose.sx,y:pose.sy}} {alpha}>
 <TreasureLetter {letter} height={height*.45} {tint}/>
</Container>
{#if debugBones}<Graphics draw={pivot}/>{/if}
