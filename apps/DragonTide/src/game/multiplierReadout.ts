import type { Graphics } from 'pixi.js';
import { gazePose } from './multiplierPerformance';

// Dragon Tide: the pearl-sum plaque in the board's own language (art/gen-order-1109): a deep
// jade well inside a gold edge and a fine inner line, wave-scroll corners. The well stays
// plain, so the multiplier and the win read at full contrast.
const JADE_DEEP = 0x1f4f4a, JADE_SHADOW = 0x0c1f1d, GOLD = 0xe8b84a, GOLD_LIGHT = 0xffe3a0, FOAM = 0xeafff8;

/** The pearl-sum score plaque in the game and the frame-by-frame art review. */
export function drawMultiplierReadout(g:Graphics,alpha:number,gazeProgress=-1){
 g.clear();if(alpha<=0)return;
 const x=-208,y=-119,w=416,h=238;
 g.roundRect(x-5,y+7,w+10,h,25).fill({color:JADE_SHADOW,alpha:.36*alpha});
 g.roundRect(x,y,w,h,22).fill({color:JADE_DEEP,alpha:.96*alpha}).stroke({color:GOLD,width:3,alpha:.95*alpha});
 g.roundRect(x+8,y+8,w-16,h-16,15).stroke({color:GOLD,width:1,alpha:.55*alpha});
 // wave-scroll corners: a small curl at each corner, kept outside every line of lettering
 for(const side of [-1,1])for(const top of [-1,1]){
  const cx=side*178,cy=top*90;
  g.moveTo(cx+side*12,cy+top*14).bezierCurveTo(cx+side*12,cy-top*4,cx-side*10,cy-top*6,cx-side*10,cy+top*6)
   .bezierCurveTo(cx-side*10,cy+top*12,cx-side*2,cy+top*12,cx-side*2,cy+top*6).stroke({color:GOLD_LIGHT,width:2,alpha:.85*alpha});
 }
 if(gazeProgress<0)return;
 const pose=gazePose(gazeProgress),edge=192-pose.stone*384,a=pose.intensity*alpha;
 // A travelling crest of sea foam runs the plaque's rails as the pearls are summed.
 // The centre stays dark to preserve the contrast of the multiplier and win.
 for(const sign of [-1,1]){
  g.moveTo(192,sign*105).lineTo(edge,sign*105).stroke({color:0x5fe0d0,width:10,alpha:.18*a});
  g.moveTo(edge,sign*105).lineTo(Math.min(192,edge+33),sign*105).stroke({color:FOAM,width:2.5,alpha:.9*a});
  for(let k=0;k<7;k++){const vx=176-k*58;if(vx<edge)continue;
   g.circle(vx,sign*105,3.5).fill({color:GOLD_LIGHT,alpha:.8*a});
  }
 }
}
