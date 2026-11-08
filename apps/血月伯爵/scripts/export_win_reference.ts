/** Offline geometry review. This does not launch or control a browser. */
import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';
import {TextureAtlas,FakeTexture,SkeletonJson,AtlasAttachmentLoader} from '@esotericsoftware/spine-core';
import {Texture} from 'pixi.js';
import {NativeWinRig} from '../src/game/winRig.ts';
import {bindResizedWinPage} from '../src/game/winSpineData.ts';
const app=fileURLToPath(new URL('../',import.meta.url)),output=path.resolve(process.argv[2]??'E:/stake/tmp/bloodmoon-native-reference');
fs.mkdirSync(output,{recursive:true});
const manifest=JSON.parse(fs.readFileSync(path.join(app,'src/game/winSpineAssets.json'),'utf8'));
const result:any={kind:'offline-native-mesh-reference',width:1280,height:780,origin:[640,440],frames:[],profiles:[]};
for(const [tier,stage] of Object.entries(manifest.stages) as [string,any][]){
 for(const legacy of [true,false]){
  const atlas=new TextureAtlas(fs.readFileSync(path.join(app,'static',stage.atlas),'utf8')),textures=new Map(),pageFiles=new Map();
  for(const page of atlas.pages){
   let bridge;
   if(legacy){
    bridge=new FakeTexture({width:stage.imageSize[0],height:stage.imageSize[1]} as any);page.setTexture(bridge);
    const x=page.width/stage.imageSize[0],y=page.height/stage.imageSize[1];
    for(const r of page.regions){r.u*=x;r.u2*=x;r.v*=y;r.v2*=y;}page.width=stage.imageSize[0];page.height=stage.imageSize[1];
   }else bridge=bindResizedWinPage(page,{width:stage.imageSize[0],height:stage.imageSize[1]});
   textures.set(bridge,Texture.EMPTY);
   pageFiles.set(page.name,path.join(app,'static',stage.atlas.slice(0,stage.atlas.lastIndexOf('/')+1),page.name));
  }
  const data=new SkeletonJson(new AtlasAttachmentLoader(atlas)).readSkeletonData(JSON.parse(fs.readFileSync(path.join(app,'static',stage.skeleton),'utf8')));
  const rig=new NativeWinRig(data,stage.animation,textures);rig.sample('reference',1400);
  const meshes=[];
  for(const slotView of rig.view.children)for(const child of slotView.children){
   const mesh=child as any;if(!mesh.visible)continue;
   const slot=rig.skeleton.slots.find(s=>s.data.name===slotView.label)!,attachment=slot.getAttachment() as any;
   meshes.push({name:slotView.label,vertices:Array.from(mesh.geometry.positions),uvs:Array.from(mesh.geometry.uvs),indices:Array.from(mesh.geometry.indices),alpha:mesh.alpha,tint:mesh.tint,blend:mesh.blendMode,texture:pageFiles.get(attachment.region.page.name)});
  }
  result.frames.push({tier,legacy,meshes,clip:legacy?[128,15,1152,655]:null});
  if(!legacy){
   const times:number[]=[];
   for(let i=0;i<360;i++){const start=performance.now();rig.sample('benchmark',i*stage.duration*1000/360);times.push(performance.now()-start);}
   times.sort((a,b)=>a-b);
   result.profiles.push({tier,meshCount:rig.meshCount,poseCpuMedianMs:times[180],poseCpuP95Ms:times[342],sampleCount:360,removedCanvasTransferBytesPerFrame:1024*640*4,note:'CPU pose/mesh updates only. Not a GPU or device FPS benchmark.'});
  }
  rig.destroy();atlas.dispose();
 }
}
fs.writeFileSync(path.join(output,'geometry.json'),JSON.stringify(result));
fs.writeFileSync(path.join(output,'cpu-profile.json'),JSON.stringify(result.profiles,null,2)+'\n');
console.log(JSON.stringify({output,profiles:result.profiles}));
