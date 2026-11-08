import {TextureAtlas,AtlasAttachmentLoader,SkeletonJson} from '@esotericsoftware/spine-core';
import type {Texture as SpineTexture} from '@esotericsoftware/spine-core';
import {Assets,Container,Texture} from 'pixi.js';
import manifest from './winSpineAssets.json';
import {validateWinAtlas,bindResizedWinPage} from './winSpineData';
import {NativeWinRig} from './winRig';

type Tier=keyof typeof manifest.stages;
export type WinRigLayer={tier:Tier;id:string;time:number;alpha:number};
let markReady:(ready:boolean)=>void;
export const winSceneReady=new Promise<boolean>(resolve=>{markReady=resolve;});
export function markWinSceneReady(ready:boolean){markReady(ready);}

export class WinSpineRenderer{
 readonly view=new Container();
 private rigs=new Map<Tier,NativeWinRig>();
 private urls=new Set<string>();
 private disposed=false;
 static async create(resolve:(path:string)=>string,upload?:(texture:Texture)=>void){
  const instance=new WinSpineRenderer();
  try{
   const results=await Promise.allSettled(Object.entries(manifest.stages).map(async([tier,stage])=>{
    const [jsonResponse,atlasResponse]=await Promise.all([fetch(resolve(stage.skeleton)),fetch(resolve(stage.atlas))]);
    if(!jsonResponse.ok||!atlasResponse.ok)throw Error(`Win scene failed to load: ${tier}`);
    const [json,atlasText]=await Promise.all([jsonResponse.json(),atlasResponse.text()]);
    const atlas=new TextureAtlas(atlasText),textures=new Map<SpineTexture,Texture>(),decodedSizes=new Map();
    await Promise.all(atlas.pages.map(async page=>{
     const path=stage.atlas.slice(0,stage.atlas.lastIndexOf('/')+1)+page.name,url=resolve(path);instance.urls.add(url);
     const alphaMode=page.pma?'premultiplied-alpha':'premultiply-alpha-on-upload';
     const texture=await Assets.load<Texture>({src:url,data:{alphaMode}});
     // Source PNGs are already PMA. Multiplying again darkens smoke and edges.
     texture.source.alphaMode=alphaMode;
     // Four shared atlas pages are uploaded once while the scene loads, not
     // copied through a second rendering context during every animation frame.
     upload?.(texture);
     decodedSizes.set(page.name,{width:texture.source.pixelWidth,height:texture.source.pixelHeight});
     // MeshAttachment also uses getImage() dimensions to apply trim/rotation.
     // All atlas arithmetic must stay in logical export units; the main Pixi
     // texture separately retains the actual 2048² decoded page.
     const bridge=bindResizedWinPage(page,{width:texture.source.pixelWidth,height:texture.source.pixelHeight});textures.set(bridge,texture);
    }));
    validateWinAtlas(atlas,decodedSizes);
    const data=new SkeletonJson(new AtlasAttachmentLoader(atlas)).readSkeletonData(json);
    if(!data.version?.startsWith('4.1.'))throw Error(`Unexpected win rig version: ${data.version}`);
    instance.rigs.set(tier as Tier,new NativeWinRig(data,stage.animation,textures));
   }));
   for(const result of results)if(result.status==='rejected')throw result.reason;
   for(const tier of ['big','super','mega','epic'] as Tier[]){const rig=instance.rigs.get(tier)!;rig.view.visible=false;instance.view.addChild(rig.view);}
   return instance;
  }catch(error){instance.destroy();throw error;}
 }
 draw(layers:WinRigLayer[]){
  if(this.disposed)return;
  for(const rig of this.rigs.values())rig.view.visible=false;
  for(const layer of layers){
   if(layer.alpha<=0)continue;
   const rig=this.rigs.get(layer.tier);if(!rig)continue;
   rig.sample(layer.id,layer.time,layer.alpha);rig.view.visible=true;
  }
 }
 destroy(){
  if(this.disposed)return;this.disposed=true;
  for(const rig of this.rigs.values())rig.destroy();this.rigs.clear();this.view.destroy();
  for(const url of this.urls)void Assets.unload(url).catch(()=>{});this.urls.clear();
 }
}
