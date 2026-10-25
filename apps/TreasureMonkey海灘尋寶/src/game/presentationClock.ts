/** One animation frame for a board full of symbols. No DOM access on import. */
type Host={request:(fn:(time:number)=>void)=>number;cancel:(id:number)=>void;now:()=>number;hidden:()=>boolean;visibility:(fn:()=>void)=>()=>void};
export class PresentationClock{
 private listeners=new Set<(delta:number,time:number)=>void>();
 private frame=0;private previous=0;private unlisten:(()=>void)|undefined;
 private host:Host;
 constructor(host:Host){this.host=host;}
 subscribe(listener:(delta:number,time:number)=>void){
  this.listeners.add(listener);
  if(this.listeners.size===1){this.previous=this.host.now();this.unlisten=this.host.visibility(()=>{this.previous=this.host.now();});this.frame=this.host.request(this.tick);}
  let active=true;
  return()=>{if(!active)return;active=false;this.listeners.delete(listener);if(!this.listeners.size){this.host.cancel(this.frame);this.frame=0;this.unlisten?.();this.unlisten=undefined;}};
 }
 private tick=(time:number)=>{
  this.frame=0;const delta=this.host.hidden()?0:Math.max(0,time-this.previous);this.previous=time;
  let failure:unknown;
  for(const listener of [...this.listeners])if(this.listeners.has(listener)){try{listener(delta,time);}catch(error){failure??=error;}}
  if(this.listeners.size&&!this.frame)this.frame=this.host.request(this.tick);
  if(failure)throw failure;
 };
}
let clock:PresentationClock|undefined;
export function subscribePresentationFrame(listener:(delta:number,time:number)=>void){
 clock??=new PresentationClock({request:fn=>requestAnimationFrame(fn),cancel:id=>cancelAnimationFrame(id),now:()=>performance.now(),hidden:()=>document.hidden,visibility:fn=>{document.addEventListener('visibilitychange',fn);return()=>document.removeEventListener('visibilitychange',fn);}});
 return clock.subscribe(listener);
}
