<script lang="ts">
 import {getContextSpine} from 'pixi-svelte';
 import {onMount,onDestroy} from 'svelte';
 import {getContext} from '../game/context';
 const {animationName}:{animationName:string}=$props();
 const spine=getContextSpine(),context=getContext();
 let blink=$state(false),zap=$state(false),blinkEnd:ReturnType<typeof setTimeout>|undefined,zapEnd:ReturnType<typeof setTimeout>|undefined;
 context.eventEmitter.subscribeOnMount({fgWheelImpact:({value})=>{if(value>=12){zap=true;clearTimeout(zapEnd);zapEnd=setTimeout(()=>zap=false,850);}}});
 $effect(()=>{
  spine.skeleton.setAttachment('head',zap?'head_zap':['laugh','dance','cheer'].includes(animationName)?'head_laugh':blink?'head_blink':'head_idle');
  spine.skeleton.setAttachment('hair',zap?'hair_zap':'hair');
 });
 onMount(()=>{const timer=setInterval(()=>{if(animationName==='idle'){blink=true;clearTimeout(blinkEnd);blinkEnd=setTimeout(()=>blink=false,140);}},4700);return()=>clearInterval(timer);});
 onDestroy(()=>{clearTimeout(blinkEnd);clearTimeout(zapEnd);});
</script>
