/** The painted prize plaque, with its riveted rim pinned in place. */
import { blob, bump, panelParts, restPose, smoothstep, type MeshWinSpec, type Rig } from './meshRig';

export type BannerEnv = { t: number; landT: number; blink: number };

export const bannerMesh = (key: string): MeshWinSpec & { drive: (rig: Rig, env: BannerEnv) => ReturnType<typeof restPose> } => ({
	symbol: `BANNER_${key}`,
	key,
	sprite: key,
	mode: 'panel',
	inked: ([x, y]) => x > 10 && x < 246 && y > 12 && y < 244,
	feetY: 226,
	durationMs: 2200,
	landMs: 0,
	hitMs: 0,
	limits: { plate: { pos: 2, neg: 2 }, title: { pos: 3, neg: 3 } },
	rig: {
		grid: { x0: 0, y0: 0, x1: 256, y1: 256, cols: 48, rows: 32 },
		soft: 5,
		parts: [
			...panelParts([17, 21, 239, 231], 15).map((p) => p.name === 'panel' ? { ...p, name: 'plate' } : p),
			{
				name: 'title', parent: 'plate', pivot: [128, 83] as [number, number], axis: [0, -1] as [number, number],
				dist: blob([128, 83], 83, 37, 3), priority: 2,
				keep: ([x, y]: [number, number]) => smoothstep((121 - y) / 22) * smoothstep((Math.min(x, 256 - x, y, 256 - y) - 2) / 16),
			},
		],
	},
	pose: (rig) => restPose(rig),
	drive: (rig, { t, landT, blink }) => {
		const p = restPose(rig);
		const plate = p.bones[1];
		const title = p.bones[2];
		// The entrance hits the fixed brass rim; the broad red face absorbs it.
		const hit = Math.exp(-t / 410) * Math.sin(t * 0.017);
		plate.along = 1 - 0.026 * hit;
		plate.across = 1 + 0.018 * hit;
		plate.angle = 0.45 * hit;
		const landed = landT < 0 ? 0 : Math.exp(-landT / 420) * Math.sin(landT * 0.019);
		title.along = 1 + 0.035 * hit + 0.034 * landed;
		title.across = 1 - 0.017 * hit - 0.015 * landed;
		title.angle = 0.9 * hit + 0.6 * landed;
		// A small breath keeps the prize lettering alive during a long count-up.
		title.dy = -0.7 * Math.sin(t * 0.0027) * smoothstep(t / 550);
		p.flash = Math.max(blink, 0.18 * bump(t, 40, 260));
		return p;
	},
});
