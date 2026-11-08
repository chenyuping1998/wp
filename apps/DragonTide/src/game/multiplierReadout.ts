import type { Graphics } from 'pixi.js';
import { gazePose } from './multiplierPerformance';

/** Circus wood-and-brass score plaque in the game and the frame-by-frame art review. */
export function drawMultiplierReadout(g:Graphics,alpha:number,gazeProgress=-1){
 g.clear();if(alpha<=0)return;
 const x=-208,y=-119,w=416,h=238;
 g.roundRect(x-5,y+7,w+10,h,25).fill({color:0x25130e,alpha:.36*alpha});
 g.roundRect(x,y,w,h,22).fill({color:0x682b22,alpha:.97*alpha}).stroke({color:0xd6b25e,width:2,alpha:.94*alpha});
 g.roundRect(x+7,y+7,w-14,h-14,16).stroke({color:0x9d5031,width:1,alpha:.6*alpha});
 // Painted wood grain and brass fasteners stay clear of the lettering.
 for(const yy of [-75,-18,42,93])g.moveTo(-193,yy).bezierCurveTo(-95,yy-5,80,yy+5,193,yy-2).stroke({color:0x3d1918,width:1.2,alpha:.4*alpha});
 for(const xx of [-193,193])for(const yy of [-104,104])g.circle(xx,yy,4).fill({color:0xf0c363,alpha}).stroke({color:0x48231a,width:1,alpha});
 // Small brass corner cuts, kept outside every line of lettering.
 for(const side of [-1,1])for(const top of [-1,1]){
  g.moveTo(side*184,top*83).lineTo(side*184,top*99).lineTo(side*165,top*99).stroke({color:0xe4ca87,width:2,alpha:.8*alpha});
 }
 if(gazeProgress<0)return;
 const pose=gazePose(gazeProgress),edge=192-pose.stone*384,a=pose.intensity*alpha;
 // A travelling violet front lights the stage bulbs as hypnosis sweeps the plaque.
 // The centre stays dark to preserve the contrast of the multiplier and win.
 for(const sign of [-1,1]){
  g.moveTo(192,sign*105).lineTo(edge,sign*105).stroke({color:0xb58cff,width:10,alpha:.18*a});
  g.moveTo(edge,sign*105).lineTo(Math.min(192,edge+33),sign*105).stroke({color:0xe3ccff,width:2.5,alpha:.9*a});
  for(let k=0;k<7;k++){const vx=176-k*58;if(vx<edge)continue;
   g.circle(vx,sign*105,3.5).fill({color:0xffe6a2,alpha:.8*a});
  }
 }
}
