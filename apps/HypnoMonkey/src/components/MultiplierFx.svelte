<script lang="ts">
 import { onMount,onDestroy } from 'svelte';
 import { getContextParent } from 'pixi-svelte';
 import type { Texture,Ticker } from 'pixi.js';
 import { getContext } from '../game/context';
 import { createMultiplierFxScene,type MultiplierFxController,type MultiplierFxState } from '../game/multiplierFxScene';
 type Props={snapshot:MultiplierFxState;controller?:MultiplierFxController};
 let {snapshot,controller=$bindable()}:Props=$props();
 const context=getContext(),parent=getContextParent();let scene=$state.raw<MultiplierFxController>();let ticker:Ticker|undefined,last=0,disposed=false,media:MediaQueryList|undefined;
 const tick=()=>{const now=performance.now();if(!last||document.hidden){last=now;return;}scene?.update((now-last)/1000);last=now;};
 $effect(()=>{const assets=context.stateApp.loadedAssets,app=context.stateApp.pixiApplication;if(disposed||scene||!app||!assets?.mgOrbGreen||!assets?.mgOrbPurple||!assets?.mgOrbGold)return;
  scene=createMultiplierFxScene({green:assets.mgOrbGreen as Texture,purple:assets.mgOrbPurple as Texture,gold:assets.mgOrbGold as Texture});scene.root.zIndex=-1;parent.parent.sortableChildren=true;parent.parent.addChild(scene.root);controller=scene;ticker=app.ticker;ticker.add(tick);if(media)scene.setReducedMotion(media.matches);
 });
 $effect(()=>scene?.setState(snapshot));
 onMount(()=>{media=matchMedia('(prefers-reduced-motion: reduce)');const preference=()=>scene?.setReducedMotion(media!.matches),visibility=()=>{last=0;if(document.hidden)scene?.clearTransient();};preference();media.addEventListener('change',preference);document.addEventListener('visibilitychange',visibility);return()=>{media?.removeEventListener('change',preference);document.removeEventListener('visibilitychange',visibility);};});
 onDestroy(()=>{disposed=true;ticker?.remove(tick);scene?.destroy();controller=undefined;scene=undefined;});
</script>
