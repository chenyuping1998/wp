<script lang="ts">
 import {Sprite,Container,Graphics} from 'pixi-svelte';
 import {getContext} from '../game/context';
 import {stateBloodMoon as bm} from '../game/bloodmoon.svelte';
 import {backgroundMix,wildIntensity,clamp01} from '../game/presentation';
 import BloodMoonAtlasSprite from './BloodMoonAtlasSprite.svelte';
 import BloodMoonDust from './BloodMoonDust.svelte';
 const {time,reduced=false}:{time:number;reduced?:boolean}=$props();
 const context=getContext();
 const size=$derived(context.stateLayoutDerived.canvasSizes());
 const mix=$derived(backgroundMix(bm.phase,bm.inFree,bm.clock));
 const attack=$derived(wildIntensity(bm.reveal,bm.phase,bm.clock,bm.turbo));
 const t=$derived(reduced?0:time);
 const cover=$derived(Math.max(size.width/1280,size.height/720));
 const tint=$derived(0xff0000+(Math.round(255-110*attack)<<8)+Math.round(255-95*attack));
</script>
<Container>
 <Sprite key="bmScene_base" anchor={.5} x={size.width/2} y={size.height/2} width={1280*cover} height={720*cover} roundPixels {tint}/>
 <Sprite key="bmScene_free" anchor={.5} x={size.width/2} y={size.height/2} width={1280*cover} height={720*cover} roundPixels alpha={mix} {tint}/>
 <Sprite key="bmScene_freeBackgroundGlow" anchor={.5} x={size.width/2} y={size.height/2} width={1280*cover} height={720*cover} alpha={mix*(.045+.018*Math.sin(t*.7))} blendMode="add"/>
 <Graphics draw={g=>g.rect(0,0,size.width,size.height).fill({color:0x020a15,alpha:.055})}/>
 <Sprite key="bmScene_moon" anchor={.5} x={size.width*.15} y={size.height*.17+Math.sin(t*.15)*4} width={size.height*.24} height={size.height*.24} alpha={(1-mix)*(.54+.05*Math.sin(t*.6))} blendMode="add"/>
 <Sprite key="bmScene_bloodMoon" anchor={.5} x={size.width*.15} y={size.height*.17+Math.sin(t*.15)*4} width={size.height*.27} height={size.height*.27} alpha={mix*(.6+.08*Math.sin(t*.7))} blendMode="add"/>
 {#each [0,1] as i}
  <Sprite key="bmEnvironment_mist" anchor={.5} x={size.width*(.15+i*.5)+Math.sin(t*(.045+i*.015)+i*2)*size.width*.15} y={size.height*(.64+i*.14)+Math.sin(t*.08+i)*16} width={size.width*.82} height={size.height*.26} alpha={.018+mix*.008+attack*.012} tint={mix>.5?0xa4516e:0x84adb8}/>
 {/each}
 <BloodMoonDust time={t} width={size.width} height={size.height} {mix}/>
 {#if !reduced}
  {#each [0,1,2,3] as i}
   {@const flight=((t+i*.7)%24)/6}
   {#if flight<1}
    <BloodMoonAtlasSprite asset={mix>.5?'bmEnvironment_batFree':'bmEnvironment_batBase'} frame={t*16+i*2} x={(-.12+flight*1.25)*size.width} y={size.height*(.18+i*.04)+Math.sin(flight*5+i)*22} width={36+i*7} height={30+i*6} alpha={.28*Math.sin(clamp01(flight)*Math.PI)} rotation={-.08}/>
   {/if}
  {/each}
 {/if}
 <!-- A restrained red veil makes WILD build-up visible beyond the reels. -->
 <Graphics alpha={attack*.045} draw={g=>g.rect(0,0,size.width,size.height).fill(0x6e0625)}/>
</Container>
