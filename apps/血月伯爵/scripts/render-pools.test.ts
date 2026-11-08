import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {Sprite,Texture} from 'pixi.js';
import {ReelView} from '../src/game/reelView.ts';
import {DustView} from '../src/game/dustView.ts';
import {EnergyView} from '../src/game/energyView.ts';
import {winParticle,WIN_IMPACT,type WinParticle} from '../src/game/winMotion.ts';
import {timingFor} from '../src/game/presentation.ts';
import type {Book,LineWin,Reveal} from '../src/game/bloodmoonTypes';
import {legacyCells} from './reel-reference.ts';
const data=JSON.parse(fs.readFileSync(new URL('../static/data/demo-books.json',import.meta.url),'utf8'));
const books=[...Object.values(data.modes).flat(),...Object.values(data.scenarios)] as Book[];
const reveals=books.flatMap(book=>book.events.filter((e):e is Reveal=>e.type==='reveal'));
const textures=Array.from({length:14},()=>new Texture({source:Texture.EMPTY.source}));
const epsilon=(actual:number,expected:number)=>assert.ok(Math.abs(actual-expected)<1e-7,`${actual} != ${expected}`);

function compare(view:ReelView,reveal:Reveal,clock:number,turbo:boolean,spinning=true,line:LineWin|null=null,pop=1){
 view.draw(clock,spinning,line,pop);
 const expected=legacyCells(reveal,clock,turbo,spinning,line,pop);
 const actual=view.view.children.filter(strip=>strip.visible).flatMap(strip=>strip.children.filter(cell=>cell.visible)) as Sprite[];
 assert.equal(actual.length,expected.length,`lost cell at ${clock} / ${reveal.spinIndex}`);
 for(let i=0;i<actual.length;i++){
  const sprite=actual[i],cell=expected[i];assert.equal(sprite.texture,textures[cell.symbol],`wrong symbol ${cell.symbol} at ${clock}`);
  for(const property of ['x','y','width','height','alpha'] as const)epsilon(sprite[property],cell[property]);
 }
}

test('pooled reels preserve all reference reveals, normal/turbo stops and WILD results',()=>{
 const view=new ReelView();view.setTextures(textures);const nodes=new Set(view.view.children.flatMap(strip=>strip.children));
 let checked=0,wildSymbols=false;
 for(const reveal of reveals)for(const turbo of [false,true]){
  view.configure({bars:reveal.bars,board:reveal.board,reveal,turbo});const t=timingFor(reveal,turbo);
  const clocks=new Set([0,400,1499,1500,t.stopAt-.001,t.stopAt,t.stopAt+140,t.duration]);
  for(const step of reveal.mergePlan)for(const delta of [-.001,0,step.durationMs/2,step.durationMs])clocks.add(1500+step.delayMs+delta);
  for(let i=0;i<reveal.wildPlan.targets.length;i++)for(const delta of [-.001,0,.001])clocks.add(t.revealAt+i*t.outcomeStep+delta);
  for(const clock of clocks){compare(view,reveal,clock,turbo);checked++;}
  wildSymbols||=reveal.bars.some(bar=>bar.icons.some(icon=>icon>=12));
 }
 assert.equal(reveals.length,1945);assert.ok(checked>40000&&wildSymbols);
 console.log(`Reference reveal poses compared: ${checked}; normal/turbo reveals: ${reveals.length*2}`);
 assert.equal(nodes.size,108);
 assert.deepEqual(new Set(view.view.children.flatMap(strip=>strip.children)),nodes,'cells were allocated/replaced during spin');
 view.destroy();assert.ok([...nodes].every(node=>node.destroyed));
});

test('pooled reels preserve large-tile win highlighting, line changes, idle and Stop landing',()=>{
 const view=new ReelView();view.setTextures(textures);
 for(const reveal of reveals.filter(reveal=>reveal.bars.some(bar=>bar.size>=3)).slice(0,60)){
  view.configure({bars:reveal.bars,board:reveal.board,reveal,turbo:false});
  const t=timingFor(reveal);
  for(let row=0;row<6;row++){
   const line:LineWin={line:row,positions:Array.from({length:6},(_,col)=>({col,row})),symbol:0,count:6,payout:100};
   compare(view,reveal,t.duration,false,false,line,1.024);
  }
  compare(view,reveal,t.duration,false,true,null);compare(view,reveal,0,false,false,null);
 }
 view.destroy();
});

test('dust reuses immutable circle geometry and preserves its original motion/edge fades',()=>{
 for(const kind of ['ambient','transition'] as const){
  const dust=new DustView(kind),nodes=dust.view.children.slice(),instructions=dust.shape.instructions.slice();
  assert.equal(nodes.length,kind==='ambient'?28:18);
  for(const time of [0,.5,3.8,11,27,80,300])for(const mix of [0,.49,.51,1]){
   dust.draw(time,1280,720,mix);
   nodes.forEach((node,i)=>{
    assert.equal((node as any).context,dust.shape);
    if(kind==='ambient'){
     const y=((((i*61+7)%103)/103-time*(.008+i%5*.003))%1+1)%1;
     const x=(((i*37+11)%101)/101+Math.sin(time*.08+i)*.014+1)%1,edge=Math.min(1,y/.12,(1-y)/.12);
     epsilon(node.x,x*1280);epsilon(node.y,y*720);epsilon(node.alpha,(.13+.09*Math.sin(time*.6+i))*(.7+mix*.3)*edge*edge*(3-2*edge));
    }else{
     const p=(time*1000*.00035+i*.061)%1;
     epsilon(node.x,Math.cos(i*2.4)*(170+p*240));epsilon(node.y,Math.sin(i*2.4)*(90+p*130));epsilon(node.alpha,(1-p)*.45);
    }
   });
  }
  assert.deepEqual(dust.shape.instructions,instructions,'geometry changed during animation');
  let destroyed=0;dust.shape.on('destroy',()=>destroyed++);
  assert.deepEqual(dust.view.children,nodes);dust.destroy();assert.ok(nodes.every(node=>node.destroyed));assert.equal(destroyed,1);
 }
});

test('FG collection preserves every glow path and allocates no cells between collections',()=>{
 const energy=new EnergyView(),nodes=energy.view.children.slice(),all=nodes.flatMap(node=>node.children),instructions=energy.shape.instructions.slice();
 for(const count of [0,1,6,12,36]){
  const board=Array.from({length:6},(_,col)=>Array.from({length:6},(_,row)=>col*6+row<count?10:0));
  energy.configure(board);
  for(let clock=0;clock<=1000;clock+=10){
   energy.draw(clock,true);assert.equal(energy.view.visible,true);
   for(let i=0;i<36;i++){
    const p=Math.max(0,Math.min(1,(clock-i*280/Math.max(1,count-1))/720)),node=nodes[i];
    assert.equal(node.visible,i<count&&p>0&&p<1);
    if(!node.visible)continue;
    const t=1-(1-p)**3,from={x:316+(Math.floor(i/6)+.5)*108,y:56+(i%6+.5)*108};
    epsilon(node.x,(1-t)**2*from.x+2*(1-t)*t*(from.x-100)+t*t*227);
    epsilon(node.y,(1-t)**2*from.y+2*(1-t)*t*(Math.min(from.y,420)-170)+t*t*420);
    epsilon(node.alpha,Math.sin(p*Math.PI)**.7);
   }
  }
 }
 energy.draw(500,false);assert.equal(energy.view.visible,false);
 assert.deepEqual(energy.view.children,nodes);assert.deepEqual(energy.shape.instructions,instructions);
 assert.ok(all.every(node=>(node as any).context===energy.shape));
 let destroyed=0;energy.shape.on('destroy',()=>destroyed++);energy.destroy();assert.equal(destroyed,1);assert.ok(all.every(node=>node.destroyed));
});

test('reusable win particle samples keep the original emission, gravity, fade and tail',()=>{
 const result:WinParticle={x:0,y:0,tailX:0,tailY:0,alpha:0,size:0,rotation:0};
 for(let index=0;index<48;index++)for(let age=0;age<=2300;age+=7){
  const life=1250+index%7*85,t=(age-WIN_IMPACT-index%4*18)/life,actual=winParticle(index,age,result);
  if(t<0||t>1){assert.equal(actual,null);continue;}
  assert.equal(actual,result,'allocated a new motion sample');
  const angle=index*2.39996323,speed=180+index%9*29,previous=Math.max(0,t-.035),r=Math.min(1,t/.055),cubic=r*r*r*(10+r*(-15+6*r));
  epsilon(result.x,Math.cos(angle)*speed*t);epsilon(result.y,Math.sin(angle)*speed*t*.68+180*t*t);
  epsilon(result.tailX,Math.cos(angle)*speed*previous);epsilon(result.tailY,Math.sin(angle)*speed*previous*.68+180*previous*previous);
  epsilon(result.alpha,cubic*(1-t)**1.6);epsilon(result.size,1.2+index%4*.65);epsilon(result.rotation,angle+t*4);
 }
});
