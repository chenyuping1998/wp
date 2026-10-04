// The sergeant mascot: a cutout Spine rig built from the supplied character PSD.
//
//   py -3 design/extract_monkey_psd.py <psd>      # once, writes design/source/monkey
//   node design/generate_monkey_spine.mjs <dir with node_modules for pngjs>
//
// The PSD arrives as separate body parts with no skeleton — "spine pieces", not a
// spine. This builds the skeleton: packs the pieces into one atlas page and emits
// a Spine 4.1 JSON with a bone per joint, the artist's own layout preserved, and
// two animations.
//
// WHY A RIG AND NOT A STILL
//
// Certification called out poor animation. A painted character standing perfectly
// still beside a board that is moving is worse than no character — it reads as a
// background print rather than as part of the game. The pieces were supplied
// split precisely so it can move, so it moves.
//
// COORDINATES
//
// A rotate keyframe's field is `value`, NOT `angle`. `angle` is the Spine 3.8
// spelling; 4.x renamed it, and the 4.2 runtime does not fall back - it reads no
// rotation at all and plays the animation with every bone left in setup pose. It
// throws nothing and logs nothing. The file loads, the character stands there.
//
// The other timelines were already right: translate and scale are {time, x, y}
// in both versions, which is why the hip and torso moved and only the limbs
// looked frozen.
//
// The PSD is 560x912 with y increasing DOWNWARD from the top-left. Spine has y
// increasing UPWARD from the skeleton origin, which is placed between the feet
// (ROOT below) so the character can be positioned by its ground contact rather
// than by the corner of a canvas.
//
// Every joint below is read off the piece bounding boxes in layers.json — a knee
// is the top edge of the calf, a shoulder the top of the upper arm — so the rig
// follows the artist's drawing instead of numbers invented here. Bones are all
// unrotated in setup pose, so each attachment is simply its piece's centre
// relative to its bone, and an animation rotating a bone pivots the art about the
// real joint.
import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const toolDir = process.argv[2];
if (!toolDir) {
	console.error('usage: node design/generate_monkey_spine.mjs <dir with node_modules/pngjs>');
	process.exit(1);
}
const require = createRequire(path.join(toolDir, 'noop.js'));
const { PNG } = require('pngjs');

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(appRoot, 'design/source/monkey_neon');
const OUT = path.join(appRoot, 'static/assets/spines/goBananasMonkey');
fs.mkdirSync(OUT, { recursive: true });

// One image that is not a body part: the dynamite he throws. Packed into this
// atlas rather than referenced from the symbol set, because a Spine skin can
// only draw regions from its own atlas.
const PROPS = [
	{
		name: 'dynamite',
		file: path.join(appRoot, 'static/assets/sprites/goBananasSymbolsV3/dynamite.png'),
		bone: 'prop',
		// skeleton units — about a fifth of his height, which is a bundle in a
		// gorilla's fist rather than a melon.
		//
		// The prop is drawn square here and the art is 691x614, so it renders a
		// little squat in the hand. That is deliberate: a bundle held in a fist is
		// mostly foreshortened, and the throw's release only lasts a few frames.
		size: 168,
	},
];

// PIECES THAT NEED A FRONT-DRAWING COPY: NONE, ON THIS ARTWORK.
//
// Inherited from GoBananasBoat's first rig, whose artist stacked the right arm
// BEHIND the trunk — there, a fist swung across the chest slid behind it, so the
// chest beat swapped the arm for copies drawn at the very end of the order.
//
// This PSD stacks it the other way. The whole right arm is already in front of
// the trunk (forearm z 15, hand z 16, against the trunk's 2), and the SLEEVE
// (right_arm_0_upper_arm, z 18) is drawn over the forearm, hiding the dark fur
// painted at its top for the elbow seam. Copying only the forearm and the hand
// to the end put them on top of the sleeve: through every right-arm strike a
// slab of fur sat across the cuff, and the arm looked broken at the elbow —
// the same fault Boat had, for the same reason (a copy promoted over the piece
// that was meant to cover it).
//
// Nothing needs promoting here, so the list is empty and the chest beat plays
// the arm in the artist's own stacking. The machinery stays for a future
// artwork that does stack an arm behind the body — if one does, copy the WHOLE
// limb in PSD order (forearm, hand, then the sleeve over them), as Boat now does.
const FRONT_COPIES = [];
const frontName = (name) => `${name}_front`;

const meta = JSON.parse(fs.readFileSync(path.join(SRC, 'layers.json'), 'utf8'));
const byName = Object.fromEntries(meta.layers.map((l) => [l.name, l]));
const originalMeta = JSON.parse(fs.readFileSync(path.join(appRoot, 'design/source/monkey/layers.json'), 'utf8'));
const originalByName = Object.fromEntries(originalMeta.layers.map((l) => [l.name, l]));
const piece = (name) => {
	const l = byName[name];
	if (!l) {
		console.error(`missing piece: ${name} — re-run design/extract_monkey_psd.py`);
		process.exit(1);
	}
	return l;
};

// Skeleton origin on the PSD canvas: centred between the boots, on the ground.
const ROOT = { x: 280, y: 884 };
const toSpine = (x, y) => ({ x: x - ROOT.x, y: ROOT.y - y });

// ── the skeleton ────────────────────────────────────────────────────────────
//
// JOINTS ARE DERIVED FROM THE ARTWORK, NOT TYPED IN.
//
// They used to be fifteen hand-measured coordinates, and every one of them was
// silently wrong the moment a new PSD arrived. On this one the left knee sat
// 70px above the calf it was supposed to bend and the right knee 90px below it —
// the character would have folded in the middle of the shin.
//
// A limb joint is not a free choice. It is where two consecutive pieces meet, so
// it is computed: the TOP-CENTRE of the distal piece, pulled `JOINT_INSET` down
// into it. The inset matters — a limb rotating about the exact top edge of its
// own artwork tears away from the body, because the art overlaps the joint it
// hangs from.
//
// Only the three joints with no distal piece of their own are given explicitly:
// the hip (the root of everything), the waist, and the neck.
const JOINT_INSET = 18;
const jointOf = (pieceName) => {
	const l = originalByName[pieceName];
	return [Math.round(l.x + l.w / 2), Math.round(l.y + JOINT_INSET)];
};

const RIG = [
	// Explicit: these three sit inside the torso mass rather than at the top of a
	// limb, so there is no piece edge to read them off.
	{ name: 'hip', parent: 'root', at: [280, 498], match: null },
	{ name: 'torso', parent: 'hip', at: [280, 470], match: /^torso_(?!2_decoration)/ },
	// The neck, just under the jaw: the head nods and turns about this.
	{ name: 'head', parent: 'torso', at: [283, 296], match: /^head_(?!1_hair|4_hat|5_decoration)/ },
	// THE JAW (2026-09-27). head_1_hair is not hair: it is his lower lip and
	// chin, drawn under the face. It rides this bone whole, and the FACE is a
	// weighted mesh that hands the part below the mouth to it (see "THE FACE
	// MOVES"), so when he chews the chin and the cheeks move with the banana
	// instead of the banana wagging in a mouth that never opens.
	{ name: 'jaw', parent: 'head', at: [305, 222], match: /^head_1_hair$/ },

	// THE THINGS THAT HANG OFF HIM (see "THE ACCESSORIES MOVE ON THEIR OWN" at
	// the bottom): each is its own layer in the PSD, so each gets its own bone,
	// pointed along the piece (`dir`) because rotation physics needs a direction
	// and a length. Measured on the PSD, 2026-09-26.
	//   helmet   on the middle of the head, pointing up to its crown
	//   banana   gripped in his teeth at (290,226), its tip down at (214,302)
	//   pocket   the tube standing up out of his chest pocket
	// GO BANANEON (2026-10-03): head_4_hat is the gorilla's MOHAWK and his shutter
	// shades, not a helmet. The bone keeps its name (the physics and Mascot.svelte
	// know it) but now sits at the hair's root above the shades and points up the
	// crest; `hairTip` carries the crest's upper half, so the hair whips in two
	// joints. The layer is a weighted mesh (see "THE ACCESSORIES FLOW") so the
	// shades stay on the face while the hair moves.
	{ name: 'helmet', parent: 'head', at: [300, 116], dir: [300, 36], match: /^head_4_hat$/ },
	{ name: 'hairTip', parent: 'helmet', at: [302, 74], dir: [312, 30], match: null },
	{ name: 'banana', parent: 'jaw', at: [290, 226], dir: [214, 302], match: /^head_5_decoration$/ },
	{ name: 'pocket', parent: 'torso', at: [265, 380], dir: [263, 327], match: /^torso_2_decoration$/ },
	// GO BANANEON: the banana HEADPHONES round his neck (in torso_1_decoration),
	// each ear cup on a bone hinged where it meets the neck, pointing up its
	// banana; and the open JACKET's two front panels (in torso_0_trunk), hinged
	// at the chest, pointing down to the hem. All weighted meshes with physics.
	{ name: 'phoneL', parent: 'torso', at: [262, 232], dir: [210, 166], match: null },
	{ name: 'phoneR', parent: 'torso', at: [378, 236], dir: [410, 186], match: null },
	{ name: 'coatL', parent: 'torso', at: [205, 330], dir: [200, 468], match: null },
	{ name: 'coatR', parent: 'torso', at: [412, 330], dir: [418, 468], match: null },
	// NOT the vials in his left chest pocket (torso_4_decoration). Tried
	// 2026-09-27 and taken out: the pocket and all three vials are painted on
	// the shirt itself, and that layer is only their caps laid over the top —
	// on its own bone the caps slid off the vials they belong to.

	// ARMS. `_0_upper_arm` is the sleeve and is correctly named on both sides.
	//
	// `_2_hand` is NOT a hand: measured against the joints
	// (design/source/monkey/_arms.png) it is the forearm AND the fist as one
	// piece, running from the elbow past the wrist. So it hangs off the ELBOW
	// alongside the small `_1_forearm` cuff, and the wrist is a dead joint —
	// there is nothing behind it that can bend.
	//
	// Its keys are not thrown away: `fuse` moves them to the elbow, scaled by the
	// lever-arm ratio, so an animation asking for a wrist flick still gets one out
	// of the forearm instead of the arm going rigid.
	{ name: 'armL', parent: 'torso', at: jointOf('left_arm_0_upper_arm'), match: /^left_arm_0/ },
	// the sleeve's hem: no art of its own — the sleeve MESH hands its lower part
	// to it (see "THE CLOTHES MOVE") — pointed down the sleeve for the physics
	{ name: 'cuffL', parent: 'armL', at: [104, 370], dir: [98, 452], match: null },
	{ name: 'armL_fore', parent: 'armL', at: jointOf('left_arm_2_hand'), match: /^left_arm_(1|2)/ },
	{ name: 'armL_hand', parent: 'armL_fore', at: [114, 528], match: null, fuse: 'armL_fore' },
	// Carries the thrown prop, so it follows the hand exactly rather than being
	// chased by something outside the skeleton trying to guess where the hand is.
	{ name: 'prop', parent: 'armL_hand', at: [118, 548], match: null },

	{ name: 'armR', parent: 'torso', at: jointOf('right_arm_0_upper_arm'), match: /^right_arm_0/ },
	{ name: 'cuffR', parent: 'armR', at: [458, 327], dir: [470, 404], match: null },
	{ name: 'armR_fore', parent: 'armR', at: jointOf('right_arm_2_hand'), match: /^right_arm_(1|2)/ },
	{ name: 'armR_hand', parent: 'armR_fore', at: [470, 470], match: null, fuse: 'armR_fore' },

	{ name: 'legL', parent: 'hip', at: jointOf('left_leg_0_thigh'), match: /^left_leg_0/ },
	// the baggy lower half of each trouser leg, same idea as the cuffs
	{ name: 'pantL', parent: 'legL', at: [214, 580], dir: [206, 672], match: null },
	{ name: 'legL_calf', parent: 'legL', at: jointOf('left_leg_1_calf'), match: /^left_leg_1/ },
	{ name: 'legL_foot', parent: 'legL_calf', at: jointOf('left_leg_2_foot'), match: /^left_leg_2/ },

	{ name: 'legR', parent: 'hip', at: jointOf('right_leg_0_thigh'), match: /^right_leg_0/ },
	{ name: 'pantR', parent: 'legR', at: [368, 580], dir: [376, 668], match: null },
	{ name: 'legR_calf', parent: 'legR', at: jointOf('right_leg_1_calf'), match: /^right_leg_1/ },
	{ name: 'legR_foot', parent: 'legR_calf', at: jointOf('right_leg_2_foot'), match: /^right_leg_2/ },
];

// PARTS ARE RESOLVED FROM THE PSD, NOT LISTED HERE.
//
// The rig used to name every piece explicitly. That broke the moment the artist
// delivered a new PSD: the same body parts came back as torso_1_decoration /
// torso_4_coat / head_1_eye where the old file had torso_1_coat /
// torso_4_decoration / head_4_eye. Nothing about the character had changed,
// only which decoration slot each layer happened to occupy — and the rig would
// have silently dropped every renamed piece.
//
// So each bone declares the PREFIX its pieces carry, which is the part of the
// naming the artist's export actually holds stable, and the pieces themselves
// come from layers.json. Draw order was already taken from the PSD's own z.
const boneOf = {};
const unmatched = [];
for (const layer of meta.layers) {
	const bone = RIG.find((b) => b.match && b.match.test(layer.name));
	if (bone) boneOf[layer.name] = bone.name;
	else unmatched.push(layer.name);
}
for (const b of RIG) {
	b.parts = meta.layers.filter((l) => boneOf[l.name] === b.name).map((l) => l.name);
}

// Both of these are reported, never silently tolerated: a bone with no art is a
// hole in the character, and a layer nobody claimed is art that will not appear.
const empty = RIG.filter((b) => b.match && b.parts.length === 0).map((b) => b.name);
if (empty.length) console.warn(`WARNING bones with no artwork: ${empty.join(', ')}`);
if (unmatched.length) console.warn(`WARNING layers matched to no bone: ${unmatched.join(', ')}`);
const jointWorld = Object.fromEntries(RIG.map((b) => [b.name, toSpine(b.at[0], b.at[1])]));
jointWorld.root = { x: 0, y: 0 };

const boneRot = {};
const bones = [{ name: 'root' }];
for (const b of RIG) {
	const w = jointWorld[b.name];
	const p = jointWorld[b.parent];
	const bone = { name: b.name, parent: b.parent, x: +(w.x - p.x).toFixed(2), y: +(w.y - p.y).toFixed(2) };
	if (b.dir) {
		const tip = toSpine(b.dir[0], b.dir[1]);
		const rot = (Math.atan2(tip.y - w.y, tip.x - w.x) * 180) / Math.PI;
		bone.rotation = +rot.toFixed(2);
		bone.length = +Math.hypot(tip.x - w.x, tip.y - w.y).toFixed(2);
		boneRot[b.name] = rot;
	}
	bones.push(bone);
}

// Slots in the PSD's own stacking order, so the character assembles exactly as
// the artist stacked it. Anything else and the coat ends up behind the trunk.
const drawOrder = [...meta.layers].sort((a, b) => a.z - b.z);
const slots = drawOrder
	.filter((l) => boneOf[l.name])
	.map((l) => ({ name: l.name, bone: boneOf[l.name], attachment: l.name }));

// The front copies go after the body and before the props, on the same bones as
// the originals, with no attachment until an animation asks for one.
for (const name of FRONT_COPIES) {
	if (!boneOf[name]) {
		console.warn(`WARNING front copy '${name}' names a layer no bone claimed`);
		continue;
	}
	slots.push({ name: frontName(name), bone: boneOf[name] });
}

// Props go LAST, so they draw in front of the hand holding them, and start with
// no attachment - the animation that uses one turns it on.
for (const prop of PROPS) slots.push({ name: prop.name, bone: prop.bone });

const attachments = {};
for (const l of drawOrder) {
	const bone = boneOf[l.name];
	if (!bone) continue;
	const centre = toSpine(l.x + l.w / 2, l.y + l.h / 2);
	const j = jointWorld[bone];
	const rot = boneRot[bone] ?? 0;
	const a = (-rot * Math.PI) / 180;
	const dx = centre.x - j.x, dy = centre.y - j.y;
	attachments[l.name] = {
		[l.name]: {
			x: +(dx * Math.cos(a) - dy * Math.sin(a)).toFixed(2),
			y: +(dx * Math.sin(a) + dy * Math.cos(a)).toFixed(2),
			...(rot ? { rotation: +(-rot).toFixed(2) } : {}),
			width: l.w,
			height: l.h,
		},
	};
}
// ── THE CLOTHES MOVE ────────────────────────────────────────────────────────
//
// Asked for 2026-09-27: "his clothes and accessories moving, so he is more fun
// to watch". The sleeves and the trouser thighs were rigid plates hung on
// their limb bones: whatever the arm or the leg did, the cloth did exactly, and
// at the shoulder the plate simply turned about the joint.
//
// They are WEIGHTED MESHES now — GoBananaut's sleeves (the one-image-one-mesh
// method of the symbol wins, inside Spine), with one addition: the loose END of
// each piece belongs to a bone of its own with physics on it —
//
//   sleeve   within CLOTH_HOLD px of the shoulder the cap stays on the TORSO,
//            over CLOTH_BLEND it hands over to the arm, and its lower part goes
//            on to the hem bone (cuffL / cuffR)
//   thigh    the waistband stays on the HIP, the middle on the leg, the baggy
//            lower half on pantL / pantR
//
// — so the cloth bends where it joins the body instead of turning as a card,
// and the hem swings a beat behind every move (physics at the bottom of the
// file), with a slow drift in `flutter` so it is never quite still.
//
// A weighted vertex is stored once per bone, in that bone's SETUP frame: its
// world position minus the joint, turned back by the bone's rotation (only the
// `dir` bones have one).
const CLOTH_HOLD = 18;
const CLOTH_BLEND = 70;
const smoothW = (v) => {
	const t = Math.max(0, Math.min(1, v));
	return t * t * (3 - 2 * t);
};
const meshAttachment = (layer, cols, rows, weightsAt) => {
	const at = (c, r) => [layer.x + (layer.w * c) / cols, layer.y + (layer.h * r) / rows];
	// the hull (the outer ring, in order) first, as Spine expects, then the inside
	const ring = [];
	for (let c = 0; c < cols; c++) ring.push([c, 0]);
	for (let r = 0; r < rows; r++) ring.push([cols, r]);
	for (let c = cols; c > 0; c--) ring.push([c, rows]);
	for (let r = rows; r > 0; r--) ring.push([0, r]);
	const inner = [];
	for (let r = 1; r < rows; r++) for (let c = 1; c < cols; c++) inner.push([c, r]);
	const order = [...ring, ...inner];
	const index = new Map(order.map(([c, r], i) => [`${c},${r}`, i]));
	const uvs = [], vertices = [], triangles = [];
	for (const [c, r] of order) {
		const [x, y] = at(c, r);
		uvs.push(+(c / cols).toFixed(5), +(r / rows).toFixed(5));
		const entries = Object.entries(weightsAt(x, y)).filter(([, v]) => v > 1e-4);
		const total = entries.reduce((a, [, v]) => a + v, 0);
		const world = toSpine(x, y);
		vertices.push(entries.length);
		for (const [bone, v] of entries) {
			const j = jointWorld[bone];
			const rot = (-(boneRot[bone] ?? 0) * Math.PI) / 180;
			const dx = world.x - j.x, dy = world.y - j.y;
			vertices.push(
				bones.findIndex((b) => b.name === bone),
				+(dx * Math.cos(rot) - dy * Math.sin(rot)).toFixed(2),
				+(dx * Math.sin(rot) + dy * Math.cos(rot)).toFixed(2),
				+(v / total).toFixed(4),
			);
		}
	}
	for (let r = 0; r < rows; r++)
		for (let c = 0; c < cols; c++) {
			const a = index.get(`${c},${r}`), b = index.get(`${c + 1},${r}`);
			const d = index.get(`${c},${r + 1}`), e = index.get(`${c + 1},${r + 1}`);
			triangles.push(a, b, e, a, e, d);
		}
	return { type: 'mesh', uvs, triangles, vertices, hull: ring.length, width: layer.w, height: layer.h };
};
// how far down a piece a point is, 0 at its top edge, 1 at its bottom
const down = (layer, y) => (y - layer.y) / layer.h;
const CLOTH = [
	// sleeve: torso at the cap -> arm -> hem bone over its lower half
	{ piece: 'left_arm_0_upper_arm', body: 'torso', limb: 'armL', hem: 'cuffL', hemFrom: 0.5, hemOver: 0.35 },
	{ piece: 'right_arm_0_upper_arm', body: 'torso', limb: 'armR', hem: 'cuffR', hemFrom: 0.5, hemOver: 0.35 },
	// thigh: hip at the waistband -> leg -> the baggy lower half
	{ piece: 'left_leg_0_thigh', body: 'hip', limb: 'legL', hem: 'pantL', hemFrom: 0.45, hemOver: 0.4 },
	{ piece: 'right_leg_0_thigh', body: 'hip', limb: 'legR', hem: 'pantR', hemFrom: 0.45, hemOver: 0.4 },
];
// RIGID_CLOTH=1 builds the old rigid plates, for before/after renders
for (const c of process.env.RIGID_CLOTH ? [] : CLOTH) {
	const layer = piece(c.piece);
	const joint = RIG.find((b) => b.name === c.limb).at;
	attachments[c.piece][c.piece] = meshAttachment(layer, 8, 10, (x, y) => {
		const onLimb = smoothW((Math.hypot(x - joint[0], y - joint[1]) - CLOTH_HOLD) / CLOTH_BLEND);
		const onHem = smoothW((down(layer, y) - c.hemFrom) / c.hemOver);
		return { [c.body]: 1 - onLimb, [c.limb]: onLimb * (1 - onHem), [c.hem]: onLimb * onHem };
	});
	console.log(`mesh    ${c.piece}: ${c.body} -> ${c.limb} -> ${c.hem}`);
}

// ── THE FACE MOVES ──────────────────────────────────────────────────────────
//
// His face is one PSD layer (head_2_face: goggles, nose, mouth, cheeks), so it
// is a weighted mesh on two bones: the head everywhere, and below the line of
// the mouth — between the two corners — the JAW, blended in over a few pixels
// so the lip line and the cheeks stretch rather than split. The chin piece
// (head_1_hair) and the banana ride the jaw outright.
//
// The mouth line runs y 222..232 from the banana side (x~252) to the right
// corner (x~372); the chin reaches y~275. Measured on the PSD, 2026-09-27.
{
	const layer = piece('head_2_face');
	const MOUTH_Y = 226;
	const LEFT = 250, RIGHT = 378;
	attachments[layer.name][layer.name] = meshAttachment(layer, 14, 16, (x, y) => {
		const below = smoothW((y - MOUTH_Y) / 12);
		const between = smoothW((x - LEFT) / 16) * smoothW((RIGHT - x) / 16);
		const jaw = below * between;
		return { head: 1 - jaw, jaw };
	});
	console.log(`mesh    ${layer.name}: head -> jaw below y ${MOUTH_Y}`);
}

// ── THE ACCESSORIES FLOW (Go Bananeon, 2026-10-03) ─────────────────────────
//
// Asked for: "his accessories should flow". Three more weighted meshes, each
// handing part of its layer to a bone with physics (bottom of the file), so
// they lag, overshoot and settle behind every body move, and drift in `flutter`:
//
//   head_4_hat         the shades and everything below y ~112 stay on the
//                      HEAD; above, the mohawk goes to `helmet` and its upper
//                      half to `hairTip` — a two-joint whip
//   torso_1_decoration the two banana ear cups go to phoneL / phoneR, the
//                      collar and the chest stay on the torso
//   torso_0_trunk      the jacket's front panels, from the chest down to the
//                      cyan hem band, go to coatL / coatR — the belly between
//                      the zips and the trousers below the hem stay put
//
// Coordinates are the PSD's (560 x 912, y down), measured on
// design/source/monkey_neon/_assembled.png.
{
	const ell = (x, y, cx, cy, rx, ry) => Math.hypot((x - cx) / rx, (y - cy) / ry);

	const hat = piece('head_4_hat');
	attachments[hat.name][hat.name] = meshAttachment(hat, 12, 12, (x, y) => {
		// wide blends: the crest sits 100px either side of the bones, so a
		// narrow one sheared its ends flat in the cheer's jump
		const hair = smoothW((118 - y) / 44);
		const tip = smoothW((84 - y) / 44);
		return { head: 1 - hair, helmet: hair * (1 - tip), hairTip: hair * tip };
	});
	console.log(`mesh    ${hat.name}: head -> helmet -> hairTip (the mohawk)`);

	const phones = piece('torso_1_decoration');
	attachments[phones.name][phones.name] = meshAttachment(phones, 16, 16, (x, y) => {
		const l = smoothW((1.15 - ell(x, y, 232, 205, 50, 58)) / 0.4);
		const r = smoothW((1.15 - ell(x, y, 398, 222, 32, 50)) / 0.4);
		return { torso: Math.max(0, 1 - l - r), phoneL: l, phoneR: r };
	});
	console.log(`mesh    ${phones.name}: torso -> phoneL / phoneR (the ear cups)`);

	const trunk = piece('torso_0_trunk');
	attachments[trunk.name][trunk.name] = meshAttachment(trunk, 16, 18, (x, y) => {
		// down the panel, and back off again below the hem so the waistband stays
		const along = smoothW((y - 360) / 80) * smoothW((490 - y) / 18);
		// only the panel itself (x 150..248): left of it the trunk layer carries a
		// stray speck at (77,462) that the arm hides — moved, it peeked out
		const l = along * smoothW((248 - x) / 14) * smoothW((x - 150) / 20);
		const r = along * smoothW((x - 398) / 10);
		return { torso: Math.max(0, 1 - l - r), coatL: l, coatR: r };
	});
	console.log(`mesh    ${trunk.name}: torso -> coatL / coatR (the jacket's front panels)`);
}

// The copy points at the ORIGINAL's atlas region via `path`, so it costs a slot
// and nothing else — no second region, no extra pixels in the page.
for (const name of FRONT_COPIES) {
	if (!attachments[name]) continue;
	attachments[frontName(name)] = {
		[frontName(name)]: { ...attachments[name][name], path: name },
	};
}

for (const prop of PROPS) {
	attachments[prop.name] = {
		[prop.name]: { x: 0, y: 0, width: prop.size, height: prop.size },
	};
}

// ── atlas ───────────────────────────────────────────────────────────────────
// Shelf packing, tallest first. 19 pieces into one page — nothing here justifies
// a real bin packer, and a predictable layout is easier to eyeball when a region
// looks wrong.
const PAD = 2;
const PAGE_W = 1024;
const placed = [];
{
	const propImages = PROPS.map((prop) => {
		const img = PNG.sync.read(fs.readFileSync(prop.file));
		return { name: prop.name, file: prop.file, w: img.width, h: img.height, external: true };
	});
	const sorted = [...drawOrder.filter((l) => boneOf[l.name]), ...propImages].sort(
		(a, b) => b.h - a.h,
	);
	let x = PAD, y = PAD, shelf = 0;
	for (const l of sorted) {
		if (x + l.w + PAD > PAGE_W) {
			x = PAD;
			y += shelf + PAD;
			shelf = 0;
		}
		placed.push({ ...l, ax: x, ay: y });
		x += l.w + PAD;
		shelf = Math.max(shelf, l.h);
	}
	var PAGE_H = y + shelf + PAD;
}
// Deliberately NOT rounded up to a power of two. The shelves came to ~1100,
// which would round to 2048 and nearly double the texture for empty space; pixi
// v8 is WebGL2/WebGPU only and has no NPOT restriction to work around.

const page = new PNG({ width: PAGE_W, height: PAGE_H });
page.data.fill(0);
for (const p of placed) {
	const img = PNG.sync.read(fs.readFileSync(p.external ? p.file : path.join(SRC, p.file)));
	for (let yy = 0; yy < p.h; yy++)
		for (let xx = 0; xx < p.w; xx++) {
			const s = (yy * img.width + xx) * 4;
			const d = ((p.ay + yy) * PAGE_W + p.ax + xx) * 4;
			for (let c = 0; c < 4; c++) page.data[d + c] = img.data[s + c];
		}
}
fs.writeFileSync(path.join(OUT, 'monkey.png'), PNG.sync.write(page));

const atlas =
	`monkey.png\n` +
	`size:${PAGE_W},${PAGE_H}\n` +
	`format:RGBA8888\n` +
	`filter:Linear,Linear\n` +
	`repeat:none\n` +
	placed
		.map(
			(p) =>
				`${p.name}\n` +
				`bounds:${p.ax},${p.ay},${p.w},${p.h}\n` +
				`offsets:0,0,${p.w},${p.h}\n` +
				`index:-1\n`,
		)
		.join('');
fs.writeFileSync(path.join(OUT, 'monkey.atlas'), atlas);

// ── animations ──────────────────────────────────────────────────────────────
//
// idle is the one that plays for hours, so it is deliberately understated: the
// job is to look alive between spins, not to draw the eye off the reels. Nothing
// in it is on the same period as anything else, so the loop never lands on an
// obvious beat — a mascot whose parts all breathe together reads as one object
// pulsing, which is the tell that it is a rig rather than a body.
//
// The legs do not move. They are planted, they carry the weight, and animating
// them is how a standing character starts to look like it is treading water.
// -- how this character is allowed to move --------------------------------------------------------
//
// WHAT THIS ART WILL AND WILL NOT DO
//
// The first version of this set rotated the shoulders up to 142 degrees to put
// both fists over the head, and folded the elbows 99 to put them on the chest.
// The maths was right, the poses were reachable, and in the game they looked
// broken. Watching a capture back frame by frame says exactly why, and it is a
// property of the DRAWING rather than of the rig:
//
//   · Each arm is one continuous mass of fur, painted hanging, and tapering from
//     a wide shoulder down to a narrow wrist. Swing it 90 degrees and the wide
//     end is at the top of a horizontal bar - the taper now runs the wrong way,
//     and it reads as a plank being rotated rather than as an arm being raised.
//
//   · The forearm and hand pieces are centred well BELOW their own joints (the
//     hand piece is 129x259 - it is most of a forearm, not a fist). Fold the
//     elbow far and that whole mass doubles back alongside the upper arm, so the
//     two overlap into one blob with no readable elbow. On the capture the arm
//     simply appears to bend backwards.
//
//   · A cutout rig has no depth. There is no way to pass a limb in front of the
//     torso and have it read as being in front.
//
// None of that is fixable in keyframes. It is fixable in the ANGLES, so every
// animation below stays inside a budget the drawing can carry, and the character
// comes from the body instead:
// These are MEASURED, by posing the shoulder at 0/10/20/.../80 degrees and
// looking at each one (design/preview_monkey_spine.mjs against a temporary
// linear sweep). The drawing holds to about 25, is stiff but passable at 30, and
// from 40 the arm has visibly left the vest - there is a gap at the shoulder and
// the fur taper has started to run the wrong way. By 50 it is a plank.
//
// 46 was the second guess and it was still over the line. Guessing is what put
// 142 in here the first time.
const MAX_SHOULDER = 26;
const MAX_ELBOW = 22;
//
// A HANGING FOREARM STAYS PLUMB
//
// The rest pose already has a bend at each elbow - the left upper arm points at
// 262 degrees and its forearm at 280, the right at 283 and 273. That bend is
// what makes the arm read as an arm.
//
// Rotating the forearm the SAME way as the shoulder cancels it. Swing the left
// shoulder -26 and the forearm inherits it (280 - 26 = 254); add another -22 and
// the forearm sits at 232 against an upper arm at 236 - four degrees apart, i.e.
// a straight line. That is exactly the plank the shoulder budget exists to
// avoid, arrived at from the other end, and it is what "the left arm going up
// looks wrong" was.
//
// A relaxed arm does the opposite: the shoulder swings and the forearm stays
// roughly plumb, because it is hanging. So for any swing that is not an active
// push, the elbow counter-rotates at about seventy percent of the shoulder.
const hang = (shoulder) => -Math.round(shoulder * 0.7);
//
// Two deliberate exceptions, both of them arms being DRIVEN rather than hanging:
// chestbeat flexes the elbow inward to carry the fist across the body, and
// throwit extends the whole limb into the throw. Those keep the same sign as the
// shoulder on purpose.
//
// WHAT THIS COSTS, SAID PLAINLY
//
// 26 degrees is not a raised arm and it is nowhere near a fist over the head.
// The arms-in-the-air celebration is not available from this artwork, and no
// amount of keyframing gets it back - it needs the upper arm redrawn as its own
// piece with a shoulder that reads when rotated, which is an art change.
//
// So every animation here is carried by the BODY: the hip, the torso's squash
// and stretch, the head, and the timing between them. The arms only trail. That
// is a real constraint honestly worked within, not a compromise hidden in the
// middle of a file.
//
// Directions, measured from the rig rather than assumed: shoulder-to-elbow rests
// at 262 degrees on the left and 283 on the right, so "outward and up" is
// negative on the left and positive on the right.
const OUT_L = -MAX_SHOULDER;
const OUT_R = MAX_SHOULDER;
const OUT_FORE_L = hang(OUT_L);
const OUT_FORE_R = hang(OUT_R);

// LEAD and DRAG. One arm starts fractionally before the other, and the forearm
// reaches its angle after the shoulder does - a limb is a chain and the far end
// always arrives late. Perfect symmetry and simultaneous joints are the two
// loudest tells that something is being driven by a machine.
const LEAD = 0.05;
const DRAG = 0.08;

// The loop's length. Every timeline in idle closes on it exactly - see below.
const IDLE_LOOP = 5.4;

const idle = {
	bones: {
		// A WEIGHT SHIFT, which is the thing a standing character has to do.
		//
		// He used to only breathe: the hip rose and fell and nothing else moved, so
		// he read as a statue with a bellows in it. Over one loop the weight goes
		// onto one leg and back, the hip drifting sideways and the loaded leg
		// compressing to take it - the same foreshortening trick the jump uses,
		// three hundredths of the range.
		hip: {
			translate: [
				{ time: 0, x: 0, y: 0 },
				{ time: 1.35, x: 3.5, y: -2 },
				{ time: 2.7, x: 5, y: -4 },
				{ time: 4.05, x: 2, y: -2 },
				{ time: IDLE_LOOP, x: 0, y: 0 },
			],
		},
		// The loaded leg shortens, the other lengthens. Opposite phase, or he is
		// just bobbing.
		legR: {
			scale: [
				{ time: 0, x: 1, y: 1 },
				{ time: 2.7, x: 1.004, y: 0.993 },
				{ time: IDLE_LOOP, x: 1, y: 1 },
			],
		},
		legL: {
			scale: [
				{ time: 0, x: 1, y: 1 },
				{ time: 2.7, x: 0.998, y: 1.004 },
				{ time: IDLE_LOOP, x: 1, y: 1 },
			],
		},
		torso: {
			// TWO breaths per loop, so nothing here ever sits still. Every timeline
			// used to end on its own period - 3.2s, 3.6s, 4.4s - inside a 5.4s
			// animation, which meant each one froze on its last value for the
			// remainder. A body where the chest stops for 1.6s and the head carries
			// on is not breathing, it is glitching.
			scale: [
				{ time: 0, x: 1, y: 1 },
				{ time: 1.35, x: 0.994, y: 1.022 },
				{ time: 2.7, x: 1, y: 1 },
				{ time: 4.05, x: 0.996, y: 1.016 },
				{ time: IDLE_LOOP, x: 1, y: 1 },
			],
			// one slow sway, offset from the breath so the two never line up
			rotate: [
				{ time: 0, value: 0 },
				{ time: 1.8, value: 1.2 },
				{ time: 3.6, value: -0.6 },
				{ time: IDLE_LOOP, value: 0 },
			],
		},
		head: {
			// a slow look around, on its own beat again
			rotate: [
				{ time: 0, value: 0 },
				{ time: 1.5, value: -2.4 },
				{ time: 3.4, value: 1.8 },
				{ time: 4.6, value: 0.6 },
				{ time: IDLE_LOOP, value: 0 },
			],
			// rides the breath
			translate: [
				{ time: 0, x: 0, y: 0 },
				{ time: 1.35, x: 0, y: 3 },
				{ time: 2.7, x: 0, y: 0 },
				{ time: 4.05, x: 0, y: 2.2 },
				{ time: IDLE_LOOP, x: 0, y: 0 },
			],
		},
		// The arms hang, so they trail the torso rather than driving it. Opposite
		// signs: both swinging the same way is a march, not a stance.
		armL: {
			rotate: [
				{ time: 0, value: 0 },
				{ time: 1.8, value: 2.4 },
				{ time: 3.6, value: -0.8 },
				{ time: IDLE_LOOP, value: 0 },
			],
		},
		armR: {
			rotate: [
				{ time: 0, value: 0 },
				{ time: 2.1, value: -2.4 },
				{ time: 4.2, value: 0.9 },
				{ time: IDLE_LOOP, value: 0 },
			],
		},
		// hang(): the forearm stays plumb while the shoulder swings. Written the
		// same way round as it was is what made every raised arm look like a plank
		// - see the note above the constant.
		armL_fore: {
			rotate: [
				{ time: 0, value: 0 },
				{ time: 1.8 + DRAG, value: hang(2.4) },
				{ time: 3.6 + DRAG, value: hang(-0.8) },
				{ time: IDLE_LOOP, value: 0 },
			],
		},
		armR_fore: {
			rotate: [
				{ time: 0, value: 0 },
				{ time: 2.1 + DRAG, value: hang(-2.4) },
				{ time: 4.2 + DRAG, value: hang(0.9) },
				{ time: IDLE_LOOP, value: 0 },
			],
		},
		// the fists are the end of the chain and barely move at all
		armL_hand: {
			rotate: [
				{ time: 0, value: 0 },
				{ time: 2.0, value: -1.2 },
				{ time: 3.9, value: 0.5 },
				{ time: IDLE_LOOP, value: 0 },
			],
		},
		armR_hand: {
			rotate: [
				{ time: 0, value: 0 },
				{ time: 2.3, value: 1.2 },
				{ time: 4.4, value: -0.5 },
				{ time: IDLE_LOOP, value: 0 },
			],
		},
	},
};

// cheer: a one-shot for a win worth reacting to. Crouch, jump, arms thrown out
// and up, two pumps, back to a stand.
//
// It ENDS at rest. An earlier version handed over to a looping "celebrate" that
// held the pose for as long as the win plaque was up - and the plaque waits for
// the player, so that was unbounded. Held long enough it stops reading as a
// celebration and starts reading as something that has jammed.
const cheer = {
	bones: {
		hip: {
			translate: [
				{ time: 0, x: 0, y: 0 },
				{ time: 0.18, x: 0, y: -26 }, // load
				{ time: 0.42, x: 0, y: 48 }, // off the ground
				{ time: 0.66, x: 0, y: 4 }, // land, and take the weight
				{ time: 0.78, x: 0, y: -8 },
				{ time: 1.02, x: 0, y: 18 }, // second, smaller hop
				{ time: 1.28, x: 0, y: 0 },
				{ time: 1.5, x: 0, y: 7 },
				{ time: 2.05, x: 0, y: 0 },
			],
		},
		torso: {
			// The celebration is mostly HERE. A deep squash into the jump and a
			// long stretch out of it carries more excitement than any arm on this
			// character can.
			// Pushed harder than it would otherwise be, because with the arms
			// capped at 26 degrees this IS the celebration. A deep load and a long
			// stretch out of it is the only channel left with any range in it.
			scale: [
				{ time: 0, x: 1, y: 1 },
				{ time: 0.14, x: 1.15, y: 0.8 },
				{ time: 0.36, x: 0.89, y: 1.2 },
				{ time: 0.62, x: 1.06, y: 0.96 },
				{ time: 0.9, x: 0.95, y: 1.09 },
				{ time: 1.2, x: 1.02, y: 0.99 },
				{ time: 1.9, x: 1, y: 1 },
			],
			// A twist as well as a lean: rotation is cheap on the torso, which is
			// one solid drawing and does not come apart the way a limb does.
			rotate: [
				{ time: 0, value: 0 },
				{ time: 0.14, value: 4 },
				{ time: 0.36, value: -6 },
				{ time: 0.9, value: 5 },
				{ time: 1.34, value: -3 },
				{ time: 1.9, value: 0 },
			],
		},
		// THE LEGS, without which the hip translate is a body being lifted rather
		// than a character jumping.
		//
		// Seen from the front, a knee bend cannot be shown by rotating anything -
		// rotating the calf swings the foot sideways, which reads as the leg being
		// thrown out. Foreshortening is what a front view actually has, so the legs
		// COMPRESS: scaling the thigh bone shortens the whole chain below it.
		//
		// The compression is sized to the hip. On the crouch the hip drops 26 and
		// the legs lose about seven percent of their 386-unit length, which is the
		// same 26 - so the boots stay on the ground instead of sinking through it.
		// On the drive they stretch past 1 and the feet leave. In the air they
		// relax, because nothing is holding them.
		legL: {
			scale: [
				{ time: 0, x: 1, y: 1 },
				{ time: 0.18, x: 1.03, y: 0.93 }, // crouch, feet planted
				{ time: 0.42, x: 0.99, y: 1.04 }, // drive
				{ time: 0.62, x: 1, y: 0.98 }, // relaxed in the air
				{ time: 0.72, x: 1.02, y: 0.95 }, // absorb the landing
				{ time: 0.94, x: 1, y: 1 },
				{ time: 1.06, x: 1, y: 0.97 },
				{ time: 1.34, x: 1, y: 1 },
				{ time: 2.05, x: 1, y: 1 },
			],
		},
		legR: {
			scale: [
				{ time: 0, x: 1, y: 1 },
				{ time: 0.18 + 0.02, x: 1.03, y: 0.93 },
				{ time: 0.42 + 0.02, x: 0.99, y: 1.04 },
				{ time: 0.62, x: 1, y: 0.98 },
				{ time: 0.74, x: 1.02, y: 0.95 },
				{ time: 0.96, x: 1, y: 1 },
				{ time: 1.08, x: 1, y: 0.97 },
				{ time: 1.36, x: 1, y: 1 },
				{ time: 2.05, x: 1, y: 1 },
			],
		},
		head: {
			// thrown back on the jump, then back to the player
			rotate: [
				{ time: 0, value: 0 },
				{ time: 0.14, value: 5 },
				{ time: 0.4, value: -9 },
				{ time: 1.0, value: -4 },
				{ time: 1.9, value: 0 },
			],
			translate: [
				{ time: 0, x: 0, y: 0 },
				{ time: 0.36, x: 0, y: 12 },
				{ time: 1.0, x: 0, y: 4 },
				{ time: 1.9, x: 0, y: 0 },
			],
		},
		// Right leads. Both wind up the other way first: arms that go straight to
		// the pose read as a switch being flipped, a counter-swing first reads as
		// a body deciding to throw them out.
		armR: {
			rotate: [
				{ time: 0, value: 0 },
				{ time: 0.12, value: -13 },
				{ time: 0.36, value: OUT_R + 6 }, // overshoot
				{ time: 0.48, value: OUT_R },
				{ time: 0.9, value: OUT_R - 14 },
				{ time: 1.14, value: OUT_R + 4 },
				{ time: 1.34, value: OUT_R - 9 },
				{ time: 1.56, value: OUT_R },
				{ time: 1.9, value: 0 },
			],
		},
		armL: {
			rotate: [
				{ time: 0, value: 0 },
				{ time: 0.12 + LEAD, value: 13 },
				{ time: 0.36 + LEAD, value: OUT_L - 6 },
				{ time: 0.48 + LEAD, value: OUT_L },
				{ time: 0.9 + LEAD, value: OUT_L + 14 },
				{ time: 1.14 + LEAD, value: OUT_L - 4 },
				{ time: 1.34 + LEAD, value: OUT_L + 9 },
				{ time: 1.56 + LEAD, value: OUT_L },
				{ time: 1.9, value: 0 },
			],
		},
		// Elbows bend the SAME way as the raise, so the arm keeps a visible angle
		// at the joint instead of going out as one straight bar - and they arrive
		// DRAG later than the shoulder, so the elbow trails the swing.
		armR_fore: {
			rotate: [
				{ time: 0, value: 0 },
				{ time: 0.36 + DRAG, value: OUT_FORE_R + 10 },
				{ time: 0.52 + DRAG, value: OUT_FORE_R },
				{ time: 0.98, value: OUT_FORE_R + 8 },
				{ time: 1.22, value: OUT_FORE_R - 4 },
				{ time: 1.44, value: OUT_FORE_R + 5 },
				{ time: 1.64, value: OUT_FORE_R },
				{ time: 1.9, value: 0 },
			],
		},
		armL_fore: {
			rotate: [
				{ time: 0, value: 0 },
				{ time: 0.36 + DRAG + LEAD, value: OUT_FORE_L - 10 },
				{ time: 0.52 + DRAG + LEAD, value: OUT_FORE_L },
				{ time: 0.98 + LEAD, value: OUT_FORE_L - 8 },
				{ time: 1.22 + LEAD, value: OUT_FORE_L + 4 },
				{ time: 1.44 + LEAD, value: OUT_FORE_L - 5 },
				{ time: 1.64 + LEAD, value: OUT_FORE_L },
				{ time: 1.9, value: 0 },
			],
		},
		// The fists are the far end of the chain: last to arrive, last to stop.
		// Small angles - follow-through, not a gesture of its own.
		armR_hand: {
			rotate: [
				{ time: 0, value: 0 },
				{ time: 0.36 + DRAG * 2, value: 10 },
				{ time: 0.6 + DRAG * 2, value: 0 },
				{ time: 1.04, value: 6 },
				{ time: 1.28, value: 0 },
				{ time: 1.9, value: 0 },
			],
		},
		armL_hand: {
			rotate: [
				{ time: 0, value: 0 },
				{ time: 0.36 + DRAG * 2 + LEAD, value: -10 },
				{ time: 0.6 + DRAG * 2 + LEAD, value: 0 },
				{ time: 1.04 + LEAD, value: -6 },
				{ time: 1.28 + LEAD, value: 0 },
				{ time: 1.9, value: 0 },
			],
		},
	},
};

// chestbeat: the gorilla, for a 4+ scatter trigger - the rare way in, so it gets
// the biggest thing he does.
//
// The fists do NOT reach the chest, and that is deliberate. Getting them there
// needs about 100 degrees of elbow, which is where the forearm doubles back over
// the upper arm and the whole arm loses its shape (see the budget above). So the
// display is built the way an animal actually does it - the arms are the smallest
// part of it:
//
//   · he HUNCHES: torso pitched forward, head down and out, weight dropped
//   · the arms swing IN across the body, alternating, inside the budget
//   · the whole body drops into every strike, so the impact is carried by the
//     hip and the torso rather than by how far a fist travels
//
// It reads as pounding because of the rhythm and the weight, not the reach.
// The beat has a budget of its own, and it is larger than MAX_SHOULDER.
//
// MAX_SHOULDER is the limit for an angle the character HOLDS, measured on the
// PREVIOUS artwork. Re-measured on this one with `--sweep`, the arms swing
// INWARD across the body far further before anything comes apart than they do
// outward: the shoulder pivot sits inside the vest, so an inward swing tucks the
// sleeve into the chest instead of pulling it off the shoulder. At 50 degrees
// both arms still read as arms; the outward limit has not moved.
//
// This is why the beat used to look like a shrug. It was spending an outward
// budget on an inward motion.
// The two arms need DIFFERENT angles, and the reason has changed.
//
// On the previous character it was the rigging: one arm was a single rigid piece
// on a long lever and the other was two-piece. Both are two-piece now, so that
// reason is gone — and the numbers still have to differ, because the ARTWORK
// hangs them at different distances from the centre line. The right sleeve sits
// at x 397..505 and the left at 25..186, so the same rotation lands the two
// fists in different places.
//
// Solved against the readout at the bottom of this file, not guessed:
//   L 6 / R 14  ->  fists at -63 and +60, each over its own pec.
//
// Set against the readout at the bottom of this file, which prints where each
// fist actually is at the top of its strike. The target is each fist over its own
// side of the chest — about x = -60 on the left and +60 on the right.
const BEAT_SHOULDER_L = -1;
const BEAT_SHOULDER_R = 15;
const BEAT_IN_L = BEAT_SHOULDER_L;
const BEAT_IN_R = -BEAT_SHOULDER_R;
const BEAT_FORE_L = 72;
const BEAT_FORE_R = -65;
const BEAT_OUT = 14; // how far the idle arm cocks away while the other lands

// Smoothing removed the corners; these numbers remove the hurry. Six strikes at
// 0.25s left every one of them a cock-strike-rebound inside a quarter second,
// which is faster than the body underneath can follow - the arms arrived, the
// torso was still catching up, and it read as vibration rather than as force.
// At 0.30 the whole body gets to travel with each one.
const BEAT_START = 0.48;
const BEAT_GAP = 0.3;
const beats = [0, 1, 2, 3, 4, 5].map((i) => BEAT_START + i * BEAT_GAP);
const BEAT_END = beats[5] + BEAT_GAP;

// One arm's keys for EVERY beat, not only its own: a chest beat is one fist in
// while the other is cocked, so the arm that does not own a beat has to be
// somewhere else at that moment. Keying only its own beats left both arms parked
// in the same place between strikes and the alternation was invisible.
//
// `side` is +1 for the arm whose angles increase as it swings inward, so one
// function drives both and they cannot drift apart.
const beatKeys = (inward, side, mine, rest = inward - side * BEAT_OUT) =>
	beats.flatMap((t, i) =>
		mine.includes(i)
			? [
					{ time: t - 0.16, value: rest }, // cocked
					{ time: t, value: inward + side * 5 }, // through the target
					{ time: t + 0.11, value: inward }, // rebound
				]
			: [{ time: t, value: rest }],
	);

// The right arm is drawn in front for the length of the clip. Both keys are at
// the ends rather than around each strike: swapping per beat would flicker the
// arm through the chest six times, and there is nothing in this pose that needs
// it behind.
const chestbeatSlots = Object.fromEntries(
	FRONT_COPIES.flatMap((name) => [
		[name, { attachment: [{ time: 0, name: null }, { time: BEAT_END + 0.34, name }] }],
		[
			frontName(name),
			{
				attachment: [
					{ time: 0, name: frontName(name) },
					{ time: BEAT_END + 0.34, name: null },
				],
			},
		],
	]),
);

const chestbeat = {
	slots: chestbeatSlots,
	bones: {
		hip: {
			translate: [
				{ time: 0, x: 0, y: 0 },
				{ time: 0.24, x: 0, y: -16 }, // settle into the stance
				...beats.flatMap((t) => [
					{ time: t - 0.09, x: 0, y: -9 },
					{ time: t + 0.02, x: 0, y: -23 }, // drop into the strike
					{ time: t + 0.16, x: 0, y: -12 },
				]),
				{ time: BEAT_END + 0.34, x: 0, y: 0 },
			],
		},
		torso: {
			// Pitched forward and held there. This is the pose that says gorilla;
			// the arms only keep time with it.
			rotate: [
				{ time: 0, value: 0 },
				{ time: 0.26, value: -6 },
				...beats.map((t, i) => ({ time: t + 0.03, value: i % 2 === 0 ? -4 : -8 })),
				{ time: BEAT_END + 0.34, value: 0 },
			],
			scale: [
				{ time: 0, x: 1, y: 1 },
				{ time: 0.26, x: 1.07, y: 0.95 }, // chest out, height down
				...beats.flatMap((t) => [
					{ time: t + 0.02, x: 1.11, y: 0.91 },
					{ time: t + 0.18, x: 1.07, y: 0.95 },
				]),
				{ time: BEAT_END + 0.34, x: 1, y: 1 },
			],
		},
		head: {
			// chin down and forward - a threat display, not a look up
			rotate: [
				{ time: 0, value: 0 },
				{ time: 0.26, value: 8 },
				...beats.map((t, i) => ({ time: t + 0.05, value: i % 2 === 0 ? 10 : 7 })),
				{ time: BEAT_END + 0.38, value: 0 },
			],
			translate: [
				{ time: 0, x: 0, y: 0 },
				{ time: 0.26, x: 0, y: -8 },
				{ time: BEAT_END + 0.38, x: 0, y: 0 },
			],
		},
		armR: {
			rotate: [
				{ time: 0, value: 0 },
				{ time: 0.28, value: BEAT_IN_R },
				...beatKeys(BEAT_IN_R, -1, [0, 2, 4]),
				{ time: BEAT_END, value: BEAT_IN_R },
				{ time: BEAT_END + 0.4, value: 0 },
			],
		},
		armL: {
			rotate: [
				{ time: 0, value: 0 },
				{ time: 0.28 + LEAD, value: BEAT_IN_L },
				...beatKeys(BEAT_IN_L, 1, [1, 3, 5]),
				{ time: BEAT_END, value: BEAT_IN_L },
				{ time: BEAT_END + 0.4, value: 0 },
			],
		},
		armR_fore: {
			rotate: [
				{ time: 0, value: 0 },
				{ time: 0.28 + DRAG, value: -25 },
				...beatKeys(BEAT_FORE_R, -1, [0, 2, 4], -25),
				{ time: BEAT_END, value: -25 },
				{ time: BEAT_END + 0.4, value: 0 },
			],
		},
		armL_fore: {
			rotate: [
				{ time: 0, value: 0 },
				{ time: 0.28 + DRAG + LEAD, value: 25 },
				...beatKeys(BEAT_FORE_L, 1, [1, 3, 5], 25),
				{ time: BEAT_END, value: 25 },
				{ time: BEAT_END + 0.4, value: 0 },
			],
		},
		// The fists snap on contact and are still moving after the arm has stopped.
		// Without this the hand is welded to the forearm, and a rigid wrist is the
		// difference between a strike and a bat being swung.
		armR_hand: {
			rotate: [
				{ time: 0, value: 0 },
				...beats.flatMap((t, i) =>
					i % 2 === 0
						? [
								{ time: t - 0.08, value: 10 },
								{ time: t + 0.03, value: -14 },
								{ time: t + 0.16, value: 0 },
							]
						: [],
				),
				{ time: BEAT_END + 0.4, value: 0 },
			],
		},
		armL_hand: {
			rotate: [
				{ time: 0, value: 0 },
				...beats.flatMap((t, i) =>
					i % 2 === 1
						? [
								{ time: t - 0.08, value: -10 },
								{ time: t + 0.03, value: 14 },
								{ time: t + 0.16, value: 0 },
							]
						: [],
				),
				{ time: BEAT_END + 0.4, value: 0 },
			],
		},
	},
};

// nod: the base game paid something. 0.8s, and almost nothing happens.
//
// This is the one that plays CONSTANTLY - most base spins that pay anything at
// all - so its whole design brief is to be noticed without being watched. A nod,
// a shrug, a dip of the weight. Anything bigger becomes the thing you look at
// instead of the reels, and after twenty spins it becomes the thing you want to
// turn off.
const nod = {
	bones: {
		hip: {
			translate: [
				{ time: 0, x: 0, y: 0 },
				{ time: 0.24, x: 0, y: -7 },
				{ time: 0.56, x: 0, y: 2 },
				{ time: 1.0, x: 0, y: 0 },
			],
		},
		torso: {
			scale: [
				{ time: 0, x: 1, y: 1 },
				{ time: 0.24, x: 1.03, y: 0.98 },
				{ time: 0.56, x: 0.99, y: 1.01 },
				{ time: 1.0, x: 1, y: 1 },
			],
			rotate: [
				{ time: 0, value: 0 },
				{ time: 0.3, value: 1.5 },
				{ time: 1.0, value: 0 },
			],
		},
		// the same trick as the jump, an order of magnitude smaller: the weight
		// actually goes somewhere instead of the body sliding down as one piece
		legL: {
			scale: [
				{ time: 0, x: 1, y: 1 },
				{ time: 0.24, x: 1.01, y: 0.982 },
				{ time: 0.56, x: 1, y: 1.005 },
				{ time: 1.0, x: 1, y: 1 },
			],
		},
		legR: {
			scale: [
				{ time: 0, x: 1, y: 1 },
				{ time: 0.26, x: 1.01, y: 0.982 },
				{ time: 0.58, x: 1, y: 1.005 },
				{ time: 1.0, x: 1, y: 1 },
			],
		},
		head: {
			// Down on the beat, up a little past level, settle.
			//
			// 0.14s to reach the bottom was a flinch, not a nod - fast enough that
			// the head appeared to jump rather than move, and this is the animation
			// that plays on most paying spins, so a flinch is what the game looked
			// like it was doing all the time.
			rotate: [
				{ time: 0, value: 0 },
				{ time: 0.22, value: 6 },
				{ time: 0.52, value: -3 },
				{ time: 1.0, value: 0 },
			],
			translate: [
				{ time: 0, x: 0, y: 0 },
				{ time: 0.24, x: 0, y: -5 },
				{ time: 0.6, x: 0, y: 1 },
				{ time: 1.0, x: 0, y: 0 },
			],
		},
		// a shrug, and the forearms trail it
		armR: {
			rotate: [
				{ time: 0, value: 0 },
				{ time: 0.26, value: -7 },
				{ time: 0.6, value: 2 },
				{ time: 1.0, value: 0 },
			],
		},
		armL: {
			rotate: [
				{ time: 0, value: 0 },
				{ time: 0.26 + LEAD, value: 7 },
				{ time: 0.6 + LEAD, value: -2 },
				{ time: 1.0, value: 0 },
			],
		},
		// hang(): the shrug is the shoulder, the forearm just stays where it was
		armR_fore: {
			rotate: [
				{ time: 0, value: 0 },
				{ time: 0.26 + DRAG, value: hang(-7) },
				{ time: 0.62, value: hang(2) },
				{ time: 1.0, value: 0 },
			],
		},
		armL_fore: {
			rotate: [
				{ time: 0, value: 0 },
				{ time: 0.26 + DRAG + LEAD, value: hang(7) },
				{ time: 0.62 + LEAD, value: hang(-2) },
				{ time: 1.0, value: 0 },
			],
		},
	},
};

// throwit: he produces the dynamite and pitches it at the board.
//
// Named 'throwit' rather than 'throw' because `throw` is a reserved word, and
// this object is written as JS before it becomes JSON.
//
// He throws with the LEFT arm - the one nearer the board, and the one the PSD
// stacks IN FRONT of the coat, so the whole swing stays visible instead of
// disappearing behind the vest halfway through.
//
// THE GRENADE IS PART OF THE SKELETON
//
// It hangs off `prop`, a bone parented to the throwing hand, so it follows the
// hand exactly through the wind-up. The alternative - drawing it outside the rig
// and trying to track the hand - means something outside the skeleton guessing
// at a position the skeleton already knows.
//
// It APPEARS at APPEAR_AT: the slot has no attachment before then, and the prop
// bone scales up from nothing, so it pops into his fist rather than being there
// all along. It is switched off again at release, at which point
// TransitionAnimation takes over and flies its own copy to the middle.
//
// PACING
//
// Deliberately unhurried between the two: a beat to notice the dynamite, a wind
// up you can read, then the throw. Release used to be at 0.38s with the dynamite
// invisible until it left, which meant the whole gesture was over before there
// was anything to see it happen to.
const APPEAR_AT = 0.2;
const RELEASE_AT = 0.58;

// The throw is allowed OUTSIDE the pose budget that governs the rest of the set.
//
// MAX_SHOULDER (26) is the limit for an angle the character HOLDS - past it the
// fur taper inverts and the arm reads as a plank, and that is what the eye has
// time to notice. A throw passes through its extreme in three or four frames and
// never rests there, so it can spend more: 36 at the shoulder and 30 at the
// elbow, which is what makes the swing actually read as a swing.
//
// This is the one exception in the file, and it is an exception about DWELL, not
// about the drawing suddenly being able to take more.
const THROW_SHOULDER = 36;
const THROW_ELBOW = 30;
const COCK_BACK = 34;

const throwit = {
	slots: {
		// nothing, then a dynamite, then nothing again
		dynamite: {
			attachment: [
				{ time: 0, name: null },
				{ time: APPEAR_AT, name: 'dynamite' },
				{ time: RELEASE_AT, name: null },
			],
		},
	},
	bones: {
		// the pop into existence, and a slight settle
		prop: {
			scale: [
				{ time: APPEAR_AT, x: 0.2, y: 0.2 },
				{ time: APPEAR_AT + 0.12, x: 1.18, y: 1.18 },
				{ time: APPEAR_AT + 0.24, x: 1, y: 1 },
			],
		},
		// x as well as y: a throw is a weight transfer. He loads back over the
		// far leg, then drives across onto the near one. Standing still and
		// waving an arm is what the first version did.
		hip: {
			translate: [
				{ time: 0, x: 0, y: 0 },
				{ time: APPEAR_AT, x: 3, y: -4 },
				{ time: 0.42, x: 9, y: -14 }, // loaded back
				{ time: RELEASE_AT + 0.05, x: -10, y: 10 }, // driven through
				{ time: 0.9, x: -3, y: -3 },
				{ time: 1.2, x: 0, y: 0 },
			],
		},
		// and the legs take it, the same foreshortening the jump uses
		legR: {
			scale: [
				{ time: 0, x: 1, y: 1 },
				{ time: 0.42, x: 1.02, y: 0.965 }, // carrying him
				{ time: RELEASE_AT + 0.05, x: 0.99, y: 1.02 }, // pushing off
				{ time: 0.9, x: 1, y: 0.995 },
				{ time: 1.2, x: 1, y: 1 },
			],
		},
		legL: {
			scale: [
				{ time: 0, x: 1, y: 1 },
				{ time: 0.42, x: 0.99, y: 1.015 },
				{ time: RELEASE_AT + 0.08, x: 1.02, y: 0.97 }, // takes the landing
				{ time: 0.94, x: 1, y: 1 },
				{ time: 1.2, x: 1, y: 1 },
			],
		},
		torso: {
			// The twist IS the throw. Rotation is cheap on the torso - it is one
			// solid drawing and does not come apart the way a limb does - so this is
			// where the range the arms do not have gets spent.
			rotate: [
				{ time: 0, value: 0 },
				{ time: APPEAR_AT, value: 3 },
				{ time: 0.42, value: 11 }, // wound away from the board
				{ time: RELEASE_AT, value: -12 }, // through
				{ time: 0.82, value: 4 },
				{ time: 1.2, value: 0 },
			],
			scale: [
				{ time: 0, x: 1, y: 1 },
				{ time: 0.42, x: 1.06, y: 0.95 },
				{ time: RELEASE_AT + 0.02, x: 0.96, y: 1.06 },
				{ time: 0.88, x: 1.01, y: 0.99 },
				{ time: 1.2, x: 1, y: 1 },
			],
		},
		head: {
			// looks down at the dynamite as it appears, then follows it out
			rotate: [
				{ time: 0, value: 0 },
				{ time: APPEAR_AT + 0.06, value: 8 },
				{ time: 0.44, value: 6 },
				{ time: RELEASE_AT + 0.04, value: -8 },
				{ time: 0.9, value: -3 },
				{ time: 1.2, value: 0 },
			],
		},
		armL: {
			rotate: [
				{ time: 0, value: 0 },
				{ time: APPEAR_AT, value: 12 }, // hand comes in to receive it
				{ time: 0.44, value: COCK_BACK }, // cocked back across the body
				{ time: RELEASE_AT, value: -THROW_SHOULDER },
				{ time: 0.76, value: -18 }, // follow through, then let it fall
				{ time: 1.2, value: 0 },
			],
		},
		armL_fore: {
			rotate: [
				{ time: 0, value: 0 },
				{ time: APPEAR_AT, value: 14 },
				{ time: 0.44 + DRAG, value: 26 },
				{ time: RELEASE_AT + DRAG * 0.5, value: -THROW_ELBOW },
				{ time: 0.84, value: -10 },
				{ time: 1.2, value: 0 },
			],
		},
		armL_hand: {
			// the wrist snaps last, which is where the speed comes from
			rotate: [
				{ time: 0, value: 0 },
				{ time: 0.46, value: 18 },
				{ time: RELEASE_AT + 0.06, value: -22 },
				{ time: 0.9, value: 0 },
				{ time: 1.2, value: 0 },
			],
		},
		// The other arm counter-swings. A body that throws with one side and holds
		// the other still is a diagram of a throw.
		armR: {
			rotate: [
				{ time: 0, value: 0 },
				{ time: 0.44, value: -16 },
				{ time: RELEASE_AT + 0.05, value: 20 },
				{ time: 0.92, value: 5 },
				{ time: 1.2, value: 0 },
			],
		},
		armR_fore: {
			rotate: [
				{ time: 0, value: 0 },
				{ time: 0.44 + DRAG, value: -12 },
				{ time: RELEASE_AT + 0.09, value: 14 },
				{ time: 0.96, value: 0 },
				{ time: 1.2, value: 0 },
			],
		},
	},
};

// ── interpolation ───────────────────────────────────────────────────────────
//
// THIS IS WHERE THE JERK CAME FROM, NOT THE KEYFRAME VALUES
//
// A Spine keyframe with no `curve` is LINEAR. Every timeline written above had
// none, so each key was a corner: the velocity changed instantly at every one of
// them. With keys 0.2s apart - a pump, a strike, a nod - that is a visible jolt
// several times a second, which is exactly the "shaking" in the capture. No
// amount of adjusting the angles fixes it, because the angles were never the
// problem.
//
// Every timeline is therefore run through a Catmull-Rom pass that gives each key
// a tangent taken from its NEIGHBOURS, so the curve carries its momentum through
// the key instead of stopping dead and setting off again.
//
// Not plain ease-in-out on every segment, which is the obvious thing and is
// wrong here: that forces the velocity to zero at every key, so a run of close
// keys turns into a series of little stops - smooth in each segment and lurching
// across the sequence.
//
// Tangents are clamped the Fritsch-Carlson way (monotone cubic). Unclamped
// Catmull-Rom overshoots between keys, and an overshoot on a shoulder would push
// it past MAX_SHOULDER - the one budget this whole set is built around - in
// frames that never appear in any keyframe.
//
// Format: `curve` holds four numbers per animated property (rotate has one,
// translate and scale have two), and they are ABSOLUTE (time, value) control
// points, not normalised fractions. See SkeletonJson.readCurve.
// `loopD` closes the curve on itself. Without it the first and last keys get
// one-sided tangents, so a looping animation arrives at its end moving and
// restarts from a standstill - a small hitch, once per loop, forever. idle runs
// for the whole session, so once per 5.4s is thousands of times a sitting.
//
// It only means anything when the timeline starts and ends on the same value and
// its last key IS the loop point, which is why every idle timeline below is
// written to close at exactly the animation's duration.
const tangents = (t, v, loopD) => {
	const n = v.length;
	if (n < 2) return v.map(() => 0);
	const slope = [];
	for (let i = 0; i < n - 1; i++) {
		const dt = t[i + 1] - t[i];
		slope.push(dt > 1e-6 ? (v[i + 1] - v[i]) / dt : 0);
	}
	const m = new Array(n);
	if (loopD && Math.abs(v[0] - v[n - 1]) < 1e-6 && Math.abs(t[n - 1] - loopD) < 1e-6) {
		// the segment that runs off the end and back onto the start
		const wrap = (v[0] - v[n - 2]) / (t[0] + loopD - t[n - 2]);
		m[0] = (wrap + slope[0]) / 2;
		m[n - 1] = m[0];
	} else {
		m[0] = slope[0];
		m[n - 1] = slope[n - 2];
	}
	for (let i = 1; i < n - 1; i++) m[i] = (slope[i - 1] + slope[i]) / 2;
	// Fritsch-Carlson: flatten at a turning point, and never let a tangent be
	// steep enough to bulge the curve outside the two keys it joins.
	for (let i = 0; i < n - 1; i++) {
		if (slope[i] === 0) {
			m[i] = 0;
			m[i + 1] = 0;
			continue;
		}
		const a = m[i] / slope[i];
		const b = m[i + 1] / slope[i];
		if (a < 0) m[i] = 0;
		if (b < 0) m[i + 1] = 0;
		const h = Math.hypot(a, b);
		if (h > 3) {
			m[i] = ((3 / h) * a) * slope[i];
			m[i + 1] = ((3 / h) * b) * slope[i];
		}
	}
	// Clamping can pull the two ends apart again; the loop only stays closed if
	// they agree, so take the gentler of the two for both.
	if (loopD && m[0] !== m[n - 1]) {
		m[0] = m[n - 1] = Math.abs(m[0]) < Math.abs(m[n - 1]) ? m[0] : m[n - 1];
	}
	return m;
};

const FIELDS = { rotate: ['value'], translate: ['x', 'y'], scale: ['x', 'y'] };

const smoothTimeline = (keys, fields, loopD) => {
	keys.sort((a, b) => a.time - b.time);
	const t = keys.map((k) => k.time);
	const perField = fields.map((f) => tangents(t, keys.map((k) => k[f]), loopD));
	for (let i = 0; i < keys.length - 1; i++) {
		const dt = t[i + 1] - t[i];
		const third = dt / 3;
		const curve = [];
		fields.forEach((f, fi) => {
			const m = perField[fi];
			curve.push(
				+(t[i] + third).toFixed(4),
				+(keys[i][f] + m[i] * third).toFixed(4),
				+(t[i + 1] - third).toFixed(4),
				+(keys[i + 1][f] - m[i + 1] * third).toFixed(4),
			);
		});
		keys[i].curve = curve;
	}
	return keys;
};

/** Give every BONE timeline in an animation smooth interpolation.
 *
 * Slot attachment timelines are left alone on purpose: they switch a drawing on
 * or off, there is nothing between the two states to interpolate, and Spine
 * ignores a curve on them anyway. */
/* A DEAD JOINT'S KEYS GO TO ITS PARENT.
 *
 * A bone marked `fuse` has no artwork of its own and nothing behind it that can
 * bend — the limb it would have bent is painted as one piece. Every animation
 * still asks for elbow flex, because that is how an arm moves, and simply
 * dropping those keys would leave the arm stiffer than the one on the other
 * side. So the motion is MOVED to the parent: the shoulder swings by what the
 * shoulder and the elbow were each going to do.
 *
 * Tracks are resampled onto the union of both key times rather than
 * concatenated. The two were authored on different rhythms — the elbow leads or
 * drags the shoulder by design — and interleaving their keys without evaluating
 * each track at the other's times would read the wrong value at every one.
 */
const evalTrack = (keys, t) => {
	if (!keys?.length) return 0;
	if (t <= keys[0].time) return keys[0].value ?? 0;
	if (t >= keys[keys.length - 1].time) return keys[keys.length - 1].value ?? 0;
	for (let i = 1; i < keys.length; i++) {
		if (t > keys[i].time) continue;
		const a = keys[i - 1];
		const b = keys[i];
		const span = b.time - a.time;
		const f = span <= 0 ? 0 : (t - a.time) / span;
		return (a.value ?? 0) + ((b.value ?? 0) - (a.value ?? 0)) * f;
	}
	return keys[keys.length - 1].value ?? 0;
};

/* How much of a dead joint's angle the parent should take.
 *
 * Not all of it. The elbow only swings the FOREARM, so its angle moves the fist
 * by (forearm length) * sin(angle); the same angle at the shoulder moves it by
 * (whole arm length) * sin(angle), which is nearly three times as far. Folding
 * the elbow's keys across unscaled sent the left fist past the far side of the
 * body — the arm ended up at 54 degrees where the animation had asked for 29.
 *
 * So the angle is scaled by the ratio of the two lever arms, measured off the
 * rig rather than typed in.
 */
const fuseScaleOf = (bone) => {
	const tip = RIG.find((b) => b.parent === bone.name);
	if (!tip) return 1;
	const d = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
	const here = d(jointWorld[bone.name], jointWorld[tip.name]);
	const whole = d(jointWorld[bone.fuse], jointWorld[tip.name]);
	return whole > 0 ? here / whole : 1;
};

const fuseDeadJoints = (animation, name) => {
	for (const bone of RIG) {
		if (!bone.fuse) continue;
		const track = animation.bones?.[bone.name];
		if (!track) continue;
		for (const field of Object.keys(track)) {
			if (field !== 'rotate') {
				// translate or scale on a dead joint would move artwork that is
				// welded to the parent's piece. Nothing does this today; if
				// something starts to, it must be seen rather than absorbed.
				console.warn(
					`WARNING ${name}: '${field}' on dead joint ${bone.name} cannot be fused, dropped`,
				);
			}
		}
		const scale = fuseScaleOf(bone);
		const parent = (animation.bones[bone.fuse] ??= {});
		const times = [
			...new Set([
				...(track.rotate ?? []).map((k) => k.time),
				...(parent.rotate ?? []).map((k) => k.time),
			]),
		].sort((a, b) => a - b);
		parent.rotate = times.map((time) => ({
			time,
			value: evalTrack(parent.rotate, time) + evalTrack(track.rotate, time) * scale,
		}));
		delete animation.bones[bone.name];
	}
	return animation;
};

const smoothAnimation = (animation, loopD) => {
	for (const track of Object.values(animation.bones ?? {})) {
		for (const [name, keys] of Object.entries(track)) {
			const fields = FIELDS[name];
			if (fields) smoothTimeline(keys, fields, loopD);
		}
	}
	return animation;
};

/* MEASURING THE ANGLE BUDGET, instead of inheriting it.
 *
 * MAX_SHOULDER and MAX_ELBOW are not style choices, they are a property of the
 * DRAWING: the angle past which a limb visibly leaves the vest. The numbers in
 * this file were measured by posing the old artwork and looking at it, and they
 * were then carried onto a new PSD whose arms are cut completely differently —
 * which is how the chest beat ended up too small to reach across the body.
 *
 * `--sweep` adds one animation per joint that ramps it from 0 to 70 degrees over
 * seven seconds. preview_monkey_spine.mjs samples eight frames across an
 * animation's length, so each contact sheet is that joint at 0, 10, 20 ... 70 —
 * which is the measurement, and it takes one command instead of an afternoon.
 *
 *   node design/generate_monkey_spine.mjs <tools> --sweep
 *   node design/preview_monkey_spine.mjs <tools> _sweep_armR
 *
 * They are OFF by default so the shipped skeleton carries no diagnostics.
 */
const SWEEP = process.argv.includes('--sweep');
const SWEEP_TO = 70;
const SWEEP_SECONDS = 7;
const sweeps = SWEEP
	? Object.fromEntries(
			['armR', 'armR_fore', 'armL', 'armL_hand', 'torso', 'head'].map((bone) => [
				`_sweep_${bone}`,
				{
					bones: {
						[bone]: {
							rotate: [
								{ time: 0, value: 0 },
								// Right-side joints swing inward on negative angles, so the
								// sweep has to go the way the chest beat goes or it measures
								// a direction the animation never uses.
								{ time: SWEEP_SECONDS, value: bone.startsWith('armR') ? -SWEEP_TO : SWEEP_TO },
							],
						},
					},
				},
			]),
		)
	: {};

// ── HE REACTS TO THE GAME HE IS STANDING NEXT TO ─────────────────────────────
//
// He had nothing to do with the dynamite. The blast is the thing this game is
// about, and he stood through every one of them in his idle — the brace he used
// to do was dropped because the ARMS could not carry it (see MAX_SHOULDER: this
// artwork has no raised arm in it). So all three of these are carried by the
// BODY — the hip, the torso's squash and stretch, the head — with the arms
// only trailing, and the physics on the banana, the helmet and the pocket tube
// (see "THE ACCESSORIES MOVE ON THEIR OWN") turns every one of those body moves
// into follow-through for free.
//
// He stands to the RIGHT of the board, so "toward the board" is -x, and a
// lean or a tilt toward it is a POSITIVE rotation (Spine turns counter-
// clockwise, y up) — checked on the rendered frames, not assumed.
const TOWARD_X = -1;

// FLINCH — every detonation (Mascot.svelte, on reelBlast). A STARTLE, not a
// duck: he watches the fuse for ReelBlast's 380ms CHARGE beat, a little tense,
// and on the bang he gives a small jump — body straightens and lifts, the head
// jerks back, the arms fly out a touch — lands with the knees taking it, and
// is himself again. The first version ducked away and hunched; the user asked
// for "a slight jump, as if a little startled" instead (2026-09-27).
//
// Small on purpose: this fires on every dynamite, several times a feature, so
// it has to stay a flinch and not become a routine. The physics on the helmet,
// the banana and the pocket tube carries the rest.
const FLINCH_BANG = 0.38; // ReelBlast CHARGE_MS
const FLINCH_END = 1.0;
// GO BANANEON (2026-10-03): the user asked for the hop to read like
// GoBoomana's. At GoBoomana's 22 units it was there but too small to notice on
// this mascot, so it goes up twice as high and hangs a little longer.
const UP = FLINCH_BANG + 0.12; // top of the hop
const LAND = FLINCH_BANG + 0.28;
const HOP = 46;
const flinch = {
	bones: {
		// The legs hang from the hip, so the hip carries the whole body. On the
		// ground its drop must MATCH the legs' squash (~386 units of leg: 0.97 is
		// 12 units) or the feet lift off or sink; in the air the legs tuck a
		// little rather than stretch — stretching pushed the feet back down onto
		// the floor and the jump read as him merely standing up (measured: head
		// +60, feet +5).
		hip: {
			// braced while he watches; up on the bang, a hair away from the board
			translate: [
				{ time: 0, x: 0, y: 0 },
				{ time: FLINCH_BANG, x: 0, y: -3 },
				{ time: UP, x: -3 * TOWARD_X, y: HOP },
				{ time: LAND, x: -2 * TOWARD_X, y: -12 },
				{ time: LAND + 0.16, x: 0, y: 1 },
				{ time: FLINCH_END, x: 0, y: 0 },
			],
		},
		torso: {
			// straightens up with the jump, leaning back from the bang
			rotate: [
				{ time: 0, value: 0 },
				{ time: FLINCH_BANG, value: 1 },
				{ time: UP, value: -3 },
				{ time: LAND + 0.06, value: 1 },
				{ time: FLINCH_END, value: 0 },
			],
			scale: [
				{ time: 0, x: 1, y: 1 },
				{ time: FLINCH_BANG, x: 1.01, y: 0.985 },
				{ time: FLINCH_BANG + 0.08, x: 0.97, y: 1.05 },
				{ time: LAND, x: 1.04, y: 0.95 },
				{ time: LAND + 0.16, x: 0.995, y: 1.01 },
				{ time: FLINCH_END, x: 1, y: 1 },
			],
		},
		// his mouth drops open on the bang, and shuts as he lands
		jaw: {
			translate: [
				{ time: 0, x: 0, y: 0 },
				{ time: FLINCH_BANG, x: 0, y: 0 },
				{ time: FLINCH_BANG + 0.06, x: 0, y: -6 },
				{ time: LAND + 0.08, x: 0, y: -1 },
				{ time: FLINCH_END, x: 0, y: 0 },
			],
		},
		head: {
			// the jerk back, then a nod as he lands
			rotate: [
				{ time: 0, value: 0 },
				{ time: FLINCH_BANG, value: 2 },
				{ time: FLINCH_BANG + 0.07, value: -6 },
				{ time: LAND + 0.04, value: 3 },
				{ time: FLINCH_END, value: 0 },
			],
			translate: [
				{ time: 0, x: 0, y: 0 },
				{ time: FLINCH_BANG + 0.07, x: -3 * TOWARD_X, y: 6 },
				{ time: LAND, x: 0, y: -3 },
				{ time: FLINCH_END, x: 0, y: 0 },
			],
		},
		// the knees give a little while he braces, tuck in the air, and take the
		// landing — each on-ground value paired with the hip's drop above
		legL: {
			scale: [
				{ time: 0, x: 1, y: 1 },
				{ time: FLINCH_BANG, x: 1.004, y: 0.992 },
				{ time: UP, x: 1, y: 0.985 },
				{ time: LAND, x: 1.012, y: 0.97 },
				{ time: LAND + 0.16, x: 1, y: 1.003 },
				{ time: FLINCH_END, x: 1, y: 1 },
			],
		},
		legR: {
			scale: [
				{ time: 0, x: 1, y: 1 },
				{ time: FLINCH_BANG, x: 1.004, y: 0.992 },
				{ time: UP, x: 1, y: 0.985 },
				{ time: LAND, x: 1.012, y: 0.97 },
				{ time: LAND + 0.16, x: 1, y: 1.003 },
				{ time: FLINCH_END, x: 1, y: 1 },
			],
		},
		// the arms fly out a touch (outward is - on the left, + on the right,
		// see OUT_L / OUT_R) — well inside MAX_SHOULDER — with the forearms
		// hanging behind them, and come back in on the landing
		armL: {
			rotate: [
				{ time: 0, value: 0 },
				{ time: FLINCH_BANG + 0.08, value: -12 },
				{ time: LAND + 0.08, value: -3 },
				{ time: FLINCH_END, value: 0 },
			],
		},
		armL_fore: {
			rotate: [
				{ time: 0, value: 0 },
				{ time: FLINCH_BANG + 0.08 + DRAG, value: hang(-12) },
				{ time: LAND + 0.1 + DRAG, value: hang(-3) },
				{ time: FLINCH_END, value: 0 },
			],
		},
		armR: {
			rotate: [
				{ time: 0, value: 0 },
				{ time: FLINCH_BANG + 0.08 + LEAD, value: 12 },
				{ time: LAND + 0.1, value: 3 },
				{ time: FLINCH_END, value: 0 },
			],
		},
		armR_fore: {
			rotate: [
				{ time: 0, value: 0 },
				{ time: FLINCH_BANG + 0.08 + LEAD + DRAG, value: hang(12) },
				{ time: LAND + 0.12 + DRAG, value: hang(3) },
				{ time: FLINCH_END, value: 0 },
			],
		},
	},
};

// ALERT — he takes notice. The full-board tease (the fuses catching reel by
// reel) and a Scatter anticipation. From GoBananasBoat's 'alert': the weight
// goes onto the leg nearer the board with a dip first (so it does not read as
// the figure being slid), a breath in, and the head flicks the other way
// before it turns — a look, not a tilt.
const ALERT_HOLD_FROM = 0.45;
const ALERT_HOLD_TO = 1.0;
const ALERT_END = 1.35;
const alert = {
	bones: {
		hip: {
			translate: [
				{ time: 0, x: 0, y: 0 },
				{ time: 0.2, x: 4 * TOWARD_X, y: 3 },
				{ time: ALERT_HOLD_FROM, x: 11 * TOWARD_X, y: -2 },
				{ time: ALERT_HOLD_TO, x: 11 * TOWARD_X, y: -2 },
				{ time: ALERT_END, x: 0, y: 0 },
			],
		},
		torso: {
			rotate: [
				{ time: 0, value: 0 },
				{ time: ALERT_HOLD_FROM, value: 5 },
				{ time: ALERT_HOLD_TO, value: 5 },
				{ time: ALERT_END, value: 0 },
			],
			scale: [
				{ time: 0, x: 1, y: 1 },
				{ time: ALERT_HOLD_FROM, x: 0.99, y: 1.02 },
				{ time: ALERT_HOLD_TO, x: 0.99, y: 1.02 },
				{ time: ALERT_END, x: 1, y: 1 },
			],
		},
		head: {
			rotate: [
				{ time: 0, value: 0 },
				{ time: 0.16, value: -2 },
				{ time: 0.4, value: 7 },
				{ time: ALERT_HOLD_TO, value: 7 },
				{ time: ALERT_END, value: 0 },
			],
			translate: [
				{ time: 0, x: 0, y: 0 },
				{ time: 0.4, x: 14 * TOWARD_X, y: 3 },
				{ time: ALERT_HOLD_TO, x: 14 * TOWARD_X, y: 3 },
				{ time: ALERT_END, x: 0, y: 0 },
			],
		},
		// the near shoulder comes up, the far one drops
		armL: {
			rotate: [
				{ time: 0, value: 0 },
				{ time: ALERT_HOLD_FROM, value: -6 },
				{ time: ALERT_HOLD_TO, value: -6 },
				{ time: ALERT_END, value: 0 },
			],
		},
		armL_fore: {
			rotate: [
				{ time: 0, value: 0 },
				{ time: ALERT_HOLD_FROM + DRAG, value: hang(-6) },
				{ time: ALERT_HOLD_TO, value: hang(-6) },
				{ time: ALERT_END, value: 0 },
			],
		},
		armR: {
			rotate: [
				{ time: 0, value: 0 },
				{ time: ALERT_HOLD_FROM + LEAD, value: -3 },
				{ time: ALERT_HOLD_TO, value: -3 },
				{ time: ALERT_END, value: 0 },
			],
		},
		// the near leg takes the weight, the far one unloads
		legL: {
			scale: [
				{ time: 0, x: 1, y: 1 },
				{ time: ALERT_HOLD_FROM, x: 1.012, y: 0.988 },
				{ time: ALERT_HOLD_TO, x: 1.012, y: 0.988 },
				{ time: ALERT_END, x: 1, y: 1 },
			],
		},
		legR: {
			scale: [
				{ time: 0, x: 1, y: 1 },
				{ time: ALERT_HOLD_FROM, x: 0.996, y: 1.006 },
				{ time: ALERT_HOLD_TO, x: 0.996, y: 1.006 },
				{ time: ALERT_END, x: 1, y: 1 },
			],
		},
	},
};

// GLANCE — idle variety. The idle loop is 5.4s and he plays it for as long as
// the player sits there; now and then (Mascot.svelte schedules it) he looks
// over at the board and back. Small: the head does it, the torso follows a
// little, nothing else.
const GLANCE_END = 1.6;
const glance = {
	bones: {
		head: {
			rotate: [
				{ time: 0, value: 0 },
				{ time: 0.35, value: 5 },
				{ time: 0.95, value: 5 },
				{ time: GLANCE_END, value: 0 },
			],
			translate: [
				{ time: 0, x: 0, y: 0 },
				{ time: 0.35, x: 8 * TOWARD_X, y: 1 },
				{ time: 0.95, x: 8 * TOWARD_X, y: 1 },
				{ time: GLANCE_END, x: 0, y: 0 },
			],
		},
		torso: {
			rotate: [
				{ time: 0, value: 0 },
				{ time: 0.45, value: 1.5 },
				{ time: 1.0, value: 1.5 },
				{ time: GLANCE_END, value: 0 },
			],
		},
		hip: {
			translate: [
				{ time: 0, x: 0, y: 0 },
				{ time: 0.5, x: 3 * TOWARD_X, y: -1 },
				{ time: 1.0, x: 3 * TOWARD_X, y: -1 },
				{ time: GLANCE_END, x: 0, y: 0 },
			],
		},
	},
};

// ── THE ACCESSORIES MOVE ON THEIR OWN ─────────────────────────────────────────
//
// Ported from GoBananasBoat's captain (its neckerchief and banana). The rule,
// measured off Hacksaw's cast (wp/.claude/skills/mesh-cast-rig §3): the body
// barely moves and the amplitude goes to what HANGS off it, a beat late. His
// helmet, the banana in his teeth and the tube in his chest pocket used to be
// glued to the head and the torso — whatever the body did, they did, exactly.
//
// They move two ways at once, and no other animation has to know:
//
//   · PHYSICS CONSTRAINTS (Spine 4.2): inertia. When the body moves — the
//     chest beat, the cheer's jump, the throw — they lag, overshoot and settle.
//   · `flutter`, a loop on TRACK 1 (Mascot.svelte), always playing: he chews
//     the banana, so he is never perfectly still even at idle.
//
// Unlike Boat's scarf these are single rigid pieces, each its own PSD layer, so
// they need no mesh: a bone each is enough.
//
// THE HELMET IS STIFF, deliberately. Under it the head is painted only as far
// as the brim (27% of the helmet's area has anything beneath it), so a helmet
// that tipped far would show the flat top of his head. Its physics keeps it to
// a small, late wobble; nothing keys it.
const FLUTTER_LOOP = 4.8;

// EVERY CONSTRAINT NEEDS ITS OWN `order`. Spine builds its update cache by
// walking order 0, 1, 2 ... and placing the ONE constraint whose order matches
// each step — so three constraints all left at the default 0 put the first in
// the cache and silently dropped the other two (inactive, never applied, no
// warning). Measured with spine-core 4.2.74: the helmet and the tube never
// moved until each got an order. (GoBananasBoat's rig, where this came from,
// has the same bug: only its first constraint runs.)
const physics = [
	{ name: 'banana_phys', bone: 'banana', rotate: 1, inertia: 0.5, strength: 110, damping: 0.78, mass: 1 },
	// the mohawk: loose now (it is hair, not GoBoomana's helmet), the tip looser
	// The crest is 200px wide and its bones sit in the middle, so ROTATION
	// physics swung its ends up and down against each other and folded the hair
	// at its upper left (check_neon_spine). It SHEARS instead — the top dragged
	// sideways over a root that stays put, which is what hair in a wind does and
	// cannot fold — and the tip trails by translation.
	{ name: 'helmet_phys', bone: 'helmet', shearX: 1, inertia: 0.3, strength: 230, damping: 0.8, mass: 1 },
	{ name: 'hairTip_phys', bone: 'hairTip', x: 1, inertia: 0.5, strength: 120, damping: 0.78, mass: 1 },
	// the banana ear cups bounce on the neck band
	{ name: 'phoneL_phys', bone: 'phoneL', rotate: 1, inertia: 0.45, strength: 140, damping: 0.8, mass: 1 },
	{ name: 'phoneR_phys', bone: 'phoneR', rotate: 1, inertia: 0.45, strength: 140, damping: 0.8, mass: 1 },
	// the jacket's front panels swing open and shut
	{ name: 'coatL_phys', bone: 'coatL', rotate: 1, inertia: 0.55, strength: 110, damping: 0.8, mass: 1.2 },
	{ name: 'coatR_phys', bone: 'coatR', rotate: 1, inertia: 0.55, strength: 110, damping: 0.8, mass: 1.2 },
	{ name: 'pocket_phys', bone: 'pocket', rotate: 1, inertia: 0.3, strength: 200, damping: 0.82, mass: 1 },
	// THE CLOTHES (see "THE CLOTHES MOVE"): hems loose enough to swing a beat
	// behind the limb, stiff enough that a hem never lifts off the forearm or the
	// knee it covers.
	{ name: 'cuffL_phys', bone: 'cuffL', rotate: 1, inertia: 0.28, strength: 230, damping: 0.82, mass: 1 },
	{ name: 'cuffR_phys', bone: 'cuffR', rotate: 1, inertia: 0.28, strength: 230, damping: 0.82, mass: 1 },
	{ name: 'pantL_phys', bone: 'pantL', rotate: 1, inertia: 0.9, strength: 80, damping: 0.78, mass: 1.2 },
	{ name: 'pantR_phys', bone: 'pantR', rotate: 1, inertia: 0.9, strength: 80, damping: 0.78, mass: 1.2 },
];

// whole cycles of FLUTTER_LOOP only, so it loops without a seam
const flutterKeys = (amp, n, phase, steps = 24) =>
	Array.from({ length: steps + 1 }, (_, i) => {
		const t = (FLUTTER_LOOP * i) / steps;
		return { time: +t.toFixed(4), value: +(amp * Math.sin((2 * Math.PI * n * t) / FLUTTER_LOOP + phase)).toFixed(3) };
	});
// the chew: two quick bites, then a rest, once a loop, with a slow waggle
// between so the banana is never parked
const chew = (() => {
	const keys = [];
	for (let i = 0; i <= 48; i++) {
		const t = (FLUTTER_LOOP * i) / 48;
		const bite = (t0) => {
			const u = (t - t0) / 0.22;
			return u > 0 && u < 1 ? Math.sin(Math.PI * u) : 0;
		};
		// + swings the tip DOWN (the bone points down-left from the mouth)
		keys.push({ time: +t.toFixed(4), value: +(-10 * (bite(0.6) + 0.8 * bite(0.95)) + 3 * Math.sin((2 * Math.PI * 2 * t) / FLUTTER_LOOP)).toFixed(3) });
	}
	return keys;
})();
// the jaw drops on the same two bites (Spine y is up: down is negative)
const jawChew = (() => {
	const keys = [];
	for (let i = 0; i <= 48; i++) {
		const t = (FLUTTER_LOOP * i) / 48;
		const bite = (t0) => {
			const u = (t - t0) / 0.22;
			return u > 0 && u < 1 ? Math.sin(Math.PI * u) : 0;
		};
		keys.push({ time: +t.toFixed(4), x: 0, y: +(-4 * (bite(0.6) + 0.8 * bite(0.95))).toFixed(3) });
	}
	return keys;
})();
const flutter = {
	bones: {
		banana: { rotate: chew },
		jaw: { translate: jawChew },
		// the tube rocks in its pocket, out of step with the chew
		pocket: { rotate: flutterKeys(4, 2, 1.1) },
		// and the cloth drifts, each piece on its own phase so nothing moves in
		// step: the hems a couple of degrees
		cuffL: { rotate: flutterKeys(2, 1, 0.3) },
		cuffR: { rotate: flutterKeys(2, 1, 2.0) },
		pantL: { rotate: flutterKeys(1.5, 1, 3.6) },
		pantR: { rotate: flutterKeys(1.5, 1, 5.1) },
		// Go Bananeon's accessories drift too: the mohawk sways (its tip
		// twice as fast), the ear cups bob, the jacket panels breathe
		helmet: { rotate: flutterKeys(1.2, 1, 0.7) },
		hairTip: { rotate: flutterKeys(3, 2, 1.9) },
		phoneL: { rotate: flutterKeys(3, 1, 0.4) },
		phoneR: { rotate: flutterKeys(3, 1, 2.6) },
		coatL: { rotate: flutterKeys(2, 1, 1.2) },
		coatR: { rotate: flutterKeys(2, 1, 4.0) },
	},
};

// ── BIGGER (Go Bananeon, 2026-10-03) ──────────────────────────────────────
//
// Asked for: "his moves can be bigger". The body's own acting in the loops and
// the small reactions is scaled up about rest: the torso and the head turn and
// travel further, the arms a little further (their art has no raised arm, so
// they stay inside MAX_SHOULDER / MAX_ELBOW). NOT the hip's travel — the legs
// hang from it, and the feet would leave the floor — and NOT the chest beat or
// the throw: Mascot.svelte places the impact stars on the fists and the prop
// leaves the hand at positions measured off those two.
const AMPLIFY = { idle: 1.5, cheer: 1.3, nod: 1.4, alert: 1.35, glance: 1.45, flinch: 1.2 };
const ARM_CAP = { armL: MAX_SHOULDER, armR: MAX_SHOULDER, armL_fore: MAX_ELBOW, armR_fore: MAX_ELBOW };
const amplify = (animation, k) => {
	const armK = 1 + (k - 1) * 0.5;
	for (const [bone, timelines] of Object.entries(animation.bones ?? {})) {
		const body = bone === 'torso' || bone === 'head';
		const arm = bone in ARM_CAP;
		if (!body && !arm) continue;
		for (const key of timelines.rotate ?? []) {
			let v = (key.value ?? 0) * (body ? k : armK);
			// an arm already past its cap (a pose that was authored there) keeps
			// its own value; amplification only stops at the cap
			if (arm) v = Math.max(-Math.max(ARM_CAP[bone], Math.abs(key.value ?? 0)), Math.min(Math.max(ARM_CAP[bone], Math.abs(key.value ?? 0)), v));
			key.value = +v.toFixed(3);
		}
		if (!body) continue;
		for (const key of timelines.translate ?? []) {
			key.x = +((key.x ?? 0) * k).toFixed(3);
			key.y = +((key.y ?? 0) * k).toFixed(3);
		}
		for (const key of timelines.scale ?? []) {
			key.x = +(1 + ((key.x ?? 1) - 1) * k).toFixed(4);
			key.y = +(1 + ((key.y ?? 1) - 1) * k).toFixed(4);
		}
	}
	return animation;
};
for (const [name, k] of Object.entries(AMPLIFY)) amplify({ idle, cheer, nod, alert, glance, flinch }[name], k);

const skeleton = {
	skeleton: {
		hash: 'gb-monkey',
		spine: '4.1.20',
		// The whole character measured from the origin between the feet.
		x: -ROOT.x,
		y: 0,
		width: meta.canvas[0],
		height: ROOT.y,
		images: './',
	},
	bones,
	slots,
	physics: physics.map((c, order) => ({ ...c, order })),
	skins: [{ name: 'default', attachments }],
	animations: Object.fromEntries(
			Object.entries({ idle, cheer, chestbeat, nod, throwit, flinch, alert, glance, flutter, ...sweeps }).map(([name, a]) => [
				name,
				// idle and flutter are the loops, so theirs are the ends that meet
				smoothAnimation(fuseDeadJoints(a, name), name === 'idle' ? IDLE_LOOP : name === 'flutter' ? FLUTTER_LOOP : undefined),
			]),
		),
};

fs.writeFileSync(path.join(OUT, 'monkey.json'), JSON.stringify(skeleton, null, 2) + '\n');

// The hand's position at RELEASE_AT, in skeleton units. TransitionAnimation
// spawns the dynamite here, so it is printed rather than left to be guessed at.
{
	// FORWARD KINEMATICS, read out of the generated animation.
	//
	// Two things outside the skeleton need to know where a hand IS at a given
	// moment: the transition spawns the dynamite at the release, and the comic
	// impacts in Mascot.svelte are drawn where the fists land. Both used to be
	// hard-coded numbers, and both silently stopped being true the moment the rig
	// changed — the release kept printing a stale figure, and the impacts were a
	// guess at a pose that no longer existed.
	//
	// So the point is walked up the bone chain, applying each ancestor's rotation
	// and translation at that instant, exactly as Spine will.
	const parentOf = Object.fromEntries(RIG.map((b) => [b.name, b.parent]));
	const worldAt = (boneName, anim, t) => {
		const chain = [];
		for (let b = boneName; b && b !== 'root'; b = parentOf[b]) chain.push(b);
		let pt = jointWorld[boneName];
		// From the bone outward: each ancestor rotates everything below it about
		// its own joint, and translates it.
		for (const b of chain) {
			const track = anim.bones?.[b];
			if (!track) continue;
			const about = jointWorld[b];
			const deg = evalTrack(track.rotate, t);
			if (deg) {
				const r = (deg * Math.PI) / 180;
				const dx = pt.x - about.x;
				const dy = pt.y - about.y;
				pt = {
					x: about.x + dx * Math.cos(r) - dy * Math.sin(r),
					y: about.y + dx * Math.sin(r) + dy * Math.cos(r),
				};
			}
			if (track.translate?.length) {
				const keys = track.translate;
				pt = {
					x: pt.x + evalTrack(keys.map((k) => ({ time: k.time, value: k.x })), t),
					y: pt.y + evalTrack(keys.map((k) => ({ time: k.time, value: k.y })), t),
				};
			}
		}
		return pt;
	};

	const at = (p) => `(${p.x.toFixed(0)}, ${p.y.toFixed(0)})`;
	console.log(`release  hand at ${at(worldAt('armL_hand', skeleton.animations.throwit, RELEASE_AT))} at t=${RELEASE_AT}`);
	// Where each fist is at the top of its own strike, for the impact art.
	const beatAnim = skeleton.animations.chestbeat;
	// armR_hand and armL_hand are the WRISTS. armR_fore is the elbow, which is
	// most of an arm away from where a strike lands.
	console.log(`beat     R fist at ${at(worldAt('armR_hand', beatAnim, beats[0]))} at t=${beats[0].toFixed(2)}`);
	console.log(`         L fist at ${at(worldAt('armL_hand', beatAnim, beats[1]))} at t=${beats[1].toFixed(2)}`);
}

console.log(`atlas   monkey.png ${PAGE_W}x${PAGE_H}, ${placed.length} regions`);
console.log(`skeleton monkey.json ${bones.length} bones, ${slots.length} slots`);
console.log('out', path.relative(appRoot, OUT));
