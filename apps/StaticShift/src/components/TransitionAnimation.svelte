<script lang="ts">
 import {onMount} from 'svelte';
 import {Container,Graphics,Text} from 'pixi-svelte';
 import {getContext} from '../game/context';
 import {GAME_FONT} from '../game/fonts';
 import {gameText} from '../game/i18nText';
 type Props={oncomplete:()=>void;oncover?:()=>void};const props:Props=$props();const c=getContext();
 const size=$derived(c.stateLayoutDerived.canvasSizes());let t=$state(0);let covered=false;
 const amount=$derived(t<420?t/420:t<760?1:Math.max(0,1-(t-760)/420));
 onMount(()=>{let id=0,last=performance.now();const tick=(now:number)=>{t+=Math.min(100,now-last);last=now;if(t>=450&&!covered){covered=true;props.oncover?.();}if(t<1180)id=requestAnimationFrame(tick);else props.oncomplete();};c.eventEmitter.broadcast({type:'mascotThrow'});c.eventEmitter.broadcast({type:'soundShutterDown'});id=requestAnimationFrame(tick);return()=>cancelAnimationFrame(id);});

const drawWorld=(g: import('pixi.js').Graphics)=>{g.clear();const bands=24,h=size.height/bands;for(let i=0;i<bands;i++){const d=i%3*.025;const a=Math.max(0,Math.min(1,(amount-d)/.94));const w=size.width*a;g.rect(i%2?size.width-w:0,i*h,w,h+1).fill(i%4===0?0x535e88:0x22252e);if(a>0)g.rect(i%2?size.width-w:w-5,i*h,5,h).fill(0xb8d080);}};
</script>
<!-- Broadcast interference wipes horizontally, solid before scene/cast swap. -->
<Container>
 <Graphics draw={drawWorld} />
 {#if amount>.98}<Text anchor={0.5} x={size.width/2} y={size.height/2} text={gameText('ssTuningIn')} style={{fontFamily:GAME_FONT,fontSize:Math.min(60,size.width*.08),fill:0xb8d080,letterSpacing:7}}/>{/if}
</Container>
