import assert from 'node:assert/strict';
import { register } from 'node:module';
// the game's modules import each other without an extension, as vite expects
register('data:text/javascript,' + encodeURIComponent(`export async function resolve(s, c, next) {
	try { return await next(s, c); } catch (e) { if (s.startsWith('.') && !s.endsWith('.ts')) return next(s + '.ts', c); throw e; } }`));
const {abductionPose,puttPose,collectionStagger,puttSequence,puttStrokePose} = await import('../src/game/collectionMotion.ts');
let cases=0;
for(const x of [70,210,350,490,630])for(const y of [62,202,342,482]){
 const from={x,y},to={x:350,y:-8};
 let previous=y;
 for(let i=0;i<=120;i++){
  const p=abductionPose(from,to,i/120);
  assert.ok(Object.values(p).every(Number.isFinite));
  assert.ok(p.y<=previous+1e-7,'cow must keep rising toward the intake');
  previous=p.y;
 }
 assert.equal(abductionPose(from,to,0).x,x);
 assert.equal(abductionPose(from,to,0).y,y);
 const end=abductionPose(from,to,1);
 assert.equal(end.x,to.x);assert.equal(end.y,to.y);assert.equal(end.alpha,0);
 const cup={x:490,y:408};
 for(const boundary of [.66,.87,.91]){
  const a=puttPose(from,cup,boundary-1e-7),b=puttPose(from,cup,boundary+1e-7);
  assert.ok(Math.hypot(a.x-b.x,a.y-b.y)<.001,'ball path must not pop at phase boundaries');
 }
 const pauseA=puttPose(from,cup,.88),pauseB=puttPose(from,cup,.90);
 assert.equal(pauseA.x,pauseB.x);assert.equal(pauseA.y,pauseB.y);
 assert.equal(puttPose(from,cup,1).alpha,0);
 assert.equal(puttPose(from,cup,1).scale,0);
 assert.ok(Math.abs(puttPose(from,cup,.85).rotation-puttPose(from,cup,.67).rotation)>1,'stripe must visibly roll around the rim');
 for(const finale of [false,true]){
  for(const boundary of finale?[.56,.75,.89]:[.78]){
   const a=puttStrokePose(from,cup,boundary-1e-7,finale),b=puttStrokePose(from,cup,boundary+1e-7,finale);
   for(const key of ['x','y','scale','rotation','alpha'])assert.ok(Math.abs(a[key]-b[key])<.001,`putt ${key} must stay continuous`);
  }
  assert.equal(puttStrokePose(from,cup,1,finale).alpha,0);
 }
 cases++;
}
for(let count=1;count<=20;count++)assert.ok(collectionStagger(count)*Math.max(0,count-1)<=480+1e-7);
for(let count=1;count<=20;count++){
 const schedule=puttSequence(count);
 assert.equal(schedule.length,count);
 assert.equal(schedule.filter(s=>s.finale).length,1);
 assert.ok(schedule.at(-1).end<7000,'dense boards must not become an endless putting queue');
 for(let i=1;i<schedule.length;i++)assert.ok(schedule[i].pickAt>schedule[i-1].end,'only one ball may move, including pickup');
}
assert.deepEqual(puttSequence(0),[]);
console.log('collection motion: '+cases+' board positions, monotone abduction, registered intake, continuous golf rim/pause/sink, bounded 20-item stagger');
console.log('putting queue: 1–20 balls, no overlap, continuous quick/finale strokes, <7s per collector');

// ---- 2026-10-23: spine-generator's curve rules on the collection and the
// upgrade (src/game/motionKit.ts, upgradeMotion.ts): no value may jump, and
// the speed may break only at a declared hit (the kit's kink / speed-jump).
const { putterSwing } = await import('../src/game/collectionMotion.ts');
const up = await import('../src/game/upgradeMotion.ts');
const curve = (name, f, T, hits = []) => {
	const v = Array.from({ length: T + 1 }, (_, i) => f(i));
	const range = Math.max(...v) - Math.min(...v) || 1;
	// a pop, as check_mesh_wins counts one: a step over 3% of the range AND 3x
	// the steps either side (fast is fine — a snap is fast — a pop is alone)
	const d = v.map((x, i) => (i ? Math.abs(x - v[i - 1]) : 0));
	for (let i = 2; i < T; i++) assert.ok(!(d[i] > 0.03 * range && d[i] > 3 * Math.max(d[i - 1], d[i + 1])), `${name}: jumps at ${i}ms`);
	let peak = 0;
	for (let i = 1; i <= T; i++) peak = Math.max(peak, Math.abs(v[i] - v[i - 1]));
	for (let i = 4; i <= T - 4; i++) {
		const left = (v[i] - v[i - 3]) / 3, right = (v[i + 3] - v[i]) / 3;
		if (Math.abs(right - left) <= 0.35 * peak) continue;
		assert.ok(hits.some((h) => Math.abs(i - h) <= 6), `${name}: speed breaks at ${i}ms, which is not a hit (${hits.join(', ')})`);
	}
};
for (const wind of [80, 220]) {
	const sw = putterSwing(wind);
	assert.equal(sw.hitAt, wind, 'the putter meets the ball the moment it starts');
	curve(`putter ${wind}`, sw.at, Math.ceil(sw.duration), [sw.hitAt]);
}
const CUT = 950;
assert.ok(up.signalAt(CUT) >= 0, "the caddie's signal must start inside the rung");
curve('struck ball', (t) => up.ballRoll(t / up.ROLL_MS), up.ROLL_MS, [0]);
assert.ok(up.ballRoll(1) === 1 && (up.ballRoll(1) - up.ballRoll(.99)) / .01 > .5, 'the ball is still going when it reaches the card');
// `fly` stops where the card has faded to nothing (BanditMeter's alpha is 0 at fly 1)
for (const key of ['smear', 'fly']) curve(`card ${key}`, (t) => up.cardHit(t, CUT)[key], 2200, [CUT, CUT + up.HIT_STOP, CUT + up.HIT_STOP + 640]);
curve('prize landing', (t) => up.prizeSquash(t - 300), 1400, [300]);
assert.equal(up.prizeSquash(0), 0, 'the landing starts from no squash');
curve('rung light', (t) => up.rungPopAt(t, CUT), 2200, [CUT + up.RUNG_LIGHT]);
console.log('curves: putter strike, struck ball, card hit, prize landing, rung light — continuous, breaking only on their hits');

// the free-game postcard (src/game/fgMotion.ts)
const fg = await import('../src/game/fgMotion.ts');
curve('postcard swing', fg.postcardSwing, 3000, [250]);
assert.ok(Math.abs(fg.postcardSwing(3000)) < 1e-4, 'the postcard comes to rest');
for (const key of ['scale', 'rot']) curve(`stamp ${key}`, (t) => fg.stampSlam(t)[key], 1200, [0, fg.SLAM_HIT]);
assert.ok(Math.abs(fg.stampSlam(1200).scale - 1) < 1e-3 && Math.abs(fg.stampSlam(1200).rot) < 1e-3, 'the stamp settles square at 1');
curve('title in', (t) => fg.titleIn(t / 300), 300, [0]);
curve('total punch', fg.totalPunch, 900, [0]);
console.log('postcard: swing, stamp slam, title, total punch — continuous, breaking only on their hits');
