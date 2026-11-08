<script lang="ts">
 import {onMount} from 'svelte';
 import {getContextParent} from 'pixi-svelte';
 import {getContext} from '../game/context';
 import {WinSpineRenderer,markWinSceneReady,type WinRigLayer} from '../game/winSpineRenderer';
 const {active,layers}:{active:boolean;layers:WinRigLayer[]}=$props();
 const parent=getContextParent(),context=getContext();let renderer=$state<WinSpineRenderer|null>(null);
 onMount(()=>{
  let disposed=false;
  void WinSpineRenderer.create(path=>`${import.meta.env.BASE_URL}${path.replace(/^\//,'')}`,texture=>context.stateApp.pixiApplication?.renderer.texture.initSource(texture.source)).then(value=>{
   if(disposed){value.destroy();return;}
   parent.parent.addChildAt(value.view,0);renderer=value;markWinSceneReady(true);
  }).catch(error=>{markWinSceneReady(false);console.warn('Win scene unavailable; keeping the title and score presentation.',error);});
  return()=>{disposed=true;renderer?.destroy();};
 });
 $effect(()=>{renderer?.draw(active?layers:[]);});
</script>
