// @ts-nocheck
// Generated browser review module; types are checked in the original app TypeScript.
/** Medusa's original painted artwork, using the local PP motion vocabulary. */
import { ppTrack,beatPulse,lagged,lookAround,glowPulse,LOCAL_ACT_KEYS } from './ppMotion.js';
export const clamp01 = (x        ) => Math.max(0, Math.min(1, x));
export const smooth = (x        ) => { const t = clamp01(x); return t * t * (3 - 2 * t); };
export const windowPulse = (t        ) => Math.sin(Math.PI * clamp01(t));
/** Lower whole-icon lift leaves room for upper-body/terminal acting. */
export const winHopPose = (time       , name = '') => {
 const t=clamp01(time),heavy=name==='H2'||name==='H4',light=name==='H3'||name==='H5';
 const high=name.startsWith('H')||name==='S';
 const beat=high?beatPulse(t*1500):ppTrack(t*1500,[[0,0],[200,-.3],[533,1],[833,0],[1100,.3],[1400,0],[1500,0]]);
 const lift=heavy?.84:light?1.1:1,pop=1+Math.max(0,beat)*.035;
 const sx=1+(beat<0?-.065:-.025)*beat,sy=1/sx;
 return{y:beat===0?0:-beat*.062*lift,sx:sx*pop,sy:sy*pop};
};
/** A continuous stone boundary, outside the painted bounds at both endpoints. */
export const stoneFront = (u        , progress        ) => {
	const s = clamp01(progress);
	return -.68 + 1.36 * s + .08 * Math.sin(u * 5.5 + 1.1) * Math.sin(Math.PI * s);
};
const local = (x        , y        , cx        , cy        , rx        , ry        ) =>
	Math.exp(-(((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2));

export const symbolPose = (name        , time        ) => {
 const t=clamp01(time),lookValue=lookAround(t*1500,1);
 const high=name.startsWith('H')||name==='S';
 return{x:0,y:0,rotation:(name==='H4'?.028:name==='H3'?-.018:name==='H2'?.011:name==='H5'?-.006:high?.008:.016)*lookValue,
  sx:1,sy:1,glint:glowPulse(t*1500)};
};
/** Guides measured from 1254px originals and transformed into the 512px canvas. */
export const SYMBOL_ART_GUIDES = {
	H1: { head: [0.3057, 0.2587], neck: [0.4926, 0.3270] },
	H2: { crest: [0.6051, 0.2378], eyeL: [0.2784, 0.6145], eyeR: [0.4361, 0.6286] },
	H3: { strings: [0.4980, 0.4274], broken: [0.6490, 0.5278] },
	H4: { handleL: [0.2280, 0.3237], handleR: [0.7598, 0.3237] },
	H5: { leaf: [0.8134, 0.8134] },
}         ;

                                                                                                   
const actingCache=new Map               ();
const acting=(name       ,time       )=>{
 const prior=actingCache.get(name);if(prior?.time===time)return prior;
 const ms=clamp01(time)*1500,at={time,body:lagged(ms,LOCAL_ACT_KEYS,0,80),chest:lagged(ms,LOCAL_ACT_KEYS,1,80),head:lagged(ms,LOCAL_ACT_KEYS,2,80),tip:lagged(ms,LOCAL_ACT_KEYS,3,80),look:lookAround(ms,1),pluck:Math.sin(ms/1500*Math.PI*14)*Math.sin(Math.PI*clamp01(time))};actingCache.set(name,at);return at;
};
/** Weighted original texture: planted base, torso/chest/head lag, terminal
 * shear and a Gaussian depth turn. No flat replacements cover the artwork. */
export const symbolPoint = (name        , u        , v        , time        ) => {
 const t=clamp01(time);let x=u-.5,y=v-.5;
 if(t===0||t===1||(!name.startsWith('H')&&name!=='S'))return{x,y};
 const a=acting(name,t);
 if(name==='H1'){
  const neck=local(u,v,...SYMBOL_ART_GUIDES.H1.neck,.15,.15),headWeight=local(u,v,...SYMBOL_ART_GUIDES.H1.head,.18,.13);
  const depth=local(u,v,.31,.265,.12,.10);
  x+=neck*.011*a.chest+headWeight*.023*a.head+depth*.024*a.look;
  y-=neck*.023*a.chest+headWeight*.061*a.head;
 }else if(name==='H2'){
  const crest=local(u,v,...SYMBOL_ART_GUIDES.H2.crest,.23,.15),mask=local(u,v,.37,.60,.23,.22);
  x+=crest*.040*a.tip+mask*.022*a.look;
  y-=crest*.033*a.head;
  // Near and far eye openings receive different depth shares, not new eyes.
  for(const [i,eye] of [SYMBOL_ART_GUIDES.H2.eyeL,SYMBOL_ART_GUIDES.H2.eyeR].entries()){
   const w=local(u,v,eye[0],eye[1],.065,.075);x+=w*.009*a.look*(i?-.3:1);
  }
 }else if(name==='H3'){
  const strings=local(u,v,...SYMBOL_ART_GUIDES.H3.strings,.11,.22),tip=local(u,v,...SYMBOL_ART_GUIDES.H3.broken,.08,.12);
  x+=strings*.010*a.pluck+tip*.017*a.tip;
  y-=tip*.031*a.tip+local(u,v,.5,.25,.27,.19)*.018*a.head;
 }else if(name==='H4'){
  const mask=local(u,v,.5,.46,.25,.31);x+=mask*.015*a.look;
  for(const [i,g] of [SYMBOL_ART_GUIDES.H4.handleL,SYMBOL_ART_GUIDES.H4.handleR].entries()){
   const w=local(u,v,g[0],g[1],.09,.14);x+=(u-g[0])*w*.08*a.chest;y-=w*.013*a.tip*(i?-1:1);
  }
 }else if(name==='H5'){
  const stem=smooth((.94-v)/.8);
  // Opposed, delayed leaf fans act through a shear field; the tied base stays.
  x+=(u-.5)*.067*a.chest*stem;y-=(.5-Math.abs(u-.5))*.021*a.head*stem;
  const leaf=local(u,v,...SYMBOL_ART_GUIDES.H5.leaf,.10,.10);x+=leaf*.017*a.tip;y+=leaf*.022*a.tip;
 }else if(name==='S'){
  const radius=Math.hypot(u-.5,v-.5),rim=1-smooth((radius-.28)/.12);
  const face=local(u,v,.50,.55,.23,.24)*rim,back=local(u,v,.51,.30,.27,.16)*rim;
  x+=face*.028*a.look-back*.009*a.look;y-=face*.014*a.head;
 }
 return{x,y};
};

                                                                                                                                                                                 
/** Retained review API; production artwork supplies all its painted details. */
export const symbolAccents = (_name        , _time        )           => [];

/** Foot stays planted while a falling object compresses, overshoots and settles. */
export const landingPose = (time        , weight = 1) => {
	const t = clamp01(time), k = Math.max(0, Math.min(1.5, weight));
	const keys = [
		[0, 1, 1], [0.24, 1 + 0.055 * k, 1 - 0.09 * k],
		[0.57, 1 - 0.018 * k, 1 + 0.038 * k], [1, 1, 1],
	];
	let i = 1; while (i < keys.length - 1 && t > keys[i][0]) i++;
	const a = keys[i - 1], b = keys[i], f = smooth((t - a[0]) / (b[0] - a[0]));
	const sx = a[1] + (b[1] - a[1]) * f, sy = a[2] + (b[2] - a[2]) * f;
	return { sx, sy, y: (1 - sy) * 0.5 };
};

/** Shared contact curve: first contact, then two diminishing rebounds. */
export const gravityProgress = (time        ) => ppTrack(clamp01(time),[[0,0],[.6,1],[.725,.95],[.85,1],[.925,.98],[1,1]]);
export const fallDuration = (rows        , budgetMs        ) => rows <= 0 ? 0 : budgetMs;
const travels = new WeakMap                                      ();
export const recordSymbolTravel = (carrier        , from        , to        ) => travels.set(carrier, { from, to });
export const symbolTravelBlur = (carrier        , y        ) => {
	const move = travels.get(carrier);
	if (!move || move.to <= move.from) return 0;
	const progress = clamp01((y - move.from) / (move.to - move.from));
	return Math.min(0.55, (move.to - move.from) / 588 * 0.55) * windowPulse(progress) ** 0.6;
};

                                                                                                            
/** Actual refill contract shared by the game and the motion review. Padding is
 * retained; the old top padding becomes the last incoming visible symbol. */
export const planCascadeColumn =    (column     , removed          , incoming     , visibleRows = 6) => {
	if (column.length !== visibleRows + 2) throw new Error('Unexpected padded column length');
	const rows = new Set(removed), free = [...rows].sort((a, b) => a - b);
	if (free.some((row) => row < 1 || row > visibleRows)) throw new Error('Cannot remove padding');
	if (!free.length) return { column: [...column], moves: []                     };
	if (incoming.length !== free.length) throw new Error('Refill count does not match removed cells');
	const survivors = Array.from({ length: visibleRows }, (_, i) => i + 1).filter((row) => !rows.has(row));
	const falling = [...incoming.slice(1), column[0]];
	const moves                   = [
		...survivors.map((from, i) => ({ carrier: from, from, to: 1 + falling.length + i, rawSymbol: column[from], incoming: false })),
		...falling.map((rawSymbol, i) => ({ carrier: free[i], from: 1 - falling.length + i, to: 1 + i, rawSymbol, incoming: true })),
	];
	return { column: [incoming[0], ...falling, ...survivors.map((row) => column[row]), column[visibleRows + 1]], moves };
};

// Convex, unequal stone cells replace the radial "sliced sticker" silhouette.
// Clip once at module load; shared edges preserve every original painted UV.
const fractureSeeds = [[-.28,-.33],[.06,-.35],[.34,-.12],[.29,.29],[-.04,.32],[-.34,.13],[-.02,-.03],[-.31,-.11]];
export const FRACTURE_PIECES = fractureSeeds.map((site,index) => {
 let polygon=[[-.5,-.5],[.5,-.5],[.5,.5],[-.5,.5]];
 fractureSeeds.forEach((other,j)=>{
  if(index===j)return;
  const nx=other[0]-site[0],ny=other[1]-site[1],limit=(other[0]**2+other[1]**2-site[0]**2-site[1]**2)/2;
  const clipped           =[];
  polygon.forEach((point,k)=>{
   const next=polygon[(k+1)%polygon.length],distance=point[0]*nx+point[1]*ny-limit,nextDistance=next[0]*nx+next[1]*ny-limit;
   if(distance<=1e-12)clipped.push(point);
   if((distance<0)!==(nextDistance<0)){
    const at=distance/(distance-nextDistance);clipped.push([point[0]+(next[0]-point[0])*at,point[1]+(next[1]-point[1])*at]);
   }
  });polygon=clipped;
 });return polygon;
});
export const fragmentPose = (index        , time        , seed = 0) => {
	const t = clamp01(time), points = FRACTURE_PIECES[index];
	const angle = Math.atan2(points.reduce((s,p)=>s+p[1],0), points.reduce((s,p)=>s+p[0],0))+(seed%5-2)*.045;
	// A brief contact hold lets the stone read before the force travels through
	// the pieces. Different launch times stay inside the existing crumble budget.
	const launch=.08+(index%3)*.012,flight=clamp01((t-launch)/(1-launch));
	const burst = 0.46 + (index % 3) * 0.10 + (seed % 7) * 0.006;
	const expansion = 1 - (1 - flight) ** 2;
	return { x: Math.cos(angle) * burst * expansion, y: Math.sin(angle) * burst * expansion - 0.26 * flight + 1.0 * flight * flight,
		rotation: (index % 2 ? 1 : -1) * (0.55 + index * 0.16) * flight,
		sx: 1 - .5 * Math.sin(flight * Math.PI * (.8 + (index % 3) * .2)) ** 2,
		depth: Math.sin(flight * Math.PI), scale: 1 - 0.20 * flight, alpha: 1 - smooth((t - 0.4) / 0.6) };
};
