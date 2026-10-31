import {Container,Mesh,MeshGeometry,type Texture} from 'pixi.js';
import {MeshAttachment,type TextureAtlasRegion} from '@esotericsoftware/spine-core';
import {parseCharacterRig,createCharacterPlayer} from './characterRigCore';
import rig from './characterRigData.json';import atlasText from './characterRigAtlas.txt?raw';
export function createCharacterScene(pages:Record<string,Texture>){
 const {data,atlas}=parseCharacterRig(rig,atlasText),player=createCharacterPlayer(data),root=new Container();
 root.eventMode='none';root.sortableChildren=true;root.label='Original Spine 4.3 character';
 const cache=new Map<MeshAttachment,{mesh:Mesh;geometry:MeshGeometry;positions:Float32Array;world:Float32Array}>();
 let portrait=false,disposed=false;
 function update(seconds:number){if(disposed)return;player.update(seconds);for(const item of cache.values())item.mesh.visible=false;
  for(const [index,slot] of player.skeleton.drawOrder.appliedPose.entries()){
   if(portrait&&['sofa_back','booth','tail'].includes(slot.data.name))continue;
   const pose=slot.getAppliedPose(),attachment=pose.getAttachment();if(!(attachment instanceof MeshAttachment))continue;
   const seq=attachment.sequence.resolveIndex(pose),region=attachment.sequence.regions[seq] as TextureAtlasRegion;
   let item=cache.get(attachment);if(!item){const positions=new Float32Array(attachment.worldVerticesLength),world=new Float32Array(positions.length),geometry=new MeshGeometry({positions,uvs:new Float32Array(attachment.sequence.getUVs(seq)),indices:new Uint32Array(attachment.triangles)});
    const texture=pages[region.page.name];if(!texture)throw Error('Character atlas missing '+region.page.name);const mesh=new Mesh({geometry,texture});root.addChild(mesh);item={mesh,geometry,positions,world};cache.set(attachment,item);
   }
   attachment.computeWorldVertices(player.skeleton,slot,0,attachment.worldVerticesLength,item.world,0,2);
   for(let i=0;i<item.positions.length;i+=2){item.positions[i]=item.world[i];item.positions[i+1]=-item.world[i+1];}
   item.geometry.getBuffer('aPosition').update();item.mesh.visible=pose.color.a>.001;item.mesh.alpha=pose.color.a*attachment.color.a;item.mesh.zIndex=index;
  }root.sortChildren();
 }update(0);return {root,player,update,setPortrait(value:boolean){portrait=value;},destroy(){if(disposed)return;disposed=true;player.destroy();root.destroy({children:true});for(const item of cache.values())item.geometry.destroy();cache.clear();atlas.dispose();}};
}
