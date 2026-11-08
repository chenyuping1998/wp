import test from 'node:test';
import assert from 'node:assert/strict';
import {setTimeout as delay} from 'node:timers/promises';
import {BloodMoonAudio} from '../src/game/audio.ts';

class FakeAudio extends EventTarget{
 static instances:FakeAudio[]=[];
 src:string;paused=true;volume=1;loop=false;preload='';
 constructor(src=''){super();this.src=src;FakeAudio.instances.push(this);}
 load(){} pause(){this.paused=true;} play(){this.paused=false;return Promise.resolve();}
 cloneNode(){return new FakeAudio(this.src);}
 removeAttribute(name:string){if(name==='src')this.src='';}
}

test('the mixer bounds voices, separates exclusive groups, mutes and releases every player',async()=>{
 const originalAudio=Object.getOwnPropertyDescriptor(globalThis,'Audio'),originalDocument=Object.getOwnPropertyDescriptor(globalThis,'document');
 Object.defineProperty(globalThis,'Audio',{configurable:true,value:FakeAudio});
 const fakeDocument=Object.assign(new EventTarget(),{hidden:false});
 Object.defineProperty(globalThis,'document',{configurable:true,value:fakeDocument});
 const files=Object.fromEntries(['ngBgm','fgBgm','ngWILDvibe','Score','CharaWild','CharaBack','Big_Start','Super_Start'].map(key=>[key,key]));
 const mixer=new BloodMoonAudio(files,path=>path);
 try{
  mixer.volumes(1,1);mixer.mount();mixer.music('ngBgm',.5);mixer.effectLoop('ngWILDvibe');
  for(let i=0;i<22;i++)mixer.cue('Score');
  assert.equal(FakeAudio.instances.filter(a=>!a.paused&&!a.loop).length,12,'one-shot voice limit exceeded');
  mixer.cue('CharaWild');mixer.cue('CharaBack');mixer.cue('Big_Start');mixer.cue('Super_Start');
  await delay(90);
  assert.equal(FakeAudio.instances.filter(a=>!a.paused&&a.src.startsWith('Chara')).length,1);
  assert.equal(FakeAudio.instances.filter(a=>!a.paused&&a.src.endsWith('_Start')).length,1);
  fakeDocument.hidden=true;fakeDocument.dispatchEvent(new Event('visibilitychange'));await delay(80);
  assert.ok(FakeAudio.instances.every(a=>a.paused),'hidden tab left audio playing');
  fakeDocument.hidden=false;fakeDocument.dispatchEvent(new Event('visibilitychange'));
  assert.ok(FakeAudio.instances.some(a=>a.loop&&!a.paused),'returning to the tab did not resume its music');
  mixer.music('fgBgm');mixer.volumes(0,0);await delay(80);
  assert.ok(FakeAudio.instances.filter(a=>!a.paused).every(a=>a.volume===0),'muting left an audible channel');
  mixer.stopEffects();await delay(80);
  assert.equal(FakeAudio.instances.filter(a=>!a.paused&&!a.loop).length,0,'skip left a one-shot playing');
 }finally{
  mixer.destroy();
  if(originalAudio)Object.defineProperty(globalThis,'Audio',originalAudio);else delete (globalThis as any).Audio;
  if(originalDocument)Object.defineProperty(globalThis,'document',originalDocument);else delete (globalThis as any).document;
 }
 assert.ok(FakeAudio.instances.every(a=>a.paused),'unmount leaked an audio player');
});

test('review recording taps only game audio and releasing its clone preserves playback',async()=>{
 class Track{stopped=false;stop(){this.stopped=true;}}
 class Stream{track=new Track();getTracks(){return [this.track];}clone(){return new Stream();}}
 class Source{disconnected=false;outputs:unknown[]=[];connect(output:unknown){this.outputs.push(output);}disconnect(){this.disconnected=true;}}
 class Context{
  static current:Context;destination={speakers:true};output={stream:new Stream()};sources:Source[]=[];state='suspended';
  constructor(){Context.current=this;}createMediaStreamDestination(){return this.output;}
  createMediaElementSource(){const source=new Source();this.sources.push(source);return source;}
  resume(){this.state='running';return Promise.resolve();}close(){this.state='closed';return Promise.resolve();}
 }
 const originals=new Map(['Audio','document','AudioContext'].map(key=>[key,Object.getOwnPropertyDescriptor(globalThis,key)]));
 Object.defineProperty(globalThis,'Audio',{configurable:true,value:FakeAudio});Object.defineProperty(globalThis,'document',{configurable:true,value:Object.assign(new EventTarget(),{hidden:false})});Object.defineProperty(globalThis,'AudioContext',{configurable:true,value:Context});
 const mixer=new BloodMoonAudio({ngBgm:'music',Score:'score'},path=>path);
 try{
  mixer.volumes(1,1);mixer.mount();mixer.music('ngBgm');mixer.cue('Score');
  const stream=await mixer.captureStream(),context=Context.current;
  assert.equal(context.sources.length,2);assert.ok(context.sources.every(source=>source.outputs.length===2));
  stream.getTracks().forEach(track=>track.stop());
  assert.equal(context.output.stream.track.stopped,false,'stopping a recording also stopped its shared mixer');
  assert.ok(FakeAudio.instances.some(audio=>audio.loop&&!audio.paused));
  mixer.cue('Score');assert.equal(context.sources.length,3,'later sound effects missed the recording');
 }finally{
  mixer.destroy();assert.equal(Context.current.state,'closed');assert.ok(Context.current.sources.every(source=>source.disconnected));assert.equal(Context.current.output.stream.track.stopped,true);
  for(const [key,descriptor] of originals){if(descriptor)Object.defineProperty(globalThis,key,descriptor);else delete (globalThis as any)[key];}
 }
});
