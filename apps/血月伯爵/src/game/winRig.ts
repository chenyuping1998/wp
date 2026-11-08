import {Skeleton,AnimationState,AnimationStateData,MeshAttachment,RegionAttachment,ClippingAttachment} from '@esotericsoftware/spine-core';
import type {SkeletonData,Attachment,TextureRegion,Texture as SpineTexture} from '@esotericsoftware/spine-core';
import {Container,Mesh,MeshGeometry,Texture} from 'pixi.js';

type Drawable=MeshAttachment|RegionAttachment;
type Part={attachment:Drawable;mesh:Mesh;geometry:MeshGeometry;region:TextureRegion|null};
const quad=new Uint32Array([0,1,2,2,3,0]);
const modes=['normal','add','multiply','screen'] as const;

/** The original Spine 4.1 bones, paths and deform curves feed native Pixi 8
 * meshes. No extra WebGL context, canvas readback/upload or clipping rectangle. */
export class NativeWinRig{
 readonly view=new Container();
 readonly skeleton:Skeleton;
 readonly state:AnimationState;
 private slotViews:Container[];
 private parts=new Map<Attachment,Part>();
 private previous=new Map<number,Part>();
 private id='';private time=0;
 private animation:string;
 private textures:Map<SpineTexture,Texture>;
 constructor(data:SkeletonData,animation:string,textures:Map<SpineTexture,Texture>){
  this.view.eventMode='none';
  this.animation=animation;this.textures=textures;this.skeleton=new Skeleton(data);this.state=new AnimationState(new AnimationStateData(data));
  this.slotViews=this.skeleton.slots.map(slot=>{
   if(slot.darkColor)throw Error('Win rig unexpectedly requires two-colour tint');
   const node=new Container({label:slot.data.name});this.view.addChild(node);return node;
  });
  for(const skin of data.skins)for(const entry of skin.getAttachments()){
   const attachment=entry.attachment;
   if(attachment instanceof ClippingAttachment)throw Error('Win rig unexpectedly requires clipping');
   if(!(attachment instanceof MeshAttachment||attachment instanceof RegionAttachment)||this.parts.has(attachment))continue;
   attachment.sequence?.apply(this.skeleton.slots[entry.slotIndex],attachment);
   const region=attachment.region,texture=region&&textures.get(region.texture);
   if(!texture)throw Error(`Missing native win texture: ${attachment.name}`);
   const geometry=new MeshGeometry({
    positions:new Float32Array(attachment instanceof MeshAttachment?attachment.worldVerticesLength:8),
    uvs:new Float32Array(attachment.uvs),
    indices:attachment instanceof MeshAttachment?new Uint32Array(attachment.triangles):quad.slice(),
   });
   geometry.batchMode='batch';
   const mesh=new Mesh({geometry,texture});mesh.visible=false;mesh.blendMode=modes[data.slots[entry.slotIndex].blendMode];
   this.slotViews[entry.slotIndex].addChild(mesh);this.parts.set(attachment,{attachment,geometry,mesh,region});
  }
  this.view.scale.y=-1;this.view.y=90;
 }
 sample(id:string,milliseconds:number,alpha=1){
  const time=Math.max(0,milliseconds)/1000;
  if(this.id!==id||time<this.time){
   this.skeleton.setToSetupPose();this.state.clearTracks();this.state.setAnimation(0,this.animation,true);this.id=id;this.time=0;
  }
  this.state.update(time-this.time);this.state.apply(this.skeleton);this.skeleton.updateWorldTransform();this.time=time;this.view.alpha=alpha;
  const sc=this.skeleton.color;
  for(const [order,slot] of this.skeleton.drawOrder.entries()){
   const slotView=this.slotViews[slot.data.index];
   if(this.view.children[order]!==slotView)this.view.setChildIndex(slotView,order);
   const attachment=slot.getAttachment(),part=attachment&&this.parts.get(attachment),prior=this.previous.get(slot.data.index);
   if(prior&&prior!==part)prior.mesh.visible=false;
   if(!part||!slot.bone.active){if(prior)prior.mesh.visible=false;this.previous.delete(slot.data.index);continue;}
   this.previous.set(slot.data.index,part);
   const a=sc.a*slot.color.a*part.attachment.color.a;
   part.mesh.visible=a>0;part.mesh.alpha=a;if(a<=0)continue;
   const ac=part.attachment.color,byte=(v:number)=>Math.max(0,Math.min(255,Math.round(v*255)));
   part.mesh.tint=(byte(sc.r*slot.color.r*ac.r)<<16)|(byte(sc.g*slot.color.g*ac.g)<<8)|byte(sc.b*slot.color.b*ac.b);
   const vertices=part.geometry.positions;
   if(part.attachment instanceof MeshAttachment)part.attachment.computeWorldVertices(slot,0,vertices.length,vertices,0,2);
   else part.attachment.computeWorldVertices(slot,vertices,0,2);
   part.geometry.getBuffer('aPosition').update();
   // Original bat/FX sequences change atlas region while retaining the same
   // attachment. Positions alone are not enough: update that mesh's UVs too.
   if(part.region!==part.attachment.region){
    part.region=part.attachment.region;
    part.geometry.uvs.set(part.attachment.uvs);part.geometry.getBuffer('aUV').update();
    part.mesh.texture=this.textures.get(part.region!.texture)!;
   }
  }
 }
 get meshCount(){return this.parts.size;}
 destroy(){
  this.view.destroy({children:true});
  for(const part of this.parts.values())part.geometry.destroy(true);
  this.parts.clear();this.previous.clear();
 }
}
