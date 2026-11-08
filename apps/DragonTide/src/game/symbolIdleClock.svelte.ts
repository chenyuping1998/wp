/** One reference-counted rAF for every settled symbol. No per-cell timers. */
import { SYMBOL_IDLE_WRAP } from './symbolIdleMotion';
export const symbolIdleClock=$state({seconds:0,reduced:false,inspection:false,focusPaused:false,bannerPaused:false});
let count=0,raf=0,last=0,media:MediaQueryList|undefined;
const preference=()=>{symbolIdleClock.reduced=media?.matches??false;};
const visible=()=>{last=0;};
const tick=(now:number)=>{
 if(!document.hidden&&!symbolIdleClock.reduced&&!symbolIdleClock.inspection&&last)symbolIdleClock.seconds=(symbolIdleClock.seconds+Math.min(.1,Math.max(0,(now-last)/1000)))%SYMBOL_IDLE_WRAP;
 last=now;raf=requestAnimationFrame(tick);
};
export function useSymbolIdleClock(){
 if(++count===1){media=matchMedia('(prefers-reduced-motion: reduce)');preference();media.addEventListener('change',preference);document.addEventListener('visibilitychange',visible);last=0;raf=requestAnimationFrame(tick);}
 let active=true;return()=>{if(!active)return;active=false;if(--count===0){cancelAnimationFrame(raf);last=0;media?.removeEventListener('change',preference);document.removeEventListener('visibilitychange',visible);}};
}
