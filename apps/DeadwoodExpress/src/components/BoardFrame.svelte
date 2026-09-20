<script lang="ts" module>
export type EmitterEventBoardFrame = {type:'boardFrameGlowShow'}|{type:'boardFrameGlowHide'}|{type:'boardFrameImpact';strength?:number};
</script>
<script lang="ts">
import { Graphics } from 'pixi-svelte';
import { getContext } from '../game/context';
const c=getContext();let glow=$state(false);
c.eventEmitter.subscribeOnMount({boardFrameGlowShow:()=>{glow=true;},boardFrameGlowHide:()=>{glow=false;},boardFrameImpact:()=>{}});
const b=$derived(c.stateGameDerived.boardLayout());
</script>
<Graphics draw={g=>{
const w=b.width*b.scale,h=b.height*b.scale,x=b.x-w/2,y=b.y-h/2;
g.clear();g.roundRect(x-22,y-22,w+44,h+44,15).fill(0x142623).stroke({width:5,color:0x8e7244});
g.roundRect(x-10,y-10,w+20,h+20,7).fill(0x071714).stroke({width:2,color:glow?0x92e9cf:0xc4a46b});
for(let i=0;i<=4;i++){const yy=y+i*h/4;g.moveTo(x,yy).lineTo(x+w,yy).stroke({width:1,color:0x305448,alpha:.45});}
for(let i=0;i<=5;i++){const xx=x+i*w/5;g.moveTo(xx,y).lineTo(xx,y+h).stroke({width:1,color:0x305448,alpha:.45});}
for(const xx of [x-15,x+w+15])for(const yy of [y-15,y+h+15])g.circle(xx,yy,4).fill(0xd4b981);
}}/>
