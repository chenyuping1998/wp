// Lays the Master's `pour` clip (pour_motion.mjs) onto the shipped skeleton
// without regenerating the rig. Idempotent: rerun after editing the motion.
//
// Usage: node design/add_pour_clip.mjs
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { pourClip } from './pour_motion.mjs';

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const file = path.join(appRoot, 'static/assets/spines/sushiMaster/monkey.json');
const raw = fs.readFileSync(file, 'utf8');
const skeleton = JSON.parse(raw);
skeleton.animations.pour = pourClip();
fs.writeFileSync(file, JSON.stringify(skeleton, null, 2) + (raw.endsWith('\n') ? '\n' : ''));
console.log('pour clip written to', path.relative(appRoot, file));
