<script lang="ts">
 import {onMount} from 'svelte';
 import {Container,Sprite} from 'pixi-svelte';
 import {LOGO_LETTERS} from '../game/logoLetters';
 const {width=480,x=0,y=0,base=true}:{width?:number;x?:number;y?:number;base?:boolean}=$props();
 let t=$state(0);
 const h=$derived(width*.375),clamp=(v:number)=>Math.max(0,Math.min(1,v));
 const back=(p:number)=>1+3*(p-1)**3+2*(p-1)**2;
 const pose=(i:number)=>{const k=clamp((t-i*45)/380),drop=1-back(k);const land=clamp((t-i*45-290)/170);const squash=land>0&&land<1?Math.sin(land*Math.PI)*.15:0;const age=t-830;const beat=age>=0&&age<240?Math.sin(age/80*Math.PI)*.035:Math.sin((t%6000)/80*Math.PI)*.035;const repeat=t>1500&&(t%6000)<240;return{dy:-h*1.2*drop,sy:1-squash,rotation:i>=6&&(age>=0&&age<240||repeat)?beat:0};};
 onMount(()=>{const born=performance.now();let raf=0;const tick=(now:number)=>{t=now-born;raf=requestAnimationFrame(tick);};raf=requestAnimationFrame(tick);return()=>cancelAnimationFrame(raf);});
</script>
<Container {x} {y}>
 {#if base}<Sprite key="gbLogoBaseV2" anchor={.5} {width} height={h}/>{/if}
 {#if t>830&&(t<1070||t%6000<240)}<Sprite key="gbLogoPanicLinesV2" anchor={.5} x={width*.29} y={-h*.23} width={width*.22} height={h*.25}/>{/if}
 {#each LOGO_LETTERS as letter,i}
  {@const p=pose(i)}
  <Container x={(letter.pivot[0]/1600-.5)*width} y={(letter.pivot[1]/600-.5)*h+p.dy} rotation={p.rotation} scale={{x:1,y:p.sy}}>
   <Sprite key={letter.key} anchor={{x:(letter.pivot[0]-letter.box[0])/(letter.box[2]-letter.box[0]),y:(letter.pivot[1]-letter.box[1])/(letter.box[3]-letter.box[1])}} width={width*(letter.box[2]-letter.box[0])/1600} height={h*(letter.box[3]-letter.box[1])/600}/>
  </Container>
 {/each}
</Container>
