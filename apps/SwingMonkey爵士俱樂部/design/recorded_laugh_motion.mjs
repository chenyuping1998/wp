// Retain this cast's own poses; fit five body pulses to the Putt/Diner audio.
// Immutable source avoids accumulating retiming on repeated builds.
import fs from 'node:fs';
import { LAUGH } from './laugh_motion_v9.mjs';
const source = JSON.parse(fs.readFileSync(new URL('./source/swing/audio/laugh-body-ten-beat.json', import.meta.url)));
const bez = (a,b,c,d,u) => (1-u)**3*a+3*(1-u)**2*u*b+3*(1-u)*u*u*c+u**3*d;
function sample(keys, t, field, fallback, component) {
  let i = keys.findIndex((k,j)=>j+1===keys.length || keys[j+1].time>t);
  if (i<0) i=keys.length-1;
  const a=keys[i], b=keys[i+1];
  if(t<a.time) return fallback;
  if(!b || a.curve==='stepped') return a[field]??fallback;
  const av=a[field]??fallback,bv=b[field]??fallback;
  if(!Array.isArray(a.curve)) return av+(bv-av)*(t-a.time)/(b.time-a.time);
  const [cx,cy,dx,dy]=a.curve.slice(component*4,component*4+4);
  let lo=0,hi=1;
  for(let n=0;n<24;n++){const u=(lo+hi)/2;if(bez(a.time,cx,dx,b.time,u)<t)lo=u;else hi=u;}
  return bez(av,cy,dy,bv,(lo+hi)/2);
}
export function applyRecordedLaugh(animations, cast) {
  const folder=cast==='mg'?'sushiMaster':'sushiApprentice';
  const old=source[folder];
  const start=LAUGH.startMs/1000, gap=LAUGH.gapMs/1000;
  const release=start+LAUGH.beats*gap, end=LAUGH.endMs/1000+.35;
  const animation={bones:{},slots:structuredClone(old.slots)};
  for(const [bone,channels] of Object.entries(old.bones)) {
    const out=animation.bones[bone]={};
    for(const [kind,keys] of Object.entries(channels)) {
      const fields=kind==='rotate'?['value']:['x','y'];
      out[kind]=Array.from({length:Math.ceil(end*60)+1},(_,i)=>{
        const t=Math.min(end,i/60), at=Math.min(t,release);
        const src=at<start?at*.48/start:.48+(at-start)*.28/gap;
        const k=Math.max(0,Math.min(1,(t-release)/(end-release)));
        const fade=1-k*k*(3-2*k);
        return {time:+t.toFixed(5),...Object.fromEntries(fields.map((f,j)=>{
          const rest=kind==='scale'?1:0;
          // Faster five-beat cadence needs a smaller flex on the dancer's collar.
          const strength=cast==='fg'?.5:.8;
          return [f,+(rest+(sample(keys,src,f,rest,j)-rest)*fade*strength).toFixed(5)];
        }))};
      });
    }
  }
  const face=(time,state)=>({time:+time.toFixed(5),name:`head_2_face_${state}`});
  animation.slots.head_2_face={attachment:[face(0,'rest'),face(.10,'laugh_1'),
    ...Array.from({length:LAUGH.beats},(_,i)=>{
      const t=start+i*gap;
      return [[0,'laugh_2'],[.025,'laugh_3'],[.055,i===2?'laugh_4_blink':'laugh_4'],[.10,'laugh_3'],[.15,'laugh_2'],[.19,'laugh_1']].map(([dt,s])=>face(t+dt,s));
    }).flat(),face(LAUGH.endMs/1000,'rest'),face(end,'rest')]};
  animations.chestbeat=animation;
}
