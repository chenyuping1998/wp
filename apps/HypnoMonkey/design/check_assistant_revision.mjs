import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
const app=new URL('../',import.meta.url),root=new URL('design/cast_fg/',app);
const read=p=>JSON.parse(fs.readFileSync(new URL(p,root),'utf8'));
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const source=read('source-manifest.json'),runtime=read('runtime-manifest.json'),preview=read('qa/preview-source-manifest.json');
const data=new URL('src/game/hypnoAssistantData.json',app),spine=new URL('cast_fg_spine/cast_fg.json',root);
assert.equal(sha(data),sha(spine),'runtime and authoring JSON differ');
assert.equal(sha(data),runtime.runtimeSpineSha256);
assert.equal(sha(new URL('static/assets/sprites/hypnoCast/fg-atlas.png',app)),runtime.atlasSha256);
for(const [name,digest] of Object.entries(source.layers)){
 assert.equal(sha(new URL('layers/'+name,root)),digest,`source changed: ${name}`);
 assert.equal(sha(new URL('cast_fg_spine/images/'+name,root)),digest,`Spine image differs: ${name}`);
 assert.equal(runtime.crops[name.slice(0,-4)].sourceSha256,digest,`crop differs: ${name}`);
 assert.equal(preview['layers/'+name],digest,`preview is stale: ${name}`);
}
assert.equal(preview['cast_fg_spine/cast_fg.json'],sha(spine));
const rig=JSON.parse(fs.readFileSync(data,'utf8'));
for(const name of ['idle','idle_fidget','gaze','react_small','gaze_dud','win_big','win_big_loop','win_big_end','fg_trigger','fg_end'])assert.ok(rig.animations[name],name);
assert.equal(rig.animations.gaze.events.find(e=>e.name==='throw').time,.62);
console.log(`Assistant revision: ${Object.keys(source.layers).length} source layers, Spine images, runtime crops and preview agree; ten clips and 620ms release present.`);
