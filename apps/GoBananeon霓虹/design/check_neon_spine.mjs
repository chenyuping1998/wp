// Parse and pose the shipped, PSD-derived costume with the game's Spine runtime.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const store = path.resolve(root, '../../node_modules/.pnpm');
const coreDir = fs.readdirSync(store).find((name) => name.startsWith('@esotericsoftware+spine-core@'));
if (!coreDir) throw new Error('Spine runtime package missing');
const corePath = path.join(store, coreDir, 'node_modules/@esotericsoftware/spine-core/dist/index.js');
const { TextureAtlas, AtlasAttachmentLoader, SkeletonJson, Skeleton, AnimationStateData, AnimationState, Physics } = await import(pathToFileURL(corePath).href);
const dir = path.join(root, 'static/assets/spines/goBananasMonkey');
const atlas = new TextureAtlas(fs.readFileSync(path.join(dir, 'monkey.atlas'), 'utf8'));
for (const page of atlas.pages) if (!fs.existsSync(path.join(dir, page.name))) throw new Error(`Missing atlas page: ${page.name}`);
const json = JSON.parse(fs.readFileSync(path.join(dir, 'monkey.json'), 'utf8'));
const data = new SkeletonJson(new AtlasAttachmentLoader(atlas)).readSkeletonData(json);
const skeleton = new Skeleton(data);
const state = new AnimationState(new AnimationStateData(data));
const names = ['idle', 'club_idle', 'club_flutter', 'iron_idle_weave', 'iron_idle_bounce', 'idle_original', 'iron_punch', 'dj_scratch', 'cheer', 'chestbeat', 'nod', 'throwit', 'flinch', 'alert', 'glance', 'flutter'];
for (const name of names) if (!data.findAnimation(name)) throw new Error(`Missing animation: ${name}`);

const meshSlots = skeleton.slots.filter((slot) => slot.getAttachment()?.triangles);
const area = (xy, a, b, c) => {
	a *= 2; b *= 2; c *= 2;
	return (xy[b] - xy[a]) * (xy[c+1] - xy[a+1]) - (xy[b+1] - xy[a+1]) * (xy[c] - xy[a]);
};
const poseAreas = (slot, attachment) => {
	const xy = new Float32Array(attachment.worldVerticesLength);
	attachment.computeWorldVertices(slot, 0, xy.length, xy, 0, 2);
	const out = [];
	const indices = attachment.triangles;
	for (let i = 0; i < indices.length; i += 3) out.push(area(xy, indices[i], indices[i+1], indices[i+2]));
	return out;
};
skeleton.updateWorldTransform(Physics.update);
// Include attachments selected only during an action (such as the punch elbow).
// Looking at the setup pose alone silently skipped their geometry checks.
const baselines = new Map();
for (const entry of data.defaultSkin.getAttachments()) {
	if (!entry.attachment.triangles) continue;
	const slot = skeleton.slots[entry.slotIndex];
	baselines.set(entry.attachment, poseAreas(slot, entry.attachment));
}
let minimumRatio = Infinity;
let worst = '';
for (const name of names) {
	state.setAnimation(0, name, ['idle', 'club_idle', 'club_flutter', 'flutter'].includes(name));
	const fps = ['iron_punch', 'dj_scratch', 'club_idle', 'club_flutter'].includes(name) ? 60 : 30;
	let animationMinimum = Infinity;
	for (let frame = 0; frame < fps * (['dj_scratch', 'club_idle', 'club_flutter'].includes(name) ? 4 : 3); frame++) {
		state.update(1/fps);
		state.apply(skeleton);
		skeleton.updateWorldTransform(Physics.update);
		for (const slot of skeleton.slots) {
			const attachment = slot.getAttachment();
			if (!attachment?.triangles) continue;
			const base = baselines.get(attachment);
			if (!base) throw new Error(`Unchecked mesh attachment: ${attachment.name}`);
			const posed = poseAreas(slot, attachment);
			for (let j = 0; j < posed.length; j++) {
				const ratio = posed[j] / base[j];
				animationMinimum = Math.min(animationMinimum, ratio);
				if (ratio < minimumRatio) { minimumRatio = ratio; worst = `${name}, ${slot.data.name}, frame ${frame}, triangle ${j}`; }
			}
		}
	}
	if (['iron_punch', 'dj_scratch', 'club_idle', 'club_flutter'].includes(name)) console.log(`OK: ${name} meshes sampled at ${fps} fps, minimum triangle area ${(animationMinimum * 100).toFixed(1)}%`);
	if (name === 'dj_scratch' && animationMinimum < 0.2) throw new Error(`DJ wrist mesh pinches below 20% area: ${animationMinimum}`);
}
if (!(minimumRatio > 0)) throw new Error(`Spine mesh inverted at ${worst}: ${minimumRatio}`);

// Cancelling the preview for a throw must also restore the ordinary arm art.
for (const preview of ['iron_punch', 'dj_scratch']) {
	const sk = new Skeleton(data), player = new AnimationState(new AnimationStateData(data));
	player.setAnimation(0, preview, false);
	player.update(0.27); player.apply(sk);
	player.setAnimation(0, 'throwit', false);
	player.update(1 / 60); player.apply(sk);
	for (const name of ['left_arm_1_forearm', 'left_arm_2_hand']) {
		if (sk.findSlot(name).getAttachment().name !== name) throw new Error(`${preview} attachment remains after interruption: ${name}`);
	}
	if (sk.findSlot('dj_hand').getAttachment()) throw new Error(`${preview} leaves the DJ hand visible after interruption`);
	console.log(`OK: interrupting ${preview} restores the original arm and hides the DJ hand`);
}

// The scratch belongs over an imaginary deck in front of the abdomen.
// Keep a pose regression guard against accidentally reaching sideways again.
{
	const sk = new Skeleton(data), player = new AnimationState(new AnimationStateData(data));
	player.setAnimation(0, 'dj_scratch', false);
	player.update(0.6);
	for (let frame = 0; frame < 110; frame++) {
		player.update(1 / 60); player.apply(sk); sk.updateWorldTransform(Physics.none);
		const wrist = sk.findBone('dj_wrist'), torso = sk.findBone('torso');
		if (Math.abs(wrist.worldX - torso.worldX) > 110 || wrist.worldY < 320 || wrist.worldY > 600) {
			throw new Error(`DJ wrist leaves the front-of-body deck: ${wrist.worldX}, ${wrist.worldY}`);
		}
	}
	console.log('OK: DJ scratch stays in front of the abdomen throughout the active strokes');
}

// Check the sleeve anchors and action blends with the accessory track running,
// matching the two tracks the actual component plays.
for (const secondary of ['flutter', 'club_flutter']) for (const tempo of [105 / 125, 1, 128 / 125]) {
	const sk = new Skeleton(data), player = new AnimationState(new AnimationStateData(data));
	sk.updateWorldTransform(Physics.none);
	const feet = ['legL_foot', 'legR_foot'].map((name) => ({ bone: sk.findBone(name), x: sk.findBone(name).worldX, y: sk.findBone(name).worldY }));
	let blendMinimum = 1;
	player.data.defaultMix = 0.2;
	player.setAnimation(0, 'club_idle', true).timeScale = tempo;
	player.setAnimation(1, secondary, true).timeScale = tempo;
	player.update(0.7); player.apply(sk);
	player.setAnimation(0, 'dj_scratch', false);
	const mesh = data.defaultSkin.getAttachment(data.findSlot('dj_hand').index, 'dj_hand');
	const rootLocals = [];
	for (let i = 0, j = 0; j < 58; j++) {
		const count = mesh.bones[i++];
		if (count !== 1 || mesh.bones[i] !== data.findBone('armL').index) throw new Error('DJ sleeve anchor is not fixed to the cuff');
		i += count;
		rootLocals.push([mesh.vertices[j * 3], mesh.vertices[j * 3 + 1]]);
	}
	for (let frame = 0; frame < 240; frame++) {
		if (frame === 192) player.setAnimation(0, 'club_idle', true).timeScale = tempo;
		player.update(1 / 60); player.apply(sk); sk.updateWorldTransform(Physics.none);
		for (const { bone, x, y } of feet) if (Math.hypot(bone.worldX - x, bone.worldY - y) > 0.01) throw new Error(`Feet slide during ${secondary} blend`);
		for (const posedSlot of sk.slots) {
			const attachment = posedSlot.getAttachment();
			if (!attachment?.triangles) continue;
			const base = baselines.get(attachment), values = poseAreas(posedSlot, attachment);
			for (let j = 0; j < values.length; j++) {
				const ratio = values[j] / base[j];
				blendMinimum = Math.min(blendMinimum, ratio);
				if (ratio <= 0) throw new Error(`Mesh inverted in ${secondary} blend: ${posedSlot.data.name}, frame ${frame}`);
			}
		}
		const slot = sk.findSlot('dj_hand');
		if (slot.getAttachment() !== mesh) continue;
		const xy = new Float32Array(mesh.worldVerticesLength);
		mesh.computeWorldVertices(slot, 0, xy.length, xy, 0, 2);
		const arm = sk.findBone('armL');
		for (let j = 0; j < rootLocals.length; j++) {
			const [x, y] = rootLocals[j];
			if (Math.hypot(xy[j * 2] - (arm.a * x + arm.b * y + arm.worldX), xy[j * 2 + 1] - (arm.c * x + arm.d * y + arm.worldY)) > 0.001) throw new Error('DJ sleeve anchor separated during blending');
		}
		const posed = poseAreas(slot, mesh), base = baselines.get(mesh);
		if (posed.some((value, j) => value / base[j] < 0.2)) throw new Error(`DJ mesh pinched during two-track blend, frame ${frame}`);
	}
	if (sk.findSlot('dj_hand').getAttachment()) throw new Error('DJ hand remains after blended return to idle');
	if (sk.findSlot('left_arm_2_hand').color.a < 0.999) throw new Error('Original hand remains transparent after DJ return');
	console.log(`OK: all meshes + planted feet during club idle, ${secondary}, DJ and blended return at ${(tempo * 125).toFixed(0)} BPM, minimum area ${(blendMinimum * 100).toFixed(1)}%`);
}

// The secondary track may animate loose parts, never overwrite the pose or
// the five fingers. Check the actual shipped clip's ownership explicitly.
{
	const loose = new Set(['helmet', 'hairTip', 'phoneL', 'phoneR', 'coatL', 'coatR', 'cuffL', 'cuffR', 'pantL', 'pantR', 'banana', 'jaw']);
	for (const name of Object.keys(json.animations.club_flutter.bones)) if (!loose.has(name)) throw new Error(`club_flutter overwrites a main-pose bone: ${name}`);
	const sk = new Skeleton(data), player = new AnimationState(new AnimationStateData(data)), strokes = [];
	player.addListener({ event: (_entry, event) => { if (event.data.name === 'djStroke') strokes.push(event.time); } });
	player.setAnimation(0, 'dj_scratch', false);
	for (let frame = 0; frame < 200; frame++) { player.update(1 / 60); player.apply(sk); }
	if (strokes.length !== 4 || strokes.some((time, i) => Math.abs(time - [0.6, 1.08, 1.56, 2.04][i]) > 0.0001)) throw new Error(`DJ stroke timing changed: ${strokes}`);
	if (Math.abs(data.findAnimation('dj_scratch').duration - 3.2) > 0.001) throw new Error('DJ duration changed');
	console.log('OK: accessory track owns only loose parts; four DJ stroke markers stay at 125 BPM in the 3.2s clip');
}

// Check the retargeted motion in the game's runtime, not just its key values.
for (const name of ['club_idle', 'club_flutter', 'iron_idle_weave', 'iron_idle_bounce', 'iron_punch', 'dj_scratch']) {
	const animation = data.findAnimation(name);
	const poseAt = (time) => {
		const sk = new Skeleton(data);
		const player = new AnimationState(new AnimationStateData(data));
		player.setAnimation(0, name, false);
		player.update(time);
		player.apply(sk);
		sk.updateWorldTransform(Physics.none);
		return sk.bones.map((bone) => [bone.worldX, bone.worldY, bone.a, bone.b, bone.c, bone.d]);
	};
	const first = poseAt(0), last = poseAt(animation.duration);
	const seam = Math.max(...first.flatMap((values, i) => values.map((v, j) => Math.abs(v - last[i][j]))));
	if (seam > 0.01) throw new Error(`${name}: loop seam ${seam}`);
	let footDrift = 0;
	for (let frame = 0; frame <= 120; frame++) {
		const pose = poseAt(animation.duration * frame / 120);
		for (const foot of ['legL_foot', 'legR_foot']) {
			const i = data.findBone(foot).index;
			footDrift = Math.max(footDrift, Math.hypot(pose[i][0] - first[i][0], pose[i][1] - first[i][1]));
		}
	}
	if (footDrift > 0.01) throw new Error(`${name}: feet slide ${footDrift}`);
	console.log(`OK: ${name}, ${animation.duration}s; start/end difference ${seam.toFixed(5)}, foot drift ${footDrift.toFixed(5)}px`);
}
console.log(`OK: ${data.bones.length} PSD bones, ${data.animations.length} animations; ${baselines.size} checked mesh attachments, minimum area ${Math.round(minimumRatio*100)}% at ${worst}`);
