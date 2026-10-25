import baked from './data/treasureBeachGenerator.json' with {type:'json'};

export const BEACH_LOOP_MS=baked.durationMs;
// Measured against bg_base.jpg: leave the horizon, shoreline and all foreground
// silhouettes rigid. Exact zero-weight grid lines also bound affected triangles.
export const BEACH_WATER_BOUNDS={left:.17,right:.85,top:.285,bottom:.435} as const;
const ease=(value:number)=>{
 const t=Math.max(0,Math.min(1,value));
 return t*t*t*(10+t*(-15+6*t));
};
export function beachWaterWeight(u:number,v:number){
 const {left,right,top,bottom}=BEACH_WATER_BOUNDS;
 return ease((u-left)/.075)*ease((right-u)/.075)*ease((v-top)/.035)*ease((bottom-v)/.035);
}

/** Periodic cubic interpolation preserves the same value AND tangent at wrap. */
export function beachChannel(name:keyof typeof baked.channels,time:number){
 const values=baked.channels[name],n=baked.steps;
 const frame=(((time%BEACH_LOOP_MS)+BEACH_LOOP_MS)%BEACH_LOOP_MS)/BEACH_LOOP_MS*n;
 const i=Math.floor(frame),u=frame-i;
 const at=(index:number)=>values[(index%n+n)%n];
 const a=at(i-1),b=at(i),c=at(i+1),d=at(i+2);
 return .5*((2*b)+(-a+c)*u+(2*a-5*b+4*c-d)*u*u+(-a+3*b-3*c+d)*u*u*u);
}

export function createBeachMesh(columns=96,rows=54){
 const axis=(divisions:number,extra:readonly number[])=>[...new Set([
  ...Array.from({length:divisions+1},(_,i)=>i/divisions),...extra,
 ])].sort((a,b)=>a-b);
 const bounds=BEACH_WATER_BOUNDS;
 const xs=axis(columns,[bounds.left,bounds.right]),ys=axis(rows,[bounds.top,bounds.bottom]);
 const rest=new Float32Array(xs.length*ys.length*2),uvs=new Float32Array(rest.length);
 const indices=new Uint32Array((xs.length-1)*(ys.length-1)*6);
 const active:{index:number;weight:number;phase:number;depth:number}[]=[];
 for(let row=0;row<ys.length;row++)for(let col=0;col<xs.length;col++){
  const index=row*xs.length+col,u=xs[col],v=ys[row],weight=beachWaterWeight(u,v);
  rest[index*2]=uvs[index*2]=u;rest[index*2+1]=uvs[index*2+1]=v;
  if(weight>0)active.push({index,weight,phase:u*1300+(v-bounds.top)*2100,depth:(v-bounds.top)/(bounds.bottom-bounds.top)});
 }
 let offset=0;
 for(let row=0;row<ys.length-1;row++)for(let col=0;col<xs.length-1;col++){
  const a=row*xs.length+col,b=a+1,c=a+xs.length,d=c+1;
  indices.set([a,b,c,b,d,c],offset);offset+=6;
 }
 return {rest,uvs,indices,active};
}

export type BeachMesh=ReturnType<typeof createBeachMesh>;
/** Normalised positions; the original 1920x1080 image moves by at most ~3px. */
export function deformBeachMesh(mesh:BeachMesh,time:number,reduced=false,out=new Float32Array(mesh.rest.length)){
 out.set(mesh.rest);
 if(reduced)return out;
 for(const point of mesh.active){
  const {index,weight,phase,depth}=point;
  const surge=beachChannel('surge',time-phase),drift=beachChannel('drift',time-phase-900);
  out[index*2]+=weight*.00135*drift;
  out[index*2+1]+=weight*.00215*(.7+.3*depth)*surge;
 }
 return out;
}
