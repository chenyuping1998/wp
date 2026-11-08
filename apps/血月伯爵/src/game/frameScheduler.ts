// The normal game uses rAF. Explicit local recording can drive the same clocks
// and render callbacks with a timer when an embedded preview throttles rAF.
let recording=false,nextId=0,pumping=false,lastPump=0;
const callbacks=new Map<number,FrameRequestCallback>();
let scheduled:{kind:'raf'|'timer';id:number|ReturnType<typeof setTimeout>}|null=null;
let renderer:((time:number)=>void|Promise<void>)|undefined;
function clearScheduled(){
 if(!scheduled)return;
 if(scheduled.kind==='raf')cancelAnimationFrame(scheduled.id as number);else clearTimeout(scheduled.id as ReturnType<typeof setTimeout>);
 scheduled=null;
}
function schedule(){
 if(scheduled||pumping||!callbacks.size)return;
 if(recording)scheduled={kind:'timer',id:setTimeout(()=>void pump(performance.now()),Math.max(0,lastPump+1000/60-performance.now()))};
 else scheduled={kind:'raf',id:requestAnimationFrame(pump)};
}
async function pump(time:number){
 scheduled=null;pumping=true;lastPump=time;
 try{
  const batch=[...callbacks.values()];callbacks.clear();
  for(const callback of batch)callback(time);
  if(recording)await renderer?.(time);
 }finally{pumping=false;schedule();}
}
export function requestPresentationFrame(callback:FrameRequestCallback){const id=++nextId;callbacks.set(id,callback);schedule();return id;}
export function cancelPresentationFrame(id:number){callbacks.delete(id);if(!callbacks.size)clearScheduled();}
export function isReviewRecording(){return recording;}
export function setReviewFrameDriver(value:boolean,render?:typeof renderer){clearScheduled();recording=value;renderer=value?render:undefined;lastPump=performance.now();schedule();}
