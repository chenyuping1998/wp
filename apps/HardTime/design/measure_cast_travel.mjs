/**
 * How far the figure actually travels at each tier's peak — in rig pixels and as
 * a fraction of the figure box.
 *
 * This exists because the browser harness cannot hold a preview pane composited
 * for the ~1.4s a reaction takes: rAF freezes while the pane is hidden and the
 * pending reel stops then resolve in one frame, so an on-screen capture of the
 * pose is not reliably obtainable there. The skinning is pure arithmetic, so it
 * can be done here instead — this file CALLS castMotion.ts composeBoneMatrices /
 * skinVertices, the functions skinnedFigure.update() renders with, and reports
 * the peak displacement of the vertices the eye actually tracks.
 *
 *   node design/measure_cast_travel.mjs
 *   node design/measure_cast_travel.mjs --compare   # against the old tables
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
const { TIERS, MOTION_SCALE, buildWeightIndex, composeBoneMatrices, skinVertices } = await import(
  join(HERE, "..", "src/game/castMotion.ts")
);

const rig = JSON.parse(
  readFileSync(join(HERE, "../static/assets/meshRigs/cast_guy/guy.rig.json"), "utf8"),
);

/** The tables this game shipped before 2026-09-17 — Capo Nostra's 2026-09-10
 *  raw-Spine tables, carried over with the reskin — kept here only so --compare
 *  has something to compare to. */
const OLD = {
  win: { rise: 0, stretch: 0, lean: 0, push: { bone: "chest", x: 0.003, y: 0.009 },
    bones: { hips: [0.27, 0], waist: [0.4, 10], chest: [0.5, 18], neck: [0.55, 30],
      head: [0.8, 42], arm_l: [0.36, 24], fore_l: [2.1, 60], arm_r: [-0.36, 22], fore_r: [-2.1, 54] } },
  winBig: { rise: 0, stretch: 0, lean: 0, push: { bone: "chest", x: 0.007, y: 0.022 },
    bones: { hips: [0.45, 0], waist: [0.6, 25], chest: [0.8, 45], neck: [0.9, 75],
      head: [1.3, 105], arm_l: [0.6, 60], fore_l: [3.4, 150], arm_r: [-0.6, 55], fore_r: [-3.4, 135] } },
  trigger: { rise: 0, stretch: 0, lean: 0, push: { bone: "chest", x: 0.012, y: 0.038 },
    tremor: { deg: 0.5, periodMs: 67, bones: ["fore_l", "fore_r"] },
    bones: { hips: [0.6, 0], waist: [0.95, 45], chest: [1.6, 85], neck: [1.7, 145],
      head: [2.5, 210], arm_l: [1.1, 95], fore_l: [6.7, 235], arm_r: [-0.9, 135], fore_r: [-4.5, 275] } },
};

/** Which bone owns each vertex — the ONLY safe way to name a body part here.
 *
 * The first version of this script picked body parts by POSITION ("the 12
 * leftmost vertices are the hand"). Every one of those turned out to be a
 * head or neck vertex sitting on the texture's left edge at x=0: the mesh is a
 * regular grid over the whole image, including transparent space, so a
 * vertex's coordinate says nothing about what it is part of. Every head/hand
 * figure that version printed was the head compared against itself. */
const BONE = rig.bones.map((b) => b.name);
const dominant = rig.verts.map((_, index) => {
  const w = rig.weights[index];
  let best = 0;
  w.forEach((value, j) => { if (value > w[best]) best = j; });
  return best;
});
const groupOf = (...names) =>
  new Set(dominant.map((d, i) => (names.includes(BONE[d]) ? i : -1)).filter((i) => i >= 0));

const scale = typeof MOTION_SCALE === "number" ? MOTION_SCALE : 1;
const [boxX0, boxY0, boxX1, boxY1] = rig.figure_box;
const figureWidth = boxX1 - boxX0;
const figureHeight = boxY1 - boxY0;

/** The skinning skinnedFigure.update() performs — by CALLING it, not by copying
 *  it. This used to be a hand-written copy of the matrix composition, and it
 *  drifted the day squash and stretch was added: it went on measuring a
 *  rotation-only figure that no longer shipped. */
const weightIndex = buildWeightIndex(rig);
const restPositions = new Float32Array(rig.verts.flat());
function pose(tier, reactionAge, durationMs, timeMs) {
  const matrices = rig.bones.map(() => new Float32Array(6));
  const chain = rig.bones.map(() => new Float32Array(6));
  const out = new Float32Array(restPositions.length);
  composeBoneMatrices(rig, { timeMs, tier, reactionAge, durationMs, speed: 1, motionScale: scale }, matrices, chain);
  skinVertices(restPositions, weightIndex, matrices, out);
  return rig.verts.map((_, i) => [out[i * 2], out[i * 2 + 1]]);
}

/** Peak displacement per vertex over the beat, against the same beat's own idle.
 *
 *  Two numbers per group. TOTAL is what the vertex does on screen. OWN is that
 *  minus the root's rigid lift at the same instant — the part the body is
 *  actually doing, as opposed to the whole figure rising. The lift moves every
 *  vertex by the same vector, feet included, so it cannot make a head look like
 *  it is lurching; only the OWN swing can. */
function travel(tier, durationMs) {
  const T0 = 1_000_000;                       // arbitrary but fixed idle phase
  const peak = { any: 0, hand: 0, head: 0, foot: 0, handOwn: 0, headOwn: 0 };
  const rest = pose(tier, null, durationMs, T0);
  const headSet = groupOf("head");
  const handSet = groupOf("fore_l", "fore_r");
  const botY = Math.max(...rest.map((v) => v[1]));
  const footSet = new Set(rest.map((v, i) => (v[1] > botY - figureHeight * 0.05 ? i : -1)).filter((i) => i >= 0));

  for (let step = 0; step <= 60; step += 1) {
    const age = (step / 60) * durationMs;
    const now = pose(tier, age, durationMs, T0 + age);
    const base = pose(tier, null, durationMs, T0 + age);   // idle-only at the same instant
    const e = reactionEnvelopeOf(tier, age, durationMs);
    const liftX = figureWidth * (tier.lean ?? 0) * scale * e;
    const liftY = -figureHeight * (tier.rise ?? 0) * scale * e;
    for (let i = 0; i < now.length; i += 1) {
      const dx = now[i][0] - base[i][0];
      const dy = now[i][1] - base[i][1];
      const d = Math.hypot(dx, dy);
      const own = Math.hypot(dx - liftX, dy - liftY);
      if (d > peak.any) peak.any = d;
      if (handSet.has(i)) { peak.hand = Math.max(peak.hand, d); peak.handOwn = Math.max(peak.handOwn, own); }
      if (headSet.has(i)) { peak.head = Math.max(peak.head, d); peak.headOwn = Math.max(peak.headOwn, own); }
      if (footSet.has(i) && d > peak.foot) peak.foot = d;
    }
  }
  return peak;
}

function reactionEnvelopeOf(tier, age, durationMs) {
  const u = age / durationMs;
  if (u <= 0 || u >= 1) return 0;
  if (u < tier.snap) { const t = u / tier.snap; return t * t * (3 - 2 * t); }
  if (u < tier.hold) return 1;
  const t = 1 - (u - tier.hold) / (1 - tier.hold);
  return t * t * (3 - 2 * t);
}

/** What the head is ALLOWED to swing, as a percentage of figure height —
 *  its OWN swing, after the root's rigid lift is taken out.
 *
 * SET 2026-09-17 with the port. The budget this replaces (win 2.6 / winBig 4.2 /
 * trigger 7.0 of TOTAL travel) came over from Capo Nostra, set when every tier's
 * root translation was forced to zero on the belief that the reference never
 * lifts the root. That belief came from the raw Spine teardown. The
 * transcription the motion is now copied from — the same reference ported onto
 * this mesh topology (rig/motion.py) — lifts the root 4.5% of the box, and a
 * rigid lift moves the feet as far as the head: it cannot read as the head
 * lurching. Measuring TOTAL travel against the old budget fails the reference.
 *
 * So the budget is on the OWN swing, measured with the transcription's tables on
 * the prisoner's rig (design/build_cast_guy_rig.py): win 2.57% / winBig 3.87% /
 * trigger 5.17%. The ceilings sit 15% above those, so a table that makes the head
 * do more than the verified port fails here — which is still what 「頭部位移太多」
 * means.
 *
 * `figure_box` is the LAYOUT box the rig keeps (see the rig builder), 801px tall;
 * the prisoner's own silhouette is 849. The percentages are of the layout box.
 *
 * head/hand is printed as information, not as a test. */
const HEAD_BUDGET_PCT = { win: 3.0, winBig: 4.5, trigger: 6.0 };
let failed = false;

const compare = process.argv.includes("--compare");
const OLD_DURATION = { win: 720, winBig: 940, trigger: 1250 };
const order = ["win", "winBig", "trigger"];
const pct = (v) => ((v / figureHeight) * 100).toFixed(2) + "%";

console.log(`figure box ${figureWidth.toFixed(0)} x ${figureHeight.toFixed(0)} rig px\n`);
console.log(`vertex groups: head ${groupOf("head").size}, hand (fore_l+fore_r) ${groupOf("fore_l", "fore_r").size}` +
  ` — the prisoner's hands hang beside his thighs, so their vertices share triangles with the trousers.\n`);
console.log("tier      root lift   hand own/total      head own/total      FEET     head own vs budget");
for (const name of order) {
  const tier = TIERS[name];
  const now = travel(tier, tier.durationMs);
  const headPct = (now.headOwn / figureHeight) * 100;
  const budget = HEAD_BUDGET_PCT[name];
  if (headPct > budget) failed = true;
  let line = `${name.padEnd(9)} ${(pct(figureHeight * (tier.rise ?? 0))).padStart(6)}    ` +
    `${now.handOwn.toFixed(1).padStart(5)} / ${now.hand.toFixed(1).padStart(5)}px   ` +
    `${now.headOwn.toFixed(1).padStart(5)} / ${now.head.toFixed(1).padStart(5)}px   ` +
    `${now.foot.toFixed(1).padStart(5)}px  ` +
    `${headPct.toFixed(2)}% / ${budget.toFixed(1)}%` +
    (headPct > budget ? "  <-- OVER BUDGET" : "  ok") +
    `   head/hand own ${(now.headOwn / now.handOwn).toFixed(2)}x`;
  if (compare) {
    const before = travel({ ...TIERS[name], ...OLD[name], scale: undefined, flutter: undefined, glow: 0 }, OLD_DURATION[name]);
    line += `      was hand own ${before.handOwn.toFixed(1)}px / head own ${before.headOwn.toFixed(1)}px`;
  }
  console.log(line);
}

if (failed) {
  console.log("\nFAIL: the head swings further than the transcription does — see the budget note before widening it");
  process.exit(1);
}
console.log("\nok: head swing inside the transcription's own");
