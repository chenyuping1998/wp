/** Animation time excludes time spent in a hidden document. Wall-clock gaps
 * must not skip a WILD cut, a tier transition or an entire free-spin result. */
export class MotionClock {
 private last:number;
 private pausedAt:number|null=null;
 private paused=0;
 private start:number;
 constructor(start:number){this.start=start;this.last=start;}
 private monotonic(now:number){this.last=Math.max(this.last,now);return this.last;}
 setHidden(hidden:boolean,now:number){
  now=this.monotonic(now);
  if(hidden&&this.pausedAt===null)this.pausedAt=now;
  else if(!hidden&&this.pausedAt!==null){this.paused+=now-this.pausedAt;this.pausedAt=null;}
 }
 read(now:number){now=this.monotonic(now);return Math.max(0,(this.pausedAt??now)-this.start-this.paused);}
}
