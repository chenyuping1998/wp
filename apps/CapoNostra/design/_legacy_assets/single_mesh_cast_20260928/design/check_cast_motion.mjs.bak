/**
 * The Don's motion tables, measured rather than trusted.
 *
 *     node design/check_cast_motion.mjs [--report]
 *
 * WHY THIS EXISTS
 *
 * The mesh cast shipped with NO gate of any kind. What that bought:
 *
 *   - a line-win reaction that peaked at 0.55deg on a forearm whose IDLE peaks
 *     at 1.53 — the acknowledgement was mathematically present and buried under
 *     the sway that never stops, so it could not be seen at all;
 *   - the win and big-win tables driving the arms in the OPPOSITE direction to
 *     the trigger, i.e. the Don pulling his arms IN on a win. The single most
 *     frequent reaction in the game was a deflating gesture, and nothing was
 *     looking. (Hot Miami shipped the same defect with its raygun.)
 *
 * Every threshold below is either a number measured off the rendered mesh
 * (2026-09-05: one joint rotated at a time through the exact matrix maths
 * skinnedFigure.ts uses, rendered, and inspected ZOOMED ON THE EXTREMITY) or a
 * rule measured off Hacksaw's Miami Mayhem cast (docs the idleSway tables cite).
 * None of them are taste.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { readAlpha } from './lib/pngAlpha.mjs';

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const {
	IDLE,
	TIERS,
	MOTION_SCALE,
	idleAngle,
	reactionEnvelope,
	LOOP_MS,
	buildWeightIndex,
	composeBoneMatrices,
	skinVertices,
} = await import(path.join(appRoot, 'src/game/castMotion.ts'));

const REPORT = process.argv.includes('--report');
const problems = [];
const fail = (m) => problems.push(m);
const note = (m) => REPORT && console.log('   ' + m);

/* ── the measured breaking points ────────────────────────────────────────────
 *
 * RE-MEASURED 2026-09-17 on the rig design/build_cast_guy_rig.py writes. The
 * table this replaces was eyeballed on the v1 drawing (arms against the body)
 * and then silently kept through two redraws and a rebuilt rig — while the v3
 * rig's arm bones were not even on the arms. A limit only means something for
 * the drawing AND the weights it was measured on.
 *
 * Two passes, because neither alone is enough:
 *
 *  1. GEOMETRIC. Each joint rotated alone, idle off, until an inked triangle
 *     folds under 50% or stretches past 1.6x (rule 10's own thresholds).
 *     Reproducible, but it only sees AREA. A sleeve sheared into a wedge can
 *     keep its area.
 *  2. VISUAL. Every joint rendered at its geometric limit, zoomed on the hands.
 *     Where that showed a break, stepped down until it did not.
 *
 *              geometric   visual     shipped   why
 *   arm_l        4.5        clean       4.5
 *   arm_r       14          wedge       7        cuff sheared into a wedge at
 *                                                -14; clean at -5 and -7
 *   fore_l      10          clean      10
 *   fore_r      15.5        clean      15.5
 *   neck        15.5        seam        9        a hard vertical edge cuts the
 *                                                cigar sleeve from +12: the cigar
 *                                                arm carries 0.18 neck weight
 *   head        26          -          25        v1's value; tighter, kept
 *   hips/waist/chest  24.5 / 38.5 / 25    8 / 10 / 10   v1's values; tighter, kept
 *
 * The neck is the lesson: v1 called it 15, and at 15.5 the corrected rig shows a
 * seam. A table that was never re-measured would have passed that break.
 */
const JOINT_LIMIT_DEG = {
	guy: {
		arm_l: 4.5, arm_r: 7,
		fore_l: 10, fore_r: 15.5,
		hips: 8, waist: 10, chest: 10, neck: 9, head: 25,
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
 *  amplitude, and the true peak runs 1.25x to 2.0x the declared number
 *  depending on the bone. Guessing one multiplier for all of them would either
 *  waste budget or hide an overdrive. */
const idlePeak = (bone) => {
	const spec = IDLE[bone];
	if (!spec) return 0;
	let peak = 0;
	for (let t = 0; t <= LOOP_MS * 5; t += 5) peak = Math.max(peak, Math.abs(idleAngle(spec, t)));
	return peak;
};

// ── rule 1: no joint may be driven past where the mesh was measured to tear ──
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
					`${who}/${tierName}: ${bone} reaches ${peak.toFixed(2)}deg against a measured limit of ${limit} — the mesh tears here`,
				);
			}
			note(`${who.padEnd(4)} ${tierName.padEnd(7)} ${bone.padEnd(6)} peak ${peak.toFixed(2).padStart(5)}deg  limit ${limit}`);
		}
	}
}

// ── rule 2: a reaction must be visible at all ────────────────────────────────
//
// Two bars, and the second one is the one this game actually failed.
//
// (a) an absolute floor. Measured in the running game at 1280x720: the Don
//     renders at 0.93 CSS px per texture px (his full 801px figure box maps to
//     744 CSS px, cropped by the screen edge). One degree at the elbow moves
//     his hand 1.35 texture px, so ~1.3 CSS px. Under 2deg the loudest thing in
//     the reaction moves a couple of pixels and the beat does not exist.
// (b) it must clear the IDLE. A reaction smaller than the sway running
//     underneath it is not a quiet reaction, it is an invisible one — which is
//     exactly what 0.55deg of forearm against a 1.53deg idle peak was.
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
// Between 2026-09-13 and 2026-09-19 this rule had a second way to pass: a tier
// could skip the lag if it carried squash and stretch instead, because the
// transcription drives every bone from one envelope and gets its life from the
// shape channel. That channel was removed on 2026-09-20 along with the rest of
// the transcription (castMotion.ts header), so the lag is the only thing
// keeping a reaction from being a rigid snap, and it is required again.
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
		fail(
			`${tierName}: every bone starts at the same instant — the figure snaps into its pose as one rigid unit, which is the twitch this rule exists to prevent`,
		);
	}
	note(`${tierName.padEnd(7)} lag spread ${spread}ms`);
}

// ── rule 4: the tiers must actually escalate ─────────────────────────────────
//
// A big win that moves the figure less than a small one is worse than having no
// tiers at all — it tells the player the opposite of the truth. The rigid
// whole-body moves count, because on this figure they carry a real part of the
// difference between the rungs.
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
// Measured by rotating each bone and tracking where the hand goes: arm_l at
// +10deg moves that hand 44px OUTWARD, arm_r at -10deg moves its hand 32px
// outward. So opening the body is arm_l positive / arm_r negative, and each
// forearm follows its own arm.
//
// This is the rule that catches the defect this gate was written for. The
// shipped win and big-win tables had arm_l NEGATIVE and arm_r POSITIVE — the
// Don closing up on a win, and disagreeing with his own feature-trigger pose.
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
// whatever hangs off it — their hair measured 27.5deg against a 1-3.3 body, four
// to eight times over. This rig has no hair bone (the Don's hair is short and
// sits on the skull), so its free ends are the forearms.
//
// This rule was replaced on 2026-09-13 by one that demanded squash and stretch
// instead, because the transcription's arms barely rotate. The transcription is
// gone (castMotion.ts header) and so is that version.
const APPENDAGE_MIN_RATIO = 2;
const FREE_ENDS = ['fore_l', 'fore_r'];
for (const tierName of TIER_ORDER) {
	const tier = TIERS[tierName];
	if (!tier) continue;
	const body = Math.abs(tier.bones.chest?.[0] ?? 0);
	if (!body) continue;
	for (const bone of FREE_ENDS) {
		const amp = Math.abs(tier.bones[bone]?.[0] ?? 0);
		if (!amp) continue;
		if (amp / body < APPENDAGE_MIN_RATIO) {
			fail(
				`${tierName}: ${bone} moves ${(amp / body).toFixed(1)}x the chest — the reference measured 4-8x, and under ${APPENDAGE_MIN_RATIO}x the body is carrying the gesture instead of the limb`,
			);
		}
		note(`${tierName.padEnd(7)} ${bone}/chest ratio ${(amp / body).toFixed(1)}x`);
	}
}

// ── rule 6b: the head may not carry the gesture ─────────────────────────────
//
// What this protects is real and was a review note: 「頭部位移太多」 — a head
// that carries the gesture reads as the whole man lurching rather than as a
// person reacting.
//
// The ceiling is a SHARE OF THE CARRIER (the loudest forearm), and the number is
// Hot Miami's shipped ratio with a little margin: its trigger is head 6.4
// against fore_l 12.5, i.e. 0.51. That build passed review, so 0.55 is a ceiling
// this figure's tables can be measured against without inventing one.
//
// The 2026-09-13 version of this rule capped the spine against the
// transcription's own peaks instead. That reference is gone.
const HEAD_MAX_SHARE = 0.55;
for (const tierName of TIER_ORDER) {
	const tier = TIERS[tierName];
	if (!tier) continue;
	const carrier = Math.max(...FREE_ENDS.map((b) => Math.abs(tier.bones[b]?.[0] ?? 0)));
	const head = Math.abs(tier.bones.head?.[0] ?? 0);
	if (!carrier || !head) continue;
	const share = head / carrier;
	if (share > HEAD_MAX_SHARE + 1e-9) {
		fail(
			`${tierName}: the head is ${share.toFixed(2)}x the loudest forearm, over ${HEAD_MAX_SHARE} — the spine is doing the gesture and that reads as 「頭部位移太多」`,
		);
	}
	note(`${tierName.padEnd(7)} head/carrier ${share.toFixed(2)} (ceiling ${HEAD_MAX_SHARE})`);
}

// ── rule 7: no bone may start after the beat has begun to release ────────────
//
// skinnedFigure.ts clears the reaction at durationMs + the longest lag, so a
// laggard is never CUT — but a bone that only starts after the body has already
// begun letting go arrives at an empty room.
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
// A reaction is a beat; the idle is the state the figure is in for whole
// minutes. Two bars: a flat ceiling on the declared amplitude, and — the one
// that matters on this drawing — the idle may not eat the budget the reaction
// needs. The shoulders already spend 55% of their 4deg limit standing still.
// The 1.5deg ceiling is about the BODY — its message always said so — but it
// was applied to every idle bone, arms included. The transcription breathes its
// arms at 1.6 and 1.5 and keeps its spine at 0.06-0.55: small body, living
// limbs, which is the same 本體小、附屬物大 the reaction follows. Arms are the
// free ends, so they are held by the joint budget below, not by this ceiling.
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
 * Everything above this line checks NUMBERS. Every rule so far can pass while
 * the drawing creases, because what tears a skinned mesh is the geometry the
 * angles produce, and that depends on the rig — the grid, the weights, how much
 * mesh happens to lie across a given joint — as much as on the amplitude.
 *
 * A continuous mesh cannot tear: there is no boundary to open, which is the
 * entire reason for using one. What it CAN do is FOLD. Push a bone far enough
 * and a triangle collapses to zero area and then inverts, and the art creases
 * over itself — a hard kink that reads exactly like a broken joint. That is
 * exact and cheap to test: watch every triangle's signed area and require it to
 * keep its sign and not collapse. A triangle stretched too far smears the
 * pixels inside it, so growth is capped too.
 *
 * The thresholds (50% floor, 1.60x cap) are the reference pipeline's own, and
 * the Don currently sits at 47% on the reaction — inside every angle limit
 * above and still folding. That is the gap this rule exists to close.
 *
 * The posing calls into castMotion.ts, the SAME code skinnedFigure.ts renders
 * with. Re-deriving the matrix maths here would make this a gate on a copy.
 */
const FOLD_FLOOR = 0.5;
const STRETCH_CAP = 1.6;
const REST_TIER = { ...TIERS.win, bones: {}, rise: 0, stretch: 0, glow: 0 };

for (const who of Object.keys(JOINT_LIMIT_DEG)) {
	const rigPath = path.join(appRoot, `static/assets/meshRigs/cast_${who}/${who}.rig.json`);
	if (!fs.existsSync(rigPath)) {
		fail(`no rig at ${path.relative(appRoot, rigPath)} — the mesh rules cannot run, and the angle rules alone have never been enough`);
		continue;
	}
	const rig = JSON.parse(fs.readFileSync(rigPath, 'utf8'));
	// The TEXTURE THAT SHIPS, named by game/assets.ts, not rig.image — the rig
	// still carries the filename of the source art it was built from, which is
	// not in the repo. Gating against a file the player never sees would be a
	// gate on nothing.
	const pngPath = path.join(appRoot, `static/assets/meshRigs/cast_${who}/${who}.png`);
	if (!fs.existsSync(pngPath)) {
		fail(`no texture at ${path.relative(appRoot, pngPath)} — the mesh rules cannot tell ink from empty margin without it`);
		continue;
	}
	const { width: pngW, height: pngH, alpha } = readAlpha(fs.readFileSync(pngPath));
	if (pngW !== rig.size[0] || pngH !== rig.size[1]) {
		fail(`${who}: the rig was built for a ${rig.size[0]}x${rig.size[1]} image but ${who}.png is ${pngW}x${pngH} — every vertex is in the wrong place`);
		continue;
	}
	const motionScale = MOTION_SCALE[who];
	const index = buildWeightIndex(rig);
	const matrices = rig.bones.map(() => new Float32Array(6));
	const rest = new Float32Array(rig.verts.length * 2);
	rig.verts.forEach(([x, y], i) => {
		rest[i * 2] = x;
		rest[i * 2 + 1] = y;
	});
	const out = new Float32Array(rest);

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

	const tris = rig.tris;
	// Which triangles carry ink.
	//
	// The mesh is a plain grid over the WHOLE image, so a large share of it sits
	// in the transparent margin around the figure. Those triangles fold freely
	// and it is INVISIBLE — there is nothing inside them to crease. Gating on
	// them fails the build for a defect no player can see, and the first thing
	// anyone does with a gate that cries wolf is delete it.
	//
	// Seven samples per triangle (corners, edge midpoints, centroid) rather than
	// a full rasterisation: a triangle here is about 32x26px, so a sliver of ink
	// small enough to slip between all seven is smaller than the anti-aliased
	// edge around it.
	const OPAQUE = 8;
	const alphaAt = (x, y) => {
		const px = Math.min(pngW - 1, Math.max(0, Math.round(x)));
		const py = Math.min(pngH - 1, Math.max(0, Math.round(y)));
		return alpha[py * pngW + px];
	};
	const inked = tris.map(([i, j, k]) => {
		const p = rig.verts[i];
		const q = rig.verts[j];
		const r = rig.verts[k];
		const samples = [
			p, q, r,
			[(p[0] + q[0]) / 2, (p[1] + q[1]) / 2],
			[(q[0] + r[0]) / 2, (q[1] + r[1]) / 2],
			[(r[0] + p[0]) / 2, (r[1] + p[1]) / 2],
			[(p[0] + q[0] + r[0]) / 3, (p[1] + q[1] + r[1]) / 3],
		];
		return samples.some(([x, y]) => alphaAt(x, y) > OPAQUE);
	});
	const inkedCount = inked.filter(Boolean).length;
	if (inkedCount < tris.length * 0.15) {
		fail(`${who}: only ${inkedCount} of ${tris.length} triangles carry any ink — the rig and the texture do not line up`);
		continue;
	}
	note(`${who} ${inkedCount} of ${tris.length} triangles carry ink; the rest are empty margin and are not gated`);

	/* ── rule 11: the arm bones are ON the arms ────────────────────────────────
	 *
	 * Rule 10 cannot see this. Proven on Hard Time, the reskin of this game:
	 * its old rig, whose arm bones sat on the trousers, PASSED rule 10 with these
	 * tables, because an arm bone that owns trousers instead of an arm bends the
	 * trousers a little and leaves the arm alone — nothing folds, and nothing
	 * reacts either. This game's own v3 rig had arm_l on the scarf and arm_r on
	 * the cigar smoke.
	 *
	 * So: on the inked vertices inside each arm region (traced off the drawing,
	 * design/cast_guy_arm_regions.json — the same file the rig builder reads),
	 * that arm's own two bones must own at least `own_floor` of the weight.
	 */
	const regions = JSON.parse(fs.readFileSync(path.join(appRoot, 'design/cast_guy_arm_regions.json'), 'utf8'));
	if (path.join(appRoot, 'static/assets', regions.texture) !== pngPath) {
		fail(`${who}: cast_guy_arm_regions.json was traced on ${regions.texture} but the mesh gates ${path.relative(appRoot, pngPath)} — re-trace the arms on the new drawing`);
	}
	// Points ON an edge count as inside — vertices sit on the lattice and the
	// traced seams often run along it (the cigar sleeve's seam is x=320, a
	// lattice column). build_cast_guy_rig.py uses this exact test, and reads ink
	// the same way alphaAt does here (alpha at the vertex, rounded; the size
	// check above makes that the vertex's UV), so both count the same vertices.
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
			.filter(([v]) => inside(v, poly) && alphaAt(v[0], v[1]) > OPAQUE)
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
		note(`${who} ${spill ? 'spill' : 'arm  '} ${label.padEnd(26)} ${verts.length} inked verts, arm_${side}+fore_${side} own ${mean.toFixed(2)}`);
	}
	const signedAreas = (v) => {
		const areas = new Float64Array(tris.length);
		for (let t = 0; t < tris.length; t += 1) {
			const [i, j, k] = tris[t];
			const px = v[i * 2], py = v[i * 2 + 1];
			const qx = v[j * 2], qy = v[j * 2 + 1];
			const rx = v[k * 2], ry = v[k * 2 + 1];
			areas[t] = 0.5 * ((qx - px) * (ry - py) - (rx - px) * (qy - py));
		}
		return areas;
	};
	const poseAt = (state) => {
		composeBoneMatrices(rig, state, matrices);
		skinVertices(rest, index, matrices, out);
		return signedAreas(out);
	};

	const a0 = signedAreas(rest);
	// Which bone owns a triangle, for the report. A failure that says only "a
	// triangle folded" sends you looking at all ten; naming the joint and the
	// pixel turns it into one thing to open the PNG and look at.
	const triBone = tris.map(([i, j, k]) => {
		const total = new Array(rig.bones.length).fill(0);
		for (const v of [i, j, k]) rig.weights[v].forEach((w, b) => (total[b] += w));
		return rig.bones[total.indexOf(Math.max(...total))].name;
	});
	const triCentre = tris.map(([i, j, k]) => [
		Math.round((rig.verts[i][0] + rig.verts[j][0] + rig.verts[k][0]) / 3),
		Math.round((rig.verts[i][1] + rig.verts[j][1] + rig.verts[k][1]) / 3),
	]);
	const measure = (areas, acc) => {
		for (let t = 0; t < areas.length; t += 1) {
			if (!inked[t]) continue;
			if (Math.sign(areas[t]) !== Math.sign(a0[t])) acc.flips += 1;
			const ratio = Math.abs(areas[t]) / Math.max(Math.abs(a0[t]), 1e-9);
			if (ratio < acc.shrink) {
				acc.shrink = ratio;
				acc.shrinkAt = t;
			}
			if (ratio > acc.grow) {
				acc.grow = ratio;
				acc.growAt = t;
			}
		}
	};
	const where = (t) => (t === undefined ? 'nowhere' : `${triBone[t]} at ${triCentre[t][0]},${triCentre[t][1]}px`);

	// (a) the idle, which runs forever and is therefore the one that has to be
	//     clean at every instant rather than merely survivable
	const idleAcc = { flips: 0, shrink: 1, grow: 1, shrinkAt: undefined, growAt: undefined };
	const STEPS = 48;
	for (let i = 0; i < STEPS; i += 1) {
		measure(
			poseAt({ timeMs: (i * LOOP_MS) / STEPS, tier: REST_TIER, reactionAge: null, durationMs: 1, speed: 1, motionScale }),
			idleAcc,
		);
	}
	if (idleAcc.flips) fail(`${who} IDLE FOLD: ${idleAcc.flips} triangle inversion(s) across the ${(LOOP_MS / 1000).toFixed(0)}s loop — the art creases over itself while merely standing`);
	if (idleAcc.shrink < FOLD_FLOOR) fail(`${who} IDLE FOLD: smallest triangle collapses to ${(idleAcc.shrink * 100).toFixed(0)}% of its rest area (floor ${FOLD_FLOOR * 100}%) at ${where(idleAcc.shrinkAt)}`);
	if (idleAcc.grow > STRETCH_CAP) fail(`${who} IDLE STRETCH: worst triangle grows to ${idleAcc.grow.toFixed(2)}x (cap ${STRETCH_CAP.toFixed(2)}x) at ${where(idleAcc.growAt)} — the pixels inside it visibly smear`);
	note(`${who} idle fold ${(idleAcc.shrink * 100).toFixed(0)}%  stretch ${idleAcc.grow.toFixed(2)}x  flips ${idleAcc.flips}`);

	// (b) each reaction, sampled at 8 TRIGGER PHASES. The reaction lands on
	//     whatever the idle happens to be doing, and the worst case is a phase
	//     thing: the same table is fine landing on one part of the sway and
	//     folds landing on another. Sampling only at t=0 is how a defect that
	//     appears one spin in eight ships.
	for (const tierName of TIER_ORDER) {
		const tier = TIERS[tierName];
		if (!tier) continue;
		const acc = { flips: 0, shrink: 1, grow: 1, shrinkAt: undefined, growAt: undefined };
		let rotationOnly = 1;
		const tail = Math.max(0, ...Object.values(tier.bones).map(([, lag]) => lag));
		for (let phase = 0; phase < 8; phase += 1) {
			const start = (phase * LOOP_MS) / 8;
			for (let i = 0; i <= 24; i += 1) {
				const age = (i * (tier.durationMs + tail)) / 24;
				const state = { timeMs: start + age, tier, reactionAge: age, durationMs: tier.durationMs, speed: 1, motionScale };
				measure(poseAt(state), acc);
				// the same pose WITHOUT squash and stretch, so a stretch failure
				// says how much of the budget the shape channel is spending. That
				// channel is `scale` and its `flutter`; rise / stretch / lean are
				// on the root, move the figure rigidly and change no triangle's
				// area, so stripping them would measure nothing
				const flat = poseAt({ ...state, tier: { ...tier, scale: undefined, flutter: undefined } });
				for (let t = 0; t < flat.length; t += 1) {
					if (!inked[t]) continue;
					rotationOnly = Math.max(rotationOnly, Math.abs(flat[t]) / Math.max(Math.abs(a0[t]), 1e-9));
				}
			}
		}
		if (acc.flips) fail(`${who}/${tierName} REACTION FOLD: ${acc.flips} triangle inversion(s) across 8 trigger phases — the mesh creases at some sway phases and not others`);
		if (acc.shrink < FOLD_FLOOR) {
			fail(
				`${who}/${tierName} REACTION FOLD: smallest triangle collapses to ${(acc.shrink * 100).toFixed(0)}% of its rest area (floor ${FOLD_FLOOR * 100}%) at ${where(acc.shrinkAt)} — every joint is inside its angle limit and the drawing still folds there, so the fix is the rig or the art, not the table. BEFORE TOUCHING THE TABLE, look at the worst triangle's vertex weights: every fold measured on this figure has been a WEIGHT CLIFF — one vertex 100% on an arm bone beside one 0% on it, with no vertex sampling the fade between (a grid cell is 32px, the old fade was 12px). That is a rig fault, fixed in design/build_cast_guy_rig.py (smooth_on_grid), not a table fault. And check the arm bones are ON the arms at all: the v3 rig had arm_l on the scarf and arm_r on the cigar smoke, so every 'arm' number moved the torso. What does NOT work: a finer mesh (smaller triangles concentrate the same shear; this 50% floor is calibrated to 16x40), and MOTION_SCALE (it hides the fold rather than fixing it)`,
			);
		}
		if (acc.grow > STRETCH_CAP) {
			fail(
				`${who}/${tierName} REACTION STRETCH: worst triangle grows to ${acc.grow.toFixed(2)}x (cap ${STRETCH_CAP.toFixed(2)}x) at ${where(acc.growAt)}; without squash and stretch it would be ${rotationOnly.toFixed(2)}x, so the shape channel is spending ${(acc.grow - rotationOnly).toFixed(2)} of the budget`,
			);
		}
		note(`${who} ${tierName.padEnd(7)} fold ${(acc.shrink * 100).toFixed(0)}% @ ${where(acc.shrinkAt)}  stretch ${acc.grow.toFixed(2)}x @ ${where(acc.growAt)}  flips ${acc.flips}`);
	}
}

if (problems.length) {
	console.error('\ncheck_cast_motion FAILED');
	for (const p of problems) console.error('  !! ' + p);
	process.exit(1);
}
console.log(`check_cast_motion ok (${TIER_ORDER.length} tiers, ${Object.keys(IDLE).length} idle bones)`);
