import {Container,Graphics,Mesh,MeshGeometry,Sprite,Texture} from 'pixi.js';
import {seaSample,seaWeight,paintAmbient} from './backgroundMotion';
/** Local surface motion and animated illumination on a fixed painted set. */
export function createBackgroundScene(base:Texture,free:Texture,kind:'purrfia'|'parrot'){
 const root=new Container(),decor=new Container(),gull=new Graphics(),cable=new Graphics(),dust=new Graphics();root.eventMode='none';root.label='Living painted environment';
 const cols=96,rows=54,positions=new Float32Array((cols+1)*(rows+1)*2),uvs=new Float32Array(positions.length),indices:number[]=[];
 for(let y=0;y<=rows;y++)for(let x=0;x<=cols;x++){const i=(y*(cols+1)+x)*2;positions[i]=x/cols*1920;positions[i+1]=y/rows*1080;uvs[i]=x/cols;uvs[i+1]=y/rows;}
 for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){const a=y*(cols+1)+x,b=a+1,c=a+cols+1,d=c+1;indices.push(a,b,c,b,d,c);}
 const weights=Float32Array.from({length:positions.length/2},(_,i)=>seaWeight(positions[i*2],positions[i*2+1]));
 const geometry=new MeshGeometry({positions,uvs,indices:new Uint32Array(indices)}),plate=new Mesh({geometry,texture:base});root.addChild(plate);
 const makeMap=()=>{const canvas=document.createElement('canvas');canvas.width=512;canvas.height=288;const ctx=canvas.getContext('2d')!;const texture=Texture.from(canvas);const sprite=new Sprite({texture,width:1920,height:1080});root.addChild(sprite);return {ctx,texture,sprite};};
 const shadow=makeMap(),lightMap=makeMap();shadow.sprite.blendMode='multiply';lightMap.sprite.blendMode='add';root.addChild(decor);
 const canvas=document.createElement('canvas');canvas.width=canvas.height=128;const ctx=canvas.getContext('2d')!,grad=ctx.createRadialGradient(64,64,0,64,64,64);grad.addColorStop(0,'rgba(255,255,255,1)');grad.addColorStop(.25,'rgba(255,255,255,.32)');grad.addColorStop(1,'rgba(255,255,255,0)');ctx.fillStyle=grad;ctx.fillRect(0,0,128,128);const glowTexture=Texture.from(canvas);
 const lights:Sprite[]=[],bulbs:Graphics[]=[];
 const lamp=(x:number,y:number,size:number,color:number)=>{const s=new Sprite({texture:glowTexture,tint:color,anchor:.5,width:size,height:size,blendMode:'add'});s.position.set(x,y);decor.addChild(s);lights.push(s);};
 if(kind==='purrfia'){lamp(182,190,240,0xff67b3);lamp(472,285,210,0x5de0ef);lamp(1836,182,210,0xff69c0);lamp(103,566,180,0xffd47d);decor.addChild(dust);}
 else{
  decor.addChild(cable);cable.moveTo(225,145).quadraticCurveTo(1010,390,1770,375).stroke({color:0x443724,width:2,alpha:.8});
  for(let i=0;i<12;i++){const t=i/11,x=(1-t)**2*225+2*(1-t)*t*1010+t*t*1770,y=(1-t)**2*145+2*(1-t)*t*390+t*t*375;lamp(x,y+12,70,0xffbd66);const b=new Graphics().moveTo(x,y).lineTo(x,y+10).stroke({color:0x5c4429,width:2}).ellipse(x,y+15,4.5,7).fill(0xffefb6);decor.addChild(b);bulbs.push(b);}decor.addChild(gull);
 }
 let feature=false,reduced=false,focus=false,volume=1,time=0,mapAge=1,dirty=true;
 const clamp=(v:number)=>Math.max(0,Math.min(1,v));
 function update(dt:number){
  dt=Math.max(0,Math.min(.1,dt));if(!reduced&&!focus){time+=dt;mapAge+=dt;}if(!dirty&&(focus||reduced))return;
  if(kind==='parrot'){
   for(let i=0;i<uvs.length;i+=2){const p=seaSample(positions[i],positions[i+1],time,reduced,weights[i/2]);uvs[i]=p.u;uvs[i+1]=p.v;}geometry.getBuffer('aUV').update();
   cable.visible=feature;for(let i=0;i<lights.length;i++){const bank=i<4?1:i<8?clamp((volume-4)/4):clamp((volume-10)/6);lights[i].visible=feature;lights[i].alpha=.12+bank*.15+Math.sin(time*.7+i)*.012;bulbs[i].visible=feature;bulbs[i].alpha=.55+bank*.4;}
   gull.clear();const p=(time%19)/9;if(!feature&&!reduced&&p<1){const x=500+p*900,y=145-Math.sin(p*Math.PI)*60,s=9+Math.sin(p*Math.PI)*3,flap=Math.sin(time*3.1)*3;gull.moveTo(x-s,y+flap).quadraticCurveTo(x-s*.4,y-3,x,y).quadraticCurveTo(x+s*.4,y-3,x+s,y+flap).stroke({color:0x496b81,width:1.8,alpha:.65});}
  }else{
   for(let i=0;i<lights.length;i++){lights[i].visible=feature?i<3:i===3;const cycle=(time+i*4.1)%23,dip=cycle>20&&cycle<20.09?.88:1;lights[i].alpha=(feature?.12:.06)*dip;}
   dust.clear();if(!feature&&!reduced)for(let i=0;i<12;i++){const p=(time/15+i*.143)%1,x=210+i*44+Math.sin(time*.12+i)*7,y=130+p*355;dust.circle(x,y,i%2?.95:1.35).fill({color:0xffe8bf,alpha:Math.sin(p*Math.PI)*.42});}
  }
  if(dirty||mapAge>=1/24){paintAmbient(shadow.ctx,lightMap.ctx,time,kind,feature,reduced);shadow.texture.source.update();lightMap.texture.source.update();mapAge=0;}dirty=false;
 }
 update(0);
 return {root,update,setLayout(width:number,height:number){const s=Math.max(width/1920,height/1080);root.scale.set(s);root.position.set((width-1920*s)/2,(height-1080*s)/2);},setState(fg:boolean,v:number,paused:boolean,reduce:boolean){dirty=dirty||feature!==fg||volume!==v||reduced!==reduce;feature=fg;volume=v;focus=paused;reduced=reduce;plate.texture=fg?free:base;},destroy(){root.destroy({children:true});geometry.destroy();for(const t of [glowTexture,shadow.texture,lightMap.texture])t.destroy(true);}};
}
