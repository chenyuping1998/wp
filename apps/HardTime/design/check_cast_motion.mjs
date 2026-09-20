/**
 * The prisoner's motion tables, measured rather than trusted.
 *
 *     node design/check_cast_motion.mjs [--report]
 *
 * WHY THIS EXISTS
 *
 * The mesh cast shipped with NO gate of any kind on the game it was reskinned
 * from. What that bought there:
 *
 *   - a line-win reaction that peaked at 0.55deg on a forearm whose IDLE peaks
 *     at 1.53 — mathematically present and buried under the sway that never
 *     stops, so it could not be seen at all;
 *   - the win and big-win tables driving the arms in the OPPOSITE direction to
 *     the trigger — the figure pulling his arms IN on a win.
 *
 * And what this game's own copy of the gate missed until 2026-09-17, because it
 * never looked at the mesh: the rig was Hot Miami's, fitted to a different man,
 * its arm bones on his jacket and trousers instead of his arms, and the
 * reaction folding the drawing to 3.6% of its area in the live build.
 *
 * Every threshold below is either measured off the rendered mesh (see
 * JOINT_LIMIT_DEG) or taken from the transcription the motion is copied from
 * (hacksaw-character-motion rig/motion.py). None of them are taste.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { FOLD_FLOOR, STRETCH_CAP, loadCastMesh } from './lib/castMesh.mjs';

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const motion = await import(path.join(appRoot, 'src/game/castMotion.ts'));
const { IDLE, TIERS, MOTION_SCALE, idleAngle, reactionEnvelope, LOOP_MS } = motion;

const REPORT = process.argv.includes('--report');
const problems = [];
const fail = (m) => problems.push(m);
const note = (m) => REPORT && console.log('   ' + m);

/* ── the measured breaking points ────────────────────────────────────────────
 *
 * MEASURED 2026-09-17 on the rig design/build_cast_guy_rig.py writes, with
 * prisoner.png. The table this replaces was Capo Nostra's v1 Don, measured on
 * another drawing and another rig and kept through the reskin. A limit only
 * means something for the drawing AND the weights it was measured on.
 *
 * Two passes, because neither alone is enough:
 *
 *  1. GEOMETRIC — design/measure_joint_limits.mjs. Each joint rotated alone,
 *     idle off, until an inked triangle folds under 50% or stretches past 1.6x.
 *     Reproducible, but it only sees AREA.
 *  2. VISUAL. Rendered at the geometric limit and stepped down, zoomed 2-3x on
 *     both hands (and on the collar for neck/head, the whole figure for the
 *     lower spine), until the drawing was clean.
 *
 *              geometric   visual                                  shipped
 *   arm_l        7.5       fingers drawn to a point from -5          4.5
 *   arm_r        8         thigh edge kinks beside the hand from +5  4.5
 *   fore_l      14         fingers smear / point from +-8            7
 *   fore_r      13         thigh edge bulges from +-8                6
 *   chest       17         hands clean at 12; rendered clean at 8    8
 *   neck        22.5       collar drags from 14; clean at 9          9
 *   head        32         collar shears at 32; clean at 20          20
 *   hips        17         legs bend like rubber long before 17      8
 *   waist       34         likewise; clean at 12                     12
 *
 * The arms are the tight ones and it is THE DRAWING: his hands hang 5-10px
 * from his thighs, a third of a grid cell, so every arm swing shears the
 * triangles that hold both a hand and a trouser edge. The geometric pass
 * called arm_l 7.5; at -5 his fingers already come to a point with every
 * triangle's area intact. That gap is why the visual pass exists.
 */
const JOINT_LIMIT_DEG = {
	guy: {
		arm_l: 4.5, arm_r: 4.5,
		fore_l: 7, fore_r: 6,
		hips: 8, waist: 12, chest: 8, neck: 9, head: 20,
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
for (const who of Object.keys(JOINT_LIMIT_DEG)) {
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
			const limit = JOINT_LIMIT_DEG[who][bone];
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

// ── rule 3: a reaction may not be a rigid rotation-only snap ─────────────────
//
// The intent this rule has always carried: a body reacting, not a body
// twitching. It used to demand a LAG SPREAD down every chain, because on a
// rotation-only rig a travelling wave was the only thing that could keep a
// reaction from reading as one rigid snap.
//
// The transcription does not use lag. rig/motion.py drives every bone from ONE
// envelope, and it is not a snap, because the life comes from channels the old
// rule never knew about: the driving arm lengthens and thickens while the
// bracing arm compresses, the bulge shakes through the hold, and the root
// lifts. Demanding lag would fail the reference itself.
//
// So a tier passes if it has a lag spread OR it carries the shape channel:
// squash and stretch on at least one bone, a flutter on it through the hold,
// and a root lift. A tier with none of those is rotation only — the paper
// cut-out.
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
	const hasSpread = Math.max(...lags) - Math.min(...lags) > 0;
	const shape = tier.scale?.shape ?? {};
	const bulges = Object.values(shape).some(([along, across]) => along !== 1 || across !== 1);
	const hasShape = bulges && (tier.scale?.k ?? 0) > 0 && (tier.flutter?.depth ?? 0) > 0 && (tier.rise ?? 0) > 0;
	if (!hasSpread && !hasShape) {
		fail(
			`${tierName}: no lag spread and no shape channel — every bone rotates on one envelope and nothing changes length, thickness or height. That is a rigid snap on a flat cut-out, which is what 「人物整個像紙片一樣軟軟的」 described`,
		);
	}
	note(`${tierName.padEnd(7)} lag spread ${hasSpread ? 'yes' : 'no'}, shape channel ${hasShape ? `yes (k ${tier.scale.k.toFixed(3)}, flutter ${tier.flutter.depth}, rise ${tier.rise.toFixed(4)})` : 'no'}`);
}

// ── rule 4: the tiers must actually escalate ─────────────────────────────────
//
// A big win that moves the figure less than a small one tells the player the
// opposite of the truth.
const energy = (tier) =>
	Object.values(tier.bones).reduce((sum, [a]) => sum + Math.abs(a), 0) +
	(tier.rise + tier.stretch + tier.lean) * 100;
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
// Measured on the prisoner's rig by rotating each arm and tracking the vertices
// his forearm bones own: arm_l +10deg moves that hand 17.5px OUTWARD, arm_r
// -10deg moves his other hand 26.8px outward. So opening the body is arm_l
// positive / arm_r negative, and each forearm follows its own arm. A win table
// with the signs flipped is the figure closing up on a win.
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

// ── rule 6: the arms act through their SHAPE, not only their angle ───────────
//
// This rule used to say "the free end carries multiples of the body" and
// measured it as ROTATION: fore_l at least 2x the chest. That number came from
// Miami Mayhem's raw Spine rigs, where an arm is its own attachment and can turn
// 18-20 degrees fighting nothing. On one continuous mesh an arm cannot, and the
// tables written to satisfy the ratio pushed the gesture into a forearm swinging
// 6.7 degrees — a flat limb flapping, and on this drawing past where his hand
// stays a hand.
//
// The transcription keeps the principle and moves it to the channel a mesh can
// carry: its arms barely rotate; the driving arm lengthens 1.23x and thickens,
// the bracing arm compresses along its bone and bulges across. So every tier's
// shape must have a driving arm that LENGTHENS and a bracing arm on the other
// side that COMPRESSES, and the lengthening must survive the tier's k.
const MIN_VISIBLE_STRETCH = 0.02; // 2% along the bone, after k
const SIDE = { arm_l: 'l', fore_l: 'l', arm_r: 'r', fore_r: 'r' };
for (const tierName of TIER_ORDER) {
	const tier = TIERS[tierName];
	if (!tier) continue;
	const shape = tier.scale?.shape ?? {};
	const k = tier.scale?.k ?? 0;
	const drivers = Object.entries(shape).filter(([b, [along]]) => SIDE[b] && along > 1);
	const bracers = Object.entries(shape).filter(([b, [along]]) => SIDE[b] && along < 1);
	const driverSides = new Set(drivers.map(([b]) => SIDE[b]));
	const braceSides = new Set(bracers.map(([b]) => SIDE[b]));
	if (!drivers.length) {
		fail(`${tierName}: no arm lengthens — the gesture has no driving arm, so the limbs can only rotate`);
		continue;
	}
	if (![...braceSides].some((side) => !driverSides.has(side))) {
		fail(`${tierName}: no arm on the OTHER side compresses — the reference's gesture is one arm throwing out while the other braces`);
	}
	const bestStretch = Math.max(...drivers.map(([, [along]]) => (along - 1) * k));
	if (bestStretch < MIN_VISIBLE_STRETCH) {
		fail(`${tierName}: the driving arm lengthens only ${(bestStretch * 100).toFixed(1)}% after k — under ${MIN_VISIBLE_STRETCH * 100}% the shape channel is present in name only`);
	}
	note(`${tierName.padEnd(7)} driving ${drivers.map(([b]) => b).join('+')} +${(bestStretch * 100).toFixed(1)}%, bracing ${bracers.map(([b]) => b).join('+')}`);
}

// ── rule 6b: the spine may not act bigger than the transcription does ────────
//
// What this rule protects is real: 「頭部位移太多」 — a head that carries the
// gesture reads as the whole man lurching. It used to guard that with a RATIO
// against the carrier (head <= 0.45x fore_l), from character_main_girl whose arm
// turns 18.77 degrees. On a mesh the port inverts that ratio on purpose — head
// 4.02 against fore_l 1.08 — because the arms act through shape instead. The
// ratio would fail the reference itself.
//
// The ceiling is now the transcription's own spine, scaled by how much of the
// gesture the tier is. rig/motion.py REACTION, hacksaw-character-motion:
const REFERENCE_SPINE_PEAK = { chest: 1.68, neck: 2.7, head: 4.02 };
const REFERENCE_HEAD = REFERENCE_SPINE_PEAK.head;
for (const tierName of TIER_ORDER) {
	const tier = TIERS[tierName];
	if (!tier) continue;
	// how much of the reference this tier is, read off its own head
	const fraction = Math.abs(tier.bones.head?.[0] ?? 0) / REFERENCE_HEAD;
	for (const [bone, peak] of Object.entries(REFERENCE_SPINE_PEAK)) {
		const amp = Math.abs(tier.bones[bone]?.[0] ?? 0);
		if (amp > peak * 1.0001 && tierName === 'trigger') {
			fail(`trigger: ${bone} is ${amp}deg, over the transcription's ${peak} — the spine is doing more of the gesture than the verified port, which is 「頭部位移太多」`);
		}
		const ceiling = peak * Math.max(fraction, 1e-9);
		if (tierName !== 'trigger' && amp > ceiling * 1.0001) {
			fail(`${tierName}: ${bone} is ${amp.toFixed(3)}deg against ${ceiling.toFixed(3)} for a tier this size — the spine is out of proportion with the rest of the gesture`);
		}
	}
	if (fraction > 1.0001) {
		fail(`${tierName}: the head is ${fraction.toFixed(2)}x the transcription's — no tier may be bigger than the reference gesture`);
	}
	note(`${tierName.padEnd(7)} spine at ${(fraction * 100).toFixed(0)}% of the transcription (head ${Math.abs(tier.bones.head?.[0] ?? 0).toFixed(2)} / ${REFERENCE_HEAD})`);
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
// On the prisoner that bar is close — arm_l's idle alone peaks at 2.50deg of a
// 4.5deg limit — which is the drawing (hands beside the thighs), not the table.
const IDLE_BODY_MAX_DEG = 1.5;
const IDLE_BUDGET_SHARE = 0.6;
const SPINE = new Set(['root', 'hips', 'waist', 'chest', 'neck', 'head']);
for (const [bone, spec] of Object.entries(IDLE)) {
	if (SPINE.has(bone) && Math.abs(spec[0]) > IDLE_BODY_MAX_DEG) {
		fail(`IDLE ${bone} is ${spec[0]}deg — the body must stay under ${IDLE_BODY_MAX_DEG} while merely standing`);
	}
	const limit = JOINT_LIMIT_DEG.guy[bone];
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

/* ── rule 10: the MESH, not just the table ───────────────────────────────────
 *
 * Everything above checks NUMBERS, and every one of those rules passed for
 * weeks while this game's reaction folded the prisoner to 3.6% of his area:
 * what tears a skinned mesh is the geometry the angles produce, and that
 * depends on the rig as much as on the amplitude.
 *
 * A continuous mesh cannot tear, but it can FOLD: push a bone far enough and a
 * triangle collapses and inverts, and the art creases over itself. Every inked
 * triangle keeps its sign, stays above 50% of its rest area and under 1.6x.
 *
 * It is not sufficient on its own either — it sees area, and a hand sheared
 * into a spike keeps its area. That is rule 1's job.
 *
 * The posing calls castMotion.ts, the SAME code skinnedFigure.ts renders with,
 * through design/lib/castMesh.mjs, which also reads the texture game/assets.ts
 * actually ships.
 */
const REST_TIER = { ...TIERS.win, bones: {}, rise: 0, stretch: 0, lean: 0, push: undefined, glow: 0, scale: undefined, flutter: undefined };

for (const who of Object.keys(JOINT_LIMIT_DEG)) {
	let mesh;
	try {
		mesh = loadCastMesh(appRoot, motion);
	} catch (error) {
		fail(`${who}: the mesh rules cannot run (${error.message}) — and the angle rules alone have never been enough`);
		continue;
	}
	const { rig } = mesh;
	const motionScale = MOTION_SCALE[who];

	// every vertex fully weighted, and shared — the sharing IS the seamlessness
	let worstWeightError = 0;
	let spread = 0;
	for (const row of rig.weights) {
		worstWeightError = Math.max(worstWeightError, Math.abs(row.reduce((a, b) => a + b, 0) - 1));
		spread += row.filter((w) => w > 0.02).length;
	}
	spread /= rig.weights.length;
	if (worstWeightError > 1e-6) fail(`${who}: a vertex is not fully weighted (worst error ${worstWeightError.toExponential(2)})`);
	if (spread < 2) fail(`${who}: vertices average only ${spread.toFixed(2)} bones each — under 2 the mesh stops being continuous and starts behaving like cut parts`);
	note(`${who} weights sum to 1, ${spread.toFixed(2)} bones per vertex`);

	if (mesh.inkedCount < rig.tris.length * 0.15) {
		fail(`${who}: only ${mesh.inkedCount} of ${rig.tris.length} triangles carry any ink — the rig and the texture do not line up`);
		continue;
	}

	/* ── rule 11: the arm bones are ON the arms ────────────────────────────────
	 *
	 * Rule 10 cannot see this, and it was proven: Hot Miami's old rig with the
	 * current tables passes rule 10 on this drawing, because an arm bone that
	 * owns trousers instead of an arm bends the trousers a little and leaves the
	 * arm alone — nothing folds, and nothing reacts either. That rig shipped with
	 * fore_l / fore_r owning ~0 of the prisoner's forearms.
	 *
	 * So: on the inked vertices inside each arm region (traced off the drawing,
	 * design/cast_guy_arm_regions.json — the same file the rig builder reads),
	 * that arm's own two bones must own at least `own_floor` of the weight.
	 */
	const regions = JSON.parse(fs.readFileSync(path.join(appRoot, 'design/cast_guy_arm_regions.json'), 'utf8'));
	if (path.join(appRoot, 'static/assets', regions.texture) !== mesh.texturePath) {
		fail(`${who}: cast_guy_arm_regions.json was traced on ${regions.texture} but the mesh ships ${path.relative(appRoot, mesh.texturePath)} — re-trace the arms on the new drawing`);
	}
	// Points ON an edge count as inside — vertices sit on the lattice and the
	// traced seams often run along it. build_cast_guy_rig.py rasterises the same
	// polygons, which includes the boundary too, so both count the same vertices.
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
	const boneIndex = Object.fromEntries(rig.bones.map((b, i) => [b.name, i]));
	for (const { label, side, poly, spill } of [...regions.arms, ...regions.spill.map((r) => ({ ...r, spill: true }))]) {
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
		if (!spill && mean < regions.own_floor) {
			fail(
				`${who}: '${label}' is only ${(mean * 100).toFixed(0)}% owned by arm_${side}+fore_${side} (floor ${regions.own_floor * 100}%) — the arm bones are not on the arm, so every arm number in the tables is moving the torso. Rebuild the rig: python3 design/build_cast_guy_rig.py --report`,
			);
		}
		note(`${who} ${spill ? 'spill' : 'arm  '} ${label.padEnd(24)} ${verts.length} inked verts, arm_${side}+fore_${side} own ${mean.toFixed(2)}`);
	}
	note(`${who} ${mesh.inkedCount} of ${rig.tris.length} triangles carry ink on ${path.relative(appRoot, mesh.texturePath)} (${mesh.texture.width}x${mesh.texture.height}, rig ${rig.size[0]}x${rig.size[1]})`);

	// (a) the idle, which runs forever and so has to be clean at every instant
	const idleAcc = mesh.newAcc();
	const STEPS = 48;
	for (let i = 0; i < STEPS; i += 1) {
		mesh.measure(
			mesh.poseAreas({ timeMs: (i * LOOP_MS) / STEPS, tier: REST_TIER, reactionAge: null, durationMs: 1, speed: 1, motionScale }),
			idleAcc,
		);
	}
	if (idleAcc.flips) fail(`${who} IDLE FOLD: ${idleAcc.flips} triangle inversion(s) across the ${(LOOP_MS / 1000).toFixed(0)}s loop — the art creases over itself while merely standing`);
	if (idleAcc.shrink < FOLD_FLOOR) fail(`${who} IDLE FOLD: smallest triangle collapses to ${(idleAcc.shrink * 100).toFixed(0)}% of its rest area (floor ${FOLD_FLOOR * 100}%) at ${mesh.where(idleAcc.shrinkAt)}`);
	if (idleAcc.grow > STRETCH_CAP) fail(`${who} IDLE STRETCH: worst triangle grows to ${idleAcc.grow.toFixed(2)}x (cap ${STRETCH_CAP.toFixed(2)}x) at ${mesh.where(idleAcc.growAt)} — the pixels inside it visibly smear`);
	note(`${who} idle fold ${(idleAcc.shrink * 100).toFixed(0)}%  stretch ${idleAcc.grow.toFixed(2)}x  flips ${idleAcc.flips}`);

	// (b) each reaction, sampled at 8 TRIGGER PHASES. The reaction lands on
	//     whatever the idle is doing, and the worst case is a phase thing.
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
				const state = { timeMs: start + age, tier, reactionAge: age, durationMs: tier.durationMs, speed: 1, motionScale };
				mesh.measure(mesh.poseAreas(state), acc);
				// the same pose WITHOUT squash and stretch, so a stretch failure
				// says how much of the budget the shape channel is spending
				const flat = mesh.poseAreas({ ...state, tier: { ...tier, scale: undefined, flutter: undefined } });
				const flatAcc = mesh.measure(flat, mesh.newAcc());
				rotationOnly = Math.max(rotationOnly, flatAcc.grow);
			}
		}
		if (acc.flips) fail(`${who}/${tierName} REACTION FOLD: ${acc.flips} triangle inversion(s) across 8 trigger phases — the mesh creases at some sway phases and not others`);
		if (acc.shrink < FOLD_FLOOR) {
			fail(
				`${who}/${tierName} REACTION FOLD: smallest triangle collapses to ${(acc.shrink * 100).toFixed(0)}% of its rest area (floor ${FOLD_FLOOR * 100}%) at ${mesh.where(acc.shrinkAt)} — every joint is inside its angle limit and the drawing still folds there, so the fix is the rig or the art, not the table. BEFORE TOUCHING THE TABLE: (1) check the arm bones are ON the arms — python3 design/build_cast_guy_rig.py --report --dry-run prints how much of each arm its own bones own, and this game shipped a rig whose fore_l/fore_r owned ~0 of the prisoner's forearms. (2) look at the worst triangle's vertex weights for a WEIGHT CLIFF — one vertex 100% on an arm bone beside one 0% on it — which is a smoothing fault in the same script. What does NOT work: a finer mesh (smaller triangles concentrate the same shear; the 50% floor is calibrated to 16x40), and MOTION_SCALE (it hides the fold rather than fixing it)`,
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
console.log(`check_cast_motion ok (${TIER_ORDER.length} tiers, ${Object.keys(IDLE).length} idle bones)`);
