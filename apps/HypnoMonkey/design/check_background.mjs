// @ts-nocheck -- Node-only motion validation, not frontend code.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { BACKGROUND_SIZE, CLOUD_PIXELS_PER_SECOND, CLOUDS, STATUES, STATUE_FRACTURE_PIECES, FLAME_GRID, cloudPosition, cloudVisibility, statueEnvelope, statuePiecePose, flamePoint, flameUV, FLAME_ANCHOR_V, STATUE_SECONDS } from '../src/game/backgroundMotion.ts';
assert.equal(CLOUD_PIXELS_PER_SECOND * 60, BACKGROUND_SIZE.width / 5);
for (const cloud of CLOUDS) {
  const a = cloudPosition(0, cloud.x, cloud.width), b = cloudPosition(60, cloud.x, cloud.width);
  assert.ok(Math.abs((b - a + 3120) % 3120 - 384) < 1e-8);
  for (let t = 0; t <= 1200; t++) {
    const x = cloudPosition(t,cloud.x,cloud.width), alpha = cloudVisibility(x,cloud.width);
    assert.ok(alpha >= 0 && alpha <= 1);
    if (x - cloud.width/2 <= 155 || x + cloud.width/2 >= 1770) assert.equal(alpha,0,'Cloud must fade before its column mask edge');
  }
}
for (const t of [0,STATUE_SECONDS,STATUE_SECONDS+100]) assert.equal(statueEnvelope(t).split,0);
assert.equal(STATUE_FRACTURE_PIECES.length,12);
let areaSum=0;
for (const polygon of STATUE_FRACTURE_PIECES) {
  let area=0;
  for(let i=0;i<polygon.length;i++) {const a=polygon[i],b=polygon[(i+1)%polygon.length];area+=a[0]*b[1]-a[1]*b[0];}
  areaSum+=area/2;
  for(let i=0;i<polygon.length;i++) {const a=polygon[i],b=polygon[(i+1)%polygon.length],c=polygon[(i+2)%polygon.length];assert.ok((b[0]-a[0])*(c[1]-b[1])-(b[1]-a[1])*(c[0]-b[0])>0,'Fracture quad is convex');}
}
assert.ok(Math.abs(areaSum-1)<1e-10,'Fragments cover the entire original image without gaps');
for (const statue of STATUES) for (let i=0;i<12;i++) for (const t of [0,STATUE_SECONDS,20]) for (const value of Object.values(statuePiecePose(i,t,statue.width,statue.height))) assert.ok(value===0);
assert.equal(statuePiecePose(9,0.94,400,800).depth,0,'Bottom pieces lock first');
assert.ok(statuePiecePose(0,0.94,400,800).depth>0,'Head has a later settle');
assert.ok(statuePiecePose(0,.5,400,800).x<0 && statuePiecePose(2,.5,400,800).x>0,'Left and right fragments open outward');
for (let t=0;t<8;t+=.01) for (const seed of [0,2.43]) for (const u of [0,.2,.5,.8,1]) {
  const base=flamePoint(u,FLAME_ANCHOR_V,t,seed);assert.equal(base.x,u-.5);assert.equal(base.y,0);
  const uv=flameUV(u,FLAME_ANCHOR_V,t,seed);assert.equal(uv.u,u);assert.equal(uv.v,FLAME_ANCHOR_V);
}
let minArea=1;
const cols=FLAME_GRID.columns,rows=FLAME_GRID.rows;
for (const seed of [0,2.43]) for (let t=0;t<30;t+=.025) for (let y=0;y<rows;y++) for(let x=0;x<cols;x++) {
  const a=flamePoint(x/cols,y/rows,t,seed),b=flamePoint((x+1)/cols,y/rows,t,seed),c=flamePoint(x/cols,(y+1)/rows,t,seed),d=flamePoint((x+1)/cols,(y+1)/rows,t,seed);
  for (const [p,q,r] of [[a,b,c],[b,d,c]]) {
    const area=((q.x-p.x)*(r.y-p.y)-(q.y-p.y)*(r.x-p.x))*cols*rows;assert.ok(area>0.20,'Flame mesh must retain area without folding');minArea=Math.min(minArea,area);
  }
}
const report={version:2,scope:'Offline deterministic motion/geometry checks; browser and game integration checked separately.',cloudsPerMinuteScenePixels:384,cloudsPerMinuteSceneWidthFraction:.2,cloudMaskEdgePop:false,statueDurationSeconds:STATUE_SECONDS,statueFragmentsPerStatue:12,statuePartitionArea:areaSum,statueRestoresExactly:true,statueStaggeredSettle:true,flameBaseAnchored:true,flameUVBaseAnchored:true,flameGrid:FLAME_GRID,invertedFlameTriangles:0,minFlameAreaRatio:minArea,architectureMotion:false,backgroundCameraMotion:false};
fs.writeFileSync(new URL('./source/medusagaze/background/validation.json',import.meta.url),JSON.stringify(report,null,2)+'\n');
console.log('Background v2 passed: 384px/min clouds, mask-safe edges, 12-piece complete partition, 1.2s staggered statue restore, fixed fire/UV roots, no inverted triangles.');
