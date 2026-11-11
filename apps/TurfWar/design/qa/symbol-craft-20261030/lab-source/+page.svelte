<script lang="ts">
 import {App,Container,Text,Graphics} from 'pixi-svelte';
 import Symbol from '../../components/Symbol.svelte';
 import {onMount} from 'svelte';
 const names=['H1','H2','H3','H4','H5','SW','L1','L2','L3','L4','W','S'];
 let win=$state(false),rev=$state(0),focus=$state('ALL'),light=$state(false),width=$state(1280);
 onMount(()=>{width=window.innerWidth;const f=()=>width=window.innerWidth;window.addEventListener('resize',f);return()=>window.removeEventListener('resize',f);});
 const play=()=>{win=false;rev++;requestAnimationFrame(()=>win=true);};
</script>
<div class="controls"><button onclick={play}>WIN</button><button onclick={()=>light=!light}>Light / Dark</button><select bind:value={focus}><option>ALL</option>{#each names as n}<option>{n}</option>{/each}</select></div>
<App>
 <Graphics draw={g=>g.clear().rect(0,0,2500,2500).fill(light?0xf7f5f0:0x222222)}/>
 <Container x={width/2} y={125} scale={focus==='ALL'?Math.min(1.05,(width-24)/650):2.1}>
 {#each (focus==='ALL'?names:[focus]) as name,i}
  <Container x={focus==='ALL'?(i%4-1.5)*160:0} y={focus==='ALL'?Math.floor(i/4)*165:70}>
   <Text text={name} anchor={.5} y={-70} style={{fontFamily:'sans-serif',fontSize:13,fill:light?0x222222:0xf7f5f0}}/>
   {#key `${name}-${rev}-${win}`}
   <Symbol rawSymbol={{name}} state={win?'win':'static'} cell={{reel:i%5,row:Math.floor(i/5)+1}} oncomplete={()=>{if(win)setTimeout(()=>win=false,0);}}/>
   {/key}
  </Container>
 {/each}
 </Container>
</App>
<style>.controls{position:fixed;z-index:100;top:8px;left:8px;display:flex;gap:6px}button,select{font:14px sans-serif;padding:8px;color:#f7f5f0;background:#363741;border:1px solid #6b718e}:global(body){margin:0}</style>
