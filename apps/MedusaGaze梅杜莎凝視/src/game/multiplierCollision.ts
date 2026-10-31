import type {Graphics} from 'pixi.js';
import type { Point } from './multiplierPerformance';

/** The plate's number and the base win meet at one point before counting up. */
export function multiplierCollisionPose(from:Point,center:Point,time:number){
	const t=Math.max(0,Math.min(1,time)),ease=t*t*(3-2*t);
	const scoreT=Math.max(0,Math.min(1,(t-.35)/.65)),scoreEase=scoreT*scoreT*(3-2*scoreT);
	return{
		mult:{x:from.x+(center.x-from.x)*ease,y:from.y+(center.y-from.y)*ease-Math.sin(Math.PI*t)*36,scale:1+.18*Math.sin(Math.PI*t)},
		score:{x:center.x+84*(1-scoreEase),y:center.y,scale:1+.06*Math.sin(Math.PI*scoreT)},
	};
}

/** A short foreground strike masks the crossing numerals, then clears for count-up. */
export function drawMultiplierCollision(g:Graphics,at:Point,progress:number){
 g.clear();if(progress<0||progress>=1)return;
 const p=Math.max(0,progress),fade=(1-p)**1.4,r=16+68*p;
 g.circle(at.x,at.y,22+24*p).fill({color:0xfff9ce,alpha:fade*.8});
 g.circle(at.x,at.y,r).stroke({color:0xd4ff80,width:5*(1-p),alpha:fade});
 for(let i=0;i<10;i++){const a=i*Math.PI/5+.16,inner=14+26*p,outer=inner+25+30*Math.sin(Math.PI*p);g.moveTo(at.x+Math.cos(a)*inner,at.y+Math.sin(a)*inner).lineTo(at.x+Math.cos(a)*outer,at.y+Math.sin(a)*outer).stroke({color:i%2?0xc6ff61:0xffefb2,width:(i%2?3:4)*(1-p),alpha:fade});}
}
