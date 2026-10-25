
export const tumbleTiming = ({ chain = 1, turbo = false, turboLevel = 1 } = {}) => {
	const scale = (chain >= 4 ? 0.8 : 1) * (turbo ? 0.5 : 1) * (turbo && turboLevel === 2 ? 0.8 : 1);
	// Each stage stays within the brief's 簣15%. Leave frame-scheduling margin
	// below ten seconds for an eight-link chain, including all column offsets.
	const highlightMs = 270 * scale;
	const stoneMs = 135 * scale;
	const crackMs = 108 * scale;
	const crumbleMs = 270 * scale;
	const dropMs = 252 * scale;
	const columnStaggerMs = 27 * scale;
	const settleMs = 135 * scale;
	return {
		scale,
		highlightMs,
		stoneMs,
		crackMs,
		markMs: highlightMs + stoneMs + crackMs,
		crumbleMs,
		dropMs,
		columnStaggerMs,
		settleMs,
		totalMs: highlightMs + stoneMs + crackMs + crumbleMs + dropMs + columnStaggerMs * 5 + settleMs,
	};
};

