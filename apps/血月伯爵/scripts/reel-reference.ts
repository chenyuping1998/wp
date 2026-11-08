// Preserved pre-pooling presentation for numerical regression comparison.
// This is offline QA only; the production bundle does not import it.
import type {Bar,LineWin,Reveal} from '../src/game/bloodmoonTypes';
import {BOARD} from '../src/game/geometry.ts';
import {reelMotion,barStopAt,timingFor,outcomeAt,clamp01,easeOut} from '../src/game/presentation.ts';
export type Cell={key:string;symbol:number;x:number;y:number;width:number;height:number;alpha:number};
export function legacyCells(reveal:Reveal,clock:number,turbo=false,spinning=true,line:LineWin|null=null,pop=1):Cell[]{
 const result:Cell[]=[],bars=reveal.bars,timing=timingFor(reveal,turbo);
 function strip(bar:Bar,stop:number,key:string,width=bar.size*108,filler=false){
  const motion=spinning?reelMotion(clock,stop,bar.size*BOARD.cell,!turbo&&bar.col<4):{moving:false,shift:0,offset:0};
  const first=motion.moving?motion.shift-1:0,last=motion.moving?motion.shift+bar.icons.length+1:bar.icons.length-1;
  for(let index=first;index<=last;index++){
   const top=index*bar.size-bar.head,valid=index>=0&&index<bar.icons.length;
   const targetIndex=valid?reveal.wildPlan.targets.findIndex(t=>t.col===bar.col&&t.top===top):-1;
   const target=targetIndex>=0?reveal.wildPlan.targets[targetIndex]:undefined;
   const symbol=filler||!valid?((index*5+bar.col*3+reveal.spinIndex)%8+8)%8:target&&spinning&&clock<outcomeAt(reveal,targetIndex,turbo)?target.before:bar.icons[index];
   const displayTop=(index-motion.shift)*bar.size-bar.head;
   const winning=!!line?.positions.some(p=>p.col>=bar.col&&p.col<bar.col+bar.size&&p.row>=displayTop&&p.row<displayTop+bar.size);
   const scale=winning?pop:1;
   result.push({key:`${key}:${index}`,symbol,x:bar.col*108-width*(scale-1)/2,y:displayTop*108+motion.offset-bar.size*108*(scale-1)/2,width:width*scale,height:bar.size*108*scale,alpha:motion.moving?.88:line&&!winning?.5:1});
  }
 }
 for(const bar of bars){
  const stop=barStopAt(reveal,bar.col,bar.size,turbo);
  if(spinning&&bar.size>=3&&clock<stop){
   for(let col=bar.col;col<bar.col+bar.size;col++)strip({col,size:1,head:0,icons:reveal.board[col]},stop,`narrow-${col}`,108,true);
   const active=reveal.mergePlan.filter(step=>step.col===bar.col&&clock>=1500+step.delayMs).at(-1);
   if(active&&clock<=timing.stopAt+180){
    const p=active.durationMs?clamp01((clock-1500-active.delayMs)/active.durationMs):1;
    strip(bar,stop,`bar-${bar.col}`,Math.min(bar.size,active.fromSize+(active.toSize-active.fromSize)*easeOut(p))*108);
   }
  }else strip(bar,stop,`bar-${bar.col}`);
 }
 return result;
}
