// Lays the casts' `bow` clip (bow_motion.mjs) onto the shipped skeletons
// without regenerating the rigs. Idempotent: rerun after editing the motion.
//
// Usage: node design/add_bow_clip.mjs
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { bowClip } from './bow_motion.mjs';

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
for (const dir of ['sushiMaster', 'sushiApprentice']) {
	const file = path.join(appRoot, 'static/assets/spines', dir, 'monkey.json');
	const raw = fs.readFileSync(file, 'utf8');
	const skeleton = JSON.parse(raw);
	skeleton.animations.bow = bowClip(skeleton.animations.cheer.physics, dir === 'sushiMaster');
	fs.writeFileSync(file, JSON.stringify(skeleton, null, 2) + (raw.endsWith('\n') ? '\n' : ''));
	console.log('bow clip written to', path.relative(appRoot, file));
}
