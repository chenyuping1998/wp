import {Container,Graphics,GraphicsContext} from 'pixi.js';

/** One immutable, shared circle geometry. Moving dust only changes transforms
 * and opacity; it never clears/rebuilds vector paths in an animation frame. */
export class DustView{
 readonly view=new Container();
 readonly shape=new GraphicsContext().circle(0,0,1).fill(0xffffff);
 private particles:Graphics[]=[];
 private points:{x:number;y:number;speed:number;size:number}[]=[];
 readonly kind:'ambient'|'transition';
 constructor(kind:'ambient'|'transition'){
  this.kind=kind;
  this.view.eventMode='none';
  for(let i=0;i<(kind==='ambient'?28:18);i++){
   const size=kind==='ambient'?1+i%3:1.5+i%3;
   const particle=new Graphics(this.shape);particle.scale.set(size);this.view.addChild(particle);this.particles.push(particle);
   this.points.push({x:((i*37+11)%101)/101,y:((i*61+7)%103)/103,speed:.008+(i%5)*.003,size});
  }
 }
 draw(time:number,width:number,height:number,mix=0){
  for(let i=0;i<this.particles.length;i++){
   const sprite=this.particles[i];
   if(this.kind==='ambient'){
    const point=this.points[i],y=((point.y-time*point.speed)%1+1)%1,x=(point.x+Math.sin(time*.08+i)*.014+1)%1;
    const edge=Math.min(1,y/.12,(1-y)/.12);
    sprite.position.set(x*width,y*height);sprite.tint=mix>.5?0xe58b76:0xaad6e7;
    sprite.alpha=(.13+.09*Math.sin(time*.6+i))*(.7+mix*.3)*edge*edge*(3-2*edge);
   }else{
    const p=(time*.35+i*.061)%1,angle=i*2.4;
    sprite.position.set(Math.cos(angle)*(170+p*240),Math.sin(angle)*(90+p*130));sprite.tint=0xe39862;sprite.alpha=(1-p)*.45;
   }
  }
 }
 destroy(){this.view.destroy({children:true});this.shape.destroy();}
}
