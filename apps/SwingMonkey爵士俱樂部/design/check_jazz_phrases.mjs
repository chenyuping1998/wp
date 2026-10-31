import assert from 'node:assert/strict';
import { JAZZ_HITS, noteProgress, attackEnergy } from '../src/game/meshWin/phrase.ts';
import { register } from 'node:module';
register('data:text/javascript,' + encodeURIComponent(`export async function resolve(s,c,next){try{return await next(s,c);}catch(e){if(s.startsWith('.')&&!s.endsWith('.ts'))return next(s+'.ts',c);throw e;}}`));
const { drawInstrumentAccents } = await import('../src/game/meshWin/instrumentAccents.ts');
const { writePerformanceAffine } = await import('../src/game/meshWin/performanceAffine.ts');
const { buildRig, restPose, skin } = await import('../src/game/meshWin/meshRig.ts');

// Attached FX must agree with the actual mesh renderer under squash, rotation,
// lift and a different feet pivot, not just when the symbol is at rest.
const rig = buildRig({ grid: { x0: 0, y0: 0, x1: 256, y1: 256, cols: 2, rows: 2 }, soft: 1,
	parts: [{ name: 'root', pivot: [128, 240], dist: () => 0 }] });
const vertices = new Float32Array(rig.rest.length), affine = new Float64Array(6);
for (const feet of [200, 244]) for (const rotation of [-18, 0, 18]) for (const squash of [0.85, 1, 1.15]) {
	const pose = restPose(rig);
	pose.rigid = { sx: squash, sy: 2 - squash, rot: rotation, pop: 1.2, dx: 9, dy: -31 };
	skin(rig, pose, feet, vertices); writePerformanceAffine(pose.rigid, feet, affine);
	for (let i = 0; i < rig.rest.length; i += 2) {
		const x = rig.rest[i], y = rig.rest[i + 1];
		assert.ok(Math.abs(affine[0] * x + affine[2] * y + affine[4] - vertices[i]) < 0.00005, 'FX x drifts off mesh');
		assert.ok(Math.abs(affine[1] * x + affine[3] * y + affine[5] - vertices[i + 1]) < 0.00005, 'FX y drifts off mesh');
	}
}

const methods = new Set();
const pen = new Proxy({}, { get: (_, method) => (...args) => {
	methods.add(method);
	for (const value of args.flatMap(arg => typeof arg === 'object' ? Object.values(arg) : [arg]))
		assert.ok(typeof value !== 'number' || Number.isFinite(value), `${String(method)} has a non-finite parameter`);
	return pen;
} });
for (const [symbol, hits] of Object.entries(JAZZ_HITS)) {
	for (const speed of [1, 1.6, 3.2]) {
		for (let frame = 0; frame <= Math.ceil(1440 / speed / (1000 / 120)) + 1; frame++) {
			const t = frame * (1000 / 120) * speed;
			const energy = attackEnergy(t, hits);
			assert.ok(energy >= 0 && energy <= 1);
			for (const hit of hits) {
				const phase = noteProgress(t, hit, 1440);
				assert.ok(phase === null || phase > 0 && phase < 1);
				if (t >= 1408) assert.equal(phase, null, `${symbol}: truncated final note`);
			}
			methods.clear(); drawInstrumentAccents(pen, symbol, t);
			if (t >= 1440) assert.equal(methods.size, 0, `${symbol}: stale accent after phrase`);
		}
	}
	methods.clear(); drawInstrumentAccents(pen, symbol, hits[0] + 80);
	const expected = { H1: 'arc', H2: 'quadraticCurveTo', H3: 'ellipse', H4: 'circle', S: 'arc', W: 'lineTo' }[symbol];
	if (expected) assert.ok(methods.has(expected), `${symbol}: missing instrument-specific gesture`);
}
assert.equal(JAZZ_HITS.H3.length, 6, 'The final drum flam needs both strokes');
assert.equal(noteProgress(100, 90, 100), null, 'No room for a note before removal');
console.log('Jazz phrase QA passed: FX track the actual skinned mesh, finite instrument gestures, six-hit flam, complete note tails at normal/turbo speeds.');
