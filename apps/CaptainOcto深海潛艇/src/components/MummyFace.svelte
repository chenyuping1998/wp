<script lang="ts">
 import {getContextSpine,SpineTrack} from 'pixi-svelte';
 import {onMount} from 'svelte';
 const {animationName}:{animationName:string}=$props();
 const spine=getContextSpine();let blink=$state(false),mouthOpen=$state(false),started=0,nextBlink=3;
 const reacting=$derived(['laugh','cheer','dance'].includes(animationName));
 const clip=$derived(animationName==='idle'?'face_scan':animationName==='point'?'face_focus':reacting?'face_react':'face_greet');
 $effect(()=>{const a=animationName;blink=false;mouthOpen=false;started=performance.now();nextBlink=2+Math.floor(Math.random()*3);});
 $effect(()=>{spine.skeleton.setAttachment('head',reacting?'head_laugh':mouthOpen?'head_talk':blink?'head_blink':'head_idle');});
 onMount(()=>{let end:ReturnType<typeof setTimeout>|undefined;const timer=setInterval(()=>{
  if(animationName==='idle'&&!blink&&!mouthOpen&&performance.now()-started>=nextBlink*3200){blink=true;started=performance.now();nextBlink=2+Math.floor(Math.random()*3);end=setTimeout(()=>blink=false,150);}
 },50);return()=>{clearInterval(timer);clearTimeout(end);};});
</script>
<SpineTrack trackIndex={2} animationName={clip} loop={clip==='face_scan'||clip==='face_react'} mixDuration={.18} listener={{event:(_entry,event)=>{if(event.data.name==='face_open')mouthOpen=true;if(event.data.name==='face_close')mouthOpen=false;}}}/>
