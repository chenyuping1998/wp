import type { MeshWinSpec } from './meshRig';

/** Score-only emphasis: pinned frame and rigid tile transform remain at rest.
 * Gains are authored per symbol; the geometry gate still enforces 50–160% area.
 * Reel-stop poses are derived separately from the original, quieter score pose. */
const GAINS: Record<string, number> = {
	H1: 1.8,
	H2: 1.9,
	H3: 2,
	H4: 2,
	W: 1.8,
	// the seal's size is in its leap now (leapWin.ts); its fan folds the face past ~1.25
	S: 1,
	L1: 1.45,
	L2: 1.45,
	L3: 1.45,
	L4: 1.45,
	L5: 1.6,
};

export const emphasizeWin = (spec: MeshWinSpec): MeshWinSpec => {
	const gain = GAINS[spec.symbol] ?? 1;
	return {
		...spec,
		rig: {
			...spec.rig,
			weightSmooth: spec.symbol === 'H1' ? 4 : ['H3', 'H4', 'W'].includes(spec.symbol) ? 8 : 0,
		},
		limits: Object.fromEntries(
			Object.entries(spec.limits).map(([name, limit]) => [
				name,
				{ pos: limit.pos * gain, neg: limit.neg * gain },
			]),
		),
		pose: (rig, t) => {
			const pose = spec.pose(rig, t);
			pose.bones.forEach((bone, i) => {
				const name = rig.bones[i].name;
				if (name === 'frame') return;
				// Top-edge roots and painted facial joints have less clearance.
				const jointGain =
					spec.symbol === 'H1' && name !== 'body'
						? 1.5
						: spec.symbol === 'W' && name === 'head'
							? 1.4
							: gain;
				const travelGain =
					['H3', 'H4'].includes(spec.symbol) && name === 'panel'
						? 1.05
						: spec.symbol === 'S'
							? // the seal now leaps whole (leapWin.ts); a larger
								// slide of the bunch folds the medallion's face
								1
							: jointGain;
				bone.angle *= jointGain;
				bone.dx *= travelGain;
				bone.dy *= travelGain;
				// Preserve the painted material while increasing the gesture arc.
				const shapeGain = ['H1', 'H3', 'H4', 'W', 'S'].includes(spec.symbol)
					? 1.05
					: 1 + (gain - 1) * 0.5;
				bone.along = 1 + (bone.along - 1) * shapeGain;
				bone.across = 1 + (bone.across - 1) * shapeGain;
			});
			return pose;
		},
	};
};
