// The motion audit for the two cast figures: NO CRACKS, NO JERKS.
//
// Plays both skeletons with the real runtime (spine-core, as spine-pixi-v8
// renders it) the way Mascot.svelte plays them — track 0 for the act, the
// `flutter` loop on track 1, physics stepped at 60fps, every change of act
// cross-faded over MIX seconds — through these sequences:
//
//   idle            two full loops (the loop seam is checked too)
//   idle > X > idle every one-shot, entered and left with the cross-fade
//   A cut by B      every pair of the small reactions Mascot lets interrupt
//                   each other, B starting 40% of the way through A
//
// Each frame is RENDERED — every attachment, mesh or plain piece, through the
// atlas, in draw order — by the small software rasteriser below, and measured:
//
//   cracks  background pixels showing through INSIDE the figure: a see-through
//           pixel with ink within CRACK_REACH px on both sides of it, along
//           either axis. Some such pixels are drawn on purpose (between the
//           fingers, between an arm and the body), so a frame fails only by
//           the cracks it has BEYOND its sequence's rest pose.
//   jerks   a vertex whose step this frame is over JERK_PX and more than
//           JERK_RATIO times the larger of its steps either side: a pop, as
//           opposed to fast motion, which ramps.
//
// Writes the worst frame of each failing sequence to --out (default the OS
// temp dir) with the cracks painted red, for looking at.
//
// Usage: node design/check_cast_motion.mjs [toolsDir] [--out dir] [--cast mg|fg]

import { createRequire } from 'module';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const args = process.argv.slice(2);
const opt = (name) => {
	const i = args.indexOf(name);
	return i >= 0 ? args[i + 1] : undefined;
};
const toolsDir = process.env.CAST_MOTION_LIB ? 'E:/stake/tools/gen' : args.find((a, i) => !a.startsWith('--') && !args[i - 1]?.startsWith('--')) ?? 'E:/stake/tools/gen';
if (!fs.existsSync(path.join(toolsDir, 'node_modules', 'pngjs'))) {
	console.warn(`SKIP check_cast_motion: no pngjs under ${toolsDir}`);
	process.exit(0);
}
const OUT = opt('--out') ?? path.join(os.tmpdir(), 'cast_motion');
fs.mkdirSync(OUT, { recursive: true });
const { PNG } = createRequire(path.join(toolsDir, 'noop.js'))('pngjs');
const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const fromPixiSvelte = createRequire(path.join(appRoot, '../../packages/pixi-svelte/package.json'));
const spinePixi = fs.realpathSync(path.dirname(fromPixiSvelte.resolve('@esotericsoftware/spine-pixi-v8')));
const core = await import(pathToFileURL(createRequire(path.join(spinePixi, 'x.js')).resolve('@esotericsoftware/spine-core')).href);

// Mascot.svelte
const MIX = 0.16;
const ONE_SHOTS = ['cheer', 'chestbeat', 'nod', 'throwit', 'flinch', 'alert', 'glance', 'jazzGroove', 'jazzListen', 'jazzFinale'];
const INTERRUPTIBLE = ['nod', 'glance', 'alert', 'flinch'];
const FPS = 60;

const CRACK_REACH = 4; // px either side
const CRACK_SLACK_PX = 60; // a frame may exceed its rest pose by this much, or by
const CRACK_SLACK_FRAC = 0.12; // this share of it — fur strands along the outline flicker
const JERK_PX = 2.5;
const JERK_RATIO = 3;

// ---------------------------------------------------------------------------
// rasteriser: nearest-texel, alpha-over, into a W x H RGBA float buffer

const makeCanvas = (W, H) => ({ W, H, rgba: new Float32Array(W * H * 4), owner: new Int16Array(W * H).fill(-1) });

const drawTriangles = (cv, page, verts, uvs, tris, ox, oy, alphaMul, ownerId = -1) => {
	const { W, H, rgba } = cv;
	const pw = page.width, ph = page.height, pd = page.data;
	for (let t = 0; t < tris.length; t += 3) {
		const i0 = tris[t] * 2, i1 = tris[t + 1] * 2, i2 = tris[t + 2] * 2;
		// skeleton y is up; canvas y is down
		const ax = verts[i0] + ox, ay = oy - verts[i0 + 1];
		const bx = verts[i1] + ox, by = oy - verts[i1 + 1];
		const cx = verts[i2] + ox, cy = oy - verts[i2 + 1];
		const d = (by - cy) * (ax - cx) + (cx - bx) * (ay - cy);
		if (Math.abs(d) < 1e-9) continue;
		const x0 = Math.max(0, Math.floor(Math.min(ax, bx, cx)));
		const x1 = Math.min(W - 1, Math.ceil(Math.max(ax, bx, cx)));
		const y0 = Math.max(0, Math.floor(Math.min(ay, by, cy)));
		const y1 = Math.min(H - 1, Math.ceil(Math.max(ay, by, cy)));
		for (let y = y0; y <= y1; y++) {
			const py = y + 0.5;
			for (let x = x0; x <= x1; x++) {
				const px = x + 0.5;
				const l1 = ((by - cy) * (px - cx) + (cx - bx) * (py - cy)) / d;
				const l2 = ((cy - ay) * (px - cx) + (ax - cx) * (py - cy)) / d;
				const l3 = 1 - l1 - l2;
				if (l1 < -1e-6 || l2 < -1e-6 || l3 < -1e-6) continue;
				const u = l1 * uvs[i0] + l2 * uvs[i1] + l3 * uvs[i2];
				const v = l1 * uvs[i0 + 1] + l2 * uvs[i1 + 1] + l3 * uvs[i2 + 1];
				const tx = Math.min(pw - 1, Math.max(0, Math.floor(u * pw)));
				const ty = Math.min(ph - 1, Math.max(0, Math.floor(v * ph)));
				const k = (ty * pw + tx) * 4;
				const a = (pd[k + 3] / 255) * alphaMul;
				if (a <= 0) continue;
				const o = (y * W + x) * 4;
				rgba[o] = pd[k] / 255 * a + rgba[o] * (1 - a);
				rgba[o + 1] = pd[k + 1] / 255 * a + rgba[o + 1] * (1 - a);
				rgba[o + 2] = pd[k + 2] / 255 * a + rgba[o + 2] * (1 - a);
				rgba[o + 3] = a + rgba[o + 3] * (1 - a);
				if (a > 0.5) cv.owner[y * W + x] = ownerId;
			}
		}
	}
};

const QUAD = [0, 1, 2, 2, 3, 0];

const renderSkeleton = (skeleton, page, W, H, ox, oy) => {
	const cv = makeCanvas(W, H);
	const verts = new Float32Array(4096 * 2);
	for (const [si, slot] of skeleton.drawOrder.entries()) {
		const att = slot.getAttachment();
		if (!att || !slot.bone.active) continue;
		const alpha = slot.color.a * skeleton.color.a;
		if (alpha <= 0) continue;
		if (att instanceof core.RegionAttachment) {
			att.computeWorldVertices(slot, verts, 0, 2);
			drawTriangles(cv, page, verts, att.uvs, QUAD, ox, oy, alpha, si);
		} else if (att instanceof core.MeshAttachment) {
			const n = att.worldVerticesLength;
			const out = n > verts.length ? new Float32Array(n) : verts;
			att.computeWorldVertices(slot, 0, n, out, 0, 2);
			drawTriangles(cv, page, out, att.uvs, att.triangles, ox, oy, alpha, si);
		}
	}
	return cv;
};

// every vertex of every attachment, flattened, for the jerk test
const allVertices = (skeleton) => {
	const pts = [];
	const buf = new Float32Array(8192 * 2);
	for (const slot of skeleton.drawOrder) {
		const att = slot.getAttachment();
		if (!att || !slot.bone.active) continue;
		if (att instanceof core.RegionAttachment) {
			att.computeWorldVertices(slot, buf, 0, 2);
			for (let i = 0; i < 8; i++) pts.push(buf[i]);
		} else if (att instanceof core.MeshAttachment) {
			const n = att.worldVerticesLength;
			att.computeWorldVertices(slot, 0, n, buf, 0, 2);
			for (let i = 0; i < n; i++) pts.push(buf[i]);
		}
	}
	return Float32Array.from(pts);
};

// see-through pixels with ink close on both sides along x or y
const crackMask = (cv) => {
	const { W, H, rgba } = cv;
	const ink = new Uint8Array(W * H);
	for (let i = 0; i < W * H; i++) ink[i] = rgba[i * 4 + 3] > 0.5 ? 1 : 0;
	const mask = new Uint8Array(W * H);
	let count = 0;
	for (let y = CRACK_REACH; y < H - CRACK_REACH; y++)
		for (let x = CRACK_REACH; x < W - CRACK_REACH; x++) {
			const i = y * W + x;
			if (ink[i]) continue;
			let l = 0, r = 0, u = 0, dn = 0;
			for (let k = 1; k <= CRACK_REACH; k++) {
				l ||= ink[i - k];
				r ||= ink[i + k];
				u ||= ink[i - k * W];
				dn ||= ink[i + k * W];
			}
			if ((l && r) || (u && dn)) {
				mask[i] = 1;
				count++;
			}
		}
	return { mask, count };
};

const savePng = (cv, mask, file) => {
	const png = new PNG({ width: cv.W, height: cv.H });
	for (let i = 0; i < cv.W * cv.H; i++) {
		const a = cv.rgba[i * 4 + 3];
		// over a mid grey, so the figure and any hole are both visible
		const bg = 0.35;
		let r = cv.rgba[i * 4] + bg * (1 - a), g = cv.rgba[i * 4 + 1] + bg * (1 - a), b = cv.rgba[i * 4 + 2] + bg * (1 - a);
		if (mask?.[i]) [r, g, b] = [1, 0, 0];
		png.data[i * 4] = Math.round(Math.min(1, r) * 255);
		png.data[i * 4 + 1] = Math.round(Math.min(1, g) * 255);
		png.data[i * 4 + 2] = Math.round(Math.min(1, b) * 255);
		png.data[i * 4 + 3] = 255;
	}
	fs.writeFileSync(file, PNG.sync.write(png));
};

// ---------------------------------------------------------------------------

const loadCast = (dir) => {
	const DIR = path.join(appRoot, 'static/assets/spines', dir);
	const atlasText = fs.readFileSync(path.join(DIR, 'monkey.atlas'), 'utf8');
	const page = PNG.sync.read(fs.readFileSync(path.join(DIR, 'monkey.png')));
	const atlas = new core.TextureAtlas(atlasText);
	for (const p of atlas.pages)
		p.setTexture({ setFilters() {}, setWraps() {}, dispose() {}, getImage: () => ({ width: page.width, height: page.height }) });
	const raw = JSON.parse(fs.readFileSync(path.join(DIR, 'monkey.json'), 'utf8'));
	// Audit the idle actually selected by Mascot, including its loop seam.
	if (raw.animations.jazzIdle && !args.includes('--original-idle')) raw.animations.idle = raw.animations.jazzIdle;
	const data = new core.SkeletonJson(new core.AtlasAttachmentLoader(atlas)).readSkeletonData(raw);
	return { data, page, raw };
};

/** a sequence: a list of [act, startAtSeconds, loop] */
const sequences = (data) => {
	const dur = (n) => data.findAnimation(n).duration;
	const seqs = [{ name: 'idle x2', steps: [['idle', 0, true]], length: dur('idle') * 2 + 0.05 }];
	for (const x of ONE_SHOTS) {
		const at = 0.8;
		seqs.push({ name: `idle > ${x} > idle`, steps: [['idle', 0, true], [x, at, false], ['idle', at + dur(x), true]], length: at + dur(x) + 1.2 });
	}
	for (const a of INTERRUPTIBLE)
		for (const b of INTERRUPTIBLE) {
			if (a === b) continue;
			const cut = 0.5 + dur(a) * 0.4;
			seqs.push({ name: `${a} cut by ${b}`, steps: [['idle', 0, true], [a, 0.5, false], [b, cut, false], ['idle', cut + dur(b), true]], length: cut + dur(b) + 1 });
		}
	return seqs;
};

export { loadCast, renderSkeleton, crackMask, savePng, core, MIX, FPS };
if (process.env.CAST_MOTION_LIB) { /* imported as a library */ } else {
let failures = 0;
const castPick = opt('--cast');
for (const [cast, dir] of [['mg', 'sushiMaster'], ['fg', 'sushiApprentice']]) {
	if (castPick && castPick !== cast) continue;
	const { data, page } = loadCast(dir);
	// the figure's box, from the skeleton's own bounds plus room to move
	const W = Math.ceil(data.width) + 260, H = Math.ceil(data.height) + 200;
	const ox = W / 2, oy = H - 60;
	console.log(`${cast} (${dir})`);
	for (const seq of sequences(data).filter(seq => !opt('--sequence') || seq.name.includes(opt('--sequence')))) {
		const skeleton = new core.Skeleton(data);
		const stateData = new core.AnimationStateData(data);
		stateData.defaultMix = MIX;
		const state = new core.AnimationState(stateData);
		state.setAnimation(1, 'flutter', true);
		skeleton.setToSetupPose();
		skeleton.updateWorldTransform(core.Physics.reset);
		const dt = 1 / FPS;
		let next = 0;
		let base = -1, worst = { extra: -Infinity, t: 0, cv: null, mask: null };
		const steps = [];
		let prev = null, prevStep = null;
		let jerk = { n: 0, worst: 0, t: 0 };
		const N = Math.round(seq.length * FPS);
		for (let f = 0; f <= N; f++) {
			const t = f * dt;
			while (next < seq.steps.length && seq.steps[next][1] <= t + 1e-9) {
				const [act, , loop] = seq.steps[next];
				// the first act starts cold, as Mascot's mount does; later ones mix
				if (next === 0) state.setAnimation(0, act, loop);
				else state.setAnimation(0, act, loop).mixDuration = MIX;
				next++;
			}
			state.update(dt);
			state.apply(skeleton);
			skeleton.update(dt);
			skeleton.updateWorldTransform(core.Physics.update);

			// jerks
			const pts = allVertices(skeleton);
			if (prev && pts.length === prev.length) {
				const step = new Float32Array(pts.length / 2);
				for (let i = 0; i < step.length; i++) step[i] = Math.hypot(pts[i * 2] - prev[i * 2], pts[i * 2 + 1] - prev[i * 2 + 1]);
				steps.push({ t, step });
			} else steps.push(null);
			prev = pts;

			// cracks (rendered every 2nd frame: they last longer than one)
			if (f % 2 === 0) {
				const cv = renderSkeleton(skeleton, page, W, H, ox, oy);
				const { mask, count } = crackMask(cv);
				if (base < 0) base = count; // the sequence's own rest pose
				const extra = count - base;
				if (extra > worst.extra) worst = { extra, t, cv, mask, count };
			}
		}
		// a pop: a step much bigger than both neighbours
		for (let k = 1; k < steps.length - 1; k++) {
			const [a, b, c] = [steps[k - 1], steps[k], steps[k + 1]];
			if (!a || !b || !c || a.step.length !== b.step.length || c.step.length !== b.step.length) continue;
			for (let i = 0; i < b.step.length; i++) {
				const s = b.step[i];
				if (s > JERK_PX && s > JERK_RATIO * Math.max(a.step[i], c.step[i])) {
					jerk.n++;
					if (s > jerk.worst) jerk = { ...jerk, worst: s, t: b.t };
				}
			}
		}
		const crackBad = worst.extra > Math.max(CRACK_SLACK_PX, CRACK_SLACK_FRAC * base);
		const jerkBad = jerk.n > 0;
		const tag = `${cast}_${seq.name.replace(/[^a-z0-9]+/gi, '_')}`;
		if (crackBad) savePng(worst.cv, worst.mask, path.join(OUT, `${tag}_crack_${worst.t.toFixed(2)}s.png`));
		const line = `${seq.name.padEnd(24)} cracks +${Math.max(0, worst.extra)}px over rest (${base} drawn) worst at ${worst.t.toFixed(2)}s; jerks ${jerk.n}${jerk.n ? ` (worst ${jerk.worst.toFixed(1)}px at ${jerk.t.toFixed(2)}s)` : ''}`;
		if (crackBad || jerkBad) {
			failures++;
			console.log(`  !! ${line}`);
		} else console.log(`  ok ${line}`);
	}
}
console.log(`frames with cracks marked red: ${OUT}`);
if (failures) {
	console.log(`check_cast_motion: ${failures} sequence(s) FAILED`);
	process.exit(1);
}
console.log('check_cast_motion: all sequences clean');
}
