// The cast that ships is the r12 revision: layers = Spine images, Spine JSON = runtime JSON,
// runtime atlas = the one design/cast_dragon/build_runtime.py packed (AGENTS.md: every stage
// must describe the same final revision). The r12 art folder lives outside the repo; when it
// is absent (another machine) only the in-repo half is checked.
import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
const app=new URL('../',import.meta.url);
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const manifest=JSON.parse(fs.readFileSync(new URL('design/cast_dragon/runtime-manifest.json',app),'utf8'));
const runtime={mg:'src/game/dragonKingData.json',fg:'src/game/dragonPrincessData.json'};
const atlasJson={mg:'src/game/dragonKingAtlas.json',fg:'src/game/dragonPrincessAtlas.json'};
const notes=[];
for(const kind of ['mg','fg']){
 const m=manifest[kind];
 assert.equal(sha(new URL(m.atlas,app)),m.atlasSha256,`${kind}: runtime atlas png is not the packed one`);
 assert.equal(sha(new URL(runtime[kind],app)),m.spineSha256,`${kind}: runtime rig JSON is not the packed Spine export`);
 const rig=JSON.parse(fs.readFileSync(new URL(runtime[kind],app),'utf8')),parts=JSON.parse(fs.readFileSync(new URL(atlasJson[kind],app),'utf8')).parts;
 assert.equal(rig.skeleton.spine.split('.').slice(0,2).join('.'),'4.3');
 const used=new Set(Object.values(rig.skins[0].attachments).flatMap(o=>Object.keys(o)));
 for(const name of used)assert.ok(parts[name],`${kind}: atlas misses ${name}`);
 for(const clip of ['idle','cast','ready','ready_loop','transform'])assert.ok(rig.animations[clip],`${kind}: ${clip}`);
 if(fs.existsSync(m.spine)){
  assert.equal(sha(m.spine),m.spineSha256,`${kind}: r12 Spine export changed after packing — rerun build_runtime.py`);
  const folder=new URL('./','file://'+m.spine),layers=new URL('../../'+kind+'/layers/','file://'+m.spine);
  const images=fs.readdirSync(new URL('images/',folder)).filter(f=>f.endsWith('.png'));
  assert.equal(images.length,m.layers,`${kind}: layer count`);
  for(const f of images)assert.equal(sha(new URL('images/'+f,folder)),sha(new URL(f,layers)),`${kind}: Spine image ≠ r12 layer ${f}`);
  notes.push(`${kind} ${images.length} layers = Spine images`);
 }else notes.push(`${kind} r12 art folder not on this machine (in-repo half only)`);
}
console.log(`Cast revision: runtime JSON + atlas = packed r12 export; ${notes.join('; ')}.`);
