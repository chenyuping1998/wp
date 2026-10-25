import fs from 'node:fs';
import { bake } from '../../../../spine-generator/src/bake.ts';

export function applyDjScratch(skeleton) {
	const page = new URL('../static/assets/spines/goBananasMonkey/dj_hand.png', import.meta.url);
	if (!fs.existsSync(page)) return;
	const atlasPath = new URL('../static/assets/spines/goBananasMonkey/monkey.atlas', import.meta.url);
	const atlas = fs.readFileSync(atlasPath, 'utf8').split(/\r?\n\r?\ndj_hand\.png/)[0].trimEnd();
	fs.writeFileSync(atlasPath, atlas + '\n\ndj_hand.png\nsize:512,768\nformat:RGBA8888\nfilter:Linear,Linear\nrepeat:none\ndj_hand\nbounds:0,0,512,768\noffsets:0,0,512,768\nindex:-1\n');
	const addBone = (name, parent, x, y) => {
		const old = skeleton.bones.find((bone) => bone.name === name);
		if (old) Object.assign(old, { parent, x, y });
		else skeleton.bones.push({ name, parent, x, y });
	};
	const W = 124, H = 178, rootV = 0.4;
	// Palm pivot; proximal fur is skinned separately to the sleeve below.
	addBone('dj_wrist', 'armL_fore', 0, -109);
	const fingers = [
		{ name: 'thumb', u: 0.26, v: 0.42, tip: 0.55 },
		{ name: 'index', u: 0.39, v: 0.58, tip: 0.78 },
		{ name: 'middle', u: 0.55, v: 0.62, tip: 0.83 },
		{ name: 'ring', u: 0.74, v: 0.62, tip: 0.80 },
		{ name: 'pinky', u: 0.90, v: 0.58, tip: 0.73 },
	];
	for (const f of fingers) {
		addBone(`dj_${f.name}`, 'dj_wrist', (f.u - 0.5) * W, (rootV - f.v) * H);
		addBone(`dj_${f.name}_tip`, `dj_${f.name}`, 0, -(f.tip - f.v) * H);
	}
	// A single continuous forearm-to-finger mesh replaces the old fist in DJ poses.
	skeleton.slots = skeleton.slots.filter((slot) => slot.name !== 'dj_hand');
	const handIndex = skeleton.slots.findIndex((slot) => slot.name === 'left_arm_2_hand');
	skeleton.slots.splice(handIndex + 1, 0, { name: 'dj_hand', bone: 'dj_wrist' });
	const at = skeleton.skins[0].attachments;
	delete at.left_arm_2_hand.dj_forearm;
	const cols = 28, rows = 40, uvs = [], vertices = [], triangles = [];
	const smooth = (x) => { const t = Math.max(0, Math.min(1, x)); return t * t * (3 - 2 * t); };
	for (let row = 0; row <= rows; row++) for (let col = 0; col <= cols; col++) {
		const u = col / cols, v = row / rows;
		const restLocalX = (u - 0.5) * (W + 56 * (1 - smooth((v - 0.10) / 0.55)));
		const proximalExtension = 60 * (1 - smooth((v - 0.04) / 0.50));
		uvs.push(u, v);
		// Blend across the transparent finger gaps too: a hard nearest-finger
		// boundary folds the connecting mesh when index and middle press oppositely.
		const thumb = smooth((0.31 - u) / 0.10) * (1 - smooth((v - 0.60) / 0.12));
		let left = 1, right = 1, between = 0;
		for (let i = 1; i < 4; i++) if (u >= fingers[i].u) {
			left = i; right = i + 1;
			between = Math.max(0, Math.min(1, (u - fingers[i].u) / (fingers[i + 1].u - fingers[i].u)));
		}
		const branches = [[0, thumb], [left, (1 - thumb) * (1 - between)], [right, (1 - thumb) * between]];
		const weights = [];
		let wristWeight = 0;
		for (const [i, branch] of branches) {
			const f = fingers[i], fw = smooth((v - f.v) / 0.14), tw = smooth((v - f.tip) / 0.14);
			wristWeight += branch * (1 - fw);
			weights.push([`dj_${f.name}`, branch * fw * (1 - tw), f.u, f.v], [`dj_${f.name}_tip`, branch * fw * tw, f.u, f.tip]);
		}
		weights.push(['dj_wrist', wristWeight, 0.5, rootV]);
		// Anchor the first fur rows to the cuff's upper-arm bone, then hand over
		// smoothly to the palm. No independently translating cutout at the wrist.
		// Avoid the old forearm bone here: its 65-degree bend pinched the middle
		// of this shorter, continuous mesh when combined with wrist counterrotation.
		const wristInfluence = smooth((v - 0.04) / 0.56);
		const restX = -180 + restLocalX;
		const restY = 378 + (rootV - v) * H + proximalExtension;
		const nonzero = weights.map(([name, w, ou, ov]) => [name, w * wristInfluence, restLocalX - (ou - 0.5) * W, (ov - v) * H + proximalExtension]);
		nonzero.push(['armL', 1 - wristInfluence, restX + 174, restY - 642]);
		const influences = nonzero.filter(([, w]) => w > 0.000001);
		vertices.push(influences.length);
		for (const [name, w, x, y] of influences) vertices.push(skeleton.bones.findIndex((bone) => bone.name === name), x, y, w);
	}
	for (let row = 0; row < rows; row++) for (let col = 0; col < cols; col++) {
		const a = row * (cols + 1) + col, b = a + 1, c = a + cols + 1, d = c + 1;
		triangles.push(a, b, d, a, d, c);
	}
	at.dj_hand = { dj_hand: { type: 'mesh', path: 'dj_hand', uvs, vertices, triangles, width: 512, height: 768 } };
	const D = 3.2;
	const lift = (t) => smooth(t / 0.5) * (1 - smooth((t - 2.7) / 0.5));
	const active = (t) => smooth((t - 0.45) / 0.18) * (1 - smooth((t - 2.50) / 0.2));
	const beat = (t, phase = 0) => Math.sin(2 * Math.PI * (t - 0.6) / 0.48 + phase);
	const phrase = (t, phase = 0) => Math.sin(2 * Math.PI * (t - 0.6) / 1.92 + phase);
	const pulse = (t, start, peak, end) => t < peak ? smooth((t - start) / (peak - start)) : 1 - smooth((t - peak) / (end - peak));
	const prepare = (t) => pulse(t, 0, 0.12, 0.4);
	const recover = (t) => pulse(t, 2.65, 2.86, D);
	const bones = {};
	const track = (bone, channel, fn) => {
		bones[bone] ??= {};
		bones[bone][channel] = bake({ duration: D, loop: false, value: fn, breaks: [0.22, 0.45, 0.5, 0.63, 2.5, 2.7] }, { fps: 60, tolerance: 0.04, maxSegment: 0.08 });
	};
	// Fold the elbow inward: the imaginary deck is in front of the abdomen.
	// The wrist counter-rotates so the fingers reach toward the viewer, while
	// forearm extension supplies the forward/back scratch instead of a side wave.
	track('armL', 'rotate', (t) => 18 * lift(t) + 1.2 * active(t) * beat(t) - 1.2 * prepare(t) + 0.6 * recover(t));
	track('armL_fore', 'rotate', (t) => 65 * lift(t) + 4 * active(t) * beat(t, 0.3) - 1.5 * prepare(t) + 0.8 * recover(t));
	track('dj_wrist', 'rotate', (t) => -45 * lift(t) - 3 * active(t) * beat(t, 0.3));
	track('armL_fore', 'translatex', (t) => -4 * active(t) * beat(t));
	track('armL_fore', 'translatey', (t) => -18 * active(t) * beat(t));
	track('dj_wrist', 'scaley', (t) => 1 - 0.18 * lift(t) + 0.035 * active(t) * beat(t));
	track('torso', 'rotate', (t) => 2.2 * lift(t) + active(t) * (0.8 * beat(t, -0.5) + 1.1 * phrase(t, -0.18)) - 1.25 * prepare(t) + 0.7 * recover(t));
	track('torso', 'translatex', (t) => -5 * lift(t) + 4.0 * active(t) * phrase(t, -0.25) + 2.0 * prepare(t) - 1.2 * recover(t));
	track('torso', 'translatey', (t) => -2.0 * lift(t) + 1.4 * active(t) * beat(t, -0.3) - 1.1 * prepare(t) + 0.65 * recover(t));
	track('torso', 'scalex', (t) => 1 - 0.0025 * lift(t) + 0.0015 * active(t) * phrase(t));
	track('torso', 'scaley', (t) => 1 + 0.003 * lift(t) + 0.002 * active(t) * phrase(t, -0.3));
	track('head', 'rotate', (t) => -2 * lift(t) + active(t) * (1.6 * beat(t, -0.9) - 1.1 * phrase(t, -0.55)) + 0.95 * prepare(t) - 0.45 * recover(t));
	track('head', 'translatex', (t) => -0.8 * active(t) * phrase(t, -0.5));
	track('head', 'translatey', (t) => -1.1 * lift(t) + 0.8 * active(t) * beat(t, -1.05));
	track('armR', 'rotate', (t) => 3 * lift(t) + active(t) * (2.5 * beat(t, Math.PI) + 1.4 * phrase(t, -0.4)) - 1.2 * prepare(t) + 1.0 * recover(t));
	track('armR_fore', 'rotate', (t) => -0.6 * lift(t) + 1.8 * active(t) * beat(t, Math.PI - 0.5) + 0.6 * recover(t));
	track('armR_hand', 'rotate', (t) => 0.75 * active(t) * beat(t, Math.PI - 0.9));
	fingers.forEach((f, i) => {
		const phase = [0.2, 0, Math.PI, 1.6, 2.1][i];
		track(`dj_${f.name}`, 'rotate', (t) => lift(t) * [-5, -3, 1, 4, 7][i] + active(t) * 2.5 * beat(t, phase));
		track(`dj_${f.name}_tip`, 'rotate', (t) => lift(t) * [3, 5, 4, 7, 9][i] + active(t) * [2, 7, 6, 3, 2][i] * beat(t, phase + 0.4));
		if (i === 1 || i === 2) track(`dj_${f.name}_tip`, 'scaley', (t) => 1 - active(t) * 0.045 * Math.max(0, beat(t, phase)));
	});
	skeleton.events ??= {};
	skeleton.events.djStroke ??= { int: 0 };
	skeleton.animations.dj_scratch = { bones, events: [0.6, 1.08, 1.56, 2.04].map((time, i) => ({ time, name: 'djStroke', int: i + 1 })), slots: {
		left_arm_1_forearm: { attachment: [{ time: 0, name: 'left_arm_1_forearm_punch' }, { time: D, name: 'left_arm_1_forearm' }] },
		left_arm_2_hand: {
			attachment: [{ time: 0, name: 'left_arm_2_hand_punch' }, { time: 0.34, name: null }, { time: 2.86, name: 'left_arm_2_hand_punch' }, { time: D, name: 'left_arm_2_hand' }],
			rgba: [{ time: 0, color: 'ffffffff' }, { time: 0.16, color: 'ffffffff' }, { time: 0.34, color: 'ffffff00' }, { time: 2.86, color: 'ffffff00' }, { time: 3.04, color: 'ffffffff' }, { time: D, color: 'ffffffff' }],
		},
		dj_hand: {
			attachment: [{ time: 0, name: null }, { time: 0.16, name: 'dj_hand' }, { time: 3.04, name: null }],
			rgba: [{ time: 0, color: 'ffffff00' }, { time: 0.16, color: 'ffffff00' }, { time: 0.34, color: 'ffffffff' }, { time: 2.86, color: 'ffffffff' }, { time: 3.04, color: 'ffffff00' }],
		},
	} };
}
