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
const MAX_SHOULDER_L = 32;
const MAX_SHOULDER_R = 27;
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
	skins: [{ name: 'default', attachments }],
	animations: Object.fromEntries(
			Object.entries({ idle, cheer, chestbeat, nod, throwit, ...sweeps }).map(([name, a]) => [
				name,
				// idle is the only one that loops, so it is the only one whose ends
				// have to meet.
				smoothAnimation(fuseDeadJoints(a, name), name === 'idle' ? IDLE_LOOP : undefined),
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
}

console.log(`atlas   monkey.png ${PAGE_W}x${PAGE_H}, ${placed.length} regions`);
console.log(`skeleton monkey.json ${bones.length} bones, ${slots.length} slots`);
console.log('out', path.relative(appRoot, OUT));
