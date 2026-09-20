/**
 * Where each joint of each cast rig starts to fold — the GEOMETRIC pass behind
 * check_cast_motion.mjs's JOINT_LIMIT_DEG.
 *
 *     node design/measure_joint_limits.mjs [--rig=guy|guy_feature|guy_kingpin]
 *
 * Each joint rotated ALONE, idle off, in 0.5deg steps in BOTH directions (the
 * idle swings both ways), until an inked triangle folds under 50% of its rest
 * area, stretches past 1.6x or inverts — rule 10's own thresholds. The number
 * printed is the last angle that passed both ways.
 *
 * A NUMBER HERE IS A CANDIDATE, NOT A LIMIT. It only sees area, and a hand
 * sheared into a spike keeps its area. Every joint has to be rendered at this
 * angle and looked at ZOOMED ON THE HANDS AND THE BAT before its row in
 * JOINT_LIMIT_DEG is written (mesh-cast-rig §5): on Hard Time every one of nine
 * joints shipped below its geometric number.
 *
 * Re-run it whenever a rig or a cast texture changes. A limit belongs to a
 * drawing AND its weights.
 */
import path from 'path';
import { fileURLToPath } from 'url';

import { loadCastMesh } from './lib/castMesh.mjs';

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const motion = await import(path.join(appRoot, 'src/game/castMotion.ts'));

// Idle off. composeBoneMatrices reads IDLE_BY_POSE, whose tables are the module's
// own objects; zeroing them in THIS process is the only way to hold one joint
// still without a second copy of the maths. Nothing is written back.
for (const table of new Set(Object.values(motion.IDLE_BY_POSE)))
	for (const bone of Object.keys(table)) table[bone] = [0, 0, 2000, 0];

const BONES = ['hips', 'waist', 'chest', 'neck', 'head', 'arm_l', 'fore_l', 'arm_r', 'fore_r'];
const STEP = 0.5;
const MAX = 45;

const only = process.argv.find((a) => a.startsWith('--rig='))?.slice(6);
for (const [stem, pose] of Object.entries(motion.RIG_POSE)) {
	if (only && only !== stem) continue;
	const mesh = loadCastMesh(appRoot, motion, {
		rigPath: path.join(appRoot, `static/assets/meshRigs/cast_guy/${stem}.rig.json`),
	});
	const at = (bone, deg) => {
		const tier = { bones: { [bone]: [deg, 0] }, durationMs: 1000, snap: 0.18, hold: 0.63, rise: 0, stretch: 0, lean: 0 };
		// reactionAge 400 of 1000 sits inside the hold, so the envelope is exactly 1
		return mesh.measure(
			mesh.poseAreas({ timeMs: 0, pose, tier, reactionAge: 400, durationMs: 1000, speed: 1, motionScale: 1 }),
			mesh.newAcc(),
		);
	};

	console.log(`\n${path.relative(appRoot, mesh.rigPath)} (${pose}) on ${path.relative(appRoot, mesh.texturePath)} (${mesh.texture.width}x${mesh.texture.height})`);
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
}
