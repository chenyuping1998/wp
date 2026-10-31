import {AnimationState,AnimationStateData,AtlasAttachmentLoader,FakeTexture,Interpolation,Physics,Skeleton,SkeletonJson,TextureAtlas,type SkeletonData,type TrackEntry} from '@esotericsoftware/spine-core';
export function parseCharacterRig(json:unknown,source:string){const atlas=new TextureAtlas(source);for(const page of atlas.pages)page.setTexture(new FakeTexture({width:page.width,height:page.height}));const data=new SkeletonJson(new AtlasAttachmentLoader(atlas)).readSkeletonData(json);return {atlas,data};}
export function configureCharacterMixes(mixes:AnimationStateData,data:SkeletonData){
 mixes.defaultMix=.18;
 for(const from of data.animations)for(const to of data.animations){
  if(from.name==='breath'||to.name==='breath')continue;
  let duration=.18;
  if(to.name==='idle'||to.name==='fg_idle')duration=from.name.endsWith('_loop')?.38:.28;
  else if(to.name.endsWith('_short'))duration=.055;
  else if(to.name==='encore_build'||to.name==='turn_knob')duration=.08;
  else if(to.name.startsWith('idle_'))duration=.28;
  else if(to.name===from.name+'_loop')duration=.20;
  mixes.setMix(from.name,to.name,duration);
 }
}
export function smoothCharacterEntry(entry:TrackEntry,rate=1){entry.mixInterpolation=Interpolation.smooth;entry.mixDuration=Math.max(.035,entry.mixDuration/rate);return entry;}
export function createCharacterPlayer(data:SkeletonData){
 const skeleton=new Skeleton(data),stateData=new AnimationStateData(data);configureCharacterMixes(stateData,data);const state=new AnimationState(stateData);
 let paused=false,fidgetsEnabled=true,disposed=false,reduced=false,featureMode=false,acting=false,holding=false,restTime=0,nextFidget=25,fidgetIndex=0,loopName='';
 const protectedNames=new Set(['push_monocle','push_monocle_short','stamp','stamp_short','claim_turf','encore_build','encore_call','encore_success','encore_fail','record_pull','record_hit','record_miss','fg_trigger','fg_end']);
 const rest=()=>featureMode?'fg_idle':'idle';
 const startRest=()=>{acting=false;holding=false;loopName='';const current=state.tracks[0];if(current?.animation?.name===rest()&&current.loop)return;smoothCharacterEntry(state.setAnimation(0,rest(),true));};
 const startBreath=()=>{if(data.findAnimation('breath'))state.setAnimation(1,'breath',true);};
 startRest();startBreath();
 state.addListener({complete:e=>{if(e.trackIndex!==0||e.loop||state.tracks[0]!==e)return;if(holding&&loopName){smoothCharacterEntry(state.setAnimation(0,loopName,true));acting=true;}else startRest();}});
 const update=(seconds:number)=>{if(disposed||paused)return;const dt=Math.max(0,Math.min(seconds,.1));if(!reduced){state.update(dt);skeleton.update(dt);state.apply(skeleton);if(!acting&&fidgetsEnabled){restTime+=dt;if(restTime>=nextFidget){const name=fidgetIndex++%2&&data.findAnimation('idle_mimic')?'idle_mimic':'idle_bored';if(data.findAnimation(name)){acting=true;smoothCharacterEntry(state.setAnimation(0,name,false));}nextFidget=restTime+40;}}}skeleton.updateWorldTransform(Physics.none);};
 update(0);return {skeleton,state,update,play(name:string,rate=1,keepLoop=false){
  if(disposed||reduced||!data.findAnimation(name))return false;
  if(name==='idle'||name==='fg_idle'){startRest();return true;}
  const current=state.tracks[0],currentName=current?.animation?.name??'';
  if(current&&current.trackTime<current.animationEnd&&name.startsWith('react_')){
   if(protectedNames.has(currentName))return false;
   const rank=(n:string)=>n==='react_chain'?3:n==='react_good'?2:n==='react_small'?1:0;
   if(currentName.startsWith('react_')&&(currentName===name||rank(name)<rank(currentName)))return false;
  }
  acting=true;holding=keepLoop;loopName=keepLoop&&data.findAnimation(name+'_loop')?name+'_loop':'';restTime=0;nextFidget=25;
  const speed=Math.max(.25,Math.min(4,rate)),entry=smoothCharacterEntry(state.setAnimation(0,name,false),speed);entry.timeScale=speed;return true;
 },
 setPaused(value:boolean){paused=value;},
 setFidgetsEnabled(value:boolean){fidgetsEnabled=value;if(!value&&['idle_bored','idle_mimic'].includes(state.tracks[0]?.animation?.name??''))startRest();},
 setFreegame(value:boolean){if(featureMode===value)return;featureMode=value;if(!acting)startRest();},
 setReducedMotion(value:boolean){if(reduced===value)return;reduced=value;state.clearTracks();skeleton.setupPose();startRest();if(!value)startBreath();state.apply(skeleton);skeleton.updateWorldTransform(Physics.none);},
 destroy(){disposed=true;state.clearTracks();state.clearListeners();}};
}
