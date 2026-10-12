import { circle, panelParts, restPose, smoothstep, type MeshWinSpec, type Rect } from './meshRig';

// A shared transmutation pulse keeps the new full-tile paintings intact.  The
// copied Boom rigs were measured on mining objects and warped these pictures.
const INNER: Rect = [15, 15, 241, 241];
const CENTER: [number, number] = [128, 128];

export const alchemyWin = (symbol: string): MeshWinSpec => {
	const high = symbol.startsWith('H') || symbol === 'W' || symbol === 'S';
	const durationMs = high ? 1450 : 1200;
	const hitMs = high ? 260 : 190;
	return {
		symbol,
		key: `gb${symbol}`,
		sprite: `gb${symbol}`,
		mode: 'panel',
		feetY: INNER[3],
		durationMs,
		landMs: high ? 1090 : 920,
		hitMs,
		sparkAt: CENTER,
		flashTint: high ? 0x8cffe2 : 0xd7b98d,
		inked: () => true,
		rig: {
			grid: { x0: 0, y0: 0, x1: 256, y1: 256, cols: 24, rows: 24 },
			soft: 7,
			parts: [
				...panelParts(INNER),
				{
					name: 'core', parent: 'panel', pivot: CENTER, axis: [0, -1], priority: 1,
					dist: circle(CENTER, 76),
					keep: (p) => smoothstep((108 - Math.hypot(p[0] - 128, p[1] - 128)) / 42),
				},
			],
		},
		limits: { panel: { pos: 0.5, neg: 0.5 }, core: { pos: 0.5, neg: 0.5 } },
		pose: (rig, t) => {
			const pose = restPose(rig);
			const core = pose.bones[rig.bones.findIndex((b) => b.name === 'core')];
			const rise = smoothstep(t / hitMs);
			const decay = 1 - smoothstep((t - (durationMs - 280)) / 280);
			const pulse = rise * decay;
			core.along = 1 + 0.065 * pulse;
			core.across = 1 + 0.055 * pulse;
			core.angle = 0.4 * Math.sin(t / 115) * pulse;
			pose.flash = Math.max(0, 0.42 * (1 - Math.abs(t - hitMs) / 230));
			pose.sheen = t >= 300 && t <= 850 ? (t - 300) / 550 : -1;
			return pose;
		},
	};
};
