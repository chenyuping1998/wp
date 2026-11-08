/** Acting is authored against the new Volt illustrations, in 256px art space. */
import {blob,polyline,ramp,restPose,smoothstep,type MeshWinSpec,type PartSpec,type Point,type Pose,type Rig} from './meshRig';
const GRID={x0:0,y0:0,x1:256,y1:256,cols:48,rows:48};
const keys:[number,number][]=[[0,0],[140,-.35],[410,1],[650,0],[1000,0],[1180,.75],[1400,0],[1500,0]];
function beat(t:number,delay=0){
 const time=t-delay;if(time<=0)return 0;
 for(let k=1;k<keys.length;k++)if(time<=keys[k][0]){
  const [a,x]=keys[k-1],[b,y]=keys[k];return x+(y-x)*smoothstep((time-a)/(b-a));
 }return 0;
}
function feature(name:string,parent:string,pivot:Point,dist:(p:Point)=>number,fade=16):PartSpec{
 return{name,parent,pivot,dist,priority:24,keep:(p)=>1-ramp(dist(p),0,fade)};
}
const bone=(rig:Rig,p:Pose,name:string)=>p.bones[rig.bones.findIndex(b=>b.name===name)];
function cut(s:string,parts:PartSpec[],act:(r:Rig,p:Pose,t:number)=>void,limits:MeshWinSpec['limits']):MeshWinSpec{
 return{symbol:s,key:'gb'+s,mode:'cut',feetY:238,durationMs:1500,landMs:1400,hitMs:410,
  flashTint:s==='S'?0xb05cff:0x4ff0c8,rig:{grid:GRID,soft:9,parts},limits,
  pose:(r,t)=>{
   const p=restPose(r),b=beat(t);
   p.rigid.dy=-Math.max(0,b)*2.5;p.rigid.pop=1+Math.max(0,b)*.018;
   p.air=Math.max(0,b)*.35;p.flash=Math.max(0,b)*.15;
   p.sheen=t>200&&t<650?(t-200)/450:-1;act(r,p,t);return p;
  }};
}
const H1=cut('H1',[
 {name:'jar',pivot:[128,235],dist:blob([128,161],63,77)},
 feature('cap','jar',[128,97],blob([128,82],63,25),23),
 feature('wire','cap',[128,66],blob([128,41],52,24),21),
 feature('brain','jar',[128,151],blob([128,151],42,37),23),
],(r,p,t)=>{
 bone(r,p,'cap').angle=beat(t)*1.3;
 const wire=bone(r,p,'wire');wire.angle=beat(t,70)*4.2;
 const brain=bone(r,p,'brain');brain.dy=-beat(t,60)*4.0;brain.across=1+beat(t,60)*.016;
},{jar:{pos:0,neg:0},cap:{pos:2,neg:2},wire:{pos:5,neg:5},brain:{pos:0,neg:0}});
const H2=cut('H2',[
 {name:'base',pivot:[128,232],dist:blob([128,191],100,43)},
 feature('blade','base',[73,174],polyline([[73,174],[177,62]],22).dist,28),
 feature('grip','blade',[175,67],blob([190,44],28,35),26),
],(r,p,t)=>{
 bone(r,p,'blade').angle=beat(t)*4.2;
 bone(r,p,'grip').angle=-beat(t,70)*2.1;
},{base:{pos:0,neg:0},blade:{pos:5,neg:5},grip:{pos:3,neg:3}});
const H3=cut('H3',[
 {name:'glass',pivot:[128,234],dist:blob([128,164],77,74)},
 feature('liquid','glass',[128,170],blob([128,172],52,46),28),
 feature('cork','glass',[128,59],blob([128,43],43,23),28),
 feature('bubbles','glass',[128,94],blob([128,82],25,22),20),
],(r,p,t)=>{
 const liquid=bone(r,p,'liquid');liquid.angle=beat(t,60)*1.8;liquid.dy=-beat(t,60)*1.5;
 const cork=bone(r,p,'cork');cork.dy=-beat(t)*5.1;cork.angle=beat(t,70)*2.3;
 const bubbles=bone(r,p,'bubbles');bubbles.dy=-beat(t,100)*3.0;bubbles.across=1+beat(t,100)*.035;
},{glass:{pos:0,neg:0},liquid:{pos:2,neg:2},cork:{pos:3,neg:3},bubbles:{pos:0,neg:0}});
const H4=cut('H4',[
 {name:'cell',pivot:[128,188],dist:blob([117,130],102,63)},
 feature('terminal','cell',[199,129],blob([213,129],20,44),22),
 feature('charge','cell',[153,128],blob([153,128],27,28),25),
],(r,p,t)=>{
 bone(r,p,'terminal').dx=beat(t)*3.2;
 const charge=bone(r,p,'charge');charge.along=1+beat(t,65)*.025;charge.dy=-beat(t,65)*2;
},{cell:{pos:0,neg:0},terminal:{pos:0,neg:0},charge:{pos:0,neg:0}});
const W=cut('W',[
 {name:'jacket',pivot:[128,236],dist:blob([128,186],84,53)},
 feature('head','jacket',[128,110],blob([128,72],38,47),24),
 {...feature('hair','head',[128,40],blob([128,31],38,17),25),priority:46},
 {...feature('mouth','head',[128,83],blob([128,83],21,12),16),priority:46},
],(r,p,t)=>{
 bone(r,p,'head').angle=beat(t)*1.6;
 const hair=bone(r,p,'hair');hair.dy=-beat(t,70)*3.1;hair.angle=beat(t,70)*2;
 const mouth=bone(r,p,'mouth');mouth.along=1+beat(t,40)*.035;mouth.dy=beat(t,40)*2;
},{jacket:{pos:0,neg:0},head:{pos:2,neg:2},hair:{pos:3,neg:3},mouth:{pos:0,neg:0}});
const S=cut('S',[
 {name:'stand',pivot:[128,235],dist:blob([128,211],68,24)},
 feature('globe','stand',[128,174],blob([128,108],91,86),30),
 {...feature('core','globe',[128,105],blob([128,105],27,28),28),priority:46},
],(r,p,t)=>{
 const globe=bone(r,p,'globe');globe.along=1+beat(t)*.012;globe.across=1+beat(t)*.012;
 const core=bone(r,p,'core');core.dy=-beat(t,65)*2.2;core.across=1+beat(t,65)*.025;
},{stand:{pos:0,neg:0},globe:{pos:0,neg:0},core:{pos:0,neg:0}});
function letter(s:string,index:number){
 return cut(s,[{name:'letter',pivot:[128,210],dist:()=>0}],(_r,p,t)=>{
  const b=beat(t);p.rigid.dy=-Math.max(0,b)*(6+index*.35);
  p.rigid.pop=1+Math.max(0,b)*.04;p.rigid.rot=b*(index%2?-5:5);
  p.rigid.sx=1-Math.max(0,b)*.025;p.rigid.sy=1+Math.max(0,b)*.025;
 },{letter:{pos:0,neg:0}});
}
export const VOLT_SYMBOLS:Record<string,MeshWinSpec>={H1,H2,H3,H4,W,S,
 ...Object.fromEntries(['L1','L2','L3','L4','L5'].map((s,i)=>[s,letter(s,i)]))};
