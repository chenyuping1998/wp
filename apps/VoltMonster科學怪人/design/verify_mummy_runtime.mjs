import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { core42 } from '../../../tools/mascot-rig/lib/kit.ts';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const c=await core42();
const dir=path.join(root,'static/assets/spines/mummyCat');
const atlasText=fs.readFileSync(path.join(dir,'mummyCat.atlas'),'utf8');
const atlas=new c.TextureAtlas(atlasText);
for(const p of atlas.pages)if(!fs.existsSync(path.join(dir,p.name)))throw new Error(`atlas page missing:${p.name}`);
const json=JSON.parse(fs.readFileSync(path.join(dir,'mummyCat.json'),'utf8'));
const data=new c.SkeletonJson(new c.AtlasAttachmentLoader(atlas)).readSkeletonData(json);
const skeleton=new c.Skeleton(data);const state=new c.AnimationState(new c.AnimationStateData(data));
const expressions=['head_idle','head_blink','head_laugh','head_talk'];
const events=[];state.addListener({event:(_e,event)=>events.push(event.data.name)});
let frames=0;
for(const animation of data.animations){
 state.setAnimation(0,animation.name,false);
 for(let t=0;t<animation.duration+.05;t+=1/60){
  state.update(1/60);state.apply(skeleton);skeleton.setAttachment('head',expressions[frames%expressions.length]);skeleton.updateWorldTransform(c.Physics.update);
  for(const b of skeleton.bones)if(!Number.isFinite(b.worldX+b.worldY))throw new Error(`nonfinite bone:${b.data.name}`);
  const att=skeleton.findSlot('head').getAttachment(),verts=new Float32Array(att.worldVerticesLength);
  att.computeWorldVertices(skeleton.findSlot('head'),0,att.worldVerticesLength,verts,0,2);
  if(!verts.every(Number.isFinite))throw new Error('nonfinite expression mesh');frames++;
 }
}
for(const cue of ['release','takeoff','land'])if(!events.includes(cue))throw new Error(`missing motion event:${cue}`);
const assets=fs.readFileSync(path.join(root,'src/game/assets.ts'),'utf8');
for(const key of ['mummyArch','mummyPlate','mummyButton','mummySunRing','mummySunNeedle','mummySunHub','mummyBandage','mummyBaseProps','gbH3Glow'])if(!new RegExp(`\\b${key}:`).test(assets))throw new Error(`missing runtime key:${key}`);
const result={passed:true,frames,animations:data.animations.map(a=>a.name),expressions,events,atlasPages:atlas.pages.map(p=>p.name)};
fs.writeFileSync(path.join(root,'design/source/mummy_delivery/runtime_verification.json'),JSON.stringify(result,null,2));console.log(result);
