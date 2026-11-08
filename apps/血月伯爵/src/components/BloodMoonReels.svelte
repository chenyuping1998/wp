<script lang="ts">
 import {onMount,untrack} from 'svelte';
 import {getContextParent} from 'pixi-svelte';
 import {Texture} from 'pixi.js';
 import {getContext} from '../game/context';
 import {ReelView,type ReelPlan} from '../game/reelView';
 import type {LineWin} from '../game/bloodmoonTypes';
 import manifest from '../game/bloodmoonAssets.json';
 const {plan,clock,spinning,line,pop}:{plan:ReelPlan;clock:number;spinning:boolean;line:LineWin|null;pop:number}=$props();
 const parent=getContextParent(),context=getContext(),reels=new ReelView();
 onMount(()=>{parent.parent.addChild(reels.view);return()=>reels.destroy();});
 $effect(()=>{
  const assets=context.stateApp.loadedAssets;
  reels.setTextures(Object.keys(manifest.symbols).map(i=>assets?.[`bmSymbol_${i}`] as Texture??Texture.EMPTY));
  untrack(()=>reels.draw(clock,spinning,line,pop));
 });
 $effect(()=>{const next=plan;untrack(()=>reels.configure(next));});
 $effect(()=>{plan;reels.draw(clock,spinning,line,pop);});
</script>
