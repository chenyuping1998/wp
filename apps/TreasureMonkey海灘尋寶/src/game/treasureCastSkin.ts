// Local deformation only: feet and the hand/tool grip remain ordinary rigid
// attachments. The same torso mapping drives the artwork and its attachments.
export type CastAttachment={x:number;y:number;w:number;h:number;ax:number;ay:number};
export type CastSkin={part:CastAttachment;kind:'body'|'tail';rest:Float32Array;uvs:Float32Array;indices:Uint32Array};
const smooth=(u:number)=>{u=Math.max(0,Math.min(1,u));return u*u*(3-2*u);};
export function castTorsoPoint(x:number,y:number,bend:number,breathX=0,breathY=0,shoulderY=0){
 const weight=smooth((442-y)/145),shoulderWeight=smooth(Math.abs(x-240)/80)*smooth((410-y)/110);
 const angle=bend*weight,c=Math.cos(angle),s=Math.sin(angle),dx=(x-240)*(1+breathX*weight);
 // The centre chest inhales first. Across its sides the cloth follows the
 // delayed shoulder track, using this exact mapping for both arm attachments.
 const dy=(y-442)*(1+breathY*weight)+(shoulderY+180*breathY)*shoulderWeight;
 return {x:240+dx*c-dy*s,y:442+dx*s+dy*c};
}
export function castTailPoint(x:number,y:number,curl:number,middleCurl=curl){
 // A two-bone curl with soft weights across the painted U. Left stem is
 // untouched; the middle leads and the right curl follows rather than shears.
 const rotate=(px:number,py:number,angle:number)=>{
  if(!angle)return;
  const dx=x-px,dy=y-py,c=Math.cos(angle),s=Math.sin(angle);
  x=px+dx*c-dy*s;y=py+dx*s+dy*c;
 };
 const middle=smooth((x-.27)/.36),tip=smooth((x-.50)/.28);
 rotate(.34,.62,middleCurl*.45*middle);
 rotate(.70,.40,curl*.55*tip);
 return {x,y};
}
export function createCastSkin(part:CastAttachment,kind:'body'|'tail',columns=16,rows=16):CastSkin{
 const count=(columns+1)*(rows+1),rest=new Float32Array(count*2),uvs=new Float32Array(count*2),indices=new Uint32Array(columns*rows*6);
 for(let row=0;row<=rows;row++)for(let col=0;col<=columns;col++){
  const i=(row*(columns+1)+col)*2,u=col/columns,v=row/rows;
  rest[i]=u;rest[i+1]=v;uvs[i]=u;uvs[i+1]=v;
 }
 let at=0;
 for(let row=0;row<rows;row++)for(let col=0;col<columns;col++){
  const a=row*(columns+1)+col,b=a+1,c=a+columns+1,d=c+1;
  indices.set([a,b,c,b,d,c],at);at+=6;
 }
 return {part,kind,rest,uvs,indices};
}
export function deformCastSkin(skin:CastSkin,bend:number,out:Float32Array,options:{breathX?:number;breathY?:number;shoulderY?:number;middleBend?:number}={}){
 const p=skin.part;
 for(let i=0;i<skin.rest.length;i+=2){
  const u=skin.rest[i],v=skin.rest[i+1];
  if(skin.kind==='body'){
   const point=castTorsoPoint(p.x+(u-p.ax)*p.w,p.y+(v-p.ay)*p.h,bend,options.breathX,options.breathY,options.shoulderY);
   out[i]=point.x-p.x;out[i+1]=point.y-p.y;
  }else{
   const point=castTailPoint(u,v,bend,options.middleBend);
   out[i]=(point.x-p.ax)*p.w;out[i+1]=(point.y-p.ay)*p.h;
  }
 }
 return out;
}
