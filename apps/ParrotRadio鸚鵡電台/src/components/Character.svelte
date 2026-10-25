<script lang="ts" module>
 export type EmitterEventCast={type:'castPlay';name:string;rate?:number;hold?:boolean};
</script>
<script lang="ts">
 import {onMount,onDestroy} from 'svelte';import {getContextParent} from 'pixi-svelte';import type {Texture,Ticker} from 'pixi.js';
 import {getContext} from '../game/context';import {createCharacterScene} from '../game/characterRigScene';import pageNames from '../game/characterRigPages.json';
 const context=getContext(),parent=getContextParent();let scene=$state.raw<ReturnType<typeof createCharacterScene>>();let ticker:Ticker|undefined,previous=0,disposed=false;
 const advance=()=>{const now=performance.now();if(previous)scene?.update((now-previous)/1000);previous=now;};
 $effect(()=>{const loaded=context.stateApp.loadedAssets as Record<string,Texture>|undefined,app=context.stateApp.pixiApplication;if(disposed||scene||!loaded||!app||!pageNames.every((_,i)=>loaded['castAtlas'+i]))return;scene=createCharacterScene(Object.fromEntries(pageNames.map((file,i)=>[file,loaded['castAtlas'+i]])));parent.parent.addChild(scene.root);ticker=app.ticker;ticker.add(advance);});
 $effect(()=>{if(!scene)return;const b=context.stateGameDerived.boardLayout(),portrait=context.stateLayoutDerived.layoutType()==='portrait';const scale=portrait?.25:.36;scene.setPortrait(portrait);scene.root.scale.set(scale);scene.root.position.set(portrait?b.x+b.width*.30:b.x+b.width*.72,portrait?b.y-b.height*b.scale*.5-60+1000*scale:b.y+b.height*.47);});
 $effect(()=>scene?.player.setFreegame(context.stateGame.gameType==='freegame'));
 
 context.eventEmitter.subscribeOnMount({castPlay:e=>{scene?.player.play(e.name,e.rate??1,e.hold??false);}});
 onMount(()=>{const media=matchMedia('(prefers-reduced-motion: reduce)');const apply=()=>scene?.player.setReducedMotion(media.matches);apply();media.addEventListener('change',apply);const resetClock=()=>previous=0;document.addEventListener('visibilitychange',resetClock);return()=>{media.removeEventListener('change',apply);document.removeEventListener('visibilitychange',resetClock);};});
 onDestroy(()=>{disposed=true;ticker?.remove(advance);scene?.destroy();scene=undefined;});
</script>
