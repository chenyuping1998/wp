import fs from 'node:fs';
import * as S from '../../../node_modules/.pnpm/@esotericsoftware+spine-core@4.2.74/node_modules/@esotericsoftware/spine-core/dist/index.js';
const reports={};
for(const folder of ['pickleBoss','picklePepper']){
 const raw=JSON.parse(fs.readFileSync(`static/assets/spines/${folder}/cast.json`));
 const all=Object.assign({},...Object.values(raw.skins[0].attachments));
 const loader={newRegionAttachment(_skin,name){const a=new S.RegionAttachment(name),m=all[name];a.region={width:m.width,height:m.height,originalWidth:m.width,originalHeight:m.height,offsetX:0,offsetY:0,degrees:0,u:0,v:0,u2:1,v2:1};return a;},newMeshAttachment(_skin,name){return new S.MeshAttachment(name);},newBoundingBoxAttachment(){return null;},newPathAttachment(){return null;},newPointAttachment(){return null;},newClippingAttachment(){return null;}};
 const data=new S.SkeletonJson(loader).readSkeletonData(raw),skeleton=new S.Skeleton(data);
 const report={bones:data.bones.length,animations:{}};
 for(const name of ['bigwin_cheer','bigwin_hold','fs_trigger','upgrade_slam']){
  const anim=data.findAnimation(name);let left=0,right=0,top=0,bottom=0;const hits=[];
  for(let t=0;t<=anim.duration+.001;t+=1/60){skeleton.setToSetupPose();anim.apply(skeleton,0,t,false,[],1,S.MixBlend.replace,S.MixDirection.mixIn);skeleton.updateWorldTransform(S.Physics.update);
   for(const slot of skeleton.slots){const a=slot.getAttachment();if(!a||slot.color.a<.01)continue;let verts;
    if(a instanceof S.MeshAttachment){verts=new Float32Array(a.worldVerticesLength);a.computeWorldVertices(slot,0,a.worldVerticesLength,verts,0,2);}
    else if(a instanceof S.RegionAttachment){verts=new Float32Array(8);a.computeWorldVertices(slot,verts,0,2);}else continue;
    for(let i=0;i<verts.length;i+=2){left=Math.min(left,verts[i]);right=Math.max(right,verts[i]);top=Math.max(top,verts[i+1]);bottom=Math.min(bottom,verts[i+1]);}
   }
  }
  const hitTime=name==='upgrade_slam'?.4:name==='fs_trigger'?.47:null;
  if(hitTime!==null){skeleton.setToSetupPose();anim.apply(skeleton,0,hitTime,false,[],1,S.MixBlend.replace,S.MixDirection.mixIn);skeleton.updateWorldTransform(S.Physics.update);const b=skeleton.findBone('armL_hand');hits.push({time:hitTime,bone:'armL_hand',x:b.worldX,y:b.worldY});}
  report.animations[name]={duration:anim.duration,bounds:{left,right,top,bottom},hits};
  for(const [bone,track]of Object.entries(raw.animations[name].bones)){const limit=['armL','armR'].includes(bone)?26:['armL_fore','armR_fore'].includes(bone)?22:Infinity;for(const k of track.rotate||[])if(Math.abs(k.value)>limit)throw new Error(`${folder} ${name} ${bone} exceeds budget`);}
 }
 reports[folder]=report;
}
fs.writeFileSync('design/source/production_v2/cast/measured_motion.json',JSON.stringify(reports,null,2));console.log(JSON.stringify(reports));
