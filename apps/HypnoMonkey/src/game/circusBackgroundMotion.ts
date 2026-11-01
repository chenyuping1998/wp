/** Bounded local motion; stage architecture and camera never move. */
export const circusPropPose = (seconds: number, burstAge = 2) => {
	const ring = burstAge < 2 ? Math.sin(burstAge * 13) * Math.exp(-burstAge * 3) : 0;
	return { signRotation: seconds * .17 + ring * .16, balloonRotation: Math.sin(seconds * 1.2) * .055 + ring * .07 };
};
export const circusBuntingPose = (seconds: number) => Math.sin(seconds * .8) * .008;
export const circusLightPose = (seconds: number, index: number) => ({ rotation: (index ? .2 : -.2) + Math.sin(seconds * .42 + index * 2.4) * .17, alpha: .72 + Math.sin(seconds * 1.3 + index) * .12 });
