import type {Reveal,FreeState} from './bloodmoonTypes';

export const ENERGY_END=1000;
export const MULTIPLIER_AT=1150;
export const PLUS_SPINS_AT=1700;
export const WILD_IN_AT=400;
export const WILD_LOOP_AT=900;
export const WILD_LOOP_MS=1000;
export const FREE_START_MS=4200;
export const FREE_END_MS=4200;
export const clamp01=(n:number)=>Math.max(0,Math.min(1,n));
export const easeOut=(n:number)=>1-Math.pow(1-clamp01(n),3);

/** One plan drives the reels, video, fog, outcomes and sound. Times are ms. */
export function timingFor(reveal:Reveal,turbo=false){
 const mergeEnd=Math.max(0,...reveal.mergePlan.map(s=>1500+s.delayMs+s.durationMs+450));
 const stopAt=Math.max(turbo?650:2300,mergeEnd);
 // The original Loop is exactly one second. Out starts in the same pose as
 // its final frame; cutting a partial cycle creates a visible body snap.
 const attackAt=WILD_LOOP_AT+Math.ceil((Math.max(2300,stopAt)-WILD_LOOP_AT)/WILD_LOOP_MS)*WILD_LOOP_MS;
 const count=reveal.wildPlan.targets.length;
 const outcomeStep=count>1?Math.min(65,700/(count-1)):0;
 const revealAt=attackAt+1500;
 const lastOutcomeAt=revealAt+Math.max(0,count-1)*outcomeStep;
 return {stopAt,attackAt,fogAt:attackAt+300,revealAt,backAt:revealAt,outcomeStep,
  duration:reveal.wildPlan.triggered?Math.max(attackAt+3100,lastOutcomeAt+1000)+50:stopAt+383};
}
export function characterSpec(phase:string,clock:number,spinWin:number,reveal:Reveal|null,turbo=false){
 if(phase==='win'&&spinWin>0&&clock<1533)return {name:spinWin>=10000?'Win_03':spinWin>=5000?'Win_025':spinWin>=2000?'Win_02':'Win_01',elapsed:clock,loop:false};
 if(phase!=='spin'||!reveal?.wildPlan.triggered)return {name:'Idle',elapsed:0,loop:true};
 const t=timingFor(reveal,turbo),variant=String(reveal.wildPlan.variant).padStart(2,'0');
 if(clock<WILD_IN_AT)return {name:'Idle',elapsed:0,loop:true};
 if(clock<WILD_LOOP_AT)return {name:`WildTrans_${variant}_In`,elapsed:clock-WILD_IN_AT,loop:false};
 if(clock<t.attackAt)return {name:`WildTrans_${variant}_Loop`,elapsed:clock-WILD_LOOP_AT,loop:true};
 if(clock<t.backAt)return {name:`WildTrans_${variant}_Out`,elapsed:clock-t.attackAt,loop:false};
 return {name:'WildTrans_Back',elapsed:clock-t.backAt,loop:false};
}
export const outcomeAt=(reveal:Reveal,index:number,turbo=false)=>timingFor(reveal,turbo).revealAt+index*timingFor(reveal,turbo).outcomeStep;
export function barStopAt(reveal:Reveal,col:number,size:number,turbo=false){return size>=3?timingFor(reveal,turbo).stopAt:turbo?650:1300+col*200;}

/** A complete strip travels an integral number of cells and lands at offset 0.
 * Acceleration/deceleration meet with continuous velocity. No modulus jump is
 * visible because every cell, including both padding ends, belongs to the strip.
 */
export function reelMotion(clock:number,stopAt:number,cellHeight:number,bounce=true){
 const run=Math.max(1,stopAt),p=clamp01(clock/run);
 const distance=Math.max(4,Math.ceil(run*2.3/cellHeight))*cellHeight;
 const accel=.12,decel=.28,normalizer=1-(accel+decel)/2;
 let covered:number;
 if(p<accel)covered=p*p/(2*accel);
 else if(p<1-decel)covered=p-accel/2;
 else{const left=1-p;covered=normalizer-left*left/(2*decel);}
 const travel=distance*covered/normalizer;
 const remaining=clock<run?Math.max(0,distance-travel):0;
 const shift=clock<run?Math.floor(remaining/cellHeight):0;
 const b=clamp01((clock-run)/280);
 // Smooth contact: zero velocity at both ends of the settle, rather than a
 // sudden kick the instant the decelerating strip reaches its destination.
 return {moving:clock<run,remaining,shift,offset:clock<run?shift*cellHeight-remaining:bounce?Math.sin(b*Math.PI)**2*10*Math.exp(-2*b):0};
}

export type AudioCue={at:number;key:string;gain?:number};
export function revealAudioCues(reveal:Reveal,turbo=false):AudioCue[]{
 const t=timingFor(reveal,turbo),mode=reveal.gameType==='free'?'fg':'ng';
 const cues:AudioCue[]=[{at:0,key:'ngStart',gain:.5}];
 if(reveal.gameType==='free')cues.push({at:40,key:'fgSpinsReduce',gain:.32});
 if(reveal.gameType==='base'&&reveal.board.flat().filter(s=>s===9).length>=3)cues.push({at:Math.min(1700,t.stopAt),key:'freeForecast',gain:.4});
 for(const bar of reveal.bars)cues.push({at:barStopAt(reveal,bar.col,bar.size,turbo),key:bar.size>=3?'stop_6x6':'stop',gain:.65});
 for(const step of reveal.mergePlan)cues.push({at:1500+step.delayMs,key:'iconExpansion',gain:.45});
 if(reveal.wildPlan.triggered){
  cues.push({at:400,key:reveal.wildPlan.variant===2?'CharaForecastWild2':'CharaForecastWild1',gain:.55},
   {at:900,key:'WildHuntWord',gain:.32},
   {at:t.attackAt,key:'CharaWild',gain:.6},{at:t.attackAt+150,key:`${mode}WILDbat`,gain:.45},
   {at:t.backAt,key:'CharaBack',gain:.45});
  if(reveal.wildPlan.targets.some(target=>target.success))cues.push({at:t.revealAt,key:'WildSuccess',gain:.3});
  let last=-Infinity;
  reveal.wildPlan.targets.forEach((target,i)=>{const at=outcomeAt(reveal,i,turbo);if(at-last>=60){cues.push({at,key:target.success?'wildIconSuccess':'WildFail',gain:target.success?.5:.3});last=at;}});
 }
 return cues.sort((a,b)=>a.at-b.at);
}

// Celebration thresholds are presentation choices, not original probability or
// payout rules. All values remain in hundredths of the wagered base bet.
export function winTier(payout:number){return payout>=20000?'epic':payout>=10000?'mega':payout>=5000?'super':payout>=2000?'big':null;}
export function winDuration(payout:number,turbo=false){
 if(!payout)return 250;
 const tier=winTier(payout),normal=tier==='epic'?11800:tier==='mega'?9600:tier==='super'?7400:tier==='big'?5200:1650;
 return turbo?Math.max(650,normal*(tier?.62:.5)):normal;
}
export function celebrationStages(payout:number,duration:number){
 const final=winTier(payout);if(!final)return [];
 const tiers=['big','super','mega','epic'] as const,count=tiers.indexOf(final)+1;
 const speed=duration/winDuration(payout,false);
 return tiers.slice(0,count).map((tier,i)=>({tier,at:(320+i*2200)*speed}));
}
export function scoreAt(payout:number,base:number,multiplier:number,clock:number,duration:number){
 const stages=celebrationStages(payout,duration);
 if(stages.length){
  const thresholds={big:2000,super:5000,mega:10000,epic:20000};
  const index=Math.max(0,stages.findLastIndex(stage=>clock>=stage.at));
  const stage=stages[index],from=index?thresholds[stage.tier]:0,to=index+1<stages.length?thresholds[stages[index+1].tier]:payout;
  const end=index+1<stages.length?stages[index+1].at:duration-650;
  const start=stage.at+Math.min(480,(end-stage.at)*.25);
  // Linear middle makes the tier thresholds land on the upgrade impact;
  // easing the last segment gives the final digits a deliberate settle.
  const p=clamp01((clock-start)/Math.max(1,end-start));
  return from+(to-from)*(index===stages.length-1?easeOut(p):p);
 }
 const end=Math.max(1,duration-250),first=Math.min(650,end*.4),second=end*.55;
 if(multiplier<=1)return payout*easeOut(clock/(end*.85));
 if(clock<second)return base*easeOut(clock/first);
 return base+(payout-base)*easeOut((clock-second)/(end-second));
}
export function backgroundMix(phase:string,inFree:boolean,clock:number){
 if(phase==='freeStart')return easeOut((clock-350)/1500);
 if(phase==='freeEnd')return 1-easeOut((clock-(FREE_END_MS-1200))/1200);
 return inFree?1:0;
}
export function wildIntensity(reveal:Reveal|null,phase:string,clock:number,turbo=false){
 if(phase!=='spin'||!reveal?.wildPlan.triggered)return 0;
 const t=timingFor(reveal,turbo);
 return easeOut((clock-400)/1000)*(1-clamp01((clock-t.backAt)/833));
}
export function panelMotion(clock:number,duration:number){
 const alpha=Math.min(clamp01(clock/260),clamp01((duration-clock)/350));
 return {alpha,scale:.86+.14*easeOut(clock/650),y:26*(1-easeOut(clock/600))};
}
export function collectionVisual(before:FreeState,after:FreeState,clock:number){
 const points=before.points+(after.points-before.points)*easeOut(clock/ENERGY_END);
 const crossed=Math.floor(points/12)>Math.floor(before.points/12);
 return {points,fill:(points%12)/12,pulse:crossed?Math.sin(clamp01((clock-500)/700)*Math.PI):0};
}
export function phaseAudioCues(phase:string,duration:number,payout:number,multiplier:number,progress?:{before:FreeState;after:FreeState;addedSpins:number}|null):AudioCue[]{
 const cues:AudioCue[]=[];
 if(phase==='freeStart')cues.push({at:0,key:'fgGet',gain:.55},{at:450,key:'FgIn',gain:.4},{at:1000,key:'fgInto',gain:.45},{at:2200,key:'fgEnter',gain:.55});
 if(phase==='freeEnd')cues.push({at:0,key:'CharaWin3',gain:.5},{at:900,key:'fgNumberGet',gain:.35},{at:duration-500,key:'WinShow_End',gain:.5});
 if(phase==='progress'&&progress){
  const count=Math.min(12,progress.after.points-progress.before.points);
  if(count>0)cues.push({at:0,key:'wildIconCollect',gain:.4});
  for(let i=0;i<count;i++)cues.push({at:120+i*760/Math.max(1,count),key:'fgPoint',gain:.2});
  if(progress.addedSpins)cues.push({at:ENERGY_END,key:'fgPointNew',gain:.45},{at:MULTIPLIER_AT,key:'fgMultiplierGet',gain:.6},{at:PLUS_SPINS_AT,key:'fgSpinsPlus',gain:.55});
 }
 if(phase==='win'&&payout){
  const tier=winTier(payout);
  cues.push({at:0,key:'Line',gain:.35},{at:200,key:payout>=10000?'CharaWin3':payout>=5000?'CharaWin2.5':payout>=2000?'CharaWin2':'CharaWin1',gain:.5});
  if(tier)for(const stage of celebrationStages(payout,duration))cues.push(
   {at:stage.at+30,key:'sceneBat_S',gain:.16},
   {at:stage.at+240,key:({big:'Big_Start',super:'Super_Start',mega:'Mega_Start',epic:'Epic_Start'})[stage.tier],gain:.5});
  else for(let i=0;i<4;i++)cues.push({at:100+i*duration*.13,key:'Score',gain:.15});
  if(multiplier>1)cues.push({at:duration*.45,key:'ScoreMultiplier',gain:.5});
  if(tier)cues.push({at:duration-220,key:'WinShow_End',gain:.45});
 }
 return cues.sort((a,b)=>a.at-b.at);
}

/** Crossing cues once per presentation also works when two books both index
 * their first reveal as 0. A skipped phase discards its unplayed cue backlog. */
export class CueCursor{
 private id:unknown;private seen=new Set<number>();private lastClock=0;
 take(id:unknown,clock:number,cues:AudioCue[],skipped=false){
  if(this.id!==id){this.id=id;this.seen.clear();this.lastClock=0;}
  // Hidden tabs and a stalled frame can jump ahead by seconds. Mark old cues
  // consumed while retaining only cues close enough to the displayed action.
  const earliest=clock-this.lastClock>250?Math.max(0,clock-120):0;this.lastClock=clock;
  const result:AudioCue[]=[];
  cues.forEach((cue,i)=>{if(cue.at<=clock&&!this.seen.has(i)){this.seen.add(i);if(!skipped&&cue.at>=earliest)result.push(cue);}});
  return result;
 }
}
