import baked from './data/treasureObjectGenerator.json' with {type:'json'};

export type ObjectSecondary=keyof typeof baked.samples;
/** Small baked recoil accents; the authored main action stays object-specific. */
export function objectSecondary(name:ObjectSecondary,time:number){
 const channel=baked.channels[name];
 if(time<=channel.startMs||time>=baked.durationMs)return 0;
 const values=baked.samples[name],frame=time/baked.stepMs,i=Math.floor(frame),u=frame-i;
 const at=(index:number)=>values[Math.max(0,Math.min(values.length-1,index))];
 const a=at(i-1),b=at(i),c=at(i+1),d=at(i+2);
 const value=.5*((2*b)+(-a+c)*u+(2*a-5*b+4*c-d)*u*u+(-a+3*b-3*c+d)*u*u*u);
 return channel.squared?Math.max(0,value):value;
}
