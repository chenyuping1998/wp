import fs from 'node:fs';
import path from 'node:path';
import {createRequire,stripTypeScriptTypes} from 'node:module';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
const [input,out]=process.argv.slice(2),app=path.resolve(input),req=createRequire(path.join(app,'package.json'));
const {AnimationState,AnimationStateData,AtlasAttachmentLoader,FakeTexture,MeshAttachment,Physics,Skeleton,SkeletonJson,TextureAtlas}=await import(pathToFileURL(req.resolve('@esotericsoftware/spine-core')).href);
const rawText=fs.readFileSync(path.join(app,'src/game/characterRigData.json'),'utf8'),raw=JSON.parse(rawText);
const hash=createHash('sha256').update(rawText).digest('hex'),coveragePath=path.join(app,'design/character-anatomy-coverage.json');
const coverage=fs.existsSync(coveragePath)?JSON.parse(fs.readFileSync(coveragePath,'utf8')):null;
if(coverage&&coverage.rigSha256!==hash)throw Error('Stale anatomy coverage; regenerate the rig and coverage together');
const PNG=coverage?null:createRequire('E:/stake/tools/gen/package.json')('pngjs').PNG;
const atlas=new TextureAtlas(fs.readFileSync(path.join(app,'src/game/characterRigAtlas.txt'),'utf8'));
const pages=new Map();
for(const p of atlas.pages){p.setTexture(new FakeTexture({width:p.width,height:p.height}));if(PNG)pages.set(p.name,PNG.sync.read(fs.readFileSync(path.join(app,'static/assets/spines',app.includes('Purrfia')?'donWhiskers43':'squawk43',p.name))));}
const data=new SkeletonJson(new AtlasAttachmentLoader(atlas)).readSkeletonData(raw);
const coreFile=path.join(app,'src/game/characterRigCore.ts'),configFile=path.join(app,'design/.anatomy-player-config.mjs');
fs.writeFileSync(configFile,stripTypeScriptTypes(fs.readFileSync(coreFile,'utf8')));
let core;try{core=await import(pathToFileURL(configFile).href);}finally{fs.unlinkSync(configFile);}
const coreHash=createHash('sha256').update(fs.readFileSync(coreFile)).digest('hex');
const area=(v,a,b,c)=>(v[b*2]-v[a*2])*(v[c*2+1]-v[a*2+1])-(v[b*2+1]-v[a*2+1])*(v[c*2]-v[a*2]);
const metadata=new Map();
function meshMeta(a,pose){
 let m=metadata.get(a);if(m)return m;
 if(coverage){const key=a.path??a.name,indices=coverage.opaqueTriangles[key];if(!indices)throw Error('Missing coverage for '+key);m={opaque:indices.map(i=>a.triangles.slice(i*3,i*3+3))};metadata.set(a,m);return m;}
 const uv=a.sequence.getUVs(a.sequence.resolveIndex(pose)),page=pages.get(a.sequence.regions[0].page.name);
 const opaque=[];
 for(let i=0;i<a.triangles.length;i+=3){const ids=a.triangles.slice(i,i+3);let solid=false;
  for(const w of [[1/3,1/3,1/3],[.7,.15,.15],[.15,.7,.15],[.15,.15,.7]]){
   let x=0,y=0;for(let j=0;j<3;j++){x+=uv[ids[j]*2]*w[j]*page.width;y+=uv[ids[j]*2+1]*w[j]*page.height;}
   x=Math.max(0,Math.min(page.width-1,Math.floor(x)));y=Math.max(0,Math.min(page.height-1,Math.floor(y)));if(page.data[(y*page.width+x)*4+3]>160){solid=true;break;}
  }if(solid)opaque.push(ids);
 }
 m={opaque};metadata.set(a,m);return m;
}
const setup=new Skeleton(data);setup.updateWorldTransform(Physics.none);
const bases=new Map(),buffers=new Map(),rawMeshes=new Map();
for(const slot of Object.values(raw.skins[0].attachments))for(const [key,value] of Object.entries(slot))rawMeshes.set(key,value);
const seams=app.includes('Purrfia')?[['front cuff','hand_front','arm_front_full','hand_front'],['rear cuff','hand_back','arm_back','paw_back'],...(raw.bones.some(b=>b.name==='collar_contact')?[['collar','collar_contact','body','face']]:[]),['stamp grip','knuckle_front','stamp_held','hand_front',true]]:[['front elbow','fore_front','wing_front_upper','wing_front_mid'],['front wrist','hand_front','wing_front_mid','hand_front'],['rear elbow','fore_back','wing_back_upper','wing_back_tip'],['microphone grip','microphone_grip','microphone_held','wing_back_tip',true],['record grip','hand_front','record_held','hand_front',true]];
if(raw.bones.some(b=>b.name==='shoulder_contact_front'))seams.push(['front shoulder','shoulder_contact_front','body','arm_front_full'],['rear shoulder','shoulder_contact_back','body','arm_back']);
const contactOffsets=new Map();
function hit(g,x,y){
 if(!g)return false;if(!coverage?.hitMasks96)return true;
 const {a,v}=g,key=a.path??a.name,uv=rawMeshes.get(key).uvs,mask=Buffer.from(coverage.hitMasks96[key],'base64');
 for(let t=0;t<a.triangles.length;t+=3){const i=a.triangles[t],j=a.triangles[t+1],k=a.triangles[t+2];
  if(x<Math.min(v[i*2],v[j*2],v[k*2])-.001||x>Math.max(v[i*2],v[j*2],v[k*2])+.001||y<Math.min(v[i*2+1],v[j*2+1],v[k*2+1])-.001||y>Math.max(v[i*2+1],v[j*2+1],v[k*2+1])+.001)continue;
  const det=area(v,i,j,k);if(Math.abs(det)<1e-7)continue;
  const bx=v[j*2]-x,by=v[j*2+1]-y,cx=v[k*2]-x,cy=v[k*2+1]-y,ax=v[i*2]-x,ay=v[i*2+1]-y;
  const w0=(bx*cy-by*cx)/det,w1=(cx*ay-cy*ax)/det,w2=1-w0-w1;if(Math.min(w0,w1,w2)<-1e-5)continue;
  const u=w0*uv[i*2]+w1*uv[j*2]+w2*uv[k*2],w=w0*uv[i*2+1]+w1*uv[j*2+1]+w2*uv[k*2+1];
  const px=Math.max(0,Math.min(95,Math.floor(u*96))),py=Math.max(0,Math.min(95,Math.floor(w*96))),bit=py*96+px;
  if(mask[bit>>3]&(128>>(bit&7)))return true;
 }return false;
}
let totalFrames=0,totalFolded=0,seamFailures=0,seamSamples=0,minRatio=1;
function inspect(skeleton,checkSeams){
 let count=0;const slots={},locations=[],geometry=new Map();totalFrames++;
 for(const slot of skeleton.drawOrder.appliedPose){
  const pose=slot.getAppliedPose(),a=pose.getAttachment();if(!(a instanceof MeshAttachment)||pose.color.a<.01)continue;
  let rest=bases.get(a);if(!rest){rest=new Float32Array(a.worldVerticesLength);a.computeWorldVertices(setup,setup.findSlot(slot.data.name),0,rest.length,rest,0,2);bases.set(a,rest);buffers.set(a,new Float32Array(rest.length));}
  const v=buffers.get(a);a.computeWorldVertices(skeleton,slot,0,v.length,v,0,2);if(!v.every(Number.isFinite))throw Error('Nonfinite mesh '+slot.data.name);geometry.set(slot.data.name,{a,v});let folded=0;
  for(const [i,j,k] of meshMeta(a,pose).opaque){const ratio=area(v,i,j,k)/area(rest,i,j,k);minRatio=Math.min(minRatio,ratio);if(ratio<-.0001){folded++;count++;locations.push({slot:slot.data.name,setup:[Math.round((rest[i*2]+rest[j*2]+rest[k*2])/3+512),Math.round(1450-(rest[i*2+1]+rest[j*2+1]+rest[k*2+1])/3)],ratio:+ratio.toFixed(3)});}}
  if(folded)slots[slot.data.name]=folded;
 }
 const openSeams=[];
 if(checkSeams&&coverage?.hitMasks96)for(const [label,bone,proximal,distal,optional] of seams){
  if(optional&&!geometry.has(proximal))continue;const p=skeleton.findBone(bone).getAppliedPose();
  // Structural contacts must cover a patch around the socket, not one pixel.
  if(!contactOffsets.has(label)){
   const sp=setup.findBone(bone).getAppliedPose();
   const geom=name=>{const slot=setup.findSlot(name),a=slot?.getAppliedPose().getAttachment();if(!(a instanceof MeshAttachment))return null;const v=new Float32Array(a.worldVerticesLength);a.computeWorldVertices(setup,slot,0,v.length,v,0,2);return {a,v};};
   const g0=geom(proximal),g1=geom(distal),r=label.includes('shoulder')?12:label==='collar'?4:8,det=sp.a*sp.d-sp.b*sp.c;
   const offsets=[[0,0],...(optional?[]:[[r,0],[-r,0],[0,r],[0,-r]])].filter(([x,y])=>x===0&&y===0||hit(g0,sp.worldX+x,sp.worldY+y)&&hit(g1,sp.worldX+x,sp.worldY+y)).map(([x,y])=>[(sp.d*x-sp.b*y)/det,(-sp.c*x+sp.a*y)/det]);
   if(!optional&&offsets.length<3)throw Error('Insufficient setup overlap patch: '+label);
   contactOffsets.set(label,offsets);
  }
  let failed=false;for(const [x,y] of contactOffsets.get(label)){seamSamples++;const wx=p.worldX+p.a*x+p.b*y,wy=p.worldY+p.c*x+p.d*y;if(!hit(geometry.get(proximal),wx,wy)||!hit(geometry.get(distal),wx,wy)){failed=true;seamFailures++;}}
  if(failed)openSeams.push(label);
 }
 totalFolded+=count;return {count,slots,openSeams,locations:locations.sort((a,b)=>a.ratio-b.ratio).slice(0,4)};
}
function player(name){const skeleton=new Skeleton(data),mix=new AnimationStateData(data);if(core.configureCharacterMixes)core.configureCharacterMixes(mix,data);else mix.defaultMix=.12;const state=new AnimationState(mix),entry=state.setAnimation(0,name,name.endsWith('_loop'));core.smoothCharacterEntry?.(entry);state.setAnimation(1,'breath',true);state.apply(skeleton);skeleton.updateWorldTransform(Physics.none);return {skeleton,state};}
function tick(p){p.state.update(1/60);p.skeleton.update(1/60);p.state.apply(p.skeleton);p.skeleton.updateWorldTransform(Physics.none);}
const quick=process.argv.includes('--quick'),selection=process.argv.find(a=>a.startsWith('--clips='))?.slice(8).split(',');
const clips=[],transitions=[],actions=data.animations.filter(a=>!['breath','idle','fg_idle'].includes(a.name));
for(const animation of data.animations){if(animation.name==='breath'||selection&&!selection.includes(animation.name))continue;
 const p=player(animation.name),n=Math.max(1,Math.ceil(animation.duration*60));let worst={count:0,openSeams:[]};
 for(let f=0;f<=n;f++){if(f)tick(p);const result=inspect(p.skeleton,true);if(result.count+result.openSeams.length>worst.count+worst.openSeams.length)worst={...result,time:+(f/60).toFixed(4)};}
 clips.push({name:animation.name,frames:n+1,worst});
}
const clipFrames=totalFrames,clipFolded=totalFolded;
for(const source of quick?[]:actions)for(const target of [...actions.map(a=>a.name),'idle','fg_idle']){
 const p=player(source.name);for(let n=0;n<Math.ceil(source.duration*.55*60);n++)tick(p);const entry=p.state.setAnimation(0,target,target.endsWith('_loop')||target.endsWith('idle'));core.smoothCharacterEntry?.(entry);let worst={count:0,openSeams:[]};
 const blendFrames=Math.ceil(Math.max(.24,entry.mixDuration+.10)*60);
 for(let f=0;f<=blendFrames;f++){if(f)tick(p);const r=inspect(p.skeleton,true);if(r.count+r.openSeams.length>worst.count+worst.openSeams.length)worst={...r,time:+(f/60).toFixed(4)};}
 if(worst.count||worst.openSeams.length)transitions.push({source:source.name,target,worst});
}
const mixFrames=totalFrames-clipFrames,runtimeStart=totalFrames,runtimeFailures=[];
for(const speed of quick?[]:[1,2.86]){
 const p=core.createCharacterPlayer(data);p.setFidgetsEnabled(false);
 for(const name of (app.includes('Purrfia')?['push_monocle','push_monocle_short','stamp_short','claim_turf','react_good','win_max','idle']:['encore_build','encore_call','turn_knob','encore_success','record_pull','record_hit','fg_trigger','win_max','idle'])){
  p.play(name,speed,name==='win_max');const d=name==='idle'?.7:data.findAnimation(name).duration/speed+(name==='win_max'?2:.1);
  for(let f=0;f<Math.ceil(d*60);f++){p.update(1/60);const r=inspect(p.skeleton,true);if(r.count||r.openSeams.length)runtimeFailures.push({speed,name,frame:f,count:r.count,openSeams:r.openSeams});}
 }p.destroy();
}
const report={app:path.basename(app),rigSha256:hash,playerSha256:coreHash,fps:60,contactFps:60,scope:'all opaque meshes and contacts; every clip, complete configured crossfade, actual player normal/turbo sequences',totalFrames,clipFrames,mixFrames,runtimeFrames:totalFrames-runtimeStart,totalFolded,clipFolded,mixFolded:totalFolded-clipFolded,minAreaRatio:+minRatio.toFixed(6),seamSamples,seamFailures,contactPatches:Object.fromEntries([...contactOffsets].map(([name,points])=>[name,points.length])),transitionPairs:quick?0:actions.length*(actions.length+2),runtimeScenarios:quick?0:2,clips,transitionFailures:transitions,runtimeFailures};
if(out){fs.mkdirSync(path.dirname(path.resolve(out)),{recursive:true});fs.writeFileSync(out,JSON.stringify(report,null,2));}
console.log(JSON.stringify({...report,clips:clips.filter(c=>c.worst.count||c.worst.openSeams.length).slice(0,6),transitionFailures:transitions.slice(0,3)},null,2));
if((totalFolded||seamFailures)&&!process.argv.includes('--record-baseline'))process.exitCode=1;
