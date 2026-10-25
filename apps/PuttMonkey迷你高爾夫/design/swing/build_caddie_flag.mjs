// The caddie's flag (2026-10-23): his wrist and the pennant, in every clip.
// Runs after wp/tools/build_cast_mesh.py (body mesh, faces, the body's and
// arm's motion) and rewrites static/assets/spines/sushiApprentice/monkey.json.
//
// The hand turns at the wrist only, never far (user, 2026-10-23: small moves,
// nothing that opens a joint). The pennant follows through on Spine physics,
// simulated on the finished clip by spine-generator and baked into rotate
// keys, plus a light breeze. See build_golfer_swing.mjs for the kit, the 4.3
// round trip and why the baked keys stay inside 0.2s segments.
//
//   node design/swing/build_caddie_flag.mjs

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const KIT = process.env.SPINE_MOTION_KIT ?? 'E:/stake/spine-generator';
const kit = (f) => import(pathToFileURL(path.join(KIT, 'src', f)).href);
const { sampled } = await kit('solve.ts');
const { bake } = await kit('bake.ts');
const { poses, padTo } = await kit('motions.ts');
const { writeAnimation, upsertPhysics, parseSkeleton, sampleAnimation } = await kit('spineJson.ts');
const { checkSkeleton } = await kit('check.ts');

const HERE = path.dirname(fileURLToPath(import.meta.url));
const APP = path.resolve(HERE, '../..');
const OUT = path.join(APP, 'static/assets/spines/sushiApprentice');
const LAUGH = JSON.parse(fs.readFileSync(path.join(APP, 'src/game/laughTiming.json'), 'utf8'));
const raw = JSON.parse(fs.readFileSync(path.join(OUT, 'monkey.json'), 'utf8'));
if (!raw.bones.some((b) => b.name === 'pennant' && b.parent === 'handL')) throw new Error('monkey.json has no flag pieces: run build_cast_mesh.py Putt fg with the swing cut first');

const hump = (t, a, len) => (t <= a || t >= a + len ? 0 : Math.sin((Math.PI * (t - a)) / len));
const smooth = (u) => (u <= 0 ? 0 : u >= 1 ? 1 : u * u * (3 - 2 * u));
const K = (pts, D) => {
  const m = padTo(poses(pts.map(([time, value, ease]) => ({ time, value, ease }))), D);
  return (t) => m.value(Math.min(t, m.duration));
};
const fn = (D, f, loop = false) => ({ duration: D, loop, value: f });
const bk = (bone, timeline, D, f, loop, tol = 0.05) => ({ bone, timeline, keys: bake(fn(D, f, loop), { tolerance: tol, fps: 30, maxSegment: 0.2 }) });

const dur = (name) => {
  let d = 0;
  const a = raw.animations[name];
  for (const group of [a.bones, a.slots]) for (const tl of Object.values(group ?? {})) for (const keys of Object.values(tl)) for (const k of keys) d = Math.max(d, k.time ?? 0);
  return d;
};

// the wrist, degrees (+ tips the top of the pole left, toward the board)
const beats = Array.from({ length: LAUGH.beats }, (_, i) => (LAUGH.startMs + i * LAUGH.gapMs) / 1000);
const WRIST = {
  idle: (D) => (t) => 3 * Math.sin((2 * Math.PI * t) / D),
  // a dip of the flag
  nod: (D) => K([[0, 0], [0.25, 12, 'sineOut'], [0.45, -4, 'sineInOut'], [0.7, 0, 'sineInOut']], D),
  // waving it: he is pointing at the volcano (PUTT_動畫需求單 §1)
  cheer: (D) => K([[0, 0], [0.25, -8, 'sineOut'], [0.45, 16, 'sineInOut'], [0.65, -14, 'sineInOut'], [0.85, 12, 'sineInOut'], [1.05, -6, 'sineInOut'], [1.35, 0, 'sineInOut']], D),
  // a wag on every HA
  chestbeat: (D) => {
    const gap = LAUGH.gapMs / 1000;
    const on = K([[0, 0], [Math.max(0.1, beats[0] - 0.1), 1, 'sineOut'], [LAUGH.endMs / 1000, 1], [D, 0, 'sineInOut']], D);
    return (t) => on(t) * beats.reduce((a, b, i) => a + (i % 2 ? -14 : 14) * hump(t, b - 0.04, Math.min(0.24, gap * 1.1)), 0);
  },
  // the flourish that opens the free spins
  throwit: (D) => K([[0, 0], [0.3, 10, 'sineOut'], [0.42, -14, 'quartIn'], [0.6, -10, 'sineOut'], [0.95, 0, 'sineInOut']], D),
  // the flag droops
  flinch: (D) => K([[0, 0], [0.08, 20, 'backOut'], [0.35, 18], [0.6, 0, 'sineInOut']], D),
  // straight up, at attention
  alert: (D) => K([[0, 0], [0.15, 0], [0.3, -8, 'backOut'], [0.6, -8], [0.8, 0, 'sineInOut']], D),
  // pointed at the board
  glance: (D) => K([[0, 0], [0.35, 16, 'cubicOut'], [0.85, 16], [1.15, 0, 'sineInOut']], D),
};

const PENNANT_LIM = 22;
const to43 = (j) => {
  const c = structuredClone(j);
  c.skeleton.spine = '4.3.13';
  c.constraints = (c.ik ?? []).map(({ order: _o, ...k }) => ({ type: 'ik', ...k }));
  delete c.ik;
  return c;
};
const json43 = to43(raw);
// THE STARTER'S SIGNAL (2026-10-23): his own clip for the upgrade card
// (BanditMeter.svelte), where he used to be a still picture tilted about its
// feet. Flag up and back, a crouch into it, and down on the ball the instant
// it is putted — spine-generator's strike on every part, each a little after
// the one it hangs from, the pennant on physics like every other clip. The
// hit is at SIGNAL_HIT (s); BanditMeter starts the clip that long before the
// ball leaves (upgradeMotion.SIGNAL_HIT_MS). The arm and the head stay inside
// 85% of their measured mesh limits (build_cast_mesh.py: armL -7..6,
// foreL -15..12, head -6..7); the big swing is the wrist's, which is a piece.
const { strike, impact } = await import(pathToFileURL(path.join(APP, 'src/game/motionKit.ts')).href);
const SIGNAL_D = 1.25, SIGNAL_HIT = 0.42;
const sig = (antic, action, over, lag = 0) => {
	const sw = strike({
		anticipation: { value: antic, time: 330 + lag, ease: 'sineOut' },
		action: { value: action, time: 90 - lag, ease: 'quartIn' },
		overshoot: { amount: over, hz: 3, damping: 0.45 },
		hold: 260 + lag, recover: { time: 420, ease: 'sineInOut' },
	});
	return (t) => sw.at(t * 1000);
};
{
	const D = SIGNAL_D;
	const unit = sig(-1, 0.6, 0.2);
	const crouch = (t) => { const v = unit(t); return v < 0 ? v * v : 0; };
	const kick = (t) => impact(t * 1000, SIGNAL_HIT * 1000, 4, 0.45);
	const parts = [
		bk('root', 'rotate', D, sig(-1.5, 2.2, 0.8)),
		bk('root', 'scaley', D, (t) => 1 - 0.045 * crouch(t) + 0.03 * kick(t), false, 0.0005),
		bk('root', 'scalex', D, (t) => 1 + 0.025 * crouch(t) - 0.015 * kick(t), false, 0.0005),
		bk('armL', 'rotate', D, sig(-4, 3, 1)),
		// the forearm a beat behind the arm, the head behind both
		bk('foreL', 'rotate', D, sig(-9, 5, 2, 15)),
		bk('head', 'rotate', D, sig(-2, 4, 1.5, 30)),
	];
	const anim = { bones: {}, slots: { figure: { attachment: [{ time: 0, name: 'figure' }, { time: SIGNAL_HIT, name: 'figure_grin' }, { time: D - 0.15, name: 'figure' }] } } };
	for (const tr of parts) {
		anim.bones[tr.bone] ??= {};
		anim.bones[tr.bone][tr.timeline] = tr.keys.map((x) => ({ ...(x.time ? { time: x.time } : {}), value: x.value, ...(x.curve ? { curve: x.curve } : {}) }));
	}
	raw.animations.signal = anim;
	WRIST.signal = () => sig(-18, 22, 6, 10);
}

const out = structuredClone(raw);
const report = [];

for (const [name, wrist] of Object.entries(WRIST)) {
  const D = dur(name);
  const loop = name === 'idle';
  const w = wrist(D);
  const hand = bk('handL', 'rotate', D, w, loop);
  // write the hand into the 4.3 copy alongside the body, then let physics
  // drag the pennant behind everything that moves it
  const anim43 = structuredClone(raw.animations[name]);
  anim43.bones ??= {};
  anim43.bones.handL = { rotate: hand.keys.map((k) => ({ ...(k.time ? { time: k.time } : {}), value: k.value, ...(k.curve ? { curve: k.curve } : {}) })) };
  json43.animations[name] = anim43;
  const scratch = structuredClone(json43);
  upsertPhysics(scratch, [{ name: 'phys-pennant', bone: 'pennant', rotate: 1, mix: 1, inertia: 0.6, strength: 100, damping: 0.75, mass: 1 }]);
  const data = parseSkeleton(scratch);
  const smp = sampleAnimation(data, name, { rate: 240, seconds: D, loop, warmUp: loop ? D * 3 : 0 });
  const setup = data.findBone('pennant').setupPose.rotation;
  let v = smp.bones.get('pennant').localRot.map((r) => ((r - setup + 540) % 360) - 180);
  // a breeze on top: two slow waves, whole cycles of the clip so a loop
  // stays seamless
  const n = v.length - 1;
  const cyc = Math.max(1, Math.round(D / 1.6));
  v = v.map((x, i) => x + 4 * Math.sin((2 * Math.PI * cyc * i) / n) + 1.5 * Math.sin((2 * Math.PI * 3 * cyc * i) / n + 1));
  const peak = Math.max(...v.map(Math.abs));
  const k = Math.min(1, PENNANT_LIM / peak);
  v = v.map((x) => x * k);
  if (!loop) v = v.map((x, i) => x * (1 - smooth((i / n - (1 - 0.15 / D)) / (0.15 / D))));
  // as shear, not rotation: shearX turns the pennant's long axis and leaves
  // the edge along the pole where it is, so the cloth never leaves the pole
  const pen = { bone: 'pennant', timeline: 'shearx', keys: bake(sampled(v, D, loop), { tolerance: 0.1, fps: 30, maxSegment: 0.2 }) };
  // the cloth flaps: it shortens a little along its length as it ripples
  const flap = bk('pennant', 'scalex', D, (t) => 1 - 0.05 * (0.5 + 0.5 * Math.sin((2 * Math.PI * cyc * 2 * t) / D)), loop, 0.0005);
  report.push(`${name}: wrist ${Math.min(...hand.keys.map((x) => x.value)).toFixed(0)}..${Math.max(...hand.keys.map((x) => x.value)).toFixed(0)} deg, pennant flap ${(peak * k).toFixed(1)} deg${k < 1 ? ` (scaled x${k.toFixed(2)})` : ''}`);

  const a = out.animations[name];
  a.bones ??= {};
  for (const tr of [hand, pen, flap]) {
    a.bones[tr.bone] ??= {};
    a.bones[tr.bone][tr.timeline] = tr.keys.map((x) => ({ ...(x.time ? { time: x.time } : {}), value: x.value, ...(x.curve ? { curve: x.curve } : {}) }));
  }
  writeAnimation(json43, name, Object.entries(a.bones).flatMap(([bone, tl]) => Object.entries(tl).filter(([t]) => ['rotate', 'translatex', 'translatey', 'scalex', 'scaley', 'shearx'].includes(t)).map(([timeline, keys]) => ({ bone, timeline, keys: keys.map((x) => ({ time: x.time ?? 0, value: x.value, curve: x.curve })) }))));
}

fs.writeFileSync(path.join(OUT, 'monkey.json'), JSON.stringify(out));

const final43 = to43(out);
for (const r of checkSkeleton(final43, { loops: ['idle', 'flutter'], only: Object.keys(WRIST) })) {
  const bad = r.issues.filter((i) => i.severity !== 'info');
  report.push(`${r.name}: score ${r.score}${bad.length ? ', ' + bad.map((i) => `${i.severity} ${i.code}${i.bone ? ` ${i.bone}` : ''}`).join('; ') : ', no warnings'}`);
}
console.log(report.join('\n'));
