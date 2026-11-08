/** Presentation only: the book remains the source of the awarded multiplier. */
export const scarabSpinProgress=(t:number)=>1-(1-Math.max(0,Math.min(1,t)))**3;
export function multiplierImpactProfile(value:number){
 const strength=Math.max(0,Math.min(1,Math.log2(Math.max(1,value))/5));
 return {strength,amplitude:1+6.5*strength**1.5,duration:280+220*strength,platePop:.075+.16*strength};
}
export function multiplierImpactAt(value:number,age:number){
 const p=multiplierImpactProfile(value),u=Math.max(0,Math.min(1,age/p.duration));
 if(age<0||u>=1)return{x:0,y:0};
 const envelope=(1-u)**2;
 return{x:Math.sin(age*.091)*p.amplitude*envelope,y:Math.sin(age*.067)*p.amplitude*.7*envelope};
}
