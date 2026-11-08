import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {core42} from '../../../tools/mascot-rig/lib/kit.ts';
const dir=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../static/assets/spines/voltMonster');
const c=await core42(),json=JSON.parse(fs.readFileSync(path.join(dir,'voltMonster.json'),'utf8'));
const atlas=new c.TextureAtlas(fs.readFileSync(path.join(dir,'voltMonster.atlas'),'utf8'));
const data=new c.SkeletonJson(new c.AtlasAttachmentLoader(atlas)).readSkeletonData(json);
const skeleton=new c.Skeleton(data);skeleton.setToSetupPose();skeleton.updateWorldTransform(c.Physics.update);
const head=skeleton.findBone('head'),info=JSON.parse(fs.readFileSync(path.join(dir,'hair_region.json'),'utf8'));
const point=new c.Vector2((info.canvasCenter[0]-info.ground[0])*info.scale,(info.ground[1]-info.canvasCenter[1])*info.scale);
head.worldToLocal(point);
json.slots.push({name:'hair',bone:'head',attachment:'hair'});
json.skins[0].attachments.hair=Object.fromEntries(['hair','hair_zap'].map(name=>[name,{type:'region',path:name,x:point.x,y:point.y,width:info.size[0],height:info.size[1],rotation:-Math.atan2(head.c,head.a)*180/Math.PI}]));
fs.writeFileSync(path.join(dir,'voltMonster.json'),JSON.stringify(json));
const finalData=new c.SkeletonJson(new c.AtlasAttachmentLoader(atlas)).readSkeletonData(json);
const finalSk=new c.Skeleton(finalData),state=new c.AnimationState(new c.AnimationStateData(finalData));let frames=0;
for(const animation of finalData.animations){
 state.setAnimation(0,animation.name,false);
 for(let t=0;t<animation.duration;t+=1/60){
  state.update(1/60);state.apply(finalSk);
  finalSk.setAttachment('head',['head_idle','head_blink','head_laugh','head_zap'][frames%4]);
  finalSk.setAttachment('hair',frames%2?'hair':'hair_zap');finalSk.updateWorldTransform(c.Physics.update);
  for(const bone of finalSk.bones)if(!Number.isFinite(bone.worldX+bone.worldY))throw new Error(`Nonfinite bone ${bone.data.name}`);
  frames++;
 }
}
const result={passed:true,frames,animations:finalData.animations.map(a=>a.name),faces:4,hairAttachments:2};
fs.writeFileSync(path.resolve(dir,'../../../../design/source/volt_delivery/mascot_runtime_verification.json'),JSON.stringify(result,null,2));
console.log(result);
