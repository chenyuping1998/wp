/** Authored multiplier performance. Positions are in board space, never money. */
export type Point={x:number;y:number};
export type OrbVisual=Point&{id:number;value:number;scale:number;alpha:number;stone:number;crack:number;angle:number;sx:number;sy:number;trail:Point[];charging?:boolean};
export const ORB_CHARGE_DISTANCE=84;
const clamp=(v:number)=>Math.max(0,Math.min(1,v));
/** Fast focus, sustained gaze, then a deliberate release. No repeated pulse. */
export function gazePose(progress:number){
 const t=clamp(progress),attack=clamp(t/.11),release=1-clamp((t-.68)/.32);
 return{intensity:Math.min(attack,release),reach:1-(1-clamp(t/.26))**3,focus:(1-clamp(t/.28))**2,stone:clamp((t-.17)/.55)};
}
export const orbColor=(value:number)=>value>=100?0xffc64d:value>=15?0xc795ff:0xb8ff5a;
export function flightPose(from:Point,to:Point,progress:number){
 const t=clamp(progress),u=t*t*(2-t),dx=to.x-from.x,dy=to.y-from.y;
 const lift=Math.min(122,Math.abs(dx)*.105+26),a={x:from.x+dx*.25,y:from.y+dy*.22-lift},b={x:to.x-dx*.20,y:to.y-dy*.12-lift*.68};
 const at=(p:number)=>{const q=1-p;return{x:q*q*q*from.x+3*q*q*p*a.x+3*q*p*p*b.x+p*p*p*to.x,y:q*q*q*from.y+3*q*q*p*a.y+3*q*p*p*b.y+p*p*p*to.y};};
 const point=at(u),q=1-u,tangent={x:3*q*q*(a.x-from.x)+6*q*u*(b.x-a.x)+3*u*u*(to.x-b.x),y:3*q*q*(a.y-from.y)+6*q*u*(b.y-a.y)+3*u*u*(to.y-b.y)};
 const stretch=.23*Math.sin(Math.PI*Math.min(1,t*1.8));
 return {...point,angle:Math.atan2(tangent.y,tangent.x),sx:1+stretch,sy:1/(1+stretch),scale:.88+.12*clamp(t/.13),trail:Array.from({length:13},(_,i)=>{const old=Math.max(0,t-i*.026);return at(old*old*(2-old));})};
}
export function impactPose(progress:number){
 const t=clamp(progress);
 // Two readable frames of contact, then a compressed silhouette and a release.
 if(t<.22)return{sx:1.19,sy:.76,scale:1,alpha:1};
 const p=(t-.22)/.78;return{sx:1.19-.32*Math.sin(p*Math.PI/2),sy:.76+.47*Math.sin(p*Math.PI/2),scale:1+.17*p,alpha:(1-p)**1.55};
}
export function recoil(progress:number){const t=clamp(progress);return t<.18?t/.18:t<.55?1-(t-.18)/.37*1.15:-.15*(1-(t-.55)/.45);}
