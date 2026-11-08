import type { Point } from './multiplierPerformance';
export const medusaAnchors=$state<{ready:boolean;left:Point;right:Point;center:Point}>({ready:false,left:{x:0,y:0},right:{x:0,y:0},center:{x:0,y:0}});
export function publishMedusaAnchors(next:{left:Point;right:Point;center:Point}){
 if(!medusaAnchors.ready||(['left','right','center'] as const).some(key=>Math.hypot(next[key].x-medusaAnchors[key].x,next[key].y-medusaAnchors[key].y)>.005)){medusaAnchors.left=next.left;medusaAnchors.right=next.right;medusaAnchors.center=next.center;medusaAnchors.ready=true;}
}
