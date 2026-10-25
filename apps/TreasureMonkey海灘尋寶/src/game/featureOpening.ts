import {motionTrack} from './treasureMotion.ts';

export const OPENING={chestStart:1570,chestSound:1860,wave:3200,cover:3700,end:4480} as const;
export type OpeningSound='scan'|'find'|'chest'|'celebrate'|'wave';
type Hooks={sound?:(cue:OpeningSound)=>void;cover:()=>void;complete:()=>void};
/** Presentation only: no game-state, award or spin mutations. */
export class FeatureOpeningTimeline{
 time=0;private covered=false;private done=false;private sounds=new Set<OpeningSound>();
 private hooks:Hooks;
 constructor(hooks:Hooks){this.hooks=hooks;}
 advance(delta:number){
  if(this.done)return;
  this.time=Math.min(OPENING.end,this.time+Math.max(0,delta));
  for(const [at,name] of [[180,'scan'],[1180,'find'],[OPENING.chestSound,'chest'],[2060,'celebrate'],[OPENING.wave,'wave']] as const){
   if(this.time>=at&&!this.sounds.has(name)){this.sounds.add(name);this.hooks.sound?.(name);}
  }
  if(this.time>=OPENING.cover)this.cover();
  if(this.time>=OPENING.end)this.finish();
 }
 private cover(){if(!this.covered){this.covered=true;this.hooks.cover();}}
 private finish(){if(!this.done){this.done=true;this.hooks.complete();}}
 skip(){if(this.done)return;this.cover();this.finish();}
 cancel(){this.done=true;}
}
export function featureOpeningPose(time:number,reduced=false){
 const t=Math.max(0,Math.min(OPENING.end,time));
 const track=(keys:readonly (readonly [number,number])[])=>motionTrack(t,keys);
 return {
  camera:reduced?1:track([[0,1],[500,1],[1800,1.035],[2900,1.055],[3200,1.055]]),
  light:track([[0,0],[1180,0],[1660,1],[2160,.78],[3200,.78]]),
  chest:track([[0,0],[1450,0],[2070,1],[3200,1]]),
  title:track([[0,0],[2080,0],[2480,1],[3200,1]]),
  titleY:reduced?0:track([[0,24],[2080,24],[2450,-3],[2700,0],[3200,0]]),
  cue:t<1960?'scan' as const:'winBig' as const,
  actorTime:t<1960?t:t-1960,
 };
}
