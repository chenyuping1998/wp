// Squawk's FAR wing, attached (user 2026-10-31: 人物動態身體要接好).
//
// The far wing is two pieces: its root (wing_back_upper) is drawn behind the body, its tip (wing_back_tip) in front
// of the face and headphones. Hanging at rest the tip overlaps neither, so it reads as one wing. Raised — win_max,
// win_max_loop, fg_trigger — the root rises behind the big feathered head and is hidden, while the tip is drawn on top
// of the headphones: a blue fan floating beside the head with nothing joining it to the body.
//
// A far wing belongs BEHIND the head. The tip now draws after the body and the chain but before the headphones and
// the face, so a raised wing comes out from behind the head instead of hovering in front of it. At rest the tip
// overlaps neither the headphones nor the face, so the still pose is unchanged (checked by the review render).
//
// Run after every rebuild of the cast. Running it twice changes nothing.
//   node design/cast_wing_order_pass.mjs
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const app = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FILES = ['src/game/characterRigData.json', 'static/assets/spines/squawk43/character.json'].map((f) => path.join(app, f));
const before = fs.readFileSync(FILES[0], 'utf8');
const raw = JSON.parse(before);
const at = (n) => raw.slots.findIndex((s) => s.name === n);

for (const [name, clip] of Object.entries(raw.animations)) if (clip.drawOrder) throw Error(`${name} keys the draw order: reorder it there too`);
if (at('wing_back_tip') < at('headphones')) {
	console.log('cast wing order pass: far wing tip already behind the head');
	process.exit(0);
}
const [tip] = raw.slots.splice(at('wing_back_tip'), 1);
raw.slots.splice(at('headphones'), 0, tip);

const text = JSON.stringify(raw);
if (fs.readFileSync(FILES[0], 'utf8') !== before) throw Error('characterRigData.json changed while the pass ran — rerun it on the new rig');
for (const f of FILES) if (fs.existsSync(f)) fs.writeFileSync(f, text);
const coveragePath = path.join(app, 'design/character-anatomy-coverage.json');
if (fs.existsSync(coveragePath)) {
	const sha = (s) => createHash('sha256').update(s).digest('hex');
	const coverage = JSON.parse(fs.readFileSync(coveragePath, 'utf8'));
	if (coverage.rigSha256 === sha(before)) {
		coverage.rigSha256 = sha(text);
		fs.writeFileSync(coveragePath, JSON.stringify(coverage));
	} else console.log('cast wing order pass: anatomy coverage was already stale before this pass — left as it is');
}
console.log(`cast wing order pass: far wing tip now drawn behind the head (${raw.slots.map((s) => s.name).join(' > ')})`);
