import type { Graphics } from 'pixi.js';
import { gazePose } from './multiplierPerformance';

/** Same carved score plaque in the game and the frame-by-frame art review. */
export function drawMultiplierReadout(g:Graphics,alpha:number,gazeProgress=-1){
 g.clear();if(alpha<=0)return;
 const x=-208,y=-119,w=416,h=238;
 g.roundRect(x-5,y+7,w+10,h,25).fill({color:0x06161b,alpha:.36*alpha});
 g.roundRect(x,y,w,h,22).fill({color:0x10272d,alpha:.97*alpha}).stroke({color:0xd6b25e,width:2,alpha:.94*alpha});
 g.roundRect(x+7,y+7,w-14,h-14,16).stroke({color:0x55716a,width:1,alpha:.6*alpha});
 // Small carved corner cuts, kept outside every line of lettering.
 for(const side of [-1,1])for(const top of [-1,1]){
  g.moveTo(side*184,top*83).lineTo(side*184,top*99).lineTo(side*165,top*99).stroke({color:0xe4ca87,width:2,alpha:.8*alpha});
 }
 if(gazeProgress<0)return;
 const pose=gazePose(gazeProgress),edge=192-pose.stone*384,a=pose.intensity*alpha;
 // A travelling mineral front and branching veins communicate petrification.
 // The centre stays dark to preserve the contrast of the multiplier and win.
 for(const sign of [-1,1]){
  g.moveTo(192,sign*105).lineTo(edge,sign*105).stroke({color:0x9ec89b,width:10,alpha:.18*a});
  g.moveTo(edge,sign*105).lineTo(Math.min(192,edge+33),sign*105).stroke({color:0xcaff8e,width:2.5,alpha:.9*a});
  for(let k=0;k<6;k++){const vx=176-k*61;if(vx<edge)continue;
   const reach=Math.min(1,(vx-edge)/24);
   g.moveTo(vx,sign*105).lineTo(vx-8,sign*(105-13*reach)).lineTo(vx+3,sign*(105-24*reach)).stroke({color:0xc0d7aa,width:1.25,alpha:.6*a});
   g.moveTo(vx-8,sign*(105-13*reach)).lineTo(vx-21,sign*(105-17*reach)).stroke({color:0x729e86,width:1,alpha:.55*a});
  }
 }
}
