import assert from 'node:assert/strict';
import { register } from 'node:module';
register('data:text/javascript,' + encodeURIComponent(`export async function resolve(s,c,next){try{return await next(s,c);}catch(e){if(s.startsWith('.')&&!s.endsWith('.ts'))return next(s+'.ts',c);throw e;}}`));
const { H1, H2, H3, H4 } = await import('../src/game/meshWin/instrumentWins.ts');
const { buildRig, restRigid } = await import('../src/game/meshWin/meshRig.ts');
const specs = [H1, H2, H3, H4];
const rigs = specs.map(s => buildRig(s.rig));
const at = (index, time, name) => {
	const rig = rigs[index]; return specs[index].pose(rig, time).bones[rig.bones.findIndex(b => b.name === name)];
};
for (let i = 0; i < specs.length; i++) {
	for (let time = 0; time <= 1600; time += 5) {
		const pose = specs[i].pose(rigs[i], time);
		assert.deepEqual(pose.rigid, restRigid(), `${specs[i].symbol}: whole picture is moving`);
		assert.equal(pose.air, 0, 'A grounded instrument must not float');
		assert.equal(pose.plateHit, 1, 'The card must not pulse');
	}
}
// Both sticks prepare above the head, contact on the score, then bounce away.
for (const [name, hit, direction] of [['stickL', 300, -1], ['stickR', 490, 1]]) {
	assert.ok(at(2, hit - 66.667, name).angle * direction > 7);
	assert.ok(Math.abs(at(2, hit, name).angle) < 0.0001);
	assert.ok(at(2, hit + 16.667, name).angle * direction < 0);
	assert.ok(at(2, hit + 66.667, name).angle * direction > 1);
}
assert.ok(at(2, 333.333, 'head').dy > 1, 'Drum skin must answer after contact');
const cross = [-112 / Math.hypot(28,112), 28 / Math.hypot(28,112)];
const projection = b => b.dx * cross[0] + b.dy * cross[1];
assert.ok(projection(at(1, 220 - 33.333, 'strings')) < -1, 'Bass string must pull before release');
assert.ok(projection(at(1, 240, 'strings')) > 2, 'Bass string must snap across after release');
assert.ok(at(3, 220 - 33.333, 'strum').dx < -1, 'Banjo must prepare its stroke');
assert.ok(at(3, 220 + 33.333, 'strum').dx > 1, 'Banjo stroke must cross the strings');
assert.ok(Math.abs(at(0, 306.667, 'neck').angle) > 1, 'Sax neck needs delayed follow-through');
console.log('Grounded performance QA passed: no whole-symbol transform; stick contact/rebound, drum-head response, bass pull/release, banjo strum and sax follow-through verified.');
