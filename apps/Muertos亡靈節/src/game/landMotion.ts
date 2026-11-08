/** One authored landing, no second Spine/mesh bounce layered over it. */
export type LandFrame={sx:number;sy:number;rot:number;dx:number;dy:number;bloom:number;bloomTint:number;dust:number;dustTint:number};
export const LAND_MS=750;
export const REST:LandFrame={sx:1,sy:1,rot:0,dx:0,dy:0,bloom:0,bloomTint:0xf2e8d0,dust:0,dustTint:0xd9b77a};
export const LAND_SYMBOLS=['H1','H2','H3','H4','L1','L2','L3','L4','L5','W','P'];
const curve=(t:number,values:number[])=>{const u=Math.max(0,Math.min(6,t/LAND_MS*6));const i=Math.min(5,Math.floor(u)),f=u-i;const s=f*f*(3-2*f);return values[i]+(values[i+1]-values[i])*s;};
export function landFrame(name:string,t:number):LandFrame{
 if(t>=LAND_MS||name==='X')return {...REST};
 if(name==='S')return {...REST,bloom:.16*Math.sin(Math.PI*Math.min(1,t/400))**2,bloomTint:0xffc23a};
 const weight=name.startsWith('L')?.75:name==='H2'?.85:name==='H3'?.7:name==='H4'?.9:1;
 const y=curve(t,[0,-.127,.042,-.085,.025,-.042,0])*weight;
 const sy=1+(curve(t,[.85,1.05,.90,1.03,.95,1.015,1])-1)*weight;
 return {...REST,dy:y,sy,sx:1-(sy-1)*.45};
}
