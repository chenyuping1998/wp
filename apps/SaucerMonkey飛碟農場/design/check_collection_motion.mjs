import assert from 'node:assert/strict';
import {abductionPose,puttPose,collectionStagger} from '../src/game/collectionMotion.ts';
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
 cases++;
}
for(let count=1;count<=20;count++)assert.ok(collectionStagger(count)*Math.max(0,count-1)<=480+1e-7);
console.log('collection motion: '+cases+' board positions, monotone abduction, registered intake, continuous golf rim/pause/sink, bounded 20-item stagger');

// the game's modules import each other without an extension, as vite expects
const { register } = await import('node:module');
register('data:text/javascript,' + encodeURIComponent(`export async function resolve(s, c, next) {
	try { return await next(s, c); } catch (e) { if (s.startsWith('.') && !s.endsWith('.ts')) return next(s + '.ts', c); throw e; } }`));
// ---- 2026-10-23: the upgrade (the saucer rams the card) and the FG board,
// held to spine-generator's curve rules: no value may jump, and the speed may
// break only at a declared hit (src/game/motionKit.ts, upgradeMotion.ts,
// fgMotion.ts — the same check as Putt's)
const up = await import('../src/game/upgradeMotion.ts');
const fg = await import('../src/game/fgMotion.ts');
const curve = (name, f, T, hits = []) => {
	const v = Array.from({ length: T + 1 }, (_, i) => f(i));
	const range = Math.max(...v) - Math.min(...v) || 1;
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
const CUT = 950;
const PTS = { from: { x: 500, y: -420 }, hit: { x: -100, y: -80 }, hover: { x: -160, y: -230 }, away: { x: -560, y: -460 } };
for (const last of [false, true]) {
	for (const key of ['x', 'y', 'rot', 'sx', 'sy']) {
		curve(`saucer ${key}${last ? ' (last rung)' : ''}`, (t) => up.saucerPose(t, CUT, PTS, last, 6)[key], 2200,
			[CUT - up.APPROACH_MS, CUT, CUT + 20, CUT + up.HIT_STOP, ...(last ? [] : [up.LEAVE_AT, up.LEAVE_AT + up.LEAVE_MS])]);
	if (!last) assert.equal(up.saucerPose(up.LEAVE_AT + up.LEAVE_MS, CUT, PTS, false, 6).alpha, 0, "it is gone before it stops");
	}
	const hit = up.saucerPose(CUT, CUT, PTS, last, 6);
	assert.ok(Math.hypot(hit.x - PTS.hit.x, hit.y - PTS.hit.y) < 1e-6, 'the saucer meets the card where it is aimed');
}
const v = (t) => { const a = up.saucerPose(t, CUT, PTS, true, 0), b = up.saucerPose(t - 1, CUT, PTS, true, 0); return Math.hypot(a.x - b.x, a.y - b.y); };
assert.ok(v(CUT - 1) > 1.5 * v(CUT - up.APPROACH_MS * 0.6), 'the saucer is fastest as it reaches the card');
curve('cow lowered', (t) => up.lowerCow(t, CUT), 2200, [CUT + up.LOWER_AT, CUT + up.LAND]);
curve('cow landing', (t) => up.prizeSquash(t - 300), 1400, [300]);
assert.equal(up.prizeSquash(0), 0, 'the landing starts from no squash');
curve('rung light', (t) => up.rungPopAt(t, CUT), 2200, [CUT + up.RUNG_LIGHT]);
curve('board swing', fg.postcardSwing, 3000, [250]);
assert.ok(Math.abs(fg.postcardSwing(3000)) < 1e-4, 'the board comes to rest');
for (const key of ['scale', 'rot']) curve(`stamp ${key}`, (t) => fg.stampSlam(t)[key], 1200, [0, fg.SLAM_HIT]);
curve('total punch', fg.totalPunch, 900, [0]);
console.log('upgrade: saucer dive/ram/recoil/leave, cow lowered and landing, rung light; FG board swing, stamp, punch — continuous, breaking only on their hits');
