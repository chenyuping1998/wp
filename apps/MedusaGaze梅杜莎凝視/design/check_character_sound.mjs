// @ts-nocheck -- native Spine event replay, independent of browser frame pacing.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {parseMedusaRig,createMedusaPlayer} from '../src/game/medusaRigCore.ts';
import {characterSoundDesign,resolveCharacterSound,isCharacterSoundMark} from '../src/game/characterSoundDesign.ts';
import {orbFlightGain,castingMix} from '../src/game/castingSoundDesign.ts';
import {interfaceSoundDesign} from '../src/game/interfaceSoundDesign.ts';
const root=new URL('../static/assets/spines/medusa43/',import.meta.url);
const json=JSON.parse(fs.readFileSync(new URL('medusa.json',root),'utf8'));
const {data}=parseMedusaRig(json,fs.readFileSync(new URL('medusa.atlas',root),'utf8'));
let maxDrift=0,total=0;
function replay(name,rate=1){
 let time=0;const cues=[],p=createMedusaPlayer(data,undefined,mark=>cues.push({mark,time}));
 p.play(name,false,rate);
 for(let i=0;i<Math.ceil(data.findAnimation(name).duration/rate*120)+2;i++){time+=1/120;p.update(1/120);}
 p.destroy();return cues;
}
const clips=[];
for(const [name,animation] of Object.entries(json.animations)){
 const expected=(animation.events??[]).filter(e=>isCharacterSoundMark(e.name));if(!expected.length)continue;
 const actual=replay(name);assert.equal(actual.length,expected.length,name);
 expected.forEach((event,i)=>{
  assert.equal(actual[i].mark,event.name,name);const drift=Math.abs(actual[i].time-event.time);maxDrift=Math.max(maxDrift,drift);assert.ok(drift<=1/120+1e-6,name+' event drift');total++;
 });clips.push({name,events:actual.length});
}
for(const [normal,turbo] of [['gaze','gaze_turbo'],['fg_gaze','fg_gaze_turbo']])assert.deepEqual(replay(normal),replay(turbo),'Turbo must retain identical voice and foley marks');
for(const name of ['gaze','fg_gaze']){
 const cues=replay(name,2),cast=cues.find(c=>c.mark==='motion_cast');
 const expected=json.animations[name].events.find(e=>e.name==='motion_cast').time;
 assert.ok(Math.abs(cast.time-expected/2)<=1/120+1e-6,'Audio follows actual clip timeScale');
 const talk=json.animations[name].slots.face.attachment.filter(k=>k.name==='face_talk')[0].time;
 const close=json.animations[name].slots.face.attachment.find(k=>k.time>talk&&k.name==='face_smug').time;
 assert.ok(talk<=expected&&close>=expected+.46/.92-.001,'Talk drawing must cover the pitched casting voice');
}
const cancelled=[];let p=createMedusaPlayer(data,undefined,m=>cancelled.push(m));p.play('gaze');for(let i=0;i<120;i++)p.update(1/120);p.play('react_small');for(let i=0;i<240;i++)p.update(1/120);
assert.ok(!cancelled.includes('motion_cast')&&!cancelled.includes('motion_glasses_on'),'Interrupted cast must not emit delayed voice or glasses sounds');p.destroy();
const reduced=[];p=createMedusaPlayer(data,undefined,m=>reduced.push(m));p.setReducedMotion(true);p.play('gaze');p.update(3);assert.equal(reduced.length,0);p.destroy();
const meta=JSON.parse(fs.readFileSync(new URL('./source/medusagaze/audio/audio_metadata.json',import.meta.url),'utf8'));
for(const mark of Object.keys(characterSoundDesign))for(const v of resolveCharacterSound(mark,1))assert.ok(meta.files.some(f=>f.cue===v.cue),'Missing sound '+v.cue);
for(let count=1;count<=3;count++)assert.ok(Math.abs(count*orbFlightGain(count)**2-castingMix.fly**2)<1e-10,'A volley must share the single-orb wind energy budget');
for(const sounds of Object.values(interfaceSoundDesign))for(const v of sounds)assert.ok(meta.files.some(f=>f.cue===v.cue),'Missing interface sound '+v.cue);
const report={version:9,normalizedVolleyFlight:true,quietInterfaceCues:Object.keys(interfaceSoundDesign).length,passed:true,eventDriven:true,clips:clips.length,eventCount:total,maxDriftMs:maxDrift*1000,threeTurboTiers:'Shared unscaled character clock; MG and FG native turbo variants are identical',timeScaleReplay:true,cancelledCastSounds:false,reducedMotionSounds:false,mouthCoversCastVoice:true,audioFiles:meta.files.length,newFoleyCues:5,smallReactionVoiceCooldownMs:3500,authoredClips:clips};
fs.writeFileSync(new URL('./character-sound-validation.json',import.meta.url),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
