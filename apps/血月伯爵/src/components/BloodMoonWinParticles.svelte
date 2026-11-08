<script lang="ts">
 import {onMount} from 'svelte';
 import {getContextParent} from 'pixi-svelte';
 import {Container,Sprite,Texture} from 'pixi.js';
 import {winParticle,WIN_IMPACT,type WinParticle} from '../game/winMotion';
 import {getContext} from '../game/context';
 import {clamp01} from '../game/presentation';
 const {active=true,age,previousAge=-1,tone}:{active?:boolean;age:number;previousAge?:number;tone:number}=$props();
 const parent=getContextParent(),context=getContext();
 const root=new Container();root.eventMode='none';
 let ready=$state(false);
 type Pool={head:Sprite;trail:Sprite;motion:WinParticle}[];
 const pools:Pool[]=[];const rings:Sprite[]=[];
 function texture(draw:(ctx:CanvasRenderingContext2D)=>void){
  const canvas=document.createElement('canvas');canvas.width=64;canvas.height=64;
  const ctx=canvas.getContext('2d')!;draw(ctx);return Texture.from(canvas);
 }
 onMount(()=>{
  // Prepare the tiny textures and fixed pools while idle, before first impact.
  const head=texture(ctx=>{
   const glow=ctx.createRadialGradient(32,32,0,32,32,30);glow.addColorStop(0,'#fff');glow.addColorStop(.14,'#ffffffc0');glow.addColorStop(1,'#ffffff00');ctx.fillStyle=glow;ctx.fillRect(0,0,64,64);
   ctx.fillStyle='#fff';ctx.beginPath();ctx.moveTo(32,4);ctx.lineTo(40,32);ctx.lineTo(32,60);ctx.lineTo(24,32);ctx.closePath();ctx.fill();
  });
  const trail=texture(ctx=>{const fade=ctx.createLinearGradient(0,0,64,0);fade.addColorStop(0,'#ffffff00');fade.addColorStop(1,'#fff');ctx.fillStyle=fade;ctx.fillRect(0,22,64,20);});
  const ring=texture(ctx=>{ctx.strokeStyle='#fff';ctx.lineWidth=2;ctx.beginPath();ctx.arc(32,32,29,0,Math.PI*2);ctx.stroke();});
  for(let layer=0;layer<2;layer++){
   const circle=new Sprite(ring);circle.anchor.set(.5);circle.blendMode='add';root.addChild(circle);rings.push(circle);
   const pool:Pool=[];
   for(let i=0;i<48;i++){
    const line=new Sprite(trail),spark=new Sprite(head);line.anchor.set(1,.5);spark.anchor.set(.5);
    line.blendMode=spark.blendMode='add';root.addChild(line,spark);pool.push({head:spark,trail:line,motion:{x:0,y:0,tailX:0,tailY:0,alpha:0,size:0,rotation:0}});
   }
   pools.push(pool);
  }
  for(const shared of [head,trail,ring])context.stateApp.pixiApplication?.renderer.texture.initSource(shared.source);
  parent.parent.addChild(root);ready=true;
  return()=>{root.destroy({children:true});head.destroy(true);trail.destroy(true);ring.destroy(true);};
 });
 $effect(()=>{
  if(!ready)return;
  root.visible=active;if(!active)return;
  for(const [layer,local] of [age,previousAge].entries()){
   const circle=rings[layer],r=clamp01((local-WIN_IMPACT)/650);
   circle.visible=local>=WIN_IMPACT&&r<1;circle.position.set(0,-86);circle.width=(70+r*350)*2;circle.height=(32+r*105)*2;circle.tint=tone;circle.alpha=(1-r)**2*.36;
   for(const [i,sprites] of pools[layer].entries()){
    const p=winParticle(i,local,sprites.motion);sprites.head.visible=sprites.trail.visible=!!p;
    if(!p)continue;
    sprites.head.position.set(p.x,p.y-65);sprites.head.width=p.size*5;sprites.head.height=p.size*9;
    sprites.head.rotation=p.rotation;sprites.head.alpha=p.alpha*.8;sprites.head.tint=i%4?tone:0xffe5b0;
    const dx=p.x-p.tailX,dy=p.y-p.tailY;
    sprites.trail.position.set(p.x,p.y-65);sprites.trail.rotation=Math.atan2(dy,dx);
    sprites.trail.width=Math.hypot(dx,dy);sprites.trail.height=3;sprites.trail.alpha=p.alpha*.28;sprites.trail.tint=tone;
   }
  }
 });
</script>
