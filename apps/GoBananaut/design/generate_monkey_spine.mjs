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
const SRC = path.join(appRoot, 'design/source/monkey');
const OUT = path.join(appRoot, 'static/assets/spines/goBananasMonkey');
fs.mkdirSync(OUT, { recursive: true });

// One image that is not a body part: the oxygen canister he throws. Packed into
// this atlas rather than referenced from the symbol set, because a Spine skin can
// only draw regions from its own atlas.
//
// The slot is named `prop` and the animation asks for `prop`. What he throws
// changes with the theme, and when the slot was named after the object the rename
// had to be chased through the skeleton, the animation and the component; the
// machinery is themeless now and only the file is not.
const PROPS = [
	{
		name: 'prop',
		file: path.join(appRoot, 'static/assets/sprites/goBananasSymbolsV3/canister.png'),
		bone: 'prop',
		// skeleton units — about a fifth of his height, which is a canister in a
		// gorilla's fist rather than a barrel.
		//
		// Drawn square: held in a fist a cylinder is mostly foreshortened, and the
		// release only lasts a few frames.
		size: 168,
	},
];

// PIECES THAT NEED A FRONT-DRAWING COPY.
//
// The artist drew this character with a front arm and a back arm: the left arm's
// layers sit above the trunk in the PSD's stacking (z 14-15 against the trunk's
// 9), the right arm's sit below it (z 7-8). In the rest pose that is exactly
// right and it is what gives the pose its depth.
//
// It also means the right fist CANNOT come to the front, at any angle. The chest
// beat was swinging it a full 26 degrees inward and it was sliding behind the
// chest the whole way — which is what "doesn't punch to the front" was. No
// change to the rotation could have fixed it.
//
// So each of these pieces gets a second slot at the very end of the draw order,
// showing the same atlas region, with nothing attached in the setup pose. An
// animation that needs the arm in front hides the original and shows the copy;
// everything else is untouched and keeps the artist's depth. Same mechanism the
// canister already uses, which is why there is no new machinery here.
const frontName = (name) => `${name}_front`;

const meta = JSON.parse(fs.readFileSync(path.join(SRC, 'layers.json'), 'utf8'));
const byName = Object.fromEntries(meta.layers.map((l) => [l.name, l]));
const piece = (name) => {
	const l = byName[name];
	if (!l) {
		console.error(`missing piece: ${name} — re-run design/extract_monkey_psd.py`);
		process.exit(1);
	}
	return l;
};

// How many pixels a piece actually contains. Bounding-box area is not a stand-in
// for it: `head_3_eye` arrives as a 214x159 box holding two specks at opposite
// corners, and by area it beats the goggles it is competing with.
const opaqueArea = (l) => {
	const img = PNG.sync.read(fs.readFileSync(path.join(SRC, l.file)));
	let n = 0;
	for (let i = 3; i < img.data.length; i += 4) if (img.data[i] > 40) n += 1;
	return n;
};
const biggest = (re) => {
	const found = meta.layers.filter((l) => re.test(l.name));
	if (!found.length) return null;
	return found.map((l) => [l, opaqueArea(l)]).sort((a, b) => b[1] - a[1])[0][0];
};

//
// DERIVED, because whether it is needed at all depends on the delivery. In the
// PSD this was written for the right arm sat below the trunk and could not be
// brought forward at any angle. In the one after it BOTH arms are stacked above
// the trunk and the copies would be two slots that never do anything. So the
// arm's own z is compared against the torso's, and the copies exist only when
// the arm is genuinely behind.
const FRONT_COPIES = (() => {
	// Against the BIGGEST torso piece, not the highest-stacked one. The torso
	// group includes a shoulder badge and a chest pocket sitting above everything;
	// measured against those the arm is "behind" the torso while being plainly in
	// front of the jacket, which is the thing it actually has to clear.
	const trunk = biggest(/^torso_/);
	const torsoZ = trunk ? trunk.z : -1;
	const behind = meta.layers
		.filter((l) => /^right_arm_(1|2)/.test(l.name) && l.z < torsoZ)
		.map((l) => l.name);
	console.log(
		behind.length
			? `front copies  ${behind.join(', ')} (right arm draws behind the torso)`
			: 'front copies  none needed (both arms draw in front of the torso)',
	);
	return behind;
})();

// Skeleton origin on the PSD canvas: centred between the boots, on the ground.
//
// DERIVED, like the joints, and for the same reason. It was two typed numbers and
// they were silently wrong the moment a PSD arrived with a different canvas: this
// one is 560x928 where the last was 560x912, and the boots sit lower in it. A root
// left above the soles floats the whole character, and because Mascot.svelte
// positions him by his FEET the error surfaces as him standing in the bet bar
// rather than as anything that looks like a bad number.
const feetBox = (name) => {
	const l = piece(name);
	return { cx: l.x + l.w / 2, bottom: l.y + l.h };
};
const ROOT = (() => {
	const a = feetBox('left_leg_2_foot');
	const b = feetBox('right_leg_2_foot');
	return { x: Math.round((a.cx + b.cx) / 2), y: Math.max(a.bottom, b.bottom) };
})();
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
	const l = piece(pieceName);
	return [Math.round(l.x + l.w / 2), Math.round(l.y + JOINT_INSET)];
};

// A SHOULDER IS NOT AT THE MIDDLE OF THE SLEEVE.
//
// Top-CENTRE is right for a knee or an elbow, where the piece hangs straight
// down from a joint on its own centreline. It is wrong for a shoulder, and the
// difference is what kept the right sleeve tearing off the jacket.
//
// Rotating a sleeve about its own horizontal centre swings the half INBOARD of
// that pivot the opposite way to the half outboard of it. The elbow goes where
// the animation asked, and the sleeve's top corner rises out through the
// jacket's shoulder line as a pale lobe — visible at 20 degrees, which is why
// the measured "budget" for this arm kept coming out so small. It was not the
// drawing's limit, it was the pivot's.
//
// A real shoulder is where the arm meets the BODY: the top-INNER corner of the
// sleeve, inner meaning toward the midline. Anchored there the whole sleeve
// sweeps around the point it is attached at, which is what a shoulder does, and
// nothing lifts.
//
// The rest pose does not move: an attachment is placed relative to its bone, so
// changing where the bone sits changes only how rotation behaves.
const shoulderOf = (pieceName, midlineX) => {
	const l = piece(pieceName);
	const inner = l.x + l.w / 2 < midlineX ? l.x + l.w - JOINT_INSET : l.x + JOINT_INSET;
	return [Math.round(inner), Math.round(l.y + JOINT_INSET)];
};

// The three joints with no distal piece of their own. They were typed numbers and
// are read off the artwork now too, because "inside the torso mass" still has
// landmarks:
//
//   · the MIDLINE is halfway between the two THIGHS. It used to be the belt
//     piece's centre, which was right until a delivery arrived with no layer
//     called a belt — `torso_4_belt` became `torso_1_belt` holding 394 pixels of
//     speck, and the whole generator stopped dead. The thighs are a pair, they
//     straddle the spine by construction, and `*_leg_0` is the part of the naming
//     that has held across four deliveries.
//   · the HIP is where the thighs pivot — the mean of their two top edges, taken
//     into the pelvis by the same kind of inset a limb joint uses.
//   · the NECK is the bottom of the head's MAIN MASS. Not `head_0_face` and not
//     `head_1_hat`: this delivery has no helmet at all (the character was
//     redrawn without one) and the head group is a face, a pair of goggles, two
//     specks and a banana. The biggest piece in the group is the head, whatever
//     it is called, and the banana hanging 24 units below it is exactly why the
//     group's bounding box will not do.
const thighL = () => piece(THIGH.left);
const thighR = () => piece(THIGH.right);
const midline = () =>
	Math.round((thighL().x + thighL().w / 2 + thighR().x + thighR().w / 2) / 2);
const hipY = () => Math.round((thighL().y + thighR().y) / 2 + 20);
const neckAt = () => {
	const head = biggest(/^head_/);
	if (!head) {
		console.error('no head_* pieces — check layers.json');
		process.exit(1);
	}
	return [Math.round(head.x + head.w / 2), head.y + head.h - 10];
};

// A FIST IS NOT A BOUNDING-BOX CENTRE. The pieces that carry a fist run from the
// elbow down, so their centre is halfway up the forearm; a hand bone placed there
// puts every comic impact and every thrown prop half a limb away from the hand.
// Taken as the alpha centroid of the piece's bottom quarter, which is the fist and
// nothing else.
const fistOf = (name) => {
	const l = piece(name);
	const img = PNG.sync.read(fs.readFileSync(path.join(SRC, l.file)));
	let sx = 0;
	let sy = 0;
	let n = 0;
	for (let y = Math.floor(l.h * 0.75); y < l.h; y++)
		for (let x = 0; x < l.w; x++)
			if (img.data[(y * img.width + x) * 4 + 3] > 60) {
				sx += x;
				sy += y;
				n += 1;
			}
	if (!n) return [Math.round(l.x + l.w / 2), l.y + l.h - 20];
	return [Math.round(l.x + sx / n), Math.round(l.y + sy / n)];
};

// WHICH PIECES HANG BELOW THE ELBOW, decided by where they are and not by what
// they are called.
//
// `_1_forearm` is a forearm on the LEFT arm and is not one on the RIGHT. Same
// PSD, same delivery, same name:
//
//     right_arm_0_upper_arm   y 203..392      right_arm_1_forearm  y 204..415
//     left_arm_0_upper_arm    y 210..404      left_arm_1_forearm   y 352..602
//
// The right one starts at the SAME height as its own sleeve — it is a second
// layer over the upper arm, a highlight or a shoulder panel. The left one starts
// 140 units lower and is a real forearm.
//
// Matching the elbow bone with /^right_arm_(1|2)/ therefore hung a piece of the
// SHOULDER off the ELBOW. Rotating the elbow swung it out from behind the
// sleeve, and because its outward face carries no ink outline it appeared as a
// smooth pale wedge beside the shoulder. That is the "shoulder sticking out"
// that survived two rounds of reducing the shoulder angle — the angle was never
// the cause, and lowering it further would only have made the wedge smaller.
//
// A piece is below the elbow if its top edge is well below the sleeve's top:
// 40% of the sleeve's own height is far enough down to exclude anything painted
// over the shoulder and far enough up to catch a forearm.
const armParts = (side) => {
	const all = meta.layers.filter((l) => new RegExp('^' + side + '_arm_').test(l.name));
	const sleeve = all.find((l) => new RegExp('^' + side + '_arm_0').test(l.name));
	if (!sleeve) {
		console.error('no sleeve piece for the ' + side + ' arm — check layers.json');
		process.exit(1);
	}
	const cut = sleeve.y + sleeve.h * 0.4;
	const below = all.filter((l) => l !== sleeve && l.y > cut).sort((a, b) => a.y - b.y);
	if (!below.length) {
		console.error('nothing hangs below the ' + side + ' elbow — check layers.json');
		process.exit(1);
	}
	return {
		upper: all.filter((l) => !below.includes(l)).map((l) => l.name),
		fore: below.map((l) => l.name),
		// the elbow is the top of the highest piece that hangs below it
		elbow: below[0].name,
		// the fist is in whichever piece reaches lowest
		fist: [...all].sort((a, b) => b.y + b.h - (a.y + a.h))[0].name,
	};
};
const ARM = { left: armParts('left'), right: armParts('right') };
const ELBOW_PIECE = { left: ARM.left.elbow, right: ARM.right.elbow };
// An exact-name alternation, so a bone claims the pieces this decided and not
// everything that happens to share a prefix.
const exactly = (names) => new RegExp('^(' + names.join('|') + ')$');
for (const side of ['left', 'right']) {
	console.log(
		`${side} arm    shoulder: ${ARM[side].upper.join(', ')}` +
			`   elbow: ${ARM[side].fore.join(', ')}`,
	);
}
// The thigh on each side, by prefix rather than by full name.
const thighOf = (side) => {
	const found = meta.layers.filter((l) => new RegExp('^' + side + '_leg_0').test(l.name));
	if (!found.length) {
		console.error('no ' + side + ' thigh piece — check layers.json');
		process.exit(1);
	}
	return found[0].name;
};
const THIGH = { left: thighOf('left'), right: thighOf('right') };
console.log(`elbow pieces  L=${ELBOW_PIECE.left}  R=${ELBOW_PIECE.right}`);
console.log(`thighs        L=${THIGH.left}  R=${THIGH.right}`);

const RIG = [
	// See above: derived, not typed.
	{ name: 'hip', parent: 'root', at: [midline(), hipY()], match: null },
	{ name: 'torso', parent: 'hip', at: [midline(), hipY() - 28], match: /^torso_/ },
	// The neck, just under the jaw: the head nods and turns about this.
	{ name: 'head', parent: 'torso', at: neckAt(), match: /^head_/ },

	// ARMS. `_0_upper_arm` is the suit sleeve and is correctly named on both sides.
	//
	// BELOW THE SLEEVE THE TWO SIDES ARE NOT DRAWN THE SAME, and the layer names do
	// not say so. This PSD gives the right arm a `_1_forearm` AND a `_2_hand` whose
	// boxes overlap from mid-forearm down, and the left arm only a `_1_forearm`
	// that runs the whole way from elbow to knuckles. So neither name means the
	// same thing on the two sides, and the elbow is read off whichever piece
	// actually reaches LOWEST on that arm instead of off a fixed name. That is the
	// one thing here to look at when a new PSD lands, so the generator prints it.
	//
	// Either way the wrist is a dead joint — nothing behind it can bend — so it is
	// fused. Its keys are not thrown away: `fuse` moves them to the elbow, scaled
	// by the lever-arm ratio, so an animation asking for a wrist flick still gets
	// one out of the forearm instead of the arm going rigid. Unscaled, an animation
	// asking for 29 degrees produced 54 and threw the fist past the far side of the
	// body.
	{
		name: 'armL',
		parent: 'torso',
		at: shoulderOf('left_arm_0_upper_arm', midline()),
		match: exactly(ARM.left.upper),
	},
	{ name: 'armL_fore', parent: 'armL', at: jointOf(ELBOW_PIECE.left), match: exactly(ARM.left.fore) },
	{
		name: 'armL_hand',
		parent: 'armL_fore',
		at: fistOf(ARM.left.fist),
		match: null,
		fuse: 'armL_fore',
	},
	// Carries the thrown prop, so it follows the hand exactly rather than being
	// chased by something outside the skeleton trying to guess where the hand is.
	{ name: 'prop', parent: 'armL_hand', at: fistOf(ARM.left.fist), match: null },

	{
		name: 'armR',
		parent: 'torso',
		at: shoulderOf('right_arm_0_upper_arm', midline()),
		match: exactly(ARM.right.upper),
	},
	{ name: 'armR_fore', parent: 'armR', at: jointOf(ELBOW_PIECE.right), match: exactly(ARM.right.fore) },
	{
		name: 'armR_hand',
		parent: 'armR_fore',
		at: fistOf(ARM.right.fist),
		match: null,
		fuse: 'armR_fore',
	},

	{ name: 'legL', parent: 'hip', at: jointOf(THIGH.left), match: /^left_leg_0/ },
	{ name: 'legL_calf', parent: 'legL', at: jointOf('left_leg_1_calf'), match: /^left_leg_1/ },
	{ name: 'legL_foot', parent: 'legL_calf', at: jointOf('left_leg_2_foot'), match: /^left_leg_2/ },

	{ name: 'legR', parent: 'hip', at: jointOf(THIGH.right), match: /^right_leg_0/ },
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

const bones = [{ name: 'root' }];
for (const b of RIG) {
	const w = jointWorld[b.name];
	const p = jointWorld[b.parent];
	bones.push({ name: b.name, parent: b.parent, x: +(w.x - p.x).toFixed(2), y: +(w.y - p.y).toFixed(2) });
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
	attachments[l.name] = {
		[l.name]: {
			x: +(centre.x - j.x).toFixed(2),
			y: +(centre.y - j.y).toFixed(2),
			width: l.w,
			height: l.h,
		},
	};
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

// ── WEIGHTED SLEEVES ────────────────────────────────────────────────────────
//
// The shoulder budget (MAX_SHOULDER_L / _R) was set by one failure: each suit
// sleeve is a RIGID plate hung on its arm bone, so past ~27-32 degrees the whole
// plate swings about the joint — its rounded cap rises above the shoulder line,
// and a dark gap opens at the armpit (render_monkey_runtime.mjs on the --sweep
// build shows it on both sides). Nothing in the keys could fix it; the piece
// could not bend.
//
// So the sleeves are weighted MESHES now — the one-image-one-mesh method of the
// symbol wins, inside Spine, as Go Bananubis did for its mascot's trunk: within
// SLEEVE_HOLD px of the shoulder joint a sleeve stays on the TORSO, and over the
// next SLEEVE_BLEND px it hands over to the arm. The cap stays seated on the
// shoulder and the sleeve bends below it.
//
// Spine stores a weighted vertex once per influencing bone, in that bone's
// setup space. Every bone in this rig is unrotated and unscaled in setup, so
// that is the vertex's world position minus the bone's.
const SLEEVE_HOLD = 18;
const SLEEVE_BLEND = 70;
const smoothW = (v) => {
	const t = Math.max(0, Math.min(1, v));
	return t * t * (3 - 2 * t);
};
// bones added below (the banana, the hose) are ROTATED along their piece, for
// the physics; the body's are not. A weighted vertex is stored in its bone's
// own setup frame, so a rotated bone needs its offset turned back.
const extraWorld = {};
// A mesh on explicit grid lines (PSD x's and y's, both edges of the piece
// included), so a piece can be fine where something small bends — a pen, a
// test tube — and coarse over the rest of a big, mostly empty layer.
const meshGrid = (layer, xs, ys, weightsAt) => {
	const cols = xs.length - 1, rows = ys.length - 1;
	// the hull (the outer ring, in order) first, as Spine expects, then the interior
	const at = (c, r) => [xs[c], ys[r]];
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
		uvs.push(+((xs[c] - layer.x) / layer.w).toFixed(5), +((ys[r] - layer.y) / layer.h).toFixed(5));
		const entries = Object.entries(weightsAt(x, y)).filter(([, v]) => v > 1e-4);
		const total = entries.reduce((a, [, v]) => a + v, 0);
		const world = toSpine(x, y);
		vertices.push(entries.length);
		for (const [bone, v] of entries) {
			const j = extraWorld[bone] ?? { ...jointWorld[bone], rot: 0 };
			const r = (-j.rot * Math.PI) / 180;
			const dx = world.x - j.x, dy = world.y - j.y;
			const lx = dx * Math.cos(r) - dy * Math.sin(r);
			const ly = dx * Math.sin(r) + dy * Math.cos(r);
			vertices.push(bones.findIndex((b) => b.name === bone), +lx.toFixed(2), +ly.toFixed(2), +(v / total).toFixed(4));
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
const meshAttachment = (layer, cols, rows, weightsAt) =>
	meshGrid(
		layer,
		Array.from({ length: cols + 1 }, (_, c) => layer.x + (layer.w * c) / cols),
		Array.from({ length: rows + 1 }, (_, r) => layer.y + (layer.h * r) / rows),
		weightsAt,
	);
// grid lines from `from` to `to` every `step`, plus finer ones over [a, b]
const gridLines = (from, to, step, dense = []) => {
	const set = new Set([from, to]);
	for (let v = from; v < to; v += step) set.add(+v.toFixed(2));
	for (const [a, b, st] of dense) for (let v = Math.max(from, a); v <= Math.min(to, b); v += st) set.add(+v.toFixed(2));
	return [...set].sort((p, q) => p - q);
};
// every suit-sleeve piece on a shoulder bone: the two `_0_upper_arm`s, and the
// right arm's second sleeve layer (`right_arm_1_forearm` — see ARM above: on
// this PSD it is a sleeve, and it rides armR)
// RIGID_SLEEVES=1 builds the old rigid plates, for before/after renders
const SLEEVES = process.env.RIGID_SLEEVES ? [] : meta.layers.filter((l) => /^arm[LR]$/.test(boneOf[l.name] ?? '') && /_arm_[01]_/.test(l.name));
for (const layer of SLEEVES) {
	const bone = boneOf[layer.name];
	const joint = RIG.find((b) => b.name === bone).at;
	attachments[layer.name][layer.name] = meshAttachment(layer, 8, 10, (x, y) => {
		const arm = smoothW((Math.hypot(x - joint[0], y - joint[1]) - SLEEVE_HOLD) / SLEEVE_BLEND);
		return { torso: 1 - arm, [bone]: arm };
	});
	console.log(`mesh    ${layer.name}: sleeve on torso within ${SLEEVE_HOLD}px of ${bone}, blending over ${SLEEVE_BLEND}`);
}

// ── WHAT HANGS OFF HIM: the banana and the backpack hose ────────────────────
//
// Asked for 2026-09-26: the pieces that hang off him drifting on their own,
// "so floating in the feature feels like space". The same set-up as Go
// Bananubis' banana, ears and kilt (and Go Bananas Boat's captain before it):
//
//   · a BONE along each piece, and the piece a weighted MESH on it
//   · PHYSICS CONSTRAINTS (Spine 4.2): inertia, so when the body moves they
//     lag, overshoot and settle on their own, with no keys at all
//   · `flutter` on TRACK 1 (Mascot.svelte), forever, keying only those bones:
//     the banana chewed now and then, the hose drifting — so he is never quite
//     still whatever track 0 plays. `flutter_float` is the same, bigger and
//     slower, for the free spins, where he floats in zero-g.
//
// The goggles stay put: the feature tease draws its glow at their REST place
// (Mascot.svelte GOGGLE), and goggles that drift would leave it behind.
//
// Coordinates are PSD pixels, measured off the pieces' own ink.
const MOUTH = [288, 217], BANANA_TIP = [212, 297];
// the hose is a C-shaped loop on the backpack's left, fastened at BOTH ends
// (PSD ink 51..110 x 161..297): it cannot swing from one end, so its bone runs
// from the top fastening out to the belly of the curve, and the weight rises
// toward the middle and falls away again at the bottom fastening — it bulges
const HOSE_TOP = [98, 166], HOSE_BELLY = [54, 232], HOSE_Y = [161, 297], HOSE_MAX_X = 118;

const addBone = (name, parent, from, to) => {
	const a = toSpine(from[0], from[1]);
	const b = toSpine(to[0], to[1]);
	const rot = (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI;
	// the parent may itself be one of these added (rotated) bones — the chest,
	// under which the pens hang: then the offset goes into ITS frame, and the
	// rotation is relative to its own
	const p = extraWorld[parent] ?? { ...jointWorld[parent], rot: 0 };
	const pr = (-p.rot * Math.PI) / 180;
	const dx = a.x - p.x, dy = a.y - p.y;
	bones.push({
		name,
		parent,
		x: +(dx * Math.cos(pr) - dy * Math.sin(pr)).toFixed(2),
		y: +(dx * Math.sin(pr) + dy * Math.cos(pr)).toFixed(2),
		rotation: +(rot - p.rot).toFixed(2),
		length: +Math.hypot(b.x - a.x, b.y - a.y).toFixed(2),
	});
	extraWorld[name] = { x: a.x, y: a.y, rot };
};
addBone('banana', 'head', MOUTH, BANANA_TIP);
addBone('hose', 'torso', HOSE_TOP, HOSE_BELLY);
// how far along a line a point is, 0 at `from`, 1 at `to`
const alongLine = (p, from, to) => {
	const dx = to[0] - from[0], dy = to[1] - from[1];
	return ((p[0] - from[0]) * dx + (p[1] - from[1]) * dy) / (dx * dx + dy * dy);
};
{
	const banana = meta.layers.find((l) => l.name === 'head_5_decoration');
	const hose = meta.layers.find((l) => l.name === 'torso_2_decoration');
	if (!banana || !hose) {
		console.error('banana or hose piece missing: the hanging bones need head_5_decoration and torso_2_decoration');
		process.exit(1);
	}
	// held at the mouth, free toward its tip
	attachments[banana.name][banana.name] = meshAttachment(banana, 8, 8, (x, y) => {
		const b = smoothW((alongLine([x, y], MOUTH, BANANA_TIP) - 0.08) / 0.35);
		return { head: 1 - b, banana: b };
	});
	// the hose's middle on its bone, both fastenings and everything else in the
	// piece (the pens, the badge, the vial) on the torso
	attachments[hose.name][hose.name] = meshAttachment(hose, 10, 14, (x, y) => {
		const t = Math.max(0, Math.min(1, (y - HOSE_Y[0]) / (HOSE_Y[1] - HOSE_Y[0])));
		const onHose = smoothW((HOSE_MAX_X - x) / 14);
		const h = onHose * Math.sin(Math.PI * t) ** 1.5;
		return { torso: 1 - h, hose: h };
	});
	console.log('hanging banana (head_5_decoration) and hose (torso_2_decoration): bones, meshes, physics');
}

// ── THE SUIT'S LOOSE BITS (asked for 2026-09-27: "衣服配件用網格法做動態") ─────
//
// Everything small on the suit was welded to the torso. Now, like the banana and
// the hose, each loose piece has a bone and a PHYSICS constraint, so it answers
// the body with no keys at all:
//
//   PENS     the three in the chest holder (torso_5): each tilts about the
//            holder's top edge, springy
//   TUBES    the test tubes in the chest rack — two in torso_4, a standing pair
//            in torso_5: each rocks about its own base, stiff and quick, so a
//            jolt makes them RATTLE rather than swing
//   CROTCH   the lower part of torso_0 follows the thighs a little (a weighted
//            mesh), so the suit moves with a lifted leg instead of staying
//            printed on the hips
//
// THE PENS AND TUBES ARE CUT OUT, NOT WEIGHTED. The first version weighted them
// inside their layer's mesh, and a rigid object in a continuous mesh has to
// shear the 2-3px between it and its neighbours: check_monkey_rig failed every
// animation on exactly those seams. So the generator cuts each one out of its
// layer into its own small image (design/source/monkey_fx/cut_*.png), erases it
// from the layer's copy, and hangs it on its bone as a RIGID region — nothing
// deforms at all. A pen is drawn BEHIND its holder, and its cut runs down into
// the holder, so its foot tucks under the band as it tilts.
//
// torso_0 is the "shorts" layer, but what shows of it is the belt and the crotch
// panel: its leg hems are under the thighs (nothing of it is visible below y
// 580), and the belt has no hanging tab — so there is no hem or strap to flap.
//
// Coordinates are PSD pixels, measured off the pieces' own ink
// (2026-09-27, per-row alpha runs of torso_4 / torso_5 / torso_3).
const PEN_PIVOT = 334; // on the holder band's top edge
const PEN_FOOT = 348; // the cut runs this far down, under the band
const PENS = [
	{ name: 'pen1', x: 393, tip: 298, half: 8 },
	{ name: 'pen2', x: 414.5, tip: 298, half: 8 },
	{ name: 'pen3', x: 435, tip: 303, half: 8 },
];
// THE TEST TUBES DO NOT MOVE (taken out 2026-09-28, from the user's capture:
// "藥水罐看起來有問題"). Each vial on the chest is TWO drawings stacked: the
// glass and cap on torso_4 / torso_5, and its liquid in the window on the chest
// panel (torso_3_trunk) underneath. Rocking the glass tore it off its own liquid
// and left the panel's copy showing through — a broken vial. They stay painted;
// the windows' glow (the SPARKLE) is what lights them up now. The list is kept,
// empty, so the rig reads the same if a later PSD draws them whole.
const TUBES = [];
const CROTCH_FROM = 515;
const CROTCH_LEG = 0.45; // at most this much of a vertex follows its thigh

// THE CHEST (2026-10-02): the suit BREATHES in zero-g — a `chest` bone whose
// scale swells the front of the suit (see THE SUIT BREATHES below), and the
// pens hang from it so they ride the swell with the holder they sit in.
const CHEST = { at: [300, 330], r: 150, fade: 70 };
addBone('chest', 'torso', CHEST.at, [CHEST.at[0], CHEST.at[1] - 60]);
for (const pen of PENS) addBone(pen.name, 'chest', [pen.x, PEN_PIVOT], [pen.x, pen.tip]);
for (const t of TUBES) addBone(t.name, 'torso', [(t.x0 + t.x1) / 2, t.base], [(t.x0 + t.x1) / 2, t.top]);
{
	const t0 = meta.layers.find((l) => l.name === 'torso_0_decoration');
	if (!t0) {
		console.error('suit piece torso_0_decoration missing');
		process.exit(1);
	}
	const legL = RIG.find((b) => b.name === 'legL').at, legR = RIG.find((b) => b.name === 'legR').at;
	const mid = (legL[0] + legR[0]) / 2;
	attachments[t0.name][t0.name] = meshGrid(
		t0,
		gridLines(t0.x, t0.x + t0.w, 48, [[150, 434, 14]]),
		gridLines(t0.y, t0.y + t0.h, 48, [[500, 612, 12]]),
		(x, y) => {
			const leg = CROTCH_LEG * smoothW((y - CROTCH_FROM) / 45);
			const l = leg * smoothW((mid + 14 - x) / 28);
			const r = leg * smoothW((x - (mid - 14)) / 28);
			return { torso: 1 - l - r, legL: l, legR: r };
		},
	);
	console.log(`mesh    ${t0.name}: ${attachments[t0.name][t0.name].uvs.length / 2} vertices (the crotch follows the thighs)`);
}

// ── THE FACE (asked for 2026-09-28: "人物的臉用網格法") ──────────────────────────
//
// head_0_face was one rigid plate: everything on him moved except his face. It
// is a weighted mesh now, on five small bones under `head`:
//
//   jaw      the lower lip and chin; it CHEWS on track 1, on the same beats the
//            banana is chewed on (flutter / flutter_float), so the banana is no
//            longer bobbing about in a still mouth
//   brow     the forehead above the goggles: up on a cheer, down before the
//            chest beat and on the effort of a throw
//   nose     the nostrils flare (a scale across) before the roar and on the push
//   cheekL/R puff out (a translate apart) on the push, the throw and the tuck
//
// THE GOGGLES DO NOT MOVE. They are their own layers (head_1_eye / head_3_eye),
// and Mascot.svelte pins the tease glow to their rest place. Everything that
// moves is above or below them; the brow's weight is gone by their top edge.
//
// The jaw is on track 1 ONLY: track 1 is applied after track 0, so a jaw key in
// a reaction would be overwritten by the chewing anyway. The reactions own the
// brow, the nose and the cheeks, which track 1 never keys.
//
// Every blend is 18px or more (mesh-cast-rig: "joint blends need length").
// PSD pixels, off the face layer's own ink (2026-09-28).
const FACE = {
	jawHinge: [315, 176],
	mouthLine: 206, // the jaw's weight starts here and is whole by +26
	chin: [240, 392], // x span of the jaw, fading 22px at each side
	// bell between the crown's fur (above y ~48, the hair bone's) and the goggles
	brow: { y0: 48, y1: 104, x: [214, 396] },
	nose: [307, 176],
	noseR: 38,
	cheekL: [256, 204],
	cheekR: [362, 204],
	cheekR_: 28,
};
addBone('jaw', 'head', FACE.jawHinge, [FACE.jawHinge[0], 280]);
addBone('brow', 'head', [305, 70], [305, 40]);
addBone('nose', 'head', FACE.nose, [FACE.nose[0] + 30, FACE.nose[1]]);
addBone('cheekL', 'head', FACE.cheekL, [FACE.cheekL[0] - 20, FACE.cheekL[1]]);
addBone('cheekR', 'head', FACE.cheekR, [FACE.cheekR[0] + 20, FACE.cheekR[1]]);

// THE CROWN'S FUR AND THE EAR (2026-09-28): the two things on his head that
// hang loose, so — mesh-cast-rig's rule — the ones that get the life. Each a
// bone with PHYSICS, so a jump or a landing flicks them late, and a keyed drift
// on track 1 (wider and slower in the float). The fur is the band under the
// head's top outline (measured per column below); it turns about the middle of
// the head, so the tuft sways and the skull under it does not. The ear
// (head_4_ear, its own layer, root on its right where it meets the head) turns
// about its root.
const CROWN_TOP = [[200, 123], [215, 84], [230, 56], [245, 39], [260, 26], [275, 26], [290, 21], [305, 19], [320, 21], [335, 26], [350, 35], [365, 47], [380, 67], [395, 175]];
const crownTopAt = (x) => {
	if (x <= CROWN_TOP[0][0]) return CROWN_TOP[0][1];
	for (let i = 1; i < CROWN_TOP.length; i++) {
		const [x1, y1] = CROWN_TOP[i];
		if (x <= x1) {
			const [x0, y0] = CROWN_TOP[i - 1];
			return y0 + ((y1 - y0) * (x - x0)) / (x1 - x0);
		}
	}
	return CROWN_TOP[CROWN_TOP.length - 1][1];
};
const FUR_DEPTH = 30;
const EAR_ROOT = [258, 128], EAR_TIP = [220, 102];
addBone('hair', 'head', [305, 112], [305, 19]);
addBone('ear', 'head', EAR_ROOT, EAR_TIP);
{
	const face = meta.layers.find((l) => l.name === 'head_0_face');
	if (!face) {
		console.error('head_0_face missing');
		process.exit(1);
	}
	const radial = (x, y, c, r, soft) => smoothW((r - Math.hypot(x - c[0], (y - c[1]) * 1.1)) / soft);
	attachments[face.name][face.name] = meshGrid(
		face,
		gridLines(face.x, face.x + face.w, 24, [[212, 400, 9]]),
		gridLines(face.y, face.y + face.h, 24, [[22, 290, 9]]),
		(x, y) => {
			const out = { head: 1 };
			const take = (bone, w) => {
				const t = Math.min(Math.max(0, w), out.head);
				if (t > 0) {
					out[bone] = t;
					out.head -= t;
				}
			};
			take('nose', radial(x, y, FACE.nose, FACE.noseR, 18));
			take('cheekL', radial(x, y, FACE.cheekL, FACE.cheekR_, 18));
			take('cheekR', radial(x, y, FACE.cheekR, FACE.cheekR_, 18));
			take(
				'jaw',
				smoothW((y - FACE.mouthLine) / 26) * smoothW((x - FACE.chin[0]) / 22) * smoothW((FACE.chin[1] - x) / 22),
			);
			take(
				'brow',
				smoothW((y - FACE.brow.y0) / 24) * smoothW((FACE.brow.y1 - y) / 22) *
					smoothW((x - FACE.brow.x[0]) / 26) * smoothW((FACE.brow.x[1] - x) / 26),
			);
			// the fur: whole at the outline, gone FUR_DEPTH below it; the sides of
			// the head (where the outline drops to the ears) keep out of it
			take('hair', smoothW((crownTopAt(x) + FUR_DEPTH - y) / 30) * smoothW((x - 245) / 30) * smoothW((365 - x) / 30));
			return out;
		},
	);
	console.log(`mesh    ${face.name}: ${attachments[face.name][face.name].uvs.length / 2} vertices (jaw, brow, nose, cheeks, fur)`);

	const ear = meta.layers.find((l) => l.name === 'head_4_ear');
	if (ear) {
		// held at the root, free toward the rim
		attachments[ear.name][ear.name] = meshAttachment(ear, 8, 10, (x, y) => {
			const e = smoothW((Math.hypot(x - EAR_ROOT[0], y - EAR_ROOT[1]) - 8) / 22);
			return { head: 1 - e, ear: e };
		});
		console.log(`mesh    ${ear.name}: the ear on its root`);
	}
}

// ── THE LEGS (2026-10-02, "腿和靴子用網格") ──────────────────────────────────────
//
// The legs were three rigid plates each — thigh, calf (knee pad and boot shaft),
// foot — so at the knee and the ankle two plates slid over each other whenever
// the joint bent. The calf and the foot are weighted meshes now, the sleeves'
// method turned down the leg: within LEG_HOLD of the joint a piece still rides
// its PARENT, and over the next LEG_BLEND (measured along the leg, which stands
// near-vertical) it hands over to its own bone — the knee pad bends between the
// thigh and the shin instead of hinging on a seam.
//
// And the two things that hang off the boots get a bone with PHYSICS each, so a
// landing kicks them and the float drifts them: the tag on its metal clip on
// the right boot's outside, and the frayed lace ends on the left boot's. They
// are CUT OUT onto their bones (the pens' method, below), not weighted: each
// sits right against the boot, and weighting them sheared the 4px between them
// and the shaft on every swing (check_monkey_rig, 18 animations).
// PSD pixels, off the pieces' own ink (2026-10-02).
const LEG_HOLD = { knee: 6, ankle: 4 };
const LEG_BLEND = { knee: 46, ankle: 30 };
const DANGLERS = [
	{ name: 'tagR', bone: 'legR_calf', layer: 'right_leg_1_calf', from: [446, 748], to: [449, 802], box: [434, 740, 462, 808] },
	{ name: 'laceL', bone: 'legL_calf', layer: 'left_leg_1_calf', from: [108, 744], to: [97, 774], box: [86, 736, 114, 780] },
];
for (const d of DANGLERS) addBone(d.name, d.bone, d.from, d.to);
{
	const at = (bone) => RIG.find((b) => b.name === bone).at;
	// [piece, its bone, its parent, joint kind]
	const LEG_PIECES = [
		['left_leg_1_calf', 'legL_calf', 'legL', 'knee'],
		['right_leg_1_calf', 'legR_calf', 'legR', 'knee'],
		['left_leg_2_foot', 'legL_foot', 'legL_calf', 'ankle'],
		['right_leg_2_foot', 'legR_foot', 'legR_calf', 'ankle'],
	];
	for (const [name, bone, parent, kind] of LEG_PIECES) {
		const layer = meta.layers.find((l) => l.name === name);
		if (!layer || boneOf[name] !== bone) {
			console.warn(`WARNING leg piece ${name} not on ${bone}; left rigid`);
			continue;
		}
		const jy = at(bone)[1];
		attachments[name][name] = meshGrid(
			layer,
			gridLines(layer.x, layer.x + layer.w, 14),
			gridLines(layer.y, layer.y + layer.h, 12, [[jy - 10, jy + LEG_HOLD[kind] + LEG_BLEND[kind] + 10, 6]]),
			(x, y) => {
				const own = smoothW((y - jy - LEG_HOLD[kind]) / LEG_BLEND[kind]);
				return { [parent]: 1 - own, [bone]: own };
			},
		);
		console.log(`mesh    ${name}: ${attachments[name][name].uvs.length / 2} vertices (${kind} blends ${parent} -> ${bone})`);
	}
}

// ── THE SUIT BREATHES (2026-10-02) ───────────────────────────────────────────
//
// In the float the suit swells and settles like a pressure suit in vacuum: the
// trunk and both chest-decoration layers (pockets, badge, holder, tubes) are
// weighted to `chest` by one bell round the middle of the chest — whole within
// CHEST.r, gone over the next CHEST.fade — so they move as one surface and
// nothing on the chest slides against the cloth under it. The collar, the
// shoulders and the waist sit outside the bell and hold.
{
	const chestW = (x, y) => smoothW((CHEST.r + CHEST.fade - Math.hypot(x - CHEST.at[0], (y - CHEST.at[1]) * 1.15)) / CHEST.fade);
	for (const name of ['torso_3_trunk', 'torso_4_decoration', 'torso_5_decoration']) {
		const layer = meta.layers.find((l) => l.name === name);
		if (!layer || boneOf[name] !== 'torso') continue;
		attachments[name][name] = meshGrid(
			layer,
			gridLines(layer.x, layer.x + layer.w, 22),
			gridLines(layer.y, layer.y + layer.h, 22),
			(x, y) => {
				const w = chestW(x, y);
				return { torso: 1 - w, chest: w };
			},
		);
		console.log(`mesh    ${name}: ${attachments[name][name].uvs.length / 2} vertices (the suit breathes)`);
	}
}

// ── THE LIGHTS AND THE BADGE: generated overlays, drawn additive ──────────────
//
// Written by this script into design/source/monkey_fx and packed into the atlas
// like the props. White, tinted by the slot colour.
const FX_DIR = path.join(appRoot, 'design/source/monkey_fx');
fs.mkdirSync(FX_DIR, { recursive: true });
const writeFx = (name, w, h, alphaAt) => {
	const png = new PNG({ width: w, height: h });
	for (let y = 0; y < h; y++)
		for (let x = 0; x < w; x++) {
			const i = (y * w + x) * 4;
			png.data[i] = png.data[i + 1] = png.data[i + 2] = 255;
			png.data[i + 3] = Math.round(255 * Math.max(0, Math.min(1, alphaAt(x + 0.5, y + 0.5))));
		}
	const file = path.join(FX_DIR, `${name}.png`);
	fs.writeFileSync(file, PNG.sync.write(png));
	return { name, file, w, h, external: true };
};
// a soft capsule: full inside a (cw x ch) core, falling off over `soft`
const capsule = (cx, cy, cw, ch, soft) => (x, y) => {
	const dx = Math.max(0, Math.abs(x - cx) - cw / 2), dy = Math.max(0, Math.abs(y - cy) - ch / 2);
	return Math.exp(-((Math.hypot(dx, dy) / soft) ** 2));
};
// ── the cut-outs: each pen and tube out of its layer, onto its bone ──
const LAYER_FILE = {}; // layer name -> its erased copy, for the atlas
const CUT_PIECES = []; // { name, bone, file, box } rigid regions
{
	const loaded = {};
	const layerImg = (name) => {
		if (!loaded[name]) {
			const l = meta.layers.find((x) => x.name === name);
			loaded[name] = { l, img: PNG.sync.read(fs.readFileSync(path.join(SRC, l.file))) };
		}
		return loaded[name];
	};
	// copy the box out of the layer into its own image; erase only where `erase`
	// says (a pen keeps its foot in the layer, under the band, as well)
	const cut = (name, layerName, bone, box, erase) => {
		const { l, img } = layerImg(layerName);
		const w = box.x1 - box.x0, h = box.y1 - box.y0;
		const png = new PNG({ width: w, height: h });
		for (let y = 0; y < h; y++)
			for (let x = 0; x < w; x++) {
				const px = box.x0 + x, py = box.y0 + y;
				const lx = px - l.x, ly = py - l.y;
				if (lx < 0 || ly < 0 || lx >= img.width || ly >= img.height) continue;
				const si = (ly * img.width + lx) * 4, di = (y * w + x) * 4;
				for (let c = 0; c < 4; c++) png.data[di + c] = img.data[si + c];
				if (erase(px, py)) img.data[si + 3] = 0;
			}
		const file = path.join(FX_DIR, `cut_${name}.png`);
		fs.writeFileSync(file, PNG.sync.write(png));
		CUT_PIECES.push({ name: `cut_${name}`, bone, file, box, layer: layerName });
	};
	for (const pen of PENS)
		cut(pen.name, 'torso_5_decoration', pen.name, { x0: Math.floor(pen.x - pen.half), x1: Math.ceil(pen.x + pen.half), y0: pen.tip - 4, y1: PEN_FOOT }, (x, y) => y < PEN_PIVOT - 3);
	for (const t of TUBES) cut(t.name, t.layer, t.name, { x0: t.x0, x1: t.x1, y0: t.top, y1: t.base }, () => true);
	for (const d of DANGLERS) cut(d.name, d.layer, d.name, { x0: d.box[0], x1: d.box[2], y0: d.box[1], y1: d.box[3] }, () => true);
	for (const [name, { l, img }] of Object.entries(loaded)) {
		const file = path.join(FX_DIR, `${name}_erased.png`);
		fs.writeFileSync(file, PNG.sync.write(img));
		LAYER_FILE[l.name] = file;
	}
	// each piece a rigid region on its bone. The bones are ROTATED along the
	// piece (addBone), so the offset is turned into the bone's frame and the
	// region turned back upright.
	for (const piece of CUT_PIECES) {
		const j = extraWorld[piece.bone];
		const c = toSpine((piece.box.x0 + piece.box.x1) / 2, (piece.box.y0 + piece.box.y1) / 2);
		const r = (-j.rot * Math.PI) / 180;
		const dx = c.x - j.x, dy = c.y - j.y;
		attachments[piece.name] = {
			[piece.name]: {
				x: +(dx * Math.cos(r) - dy * Math.sin(r)).toFixed(2),
				y: +(dx * Math.sin(r) + dy * Math.cos(r)).toFixed(2),
				rotation: +(-j.rot).toFixed(2),
				width: piece.box.x1 - piece.box.x0,
				height: piece.box.y1 - piece.box.y0,
			},
		};
	}
	console.log(`cut     ${CUT_PIECES.map((c) => c.name).join(', ')} (rigid, on their own bones)`);
}

// ── TWO VIALS PAINTED OUT (2026-09-28, "把最左邊跟最右邊的兩瓶移除掉") ──
//
// The chest rack showed five vials, and the outer two were only LIQUID — a grey
// window at the left and a brown one at the right, painted into the chest panel
// with no glass above them, which next to the three whole vials read as broken.
// They are painted over here, on the trunk's copy, with the panel's own plain
// face: each row of a hole is filled from the same row of a clean stretch of the
// panel (x 218..236, between the grey window and the first tube, which is on
// another layer), feathered at the edges so no patch shows.
{
	const trunk = meta.layers.find((l) => l.name === 'torso_3_trunk');
	const img = PNG.sync.read(fs.readFileSync(path.join(SRC, trunk.file)));
	const SOURCE_X = [218, 236];
	const HOLES = [
		{ x0: 197, x1: 217, y0: 357, y1: 388 }, // the grey window
		{ x0: 281, x1: 299, y0: 352, y1: 394 }, // the brown window
	];
	const at = (x, y) => ((y - trunk.y) * img.width + (x - trunk.x)) * 4;
	const FEATHER = 3;
	for (const h of HOLES) {
		const span = SOURCE_X[1] - SOURCE_X[0];
		for (let y = h.y0 - FEATHER; y <= h.y1 + FEATHER; y++)
			for (let x = h.x0 - FEATHER; x <= h.x1 + FEATHER; x++) {
				const sx = SOURCE_X[0] + ((x - h.x0) % span + span) % span;
				const d = Math.min(x - (h.x0 - FEATHER), h.x1 + FEATHER - x, y - (h.y0 - FEATHER), h.y1 + FEATHER - y);
				const k = Math.max(0, Math.min(1, d / FEATHER));
				const di = at(x, y), si = at(sx, y);
				for (let c = 0; c < 4; c++) img.data[di + c] = Math.round(img.data[di + c] * (1 - k) + img.data[si + c] * k);
			}
	}
	const file = path.join(FX_DIR, 'torso_3_trunk_edited.png');
	fs.writeFileSync(file, PNG.sync.write(img));
	LAYER_FILE[trunk.name] = file;
	console.log('trunk   the two lone liquid windows painted out');
}

// the liquid windows on the chest panel that still have a vial (warm ink in torso_3_trunk)
const WINDOWS = [
	{ x: 244.5, y: 379, tint: 'ffd08a' },
	{ x: 264.5, y: 379, tint: 'ff9d80' },
];
const FX = [];
FX.push(writeFx('fx_vial_glow', 26, 44, capsule(13, 22, 7, 22, 5)));

const PANEL_BOX = { x: 226, y: 350, w: 84, h: 58 };
FX.push(
	writeFx('fx_panel_flash', PANEL_BOX.w, PANEL_BOX.h, (x, y) =>
		Math.min(
			1,
			// the windows only: a halo over the whole panel read as a white slab
			WINDOWS.reduce((a, w) => a + capsule(w.x - PANEL_BOX.x, w.y - PANEL_BOX.y, 7, 20, 5)(x, y), 0),
		),
	),
);
// the badge's glint: its disc (torso_5's own ink within the badge's circle)
// with a diagonal band of light across it, one frame per step of the sweep
const BADGE = { x: 418.5, y: 271, r: 19.5 };
const GLINT_FRAMES = 8;
const BADGE_BOX = { x: BADGE.x - 22, y: BADGE.y - 22, w: 44, h: 44 };
{
	const t5 = meta.layers.find((l) => l.name === 'torso_5_decoration');
	const img = PNG.sync.read(fs.readFileSync(path.join(SRC, t5.file)));
	const inkAt = (px, py) => {
		const lx = Math.floor(px - t5.x), ly = Math.floor(py - t5.y);
		if (lx < 0 || ly < 0 || lx >= img.width || ly >= img.height) return 0;
		return img.data[(ly * img.width + lx) * 4 + 3] / 255;
	};
	for (let f = 0; f < GLINT_FRAMES; f++) {
		const c = -1.3 * BADGE.r + (2.6 * BADGE.r * f) / (GLINT_FRAMES - 1);
		FX.push(
			writeFx(`fx_badge_glint_${f}`, BADGE_BOX.w, BADGE_BOX.h, (x, y) => {
				const px = BADGE_BOX.x + x, py = BADGE_BOX.y + y;
				if (Math.hypot(px - BADGE.x, py - BADGE.y) > BADGE.r) return 0;
				const u = (px - BADGE.x + (py - BADGE.y)) / Math.SQRT2;
				return inkAt(px, py) * 0.85 * Math.exp(-(((u - c) / 4.5) ** 2));
			}),
		);
	}
}
// the chest's overlays (the lights, the flash, the glint) ride the CHEST bone,
// which addBone turned along its piece (straight up): the offset goes into the
// bone's frame and the region is turned back upright
const onTorso = (box) => {
	const c = toSpine(box.x + box.w / 2, box.y + box.h / 2);
	const j = extraWorld.chest;
	const r = (-j.rot * Math.PI) / 180;
	const dx = c.x - j.x, dy = c.y - j.y;
	return {
		x: +(dx * Math.cos(r) - dy * Math.sin(r)).toFixed(2),
		y: +(dx * Math.sin(r) + dy * Math.cos(r)).toFixed(2),
		rotation: +(-j.rot).toFixed(2),
		width: box.w,
		height: box.h,
	};
};
const SUIT_FX_SLOTS = {
	afterTrunk: [
		...WINDOWS.map((w, i) => ({ name: `vial_glow_${i + 1}`, bone: 'chest', attachment: `vial_glow_${i + 1}`, color: `${w.tint}40`, blend: 'additive' })),
		{ name: 'panel_flash', bone: 'chest', attachment: 'panel_flash', color: 'fff0d800', blend: 'additive' },
	],
	afterBadge: [{ name: 'badge_glint', bone: 'chest', blend: 'additive' }],
};
const pieceSlot = (name) => {
	const c = CUT_PIECES.find((p) => p.name === `cut_${name}`);
	return { name: c.name, bone: c.bone, attachment: c.name };
};
WINDOWS.forEach((w, i) => {
	attachments[`vial_glow_${i + 1}`] = {
		[`vial_glow_${i + 1}`]: { ...onTorso({ x: w.x - 13, y: w.y - 22, w: 26, h: 44 }), path: 'fx_vial_glow' },
	};
});
attachments.panel_flash = { panel_flash: { ...onTorso(PANEL_BOX), path: 'fx_panel_flash' } };
attachments.badge_glint = Object.fromEntries(
	Array.from({ length: GLINT_FRAMES }, (_, f) => [`fx_badge_glint_${f}`, onTorso(BADGE_BOX)]),
);

// PHYSICS: inertia on the two hanging bones. The banana is gripped in his
// teeth, so it is stiffer; the hose is a light loop and the floatiest thing on
// him. EVERY CONSTRAINT NEEDS ITS OWN `order` (Go Bananubis found only the first
// of seven running when they all sat at the default 0).
const physics = [
	{ name: 'banana_phys', bone: 'banana', rotate: 1, inertia: 0.5, strength: 110, damping: 0.8, mass: 1 },
	{ name: 'hose_phys', bone: 'hose', rotate: 1, inertia: 0.6, strength: 70, damping: 0.82, mass: 1 },
	// the suit's loose bits: pens light and springy, tubes stiff and quick (a
	// rattle, not a swing)
	...PENS.map((p) => ({ name: `${p.name}_phys`, bone: p.name, rotate: 1, inertia: 0.5, strength: 170, damping: 0.65, mass: 1 })),
	...TUBES.map((t) => ({ name: `${t.name}_phys`, bone: t.name, rotate: 1, inertia: 0.55, strength: 240, damping: 0.5, mass: 1 })),
	// the fur follows a head move a beat late; the ear flicks
	// stiff (mesh-cast-rig: a loose tip flung by a jump tears its mesh); the keyed
	// drift carries the life, physics only the follow-through
	{ name: 'hair_phys', bone: 'hair', rotate: 1, inertia: 0.12, strength: 600, damping: 0.95, mass: 1, mix: 0.4 },
	{ name: 'ear_phys', bone: 'ear', rotate: 1, inertia: 0.4, strength: 180, damping: 0.7, mass: 1 },
	// the boots' tag and lace ends: light, they kick on a landing
	...DANGLERS.map((d) => ({ name: `${d.name}_phys`, bone: d.name, rotate: 1, inertia: 0.4, strength: 150, damping: 0.75, mass: 1 })),
].map((c, order) => ({ ...c, order }));

// THE FLUTTER, on track 1, forever. Whole cycles only, so it loops seamlessly.
const FLUTTER_LOOP = 4.8;
const loopKeys = (amp, n, phase, steps = 24) =>
	Array.from({ length: steps + 1 }, (_, i) => {
		const t = (FLUTTER_LOOP * i) / steps;
		return { time: +t.toFixed(4), value: +(amp * Math.sin((2 * Math.PI * n * t) / FLUTTER_LOOP + phase)).toFixed(3) };
	});
// a slow sway with quick bumps on top of it (the chews)
const bumpKeys = (events, sway, steps = 96) =>
	Array.from({ length: steps + 1 }, (_, i) => {
		const t = (FLUTTER_LOOP * i) / steps;
		let v = sway.amp * Math.sin((2 * Math.PI * sway.n * t) / FLUTTER_LOOP + sway.phase);
		for (const { at, amp, width } of events) {
			const u = (t - at) / width;
			if (u > 0 && u < 1) v += amp * Math.sin(Math.PI * u);
		}
		return { time: +t.toFixed(4), value: +v.toFixed(3) };
	});
// the jaw's chew: down a few px on each of the banana's chews, as bumps over a
// still baseline, so it loops with the flutter
const chewKeys = (events, steps = 96) =>
	Array.from({ length: steps + 1 }, (_, i) => {
		const t = (FLUTTER_LOOP * i) / steps;
		let v = 0;
		for (const { at, amp, width } of events) {
			const u = (t - at) / width;
			if (u > 0 && u < 1) v += amp * Math.sin(Math.PI * u);
		}
		return { time: +t.toFixed(4), x: 0, y: +(-v).toFixed(3) };
	});
const flutter = {
	bones: {
		jaw: { translate: chewKeys([{ at: 0.6, amp: 3, width: 0.22 }, { at: 0.95, amp: 2.4, width: 0.22 }]) },
		hair: { rotate: loopKeys(1.2, 1, 0.4) },
		...Object.fromEntries(DANGLERS.map((d, i) => [d.name, { rotate: loopKeys(2, 1, 0.7 + 1.9 * i) }])),
		// the ear twitches once a loop, between the chews
		ear: { rotate: bumpKeys([{ at: 2.6, amp: 7, width: 0.16 }, { at: 2.78, amp: -3, width: 0.14 }], { amp: 0.8, n: 1, phase: 1.1 }) },
		banana: { rotate: bumpKeys([{ at: 0.6, amp: 9, width: 0.22 }, { at: 0.95, amp: 7, width: 0.22 }], { amp: 2, n: 2, phase: 0 }) },
		hose: { rotate: loopKeys(3, 1, 0.8) },
		// the suit's bits never quite still: the pens sway a hair, the tubes give
		// one little rattle a loop
		...Object.fromEntries(PENS.map((p, i) => [p.name, { rotate: loopKeys(1.2, 2, 1.3 * i) }])),
		...Object.fromEntries(
			TUBES.map((t, i) => [
				t.name,
				{
					rotate: bumpKeys(
						[
							{ at: 2.1 + 0.05 * i, amp: 3, width: 0.1 },
							{ at: 2.2 + 0.05 * i, amp: -2.4, width: 0.1 },
							{ at: 2.3 + 0.05 * i, amp: 1.4, width: 0.1 },
						],
						{ amp: 0.5, n: 1, phase: i },
					),
				},
			]),
		),
	},
};
// zero-g: everything that hangs drifts further and slower, and the chews float
const flutterFloat = {
	bones: {
		jaw: { translate: chewKeys([{ at: 0.8, amp: 2.6, width: 0.4 }, { at: 3.1, amp: 2, width: 0.4 }]) },
		// weightless: the fur and the ear drift, wide and slow
		hair: { rotate: loopKeys(3, 1, 0.4) },
		...Object.fromEntries(DANGLERS.map((d, i) => [d.name, { rotate: loopKeys(7, 1, 0.7 + 1.9 * i) }])),
		ear: { rotate: loopKeys(4, 1, 2.3) },
		banana: { rotate: bumpKeys([{ at: 0.8, amp: 11, width: 0.4 }, { at: 3.1, amp: 8, width: 0.4 }], { amp: 5, n: 1, phase: 0.3 }) },
		hose: { rotate: loopKeys(8, 1, 0.8) },
		// weightless: everything loose drifts, slowly and out of step
		...Object.fromEntries(PENS.map((p, i) => [p.name, { rotate: loopKeys(4, 1, 0.9 * i) }])),
		...Object.fromEntries(TUBES.map((t, i) => [t.name, { rotate: loopKeys(3, 1, 1.7 + i) }])),
	},
};

// THE SPARKLE, on track 2, forever (Mascot.svelte): the chest windows breathing
// out of step (whole cycles in the loop, so it closes), and one glint across the
// badge per loop. Its own track and its own, longer loop, so the glint comes by
// every ~10s rather than with every flutter, and a flutter / flutter_float swap
// does not restart the lights.
const SPARKLE_LOOP = 9.6;
const hex2 = (v) => Math.round(Math.max(0, Math.min(1, v)) * 255).toString(16).padStart(2, '0');
const sparkle = {
	slots: {
		...Object.fromEntries(
			WINDOWS.map((w, i) => [
				`vial_glow_${i + 1}`,
				{
					rgba: Array.from({ length: 49 }, (_, k) => {
						const t = (SPARKLE_LOOP * k) / 48;
						const a = 0.18 + 0.32 * (0.5 + 0.5 * Math.sin((2 * Math.PI * (3 + i) * t) / SPARKLE_LOOP + 1.9 * i));
						return { time: +t.toFixed(4), color: `${w.tint}${hex2(a)}` };
					}),
				},
			]),
		),
		badge_glint: {
			attachment: [
				{ time: 0, name: null },
				...Array.from({ length: GLINT_FRAMES }, (_, f) => ({ time: +(3 + 0.05 * f).toFixed(3), name: `fx_badge_glint_${f}` })),
				{ time: +(3 + 0.05 * GLINT_FRAMES).toFixed(3), name: null },
				{ time: SPARKLE_LOOP, name: null },
			],
		},
	},
};

// THE PANEL FLARES on his reactions: sampled from a sum of quick pulses, so
// pulses that overlap add up rather than cut each other off.
const flashKeys = (peaks, duration) =>
	Array.from({ length: Math.round(duration / 0.02) + 1 }, (_, k) => {
		const t = k * 0.02;
		let a = 0;
		for (const [at, amp] of peaks) {
			const u = t - at;
			a += amp * (u < 0 ? Math.exp(-((u / 0.04) ** 2)) : Math.exp(-u / 0.16));
		}
		return { time: +t.toFixed(3), color: `fff0d8${hex2(Math.min(1, a) * 0.8)}` };
	});

// the lights sit on the chest panel (right after the trunk, under the tubes
// standing in front of the windows); the glint right over the badge's piece
slots.splice(slots.findIndex((sl) => sl.name === 'torso_3_trunk') + 1, 0, ...SUIT_FX_SLOTS.afterTrunk);
slots.splice(slots.findIndex((sl) => sl.name === 'torso_5_decoration') + 1, 0, ...SUIT_FX_SLOTS.afterBadge);
// the pens BEHIND their holder (torso_5), the tubes over the layer they came from
slots.splice(slots.findIndex((sl) => sl.name === 'torso_5_decoration'), 0, ...PENS.map((p) => pieceSlot(p.name)));
for (const t of TUBES) slots.splice(slots.findIndex((sl) => sl.name === t.layer) + 1, 0, pieceSlot(t.name));
// the boots' tag and lace ends, right over the boot they came off
for (const d of DANGLERS) slots.splice(slots.findIndex((sl) => sl.name === d.layer) + 1, 0, pieceSlot(d.name));

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
	const layers = drawOrder
		.filter((l) => boneOf[l.name])
		.map((l) => (LAYER_FILE[l.name] ? { ...l, file: LAYER_FILE[l.name], external: true } : l));
	const pieces = CUT_PIECES.map((c) => ({ name: c.name, file: c.file, w: c.box.x1 - c.box.x0, h: c.box.y1 - c.box.y0, external: true }));
	const sorted = [...layers, ...propImages, ...FX, ...pieces].sort(
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
//
// RE-MEASURED ON THIS ARTWORK, in both directions, with `--sweep`:
//
//   outward   armL and armR both clean at 30; at 40 the white sleeve has lifted
//             off the shoulder and a gap opens between it and the fur forearm;
//             by 50 the sleeve is floating
//   inward    armL 40, armR 45, *_fore 40 — see the chest beat's own budget
//
// 26 came from the previous character and was inside this one's limit rather
// than at it. The suit is the reason there is any room at all: the last one's
// arms were bare fur tapering to a narrow wrist, so a swing put the wide end at
// the top of a horizontal bar; a short square sleeve rotating about a point
// inside itself still reads as a shoulder.
//
// RE-MEASURED ON THIS DELIVERY, and the two arms are no longer the same number.
// That is the whole change: `MAX_SHOULDER` was one value applied to both, which
// held while the two sleeves were cut alike and stopped holding here.
//
//   armR   inward 35, outward 30
//   armL   inward 45, outward 35
//
// RE-MEASURED AGAIN after the shoulder pivot was corrected (see shoulderOf), and
// the right arm roughly DOUBLED: it was 20 in / 22 out while the sleeve was
// rotating about its own centre, because half of it swung the wrong way and
// pushed a lobe out through the jacket. That was never the drawing's limit. It
// is worth remembering the next time a budget comes out suspiciously small — the
// first suspect is the joint, not the art.
//
// RAISED 2026-09-26 WITH THE WEIGHTED SLEEVES (see WEIGHTED SLEEVES above). As
// rigid plates the sleeves measured outward 30 (R) / 35 (L) and shipped at 27 /
// 32. As meshes, rendered through the real runtime (render_monkey_runtime.mjs
// on the --sweep build, zoomed on each shoulder, rigid and mesh side by side),
// the cap stays seated and the armpit closed to ~45 (R) / ~50 (L). Shipped at
// about 80% of that, with check_monkey_rig.mjs passing every animation.
const MAX_SHOULDER_L = 42;
const MAX_SHOULDER_R = 36;
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
const OUT_L = -MAX_SHOULDER_L;
const OUT_R = MAX_SHOULDER_R;
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
// The two arms need DIFFERENT angles, and the reason has changed twice.
//
// On the first character it was the rigging: one arm was a single rigid piece on
// a long lever and the other was two-piece. On the second both were two-piece and
// the numbers still had to differ, because the ARTWORK hangs them at different
// distances from the centre line.
//
// On THIS character — the suit — the rigging asymmetry is back, the other way
// round: the left arm is one fur piece from elbow to knuckles, the right is a
// forearm and a hand that overlap. And the budget is far larger than the last
// two. Swept and looked at (`--sweep`, then _preview__sweep_armL / _armR):
//
//   armL      holds to 40, borderline at 50, shoulder detaches by 60
//   armR      holds to 45, shoulder shows a step at 50, gone by 60
//   *_fore    holds to 40; past that the fist tucks behind the hip
//
// The suit is why. The last character's arms were bare fur tapering from a wide
// shoulder to a narrow wrist, so a swing put the wide end at the top of a
// horizontal bar and it read as a plank. This one has a SLEEVE — a short, roughly
// square white cuff over the deltoid — and a sleeve rotating about a point inside
// itself reads as a shoulder working, at angles the bare arm could not survive.
//
// Which matters, because the beat inherited 6 and 14 from the previous rig. Those
// were most of that character's budget and are a seventh of this one's, and at
// those angles the fists land on his BELT: the readout at the bottom of this file
// printed them at y=395 and y=374 against a chest that sits at y≈560. It read as
// a man patting his stomach.
//
// Set against that readout, not guessed. The target is each fist over its own
// pec — about x = ±70, y = 540.
//
// AND THE BEAT OVERSHOOTS ITS TARGET BY 5. `beatKeys` drives the strike through
// `inward + side * 5` before rebounding, so the angle that has to clear the
// budget is the target PLUS five, not the target. 30 on the right was really 35
// against a limit of 20.
// THE RIGHT SHOULDER BARELY MOVES, and the elbow does its work instead.
//
// 26 is inside the measured budget and the sleeve does not tear at it — that was
// checked, twice, after the pivot and the piece assignment were both fixed. It
// still looked wrong in the game, and the third report is the one to believe:
// what was left is not a tear but a SHAPE. That sleeve is a short cap over the
// deltoid, and swung 31 degrees it rides up into a lump that reads as a hunched,
// swollen shoulder even while every edge stays joined.
//
// The left sleeve is longer and set deeper and does not do this, so the two arms
// get different numbers here for a third distinct reason — first the rigging,
// then the pivot, now the silhouette.
//
// The reach is not lost. The elbow is split per arm and the right one takes what
// the shoulder gave up: the fur forearm has no seam against the jacket to open,
// so it carries a bigger angle without any of this.
const BEAT_SHOULDER_L = 34; // peaks at 39, inside the left's 45
const BEAT_SHOULDER_R = 12; // peaks at 17 — nowhere near the limit, on purpose
const BEAT_ELBOW_L = 24; // peaks at 29, inside the forearm's 30
const BEAT_ELBOW_R = 26; // peaks at 31; the fur has no edge against the suit
const BEAT_IN_L = BEAT_SHOULDER_L;
const BEAT_IN_R = -BEAT_SHOULDER_R;
const BEAT_FORE_L = BEAT_ELBOW_L;
const BEAT_FORE_R = -BEAT_ELBOW_R;
// How far the idle arm cocks away while the other lands. It was 14 against a
// beat of 6 and 14 — more than the strike itself, which was fine then. Against a
// 28-degree strike it is half the travel, and the two arms sat in almost the same
// place all the way through: six strikes and no visible alternation, just a mass
// of fur across the belly. At 24 the cocked arm is back at nearly its rest angle,
// so each strike arrives from somewhere.
const BEAT_OUT = 24;

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
const beatKeys = (inward, side, mine) =>
	beats.flatMap((t, i) =>
		mine.includes(i)
			? [
					{ time: t - 0.16, value: inward - side * BEAT_OUT }, // cocked
					{ time: t, value: inward + side * 5 }, // through the target
					{ time: t + 0.11, value: inward }, // rebound
				]
			: [{ time: t, value: inward - side * BEAT_OUT }],
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
				{ time: 0.28 + DRAG, value: BEAT_FORE_R },
				...beatKeys(BEAT_FORE_R, -1, [0, 2, 4]),
				{ time: BEAT_END, value: BEAT_FORE_R },
				{ time: BEAT_END + 0.4, value: 0 },
			],
		},
		armL_fore: {
			rotate: [
				{ time: 0, value: 0 },
				{ time: 0.28 + DRAG + LEAD, value: BEAT_FORE_L },
				...beatKeys(BEAT_FORE_L, 1, [1, 3, 5]),
				{ time: BEAT_END, value: BEAT_FORE_L },
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

// throwit: he produces the canister and pitches it at the board.
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
// Deliberately unhurried between the two: a beat to notice the canister, a wind
// up you can read, then the throw. Release used to be at 0.38s with the canister
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
		// nothing, then a canister, then nothing again. The SLOT is `prop`: what
		// he throws is a theme decision and the skeleton does not carry it.
		prop: {
			attachment: [
				{ time: 0, name: null },
				{ time: APPEAR_AT, name: 'prop' },
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
			// looks down at the canister as it appears, then follows it out
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

// ── SPACEWALK ───────────────────────────────────────────────────────────────
//
// His resting state for the whole of the free spins (Mascot.svelte loops it in
// place of idle there, inside the zero-g float, and cuts to the cheer only for
// a big win). Asked for 2026-09-26 as "like Boat's march, so floating in the
// feature feels more like space".
//
// It is Go Bananas Boat's march-in-place, slowed and emptied of weight:
//
//   - the SAME leg mechanism. From the front a knee cannot come up by rotating
//     anything — rotating the thigh swings the leg out sideways and parts the
//     hip — so the thigh bone is SCALED shorter and the boot rises as if the
//     knee came toward the camera. 0.85 at the top of a stride: the boot clears
//     plainly and the leg still reads as a leg.
//   - but slow strides (0.9s against the march's 0.5) with long, soft holds,
//     because nothing is pushing back.
//   - NO landing bob. The march drops the hip as each boot lands; there is no
//     floor here to land on. Instead each stride lifts him a little, and he
//     sinks back slowly — treading space.
//   - a lazy swimming swing of the arms, opposite to the legs, trailing further
//     than the march's (the forearm lags the shoulder by 0.18s, not 0.08).
//   - the head lags the body.
//
// All inside the measured budgets (shoulders 32/27, arms 10 here), nothing
// swapped, nothing rotated below the hip. IT LOOPS, so every key at 0 and at the
// end is the rest pose and no key sits past the end.
const WALK_STEPS = 4;
const WALK_STEP = 0.9;
const WALK_LIFT = 0.85; // thigh length at the top of a stride
const WALK_SWING = 14; // degrees of arm swing (10 before the weighted sleeves raised the shoulder budget)
const WALK_DRAG = 0.18;
const SPACEWALK_LOOP = WALK_STEPS * WALK_STEP;
const strideAt = (i) => +(i * WALK_STEP).toFixed(3);
const WALK_LEFT = [0, 2];
const WALK_RIGHT = [1, 3];

// one leg: rises slowly on its own strides, hangs, drifts back
const walkLeg = (mine) => [
	{ time: 0, x: 1, y: 1 },
	...mine.flatMap((i) => [
		...(strideAt(i) > 0 ? [{ time: strideAt(i), x: 1, y: 1 }] : []),
		{ time: +(strideAt(i) + 0.38).toFixed(3), x: 1.02, y: WALK_LIFT },
		{ time: +(strideAt(i) + 0.52).toFixed(3), x: 1.02, y: WALK_LIFT + 0.01 },
		{ time: +(strideAt(i) + 0.86).toFixed(3), x: 1, y: 1 },
	]),
	{ time: SPACEWALK_LOOP, x: 1, y: 1 },
];
// the boot comes a little nearer the lens as it rises
const walkFoot = (mine) => [
	{ time: 0, x: 1, y: 1 },
	...mine.flatMap((i) => [
		...(strideAt(i) > 0 ? [{ time: strideAt(i), x: 1, y: 1 }] : []),
		{ time: +(strideAt(i) + 0.42).toFixed(3), x: 1.06, y: 1.06 },
		{ time: +(strideAt(i) + 0.86).toFixed(3), x: 1, y: 1 },
	]),
	{ time: SPACEWALK_LOOP, x: 1, y: 1 },
];
// arm swings out while the OPPOSITE leg rises; `out` is the outward sign
// (negative on the left, positive on the right — OUT_L / OUT_R above)
const walkSwing = (out, mine) => [
	{ time: 0, value: 0 },
	...[0, 1, 2, 3].map((i) => ({
		time: +(strideAt(i) + 0.45).toFixed(3),
		value: mine.includes(i) ? out * WALK_SWING : -out * WALK_SWING * 0.45,
	})),
	{ time: SPACEWALK_LOOP, value: 0 },
];
const walkHang = (keys) =>
	keys.map((k) =>
		k.time === 0 || k.time === SPACEWALK_LOOP
			? { time: k.time, value: 0 }
			: { time: +(k.time + WALK_DRAG).toFixed(3), value: hang(k.value) },
	);
const walkArmR = walkSwing(1, WALK_LEFT);
const walkArmL = walkSwing(-1, WALK_RIGHT);

const spacewalk = {
	bones: {
		legL: { scale: walkLeg(WALK_LEFT) },
		legR: { scale: walkLeg(WALK_RIGHT) },
		legL_foot: { scale: walkFoot(WALK_LEFT) },
		legR_foot: { scale: walkFoot(WALK_RIGHT) },
		// each stride lifts him (y is UP here), and he sinks back slowly
		hip: {
			translate: [
				{ time: 0, x: 0, y: 0 },
				...[0, 1, 2, 3].flatMap((i) => [
					{ time: +(strideAt(i) + 0.4).toFixed(3), x: WALK_LEFT.includes(i) ? -1.5 : 1.5, y: 5 },
					{ time: +(strideAt(i) + 0.88).toFixed(3), x: 0, y: 1 },
				]),
				{ time: SPACEWALK_LOOP, x: 0, y: 0 },
			],
		},
		// leaning off the rising leg, softly
		torso: {
			rotate: [
				{ time: 0, value: 0 },
				...[0, 1, 2, 3].map((i) => ({
					time: +(strideAt(i) + 0.45).toFixed(3),
					value: WALK_LEFT.includes(i) ? -1.8 : 1.8,
				})),
				{ time: SPACEWALK_LOOP, value: 0 },
			],
		},
		// the head follows the lean a beat late, the other way: it is floating
		head: {
			rotate: [
				{ time: 0, value: 0 },
				...[0, 1, 2, 3].map((i) => ({
					time: +(strideAt(i) + 0.7).toFixed(3),
					value: WALK_LEFT.includes(i) ? 2 : -2,
				})),
				{ time: SPACEWALK_LOOP, value: 0 },
			],
		},
		armR: { rotate: walkArmR },
		armL: { rotate: walkArmL },
		armR_fore: { rotate: walkHang(walkArmR) },
		armL_fore: { rotate: walkHang(walkArmL) },
	},
};

// ── ZERO-G (2026-10-02, "FG裡面人物飄起來的可以用網格強化嗎") ──────────────────
//
// What he does at rest in the free spins, replacing the spacewalk. A body in
// weightlessness does not walk: it settles into the NEUTRAL BODY POSTURE —
// arms floating up and out in front, knees drawn a little, the trunk faintly
// curled — and everything drifts on its own slow clock. So: the arms out to
// ZG_ARM (inside the shoulder budgets), drifting out of step; the thighs drawn
// to ZG_KNEE (a shorter thigh is a knee raised, as in the walk and the tuck)
// and paddling slowly in turn; the trunk and the head drifting, the head a
// beat behind; and the suit BREATHING (the chest's swell, THE SUIT BREATHES).
// Whole cycles in ZG_LOOP, so it loops without a seam.
const ZG_LOOP = 6.4;
const ZG_ARM = { L: -22, R: 20 };
const ZG_DRIFT = 6;
const ZG_KNEE = 0.9;
const ZG_PADDLE = 0.045;
const zgKeys = (fn, steps = 32) =>
	Array.from({ length: steps + 1 }, (_, i) => {
		const t = (ZG_LOOP * i) / steps;
		return { time: +t.toFixed(4), ...fn(t) };
	});
const zgSin = (t, n, phase) => Math.sin((2 * Math.PI * n * t) / ZG_LOOP + phase);
const zgArm = (base, phase) => zgKeys((t) => ({ value: +(base + ZG_DRIFT * zgSin(t, 1, phase)).toFixed(3) }));
const zgFore = (base, phase) => zgKeys((t) => ({ value: +(hang(base + ZG_DRIFT * zgSin(t - 0.35, 1, phase)) + 4 * zgSin(t, 2, phase)).toFixed(3) }));
const zgLeg = (phase) => zgKeys((t) => ({ x: 1.01, y: +(ZG_KNEE + ZG_PADDLE * zgSin(t, 2, phase)).toFixed(4) }));
const zgFoot = (phase) => zgKeys((t) => {
	const k = 1.03 + 0.03 * zgSin(t, 2, phase);
	return { x: +k.toFixed(4), y: +k.toFixed(4) };
});
const zerog = {
	bones: {
		armL: { rotate: zgArm(ZG_ARM.L, 0) },
		armR: { rotate: zgArm(ZG_ARM.R, 2.1) },
		armL_fore: { rotate: zgFore(ZG_ARM.L, 0) },
		armR_fore: { rotate: zgFore(ZG_ARM.R, 2.1) },
		legL: { scale: zgLeg(0) },
		legR: { scale: zgLeg(Math.PI) },
		legL_foot: { scale: zgFoot(0) },
		legR_foot: { scale: zgFoot(Math.PI) },
		torso: { rotate: zgKeys((t) => ({ value: +(1.5 * zgSin(t, 1, 0.7)).toFixed(3) })) },
		head: { rotate: zgKeys((t) => ({ value: +(2.5 * zgSin(t, 1, 1.9)).toFixed(3) })) },
		// the suit breathing: two breaths a loop, the swell wider than it is tall
		chest: {
			scale: zgKeys((t) => {
				const b = 0.5 - 0.5 * Math.cos((2 * Math.PI * 2 * t) / ZG_LOOP);
				return { x: +(1 + 0.03 * b).toFixed(4), y: +(1 + 0.02 * b).toFixed(4) };
			}),
		},
	},
};

// ── THREE MORE REACTIONS (asked for 2026-09-26: "符合人體工學, 節奏順暢") ──────
//
// Every angle below stays inside the budgets measured above — shoulders out to
// MAX_SHOULDER_L / _R, in to the chest beat's reach, a HANGING forearm plumb
// (hang()) and a DRIVEN one bending with its shoulder, the thighs foreshortened
// no further than the cheer's crouch — and check_monkey_rig.mjs asserts it
// (the BUDGETS table there), along with no vertex jumping between frames.
// Each is carried by the BODY first, as everything on this drawing must be: a
// gather, a drive, an overshoot, a settle, with the arms trailing by DRAG and
// the head a beat behind the torso.

// TUCK — the zero-g flip (Mascot.svelte turns the whole float a full circle
// while this plays; the skeleton only has to curl up and open out again). A
// real somersault pulls the knees in to spin faster and opens out to stop: so a
// gather, the tuck held through the fast half of the turn, and an opening that
// lands on the turn's end.
// 1.15s: Mascot.svelte's FLIP_MS turns the float over the same span
const tuck = {
	bones: {
		hip: {
			translate: [
				{ time: 0, x: 0, y: 0 },
				{ time: 0.16, x: 0, y: -10 }, // gather
				{ time: 0.36, x: 0, y: 14 }, // the knees come up, the hips with them
				{ time: 0.8, x: 0, y: 12 },
				{ time: 1.0, x: 0, y: -4 }, // opening out
				{ time: 1.15, x: 0, y: 0 },
			],
		},
		torso: {
			scale: [
				{ time: 0, x: 1, y: 1 },
				{ time: 0.16, x: 1.06, y: 0.93 },
				{ time: 0.36, x: 1.07, y: 0.9 }, // curled
				{ time: 0.8, x: 1.06, y: 0.91 },
				{ time: 1.0, x: 0.97, y: 1.05 }, // opened long
				{ time: 1.15, x: 1, y: 1 },
			],
			rotate: [
				{ time: 0, value: 0 },
				{ time: 0.36, value: 3 },
				{ time: 0.8, value: 2 },
				{ time: 1.15, value: 0 },
			],
		},
		// the knees pulled in: both thighs foreshortened, one a hair after the other
		legL: {
			scale: [
				{ time: 0, x: 1, y: 1 },
				{ time: 0.16, x: 1.02, y: 0.95 },
				{ time: 0.38, x: 1.03, y: 0.85 },
				{ time: 0.8, x: 1.03, y: 0.86 },
				{ time: 1.02, x: 0.99, y: 1.03 },
				{ time: 1.15, x: 1, y: 1 },
			],
		},
		legR: {
			scale: [
				{ time: 0, x: 1, y: 1 },
				{ time: 0.18, x: 1.02, y: 0.95 },
				{ time: 0.4, x: 1.03, y: 0.85 },
				{ time: 0.82, x: 1.03, y: 0.86 },
				{ time: 1.04, x: 0.99, y: 1.03 },
				{ time: 1.15, x: 1, y: 1 },
			],
		},
		// chin down into the tuck, up as he opens
		head: {
			rotate: [
				{ time: 0, value: 0 },
				{ time: 0.22, value: 6 },
				{ time: 0.82, value: 7 },
				{ time: 1.04, value: -5 },
				{ time: 1.15, value: 0 },
			],
		},
		// arms drawn in across the body (inward: + on the left, - on the right),
		// the elbows DRIVEN — folding the fists in — then thrown out to stop the turn
		armL: {
			rotate: [
				{ time: 0, value: 0 },
				{ time: 0.2, value: 20 },
				{ time: 0.8, value: 22 },
				{ time: 1.0, value: OUT_L * 0.6 },
				{ time: 1.15, value: 0 },
			],
		},
		armR: {
			rotate: [
				{ time: 0, value: 0 },
				{ time: 0.2 + LEAD, value: -14 },
				{ time: 0.8, value: -15 },
				{ time: 1.0 + LEAD, value: OUT_R * 0.6 },
				{ time: 1.15, value: 0 },
			],
		},
		armL_fore: {
			rotate: [
				{ time: 0, value: 0 },
				{ time: 0.2 + DRAG, value: 18 },
				{ time: 0.8, value: 20 },
				{ time: 1.0 + DRAG, value: hang(OUT_L * 0.6) },
				{ time: 1.15, value: 0 },
			],
		},
		armR_fore: {
			rotate: [
				{ time: 0, value: 0 },
				{ time: 0.2 + DRAG + LEAD, value: -16 },
				{ time: 0.8, value: -17 },
				{ time: 1.0 + DRAG, value: hang(OUT_R * 0.6) },
				{ time: 1.15, value: 0 },
			],
		},
	},
};

// PUSH — the reels growing (Mascot.svelte fires it as the markers let go). No
// hand of this drawing can go over his head, so this is not a push UP: it is
// the capsule being forced open from the inside. He gathers low with his fists
// in at the chest, DRIVES up through the legs with both arms thrown out to the
// sides — the walls going — on the beat the marker releases (ReelGrow's coil is
// 300ms), holds it, and claps twice as the reels finish climbing.
const PUSH_DRIVE = 0.32;
const CLAP_1 = 0.84;
const CLAP_2 = 1.06;
const push = {
	bones: {
		hip: {
			translate: [
				{ time: 0, x: 0, y: 0 },
				{ time: 0.2, x: 0, y: -16 }, // gather low
				{ time: PUSH_DRIVE + 0.06, x: 0, y: 14 }, // drive up
				{ time: 0.62, x: 0, y: 3 },
				{ time: CLAP_1, x: 0, y: -4 },
				{ time: CLAP_2, x: 0, y: -3 },
				{ time: 1.4, x: 0, y: 0 },
			],
		},
		torso: {
			scale: [
				{ time: 0, x: 1, y: 1 },
				{ time: 0.2, x: 1.08, y: 0.9 },
				{ time: PUSH_DRIVE + 0.06, x: 0.93, y: 1.1 },
				{ time: 0.62, x: 1.01, y: 1.0 },
				{ time: CLAP_1, x: 1.03, y: 0.97 },
				{ time: CLAP_1 + 0.1, x: 1, y: 1 },
				{ time: CLAP_2, x: 1.03, y: 0.97 },
				{ time: 1.4, x: 1, y: 1 },
			],
			rotate: [
				{ time: 0, value: 0 },
				{ time: 0.2, value: 2 },
				{ time: PUSH_DRIVE + 0.1, value: -2 },
				{ time: 0.7, value: 0 },
				{ time: 1.4, value: 0 },
			],
		},
		legL: {
			scale: [
				{ time: 0, x: 1, y: 1 },
				{ time: 0.2, x: 1.03, y: 0.94 },
				{ time: PUSH_DRIVE + 0.06, x: 0.99, y: 1.03 },
				{ time: 0.62, x: 1, y: 1 },
				{ time: 1.4, x: 1, y: 1 },
			],
		},
		legR: {
			scale: [
				{ time: 0, x: 1, y: 1 },
				{ time: 0.22, x: 1.03, y: 0.94 },
				{ time: PUSH_DRIVE + 0.08, x: 0.99, y: 1.03 },
				{ time: 0.64, x: 1, y: 1 },
				{ time: 1.4, x: 1, y: 1 },
			],
		},
		// eyes on the work, then chin up as it gives
		head: {
			rotate: [
				{ time: 0, value: 0 },
				{ time: 0.22, value: 5 },
				{ time: PUSH_DRIVE + 0.14, value: -7 },
				{ time: 0.7, value: -2 },
				{ time: CLAP_1 + 0.04, value: 2 },
				{ time: CLAP_2 + 0.04, value: 2 },
				{ time: 1.4, value: 0 },
			],
		},
		// in to the chest, out to the walls, in twice to clap
		armL: {
			rotate: [
				{ time: 0, value: 0 },
				{ time: 0.2, value: 16 },
				{ time: PUSH_DRIVE + 0.1, value: OUT_L + 4 },
				{ time: 0.6, value: OUT_L * 0.8 },
				{ time: CLAP_1 - 0.1, value: OUT_L * 0.4 },
				{ time: CLAP_1, value: 24 },
				{ time: CLAP_1 + 0.1, value: 6 },
				{ time: CLAP_2, value: 24 },
				{ time: CLAP_2 + 0.12, value: 8 },
				{ time: 1.4, value: 0 },
			],
		},
		armR: {
			rotate: [
				{ time: 0, value: 0 },
				{ time: 0.2 + LEAD, value: -12 },
				{ time: PUSH_DRIVE + 0.1 + LEAD, value: OUT_R - 4 },
				{ time: 0.6, value: OUT_R * 0.8 },
				{ time: CLAP_1 - 0.1, value: OUT_R * 0.4 },
				{ time: CLAP_1, value: -16 },
				{ time: CLAP_1 + 0.1, value: -4 },
				{ time: CLAP_2, value: -16 },
				{ time: CLAP_2 + 0.12, value: -6 },
				{ time: 1.4, value: 0 },
			],
		},
		// driven in (fists folded to the chest and together for the claps),
		// hanging plumb while the arms are out
		armL_fore: {
			rotate: [
				{ time: 0, value: 0 },
				{ time: 0.2 + DRAG, value: 16 },
				{ time: PUSH_DRIVE + 0.1 + DRAG, value: hang(OUT_L + 4) },
				{ time: 0.6 + DRAG, value: hang(OUT_L * 0.8) },
				{ time: CLAP_1, value: 20 },
				{ time: CLAP_1 + 0.1, value: 8 },
				{ time: CLAP_2, value: 20 },
				{ time: CLAP_2 + 0.14, value: 6 },
				{ time: 1.4, value: 0 },
			],
		},
		armR_fore: {
			rotate: [
				{ time: 0, value: 0 },
				{ time: 0.2 + DRAG + LEAD, value: -14 },
				{ time: PUSH_DRIVE + 0.1 + DRAG + LEAD, value: hang(OUT_R - 4) },
				{ time: 0.6 + DRAG, value: hang(OUT_R * 0.8) },
				{ time: CLAP_1, value: -18 },
				{ time: CLAP_1 + 0.1, value: -6 },
				{ time: CLAP_2, value: -18 },
				{ time: CLAP_2 + 0.14, value: -5 },
				{ time: 1.4, value: 0 },
			],
		},
	},
};

// IDLE BREAKS — a waiting player gets a small bit of business every so often
// (Mascot.svelte, base game only, after a stretch with no spin). Four, picked
// at random, never the same twice running; each one small enough to be glanced
// at rather than watched, and each ending exactly at rest so idle picks up
// under it without a seam.

// 1. something passes overhead: he looks up, follows it across, shrugs.
const lookup = {
	bones: {
		torso: {
			rotate: [
				{ time: 0, value: 0 },
				{ time: 0.4, value: 4.5 }, // leaning back to look
				{ time: 1.1, value: -4.5 }, // following it across
				{ time: 1.5, value: -1 },
				{ time: 2.2, value: 0 },
			],
			scale: [
				{ time: 0, x: 1, y: 1 },
				{ time: 1.5, x: 1, y: 1 },
				{ time: 1.62, x: 1.05, y: 0.93 }, // the shrug
				{ time: 1.82, x: 0.99, y: 1.02 },
				{ time: 2.2, x: 1, y: 1 },
			],
		},
		head: {
			rotate: [
				{ time: 0, value: 0 },
				{ time: 0.5, value: -11 }, // chin up
				{ time: 1.1, value: -8 },
				{ time: 1.5, value: 0 },
				{ time: 1.66, value: 3 },
				{ time: 2.2, value: 0 },
			],
			translate: [
				{ time: 0, x: 0, y: 0 },
				{ time: 0.5, x: -7, y: 5 },
				{ time: 1.1, x: 7, y: 5 },
				{ time: 1.5, x: 0, y: 0 },
				{ time: 2.2, x: 0, y: 0 },
			],
		},
		// the shrug: both arms a little out and back, hanging
		armL: { rotate: [{ time: 0, value: 0 }, { time: 1.5, value: 0 }, { time: 1.66, value: -16 }, { time: 1.95, value: 0 }, { time: 2.2, value: 0 }] },
		armR: { rotate: [{ time: 0, value: 0 }, { time: 1.52, value: 0 }, { time: 1.68, value: 13 }, { time: 1.97, value: 0 }, { time: 2.2, value: 0 }] },
		armL_fore: { rotate: [{ time: 0, value: 0 }, { time: 1.5 + DRAG, value: 0 }, { time: 1.66 + DRAG, value: hang(-16) }, { time: 2.0, value: 0 }, { time: 2.2, value: 0 }] },
		armR_fore: { rotate: [{ time: 0, value: 0 }, { time: 1.52 + DRAG, value: 0 }, { time: 1.68 + DRAG, value: hang(13) }, { time: 2.02, value: 0 }, { time: 2.2, value: 0 }] },
	},
};

// 2. a big stretch and a yawn: arms out wide and long, body long, head back,
// a tremble at the top, and a slump out of it.
const stretch = {
	bones: {
		hip: {
			translate: [
				{ time: 0, x: 0, y: 0 },
				{ time: 0.6, x: 0, y: 6 },
				{ time: 1.3, x: 0, y: 6 },
				{ time: 1.6, x: 0, y: -5 }, // slump
				{ time: 2.4, x: 0, y: 0 },
			],
		},
		torso: {
			scale: [
				{ time: 0, x: 1, y: 1 },
				{ time: 0.6, x: 0.96, y: 1.06 },
				{ time: 1.3, x: 0.96, y: 1.06 },
				{ time: 1.6, x: 1.04, y: 0.95 },
				{ time: 2.4, x: 1, y: 1 },
			],
		},
		head: {
			rotate: [
				{ time: 0, value: 0 },
				{ time: 0.7, value: -10 }, // yawning, head back
				{ time: 1.3, value: -9 },
				{ time: 1.62, value: 4 },
				{ time: 2.4, value: 0 },
			],
		},
		armL: {
			rotate: [
				{ time: 0, value: 0 },
				{ time: 0.6, value: OUT_L * 0.9 },
				{ time: 0.95, value: OUT_L * 0.9 + 1.5 }, // the tremble
				{ time: 1.1, value: OUT_L * 0.9 - 1 },
				{ time: 1.3, value: OUT_L * 0.9 },
				{ time: 1.62, value: 4 },
				{ time: 2.4, value: 0 },
			],
		},
		armR: {
			rotate: [
				{ time: 0, value: 0 },
				{ time: 0.6 + LEAD, value: OUT_R * 0.9 },
				{ time: 1.0, value: OUT_R * 0.9 - 1.5 },
				{ time: 1.15, value: OUT_R * 0.9 + 1 },
				{ time: 1.3, value: OUT_R * 0.9 },
				{ time: 1.64, value: -3 },
				{ time: 2.4, value: 0 },
			],
		},
		// a stretch is a DRIVEN arm: the elbows straighten with the reach rather
		// than hang, but only part way — a locked arm is the plank
		armL_fore: {
			rotate: [
				{ time: 0, value: 0 },
				{ time: 0.6 + DRAG, value: hang(OUT_L * 0.9) * 0.5 },
				{ time: 1.3, value: hang(OUT_L * 0.9) * 0.5 },
				{ time: 1.66, value: 4 },
				{ time: 2.4, value: 0 },
			],
		},
		armR_fore: {
			rotate: [
				{ time: 0, value: 0 },
				{ time: 0.6 + DRAG + LEAD, value: hang(OUT_R * 0.9) * 0.5 },
				{ time: 1.3, value: hang(OUT_R * 0.9) * 0.5 },
				{ time: 1.68, value: -3 },
				{ time: 2.4, value: 0 },
			],
		},
	},
};

// 3. a wave at the player with the free (left) arm: the body leans toward us,
// the arm goes out and the forearm swings three times about its hanging line.
const wave = {
	bones: {
		torso: {
			rotate: [
				{ time: 0, value: 0 },
				{ time: 0.35, value: -3 },
				{ time: 1.6, value: -3 },
				{ time: 2.2, value: 0 },
			],
		},
		head: {
			rotate: [
				{ time: 0, value: 0 },
				{ time: 0.4, value: 4 }, // a friendly tilt
				{ time: 1.6, value: 3 },
				{ time: 2.2, value: 0 },
			],
		},
		// the whole arm bobs a little with each swing, so the wave reads at the
		// shoulder as well as the wrist — this arm cannot lift the hand, so the
		// swing has to carry it
		armL: {
			rotate: [
				{ time: 0, value: 0 },
				{ time: 0.35, value: -38 },
				...[0, 1, 2].flatMap((i) => [
					{ time: 0.62 + i * 0.3, value: -40 },
					{ time: 0.77 + i * 0.3, value: -35 },
				]),
				{ time: 1.6, value: -36 },
				{ time: 2.1, value: 0 },
				{ time: 2.2, value: 0 },
			],
		},
		// the swing about the hanging line: -13 / +10 around hang(-38) = 27,
		// so 14..37 — inside the elbow's 40
		armL_fore: {
			rotate: [
				{ time: 0, value: 0 },
				{ time: 0.35 + DRAG, value: hang(-38) },
				...[0, 1, 2].flatMap((i) => [
					{ time: 0.62 + i * 0.3 + 0.04, value: hang(-38) - 13 },
					{ time: 0.77 + i * 0.3 + 0.04, value: hang(-38) + 10 },
				]),
				{ time: 1.6 + DRAG, value: hang(-36) },
				{ time: 2.2, value: 0 },
			],
		},
		// the other arm stays down, a small counter-swing so it is not a post
		armR: { rotate: [{ time: 0, value: 0 }, { time: 0.4, value: -4 }, { time: 1.6, value: -3 }, { time: 2.2, value: 0 }] },
	},
};

// 4. tapping a foot: the weight on the left leg, the right boot tapping four
// times, the head nodding with it.
const TAPS = [0.35, 0.7, 1.05, 1.4];
const foottap = {
	bones: {
		hip: {
			translate: [
				{ time: 0, x: 0, y: 0 },
				{ time: 0.25, x: -8, y: -3 },
				{ time: 1.7, x: -8, y: -3 },
				{ time: 2.0, x: 0, y: 0 },
			],
		},
		legR: {
			scale: [
				{ time: 0, x: 1, y: 1 },
				...TAPS.flatMap((t) => [
					{ time: t - 0.1, x: 1.02, y: 0.91 }, // the toe up
					{ time: t, x: 1, y: 1 }, // and down
				]),
				{ time: 2.0, x: 1, y: 1 },
			],
		},
		legR_foot: {
			scale: [
				{ time: 0, x: 1, y: 1 },
				...TAPS.flatMap((t) => [
					{ time: t - 0.1, x: 1.07, y: 1.07 },
					{ time: t, x: 1, y: 1 },
				]),
				{ time: 2.0, x: 1, y: 1 },
			],
		},
		head: {
			rotate: [
				{ time: 0, value: 0 },
				...TAPS.flatMap((t) => [
					{ time: t, value: 4 },
					{ time: t + 0.17, value: 0 },
				]),
				{ time: 2.0, value: 0 },
			],
		},
		torso: {
			rotate: [
				{ time: 0, value: 0 },
				{ time: 0.25, value: 2.5 },
				{ time: 1.7, value: 2.5 },
				{ time: 2.0, value: 0 },
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
 * `--sweep` adds animations that ramp a joint from 0 to 70 degrees over seven
 * seconds. preview_monkey_spine.mjs samples eight frames across an animation's
 * length, so each contact sheet is that joint at 0, 10, 20 ... 70 — which is the
 * measurement, and it takes one command instead of an afternoon.
 *
 *   node design/generate_monkey_spine.mjs <tools> --sweep
 *   node design/preview_monkey_spine.mjs <tools> _sweep_armR_in
 *
 * BOTH DIRECTIONS, and that is not symmetry for its own sake. The sweep used to
 * run inward only, because the chest beat is the animation that spends the
 * biggest angles — so the beat's budget was measured on each new PSD and
 * MAX_SHOULDER, which is the OUTWARD limit every other animation uses, was
 * quietly inherited from the previous character every time. The two limits are
 * genuinely different: the shoulder pivot sits inside the suit, so swinging in
 * tucks the sleeve against the chest while swinging out pulls it off the
 * shoulder, and a number measured one way says nothing about the other.
 *
 * They are OFF by default so the shipped skeleton carries no diagnostics.
 */
const SWEEP = process.argv.includes('--sweep');
const SWEEP_TO = 70;
const SWEEP_SECONDS = 7;
// Right-side joints swing inward on negative angles.
const INWARD = (bone) => (bone.startsWith('armR') ? -1 : 1);
const SWEEP_BONES = ['armR', 'armR_fore', 'armL', 'armL_hand', 'torso', 'head'];
const sweeps = SWEEP
	? Object.fromEntries(
			SWEEP_BONES.flatMap((bone) =>
				[
					['in', INWARD(bone)],
					['out', -INWARD(bone)],
				].map(([tag, sign]) => [
					`_sweep_${bone}_${tag}`,
					{
						bones: {
							[bone]: {
								rotate: [
									{ time: 0, value: 0 },
									{ time: SWEEP_SECONDS, value: sign * SWEEP_TO },
								],
							},
						},
					},
				]),
			),
		)
	: {};

// the panel flare, keyed into the reactions (track 0)
{
	const withFlash = (anim, peaks, duration) => {
		anim.slots = { ...(anim.slots ?? {}), panel_flash: { rgba: flashKeys(peaks, duration) } };
	};
	withFlash(cheer, [[0.42, 1], [0.66, 0.8], [1.02, 0.9], [1.5, 0.5]], 2.05);
	withFlash(nod, [[0.24, 0.45]], 1.0);
	withFlash(chestbeat, beats.map((t, i) => [t, 0.75 + 0.05 * i]), BEAT_END + 0.4);
	withFlash(push, [[PUSH_DRIVE + 0.06, 1], [CLAP_1, 0.6], [CLAP_2, 0.6]], 1.4);
	withFlash(tuck, [[0.5, 0.8]], 1.15);
}

// the face in the reactions (track 0): brow up (+) or down (-) in px, the
// nostrils' flare as a scale across, the cheeks' puff in px apart
{
	const durationOf = (anim) => {
		let d = 0;
		for (const tl of Object.values(anim.bones ?? {}))
			for (const keys of Object.values(tl)) for (const k of keys) d = Math.max(d, k.time);
		return d;
	};
	const withFace = (anim, { brow = [], nose = [], cheeks = [] }) => {
		const end = durationOf(anim);
		const close = (keys, rest) => {
			const k = [[0, rest], ...keys];
			if (k[k.length - 1][0] < end) k.push([end, rest]);
			return k;
		};
		anim.bones = anim.bones ?? {};
		if (brow.length) anim.bones.brow = { translate: close(brow, 0).map(([time, v]) => ({ time, x: 0, y: v })) };
		if (nose.length) anim.bones.nose = { scale: close(nose, 1).map(([time, v]) => ({ time, x: v, y: 1 })) };
		if (cheeks.length) {
			anim.bones.cheekL = { translate: close(cheeks, 0).map(([time, v]) => ({ time, x: -v, y: 0 })) };
			anim.bones.cheekR = { translate: close(cheeks, 0).map(([time, v]) => ({ time, x: v, y: 0 })) };
		}
	};
	withFace(cheer, { brow: [[0.2, 4], [1.3, 4], [1.8, 0]], cheeks: [[0.35, 1.5], [0.8, 0]] });
	withFace(chestbeat, {
		brow: [[0.25, -3], [BEAT_END, -3], [BEAT_END + 0.4, 0]],
		nose: [[0.3, 1.12], [BEAT_END, 1.1], [BEAT_END + 0.4, 1]],
	});
	withFace(nod, { brow: [[0.24, 2], [0.7, 0]] });
	withFace(push, {
		cheeks: [[0.15, 2.5], [PUSH_DRIVE + 0.06, 0.5], [0.9, 0]],
		brow: [[PUSH_DRIVE + 0.06, 3], [1.2, 0]],
		nose: [[PUSH_DRIVE, 1.08], [0.8, 1]],
	});
	withFace(throwit, {
		brow: [[0.3, -3], [RELEASE_AT, 2], [1.2, 0]],
		cheeks: [[0.4, 2.5], [RELEASE_AT, 0]],
	});
	withFace(tuck, { brow: [[0.2, -2.5], [0.9, 0]], cheeks: [[0.3, 2], [0.8, 0]] });
	withFace(lookup, { brow: [[0.35, 3.5], [durationOf(lookup) - 0.3, 3], [durationOf(lookup), 0]] });
	withFace(stretch, { brow: [[0.4, 3], [durationOf(stretch) - 0.4, 0]], nose: [[0.6, 1.08], [durationOf(stretch) - 0.4, 1]] });
	withFace(wave, { brow: [[0.2, 2.5], [durationOf(wave) - 0.2, 0]] });
}

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
	physics,
	skins: [{ name: 'default', attachments }],
	animations: Object.fromEntries(
			Object.entries({ idle, cheer, chestbeat, nod, throwit, spacewalk, zerog, tuck, push, lookup, stretch, wave, foottap, ...sweeps }).map(([name, a]) => [
				name,
				// idle and the spacewalk loop, so they are the ones whose ends have
				// to meet.
				smoothAnimation(
					fuseDeadJoints(a, name),
					name === 'idle' ? IDLE_LOOP : name === 'spacewalk' ? SPACEWALK_LOOP : name === 'zerog' ? ZG_LOOP : undefined,
				),
			]).concat([
				// track 1's loops key only the hanging bones: nothing to fuse
				['flutter', smoothAnimation(flutter, FLUTTER_LOOP)],
				['flutter_float', smoothAnimation(flutterFloat, FLUTTER_LOOP)],
				// track 2: the chest lights and the badge glint
				['sparkle', sparkle],
			]),
		),
};

fs.writeFileSync(path.join(OUT, 'monkey.json'), JSON.stringify(skeleton, null, 2) + '\n');

// The hand's position at RELEASE_AT, in skeleton units. TransitionAnimation
// spawns the canister here, so it is printed rather than left to be guessed at.
{
	// FORWARD KINEMATICS, read out of the generated animation.
	//
	// Two things outside the skeleton need to know where a hand IS at a given
	// moment: the transition spawns the canister at the release, and the comic
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

// ART and GOGGLE for Mascot.svelte. Both were typed constants there and both
// were quietly wrong after a new PSD: the art box decides the scale he is drawn
// at, and the goggle box decides where the tease glow sits — a glow keyed to the
// previous character's visor lands on this one's chin.
{
	const xs = meta.layers.flatMap((l) => [l.x, l.x + l.w]);
	const ys = meta.layers.map((l) => l.y);
	const box = {
		width: Math.max(...xs) - Math.min(...xs),
		height: ROOT.y - Math.min(...ys),
	};
	console.log(`ART      { height: ${box.height}, width: ${box.width} }`);
	// the BIGGEST eye piece: this delivery has two, and the other is a pair of
	// specks whose bounding box is nearly as large as the goggles'
	const eye = biggest(/^head_\d+_eye/);
	if (eye) {
		const c = toSpine(eye.x + eye.w / 2, eye.y + eye.h / 2);
		console.log(
			`GOGGLE   { x: ${Math.round(c.x)}, y: ${Math.round(c.y)}, ` +
				`halfWidth: ${Math.round(eye.w / 2)}, halfHeight: ${Math.round(eye.h / 2)} }`,
		);
	} else {
		console.warn('WARNING no *_eye layer — the goggle tease has nothing to sit on');
	}
	// the backpack's thruster (Mascot.svelte NOZZLE): the middle of the pack's
	// left wall, where the puffs come out in the free spins
	const nz = toSpine(86, 160);
	console.log(`NOZZLE   { x: ${Math.round(nz.x)}, y: ${Math.round(nz.y)} }`);
}

console.log(`atlas   monkey.png ${PAGE_W}x${PAGE_H}, ${placed.length} regions`);
console.log(`skeleton monkey.json ${bones.length} bones, ${slots.length} slots`);
console.log('out', path.relative(appRoot, OUT));
