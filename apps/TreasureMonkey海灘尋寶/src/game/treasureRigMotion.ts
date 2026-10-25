import bake from './data/treasureRigGenerator.json' with {type:'json'};

type Track={delayMs:number;values:number[]};
const tracks:Readonly<Record<string,Track>>=bake.tracks;
/** Offline strike/spring envelopes; the generator itself never enters runtime. */
export function rigGeneratorValue(id:string,time:number):number|undefined{
 const track=tracks[id];
 if(!track)return undefined;
 if(time<=track.delayMs||time>=bake.durationMs)return 0;
 const values=track.values,last=values.length-1,at=Math.max(0,time/bake.durationMs)*last;
 const i=Math.min(last-1,Math.floor(at)),u=at-i,a=values[i],b=values[i+1];
 const m0=(b-values[Math.max(0,i-1)])*.5,m1=(values[Math.min(last,i+2)]-a)*.5;
 return (2*u**3-3*u*u+1)*a+(u**3-2*u*u+u)*m0+(-2*u**3+3*u*u)*b+(u**3-u*u)*m1;
}
