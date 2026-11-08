import {FakeTexture} from '@esotericsoftware/spine-core';
import type {TextureAtlas,TextureAtlasPage} from '@esotericsoftware/spine-core';

export function bindResizedWinPage(page:TextureAtlasPage,decoded:{width:number;height:number}){
 if(decoded.width<=0||decoded.height<=0||Math.abs(decoded.width/decoded.height-page.width/page.height)>.001)throw Error(`Non-uniformly resized win atlas: ${page.name}`);
 // MeshAttachment uses getImage() dimensions for trim/rotation too. Keep all
 // skeleton arithmetic in export units; Pixi owns the actual decoded pixels.
 const bridge=new FakeTexture({width:page.width,height:page.height} as HTMLImageElement);
 page.setTexture(bridge);return bridge;
}

/** Unity resized these captured pages as whole images, not by padding. UVs
 * already use the logical atlas dimensions. Rescaling them to decoded pixel
 * dimensions samples neighbouring regions and tears the animated meshes. */
export function validateWinAtlas(atlas:TextureAtlas,decodedSizes?:Map<string,{width:number;height:number}>){
 for(const page of atlas.pages){
  const image=decodedSizes?.get(page.name)??page.texture?.getImage();
  if(!image||page.width<=0||page.height<=0||image.width<=0||image.height<=0)throw Error(`Invalid win atlas page: ${page.name}`);
  if(Math.abs(image.width/image.height-page.width/page.height)>.001)throw Error(`Non-uniformly resized win atlas: ${page.name}`);
  for(const region of page.regions)for(const value of [region.u,region.v,region.u2,region.v2]){
   if(!Number.isFinite(value)||value<0||value>1.000001)throw Error(`Invalid win atlas UV: ${region.name}`);
  }
 }
}
