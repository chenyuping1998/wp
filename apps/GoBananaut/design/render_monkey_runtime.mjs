// Renders the monkey through the REAL Spine runtime to a contact sheet.
//
//   node design/render_monkey_runtime.mjs [toolsDir] <anim> [out.png] [--crop=x0,y0,x1,y1] [--frames=8]
//
// preview_monkey_spine.mjs is a small forward-kinematics renderer of its own:
// quads only, linear keys. Once the sleeves became weighted MESHES it could not
// draw them at all. This one asks spine-core — the runtime spine-pixi-v8 renders
// with in the game — where every vertex of every attachment is, region or mesh,
// and rasterises those triangles from the atlas. It cannot disagree with the
// game about the pose, which is the whole point of a preview.
//
// Frames sample the animation evenly (setup pose first). `--crop` is in canvas
// pixels of the full frame, for zooming on a shoulder.
//
// `--live` plays it the way Mascot.svelte does instead of posing single frames:
// an AnimationState with the gesture on track 0, `flutter` (or `flutter_float`
// with `--float`) on track 1 and `sparkle` on track 2, stepped at 60fps with the
// PHYSICS running — so the hanging and loose pieces (banana, hose, pens, tubes)
// lag and settle as they will in the game. Slot colours and additive slots (the
// chest lights, the badge glint) are drawn too.
import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const args = process.argv.slice(2);
const flag = (n) => args.find((a) => a.startsWith(`--${n}=`))?.split('=')[1];
const pos = args.filter((a) => !a.startsWith('--'));
const toolsDir = pos[0] && /[\\/]/.test(pos[0]) ? pos.shift() : 'E:/stake/tools/gen';
const animName = pos[0] ?? 'idle';
const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outPath = pos[1] ?? path.join(appRoot, `design/source/monkey/_runtime_${animName}.png`);
const FRAMES = Number(flag('frames') ?? 8);
const crop = flag('crop')?.split(',').map(Number);

const { PNG } = createRequire(path.join(toolsDir, 'noop.js'))('pngjs');
const fromPixiSvelte = createRequire(path.join(appRoot, '../../packages/pixi-svelte/package.json'));
const spinePixi = fs.realpathSync(path.dirname(fromPixiSvelte.resolve('@esotericsoftware/spine-pixi-v8')));
const core = await import(pathToFileURL(createRequire(path.join(spinePixi, 'x.js')).resolve('@esotericsoftware/spine-core')).href);

const DIR = path.join(appRoot, 'static/assets/spines/goBananasMonkey');
const atlasText = fs.readFileSync(path.join(DIR, 'monkey.atlas'), 'utf8');
const page = PNG.sync.read(fs.readFileSync(path.join(DIR, 'monkey.png')));
const atlas = new core.TextureAtlas(atlasText);
for (const p of atlas.pages)
	p.setTexture({ setFilters() {}, setWraps() {}, dispose() {}, getImage: () => ({ width: page.width, height: page.height }) });
const data = new core.SkeletonJson(new core.AtlasAttachmentLoader(atlas)).readSkeletonData(
	JSON.parse(fs.readFileSync(path.join(DIR, 'monkey.json'), 'utf8')),
);
const anim = data.findAnimation(animName);
if (!anim) {
	console.error(`no animation "${animName}" — have: ${data.animations.map((a) => a.name).join(', ')}`);
	process.exit(1);
}

// every drawable of a posed skeleton: world triangles with page UVs, in draw order
const drawables = (s) => {
	const out = [];
	for (const slot of s.drawOrder) {
		const att = slot.getAttachment();
		if (!att) continue;
		if (att instanceof core.RegionAttachment) {
			const w = new Float32Array(8);
			att.computeWorldVertices(slot, w, 0, 2);
			out.push({ w, uv: att.uvs, tris: [0, 1, 2, 2, 3, 0], slot });
		} else if (att instanceof core.MeshAttachment) {
			const w = new Float32Array(att.worldVerticesLength);
			att.computeWorldVertices(slot, 0, w.length, w, 0, 2);
			out.push({ w, uv: att.uvs, tris: att.triangles, slot });
		}
	}
	return out;
};

const LIVE = args.includes('--live');
const livePoses = (times) => {
	const s = new core.Skeleton(data);
	s.setToSetupPose();
	const state = new core.AnimationState(new core.AnimationStateData(data));
	state.setAnimation(0, animName, false);
	state.setAnimation(1, args.includes('--float') ? 'flutter_float' : 'flutter', true);
	if (data.findAnimation('sparkle')) state.setAnimation(2, 'sparkle', true);
	const dt = 1 / 60;
	const out = [];
	state.apply(s);
	s.updateWorldTransform(core.Physics.reset);
	let t = 0;
	for (const target of times.map((x) => Math.max(0, x))) {
		while (t < target - 1e-6) {
			state.update(dt);
			state.apply(s);
			s.update(dt);
			s.updateWorldTransform(core.Physics.update);
			t += dt;
		}
		out.push(renderFrame(s));
	}
	return out;
};
const pose = (t) => {
	const s = new core.Skeleton(data);
	s.setToSetupPose();
	if (t >= 0) anim.apply(s, 0, t, false, [], 1, core.MixBlend.setup, core.MixDirection.mixIn);
	s.updateWorldTransform(core.Physics.pose);
	return s;
};

// frame bounds from the setup pose, with room for the gestures
let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
for (const d of drawables(pose(-1)))
	for (let i = 0; i < d.w.length; i += 2) {
		x0 = Math.min(x0, d.w[i]);
		x1 = Math.max(x1, d.w[i]);
		y0 = Math.min(y0, d.w[i + 1]);
		y1 = Math.max(y1, d.w[i + 1]);
	}
const PAD = 90;
x0 -= PAD; x1 += PAD; y0 -= PAD; y1 += PAD * 1.4;
const FW = Math.ceil(x1 - x0), FH = Math.ceil(y1 - y0);
const [cx0, cy0, cx1, cy1] = crop ?? [0, 0, FW, FH];
const CW = cx1 - cx0, CH = cy1 - cy0;

const sampleTex = (u, v, rgba) => {
	const x = Math.min(page.width - 1, Math.max(0, u * page.width - 0.5));
	const y = Math.min(page.height - 1, Math.max(0, v * page.height - 0.5));
	const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy;
	const ix1 = Math.min(ix + 1, page.width - 1), iy1 = Math.min(iy + 1, page.height - 1);
	for (let c = 0; c < 4; c++) {
		const p = (xx, yy) => page.data[(yy * page.width + xx) * 4 + c];
		rgba[c] = (p(ix, iy) * (1 - fx) + p(ix1, iy) * fx) * (1 - fy) + (p(ix, iy1) * (1 - fx) + p(ix1, iy1) * fx) * fy;
	}
};

const renderFrame = (s) => {
	const buf = new Float32Array(CW * CH * 3).fill(0.07 * 255);
	const rgba = new Float32Array(4);
	for (const d of drawables(s)) {
		const sc = d.slot.color;
		const additive = d.slot.data.blendMode === core.BlendMode.Additive;
		// skeleton y is UP; the canvas y is down
		const px = (i) => d.w[i * 2] - x0 - cx0;
		const py = (i) => y1 - d.w[i * 2 + 1] - cy0;
		for (let t = 0; t < d.tris.length; t += 3) {
			const [a, b, c] = [d.tris[t], d.tris[t + 1], d.tris[t + 2]];
			const ax = px(a), ay = py(a), bx = px(b), by = py(b), qx = px(c), qy = py(c);
			const den = (by - qy) * (ax - qx) + (qx - bx) * (ay - qy);
			if (Math.abs(den) < 1e-9) continue;
			const minX = Math.max(0, Math.floor(Math.min(ax, bx, qx))), maxX = Math.min(CW - 1, Math.ceil(Math.max(ax, bx, qx)));
			const minY = Math.max(0, Math.floor(Math.min(ay, by, qy))), maxY = Math.min(CH - 1, Math.ceil(Math.max(ay, by, qy)));
			for (let y = minY; y <= maxY; y++)
				for (let x = minX; x <= maxX; x++) {
					const X = x + 0.5, Y = y + 0.5;
					const l1 = ((by - qy) * (X - qx) + (qx - bx) * (Y - qy)) / den;
					const l2 = ((qy - ay) * (X - qx) + (ax - qx) * (Y - qy)) / den;
					const l3 = 1 - l1 - l2;
					if (l1 < -1e-6 || l2 < -1e-6 || l3 < -1e-6) continue;
					const u = l1 * d.uv[a * 2] + l2 * d.uv[b * 2] + l3 * d.uv[c * 2];
					const v = l1 * d.uv[a * 2 + 1] + l2 * d.uv[b * 2 + 1] + l3 * d.uv[c * 2 + 1];
					sampleTex(u, v, rgba);
					const al = (rgba[3] / 255) * sc.a;
					if (al <= 0) continue;
					const o = (y * CW + x) * 3;
					const tint = [sc.r, sc.g, sc.b];
					for (let k = 0; k < 3; k++)
						buf[o + k] = additive
							? Math.min(255, buf[o + k] + rgba[k] * tint[k] * al)
							: buf[o + k] * (1 - al) + rgba[k] * tint[k] * al;
				}
		}
	}
	return buf;
};

const times = Array.from({ length: FRAMES }, (_, i) => (i === 0 ? -1 : (anim.duration * i) / (FRAMES - 1)));
const GAP = 8;
const sheet = new PNG({ width: FRAMES * (CW + GAP), height: CH });
sheet.data.fill(40);
const liveBufs = LIVE ? livePoses(times) : null;
times.forEach((t, f) => {
	const buf = LIVE ? liveBufs[f] : renderFrame(pose(t));
	for (let y = 0; y < CH; y++)
		for (let x = 0; x < CW; x++) {
			const i = (y * CW + x) * 3, o = (y * sheet.width + f * (CW + GAP) + x) * 4;
			sheet.data[o] = buf[i];
			sheet.data[o + 1] = buf[i + 1];
			sheet.data[o + 2] = buf[i + 2];
			sheet.data[o + 3] = 255;
		}
});
fs.writeFileSync(outPath, PNG.sync.write(sheet));
console.log(`${animName}: ${FRAMES} frames (setup, then ${times.slice(1).map((t) => t.toFixed(2)).join(', ')}s) -> ${outPath}  frame ${FW}x${FH}`);
