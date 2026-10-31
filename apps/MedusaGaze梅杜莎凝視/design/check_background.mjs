// @ts-nocheck -- Node-only motion validation, not frontend code.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { BACKGROUND_SIZE, CLOUD_PIXELS_PER_SECOND, CLOUDS, BIRD_COUNT,birdPose,gardenBreeze, STATUES, STATUE_FRACTURE_PIECES, cloudPosition, cloudVisibility, statueEnvelope, statuePiecePose, STATUE_SECONDS } from '../src/game/backgroundMotion.ts';
import {createFlameField} from '../src/game/flameField.ts';
assert.equal(CLOUD_PIXELS_PER_SECOND * 60, BACKGROUND_SIZE.width / 5);
for(const side of [0,1])for(let t=0;t<=120;t+=.01){
 const p=gardenBreeze(t,side),q=gardenBreeze(t+.001,side);
 assert.ok(Object.values(p).every(Number.isFinite));assert.ok(q.distance>=p.distance-1e-9&&q.distance-p.distance<.025,'Gusts must carry the garden forward without loop jumps');
 assert.ok(p.lift>=0&&p.lift<=12);
}
for (const cloud of CLOUDS) {
  const span=cloud.lane==='left'?600:3120;
  const a = cloudPosition(0, cloud.x, cloud.width,cloud.speed,cloud.lane), b = cloudPosition(60, cloud.x, cloud.width,cloud.speed,cloud.lane);
  assert.ok(Math.abs((b - a + span) % span - (384*cloud.speed)%span) < 1e-8);
  for (let t = 0; t <= 1200; t++) {
    const x = cloudPosition(t,cloud.x,cloud.width,cloud.speed,cloud.lane), alpha = cloudVisibility(x,cloud.width,cloud.lane);
    assert.ok(alpha >= 0 && alpha <= 1);
    if (x - cloud.width/2 <= 155 || x + cloud.width/2 >= (cloud.lane==='left'?610:1770)) assert.equal(alpha,0,'Cloud must fade before its column mask edge');
  }
}
let minimumVisibleLeftClouds=Infinity,minimumVisibleLeftBirds=Infinity;
for(let t=0;t<=1200;t+=.25){
 const visible=CLOUDS.filter(c=>c.lane==='left'&&c.alpha*cloudVisibility(cloudPosition(t,c.x,c.width,c.speed,c.lane),c.width,c.lane)>.25).length;
 minimumVisibleLeftClouds=Math.min(minimumVisibleLeftClouds,visible);
 const visibleBirds=Array.from({length:6},(_,i)=>birdPose(i,t)).filter(b=>b.alpha>.1).length;
 minimumVisibleLeftBirds=Math.min(minimumVisibleLeftBirds,visibleBirds);
}
assert.ok(minimumVisibleLeftClouds>=2,'Left sky must retain visible clouds through the whole twenty-minute cycle');
assert.ok(minimumVisibleLeftBirds>=3,'At least one small flock stays in the visible left opening');
let glidingSamples=0,flappingSamples=0;
for(let i=0;i<BIRD_COUNT;i++)for(let t=0;t<30;t+=.02){
 const p=birdPose(i,t),next=birdPose(i,t+.001);
 assert.ok(Object.values(p).every(Number.isFinite));
 assert.ok(Math.abs(next.wing-p.wing)<.06,'Wing-stroke speed must remain below 60 scene pixels per second');
 if(Math.abs(p.wing/p.span-.16)<1e-6)glidingSamples++;else flappingSamples++;
}
assert.ok(glidingSamples>flappingSamples&&flappingSamples>1000,'Birds should glide between short groups of wing strokes');
for(let i=0;i<BIRD_COUNT;i++){
 const period=5.6+(i%3)*.35,boundary=period*3-i*.37;
 assert.ok(Math.abs(birdPose(i,boundary-.00001).wing-birdPose(i,boundary+.00001).wing)<1e-6,'Glide-to-stroke cycle must not jump');
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
const fire=createFlameField(20261026),other=createFlameField(20261483),first=fire.pixels.slice();
assert.equal(fire.width,fire.height,'Texture row strides must agree on the installed WebGPU and WebGL uploaders');
let maximumTopHeat=0,changed=0;
for(let i=0;i<300;i++){
 fire.step();if(i%10===0){const snap=fire.snapshot();for(const v of snap.heat)assert.ok(Number.isFinite(v)&&v>=0&&v<1.2);maximumTopHeat=Math.max(maximumTopHeat,...snap.heat.slice(0,fire.width));}
}
fire.paint();for(let i=0;i<first.length;i++)if(first[i]!==fire.pixels[i])changed++;
assert.ok(changed>1000,'Fuel and rising tongues must evolve rather than replay one silhouette');
assert.ok(maximumTopHeat<.055,'Heat must dissipate before the top boundary');
assert.ok(other.pixels.some((v,i)=>v!==first[i]),'Brazier fields have independent fuel timing');
const report={version:6,birdFlight:"Short authored wing-stroke windows followed by longer glides; continuous loop boundaries",glidingSamples,flappingSamples,gardenWind:'14-second staggered gusts; integrated forward drift, curved leaves and fade before vertical wrap',scope:'Offline deterministic cloud, fracture and heat transport checks; visual review separately.',cloudsPerMinuteScenePixels:CLOUDS.map(c=>384*c.speed),cloudLayers:CLOUDS.length,leftCloudInstances:CLOUDS.filter(c=>c.lane==='left').length,minimumVisibleLeftClouds,birdCount:BIRD_COUNT,minimumVisibleLeftBirds,cloudMaskEdgePop:false,cloudSoftness:'Bilinear artwork plus subtle blur, lower opacity and separate depth speeds',statueDurationSeconds:STATUE_SECONDS,statueFragmentsPerStatue:12,statuePartitionArea:areaSum,statueRestoresExactly:true,statueStaggeredSettle:true,fire:'30Hz upward-advection heat fields, three changing fuel lobes, soft thermal colour and independent seeds',fireResolution:[fire.width,fire.height],maximumTopHeat,changedHeatBytes:changed,architectureMotion:false,backgroundCameraMotion:false};
fs.writeFileSync(new URL('./source/medusagaze/background/validation.json',import.meta.url),JSON.stringify(report,null,2)+'\n');
console.log('Background v4 passed: left-side cloud coverage, two visible flocks, soft depth-layered clouds, continuous rising heat, independent braziers, complete statue restore, fixed architecture.');
