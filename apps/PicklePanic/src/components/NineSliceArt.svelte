<script lang="ts">
 import {getContextApp,getContextParent} from 'pixi-svelte';
 import {NineSliceSprite,Container,Texture} from 'pixi.js';
 const props:{assetKey:string;x?:number;y?:number;width:number;height:number;inset?:number;top?:number;bottom?:number;anchor?:number}=$props();
 const app=getContextApp(),parent=getContextParent();
 $effect(()=>{
  const texture=app.stateApp.loadedAssets?.[props.assetKey] as Texture|undefined;if(!texture)return;
  const scale=props.height/texture.height,root=new Container();root.position.set(props.x??0,props.y??0);root.scale.set(scale);
  const plate=new NineSliceSprite({texture,width:props.width/scale,height:texture.height,leftWidth:props.inset??64,rightWidth:props.inset??64,topHeight:props.top??64,bottomHeight:props.bottom??64,anchor:props.anchor??0});
  root.addChild(plate);parent.parent.addChildAt(root,0);return()=>{root.removeFromParent();root.destroy({children:true});};
 });
</script>
