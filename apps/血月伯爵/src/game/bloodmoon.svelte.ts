import {stateBet,stateUrlDerived} from 'state-shared';
import {requestEndEvent} from 'rgs-requests';
import {isLocalDemo} from './demo';
import type {Bar,Reveal,FreeState,LineWin,Event,Bet} from './bloodmoonTypes';
import {timingFor,winDuration,FREE_START_MS,FREE_END_MS} from './presentation';
import {requestPresentationFrame} from './frameScheduler';
import {MotionClock} from './motionClock';
export {timingFor} from './presentation';
const initial=()=>Array.from({length:6},(_,c)=>Array.from({length:6},(_,r)=>(c*3+r)%8));
const freeInitial=():FreeState=>({points:0,stage:0,multiplier:1,spinsPlayed:0,spinsTotal:6});
export const stateBloodMoon=$state({board:initial(),bars:[] as Bar[],reveal:null as Reveal|null,phase:'idle',clock:0,duration:0,presentationId:0,turbo:false,skipped:false,fg:freeInitial(),progress:null as {before:FreeState;after:FreeState;addedSpins:number}|null,inFree:false,wins:[] as LineWin[],baseWin:0,winMultiplier:1,totalWin:0,spinWin:0,transitionText:'',progressText:'',ready:false});
let skip=false;
export function stopBloodMoon(){skip=true;}
export function resetBloodMoon(){stateBloodMoon.inFree=false;stateBloodMoon.fg=freeInitial();stateBloodMoon.progress=null;stateBloodMoon.totalWin=0;stateBloodMoon.spinWin=0;stateBloodMoon.baseWin=0;stateBloodMoon.winMultiplier=1;stateBloodMoon.wins=[];stateBloodMoon.transitionText='';stateBloodMoon.progressText='';}
export function animateClock(duration:number){
  stateBloodMoon.clock=0;stateBloodMoon.duration=duration;stateBloodMoon.skipped=false;skip=false;
  return new Promise<void>(resolve=>{
    const clock=new MotionClock(performance.now());
    const visibility=()=>clock.setHidden(document.hidden,performance.now());
    visibility();document.addEventListener('visibilitychange',visibility);
    const frame=(now:number)=>{stateBloodMoon.skipped=skip;stateBloodMoon.clock=skip?duration:Math.min(duration,clock.read(now));if(stateBloodMoon.clock>=duration){document.removeEventListener('visibilitychange',visibility);resolve();return;}requestPresentationFrame(frame);};
    requestPresentationFrame(frame);
  });
}
function apply(e:Event){
  if(e.type==='reveal'){stateBloodMoon.presentationId++;stateBloodMoon.turbo=stateBet.isTurbo;stateBloodMoon.reveal=e;stateBloodMoon.board=e.board;stateBloodMoon.bars=e.bars;stateBloodMoon.wins=[];stateBloodMoon.progress=null;stateBloodMoon.inFree=e.gameType==='free';}
  if(e.type==='freeStart'){stateBloodMoon.fg=freeInitial();stateBloodMoon.inFree=true;}
  if(e.type==='freeProgress'){stateBloodMoon.progress={before:{...e.before},after:{...e.after},addedSpins:e.addedSpins};stateBloodMoon.fg={...e.after};}
  if(e.type==='winInfo'){stateBloodMoon.wins=e.wins;stateBloodMoon.baseWin=e.basePayout;stateBloodMoon.winMultiplier=e.multiplier;stateBloodMoon.totalWin=e.totalWin;stateBloodMoon.spinWin=e.payout;stateBet.winBookEventAmount=e.totalWin;}
  if(e.type==='finalWin'){stateBloodMoon.inFree=false;stateBloodMoon.totalWin=e.amount;stateBet.winBookEventAmount=e.amount;}
}
export function settleBloodMoon(events:Event[]){resetBloodMoon();for(const e of events)apply(e);stateBloodMoon.phase='idle';stateBloodMoon.clock=1e6;}
export async function playEvents(events:Event[]){
  for(const e of events){
    apply(e);
    switch(e.type){
      case 'reveal':stateBloodMoon.phase='spin';await animateClock(timingFor(e,stateBet.isTurbo).duration);break;
      case 'freeStart':stateBloodMoon.phase='freeStart';stateBloodMoon.transitionText='6 FREE SPINS';await animateClock(FREE_START_MS);break;
      case 'freeProgress':stateBloodMoon.phase='progress';stateBloodMoon.progressText=e.addedSpins?'upgrade':'';await animateClock(e.addedSpins?2300:1050);stateBloodMoon.progressText='';break;
      case 'winInfo':stateBloodMoon.phase='win';await animateClock(winDuration(e.payout,stateBloodMoon.turbo));break;
      case 'freeEnd':stateBloodMoon.phase='freeEnd';stateBloodMoon.transitionText=`${e.spinsPlayed} FREE SPINS`;await animateClock(FREE_END_MS);break;
      case 'finalWin':break;
      default:throw Error('Unsupported Blood Moon event');
    }
    // A completed-event cursor is the NEXT index. Restore previous events without
    // animations, then play from this cursor: collecting points is idempotent.
    if(!isLocalDemo()&&!stateUrlDerived.replay()){
      try{await requestEndEvent({sessionID:stateUrlDerived.sessionID(),rgsUrl:stateUrlDerived.rgsUrl(),eventIndex:e.index+1});}
      catch(error){console.warn('Could not save presentation progress',error);}
    }
  }
  stateBloodMoon.phase='idle';stateBloodMoon.transitionText='';
}
export async function playBet(bet:Bet){await playEvents(bet.state);}
export function resumable(bet:Bet){
  const cursor=Math.max(0,Number(bet.event)||0);
  settleBloodMoon(bet.state.filter(e=>e.index<cursor));
  return {...bet,state:bet.state.filter(e=>e.index>=cursor)};
}
