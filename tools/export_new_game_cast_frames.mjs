import fs from 'node:fs';
import path from 'node:path';
import {createRequire,stripTypeScriptTypes} from 'node:module';
import {pathToFileURL} from 'node:url';
const [app,out]=process.argv.slice(2),require=createRequire(path.join(app,'package.json'));
const {AnimationState,AnimationStateData,AtlasAttachmentLoader,FakeTexture,MeshAttachment,Physics,Skeleton,SkeletonJson,TextureAtlas}=await import(pathToFileURL(require.resolve('@esotericsoftware/spine-core')).href);
const raw=JSON.parse(fs.readFileSync(path.join(app,'src/game/characterRigData.json'),'utf8'));
const atlas=new TextureAtlas(fs.readFileSync(path.join(app,'src/game/characterRigAtlas.txt'),'utf8'));for(const p of atlas.pages)p.setTexture(new FakeTexture({width:p.width,height:p.height}));
const data=new SkeletonJson(new AtlasAttachmentLoader(atlas)).readSkeletonData(raw),cat=app.includes('Purrfia');
const motion=process.argv.includes('--motion');
const selection=process.argv.find(v=>v.startsWith('--clips='));
const clips=selection?selection.slice(8).split(','):process.argv.includes('--all')?data.animations.map(a=>a.name).filter(n=>n!=='idle'&&n!=='fg_idle'):motion?(cat?['breath','push_monocle','stamp']:['breath','encore_build','encore_call']):cat?['breath','push_monocle','stamp','claim_turf','idle_bored','fg_trigger','fg_end','win_max']:['breath','encore_build','encore_call','turn_knob','record_pull','record_hit','fg_trigger','fg_end','win_max'];
const result=[];
const reviewFps=Number(process.argv.find(v=>v.startsWith('--fps='))?.slice(6)??20),stride=Math.round(60/reviewFps);
const holdSeconds=Number(process.argv.find(v=>v.startsWith('--hold='))?.slice(7)??.2);
if(![10,20,30,60].includes(reviewFps))throw Error('Review fps must divide 60');
function capture(skeleton,name,t,fraction,durationMs){
 const layers=[];for(const slot of skeleton.drawOrder.appliedPose){const pose=slot.getAppliedPose(),a=pose.getAttachment();if(!(a instanceof MeshAttachment)||pose.color.a<.001)continue;const seq=a.sequence.resolveIndex(pose),region=a.sequence.regions[seq],v=new Float32Array(a.worldVerticesLength);a.computeWorldVertices(skeleton,slot,0,v.length,v,0,2);layers.push({name:slot.data.name,page:region.page.name,positions:Array.from(v),uvs:Array.from(a.sequence.getUVs(seq)),triangles:a.triangles,alpha:pose.color.a*a.color.a});}
 result.push({name,fraction,t,layers,...(durationMs?{durationMs}:{}),...(process.argv.includes('--sequence')?{id:String(result.length).padStart(4,'0')+'_'+name}:{})});
}
if(process.argv.includes('--sequence')){
 const moduleFile=path.join(app,'design/.cast-review-player.mjs');fs.writeFileSync(moduleFile,stripTypeScriptTypes(fs.readFileSync(path.join(app,'src/game/characterRigCore.ts'),'utf8')));
 try{const {createCharacterPlayer}=await import(pathToFileURL(moduleFile).href);const player=createCharacterPlayer(data);player.setFidgetsEnabled(false);
  const segment=(name,duration)=>{const ticks=Math.ceil(duration*60);for(let i=0;i<ticks;i++){player.update(1/60);if(i%stride===0)capture(player.skeleton,name,i/60,i/ticks,1000/reviewFps);}};
  segment('idle',.75);
  for(const name of clips){if(name==='breath'){segment('idle',2);continue;}player.play(name,1,name.startsWith('win_')&&!name.endsWith('_loop'));segment(name,data.findAnimation(name).duration+(name.startsWith('win_')?holdSeconds:.20));player.play('idle');segment('return_to_idle',.60);}
  player.destroy();
 }finally{fs.unlinkSync(moduleFile);}
}else for(const name of clips){const duration=motion&&name==='breath'?data.findAnimation(name).duration/2:data.findAnimation(name).duration;
 const samples=motion?(name==='breath'?24:16):4,fractions=motion?Array.from({length:samples},(_,i)=>i/samples):[0,.27,.54,.85];
 for(const fraction of fractions){const skeleton=new Skeleton(data),state=new AnimationState(new AnimationStateData(data));state.setAnimation(0,name==='breath'?'idle':name,false);state.setAnimation(1,'breath',true);const t=duration*fraction;for(let i=0;i<Math.ceil(t*60);i++){const dt=Math.min(1/60,t-i/60);state.update(dt);skeleton.update(dt);state.apply(skeleton);}state.apply(skeleton);skeleton.updateWorldTransform(Physics.none);
  capture(skeleton,name,t,fraction,motion?duration/samples*1000:undefined);
 }
}
fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'frames.json'),JSON.stringify(result));console.log(`${result.length} rendered pose definitions exported`);
