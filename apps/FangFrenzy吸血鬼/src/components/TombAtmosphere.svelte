<script lang="ts">
 /** Native cut meshes driven by one plate-space draught; no camera drift. */
 import {Container,Sprite} from 'pixi-svelte';
 import {Container as PixiContainer,Mesh,MeshGeometry,Sprite as PixiSprite,type Texture} from 'pixi.js';
 import {getContextApp,getContextParent} from 'pixi-svelte';
 import {onMount} from 'svelte';
 import {getContext} from '../game/context';
 import {BG_MOTION_PARTS,type BgPart} from '../game/bgMotionParts';
 import {partGrid,linenVertices,flameVertices,fireEnergy} from '../game/mummyAmbienceMotion';
 import {LIVING_LINEN} from '../game/livingLinen';
 const {mode,x,y,width,height,active=true}:{mode:'base'|'feature'|'hold';x:number;y:number;width:number;height:number;active?:boolean}=$props();
 const app=getContextApp(),parent=getContextParent(),context=getContext();
 const keys={base:'mummyBaseProps',feature:'mummyFeatureProps',hold:'mummyHoldProps'} as const;
 let winStarted=-1;
 context.eventEmitter.subscribeOnMount({winLinesShow:()=>{winStarted=performance.now();}});
 onMount(()=>{
  const root=new PixiContainer();root.label=`mummy ${mode} atmosphere`;parent.parent.addChild(root);
  const assets=app.stateApp.loadedAssets??{},parts=BG_MOTION_PARTS[mode];
  const meshes:Array<{p:BgPart;grid:ReturnType<typeof partGrid>;geometry:MeshGeometry;mesh:Mesh;fire:boolean}>=[];
  for(const [list,fire] of [[(parts.linen??[]).concat(LIVING_LINEN[mode]),false],[parts.flames,true]] as const){
   for(const p of list){
    const texture=assets[p.key] as Texture|undefined;if(!texture)continue;
    const grid=partGrid(p),geometry=new MeshGeometry(grid),mesh=new Mesh({geometry,texture});
    mesh.position.set(p.x,p.y);if(fire){mesh.blendMode='add';mesh.alpha=.25;}
    root.addChild(mesh);meshes.push({p,grid,geometry,mesh,fire});
   }
  }
  const glowTex=assets.fxGlow as Texture|undefined;
  const glows=parts.flames.map(p=>{
   if(!glowTex)return null;const sprite=new PixiSprite(glowTex);sprite.anchor.set(.5);sprite.blendMode='add';sprite.tint=0xffbd78;
   sprite.position.set(p.x+p.ax*p.w,p.y+(p.ay-.35)*p.h);sprite.setSize(p.w*1.65,p.h*1.65);root.addChildAt(sprite,0);return sprite;
  });
  const embers=glowTex?parts.flames.flatMap((p,i)=>Array.from({length:3},(_,k)=>{const sprite=new PixiSprite(glowTex);sprite.anchor.set(.5);sprite.blendMode='add';sprite.tint=k===0?0xffe2a5:0xffaa62;root.addChild(sprite);return{sprite,p,seed:i*3+k};})):[];
  let raf=0;const start=performance.now();
  const tick=(now:number)=>{
   // FadeContainer owns visibility, including the outgoing scene's cloth.
   if(active){
    root.position.set(x,y);root.scale.set(width/1920,height/1080);
    const t=now-start,winAge=winStarted<0?-1:now-winStarted;
    for(const item of meshes){const {p,grid,geometry,mesh,fire}=item;
     (fire?flameVertices:linenVertices)(p,t,winAge,grid.uvs,grid.positions);geometry.getBuffer('aPosition').update();
     if(fire)mesh.alpha=.4+.09*fireEnergy(t,p.x/130);
    }
    glows.forEach((s,i)=>{if(s)s.alpha=.1+.035*fireEnergy(t,parts.flames[i].x/130);});
    for(const {sprite,p,seed}of embers){const u=(t/(3700+seed*130)+seed*.347)%1;sprite.position.set(p.x+p.ax*p.w+Math.sin(u*5+seed)*9+u*10,p.y+p.ay*p.h-u*110);sprite.setSize(4+(seed%3),4+(seed%3));sprite.alpha=Math.sin(u*Math.PI)**2*.38;}
   }
   raf=requestAnimationFrame(tick);
  };
  raf=requestAnimationFrame(tick);
  return()=>{cancelAnimationFrame(raf);root.destroy({children:true});for(const {geometry} of meshes)geometry.destroy();};
 });
</script>
<Container {x} {y}><Sprite key={keys[mode]} {width} {height}/></Container>
