import {Container,Sprite,Texture} from 'pixi.js';
import type {Bar,LineWin,Reveal} from './bloodmoonTypes';
import {BOARD} from './geometry.ts';
import {clamp01,easeOut,reelMotion,timingFor} from './presentation.ts';

type Target={before:number;at:number};
type Strip={view:Container;cells:Sprite[];bar:Bar;stop:number;filler:boolean;targets:Map<number,Target>};
type Group={bar:Bar;wide:Strip;narrow:Strip[];merges:Reveal['mergePlan']};
export type ReelPlan={bars:Bar[];board:number[][];reveal:Reveal|null;turbo:boolean};

/** Stable physical cells replace keyed Svelte sprites that were mounted and
 * destroyed at every strip wrap. Only texture/transform/alpha change in draw.
 * Reveal plans are immutable for the duration of a spin. */
export class ReelView{
 readonly view=new Container();
 private strips=new Map<string,Strip>();
 private groups:Group[]=[];
 private textures:Texture[]=[];
 private spinIndex=0;
 private turbo=false;
 private stopAt=0;
 private line:LineWin|null=null;
 private winning=new Uint8Array(36);
 constructor(){
  this.view.eventMode='none';
  // The six narrow and six potentially merged strips are prepared while idle.
  for(const kind of ['narrow','bar'])for(let col=0;col<6;col++){
   const view=new Container({label:`${kind}-${col}`});view.visible=false;this.view.addChild(view);
   const cells=Array.from({length:9},()=>{const sprite=new Sprite(Texture.EMPTY);view.addChild(sprite);return sprite;});
   this.strips.set(view.label,{view,cells,bar:{col,size:1,head:0,icons:[]},stop:0,filler:false,targets:new Map()});
  }
 }
 setTextures(textures:Texture[]){this.textures=textures;}
 configure({bars,board,reveal,turbo}:ReelPlan){
  this.turbo=turbo;this.spinIndex=reveal?.spinIndex??0;
  const timing=reveal?timingFor(reveal,turbo):null;this.stopAt=timing?.stopAt??0;
  for(const strip of this.strips.values())strip.view.visible=false;
  let order=0;
  const prepare=(key:string,bar:Bar,stop:number,filler:boolean)=>{
   const strip=this.strips.get(key)!;strip.bar=bar;strip.stop=stop;strip.filler=filler;strip.targets.clear();
   this.view.setChildIndex(strip.view,order++);
   while(strip.cells.length<bar.icons.length+3){const cell=new Sprite(Texture.EMPTY);strip.view.addChild(cell);strip.cells.push(cell);}
   if(!filler&&reveal&&timing)for(let i=0;i<reveal.wildPlan.targets.length;i++){
    const target=reveal.wildPlan.targets[i];
    if(target.col===bar.col)strip.targets.set(target.top,{before:target.before,at:timing.revealAt+i*timing.outcomeStep});
   }
   return strip;
  };
  this.groups=bars.map(bar=>{
   const stop=reveal?(bar.size>=3?this.stopAt:turbo?650:1300+bar.col*200):0;
   const narrow:Strip[]=[];
   if(bar.size>=3)for(let col=bar.col;col<bar.col+bar.size;col++)narrow.push(prepare(`narrow-${col}`,{col,size:1,head:0,icons:board[col]},stop,true));
   const wide=prepare(`bar-${bar.col}`,bar,stop,false),merges=reveal?.mergePlan.filter(step=>step.col===bar.col)??[];
   return {bar,wide,narrow,merges};
  });
 }
 draw(clock:number,spinning:boolean,line:LineWin|null,pop=1){
  if(this.line!==line){
   this.line=line;this.winning.fill(0);
   if(line)for(const p of line.positions)this.winning[p.col*6+p.row]=1;
  }
  for(const group of this.groups){
   const merging=spinning&&group.bar.size>=3&&clock<group.wide.stop;
   for(const strip of group.narrow){strip.view.visible=merging;if(merging)this.drawStrip(strip,clock,true,BOARD.cell,pop);}
   let width=group.bar.size*BOARD.cell,show=true;
   if(merging){
    let active:Reveal['mergePlan'][number]|undefined;
    for(const step of group.merges)if(clock>=1500+step.delayMs)active=step;
    show=!!active;
    if(active){const p=active.durationMs?clamp01((clock-1500-active.delayMs)/active.durationMs):1;width=Math.min(group.bar.size,active.fromSize+(active.toSize-active.fromSize)*easeOut(p))*BOARD.cell;}
   }
   group.wide.view.visible=show;
   if(show)this.drawStrip(group.wide,clock,spinning,width,pop);
  }
 }
 private drawStrip(strip:Strip,clock:number,spinning:boolean,width:number,pop:number){
  const bar=strip.bar,motion=spinning?reelMotion(clock,strip.stop,bar.size*BOARD.cell,!this.turbo&&bar.col<4):null;
  const moving=motion?.moving??false,shift=motion?.shift??0,offset=motion?.offset??0;
  const first=moving?shift-1:0,count=bar.icons.length+(moving?3:0);
  for(let physical=0;physical<strip.cells.length;physical++){
   const sprite=strip.cells[physical];sprite.visible=physical<count;if(!sprite.visible)continue;
   const index=first+physical,top=(index-shift)*bar.size-bar.head,valid=index>=0&&index<bar.icons.length;
   const target=valid?strip.targets.get(index*bar.size-bar.head):undefined;
   const symbol=strip.filler||!valid?((index*5+bar.col*3+this.spinIndex)%8+8)%8:target&&spinning&&clock<target.at?target.before:bar.icons[index];
   const texture=this.textures[symbol]??Texture.EMPTY;if(sprite.texture!==texture)sprite.texture=texture;
   let winning=false;
   if(this.line)for(let col=bar.col;col<Math.min(6,bar.col+bar.size)&&!winning;col++)for(let row=Math.max(0,top);row<Math.min(6,top+bar.size);row++)if(this.winning[col*6+row]){winning=true;break;}
   const scale=winning?pop:1,height=bar.size*BOARD.cell;
   sprite.position.set(bar.col*BOARD.cell-width*(scale-1)/2,top*BOARD.cell+offset-height*(scale-1)/2);
   sprite.width=width*scale;sprite.height=height*scale;
   sprite.alpha=moving?.88:this.line&&!winning?.5:1;
  }
 }
 destroy(){this.view.destroy({children:true});this.strips.clear();this.groups=[];}
}
