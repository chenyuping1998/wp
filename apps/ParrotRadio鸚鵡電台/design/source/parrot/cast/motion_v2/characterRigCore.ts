import {AnimationState,AnimationStateData,AtlasAttachmentLoader,FakeTexture,Physics,Skeleton,SkeletonJson,TextureAtlas,type SkeletonData} from '@esotericsoftware/spine-core';
export function parseCharacterRig(json:unknown,source:string){const atlas=new TextureAtlas(source);for(const page of atlas.pages)page.setTexture(new FakeTexture({width:page.width,height:page.height}));const data=new SkeletonJson(new AtlasAttachmentLoader(atlas)).readSkeletonData(json);return {atlas,data};}
export function createCharacterPlayer(data:SkeletonData){
 const skeleton=new Skeleton(data),stateData=new AnimationStateData(data);stateData.defaultMix=.12;const state=new AnimationState(stateData);
 let fidgetsEnabled=true,disposed=false,reduced=false,featureMode=false,acting=false,holding=false,restTime=0,nextFidget=25,fidgetIndex=0,loopName='';
 const protectedNames=new Set(['push_monocle','push_monocle_short','stamp','stamp_short','claim_turf','encore_build','encore_call','encore_success','encore_fail','record_pull','record_hit','record_miss','fg_trigger','fg_end']);
 const rest=()=>featureMode?'fg_idle':'idle';
 const startRest=()=>{acting=false;holding=false;loopName='';state.setAnimation(0,rest(),true);};
 const startBreath=()=>{if(data.findAnimation('breath'))state.setAnimation(1,'breath',true);};
 startRest();startBreath();
 state.addListener({complete:e=>{if(e.trackIndex!==0||e.loop||state.tracks[0]!==e)return;if(holding&&loopName){state.setAnimation(0,loopName,true);acting=true;}else startRest();}});
 const update=(seconds:number)=>{if(disposed)return;const dt=Math.max(0,Math.min(seconds,.1));if(!reduced){state.update(dt);skeleton.update(dt);state.apply(skeleton);if(!acting&&fidgetsEnabled){restTime+=dt;if(restTime>=nextFidget){const name=fidgetIndex++%2&&data.findAnimation('idle_mimic')?'idle_mimic':'idle_bored';if(data.findAnimation(name)){acting=true;state.setAnimation(0,name,false);}nextFidget=restTime+40;}}}skeleton.updateWorldTransform(Physics.none);};
 update(0);return {skeleton,state,update,play(name:string,rate=1,keepLoop=false){
  if(disposed||reduced||!data.findAnimation(name))return false;
  if(name==='idle'||name==='fg_idle'){startRest();return true;}
  const current=state.tracks[0];if(current&&protectedNames.has(current.animation?.name??'')&&current.trackTime<current.animationEnd&&name.startsWith('react_'))return false;
  acting=true;holding=keepLoop;loopName=keepLoop&&data.findAnimation(name+'_loop')?name+'_loop':'';restTime=0;nextFidget=25;
  const entry=state.setAnimation(0,name,false);entry.timeScale=Math.max(.25,Math.min(4,rate));return true;
 },
 setFidgetsEnabled(value:boolean){fidgetsEnabled=value;if(!value&&['idle_bored','idle_mimic'].includes(state.tracks[0]?.animation?.name??''))startRest();},
 setFreegame(value:boolean){if(featureMode===value)return;featureMode=value;if(!acting)startRest();},
 setReducedMotion(value:boolean){if(reduced===value)return;reduced=value;state.clearTracks();skeleton.setupPose();startRest();if(!value)startBreath();state.apply(skeleton);skeleton.updateWorldTransform(Physics.none);},
 destroy(){disposed=true;state.clearTracks();state.clearListeners();}};
}
