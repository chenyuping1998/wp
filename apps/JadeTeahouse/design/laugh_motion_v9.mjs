// Face and body timeline patch only; preserves every unrelated rig/animation.
import fs from 'node:fs';
export const LAUGH = JSON.parse(fs.readFileSync(new URL('../src/game/laughTiming.json', import.meta.url)));
const round = t => +t.toFixed(5);
function retimeCurve(key, map) {
  if(Array.isArray(key.curve))key.curve=key.curve.map((v,i)=>i%2===0?round(map(v)):v);
  return key;
}
export function laughFaceTimeline() {
  const painted=LAUGH.usePaintedLaugh === true;
  const frames = [{time:0,name:'head_2_face_rest'},{time:.12,name:`head_2_face_${painted?'inhale':'laugh_1'}`},{time:.30,name:`head_2_face_${painted?'half':'rest'}`}];
  const add = (time,state) => frames.push({time:round(time),name:`head_2_face_${state}`});
  for(let i=0;i<LAUGH.beats;i++) {
    const t=(LAUGH.startMs+i*LAUGH.gapMs)/1000;
    if(painted) {
      add(t,i<2?'rising':i<5?'open':'peak');
      add(t+.075,(i===2||i===6)?'peak_blink':i<2?'open':i<8?'peak':'open');
      if(i===2||i===6)add(t+.115,'peak');
      add(t+.145,'rising');
      add(t+.215,i%3===2?'settle':'inhale');
    } else {
      // Seven hand-timed drawings per laugh syllable. The same lips, jaw and
      // cheek remain visible at every step, so there is no tooth-grid pop.
      ['laugh_1','laugh_2','laugh_3','laugh_4','laugh_3','laugh_2','laugh_1']
        .forEach((pose,j)=>add(t+j*.037,(j===3&&(i===2||i===6))?'laugh_4_blink':pose));
    }
  }
  add(3.29,painted?'rising':'laugh_3'); add(3.38,painted?'half':'laugh_2'); add(3.47,painted?'inhale':'laugh_1');
  frames.push({time:LAUGH.endMs/1000,name:'head_2_face_rest'});
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
  const alreadyV9=animation.slots?.head_2_face?.attachment?.length > 20;
  if(!alreadyV9)for(const bone of Object.values(animation.bones??{}))for(const [kind,keys]of Object.entries(bone))bone[kind]=expandBodyKeys(keys);
  animation.slots??={}; animation.slots.head_2_face={attachment:laughFaceTimeline()};
  const face=(time,state)=>({time,name:`head_2_face${state?'_'+state:''}`});
  for(const [name,a]of Object.entries(animations)) {
    if(name==='chestbeat'||name==='flutter')continue;
    a.slots??={};
    if(name==='idle') {
      // Brief, irregularly spaced lids; each cel is the same weighted head mesh.
      a.slots.head_2_face={attachment:[face(0,'rest'),face(1.47,'blink'),face(1.56,'rest'),
        face(3.82,'blink'),face(3.90,'rest'),face(4.08,'blink'),face(4.16,'rest')]};
    } else if(name==='cheer') {
      if(LAUGH.usePaintedLaugh) a.slots.head_2_face={attachment:[face(0,'rest'),face(.17,'half'),face(.34,'open'),
        face(.41,'peak_blink'),face(.50,'peak'),face(.64,'half'),face(.88,'open'),
        face(1.09,'peak_blink'),face(1.18,'peak'),face(1.30,'half'),face(1.43,'rest')]};
      else a.slots.head_2_face={attachment:[face(0,'rest'),face(.20,'laugh_1'),face(.27,'laugh_2'),
        face(.34,'laugh_3'),face(.41,'laugh_4_blink'),face(.50,'laugh_4'),face(.53,'laugh_3'),face(.60,'laugh_2'),
        face(.67,'laugh_1'),face(.74,'rest'),face(.88,'laugh_1'),face(.95,'laugh_2'),
        face(1.02,'laugh_3'),face(1.09,'laugh_4_blink'),face(1.18,'laugh_4'),face(1.21,'laugh_3'),
        face(1.28,'laugh_2'),face(1.35,'laugh_1'),face(1.43,'rest')]};
    } else a.slots.head_2_face={attachment:[face(0,'rest')]};
  }
}
