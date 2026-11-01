import {deform} from '../src/game/comicMotion.ts';
let min=Infinity,max=0,travel=0;
const area=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
for(const kind of ['portrait'])for(let ms=0;ms<=2000;ms+=8)for(let y=0;y<40;y++)for(let x=0;x<20;x++){
 const a=[x/20,y/40],b=[(x+1)/20,y/40],c=[x/20,(y+1)/40],d=[(x+1)/20,(y+1)/40];
 for(const tri of [[a,b,c],[b,d,c]]){const q=tri.map(([u,v])=>deform(u,v,ms,kind));const ratio=area(...q)/area(...tri);min=Math.min(min,ratio);max=Math.max(max,ratio);if(ratio<.5||ratio>1.6)throw Error(`${kind} mesh fold/stretch ${ratio}`);}
 travel=Math.max(travel,Math.hypot(...deform(0.5,0.08,ms,kind).map((v,i)=>v-[.5,.08][i])));
}
console.log(JSON.stringify({pass:true,minAreaRatio:min,maxAreaRatio:max,maxNormalizedHeadTravel:travel,framesPerKind:251}));

console.log('Portrait mesh motion checked; Spine casts are checked separately by check_cast_spine.mjs.');
