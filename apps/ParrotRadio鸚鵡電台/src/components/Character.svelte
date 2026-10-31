<script lang="ts" module>
 export type EmitterEventCast={type:'castPlay';name:string;rate?:number;hold?:boolean}|{type:'castInspect';name:string;time:number};
</script>
<script lang="ts">
 import {stateReplay,stateModal} from 'state-shared';
 import {onMount,onDestroy} from 'svelte';import {getContextParent} from 'pixi-svelte';import type {Texture,Ticker} from 'pixi.js';
 import {getContext} from '../game/context';import {createCharacterScene} from '../game/characterRigScene';import pageNames from '../game/characterRigPages.json';
 const context=getContext(),parent=getContextParent();let scene=$state.raw<ReturnType<typeof createCharacterScene>>();let ticker:Ticker|undefined,previous=0,disposed=false;
 const advance=()=>{const now=performance.now();if(previous)scene?.update((now-previous)/1000);previous=now;};
 $effect(()=>{const loaded=context.stateApp.loadedAssets as Record<string,Texture>|undefined,app=context.stateApp.pixiApplication;if(disposed||scene||!loaded||!app||!pageNames.every((_,i)=>loaded['castAtlas'+i]))return;scene=createCharacterScene(Object.fromEntries(pageNames.map((file,i)=>[file,loaded['castAtlas'+i]])));parent.parent.addChildAt(scene.root,0);ticker=app.ticker;ticker.add(advance);});
 $effect(()=>{if(!scene)return;const b=context.stateGameDerived.boardLayout();const portrait=context.stateLayoutDerived.layoutType()==='portrait';const scale=portrait?.25:.36;scene.root.scale.set(scale);scene.root.position.set(portrait?b.x+b.width*.43:b.x+b.width*.72,portrait?b.y-b.height*b.scale*.5-20:b.y+b.height*.47);});
 $effect(()=>scene?.player.setFidgetsEnabled(context.stateXstateDerived.isIdle()&&!stateReplay.enabled));
 $effect(()=>scene?.player.setReducedMotion(matchMedia('(prefers-reduced-motion: reduce)').matches));
 $effect(()=>scene?.player.setPaused(stateModal.modal!==null));
 $effect(()=>scene?.player.setFreegame(context.stateGame.gameType==='freegame'));
 
 context.eventEmitter.subscribeOnMount({
  castPlay:e=>{if(!scene)return;scene.player.state.timeScale=1;scene.player.setPaused(stateModal.modal!==null);scene.player.play(e.name,e.rate??1,e.hold??false);},
  castInspect:e=>{
   if(!import.meta.env.DEV||!scene)return;
   const player=scene.player;player.setPaused(false);player.state.timeScale=1;player.state.clearTracks();player.skeleton.setupPose();player.play(e.name);player.state.setAnimation(1,'breath',true);
   for(let remaining=e.time;remaining>0;remaining-=1/60)player.update(Math.min(1/60,remaining));
   scene.update(1/60);player.state.timeScale=0;
  }
 });
 onMount(()=>{const media=matchMedia('(prefers-reduced-motion: reduce)');const apply=()=>scene?.player.setReducedMotion(media.matches);apply();media.addEventListener('change',apply);const resetClock=()=>previous=0;document.addEventListener('visibilitychange',resetClock);return()=>{media.removeEventListener('change',apply);document.removeEventListener('visibilitychange',resetClock);};});
 onDestroy(()=>{disposed=true;ticker?.remove(advance);scene?.destroy();scene=undefined;});
</script>
