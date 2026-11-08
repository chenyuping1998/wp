<script lang="ts">
 import {Container as PixiContainer,Sprite,Graphics,Mesh,MeshGeometry,type Texture} from 'pixi.js';
 import {getContextApp,getContextParent} from 'pixi-svelte';
 import {onMount} from 'svelte';
 import {getContext} from '../game/context';
 import {VOLT_PROPS,propMotion,type VoltScene} from '../game/voltBackground';
 const {mode,x,y,width,height,active=true}:{mode:VoltScene;x:number;y:number;width:number;height:number;active?:boolean}=$props();
 const app=getContextApp(),parent=getContextParent(),context=getContext();
 let lastWin=-Infinity;
 context.eventEmitter.subscribeOnMount({winLinesShow:()=>{lastWin=performance.now();}});
 onMount(()=>{
  const root=new PixiContainer();root.label=`Volt ${mode} independent background objects`;parent.parent.addChild(root);
  const assets=app.stateApp.loadedAssets??{};
  const skyTexture=assets.voltBaseSky as Texture|undefined;
  const sky=mode==='base'&&skyTexture?new Sprite(skyTexture):null;
  if(sky){sky.label='Volt window sky lightning';sky.setSize(1920,1080);sky.alpha=0;sky.blendMode='add';root.addChild(sky);}
  const parts=VOLT_PROPS[mode].map(p=>{
   const texture=assets[p.texture] as Texture|undefined;
   if(!texture)throw new Error(`Missing Volt background texture: ${p.texture}`);
   const node=new Sprite(texture);node.label=`Volt ${p.id} ${p.motion}`;node.anchor.set(...p.pivot);node.setSize(p.w,p.h);
   const cable=p.texture==='voltCables';let geometry:MeshGeometry|undefined,mesh:Mesh|undefined;
   if(cable){
    const positions=new Float32Array(17*5*2),uvs=new Float32Array(positions.length),indices:number[]=[];
    for(let row=0;row<=4;row++)for(let col=0;col<=16;col++){
     const k=(row*17+col)*2;positions[k]=p.w*col/16;positions[k+1]=p.h*row/4;uvs[k]=col/16;uvs[k+1]=row/4;
     if(row<4&&col<16){const v=row*17+col;indices.push(v,v+1,v+17,v+1,v+18,v+17);}
    }
    geometry=new MeshGeometry({positions,uvs,indices:new Uint32Array(indices)});mesh=new Mesh({geometry,texture});
    mesh.label=`Volt ${p.id} pinned cable mesh`;mesh.position.set(p.x,p.y);root.addChild(mesh);
   }else root.addChild(node);
   return{p,node,geometry,mesh};
  });
  const fx=new Graphics();fx.label='Volt procedural arcs bubbles and instrument lights';root.addChild(fx);
  const start=performance.now();let raf=0;
  function frame(now:number){
   root.position.set(x,y);root.scale.set(width/1920,height/1080);
   if(active){
    const t=now-start,win=Math.max(0,1-(now-lastWin)/900);fx.clear();
    for(const {p,node,geometry,mesh}of parts){
     const m=propMotion(p,t);node.position.set(p.x+p.w*p.pivot[0],p.y+p.h*p.pivot[1]);node.rotation=m.angle;
     if(geometry&&mesh){
      const vertices=geometry.getBuffer('aPosition').data as Float32Array;
      for(let row=0;row<=4;row++)for(let col=0;col<=16;col++){
       const k=(row*17+col)*2,u=col/16;
       const pin=Math.sin(Math.PI*Math.max(0,Math.min(1,(u-.12)/.76)))**2;
       vertices[k+1]=p.h*row/4+Math.sin(t/p.period*Math.PI*2+(p.phase??0))*p.h*.035*pin;
      }
      geometry.getBuffer('aPosition').update();
     }
     if(p.motion==='arc'){
      const envelope=Math.sin(Math.PI*m.cycle)**12;
      if(envelope>.015){
       const coil=p.texture==='voltCoil';
       const ax=p.x+p.w*(coil?.15:.23),bx=p.x+p.w*(coil?.95:.77),yy=p.y+p.h*(coil?.12:.58-.39*m.cycle);
       for(const [line,color,alpha]of [[7,0x4ff0c8,.14],[2,0xeafffa,.7]]as const){
        fx.moveTo(ax,yy);for(let k=1;k<=6;k++)fx.lineTo(ax+(bx-ax)*k/6,yy+(k===6?0:Math.sin(k*3.7+t/130)*5));
        fx.stroke({width:line,color,alpha:alpha*envelope});
       }
      }
     }
     if(p.motion==='bubble')for(let k=0;k<3;k++){
      const u=(t/(5300+k*900)+k*.37)%1;
      fx.circle(p.x+p.w*(.31+k*.20)+Math.sin(u*5+k)*2,p.y+p.h*(.42-u*.42),2+u*2)
       .stroke({width:1.2,color:0x9dffe7,alpha:Math.sin(u*Math.PI)*.36});
     }
     if(p.motion==='screen'){
      const left=p.x+p.w*.19,top=p.y+p.h*.24,w=p.w*.61,h=p.h*.40;
      fx.moveTo(left,top+h*.5);for(let k=1;k<=32;k++)fx.lineTo(left+w*k/32,top+h*(.5+.23*Math.sin(k*.55-t/800)));
      fx.stroke({width:1.4,color:0x4ff0c8,alpha:.30+.16*m.light});
     }
     if(p.motion==='needle'){
      const angle=-Math.PI*.65+Math.sin(t/p.period*Math.PI*2)*.25,cx=p.x+p.w*.5,cy=p.y+p.h*.5;
      fx.moveTo(cx,cy).lineTo(cx+Math.cos(angle)*p.w*.32,cy+Math.sin(angle)*p.h*.32).stroke({width:2.1,color:0xe2483d,alpha:.95});
      fx.circle(cx,cy,4).fill({color:0xc47a3a});
     }
     if(p.motion==='glow'){
      if(p.texture==='voltBeacon')fx.ellipse(p.x+p.w*.5,p.y+p.h*.36,p.w*.25,p.h*.24).fill({color:0xffc04d,alpha:.05+.16*m.light});
      else for(let k=0;k<3;k++){
       const a=.06+.13*(.5+.5*Math.sin(t/2600-k*.8))+.08*win;
       if(p.texture==='voltIndicators')fx.circle(p.x+p.w*(.204+k*.296),p.y+p.h*.5,p.h*.16).fill({color:[0xe2483d,0xf5c518,0x4ff0c8][k],alpha:a});
       else fx.roundRect(p.x+p.w*(.54+k*.085),p.y+p.h*.40,p.w*.055,p.h*.20,2).fill({color:0x4ff0c8,alpha:a});
      }
     }
    }
    const storm=(t%31000)/31000,pulse=Math.max(0,1-Math.abs(storm-.74)*190);
    if(sky)sky.alpha=pulse*.65;
   }
   raf=requestAnimationFrame(frame);
  }
  raf=requestAnimationFrame(frame);
  return()=>{cancelAnimationFrame(raf);root.destroy({children:true});for(const p of parts){p.geometry?.destroy();if(p.mesh)p.node.destroy();}};
 });
</script>
