/** H1 — saxophone sways on the beat. The full new silhouette moves as one clean cutout. */
import { leap, restPose, turnAbout, type MeshWinSpec, type Rig } from './meshRig';
const LEAP = { crouch: 120, rise: 380, fall: 800, land: 980, hop2: 1210, done: 1480 };
export const H1: MeshWinSpec = {
 symbol: 'H1', key: 'gbH1', sprite: 'gbH1', art: 'sushiSymbols/h1.png',
 feetY: 230, durationMs: LEAP.done, landMs: LEAP.land, hitMs: LEAP.rise,
 rig: { grid: { x0: 0, y0: 0, x1: 256, y1: 256, cols: 48, rows: 48 }, soft: 4,
  parts: [{ name: 'root', pivot: [128, 230], dist: () => 1 }] },
 limits: {},
 pose: (rig: Rig, t: number) => {
  const pose = restPose(rig);
  const { rigid, air } = leap(t, LEAP, 22);
  const phase = t < LEAP.rise ? t / LEAP.rise : t < LEAP.fall ? 1 : Math.max(0, 1 - (t - LEAP.fall) / 250);
  rigid.rot = 17 * Math.sin(Math.PI * Math.min(1, phase)) + 3 * Math.sin(t / 90) * phase;
  pose.rigid = turnAbout(rigid, [128, 128], 230);
  pose.air = air;
  return pose;
 },
};
