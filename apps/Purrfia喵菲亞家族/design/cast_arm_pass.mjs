// Don Whiskers' front arm, re-posed so a raised arm reads as an arm and not a hose (user 2026-10-30 「改袖子」).
//
// The builder raises the front arm by swinging the whole, nearly straight arm up to 122° from where it hangs, so
// at the monocle the upper sleeve lies flat across the chest at full length, with no elbow. A real arm reaching up
// to the face points the upper arm TOWARD the camera: seen from the front it is foreshortened and the elbow drops.
// For every key of every clip, keeping the paw exactly where the builder put it:
//   1. the further the upper arm swings forward/up, the shorter it gets along its own axis (and a touch wider —
//      it is nearer the camera): the Pragmatic Play move of scaling a limb to fake depth;
//   2. the shoulder lifts and the chest leans into the reach, so the elbow can bend;
//   3. a two-bone solve puts the elbow back — on the same side as the builder's, so nothing flips — and the paw
//      keeps its world angle; the elbow / wrist volume helpers stay at half the joint angles, as the builder had them.
// The arm thrown out sideways (claim_turf) swings in the picture plane and is left alone.
//
// Run after design/cast_look_pass.mjs, after every rebuild of the cast. Refuses to run twice on the same rig.
//   node design/cast_arm_pass.mjs
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';

const app = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const req = createRequire(path.join(app, 'package.json'));
const S = await import(pathToFileURL(req.resolve('@esotericsoftware/spine-core')).href);
const FILES = ['src/game/characterRigData.json', 'static/assets/spines/donWhiskers43/character.json'].map((f) => path.join(app, f));
const before = fs.readFileSync(FILES[0], 'utf8');
const raw = JSON.parse(before);
const boneOf = (n) => raw.bones.find((b) => b.name === n);
if (boneOf('fore_front').inherit === 'noScale') { console.log('cast arm pass: already applied'); process.exit(0); }
if (!boneOf('look')) throw Error('run design/cast_look_pass.mjs first');

const atlas = new S.TextureAtlas(fs.readFileSync(path.join(app, 'src/game/characterRigAtlas.txt'), 'utf8'));
for (const p of atlas.pages) p.setTexture(new S.FakeTexture({ width: p.width, height: p.height }));
const data = new S.SkeletonJson(new S.AtlasAttachmentLoader(atlas)).readSkeletonData(raw);

const L1 = boneOf('upper_front').length, L2 = boneOf('fore_front').length;
const UPPER0 = boneOf('upper_front').rotation, FORE0 = boneOf('fore_front').rotation, HAND0 = boneOf('hand_front').rotation ?? 0;
const SHOULDER0 = [boneOf('upper_front').x, boneOf('upper_front').y];
// tuning
const RAISE_FROM = 20, RAISE_SPAN = 80; // degrees of forward swing (from hanging) over which the effect ramps in
const SHORTEN = 0.8, WIDEN = 0, MIN_LENGTH = 0.75; // upper arm length factor at full raise, width gain
const SHRUG = [3, 8], LEAN = -2; // shoulder lift (chest space, px) and chest lean (degrees) at full raise
// the wrist stops this much short of the builder's target, toward the shoulder: the paw drawing is big enough that
// its fingers still cover the lens, and without it the shortened arm cannot reach and stays straight
const PULL_IN = 32;

const smooth = (x) => { const t = Math.max(0, Math.min(1, x)); return t * t * (3 - 2 * t); };
const norm = (a) => ((((a + 180) % 360) + 360) % 360) - 180;
const deg = (r) => (r * 180) / Math.PI, rad = (d) => (d * Math.PI) / 180;

/** sample a keyed channel (linear between keys, as the builder bakes them densely) */
const sample = (keys, t, c) => {
	if (!keys?.length) return null;
	if (t <= (keys[0].time ?? 0)) return keys[0][c] ?? 0;
	for (let i = 1; i < keys.length; i++) {
		const t1 = keys[i].time ?? 0;
		if (t <= t1) { const t0 = keys[i - 1].time ?? 0, f = (t - t0) / (t1 - t0 || 1); return (keys[i - 1][c] ?? 0) + ((keys[i][c] ?? 0) - (keys[i - 1][c] ?? 0)) * f; }
	}
	return keys[keys.length - 1][c] ?? 0;
};

const skeleton = new S.Skeleton(data), state = new S.AnimationState(new S.AnimationStateData(data));
let clips = 0, raisedFrames = 0, maxRaise = 0;
for (const anim of data.animations) {
	const clip = raw.animations[anim.name];
	const tl = clip.bones?.upper_front;
	if (!tl?.rotate) continue;
	const times = [...new Set([...tl.rotate.map((k) => k.time ?? 0), ...(clip.bones.fore_front?.rotate ?? []).map((k) => k.time ?? 0)])].sort((a, b) => a - b);
	const out = { upper: [], fore: [], hand: [], elbow: [], wrist: [], scale: [], shrug: [], lean: [], raise: [] };
	let touched = false;
	for (const t of times) {
		skeleton.setupPose();
		state.clearTracks(); // or every set queues the previous entry as a mix source and the chain grows each key
		state.setAnimation(0, anim.name, false);
		state.tracks[0].trackTime = t;
		state.apply(skeleton);
		skeleton.updateWorldTransform(S.Physics.none);
		const chest = skeleton.findBone('chest'), upper = skeleton.findBone('upper_front'), fore = skeleton.findBone('fore_front'), hand = skeleton.findBone('hand_front');
		const chestRot = chest.appliedPose.getWorldRotationX();
		const swing = norm(upper.appliedPose.getWorldRotationX() - chestRot - UPPER0); // + = forward/up across the body
		const r = smooth((swing - RAISE_FROM) / RAISE_SPAN);
		out.raise.push([t, r]);
		const base = { upper: upper.pose.rotation - UPPER0, fore: fore.pose.rotation - FORE0, hand: hand.pose.rotation - HAND0 };
		const H = [hand.appliedPose.worldX, hand.appliedPose.worldY], handWorld = hand.appliedPose.getWorldRotationX();
		const oldElbow = [fore.appliedPose.worldX, fore.appliedPose.worldY];
		if (r <= 0.001) {
			out.upper.push([t, base.upper]); out.fore.push([t, base.fore]); out.hand.push([t, base.hand]);
			out.scale.push([t, 1, 1]); out.shrug.push([t, 0, 0]); out.lean.push([t, 0]);
			continue;
		}
		touched = true; raisedFrames++; maxRaise = Math.max(maxRaise, r);
		// lean the chest and lift the shoulder, then read where the shoulder now is
		chest.pose.rotation += LEAN * r;
		upper.pose.x += SHRUG[0] * r;
		upper.pose.y += SHRUG[1] * r;
		skeleton.updateWorldTransform(S.Physics.none);
		const Sx = upper.appliedPose.worldX, Sy = upper.appliedPose.worldY, chestRot2 = chest.appliedPose.getWorldRotationX();
		// two-bone solve with a shortened upper arm; lengthen it again only as far as the paw needs to be reached
		const d0 = Math.hypot(H[0] - Sx, H[1] - Sy), pull = Math.min(PULL_IN * r, d0 * 0.2);
		H[0] -= ((H[0] - Sx) / d0) * pull; H[1] -= ((H[1] - Sy) / d0) * pull;
		const d = d0 - pull;
		let f = 1 - (1 - SHORTEN) * r;
		f = Math.max(f, MIN_LENGTH, (d * 1.002 - L2) / L1);
		f = Math.min(f, 1);
		const a = L1 * f, reach = Math.min(d, (a + L2) * 0.9995);
		const base0 = Math.atan2(H[1] - Sy, H[0] - Sx);
		const cosA = Math.max(-1, Math.min(1, (a * a + reach * reach - L2 * L2) / (2 * a * reach)));
		const cands = [base0 + Math.acos(cosA), base0 - Math.acos(cosA)].map((u) => ({ u, e: [Sx + a * Math.cos(u), Sy + a * Math.sin(u)] }));
		// the elbow stays on the builder's side of the shoulder→paw line (no flip), which is also the lower one here
		const side = (p) => Math.sign((H[0] - Sx) * (p[1] - Sy) - (H[1] - Sy) * (p[0] - Sx));
		const pick = cands.find((c) => side(c.e) === side(oldElbow)) ?? cands[0];
		const upperWorld = deg(pick.u), foreWorld = deg(Math.atan2(H[1] - pick.e[1], H[0] - pick.e[0]));
		out.upper.push([t, norm(upperWorld - chestRot2 - UPPER0)]);
		out.fore.push([t, norm(foreWorld - upperWorld - FORE0)]);
		out.hand.push([t, norm(handWorld - foreWorld - HAND0)]);
		out.scale.push([t, f, 1 + WIDEN * r]);
		out.shrug.push([t, SHRUG[0] * r, SHRUG[1] * r]);
		out.lean.push([t, LEAN * r]);
	}
	if (!touched) continue;
	clips++;
	const B = (clip.bones ??= {});
	const rot = (bone, list) => { (B[bone] ??= {}).rotate = list.map(([time, v]) => ({ time, value: +v.toFixed(4) })); };
	rot('upper_front', out.upper);
	rot('fore_front', out.fore);
	rot('hand_front', out.hand);
	rot('elbow_volume_front', out.fore.map(([t, v]) => [t, v / 2]));
	rot('wrist_volume_front', out.hand.map(([t, v]) => [t, v / 2]));
	B.upper_front.scale = out.scale.map(([time, x, y]) => ({ time, x: +x.toFixed(4), y: +y.toFixed(4) }));
	const tr = B.upper_front.translate;
	B.upper_front.translate = out.shrug.map(([time, x, y]) => ({ time, x: +((sample(tr, time, 'x') ?? 0) + x).toFixed(2), y: +((sample(tr, time, 'y') ?? 0) + y).toFixed(2) }));
	const cr = (B.chest ??= {}).rotate;
	B.chest.rotate = [...new Set([...(cr ?? []).map((k) => k.time ?? 0), ...out.lean.map(([t]) => t)])].sort((a, b) => a - b)
		.map((time) => ({ time, value: +((sample(cr, time, 'value') ?? 0) + (sample(out.lean.map(([t, v]) => ({ time: t, value: v })), time, 'value') ?? 0)).toFixed(4) }));
	// Draw order: the face (with its big ruff) is drawn over the sleeve, so an arm raised to the monocle vanished
	// behind the chin and the paw floated on its own (V6, 10-31). While the arm is up past ~a third the sleeve goes
	// in front of the face; it drops back behind as the arm comes down.
	if (clip.drawOrder || clip.draworder) console.log(`cast arm pass: ${anim.name} already keys draw order — sleeve order left as it is`);
	else {
		const order = raw.slots.map((s) => s.name), arm = order.indexOf('arm_front_full'), face = order.indexOf('face');
		const keys = [];
		let front = false;
		for (const [time, r] of out.raise) {
			const want = r > 0.3;
			if (want === front) continue;
			front = want;
			keys.push(want ? { time, offsets: [{ slot: 'arm_front_full', offset: face - arm }] } : { time });
		}
		if (keys.length) { if (keys[0].time > 0) keys.unshift({ time: 0 }); clip.drawOrder = keys; }
	}
}
// the forearm and the elbow helper keep their own size when the upper arm is foreshortened
boneOf('fore_front').inherit = 'noScale';
boneOf('elbow_volume_front').inherit = 'noScale';

const text = JSON.stringify(raw);
// another tool (the cast builder) may have rewritten the rig while this ran: never write over that
if (fs.readFileSync(FILES[0], 'utf8') !== before) throw Error('characterRigData.json changed while the pass ran — rerun it on the new rig');
for (const f of FILES) fs.writeFileSync(f, text);
const coveragePath = path.join(app, 'design/character-anatomy-coverage.json');
if (fs.existsSync(coveragePath)) {
	const sha = (s) => createHash('sha256').update(s).digest('hex');
	const coverage = JSON.parse(fs.readFileSync(coveragePath, 'utf8'));
	if (coverage.rigSha256 === sha(before)) { coverage.rigSha256 = sha(text); fs.writeFileSync(coveragePath, JSON.stringify(coverage)); }
	else console.log('cast arm pass: anatomy coverage was already stale before this pass — left as it is');
}
console.log(`cast arm pass: ${clips} clips re-posed, ${raisedFrames} raised keys (max raise ${maxRaise.toFixed(2)}); upper arm ${SHORTEN}–1 length, shrug ${SHRUG}, lean ${LEAN}°`);
