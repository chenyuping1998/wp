// Make the ninja's cloth visibly MOVE (2026-10-16, user: 「人物衣服的飄逸還沒做出來」).
//
// install_boom_ninja.py + polish_ninja_motion.py + ninja_strap_motion.py built
// every flowing end — headband tails, sash ends, sleeve ties, shin wraps, hem —
// with bones, weights, physics and a `flutter` loop. All of it worked and none
// of it showed: measured with design/measure_ninja_flow.mjs the cloth added at
// most 5-10 canvas px (3-6 px on screen), and during a slash the physics added
// nothing at all (strength 170 / inertia 0.16 holds the ends rigid to the body).
//
// This post-pass leaves bones, meshes and weights alone and changes only:
//   1. the `flutter` amplitudes of the cloth bones (per group, below)
//   2. the cloth physics: softer spring, more inertia, more of it applied, so
//      the ends lag and swing after a strike, jump or cheer
//
// It always starts from the pre-boost copy, so re-running it is safe, and
// re-running the install pipeline (which rewrites ninja.json) only needs this
// run again afterwards.
//
//   node design/boost_ninja_flow.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { execFileSync } from 'node:child_process';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const live = path.join(root, 'static/assets/spines/goBananinjaMascot/ninja.json');
const backup = path.join(root, 'design/source/ninja_reskin/ninja.pre_flow_boost.json');

const current = JSON.parse(fs.readFileSync(live, 'utf8'));
if (!current.skeleton.flowBoost) fs.copyFileSync(live, backup); // a fresh pipeline output
const rig = JSON.parse(fs.readFileSync(backup, 'utf8'));

// Flutter gain per cloth group. Picked against tearing, not taste alone: the
// headband tails are short (~60px) and sit on the hood, so they get the most
// angle but stay under ~20 deg at the tip; the sash is long and free, so less
// angle buys more travel; the sleeve ties are capped at 22% weight in the arm
// mesh (ninja_strap_motion.py), so only a large angle reaches the pixels.
const GAIN = [
	[/^band_/, 4.6],
	[/^sash_(base|tip|short)$/, 2.8],
	[/^sash_side/, 3.2],
	[/^hem_/, 3.0],
	[/^sleeve_/, 3.4],
	[/^shin_/, 3.0],
	[/^heel_/, 3.0],
];
const gainOf = (name) => GAIN.find(([re]) => re.test(name))?.[1];

// IN PHASE PER PIECE OF CLOTH. The strap pass gave every tie its own phase
// (0.35 rad apart), which at its tiny amplitude was harmless. Scaled up, two
// tails sharing one mesh (the headband's upper and lower, the sash's three
// ends and the hem) swing toward each other and crush the cloth between them:
// check_ninja_mesh measured head_2_face folding to 10% even at a 1.7x gain.
// So the flutter is rewritten: one phase per mesh, each tip lagging its own
// root by the strap pass's 0.65 rad, same 4.8s loop, same seamless shape.
const PERIOD = 4.8;
const PIECE = [
	[/^band_/, 0.0],
	[/^(hem_|sash_)/, 1.3],
	[/^sleeve_/, 2.4],
	[/^shin_left/, 3.1],
	[/^(shin_right|heel_right)/, 3.8],
];
const isTip = (name) => /_tip$/.test(name);
const wave = (amp, phase) => {
	const value = (t) => {
		const a = (2 * Math.PI * t) / PERIOD;
		return amp * (Math.sin(a + phase) - Math.sin(phase) + 0.2 * (Math.sin(2 * a + phase) - Math.sin(phase)));
	};
	const speed = (t) => {
		const a = (2 * Math.PI * t) / PERIOD;
		return ((amp * 2 * Math.PI) / PERIOD) * (Math.cos(a + phase) + 0.4 * Math.cos(2 * a + phase));
	};
	const keys = [];
	for (let i = 0; i <= 48; i++) {
		const t = (PERIOD * i) / 48;
		const key = { time: +t.toFixed(6), value: +value(t).toFixed(6) };
		if (i < 48) {
			const end = t + PERIOD / 48, dt = (end - t) / 3;
			key.curve = [t + dt, value(t) + speed(t) * dt, end - dt, value(end) - speed(end) * dt].map((v) => +v.toFixed(6));
		}
		keys.push(key);
	}
	return keys;
};
const peak = (keys) => Math.max(...keys.map((k) => Math.abs(k.value)));

let boosted = 0;
for (const [bone, timelines] of Object.entries(rig.animations.flutter.bones)) {
	const g = gainOf(bone) && 1 + (gainOf(bone) - 1) * Number(process.env.BOOST_GAIN ?? 1);
	const piece = PIECE.find(([re]) => re.test(bone));
	if (!g || !piece || !timelines.rotate) continue;
	const phase = piece[1] + (isTip(bone) || bone === 'sash_tip' ? 0.65 : 0);
	const unit = peak(wave(1, phase));
	timelines.rotate = wave((g * peak(timelines.rotate)) / unit, phase);
	boosted++;
}

// Softer cloth. strength is the spring back to the animated pose, inertia how
// much the bone keeps its world position when the parent moves, rotate how
// much of the simulated result is used. limit caps the per-step velocity.
let softened = 0;
const PHYS = process.env.BOOST_PHYS !== '0';
for (const p of PHYS ? rig.physics : []) {
	if (!/_(flow|cloth)$/.test(p.name)) continue;
	const tip = /_tip_|sash_tip/.test(p.name);
	Object.assign(p, {
		rotate: tip ? 0.85 : 0.7,
		inertia: tip ? 0.55 : 0.45,
		strength: tip ? 55 : 75,
		damping: 0.8,
		mass: 1.2,
		limit: 40,
	});
	softened++;
}

// SOFTER WEIGHT EDGES. Each strap's influence falls off across its width as
// exp(-(d/w)^4) on a 7px grid, so a vertex on the strap can be 80% tip and its
// neighbour 20%. At the strap pass's 2-9 deg nobody could see that; at the
// angles above it shears the edge triangles past flat (check_ninja_mesh:
// head_2_face to -76%, the calves to -38%). So the cloth bones' weights are
// diffused over the mesh's own edges a few passes — the strap still owns its
// pixels, the hand-over just takes three or four cells instead of one — and
// every vertex's local position is recomputed for the bones it now has.
const SMOOTH = Number(process.env.BOOST_SMOOTH ?? 12);
const CLOTH = /^(band_|sash_|hem_|sleeve_|shin_|heel_)/;
{
	const store = path.resolve(root, '../../node_modules/.pnpm');
	const coreDir = fs.readdirSync(store).find((n) => n.startsWith('@esotericsoftware+spine-core@'));
	const SC = await import(pathToFileURL(path.join(store, coreDir, 'node_modules/@esotericsoftware/spine-core/dist/index.js')).href);
	const atlasText = fs.readFileSync(path.join(root, 'static/assets/spines/goBananinjaMascot/ninja.atlas'), 'utf8');
	const data = new SC.SkeletonJson(new SC.AtlasAttachmentLoader(new SC.TextureAtlas(atlasText))).readSkeletonData(JSON.parse(JSON.stringify(rig)));
	const sk = new SC.Skeleton(data);
	sk.setToSetupPose();
	sk.updateWorldTransform(SC.Physics.none);
	const names = rig.bones.map((b) => b.name);
	const cloth = names.map((n) => CLOTH.test(n));
	for (const [slot, byName] of Object.entries(rig.skins[0].attachments)) {
		const a = byName[slot];
		if (a?.type !== 'mesh' || !Array.isArray(a.vertices) || a.vertices.length === a.uvs.length) continue;
		const n = a.uvs.length / 2;
		// decode
		const infl = [];
		let c = 0;
		for (let i = 0; i < n; i++) {
			const k = a.vertices[c++];
			const m = new Map();
			for (let q = 0; q < k; q++, c += 4) m.set(a.vertices[c], { x: a.vertices[c + 1], y: a.vertices[c + 2], w: a.vertices[c + 3] });
			infl.push(m);
		}
		if (!infl.some((m) => [...m.keys()].some((b) => cloth[b]))) continue;
		// rest world position of every vertex
		const world = infl.map((m) => {
			let x = 0, y = 0;
			for (const [b, { x: lx, y: ly, w }] of m) {
				const bone = sk.bones[b];
				x += w * (bone.a * lx + bone.b * ly + bone.worldX);
				y += w * (bone.c * lx + bone.d * ly + bone.worldY);
			}
			return [x, y];
		});
		const nbr = Array.from({ length: n }, () => new Set());
		for (let t = 0; t < a.triangles.length; t += 3) {
			const [p, q, r] = a.triangles.slice(t, t + 3);
			nbr[p].add(q).add(r); nbr[q].add(p).add(r); nbr[r].add(p).add(q);
		}
		// cloth weights per vertex, diffused
		let cw = infl.map((m) => new Map([...m].filter(([b]) => cloth[b]).map(([b, v]) => [b, v.w])));
		for (let pass = 0; pass < SMOOTH; pass++) {
			cw = cw.map((own, i) => {
				const acc = new Map();
				const add = (m, f) => { for (const [b, w] of m) acc.set(b, (acc.get(b) ?? 0) + w * f); };
				add(own, 0.5);
				const share = 0.5 / nbr[i].size;
				for (const j of nbr[i]) add(cw[j], share);
				return acc;
			});
		}
		// rebuild: cloth weights as diffused (never more than 0.9 in all), body
		// bones keep their own ratios in what is left
		const out = [];
		for (let i = 0; i < n; i++) {
			const body = [...infl[i]].filter(([b]) => !cloth[b]);
			let clothSum = 0;
			for (const w of cw[i].values()) clothSum += w;
			const cap = Math.min(1, 0.9 / Math.max(clothSum, 1e-9));
			const bodySum = body.reduce((s, [, v]) => s + v.w, 0);
			const left = 1 - clothSum * cap;
			const ws = [];
			for (const [b, v] of body) ws.push([b, bodySum > 0 ? (v.w / bodySum) * left : 0]);
			if (bodySum === 0) {
				// a vertex owned only by cloth before: give what is left to the slot's bone
				const sb = names.indexOf(rig.slots.find((s) => s.name === slot).bone);
				ws.push([sb, left]);
			}
			for (const [b, w] of cw[i]) ws.push([b, w * cap]);
			const kept = ws.filter(([, w]) => w > 1e-4);
			const total = kept.reduce((s, [, w]) => s + w, 0);
			out.push(kept.length);
			for (const [b, w] of kept) {
				const bone = sk.bones[b];
				const local = new SC.Vector2(world[i][0], world[i][1]);
				bone.worldToLocal(local);
				out.push(b, +local.x.toFixed(4), +local.y.toFixed(4), +(w / total).toFixed(5));
			}
		}
		a.vertices = out;
		console.log(`weights: ${slot} cloth edges diffused x${SMOOTH}`);
	}
}

rig.skeleton.flowBoost = 1;
fs.writeFileSync(live, JSON.stringify(rig));
console.log(`flutter: ${boosted} bones boosted; physics: ${softened} constraints softened -> ${live}`);

// The ties' free ends become meshes of their own (design/cut_ninja_straps.py),
// then the lids go back on (the pre-boost copy has neither).
execFileSync('E:/stake/math-sdk/env/Scripts/python.exe', [path.join(root, 'design/cut_ninja_straps.py')], { stdio: 'inherit' });
execFileSync('E:/stake/math-sdk/env/Scripts/python.exe', [path.join(root, 'design/ninja_shuriken_glint.py')], { stdio: 'inherit' });
execFileSync('E:/stake/math-sdk/env/Scripts/python.exe', [path.join(root, 'design/ninja_blink.py')], { stdio: 'inherit' });
// The acting (2026-10-23, spine-generator): staggered cuts, throw and cheer.
execFileSync(process.execPath, [path.join(root, 'design/spine43/build_ninja_acting.mjs')], { stdio: 'inherit' });
