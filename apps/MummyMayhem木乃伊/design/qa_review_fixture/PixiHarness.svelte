<script lang="ts">
 import {setContextApp,createContextParent,Container}from'pixi-svelte';
 import FgArcWheel from'../../src/components/FgArcWheel.svelte';
 import BannerMesh from'../../src/components/BannerMesh.svelte';
 import GoldText from'../../src/components/GoldText.svelte';
 import {amountY,amountSize}from'virtual:mummy-win-layout';
 const {app,assets,view}:{app:any;assets:any;view:string}=$props();
 setContextApp({stateApp:{pixiApplication:app,loadedAssets:assets}}as any);createContextParent(app.stage);
</script>
{#if view==='wheel'}<FgArcWheel/>{:else}
 <Container x={450} y={320}>
  <BannerMesh key="gbWinBannerBig" width={800} height={448} blink={0} landed={false}/>
  <GoldText y={448*amountY} maxWidth={800*.68} text="1,234.56" fontSize={448*amountSize}/>
 </Container>
{/if}
