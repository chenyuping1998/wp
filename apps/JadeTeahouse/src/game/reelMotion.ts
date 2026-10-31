type Motion = 'spinning' | 'bouncing' | 'stopped';

// Measure strip velocity, rebasing when the engine exchanges padding strips.
export function createReelBlur(symbolSize: number) {
	let previous: { now: number; offset: number; key: unknown } | undefined;
	let amount = 0;
	return {
		sample({ now, offset, key, motion }: { now: number; offset: number; key: unknown; motion: Motion }) {
			const last = previous;
			previous = { now, offset, key };
			if (motion === 'stopped') return (amount = 0);
			if (!last || last.key !== key) return amount;
			const dt = now - last.now;
			if (dt <= 0 || dt > 80 || Math.abs(offset - last.offset) > symbolSize * 1.5) return amount;
			const velocity = Math.abs(offset - last.offset) / dt;
			const target = symbolSize * (motion === 'bouncing'
				? Math.min(0.018, velocity * 0.015)
				: Math.min(0.14, velocity * 0.036));
			// Sharpen faster than the blur builds, keeping the stop readable.
			amount += (target - amount) * (1 - Math.exp(-dt / (target < amount ? 24 : 45)));
			return amount;
		},
	};
}
