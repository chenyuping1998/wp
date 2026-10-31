<script lang="ts">
 import {stateModal} from 'state-shared';
 import {onMount,onDestroy} from 'svelte';
 import {getContextParent} from 'pixi-svelte';
 import type {Texture,Ticker} from 'pixi.js';
 import {getContext} from '../game/context';
 import {createBackgroundScene} from '../game/backgroundScene';
 const context=getContext(),parent=getContextParent();
 let scene=$state.raw<ReturnType<typeof createBackgroundScene>>(),ticker:Ticker|undefined,previous=0,disposed=false;
 let reduced=$state(false),focus=$state<string[]>([]);
 const pause=(key:string)=>{if(!focus.includes(key))focus=[...focus,key];};
 const resume=(key:string)=>focus=focus.filter(v=>v!==key);
 const advance=()=>{const now=performance.now();if(previous&&(!document.hidden||(import.meta.env.DEV&&new URLSearchParams(location.search).has('headless'))))scene?.update((now-previous)/1000);previous=now;};
 $effect(()=>{const loaded=context.stateApp.loadedAssets as Record<string,Texture>|undefined,app=context.stateApp.pixiApplication;if(disposed||scene||!app||!loaded?.mgBgBase||!loaded?.mgBgFree)return;scene=createBackgroundScene(loaded.mgBgBase,loaded.mgBgFree);if(import.meta.env.DEV)(window as unknown as {parrotBackground:typeof scene}).parrotBackground=scene;parent.parent.addChildAt(scene.root,0);ticker=app.ticker;ticker.add(advance);});
 $effect(()=>{const size=context.stateLayoutDerived.canvasSizes();scene?.setLayout(size.width,size.height);});
 $effect(()=>scene?.setState(context.stateGame.gameType==='freegame',context.stateGame.volume,focus.length>0||stateModal.modal!==null,reduced));
 context.eventEmitter.subscribeOnMount({winShow:()=>pause('win'),winHide:()=>resume('win'),freeSpinIntroShow:()=>pause('intro'),freeSpinIntroHide:()=>resume('intro'),freeSpinOutroShow:()=>pause('outro'),freeSpinOutroHide:()=>resume('outro'),scatterWinsShow:()=>pause('symbols'),scatterWinsHide:()=>resume('symbols')});
 onMount(()=>{const media=matchMedia('(prefers-reduced-motion: reduce)');const apply=()=>reduced=media.matches;apply();media.addEventListener('change',apply);const reset=()=>previous=0;document.addEventListener('visibilitychange',reset);return()=>{media.removeEventListener('change',apply);document.removeEventListener('visibilitychange',reset);};});
 onDestroy(()=>{disposed=true;ticker?.remove(advance);scene?.destroy();scene=undefined;});
</script>
