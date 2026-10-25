import {motionTrack} from './treasureMotion.ts';
type Point={x:number;y:number};
export function lineTravel(time:number,entry:number,duration:number){
 const p=Math.max(0,Math.min(1,(time-entry)/Math.max(1,duration)));
 return motionTrack(p,[[0,0],[.18,.10],[.74,.86],[1,1]]);
}
export function linePose(points:readonly Point[],progress:number){
 if(points.length<2)return {...(points[0]??{x:0,y:0}),angle:0,reel:0};
 const lengths=points.slice(1).map((p,i)=>Math.hypot(p.x-points[i].x,p.y-points[i].y));
 const total=lengths.reduce((sum,n)=>sum+n,0);
 const at=(distance:number)=>{
  let left=Math.max(0,Math.min(total,distance)),index=0;
  while(index<lengths.length-1&&left>lengths[index]){left-=lengths[index];index++;}
  const f=lengths[index]?Math.max(0,Math.min(1,left/lengths[index])):0,a=points[index],b=points[index+1];
  return {x:a.x+(b.x-a.x)*f,y:a.y+(b.y-a.y)*f,reel:Math.min(points.length-1,Math.round(index+f))};
 };
 const distance=Math.max(0,Math.min(1,progress))*total,p=at(distance),before=at(distance-10),after=at(distance+10);
 return {...p,angle:Math.atan2(after.y-before.y,after.x-before.x)};
}
