// One wave, one gesture: the surf rushes in left to right (0-500ms), the screen
// holds under moving water (500-680ms), then the same water washes back out the
// way it came (680-1280ms) and uncovers the new scene from the right. The
// earlier version sent a second, mirrored copy across in the same direction,
// which read as two pictures sliding past.
const smooth=(u:number)=>{u=Math.max(0,Math.min(1,u));return u*u*(3-2*u);};
export const WAVE_COVER_MS=500,WAVE_REVEAL_MS=680,WAVE_END_MS=1280;

export function waveWipePose(time:number,width:number,height:number){
 const reveal=time>=WAVE_REVEAL_MS;
 const textureHeight=height*1.08,textureWidth=Math.max(width*1.08,textureHeight*1.5);
 // Measured on wave_surf_v2.png: every row is opaque for u 0.18..0.75 and
 // nothing is visible past u 0.96. The front (u .75) spends most of each
 // phase crossing the screen instead of the whole image travelling its own
 // width twice, which left only ~100ms of visible wave per phase.
 const OPAQUE_END=.75,VISIBLE_END=.96;
 const offLeft=-textureWidth*(VISIBLE_END+.09),covered=width-textureWidth*(OPAQUE_END-.09);
 const creep=textureWidth*.025;
 let imageLeft:number,progress:number;
 if(time<WAVE_COVER_MS){
  // Rushes in and decelerates as it runs up the sand.
  progress=Math.max(0,time/WAVE_COVER_MS);
  imageLeft=offLeft+(covered-offLeft)*(1-(1-progress)**2.4);
 }else if(!reveal){
  // Under cover the water keeps creeping and sloshing.
  progress=(time-WAVE_COVER_MS)/(WAVE_REVEAL_MS-WAVE_COVER_MS);
  imageLeft=covered+creep*smooth(progress);
 }else{
  // Backwash starts slowly, then drains away the way it came.
  progress=Math.max(0,Math.min(1,(time-WAVE_REVEAL_MS)/(WAVE_END_MS-WAVE_REVEAL_MS)));
  imageLeft=covered+creep-(covered+creep-offLeft)*progress**1.8;
 }
 // The flat water fill sits behind the opaque back of the surf, so its edge
 // is never seen: only opaque water is swapped while the screen is covered.
 const seam=imageLeft+textureWidth*.25;
 // Advancing water bows forward in the middle; retreating water lags there.
 const bow=time>=WAVE_COVER_MS&&!reveal?0:textureWidth*(reveal?-.03:.045)*Math.sin(Math.PI*progress);
 return {reveal,progress,textureHeight,textureWidth,imageLeft,seam,bow,alpha:1};
}

/**
 * Offset (px) of a surf mesh vertex at texture (u,v). Only the foam front
 * moves: the body behind it (u<.35) stays put so the hidden seam stays hidden.
 * Two travelling ripples at unrelated rates break the front into tongues of
 * foam that run ahead and fall back, instead of one rigid painted edge.
 */
export function waveFrontOffset(u:number,v:number,time:number,pose:ReturnType<typeof waveWipePose>){
 const w=smooth((u-.35)/.4),arch=1-(2*v-1)**2;
 const ripple=.6*Math.sin(Math.PI*2*1.2*v+time/160)+.4*Math.sin(Math.PI*2*2.7*v-time/105);
 const lace=pose.reveal?1.5:1;
 return {
  x:w*(pose.textureWidth*.018*lace*ripple+pose.bow*arch),
  y:w*pose.textureHeight*.006*Math.sin(Math.PI*3*u+time/200),
 };
}
