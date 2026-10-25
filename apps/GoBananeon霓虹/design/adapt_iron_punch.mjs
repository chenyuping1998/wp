// Measured Iron Jaw timing + FK poses fitted to Neon's hanging-arm artwork.
import { compileRecipe } from '../../../../spine-generator/src/recipe.ts';
import fs from 'node:fs';

function repairElbow(skeleton) {
	const layers = JSON.parse(fs.readFileSync(new URL('./source/monkey_neon/layers.json', import.meta.url), 'utf8')).layers;
	const frames = new Map();
	for (const bone of skeleton.bones) {
		const p = frames.get(bone.parent) ?? { x: 0, y: 0, angle: 0 };
		const r = p.angle * Math.PI / 180;
		frames.set(bone.name, {
			x: p.x + (bone.x ?? 0) * Math.cos(r) - (bone.y ?? 0) * Math.sin(r),
			y: p.y + (bone.x ?? 0) * Math.sin(r) + (bone.y ?? 0) * Math.cos(r),
			angle: p.angle + (bone.rotation ?? 0),
		});
	}
	const attachments = skeleton.skins[0].attachments;
	// The extra cuff is part of the sleeve, not a rigid plate on the bending forearm.
	const cuffSlot = skeleton.slots.find((slot) => slot.name === 'left_arm_1_forearm');
	cuffSlot.bone = 'armL_fore';
	const resetRegion = (name, boneName) => {
		const layer = layers.find((piece) => piece.name === name), bone = frames.get(boneName);
		attachments[name][name] = { x: layer.x + layer.w / 2 - 280 - bone.x, y: 884 - layer.y - layer.h / 2 - bone.y, width: layer.w, height: layer.h };
	};
	resetRegion(cuffSlot.name, 'armL_fore');
	resetRegion('left_arm_2_hand', 'armL_fore');
	const cuff = layers.find((piece) => piece.name === cuffSlot.name), upper = frames.get('armL');
	const cuffVertices = [];
	for (const [u, v] of [[0, 0], [1, 0], [1, 1], [0, 1]]) {
		cuffVertices.push(1, skeleton.bones.findIndex((b) => b.name === 'armL'), cuff.x + cuff.w * u - 280 - upper.x, 884 - cuff.y - cuff.h * v - upper.y, 1);
	}
	attachments[cuffSlot.name][`${cuffSlot.name}_punch`] = { type: 'mesh', path: cuffSlot.name, uvs: [0, 0, 1, 0, 1, 1, 0, 1], triangles: [0, 1, 2, 0, 2, 3], vertices: cuffVertices, width: cuff.w, height: cuff.h };
	// A continuous mesh joins the fur to the cuff. The first band stays in the
	// sleeve; weights hand over gradually to the forearm below the elbow.
	const layer = layers.find((piece) => piece.name === 'left_arm_2_hand');
	const cols = 10, rows = 18, uvs = [], vertices = [], triangles = [];
	for (let y = 0; y <= rows; y++) for (let x = 0; x <= cols; x++) {
		const px = layer.x + layer.w * x / cols, py = layer.y + layer.h * y / rows;
		uvs.push(x / cols, y / rows);
		const w = Math.max(0, Math.min(1, (py - (layer.y + 10)) / 170));
		const weights = [['armL', 1 - w], ['armL_fore', w]].filter(([, weight]) => weight > 0.00001);
		vertices.push(weights.length);
		for (const [name, weight] of weights) {
			const bone = frames.get(name), r = -bone.angle * Math.PI / 180;
			const dx = px - 280 - bone.x, dy = 884 - py - bone.y;
			vertices.push(skeleton.bones.findIndex((bone) => bone.name === name), dx * Math.cos(r) - dy * Math.sin(r), dx * Math.sin(r) + dy * Math.cos(r), weight);
		}
	}
	for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
		const a = y * (cols + 1) + x, b = a + 1, c = a + cols + 1, d = c + 1;
		triangles.push(a, b, d, a, d, c);
	}
	attachments[layer.name][`${layer.name}_punch`] = { type: 'mesh', path: layer.name, uvs, vertices, triangles, width: layer.w, height: layer.h };
}

export function applyIronPunch(skeleton) {
	repairElbow(skeleton);
	// The torso composite also includes a narrow sliver of the resting hand.
	// Trim only those lower-left triangles; the repaired thigh is behind them,
	// and the separately rigged forearm/hand supplies the moving silhouette.
	const trunk = skeleton.skins[0].attachments.torso_0_trunk.torso_0_trunk;
	const triangles = [];
	for (let i = 0; i < trunk.triangles.length; i += 3) {
		const ids = trunk.triangles.slice(i, i + 3);
		const x = 69 + ids.reduce((sum, id) => sum + trunk.uvs[id * 2] * 361, 0) / 3;
		const y = 146 + ids.reduce((sum, id) => sum + trunk.uvs[id * 2 + 1] * 441, 0) / 3;
		if (!(x < 168 && y > 500)) triangles.push(...ids);
	}
	trunk.triangles = triangles;
	const rig = {
		skeleton: { spine: '4.3.13' },
		bones: [...skeleton.bones, { name: '__punchGuide', parent: 'root' }],
		slots: [], skins: [], animations: {},
	};
	const base = compileRecipe(rig, {
		fps: 60, facing: -1, characterHeight: 884, maxSegment: 0.06,
		roles: { fist: '__punchGuide', hip: 'torso', head: 'head' },
		animations: [{ name: 'iron_punch', preset: 'punch', params: { reach: 100, windup: 24, lean: 3.5, hair: 'none' } }],
	});
	const punch = base.json.animations.iron_punch;
	const swing = punch.events.find((e) => e.name === 'swing').time;
	const impact = punch.events.find((e) => e.name === 'impact').time;
	const duration = base.summary[0].duration;
	const release = duration - 0.25;
	const pose = (bone, guard, hit, settle) => ({
		bone, channel: 'rotate', type: 'poses', points: [
			{ time: 0, value: 0 },
			{ time: swing, value: guard, ease: 'sineOut' },
			{ time: impact, value: hit, ease: 'quartIn' },
			{ time: impact + 0.06, value: settle, ease: 'sineOut' },
			{ time: release, value: settle },
			{ time: duration, value: 0, ease: 'sineInOut' },
		],
	});
	const joints = compileRecipe(rig, {
		fps: 60, maxSegment: 0.04, roles: {},
		animations: [{ name: 'joints', duration, loop: false, tracks: [
			pose('armL', -14, -52, -48),
			pose('armL_fore', -48, -24, -27),
			pose('armL_hand', 8, -6, -3),
			pose('armR', -5, -10, -8),
			pose('armR_fore', 20, 28, 24),
		] }],
	});
	delete punch.bones.__punchGuide;
	Object.assign(punch.bones, joints.json.animations.joints.bones);
	punch.slots = Object.fromEntries(['left_arm_1_forearm', 'left_arm_2_hand'].map((name) => [name, { attachment: [{ time: 0, name: `${name}_punch` }, { time: duration, name }] }]));
	skeleton.events ??= {};
	for (const event of punch.events) skeleton.events[event.name] ??= {};
	skeleton.animations.iron_punch = punch;
	return { swing, impact, duration };
}
