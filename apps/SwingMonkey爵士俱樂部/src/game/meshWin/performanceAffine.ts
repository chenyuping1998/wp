import type { RigidPose } from './meshRig';

/** The exact rigid transform used by skin(), for attached notes and sound marks. */
export const writePerformanceAffine = (r: RigidPose, feet: number, out: Float64Array) => {
	const angle = r.rot * Math.PI / 180, cos = Math.cos(angle), sin = Math.sin(angle);
	out[0] = r.pop * r.sx * cos; out[1] = r.pop * r.sx * sin;
	out[2] = -r.pop * r.sy * sin; out[3] = r.pop * r.sy * cos;
	out[4] = 128 - out[0] * 128 - out[2] * feet + r.dx;
	out[5] = 128 + r.pop * (feet - 128) - out[1] * 128 - out[3] * feet + r.dy;
};
