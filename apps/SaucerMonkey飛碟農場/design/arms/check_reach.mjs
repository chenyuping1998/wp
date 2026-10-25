// How far left (toward the board) each clip reaches, in skeleton units, with
// the game's runtime: every visible piece's corners, lights only while lit.
// Mascot.svelte fits the cast to 86% of the gap beside the board, so about
// -300 is the gap's edge at the tightest layout (art width 520 / 0.86 / 2).
//   node design/arms/check_reach.mjs [mg|fg]
import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const fromPixiSvelte = createRequire(path.join(appRoot, '../../packages/pixi-svelte/package.json'));
const spinePixi = fs.realpathSync(path.dirname(fromPixiSvelte.resolve('@esotericsoftware/spine-pixi-v8')));
const core = await import(pathToFileURL(createRequire(path.join(spinePixi, 'x.js')).resolve('@esotericsoftware/spine-core')).href);
// -300 is the frame's OUTER edge; the board sits ~0.28 of its half-width
// further in, behind the frame's border. A prop swinging through may graze
// the border for a few frames (BOX_SLACK); a lit beam may not cross at all.
const EDGE = -300, BOX_SLACK = 40;
let bad = 0;
for (const cast of process.argv.slice(2).length ? process.argv.slice(2) : ['mg', 'fg']) {
	const DIR = path.join(appRoot, 'static/assets/spines', cast === 'fg' ? 'sushiApprentice' : 'sushiMaster');
	const atlasText = fs.readFileSync(path.join(DIR, 'monkey.atlas'), 'utf8');
	const size = atlasText.match(/size:(\d+),(\d+)/).slice(1).map(Number);
	const atlas = new core.TextureAtlas(atlasText);
	for (const p of atlas.pages) p.setTexture({ setFilters() {}, setWraps() {}, dispose() {}, getImage: () => ({ width: size[0], height: size[1] }) });
	const cut = JSON.parse(fs.readFileSync(path.join(appRoot, 'design/source/saucer/cast', cast, 'arms/cut.json'), 'utf8'));
	const data = new core.SkeletonJson(new core.AtlasAttachmentLoader(atlas)).readSkeletonData(JSON.parse(fs.readFileSync(path.join(DIR, 'monkey.json'), 'utf8')));
	for (const anim of data.animations) {
		if (anim.name === 'flutter') continue;
		const sk = new core.Skeleton(data);
		// each piece's outline in its bone's frame, taken at the setup pose
		sk.setToSetupPose();
		sk.updateWorldTransform(core.Physics.update);
		const local = {};
		for (const [name, pts] of Object.entries(cut.hulls)) {
			const bone = sk.findBone(name);
			local[name] = pts.map(([x, y]) => bone.worldToLocal(new core.Vector2(x - 280, 904 - y)));
		}
		const st = new core.AnimationState(new core.AnimationStateData(data));
		st.setAnimation(0, anim.name, false);
		st.setAnimation(1, 'flutter', true);
		sk.setToSetupPose();
		let minX = Infinity, at = 0, who = '';
		for (let t = 0; t <= anim.duration + 1e-9; t += 1 / 30) {
			if (t > 0) { st.update(1 / 30); sk.update(1 / 30); }
			st.apply(sk);
			sk.updateWorldTransform(core.Physics.update);
			for (const slot of sk.drawOrder) {
				const att = slot.getAttachment();
				if (!(att instanceof core.RegionAttachment) || slot.color.a < 0.05) continue;
				const pts = local[slot.data.name];
				if (pts) {
					// the piece's own inked outline, not its (partly empty) box
					for (const q of pts) {
						const p = slot.bone.localToWorld(new core.Vector2(q.x, q.y));
						if (p.x < minX) { minX = p.x; at = t; who = slot.data.name; }
					}
					continue;
				}
				const v = new Float32Array(8);
				att.computeWorldVertices(slot, v, 0, 2);
				for (let i = 0; i < 8; i += 2) if (v[i] < minX) { minX = v[i]; at = t; who = slot.data.name; }
			}
		}
		const over = minX < (who.startsWith('light') ? EDGE : EDGE - BOX_SLACK);
		bad += over;
		console.log(`${cast} ${anim.name.padEnd(9)} reaches x ${minX.toFixed(0).padStart(5)} (${who} @${at.toFixed(2)}s)${over ? '  <-- past the gap' : ''}`);
	}
}
process.exitCode = bad ? 1 : 0;
