<script lang="ts">
 import {onMount} from 'svelte';
 import {Container,Sprite} from 'pixi-svelte';
 import {getContext} from '../game/context';
 type Props={oncomplete:()=>void;oncover?:()=>void;onreveal?:()=>void};
 const props:Props=$props(),context=getContext();
 let elapsed=$state(0);
 const cover=$derived(elapsed<400?1-(1-elapsed/400)**3:elapsed<580?1:(1-Math.min(1,(elapsed-580)/420))**3);
 const sizes=$derived(context.stateLayoutDerived.canvasSizes());
 onMount(()=>{
  let raf=0,last=performance.now(),done=false,covered=false,revealed=false;
  const markCover=()=>{if(!covered){covered=true;props.oncover?.();}};
  const markReveal=()=>{if(!revealed){revealed=true;props.onreveal?.();}};
  const finish=()=>{if(done)return;done=true;markCover();markReveal();props.oncomplete();};
  context.eventEmitter.broadcast({type:'soundTransitionBlast'});
  const tick=(now:number)=>{
   elapsed=Math.min(1000,elapsed+Math.min(100,Math.max(0,now-last)));last=now;
   if(elapsed>=400)markCover();if(elapsed>=580)markReveal();
   if(elapsed>=1000)finish();else raf=requestAnimationFrame(tick);
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
</Container>
