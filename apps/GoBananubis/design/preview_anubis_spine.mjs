// Renders the generated anubis skeleton to a PNG contact sheet, so the rig can
// be checked without opening Spine or the game.
//
//   node design/preview_anubis_spine.mjs <dir with node_modules for pngjs> [anim]
//
// This is a deliberately small forward-kinematics renderer: bone hierarchy,
// linear keyframe interpolation, one quad per region attachment, and WEIGHTED
// MESHES (the trunk, the collar and the face are meshes since the generator's
// WEIGHTED MESHES section — a preview that drew them as rigid quads would show
// exactly the seams they exist to remove). It does NOT implement IK, curve
// interpolation or draw order timelines, because the rig does not use them. What it does check
// is the thing that actually goes wrong when a cutout rig is written by hand: a
// joint in the wrong place, so a limb swings from its elbow, or a piece parented
// to the wrong bone, so an arm is left behind when the torso turns.
//
// Setup pose is frame 0 of every sheet, which is also the check that the pieces
// reassemble into the character at all.
import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const toolDir = process.argv[2];
if (!toolDir) {
	console.error('usage: node design/preview_anubis_spine.mjs <dir with node_modules/pngjs> [anim]');
	process.exit(1);
}
const require = createRequire(path.join(toolDir, 'noop.js'));
const { PNG } = require('pngjs');

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIR = path.join(appRoot, 'static/assets/spines/goBananubisAnubis');
const animName = process.argv[3] ?? 'idle';

const skel = JSON.parse(fs.readFileSync(path.join(DIR, 'anubis.json'), 'utf8'));
const page = PNG.sync.read(fs.readFileSync(path.join(DIR, 'anubis.png')));

// ── atlas ───────────────────────────────────────────────────────────────────
const regions = {};
{
	const lines = fs.readFileSync(path.join(DIR, 'anubis.atlas'), 'utf8').split(/\r?\n/);
	let name = null;
	for (const line of lines.slice(5)) {
		if (!line.trim()) continue;
		if (!line.includes(':')) {
			name = line.trim();
			continue;
		}
		const [k, v] = line.split(':');
		if (k.trim() === 'bounds' && name) {
			const [x, y, w, h] = v.split(',').map(Number);
			regions[name] = { x, y, w, h };
		}
	}
}

// ── transforms ──────────────────────────────────────────────────────────────
const mul = (m, n) => [
	m[0] * n[0] + m[2] * n[1],
	m[1] * n[0] + m[3] * n[1],
	m[0] * n[2] + m[2] * n[3],
	m[1] * n[2] + m[3] * n[3],
	m[0] * n[4] + m[2] * n[5] + m[4],
	m[1] * n[4] + m[3] * n[5] + m[5],
];
const local = (x, y, deg, sx, sy) => {
	const r = (deg * Math.PI) / 180;
	// Spine: y up, rotation counter-clockwise
	return [Math.cos(r) * sx, Math.sin(r) * sx, -Math.sin(r) * sy, Math.cos(r) * sy, x, y];
};
const apply = (m, x, y) => ({ x: m[0] * x + m[2] * y + m[4], y: m[1] * x + m[3] * y + m[5] });

const boneByName = Object.fromEntries(skel.bones.map((b) => [b.name, b]));
const anim = skel.animations[animName];
if (!anim) {
	console.error(`no animation "${animName}" — have: ${Object.keys(skel.animations).join(', ')}`);
	process.exit(1);
}

const sample = (keys, at, fields, fallback) => {
	if (!keys || keys.length === 0) return fallback;
	if (at <= keys[0].time) return fields.map((f) => keys[0][f] ?? fallback[fields.indexOf(f)]);
	const last = keys[keys.length - 1];
	if (at >= last.time) return fields.map((f) => last[f] ?? fallback[fields.indexOf(f)]);
	let i = 0;
	while (i < keys.length - 1 && keys[i + 1].time < at) i++;
	const a = keys[i];
	const b = keys[i + 1];
	const t = (at - a.time) / (b.time - a.time);
	return fields.map((f, k) => {
		const av = a[f] ?? fallback[k];
		const bv = b[f] ?? fallback[k];
		return av + (bv - av) * t;
	});
};

const worldAt = (time) => {
	const out = {};
	const resolve = (bone) => {
		if (out[bone.name]) return out[bone.name];
		const parent = bone.parent ? resolve(boneByName[bone.parent]) : [1, 0, 0, 1, 0, 0];
		const track = anim.bones?.[bone.name] ?? {};
		// 'value', matching the Spine 4.x JSON format. This preview read 'angle'
		// while the generator wrote 'angle', so the two agreed with each other and
		// both disagreed with the runtime: the contact sheets showed arms swinging
		// that the game would have rendered hanging still. A preview that shares a
		// mistake with the thing it checks is worse than no preview.
		const [rot] = sample(track.rotate, time, ['value'], [0]);
		const [tx, ty] = sample(track.translate, time, ['x', 'y'], [0, 0]);
		const [sx, sy] = sample(track.scale, time, ['x', 'y'], [1, 1]);
		const m = mul(
			parent,
			local((bone.x ?? 0) + tx, (bone.y ?? 0) + ty, (bone.rotation ?? 0) + rot, sx, sy),
		);
		out[bone.name] = m;
		return m;
	};
	for (const b of skel.bones) resolve(b);
	return out;
};

// Slot attachment timelines: which drawing a slot is showing at a given time,
// or none. Stepped by definition - an attachment is swapped, never blended.
//
// Without this the preview drew every slot with its setup attachment for the
// whole clip, so a prop that is switched on part way through (the scarab) was
// invisible here and present in the game. Same class of mistake as reading
// 'angle' instead of 'value': a preview that does not model what the runtime
// models is not checking anything.
const attachmentAt = (slot, time) => {
	const keys = anim.slots?.[slot.name]?.attachment;
	if (!keys) return slot.attachment;
	let name = slot.attachment ?? null;
	for (const k of keys) {
		if (k.time > time) break;
		name = k.name;
	}
	return name;
};

// Slot alpha: the setup colour's alpha, then the clip's `alpha` keys. Every
// alpha key in this rig is stepped (the eyelids' sprite blink), so the last key
// at or before `time` is the value.
const alphaAt = (slot, time) => {
	let a = slot.color ? parseInt(slot.color.slice(6, 8), 16) / 255 : 1;
	for (const k of anim.slots?.[slot.name]?.alpha ?? []) {
		if (k.time > time + 1e-6) break;
		a = k.value;
	}
	return a;
};

// ── raster ──────────────────────────────────────────────────────────────────
// Origin sits between the feet; give the frame room above for a jump.
const FRAME = { w: 1000, h: 1140, originX: 500, groundY: 1080 };
const toPixel = (p) => ({ x: p.x + FRAME.originX, y: FRAME.groundY - p.y });

// A weighted mesh: each vertex is the weighted sum of where its bones put it
// (Spine stores it once per bone, in that bone's setup space), then every
// triangle is filled from the region by its UVs.
const blendOver = (buf, px, py, sx, sy) => {
	const s = ((sy | 0) * page.width + (sx | 0)) * 4;
	const a = page.data[s + 3] / 255;
	if (a <= 0.004) return;
	const d = (py * FRAME.w + px) * 4;
	for (let c = 0; c < 3; c++) buf.data[d + c] = Math.round(page.data[s + c] * a + buf.data[d + c] * (1 - a));
};
const drawMesh = (buf, att, reg, world) => {
	const pts = [];
	const v = att.vertices;
	for (let i = 0; i < v.length; ) {
		const n = v[i++];
		let x = 0, y = 0;
		for (let k = 0; k < n; k++) {
			const m = world[skel.bones[v[i]].name];
			const p = apply(m, v[i + 1], v[i + 2]);
			x += p.x * v[i + 3];
			y += p.y * v[i + 3];
			i += 4;
		}
		pts.push(toPixel({ x, y }));
	}
	const uv = att.uvs;
	for (let t = 0; t < att.triangles.length; t += 3) {
		const [a, b, c] = [att.triangles[t], att.triangles[t + 1], att.triangles[t + 2]];
		const A = pts[a], B = pts[b], C = pts[c];
		const den = (B.y - C.y) * (A.x - C.x) + (C.x - B.x) * (A.y - C.y);
		if (Math.abs(den) < 1e-9) continue;
		const minX = Math.max(0, Math.floor(Math.min(A.x, B.x, C.x)));
		const maxX = Math.min(FRAME.w - 1, Math.ceil(Math.max(A.x, B.x, C.x)));
		const minY = Math.max(0, Math.floor(Math.min(A.y, B.y, C.y)));
		const maxY = Math.min(FRAME.h - 1, Math.ceil(Math.max(A.y, B.y, C.y)));
		for (let py = minY; py <= maxY; py++)
			for (let px = minX; px <= maxX; px++) {
				const x = px + 0.5, y = py + 0.5;
				const l1 = ((B.y - C.y) * (x - C.x) + (C.x - B.x) * (y - C.y)) / den;
				const l2 = ((C.y - A.y) * (x - C.x) + (A.x - C.x) * (y - C.y)) / den;
				const l3 = 1 - l1 - l2;
				if (l1 < -1e-6 || l2 < -1e-6 || l3 < -1e-6) continue;
				const u = l1 * uv[a * 2] + l2 * uv[b * 2] + l3 * uv[c * 2];
				const w = l1 * uv[a * 2 + 1] + l2 * uv[b * 2 + 1] + l3 * uv[c * 2 + 1];
				const sx = Math.min(reg.x + reg.w - 1, reg.x + u * reg.w);
				const sy = Math.min(reg.y + reg.h - 1, reg.y + w * reg.h);
				blendOver(buf, px, py, sx, sy);
			}
	}
};

const renderFrame = (time) => {
	const world = worldAt(time);
	const buf = new PNG({ width: FRAME.w, height: FRAME.h });
	for (let i = 0; i < buf.data.length; i += 4) {
		buf.data[i] = 16;
		buf.data[i + 1] = 20;
		buf.data[i + 2] = 10;
		buf.data[i + 3] = 255;
	}
	for (const slot of skel.slots) {
		const shown = attachmentAt(slot, time);
		if (!shown) continue;
		const slotAlpha = alphaAt(slot, time);
		if (slotAlpha <= 0.004) continue;
		const att = skel.skins[0].attachments[slot.name]?.[shown];
		const reg = regions[shown];
		if (!att || !reg) continue;
		if (att.type === 'mesh') {
			drawMesh(buf, att, reg, world);
			continue;
		}
		const m = world[slot.bone];
		const hw = att.width / 2;
		const hh = att.height / 2;
		// the attachment quad, in bone space then on screen
		const corners = [
			[att.x - hw, att.y + hh],
			[att.x + hw, att.y + hh],
			[att.x + hw, att.y - hh],
			[att.x - hw, att.y - hh],
		].map(([x, y]) => toPixel(apply(m, x, y)));
		const minX = Math.max(0, Math.floor(Math.min(...corners.map((c) => c.x))));
		const maxX = Math.min(FRAME.w - 1, Math.ceil(Math.max(...corners.map((c) => c.x))));
		const minY = Math.max(0, Math.floor(Math.min(...corners.map((c) => c.y))));
		const maxY = Math.min(FRAME.h - 1, Math.ceil(Math.max(...corners.map((c) => c.y))));
		// inverse map: screen pixel -> position within the attachment's quad
		const e0 = { x: corners[1].x - corners[0].x, y: corners[1].y - corners[0].y };
		const e1 = { x: corners[3].x - corners[0].x, y: corners[3].y - corners[0].y };
		const det = e0.x * e1.y - e0.y * e1.x;
		if (Math.abs(det) < 1e-6) continue;
		for (let py = minY; py <= maxY; py++)
			for (let px = minX; px <= maxX; px++) {
				const rx = px + 0.5 - corners[0].x;
				const ry = py + 0.5 - corners[0].y;
				const u = (rx * e1.y - ry * e1.x) / det;
				const v = (e0.x * ry - e0.y * rx) / det;
				if (u < 0 || u >= 1 || v < 0 || v >= 1) continue;
				// clamp to the region's own right/bottom edge in PAGE coordinates —
				// clamping to reg.w/reg.h treats the region size as an absolute
				// position and smears the whole atlas across every piece
				const sx = Math.min(reg.x + reg.w - 1, reg.x + u * reg.w);
				const sy = Math.min(reg.y + reg.h - 1, reg.y + v * reg.h);
				const s = ((sy | 0) * page.width + (sx | 0)) * 4;
				const a = (page.data[s + 3] / 255) * slotAlpha;
				if (a <= 0.004) continue;
				const d = (py * FRAME.w + px) * 4;
				for (let c = 0; c < 3; c++)
					buf.data[d + c] = Math.round(page.data[s + c] * a + buf.data[d + c] * (1 - a));
			}
	}
	return buf;
};

// Eight frames spread across the animation's own length, rather than a fixed
// list of times: a 1.4s one-shot and a 5.4s loop need looking at on their own
// clocks, and a hardcoded list silently stops covering the end of the longer one.
const duration = Math.max(
	0.001,
	...[...Object.values(anim.bones ?? {}), ...Object.values(anim.slots ?? {})].flatMap((track) =>
		Object.values(track).flatMap((keys) => keys.map((k) => k.time)),
	),
);
const FRAMES = 8;
// An optional window, because a fast cycle aliases against a whole-clip sweep:
// six chest strikes 0.26s apart sampled every 0.33s shows the same pose eight
// times and looks like nothing is happening.
//   node design/preview_anubis_spine.mjs <dir> chestbeat 0.3 1.0
const from = Number(process.argv[4] ?? 0);
const to = Number(process.argv[5] ?? duration);
const TIMES = Array.from({ length: FRAMES }, (_, i) =>
	+(from + ((to - from) * i) / (FRAMES - 1)).toFixed(2),
);
const gap = 12;
const sheet = new PNG({ width: (FRAME.w + gap) * TIMES.length + gap, height: FRAME.h + gap * 2 });
sheet.data.fill(40);
TIMES.forEach((t, i) => {
	const f = renderFrame(t);
	const ox = gap + i * (FRAME.w + gap);
	for (let y = 0; y < FRAME.h; y++)
		for (let x = 0; x < FRAME.w; x++) {
			const s = (y * FRAME.w + x) * 4;
			const d = ((gap + y) * sheet.width + ox + x) * 4;
			for (let c = 0; c < 4; c++) sheet.data[d + c] = f.data[s + c];
		}
});
const out = path.join(appRoot, `design/source/anubis/_preview_${animName}.png`);
fs.writeFileSync(out, PNG.sync.write(sheet));
console.log(`${animName}: t = ${TIMES.join(', ')}  ->  ${path.relative(appRoot, out)}`);
