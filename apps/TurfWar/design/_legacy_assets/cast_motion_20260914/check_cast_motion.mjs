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
import path from 'path';
import { fileURLToPath } from 'url';

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { IDLE_BY_POSE, TIERS_BY_POSE, CAST_POSES, CARRIER, MOTION_SCALE, idleAngle, reactionEnvelope, LOOP_MS } = await import(
	path.join(appRoot, 'src/game/castMotion.ts')
);

const REPORT = process.argv.includes('--report');
const problems = [];
// Every rule below runs once per drawing pose (game/castMotion.ts CAST_POSES),
// against that pose's own tables and measured limits.
let POSE = '';
let IDLE;
let TIERS;
const fail = (m) => problems.push(`[${POSE}] ${m}`);
const note = (m) => REPORT && console.log('   ' + m);

/* ── the measured breaking points ────────────────────────────────────────────
 *
 * Each joint rotated ALONE against static/assets/meshRigs/cast_guy, rendered,
 * and looked at. The number is where the drawing still looked clean; past it
 * the texture shears, because a 16x40 grid cannot carry a large LOCAL bend.
 * Rotation accumulated down the chain is rigid and costs nothing, which is why
 * the tables spread their amplitude instead of loading one joint.
 *
 * PER CHARACTER, because the limit belongs to the DRAWING. Capo Nostra has one:
 * the Don. His shoulders are the tight ones and it is the pose's fault — arms
 * against his sides, about one grid cell wide, nothing across them to absorb a
 * bend (ART_BRIEF.md §1 asks for daylight under the arms for exactly this
 * reason). fore_r is the loose one: that wrist sits at the hand itself and
 * carries almost no blended vertices.
 *
 * Judged at the extremity, not at the silhouette. On the whole figure at
 * viewing size the shoulder looks fine to 8deg; zoomed to the hand, the fingers
 * have already merged into a mitten by then. That mistake is what shipped a
 * visibly broken hand on the other game.
 */
// Measured on the 2026-09-14 REDRAW, one joint at a time, judged zoomed on the bat
// and hands (design/rig/sweep_turf_limits.py ranks, mesh_render.py renders decide).
// base hips 2: the handle kinks under the fist. base fore_l 3: the planted bat's
// foot slides ~7px per degree.
const JOINT_LIMIT_DEG = {
	base: {
		arm_l: 5, arm_r: 6,
		fore_l: 3, fore_r: 10,
		hips: 2, waist: 6, chest: 7, neck: 7, head: 9,
	},
	shoulder: {
		arm_l: 6, arm_r: 6,
		fore_l: 12, fore_r: 10,
		hips: 5, waist: 7, chest: 7, neck: 7, head: 9,
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
for (POSE of CAST_POSES) {
IDLE = IDLE_BY_POSE[POSE];
TIERS = TIERS_BY_POSE[POSE];
const idlePeak = (bone) => {
	const spec = IDLE[bone];
	if (!spec) return 0;
	let peak = 0;
	for (let t = 0; t <= LOOP_MS * 5; t += 5) peak = Math.max(peak, Math.abs(idleAngle(spec, t)));
	return peak;
};

// ── rule 1: no joint may be driven past where the mesh was measured to tear ──
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

// ── rule 3: the follow-chain. Each link starts LATER than its parent ─────────
//
// The difference between a body reacting and a body twitching. Every bone
// sharing one lag reads as a single rigid snap, and no amount of extra
// amplitude fixes it.
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
		if (present.length > 2) {
			const spread = tier.bones[present[present.length - 1]][1] - tier.bones[present[0]][1];
			if (spread <= 0) {
				fail(`${tierName}: chain ${present.join('->')} has no lag spread at all — every bone snaps together`);
			}
			note(`${tierName.padEnd(7)} chain ${present.join('->')} spreads ${spread}ms`);
		}
	}
}

// ── rule 4: the tiers must actually escalate ─────────────────────────────────
//
// A big win that moves the figure less than a small one is worse than having no
// tiers at all — it tells the player the opposite of the truth. The rigid
// whole-body moves count, because on this figure they carry a real part of the
// difference between the rungs.
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
// Measured by rotating each bone and tracking where the hand goes: arm_l at
// +10deg moves that hand 44px OUTWARD, arm_r at -10deg moves its hand 32px
// outward. So opening the body is arm_l positive / arm_r negative, and each
// forearm follows its own arm.
//
// This is the rule that catches the defect this gate was written for. The
// shipped win and big-win tables had arm_l NEGATIVE and arm_r POSITIVE — the
// Don closing up on a win, and disagreeing with his own feature-trigger pose.
// Positive on the LEFT limbs and negative on the RIGHT opens the body — on both
// poses of the redraw (on the shoulder pose +fore_l is the bat lifting).
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

// ── rule 6: the free end carries multiples of the body ───────────────────────
//
// Miami Mayhem's rule 2: their body held to 1-3.3deg while the hair ran to
// 27.5, four to eight times over. The Don has no hair bone (his is short,
// slicked and sits on the skull — a bone there reads as a wig sliding), so the
// thing that has to carry the amplitude is the free end of the arm chain. A
// forearm that moves like the torso is a torso that is doing the acting.
const FREE_END_MIN_RATIO = 2;
for (const tierName of TIER_ORDER) {
	const tier = TIERS[tierName];
	if (!tier) continue;
	const body = Math.abs(tier.bones.chest?.[0] ?? 0);
	const free = Math.abs(tier.bones[CARRIER[POSE]]?.[0] ?? 0);
	if (body > 0 && free / body < FREE_END_MIN_RATIO) {
		fail(
			`${tierName}: ${CARRIER[POSE]} moves ${(free / body).toFixed(1)}x the chest — the reference measured 4-8x for a free end, and under ${FREE_END_MIN_RATIO}x the body is doing the acting`,
		);
	}
	note(`${tierName.padEnd(7)} ${CARRIER[POSE]}/chest ratio ${(free / body).toFixed(1)}x`);
}

// ── rule 6b: the HEAD is body, and body stays small ─────────────────────────
//
// Rule 6 compares the free end against the CHEST, which is how a head at 0.88
// of the carrier got shipped: the head is not in that check, and it is the last
// link of a spine that composes, so it accumulates hips+waist+chest+neck under
// it before its own angle is added. That made the measured head travel (80.4px)
// LARGER than the hand (69.7px) on the trigger tier — the opposite of what the
// reference does, and what "頭部位移太多" was.
//
// The reference states the rule in words — 本體小、附屬物大 — and in numbers.
// character_main_girl's reaction, which is the fully written-out one:
//
//     girl_spine2   4.33deg     .23 of the carrier
//     girl_neck     4.97deg     .26
//     girl_head     7.19deg     .38
//     girl_arm_R   18.77deg    1.00   <- the carrier
//
// The ceilings below sit just above those ratios, so the reference itself
// passes with room but a head that starts doing the acting does not.
const HEAD_MAX_RATIO = 0.45;
const NECK_MAX_RATIO = 0.35;
for (const tierName of TIER_ORDER) {
	const tier = TIERS[tierName];
	if (!tier) continue;
	const carrier = Math.abs(tier.bones[CARRIER[POSE]]?.[0] ?? 0);
	if (!carrier) continue;
	for (const [bone, ceiling, ref] of [['head', HEAD_MAX_RATIO, 0.38], ['neck', NECK_MAX_RATIO, 0.26]]) {
		const amp = Math.abs(tier.bones[bone]?.[0] ?? 0);
		const ratio = amp / carrier;
		if (ratio > ceiling) {
			fail(
				`${tierName}: ${bone} is ${ratio.toFixed(2)}x the carrier (${CARRIER[POSE]}) — over ${ceiling}. The reference runs ${ref} there; a head this size travels further than the hand and reads as the whole man lurching`,
			);
		}
		note(`${tierName.padEnd(7)} ${bone}/carrier ${ratio.toFixed(2)}x (ref ${ref})`);
	}
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
const IDLE_BODY_MAX_DEG = 1.5;
const IDLE_BUDGET_SHARE = 0.6;
for (const [bone, spec] of Object.entries(IDLE)) {
	if (Math.abs(spec[0]) > IDLE_BODY_MAX_DEG) {
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

if (problems.length) {
	console.error('\ncheck_cast_motion FAILED');
	for (const p of problems) console.error('  !! ' + p);
	process.exit(1);
}
console.log(`check_cast_motion ok (${CAST_POSES.join(' + ')} poses, ${TIER_ORDER.length} tiers each)`);
