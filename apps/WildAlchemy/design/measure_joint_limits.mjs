/**
 * Where each joint of the prisoner's mesh starts to fold — the GEOMETRIC pass
 * behind check_cast_motion.mjs's JOINT_LIMIT_DEG.
 *
 *     node design/measure_joint_limits.mjs
 *
 * Each joint rotated ALONE, idle off, in 0.5deg steps in BOTH directions (the
 * idle swings both ways), until an inked triangle folds under 50% of its rest
 * area, stretches past 1.6x or inverts — rule 10's own thresholds. The number
 * printed is the last angle that passed both ways.
 *
 * A NUMBER HERE IS A CANDIDATE, NOT A LIMIT. It only sees area, and a sleeve
 * sheared into a wedge can keep its area. Every joint has to be rendered at
 * this angle and looked at ZOOMED ON THE HANDS before its row in
 * JOINT_LIMIT_DEG is written (mesh-cast-rig §5): on Capo Nostra that visual
 * pass cut arm_r from 14 to 7 and the neck from 15.5 to 9.
 *
 * Re-run it whenever guy.rig.json or prisoner.png changes. A limit belongs to a
 * drawing AND its weights; this game shipped for weeks enforcing limits measured
 * on another game's man.
 */
import path from 'path';
import { fileURLToPath } from 'url';

import { loadCastMesh } from './lib/castMesh.mjs';

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const motion = await import(path.join(appRoot, 'src/game/castMotion.ts'));
const mesh = loadCastMesh(appRoot, motion);

// Idle off. The module's IDLE table is what composeBoneMatrices reads; zeroing
// its amplitudes in THIS process is the only way to hold one joint still
// without a second copy of the maths. Nothing is written back.
for (const bone of Object.keys(motion.IDLE)) motion.IDLE[bone] = [0, 0, 2000, 0];

const BONES = ['hips', 'waist', 'chest', 'neck', 'head', 'arm_l', 'fore_l', 'arm_r', 'fore_r'];
const STEP = 0.5;
const MAX = 45;

const at = (bone, deg) => {
	const tier = { bones: { [bone]: [deg, 0] }, durationMs: 1000, snap: 0.18, hold: 0.63, rise: 0, stretch: 0, lean: 0 };
	// reactionAge 400 of 1000 sits inside the hold, so the envelope is exactly 1
	return mesh.measure(
		mesh.poseAreas({ timeMs: 0, tier, reactionAge: 400, durationMs: 1000, speed: 1, motionScale: 1 }),
		mesh.newAcc(),
	);
};

console.log(`${path.relative(appRoot, mesh.rigPath)} on ${path.relative(appRoot, mesh.texturePath)} (${mesh.texture.width}x${mesh.texture.height})`);
console.log(`${mesh.inkedCount} of ${mesh.rig.tris.length} triangles carry ink\n`);
console.log('bone     limit   first failure');
for (const bone of BONES) {
	let limit = 0;
	let failure = null;
	for (let deg = STEP; deg <= MAX; deg += STEP) {
		const plus = at(bone, deg);
		const minus = at(bone, -deg);
		const bad = [plus, minus].find((acc) => !mesh.passes(acc));
		if (bad) {
			const sign = bad === plus ? '+' : '-';
			failure =
				`${sign}${deg}: ` +
				(bad.flips ? `${bad.flips} flips, ` : '') +
				`fold ${(bad.shrink * 100).toFixed(0)}% @ ${mesh.where(bad.shrinkAt)}, ` +
				`stretch ${bad.grow.toFixed(2)}x @ ${mesh.where(bad.growAt)}`;
			break;
		}
		limit = deg;
	}
	console.log(`${bone.padEnd(8)} ${String(limit).padStart(5)}   ${failure ?? `clean to ${MAX}`}`);
}
