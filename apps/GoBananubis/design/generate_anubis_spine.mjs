// The jackal-god mascot: a cutout Spine rig built from anubis.psd.
//
//   py -3 design/extract_character_psd.py <psd> anubis   # once, writes design/source/anubis
//   node design/generate_anubis_spine.mjs <dir with node_modules for pngjs>
//
// The PSD arrives as separate body parts with no skeleton - "spine pieces", not a
// spine. This builds the skeleton: packs the pieces into one atlas page and emits
// a Spine 4.1 JSON with a bone per joint, the artist's own layout preserved, and
// the animation set the game already drives (idle, cheer, chestbeat, nod,
// throwit - see Mascot.svelte).
//
// It replaces the jungle sergeant this game inherited from GoBananas. Same
// character generator, same layer naming, a different body: taller (926 units of
// canvas against 846), heavier through the forearms, and with its own joints.
// Nothing below is carried over from the gorilla rig as a number - every joint is
// read off THIS drawing, and the pose budget was re-measured against it.
//
// WHY A RIG AND NOT A STILL
//
// Certification called out poor animation. A painted character standing perfectly
// still beside a board that is moving is worse than no character - it reads as a
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
// The PSD is 560x928 with y increasing DOWNWARD from the top-left. Spine has y
// increasing UPWARD from the skeleton origin, which is placed on the ground under
// the body's centre line (ROOT below) so the character can be positioned by its
// ground contact rather than by the corner of a canvas.
//
// Every joint below is read off the piece alpha in design/source/anubis - the
// centre of the span a limb occupies a little way inside its own top edge - so
// the rig follows the artist's drawing instead of numbers invented here. Bones
// are all unrotated in setup pose, so each attachment is simply its piece's
// centre relative to its bone, and an animation rotating a bone pivots the art
// about the real joint.
//
// CALIBRATION
//
//   node design/generate_anubis_spine.mjs <tooldir> --calibrate
//
// adds `sweepShoulder` and `sweepElbow` to the skeleton: linear sweeps from 0 to
// 80 degrees, so design/preview_anubis_spine.mjs can render the drawing at each
// angle and the pose budget can be READ rather than guessed. See MAX_SHOULDER.
// They are off by default so nothing ships with them.
import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const toolDir = process.argv[2];
if (!toolDir) {
	console.error('usage: node design/generate_anubis_spine.mjs <dir with node_modules/pngjs> [--calibrate]');
	process.exit(1);
}
const CALIBRATE = process.argv.includes('--calibrate');
const require = createRequire(path.join(toolDir, 'noop.js'));
const { PNG } = require('pngjs');

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(appRoot, 'design/source/anubis');
const OUT = path.join(appRoot, 'static/assets/spines/goBananubisAnubis');
fs.mkdirSync(OUT, { recursive: true });

// One image that is not a body part: the scarab he throws. Packed into this
// atlas rather than referenced from the symbol set, because a Spine skin can
// only draw regions from its own atlas.
const PROPS = [
	{
		name: 'scarab',
		file: path.join(appRoot, 'static/assets/sprites/goBananasSymbolsV3/scarab.png'),
		bone: 'prop',
		// skeleton units — about a fifth of his height, which is a scarab in a
		// gorilla's fist rather than a melon. 184 rather than the 168 the sergeant
		// used: this figure is 926 units tall against his 846, and a prop that does
		// not scale with the hand holding it shrinks every time the art changes.
		size: 184,
	},
];

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

// Skeleton origin on the PSD canvas: on the ground, under the body's centre line.
//
// x is the CENTRE LINE (the trunk spans 107..458 and the face 148..421 — both
// give 283), not the midpoint of the two feet. The right foot is splayed
// outward, so the feet average to 290; hanging the skeleton there puts the head
// seven units off the axis the whole figure is drawn about, and every torso
// rotation then swings it. y is the lowest foot pixel, so the placement in
// Mascot.svelte plants him on a floor rather than near one.
const ROOT = { x: 284, y: 926 };
const toSpine = (x, y) => ({ x: x - ROOT.x, y: ROOT.y - y });

// ── the skeleton ────────────────────────────────────────────────────────────
//
// `at` is the joint in PSD pixels. `parts` are the pieces that ride on that bone.
// Torso and head each carry several pieces (the nemes lappets behind the
// shoulders, the trunk, the usekh collar; face, headdress, ears, uraeus, banana)
// — they are separate layers so they can be drawn in the right order, not
// because they move independently.
//
// Shoulder and hip joints are pulled slightly INSIDE the piece from its top edge:
// a limb rotating about the exact top corner of its own artwork tears away from
// the body, because the art overlaps the joint it hangs from. Roughly an eighth
// of the piece's height in, and centred on the span the ALPHA covers at that
// depth rather than on the bounding box — on a limb drawn at an angle the box
// centre is somewhere the limb never is.
const RIG = [
	{ name: 'hip', parent: 'root', at: [284, 496], parts: [] },
	// The waist, at the belt. Everything above it leans and breathes about here.
	{ name: 'torso', parent: 'hip', at: [284, 470], parts: [
		'torso_4_decoration', 'torso_0_trunk', 'torso_5_decoration',
	] },
	// The base of the skull, just above the jaw (the face piece ends at y=294).
	// The whole headdress rides it: nemes, ears, uraeus — and the banana in his
	// mouth, which is drawn as a head piece and so turns with the head instead of
	// hanging in the air when he looks around.
	{ name: 'head', parent: 'torso', at: [285, 280], parts: [
		'head_1_face', 'head_3_hair', 'head_0_ear', 'head_4_decoration', 'head_5_decoration',
	] },

	{ name: 'armL', parent: 'torso', at: [122, 248], parts: ['left_arm_0_upper_arm'] },
	{ name: 'armL_fore', parent: 'armL', at: [61, 386], parts: ['left_arm_1_forearm'] },
	{ name: 'armL_hand', parent: 'armL_fore', at: [110, 515], parts: ['left_arm_2_hand'] },
	// Carries the scarab, so it follows the hand exactly rather than being
	// chased by something outside the skeleton trying to guess where the hand is.
	// Offset into the fist, and it exists only to be scaled - the pop as the
	// scarab appears is this bone growing, since a slot cannot be scaled.
	{ name: 'prop', parent: 'armL_hand', at: [108, 565], parts: [] },

	{ name: 'armR', parent: 'torso', at: [424, 252], parts: ['right_arm_0_upper_arm'] },
	{ name: 'armR_fore', parent: 'armR', at: [490, 430], parts: ['right_arm_1_forearm'] },
	{ name: 'armR_hand', parent: 'armR_fore', at: [505, 505], parts: ['right_arm_2_hand'] },

	{ name: 'legL', parent: 'hip', at: [212, 500], parts: ['left_leg_0_thigh'] },
	{ name: 'legL_calf', parent: 'legL', at: [185, 652], parts: ['left_leg_1_calf'] },
	{ name: 'legL_foot', parent: 'legL_calf', at: [177, 812], parts: ['left_leg_2_foot'] },

	{ name: 'legR', parent: 'hip', at: [374, 516], parts: ['right_leg_0_thigh'] },
	{ name: 'legR_calf', parent: 'legR', at: [391, 676], parts: ['right_leg_1_calf'] },
	{ name: 'legR_foot', parent: 'legR_calf', at: [396, 810], parts: ['right_leg_2_foot'] },
];


const boneOf = {};
for (const b of RIG) for (const p of b.parts) boneOf[p] = b.name;
const jointWorld = Object.fromEntries(RIG.map((b) => [b.name, toSpine(b.at[0], b.at[1])]));
jointWorld.root = { x: 0, y: 0 };

const bones = [{ name: 'root' }];
for (const b of RIG) {
	const w = jointWorld[b.name];
	const p = jointWorld[b.parent];
	bones.push({ name: b.name, parent: b.parent, x: +(w.x - p.x).toFixed(2), y: +(w.y - p.y).toFixed(2) });
}

// Slots in the PSD's own stacking order, so the character assembles exactly as
// the artist stacked it. Anything else and the collar ends up behind the chest,
// or the nemes lappets in front of the face.
const drawOrder = [...meta.layers].sort((a, b) => a.z - b.z);
const slots = drawOrder
	.filter((l) => boneOf[l.name])
	.map((l) => ({ name: l.name, bone: boneOf[l.name], attachment: l.name }));

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
fs.writeFileSync(path.join(OUT, 'anubis.png'), PNG.sync.write(page));

const atlas =
	`anubis.png\n` +
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
fs.writeFileSync(path.join(OUT, 'anubis.atlas'), atlas);

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
// The pieces are drawn in one rest pose and nothing else exists. A cutout rig can
// only rotate them, so every animation here lives inside what the DRAWING can
// carry, and three properties of this particular drawing set the limits:
//
//   · THE COLLAR IS RIGID AND IT IS ON THE TORSO. The usekh sits across both
//     shoulders and is one piece of the torso, so it does not follow an arm that
//     moves. At rest it covers the shoulder joints, which is what makes the
//     figure read as one body; swing an arm far enough and the joint comes out
//     from under it and a wedge of bare chest opens between the collar's outer
//     terminal and the top of the arm. This is the binding limit here, and it is
//     tighter than the same limit on the gorilla this rig replaces, whose vest
//     ended above the shoulder and so had nothing to tear away from.
//
//   · Each arm is one continuous mass of fur, painted hanging, tapering from a
//     wide shoulder down to a narrow wrist. Swing it far and the wide end is at
//     the top of a horizontal bar — the taper runs the wrong way and it reads as
//     a plank being rotated rather than as an arm being raised.
//
//   · A cutout rig has no depth. There is no way to pass a limb in front of the
//     torso and have it read as being in front.
//
// None of that is fixable in keyframes. It is fixable in the ANGLES, so every
// animation below stays inside a budget the drawing can carry, and the character
// comes from the body instead.
//
// These are MEASURED, not guessed. Build with --calibrate and render the sweeps:
//
//   node design/generate_anubis_spine.mjs <tooldir> --calibrate
//   node design/preview_anubis_spine.mjs <tooldir> sweepShoulder 1.0 1.7
//
// (the sweep runs 20 degrees per second, so that window is 20 to 34 degrees, one
// frame every two.) Read off that sheet:
//
//   20  clean — the collar still covers both shoulder joints
//   22  clean — the last angle with an unbroken silhouette on BOTH sides
//   24  the first notch: a pale wedge of chest between the collar's outer
//       terminal and the arm on the character's left
//   26  the notch is open on both sides and the collar's point overhangs nothing
//   30+ the shoulder has visibly left the body; by 34 the taper has inverted
//
// So 22, and the same exercise on `sweepElbow` gives 20. That one holds the
// shoulder at its own maximum while it sweeps, because an elbow judged against a
// hanging arm passes at angles that come apart the moment the shoulder moves. It
// fails differently from the shoulder: the forearm swings outward and away, and
// the concave notch where the upper arm ends stops being a bend and becomes a
// gap. Open at 22, unmistakable by 26.
//
// WHAT THIS COSTS, SAID PLAINLY
//
// 22 degrees is not a raised arm and it is nowhere near a fist over the head. The
// arms-in-the-air celebration is not available from this artwork, and no amount
// of keyframing gets it back — it needs the collar split off the torso onto its
// own shoulder-following pieces, which is an art change.
//
// So every animation here is carried by the BODY: the hip, the torso's squash and
// stretch, the head, and the timing between them. The arms only trail. That is a
// real constraint honestly worked within, not a compromise hidden in the middle
// of a file.
const MAX_SHOULDER = 22;
const MAX_ELBOW = 20;
//
// AND A THIRD BUDGET THIS DRAWING HAS THAT THE GORILLA DID NOT: THE LEAN
//
// The torso bone pivots at the belt, and the trunk piece includes the KILT,
// whose hem hangs 294 units below that pivot. The gorilla's torso pieces stopped
// 146 below his, so the same angle costs twice as much here: at 12 degrees the
// hem has swung 61 units sideways across thighs that have not moved, the crisp
// painted hem turns into the edge of a rotated plate rather than cloth, and a
// wedge of thigh opens on the inside of the swing.
//
//   node design/preview_anubis_spine.mjs <tooldir> sweepTorso 0 1.4
//
//    4  reads as a lean
//    8  the hem is visibly tilted but still reads as a kilt swinging with him
//   12  the hem is a straight edge cut across both thighs; it is a plate
//   16+ the belt no longer belongs to the hips underneath it
//
// So 8, and the throw - which was written for the gorilla at 12 - spends its
// range on the hip instead. This is the constraint that cost the most: on the
// old rig the torso was the cheap channel that made up for capped arms, and on
// this one it is nearly as tight as they are.
const MAX_LEAN = 8;
//
// The head has a budget too, measured the same way (`sweepHead`). The nemes is a
// rigid slab whose lappets sit INTO the collar, and the collar belongs to the
// torso: past about 14 the lappet lifts clear and the neck opens on the far side.
// Everything below stays at 10 or under, so this is a ceiling rather than a
// number anything is pressed against - but it is the reason none of them go
// looking for more.
const MAX_HEAD = 12;
//
// A HANGING FOREARM STAYS PLUMB
//
// The rest pose already has a bend at each elbow. Measured off the joints above,
// shoulder-to-elbow and elbow-to-wrist: 246 and 291 degrees on the left, 290 and
// 281 on the right. That bend is what makes the arm read as an arm.
//
// Rotating the forearm the SAME way as the shoulder cancels it. On the right,
// swing the shoulder +22 and the forearm inherits it (281 + 22 = 303); add
// another +20 and the forearm sits at 323 against an upper arm at 312 - the bend
// has flipped and the limb straightens into one bar. That is exactly the plank
// the shoulder budget exists to avoid, arrived at from the other end.
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
// at 246 degrees on the left and 290 on the right - both hanging down and away
// from the body - so "outward and up" is negative on the left and positive on
// the right.
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

// chestbeat: the way into the feature. Every Scatter trigger plays it, and it is
// the biggest thing he does.
//
// WHAT THE DRAWING WILL NOT DO, MEASURED BEFORE ANYTHING WAS KEYED
//
// Sweeping every shoulder/elbow pair inside the budget and reading the hand's
// drawing centre out of the rig: the left fist tops out at (-14, 418) and the
// right at (61, 386). The chest band is 456 to 578. So the fists DO NOT REACH
// THE CHEST, by about forty units at the very best, and no amount of keyframing
// closes that — the arm's rest bend points the forearm down and away, so raising
// the shoulder and folding the elbow do not add up to a raised hand.
//
// That is not a reason to key a weaker version of a chest beat. It is a reason to
// build the impact out of the things that DO have range:
//
//   · the HOLD. Every strike freezes for 70ms on its landing pose — two keys at
//     the same value. A comic impact is a frozen frame with a star on it, and
//     smooth interpolation through the landing is what made the old version read
//     as vibration. This is the single biggest change here.
//   · the ANTICIPATION. The body rises and the arms cock outward for 220ms
//     before every strike. An arm that goes straight to the pose is a switch
//     being flipped.
//   · the WHOLE BODY dropping into each landing: hip down 26, torso squashed,
//     head snapped down, both legs compressing to take it.
//   · FOUR strikes, not six, and 420ms apart rather than 300. Fewer and heavier.
//     At six-in-a-row the anticipation had nowhere to live and every strike
//     arrived while the body was still leaving the last one.
//
// Mascot.svelte draws the comic star and knocks the board housing on the same
// beats. Those land where the fists actually are, not where a chest would be —
// see IMPACT_AT there, which is taken from the numbers this file prints.
const BEAT_IN_L = MAX_SHOULDER - 2;
const BEAT_IN_R = -(MAX_SHOULDER - 2);
const BEAT_FORE_L = MAX_ELBOW - 2;
const BEAT_FORE_R = -(MAX_ELBOW - 2);
// How far the idle arm cocks the OTHER way while its partner lands. Small: this
// arm is not doing anything, it is getting out of the way and loading.
const BEAT_OUT = 12;

const BEAT_START = 0.36;
const BEAT_GAP = 0.42;
const BEAT_COCK = 0.22; // how long before the strike the body starts loading
const BEAT_HOLD = 0.07; // the frozen frame
const beats = [0, 1, 2, 3].map((i) => BEAT_START + i * BEAT_GAP);
const BEAT_END = beats[beats.length - 1] + BEAT_GAP;

/** One arm's shoulder or elbow across EVERY beat, not only the ones it owns.
 *
 * A chest beat is one fist landing while the other is cocked, so the arm that
 * does not own a beat has to be somewhere else at that moment. Keying only its
 * own beats left both arms parked in the same place between strikes and the
 * alternation was invisible.
 *
 * `side` is +1 for the arm whose angles increase as it swings inward, so one
 * function drives both and they cannot drift apart. */
const beatKeys = (inward, side, mine) =>
	beats.flatMap((t, i) =>
		mine.includes(i)
			? [
					{ time: t - BEAT_COCK, value: inward - side * BEAT_OUT }, // cocked out
					{ time: t, value: inward + side * 2 }, // through the landing
					{ time: t + BEAT_HOLD, value: inward + side * 2 }, // FROZEN
					{ time: t + 0.16, value: inward - side * 3 }, // rebound
				]
			: [
					{ time: t - BEAT_COCK, value: inward - side * BEAT_OUT * 0.5 },
					{ time: t, value: inward - side * BEAT_OUT },
					{ time: t + BEAT_HOLD, value: inward - side * BEAT_OUT },
				],
	);

const chestbeat = {
	bones: {
		hip: {
			translate: [
				{ time: 0, x: 0, y: 0 },
				{ time: 0.2, x: 0, y: -14 }, // settle into the stance
				...beats.flatMap((t) => [
					{ time: t - BEAT_COCK, x: 0, y: -2 }, // rise, loading
					{ time: t, x: 0, y: -28 }, // drop into the strike
					{ time: t + BEAT_HOLD, x: 0, y: -28 },
					{ time: t + 0.18, x: 0, y: -16 },
				]),
				{ time: BEAT_END + 0.36, x: 0, y: 0 },
			],
		},
		torso: {
			// The hunch is SCALE, not rotation. Seen from the front there is no
			// forward pitch to key — a torso rotation is a sideways tilt, and this
			// drawing carries only eight degrees of that before the kilt reads as a
			// rotated plate (MAX_LEAN). So the chest goes out and the height comes
			// down, and the rotation is spent on a small alternating twist that
			// gives each strike a side to come from.
			scale: [
				{ time: 0, x: 1, y: 1 },
				{ time: 0.2, x: 1.06, y: 0.95 },
				...beats.flatMap((t) => [
					{ time: t - BEAT_COCK, x: 1.02, y: 1.0 }, // drawn up on the cock
					{ time: t, x: 1.13, y: 0.88 }, // slammed down
					{ time: t + BEAT_HOLD, x: 1.13, y: 0.88 },
					{ time: t + 0.18, x: 1.06, y: 0.95 },
				]),
				{ time: BEAT_END + 0.36, x: 1, y: 1 },
			],
			rotate: [
				{ time: 0, value: 0 },
				{ time: 0.2, value: -3 },
				...beats.flatMap((t, i) => {
					const side = i % 2 === 0 ? 1 : -1; // right fist, then left
					return [
						{ time: t - BEAT_COCK, value: side * 2 },
						{ time: t, value: -side * MAX_LEAN },
						{ time: t + BEAT_HOLD, value: -side * MAX_LEAN },
						{ time: t + 0.18, value: -side * 3 },
					];
				}),
				{ time: BEAT_END + 0.36, value: 0 },
			],
		},
		head: {
			// Chin down and forward — a threat display, not a look up. It snaps down
			// ON the strike and is still there through the hold, which is what makes
			// the freeze read as a landing rather than a pause.
			rotate: [
				{ time: 0, value: 0 },
				{ time: 0.2, value: 7 },
				...beats.flatMap((t) => [
					{ time: t - BEAT_COCK, value: 2 }, // chin comes up to load
					{ time: t, value: MAX_HEAD - 1 },
					{ time: t + BEAT_HOLD, value: MAX_HEAD - 1 },
					{ time: t + 0.18, value: 7 },
				]),
				{ time: BEAT_END + 0.4, value: 0 },
			],
			translate: [
				{ time: 0, x: 0, y: 0 },
				{ time: 0.2, x: 0, y: -6 },
				...beats.flatMap((t) => [
					{ time: t - BEAT_COCK, x: 0, y: 2 },
					{ time: t, x: 0, y: -14 },
					{ time: t + BEAT_HOLD, x: 0, y: -14 },
					{ time: t + 0.18, x: 0, y: -6 },
				]),
				{ time: BEAT_END + 0.4, x: 0, y: 0 },
			],
		},
		// The legs take every landing. Same foreshortening the jump uses: seen from
		// the front a knee bend cannot be rotated, so the thigh bone SCALES and
		// shortens the whole chain below it. Without this the hip translate is a
		// body being lifted and dropped rather than a stance absorbing a blow.
		legL: {
			scale: [
				{ time: 0, x: 1, y: 1 },
				{ time: 0.2, x: 1.01, y: 0.985 },
				...beats.flatMap((t) => [
					{ time: t - BEAT_COCK, x: 1, y: 1 },
					{ time: t, x: 1.03, y: 0.94 },
					{ time: t + BEAT_HOLD, x: 1.03, y: 0.94 },
					{ time: t + 0.18, x: 1.01, y: 0.985 },
				]),
				{ time: BEAT_END + 0.36, x: 1, y: 1 },
			],
		},
		legR: {
			scale: [
				{ time: 0, x: 1, y: 1 },
				{ time: 0.22, x: 1.01, y: 0.985 },
				...beats.flatMap((t) => [
					{ time: t - BEAT_COCK + 0.02, x: 1, y: 1 },
					{ time: t + 0.02, x: 1.03, y: 0.94 },
					{ time: t + BEAT_HOLD + 0.02, x: 1.03, y: 0.94 },
					{ time: t + 0.2, x: 1.01, y: 0.985 },
				]),
				{ time: BEAT_END + 0.36, x: 1, y: 1 },
			],
		},
		// Right fist owns beats 0 and 2, left owns 1 and 3.
		armR: {
			rotate: [
				{ time: 0, value: 0 },
				{ time: 0.2, value: BEAT_IN_R },
				...beatKeys(BEAT_IN_R, -1, [0, 2]),
				{ time: BEAT_END, value: BEAT_IN_R },
				{ time: BEAT_END + 0.4, value: 0 },
			],
		},
		armL: {
			rotate: [
				{ time: 0, value: 0 },
				{ time: 0.2 + LEAD, value: BEAT_IN_L },
				...beatKeys(BEAT_IN_L, 1, [1, 3]),
				{ time: BEAT_END, value: BEAT_IN_L },
				{ time: BEAT_END + 0.4, value: 0 },
			],
		},
		// The elbows fold the SAME way as the shoulder here, which is the exception
		// to hang(): this is an arm being DRIVEN across the body, not one hanging
		// off a swinging shoulder. They arrive DRAG later, so the fist trails the
		// elbow into the landing.
		armR_fore: {
			rotate: [
				{ time: 0, value: 0 },
				{ time: 0.2 + DRAG, value: BEAT_FORE_R },
				...beatKeys(BEAT_FORE_R, -1, [0, 2]).map((k) => ({ ...k, time: k.time + DRAG * 0.5 })),
				{ time: BEAT_END, value: BEAT_FORE_R },
				{ time: BEAT_END + 0.4, value: 0 },
			],
		},
		armL_fore: {
			rotate: [
				{ time: 0, value: 0 },
				{ time: 0.2 + DRAG + LEAD, value: BEAT_FORE_L },
				...beatKeys(BEAT_FORE_L, 1, [1, 3]).map((k) => ({ ...k, time: k.time + DRAG * 0.5 })),
				{ time: BEAT_END, value: BEAT_FORE_L },
				{ time: BEAT_END + 0.4, value: 0 },
			],
		},
		// The fists snap on contact and are still moving after the arm has stopped.
		// A rigid wrist is the difference between a strike and a bat being swung.
		armR_hand: {
			rotate: [
				{ time: 0, value: 0 },
				...beats.flatMap((t, i) =>
					i % 2 === 0
						? [
								{ time: t - 0.1, value: 12 },
								{ time: t, value: -16 },
								{ time: t + BEAT_HOLD, value: -16 },
								{ time: t + 0.2, value: 0 },
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
								{ time: t - 0.1, value: -12 },
								{ time: t, value: 16 },
								{ time: t + BEAT_HOLD, value: 16 },
								{ time: t + 0.2, value: 0 },
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

// alert: the second Scatter has landed and he has noticed.
//
// WHY THIS EXISTS
//
// The tease was the one stretch of the game where he was a statue. The sound
// climbs a step per Scatter, the cell now flashes and keeps a hold, the housing
// takes a knock — and the character standing next to it, whose whole job is to
// react, did nothing until the trigger. Two Scatters is the moment the round
// stops being ordinary, so it is the moment he should look.
//
// WHY IT IS BUILT OUT OF SO LITTLE
//
// This rig cannot turn a head: it is a 2D cutout, so "looking at the board" has
// to be spelled with a tilt, a shift of weight and a shoulder. And the budget
// here is the tightest on the character — the usekh collar is rigid and hangs
// off the torso (MAX_SHOULDER 22), the nemes lappets sit into that collar
// (MAX_HEAD 12), and the kilt hem is 294 units from the hip pivot (MAX_LEAN 8).
// Everything below is well inside all three: the head goes to 7 of 12, the torso
// to 4 of 8, and the shoulders to 6 of 22. The rest of the read is carried by
// the hip sliding 11 units toward the board and the weight moving onto that leg,
// which costs no angle at all.
//
// It holds at the top of the move — a look is a pause, not a swing — then
// settles back rather than snapping, so it can be interrupted by the chest beat
// that follows if the third Scatter lands.
const ALERT_TURN = 7; // head, against MAX_HEAD 12
const ALERT_LEAN = 4; // torso, against MAX_LEAN 8
const alert = {
	bones: {
		// weight goes onto the leg nearer the board, and the whole body with it
		hip: {
			translate: [
				{ time: 0, x: 0, y: 0 },
				{ time: 0.2, x: -4, y: 3 }, // a dip first: he drops before he moves
				{ time: 0.42, x: -11, y: -2 },
				{ time: 0.78, x: -11, y: -2 },
				{ time: 1.1, x: 0, y: 0 },
			],
		},
		torso: {
			// MEASURED, not read off throwit's comment. Rendering the sheet and
			// taking the silhouette's centroid frame by frame: at -4 the head
			// finished 14px to the RIGHT of where the hip shift alone would have
			// put it, i.e. the torso was leaning AWAY from the board. Positive
			// takes the chest toward it.
			rotate: [
				{ time: 0, value: 0 },
				{ time: 0.42, value: ALERT_LEAN },
				{ time: 0.78, value: ALERT_LEAN },
				{ time: 1.1, value: 0 },
			],
			// a breath in: the chest rises as he takes notice
			scale: [
				{ time: 0, x: 1, y: 1 },
				{ time: 0.42, x: 0.99, y: 1.02 },
				{ time: 0.78, x: 0.99, y: 1.02 },
				{ time: 1.1, x: 1, y: 1 },
			],
		},
		head: {
			rotate: [
				{ time: 0, value: 0 },
				{ time: 0.16, value: -2 },
				{ time: 0.4, value: ALERT_TURN },
				{ time: 0.78, value: ALERT_TURN },
				{ time: 1.1, value: 0 },
			],
			// the tilt alone reads as a tilt; the shift is what makes it a look
			translate: [
				{ time: 0, x: 0, y: 0 },
				{ time: 0.4, x: -7, y: 3 },
				{ time: 0.78, x: -7, y: 3 },
				{ time: 1.1, x: 0, y: 0 },
			],
		},
		// the near shoulder comes up, the far one drops — the body squares to the
		// board without any of it leaving the collar
		armL: {
			rotate: [
				{ time: 0, value: 0 },
				{ time: 0.42, value: -6 },
				{ time: 0.78, value: -6 },
				{ time: 1.1, value: 0 },
			],
		},
		armR: {
			rotate: [
				{ time: 0, value: 0 },
				{ time: 0.42 + LEAD, value: 4 },
				{ time: 0.78, value: 4 },
				{ time: 1.1, value: 0 },
			],
		},
		armL_fore: {
			rotate: [
				{ time: 0, value: 0 },
				{ time: 0.42 + DRAG, value: hang(-6) },
				{ time: 0.78, value: hang(-6) },
				{ time: 1.1, value: 0 },
			],
		},
		armR_fore: {
			rotate: [
				{ time: 0, value: 0 },
				{ time: 0.42 + DRAG + LEAD, value: hang(4) },
				{ time: 0.78, value: hang(4) },
				{ time: 1.1, value: 0 },
			],
		},
		// the weight actually arrives somewhere: the near leg compresses, the far
		// one lengthens as it unloads
		legL: {
			scale: [
				{ time: 0, x: 1, y: 1 },
				{ time: 0.42, x: 1.012, y: 0.988 },
				{ time: 0.78, x: 1.012, y: 0.988 },
				{ time: 1.1, x: 1, y: 1 },
			],
		},
		legR: {
			scale: [
				{ time: 0, x: 1, y: 1 },
				{ time: 0.42, x: 0.996, y: 1.006 },
				{ time: 0.78, x: 0.996, y: 1.006 },
				{ time: 1.1, x: 1, y: 1 },
			],
		},
	},
};


// idlebreak: he shifts his weight and takes a look around.
//
// WHY
//
// `idle` is a breath and nothing else, and it is what the player watches for
// most of a session — between spins, through autoplay, while reading the bet
// bar. A character who only breathes for ten minutes stops being a character and
// becomes wallpaper, which is the same note certification wrote up about the
// still drawing in the first place. So every so often he does something small
// and goes back to breathing.
//
// ANGLES: DELIBERATELY WELL INSIDE EVERY BUDGET
//
// This one is UNPROMPTED — nothing has happened — so it has to be the quietest
// thing in the set. Anything that reads as a reaction here would have the
// player looking at the board for a win that is not coming. Measured against the
// three budgets on this drawing (see MAX_SHOULDER / MAX_LEAN / MAX_HEAD):
//
//   head   5 away, then 6 back    of 12   — the nemes lappets never leave the collar
//   torso  3                      of 8    — the kilt hem stays cloth
//   arms   5 at the shoulder      of 22   — the collar covers both joints throughout
//   elbows counter-rotated by hang(), because these arms are HANGING, not pushed
//
// The read is carried where it costs no angle at all: the hip slides 8 units
// onto one leg, that leg compresses while the other unloads, and the chest
// breathes across the whole move. That is a person standing and shifting, not a
// puppet being posed.
//
// It starts and ends at exactly the setup pose, so Mascot.svelte can drop back
// into `idle` from it without a snap, and it can be interrupted at any frame by
// a real reaction (nod, alert, chestbeat) with nothing left offset.
const BREAK_TURN_AWAY = -5; // head, against MAX_HEAD 12
const BREAK_TURN_BACK = 6;
const BREAK_LEAN = 3; // torso, against MAX_LEAN 8
const BREAK_ARM = 5; // shoulders, against MAX_SHOULDER 22
const idlebreak = {
	bones: {
		// the weight goes onto his right leg and comes back
		hip: {
			translate: [
				{ time: 0, x: 0, y: 0 },
				{ time: 0.45, x: 4, y: 2 }, // sinks slightly as he unweights
				{ time: 0.95, x: 8, y: 0 },
				{ time: 2.1, x: 8, y: 0 },
				{ time: 2.9, x: 0, y: 0 },
			],
		},
		torso: {
			rotate: [
				{ time: 0, value: 0 },
				{ time: 0.95, value: -BREAK_LEAN }, // away from the board first
				{ time: 1.75, value: BREAK_LEAN - 1 }, // and back over the shift
				{ time: 2.9, value: 0 },
			],
			// a long breath under the whole thing
			scale: [
				{ time: 0, x: 1, y: 1 },
				{ time: 0.95, x: 0.995, y: 1.012 },
				{ time: 1.9, x: 1.004, y: 0.994 },
				{ time: 2.9, x: 1, y: 1 },
			],
		},
		head: {
			rotate: [
				{ time: 0, value: 0 },
				{ time: 0.85, value: BREAK_TURN_AWAY },
				{ time: 1.25, value: BREAK_TURN_AWAY },
				{ time: 1.8, value: BREAK_TURN_BACK },
				{ time: 2.25, value: BREAK_TURN_BACK },
				{ time: 2.9, value: 0 },
			],
			// the tilt alone reads as a tilt; the shift is what makes it a look
			translate: [
				{ time: 0, x: 0, y: 0 },
				{ time: 0.85, x: 5, y: 1 },
				{ time: 1.25, x: 5, y: 1 },
				{ time: 1.8, x: -5, y: 2 },
				{ time: 2.25, x: -5, y: 2 },
				{ time: 2.9, x: 0, y: 0 },
			],
		},
		// the arms only trail the body, and by less than a quarter of their budget
		armL: {
			rotate: [
				{ time: 0, value: 0 },
				{ time: 0.95 + LEAD, value: BREAK_ARM },
				{ time: 1.9, value: -2 },
				{ time: 2.9, value: 0 },
			],
		},
		armR: {
			rotate: [
				{ time: 0, value: 0 },
				{ time: 0.95, value: -BREAK_ARM },
				{ time: 1.9, value: 2 },
				{ time: 2.9, value: 0 },
			],
		},
		armL_fore: {
			rotate: [
				{ time: 0, value: 0 },
				{ time: 0.95 + LEAD + DRAG, value: hang(BREAK_ARM) },
				{ time: 1.9 + DRAG, value: hang(-2) },
				{ time: 2.9, value: 0 },
			],
		},
		armR_fore: {
			rotate: [
				{ time: 0, value: 0 },
				{ time: 0.95 + DRAG, value: hang(-BREAK_ARM) },
				{ time: 1.9 + DRAG, value: hang(2) },
				{ time: 2.9, value: 0 },
			],
		},
		// the leg he stands on compresses; the other lengthens as it unloads
		legR: {
			scale: [
				{ time: 0, x: 1, y: 1 },
				{ time: 0.95, x: 1.01, y: 0.99 },
				{ time: 2.1, x: 1.01, y: 0.99 },
				{ time: 2.9, x: 1, y: 1 },
			],
		},
		legL: {
			scale: [
				{ time: 0, x: 1, y: 1 },
				{ time: 0.95, x: 0.997, y: 1.005 },
				{ time: 2.1, x: 0.997, y: 1.005 },
				{ time: 2.9, x: 1, y: 1 },
			],
		},
	},
};

// throwit: he produces the scarab and pitches it at the board.
//
// Named 'throwit' rather than 'throw' because `throw` is a reserved word, and
// this object is written as JS before it becomes JSON.
//
// He throws with the LEFT arm - the one nearer the board, and the one the PSD
// stacks IN FRONT of the coat, so the whole swing stays visible instead of
// disappearing behind the vest halfway through.
//
// THE SCARAB IS PART OF THE SKELETON
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
// Deliberately unhurried between the two: a beat to notice the scarab, a wind
// up you can read, then the throw. Release used to be at 0.38s with the scarab
// invisible until it left, which meant the whole gesture was over before there
// was anything to see it happen to.
const APPEAR_AT = 0.2;
const RELEASE_AT = 0.58;

// The throw is allowed OUTSIDE the pose budget that governs the rest of the set.
//
// MAX_SHOULDER (22) is the limit for an angle the character HOLDS - past it the
// collar stops covering the shoulder joint, and that is what the eye has time to
// notice. A throw passes through its extreme in three or four frames and never
// rests there, so it can spend about a third more: 30 at the shoulder and 26 at
// the elbow, which is what makes the swing actually read as a swing.
//
// This is the one exception in the file, and it is an exception about DWELL, not
// about the drawing suddenly being able to take more.
const THROW_SHOULDER = 30;
const THROW_ELBOW = 26;
const COCK_BACK = 28;

const throwit = {
	slots: {
		// nothing, then a scarab, then nothing again
		scarab: {
			attachment: [
				{ time: 0, name: null },
				{ time: APPEAR_AT, name: 'scarab' },
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
				{ time: APPEAR_AT, x: 4, y: -4 },
				{ time: 0.42, x: 16, y: -16 }, // loaded back over the far leg
				{ time: RELEASE_AT + 0.05, x: -19, y: 12 }, // driven through
				{ time: 0.9, x: -5, y: -3 },
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
			// The twist is most of the throw, but it is NOT cheap on this drawing -
			// see MAX_LEAN. So the twist runs to the budget and no further, and the
			// range that used to live here has moved into the hip, which can travel
			// as far as it likes because nothing is painted across the joint.
			rotate: [
				{ time: 0, value: 0 },
				{ time: APPEAR_AT, value: 2 },
				{ time: 0.42, value: MAX_LEAN }, // wound away from the board
				{ time: RELEASE_AT, value: -MAX_LEAN }, // through
				{ time: 0.82, value: 3 },
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
			// looks down at the scarab as it appears, then follows it out
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
const smoothAnimation = (animation, loopD) => {
	for (const track of Object.values(animation.bones ?? {})) {
		for (const [name, keys] of Object.entries(track)) {
			const fields = FIELDS[name];
			if (fields) smoothTimeline(keys, fields, loopD);
		}
	}
	return animation;
};

// ── calibration ─────────────────────────────────────────────────────────────
//
// Not shipped. `--calibrate` adds these two so the contact sheet renders the
// arms at 0, 10, 20 ... 80 degrees and the budget above can be read off a
// picture. Eight frames, one every ten degrees, on both sides at once with the
// signs that mean "outward and up" for each.
//
// The elbow sweep holds the shoulder at its measured maximum, because that is
// the pose an elbow angle actually has to survive - an elbow judged against a
// hanging arm passes at angles that fall apart the moment the shoulder moves.
const SWEEP = [0, 1, 2, 3, 4, 5, 6, 7].map((i) => ({ time: i * 0.5, deg: i * 10 }));
const sweepShoulder = {
	bones: {
		armL: { rotate: SWEEP.map((k) => ({ time: k.time, value: -k.deg })) },
		armR: { rotate: SWEEP.map((k) => ({ time: k.time, value: k.deg })) },
	},
};
// The torso carries the kilt, whose hem hangs 294 units BELOW the waist this bone
// pivots about - four times the overhang the gorilla vest had - so a lean that is
// nothing at the chest is a large sideways swing at the hem, across thighs that
// are not moving with it. Measured like the rest.
const sweepTorso = {
	bones: { torso: { rotate: SWEEP.map((k) => ({ time: k.time, value: k.deg })) } },
};

// The head has its own limit, for the same reason the shoulders do: the nemes is
// a rigid slab and the collar it sits into does not move with it.
const sweepHead = {
	bones: { head: { rotate: SWEEP.map((k) => ({ time: k.time, value: k.deg })) } },
};
const sweepElbow = {
	bones: {
		armL: { rotate: SWEEP.map((k) => ({ time: k.time, value: -MAX_SHOULDER })) },
		armR: { rotate: SWEEP.map((k) => ({ time: k.time, value: MAX_SHOULDER })) },
		armL_fore: { rotate: SWEEP.map((k) => ({ time: k.time, value: -k.deg })) },
		armR_fore: { rotate: SWEEP.map((k) => ({ time: k.time, value: k.deg })) },
	},
};

const skeleton = {
	skeleton: {
		hash: 'gb-anubis',
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
			Object.entries({
				idle,
				cheer,
				chestbeat,
				nod,
				alert,
				idlebreak,
				throwit,
				// Left un-smoothed on purpose: a calibration sweep has to be linear,
				// or the angle at a given frame is not the angle it is labelled with.
				...(CALIBRATE ? { sweepShoulder, sweepElbow, sweepHead, sweepTorso } : {}),
			}).map(([name, a]) => [
				name,
				// idle is the only one that loops, so it is the only one whose ends
				// have to meet.
				name.startsWith('sweep')
					? a
					: smoothAnimation(a, name === 'idle' ? IDLE_LOOP : undefined),
			]),
		),
};

fs.writeFileSync(path.join(OUT, 'anubis.json'), JSON.stringify(skeleton, null, 2) + '\n');

// ── numbers Mascot.svelte needs, taken from the rig rather than guessed ─────
//
// Two things are drawn OUTSIDE the skeleton and have to line up with it: the
// scarab the transition flies to the middle of the board, which has to leave
// from where the fist actually is, and the comic impact stars on the chest beat,
// which have to land where the fists actually land. Both are printed here, in
// skeleton units, so a change to a joint or an angle shows up as a changed
// number in this output instead of as a prop that misses by forty units.
//
// This walks the FINISHED animations, so it accounts for the whole chain -
// including the torso lean and the hip drop, which the arm angles alone do not.
// Sampling is linear, and every time asked for below is an exact keyframe, where
// a curve passes through its key regardless.
{
	const boneByName = Object.fromEntries(bones.map((b) => [b.name, b]));
	const mul = (m, n) => [
		m[0] * n[0] + m[2] * n[1], m[1] * n[0] + m[3] * n[1],
		m[0] * n[2] + m[2] * n[3], m[1] * n[2] + m[3] * n[3],
		m[0] * n[4] + m[2] * n[5] + m[4], m[1] * n[4] + m[3] * n[5] + m[5],
	];
	const localM = (x, y, deg, sx, sy) => {
		const r = (deg * Math.PI) / 180;
		return [Math.cos(r) * sx, Math.sin(r) * sx, -Math.sin(r) * sy, Math.cos(r) * sy, x, y];
	};
	const at = (keys, time, fields, fallback) => {
		if (!keys?.length) return fallback;
		if (time <= keys[0].time) return fields.map((f, k) => keys[0][f] ?? fallback[k]);
		const last = keys[keys.length - 1];
		if (time >= last.time) return fields.map((f, k) => last[f] ?? fallback[k]);
		let i = 0;
		while (i < keys.length - 1 && keys[i + 1].time < time) i++;
		const a = keys[i];
		const b = keys[i + 1];
		const t = (time - a.time) / (b.time - a.time);
		return fields.map((f, k) => {
			const av = a[f] ?? fallback[k];
			return av + ((b[f] ?? fallback[k]) - av) * t;
		});
	};
	// The centre of a slot's drawing, which is what the eye reads as "the fist" -
	// not the wrist joint, which on this art sits 55 units above it.
	const drawingAt = (animation, time, slot) => {
		const anim = skeleton.animations[animation];
		const world = {};
		const resolve = (bone) => {
			if (world[bone.name]) return world[bone.name];
			const parent = bone.parent ? resolve(boneByName[bone.parent]) : [1, 0, 0, 1, 0, 0];
			const track = anim.bones?.[bone.name] ?? {};
			const [rot] = at(track.rotate, time, ['value'], [0]);
			const [tx, ty] = at(track.translate, time, ['x', 'y'], [0, 0]);
			const [sx, sy] = at(track.scale, time, ['x', 'y'], [1, 1]);
			return (world[bone.name] = mul(
				parent,
				localM((bone.x ?? 0) + tx, (bone.y ?? 0) + ty, rot, sx, sy),
			));
		};
		for (const b of bones) resolve(b);
		const s = slots.find((x) => x.name === slot);
		const a = attachments[slot]?.[slot] ?? { x: 0, y: 0 };
		const m = world[s.bone];
		return { x: m[0] * a.x + m[2] * a.y + m[4], y: m[1] * a.x + m[3] * a.y + m[5] };
	};
	const say = (label, p) => console.log(`${label.padEnd(26)} (${p.x.toFixed(0)}, ${p.y.toFixed(0)})`);
	say(`throw release t=${RELEASE_AT}`, drawingAt('throwit', RELEASE_AT, 'scarab'));
	// Alternating: the right fist owns beats 0 and 2, the left 1 and 3, so one of
	// each is enough to place both stars. Sampled at the strike, which is where
	// the star has to be — not at the hold, which is the same pose, and not
	// between beats, where the arm is somewhere else entirely.
	say('beat 0 right fist', drawingAt('chestbeat', beats[0], 'right_arm_2_hand'));
	say('beat 1 left fist', drawingAt('chestbeat', beats[1], 'left_arm_2_hand'));
	console.log(`chestbeat  ${beats.length} strikes at ${beats.map((t) => t.toFixed(2)).join(', ')}s, ends ${(BEAT_END + 0.4).toFixed(2)}s`);
}

console.log(`atlas   anubis.png ${PAGE_W}x${PAGE_H}, ${placed.length} regions`);
console.log(`skeleton anubis.json ${bones.length} bones, ${slots.length} slots`);
if (CALIBRATE) console.log('calibration sweeps INCLUDED — rebuild without --calibrate before shipping');
console.log('out', path.relative(appRoot, OUT));
