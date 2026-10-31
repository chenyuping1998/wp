<script lang="ts">
 import {Container,Graphics} from 'pixi-svelte';
 import type {Graphics as PixiGraphics} from 'pixi.js';
 let {who,dx=0,dy=0,width,height,anchorX=.5,anchorY=1}:{who:'digger'|'lifeguard';dx?:number;dy?:number;width:number;height:number;anchorX?:number;anchorY?:number}=$props();
 const paths=(g:PixiGraphics)=>{
  g.clear();
  // Trace only the painted eye whites. The original brows, lashes and eyelid
  // contours remain above/beside these interior paths.
  if(who==='digger'){
   g.moveTo(108,178).bezierCurveTo(107,164,111,149,122,148).bezierCurveTo(134,147,140,161,136,179).lineTo(129,182).lineTo(113,181).closePath();
   g.moveTo(178,185).bezierCurveTo(174,169,181,152,194,151).bezierCurveTo(211,149,223,166,218,183).bezierCurveTo(213,197,191,201,180,190).closePath();
  }else{
   g.moveTo(208,205).bezierCurveTo(199,194,205,172,217,168).bezierCurveTo(232,160,246,168,248,184).bezierCurveTo(251,204,240,214,224,213).closePath();
   g.moveTo(287,186).bezierCurveTo(282,177,286,156,294,153).bezierCurveTo(305,148,314,158,313,173).bezierCurveTo(314,190,300,196,290,190).closePath();
  }
  g.fill(0xffffff);
 };
 const eyes=(g:PixiGraphics)=>{
  g.clear();
  const localX=who==='lifeguard'?-dx:dx;
  const pupils=who==='digger'?[[117,170,8.4,13.7,3],[188,175,10.3,17.4,4.3]]:[[239,188,10.5,17.7,4.3],[303,173,8.5,15.3,2.5]];
  for(const [x,y,rx,ry,travel] of pupils){
   const px=x+localX*travel,py=y+dy*3.5;
   g.ellipse(px,py,rx,ry).fill(0x241b13);
   g.ellipse(px-.7,py+1,rx*.62,ry*.75).fill(0x090c0b);
   g.ellipse(px+2,py-ry*.47,rx*.29,ry*.23).fill(0xfffdf5);
   g.circle(px-2,py+ry*.3,1.25).fill({color:0xffffff,alpha:.65});
  }
 };
</script>
<Container x={-width*anchorX} y={-height*anchorY} scale={{x:width/(who==='digger'?414:391),y:height/(who==='digger'?405:364)}}>
 <Container><Graphics isMask draw={paths}/><Graphics draw={paths}/><Graphics draw={eyes}/></Container>
</Container>
