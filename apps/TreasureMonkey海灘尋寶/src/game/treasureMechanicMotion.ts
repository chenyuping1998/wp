import {motionTrack} from './treasureMotion.ts';
const clamp=(n:number)=>Math.max(0,Math.min(1,n));
export const MULTIPLIER_FLIP_MS=320;
/** Only printed numerals move; the evaluated square never changes size. */
export function multiplierFlip(time:number,reduced=false){
 const t=clamp(time/MULTIPLIER_FLIP_MS);
 if(time<0||time>=MULTIPLIER_FLIP_MS||reduced)return {oldAlpha:0,newAlpha:1,oldY:0,newY:0,newScale:1,plateY:1};
 const track=(keys:readonly (readonly [number,number])[])=>motionTrack(t,keys);
 return {
  oldAlpha:clamp(track([[0,1],[.18,1],[.36,0],[1,0]])),
  newAlpha:clamp(track([[0,0],[.36,0],[.52,1],[1,1]])),
  oldY:track([[0,0],[.16,1],[.36,-7],[1,-7]]),
  newY:track([[0,7],[.36,7],[.66,-1],[.84,.25],[1,0]]),
  newScale:track([[0,.94],[.36,.94],[.66,1.08],[.84,.985],[1,1]]),
  plateY:track([[0,1],[.22,.95],[.6,1.035],[.82,.99],[1,1]]),
 };
}
export function detectorHandoff(preparation:number,progress:number){
 const p=clamp(progress),ready=clamp(preparation);
 return {
  // Keep the acquisition arcs alive while the first beam grows out of them.
  acquisition:(.3+.5*ready)*clamp(1-motionTrack(p,[[0,0],[.075,.35],[.15,1],[1,1]])),
  radius:8+ready*13+Math.min(p/.15,1)*9,
  beam:clamp(motionTrack(p,[[0,0],[.025,.65],[.075,1],[1,1]])),
 };
}
