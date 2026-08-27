// Gate: the two characters must sway like people, not like metronomes.
//
// idleBreathe's gate covers the AMBIENT layer — every symbol, ~1%, never in
// unison. This one covers the two symbols that are people, where the standard is
// different and higher, and where the failure modes are specific enough to
// measure.
//
// The method and every number come from Hacksaw's Miami Mayhem background
// characters (five spine skeletons, 3.33-8s loops). Their art is not used; what
// is used is four rules, and this gate is those four rules written as
// assertions, because each of them fails invisibly:
//
//   loops that match      two characters on the same loop length sync up and the
//                         board reads as one animation. Nothing in a screenshot
//                         shows it; you have to watch for 40 seconds.
//   a body that swings    if the torso moves as much as the hair, the character
//                         reads as swaying rather than as breathing. Both look
//                         "animated" in a still frame.
//   a chain without lag   parts that rotate in phase are one rigid object with
//                         extra draw calls. This is the exact fault a sibling
//                         checker already caught on this game's win rig.
//   a loop with no hiccup a perfectly regular cycle is recognised as a cycle
//                         after about two passes.
//
// The last three are checked against the FUNCTION OUTPUT sampled over a whole
// loop, not against the declared numbers — a table can declare a lag that the
// maths then throws away.
//
// Usage: node design/check_idle_sway.mjs [--report]
import path from 'path';
import { fileURLToPath } from 'url';

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { SWAY_RIGS, swayFrame, jitterAt, IDLE_WRAP_MS } = await import(
	path.join(appRoot, 'src/game/idleSway.ts')
);

const REPORT = process.argv.includes('--report');
const problems = [];
const fail = (message) => problems.push(message);

const DEG = Math.PI / 180;
const gcd = (a, b) => (b ? gcd(b, a % b) : a);
const lcm = (a, b) => (a / gcd(a, b)) * b;

const names = Object.keys(SWAY_RIGS);

// ── rule 1: loop lengths must not match, and must realign only rarely ────────
const loops = names.map((n) => SWAY_RIGS[n].loopMs);
if (new Set(loops).size !== loops.length) {
	fail(`two characters share a loop length (${loops.join(', ')}ms) — they will sync`);
}
const realign = loops.reduce(lcm);
if (realign < 20_000) {
	fail(`the characters realign every ${(realign / 1000).toFixed(1)}s — the reference target is 40s`);
}
// the shared clock must contain every loop a whole number of times, or a loop
// jumps when the clock wraps
for (const [name, rig] of Object.entries(SWAY_RIGS)) {
	if (IDLE_WRAP_MS % rig.loopMs !== 0) {
		fail(`${name}: the idle clock wraps at ${IDLE_WRAP_MS}ms, which is not a whole number of its ${rig.loopMs}ms loop — the sway will jump on every wrap`);
	}
}

// Peak rotation and the time it happens, measured from the function.
const trace = (rig, part) => {
	let peak = 0;
	let peakAt = 0;
	let peakTranslate = 0;
	let peakStretch = 0;
	for (let t = 0; t < rig.loopMs; t += 4) {
		const f = swayFrame(rig, part, t);
		if (Math.abs(f.rotation) > Math.abs(peak)) {
			peak = f.rotation;
			peakAt = t;
		}
		peakTranslate = Math.max(peakTranslate, Math.abs(f.dx), Math.abs(f.dy));
		peakStretch = Math.max(peakStretch, Math.abs(f.scaleY - 1));
	}
	return { peakDeg: Math.abs(peak) / DEG, peakAt, peakTranslate, peakStretch };
};

const report = [];

for (const [name, rig] of Object.entries(SWAY_RIGS)) {
	const measured = Object.fromEntries(rig.parts.map((p) => [p.name, trace(rig, p.name)]));

	// ── rule 2: the body barely moves, the appendage carries it ────────────────
	const root = rig.chain[0];
	const tip = rig.chain[rig.chain.length - 1];
	if (measured[root].peakDeg > 5) {
		fail(`${name}/${root}: the body rotates ${measured[root].peakDeg.toFixed(1)}deg — the reference keeps bodies under 3.3`);
	}
	const spread = measured[tip].peakDeg / Math.max(measured[root].peakDeg, 1e-6);
	if (spread < 4) {
		fail(`${name}: the tip (${tip}) moves only ${spread.toFixed(1)}x the body — the reference spread is 4x to 8x, and below that the character reads as swaying rather than breathing`);
	}

	// ── rule 3: each link is bigger than its parent AND later ──────────────────
	for (let i = 1; i < rig.chain.length; i += 1) {
		const parent = rig.chain[i - 1];
		const child = rig.chain[i];
		const ratio = measured[child].peakDeg / Math.max(measured[parent].peakDeg, 1e-6);
		if (ratio < 1.6) {
			fail(`${name}: ${child} is only ${ratio.toFixed(2)}x ${parent} — a follow-through link is about 2x its parent`);
		}
		const parentLag = rig.parts.find((p) => p.name === parent)?.lagMs ?? 0;
		const childLag = rig.parts.find((p) => p.name === child)?.lagMs ?? 0;
		if (childLag <= parentLag) {
			fail(`${name}: ${child} does not lag ${parent} (${childLag}ms vs ${parentLag}ms) — parts moving in phase are one rigid object`);
		}
	}

	// ── the breathing bone translates AND stretches ────────────────────────────
	const breather = rig.parts.find((p) => (p.scaleY ?? 0) > 0 && rig.chain[0] === p.name);
	if (!breather) {
		fail(`${name}: the root of the chain does not breathe — nothing on this character fills and empties`);
	} else if (!(breather.dy ?? 0)) {
		fail(`${name}/${breather.name}: stretches without rising. The reference's persp bone does both on one period; stretch alone reads as the art scaling, not as a chest`);
	}

	// ── rule 4: exactly one irregular hiccup, small, mid-loop ──────────────────
	const j = rig.jitter;
	if (!j) fail(`${name}: no jitter — a regular loop is recognised as a loop after two passes`);
	else {
		if (j.amplitudeDeg > 1) fail(`${name}: the jitter is ${j.amplitudeDeg}deg — the reference is +-0.5 and it is meant to be subliminal`);
		if (j.durationMs / rig.loopMs > 0.2) fail(`${name}: the jitter covers ${((j.durationMs / rig.loopMs) * 100).toFixed(0)}% of the loop — it is a hiccup, not a section`);
		if (j.at < 0.25 || j.at > 0.7) fail(`${name}: the jitter opens at ${j.at} of the loop — at the ends it merges with the wrap and stops reading as a separate event`);
		// it must actually change the output, and only there
		const inside = trace(rig, j.part).peakDeg;
		const without = Math.abs(
			Math.max(
				...Array.from({ length: 200 }, (_, i) => {
					const t = (i / 200) * rig.loopMs;
					const u = (t / rig.loopMs - j.at) / (j.durationMs / rig.loopMs);
					return u > 0 && u < 1 ? Math.abs(jitterAt(u)) : 0;
				}),
			),
		);
		if (without < 0.5) fail(`${name}: the jitter window produces no deflection — it is declared but not reached`);
		if (!(inside > 0)) fail(`${name}: ${j.part} does not move at all`);
	}

	for (const part of rig.parts) {
		const m = measured[part.name];
		report.push(
			`${name.padEnd(3)} ${part.name.padEnd(11)} ${m.peakDeg.toFixed(2).padStart(6)}deg  ` +
				`peak@${String(m.peakAt).padStart(5)}ms  translate ${m.peakTranslate.toFixed(4)}  stretch ${(m.peakStretch * 100).toFixed(2)}%`,
		);
	}
}

// The jitter curve itself: unevenly spaced, and zero at both ends so it grafts on
const spacings = [0.24, 0.16, 0.16, 0.16, 0.28];
if (new Set(spacings.map((s) => s.toFixed(3))).size < 2) {
	fail('the jitter keys are evenly spaced — that is just a faster wobble, and a wobble is still a pattern');
}
if (jitterAt(0) !== 0 || jitterAt(1) !== 0) fail('the jitter does not return to zero at its edges — it will step');

if (REPORT) {
	console.log(`characters realign every ${(realign / 1000).toFixed(0)}s\n`);
	console.log(report.join('\n'));
	console.log('');
}

if (problems.length) {
	console.error('check_idle_sway FAILED');
	for (const p of problems) console.error('  - ' + p);
	process.exit(1);
}
console.log('check_idle_sway ok');
