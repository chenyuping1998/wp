/**
 * The cast's motion tables, measured rather than trusted.
 *
 *     node design/check_cast_motion.mjs [--report]
 *
 * WHY THIS EXISTS
 *
 * The mesh cast shipped with NO gate of any kind, and it shows: the win
 * reaction that reached production peaked at 0.41 degrees — under 3px of travel
 * on a 400px figure — and had its arm terms NEGATIVE, so the most frequent
 * reaction in the game was the girl lowering her raygun on a win. Neither fact
 * was caught by anything, because nothing was looking.
 *
 * Every threshold below is either a number measured off the rendered mesh
 * (design/, 2026-09-02: one joint rotated at a time until the texture visibly
 * tore) or a rule measured off Hacksaw's Miami Mayhem cast
 * (docs/handoff/hot_miami.md, 2026-08-27). None of them are taste.
 */
import path from 'path';
import { fileURLToPath } from 'url';

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { IDLE, TIERS, MOTION_SCALE, idleAngle, reactionEnvelope } = await import(
	path.join(appRoot, 'src/game/castMotion.ts')
);

const REPORT = process.argv.includes('--report');
const problems = [];
const fail = (m) => problems.push(m);
const note = (m) => REPORT && console.log('   ' + m);

/* ── the measured breaking points ────────────────────────────────────────────
 *
 * Each joint rotated alone, in isolation, rendered, and looked at. The number
 * is where the mesh still looked clean; past it the texture shears because a
 * coarse grid cannot carry a large LOCAL bend. Accumulated rotation down the
 * chain is rigid and costs nothing, which is why the tables spread their
 * amplitude instead of loading one joint.
 */
/* PER CHARACTER, because the limit belongs to the DRAWING and the two are drawn
 * differently. The man's arms hang against his body about one grid cell wide,
 * with nothing to absorb a bend; the woman holds hers out with several cells
 * across it.
 *
 * The man's numbers are lower than the first sweep reported, and that gap is
 * the lesson: the sweep judged the whole figure at viewing size and called the
 * elbow clean to 15deg. Zoomed to the hand, his fingers were being drawn to a
 * point from about 7 and only recovered near 5. Measure at the extremity, not
 * at the silhouette. */
const JOINT_LIMIT_DEG = {
	girl: {
		arm_l: 10, arm_r: 10, fore_l: 15, fore_r: 15,
		hips: 20, waist: 20, chest: 20, neck: 45, head: 45,
		// a free appendage: nothing hangs off it and it has no body to tear from
		hair: 30,
	},
	guy: {
		arm_l: 5, arm_r: 5, fore_l: 6, fore_r: 6,
		hips: 20, waist: 20, chest: 20, neck: 45, head: 45,
		hair: 30,
	},
};

// The chain order motion has to travel along: a link may not start before the
// link it hangs from.
const CHAINS = [
	['hips', 'waist', 'chest', 'neck', 'head', 'hair'],
	['chest', 'arm_l', 'fore_l'],
	['chest', 'arm_r', 'fore_r'],
];

const TIER_ORDER = ['win', 'winBig', 'trigger'];

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
			// what the joint ACTUALLY reaches: the tier scaled to this figure,
			// on top of an idle that never stops running
			const peak = Math.abs(amplitude) * scale + Math.abs(IDLE[bone]?.[0] ?? 0) * 1.9;
			if (peak > limit) {
				fail(
					`${who}/${tierName}: ${bone} reaches ${peak.toFixed(1)}deg against a measured limit of ${limit} — the mesh tears here`,
				);
			}
			note(`${who.padEnd(5)} ${tierName.padEnd(8)} ${bone.padEnd(7)} peak ${peak.toFixed(1).padStart(5)}deg  limit ${limit}`);
		}
	}
}

// ── rule 2: a reaction must be visible at all ────────────────────────────────
//
// The bar the shipped table failed. A figure is drawn ~400px tall; a degree of
// rotation at the shoulder moves the hand about 7px, which is the least that
// registers as movement rather than as noise.
const MIN_VISIBLE_DEG = 3;
for (const tierName of TIER_ORDER) {
	const tier = TIERS[tierName];
	if (!tier) continue;
	const largest = Math.max(...Object.values(tier.bones).map(([a]) => Math.abs(a)));
	if (largest < MIN_VISIBLE_DEG) {
		fail(`${tierName}: largest amplitude is ${largest}deg — under ${MIN_VISIBLE_DEG} nothing is visible on screen`);
	}
}

// ── rule 3: the follow-chain. Each link starts LATER than its parent ─────────
//
// Miami Mayhem's rule 3, and the difference between a body reacting and a body
// twitching. Every bone sharing one lag reads as a single rigid snap.
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
				fail(`${tierName}: chain ${present.join('→')} has no lag spread at all — every bone snaps together`);
			}
			note(`${tierName.padEnd(8)} chain ${present.join('→')} spreads ${spread}ms`);
		}
	}
}

// ── rule 4: the tiers must actually escalate ─────────────────────────────────
//
// A big win that moves the figure less than a small one is worse than having no
// tiers at all — it tells the player the opposite of the truth.
const energy = (tier) =>
	Object.values(tier.bones).reduce((sum, [a]) => sum + Math.abs(a), 0) + tier.rise * 100 + tier.stretch * 100;
for (let i = 1; i < TIER_ORDER.length; i += 1) {
	const lower = TIERS[TIER_ORDER[i - 1]];
	const upper = TIERS[TIER_ORDER[i]];
	if (!lower || !upper) continue;
	if (energy(upper) <= energy(lower)) {
		fail(
			`${TIER_ORDER[i]} (${energy(upper).toFixed(1)}) does not move more than ${TIER_ORDER[i - 1]} (${energy(lower).toFixed(1)})`,
		);
	}
	note(`${TIER_ORDER[i - 1]} ${energy(lower).toFixed(1)} → ${TIER_ORDER[i]} ${energy(upper).toFixed(1)}`);
}

// ── rule 5: the appendage carries multiples of the body ──────────────────────
//
// Miami Mayhem's rule 2, the one this rig obeyed least: their body held to
// 1-3.3deg while the hair ran to 27.5, four to eight times over. A hair bone
// that moves like the torso is a bone that was not worth adding.
const APPENDAGE_MIN_RATIO = 2;
for (const tierName of TIER_ORDER) {
	const tier = TIERS[tierName];
	if (!tier?.bones.hair) continue;
	const body = Math.abs(tier.bones.chest?.[0] ?? 0);
	const hair = Math.abs(tier.bones.hair[0]);
	if (body > 0 && hair / body < APPENDAGE_MIN_RATIO) {
		fail(
			`${tierName}: hair moves ${(hair / body).toFixed(1)}x the chest — the reference measured 4-8x, and under ${APPENDAGE_MIN_RATIO}x the bone is not earning its place`,
		);
	}
	note(`${tierName.padEnd(8)} hair/chest ratio ${(hair / body).toFixed(1)}x`);
}
if (!IDLE.hair) fail('IDLE has no hair entry — the appendage is dead while the figure is standing still');

// ── rule 6: the envelope has to finish ───────────────────────────────────────
//
// The reaction is cleared on age >= 1.4 (skinnedFigure.ts). Any bone lagged
// past that fraction of the duration is cut off mid-swing.
const CLEAR_AT = 1.4;
for (const tierName of TIER_ORDER) {
	const tier = TIERS[tierName];
	if (!tier) continue;
	for (const [bone, [, lag]] of Object.entries(tier.bones)) {
		const finishes = 1 + lag / tier.durationMs;
		if (finishes > CLEAR_AT) {
			fail(
				`${tierName}: ${bone} lags ${lag}ms and would still be moving at age ${finishes.toFixed(2)}, past the ${CLEAR_AT} cutoff`,
			);
		}
	}
}

// ── rule 7: idle stays small, because it runs forever ────────────────────────
//
// A reaction is a beat; the idle is the state the figure is in for whole
// minutes. The review that rejected this game called out animation, and a large
// permanent sway is what that failure looked like the first time.
const IDLE_BODY_MAX_DEG = 1.5;
for (const [bone, spec] of Object.entries(IDLE)) {
	if (bone === 'hair') continue;
	if (Math.abs(spec[0]) > IDLE_BODY_MAX_DEG) {
		fail(`IDLE ${bone} is ${spec[0]}deg — the body must stay under ${IDLE_BODY_MAX_DEG} while merely standing`);
	}
}

// ── rule 8: the envelope is actually an envelope ─────────────────────────────
if (reactionEnvelope(0) !== 0 || reactionEnvelope(1) !== 0) {
	fail('reactionEnvelope does not start and end at rest — the figure would snap at the boundary');
}
if (reactionEnvelope(0.4) < 0.99) fail('reactionEnvelope does not reach full amplitude at its hold');
{
	// the idle must actually produce motion, not merely declare it
	const samples = [0, 400, 900, 1500, 2300, 3100].map((t) => idleAngle(IDLE.head, t));
	const span = Math.max(...samples) - Math.min(...samples);
	if (span < 0.05) fail(`the head's idle spans only ${span.toFixed(3)}deg across a cycle — it is standing still`);
	note(`idle head spans ${span.toFixed(2)}deg`);
}

if (problems.length) {
	console.error('\ncheck_cast_motion FAILED');
	for (const p of problems) console.error('  !! ' + p);
	process.exit(1);
}
console.log(`check_cast_motion ok (${TIER_ORDER.length} tiers, ${Object.keys(IDLE).length} idle bones)`);
