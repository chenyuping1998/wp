// Face and body timeline patch only; preserves every unrelated rig/animation.
import fs from 'node:fs';
export const LAUGH = JSON.parse(fs.readFileSync(new URL('../src/game/laughTiming.json', import.meta.url)));
const round = t => +t.toFixed(5);
function retimeCurve(key, map) {
  if(Array.isArray(key.curve))key.curve=key.curve.map((v,i)=>i%2===0?round(map(v)):v);
  return key;
}
export function laughFaceTimeline() {
  const frames = [{time:0,name:'head_2_face'},{time:.12,name:'head_2_face_inhale'},{time:.30,name:'head_2_face_half'}];
  const add = (time,state) => frames.push({time:round(time),name:`head_2_face_${state}`});
  for(let i=0;i<LAUGH.beats;i++) {
    const t=(LAUGH.startMs+i*LAUGH.gapMs)/1000;
    add(t,i<2?'rising':i<5?'open':'peak');
    add(t+.055,i<2?'open':i<8?'peak':'open');
    add(t+.125,'rising');
    add(t+.185,'half');
    add(t+.235,i%3===2?'settle':'inhale');
  }
  add(3.29,'rising'); add(3.38,'half'); add(3.47,'settle');
  frames.push({time:LAUGH.endMs/1000,name:'head_2_face'});
  return frames;
}
// Reuse this cast's OWN six body pulses, expanded to ten; preserve amplitudes
// and the original head/collar motion limits instead of stretching the face.
function expandBodyKeys(keys) {
  if(!Array.isArray(keys)||!keys.some(k=>typeof k.time==='number')) return keys;
  const start=.48,oldGap=.30,newGap=LAUGH.gapMs/1000,oldTail=2.28,newTail=3.28;
  const output=keys.filter(k=>(k.time??0)<start).map(k=>structuredClone(k));
  for(let i=0;i<LAUGH.beats;i++) {
    const sourceCycle=Math.round(i*5/(LAUGH.beats-1));
    for(const key of keys) {
      const t=key.time??0;
      if(t<start||t>=oldTail)continue;
      const cycle=Math.min(5,Math.floor((t-start+1e-5)/oldGap));
      if(cycle!==sourceCycle)continue;
      const copy=structuredClone(key);
      const map=v=>start+i*newGap+(v-start-cycle*oldGap)*newGap/oldGap;
      copy.time=round(map(t));
      retimeCurve(copy,map);
      output.push(copy);
    }
  }
  output.push(...keys.filter(k=>(k.time??0)>=oldTail).map(k=>retimeCurve({...structuredClone(k),time:round(newTail+(k.time-oldTail))},v=>newTail+v-oldTail)));
  return output.sort((a,b)=>(a.time??0)-(b.time??0));
}
export function applyLaughV9(animations) {
  const animation=animations.chestbeat;
  if(!animation)throw new Error('Missing current chestbeat animation');
  // Idempotent: do not expand an already-integrated ten-beat body twice.
  const alreadyV9=animation.slots?.head_2_face?.attachment?.some(k=>k.name==='head_2_face_peak');
  if(!alreadyV9)for(const bone of Object.values(animation.bones??{}))for(const [kind,keys]of Object.entries(bone))bone[kind]=expandBodyKeys(keys);
  animation.slots??={}; animation.slots.head_2_face={attachment:laughFaceTimeline()};
  for(const [name,a]of Object.entries(animations)) {
    if(name==='chestbeat'||name==='flutter')continue;
    a.slots??={}; a.slots.head_2_face={attachment:[{time:0,name:'head_2_face'}]};
  }
}
