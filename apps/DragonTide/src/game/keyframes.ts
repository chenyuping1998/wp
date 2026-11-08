/**
 * Piecewise keyframe track, eased per segment (smoothstep), held at both ends.
 * Keys are [ms, value] in time order — the form the Unity clips are transcribed
 * in (research/xinstar-angelodin docs/anim_keys.md).
 */
export const keyframes = (ms: number, keys: readonly (readonly [number, number])[]) => {
	if (ms <= keys[0][0]) return keys[0][1];
	for (let i = 1; i < keys.length; i++) {
		const [endMs, endValue] = keys[i];
		if (ms <= endMs) {
			const [startMs, startValue] = keys[i - 1];
			const t = (ms - startMs) / Math.max(1, endMs - startMs);
			return startValue + (endValue - startValue) * t * t * (3 - 2 * t);
		}
	}
	return keys[keys.length - 1][1];
};
