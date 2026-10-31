import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import assert from 'node:assert/strict';
import {AnimationState,AnimationStateData,AtlasAttachmentLoader,FakeTexture,MeshAttachment,Physics,Skeleton,SkeletonJson,TextureAtlas} from '@esotericsoftware/spine-core';
const raw=JSON.parse(fs.readFileSync(new URL('../src/game/characterRigData.json',import.meta.url),'utf8'));
const source=fs.readFileSync(new URL('../src/game/characterRigAtlas.txt',import.meta.url),'utf8');
const atlas=new TextureAtlas(source);for(const page of atlas.pages)page.setTexture(new FakeTexture({width:page.width,height:page.height}));
const data=new SkeletonJson(new AtlasAttachmentLoader(atlas)).readSkeletonData(raw);
let frames=0,vertices=0;
for(const clip of data.animations){const skeleton=new Skeleton(data),state=new AnimationState(new AnimationStateData(data));state.setAnimation(0,clip.name,false);
 for(let tick=0;tick<=Math.ceil(clip.duration*30);tick++){state.update(1/30);skeleton.update(1/30);state.apply(skeleton);skeleton.updateWorldTransform(Physics.none);
  for(const slot of skeleton.drawOrder.appliedPose){const attachment=slot.getAppliedPose().getAttachment();if(!(attachment instanceof MeshAttachment))continue;const points=new Float32Array(attachment.worldVerticesLength);attachment.computeWorldVertices(skeleton,slot,0,points.length,points,0,2);assert(points.every(v=>Number.isFinite(v)&&Math.abs(v)<5000),`${clip.name} has invalid vertices`);vertices+=points.length/2;}frames++;
 }
}
assert(raw.bones.length>=25);assert(atlas.pages.length>0);console.log(`Original Spine 4.3 cast: ${data.animations.length} clips, ${frames} sampled frames, ${vertices} finite mesh vertices, ${atlas.pages.length} atlas pages.`);
// Finite vertices can still form inverted triangles and detached cuffs.
const appRoot=fileURLToPath(new URL('../',import.meta.url));
const anatomy=spawnSync(process.execPath,[path.resolve(appRoot,'../../tools/check_new_game_anatomy.mjs'),appRoot,path.join(appRoot,'design/source/purrfia/cast/anatomy-validation.json')],{stdio:'inherit'});
assert.equal(anatomy.status,0,'Character anatomy or crossfade validation failed');
const flow=spawnSync(process.execPath,[path.resolve(appRoot,'../../tools/check_new_game_flow.mjs'),appRoot,path.join(appRoot,'design/source/purrfia/cast/motion-flow-validation.json')],{stdio:'inherit'});
assert.equal(flow.status,0,'Character continuity or wrist speed regression failed');
