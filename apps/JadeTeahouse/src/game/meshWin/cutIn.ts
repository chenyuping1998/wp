/**
 * THE APPRENTICE'S CUT-IN (sushiScene/chef_cut_in.png) in the Tea Master
 * meter's level-up (BanditMeter.svelte), as a mesh.
 *
 * BanditMeter slides her in from the right, and on the slash turns the whole
 * figure 0.3 rad the other way; as a sprite that was all she could do. Here
 * what she wears and holds answers those two moves:
 *
 *   fan         drawn back on the wind-up, snapped through on the slash
 *   fanTassel   the jade drop hanging off the fan: whips the other way, late
 *   hairTassel  the hair-pin tassel: trails the slide in, flicks on the slash
 *   sleeve      the long drooping sleeve under her arm: billows on the slash
 *   skirt       the robe's hem flares, and the waist pendant swings on it
 *
 * Every beat is keyed to BanditMeter's own phase clock (its LEAD/CUT), so the
 * mesh can never drift from the move that carries it.
 *
 * Rig units are the art's pixels (1024 square), traced 2026-10-09: fan pivot
 * at the jade ring (241,444); fan tassel (298,546) -> (398,797); hair-pin
 * tassel (933,455) -> (1001,569); drooping sleeve x 341..546, y 523..865;
 * waist pendant (660,796) -> (700,945); robe hem y 800..945.
 */
import { flick, polygon, restPose, smoothstep, track, type MeshWinSpec, type Point, type Pose, type Rig } from './meshRig';

export const CUTIN_CANVAS: [number, number] = [1024, 1024];
/** BanditMeter's slash, ms into a step's phase (its CUT) */
export const CUTIN_CUT_MS = 680;

export type CutInEnv = { /** ms into this step's phase (BanditMeter `phase`) */ t: number };
export type CutInSpec = MeshWinSpec & { drive: (rig: Rig, env: CutInEnv) => Pose };

const FAN_PIVOT: Point = [241, 444];
const FAN = polygon([[11, 159], [125, 131], [285, 171], [444, 233], [496, 360], [548, 528], [376, 501], [270, 480], [228, 458]]);
const FAN_TASSEL = polygon([[290, 546], [330, 546], [342, 640], [400, 728], [404, 802], [330, 806], [313, 720], [296, 640]]);
const HAIR_TASSEL = polygon([[916, 438], [950, 438], [1007, 534], [1001, 572], [944, 572], [922, 500]]);
const SLEEVE = polygon([[350, 575], [405, 530], [520, 548], [534, 683], [544, 796], [512, 862], [432, 840], [380, 740]]);
const PENDANT = polygon([[640, 782], [702, 782], [722, 862], [732, 946], [640, 946], [628, 862]]);

const bone = (rig: Rig, pose: Pose, name: string) => pose.bones[rig.bones.findIndex((b) => b.name === name)];

export const CUTIN: CutInSpec = {
	symbol: 'cutIn',
	key: 'gbChefCutIn',
	sprite: 'gbChefCutIn',
	mode: 'panel',
	feetY: 1024,
	durationMs: 1850,
	landMs: 99999,
	hitMs: 99999,
	inked: (p) => [FAN, FAN_TASSEL, HAIR_TASSEL, SLEEVE, PENDANT].some((f) => f(p) === 0) || (p[1] > 800 && p[0] > 440 && p[0] < 1010),
	rig: {
		canvas: CUTIN_CANVAS,
		grid: { x0: 0, y0: 0, x1: 1024, y1: 1024, cols: 64, rows: 64 },
		soft: 10,
		parts: [
			// the body: everything nothing else claims, still
			{ name: 'body', pivot: [600, 600], dist: () => 24 },
			{
				name: 'fan',
				parent: 'body',
				pivot: FAN_PIVOT,
				axis: [-0.6, -1],
				priority: 2,
				dist: FAN,
				// the fist that holds it stays with the arm
				keep: (p) => smoothstep((Math.hypot(p[0] - FAN_PIVOT[0], p[1] - FAN_PIVOT[1]) - 40) / 70),
			},
			{
				name: 'sleeve',
				parent: 'body',
				pivot: [440, 545],
				axis: [0.1, 1],
				priority: 1,
				dist: SLEEVE,
				keep: (p) => smoothstep((p[1] - 575) / 90),
			},
			{
				name: 'fanTassel',
				// it hangs from the fist, in front of the sleeve
				parent: 'sleeve',
				pivot: [310, 552],
				axis: [0.35, 1],
				priority: 3,
				dist: FAN_TASSEL,
				keep: (p) => smoothstep((p[1] - 556) / 24),
			},
			{
				name: 'hairTassel',
				parent: 'body',
				pivot: [933, 452],
				axis: [0.5, 1],
				priority: 3,
				dist: HAIR_TASSEL,
				keep: (p) => smoothstep((p[1] - 456) / 18),
			},
			{
				name: 'skirt',
				parent: 'body',
				pivot: [700, 780],
				axis: [0, 1],
				priority: 1,
				dist: (p) => (p[1] > 800 && p[0] > 420 ? 0 : 30),
				keep: (p) => smoothstep((p[1] - 800) / 70),
			},
			{
				name: 'pendant',
				parent: 'skirt',
				pivot: [668, 790],
				axis: [0.2, 1],
				priority: 3,
				dist: PENDANT,
				keep: (p) => smoothstep((p[1] - 800) / 26),
			},
		],
	},
	limits: {
		body: { pos: 0, neg: 0 },
		fan: { pos: 5, neg: 5 },
		sleeve: { pos: 5, neg: 5 },
		fanTassel: { pos: 14, neg: 14 },
		hairTassel: { pos: 14, neg: 14 },
		skirt: { pos: 3, neg: 3 },
		pendant: { pos: 12, neg: 12 },
	},
	drive: (rig, { t }) => {
		const pose = restPose(rig);
		const CUT = CUTIN_CUT_MS;
		// arriving from the right at speed: what hangs trails to the right
		// (clockwise is +), then swings back as she stops
		const arrive = (hz: number, d: number) => (t < 0 ? 0 : -Math.min(1, t / 120) * Math.exp(-t / 260) + 0.6 * flick(t, 300, hz, d));
		// the slash: the figure turns CCW, so hanging things lag clockwise
		const slash = (lag: number, hz: number, d: number) => flick(t, CUT + lag, hz, d);
		// a slow breath afterwards, so the hold is not a freeze
		const breath = Math.sin(t / 330) * smoothstep((t - CUT - 400) / 400);

		bone(rig, pose, 'fan').angle = track(t, [[0, 0], [CUT - 250, 0], [CUT - 40, -FAN_DEG, 'out'], [CUT + 90, FAN_DEG, 'in'], [CUT + 380, 0, 'out']]) + 0.6 * slash(380, 2.4, 4) + 0.6 * breath;
		bone(rig, pose, 'fanTassel').angle = TASSEL_DEG * (-0.6 * arrive(1.6, 2.4) + slash(60, 1.5, 1.6)) - 1 * breath;
		bone(rig, pose, 'hairTassel').angle = HANG_DEG * (arrive(1.6, 2.2) + 0.9 * slash(40, 1.6, 1.8)) + 1.5 * breath;
		bone(rig, pose, 'sleeve').angle = SLEEVE_DEG * (0.5 * arrive(1.4, 2.6) + slash(30, 1.4, 2.2)) + 0.6 * breath;
		const skirt = bone(rig, pose, 'skirt');
		skirt.angle = SKIRT_DEG * (arrive(1.8, 2.8) + 0.8 * slash(50, 1.8, 2.6));
		skirt.across = 1 + 0.03 * Math.max(0, slash(50, 1.8, 2.6));
		bone(rig, pose, 'pendant').angle = 9 * (arrive(1.5, 2) + slash(90, 1.5, 1.8)) + 1.5 * breath;
		return pose;
	},
	pose: (rig, t) => CUTIN.drive(rig, { t }),
};

// set from the measured limits
const FAN_DEG = 3.5;
const HANG_DEG = 11;
// the fan's drop is long and rides the sleeve too: less of its own
const TASSEL_DEG = 5;
const SLEEVE_DEG = 4;
const SKIRT_DEG = 2.4;
