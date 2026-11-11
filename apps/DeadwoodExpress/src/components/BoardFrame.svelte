<script lang="ts" module>
export type EmitterEventBoardFrame = {type:'boardFrameGlowShow'}|{type:'boardFrameGlowHide'}|{type:'boardFrameImpact';strength?:number};
</script>
<script lang="ts">
// The reel housing. Until 2026-09-30 this was drawn here as vector strokes
// (two rounded rects, 1px grid, four dots) — flat programmer art beside painted
// symbols, and the third review said "Low quality assets" twice. It is now a
// painted texture cut from the bonus plate's own brass
// (design/build_board_frame.py). HOUSING_PAD (24.5) in CastFigureMesh and
// MultiplierWheel is the texture's band depth, so those clamps still hold.
import { Graphics, Sprite } from 'pixi-svelte';
import { getContext } from '../game/context';
const c=getContext();let glow=$state(false);
c.eventEmitter.subscribeOnMount({boardFrameGlowShow:()=>{glow=true;},boardFrameGlowHide:()=>{glow=false;},boardFrameImpact:()=>{}});
const b=$derived(c.stateGameDerived.boardLayout());
const PAD=24.5;
const box=$derived.by(()=>{const w=b.width*b.scale;const h=b.height*b.scale;return {w,h,x:b.x-w/2,y:b.y-h/2};});
</script>
<Sprite key="dwBoardFrame" x={box.x-PAD} y={box.y-PAD} width={box.w+PAD*2} height={box.h+PAD*2}/>
<Graphics draw={g=>{
const {w,h,x,y}=box;
g.clear();
// faint cell seams, so the grid still reads on the painted well
for(let i=1;i<4;i++){const yy=y+i*h/4;g.moveTo(x+6,yy).lineTo(x+w-6,yy).stroke({width:1,color:0x3c6a5c,alpha:.3});}
for(let i=1;i<5;i++){const xx=x+i*w/5;g.moveTo(xx,y+6).lineTo(xx,y+h-6).stroke({width:1,color:0x3c6a5c,alpha:.3});}
// anticipation: the cyan lip lights up
if(glow){g.roundRect(x-4,y-4,w+8,h+8,8).stroke({width:3,color:0x92e9cf,alpha:.9});g.roundRect(x-7,y-7,w+14,h+14,10).stroke({width:6,color:0x5fd6c4,alpha:.25});}
}}/>
