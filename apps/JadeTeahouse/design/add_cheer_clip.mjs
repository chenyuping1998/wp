// Lays both casts' `cheer` (cheer_motion_v2.mjs) onto the shipped skeletons
// without regenerating the rigs — the Master's shipped `pour` is newer than
// what the generator emits, so a full regeneration would roll it back.
// Idempotent: rerun after editing the motion.
//
// Usage: node design/add_cheer_clip.mjs
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { cheerBones, cheerFace } from './cheer_motion_v2.mjs';

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
for (const [cast, dir] of [['mg', 'sushiMaster'], ['fg', 'sushiApprentice']]) {
	const file = path.join(appRoot, 'static/assets/spines', dir, 'monkey.json');
	const raw = fs.readFileSync(file, 'utf8');
	const skeleton = JSON.parse(raw);
	const clip = skeleton.animations.cheer;
	clip.bones = { ...clip.bones, ...cheerBones(cast) };
	clip.slots = { ...clip.slots, head_2_face: cheerFace() };
	fs.writeFileSync(file, JSON.stringify(skeleton, null, 2) + (raw.endsWith('\n') ? '\n' : ''));
	console.log('cheer written to', path.relative(appRoot, file));
}
