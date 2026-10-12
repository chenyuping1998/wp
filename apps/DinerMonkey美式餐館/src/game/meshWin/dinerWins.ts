/** Diner symbol win rigs traced to the new burger, shake, hot dog, pie, chef and bell silhouettes. */
import { flick, leap, polygon, restPose, smoothstep, track, turnAbout, type MeshWinSpec, type Point, type Rig } from './meshRig';

const BEATS = { crouch: 120, rise: 340, fall: 750, land: 930, hop2: 1130, done: 1420 };
type Design = { symbol: string; key: string; feet: number; body: Point[]; accent: Point[]; pivot: Point;
	angle: number; height: number; drift?: number };

function dinerWin(d: Design): MeshWinSpec {
	const body = polygon(d.body), accent = polygon(d.accent);
	return {
		symbol: d.symbol, key: d.key, sprite: d.key,
		art: `sushiSymbols/${d.symbol.toLowerCase()}.png`,
		feetY: d.feet, durationMs: BEATS.done, landMs: BEATS.land, hitMs: BEATS.rise,
		rig: {
			grid: { x0: 0, y0: 0, x1: 256, y1: 256, cols: 48, rows: 48 }, soft: 5,
			parts: [
				{ name: 'root', pivot: [128, d.feet], dist: () => 15 },
				{ name: 'body', parent: 'root', pivot: [128, d.feet], axis: [0, -1], priority: 1, dist: body },
				{ name: 'accent', parent: 'body', pivot: d.pivot, axis: [0, -1], priority: 3,
					dist: accent, keep: (p) => smoothstep((p[1] - d.pivot[1] + 28) / 26) },
			],
		},
		limits: { body: { pos: 0, neg: 0 }, accent: { pos: 9, neg: 9 } },
		pose: (rig: Rig, t: number) => {
			const pose = restPose(rig);
			const accentBone = pose.bones[rig.bones.findIndex((x) => x.name === 'accent')];
			const act = track(t, [[0, 0], [BEATS.rise - 80, 0], [BEATS.rise + 130, 1, 'out'],
				[BEATS.fall, -.3], [BEATS.land + 120, 0, 'inOut']]);
			accentBone.angle = d.angle * act + 2 * flick(t, BEATS.land, 2.8, 4);
			if (d.symbol === 'S') {
				// The bell is slapped, its dome drops, then the button rattles up.
				pose.bones[rig.bones.findIndex((x) => x.name === 'body')].dy = 3.5 * act;
				accentBone.dy = -5 * act;
			}
			const { rigid, air } = leap(t, BEATS, d.height);
			rigid.rot = d.angle * .45 * act;
			rigid.dx = (d.drift ?? 0) * Math.sin(Math.PI * Math.min(1, t / BEATS.land)) * air;
			pose.rigid = turnAbout(rigid, [128, 130], d.feet);
			pose.air = air;
			return pose;
		},
	};
}

// Each accent joint sits on a distinguishable feature: top bun, straw,
// sausage tip, pie point, hat/forehead and the bell's strike button.
export const H1 = dinerWin({ symbol: 'H1', key: 'gbH1', feet: 228,
	body: [[20,85],[52,49],[124,33],[210,54],[244,102],[238,201],[208,229],[44,229],[16,195]],
	accent: [[35,61],[82,38],[183,37],[232,65],[225,113],[42,111]], pivot: [128,110], angle: 5, height: 25 });
export const H2 = dinerWin({ symbol: 'H2', key: 'gbH2', feet: 232,
	body: [[77,42],[164,26],[185,80],[161,225],[104,230],[75,96]],
	accent: [[130,16],[177,16],[206,43],[184,90],[153,89]], pivot: [154,89], angle: 9, height: 28 });
export const H3 = dinerWin({ symbol: 'H3', key: 'gbH3', feet: 220,
	body: [[12,150],[57,92],[167,52],[240,63],[249,120],[208,174],[91,218],[19,206]],
	accent: [[128,68],[228,55],[248,90],[231,128],[172,137]], pivot: [173,133], angle: 4, height: 19, drift: 10 });
export const H4 = dinerWin({ symbol: 'H4', key: 'gbH4', feet: 220,
	body: [[18,89],[91,33],[178,45],[235,138],[236,205],[184,229],[71,187]],
	accent: [[145,99],[218,139],[246,200],[192,216],[158,160]], pivot: [171,151], angle: -7, height: 23 });
export const W = dinerWin({ symbol: 'W', key: 'gbW', feet: 233,
	body: [[26,72],[85,27],[177,16],[237,84],[233,177],[174,235],[76,225],[21,172]],
	accent: [[63,27],[121,5],[199,32],[195,88],[90,95]], pivot: [130,89], angle: 6, height: 27 });
export const S = dinerWin({ symbol: 'S', key: 'gbS', feet: 226,
	body: [[28,113],[89,67],[177,64],[229,116],[233,202],[182,229],[53,223],[20,183]],
	accent: [[96,24],[159,23],[177,64],[155,98],[111,99],[88,64]], pivot: [128,97], angle: 4, height: 15 });
