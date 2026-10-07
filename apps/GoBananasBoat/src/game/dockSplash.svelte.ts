// THE HARBOUR ANSWERS: what the chest beat does to the dock when the feature
// triggers.
//
// He beats his chest six times while the Scatters ring, and on this trigger the
// whole waterfront takes it: the scene jolts with each strike, water pours off
// something just above the frame and breaks into drops, spray slaps up from
// below, and a few fat drops land on the lens and slide down it. It is the
// one moment the game is set ON a dock rather than in front of a painting of one.
//
// Go Boomana does the same thing in a mine (game/caveQuake.svelte.ts: the roof
// sheds grit and rocks), and this is that structure moved to the waterfront —
// the same clock, the same strike times, the same two layers either side of the
// board. What falls is water, and water does two things rock cannot: it RUNS,
// so it leaves trails, and it SPLASHES, so it comes back up.
//
// ONE CLOCK, THREE READERS. Game.svelte shakes the scene with it, and the two
// HarbourSplash layers (one behind the board, one in front of it) draw the water
// with it. Keeping the clock here, rather than in any one of them, is what keeps
// the jolts and the water on the same strike.
//
// Timed with setInterval and Date.now, not requestAnimationFrame, which stops
// dead in a hidden tab. Nothing awaits this, but a splash frozen half-way would
// leave the scene offset and drops hanging in mid-air until the tab came back.

// The strikes, mirrored from Mascot.svelte (BEAT_START_MS / BEAT_GAP_MS), which
// mirrors them from design/generate_monkey_spine.mjs. Change all three together.
export const SPLASH_BEAT_START_MS = 480;
export const SPLASH_BEAT_GAP_MS = 300;
export const SPLASH_BEATS = 6;
export const strikeAt = (i: number) => SPLASH_BEAT_START_MS + i * SPLASH_BEAT_GAP_MS;

// Long enough for the last streams thrown off on strike six to clear the screen
// and the lens drops to slide out of frame.
export const SPLASH_MS = 3600;

export const dockSplash = $state({ clock: -1 });

let timer: ReturnType<typeof setInterval> | undefined;

export const startDockSplash = () => {
	clearInterval(timer);
	const t0 = Date.now();
	dockSplash.clock = 0;
	timer = setInterval(() => {
		const t = Date.now() - t0;
		if (t >= SPLASH_MS) {
			clearInterval(timer);
			dockSplash.clock = -1;
			return;
		}
		dockSplash.clock = t;
	}, 16);
};

export const stopDockSplash = () => {
	clearInterval(timer);
	dockSplash.clock = -1;
};

// THE SHAKE, as an offset for the scene container.
//
// Boomana's jolt, with one change. Each strike is a hit that dies in about a
// quarter of a second and each is a little harder than the last, so the six read
// as a build rather than as a machine. But a mine is rock, and a dock FLOATS: so
// under the jolts there is a slow roll that starts on the first strike and keeps
// going after the last one — the pontoon rocking on the water it has just
// stirred up — rather than Boomana's rumble that stops when the roof does.
//
// NO ZOOM, unlike Boomana, and that is not an omission. Boomana zooms 2.4% to
// cover the canvas edge its offset would expose. Boat's background already
// carries its own margin for exactly this (Background.svelte, OVERSCAN 1.14 with
// the drift held to 0.3 of the slack: ~36px spare at the worst point), and the
// largest jolt here is well inside it.
export const splashShake = (t: number, height: number) => {
	if (t < 0) return { x: 0, y: 0 };
	let x = 0;
	let y = 0;
	for (let i = 0; i < SPLASH_BEATS; i++) {
		const dt = t - strikeAt(i);
		if (dt < 0 || dt > 340) continue;
		const amp = height * 0.0052 * (1 + i * 0.22) * Math.exp(-dt / 80);
		y += amp * Math.cos(dt * 0.085);
		x += amp * 0.55 * Math.sin(dt * 0.11 + i * 1.7);
	}
	// the roll: slow, mostly sideways, easing in on the first strike and out
	// over the last 700ms
	if (t > SPLASH_BEAT_START_MS) {
		const inK = Math.min(1, (t - SPLASH_BEAT_START_MS) / 600);
		const outK = Math.min(1, Math.max(0, (SPLASH_MS - t) / 700));
		const r = height * 0.0026 * inK * outK;
		x += r * Math.sin(t * 0.0042);
		y += r * 0.45 * Math.sin(t * 0.0084 + 0.6);
	}
	return { x, y };
};
