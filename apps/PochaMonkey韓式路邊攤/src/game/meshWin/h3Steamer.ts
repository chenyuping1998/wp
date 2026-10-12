/** H3 — corn dog springs up; silhouette motion tuned to this theme's new icon. */
import { leap, restPose, turnAbout, type MeshWinSpec, type Rig } from './meshRig';
const LEAP = { crouch: 120, rise: 365, fall: 795, land: 975, hop2: 1200, done: 1460 };
export const H3: MeshWinSpec = {
 symbol: 'H3', key: 'gbH3', sprite: 'gbH3', art: 'sushiSymbols/h3.png',
 feetY: 230, durationMs: LEAP.done, landMs: LEAP.land, hitMs: LEAP.rise,
 rig: { grid: { x0: 0, y0: 0, x1: 256, y1: 256, cols: 48, rows: 48 }, soft: 4,
  parts: [{ name: 'root', pivot: [128, 230], dist: () => 1 }] },
 limits: {},
 pose: (rig: Rig, t: number) => {
  const pose = restPose(rig);
  const { rigid, air } = leap(t, LEAP, 19);
  const phase = t < LEAP.rise ? t / LEAP.rise : t < LEAP.fall ? 1 : Math.max(0, 1 - (t - LEAP.fall) / 260);
  rigid.rot = -12 * Math.sin(Math.PI * Math.min(1, phase)) + 2 * Math.sin(t / 85) * phase;
  pose.rigid = turnAbout(rigid, [128, 128], 230);
  pose.air = air;
  return pose;
 },
};
