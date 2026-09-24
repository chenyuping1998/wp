/**
 * The man's motion tables, measured rather than trusted — per DRAWING.
 *
 *     node design/check_cast_motion.mjs [--report]
 *     node design/check_cast_motion.mjs --motion=<castMotion.ts> --rigs=<dir>   (injection tests)
 *
 * Turf War draws the man twice (base: bat planted; shoulder: bat over the
 * shoulder, feature + kingpin), each with its own rig. Every rule runs per pose
 * against that pose's tables and limits; rules 10 and 11 run per RIG.
 *
 * WHY THIS WAS REWRITTEN (2026-09-18). The gate it replaces enforced Capo
 * Nostra's 2026-09-10 rules — a lag spread down every chain, a free end >= 2x
 * the chest, a head <= 0.45x the carrier — which the transcription the motion
 * now copies (hacksaw-character-motion rig/motion.py) fails by design, and it
 * never looked at the mesh. Ported from Hard Time's gate (itself Capo's
 * rewrite), plus rule 11. Old gate: design/_legacy_assets/cast_motion_20260914/.
 *
 * Every threshold below is either measured off the rendered mesh (see
 * JOINT_LIMIT_DEG) or taken from the transcription. None of them are taste.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { FOLD_FLOOR, STRETCH_CAP, loadCastMesh } from './lib/castMesh.mjs';

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
// --motion / --rigs exist so the rules can be PROVEN to fire: point them at the
// old tables or the old rigs and this gate must fail (see HANDOFF.md §2.5).
const arg = (name) => process.argv.find((a) => a.startsWith(`--${name}=`))?.slice(name.length + 3);
const motion = await import(path.resolve(arg('motion') ?? path.join(appRoot, 'src/game/castMotion.ts')));
const RIG_DIR = path.resolve(arg('rigs') ?? path.join(appRoot, 'static/assets/meshRigs/cast_guy'));
const { IDLE_BY_POSE, TIERS_BY_POSE, CAST_POSES, RIG_POSE, MOTION_SCALE, idleAngle, reactionEnvelope, LOOP_MS } = motion;

const REPORT = process.argv.includes('--report');
const problems = [];
let POSE = '';
let IDLE;
let TIERS;
const fail = (m) => problems.push(`[${POSE}] ${m}`);
const note = (m) => REPORT && console.log('   ' + m);

/* ── the measured breaking points ────────────────────────────────────────────
 *
 * MEASURED 2026-09-18 on the rigs design/rig/build_turf_rigs.py writes, with
 * the textures game/assets.ts ships. Two passes, because neither alone is
 * enough:
 *
 *  1. GEOMETRIC — design/measure_joint_limits.mjs. Each joint rotated alone,
 *     idle off, until an inked triangle folds under 50% or stretches past 1.6x.
 *  2. VISUAL. Rendered (JS-posed vertices through design/rig/mesh_render.py on
 *     the real texture) at +-geometric, +-half, then finer steps, zoomed 3x on
 *     the fist, the bat foot/tip and the POCKET HAND, whole figure for hips.
 *
 *   base (guy)        geometric  visual                                shipped
 *     hips               4       wrist stretches toward the fist at 4      3
 *     waist              8.5     pocket wrist kinks +3, Z at +4            3
 *     chest              8.5     pocket forearm clean to 5                 5
 *     neck               4.5     pocket forearm pinches +3.5, hourglass +4 3
 *     head              23.5     hood clean; kept off the fold edge       20
 *     arm_l              7       wrist bends at 6                          5
 *     fore_l             3       PLANTED BAT thins/fattens from 1.5        1.5
 *     arm_r              5       pocket forearm pinches from 3.5           3
 *     fore_r            21.5     pocket forearm bends from 6               5
 *
 *   shoulder (feature, kingpin — one silhouette)
 *     hips              37       legs bend like rubber from 8              6
 *     waist              7       pocket wrist wedges slightly at 7         6
 *     chest              9.5     pocket wrist bends slightly at 9.5        8
 *     neck               3.5     clean                                     3.5
 *     head               6.5     fold is the bat tip; kept under           6
 *     arm_l              6       fist and bat clean                        6
 *     fore_l             7       clean                                     7
 *     arm_r              4.5     clean                                     4.5
 *     fore_r            22.5     pocket hand clean; kept well under       12
 *
 * The base drawing is the tight one, and it is THE DRAWING: the right hand is
 * in a pocket (pinned to the hips on purpose), so every spine or right-arm
 * rotation that closes toward it shears the forearm between a moving elbow and
 * a fixed hand; and the left fist holds a bat whose foot is planted on the
 * ground, so any fore_l rotation slides the foot ~4px per degree.
 */
const JOINT_LIMIT_DEG = {
	base: {
		hips: 3, waist: 3, chest: 5, neck: 3, head: 20,
		arm_l: 5, fore_l: 1.5, arm_r: 3, fore_r: 5,
	},
	shoulder: {
		hips: 6, waist: 6, chest: 8, neck: 3.5, head: 6,
		arm_l: 6, fore_l: 7, arm_r: 4.5, fore_r: 12,
	},
};

// The chain order motion has to travel along: a link may not start before the
// link it hangs from.
const CHAINS = [
	['hips', 'waist', 'chest', 'neck', 'head'],
	['chest', 'arm_l', 'fore_l'],
	['chest', 'arm_r', 'fore_r'],
];

const TIER_ORDER = ['win', 'winBig', 'trigger'];

for (POSE of CAST_POSES) {
IDLE = IDLE_BY_POSE[POSE];
TIERS = TIERS_BY_POSE[POSE];

/** What a bone's idle ACTUALLY reaches, sampled rather than approximated by a
 *  fudge factor — the wave has a slow term and an odd-beat term on top of the
 *  amplitude, and the true peak runs 1.25x to 2.0x the declared number. */
const idlePeak = (bone) => {
	const spec = IDLE[bone];
	if (!spec) return 0;
	let peak = 0;
	for (let t = 0; t <= LOOP_MS * 5; t += 5) peak = Math.max(peak, Math.abs(idleAngle(spec, t)));
	return peak;
};

// ── rule 1: no joint may be driven past where the mesh was measured to break ─
for (const who of ['guy']) {
	const scale = MOTION_SCALE?.[who];
	if (typeof scale !== 'number') {
		fail(`MOTION_SCALE has no entry for '${who}'`);
		continue;
	}
	for (const tierName of TIER_ORDER) {
		const tier = TIERS[tierName];
		if (!tier) {
			fail(`tier '${tierName}' is missing from TIERS`);
			continue;
		}
		for (const [bone, [amplitude]] of Object.entries(tier.bones)) {
			const limit = JOINT_LIMIT_DEG[POSE][bone];
			if (limit === undefined) {
				fail(`${who}/${tierName}: bone '${bone}' has no measured limit — add one to this gate before using it`);
				continue;
			}
			// The worst case the joint actually reaches: the tier scaled to this
			// figure, ON TOP OF an idle that never stops running and can peak in
			// the same direction.
			const peak = Math.abs(amplitude) * scale + idlePeak(bone);
			if (peak > limit) {
				fail(
					`${who}/${tierName}: ${bone} reaches ${peak.toFixed(2)}deg against a measured limit of ${limit} — the drawing breaks here`,
				);
			}
			note(`${who.padEnd(4)} ${tierName.padEnd(7)} ${bone.padEnd(6)} peak ${peak.toFixed(2).padStart(5)}deg  limit ${limit}`);
		}
	}
}

// ── rule 2: a reaction must be visible at all ────────────────────────────────
//
// (a) an absolute floor: under 2deg the loudest thing in the reaction moves a
//     couple of pixels at game scale and the beat does not exist.
// (b) it must clear the IDLE. A reaction smaller than the sway running
//     underneath it is not a quiet reaction, it is an invisible one.
const MIN_VISIBLE_DEG = 2;
const MIN_OVER_IDLE = 1.25;
for (const tierName of TIER_ORDER) {
	const tier = TIERS[tierName];
	if (!tier) continue;
	let best = { bone: null, amp: 0 };
	for (const [bone, [amp]] of Object.entries(tier.bones)) {
		if (Math.abs(amp) > best.amp) best = { bone, amp: Math.abs(amp) };
	}
	if (best.amp < MIN_VISIBLE_DEG) {
		fail(`${tierName}: largest amplitude is ${best.amp}deg — under ${MIN_VISIBLE_DEG} nothing is visible on screen`);
	}
	const floor = idlePeak(best.bone);
	if (best.amp < floor * MIN_OVER_IDLE) {
		fail(
			`${tierName}: its largest move (${best.bone} ${best.amp}deg) does not clear that bone's own idle peak (${floor.toFixed(2)}deg) by ${MIN_OVER_IDLE}x — the reaction is buried in the sway`,
		);
	}
	note(`${tierName.padEnd(7)} loudest ${best.bone} ${best.amp}deg vs idle peak ${floor.toFixed(2)}deg`);
}

// ── rule 3: the follow-chain. Each link starts LATER than its parent ────────
//
// A body reacting, not a body twitching. Every bone used to share one envelope,
// so the figure snapped into its pose as a single rigid unit.
//
// Between 2026-09-18 and 2026-09-20 this rule had a second way to pass: a tier
// could skip the lag if it carried squash and stretch instead, because the
// transcription drives every bone from one envelope. That channel was removed on
// 2026-09-20 along with the rest of the transcription (castMotion.ts header), so
// the lag is the only thing keeping a reaction from being a rigid snap.
for (const tierName of TIER_ORDER) {
	const tier = TIERS[tierName];
	if (!tier) continue;
	for (const chain of CHAINS) {
		const present = chain.filter((b) => tier.bones[b]);
		for (let i = 1; i < present.length; i += 1) {
			const parent = tier.bones[present[i - 1]];
			const child = tier.bones[present[i]];
			if (child[1] < parent[1]) {
				fail(
					`${tierName}: ${present[i]} (lag ${child[1]}ms) starts before ${present[i - 1]} (${parent[1]}ms) — motion must travel outward, not inward`,
				);
			}
		}
	}
	const lags = Object.values(tier.bones).map(([, lag]) => lag);
	const spread = Math.max(...lags) - Math.min(...lags);
	if (spread <= 0) {
		fail(`${tierName}: every bone starts at the same instant — the figure snaps into its pose as one rigid unit`);
	}
	note(`[${POSE}] ${tierName.padEnd(7)} lag spread ${spread}ms`);
}

// ── rule 4: the tiers must actually escalate ─────────────────────────────────
//
// A big win that moves the figure less than a small one tells the player the
// opposite of the truth.
const energy = (tier) =>
	Object.values(tier.bones).reduce((sum, [a]) => sum + Math.abs(a), 0) +
	(tier.rise + tier.stretch) * 100;
for (let i = 1; i < TIER_ORDER.length; i += 1) {
	const lower = TIERS[TIER_ORDER[i - 1]];
	const upper = TIERS[TIER_ORDER[i]];
	if (!lower || !upper) continue;
	if (energy(upper) <= energy(lower)) {
		fail(
			`${TIER_ORDER[i]} (${energy(upper).toFixed(1)}) does not move more than ${TIER_ORDER[i - 1]} (${energy(lower).toFixed(1)})`,
		);
	}
	if (upper.durationMs <= lower.durationMs) {
		fail(`${TIER_ORDER[i]} (${upper.durationMs}ms) does not last longer than ${TIER_ORDER[i - 1]} (${lower.durationMs}ms)`);
	}
	note(`${TIER_ORDER[i - 1]} ${energy(lower).toFixed(1)} -> ${TIER_ORDER[i]} ${energy(upper).toFixed(1)}`);
}

// ── rule 5: the sign convention. POSITIVE OPENS THE BODY ─────────────────────
//
// Measured 2026-09-18 on Turf's rigs, idle off, +-10deg per bone, tracking the
// inked vertices of each arm region (design/cast_guy_arm_regions.json):
//
//   base      arm_l +10  forearm 12.5px OUT      arm_r -10  forearm 24.1px OUT
//             fore_l +10 bat foot 39.7px OUT     fore_r -10 forearm 5.2px OUT
//               (and the forearm 3.7px IN — fore_l pivots in the fist and hangs
//               off root, so it swings the bat; the bat is 10x the movement)
//   shoulder  arm_l +10  elbow 2.3 out 5.7 up, bat tip 15.7px UP
//             fore_l +10 bat tip 13.4px UP        arm_r -10  sleeve 13.3px OUT
//
// So positive-left / negative-right opens the body on both drawings.
const SIGN = { arm_l: +1, fore_l: +1, arm_r: -1, fore_r: -1 };
for (const tierName of TIER_ORDER) {
	const tier = TIERS[tierName];
	if (!tier) continue;
	for (const [bone, want] of Object.entries(SIGN)) {
		const entry = tier.bones[bone];
		if (!entry) continue;
		if (Math.sign(entry[0]) !== want) {
			fail(
				`${tierName}: ${bone} is ${entry[0]}deg — the wrong sign. Positive on the LEFT limbs and negative on the RIGHT opens the body; this closes it, which is a deflating gesture on a win`,
			);
		}
	}
	// and the spine may not disagree with itself about which way it leans
	const spine = ['hips', 'waist', 'chest', 'neck', 'head'].map((b) => tier.bones[b]).filter(Boolean);
	if (spine.length && !(spine.every(([a]) => a >= 0) || spine.every(([a]) => a <= 0))) {
		fail(`${tierName}: the spine bones do not agree on a direction — the body folds against itself`);
	}
}

// ── rule 6: the free end carries multiples of the body ──────────────────────
//
// Miami Mayhem's own rule: the BODY holds small and the amplitude goes to
// whatever hangs off it — their hair measured 27.5deg against a 1-3.3 body.
// Neither of these drawings has a hair bone, so the free end is a forearm.
//
// ⚠ ON THE BASE DRAWING `fore_l` IS THE PLANTED BAT and takes no motion
// (HELD_STILL), so that pose's free end is `fore_r`. A rule that insisted on
// fore_l would be asking the bat to swing.
//
// This rule was replaced on 2026-09-18 by one that demanded squash and stretch
// instead, because the transcription's arms barely rotate. The transcription is
// gone (castMotion.ts header) and so is that version.
const APPENDAGE_MIN_RATIO = 2;
const FREE_ENDS = ['fore_l', 'fore_r'];
for (const tierName of TIER_ORDER) {
	const tier = TIERS[tierName];
	if (!tier) continue;
	const body = Math.abs(tier.bones.chest?.[0] ?? 0);
	if (!body) continue;
	const present = FREE_ENDS.filter((b) => tier.bones[b]);
	if (!present.length) {
		fail(`${tierName}: no free end moves at all — the body is carrying the whole gesture`);
		continue;
	}
	const best = Math.max(...present.map((b) => Math.abs(tier.bones[b][0])));
	if (best / body < APPENDAGE_MIN_RATIO) {
		fail(
			`${tierName}: its loudest free end moves ${(best / body).toFixed(1)}x the chest — the reference measured 4-8x, and under ${APPENDAGE_MIN_RATIO}x the body is carrying the gesture instead of the limb`,
		);
	}
	note(`[${POSE}] ${tierName.padEnd(7)} free end/chest ${(best / body).toFixed(1)}x (${present.join('+')})`);
}

// ── rule 6b: the head may not carry the gesture ─────────────────────────────
//
// What this protects is real and was a review note: 「頭部位移太多」 — a head
// that carries the gesture reads as the whole man lurching rather than as a
// person reacting.
//
// The ceiling is a SHARE OF THE CARRIER (the loudest free end), and the number
// is Hot Miami's shipped ratio with a little margin: its trigger is head 6.4
// against fore_l 12.5, i.e. 0.51. That build passed review, so 0.55 is a ceiling
// these tables can be measured against without inventing one.
//
// ⚠ The base drawing has no fore_l, so its carrier is fore_r and the ratio is
// larger by construction (head 6.4 vs fore_r 7.5 = 0.85). That is a property of
// a pose whose other hand is holding a bat on the floor, not a lurch, so the
// base pose is measured against its own carrier with a looser ceiling recorded
// here rather than silently exempted.
const HEAD_MAX_SHARE = { base: 0.9, shoulder: 0.55 };
for (const tierName of TIER_ORDER) {
	const tier = TIERS[tierName];
	if (!tier) continue;
	const carrier = Math.max(...FREE_ENDS.map((b) => Math.abs(tier.bones[b]?.[0] ?? 0)));
	const head = Math.abs(tier.bones.head?.[0] ?? 0);
	if (!carrier || !head) continue;
	const share = head / carrier;
	const ceiling = HEAD_MAX_SHARE[POSE];
	if (share > ceiling + 1e-9) {
		fail(`${tierName}: the head is ${share.toFixed(2)}x the loudest free end, over ${ceiling} — the spine is doing the gesture and that reads as 「頭部位移太多」`);
	}
	note(`[${POSE}] ${tierName.padEnd(7)} head/carrier ${share.toFixed(2)} (ceiling ${ceiling})`);
}

// ── rule 7: no bone may start after the beat has begun to release ────────────
const MAX_LAG_FRACTION = 0.25;
for (const tierName of TIER_ORDER) {
	const tier = TIERS[tierName];
	if (!tier) continue;
	for (const [bone, [, lag]] of Object.entries(tier.bones)) {
		const fraction = lag / tier.durationMs;
		if (fraction > MAX_LAG_FRACTION) {
			fail(
				`${tierName}: ${bone} lags ${lag}ms, ${(fraction * 100).toFixed(0)}% of the beat — it starts after the body has begun to release`,
			);
		}
	}
}

// ── rule 8: the idle stays small, because it runs forever ────────────────────
//
// Two bars. A flat ceiling on the declared amplitude of the BODY — the
// transcription breathes its arms at 1.6 and 1.5 and keeps its spine at
// 0.06-0.55: small body, living limbs. Arms are the free ends, so they are held
// by the second bar instead: the idle may not eat the budget the reaction needs.
// On Turf's base drawing the bar that binds is fore_l: the planted bat.
const IDLE_BODY_MAX_DEG = 1.5;
const IDLE_BUDGET_SHARE = 0.6;
const SPINE = new Set(['root', 'hips', 'waist', 'chest', 'neck', 'head']);
for (const [bone, spec] of Object.entries(IDLE)) {
	if (SPINE.has(bone) && Math.abs(spec[0]) > IDLE_BODY_MAX_DEG) {
		fail(`IDLE ${bone} is ${spec[0]}deg — the body must stay under ${IDLE_BODY_MAX_DEG} while merely standing`);
	}
	const limit = JOINT_LIMIT_DEG[POSE][bone];
	if (limit === undefined) continue;
	const share = idlePeak(bone) / limit;
	if (share > IDLE_BUDGET_SHARE) {
		fail(
			`IDLE ${bone} peaks at ${idlePeak(bone).toFixed(2)}deg, ${(share * 100).toFixed(0)}% of that joint's ${limit}deg limit — the permanent sway is eating the reaction's room`,
		);
	}
	note(`idle ${bone.padEnd(6)} peak ${idlePeak(bone).toFixed(2)}deg = ${(share * 100).toFixed(0)}% of limit`);
}

// ── rule 9: the envelope is actually an envelope ─────────────────────────────
for (const tierName of TIER_ORDER) {
	const tier = TIERS[tierName];
	if (!tier) continue;
	const e = (v) => reactionEnvelope(v, tier.snap, tier.hold);
	if (e(0) !== 0 || e(1) !== 0) fail(`${tierName}: the envelope does not start and end at rest — the figure snaps at the boundary`);
	if (e((tier.snap + tier.hold) / 2) < 0.99) fail(`${tierName}: the envelope never reaches full amplitude between snap and hold`);
	if (!(tier.snap > 0 && tier.snap < tier.hold && tier.hold < 1)) {
		fail(`${tierName}: snap ${tier.snap} / hold ${tier.hold} are not an ordered pair inside (0,1)`);
	}
}
{
	// the idle must actually produce motion, not merely declare it
	const samples = [0, 400, 900, 1500, 2300, 3100].map((t) => idleAngle(IDLE.head, t));
	const span = Math.max(...samples) - Math.min(...samples);
	if (span < 0.05) fail(`the head's idle spans only ${span.toFixed(3)}deg across a cycle — it is standing still`);
	note(`idle head spans ${span.toFixed(2)}deg`);
}

}

/* ── rule 10: the MESH, not just the table ───────────────────────────────────
 *
 * Everything above checks NUMBERS. What tears a skinned mesh is the geometry
 * the angles produce, and that depends on the rig as much as on the amplitude.
 * Every inked triangle keeps its sign, stays above 50% of its rest area and
 * under 1.6x — idle at 48 steps, every tier at 8 trigger phases, on EVERY rig.
 *
 * It sees area, so a hand sheared into a spike passes — that is rule 1's job.
 * The posing calls castMotion.ts (the code skinnedFigure.ts renders with)
 * through design/lib/castMesh.mjs, on the texture game/assets.ts ships.
 *
 * Turf's rigs are 32x80 (16x13px cells), twice as fine as the 16x40 the 50%
 * floor was set on. A finer grid concentrates the same shear in smaller
 * triangles, so this floor is STRICTER here than on Capo Nostra / Hard Time,
 * not looser; it is kept rather than recalibrated.
 */
const regions = JSON.parse(fs.readFileSync(path.join(appRoot, 'design/cast_guy_arm_regions.json'), 'utf8'));
// Points ON an edge count as inside — vertices sit on the lattice.
const inside = ([x, y], poly) => {
	for (let i = 0, j = poly.length - 1; i < poly.length; j = i, i += 1) {
		const [ax, ay] = poly[j];
		const [bx, by] = poly[i];
		const cross = (bx - ax) * (y - ay) - (by - ay) * (x - ax);
		const dot = (x - ax) * (bx - ax) + (y - ay) * (by - ay);
		if (Math.abs(cross) < 1e-6 && dot >= 0 && dot <= (bx - ax) ** 2 + (by - ay) ** 2) return true;
	}
	let hit = false;
	for (let i = 0, j = poly.length - 1; i < poly.length; j = i, i += 1) {
		const [xi, yi] = poly[i];
		const [xj, yj] = poly[j];
		if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) hit = !hit;
	}
	return hit;
};

for (const [stem, rigPose] of Object.entries(RIG_POSE)) {
	POSE = rigPose;
	TIERS = TIERS_BY_POSE[POSE];
	const who = stem;
	let mesh;
	try {
		mesh = loadCastMesh(appRoot, motion, { rigPath: path.join(RIG_DIR, `${stem}.rig.json`) });
	} catch (error) {
		fail(`${who}: the mesh rules cannot run (${error.message}) — and the angle rules alone have never been enough`);
		continue;
	}
	const { rig } = mesh;
	const motionScale = MOTION_SCALE.guy;

	// every vertex fully weighted, and shared — the sharing IS the seamlessness
	let worstWeightError = 0;
	let spread = 0;
	for (const row of rig.weights) {
		worstWeightError = Math.max(worstWeightError, Math.abs(row.reduce((a, b) => a + b, 0) - 1));
		spread += row.filter((w) => w > 0.02).length;
	}
	spread /= rig.weights.length;
	if (worstWeightError > 1e-6) fail(`${who}: a vertex is not fully weighted (worst error ${worstWeightError.toExponential(2)})`);
	// Turf's rigs paint rigid PARTS (fist+bat on one bone, so the bat never hinges
	// at the wrist), and 60% of a 32x80 grid is transparent margin with one
	// owner. Averaged over the whole grid that reads ~1.1; over INKED vertices,
	// where continuity matters, it is the number to hold.
	const inkedRows = rig.weights.filter((_, i) => mesh.alphaAt(rig.verts[i][0], rig.verts[i][1]) > 8);
	const inkedSpread = inkedRows.reduce((sum, row) => sum + row.filter((w) => w > 0.02).length, 0) / inkedRows.length;
	if (inkedSpread < 1.5) fail(`${who}: inked vertices average only ${inkedSpread.toFixed(2)} bones each — the mesh has stopped being continuous and behaves like cut parts`);
	note(`${who} weights sum to 1, ${spread.toFixed(2)} bones per vertex (${inkedSpread.toFixed(2)} over inked)`);

	if (mesh.inkedCount < rig.tris.length * 0.15) {
		fail(`${who}: only ${mesh.inkedCount} of ${rig.tris.length} triangles carry any ink — the rig and the texture do not line up`);
		continue;
	}

	/* ── rule 11: the arm bones are ON the arms ────────────────────────────────
	 *
	 * Rule 10 cannot see this, and Hard Time proved it: a rig whose arm bones sat
	 * on the trousers passed rule 10, because a bone that owns trousers bends the
	 * trousers a little and leaves the arm alone — nothing folds, and nothing
	 * reacts either. So on the inked vertices inside each arm region, traced off
	 * the drawing (design/cast_guy_arm_regions.json, traced independently of the
	 * rig builder's own part polygons), that arm's arm_* + fore_* must own at
	 * least own_floor. 'anchored' (the pocket hands, pinned to the hips on
	 * purpose) and 'spill' (hoodie beside each arm) are reported, not gated.
	 */
	const pr = regions.poses[POSE];
	if (!pr) {
		fail(`${who}: cast_guy_arm_regions.json has no '${POSE}' pose`);
	} else {
		if (!pr.textures.some((t) => path.join(appRoot, 'static/assets', t) === mesh.texturePath)) {
			fail(`${who}: cast_guy_arm_regions.json '${POSE}' was traced on ${pr.textures.join(', ')} but this rig ships ${path.relative(appRoot, mesh.texturePath)} — re-trace the arms on the new drawing`);
		}
		const boneIndex = Object.fromEntries(rig.bones.map((b, i) => [b.name, i]));
		const all = [
			...pr.arms.map((r) => ({ ...r, kind: 'arm' })),
			...(pr.anchored ?? []).map((r) => ({ ...r, kind: 'anchored' })),
			...(pr.spill ?? []).map((r) => ({ ...r, kind: 'spill' })),
		];
		for (const { label, side, poly, kind } of all) {
			const own = [boneIndex[`arm_${side}`], boneIndex[`fore_${side}`]];
			if (own.some((i) => i === undefined)) {
				fail(`${who}: the rig has no arm_${side}/fore_${side} bones`);
				continue;
			}
			const verts = rig.verts
				.map((v, i) => [v, i])
				.filter(([v]) => inside(v, poly) && mesh.alphaAt(v[0], v[1]) > 8)
				.map(([, i]) => i);
			if (!verts.length) {
				fail(`${who}: no inked vertex inside '${label}' — the regions and the texture do not line up`);
				continue;
			}
			const mean = verts.reduce((sum, i) => sum + rig.weights[i][own[0]] + rig.weights[i][own[1]], 0) / verts.length;
			if (kind === 'arm' && mean < regions.own_floor) {
				fail(
					`${who}: '${label}' is only ${(mean * 100).toFixed(0)}% owned by arm_${side}+fore_${side} (floor ${regions.own_floor * 100}%) — the arm bones are not on the arm, so every arm number in the tables is moving the torso. Rebuild: python3 design/rig/build_turf_rigs.py <base|feature|kingpin>`,
				);
			}
			note(`${who} ${kind.padEnd(8)} ${label.padEnd(24)} ${String(verts.length).padStart(3)} inked verts, arm_${side}+fore_${side} own ${mean.toFixed(2)}`);
		}
	}
	note(`${who} ${mesh.inkedCount} of ${rig.tris.length} triangles carry ink on ${path.relative(appRoot, mesh.texturePath)}`);

	// (a) the idle, which runs forever and so has to be clean at every instant
	const REST_TIER = { ...TIERS.win, bones: {}, rise: 0, stretch: 0, glow: 0 };
	const idleAcc = mesh.newAcc();
	const STEPS = 48;
	for (let i = 0; i < STEPS; i += 1) {
		mesh.measure(
			mesh.poseAreas({ timeMs: (i * LOOP_MS) / STEPS, pose: POSE, tier: REST_TIER, reactionAge: null, durationMs: 1, speed: 1, motionScale }),
			idleAcc,
		);
	}
	if (idleAcc.flips) fail(`${who} IDLE FOLD: ${idleAcc.flips} triangle inversion(s) across the ${(LOOP_MS / 1000).toFixed(0)}s loop — the art creases over itself while merely standing`);
	if (idleAcc.shrink < FOLD_FLOOR) fail(`${who} IDLE FOLD: smallest triangle collapses to ${(idleAcc.shrink * 100).toFixed(0)}% of its rest area (floor ${FOLD_FLOOR * 100}%) at ${mesh.where(idleAcc.shrinkAt)}`);
	if (idleAcc.grow > STRETCH_CAP) fail(`${who} IDLE STRETCH: worst triangle grows to ${idleAcc.grow.toFixed(2)}x (cap ${STRETCH_CAP.toFixed(2)}x) at ${mesh.where(idleAcc.growAt)} — the pixels inside it visibly smear`);
	note(`${who} idle fold ${(idleAcc.shrink * 100).toFixed(0)}%  stretch ${idleAcc.grow.toFixed(2)}x  flips ${idleAcc.flips}`);

	// (b) each reaction, sampled at 8 TRIGGER PHASES
	for (const tierName of TIER_ORDER) {
		const tier = TIERS[tierName];
		if (!tier) continue;
		const acc = mesh.newAcc();
		let rotationOnly = 1;
		const tail = Math.max(0, ...Object.values(tier.bones).map(([, lag]) => lag));
		for (let phase = 0; phase < 8; phase += 1) {
			const start = (phase * LOOP_MS) / 8;
			for (let i = 0; i <= 24; i += 1) {
				const age = (i * (tier.durationMs + tail)) / 24;
				const state = { timeMs: start + age, pose: POSE, tier, reactionAge: age, durationMs: tier.durationMs, speed: 1, motionScale };
				mesh.measure(mesh.poseAreas(state), acc);
				const flat = mesh.poseAreas({ ...state, tier: { ...tier, scale: undefined, flutter: undefined } });
				rotationOnly = Math.max(rotationOnly, mesh.measure(flat, mesh.newAcc()).grow);
			}
		}
		if (acc.flips) fail(`${who}/${tierName} REACTION FOLD: ${acc.flips} triangle inversion(s) across 8 trigger phases — the mesh creases at some sway phases and not others`);
		if (acc.shrink < FOLD_FLOOR) {
			fail(
				`${who}/${tierName} REACTION FOLD: smallest triangle collapses to ${(acc.shrink * 100).toFixed(0)}% of its rest area (floor ${FOLD_FLOOR * 100}%) at ${mesh.where(acc.shrinkAt)} — every joint is inside its angle limit and the drawing still folds there, so the fix is the rig or the art, not the table. BEFORE TOUCHING THE TABLE: (1) rule 11 above says whether the arm bones are on the arms; (2) look at the worst triangle's vertex weights for a WEIGHT CLIFF — one vertex 100% on a bone beside one 0% on it. MOTION_SCALE hides a fold rather than fixing it`,
			);
		}
		if (acc.grow > STRETCH_CAP) {
			fail(
				`${who}/${tierName} REACTION STRETCH: worst triangle grows to ${acc.grow.toFixed(2)}x (cap ${STRETCH_CAP.toFixed(2)}x) at ${mesh.where(acc.growAt)}; without squash and stretch it would be ${rotationOnly.toFixed(2)}x, so the shape channel is spending ${(acc.grow - rotationOnly).toFixed(2)} of the budget`,
			);
		}
		note(`${who} ${tierName.padEnd(7)} fold ${(acc.shrink * 100).toFixed(0)}% @ ${mesh.where(acc.shrinkAt)}  stretch ${acc.grow.toFixed(2)}x @ ${mesh.where(acc.growAt)}  flips ${acc.flips}`);
	}
}

if (problems.length) {
	console.error('\ncheck_cast_motion FAILED');
	for (const p of problems) console.error('  !! ' + p);
	process.exit(1);
}
console.log(`check_cast_motion ok (${CAST_POSES.join(' + ')} poses, ${Object.keys(RIG_POSE).length} rigs, ${TIER_ORDER.length} tiers each)`);
