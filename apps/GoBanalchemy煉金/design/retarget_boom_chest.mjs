/** Bake fixed-length two-joint palm contacts onto the inherited chestbeat.
 *
 * 2026-10-16 (user: 捶胸很不自然): the first version pulled ONE palm to the chest
 * only in a +-0.19s window round each of its beats and let it fall back to the
 * hanging pose in between — each hand pistoned ~220 units up and down every
 * 0.6s while the other hung at the side. A chest beat holds BOTH hands up at
 * the chest and alternates: the striking palm slaps in, the other draws back a
 * little to wind up. So: both arms rise to a ready pose on the wind-up, strike
 * from ready to contact on their beats, and come down together after the last.
 * Shoulder and elbow rotation only — fixed bone lengths, as before. */
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
export async function retargetChest(app) {
	const dir = path.join(app, 'static/assets/spines/goBananasMonkey'),
		file = path.join(dir, 'monkey.json');
	const rig = JSON.parse(fs.readFileSync(file, 'utf8')),
		store = path.resolve(app, '../../node_modules/.pnpm'),
		pkg = fs.readdirSync(store).find((n) => n.startsWith('@esotericsoftware+spine-core@'));
	const {
		TextureAtlas,
		AtlasAttachmentLoader,
		SkeletonJson,
		Skeleton,
		AnimationStateData,
		AnimationState,
		Physics,
	} = await import(
		pathToFileURL(path.join(store, pkg, 'node_modules/@esotericsoftware/spine-core/dist/index.js'))
	);
	const atlas = new TextureAtlas(fs.readFileSync(path.join(dir, 'monkey.atlas'), 'utf8')),
		data = new SkeletonJson(new AtlasAttachmentLoader(atlas)).readSkeletonData(rig);
	const skeleton = new Skeleton(data),
		state = new AnimationState(new AnimationStateData(data));
	skeleton.setToSetupPose();
	skeleton.updateWorldTransform(Physics.reset);
	state.setAnimation(0, 'chestbeat', false);
	const duration = data.findAnimation('chestbeat').duration,
		channels = {};
	for (const side of ['L', 'R'])
		for (const name of ['arm' + side, 'arm' + side + '_fore']) channels[name] = [];
	const wrap = (r) => {
		while (r > 180) r -= 360;
		while (r < -180) r += 360;
		return r;
	};
	// contact: palm on the chest; ready: drawn back out and a little down, the
	// wind-up between strikes (arm's parent space)
	const targets = { L: { x: -55, y: 135 }, R: { x: 65, y: 145 } };
	const ready = { L: { x: -85, y: 124 }, R: { x: 92, y: 133 } };
	const smooth = (v) => {
		const t = Math.max(0, Math.min(1, v));
		return t * t * (3 - 2 * t);
	};
	// up on the wind-up (0.12-0.42s), down after the last strike (1.98s)
	const raised = (t) => smooth((t - 0.12) / 0.3) * (1 - smooth((t - 2.08) / 0.4));
	// one strike: a fast accelerating slap in, a beat on the chest, a slower
	// draw back out
	const strike = (d) =>
		d < -0.13 || d > 0.2 ? 0 : d <= -0.02 ? ((d + 0.13) / 0.11) ** 2 : d <= 0.04 ? 1 : 1 - smooth((d - 0.04) / 0.16);
	let previous = 0;
	for (let frame = 0; frame <= Math.ceil(duration * 120); frame++) {
		const time = Math.min(duration, frame / 120),
			dt = time - previous;
		previous = time;
		state.update(dt);
		state.apply(skeleton);
		skeleton.updateWorldTransform(Physics.none);
		for (const side of ['L', 'R']) {
			const arm = skeleton.findBone('arm' + side),
				fore = skeleton.findBone('arm' + side + '_fore'),
				palm = skeleton.findBone('palm' + side);
			const beats = side === 'R' ? [0.48, 1.08, 1.68] : [0.78, 1.38, 1.98];
			const s = Math.max(...beats.map((b) => strike(time - b)));
			const k = raised(time);
			const tx = ready[side].x + (targets[side].x - ready[side].x) * s,
				ty = ready[side].y + (targets[side].y - ready[side].y) * s;
			const dx = tx - arm.x,
				dy = ty - arm.y;
			const l1 = Math.hypot(fore.x, fore.y),
				l2 = Math.hypot(palm.x, palm.y);
			const cosine = Math.max(
				-1,
				Math.min(1, (dx * dx + dy * dy - l1 * l1 - l2 * l2) / (2 * l1 * l2)),
			);
			const bend = Math.acos(cosine) * (side === 'L' ? 1 : -1);
			const a1 = Math.atan2(fore.y, fore.x),
				a2 = Math.atan2(palm.y, palm.x);
			const shoulder =
				Math.atan2(dy, dx) - Math.atan2(l2 * Math.sin(bend), l1 + l2 * Math.cos(bend));
			const goalArm = ((shoulder - a1) * 180) / Math.PI,
				goalFore = ((bend + a1 - a2) * 180) / Math.PI;
			for (const [bone, goal] of [
				[arm, goalArm],
				[fore, goalFore],
			]) {
				const value = bone.rotation + wrap(goal - bone.rotation) * k - bone.data.rotation;
				channels[bone.data.name].push({ time: +time.toFixed(5), value: +value.toFixed(5) });
			}
		}
	}
	for (const [name, keys] of Object.entries(channels))
		rig.animations.chestbeat.bones[name].rotate = keys;
	rig.skeleton.chestTargets = targets;
	fs.writeFileSync(file, JSON.stringify(rig) + '\n');
	console.log('Retargeted six visible palm contacts using shoulder/elbow rotation only.');
}
