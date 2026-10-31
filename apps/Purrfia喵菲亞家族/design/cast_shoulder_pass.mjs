// Don Whiskers' FRONT shoulder, unseamed (user 2026-10-31: 人物動態身體要接好).
//
// The builder rings each shoulder with 32 thin "facing" strips (alpha 0.01 → 1) that fade a copy of the body's own
// paint over the arm's root, so the sleeve melts into the jacket. On the BACK arm that is what it does: the sleeve
// emerges from under the jacket and the pocket square stays visible. On the FRONT arm the copied paint is the
// jacket's lapel, and the arm piece is already drawn over the lapel — so the strips lay a second, offset lapel on
// top of the sleeve, with a hard horizontal break and stretched fur where the copy ends. It shows at rest and in
// every pose (design/review/cast_shoulder_before_after.png). The sleeve alone rounds over the shoulder cleanly.
//
// So the front strips are switched off at setup (they have no timelines); the back ones stay. Skins and the
// anatomy coverage keep their attachments, so only the rig hash moves.
//
// Run after design/cast_rig_fix_pass.mjs, after every rebuild of the cast. Running it twice changes nothing.
//   node design/cast_shoulder_pass.mjs
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const app = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FILES = ['src/game/characterRigData.json', 'static/assets/spines/donWhiskers43/character.json'].map((f) => path.join(app, f));
const before = fs.readFileSync(FILES[0], 'utf8');
const raw = JSON.parse(before);

let off = 0;
for (const slot of raw.slots)
	if (slot.name.startsWith('shoulder_facing_front_') && slot.attachment) {
		delete slot.attachment;
		off++;
	}
for (const [name, clip] of Object.entries(raw.animations))
	for (const slot of Object.keys(clip.slots ?? {}))
		if (slot.startsWith('shoulder_facing_front_')) throw Error(`${name} animates ${slot}: switch it off there too`);

if (!off) {
	console.log('cast shoulder pass: front facing strips already off');
	process.exit(0);
}
const text = JSON.stringify(raw);
if (fs.readFileSync(FILES[0], 'utf8') !== before) throw Error('characterRigData.json changed while the pass ran — rerun it on the new rig');
for (const f of FILES) fs.writeFileSync(f, text);
const coveragePath = path.join(app, 'design/character-anatomy-coverage.json');
if (fs.existsSync(coveragePath)) {
	const sha = (s) => createHash('sha256').update(s).digest('hex');
	const coverage = JSON.parse(fs.readFileSync(coveragePath, 'utf8'));
	if (coverage.rigSha256 === sha(before)) {
		coverage.rigSha256 = sha(text);
		fs.writeFileSync(coveragePath, JSON.stringify(coverage));
	} else console.log('cast shoulder pass: anatomy coverage was already stale before this pass — left as it is');
}
console.log(`cast shoulder pass: ${off} front shoulder facing strips switched off`);
