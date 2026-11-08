/**
 * Per-column motion blur for the tumbling board (2026-10-31, user: 套用霓虹的轉輪效果) — GoBananeon's reel blur
 * (createReelBlur) measured the cascading way. A tumbling column has no single strip: the survivors drop a few rows
 * and the refills fall in from above, each on its own tween, so the column's speed is its FASTEST symbol's this
 * frame. The rest is Neon's: the blur builds toward that speed slowly and sharpens fast, so a landing reads.
 */
export function createColumnBlur(symbolSize: number) {
	let last: { now: number; ys: Map<object, number> } | undefined;
	let amount = 0;
	return {
		/** `symbols`: each symbol object (stable while it lives) and its current y, px */
		sample({ now, symbols }: { now: number; symbols: { key: object; y: number }[] }) {
			const ys = new Map(symbols.map((s) => [s.key, s.y]));
			const prev = last;
			last = { now, ys };
			if (!prev) return amount;
			const dt = now - prev.now;
			if (dt <= 0 || dt > 80) return amount;
			let fastest = 0;
			for (const [key, y] of ys) {
				const before = prev.ys.get(key);
				// a symbol re-seated from the top of the column jumps rather than moves
				if (before === undefined || Math.abs(y - before) > symbolSize * 1.5) continue;
				fastest = Math.max(fastest, Math.abs(y - before) / dt);
			}
			const target = symbolSize * Math.min(0.14, fastest * 0.036);
			// sharpen faster than the blur builds, keeping the landing readable
			amount += (target - amount) * (1 - Math.exp(-dt / (target < amount ? 24 : 45)));
			if (amount < 0.05) amount = 0;
			return amount;
		},
	};
}
