import {castDuration,motionTrack,type CastCue} from './treasureMotion.ts';
export type Aim={x:number;y:number};
export type EyeState=Aim&{vx:number;vy:number};
const clamp=(n:number)=>Math.max(-1,Math.min(1,n));
export function gazeAim(cue:CastCue,age:number,target?:Aim):Aim{
 const duration=castDuration(cue);
 if(!duration||age<0||age>=duration)return {x:0,y:0};
 const weight=motionTrack(age,[[0,0],[90,1],[Math.max(100,duration-320),1],[duration,0]]);
 const aim=target??(cue==='scan'?{x:-.65,y:.8}:cue==='welcome'?{x:-.25,y:-.15}:{x:-.8,y:.15});
 return {x:clamp(aim.x)*weight,y:clamp(aim.y)*weight};
}
/** Critically damped eye acquisition, retaining velocity when targets change. */
export function followEyes(current:EyeState,target:Aim,delta:number):EyeState{
 const dt=Math.min(.066,Math.max(0,delta/1000)),omega=23,decay=Math.exp(-omega*dt);
 const axis=(value:number,velocity:number,aim:number)=>{
  const offset=value-clamp(aim),step=(velocity+omega*offset)*dt;
  const next=clamp(aim)+(offset+step)*decay;
  return {value:clamp(next),velocity:Math.abs(next)>1?0:(velocity-omega*step)*decay};
 };
 const x=axis(current.x,current.vx,target.x),y=axis(current.y,current.vy,target.y);
 return {x:x.value,y:y.value,vx:x.velocity,vy:y.velocity};
}
type RankedWin={lineIndex:number;symbolCount:number;win?:number;positions:{reel:number;row:number}[]};
export function rankWinningLines<T extends RankedWin>(wins:readonly T[]):T[]{
 const amount=(n:number|undefined)=>Number.isFinite(n)?n??0:0;
 return [...wins].sort((a,b)=>amount(b.win)-amount(a.win)||b.symbolCount-a.symbolCount||a.lineIndex-b.lineIndex);
}
export function readablePlates<T extends {plate?:Aim}>(lines:readonly T[],width:number,height:number):T[]{
 const shown:T[]=[];
 for(const line of lines){
  const p=line.plate;if(!p)continue;
  if(shown.some(other=>other.plate&&Math.abs(other.plate.x-p.x)<width&&Math.abs(other.plate.y-p.y)<height))continue;
  shown.push(line);
 }
 return shown;
}
export function secondarySymbolTime(time:number){return Math.max(0,Math.min(970,(time-44)*970/926));}
