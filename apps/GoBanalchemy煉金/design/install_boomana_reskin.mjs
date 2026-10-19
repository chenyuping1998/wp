/** Deterministic Boomana part/rig transplant. Original project is read-only. */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { finishParts } from './finish_boomana_parts.mjs';
import { retargetChest } from './retarget_boom_chest.mjs';
const require = createRequire('E:/stake/tools/gen/package.json');
const { PNG } = require('pngjs');
const app = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = path.join(app, 'design/source/boomana_reskin_v3');
const out = path.join(app, 'static/assets/spines/goBananasMonkey');
const previous = path.join(app, 'design/source/pre_boomana_v3');
if (!fs.existsSync(previous)) fs.cpSync(out, previous, { recursive: true });
const read = (file) => PNG.sync.read(fs.readFileSync(file));
const save = (file, png) => fs.writeFileSync(file, PNG.sync.write(png));
function resize(im, width, height) {
	const result = new PNG({ width, height });
	for (let y = 0; y < height; y++)
		for (let x = 0; x < width; x++) {
			const u = ((x + 0.5) * im.width) / width - 0.5,
				v = ((y + 0.5) * im.height) / height - 0.5,
				ix = Math.floor(u),
				iy = Math.floor(v);
			let a = 0;
			const c = [0, 0, 0];
			for (let j = 0; j < 2; j++)
				for (let i = 0; i < 2; i++) {
					const w = (i ? u - ix : 1 - u + ix) * (j ? v - iy : 1 - v + iy),
						k =
							(Math.max(0, Math.min(im.height - 1, iy + j)) * im.width +
								Math.max(0, Math.min(im.width - 1, ix + i))) *
							4,
						al = im.data[k + 3] / 255;
					a += al * w;
					for (let ch = 0; ch < 3; ch++) c[ch] += im.data[k + ch] * al * w;
				}
			const k = (y * width + x) * 4;
			for (let ch = 0; ch < 3; ch++) result.data[k + ch] = a > 1e-6 ? c[ch] / a : 0;
			result.data[k + 3] = a * 255;
		}
	return result;
}
const original = read(path.join(src, 'boom_monkey.png'));
const painting = read(path.join(src, 'painted_body_atlas.png'));
const painted = resize(painting, 1024, original.height - 622);
// Generated atlas islands are fitted individually back to the artist's exact
// trim rectangles; a global resize alone can clip a wider replacement crown.
const paintedBoxes = {
	torso_0_trunk: [7, 0, 436, 525],
	torso_1_decoration: [284, 506, 594, 810],
	left_arm_0_upper_arm: [744, 504, 929, 797],
	right_arm_0_upper_arm: [339, 822, 478, 1070],
	left_leg_1_calf: [2, 818, 161, 1074],
	left_leg_0_thigh: [147, 817, 339, 1075],
	right_leg_0_thigh: [471, 821, 647, 1065],
	right_leg_1_calf: [647, 819, 812, 1056],
	head_4_hat: [819, 818, 1143, 1045],
	left_leg_2_foot: [339, 1081, 476, 1224],
	right_leg_2_foot: [592, 1085, 799, 1217],
	left_arm_1_forearm: [815, 1080, 926, 1188],
};
const atlas = read(path.join(src, 'boom_monkey.png'));
const atlasText = fs.readFileSync(path.join(src, 'boom_monkey.atlas'), 'utf8');
const regions = [...atlasText.matchAll(/^([^\r\n]+)\r?\nbounds:(\d+),(\d+),(\d+),(\d+)/gm)].map(
	(m) => ({ name: m[1], x: +m[2], y: +m[3], w: +m[4], h: +m[5] }),
);
const partsDir = path.join(src, 'reskinned_parts');
fs.mkdirSync(partsDir, { recursive: true });
const parts = {};
for (const region of regions) {
	const { name, x, y, w, h } = region;
	const piece = new PNG({ width: w, height: h });
	if (name === 'dynamite')
		PNG.bitblt(
			read(path.join(app, 'static/assets/sprites/goBanalchemySymbols/reagent_prop.png')),
			piece,
			0,
			0,
			w,
			h,
			0,
			0,
		);
	else {
		const clothing = /^(torso_|.*_leg_|.*_arm_0_|head_4_)/.test(name);
		const box = paintedBoxes[name];
		if (box) {
			const crop = new PNG({ width: box[2] - box[0], height: box[3] - box[1] });
			PNG.bitblt(painting, crop, box[0], box[1], crop.width, crop.height, 0, 0);
			PNG.bitblt(resize(crop, w, h), piece, 0, 0, w, h, 0, 0);
			if (name !== 'head_4_hat')
				for (let yy = 0; yy < h; yy++)
					for (let xx = 0; xx < w; xx++) {
						const k = (yy * w + xx) * 4 + 3;
						piece.data[k] = Math.min(
							piece.data[k],
							original.data[((y + yy) * original.width + x + xx) * 4 + 3],
						);
					}
		} else PNG.bitblt(clothing ? painted : original, piece, x, clothing ? y - 622 : y, w, h, 0, 0);
	}
	save(path.join(partsDir, name + '.png'), piece);
	parts[name] = piece;
	PNG.bitblt(piece, atlas, 0, 0, w, h, x, y);
}
save(path.join(out, 'monkey.png'), atlas);
fs.writeFileSync(path.join(out, 'monkey.atlas'), atlasText);
const rig = JSON.parse(fs.readFileSync(path.join(src, 'boom_monkey.json'), 'utf8'));
rig.skeleton.hash = 'gb-alchemist-boom-v3';
// Keep the Boomana rig and its independent limb attachments. Remove inherited
// limb stretching; larger gestures are rotations, not longer painted limbs.
for (const anim of Object.values(rig.animations))
	for (const [name, channels] of Object.entries(anim.bones ?? {})) {
		if (/^(arm|leg)/.test(name)) {
			delete channels.scale;
			delete channels.translate;
		}
	}
// The original keys are read again for the restrained breathing scale.
const sourceRig = JSON.parse(fs.readFileSync(path.join(src, 'boom_monkey.json'), 'utf8'));
for (const [name, anim] of Object.entries(rig.animations))
	for (const bone of ['hip', 'torso', 'head']) {
		const originalChannels = sourceRig.animations[name]?.bones?.[bone];
		if (originalChannels?.scale)
			anim.bones[bone].scale = originalChannels.scale.map((k) => ({
				...k,
				x: 1 + ((k.x ?? 1) - 1) * 0.12,
				y: 1 + ((k.y ?? 1) - 1) * 0.12,
			}));
	}
// Existing alchemy transition expects release at 380ms. Retiming the entire
// throw timeline preserves the source wind-up/release/recovery relationship.
const retime = (t) => (t <= 0.58 ? t * (0.38 / 0.58) : 0.38 + (t - 0.58) * (0.82 / 0.62));
const throwAnim = rig.animations.throwit;
for (const channels of Object.values(throwAnim.bones ?? {}))
	for (const keys of Object.values(channels))
		for (const k of keys) k.time = +retime(k.time ?? 0).toFixed(5);
for (const channels of Object.values(throwAnim.slots ?? {}))
	for (const keys of Object.values(channels))
		for (const k of keys) k.time = +retime(k.time ?? 0).toFixed(5);
// Spine's Bezier controls contain absolute coordinates. Rebuild them after
// retiming/scaling rather than retaining stale curve values that overshoot.
for (const anim of Object.values(rig.animations))
	for (const channels of Object.values(anim.bones ?? {}))
		for (const [channel, keys] of Object.entries(channels)) {
			if (!['rotate', 'scale', 'translate'].includes(channel)) continue;
			for (let i = 0; i < keys.length; i++) {
				const k = keys[i],
					n = keys[i + 1];
				delete k.curve;
				if (!n) continue;
				const t = k.time ?? 0,
					end = n.time ?? 0;
				if (end <= t) continue;
				k.curve = [];
				for (const axis of channel === 'rotate' ? ['value'] : ['x', 'y']) {
					const fallback = channel === 'scale' ? 1 : 0;
					k.curve.push(
						+(t + (end - t) / 3).toFixed(5),
						k[axis] ?? fallback,
						+(end - (end - t) / 3).toFixed(5),
						n[axis] ?? fallback,
					);
				}
			}
		}
// A separate blink clip will swap the head-top attachment when its painted
// frames are installed. Keeping the named track prevents animation lookup errors.
rig.animations.blink = { slots: {} };
fs.writeFileSync(path.join(out, 'monkey.json'), JSON.stringify(rig) + '\n');
// Rest-pose assembly is an asset QA reference, not a runtime flattened sprite.
const layout = JSON.parse(fs.readFileSync(path.join(src, 'parts/layers.json'), 'utf8'));
const flat = new PNG({ width: layout.canvas[0], height: layout.canvas[1] });
for (const layer of layout.layers) {
	const p = parts[layer.name];
	if (!p) continue;
	for (let y = 0; y < p.height; y++)
		for (let x = 0; x < p.width; x++) {
			const xx = x + layer.x,
				yy = y + layer.y;
			if (xx < 0 || yy < 0 || xx >= flat.width || yy >= flat.height) continue;
			const a = (y * p.width + x) * 4,
				b = (yy * flat.width + xx) * 4,
				sa = p.data[a + 3] / 255,
				da = flat.data[b + 3] / 255,
				oa = sa + da * (1 - sa);
			for (let c = 0; c < 3; c++)
				flat.data[b + c] = oa ? (p.data[a + c] * sa + flat.data[b + c] * da * (1 - sa)) / oa : 0;
			flat.data[b + 3] = oa * 255;
		}
}
save(path.join(src, 'assembled_rest.png'), flat);
fs.writeFileSync(
	path.join(src, 'skin_manifest.json'),
	JSON.stringify(
		{
			version: 3,
			source: 'GoBoomana',
			rigHash: rig.skeleton.hash,
			releaseMs: 380,
			parts: regions.map((r) => r.name),
			atlasSize: [atlas.width, atlas.height],
			prompt:
				'precise-object-edit; fixed Boomana atlas layout; teal/brass alchemist costume, ivory cuffs, brown boots, forehead green goggles; preserve gorilla identity and separate body parts',
			generator: 'built-in image_gen',
		},
		null,
		2,
	) + '\n',
);
console.log(
	`Installed ${regions.length} separate regions on original Boomana skeleton; previous runtime preserved.`,
);
finishParts(app, rig, resize);
await retargetChest(app);
