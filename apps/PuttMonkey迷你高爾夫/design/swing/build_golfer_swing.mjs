// The golfer's arms, putter and ball (2026-10-23): the putt, and what his
// hands do in every other clip. Runs after wp/tools/build_cast_mesh.py
// (which builds the body mesh, the face cels and the body's motion) and
// rewrites static/assets/spines/sushiMaster/monkey.json in place.
//
// Built on spine-generator (E:/stake/spine-generator, override with
// SPINE_MOTION_KIT): its screen-space solver turns "where the hands are on
// screen" into IK-target and wrist keys for this rig, its IK guard keeps both
// arms short of their full reach so an elbow never snaps straight, its baker
// places keys the way the Spine runtime actually plays them (each Bezier as
// ten straight lines, so no segment is longer than 0.2s), and its physics bake
// gives the pompom, tail and towel their follow-through as plain rotate keys.
//
// The kit speaks Spine 4.3; the game runs spine-core 4.2.74. Bone timelines
// (rotate / translatex / translatey / scalex / scaley, Bezier curves) are the
// same in both, so the motion is solved and checked on a 4.3 copy (IK moved
// into `constraints`) and the keys are copied back into the 4.2 file.
//
// Hand geometry is described on the drawing's 560x912 canvas (y down), the
// same coordinates as design/swing/cut_golfer_arms.py.
//
//   node design/swing/build_golfer_swing.mjs [--report]

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const KIT = process.env.SPINE_MOTION_KIT ?? 'E:/stake/spine-generator';
const kit = (f) => import(pathToFileURL(path.join(KIT, 'src', f)).href);
const { solveScreen, sampled } = await kit('solve.ts');
const { bake } = await kit('bake.ts');
const { poses, padTo } = await kit('motions.ts');
const { writeAnimation, upsertPhysics, parseSkeleton, sampleAnimation, setupFrames } = await kit('spineJson.ts');
const { checkSkeleton, reportMarkdown } = await kit('check.ts');

const HERE = path.dirname(fileURLToPath(import.meta.url));
const APP = path.resolve(HERE, '../..');
const OUT = path.join(APP, 'static/assets/spines/sushiMaster');
const CUT = JSON.parse(fs.readFileSync(path.join(APP, 'design/source/putt/cast/mg/swing/cut.json'), 'utf8'));
const LAUGH = JSON.parse(fs.readFileSync(path.join(APP, 'src/game/laughTiming.json'), 'utf8'));
const raw = JSON.parse(fs.readFileSync(path.join(OUT, 'monkey.json'), 'utf8'));
if (!raw.ik?.length) throw new Error('monkey.json has no arm IK: run build_cast_mesh.py Putt mg with the swing cut first');

// ── coordinates ──────────────────────────────────────────────────────────
const ROOT = [280, 904];
const s = ([x, y]) => [x - ROOT[0], ROOT[1] - y]; // canvas -> skeleton
const J = Object.fromEntries(Object.entries(CUT.joints).map(([k, v]) => [k, v]));
const deg = (r) => (r * 180) / Math.PI;
const rad = (d) => (d * Math.PI) / 180;
const lerp = (a, b, u) => a + (b - a) * u;
const smooth = (u) => (u <= 0 ? 0 : u >= 1 ? 1 : u * u * (3 - 2 * u));
const hump = (t, a, len) => (t <= a || t >= a + len ? 0 : Math.sin((Math.PI * (t - a)) / len));

// the putter: the club's tilt `tau` is its angle off straight down on the
// canvas, + with the head swung to the right. Its world angle is tau - 90.
const TAU0 = deg(Math.atan2(J.head[0] - J.grip[0], J.head[1] - J.grip[1]));
// where the grip sits in the left hand, in the hand's own frame
const HAND_GRIP = (() => {
  const g = s(J.grip), w = s(J.wristL), a = rad(TAU0 - 90);
  const dx = g[0] - w[0], dy = g[1] - w[1];
  return [dx * Math.cos(-a) - dy * Math.sin(-a), dx * Math.sin(-a) + dy * Math.cos(-a)];
})();
const CLUB_LEN = Math.hypot(J.head[0] - J.grip[0], J.head[1] - J.grip[1]);
// the right hand: its bone runs wrist -> fingers, the palm 44 along it
const PSI0 = deg(Math.atan2(-(640 - J.wristR[1]), 472 - J.wristR[0]));
const PALM = 44;
// when both hands are on the club the right one overlaps the left, a little
// further down the grip, fingers wrapped round it (turned 35deg off the shaft
// so the wrist stays on the right shoulder's side)
const GRIP_GAP = 12;
const WRAP = -35;

/** Where both hands go for a club held at canvas wrist `wl` with tilt `tau`. */
function clubHands(wl, tau) {
  const W = s(wl);
  const a = rad(tau - 90);
  const G = [W[0] + HAND_GRIP[0] * Math.cos(a) - HAND_GRIP[1] * Math.sin(a), W[1] + HAND_GRIP[0] * Math.sin(a) + HAND_GRIP[1] * Math.cos(a)];
  const u = [Math.cos(a), Math.sin(a)];
  const GR = [G[0] + GRIP_GAP * u[0], G[1] + GRIP_GAP * u[1]];
  const psi = tau - 90 + WRAP;
  const WR = [GR[0] - PALM * Math.cos(rad(psi)), GR[1] - PALM * Math.sin(rad(psi))];
  const head = [G[0] + CLUB_LEN * u[0], G[1] + CLUB_LEN * u[1]];
  return { G, WR, psi, head };
}

/** A point on a circle about a canvas pivot: angle off straight down, + to the right. */
const polar = (c, r, th) => [c[0] + r * Math.sin(rad(th)), c[1] + r * Math.cos(rad(th))];
const polarOf = (c, p) => ({ r: Math.hypot(p[0] - c[0], p[1] - c[1]), th: deg(Math.atan2(p[0] - c[0], p[1] - c[1])) });

/** keyframes -> t => value, eased into each key (the kit's pose-to-pose curve) */
const K = (pts, D) => {
  const m = padTo(poses(pts.map(([time, value, ease]) => ({ time, value, ease }))), D);
  return (t) => m.value(Math.min(t, m.duration));
};

// ── the clips ────────────────────────────────────────────────────────────
//
// Each clip says, for every moment: where the left wrist is on the canvas
// (`wl`), the club's tilt (`tau`), how much the right hand is on the club
// (`grip`, 0..1) and, when it is not, where the right wrist is (`wr`) and
// which way the hand points (`psi`, skeleton degrees). `body` gives local
// tracks (root, torso, head) for the clips written here from scratch;
// `keepBody` clips keep build_cast_mesh.py's body motion and only add hands.

const REST_WL = J.wristL;
const REST_WR = J.wristR;
const SHOULDER_L = J.shoulderL;
const SHOULDER_R = J.shoulderR;

// the crouch every swing keeps from address to impact: the root's scale about
// the feet. Hands are placed relative to the shoulders, so they drop with it.
const crouchDrop = (sy) => (1 - sy) * (ROOT[1] - SHOULDER_L[1]);

// No full swing (user, 2026-10-23: the arms are cut pieces, and a big turn
// shows the joints): every clip keeps the club within about 30deg of hanging
// and the elbows nearly as drawn. The one golf stroke is the putt.

function puttClip(name, o) {
  // spec (PUTT_動畫需求單 §1): squint and aim, wiggle twice, a gentle putt,
  // then freeze watching the ball, leaning after it. `o` makes the same
  // stroke longer or harder: back / through (club tilt, deg), roll (how far
  // the ball goes) and the timings.
  const D = o.D;
  const T = o.T;
  const sy = K([[0, 1], [T.address, 0.96, 'sineOut'], [T.watch, 0.96], [T.home, 1, 'sineInOut']], D);
  const sx = K([[0, 1], [T.address, 1.015, 'sineOut'], [T.watch, 1.015], [T.home, 1, 'sineInOut']], D);
  const wig = (t) => (o.wiggle && t > T.aim && t < T.wiggle ? Math.sin((2 * Math.PI * 2 * (t - T.aim)) / (T.wiggle - T.aim)) * Math.sin((Math.PI * (t - T.aim)) / (T.wiggle - T.aim)) : 0);
  const lean = K([[0, 0], [T.impact, 0], [T.impact + 0.18, 1, 'cubicOut'], [T.watch, 1], [T.home, 0, 'sineInOut']], D);
  const rx = (t) => 5 * wig(t) - 7 * lean(t);
  const rr = (t) => -1.2 * wig(t) + 2 * lean(t);
  const torso = K([[0, 0], [T.address, 0.5], [T.impact, 0.5], [T.impact + 0.18, -2, 'cubicOut'], [T.watch, -2], [T.home, 0, 'sineInOut']], D);
  const head = K([[0, 0], [T.address, 3, 'sineInOut'], [T.aim, 5, 'sineOut'], [T.back, 5], [T.impact, 4], [T.impact + 0.18, 5, 'cubicOut'], [T.watch, 5], [T.home, 0, 'sineInOut']], D);
  const addr = polar(SHOULDER_L, 176, 24.7);
  const A = polarOf(SHOULDER_L, addr);
  // the hands rock with the club like a pendulum from the shoulders
  const th = K([[0, 0], [T.wiggle, 0], [T.back, o.back / 4, 'sineInOut'], [T.impact, 0, 'quadIn'], [T.through, -o.through / 4, 'quadOut'], [T.watch, -o.through / 4.5]], D);
  const toAddr = K([[0, 0], [T.address, 1, 'sineInOut'], [T.watch, 1], [T.home, 0, 'sineInOut']], D);
  const tau = K([[0, TAU0], [T.address, 0, 'sineInOut'], [T.wiggle, 0], [T.back, o.back, 'sineInOut'], [T.impact, 0, 'quadIn'], [T.through, -o.through, 'quadOut'], [T.watch, -o.through * 0.85, 'sineInOut'], [T.home, TAU0, 'sineInOut']], D);
  const grip = K([[0, 0], [T.address, 1, 'sineInOut'], [T.watch, 1], [T.home - 0.04, 0, 'sineInOut']], D);
  const wl = (t) => {
    const p = polar(SHOULDER_L, A.r, A.th + th(t));
    const u = toAddr(t);
    return [lerp(REST_WL[0], p[0], u) + rx(t), lerp(REST_WL[1], p[1], u) + crouchDrop(sy(t))];
  };
  return {
    name, D, wl, tau, grip,
    wr: () => REST_WR, psi: () => PSI0,
    body: { root: { x: rx, rotate: rr, scaleX: sx, scaleY: sy }, torso: { rotate: torso }, head: { rotate: head } },
    faces: [[0, 'figure'], ...(o.effort ? [[T.impact - 0.08, 'figure_shock']] : []), [T.impact + 0.12, 'figure_grin'], [T.home - 0.06, 'figure']],
    ball: { appear: 0.2, hit: T.impact, kind: 'putt', roll: o.roll },
    physics: true,
  };
}

const putt = () => puttClip('cheer', {
  D: 1.7, back: 20, through: 14, roll: 360, wiggle: true,
  T: { address: 0.25, aim: 0.45, wiggle: 0.85, back: 1.05, impact: 1.12, through: 1.2, watch: 1.45, home: 1.68 },
});
// 'throwit' (Mascot's mascotThrow; nothing raises it in this game today): the
// same putt, no wiggle, a firmer stroke that sends the ball further
const hardPutt = () => puttClip('throwit', {
  D: 1.3, back: 30, through: 24, roll: 520, wiggle: false, effort: true,
  T: { address: 0.22, aim: 0.3, wiggle: 0.3, back: 0.58, impact: 0.66, through: 0.76, watch: 1.05, home: 1.28 },
});

function measureClip() {
  // the idle glance: he lays the putter out toward the board along the ground,
  // measuring the line (spec: 用推桿在地上比一下距離), and brings it back
  const D = 1.2;
  const out = K([[0, 0], [0.32, 1, 'cubicOut'], [0.86, 1], [1.16, 0, 'sineInOut']], D);
  const tap = K([[0, 0], [0.45, 0], [0.55, 1, 'sineOut'], [0.65, 0, 'sineIn'], [0.75, 0.6, 'sineOut'], [0.85, 0, 'sineIn']], D);
  const head = K([[0, 0], [0.32, 4, 'sineOut'], [0.86, 4], [1.16, 0, 'sineInOut']], D);
  const torso = K([[0, 0], [0.32, 1, 'sineOut'], [0.86, 1], [1.16, 0, 'sineInOut']], D);
  return {
    name: 'glance', D,
    wl: (t) => [REST_WL[0] - 14 * out(t), REST_WL[1] - 6 * out(t) - 5 * tap(t)],
    tau: (t) => TAU0 - 24 * out(t) + 3 * tap(t), grip: () => 0, wr: () => REST_WR, psi: () => PSI0,
    body: { torso: { rotate: torso }, head: { rotate: head } },
    faces: [[0, 'figure'], [0.95, 'figure_blink'], [1.05, 'figure']],
    physics: true,
  };
}

// the clips whose body build_cast_mesh.py already moves: hands only, small
function idleHands(D) {
  // the putter's head rocks a degree or so, once a loop; nothing else
  const tau = (t) => TAU0 + 1.2 * Math.sin((2 * Math.PI * t) / D) * Math.sin((Math.PI * t) / D);
  return { name: 'idle', D, loop: true, wl: () => REST_WL, tau, grip: () => 0, wr: () => REST_WR, psi: () => PSI0 };
}

function nodHands(D) {
  // a tap: the putter lifts off the ground and touches back down
  const lift = K([[0, 0], [0.22, 1, 'sineOut'], [0.38, -0.15, 'quadIn'], [0.55, 0, 'sineOut']], D);
  return { name: 'nod', D, wl: (t) => [REST_WL[0] + 4 * lift(t), REST_WL[1] - 10 * lift(t)], tau: (t) => TAU0 + 5 * lift(t), grip: () => 0, wr: () => REST_WR, psi: () => PSI0 };
}

function laughHands(D) {
  // the belly laugh: the putter taps the ground on every HA, the free hand
  // pats his thigh; both stay where they are drawn, give or take a hand's width
  const beats = Array.from({ length: LAUGH.beats }, (_, i) => (LAUGH.startMs + i * LAUGH.gapMs) / 1000);
  const end = LAUGH.endMs / 1000;
  const gap = LAUGH.gapMs / 1000;
  const on = K([[0, 0], [Math.max(0.12, beats[0] - 0.1), 1, 'sineOut'], [end - 0.05, 1], [D, 0, 'sineInOut']], D);
  const pump = (t) => beats.reduce((a, b, i) => a + (i % 2 ? 0.7 : 1) * hump(t, b - 0.03, Math.min(0.22, gap * 1.05)), 0);
  return {
    name: 'chestbeat', D,
    wl: (t) => [REST_WL[0] + 6 * on(t), REST_WL[1] - 8 * on(t) - 10 * pump(t) * on(t)],
    tau: (t) => TAU0 + 6 * on(t) * pump(t),
    grip: () => 0,
    wr: (t) => [REST_WR[0] - 14 * on(t), REST_WR[1] - 10 * on(t) + 8 * pump(t) * on(t)],
    psi: (t) => PSI0 - 10 * on(t),
  };
}

function flinchHands(D) {
  // a start: both hands jump up and in a little, the putter jerks
  const g = K([[0, 0], [0.07, 1, 'backOut'], [0.3, 1], [0.6, 0, 'sineInOut']], D);
  return {
    name: 'flinch', D,
    wl: (t) => [REST_WL[0] + 12 * g(t), REST_WL[1] - 22 * g(t)],
    tau: (t) => TAU0 + 10 * g(t), grip: () => 0,
    wr: (t) => [REST_WR[0] - 12 * g(t), REST_WR[1] - 24 * g(t)],
    psi: (t) => PSI0 + 12 * g(t),
  };
}

function alertHands(D) {
  // he leans on the putter: it plants, the hand comes in over it
  const g = K([[0, 0], [0.12, 0], [0.3, 1, 'backOut'], [0.6, 1], [0.8, 0, 'sineInOut']], D);
  return {
    name: 'alert', D,
    wl: (t) => [REST_WL[0] + 10 * g(t), REST_WL[1] + 6 * g(t)], tau: (t) => TAU0 - 6 * g(t), grip: () => 0,
    wr: () => REST_WR, psi: () => PSI0,
  };
}

// ── solving ──────────────────────────────────────────────────────────────

function to43(j) {
  const c = structuredClone(j);
  c.skeleton.spine = '4.3.13';
  c.constraints = (c.ik ?? []).map(({ order: _o, ...k }) => ({ type: 'ik', ...k }));
  delete c.ik;
  return c;
}

const fn = (D, f, loop = false) => ({ duration: D, loop, value: f });

const KIT_OWNED = new Set(['tgtL', 'tgtR', 'handL', 'handR', 'ball', 'beat']);

/** build_cast_mesh.py's body keys (linear, 30fps) as local motions */
function bodyFromKeys(anim, D, loop) {
  const out = [];
  for (const [bone, tl] of Object.entries(anim.bones ?? {})) {
    if (KIT_OWNED.has(bone)) continue; // a re-run: these are this script's own keys
    for (const [name, keys] of Object.entries(tl)) {
      const chans = name === 'rotate' ? [['rotate', 'value', 0]] : name === 'translate' ? [['x', 'x', 0], ['y', 'y', 0]] : name === 'scale' ? [['scaleX', 'x', 1], ['scaleY', 'y', 1]] : [];
      for (const [channel, field, def] of chans) {
        const pts = keys.map((k) => [k.time ?? 0, k[field] ?? def]);
        out.push({ bone, channel, motion: fn(D, (t) => {
          if (t <= pts[0][0]) return pts[0][1];
          for (let i = 1; i < pts.length; i++) if (t <= pts[i][0]) return lerp(pts[i - 1][1], pts[i][1], (t - pts[i - 1][0]) / (pts[i][0] - pts[i - 1][0] || 1));
          return pts[pts.length - 1][1];
        }, loop) });
      }
    }
  }
  return out;
}

const TOL = { rotate: 0.05, x: 0.1, y: 0.1, scaleX: 0.0005, scaleY: 0.0005 };
const TL = { rotate: 'rotate', x: 'translatex', y: 'translatey', scaleX: 'scalex', scaleY: 'scaley' };
const bakeTrack = (bone, channel, motion) => ({ bone, timeline: TL[channel], keys: bake(motion, { tolerance: TOL[channel], fps: 30, maxSegment: 0.2 }) });

// the costume pieces of the mesh, how far each may turn (build_cast_mesh.py's
// measured limits, with its 0.85 margin), and how each follows through
const APPS = {
  pompom: { lim: [-25, 22], phys: { inertia: 0.55, strength: 110, damping: 0.8, mass: 1 } },
  tail: { lim: [-15, 20], phys: { inertia: 0.5, strength: 90, damping: 0.85, mass: 1.2 } },
  towel: { lim: [-3.4, 5.1], phys: { inertia: 0.4, strength: 160, damping: 0.9, mass: 1 } },
};

const json43 = to43(raw);
const frames = setupFrames(json43);
const W0L = [frames.get('tgtL').worldX, frames.get('tgtL').worldY];
const W0R = [frames.get('tgtR').worldX, frames.get('tgtR').worldY];
const PHI0 = frames.get('handL').worldRotation;
const PSI0rt = frames.get('handR').worldRotation;
const BALL0 = [frames.get('ball').worldX, frames.get('ball').worldY];
const reachL = frames.get('armL').length + frames.get('foreL').length;
const reachR = frames.get('armR').length + frames.get('foreR').length;
const report = [];
const extra = {}; // per clip: slots / drawOrder for the 4.2 file

function buildClip(c, base) {
  const { name, D } = c;
  const loop = !!c.loop;
  const keep = !c.body;
  // body: written here (scratch clips) or taken from build_cast_mesh.py
  const bodyLocal = keep
    ? bodyFromKeys(base, D, loop)
    : Object.entries(c.body).flatMap(([bone, chs]) => Object.entries(chs).map(([channel, f]) => ({ bone, channel, motion: fn(D, f, loop) })));

  // the hands, in skeleton units
  const hands = (t) => {
    const wl = c.wl(t), tau = c.tau(t), g = c.grip(t);
    const club = clubHands(wl, tau);
    const wrFree = s(c.wr(t));
    const WR = [lerp(wrFree[0], club.WR[0], g), lerp(wrFree[1], club.WR[1], g)];
    const psi = lerp(c.psi(t), club.psi, g);
    return { WL: s(wl), phi: tau - 90, WR, psi, head: club.head };
  };
  const screenT = [
    { bone: 'tgtL', channel: 'x', motion: fn(D, (t) => hands(t).WL[0] - W0L[0], loop) },
    { bone: 'tgtL', channel: 'y', motion: fn(D, (t) => hands(t).WL[1] - W0L[1], loop) },
    { bone: 'tgtR', channel: 'x', motion: fn(D, (t) => hands(t).WR[0] - W0R[0], loop) },
    { bone: 'tgtR', channel: 'y', motion: fn(D, (t) => hands(t).WR[1] - W0R[1], loop) },
  ];
  const solvedT = solveScreen(json43, screenT, bodyLocal, D, loop, 240, true);
  // the wrists after the arms: their world angle depends on where IK put the
  // forearms, so they are solved with the solved targets applied
  const screenH = [
    { bone: 'handL', channel: 'rotate', motion: fn(D, (t) => hands(t).phi - PHI0, loop) },
    { bone: 'handR', channel: 'rotate', motion: fn(D, (t) => hands(t).psi - PSI0rt, loop) },
  ];
  const solvedH = solveScreen(json43, screenH, [...bodyLocal, ...solvedT], D, loop, 240, true);

  const tracks = [...solvedT, ...solvedH, ...(keep ? [] : bodyLocal)].map((l) => bakeTrack(l.bone, l.channel, l.motion));

  // the ball
  const slots = {};
  if (c.ball) {
    const tHit = c.ball.hit;
    const head = hands(tHit).head;
    // the putter's face is its left end: the ball sits against it
    const at = [head[0] - 57 - BALL0[0], 0];
    const tA = c.ball.appear;
    const pop = K([[0, 0], [tA, 0], [tA + 0.12, 1.12, 'backOut'], [tA + 0.2, 1, 'sineInOut']], D);
    let bx, by, bs, br, gone;
    if (c.ball.kind === 'drive') {
      // off the tee, up and away over the board, getting smaller
      const fly = 0.46;
      const u = (t) => Math.min(1, Math.max(0, (t - tHit) / fly));
      bx = (t) => at[0] - 980 * (1 - Math.pow(1 - u(t), 1.6));
      by = (t) => 820 * u(t) - 330 * u(t) * u(t);
      bs = (t) => (t < tHit ? pop(t) : 1 - 0.55 * u(t));
      br = (t) => 900 * u(t);
      gone = tHit + fly;
    } else {
      // rolling away along the ground, slowing, gone by the end
      const roll = D - tHit;
      const dist = c.ball.roll ?? 360;
      const u = (t) => Math.min(1, Math.max(0, (t - tHit) / roll));
      const ease = (v) => 1 - Math.pow(1 - v, 2.2);
      bx = (t) => at[0] - dist * ease(u(t));
      by = () => 0;
      bs = (t) => (t < tHit ? pop(t) : 1);
      br = (t) => (dist * ease(u(t)) / (Math.PI * 19)) * 180; // rolls without slipping
      gone = D;
      slots.ball = { rgba: [{ time: D - 0.22, color: 'ffffffff' }, { time: D - 0.02, color: 'ffffff00' }] };
    }
    tracks.push(
      bakeTrack('ball', 'x', fn(D, bx)), bakeTrack('ball', 'y', fn(D, by)),
      bakeTrack('ball', 'scaleX', fn(D, bs)), bakeTrack('ball', 'scaleY', fn(D, bs)), bakeTrack('ball', 'rotate', fn(D, br)),
    );
    slots.ball = { ...slots.ball, attachment: [{ time: 0, name: null }, { time: tA, name: 'part_ball' }, { time: Math.min(D, gone), name: null }] };
    report.push(`${name}: ball at ${(BALL0[0] + at[0]).toFixed(0)}, club head at impact (${head[0].toFixed(0)}, ${head[1].toFixed(0)})`);
  }


  // the costume follows through: simulate it with the runtime's physics on
  // the finished motion, bake it to keys, and keep it inside what the mesh
  // can bend
  writeAnimation(json43, name, tracks);
  if (c.physics) {
    const scratch = structuredClone(json43);
    upsertPhysics(scratch, Object.entries(APPS).map(([bone, a]) => ({ name: `phys-${bone}`, bone, rotate: 1, mix: 1, ...a.phys })));
    const data = parseSkeleton(scratch);
    const smp = sampleAnimation(data, name, { rate: 240, seconds: D, loop: false });
    for (const [bone, a] of Object.entries(APPS)) {
      const setup = data.findBone(bone).setupPose.rotation;
      let v = smp.bones.get(bone).localRot.map((r) => ((r - setup + 540) % 360) - 180);
      const hi = Math.max(...v), lo = Math.min(...v);
      const k = Math.min(1, hi > 0 ? a.lim[1] / hi : 1, lo < 0 ? a.lim[0] / lo : 1);
      v = v.map((x) => x * k);
      // ease the last 0.15s back to rest so the next clip starts clean
      const n = v.length - 1;
      v = v.map((x, i) => x * (1 - smooth((i / n - (1 - 0.15 / D)) / (0.15 / D))));
      tracks.push({ bone, timeline: 'rotate', keys: bake(sampled(v, D, false), { tolerance: 0.1, fps: 30, maxSegment: 0.2 }) });
      report.push(`${name}: ${bone} follow-through ${lo.toFixed(1)}..${hi.toFixed(1)} deg${k < 1 ? ` scaled x${k.toFixed(2)} to fit the mesh` : ''}`);
    }
    writeAnimation(json43, name, tracks);
  }

  // reach check, at the solved pose (the guard keeps both under 95-99%)
  extra[name] = { tracks, slots, keep };
}

// ── the clips, in the 4.2 file ───────────────────────────────────────────
const dur = (name) => {
  let d = 0;
  const a = raw.animations[name];
  for (const tl of Object.values(a.bones ?? {})) for (const keys of Object.values(tl)) for (const k of keys) d = Math.max(d, k.time ?? 0);
  for (const tl of Object.values(a.slots ?? {})) for (const keys of Object.values(tl)) for (const k of keys) d = Math.max(d, k.time ?? 0);
  return d;
};

const clips = [
  putt(), hardPutt(), measureClip(),
  idleHands(dur('idle')), nodHands(dur('nod')), laughHands(dur('chestbeat')), flinchHands(dur('flinch')), alertHands(dur('alert')),
];
for (const c of clips) buildClip(c, raw.animations[c.name]);

// the second track (Mascot.svelte plays 'flutter' on track 1, always): its
// sway of the costume would override every follow-through on track 0, so it
// moves only an empty bone now; the sway it used to give the idle is in the
// idle itself
{
  const D = 4.8;
  const idleApps = Object.keys(APPS).map((bone, i) => {
    const flip = raw.bones.find((b) => b.name === bone) ? { pompom: 1, towel: 1, tail: -1 }[bone] : 1;
    const amp = { pompom: 3, towel: 2.2, tail: 3 }[bone];
    return bakeTrack(bone, 'rotate', fn(D, (t) => {
      const u = (((t - 0.6 * i) % D) + D) % D;
      return flip * amp * Math.sin((2 * Math.PI * u) / 2.4) * hump(u, 0, 2.4);
    }, true));
  });
  extra.idle.tracks.push(...idleApps);
}

const out = structuredClone(raw);
for (const [name, x] of Object.entries(extra)) {
  const a = out.animations[name];
  if (!x.keep) a.bones = {};
  for (const tr of x.tracks) {
    a.bones[tr.bone] ??= {};
    // a kit timeline replaces whatever build_cast_mesh.py keyed on that bone
    // for the same property
    const old = a.bones[tr.bone];
    if (tr.timeline === 'rotate') delete old.rotate;
    if (tr.timeline.startsWith('translate')) delete old.translate;
    if (tr.timeline.startsWith('scale')) delete old.scale;
    old[tr.timeline] = tr.keys.map((k) => ({ ...(k.time ? { time: k.time } : {}), value: k.value, ...(k.curve ? { curve: k.curve } : {}) }));
  }
  if (!x.keep) a.slots = {};
  for (const [slot, tl] of Object.entries(x.slots)) a.slots[slot] = { ...(a.slots[slot] ?? {}), ...tl };
  const clip = clips.find((c) => c.name === name);
  if (clip?.faces) a.slots.figure = { attachment: clip.faces.map(([time, n]) => ({ time, name: n })) };
}
out.animations.flutter = { bones: { beat: { rotate: [{ value: 0 }, { time: 7.2, value: 0 }] } } };

fs.writeFileSync(path.join(OUT, 'monkey.json'), JSON.stringify(out));

// ── the kit's smoothness check, on the 4.3 copy of the same motion ───────
const final43 = to43(out);
const reports = checkSkeleton(final43, { loops: ['idle', 'flutter'], only: clips.map((c) => c.name) });
for (const r of reports) {
  const bad = r.issues.filter((i) => i.severity !== 'info');
  report.push(`${r.name}: score ${r.score}, ${bad.length ? bad.map((i) => `${i.severity} ${i.code}${i.bone ? ` ${i.bone}` : ''}${i.time !== undefined ? `@${i.time.toFixed(2)}` : ''}`).join('; ') : 'no warnings'}`);
}
console.log(`arm reach L ${reachL.toFixed(0)} R ${reachR.toFixed(0)}`);
console.log(report.join('\n'));
if (process.argv.includes('--report')) fs.writeFileSync(path.join(HERE, 'swing_check.md'), reportMarkdown('monkey.json (golfer)', reports));
