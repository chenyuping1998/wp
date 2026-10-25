import hinge from './data/treasureChestGenerator.json' with {type:'json'};
import {motionTrack} from './treasureMotion.ts';
const clamp=(v:number)=>Math.max(0,Math.min(1,v));
const smooth=(v:number)=>{v=clamp(v);return v*v*(3-2*v);};
/** Cubic reconstruction of the generator's offline samples, in milliseconds. */
export function chestHinge(time:number,reduced=false){
 const values=hinge.values,last=values.length-1,at=clamp(time/hinge.durationMs)*last,i=Math.min(last-1,Math.floor(at)),u=at-i;
 const a=values[i],b=values[i+1],m0=(values[i+1]-values[Math.max(0,i-1)])*.5,m1=(values[Math.min(last,i+2)]-values[i])*.5;
 return ((2*u**3-3*u*u+1)*a+(u**3-2*u*u+u)*m0+(-2*u**3+3*u*u)*b+(u**3-u*u)*m1)*(reduced?.25:1);
}
export function chestLight(time:number,reduced=false){
 return motionTrack(time,[[0,0],[190,0],[300,.65],[405,1],[540,.78],[650,.3],[760,0],[970,0]])*(reduced?.16:1);
}
/** Five short, staggered arcs: readable gold faces, edge-on flips and one glint. */
export function chestCoin(index:number,time:number,reduced=false){
 const age=clamp((time-230-index*38)/360),active=!reduced&&age>0&&age<1;
 const opacity=active?smooth(age/.12)*(1-smooth((age-.66)/.34))*chestLight(time):0;
 const turn=age*(5.4+index*.35)+index*.48,face=Math.abs(Math.cos(turn));
 return {x:(index-2)*.075+.009*Math.sin(age*Math.PI*2+index)*Math.sin(age*Math.PI),y:-(.10+Math.sin(age*Math.PI)*(.16+index%2*.07)),rx:.019*1.15*(.28+face),ry:.025*1.15,opacity,glint:smooth(1-Math.abs(age-(.39+index*.018))/.12)*opacity,face};
}
