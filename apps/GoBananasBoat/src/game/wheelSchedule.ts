/** A monotone, cell-by-cell wheel stop. The book result is placed at the last knot. */
export const wheelSchedule = (cells: number, ms: number, approachCells: number, ratio: number) => {
	const tail = Array.from({ length: approachCells }, (_, i) => (1 / ratio) ** i);
	const cruise = Math.max(0, cells - approachCells);
	const unit = ms / (cruise + tail.reduce((a, b) => a + b, 0));
	const dwell = [...Array.from({ length: cruise }, () => unit), ...tail.map((n) => n * unit)];
	const times = [0];
	for (const d of dwell) times.push(times[times.length - 1] + d);
	const vel = dwell.map((d, i) => (i === 0 ? 1 / d : 2 / (dwell[i - 1] + d)));
	vel.push(0);
	return { dwell, times, vel, cruise, ms };
};

export const wheelPositionAt = (t: number, s: ReturnType<typeof wheelSchedule>) => {
	const n = s.dwell.length;
	if (t >= s.ms) return n;
	let i = 0;
	while (i < n - 1 && t >= s.times[i + 1]) i++;
	const h = s.dwell[i];
	const u = Math.max(0, Math.min(1, (t - s.times[i]) / h));
	const u2 = u * u;
	const u3 = u2 * u;
	const m0 = s.vel[i] * h;
	const m1 = s.vel[i + 1] * h;
	return (2 * u3 - 3 * u2 + 1) * i + (u3 - 2 * u2 + u) * m0 + (-2 * u3 + 3 * u2) * (i + 1) + (u3 - u2) * m1;
};
