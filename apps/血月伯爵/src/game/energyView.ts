import {Container,Graphics,GraphicsContext} from 'pixi.js';
import {BOARD} from './geometry.ts';
import {clamp01,easeOut} from './presentation.ts';

/** The FG collection trails share a single circle mesh for all three glow
 * layers. The entire pool is allocated while idle, rather than on collection. */
export class EnergyView{
 readonly view=new Container({eventMode:'none',visible:false});
 readonly shape=new GraphicsContext().circle(0,0,16).fill(0xffffff);
 private points:{x:number;y:number}[]=[];
 constructor(){
  for(let i=0;i<36;i++){
   const particle=new Container();
   for(const [radius,tint,alpha] of [[13,0xff9738,.08],[6,0xffc65c,.6],[2.5,0xfff4bd,1]]){
    const circle=new Graphics(this.shape);circle.scale.set(radius/16);circle.tint=tint;circle.alpha=alpha;particle.addChild(circle);
   }
   this.view.addChild(particle);
  }
 }
 configure(board:number[][]){
  this.points=[];
  for(let col=0;col<board.length;col++)for(let row=0;row<board[col].length;row++)if(board[col][row]>=10)this.points.push({x:BOARD.x+(col+.5)*BOARD.cell,y:BOARD.y+(row+.5)*BOARD.cell});
 }
 draw(clock:number,active:boolean){
  this.view.visible=active;if(!active)return;
  for(let i=0;i<this.view.children.length;i++){
   const particle=this.view.children[i],point=this.points[i];
   const p=point?clamp01((clock-i*280/Math.max(1,this.points.length-1))/720):0;
   particle.visible=p>0&&p<1;if(!particle.visible)continue;
   const t=easeOut(p);
   particle.position.set((1-t)*(1-t)*point.x+2*(1-t)*t*(point.x-100)+t*t*227,(1-t)*(1-t)*point.y+2*(1-t)*t*(Math.min(point.y,420)-170)+t*t*420);
   particle.alpha=Math.sin(p*Math.PI)**.7;
  }
 }
 destroy(){this.view.destroy({children:true});this.shape.destroy();this.points=[];}
}
