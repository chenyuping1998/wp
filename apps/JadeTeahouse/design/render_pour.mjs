// Renders the Master's `pour` clip at a few moments, with the teapot drawn on
// the `prop` bone exactly as SplashMaster.svelte hangs it, into one contact
// sheet. For looking at the pose offline; not part of the build.
//
// Usage: node design/render_pour.mjs <out.png> [toolsDir]
import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

process.env.CAST_MOTION_LIB = '1';
const { loadCast, renderSkeleton, core } = await import('./check_cast_motion.mjs');
import { TEAPOT } from './teapot_rig.mjs';

const out = process.argv[2] ?? 'pour.png';
const toolsDir = process.argv[3] ?? 'E:/stake/tools/gen';
const { PNG } = createRequire(path.join(toolsDir, 'noop.js'))('pngjs');
const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const { data, page } = loadCast('sushiMaster');
const pot = PNG.sync.read(fs.readFileSync(path.join(appRoot, 'static/assets/sprites/sushiSymbols/h1.png')));

const TIMES = [0, 0.3, 0.7, 1.2, 1.9, 2.4];
const W = 820, H = 1000, ox = 470, oy = 960;
const sheet = new PNG({ width: W * TIMES.length, height: H });

for (const [i, t] of TIMES.entries()) {
	const skeleton = new core.Skeleton(data);
	const state = new core.AnimationState(new core.AnimationStateData(data));
	state.setAnimation(0, 'pour', false);
	skeleton.setToSetupPose();
	skeleton.updateWorldTransform(core.Physics.reset);
	const dt = 1 / 60;
	for (let s = 0; s <= Math.round(t * 60); s++) {
		state.update(s === 0 ? 0 : dt);
		state.apply(skeleton);
		skeleton.update(dt);
		skeleton.updateWorldTransform(core.Physics.update);
	}
	const cv = renderSkeleton(skeleton, page, W, H, ox, oy);
	// the pot, on the prop bone: a quad in bone space mapped to world
	const bone = skeleton.findBone('prop');
	const { x, y, w, h } = TEAPOT;
	const corners = [[x - w / 2, y + h / 2], [x + w / 2, y + h / 2], [x + w / 2, y - h / 2], [x - w / 2, y - h / 2]];
	const verts = new Float32Array(8);
	corners.forEach(([lx, ly], j) => {
		verts[j * 2] = bone.a * lx + bone.b * ly + bone.worldX;
		verts[j * 2 + 1] = bone.c * lx + bone.d * ly + bone.worldY;
	});
	const uvs = new Float32Array([0, 0, 1, 0, 1, 1, 0, 1]);
	// reuse the rasteriser's triangle fill through a fake one-slot draw
	const tri = [0, 1, 2, 2, 3, 0];
	drawQuad(cv, pot, verts, uvs, tri, ox, oy);
	// spout marker
	const sp = TEAPOT.spout;
	const sx = bone.a * sp[0] + bone.b * sp[1] + bone.worldX + ox, sy = oy - (bone.c * sp[0] + bone.d * sp[1] + bone.worldY);
	for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++) {
		const px = Math.round(sx + dx), py = Math.round(sy + dy);
		if (px >= 0 && py >= 0 && px < W && py < H) cv.rgba.set([1, 0, 0, 1], (py * W + px) * 4);
	}
	for (let yy = 0; yy < H; yy++) for (let xx = 0; xx < W; xx++) {
		const a = cv.rgba[(yy * W + xx) * 4 + 3], bg = 0.3;
		const o = (yy * W * TIMES.length + i * W + xx) * 4;
		for (let c = 0; c < 3; c++) sheet.data[o + c] = Math.round(Math.min(1, cv.rgba[(yy * W + xx) * 4 + c] + bg * (1 - a)) * 255);
		sheet.data[o + 3] = 255;
	}
}
fs.writeFileSync(out, PNG.sync.write(sheet));
console.log('wrote', out);

function drawQuad(cv, img, verts, uvs, tris, ox, oy) {
	const { W, H, rgba } = cv;
	for (let t = 0; t < tris.length; t += 3) {
		const [i0, i1, i2] = [tris[t] * 2, tris[t + 1] * 2, tris[t + 2] * 2];
		const ax = verts[i0] + ox, ay = oy - verts[i0 + 1], bx = verts[i1] + ox, by = oy - verts[i1 + 1], cx = verts[i2] + ox, cy = oy - verts[i2 + 1];
		const d = (by - cy) * (ax - cx) + (cx - bx) * (ay - cy);
		if (Math.abs(d) < 1e-9) continue;
		for (let y = Math.max(0, Math.floor(Math.min(ay, by, cy))); y <= Math.min(H - 1, Math.ceil(Math.max(ay, by, cy))); y++)
			for (let x = Math.max(0, Math.floor(Math.min(ax, bx, cx))); x <= Math.min(W - 1, Math.ceil(Math.max(ax, bx, cx))); x++) {
				const l1 = ((by - cy) * (x + 0.5 - cx) + (cx - bx) * (y + 0.5 - cy)) / d;
				const l2 = ((cy - ay) * (x + 0.5 - cx) + (ax - cx) * (y + 0.5 - cy)) / d;
				const l3 = 1 - l1 - l2;
				if (l1 < 0 || l2 < 0 || l3 < 0) continue;
				const u = l1 * uvs[i0] + l2 * uvs[i1] + l3 * uvs[i2], v = l1 * uvs[i0 + 1] + l2 * uvs[i1 + 1] + l3 * uvs[i2 + 1];
				const k = (Math.min(img.height - 1, Math.floor(v * img.height)) * img.width + Math.min(img.width - 1, Math.floor(u * img.width))) * 4;
				const a = img.data[k + 3] / 255;
				if (a <= 0) continue;
				const o = (y * W + x) * 4;
				for (let c = 0; c < 3; c++) rgba[o + c] = (img.data[k + c] / 255) * a + rgba[o + c] * (1 - a);
				rgba[o + 3] = a + rgba[o + 3] * (1 - a);
			}
	}
}
