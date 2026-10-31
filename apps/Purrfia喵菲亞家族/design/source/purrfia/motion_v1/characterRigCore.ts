import {AnimationState,AnimationStateData,AtlasAttachmentLoader,FakeTexture,Physics,Skeleton,SkeletonJson,TextureAtlas,type SkeletonData} from '@esotericsoftware/spine-core';
export function parseCharacterRig(json:unknown,source:string){const atlas=new TextureAtlas(source);for(const page of atlas.pages)page.setTexture(new FakeTexture({width:page.width,height:page.height}));const data=new SkeletonJson(new AtlasAttachmentLoader(atlas)).readSkeletonData(json);return {atlas,data};}
export function createCharacterPlayer(data:SkeletonData){
 const skeleton=new Skeleton(data),stateData=new AnimationStateData(data);stateData.defaultMix=.10;const state=new AnimationState(stateData);
 let fidgetsEnabled=true;let disposed=false,reduced=false,featureMode=false,acting=false,restTime=0,nextFidget=25;
 const rest=()=>featureMode?'fg_idle':'idle';
 state.setAnimation(0,rest(),true);
 state.addListener({complete:e=>{if(e.trackIndex===0&&!e.loop)acting=false;}});
 const update=(seconds:number)=>{if(disposed)return;const dt=Math.max(0,Math.min(seconds,.15));if(!reduced){state.update(dt);skeleton.update(dt);state.apply(skeleton);if(!acting&&fidgetsEnabled){restTime+=dt;if(restTime>=nextFidget&&data.findAnimation('idle_bored')){state.setAnimation(0,'idle_bored',false);state.addAnimation(0,rest(),true,0);nextFidget=restTime+40;}}}skeleton.updateWorldTransform(Physics.none);};
 update(0);return {skeleton,state,update,play(name:string,rate=1,keepLoop=false){if(disposed||reduced||!data.findAnimation(name))return false;acting=true;restTime=0;nextFidget=25;const e=state.setAnimation(0,name,false);e.timeScale=Math.max(.25,Math.min(4,rate));if(keepLoop&&data.findAnimation(name+'_loop'))state.addAnimation(0,name+'_loop',true,0);else state.addAnimation(0,rest(),true,0);return true;},
 setFidgetsEnabled(value:boolean){fidgetsEnabled=value;},
 setFreegame(value:boolean){featureMode=value;if(!acting)state.setAnimation(0,rest(),true);},
 setReducedMotion(value:boolean){reduced=value;if(value){state.clearTracks();skeleton.setupPose();state.setAnimation(0,rest(),true);state.apply(skeleton);skeleton.updateWorldTransform(Physics.none);}},
 destroy(){disposed=true;state.clearTracks();state.clearListeners();}};
}
