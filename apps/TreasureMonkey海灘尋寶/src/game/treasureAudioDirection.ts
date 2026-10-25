export const TREASURE_FOLEY={
 detector_lock:{file:'detector_lock',volume:.48,gap:80},
 sand_reveal:{file:'sand_reveal',volume:.55,gap:100},
 chest_open:{file:'chest_open',volume:.46,gap:140},
 plaque_flip:{file:'plaque_flip',volume:.38,gap:70},
} as const;
export type TreasureFoley=keyof typeof TREASURE_FOLEY;
export const FOCUS_DURATIONS:Record<string,number>={fs_intro:1.6,win_tier_big:1.62,win_tier_super:2.3,win_tier_mega:3.05,win_tier_epic:4.35,win_tier_max:5.65};
/** Grid-wide updates get one readable accent rather than twenty impacts. */
export class FoleyGate{
 private last=new Map<TreasureFoley,number>();
 admit(cue:TreasureFoley,time:number){
  const previous=this.last.get(cue);
  if(previous!==undefined&&time-previous<TREASURE_FOLEY[cue].gap)return false;
  this.last.set(cue,time);return true;
 }
}
/** A later short accent must not release an already-playing longer flourish. */
export class MusicDuckWindow{
 until=0;level=1;
 request(now:number,duration:number,level:number){
  this.level=now>=this.until?level:Math.min(this.level,level);
  this.until=Math.max(this.until,now+Math.max(0,duration));
  return {until:this.until,level:this.level};
 }
 reset(){this.until=0;this.level=1;}
}
