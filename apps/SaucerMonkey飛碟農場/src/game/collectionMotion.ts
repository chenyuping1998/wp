/** Deterministic presentation paths; payouts remain owned by the book. */
export type Position = { x:number; y:number };
export type FlightPose = Position & { scale:number; rotation:number; alpha:number };
const clamp=(v:number)=>Math.max(0,Math.min(1,v));
const ease=(v:number)=>{const t=clamp(v);return t*t*(3-2*t);};
const bezier=(a:number,b:number,c:number,d:number,t:number)=>{
 const q=1-t;return q*q*q*a+3*q*q*t*b+3*q*t*t*c+t*t*t*d;
};
export const collectionStagger=(count:number)=>Math.min(90,480/Math.max(1,count-1));
export const pickStagger=(count:number)=>Math.min(35,140/Math.max(1,count-1));
/**
 * The cow's flight up the beam (2026-10-23): she floats first — slow, swaying,
 * turning over once, weightless and unimpressed — then the saucer takes hold
 * and she is hauled in, faster and smaller, righting herself just as she goes
 * (acts.ts P_PICK stretches her long and thin over the same stretch).
 */
export const abductionPose=(from:Position,to:Position,t:number):FlightPose=>{
 const u=clamp(t),side=from.x<to.x?1:-1;
 const float=ease(u/.55),pull=Math.pow(clamp((u-.45)/.55),2.2);
 const along=.24*float+.76*pull;
 const sway=12*Math.sin(u*Math.PI*2*1.4)*(1-pull);
 return {
  x:from.x+(to.x-from.x)*(.08*float+.92*pull)+sway,
  y:from.y+(to.y-from.y)*along,
  scale:.88*(1-.22*u)*(1-.95*ease((u-.8)/.2)),
  rotation:side*Math.PI*2*ease(u/.92)+.12*Math.sin(u*Math.PI*3)*(1-pull),
  alpha:1-ease((u-.93)/.07)
 };
};
export const puttPose=(from:Position,to:Position,t:number):FlightPose=>{
 const u=clamp(t),side=from.x<to.x?1:-1;
 const pathLength=Math.hypot(to.x-from.x,to.y-from.y)+55;
 const radius=44;
 if(u<.66){
  const e=ease(u/.66);
  return {
   x:bezier(from.x,from.x+(to.x-from.x)*.24,to.x-(to.x-from.x)*.2,to.x-20,e),
   y:bezier(from.y,Math.max(20,Math.min(520,from.y+side*48)),to.y-36,to.y-4,e),
   scale:.88-.34*e,rotation:side*pathLength*e/radius,alpha:1
  };
 }
 const rim=ease((u-.66)/.21),angle=Math.PI+rim*Math.PI*2;
 const rotation=side*(pathLength+rim*Math.PI*40)/radius;
 if(u<.87)return {x:to.x+Math.cos(angle)*20,y:to.y-4+Math.sin(angle)*6,scale:.54,rotation,alpha:1};
 if(u<.91)return {x:to.x-20,y:to.y-4,scale:.54,rotation,alpha:1};
 const sink=ease((u-.91)/.09);
 return {x:to.x-20*(1-sink),y:to.y-4+12*sink,scale:.54*Math.pow(1-sink,1.4),
  rotation:rotation+side*sink*.35,alpha:1-sink};
};
