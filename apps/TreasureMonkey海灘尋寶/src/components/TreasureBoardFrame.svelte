<script lang="ts">
 import { onDestroy } from 'svelte';
 import { Sprite,Container } from 'pixi-svelte';
 import { getContext } from '../game/context';
 const context=getContext();const layout=$derived(context.stateGameDerived.boardLayout());
 let offset=$state(0),raf=0;
 const impact=(strength=.12)=>{cancelAnimationFrame(raf);const start=performance.now();const tick=(now:number)=>{const u=Math.min(1,(now-start)/260);offset=Math.sin(u*Math.PI*2)*(1-u)**2*strength*8;if(u<1)raf=requestAnimationFrame(tick);};raf=requestAnimationFrame(tick);};
 context.eventEmitter.subscribeOnMount({boardFrameImpact:({strength})=>impact(strength),boardFrameGlowShow:()=>impact(.3),boardFrameGlowHide:()=>{}});
 onDestroy(()=>cancelAnimationFrame(raf));
</script>
<Container x={layout.x} y={layout.y+offset}>
 <Sprite key="hmFrameBg" anchor={.5} width={layout.width*layout.scale*1280/1110} height={layout.height*layout.scale*1280/1110}/>
 <Sprite key="hmFrameEdge" anchor={.5} width={layout.width*layout.scale*1280/1110} height={layout.height*layout.scale*1280/1110}/>
</Container>
