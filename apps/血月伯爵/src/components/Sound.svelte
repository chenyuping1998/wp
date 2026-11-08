<script lang="ts" module>export type EmitterEventSound={type:'bloodmoonSound';name:string};</script>
<script lang="ts">
 import {onMount} from 'svelte';import {stateSoundDerived} from 'state-shared';
 import manifest from '../game/bloodmoonAssets.json';import {getContext} from '../game/context';
 import {stateBloodMoon as bm} from '../game/bloodmoon.svelte';
 import {CueCursor,revealAudioCues,phaseAudioCues,winTier,timingFor,celebrationStages} from '../game/presentation';
 import {isLocalDemo} from '../game/demo';
 import type {BloodMoonReviewWindow} from '../game/review';
 import {BloodMoonAudio} from '../game/audio';
 const mixer=new BloodMoonAudio(manifest.audio,s=>`${import.meta.env.BASE_URL}${s.slice(1)}`);
 const cursor=new CueCursor();const context=getContext();
 const spinCues=$derived(bm.reveal?revealAudioCues(bm.reveal,bm.turbo):[]);
 const winStage=$derived(celebrationStages(bm.spinWin,bm.duration).filter(stage=>bm.clock>=stage.at).at(-1)?.tier??'big');
 $effect(()=>mixer.volumes(stateSoundDerived.volumeMusic(),stateSoundDerived.volumeSoundEffect()));
 $effect(()=>{
  const tier=bm.phase==='win'?winTier(bm.spinWin):null;
  mixer.music(tier?(winStage==='epic'||winStage==='mega'?'Mega_Loop':'Big_Loop'):bm.inFree?'fgBgm':'ngBgm',tier?.6:['spin','freeStart','freeEnd'].includes(bm.phase)?.46:bm.phase==='win'?.7:1);
 });
 $effect(()=>{
  const tier=bm.phase==='win'?winTier(bm.spinWin):null;
  const wild=bm.phase==='spin'&&bm.reveal?.wildPlan.triggered&&bm.clock>=400&&bm.clock<timingFor(bm.reveal,bm.turbo).backAt;
  mixer.effectLoop(bm.skipped?null:wild?(bm.inFree?'fgWILDvibe':'ngWILDvibe'):tier&&bm.clock>=600&&bm.clock<bm.duration-650?(winStage==='epic'||winStage==='mega'?'Mega_RunNum':'Big_RunNum'):null,wild?.22:.2);
 });
 $effect(()=>{if(bm.skipped)mixer.stopEffects();});
 $effect(()=>{
  const cues=bm.phase==='spin'?spinCues:phaseAudioCues(bm.phase,bm.duration,bm.spinWin,bm.winMultiplier,bm.progress);
  for(const cue of cursor.take(`${bm.presentationId}/${bm.phase}`,bm.clock,cues,bm.skipped))mixer.cue(cue.key,cue.gain);
 });
 context.eventEmitter.subscribeOnMount({soundPressBet:()=>mixer.cue('WUI_Touch',.3),soundPressGeneral:()=>mixer.cue('WUI_Touch',.25),bloodmoonSound:({name})=>mixer.cue(name)});
 onMount(()=>{
  mixer.mount();mixer.cue('TitleIn',.25);
  const reviewWindow=window as BloodMoonReviewWindow,capture=()=>mixer.captureStream();
  if(isLocalDemo()&&window.parent!==window)reviewWindow.bloodMoonReviewAudio=capture;
  return()=>{if(reviewWindow.bloodMoonReviewAudio===capture)delete reviewWindow.bloodMoonReviewAudio;mixer.destroy();};
 });
</script>
