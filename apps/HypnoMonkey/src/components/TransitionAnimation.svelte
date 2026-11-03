<script lang="ts">
 import {onMount} from 'svelte';
 import {Container,Graphics,Sprite} from 'pixi-svelte';
 import {getContext} from '../game/context';
 type Props={oncomplete:()=>void;oncover?:()=>void;onreveal?:()=>void};
 const props:Props=$props(),context=getContext();
 let elapsed=$state(0);
 // ATG 戰神賽特 FG entry (research ATG-Seth-Capture §6-1), 1.5 s: the curtain
 // sweeps shut by 0.45 s, a white flash peaks at 0.9 s (the scene swaps under
 // it), then the curtain opens on the free game by 1.5 s.
 const DONE=1500;
 const cover=$derived(elapsed<450?1-(1-elapsed/450)**3:elapsed<1000?1:(1-Math.min(1,(elapsed-1000)/500))**3);
 const white=$derived(elapsed<800||elapsed>1050?0:Math.sin(Math.PI*(elapsed-800)/250));
 const sizes=$derived(context.stateLayoutDerived.canvasSizes());
 onMount(()=>{
  let raf=0,last=performance.now(),done=false,covered=false,revealed=false;
  const markCover=()=>{if(!covered){covered=true;props.oncover?.();}};
  const markReveal=()=>{if(!revealed){revealed=true;props.onreveal?.();}};
  const finish=()=>{if(done)return;done=true;markCover();markReveal();props.oncomplete();};
  context.eventEmitter.broadcast({type:'soundTransitionBlast'});
  const tick=(now:number)=>{
   elapsed=Math.min(DONE,elapsed+Math.min(100,Math.max(0,now-last)));last=now;
   if(elapsed>=450)markCover();if(elapsed>=900)markReveal();
   if(elapsed>=DONE)finish();else raf=requestAnimationFrame(tick);
  };
  raf=requestAnimationFrame(tick);
  const visibility=()=>{last=performance.now();if(document.hidden)finish();};
  document.addEventListener('visibilitychange',visibility);
  return()=>{cancelAnimationFrame(raf);document.removeEventListener('visibilitychange',visibility);};
 });
</script>
<Container>
 <Sprite key="mgTransitionCurtain" x={-(sizes.width/2+8)*(1-cover)} y={-2} width={sizes.width/2+8} height={sizes.height+4}/>
 <Sprite key="mgTransitionCurtain" x={sizes.width-(sizes.width/2+8)*cover} y={-2} width={sizes.width/2+8} height={sizes.height+4}/>
 <Graphics draw={(g)=>{g.clear();if(white>0)g.rect(-4,-4,sizes.width+8,sizes.height+8).fill({color:0xfff8e8,alpha:white});}}/>
</Container>
