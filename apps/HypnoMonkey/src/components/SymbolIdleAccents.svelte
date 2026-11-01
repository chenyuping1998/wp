<script lang="ts">
 import {Graphics} from 'pixi.js';
 import {getContextParent} from 'pixi-svelte';
 import {onDestroy} from 'svelte';
 import type {IdleFrame} from '../game/symbolIdleMotion';
 const props=$props<{name:string;frame:IdleFrame;width:number;height:number}>();
 const parent=getContextParent(),ink=new Graphics();ink.eventMode='none';parent.addToParent(ink);
 $effect(()=>{
  const f=props.frame,w=props.width,h=props.height;ink.clear();
  if(props.name==='H3'){
   // Two ink motes orbit only within the crystal's painted circular face.
   for(let i=0;i<2;i++){const t=f.loop+i*Math.PI;ink.circle(Math.cos(t)*w*.14,-h*.06+Math.sin(t)*h*.12,w*(.012+.01*f.act)).fill({color:0xf2e3bd,alpha:.35+.5*f.act});}
  }else if(props.name==='S'&&f.act>.01){
   ink.arc(0,-h*.055,w*.19,f.u*Math.PI*2,f.u*Math.PI*2+Math.PI*.8).stroke({width:Math.max(1,w*.014),color:0xf2e3bd,alpha:f.act*.8});
  }else if(props.name==='H4'&&f.act>.2){
   for(const sign of [-1,1])ink.arc(sign*w*.24,h*.12,w*.10,sign<0?2.1:-1.05,sign<0?4.2:1.05).stroke({width:Math.max(1,w*.014),color:0x2b1b16,alpha:f.act*.65});
  }
 });
 onDestroy(()=>ink.destroy());
</script>
