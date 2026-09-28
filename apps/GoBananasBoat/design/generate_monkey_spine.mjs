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

// One image that is not a body part: the naval mine he throws. Packed into this
// atlas rather than referenced from the symbol set, because a Spine skin can
// only draw regions from its own atlas.
//
// It is the SAME object as the H2 symbol, cut off its container panel by
// design/cut_from_plate.py, so the thing he throws and the thing on the reels
// are one thing rather than two drawings of a similar idea.
// Width over height of a prop's source art. Read once, here, so nothing
// downstream has to remember what shape the file happens to be.
const propAspect = (prop) => {
	const img = PNG.sync.read(fs.readFileSync(prop.file));
	return img.width / img.height;
};

const PROPS = [
	{
		name: 'mine',
		file: path.join(appRoot, 'static/assets/sprites/goBananasSymbolsV3/mine.png'),
		bone: 'prop',
		// skeleton units — about a fifth of his height, which is a mine in a
		// gorilla's fist rather than a beach ball. It is the HEIGHT; the width
		// comes from the file, see below.
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
// dynamite already uses, which is why there is no new machinery here.
//
// ONLY `right_arm_2_hand` GETS ONE, AND THE OTHER PIECE IS THE REASON.
//
// `right_arm_1_forearm` is not artwork. Opened on its own it is a 55x144 patch
// of PURE BLACK with a soft edge — the shadow the artist painted UNDER the arm,
// which is why the PSD stacks it at z 11, below both the upper arm (13) and the
// trunk (14). In the rest pose it is completely hidden and it is doing its job.
//
// Copied to the front it is drawn on top of the coat at PSD x 387..442,
// y 286..430 — exactly the right shoulder. That was the black wedge that
// appeared there through the chest beat: not a tear, not a joint in the wrong
// place, just a shadow layer promoted in front of the thing it was shading.
//
// The real forearm-and-fist is `right_arm_2_hand`, and the sleeve above it is
// `right_arm_0_upper_arm`. Both come forward.
//
// THE SLEEVE WAS LEFT OUT AT FIRST, AND THAT WAS THE "ARM EATEN BY THE BODY".
//
// The PSD draws this arm behind the trunk: sleeve at z 13, trunk at z 14. Bring
// only the forearm forward and the chest beat plays with a fist crossing the
// coat and no arm attached to it — the sleeve is still behind, so the limb
// visually ends at the elbow. Opened on its own the sleeve is a FINISHED
// painting, round the back as well as the front (unlike `right_arm_1_forearm`,
// which is nothing but shadow), so there is no reason for it to hide.
// Order matters: these are appended to the draw order in this order, and it has
// to be the PSD's own — forearm FIRST, sleeve over it (hand z below sleeve z).
// It used to be the other way round, which put the forearm on top of the cuff:
// its top end, the part painted to disappear up inside the sleeve (dark fur
// roots and the cut-out's ink edge), was drawn ACROSS the cuff, and on every
// right-arm strike a dark band crossed the elbow. trimTuck faded the darkest of
// it and the rest still showed.
const FRONT_COPIES = ['right_arm_2_hand', 'right_arm_0_upper_arm'];
// The sleeve copy is now in front of the trunk, so its tucked edge is exposed
// and trimTuck erases it. The forearm copy is under its sleeve again, but gets a
// harder cut of its own (cutUnderSleeve): its top is a pointed cap of dark fur
// painted to vanish up the sleeve, and the strike bends the elbow ~25 degrees
// inward, which swings that cap OUT past the inner side of the cuff. trimTuck
// only fades pixels darker than luma 48, and most of the cap is brown fur above
// that, so it still showed as a dark wedge climbing toward the scarf.
const TRIM_FRONT = new Set(['right_arm_0_upper_arm']);
const CUT_UNDER_SLEEVE = { right_arm_2_hand: 'right_arm_0_upper_arm' };
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

// Skeleton origin on the PSD canvas: centred between the boots, on the ground.
// The skeleton origin: on the ground, between the feet. Measured on THIS
// character — x is the midpoint of the two foot centres, y is the lowest point
// of the lower foot, both read off layers.json. Carried over from the gen-2
// commando it was (280, 884) on a 912-tall canvas, which sat 40px above the
// captain's soles: the whole rig hovered, and Mascot.svelte positions him by his
// feet, so he would have floated above the bet bar.
const ROOT = { x: 291, y: 924 };
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
//
// THESE ARE MEASURED ON THE CHARACTER, SO THEY MOVE WHEN THE CHARACTER DOES.
//
// Every explicit coordinate below is in PSD pixels on THIS character's canvas
// (560x928, captain). They were carried over from the gen-2 commando's 560x912
// canvas when this game was forked and were quietly wrong for the new art — the
// rig loads and animates either way, so nothing fails; the limbs just pivot
// about points that are not the character's joints.
//
// Re-derived here as fractions of the pieces they sit against, so the same
// reasoning can be reapplied to the next character rather than re-guessed:
//
//   hip        pelvis centre: midway between the thigh tops, x centred on them
//   torso      the belt line, a little above the hip
//   head       base of the skull, just under the jaw of head_*_face
//   armL_hand  ~65% down the left arm's distal piece, at its centre
//   armR_hand  ~52% down the right arm's distal piece
//   prop       just outboard and below the left hand, where a held object sits
//
// Verify with `node design/preview_monkey_spine.mjs` and look at the rendered
// _preview_*.png — a joint in the wrong place is obvious there and invisible
// in the JSON.
const JOINT_INSET = 18;
// Takes CANDIDATES, not one name, and uses the first that the PSD actually
// shipped.
//
// Artists do not segment both arms the same way and there is no reason they
// should. The gen-2 character had `_1_forearm` as a small cuff and `_2_hand` as
// the forearm-plus-fist on BOTH sides. The captain has that on his right, but on
// his left the whole lower arm is one `_1_forearm` piece and `_2_hand` is an
// empty layer — which extract_monkey_psd.py drops, correctly, because it holds
// no pixels.
//
// Naming one piece here made that a crash: `piece()` throws on a name the PSD
// does not contain, so a perfectly good character could not be rigged because of
// how its layers happened to be grouped. Asking for the distal piece by
// preference order costs nothing and lets either segmentation through.
const jointOf = (...candidates) => {
	const name = candidates.find((c) => c in byName);
	if (!name) {
		throw new Error(`no distal piece found, tried: ${candidates.join(', ')}`);
	}
	const l = piece(name);
	return [Math.round(l.x + l.w / 2), Math.round(l.y + JOINT_INSET)];
};

const RIG = [
	// Explicit: these three sit inside the torso mass rather than at the top of a
	// limb, so there is no piece edge to read them off.
	{ name: 'hip', parent: 'root', at: [292, 535], match: null },
	{ name: 'torso', parent: 'hip', at: [292, 495], match: /^torso_/ },
	// The neck, just under the jaw: the head nods and turns about this.
	{ name: 'head', parent: 'torso', at: [288, 312], match: /^head_/ },

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
	{ name: 'armL_fore', parent: 'armL', at: jointOf('left_arm_2_hand', 'left_arm_1_forearm'), match: /^left_arm_(1|2)/ },
	{ name: 'armL_hand', parent: 'armL_fore', at: [100, 553], match: null, fuse: 'armL_fore' },
	// Carries the thrown prop, so it follows the hand exactly rather than being
	// chased by something outside the skeleton trying to guess where the hand is.
	{ name: 'prop', parent: 'armL_hand', at: [104, 573], match: null },

	{ name: 'armR', parent: 'torso', at: jointOf('right_arm_0_upper_arm'), match: /^right_arm_0/ },
	{ name: 'armR_fore', parent: 'armR', at: jointOf('right_arm_2_hand', 'right_arm_1_forearm'), match: /^right_arm_(1|2)/ },
	{ name: 'armR_hand', parent: 'armR_fore', at: [481, 482], match: null, fuse: 'armR_fore' },

	{ name: 'legL', parent: 'hip', at: jointOf('left_leg_0_thigh'), match: /^left_leg_0/ },
	{ name: 'legL_calf', parent: 'legL', at: jointOf('left_leg_1_calf'), match: /^left_leg_1/ },
	{ name: 'legL_foot', parent: 'legL_calf', at: jointOf('left_leg_2_foot'), match: /^left_leg_2/ },

	{ name: 'legR', parent: 'hip', at: jointOf('right_leg_0_thigh'), match: /^right_leg_0/ },
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
// The copy gets its OWN atlas region rather than aliasing the original's via
// `path`, because it is not quite the same picture — see trimTuck.
for (const name of FRONT_COPIES) {
	if (!attachments[name]) continue;
	attachments[frontName(name)] = { [frontName(name)]: { ...attachments[name][name] } };
}

for (const prop of PROPS) {
	attachments[prop.name] = {
		// THE ASPECT IS READ FROM THE FILE, NOT ASSUMED SQUARE.
		//
		// It used to be drawn `size` by `size` with a note saying the art was
		// square, which it was. It is not any more: the cut now keeps the mine's
		// mooring chain, so the file came back 776x837. Drawn square that is a
		// sphere squashed 7% vertically — and squashed in a way that does not
		// fail loudly, it just makes the one prop that spends the whole throw
		// TUMBLING read as an egg.
		[prop.name]: {
			x: 0,
			y: 0,
			width: Math.round(prop.size * propAspect(prop)),
			height: prop.size,
		},
	};
}

// EVERY PIECE IS PAINTED WITH A BLACK TUCK, AND A FRONT COPY EXPOSES IT.
//
// Open the pieces on their own (design/source/monkey/*.png) and most of them
// carry a slab of near-black along the edge where they slot into the piece
// above them: the thigh tops, both sleeves, and the forearm this copy is made
// of. It is the shadow the artist painted for the seam, it is meant to be
// covered, and in the PSD's stacking it always is.
//
// A front copy breaks that. `right_arm_2_hand` is drawn at the end of the draw
// order so the fist can cross the chest, and its tuck — the top third of the
// piece — arrives with it, on top of the coat, as a black wedge at the elbow.
// (The first pass at this had `right_arm_1_forearm` in the copy list too. That
// layer is nothing BUT tuck: a 55x144 patch of pure black with no arm in it,
// which is why the wedge was at the shoulder then and at the elbow now. Same
// cause, one piece further down.)
//
// So the copy is trimmed. The band is not a number typed in here: it is how far
// the piece ABOVE this one in its own limb reaches down over it, read off the
// PSD boxes, which is by definition the part that was never meant to be seen.
// Inside that band, dark pixels are faded out in proportion to how dark they
// are, and the whole erase ramps off over its last rows so the fur ends in a
// fade rather than a cut line.
//
// Only the copy is trimmed. The original still draws behind the torso with its
// tuck intact, which is where the tuck does its job.
const TUCK_LUMA = 48;
const TUCK_FEATHER = 26;

// WHICH PART OF A PIECE WAS NEVER MEANT TO BE SEEN, worked out from the PSD's
// own boxes rather than named per piece.
//
// It is whatever lies under the piece that COVERS it — so it is a rectangle, and
// which side of the piece that rectangle sits on depends on the pair:
//
//   right_arm_2_hand      covered from ABOVE by right_arm_0_upper_arm (y 206..431
//                         against the hand's 345..609) -> a band across its top
//   right_arm_0_upper_arm covered from the LEFT by torso_5_trunk (x 141..474
//                         against the sleeve's 384..538) -> a band down its side
//
// The first version of this only looked at the top, and only at siblings in the
// same limb. That was enough for the hand and blind to the sleeve, whose coverer
// is the torso and whose tuck is on its edge rather than its top.
//
// Returns the covered rectangle in the piece's LOCAL pixels, or null.
const tuckRect = (layer) => {
	let best = null;
	let bestArea = 0;
	for (const other of meta.layers) {
		if (other === layer || other.z <= layer.z) continue;
		const x0 = Math.max(layer.x, other.x);
		const y0 = Math.max(layer.y, other.y);
		const x1 = Math.min(layer.x + layer.w, other.x + other.w);
		const y1 = Math.min(layer.y + layer.h, other.y + other.h);
		if (x1 <= x0 || y1 <= y0) continue;
		const area = (x1 - x0) * (y1 - y0);
		if (area <= bestArea) continue;
		bestArea = area;
		best = { x0: x0 - layer.x, y0: y0 - layer.y, x1: x1 - layer.x, y1: y1 - layer.y };
	}
	return best;
};

const trimTuck = (img, rect) => {
	const out = new PNG({ width: img.width, height: img.height });
	img.data.copy(out.data);
	if (!rect) return out;
	const { width: w, height: h } = img;
	for (let y = Math.max(0, rect.y0); y < Math.min(h, rect.y1); y++) {
		for (let x = Math.max(0, rect.x0); x < Math.min(w, rect.x1); x++) {
			// How deep inside the covered rectangle this pixel is, counting only the
			// edges that fall INSIDE the piece — an edge that coincides with the
			// piece's own border is not a boundary to fade across.
			let depth = Infinity;
			if (rect.x0 > 0) depth = Math.min(depth, x - rect.x0);
			if (rect.x1 < w) depth = Math.min(depth, rect.x1 - 1 - x);
			if (rect.y0 > 0) depth = Math.min(depth, y - rect.y0);
			if (rect.y1 < h) depth = Math.min(depth, rect.y1 - 1 - y);
			const ramp = depth === Infinity ? 1 : Math.min(1, depth / TUCK_FEATHER);
			if (ramp <= 0) continue;
			const i = (y * w + x) * 4;
			const luma = img.data[i] * 0.299 + img.data[i + 1] * 0.587 + img.data[i + 2] * 0.114;
			if (luma >= TUCK_LUMA) continue;
			const k = Math.min(1, ((TUCK_LUMA - luma) / TUCK_LUMA) * 1.6) * ramp;
			out.data[i + 3] = Math.round(img.data[i + 3] * (1 - k));
		}
	}
	return out;
};

// Erase whatever part of a piece its coverer actually hides, using the
// coverer's OWN OUTLINE rather than its bounding box, and keep a strip just
// under the coverer's lower edge. The strip is what stops a gap opening at the
// joint when the piece rotates under its cover; everything deeper than it was
// never meant to be seen and is removed outright, whatever its colour.
//
// Depth is measured per column, up from the lowest covered pixel in that
// column: the cuff edge is a slanted line, and a single row cut-off would keep
// cap on one side and bite into the forearm on the other.
const SLEEVE_KEEP = 10; // px of forearm kept under the cuff edge
const SLEEVE_FEATHER = 12; // then faded out over this many
const cutUnderSleeve = (img, layer, cover) => {
	const out = new PNG({ width: img.width, height: img.height });
	img.data.copy(out.data);
	const c = PNG.sync.read(fs.readFileSync(path.join(SRC, cover.file)));
	const { width: w, height: h } = img;
	const covered = (x, y) => {
		const cx = x + layer.x - cover.x;
		const cy = y + layer.y - cover.y;
		if (cx < 0 || cy < 0 || cx >= c.width || cy >= c.height) return false;
		return c.data[(cy * c.width + cx) * 4 + 3] > 20;
	};
	for (let x = 0; x < w; x++) {
		let bottom = -1;
		for (let y = h - 1; y >= 0; y--) {
			if (covered(x, y)) {
				bottom = y;
				break;
			}
		}
		if (bottom < 0) continue;
		for (let y = 0; y <= bottom; y++) {
			if (!covered(x, y)) continue;
			const depth = bottom - y;
			const k = Math.min(1, Math.max(0, (depth - SLEEVE_KEEP) / SLEEVE_FEATHER));
			if (k <= 0) continue;
			const i = (y * w + x) * 4;
			out.data[i + 3] = Math.round(img.data[i + 3] * (1 - k));
		}
	}
	return out;
};

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
	// The trimmed front copies, carried as decoded pixels rather than as a file
	// on disk: nothing outside this atlas ever wants them, and writing them into
	// design/source would put a derived image next to the artist's originals.
	const frontImages = FRONT_COPIES.filter((name) => boneOf[name]).map((name) => {
		const layer = piece(name);
		const raw = PNG.sync.read(fs.readFileSync(path.join(SRC, layer.file)));
		const img = CUT_UNDER_SLEEVE[name]
			? cutUnderSleeve(raw, layer, piece(CUT_UNDER_SLEEVE[name]))
			: trimTuck(raw, TRIM_FRONT.has(name) ? tuckRect(layer) : null);
		return { name: frontName(name), w: img.width, h: img.height, image: img };
	});
	const sorted = [...drawOrder.filter((l) => boneOf[l.name]), ...frontImages, ...propImages].sort(
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
	const img = p.image ?? PNG.sync.read(fs.readFileSync(p.external ? p.file : path.join(SRC, p.file)));
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
const BEAT_SHOULDER_L = 6;
const BEAT_SHOULDER_R = 14;
const BEAT_ELBOW = 20;
const BEAT_IN_L = BEAT_SHOULDER_L;
const BEAT_IN_R = -BEAT_SHOULDER_R;
const BEAT_FORE_L = BEAT_ELBOW;
const BEAT_FORE_R = -BEAT_ELBOW;
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
//
// And the arm's CAST SHADOW goes for the same stretch. right_arm_1_forearm is
// not a forearm at all: it is a solid black blob, the shadow the hanging arm
// throws on the coat inside the sleeve. It is rigged to the elbow bone, so on
// every right-arm strike it rotated inward with the forearm and swept out from
// behind the sleeve across the chest as a black wedge. A shadow cast by an arm
// hanging at the side has nothing to do with an arm held across the body, so it
// is simply off while the arm is in front.
const CAST_SHADOW = 'right_arm_1_forearm';
const chestbeatSlots = Object.fromEntries([
	[CAST_SHADOW, { attachment: [{ time: 0, name: null }, { time: BEAT_END + 0.34, name: CAST_SHADOW }] }],
	...FRONT_COPIES.flatMap((name) => [
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
]);

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

// alert: he turns and watches the cargo reel.
//
// The one stretch of the round where the character has a reason to look at
// something other than the board — the manifest is being read (CargoPick), and
// standing at idle through four and a half seconds of it was the tell that he is
// a loop rather than a person.
//
// HE IS TO THE RIGHT OF THE BOARD (Mascot.svelte places him in the gap at
// `board.x + frameHalfWidth`), so "toward it" is negative x.
//
// THE TORSO'S SIGN IS MEASURED, NOT ASSUMED, and it is worth saying how, because
// three attempts at measuring it were wrong before one was right:
//
//   · head centroid in absolute sheet pixels — idle measured IDENTICALLY, so it
//     was reading the contact sheet's own per-frame offset, not the pose
//   · head centroid minus foot centroid — both animations came out flat zero,
//     because the preview sheet is OPAQUE and an `alpha > threshold` test counts
//     every pixel in the frame
//   · the same, keyed on colour distance from the sheet's corner — this one can
//     actually see the figure (165k head pixels against 96k foot pixels), and it
//     showed +4.4px, i.e. the first lean went AWAY from the board
//
// Settled by rendering the sheet and looking at it, which is what this rig's
// notes say to do and what `preview_monkey_spine.mjs <dir> alert` exists for.
//
// Inside the same budget as everything else here: this is a pose he HOLDS for
// most of a second, so it is smaller than the chest beat, not larger.
const ALERT_LEAN = -6; // torso, toward the board
const ALERT_TURN = 7; // head
const ALERT_HOLD_FROM = 0.42;
const ALERT_HOLD_TO = 0.78;
const ALERT_END = 1.1;

const alert = {
	bones: {
		// weight goes onto the leg nearer the board, and the whole body with it.
		// A dip first: he drops before he moves, which is what stops the shift
		// reading as the whole figure being slid sideways.
		hip: {
			translate: [
				{ time: 0, x: 0, y: 0 },
				{ time: 0.2, x: -4, y: 3 },
				{ time: ALERT_HOLD_FROM, x: -11, y: -2 },
				{ time: ALERT_HOLD_TO, x: -11, y: -2 },
				{ time: ALERT_END, x: 0, y: 0 },
			],
		},
		torso: {
			rotate: [
				{ time: 0, value: 0 },
				{ time: ALERT_HOLD_FROM, value: ALERT_LEAN },
				{ time: ALERT_HOLD_TO, value: ALERT_LEAN },
				{ time: ALERT_END, value: 0 },
			],
			// a breath in: the chest rises as he takes notice
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
				{ time: 0.16, value: -2 }, // a flick the other way first
				{ time: 0.4, value: ALERT_TURN },
				{ time: ALERT_HOLD_TO, value: ALERT_TURN },
				{ time: ALERT_END, value: 0 },
			],
			// the tilt alone reads as a tilt; the shift is what makes it a look
			translate: [
				{ time: 0, x: 0, y: 0 },
				{ time: 0.4, x: -14, y: 3 },
				{ time: ALERT_HOLD_TO, x: -14, y: 3 },
				{ time: ALERT_END, x: 0, y: 0 },
			],
		},
		// the near shoulder comes up and the far one drops, so the body squares to
		// the wheel without either arm leaving the coat
		armL: {
			rotate: [
				{ time: 0, value: 0 },
				{ time: ALERT_HOLD_FROM, value: -6 },
				{ time: ALERT_HOLD_TO, value: -6 },
				{ time: ALERT_END, value: 0 },
			],
		},
		armR: {
			rotate: [
				{ time: 0, value: 0 },
				{ time: ALERT_HOLD_FROM + LEAD, value: 4 },
				{ time: ALERT_HOLD_TO, value: 4 },
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
		armR_fore: {
			rotate: [
				{ time: 0, value: 0 },
				{ time: ALERT_HOLD_FROM + DRAG + LEAD, value: hang(4) },
				{ time: ALERT_HOLD_TO, value: hang(4) },
				{ time: ALERT_END, value: 0 },
			],
		},
		// the weight actually arrives somewhere: the near leg compresses, the far
		// one lengthens as it unloads
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

// throwit: he produces the mine and pitches it at the board.
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
		mine: {
			attachment: [
				{ time: 0, name: null },
				{ time: APPEAR_AT, name: 'mine' },
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

// ── MARCH IN PLACE ──────────────────────────────────────────────────────────
//
// His resting state for the whole of the free spins (Mascot.svelte loops it
// there in place of idle, and cuts to the cheer only for a big win). Not used
// in the base game.
//
// Seen from the front a knee cannot come up by rotating anything — rotating the
// thigh swings the leg out sideways and pulls it out from under the coat
// (measured: from ~30 degrees the hip visibly parts). The jump already solved
// this the only way a front view allows: FORESHORTENING. Scaling the thigh bone
// shortens the whole leg below it, so the boot leaves the ground as if the knee
// were coming toward the camera. At 0.83 the boot clears the floor plainly and
// the leg still reads as a leg; much past that it reads as squashed.
//
// The arms keep time with a small sideways swing, opposite to the legs, inside
// the shoulder budget and with the forearm hanging (hang()). Nothing is swapped
// and nothing leaves its budget, so there is nothing to show a dark seam.
//
// IT LOOPS, so it is built to close on itself: four steps exactly fill the clip,
// every key at 0 and at the end is the rest pose, and no key sits past the end
// (the forearm's DRAG is folded back inside the clip) — a key beyond it would
// make the clip longer than the stride and put a hitch in every fourth step.
const MARCH_STEPS = 4;
const MARCH_STEP = 0.5;
const MARCH_LIFT = 0.83; // thigh length at the top of the step
const MARCH_SWING = 7; // degrees of arm swing
const MARCH_END = MARCH_STEPS * MARCH_STEP;
const stepAt = (i) => i * MARCH_STEP;
const LEFT_STEPS = [0, 2];
const RIGHT_STEPS = [1, 3];

// one leg: lifts on its own steps, planted on the others
const legKeys = (mine) => [
	{ time: 0, x: 1, y: 1 },
	...mine.flatMap((i) => [
		...(stepAt(i) > 0 ? [{ time: stepAt(i), x: 1, y: 1 }] : []),
		{ time: stepAt(i) + 0.2, x: 1.02, y: MARCH_LIFT },
		{ time: stepAt(i) + 0.42, x: 1, y: 1 },
	]),
	{ time: MARCH_END, x: 1, y: 1 },
];
// the boot comes a little nearer the lens as it lifts
const footKeys = (mine) => [
	{ time: 0, x: 1, y: 1 },
	...mine.flatMap((i) => [
		...(stepAt(i) > 0 ? [{ time: stepAt(i), x: 1, y: 1 }] : []),
		{ time: stepAt(i) + 0.2, x: 1.06, y: 1.06 },
		{ time: stepAt(i) + 0.42, x: 1, y: 1 },
	]),
	{ time: MARCH_END, x: 1, y: 1 },
];
// arm swings out while the OPPOSITE leg lifts; `out` is the outward sign
const swingKeys = (out, mine) => [
	{ time: 0, value: 0 },
	...[0, 1, 2, 3].map((i) => ({
		time: stepAt(i) + 0.2,
		value: mine.includes(i) ? out * MARCH_SWING : -out * MARCH_SWING * 0.5,
	})),
	{ time: MARCH_END, value: 0 },
];
// the forearm trails the shoulder by DRAG, except at the two ends of the clip,
// which have to be the rest pose for the loop to close
const hangKeys = (keys) =>
	keys.map((k) =>
		k.time === 0 || k.time === MARCH_END
			? { time: k.time, value: 0 }
			: { time: +(k.time + DRAG).toFixed(3), value: hang(k.value) },
	);

const marchArmR = swingKeys(1, LEFT_STEPS);
const marchArmL = swingKeys(-1, RIGHT_STEPS);

const march = {
	bones: {
		legL: { scale: legKeys(LEFT_STEPS) },
		legR: { scale: legKeys(RIGHT_STEPS) },
		legL_foot: { scale: footKeys(LEFT_STEPS) },
		legR_foot: { scale: footKeys(RIGHT_STEPS) },
		// a small bob: down as each boot lands
		hip: {
			translate: [
				{ time: 0, x: 0, y: 0 },
				...[0, 1, 2, 3].flatMap((i) => [
					{ time: stepAt(i) + 0.2, x: 0, y: 2 },
					{ time: stepAt(i) + 0.44, x: 0, y: -5 },
				]),
				{ time: MARCH_END, x: 0, y: 0 },
			],
		},
		// weight over the standing leg
		torso: {
			rotate: [
				{ time: 0, value: 0 },
				...[0, 1, 2, 3].map((i) => ({
					time: stepAt(i) + 0.2,
					value: LEFT_STEPS.includes(i) ? -1.5 : 1.5,
				})),
				{ time: MARCH_END, value: 0 },
			],
		},
		armR: { rotate: marchArmR },
		armL: { rotate: marchArmL },
		armR_fore: { rotate: hangKeys(marchArmR) },
		armL_fore: { rotate: hangKeys(marchArmL) },
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


// ── THE SCARF AND THE BANANA MOVE ON THEIR OWN ──────────────────────────────
//
// They used to be rigid pieces glued to the torso and the head: whatever the
// body did they did, exactly, and never anything of their own — which is why
// the whole figure read as stiff. The rule measured off Hacksaw's cast (see
// wp/.claude/skills/mesh-cast-rig §3) is that the body barely moves and the
// amplitude goes to what HANGS off it, a beat late.
//
// So the three pieces that hang are MESHES now, not regions — one image each,
// deforming, no seams — weighted between the body and bones of their own:
//
//   scarf_l / scarf_r    the two pairs of neckerchief tails (torso_0 and
//   (+ _tip children)    torso_4), hanging from the knot under the chin
//   banana               the banana, from where it is held in his teeth
//
// Those bones move two ways at once, and neither needs any other animation to
// know about them:
//
//   · PHYSICS CONSTRAINTS (Spine 4.2): the tails and the banana have inertia.
//     When the body moves — the chest beat, the march, the jump in the cheer —
//     they lag, overshoot and settle on their own.
//   · `flutter`, a loop on TRACK 1 (Mascot.svelte), always playing: a slow
//     breeze through the tails and a chew of the banana, so he is never
//     perfectly still even standing at idle in the base game.
//
// WHICH PIXELS FOLLOW is read off the art, not traced: the neckerchief is
// brown (red over blue) and the lapel it lies on is navy (blue over red), so
// a vertex's weight to the tails is how brown the art is around it, times how
// far it hangs below the knot. The knot itself stays put.
const FLUTTER_LOOP = 4.8;
const MESH_CELL = 8; // px of PSD per mesh cell

const KNOT = [322, 298];
const TAILS = {
	scarf_l: { tip: [296, 390] },
	scarf_r: { tip: [372, 380] },
};
// THE COLLAR: the left lapel's standing point. The coat is painted in full
// underneath it (checked by rendering without torso_0), so it can lift and
// settle without opening a hole. It hinges near the knot and the point moves.
const COLLAR_BASE = [262, 300];
const COLLAR_TIP = [178, 140];
// ...and the right one, which is not a piece of its own: it is painted into
// the coat (torso_5_trunk), rising behind the right of his head. So the coat is
// a mesh too, and only its collar point is weighted to move.
const COLLAR_R_BASE = [412, 246];
const COLLAR_R_TIP = [385, 148];
const MOUTH = [292, 222];
const BANANA_TIP = [210, 298];

// a new bone, pointing from `from` to `to`, with its length — rotation physics
// needs both
const extraBones = [];
const extraWorld = {};
const addBone = (name, parent, from, to) => {
	const a = toSpine(from[0], from[1]);
	const b = toSpine(to[0], to[1]);
	const rot = (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI;
	const len = Math.hypot(b.x - a.x, b.y - a.y);
	const pw = extraWorld[parent] ?? { ...jointWorld[parent], rot: 0 };
	// local position in the parent's frame
	const pr = (-pw.rot * Math.PI) / 180;
	const dx = a.x - pw.x, dy = a.y - pw.y;
	extraBones.push({
		name,
		parent,
		x: +(dx * Math.cos(pr) - dy * Math.sin(pr)).toFixed(2),
		y: +(dx * Math.sin(pr) + dy * Math.cos(pr)).toFixed(2),
		rotation: +(rot - pw.rot).toFixed(2),
		length: +len.toFixed(2),
	});
	extraWorld[name] = { x: a.x, y: a.y, rot };
};
for (const [name, { tip }] of Object.entries(TAILS)) {
	const mid = [(KNOT[0] + tip[0]) / 2, (KNOT[1] + tip[1]) / 2];
	addBone(name, 'torso', KNOT, mid);
	addBone(`${name}_tip`, name, mid, tip);
}
addBone('banana', 'head', MOUTH, BANANA_TIP);
addBone('collar', 'torso', COLLAR_BASE, COLLAR_TIP);
addBone('collar_r', 'torso', COLLAR_R_BASE, COLLAR_R_TIP);

// ── THE CLOTHES MOVE ────────────────────────────────────────────────────────
//
// Asked for 2026-09-27: "can the character's clothes and accessories move with
// the mesh method, so he is more fun to watch". The neckerchief, the collars
// and the banana already did; the rest of his kit was rigid plates, turning
// as cards about their joints. Now four more pieces are weighted meshes, each
// with a free end on a bone of its own that has physics on it (GoBananaut's
// and GoBoomana's sleeves, the same method):
//
//   sleeves   the cap stays on the TORSO within CLOTH_HOLD px of the shoulder,
//             hands over to the arm over CLOTH_BLEND, and the rolled cuff at
//             the bottom goes on to cuffL / cuffR — so a sleeve bends where it
//             joins the coat, and its cuff swings a beat behind every punch
//   trousers  the waistband on the HIP, the middle on the leg, the baggy lower
//             half on pantL / pantR
//   coat skirt  the flare of the coat below the belt (torso_3_coat) on skirtL /
//             skirtR, split about the buttons — it flicks out on the march and
//             the cheer's jump and swings back
//
// and the EYES BLINK: head_5_eye is its own layer, and the face painted under
// it has closed lids, so fading the layer out for a moment is a blink (keyed
// in `flutter`).
const CLOTH_HOLD = 18;
const CLOTH_BLEND = 70;
const CLOTH = [
	{ piece: 'left_arm_0_upper_arm', body: 'torso', limb: 'armL', hem: 'cuffL', hemFrom: 0.56, hemOver: 0.4, from: [86, 362], to: [80, 424] },
	{ piece: 'right_arm_0_upper_arm', body: 'torso', limb: 'armR', hem: 'cuffR', hemFrom: 0.56, hemOver: 0.4, from: [468, 356], to: [476, 424] },
	{ piece: 'left_leg_0_thigh', body: 'hip', limb: 'legL', hem: 'pantL', hemFrom: 0.45, hemOver: 0.4, from: [212, 620], to: [206, 700] },
	{ piece: 'right_leg_0_thigh', body: 'hip', limb: 'legR', hem: 'pantR', hemFrom: 0.45, hemOver: 0.4, from: [370, 620], to: [376, 708] },
];
for (const c of CLOTH) addBone(c.hem, c.limb, c.from, c.to);
// the skirt: hangs from the belt, one flap either side of the buttons
const BELT_Y = 540;
const SKIRT_MID = 290;
addBone('skirtL', 'torso', [200, BELT_Y], [186, 622]);
addBone('skirtR', 'torso', [380, BELT_Y], [396, 622]);
bones.push(...extraBones);
const boneIndex = Object.fromEntries(bones.map((b, i) => [b.name, i]));
const worldOf = (name) => extraWorld[name] ?? { ...jointWorld[name], rot: 0 };

const smooth01 = (v) => {
	const t = Math.max(0, Math.min(1, v));
	return t * t * (3 - 2 * t);
};
// how far a PSD point hangs past `from` along the direction to `to`, 0..1 at `to`
const along = (p, from, to) => {
	const dx = to[0] - from[0], dy = to[1] - from[1];
	return ((p[0] - from[0]) * dx + (p[1] - from[1]) * dy) / (dx * dx + dy * dy);
};

// A weighted grid mesh over one piece. `weights(p, rgba)` gives, for a PSD
// point, the extra bones' weights; whatever is left goes to the piece's own
// bone. Colours are sampled blurred (r = 6px) so weights are smooth.
const meshAttachment = (layerName, weights) => {
	const l = piece(layerName);
	const img = PNG.sync.read(fs.readFileSync(path.join(SRC, l.file)));
	const sample = (x, y) => {
		let r = 0, g = 0, b = 0, a = 0;
		for (let dy = -6; dy <= 6; dy += 2)
			for (let dx = -6; dx <= 6; dx += 2) {
				const xi = Math.round(x - l.x + dx), yi = Math.round(y - l.y + dy);
				if (xi < 0 || yi < 0 || xi >= img.width || yi >= img.height) continue;
				const i = (yi * img.width + xi) * 4;
				const al = img.data[i + 3] / 255;
				r += img.data[i] * al;
				g += img.data[i + 1] * al;
				b += img.data[i + 2] * al;
				a += al;
			}
		return a > 0 ? [r / a, g / a, b / a, a] : [0, 0, 0, 0];
	};
	const own = boneOf[layerName];
	const cols = Math.max(2, Math.round(l.w / MESH_CELL));
	const rows = Math.max(2, Math.round(l.h / MESH_CELL));
	const uvs = [], vertices = [], triangles = [];
	// Pass 1: weights where there is art. Pass 2: every vertex in the AIR takes
	// the weights of the nearest vertex that has art, so the transparent margin
	// moves with the edge beside it instead of pinning it in place (a pinned
	// margin drags the edge back as a smear — the skill's "air follows the
	// nearest part").
	const V = (cols + 1) * (rows + 1);
	const pts = [], alpha = [], raw = [];
	for (let r = 0; r <= rows; r++)
		for (let c = 0; c <= cols; c++) {
			const u = c / cols, v = r / rows;
			const p = [l.x + u * l.w, l.y + v * l.h];
			uvs.push(+u.toFixed(5), +v.toFixed(5));
			const rgba = sample(p[0], p[1]);
			pts.push(p);
			alpha.push(rgba[3]);
			raw.push(rgba[3] > 0.05 ? weights(p, rgba) : null);
		}
	const inked = [];
	for (let i = 0; i < V; i++) if (raw[i]) inked.push(i);
	for (let i = 0; i < V; i++) {
		if (raw[i]) continue;
		let best = -1, bd = Infinity;
		for (const j of inked) {
			const d = Math.hypot(pts[i][0] - pts[j][0], pts[i][1] - pts[j][1]);
			if (d < bd) { bd = d; best = j; }
		}
		raw[i] = best >= 0 ? raw[best] : {};
	}
	for (let i = 0; i < V; i++) {
		const p = pts[i];
		const extra = raw[i];
		let rest = 1;
		const list = [];
		for (const [name, w] of Object.entries(extra)) {
			if (w <= 1e-4) continue;
			list.push([name, w]);
			rest -= w;
		}
		if (rest < -1e-6) throw new Error(`${layerName}: weights over 1 at ${p}`);
		if (rest > 1e-4) list.push([own, rest]);
		const s = toSpine(p[0], p[1]);
		vertices.push(list.length);
		for (const [name, w] of list) {
			const bw = worldOf(name);
			const a = (-bw.rot * Math.PI) / 180;
			const dx = s.x - bw.x, dy = s.y - bw.y;
			vertices.push(
				boneIndex[name],
				+(dx * Math.cos(a) - dy * Math.sin(a)).toFixed(2),
				+(dx * Math.sin(a) + dy * Math.cos(a)).toFixed(2),
				+w.toFixed(4),
			);
		}
	}
	for (let r = 0; r < rows; r++)
		for (let c = 0; c < cols; c++) {
			const a = r * (cols + 1) + c, b = a + 1, d = a + cols + 1, e = d + 1;
			triangles.push(a, d, b, b, d, e);
		}
	attachments[layerName] = {
		[layerName]: { type: 'mesh', uvs, triangles, vertices, width: l.w, height: l.h },
	};
};

// THE TAILS: everything inside the tails' own outline below the knot — the
// brown AND its black ink edge — except the navy of the lapel where the left
// tail lies over it. The first version picked the tails by colour alone
// ("brown"), and it was wrong twice over: the lapel's worn highlights are warm
// too and swung with the scarf far from it, and the tails' own black outline
// is not brown, stayed pinned to the coat and tore every edge the moment a
// tail moved. Split left/right about the knot; each tail hands its lower half
// to its tip bone.
// Drawn well OUTSIDE the tails on their free sides (left and bottom run past
// the art): its soft edge pins what it passes through, and the first zone ran
// its left edge straight down the left tail's outline, which then tore at
// every swing. The lapel under that side is kept out by colour (navy), not by
// the zone.
const TAIL_ZONE = [[286, 286], [352, 274], [398, 334], [400, 412], [250, 412], [250, 350], [274, 318]];
const inPoly = (pts, [x, y]) => {
	let inside = false;
	for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
		const [xi, yi] = pts[i], [xj, yj] = pts[j];
		if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
	}
	return inside;
};
// distance from a point to a polygon's edge, for a soft zone border
const edgeDist = (pts, [x, y]) => {
	let best = Infinity;
	for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
		const [ax, ay] = pts[j], [bx, by] = pts[i];
		const dx = bx - ax, dy = by - ay;
		const t = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy)));
		best = Math.min(best, Math.hypot(ax + t * dx - x, ay + t * dy - y));
	}
	return best;
};
const tailWeightsFor = (layerName) => (p, [r, , b]) => {
	if (!inPoly(TAIL_ZONE, p)) return {};
	const zone = smooth01(edgeDist(TAIL_ZONE, p) / 8);
	const hang = smooth01((Math.hypot(p[0] - KNOT[0], p[1] - KNOT[1]) - 10) / 30);
	// THE LEFT TAIL SWINGS ONLY BELOW THE LAPEL. Its upper half lies against
	// the lapel's edge in the same image with no gap between them, so any
	// swing there has nowhere to go but through the lapel (measured: the
	// lapel folded to -75% in the chest beat). Below the lapel's corner, at
	// y 368, it hangs in open air, and that is the part that swings.
	//
	// Then the lapel's corner — which the left tail lies against, in the same
	// image, with no gap — is not held still but CARRIED, a little: its weight
	// falls off over 30px into the lapel. Holding it still (the first two
	// versions) either froze the left tail's upper half, which read as a
	// one-sided scarf, or tore the tail where the hold began. Carried, the
	// corner of the lapel lifts with the scarf lying on it, which is what cloth
	// under cloth does.
	const leftGuard = layerName !== 'torso_0_decoration' ? 1 : smooth01((p[0] - 262) / 30);
	const w = zone * hang * leftGuard;
	if (w <= 0) return {};
	const dl = along(p, KNOT, TAILS.scarf_l.tip), dr = along(p, KNOT, TAILS.scarf_r.tip);
	const toR = smooth01((p[0] - KNOT[0] + 8) / 20);
	const out = {};
	const split = (name, share, t) => {
		const tip = smooth01((t - 0.4) / 0.35);
		out[name] = share * w * (1 - tip);
		out[`${name}_tip`] = share * w * tip;
	};
	split('scarf_l', 1 - toR, dl);
	split('scarf_r', toR, dr);
	return out;
};
// torso_0 is the lapel AND the knot and front tails: the tails zone goes to
// the scarf, the rest of it (the lapel) to the collar, more toward its point
meshAttachment('torso_0_decoration', (p, rgba) => {
	if (inPoly(TAIL_ZONE, p)) return tailWeightsFor('torso_0_decoration')(p, rgba);
	const lift = smooth01((along(p, COLLAR_BASE, COLLAR_TIP) - 0.12) / 0.6);
	// fades to nothing toward the tails zone, so the knot stays put
	const clear = smooth01((edgeDist(TAIL_ZONE, p) - 4) / 20);
	return { collar: lift * clear };
});
meshAttachment('torso_4_decoration', tailWeightsFor('torso_4_decoration'));
meshAttachment('torso_5_trunk', (p) => {
	if (p[1] > 256 || p[0] < 350) return {};
	const lift = smooth01((along(p, COLLAR_R_BASE, COLLAR_R_TIP) - 0.12) / 0.6);
	return { collar_r: lift * smooth01((p[0] - 356) / 40) * smooth01((256 - p[1]) / 14) };
});
// the banana: all of it but the end in his teeth
meshAttachment('head_0_decoration', (p) => ({
	banana: smooth01((along(p, MOUTH, BANANA_TIP) - 0.04) / 0.3),
}));

// THE CLOTHES (see "THE CLOTHES MOVE"). RIGID_CLOTH=1 builds the old plates,
// for before/after renders.
if (!process.env.RIGID_CLOTH) {
	for (const c of CLOTH) {
		const l = piece(c.piece);
		const joint = RIG.find((b) => b.name === c.limb).at;
		meshAttachment(c.piece, (p) => {
			const onLimb = smooth01((Math.hypot(p[0] - joint[0], p[1] - joint[1]) - CLOTH_HOLD) / CLOTH_BLEND);
			const onHem = smooth01(((p[1] - l.y) / l.h - c.hemFrom) / c.hemOver);
			// what is not the body's or the hem's stays on the limb (the piece's own bone)
			return { [c.body]: 1 - onLimb, [c.hem]: onLimb * onHem };
		});
		// the chest beat's front copy of the right sleeve deforms with it: the same
		// mesh on its own (trimmed) region
		if (FRONT_COPIES.includes(c.piece)) {
			const f = frontName(c.piece);
			attachments[f] = { [f]: { ...attachments[c.piece][c.piece] } };
		}
	}
	// the coat below the belt, left and right of the buttons
	meshAttachment('torso_3_coat', (p) => {
		const hang = smooth01((p[1] - BELT_Y) / 60);
		if (hang <= 0) return {};
		const toR = smooth01((p[0] - SKIRT_MID + 30) / 60);
		return { skirtL: hang * (1 - toR), skirtR: hang * toR };
	});
}

// PHYSICS: inertia on every hanging bone. The tips carry more (they are the
// free ends), the banana far less (it is gripped).
const physics = [
	// Tuned with ALL seven running (see `order` in the skeleton below). The
	// first settings were chosen while only the first one ran, and with every
	// constraint live they threw the right tail to 32 degrees and the right
	// collar through itself in the cheer. Stiffer upper bones, the whip kept in
	// the tips.
	{ name: 'scarf_l_phys', bone: 'scarf_l', rotate: 1, inertia: 0.18, strength: 230, damping: 0.8, mass: 2 },
	{ name: 'scarf_l_tip_phys', bone: 'scarf_l_tip', rotate: 1, inertia: 0.35, strength: 120, damping: 0.8, mass: 2 },
	{ name: 'scarf_r_phys', bone: 'scarf_r', rotate: 1, inertia: 0.18, strength: 230, damping: 0.8, mass: 2 },
	{ name: 'scarf_r_tip_phys', bone: 'scarf_r_tip', rotate: 1, inertia: 0.35, strength: 120, damping: 0.8, mass: 2 },
	{ name: 'collar_r_phys', bone: 'collar_r', rotate: 1, inertia: 0.08, strength: 320, damping: 0.8, mass: 1.5 },
	{ name: 'collar_phys', bone: 'collar', rotate: 1, inertia: 0.2, strength: 220, damping: 0.8, mass: 1.5 },
	{ name: 'banana_phys', bone: 'banana', rotate: 1, inertia: 0.25, strength: 180, damping: 0.78, mass: 1 },
	// THE CLOTHES: hems loose enough to swing a beat behind the limb, stiff
	// enough that a cuff never lifts off the fist or a trouser hem off the boot
	// top under it; the skirt the loosest, it is the widest free edge he has
	{ name: 'cuffL_phys', bone: 'cuffL', rotate: 1, inertia: 0.22, strength: 320, damping: 0.86, mass: 1 },
	{ name: 'cuffR_phys', bone: 'cuffR', rotate: 1, inertia: 0.22, strength: 320, damping: 0.86, mass: 1 },
	{ name: 'pantL_phys', bone: 'pantL', rotate: 1, inertia: 0.35, strength: 180, damping: 0.82, mass: 1.2 },
	{ name: 'pantR_phys', bone: 'pantR', rotate: 1, inertia: 0.35, strength: 180, damping: 0.82, mass: 1.2 },
	{ name: 'skirtL_phys', bone: 'skirtL', rotate: 1, inertia: 0.32, strength: 220, damping: 0.82, mass: 1.5 },
	{ name: 'skirtR_phys', bone: 'skirtR', rotate: 1, inertia: 0.32, strength: 220, damping: 0.82, mass: 1.5 },
];

// THE FLUTTER, on track 1, forever. Whole cycles of FLUTTER_LOOP only, so it
// loops without a seam; the two tails are out of phase and the tips lag.
const flutterKeys = (amp, n, phase, steps = 24) =>
	Array.from({ length: steps + 1 }, (_, i) => {
		const t = (FLUTTER_LOOP * i) / steps;
		return { time: +t.toFixed(4), value: +(amp * Math.sin((2 * Math.PI * n * t) / FLUTTER_LOOP + phase)).toFixed(3) };
	});
// the chew: two quick bites, then a rest, once a loop
const chew = (() => {
	const keys = [];
	for (let i = 0; i <= 48; i++) {
		const t = (FLUTTER_LOOP * i) / 48;
		const bite = (t0) => {
			const u = (t - t0) / 0.22;
			return u > 0 && u < 1 ? Math.sin(Math.PI * u) : 0;
		};
		// two bites of ~16 degrees (~10px on screen at the tip), and a slow
		// waggle between them so the banana is never parked
		keys.push({ time: +t.toFixed(4), value: +(16 * (bite(0.6) + 0.8 * bite(0.95)) + 3.5 * Math.sin((2 * Math.PI * 2 * t) / FLUTTER_LOOP)).toFixed(3) });
	}
	return keys;
})();
const flutter = {
	bones: {
		// Sized for the SCREEN, not the art: he is drawn at about a third of the
		// PSD, and the first pass (2-3 degrees) moved the tails ~2px there —
		// correct and invisible. The free ends now travel ~7px on screen.
		// The two tails move with ONE breeze, a beat apart — not on two clocks.
		// Swinging in opposite directions they pinched the V between them at the
		// knot to 13% of its area; in step, they open and close it together.
		scarf_l: { rotate: flutterKeys(3, 2, 0) },
		scarf_l_tip: { rotate: flutterKeys(9, 2, -0.9) },
		scarf_r: { rotate: flutterKeys(5, 2, -0.35) },
		scarf_r_tip: { rotate: flutterKeys(8, 2, -1.2) },
		banana: { rotate: chew },
		// the collar point lifts in the breeze, out of step with the tails
		collar: { rotate: flutterKeys(4.5, 2, 2.4) },
		// the right point, mirrored and out of step with the left
		collar_r: { rotate: flutterKeys(4.5, 2, 0.7) },
		// the clothes drift, each on its own phase so nothing moves in step
		cuffL: { rotate: flutterKeys(2, 1, 0.3) },
		cuffR: { rotate: flutterKeys(2, 1, 2.0) },
		pantL: { rotate: flutterKeys(1.5, 1, 3.6) },
		pantR: { rotate: flutterKeys(1.5, 1, 5.1) },
		skirtL: { rotate: flutterKeys(2.5, 2, 1.4) },
		skirtR: { rotate: flutterKeys(2.5, 2, 2.9) },
	},
	// THE BLINK: one, then later a double, once a loop — never on a beat, so it
	// does not read as a clock. Fading the eyes out uncovers the closed lids
	// painted on the face; 90ms down and up is a blink, not a wink.
	slots: {
		head_5_eye: {
			rgba: [
				[0, 1],
				[1.3, 1],
				[1.36, 0],
				[1.42, 0],
				[1.5, 1],
				[3.7, 1],
				[3.76, 0],
				[3.8, 0],
				[3.88, 1],
				[4.02, 1],
				[4.08, 0],
				[4.12, 0],
				[4.2, 1],
				[FLUTTER_LOOP, 1],
			].map(([time, a]) => ({ time, color: `ffffff${Math.round(a * 255).toString(16).padStart(2, '0')}` })),
		},
	},
};

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
	// EVERY CONSTRAINT NEEDS ITS OWN `order`. Spine sorts constraints by order
	// and takes only the FIRST one it finds at each number (Skeleton.updateCache,
	// `continue outer`); left unset they are all 0, so only scarf_l_phys ran and
	// the other six were dropped without a word.
	physics: physics.map((c, order) => ({ ...c, order })),
	skins: [{ name: 'default', attachments }],
	animations: Object.fromEntries(
			Object.entries({ idle, cheer, chestbeat, nod, alert, throwit, march, flutter, ...sweeps }).map(([name, a]) => [
				name,
				// idle is the only one that loops, so it is the only one whose ends
				// have to meet.
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
