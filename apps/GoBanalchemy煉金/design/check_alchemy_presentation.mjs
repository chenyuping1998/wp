import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { register } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
register('data:text/javascript,'+encodeURIComponent(`export async function resolve(s,c,next){try{return await next(s,c)}catch(e){if(s.startsWith('.')&&!s.endsWith('.ts'))return next(s+'.ts',c);throw e}}`));
const app=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const { reactionTiming, coverOpacity, vaporParticles, vaporPose }=await import(pathToFileURL(path.join(app,'src/game/potionVapor.ts')));
const { MESH_WINS, MESH_LANDS }=await import(pathToFileURL(path.join(app,'src/game/meshWin/index.ts')));
const { buildRig,skin }=await import(pathToFileURL(path.join(app,'src/game/meshWin/meshRig.ts')));
const {polygon}=await import(pathToFileURL(path.join(app,'src/game/meshWin/meshRig.ts')));
const {GLASS,boilRig,boilPose,boilBubbles,boilCanvas}=await import(pathToFileURL(path.join(app,'src/game/reagentBoil.ts')));
for(const variant of ['tile','prop']){
	const rig=buildRig(boilRig(variant)),out=new Float32Array(rig.rest.length),height=boilCanvas(variant)[1];
	const regions=GLASS[variant].map(points=>polygon(points));
	const area=(v,a,b,c)=>(v[b*2]-v[a*2])*(v[c*2+1]-v[a*2+1])-(v[b*2+1]-v[a*2+1])*(v[c*2]-v[a*2]);
	for(let phase=0;phase<4;phase+=.05){
		skin(rig,boilPose(rig,phase,1),height,out);
		for(let v=0;v<out.length/2;v++)if(regions.every(r=>r([rig.rest[v*2],rig.rest[v*2+1]])>0))assert.ok(Math.hypot(out[v*2]-rig.rest[v*2],out[v*2+1]-rig.rest[v*2+1])<.005,'Boiling moves copper, rope or vessel frame');
		for(let i=0;i<rig.indices.length;i+=3){const [a,b,c]=rig.indices.slice(i,i+3),ratio=area(out,a,b,c)/area(rig.rest,a,b,c);assert.ok(ratio>=.5&&ratio<=1.6,'Liquid mesh folds or stretches');}
		for(const bubble of boilBubbles(variant,phase,1))assert.ok(regions.some(r=>r([bubble.x,bubble.y])===0),'Bubble escapes glass');
	}
}
for(let width=1;width<=5;width++){
 const b=reactionTiming(width);
 assert.equal(coverOpacity(b.swap,b),1,'Swap must be fully opaque');
 assert.equal(coverOpacity(b.reveal,b),1,'Cover must hold through swap');
 assert.equal(coverOpacity(0,b),0);assert.equal(coverOpacity(b.end,b),0);
 assert.ok(b.charge<b.swap&&b.swap<b.reveal&&b.reveal<b.end);
 for(const p of vaporParticles(width-1))for(let t=0;t<=b.end+50;t+=17){
  const pose=vaporPose(p,t,b);assert.ok(Object.values(pose).every(Number.isFinite));
  assert.ok(pose.alpha>=0&&pose.alpha<=1);if(t>=b.end)assert.ok(pose.alpha<1e-9);
 }
}
for(const [name,spec] of [...Object.entries(MESH_WINS), ...Object.entries(MESH_LANDS)]){
 // 2026-10-16: a WIN may leap in cut mode (meshWin/leapWin.ts) — the tile is
 // then its own plate sprite, which never moves; only the subject leaves it.
 if(spec.mode==='cut'){
  assert.ok(MESH_LANDS[name]!==spec,name+': landings stay inside the tile');
  const id=spec.key.slice(2).toLowerCase();
  for(const layer of ['plate','subject','shadow'])assert.ok(fs.existsSync(path.join(app,'static/assets/sprites/goBanalchemyMesh',id+'_'+layer+'.png')),name+' needs its '+layer+' layer');
  continue;
 }
 assert.equal(spec.mode,'panel',name+' should act inside the fixed tile');
 const rig=buildRig(spec.rig),out=new Float32Array(rig.rest.length);
 const edge=[];for(let v=0;v<rig.rest.length/2;v++)if(Math.min(rig.rest[v*2],rig.rest[v*2+1],256-rig.rest[v*2],256-rig.rest[v*2+1])<=10)edge.push(v);
 // 2026-10-29: the Wild's win LIFTS its whole tile (spec.lifts, wGorilla.liftWin)
 // over a socket drawn in its cell — there the border may move, but only
 // rigidly: no bone may bend it against the tile's own move
 const {restPose}=spec.lifts?await import(pathToFileURL(path.join(app,'src/game/meshWin/meshRig.ts'))):{};
 const ref=new Float32Array(rig.rest.length);
 for(let t=0;t<=spec.durationMs;t+=16){
  const pose=spec.pose(rig,t);
  skin(rig,pose,spec.feetY,out);
  if(spec.lifts){
   assert.ok(!MESH_LANDS[name]?.lifts,name+': a landing never lifts');
   skin(rig,{...pose,bones:restPose(rig).bones},spec.feetY,ref);
   for(const v of edge)assert.ok(Math.hypot(out[v*2]-ref[v*2],out[v*2+1]-ref[v*2+1])<.005,name+' bends its lifting tile border');
  } else for(const v of edge)assert.ok(Math.hypot(out[v*2]-rig.rest[v*2],out[v*2+1]-rig.rest[v*2+1])<.005,name+' moves its tile border');
 }
}
const { execFileSync } = await import('node:child_process');
execFileSync('python', [path.join(app, 'design/check_sampled_audio.py')], { stdio: 'inherit' });
console.log('OK: 1–5 reel opaque swaps, fixed symbol borders and sampled audio validation.');
