<script lang="ts">
 import {Container,Graphics} from 'pixi-svelte';
 import type {Graphics as PixiGraphics} from 'pixi.js';
 import {projectSymbolPoints} from '../game/treasureSymbolRig';
 import {keyShine} from '../game/treasureObjectMotion';
 let {width,height,time,reduced=false}:{width:number;height:number;time:number;reduced?:boolean}=$props();
 const strength=$derived(keyShine(time,true,reduced));
 const ring=Array.from({length:33},(_,i)=>[.75+Math.cos(i/32*Math.PI*2)*.133,.525+Math.sin(i/32*Math.PI*2)*.143] as const);
 const shaft=[[.80,.635],[.84,.62],[.957,.825],[.92,.855]] as const;
 const flat=(points:readonly (readonly [number,number])[])=>projectSymbolPoints('H5',points,time,reduced).flatMap(([x,y])=>[(x-.5)*width,(y-.5)*height]);
 const mask=(g:PixiGraphics)=>{g.clear();g.poly(flat(ring)).stroke({color:0xffffff,width:width*.031});g.poly(flat(shaft)).fill(0xffffff);};
 const reflection=(g:PixiGraphics)=>{
  g.clear();const phase=time<500?(time-180)/260:(time-585)/240,x=.48+phase*.55;
  g.poly(flat([[x-.025,.26],[x+.018,.26],[x+.18,.94],[x+.13,.94]])).fill({color:0xfffdf0,alpha:strength*.8});
 };
 const glint=(g:PixiGraphics)=>{
  g.clear();const [p]=projectSymbolPoints('H5',[[.80,.40]],time,reduced),x=(p[0]-.5)*width,y=(p[1]-.5)*height,r=width*.032*strength;
  g.moveTo(x-r,y).lineTo(x+r,y).moveTo(x,y-r).lineTo(x,y+r).stroke({color:0xfff9d9,width:1,alpha:strength*.9});
  g.circle(x,y,width*.012*strength).fill({color:0xfffcec,alpha:strength*.75});
 };
</script>
{#if strength>.001}<Container><Graphics isMask draw={mask}/><Graphics draw={reflection}/></Container><Graphics draw={glint}/>{/if}
