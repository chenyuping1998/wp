// Renders the Bandleader's `bow` clip (bow_motion.mjs) at a few moments into
// one contact sheet. For looking at the pose offline; not part of the build.
//
// Usage: node design/render_bow.mjs <out.png> [toolsDir]
import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';

process.env.CAST_MOTION_LIB = '1';
const { loadCast, renderSkeleton, core } = await import('./check_cast_motion.mjs');

const out = process.argv[2] ?? 'bow.png';
const toolsDir = process.argv[3] ?? 'E:/stake/tools/gen';
const { PNG } = createRequire(path.join(toolsDir, 'noop.js'))('pngjs');

const { data, page } = loadCast(process.env.SPINE ?? 'sushiMaster');
const ANIM = process.env.ANIM ?? 'bow';
const TIMES = (process.env.TIMES ?? '0,0.2,0.4,0.62,1.0,1.4,1.6,2.0').split(',').map(Number);
const W = 640, H = 1000, ox = 340, oy = 960;
const sheet = new PNG({ width: W * TIMES.length, height: H });

for (const [i, t] of TIMES.entries()) {
	const skeleton = new core.Skeleton(data);
	const state = new core.AnimationState(new core.AnimationStateData(data));
	state.setAnimation(0, ANIM, false);
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
	for (let yy = 0; yy < H; yy++) for (let xx = 0; xx < W; xx++) {
		const a = cv.rgba[(yy * W + xx) * 4 + 3], bg = 0.3;
		const o = (yy * W * TIMES.length + i * W + xx) * 4;
		for (let c = 0; c < 3; c++) sheet.data[o + c] = Math.round(Math.min(1, cv.rgba[(yy * W + xx) * 4 + c] + bg * (1 - a)) * 255);
		sheet.data[o + 3] = 255;
	}
}
fs.writeFileSync(out, PNG.sync.write(sheet));
console.log('wrote', out);
