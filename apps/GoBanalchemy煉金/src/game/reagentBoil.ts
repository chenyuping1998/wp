import {
	polygon,
	polyline,
	smoothstep,
	restPose,
	type Point,
	type Rig,
	type RigSpec,
} from './meshWin/meshRig';

export type ReagentVariant = 'tile' | 'prop';
// Conservative glass-only windows: copper, binding rope and slate are excluded.
export const GLASS: Record<ReagentVariant, Point[][]> = {
	tile: [
		[
			[90, 109],
			[118, 103],
			[126, 121],
			[127, 131],
			[96, 139],
		],
		[
			[158, 91],
			[176, 88],
			[183, 102],
			[184, 113],
			[169, 119],
		],
		[
			[105, 151],
			[138, 142],
			[143, 164],
			[142, 174],
			[109, 181],
		],
		[
			[178, 132],
			[199, 125],
			[208, 135],
			[206, 147],
			[178, 161],
		],
	],
	prop: [
		[
			[80, 111],
			[111, 107],
			[128, 120],
			[131, 139],
			[83, 151],
		],
		[
			[164, 86],
			[181, 83],
			[190, 98],
			[194, 116],
			[173, 126],
			[166, 109],
		],
		[
			[96, 157],
			[130, 149],
			[136, 165],
			[135, 190],
			[101, 200],
		],
		[
			[179, 139],
			[205, 133],
			[216, 147],
			[213, 170],
			[178, 185],
		],
	],
};
export const boilCanvas = (variant: ReagentVariant): [number, number] => [
	256,
	variant === 'tile' ? 256 : (618 * 256) / 672,
];
export const boilRig = (variant: ReagentVariant): RigSpec => {
	const [width, height] = boilCanvas(variant);
	return {
		grid: { x0: 0, y0: 0, x1: width, y1: height, cols: 48, rows: 48 },
		canvas: [width, height],
		soft: 4,
		fixedBorder: 10,
		parts: [
			{ name: 'frame', pivot: [128, height / 2], dist: () => 14 },
			...GLASS[variant].map((points, i) => {
				const outline = polygon(points),
					edge = polyline([...points, points[0]]);
				return {
					name: `liquid${i}`,
					parent: 'frame',
					pivot: [
						points.reduce((s, p) => s + p[0], 0) / points.length,
						Math.max(...points.map((p) => p[1])),
					] as Point,
					dist: outline,
					priority: 2,
					axis: [0, -1] as Point,
					keep: (p: Point) => (outline(p) === 0 ? smoothstep(edge.dist(p) / 5) : 0),
				};
			}),
		],
	};
};
export const boilPose = (rig: Rig, phase: number, intensity: number) => {
	const pose = restPose(rig),
		k = Math.max(0, Math.min(1, intensity));
	for (let i = 1; i < pose.bones.length; i++) {
		const p = pose.bones[i],
			wave = phase * 6.283 + i * 1.7;
		p.angle = 0.6 * k * Math.sin(wave * 0.8);
		p.dy = -0.8 * k * Math.sin(wave);
		p.along = 1 + 0.018 * k * Math.sin(wave + 1.1);
		p.across = 1 - 0.014 * k * Math.sin(wave + 0.4);
	}
	return pose;
};
export const boilBubbles = (variant: ReagentVariant, phase: number, intensity: number) => {
	const k = Math.max(0, Math.min(1, intensity)),
		result: { x: number; y: number; r: number; alpha: number; surface: boolean }[] = [];
	GLASS[variant].forEach((points, chamber) => {
		const left = Math.min(...points.map((p) => p[0])),
			right = Math.max(...points.map((p) => p[0]));
		const top = Math.min(...points.map((p) => p[1])),
			bottom = Math.max(...points.map((p) => p[1]));
		const inside = polygon(points);
		for (let i = 0; i < 9; i++) {
			const seed = ((i * 37 + chamber * 17) % 97) / 97;
			const age = (phase * (0.65 + seed * 0.45) + seed * 3.3) % 1;
			const x = left + (right - left) * (0.18 + 0.64 * seed) + Math.sin(phase * 4 + i) * 1.1;
			const y = bottom - 2 - age * (bottom - top - 3);
			if (inside([x, y]) > 0) continue;
			const envelope = Math.min(1, age * 7) * Math.min(1, (1 - age) * 6);
			result.push({
				x,
				y,
				r: (1.25 + seed * 1.65) * (0.8 + 0.5 * k),
				alpha: envelope * (0.25 + 0.55 * k),
				surface: age > 0.83,
			});
		}
	});
	return result;
};
