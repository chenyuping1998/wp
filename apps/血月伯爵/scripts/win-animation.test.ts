import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import crypto from 'node:crypto';
import {TextureAtlas,FakeTexture,AtlasAttachmentLoader,SkeletonJson,Skeleton,AnimationState,AnimationStateData,VertexAttachment,MeshAttachment,RegionAttachment} from '@esotericsoftware/spine-core';
import {Texture} from 'pixi.js';
import {validateWinAtlas,bindResizedWinPage} from '../src/game/winSpineData.ts';
import {NativeWinRig} from '../src/game/winRig.ts';
import {winEnvelope,winMotion,winParticle} from '../src/game/winMotion.ts';
import {scoreAt,winDuration,celebrationStages} from '../src/game/presentation.ts';
const manifest=JSON.parse(fs.readFileSync(new URL('../src/game/winSpineAssets.json',import.meta.url),'utf8'));

test('all four original 4.1 rigs parse and produce finite animated mesh vertices',()=>{
 for(const stage of Object.values(manifest.stages) as any[]){
  const json=fs.readFileSync(new URL('../static'+stage.skeleton,import.meta.url));
  assert.equal(crypto.createHash('sha256').update(json).digest('hex'),stage.sha256.json,'the source skeleton was rewritten');
  const atlasBytes=fs.readFileSync(new URL('../static'+stage.atlas,import.meta.url));
  const imageBytes=fs.readFileSync(new URL('../static'+stage.atlas.replace(/\.atlas$/,'.png'),import.meta.url));
  assert.equal(crypto.createHash('sha256').update(atlasBytes).digest('hex'),stage.sha256.atlas);
  assert.equal(crypto.createHash('sha256').update(imageBytes).digest('hex'),stage.sha256.png);
  const atlas=new TextureAtlas(atlasBytes.toString('utf8'));
  for(const page of atlas.pages)bindResizedWinPage(page,{width:stage.imageSize[0],height:stage.imageSize[1]});
  const originalUvs=atlas.regions.map(r=>[r.u,r.v,r.u2,r.v2]);validateWinAtlas(atlas,new Map(atlas.pages.map(p=>[p.name,{width:stage.imageSize[0],height:stage.imageSize[1]}])));
  assert.deepEqual(atlas.regions.map(r=>[r.u,r.v,r.u2,r.v2]),originalUvs,'resized image pages must preserve exported logical UVs');
  for(const region of atlas.regions){assert.ok(Math.abs(region.u-region.x/region.page.width)<1e-12);assert.ok(Math.abs(region.v-region.y/region.page.height)<1e-12);}
  const data=new SkeletonJson(new AtlasAttachmentLoader(atlas)).readSkeletonData(JSON.parse(json.toString()));
  assert.ok(data.version?.startsWith('4.1.'));const animation=data.findAnimation(stage.animation);assert.ok(animation);
  assert.ok(Math.abs(animation.duration-stage.duration)<.001);
  const skeleton=new Skeleton(data),state=new AnimationState(new AnimationStateData(data));state.setAnimation(0,stage.animation,true);
  let meshes=0,moved=false,previousX:number[]=[];
  for(let frame=0;frame<90;frame++){
   state.update(stage.duration/90);state.apply(skeleton);skeleton.updateWorldTransform();
   for(const [i,bone] of skeleton.bones.entries()){assert.ok(Number.isFinite(bone.worldX)&&Number.isFinite(bone.worldY));if(frame&&Math.abs(bone.worldX-previousX[i])>.001)moved=true;previousX[i]=bone.worldX;}
   for(const slot of skeleton.slots){const attachment=slot.getAttachment();if(!(attachment instanceof VertexAttachment))continue;
    const vertices=new Float32Array(attachment.worldVerticesLength);attachment.computeWorldVertices(slot,0,vertices.length,vertices,0,2);assert.ok(vertices.every(Number.isFinite));meshes++;
   }
  }
  assert.ok(meshes>0&&moved,'the rig is static or its meshes are missing');atlas.dispose();
 }
});

test('native Pixi meshes preserve original deform vertices, UVs and draw order for every tier',()=>{
 for(const stage of Object.values(manifest.stages) as any[]){
  const atlas=new TextureAtlas(fs.readFileSync(new URL('../static'+stage.atlas,import.meta.url),'utf8')),textures=new Map();
  for(const page of atlas.pages){const bridge=bindResizedWinPage(page,{width:stage.imageSize[0],height:stage.imageSize[1]});textures.set(bridge,Texture.EMPTY);}
  validateWinAtlas(atlas);
  const data=new SkeletonJson(new AtlasAttachmentLoader(atlas)).readSkeletonData(JSON.parse(fs.readFileSync(new URL('../static'+stage.skeleton,import.meta.url),'utf8')));
  const rig=new NativeWinRig(data,stage.animation,textures);assert.ok(rig.meshCount>20);
  for(let i=0;i<90;i++){
   rig.sample('review',i*stage.duration*1000/90,.6);
   assert.equal(rig.view.alpha,.6);
   for(const [index,slot] of rig.skeleton.drawOrder.entries()){
    const node=rig.view.children[index];assert.equal(node.label,slot.data.name);
    const attachment=slot.getAttachment(),mesh=node.children.find((child:any)=>child.visible) as any;
    if(!slot.bone.active||!attachment||!(attachment instanceof MeshAttachment||attachment instanceof RegionAttachment)||slot.color.a*attachment.color.a<=0){assert.ok(!mesh);continue;}
    assert.ok(mesh,`visible attachment lost: ${slot.data.name}`);
    assert.deepEqual([...mesh.geometry.uvs],Array.from(new Float32Array(attachment.uvs)));
    const expected=new Float32Array(mesh.geometry.positions.length);
    if(attachment instanceof MeshAttachment)attachment.computeWorldVertices(slot,0,expected.length,expected,0,2);else attachment.computeWorldVertices(slot,expected,0,2);
    assert.deepEqual(mesh.geometry.positions,expected);assert.ok(expected.every(Number.isFinite));
    for(const uv of mesh.geometry.uvs)assert.ok(Number.isFinite(uv)&&uv>=0&&uv<=1.000001,'mesh samples outside its atlas');
   }
  }
  rig.sample('new-presentation',0);assert.equal(rig.view.alpha,1);
  const ownedBuffers=rig.view.children.flatMap(node=>node.children.flatMap((mesh:any)=>mesh.geometry.buffers));
  rig.destroy();for(const buffer of ownedBuffers)assert.equal(buffer.destroyed,true,'owned mesh buffer leaked');atlas.dispose();
 }
});

test('resized Super atlas samples its own background without leaking neighbouring pixels',()=>{
 const stage=manifest.stages.super,atlas=new TextureAtlas(fs.readFileSync(new URL('../static'+stage.atlas,import.meta.url),'utf8'));
 assert.equal(atlas.pages[0].width,1928);assert.equal(stage.imageSize[0],2048);
 bindResizedWinPage(atlas.pages[0],{width:2048,height:2048});
 const data=new SkeletonJson(new AtlasAttachmentLoader(atlas)).readSkeletonData(JSON.parse(fs.readFileSync(new URL('../static'+stage.skeleton,import.meta.url),'utf8')));
 const bg=data.skins.flatMap(s=>s.getAttachments()).map(e=>e.attachment).find((a:any)=>a.path==='C_Bkg') as MeshAttachment;
 assert.ok(bg);const xs=Array.from(bg.uvs).filter((_,i)=>i%2===0),ys=Array.from(bg.uvs).filter((_,i)=>i%2===1);
 assert.ok(Math.abs(Math.min(...xs)-1320/1928)<1e-6);
 assert.ok(Math.abs(Math.max(...xs)-1926/1928)<1e-6);
 assert.ok(Math.abs(Math.min(...ys)-927/1928)<1e-6);
 assert.ok(Math.abs(Math.max(...ys)-1266/1928)<1e-6);
 assert.throws(()=>bindResizedWinPage(atlas.pages[0],{width:2048,height:1024}),/Non-uniformly/);
 atlas.dispose();
});

test('tier changes land on the corresponding score threshold in normal and Turbo',()=>{
 const thresholds={big:2000,super:5000,mega:10000,epic:20000};
 for(const payout of [2000,4999,5000,9999,10000,19880,20000,49600])for(const turbo of [false,true]){
  const duration=winDuration(payout,turbo),stages=celebrationStages(payout,duration);
  for(const stage of stages.slice(1))assert.equal(scoreAt(payout,payout,1,stage.at,duration),thresholds[stage.tier]);
  assert.equal(scoreAt(payout,payout,1,duration-520,duration),payout);
  assert.equal(winEnvelope(0,duration),0);assert.equal(winEnvelope(duration,duration),0);
 }
});

test('directed title and particle motion settles and never emits invalid geometry',()=>{
 for(let age=-320;age<=5000;age+=7){
  const motion=winMotion(age,age+320,11800);
  assert.ok(Object.values(motion).every(Number.isFinite));assert.ok(motion.alpha>=0&&motion.alpha<=1);
  for(let i=0;i<48;i++){const p=winParticle(i,age);if(p){assert.ok(Object.values(p).every(Number.isFinite));assert.ok(p.alpha>=0&&p.alpha<=1);}}
 }
 const settled=winMotion(2500,3000,11800);assert.ok(Math.abs(settled.titleY+86)<.01);assert.ok(Math.abs(settled.scaleX-1)<.001);
 const reduced=winMotion(400,720,11800,true);assert.equal(reduced.shake,0);assert.equal(reduced.scaleX,1);assert.equal(reduced.scaleY,1);
});
