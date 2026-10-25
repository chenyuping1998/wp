import castGenerator from './data/treasureCastGenerator.json' with {type:'json'};
export type CastCue = 'idle' | 'scan' | 'win' | 'winBig' | 'welcome';
export type CastPose={body:number;chest:number;breathX:number;breathY:number;shoulderY:number;head:number;left:number;right:number;tail:number;tailMid:number;tailTip:number;dy:number;blink:number};
type Key=readonly [number,number];
const rad=(n:number)=>n*Math.PI/180;
const clamp=(n:number,a:number,b:number)=>Math.max(a,Math.min(b,n));
export const CAST_TIMING={scan:1960,win:1560,winBig:2240,welcome:1740,idle:0} as const;
export const castDuration=(cue:CastCue)=>CAST_TIMING[cue];
// Quintic Hermite tracks retain velocity through moving keys and meet with
// zero acceleration. Held keys remain exact, without acceleration jolts.
export function motionTrack(t:number,keys:readonly Key[]):number{
 if(t<=keys[0][0])return keys[0][1];
 if(t>=keys[keys.length-1][0])return keys[keys.length-1][1];
 let i=0;while(keys[i+1][0]<t)i++;
 const slope=(k:number)=>(keys[k+1][1]-keys[k][1])/(keys[k+1][0]-keys[k][0]);
 const tangent=(k:number)=>{if(k===0||k===keys.length-1)return 0;const a=slope(k-1),b=slope(k);return a*b<=0?0:2*a*b/(a+b);};
 const [a,av]=keys[i],[b,bv]=keys[i+1],u=(t-a)/(b-a),d=bv-av,m0=(b-a)*tangent(i),m1=(b-a)*tangent(i+1);
 return av+m0*u+(10*d-6*m0-4*m1)*u**3+(-15*d+8*m0+7*m1)*u**4+(6*d-3*m0-3*m1)*u**5;
}
const smooth=(u:number)=>{u=clamp(u,0,1);return u*u*u*(10+u*(-15+6*u));};
const blinkAt=(t:number,start:number)=>{const dt=t-start;return dt<0||dt>140?0:dt<45?dt/45:dt<85?1:1-(dt-85)/55;};
// Samples were baked from the local generator's actual breathe/chain-sway
// presets. Quintic interpolation retains their value, velocity and acceleration
// through every sample and across the four-second loop seam.
function idleChannel(name:keyof typeof castGenerator.channels,time:number){
 const count=castGenerator.sampleCount,step=castGenerator.periodMs/count;
 const phase=((time%castGenerator.periodMs)+castGenerator.periodMs)%castGenerator.periodMs,index=Math.min(count-1,Math.floor(phase/step)),u=(phase-index*step)/step;
 const [av,am,aa]=castGenerator.channels[name][index],[bv,bm,ba]=castGenerator.channels[name][index+1],seconds=step/1000;
 const m0=am*seconds,m1=bm*seconds,a0=aa*seconds**2,a1=ba*seconds**2,d=bv-av;
 return av+m0*u+.5*a0*u*u+(10*d-6*m0-4*m1-1.5*a0+.5*a1)*u**3+(-15*d+8*m0+7*m1+1.5*a0-a1)*u**4+(6*d-3*m0-3*m1-.5*a0+.5*a1)*u**5;
}
export function castPose(time:number,cue:CastCue='idle',elapsed=0,reduced=false,who:'digger'|'lifeguard'='digger'):CastPose{
 // Quiet continuous breath, shoulder lag, and a separate wave per tail link.
 // The two figures keep the same pacing with a small phase difference.
 const phase=((time%11700)+11700)%11700;
 const idleTime=time+(who==='lifeguard'?360:0),gain=reduced?.24:1;
 const breathX=(idleChannel('breathX',idleTime)-1)*gain,breathY=(idleChannel('breathY',idleTime)-1)*gain;
 const breathe=breathY/.008,restBody=rad(-.12)*breathe,restChest=rad(.10)*breathe;
 const rest:CastPose={body:restBody,chest:restChest,breathX,breathY,shoulderY:-idleChannel('shoulderY',idleTime)*gain,head:-rad(idleChannel('head',idleTime))*gain-restBody-restChest*.65,left:0,right:0,tail:rad(idleChannel('tail',idleTime))*gain,tailMid:rad(idleChannel('tailMid',idleTime))*gain,tailTip:rad(idleChannel('tailTip',idleTime))*gain,dy:0,blink:Math.max(blinkAt(phase,3030),blinkAt(phase,8620))};
 if(cue==='idle'||elapsed<0||elapsed>=castDuration(cue))return rest;
 const t=elapsed;
 const track=(keys:readonly Key[])=>motionTrack(t,keys);
 let body=0,chest=0,head=0,left=0,right=0,tail=0,tailTip=0,dy=0,blink=0;
 if(cue==='scan'){
  // Eyes/head acquire the patch first; torso commits, the tool arcs out and
  // sweeps back once, then its weight settles before the tail comes to rest.
  head=track([[0,0],[150,-5.8],[400,-6.8],[1040,-3],[1470,1.4],[1760,0],[1960,0]]);
  body=track([[0,0],[160,.7],[410,-3.2],[1050,2.4],[1420,-.8],[1780,0],[1960,0]]);
  left=track([[0,0],[160,-2.5],[440,12.8],[1110,-10],[1480,2.1],[1820,0],[1960,0]]);
  right=track([[0,0],[220,-1.4],[520,3.5],[1160,-2.5],[1570,.7],[1880,0],[1960,0]]);
  tail=track([[0,0],[300,0],[700,-5.5],[1320,5],[1640,-1.2],[1960,0]]);
  chest=track([[0,0],[230,0],[540,-1.4],[1180,1.2],[1570,-.35],[1860,0],[1960,0]]);
  tailTip=track([[0,0],[420,0],[870,-5],[1460,4],[1760,-.7],[1960,0]]);
  dy=track([[0,0],[260,2],[580,-2.6],[1190,1.2],[1740,0],[1960,0]]);
  blink=blinkAt(t,1390);
 }else if(cue==='win'){
  body=track([[0,0],[160,1.7],[380,-2.6],[650,-2.1],[1020,.7],[1430,0],[1560,0]]);
  head=track([[0,0],[100,2],[290,-4.4],[670,-3],[1090,1.1],[1480,0],[1560,0]]);
  left=track([[0,0],[170,-2],[430,3.8],[820,2],[1270,-.8],[1500,0],[1560,0]]);
  right=track([[0,0],[180,-3],[430,10.5],[740,8],[1120,-1.8],[1510,0],[1560,0]]);
  tail=track([[0,0],[280,0],[680,6],[1110,-2],[1520,0],[1560,0]]);
  chest=track([[0,0],[220,.7],[480,-1.7],[740,-1.5],[1150,.4],[1500,0],[1560,0]]);
  tailTip=track([[0,0],[380,0],[820,5],[1230,-1.3],[1540,0],[1560,0]]);
  dy=track([[0,0],[170,3.8],[370,-5.5],[650,-4],[1100,1.4],[1480,0],[1560,0]]);
  blink=blinkAt(t,940);
 }else if(cue==='winBig'){
  body=track([[0,0],[200,2.8],[470,-4.2],[820,-3.4],[1160,-1.7],[1510,1.5],[1920,-.4],[2160,0],[2240,0]]);
  head=track([[0,0],[150,3],[380,-6.8],[780,-5],[1120,-2],[1480,2.6],[1840,-1],[2160,0],[2240,0]]);
  left=track([[0,0],[220,-3],[540,7],[1000,4],[1510,-2],[1980,.6],[2190,0],[2240,0]]);
  right=track([[0,0],[200,-5],[520,15.5],[820,15.5],[1120,10],[1440,4],[1810,-1.8],[2160,0],[2240,0]]);
  tail=track([[0,0],[300,0],[720,8.8],[1190,4],[1650,-3.2],[2010,.9],[2240,0]]);
  chest=track([[0,0],[250,1.1],[620,-2.1],[930,-1.9],[1330,-.7],[1690,.6],[2090,0],[2240,0]]);
  tailTip=track([[0,0],[430,0],[910,7.2],[1370,3.2],[1810,-2.2],[2090,.45],[2240,0]]);
  dy=track([[0,0],[200,5.5],[430,-7],[850,-5],[1260,-2],[1620,2.8],[2010,-.7],[2180,0],[2240,0]]);
  blink=blinkAt(t,1410);
 }else{
  head=track([[0,0],[200,-2],[460,4.5],[700,-3.4],[1020,1.5],[1510,0],[1740,0]]);
  body=track([[0,0],[240,1.2],[520,-2.8],[1000,-1.5],[1510,0],[1740,0]]);
  right=track([[0,0],[180,-2],[480,12],[750,5],[1020,8.2],[1290,3],[1600,0],[1740,0]]);
  left=track([[0,0],[250,-1.2],[620,2.8],[1180,-.8],[1630,0],[1740,0]]);
  tail=track([[0,0],[400,0],[800,5.6],[1260,-1.5],[1740,0]]);
  chest=track([[0,0],[310,0],[660,-1.25],[1090,-.7],[1420,.2],[1660,0],[1740,0]]);
  tailTip=track([[0,0],[510,0],[950,4.8],[1430,-.9],[1740,0]]);
  dy=track([[0,0],[200,2],[500,-3.2],[1030,-1.4],[1540,0],[1740,0]]);
  blink=blinkAt(t,1150);
 }
 if(who==='lifeguard'&&cue==='scan'){
  // The free-game character carries a shovel: prepare -> press into sand ->
  // hold the load -> lift -> recover. It must not mime detector side-sweeps.
  head=track([[0,0],[200,2.8],[520,5.8],[860,4],[1120,-3.8],[1560,1],[1880,0],[1960,0]]);
  body=track([[0,0],[220,-1.1],[560,3.4],[820,3],[1140,-2.6],[1540,.8],[1880,0],[1960,0]]);
  left=track([[0,0],[220,-3.2],[560,10.5],[800,10.5],[1110,-9.5],[1500,-2],[1840,0],[1960,0]]);
  right=track([[0,0],[250,2],[610,-7],[850,-6],[1200,4],[1630,-1],[1900,0],[1960,0]]);
  tail=track([[0,0],[330,0],[750,-5],[1280,5.2],[1660,-1.4],[1960,0]]);
  chest=track([[0,0],[290,0],[650,1.7],[860,1.7],[1260,-1.4],[1630,.3],[1870,0],[1960,0]]);
  tailTip=track([[0,0],[470,0],[930,-4.4],[1430,4],[1790,-.7],[1960,0]]);
  dy=track([[0,0],[210,-1.5],[570,5.5],[820,4],[1120,-4.8],[1560,1.4],[1880,0],[1960,0]]);
 }
 // Reaction begins and ends in a neutral planted pose. Idle does not bleed
 // into it, so a held key or a queued cue cannot acquire an extra body sway.
 const settle=smooth((elapsed-(castDuration(cue)-260))/260);
 return {body:rad(body)*gain+rest.body*settle,chest:rad(chest)*gain+rest.chest*settle,breathX:rest.breathX*settle,breathY:rest.breathY*settle,shoulderY:rest.shoulderY*settle,head:rad(head)*gain+rest.head*settle,left:rad(left)*gain,right:rad(right)*gain,tail:rad(tail)*gain+rest.tail*settle,tailMid:rad((tail+tailTip)*.5)*gain+rest.tailMid*settle,tailTip:rad(tailTip)*gain+rest.tailTip*settle,dy:dy*gain+rest.dy*settle,blink:Math.max(blink,rest.blink*settle)};
}

/** Carries pose, velocity and acceleration across interrupted reactions. */
export class CastPerformer{
 private cue:CastCue='idle';private who:'digger'|'lifeguard'='digger';private started=0;
 private offset:CastPose={body:0,chest:0,breathX:0,breathY:0,shoulderY:0,head:0,left:0,right:0,tail:0,tailMid:0,tailTip:0,dy:0,blink:0};
 private velocity:CastPose={...this.offset};private acceleration:CastPose={...this.offset};private transition=220;
 sample(time:number,reduced=false):CastPose{
  const pose=castPose(time,this.cue,time-this.started,reduced,this.who),u=clamp((time-this.started)/this.transition,0,1);
  const position=1-smooth(u),velocity=u-6*u**3+8*u**4-3*u**5,acceleration=.5*u*u*(1-u)**3;
  for(const key of Object.keys(pose) as (keyof CastPose)[])pose[key]+=this.offset[key]*position+this.velocity[key]*this.transition*velocity+this.acceleration[key]*this.transition**2*acceleration;
  pose.blink=clamp(pose.blink,0,1);return pose;
 }
 trigger(time:number,cue:CastCue,who:'digger'|'lifeguard',reduced=false){
  const epsilon=.05,current=this.sample(time,reduced),before=this.sample(time-epsilon,reduced),after=this.sample(time+epsilon,reduced),after2=this.sample(time+2*epsilon,reduced);
  const target=castPose(time,cue,0,reduced,who),next=castPose(time+epsilon,cue,epsilon,reduced,who),next2=castPose(time+2*epsilon,cue,2*epsilon,reduced,who);
  // A second cue may arrive in the same frame. Sampling before its start would
  // cross the previous cue boundary and invent a very large acceleration.
  const centred=time-this.started>=epsilon;
  for(const key of Object.keys(target) as (keyof CastPose)[]){
   this.offset[key]=who===this.who?current[key]-target[key]:0;
   this.velocity[key]=who===this.who&&key!=='blink'?((centred?(after[key]-before[key])/2:after[key]-current[key])-(next[key]-target[key]))/epsilon:0;
   this.acceleration[key]=who===this.who&&key!=='blink'?((centred?after[key]-2*current[key]+before[key]:after2[key]-2*after[key]+current[key])-(next2[key]-2*next[key]+target[key]))/epsilon**2:0;
  }
  this.cue=cue;this.who=who;this.started=time;
 }
}

/** Subtle reel/row overlap, retimed inside the existing completion window. */
export function gridSymbolTime(time:number,cell?:{reel:number;row:number}){
 const delay=cell?clamp(cell.reel,0,4)*11+clamp(cell.row-1,0,3)*4:0;
 return clamp((time-delay)*970/(970-delay),0,970);
}
export const symbolContact=(name:string)=>name.startsWith('L')?-.22:name==='S'||name==='W'?0:name==='H3'?.16:name==='H5'?.19:.30;

// Weighted object acting within the established 970ms win / 240ms landing
// contracts: compression -> release -> readable pose -> one controlled settle.
export function symbolPose(name:string,time:number,mode:'win'|'land'='win'){
 const duration=mode==='win'?970:240,t=clamp(time,0,duration),u=t/duration;
 const k=(keys:readonly Key[])=>motionTrack(u,keys);
 let sx=1,sy=1,rotation=0,dx=0,dy=0;
 if(name.startsWith('L'))return {scaleX:1,scaleY:1,rotation:0,dx:0,dy:0,bloomAlpha:0,bloomTint:0xffffff,overlays:[]};
 if(mode==='land'){
  const weight=name==='H1'||name==='H2'?.085:name.startsWith('L')?.03:.055;
  const impact=k([[0,0],[.24,1],[.5,-.32],[.76,.1],[1,0]]);
  sx+=weight*impact;sy-=weight*impact;dy=.022*impact;
  rotation=(name==='H3'?-.12:name==='H5'?.09:name==='S'?.065:.02)*impact;
 }else{
  const prep=k([[0,0],[.12,1],[.24,0],[1,0]]);
  const lift=k([[0,0],[.14,-.14],[.38,1],[.58,.86],[.79,-.12],[1,0]]);
  const settle=k([[0,0],[.55,0],[.74,1],[.87,-.3],[1,0]]);
  switch(name){
   case'H1':sx-=.018*lift;sy+=.025*lift-.035*prep;dy=.012*prep-.018*lift;rotation=.012*settle;break;
   case'H2':sx+=.018*prep;sy-=.025*prep;dy=.01*prep-.025*lift;rotation=.012*settle;break;
   case'H3':rotation=-.15*lift+.035*settle;dx=.028*lift;dy=-.018*lift;break;
   case'H4':rotation=.085*lift-.035*settle;dy=-.025*lift;sy+=.022*lift;break;
   case'H5':rotation=.14*lift-.05*settle;dy=-.03*lift;dx=-.015*prep;break;
   case'W':sx+=.065*lift-.025*prep;sy+=.065*lift-.025*prep;dy=-.026*lift;rotation=.025*settle;break;
   case'S':sx+=.035*lift;rotation=-.055*lift+.015*settle;dy=-.035*lift;break;
   case'SW':rotation=-.11*lift+.03*settle;dx=-.03*lift;dy=-.018*lift;break;
   default:{const i=Number(name.slice(1))||1;rotation=(i%2?1:-1)*(.025+.008*i)*lift;dy=-.009*i*lift;sy+=.02*prep;}
  }
 }
 return {scaleX:sx,scaleY:sy,rotation,dx,dy,bloomAlpha:0,bloomTint:0xffffff,overlays:[]};
}

export function treasurePartPose(name:string,t:number,mode:'win'|'land'|'none'='none'){
 const u=clamp(t/970,0,1),active=mode==='win';
 const open=active?motionTrack(u,[[0,0],[.13,0],[.31,1],[.58,.93],[.78,.12],[.9,0],[1,0]]):0;
 const flag=active?motionTrack(u,[[0,0],[.14,-.12],[.32,1],[.51,-.55],[.69,.24],[.86,-.07],[1,0]]):0;
 return {lid:open,flag,celebrate:active&&t>220&&t<670?Math.sin((t-220)/450*Math.PI):0};
}
