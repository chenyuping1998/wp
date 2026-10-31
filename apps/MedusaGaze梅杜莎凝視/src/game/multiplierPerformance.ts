/** Authored multiplier performance. Positions are in board space, never money. */
import {orbPower} from './orbPower.ts';
export type Point={x:number;y:number};
export type OrbVisual=Point&{id:number;value:number;scale:number;alpha:number;stone:number;crack:number;angle:number;sx:number;sy:number;trail:Point[];charging?:boolean;chargeProgress?:number;flightProgress?:number};
export const ORB_CHARGE_DISTANCE=84;
const clamp=(v:number)=>Math.max(0,Math.min(1,v));
const ease=(v:number)=>{const t=clamp(v);return t*t*(3-2*t);};
// A real launch already carries momentum at release; keep enough terminal
// speed for the contact to read as a strike rather than a floating arrival.
export const flightDistance=(progress:number)=>{const t=clamp(progress);return .65*t+.35*t*t*(3-2*t);};
/** Fast focus, sustained gaze, then a deliberate release. No repeated pulse. */
export function gazePose(progress:number){
 const t=clamp(progress),attack=clamp(t/.12),releaseEase=1-clamp((t-.82)/.18);
 return{intensity:Math.min(attack,releaseEase),reach:1-(1-clamp(t/.26))**3,focus:(1-clamp(t/.28))**2,stone:clamp((t-.17)/.55),spread:1-(1-clamp((t-.18)/.30))**3,gather:clamp((t-.38)/.27)};
}
/** Short, varied rays radiate around the eyes; none is a long beam to score. */
export function eyeRadianceRays(eye:Point,charge:Point,progress:number,eyeIndex=0){
 const pose=gazePose(progress),aim=Math.atan2(charge.y-eye.y,charge.x-eye.x);
 return Array.from({length:12},(_,index)=>{
  const angle=aim+index*Math.PI/6+eyeIndex*.15,facing=(1+Math.cos(angle-aim))/2;
  const inner=9+4*pose.spread,outer=inner+(38+102*facing*facing+(index%3)*10)*pose.spread;
  return{from:{x:eye.x+Math.cos(angle)*inner,y:eye.y+Math.sin(angle)*inner},to:{x:eye.x+Math.cos(angle)*outer,y:eye.y+Math.sin(angle)*outer},width:3.5+(index%3)*1.2,alpha:(.34+.5*facing)*pose.spread};
 });
}
export const orbColor=(value:number)=>orbPower(value).color;
/** Later charges fan above/below the lead orb, keeping their labels separate. */
export function orbLaunchPoint(origin:Point,to:Point,order=0){
 const dx=to.x-origin.x,dy=to.y-origin.y,length=Math.hypot(dx,dy)||1,lane=order===0?0:order%2?1:-1;
 return{x:origin.x+dx/length*ORB_CHARGE_DISTANCE-dy/length*lane*52,y:origin.y+dy/length*ORB_CHARGE_DISTANCE+dx/length*lane*52};
}
/** Grow, hold an overshoot, then pull back and squeeze before the flick. */
export function orbChargePose(from:Point,to:Point,progress:number){
 const t=clamp(progress),dx=to.x-from.x,dy=to.y-from.y,length=Math.hypot(dx,dy)||1,wind=ease((t-.65)/.35);
 const scale=t<.65?.12+.92*(1-(1-t/.65)**3):1.04-.20*wind,sx=1-.14*wind;
 const x=from.x-dx/length*14*wind,y=from.y-dy/length*14*wind-5*Math.sin(Math.PI*wind),aim=Math.atan2(dy,dx);
 const lift=Math.min(122,Math.abs(to.x-x)*.105+26),launchAngle=Math.atan2((to.y-y)*.22-lift,(to.x-x)*.25);
 const turn=Math.atan2(Math.sin(launchAngle-aim),Math.cos(launchAngle-aim));
 return{x,y,scale,sx,sy:1/sx,angle:aim+turn*wind,alpha:ease(t/.3),charging:true,chargeProgress:t};
}
/** Two counter-wound strands follow the actual sampled arc, with no laser. */
export function orbWakePoint(trail:Point[],index:number,progress:number,strand=0,strands=2){
 const point=trail[index],ahead=trail[Math.max(0,index-1)],behind=trail[Math.min(trail.length-1,index+1)];
 const dx=ahead.x-behind.x,dy=ahead.y-behind.y,length=Math.hypot(dx,dy)||1,fade=1-index/Math.max(1,trail.length-1);
 const phase=progress*Math.PI*5.5-index*.9+strand*Math.PI*2/strands,wave=Math.sin(phase)*(6+10*fade);
 return{x:point.x-dy/length*wave,y:point.y+dx/length*wave,alpha:fade*fade*(.55+.25*Math.cos(phase)**2),width:.7+2*fade};
}
export function flightPose(from:Point,to:Point,progress:number){
 const t=clamp(progress),u=flightDistance(t),dx=to.x-from.x,dy=to.y-from.y;
 const lift=Math.min(122,Math.abs(dx)*.105+26),a={x:from.x+dx*.25,y:from.y+dy*.22-lift},b={x:to.x-dx*.20,y:to.y-dy*.12-lift*.68};
 // A single serpentine bend belongs to the thrown spell, not the whole scene.
 const wave=Math.min(34,Math.abs(dx)*.065+6);
 const at=(p:number)=>{const q=1-p;return{x:q*q*q*from.x+3*q*q*p*a.x+3*q*p*p*b.x+p*p*p*to.x,y:q*q*q*from.y+3*q*q*p*a.y+3*q*p*p*b.y+p*p*p*to.y-wave*Math.sin(p*Math.PI*2)*Math.sin(p*Math.PI)};};
 const point=at(u),q=1-u,tangent={x:3*q*q*(a.x-from.x)+6*q*u*(b.x-a.x)+3*u*u*(to.x-b.x),y:3*q*q*(a.y-from.y)+6*q*u*(b.y-a.y)+3*u*u*(to.y-b.y)};
 tangent.y-=wave*(Math.PI*2*Math.cos(u*Math.PI*2)*Math.sin(u*Math.PI)+Math.PI*Math.sin(u*Math.PI*2)*Math.cos(u*Math.PI));
 const sx=t<.12?.86+.42*ease(t/.12):1+.28*(1-ease((t-.12)/.75));
 return {...point,angle:Math.atan2(tangent.y,tangent.x),sx,sy:1/sx,scale:.84+.16*ease(t/.13),flightProgress:t,trail:Array.from({length:13},(_,i)=>at(flightDistance(t-i*.026)))};
}
/** Local release pressure ring and six short fingers of displaced light. */
export function releaseAccent(progress:number){const p=clamp(progress/.28);return{radius:18+62*(1-(1-p)**3),alpha:(1-p)**2,stretch:.34+.2*p,flash:(1-clamp(p/.24))**2};}
export function impactPose(progress:number,incomingAngle=0){
 const t=clamp(progress);
 // Two readable frames of contact, then a compressed silhouette and a release.
 if(t<.22)return{sx:1.19,sy:.76,scale:1,alpha:1,angle:incomingAngle};
 const p=(t-.22)/.78;return{sx:1.19-.32*Math.sin(p*Math.PI/2),sy:.76+.47*Math.sin(p*Math.PI/2),scale:1+.17*p,alpha:(1-p)**1.55,angle:incomingAngle};
}
export function recoil(progress:number){const t=clamp(progress);return t<.18?t/.18:t<.55?1-(t-.18)/.37*1.15:-.15*(1-(t-.55)/.45);}
