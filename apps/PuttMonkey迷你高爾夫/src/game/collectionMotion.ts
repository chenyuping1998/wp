/** Deterministic presentation paths; payouts remain owned by the book. */
import { strike } from './motionKit';
export type Position = { x:number; y:number };
export type FlightPose = Position & { scale:number; rotation:number; alpha:number };
const clamp=(v:number)=>Math.max(0,Math.min(1,v));
const ease=(v:number)=>{const t=clamp(v);return t*t*(3-2*t);};
const bezier=(a:number,b:number,c:number,d:number,t:number)=>{
 const q=1-t;return q*q*q*a+3*q*q*t*b+3*q*t*t*c+t*t*t*d;
};
export const collectionStagger=(count:number)=>Math.min(90,480/Math.max(1,count-1));
export const pickStagger=(count:number)=>Math.min(35,140/Math.max(1,count-1));
/** One ball owns the stage at a time; dense boards become a quick putting streak.
 *  Between the pick and the roll is the putter's wind-up (`wind`): long on the
 *  first and the last putt, a quick tap on the streak in between. */
export const puttSequence=(count:number)=>{
 const n=Math.max(0,Math.floor(count));
 let cursor=0;
 return Array.from({length:n},(_,i)=>{
  const finale=i===n-1;
  const duration=finale?1320:i===0?720:Math.max(130,Math.min(440,1800/Math.max(1,n-2)));
  const wind=finale||i===0?220:80;
  const pickAt=cursor,start=pickAt+wind,end=start+duration;
  cursor=end+35;
  return {pickAt,start,end,duration,finale,wind};
 });
};

/** THE PUTTER (2026-10-23): the golfer's own putter, swung on spine-generator's
 *  strike — back on the wind-up, accelerating into the ball (the contact is the
 *  moment the ball starts), through it, then away. Radians off hanging
 *  straight down, + swung back away from the cup. Time from the pick, ms. */
export const putterSwing=(wind:number)=>strike({
 // the two add up to `wind` exactly: the contact IS the ball's start
 anticipation:{value:wind>100?.45:.25,time:wind-Math.min(60,wind*.45),ease:'sineOut'},
 action:{value:0,time:Math.min(60,wind*.45),ease:'quartIn'},
 // a short follow-through: the ball runs away from the head, as a putt does
 overshoot:{amount:wind>100?.12:.07,hz:3,damping:.5},
 hold:wind>100?170:90,
 recover:{time:150,ease:'sineInOut'},
});
/** how far a putt has rolled (0..1) at v (0..1) of its run: struck, so it
 *  leaves at its fastest and slows. `die` 1 = it has nothing left at the lip
 *  (the finale's tease); less, it drops in with some pace. */
const puttRoll=(v:number,die:number)=>{const u=clamp(v);return u*(1+die)-die*u*u;};
export const abductionPose=(from:Position,to:Position,t:number):FlightPose=>{
 const u=clamp(t),e=.25*u+.75*u*u,dy=from.y-to.y;
 return {
  x:bezier(from.x,from.x,to.x+(from.x-to.x)*.06,to.x,e),
  y:bezier(from.y,from.y-dy*.35,to.y+dy*.20,to.y,e),
  scale:.88*(1-.91*Math.pow(u,1.7)),
  rotation:Math.sin(u*Math.PI)*.16+(from.x<to.x?-1:1)*u*.18,
  alpha:1-ease((u-.86)/.14)
 };
};
export const puttPose=(from:Position,to:Position,t:number,die=1):FlightPose=>{
 const u=clamp(t),side=from.x<to.x?1:-1;
 const pathLength=Math.hypot(to.x-from.x,to.y-from.y)+55;
 const radius=44;
 if(u<.66){
  const e=puttRoll(u/.66,die);
  return {
   // the first handle long: the ball leaves the putter fast
   x:bezier(from.x,from.x+(to.x-from.x)*.34,to.x-(to.x-from.x)*.2,to.x-20,e),
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

/** Quick straight putts lead to one final lip-out tease, then the cup drop. */
export const puttStrokePose=(from:Position,to:Position,t:number,finale:boolean):FlightPose=>{
 const u=clamp(t);
 if(!finale){
  if(u<.78)return puttPose(from,to,u/.78*.66,.55);
  const p=puttPose(from,to,.91+(u-.78)/.22*.09);
  const turn=puttPose(from,to,.66).rotation;
  return {...p,rotation:turn+(from.x<to.x?1:-1)*ease((u-.78)/.22)*.35};
 }
 if(u<.56)return puttPose(from,to,u/.56*.66);
 if(u<.75)return puttPose(from,to,.66+(u-.56)/.19*.21);
 if(u<.89){
  const wobble=(u-.75)/.14,p=puttPose(from,to,.88);
  const nudge=Math.sin(wobble*Math.PI*4)*(1-wobble);
  return {...p,x:p.x+nudge*2.4,y:p.y+nudge*1.2,rotation:p.rotation+nudge*.09};
 }
 return puttPose(from,to,.91+(u-.89)/.11*.09);
};
