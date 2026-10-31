// Don Whiskers' fake 3-D head turn — the Pragmatic Play technique (wp/.claude/skills/slot-motion-recipes,
// references/craft-deep-dive.md §2), added after tools/build_new_game_cast.py has written the rig:
//
//  1. a `look` control bone hangs off `head` at the middle of the face;
//  2. every face drawing (all ten expressions share the slot) gets a Gaussian share of each vertex moved onto
//     `look` — about 0.6 between the eyes and the muzzle, under 0.1 at the outline — so moving `look` slides
//     the features more than the silhouette and the head reads as turning;
//  3. what sits ON the face (whiskers, monocle, the catnip sprig) moves by the face's share at its root; the ears
//     go the other way a little (the back of the head);
//  4. each clip gets a look path: idle glances at the board now and then, the stamp and the turf claim look down
//     at the board, reactions glance over, the big wins look up. Baked at 30fps with Spine's default bezier.
//
// Writes src/game/characterRigData.json and static/assets/spines/donWhiskers43/character.json (the same file).
// Refuses to run twice on the same rig. Run it after every rebuild of the cast:
//   node design/cast_look_pass.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const app = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FILES = ['src/game/characterRigData.json', 'static/assets/spines/donWhiskers43/character.json'].map((f) => path.join(app, f));
const raw = JSON.parse(fs.readFileSync(FILES[0], 'utf8'));
if (raw.bones.some((b) => b.name === 'look')) {
	console.log('cast look pass: already applied');
	process.exit(0);
}

// ---------------------------------------------------------------- setup pose (world matrices), by hand
const byName = new Map(raw.bones.map((b, i) => [b.name, i]));
const world = [];
for (const b of raw.bones) {
	const rot = ((b.rotation ?? 0) * Math.PI) / 180, sx = b.scaleX ?? 1, sy = b.scaleY ?? 1;
	const la = Math.cos(rot) * sx, lb = -Math.sin(rot) * sy, lc = Math.sin(rot) * sx, ld = Math.cos(rot) * sy;
	const x = b.x ?? 0, y = b.y ?? 0;
	if (!b.parent) { world.push({ a: la, b: lb, c: lc, d: ld, x, y }); continue; }
	const p = world[byName.get(b.parent)];
	world.push({ a: p.a * la + p.b * lc, b: p.a * lb + p.b * ld, c: p.c * la + p.d * lc, d: p.c * lb + p.d * ld, x: p.a * x + p.b * y + p.x, y: p.c * x + p.d * y + p.y });
}
const toWorld = (bi, lx, ly) => { const m = world[bi]; return [m.a * lx + m.b * ly + m.x, m.c * lx + m.d * ly + m.y]; };

// ---------------------------------------------------------------- 1. the look bone
const HEAD = byName.get('head');
const CENTRE = [-12, 930]; // between the eyes and the muzzle (eyes ~960, muzzle 848)
const R = 300;             // the face's half width, fur included
const PEAK = 0.6;
const share = (x, y) => { const r = Math.hypot(x - CENTRE[0], y - CENTRE[1]) / R; return PEAK * Math.exp(-(r * r) / 0.4); };
const hm = world[HEAD], det = hm.a * hm.d - hm.b * hm.c;
const local = [(hm.d * (CENTRE[0] - hm.x) - hm.b * (CENTRE[1] - hm.y)) / det, (-hm.c * (CENTRE[0] - hm.x) + hm.a * (CENTRE[1] - hm.y)) / det];
raw.bones.push({ name: 'look', parent: 'head', x: +local[0].toFixed(2), y: +local[1].toFixed(2) });
const LOOK = raw.bones.length - 1;
world.push({ ...hm, x: CENTRE[0], y: CENTRE[1] });
const lw = world[LOOK], ldet = lw.a * lw.d - lw.b * lw.c;
const toLook = (x, y) => [(lw.d * (x - lw.x) - lw.b * (y - lw.y)) / ldet, (-lw.c * (x - lw.x) + lw.a * (y - lw.y)) / ldet];

// ---------------------------------------------------------------- 2. re-weight every face drawing
const skin = raw.skins.find((s) => s.name === 'default') ?? raw.skins[0];
let faces = 0, moved = 0;
for (const [name, att] of Object.entries(skin.attachments.face ?? {})) {
	if (att.type !== 'mesh' || att.vertices.length <= att.uvs.length) continue; // weighted meshes only
	const out = [];
	for (let i = 0; i < att.vertices.length;) {
		const n = att.vertices[i++], infl = [];
		let wx = 0, wy = 0;
		for (let k = 0; k < n; k++, i += 4) {
			const [bi, bx, by, w] = att.vertices.slice(i, i + 4);
			infl.push([bi, bx, by, w]);
			const [px, py] = toWorld(bi, bx, by);
			wx += px * w; wy += py * w;
		}
		const s = share(wx, wy);
		if (s < 0.005) { out.push(n, ...infl.flat()); continue; }
		// scale the old weights by (1 - s) and give s to look; round so the row sums to exactly 1
		const scaled = infl.map(([bi, bx, by, w]) => [bi, bx, by, +(w * (1 - s)).toFixed(6)]);
		const [lx, ly] = toLook(wx, wy);
		const lookW = +(1 - scaled.reduce((t, r) => t + r[3], 0)).toFixed(6);
		out.push(n + 1, ...scaled.flat(), LOOK, +lx.toFixed(3), +ly.toFixed(3), lookW);
		moved++;
	}
	att.vertices = out;
	faces++;
}

// ---------------------------------------------------------------- 3 + 4. look paths per clip, and what rides on the face
const bez = (x1, y1, x2, y2) => (x) => {
	if (x <= 0) return 0; if (x >= 1) return 1;
	let lo = 0, hi = 1, t = x;
	for (let i = 0; i < 20; i++) { t = (lo + hi) / 2; if (3 * (1 - t) ** 2 * t * x1 + 3 * (1 - t) * t * t * x2 + t ** 3 < x) lo = t; else hi = t; }
	return 3 * (1 - t) ** 2 * t * y1 + 3 * (1 - t) * t * t * y2 + t ** 3;
};
const soft = bez(0.25, 0, 0.75, 1);
const at = (keys, t, c) => {
	if (t <= keys[0][0]) return keys[0][c];
	for (let i = 1; i < keys.length; i++) if (t <= keys[i][0]) return keys[i - 1][c] + (keys[i][c] - keys[i - 1][c]) * soft((t - keys[i - 1][0]) / (keys[i][0] - keys[i - 1][0]));
	return keys[keys.length - 1][c];
};
// [seconds, x, y] in units of the face radius R; the board is to the cat's left on screen (−x), up is +y.
const G = 0.13, B = 0.2;
const scale = (keys, k) => keys.map(([t, x, y]) => [+(t * k).toFixed(4), x, y]);
const LOOKS = {
	idle: [[0, 0, 0], [2.6, 0, 0], [3.1, -G, -0.02], [4.6, -G, -0.02], [5.1, 0, 0], [9.8, 0, 0], [10.3, 0.08, 0.06], [11.4, 0.08, 0.06], [11.9, 0, 0], [16, 0, 0]],
	fg_idle: [[0, 0, 0], [1.8, 0, 0], [2.3, -G, -0.03], [4.2, -G, -0.03], [4.7, 0, 0], [8.5, 0, 0], [9, -0.08, 0.04], [10.6, -0.08, 0.04], [11.1, 0, 0], [16, 0, 0]],
	push_monocle: [[0, 0, 0], [0.18, 0.04, 0], [0.42, 0.1, 0.06], [0.9, 0.1, 0.06], [1.1, 0, 0]],
	stamp: [[0, 0, 0], [0.15, -0.05, -0.03], [0.4, -0.16, -0.08], [0.7, -0.16, -0.08], [0.9, 0, 0]],
	claim_turf: [[0, 0, 0], [0.2, 0.04, 0], [0.45, -B, -0.03], [0.85, -B, -0.03], [1.1, 0, 0]],
	catch_stamp: [[0, 0, 0], [0.12, -0.1, 0.08], [0.35, -0.04, 0.02], [0.5, 0, 0]],
	lick_paw: [[0, 0, 0], [0.15, -0.06, -0.06], [0.45, -0.06, -0.06], [0.6, 0, 0]],
	react_small: [[0, 0, 0], [0.2, -G, -0.02], [0.55, -G, -0.02], [0.9, 0, 0]],
	react_good: [[0, 0, 0], [0.2, -G, -0.02], [0.55, -G, -0.02], [0.8, 0.04, 0.08], [1.15, 0.04, 0.08], [1.4, 0, 0]],
	react_chain: [[0, 0, 0], [0.15, 0.03, 0], [0.35, -B, 0], [0.8, -B, 0], [1, 0, 0]],
	react_none: [[0, 0, 0], [0.25, 0.12, 0.02], [0.95, 0.12, 0.02], [1.2, 0, 0]],
	idle_bored: [[0, 0, 0], [0.3, -0.14, 0], [0.8, -0.14, 0], [1.1, 0.03, -0.05], [1.3, 0.12, 0.02], [1.9, 0.12, 0.02], [2.4, 0, 0]],
	fg_trigger: [[0, 0, 0], [0.15, -B, 0.03], [0.9, -B, 0.03], [1.3, 0, 0.02], [2.2, 0, 0]],
	fg_end: [[0, 0, 0], [0.3, -G, 0], [1, -G, 0], [1.6, 0, 0]],
	win_big: [[0, 0, 0], [0.25, -G, 0], [0.7, -G, 0], [1.1, 0.03, 0.1], [2.3, 0.03, 0.1], [2.6, 0, 0]],
	win_max: [[0, 0, 0], [0.25, -B, 0], [0.8, -B, 0], [1.3, 0.04, 0.12], [2.9, 0.04, 0.12], [3.2, 0, 0]],
	win_big_loop: [[0, 0, 0], [0.5, -0.06, 0.03], [1, -0.06, 0.03], [1.5, 0.04, 0.05], [2, 0, 0]],
	win_max_loop: [[0, 0, 0], [0.5, -0.07, 0.04], [1, -0.07, 0.04], [1.5, 0.05, 0.06], [2, 0, 0]],
};
LOOKS.push_monocle_short = scale(LOOKS.push_monocle, 0.5 / 1.1);
LOOKS.stamp_short = scale(LOOKS.stamp, 0.45 / 0.9);

// riders: their share of the face at their root (ears negative: the back of the head)
const rider = (bone, k) => [bone, k];
const share0 = (bone) => { const m = world[byName.get(bone)]; return +share(m.x, m.y).toFixed(3); };
const RIDERS = [
	rider('whiskers_left', share0('whiskers_left')), rider('whiskers_right', share0('whiskers_right')),
	rider('monocle', share0('monocle')), rider('catnip', share0('catnip')),
	rider('ear_left', -0.12), rider('ear_right', -0.12),
].filter(([b]) => byName.has(b));

const FPS = 30;
let clips = 0;
for (const [clip, keys] of Object.entries(LOOKS)) {
	const anim = raw.animations[clip];
	if (!anim) continue;
	const end = keys[keys.length - 1][0];
	const times = Array.from({ length: Math.round(end * FPS) + 1 }, (_, i) => +(i / FPS).toFixed(4));
	anim.bones ??= {};
	anim.bones.look = { translate: times.map((t) => ({ time: t, x: +(at(keys, t, 1) * R).toFixed(2), y: +(at(keys, t, 2) * R).toFixed(2) })) };
	for (const [bone, k] of RIDERS) {
		const tl = (anim.bones[bone] ??= {});
		if (tl.translate) {
			// already keyed (densely, by the cast builder): add the look on top at its own keys
			const all = [...new Set([...tl.translate.map((key) => key.time), ...times])].sort((a, b) => a - b);
			const base = (t) => {
				const ks = tl.translate;
				if (t <= ks[0].time) return [ks[0].x ?? 0, ks[0].y ?? 0];
				for (let i = 1; i < ks.length; i++) if (t <= ks[i].time) { const f = (t - ks[i - 1].time) / (ks[i].time - ks[i - 1].time || 1); return [(ks[i - 1].x ?? 0) + ((ks[i].x ?? 0) - (ks[i - 1].x ?? 0)) * f, (ks[i - 1].y ?? 0) + ((ks[i].y ?? 0) - (ks[i - 1].y ?? 0)) * f]; }
				const l = ks[ks.length - 1]; return [l.x ?? 0, l.y ?? 0];
			};
			tl.translate = all.map((t) => { const [bx, by] = base(t); return { time: t, x: +(bx + k * at(keys, t, 1) * R).toFixed(2), y: +(by + k * at(keys, t, 2) * R).toFixed(2) }; });
		} else tl.translate = times.map((t) => ({ time: t, x: +(k * at(keys, t, 1) * R).toFixed(2), y: +(k * at(keys, t, 2) * R).toFixed(2) }));
	}
	clips++;
}

const before = fs.readFileSync(FILES[0], 'utf8');
const text = JSON.stringify(raw);
for (const f of FILES) fs.writeFileSync(f, text);
// The cast builder's anatomy coverage (opaque triangles per drawing) is keyed to the rig's hash. This pass changes
// weights and keys only, never a triangle or a uv, so the coverage still holds: re-key it to the new rig.
const coveragePath = path.join(app, 'design/character-anatomy-coverage.json');
if (fs.existsSync(coveragePath)) {
	const { createHash } = await import('node:crypto');
	const sha = (s) => createHash('sha256').update(s).digest('hex');
	const coverage = JSON.parse(fs.readFileSync(coveragePath, 'utf8'));
	if (coverage.rigSha256 === sha(before)) {
		coverage.rigSha256 = sha(text);
		fs.writeFileSync(coveragePath, JSON.stringify(coverage));
	} else console.log('cast look pass: anatomy coverage was already stale before this pass — left as it is');
}
console.log(`cast look pass: look bone under head at ${CENTRE}, R ${R}, peak ${PEAK}; ${faces} face drawings, ${moved} vertices re-weighted; ${clips} clips with look paths; riders ${RIDERS.map(([b, k]) => `${b} ${k}`).join(', ')}`);
