<script lang="ts">
 import {App,Container,Text,Graphics} from 'pixi-svelte';
 import {setContext} from '../../game/context';
 import Symbol from '../../components/Symbol.svelte';
 import {onMount} from 'svelte';
 setContext();
 const names=['H1','H2','H3','H4','L1','L2','L3','L4','L5','W','S','P'];
 let win=$state(false),rev=$state(0),focus=$state('ALL'),light=$state(false),frame=$state(-1);
 let width=$state(319);onMount(()=>{width=window.innerWidth;const f=()=>width=window.innerWidth;window.addEventListener('resize',f);return()=>window.removeEventListener('resize',f);});
 const play=()=>{win=false;rev++;requestAnimationFrame(()=>{win=true;setTimeout(()=>win=false,1450);});};
</script>
<div class="controls"><button onclick={play}>WIN</button><button onclick={()=>light=!light}>Light / Dark</button><select bind:value={focus}><option>ALL</option>{#each names as n}<option>{n}</option>{/each}</select></div>
<App>
 <Graphics draw={g=>g.clear().rect(0,0,2000,2000).fill(light?0xe5e2d6:0x22252e)}/>
 <Container x={width/2} y={100} scale={focus==='ALL'?Math.min(1,(width-20)/470):1.65}>
 {#each (focus==='ALL'?names:[focus]) as name,i}
  <Container x={focus==='ALL'?(i%3-1)*150:0} y={focus==='ALL'?Math.floor(i/3)*150:130}>
   <Text text={name} anchor={.5} y={-65} style={{fontFamily:'sans-serif',fontSize:14,fill:light?0x22252e:0xe5e2d6}}/>
   {#key `${name}-${rev}-${win}`}
   <Symbol rawSymbol={{name}} state={win?'win':'static'} reelIndex={i%5} row={Math.floor(i/5)} />
   {/key}
  </Container>
 {/each}
 </Container>
</App>
<style>.controls{position:fixed;z-index:100;top:8px;left:8px;display:flex;gap:6px}button,select{font:14px sans-serif;padding:8px;color:#e5e2d6;background:#363741;border:1px solid #6b718e} :global(body){margin:0}</style>
