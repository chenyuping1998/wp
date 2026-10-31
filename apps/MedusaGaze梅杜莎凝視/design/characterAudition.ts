import {characterSoundDesign,resolveCharacterSound,type CharacterSoundMark} from '../src/game/characterSoundDesign';

/** Native character review only. Production uses Sound.svelte's shared bus. */
export function createCharacterAudition(root:string,enabled:()=>boolean){
 const audio=new AudioContext(),limiter=audio.createDynamicsCompressor(),bus=audio.createGain();
 limiter.threshold.value=-3;limiter.knee.value=2;limiter.ratio.value=16;limiter.attack.value=.002;limiter.release.value=.09;
 bus.gain.value=.68;bus.connect(limiter);limiter.connect(audio.destination);
 const buffers=new Map<string,Promise<AudioBuffer>>(),sources=new Set<AudioBufferSourceNode>(),last=new Map<string,number>();let generation=0,variant=0;
 const load=(cue:string)=>{if(!buffers.has(cue))buffers.set(cue,fetch(root+cue+'.wav?v=9').then(r=>{if(!r.ok)throw Error('Audio '+cue+': '+r.status);return r.arrayBuffer();}).then(b=>audio.decodeAudioData(b)));return buffers.get(cue)!;};
 for(const cue of new Set([...Object.values(characterSoundDesign).flatMap(d=>d.voices.map(v=>v.cue)),'vo_medusa_laugh_2']))void load(cue).catch(console.error);
 return {
  play(mark:CharacterSoundMark){
   if(!enabled())return;const now=performance.now();if(now-(last.get(mark)??-Infinity)<characterSoundDesign[mark].cooldownMs)return;last.set(mark,now);
   const run=generation;void audio.resume();
   for(const v of resolveCharacterSound(mark,mark==='motion_laugh'?variant++:0))void load(v.cue).then(buffer=>{
    if(run!==generation||!enabled())return;
    const source=audio.createBufferSource(),gain=audio.createGain();source.buffer=buffer;source.playbackRate.value=v.rate;gain.gain.value=v.gain;
    source.connect(gain);gain.connect(bus);sources.add(source);source.onended=()=>{sources.delete(source);source.disconnect();gain.disconnect();};source.start();
   }).catch(console.error);
  },
  stop(){generation++;last.clear();for(const source of sources){try{source.stop();}catch{}}sources.clear();},
 };
}
