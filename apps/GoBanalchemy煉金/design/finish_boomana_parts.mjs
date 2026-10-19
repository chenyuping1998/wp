import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire('E:/stake/tools/gen/package.json');
const { PNG } = require('pngjs');
export function finishParts(app, rig, resize) {
	const src = path.join(app, 'design/source/boomana_reskin_v3'),
		out = path.join(app, 'static/assets/spines/goBananasMonkey');
	const read = (n) => PNG.sync.read(fs.readFileSync(path.join(src, n)));
	const crop = (im, box) => {
		const p = new PNG({ width: box[2] - box[0], height: box[3] - box[1] });
		PNG.bitblt(im, p, box[0], box[1], p.width, p.height, 0, 0);
		for (let i = 3; i < p.data.length; i += 4) if (p.data[i] < 40) p.data[i] = 0;
		return p;
	};
	const heads = read('head_blink_sheet.png'),
		extras = read('coat_flask_sheet.png');
	const open = resize(crop(heads, [49, 26, 860, 863]), 282, 280),
		closedSource = resize(crop(heads, [914, 27, 1725, 863]), 282, 280);
	const blink = (amount) => {
		const p = new PNG({ width: 282, height: 280 });
		open.data.copy(p.data);
		for (let y = 0; y < 280; y++)
			for (let x = 0; x < 282; x++) {
				const u = x / 282,
					v = y / 280;
				const d = Math.min(
					Math.hypot((u - 0.56) / 0.105, (v - 0.5) / 0.045),
					Math.hypot((u - 0.785) / 0.077, (v - 0.505) / 0.043),
				);
				const k = Math.max(0, Math.min(1, (1 - d) * 6)) * amount,
					i = (y * 282 + x) * 4;
				for (let c = 0; c < 3; c++)
					p.data[i + c] = open.data[i + c] * (1 - k) + closedSource.data[i + c] * k;
			}
		return p;
	};
	const images = {
		alchemist_head_open: open,
		alchemist_head_half: blink(0.55),
		alchemist_head_closed: blink(1),
		alchemist_coat_L: resize(crop(extras, [51, 28, 499, 977]), 130, 240),
		alchemist_coat_R: resize(crop(extras, [662, 28, 1133, 977]), 130, 240),
		alchemist_flask: resize(crop(extras, [1185, 188, 1483, 824]), 64, 126),
	};
	const page = new PNG({ width: 1024, height: 544 });
	let atlas =
			'\nalchemist_parts.png\nsize:1024,544\nformat:RGBA8888\nfilter:Linear,Linear\nrepeat:none\n',
		px = 2,
		py = 2,
		rowHeight = 0;
	for (const [name, im] of Object.entries(images)) {
		if (px + im.width + 2 > 1024) {
			px = 2;
			py += rowHeight + 2;
			rowHeight = 0;
		}
		PNG.bitblt(im, page, 0, 0, im.width, im.height, px, py);
		atlas += `${name}\nbounds:${px},${py},${im.width},${im.height}\noffsets:0,0,${im.width},${im.height}\nindex:-1\n`;
		fs.writeFileSync(path.join(src, 'reskinned_parts', name + '.png'), PNG.sync.write(im));
		px += im.width + 2;
		rowHeight = Math.max(rowHeight, im.height);
	}
	fs.writeFileSync(path.join(out, 'alchemist_parts.png'), PNG.sync.write(page));
	fs.appendFileSync(path.join(out, 'monkey.atlas'), atlas);
	const skin = rig.skins[0].attachments,
		byName = new Map(rig.bones.map((b, i) => [b.name, i]));
	const worlds = new Map();
	const multiply = (a, b) => [
		a[0] * b[0] + a[2] * b[1],
		a[1] * b[0] + a[3] * b[1],
		a[0] * b[2] + a[2] * b[3],
		a[1] * b[2] + a[3] * b[3],
		a[0] * b[4] + a[2] * b[5] + a[4],
		a[1] * b[4] + a[3] * b[5] + a[5],
	];
	const world = (name) => {
		if (worlds.has(name)) return worlds.get(name);
		const b = rig.bones[byName.get(name)],
			r = ((b.rotation ?? 0) * Math.PI) / 180,
			c = Math.cos(r),
			s = Math.sin(r);
		const m = multiply(b.parent ? world(b.parent) : [1, 0, 0, 1, 0, 0], [
			c * (b.scaleX ?? 1),
			s * (b.scaleX ?? 1),
			-s * (b.scaleY ?? 1),
			c * (b.scaleY ?? 1),
			b.x ?? 0,
			b.y ?? 0,
		]);
		worlds.set(name, m);
		return m;
	};
	const local = (name, x, y) => {
		const m = world(name),
			d = m[0] * m[3] - m[1] * m[2],
			dx = x - m[4],
			dy = y - m[5];
		return [(m[3] * dx - m[2] * dy) / d, (-m[1] * dx + m[0] * dy) / d];
	};
	// A tailored upper sleeve is a rigid cutout carried by the upper-arm joint.
	// The old miner's cuff mesh pinched during the full throw; the independent
	// drawing supplies shoulder overlap without borrowing torso skin weights.
	// Use the actual artist layer placement, not a bounding-box guess.
	const layers = JSON.parse(fs.readFileSync(path.join(src, 'parts/layers.json'), 'utf8')).layers;
	const sleeveLayer = layers.find((l) => l.name === 'left_arm_0_upper_arm');
	const sleevePoint = local('armL', sleeveLayer.x + 161 / 2 - 280, 884 - sleeveLayer.y - 240 / 2);
	skin.left_arm_0_upper_arm.left_arm_0_upper_arm = {
		x: sleevePoint[0],
		y: sleevePoint[1],
		width: 161,
		height: 240,
	};
	const addBone = (name, parent, x, y) => {
		const [lx, ly] = local(parent, x - 280, 884 - y);
		byName.set(name, rig.bones.length);
		rig.bones.push({ name, parent, x: +lx.toFixed(4), y: +ly.toFixed(4) });
	};
	addBone('coatL1', 'hip', 218, 495);
	addBone('coatL2', 'coatL1', 177, 610);
	addBone('coatR1', 'hip', 367, 495);
	addBone('coatR2', 'coatR1', 413, 610);
	addBone('flask', 'hip', 427, 461);
	addBone('palmL', 'armL_fore', 135, 575);
	addBone('palmR', 'armR_fore', 495, 552);
	const smooth = (k) => {
		k = Math.max(0, Math.min(1, k));
		return k * k * (3 - 2 * k);
	};
	function mesh(name, x, y, w, h, cols, rows, weights) {
		const uvs = [],
			vertices = [],
			triangles = [];
		for (let j = 0; j <= rows; j++)
			for (let i = 0; i <= cols; i++) {
				const u = i / cols,
					v = j / rows,
					wx = x + u * w - 280,
					wy = 884 - y - v * h,
					ws = weights(u, v);
				uvs.push(u, v);
				vertices.push(ws.length);
				for (const [bone, weight] of ws) {
					const [lx, ly] = local(bone, wx, wy);
					vertices.push(byName.get(bone), +lx.toFixed(5), +ly.toFixed(5), weight);
				}
			}
		for (let j = 0; j < rows; j++)
			for (let i = 0; i < cols; i++) {
				const a = j * (cols + 1) + i,
					b = a + 1,
					c = a + cols + 1,
					d = c + 1;
				triangles.push(a, c, b, b, c, d);
			}
		return { type: 'mesh', path: name, uvs, vertices, triangles, width: w, height: h };
	}
	// A separate head mesh replaces the incompatible old visor/face seam.
	// It still follows head, jaw and helmet bones; it is never joined to the body.
	const head = mesh('alchemist_head_open', 134, 20, 282, 280, 24, 24, (u, v) => {
		const jaw = 0.35 * smooth((v - 0.73) / 0.22),
			hat = 0.12 * (1 - smooth((v - 0.25) / 0.23));
		return [
			['head', 1 - jaw - hat],
			['jaw', jaw],
			['helmet', hat],
		].filter((x) => x[1] > 0);
	});
	for (const slot of rig.slots)
		if (['head_0_hair', 'head_1_hair', 'head_3_ear', 'head_4_hat'].includes(slot.name))
			delete slot.attachment;
	const faceSlot = rig.slots.find((s) => s.name === 'head_2_face');
	faceSlot.attachment = 'alchemist_head_open';
	skin.head_2_face = Object.fromEntries(
		['open', 'half', 'closed'].map((state) => [
			'alchemist_head_' + state,
			{ ...structuredClone(head), path: 'alchemist_head_' + state },
		]),
	);
	rig.animations.blink = {
		slots: {
			head_2_face: {
				attachment: [
					{ time: 0, name: 'alchemist_head_open' },
					{ time: 1.6, name: 'alchemist_head_half' },
					{ time: 1.64, name: 'alchemist_head_closed' },
					{ time: 1.72, name: 'alchemist_head_half' },
					{ time: 1.76, name: 'alchemist_head_open' },
					{ time: 4.1, name: 'alchemist_head_half' },
					{ time: 4.14, name: 'alchemist_head_closed' },
					{ time: 4.22, name: 'alchemist_head_open' },
					{ time: 4.4, name: 'alchemist_head_closed' },
					{ time: 4.48, name: 'alchemist_head_open' },
					{ time: 5.6, name: 'alchemist_head_open' },
				],
			},
		},
	};
	const coatSlots = [];
	for (const [side, x] of [
		['L', 110],
		['R', 350],
	]) {
		const name = 'alchemist_coat_' + side,
			base = 'coat' + side + '1',
			tip = 'coat' + side + '2';
		skin[name] = {
			[name]: mesh(name, x, 485, 130, 240, 10, 18, (u, v) => {
				const k = smooth((v - 0.12) / 0.68) * 0.9;
				return [
					[base, 1 - k],
					[tip, k],
				];
			}),
		};
		coatSlots.push({ name, bone: base, attachment: name });
	}
	rig.slots.splice(
		rig.slots.findIndex((s) => s.name === 'torso_0_trunk'),
		0,
		...coatSlots,
	);
	const flaskPos = local('flask', 410 + 32 - 280, 884 - 460 - 63);
	skin.alchemist_flask = {
		alchemist_flask: { x: flaskPos[0], y: flaskPos[1], width: 64, height: 126 },
	};
	rig.slots.splice(
		rig.slots.findIndex((s) => s.name === 'left_arm_1_forearm'),
		0,
		{ name: 'alchemist_flask', bone: 'flask', attachment: 'alchemist_flask' },
	);
	for (const [name, amplitude] of [
		['coatL2', 2.3],
		['coatR2', -2.3],
		['flask', 2],
	]) {
		rig.animations.flutter.bones[name] = {
			rotate: [
				{ time: 0, value: 0 },
				{ time: 0.8, value: amplitude },
				{ time: 2, value: -amplitude * 0.65 },
				{ time: 3.2, value: amplitude * 0.75 },
				{ time: 4.8, value: 0 },
			],
		};
	}
	fs.writeFileSync(path.join(out, 'monkey.json'), JSON.stringify(rig) + '\n');
	const placements = [
		{ name: 'alchemist_coat_L', x: 110, y: 485 },
		{ name: 'alchemist_coat_R', x: 350, y: 485 },
		...JSON.parse(fs.readFileSync(path.join(src, 'parts/layers.json'), 'utf8')).layers.filter(
			(l) => !/^head_[0-4]_/.test(l.name),
		),
		{ name: 'alchemist_head_open', x: 134, y: 20 },
		{ name: 'head_5_decoration', x: 134, y: 0 },
		{ name: 'alchemist_flask', x: 410, y: 460 },
	];
	// Head banana is drawn last, as in the source skeleton; remove its early copy.
	const flat = new PNG({ width: 560, height: 912 });
	for (const p of placements) {
		if (p.name === 'head_5_decoration' && p !== placements[placements.length - 2]) continue;
		const im =
			images[p.name] ??
			PNG.sync.read(fs.readFileSync(path.join(src, 'reskinned_parts', p.name + '.png')));
		for (let y = 0; y < im.height; y++)
			for (let x = 0; x < im.width; x++) {
				const xx = x + p.x,
					yy = y + p.y;
				if (xx < 0 || xx >= 560 || yy < 0 || yy >= 912) continue;
				const a = (y * im.width + x) * 4,
					b = (yy * 560 + xx) * 4,
					sa = im.data[a + 3] / 255,
					da = flat.data[b + 3] / 255,
					alpha = sa + da * (1 - sa);
				for (let c = 0; c < 3; c++)
					flat.data[b + c] = alpha
						? (im.data[a + c] * sa + flat.data[b + c] * da * (1 - sa)) / alpha
						: 0;
				flat.data[b + 3] = alpha * 255;
			}
	}
	fs.writeFileSync(path.join(src, 'assembled_rest.png'), PNG.sync.write(flat));
}
