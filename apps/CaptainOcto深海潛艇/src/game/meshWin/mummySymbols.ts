/** Subject-specific acting; every surrounding slab stays at rest. 1500ms, home at both ends. */
import { blob, polygon, polyline, panelParts, restPose, track, ramp, type MeshWinSpec, type Rig, type Pose, type Point } from './meshRig';
const GRID={x0:0,y0:0,x1:256,y1:256,cols:48,rows:48};
const INNER:[number,number,number,number]=[12,12,244,244];
const key=(s:string)=>'gb'+s[0]+s.slice(1).toLowerCase();
const pulse=(t:number,delay=0)=>track(t-delay,[[0,0],[140,-.45],[410,1],[600,0],[1000,0],[1180,.8],[1400,0],[1500,0]]);
function symbol(s:string,detail:((p:Point)=>number)|null,pivot:Point):MeshWinSpec{
 const low=s.startsWith('L'),scatter=s==='S';
 return {
  symbol:s,key:key(s),sprite:key(s),mode:'panel',feetY:238,durationMs:1500,landMs:1400,hitMs:410,
  flashTint:scatter?0xffc23a:0xf2e8d0,inked:(p)=>p[0]>24&&p[0]<232&&p[1]>20&&p[1]<236,
  rig:{grid:GRID,soft:8,parts:[...panelParts(INNER,28),...(detail?[{name:'detail',parent:'panel',pivot,dist:detail,priority:.3,keep:(p:Point)=>ramp(Math.min(p[0],256-p[0],p[1],256-p[1]),12,45)}]:[])]},
  limits:{detail:{pos:20,neg:20},panel:{pos:4,neg:4},frame:{pos:0,neg:0}},
  pose:(rig:Rig,t:number):Pose=>{
   const p=restPose(rig),beat=pulse(t),body=p.bones[1];
   if(!scatter){
    body.dy=-beat*(low?4:3);body.along=1+beat*.013;body.across=1-beat*.009;
    if(low){body.angle=beat*(s==='L2'?-1.5:1.1);}
    if(s==='H3')body.angle=beat*2;
   }
   if(detail){const d=p.bones[2];
    if(s==='H1'){d.dy=-Math.max(0,beat)*3;d.angle=beat*1.2;}
    if(s==='H2'){d.dy=-Math.max(0,beat)*3.5;d.angle=beat*3;}
    if(s==='H3')d.angle=pulse(t,70)*8;
    if(s==='H4'){d.angle=pulse(t,70)*6;d.across=1+beat*.02;}
    if(s==='W'){d.along=1-.55*ramp(t,240,270)*(1-ramp(t,330,360));}
   }
   p.flash=(scatter?.2:.12)*Math.max(0,beat);p.sheen=(t>200&&t<600)?(t-200)/400:-1;
   return p;
  },
 };
}
export const MUMMY_SYMBOLS:Record<string,MeshWinSpec>={
 H1:symbol('H1',blob([139,65],66,50),[135,115]),
 H2:symbol('H2',blob([128,56],76,51),[128,106]),
 H3:symbol('H3',polyline([[195,168],[227,184],[219,216],[166,225]],17).dist,[197,168]),
 H4:symbol('H4',blob([219,128],30,68),[192,133]),
 W:symbol('W',blob([97,91],15,11),[97,91]),S:symbol('S',null,[128,128]),
 ...Object.fromEntries(['L1','L2','L3','L4','L5'].map(s=>[s,symbol(s,null,[128,128])])),
};
