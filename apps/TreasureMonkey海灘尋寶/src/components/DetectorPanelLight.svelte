<script lang="ts">
 import {Container,Graphics} from 'pixi-svelte';
 import type {Graphics as PixiGraphics} from 'pixi.js';
 let {time=0,scanAge=-1,reduced=false,width,height,anchorX,anchorY}:{time?:number;scanAge?:number;reduced?:boolean;width:number;height:number;anchorX:number;anchorY:number}=$props();
 // Coordinates belong to the painted 336 × 359 left-arm sprite. Sharing its
 // local transform keeps the screen registered through every wrist pose.
 const point=(u:number,v:number)=>({x:268+30*u-14*v-4*u*v,y:203+2*u+28*v});
 const draw=$derived.by(()=>{
  const envelope=scanAge<0?0:Math.min(1,scanAge/180,Math.max(0,(1960-scanAge)/300));
  const pulse=reduced?0:(.5+.5*Math.sin(time*Math.PI*2/1600))**3;
  const scanPulse=reduced?0:(.5+.5*Math.sin(time*Math.PI*2/540))**2;
  const light=reduced?.56:.24+.28*pulse+.38*envelope*scanPulse;
  const sweep=reduced?.48:((time%1200)+1200)%1200/1200;
  return (g:PixiGraphics)=>{
   g.clear();
   const polygon=[point(0,0),point(1,0),point(1,1),point(0,1)];
   g.poly(polygon).fill({color:0x43e8d5,alpha:light}).stroke({color:0xa5fff0,width:1.2,alpha:.2+light*.35});
   // A narrow spill on the inner bezel preserves the hand and painted casing.
   g.poly(polygon).stroke({color:0x66ffe3,width:5,alpha:light*.09});
   for(let i=0;i<4;i++){
    const u=.16+i*.2,bar=.14+(i%3)*.13+envelope*.12;
    const a=point(u,.76),b=point(u,.76-bar);
    g.moveTo(a.x,a.y).lineTo(b.x,b.y).stroke({color:0xd6fff1,width:2,alpha:.32+light*.58});
   }
   const a=point(.08,.12+sweep*.72),b=point(.92,.12+sweep*.72);
   g.moveTo(a.x,a.y).lineTo(b.x,b.y).stroke({color:0xeaffee,width:1.5,alpha:reduced?.2:.22+envelope*.45});
   const lamp=point(.71,1.2),lampAlpha=reduced?.6:.3+.55*(envelope?scanPulse:pulse);
   g.circle(lamp.x,lamp.y,3.2).fill({color:0x75ffba,alpha:lampAlpha*.12});
   g.circle(lamp.x,lamp.y,1.35).fill({color:0xc5ffe0,alpha:lampAlpha});
  };
 });
</script>
<Container x={-anchorX*width} y={-anchorY*height} scale={{x:width/336,y:height/359}}>
 <Graphics {draw}/>
</Container>
