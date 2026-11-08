import fs from 'node:fs';
import {timingFor,characterSpec,revealAudioCues,phaseAudioCues,winDuration,FREE_START_MS,FREE_END_MS} from '../src/game/presentation.ts';

const data=JSON.parse(fs.readFileSync(new URL('../static/data/demo-books.json',import.meta.url),'utf8'));
const reveal=data.scenarios.wild.events.find((event:{type:string})=>event.type==='reveal');
const duration=timingFor(reveal).duration;
const temporary=new URL('../../../../tmp/',import.meta.url);
fs.mkdirSync(temporary,{recursive:true});
fs.writeFileSync(new URL('bloodmoon-audio-plan.json',temporary),JSON.stringify({duration,cues:revealAudioCues(reveal)}));
const frames=[];
for(let clock=0;clock<duration+1650+600;clock+=1000/60){
 const phase=clock<duration?'spin':clock<duration+1650?'win':'idle';
 frames.push({clock,...characterSpec(phase,phase==='spin'?clock:clock-duration,1300,reveal)});
}
fs.writeFileSync(new URL('bloodmoon-character-plan.json',temporary),JSON.stringify({frames}));
const progress=data.scenarios.fg.events.find((event:{type:string;addedSpins?:number})=>event.type==='freeProgress'&&event.addedSpins);
const phases=[
 {name:'WILD',duration,cues:revealAudioCues(reveal),music:'ngBgm',duck:.46},
 {name:'FG entry',duration:FREE_START_MS,cues:phaseAudioCues('freeStart',FREE_START_MS,0,1),music:'fgBgm',duck:.46},
 {name:'Blood collection',duration:2300,cues:phaseAudioCues('progress',2300,0,2,progress),music:'fgBgm',duck:.8},
 {name:'Epic win',duration:winDuration(49600),cues:phaseAudioCues('win',winDuration(49600),49600,1),music:'Mega_Loop',duck:.66},
 {name:'FG exit',duration:FREE_END_MS,cues:phaseAudioCues('freeEnd',FREE_END_MS,0,1),music:'fgBgm',duck:.46},
];
let offset=0;
const showcase=phases.map(phase=>{const item={...phase,at:offset};offset+=phase.duration;return item;});
fs.writeFileSync(new URL('bloodmoon-showcase-audio-plan.json',temporary),JSON.stringify({duration:offset,phases:showcase,wildEnd:timingFor(reveal).backAt}));
console.log('Exported WILD character, audio and full soundscape review plans.');
