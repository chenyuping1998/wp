// The mascot motion library: written against the rig's measurements (arm reach, drawn arm angles, height), so the
// same moves fit any delivery drawn to the template. Arms are FK unless a move places the hand (the arm IK is keyed
// off for that animation): big gestures need it (with IK a hand raised past the shoulder folds the elbow in toward the
// head) and a resting arm should ride the shoulder; hands put on a spot below the shoulder (point, belly, shrug) use IK. Timing follows the kit's strike shape: anticipation → fast action → overshoot → hold → recover.
// The pelvis never rises above standing height and tilts at most ~2.5° (the planted legs are drawn nearly straight: more
// lifts a foot); leans are carried by the belly and chest, a little later each (follow-through).
import type { Measure } from './rig.ts';

type Pt = { time: number; value: number; ease?: string };
type S = 'L' | 'R';
const norm = (d: number) => ((((d % 360) + 540) % 360) - 180);
const r2 = (x: number) => Math.round(x * 100) / 100;

export const LABELS: Record<string, string> = {
  idle: '待機（呼吸＋尾巴）', wave: '揮手打招呼', point: '指向盤面', throw: '丟東西', cheer: '跳起歡呼', laugh: '捧腹大笑', disappoint: '失望攤手', dance: '跳舞（循環）',
};
/** Suggested game cue for each animation (README and report). */
export const CUES: Record<string, string> = {
  idle: '平常待機', wave: '進場、選單、閒置太久', point: '期待（差一個 Scatter）', throw: '收集、把東西丟進盤面', cheer: '大獎、觸發免費遊戲', laugh: '中獎', disappoint: '期待落空', dance: '大獎跑分時循環',
};

/** Tail: softer toward the tip; ears: stiff, a short flick. Baked into keys, so the game needs no runtime physics. */
function followPhysics(chain: string[]) {
  return chain.map((bone) => bone.startsWith('ear')
    ? { name: `ph-${bone}`, bone, rotate: 1, inertia: 0.3, strength: 260, damping: 0.75, mass: 1, mix: 1, bake: true }
    : { name: `ph-${bone}`, bone, rotate: 1, inertia: 0.3, strength: 170, damping: 0.85, mass: 1, mix: 0.8, bake: true });
}

/** Two presets the library needs on top of the kit's: a physics-only carrier, and the kit's jump with this physics. */
export function registerPresets(PRESETS: any[]) {
  if (!PRESETS.some((p) => p.id === 'mascot-follow')) {
    PRESETS.push({
      id: 'mascot-follow', title: 'follow-through only', kind: 'once', summary: '', roles: [], params: [],
      build: (c: any) => ({ duration: c.param('duration', 1), loop: c.param('loop', false), screen: [], local: [], events: [], physics: followPhysics(c.roleList('hair')) }),
    });
  }
  if (!PRESETS.some((p) => p.id === 'mascot-jump')) {
    const jump = PRESETS.find((p) => p.id === 'jump');
    PRESETS.push({ ...jump, id: 'mascot-jump', build(c: any) { const o = jump.build(c); o.physics = followPhysics(c.roleList('hair')); return o; } });
  }
}

export function mascotMotions(m: Measure, opts: { reels?: 'left' | 'right' } = {}) {
  const d = opts.reels === 'right' ? 1 : -1;          // x direction toward the reels
  const Y: S = d < 0 ? 'L' : 'R';                      // the arm on the reel side: points, throws
  const X: S = Y === 'L' ? 'R' : 'L';                  // the outer arm: waves
  const k = m.H / 1251;                                // amounts tuned on a 1251 px tall mascot
  const kr = (s: S) => m.side[s].reach / 401;
  const hand = (s: S) => `ik-hand-${s.toLowerCase()}`;
  const sg = (s: S) => (s === 'R' ? 1 : -1);
  /** Angles are authored for one side; the other side mirrors them across the vertical. */
  const mir = (authored: S, s: S, a: number) => (s === authored ? a : 180 - a);
  const fkUpper = (s: S, world: number) => r2(norm(world - m.side[s].upper));
  const fkFore = (s: S, upperWorld: number, foreWorld: number) => r2(norm(norm(foreWorld - upperWorld) - m.side[s].foreLocal));
  /** Positive = shoulder up, either side. */
  const clavUp = (s: S, a: number) => sg(s) * a;
  /** An IK hand target's offset from its setup position that puts it at `p` (Spine units). */
  const toward = (s: S, p: [number, number]): [number, number] => [r2(p[0] - m.side[s].target[0]), r2(p[1] - m.side[s].target[1])];

  const poses = (bone: string, channel: string, points: Pt[], space = 'screen') => ({ bone, channel, space, type: 'poses', points });
  const lposes = (bone: string, points: Pt[]) => poses(bone, 'rotate', points, 'local');
  const strike = (bone: string, channel: string, a: number, tA: number, v: number, tS: number, hold: number, tR: number, over = 0.05, easeA = 'sineOut', space = 'screen') => ({
    bone, channel, space, type: 'strike',
    anticipation: { value: r2(a), time: tA, ease: easeA }, action: { value: r2(v), time: tS, ease: 'quartIn' },
    overshoot: { amount: r2(Math.abs(v) * over), frequency: 5, damping: 0.5 }, hold, recover: { time: tR, ease: 'sineInOut' },
  });
  const lstrike = (bone: string, a: number, tA: number, v: number, tS: number, hold: number, tR: number, over = 0.05, easeA = 'sineOut') => strike(bone, 'rotate', a, tA, v, tS, hold, tR, over, easeA, 'local');
  const wave = (bone: string, channel: string, amplitude: number, period: number, peakAt: number, offset = 0, space = 'screen') => ({ bone, channel, space, type: 'wave', amplitude: r2(amplitude), period, peakAt, offset: r2(offset) });
  const follow = (duration: number, loop = false) => ({ preset: 'mascot-follow', params: { duration, loop } });
  const osc = (t0: number, n: number, step: number, lo: number, hi: number): Pt[] => Array.from({ length: n }, (_, i) => ({ time: r2(t0 + i * step), value: r2(i % 2 ? lo : hi), ease: 'sineInOut' }));
  const hold = (t: number[], v: number[], ease = ['sineOut', '', 'sineInOut']): Pt[] => [{ time: 0, value: 0 }, { time: t[0], value: v[0], ease: ease[0] }, { time: t[1], value: v[0] }, { time: t[2], value: v[1] ?? 0, ease: ease[2] }];
  /** Spine follow-through: belly and chest repeat the hip's lean a little later (local, additive). */
  const LAG = 2 / 30;
  const spineLag = (pts: Pt[]) => [
    lposes('belly', pts.map((p) => ({ ...p, time: Math.min(r2(p.time + LAG), pts[pts.length - 1].time), value: r2(p.value * 0.35) }))),
    lposes('chest', pts.map((p) => ({ ...p, time: Math.min(r2(p.time + 2 * LAG), pts[pts.length - 1].time), value: r2(p.value * 0.3) }))),
  ];

  // ---- wave (outer arm, FK): upper arm out to the side, forearm up, a wrist flick on every swing
  const wU = mir('R', X, -16), wF = mir('R', X, 86);
  const wFore = fkFore(X, wU, wF);
  const wave_ = { name: 'wave', ...follow(1.8), tracks: [
    lposes('clav' + X, [{ time: 0, value: 0 }, { time: 0.3, value: clavUp(X, 8), ease: 'backOut' }, { time: 1.3, value: clavUp(X, 8) }, { time: 1.8, value: 0, ease: 'sineInOut' }]),
    lposes('upperArm' + X, [{ time: 0, value: 0 }, { time: 0.3, value: fkUpper(X, wU), ease: 'backOut' }, { time: 1.3, value: fkUpper(X, wU) }, { time: 1.8, value: 0, ease: 'sineInOut' }]),
    lposes('foreArm' + X, [{ time: 0, value: 0 }, { time: 0.34, value: wFore, ease: 'backOut' }, ...osc(0.46, 6, 0.14, wFore - 20 * sg(X), wFore + 16 * sg(X)), { time: 1.3, value: wFore, ease: 'sineInOut' }, { time: 1.8, value: 0, ease: 'sineInOut' }]),
    lposes('hand' + X, [{ time: 0, value: 0 }, { time: 0.36, value: 0 }, ...osc(0.5, 6, 0.14, -9, 9), { time: 1.3, value: 0, ease: 'sineInOut' }]),
    poses('head', 'rotate', [{ time: 0, value: 0 }, { time: 0.34, value: -7 * sg(X), ease: 'backOut' }, { time: 1.3, value: -7 * sg(X) }, { time: 1.8, value: 0, ease: 'sineInOut' }]),
    poses('hip', 'rotate', hold([0.3, 1.3, 1.8], [-1.5 * sg(X)])),
    ...spineLag(hold([0.3, 1.3, 1.8], [-4.5 * sg(X)])),
  ] };

  // ---- point (reel-side arm, FK): pull the hand in to the chest, then shoot the arm out at shoulder height, the elbow
  // a touch down (with IK the elbow bent up and the point read as a flap)
  const pUa = mir('L', Y, -125), pFa = mir('L', Y, -40), pU = mir('L', Y, 176), pF = mir('L', Y, 186);
  const point = { name: 'point', ...follow(1.4), events: [{ name: 'point', time: 0.3 }], tracks: [
    lstrike('upperArm' + Y, fkUpper(Y, pUa), 0.2, fkUpper(Y, pU), 0.1, 0.6, 0.5, 0.06),
    lstrike('foreArm' + Y, fkFore(Y, pUa, pFa), 0.2, fkFore(Y, pU, pF), 0.1, 0.6, 0.5, 0.08),
    lstrike('hand' + Y, 0, 0.2, 8 * (Y === 'L' ? -1 : 1), 0.1, 0.6, 0.5, 0.2),
    strike('hip', 'rotate', d, 0.2, -2 * d, 0.1, 0.6, 0.5, 0.2), strike('hip', 'x', -6 * d * k, 0.2, 12 * d * k, 0.1, 0.6, 0.5, 0.2),
    lstrike('belly', 1.5 * d, 0.22, -3.5 * d, 0.1, 0.58, 0.5, 0.3), lstrike('chest', 1.5 * d, 0.24, -3.5 * d, 0.1, 0.56, 0.5, 0.35),
    lstrike('clav' + Y, clavUp(Y, -2), 0.2, clavUp(Y, 6), 0.1, 0.6, 0.5, 0.2),
    strike('head', 'rotate', 2 * d, 0.24, -7 * d, 0.1, 0.56, 0.5, 0.3),
  ] };

  // ---- throw (reel-side arm, FK): wind up with the hand behind the head, whip out toward the reels
  const hs = Y === 'L' ? 1 : -1;
  const tUw = mir('L', Y, 172), tFw = mir('L', Y, 73), tUr = mir('L', Y, -164), tFr = mir('L', Y, -155);
  const throw_ = { name: 'throw', ...follow(1.3), events: [{ name: 'release', time: 0.42 }], tracks: [
    lstrike('clav' + Y, clavUp(Y, 8), 0.32, clavUp(Y, -4), 0.1, 0.25, 0.6, 0.1, 'cubicOut'),
    lstrike('upperArm' + Y, fkUpper(Y, tUw), 0.32, fkUpper(Y, tUr), 0.1, 0.25, 0.6, 0.08, 'cubicOut'),
    lstrike('foreArm' + Y, fkFore(Y, tUw, tFw), 0.34, fkFore(Y, tUr, tFr), 0.08, 0.25, 0.6, 0.15, 'cubicOut'),
    lstrike('hand' + Y, -25 * hs, 0.34, 18 * hs, 0.08, 0.25, 0.6, 0.2, 'cubicOut'),
    strike('hip', 'rotate', 2.5 * d, 0.32, -2.5 * d, 0.1, 0.25, 0.6, 0.25), strike('hip', 'x', 14 * d * k, 0.32, -16 * d * k, 0.1, 0.25, 0.6, 0.2),
    lstrike('belly', 3.5 * d, 0.34, -4.5 * d, 0.1, 0.23, 0.6, 0.3), lstrike('chest', 3.5 * d, 0.36, -4.5 * d, 0.1, 0.21, 0.6, 0.35),
    strike('head', 'rotate', 5 * d, 0.36, -8 * d, 0.11, 0.2, 0.6, 0.3),
    // the other arm answers the throw: in with the wind-up, out on the release
    lstrike('upperArm' + X, -8 * sg(X), 0.32, 10 * sg(X), 0.1, 0.25, 0.6, 0.1), lstrike('foreArm' + X, -15 * sg(X), 0.34, 5 * sg(X), 0.1, 0.23, 0.6, 0.15),
  ] };

  // ---- cheer (both arms FK on the kit's jump): arms swing out and up into a V on take-off, the far one 2 frames later
  const cU = (s: S) => fkUpper(s, mir('R', s, 52));
  const cheer = { name: 'cheer', preset: 'mascot-jump', params: { height: 70, crouch: 25 }, tracks: [
    lstrike('clavR', clavUp('R', -4), 0.18, clavUp('R', 14), 0.12, 0.4, 0.5, 0.1), lstrike('clavL', clavUp('L', -4), 0.18, clavUp('L', 14), 0.12, 0.4, 0.5, 0.1),
    lstrike('upperArmR', -12, 0.18, cU('R'), 0.12, 0.4, 0.5, 0.06), lstrike('foreArmR', 8, 0.2, -6, 0.12, 0.38, 0.5, 0.3),
    lstrike('upperArmL', 12, 0.2, cU('L'), 0.12, 0.38, 0.5, 0.06), lstrike('foreArmL', -8, 0.22, 6, 0.12, 0.36, 0.5, 0.3),
  ] };

  // ---- laugh (IK): hands to the belly, the body bobs with each laugh
  const belly = (s: S): [number, number] => [m.hip[0] + sg(s) * 0.73 * m.shoulderHalf, m.belly[1]];
  const lh = (s: S) => toward(s, belly(s));
  const laugh = { name: 'laugh', ...follow(1.6), tracks: [
    ...(['L', 'R'] as S[]).flatMap((s) => [
      poses(hand(s), 'x', [{ time: 0, value: 0 }, { time: 0.22, value: lh(s)[0], ease: 'cubicOut' }, { time: 1.25, value: lh(s)[0] }, { time: 1.6, value: 0, ease: 'sineInOut' }]),
      poses(hand(s), 'y', [{ time: 0, value: 0 }, { time: 0.22, value: lh(s)[1], ease: 'cubicOut' }, { time: 1.25, value: lh(s)[1] }, { time: 1.6, value: 0, ease: 'sineInOut' }]),
    ]),
    poses('hip', 'y', [{ time: 0, value: 0 }, { time: 0.2, value: r2(-24 * k), ease: 'sineOut' }, ...osc(0.32, 7, 0.12, -24 * k, -8 * k), { time: 1.25, value: r2(-18 * k), ease: 'sineInOut' }, { time: 1.6, value: 0, ease: 'sineInOut' }]),
    lposes('chest', [{ time: 0, value: 0 }, { time: 0.24, value: 0 }, ...osc(0.36, 7, 0.12, -2, 2), { time: 1.29, value: 0, ease: 'sineInOut' }]),
    poses('head', 'rotate', [{ time: 0, value: 0 }, { time: 0.2, value: 3, ease: 'sineOut' }, ...osc(0.34, 7, 0.12, -3, 4), { time: 1.27, value: 0, ease: 'sineInOut' }]),
  ] };

  // ---- disappoint (FK): shrug, elbows down and forearms out palms up, then droop
  const shrugU = (s: S) => mir('R', s, -52), shrugF = (s: S) => mir('R', s, 6), droopU = (s: S) => mir('R', s, -76), droopF = (s: S) => mir('R', s, -100);
  const disappoint = { name: 'disappoint', ...follow(1.7), tracks: [
    ...(['L', 'R'] as S[]).flatMap((s) => [
      lposes('clav' + s, [{ time: 0, value: 0 }, { time: 0.3, value: clavUp(s, 10), ease: 'backOut' }, { time: 0.8, value: clavUp(s, 10) }, { time: 1.15, value: clavUp(s, -6), ease: 'sineInOut' }, { time: 1.7, value: 0, ease: 'sineInOut' }]),
      lposes('upperArm' + s, [{ time: 0, value: 0 }, { time: 0.3, value: fkUpper(s, shrugU(s)), ease: 'backOut' }, { time: 0.8, value: fkUpper(s, shrugU(s)) }, { time: 1.1, value: fkUpper(s, droopU(s)), ease: 'sineInOut' }, { time: 1.7, value: 0, ease: 'sineInOut' }]),
      lposes('foreArm' + s, [{ time: 0, value: 0 }, { time: 0.33, value: fkFore(s, shrugU(s), shrugF(s)), ease: 'backOut' }, { time: 0.83, value: fkFore(s, shrugU(s), shrugF(s)) }, { time: 1.13, value: fkFore(s, droopU(s), droopF(s)), ease: 'sineInOut' }, { time: 1.7, value: 0, ease: 'sineInOut' }]),
    ]),
    poses('head', 'rotate', [{ time: 0, value: 0 }, { time: 0.32, value: 8, ease: 'backOut' }, { time: 0.8, value: 8 }, { time: 1.15, value: -5, ease: 'sineInOut' }, { time: 1.7, value: 0, ease: 'sineInOut' }]),
    poses('hip', 'y', [{ time: 0, value: 0 }, { time: 0.3, value: r2(-4 * k), ease: 'sineOut' }, { time: 0.8, value: r2(-4 * k) }, { time: 1.15, value: r2(-30 * k), ease: 'sineInOut' }, { time: 1.7, value: 0, ease: 'sineInOut' }]),
    lposes('chest', [{ time: 0, value: 0 }, { time: 0.34, value: 0 }, { time: 0.84, value: 0 }, { time: 1.2, value: -4, ease: 'sineInOut' }, { time: 1.7, value: 0, ease: 'sineInOut' }]),
  ] };

  // ---- dance (loop, FK arms): hip sway on the bar, bounce on every beat, the arms swinging up and down in turn
  const dU = (s: S) => fkUpper(s, mir('R', s, -22)), dF = (s: S) => fkFore(s, mir('R', s, -22), mir('R', s, 26));
  const dance = { name: 'dance', ...follow(1.6, true), tracks: [
    wave('hip', 'x', 18 * k, 1.6, 0.4), wave('hip', 'y', 10 * k, 0.4, 0.1, -12 * k), wave('hip', 'rotate', 1.5, 1.6, 0.4),
    wave('belly', 'rotate', 3, 1.6, 0.47, 0, 'local'), wave('chest', 'rotate', 3.5, 1.6, 0.53, 0, 'local'),
    wave('head', 'rotate', 6, 1.6, 0.6),
    ...(['L', 'R'] as S[]).flatMap((s) => [
      wave('upperArm' + s, 'rotate', 48 * sg(s), 0.8, s === 'R' ? 0.2 : 0.6, dU(s), 'local'),
      wave('foreArm' + s, 'rotate', 16 * sg(s), 0.8, s === 'R' ? 0.27 : 0.67, dF(s), 'local'),
      wave('clav' + s, 'rotate', 5 * sg(s), 0.8, s === 'R' ? 0.2 : 0.6, 0, 'local'),
    ]),
  ] };

  // ---- idle (loop): breathing, a slow tail sway, ears, hands drifting with the breath
  const idle = { name: 'idle', preset: 'breathe', params: { period: 3.2, intensity: 1.3 }, tracks: [
    ...m.tail.map((b, i) => wave(b, 'rotate', 2 + i * 0.9, 3.2, r2(0.4 + i * 0.12), 0, 'local')),
    ...(m.ears ? [wave('earL', 'rotate', 1.5, 3.2, 1.6, 0, 'local'), wave('earR', 'rotate', 1.5, 3.2, 1.7, 0, 'local')] : []),
    wave('foreArmR', 'rotate', 1.5, 3.2, 1.45, 0, 'local'), wave('foreArmL', 'rotate', -1.5, 3.2, 1.5, 0, 'local'),
  ] };

  const anims = [idle, wave_, point, throw_, cheer, laugh, disappoint, dance];
  // An arm is IK only in the moves that place its hand (tracks on its target); everywhere else it is FK and simply rides
  // the shoulder: an IK hand left at its rest spot gets pulled straight when the chest leans away from it.
  const fk: Record<string, string[]> = Object.fromEntries(anims.map((a: any) => [a.name, (['L', 'R'] as S[]).filter((s) => !a.tracks.some((t: any) => t.bone === hand(s))).map((s) => `arm-${s.toLowerCase()}`)]));
  const roles = {
    root: 'root', hip: 'hip', body: 'hip', chest: 'chest', head: 'head',
    fist: hand(Y), fists: [hand('R'), hand('L')], feet: ['ik-foot-l', 'ik-foot-r'], shoulders: ['clavL', 'clavR'],
    hair: [...m.tail, ...(m.ears ? ['earL', 'earR'] : [])],
  };
  return { anims, fk, roles, labels: LABELS };
}
