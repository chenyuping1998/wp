import {motionTrack} from './treasureMotion.ts';
import {rigGeneratorValue} from './treasureRigMotion.ts';

type Key=readonly [number,number];
export type Bone={id:string;parent?:number;x:number;y:number;cx:number;cy:number;rx:number;ry:number;turn:number;lag:number;dx?:number;dy?:number;stretch?:number;keys?:readonly Key[]};
const bone=(id:string,x:number,y:number,cx:number,cy:number,rx:number,ry:number,turn:number,lag=0,extra:Partial<Bone>={}):Bone=>({id,x,y,cx,cy,rx,ry,turn,lag,...extra});
/** Normalised texture coordinates. Roots remain at the original painted contact. */
export const SYMBOL_RIGS:Record<string,readonly Bone[]>={
 castleFlag:[bone('cloth-root',.51,.22,.59,.22,.085,.10,.10,35),bone('cloth-tip',.60,.22,.68,.21,.09,.10,-.18,140,{parent:0,dy:.008})],
 H3:[
  // A breath starts at the mouth; the heavy spiral answers after the release.
  // The readable open pose leads the existing bubbles rather than chasing them.
  bone('shell-lip',.45,.68,.36,.61,.32,.29,-.12,0,{stretch:.04,dx:-.006,dy:.003,keys:[[0,0],[90,-.30],[195,-.27],[315,1.10],[405,1.04],[550,-.22],[660,.13],[790,-.03],[890,0],[970,0]]}),
  bone('shell-tip',.54,.48,.68,.32,.30,.30,.14,0,{dy:-.002,keys:[[0,0],[140,-.12],[255,-.10],[420,1],[505,.94],[650,-.28],[790,.08],[900,0],[970,0]]}),
 ],
 H5:[bone('rope',.42,.70,.40,.52,.34,.29,-.045,0,{stretch:.025}),bone('key',.68,.48,.72,.65,.21,.32,-.20,110)],
 W:[bone('face',.57,.68,.58,.55,.29,.29,-.035,0,{dx:-.010,dy:-.010}),bone('hat',.51,.35,.51,.27,.36,.21,-.075,85),bone('smile',.61,.59,.61,.66,.22,.13,.025,55,{parent:0,dy:-.020,stretch:.025})],
 SW:[bone('shaft',.38,.75,.54,.50,.27,.35,-.035),bone('display',.60,.34,.61,.24,.22,.19,.065,70),bone('coil',.38,.75,.36,.78,.32,.15,-.055,140,{stretch:.035})],
};
const gesture:readonly Key[]=[[0,0],[110,-.22],[300,1],[430,.94],[570,-.32],[715,.15],[850,-.035],[970,0]];
export function boneMotion(b:Bone,time:number,reduced=false){
 // Baked material curves own their delay; authored shell/face tracks retain
 // their original timing. Every chain finishes within the same 970ms hold.
 const local=Math.max(0,(Math.min(970,time)-b.lag)*970/(970-b.lag));
 const p=(rigGeneratorValue(b.id,time)??motionTrack(local,b.keys??gesture))*(reduced?.18:1);
 return {angle:b.turn*p,dx:(b.dx??0)*p,dy:(b.dy??0)*p,sx:1+(b.stretch??0)*p,sy:1-(b.stretch??0)*p*.6};
}
/** Attachment keys: open -> half -> closed -> half -> open. No ghosted pupils. */
export function monkeyBlinkFrame(time:number,reduced=false):0|1|2{
 if(reduced||time<355||time>=456)return 0;
 return time<376||time>=428?1:2;
}
type Matrix=readonly [number,number,number,number,number,number];
const identity:Matrix=[1,0,0,1,0,0];
const multiply=(a:Matrix,b:Matrix):Matrix=>[a[0]*b[0]+a[2]*b[1],a[1]*b[0]+a[3]*b[1],a[0]*b[2]+a[2]*b[3],a[1]*b[2]+a[3]*b[3],a[0]*b[4]+a[2]*b[5]+a[4],a[1]*b[4]+a[3]*b[5]+a[5]];
export function symbolBoneMatrices(name:string,time:number,reduced=false){
 const matrices:Matrix[]=[];
 for(const b of SYMBOL_RIGS[name]??[]){
  const p=boneMotion(b,time,reduced),c=Math.cos(p.angle),s=Math.sin(p.angle),a=c*p.sx,d=c*p.sy,bb=s*p.sx,cc=-s*p.sy;
  const local:Matrix=[a,bb,cc,d,b.x-a*b.x-cc*b.y+p.dx,b.y-bb*b.x-d*b.y+p.dy];
  matrices.push(multiply(b.parent===undefined?identity:matrices[b.parent],local));
 }
 return matrices;
}
export const applyMatrix=(m:Matrix,x:number,y:number)=>({x:m[0]*x+m[2]*y+m[4],y:m[1]*x+m[3]*y+m[5]});
export function projectSymbolPoints(name:string,points:readonly (readonly [number,number])[],time:number,reduced=false){
 const matrices=symbolBoneMatrices(name,time,reduced);
 return points.map(([x,y])=>{
  const weights=boneWeights(name,x,y);let px=x*weights.root,py=y*weights.root;
  matrices.forEach((m,i)=>{const p=applyMatrix(m,x,y),w=weights.bones[i];px+=p.x*w;py+=p.y*w;});
  return [px,py] as const;
 });
}
export function boneWeights(name:string,x:number,y:number){
 const bones=SYMBOL_RIGS[name]??[];
 const influence=bones.map(b=>{
  const r=Math.hypot((x-b.cx)/b.rx,(y-b.cy)/b.ry);
  if(r>=1)return 0;
  const u=Math.min(1,(1-r)*2.5);return u*u*(3-2*u);
 });
 const total=influence.reduce((sum,w,i)=>sum+(bones[i].parent===undefined?w:0),0),normalise=Math.max(1,total);
 let root=Math.max(0,1-total);
 const weights=influence.map((w,i)=>bones[i].parent===undefined?w/normalise:0);
 // A facial child replaces its parent's local influence instead of averaging
 // a wink with an open eye; its matrix already carries the parent's motion.
 bones.forEach((b,i)=>{if(b.parent!==undefined){const w=influence[i];root*=1-w;for(let j=0;j<weights.length;j++)weights[j]*=1-w;weights[i]=w;}});
 return {root,bones:weights};
}
export function createSymbolSkin(name:string,divisions=24){
 const count=(divisions+1)**2,rest=new Float32Array(count*2),uvs=new Float32Array(count*2),indices=new Uint32Array(divisions*divisions*6);
 const weights:ReturnType<typeof boneWeights>[]=[];
 for(let row=0;row<=divisions;row++)for(let col=0;col<=divisions;col++){
  const index=row*(divisions+1)+col,x=col/divisions,y=row/divisions;
  rest[index*2]=uvs[index*2]=x;rest[index*2+1]=uvs[index*2+1]=y;weights.push(boneWeights(name,x,y));
 }
 let offset=0;
 for(let row=0;row<divisions;row++)for(let col=0;col<divisions;col++){
  const a=row*(divisions+1)+col,b=a+1,c=a+divisions+1,d=c+1;
  indices.set([a,b,c,b,d,c],offset);offset+=6;
 }
 return {rest,uvs,indices,weights};
}
export function skinSymbol(skin:ReturnType<typeof createSymbolSkin>,name:string,time:number,reduced=false,out=new Float32Array(skin.rest.length)){
 const matrices=symbolBoneMatrices(name,time,reduced);
 for(let i=0;i<skin.weights.length;i++){
  const x=skin.rest[i*2],y=skin.rest[i*2+1],weights=skin.weights[i];let px=x*weights.root,py=y*weights.root;
  for(let b=0;b<matrices.length;b++)if(weights.bones[b]){
   const m=matrices[b],w=weights.bones[b];px+=(m[0]*x+m[2]*y+m[4])*w;py+=(m[1]*x+m[3]*y+m[5])*w;
  }
  out[i*2]=px-.5;out[i*2+1]=py-.5;
 }
 return out;
}
