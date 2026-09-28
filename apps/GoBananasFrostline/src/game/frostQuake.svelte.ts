// THE FRONT ANSWERS: what the chest beat does to the ice when the feature
// triggers.
//
// He beats his chest six times while the Scatters ring, and on this trigger the
// whole arctic front takes it: the scene jolts with each strike, snow sloughs off
// something just above the frame in clumps, hard ice pellets (graupel) come down
// fast and BOUNCE off the bottom of the frame, and fine powder drifts down and
// hangs in the air after the last strike.
//
// This is Go Bananas Boat's harbour splash (game/dockSplash.svelte.ts), which is
// itself Go Boomana's cave quake moved to a dock. Same clock, same strike times,
// same two layers either side of the board. What changes is the material, and
// the material decides the one surprising beat: Boat's water goes UP as spray;
// snow cannot, but ice can — a pellet that hits hard rebounds. So the upward
// moment here is the graupel bounce.
//
// ONE CLOCK, THREE READERS. Game.svelte shakes the scene with it, and the two
// SnowShed layers (one behind the board, one in front of it) draw the ice with
// it. Keeping the clock here, rather than in any one of them, is what keeps the
// jolts and the snow on the same strike.
//
// Timed with setInterval and Date.now, not requestAnimationFrame, which stops
// dead in a hidden tab. Nothing awaits this, but a quake frozen half-way would
// leave the scene offset and snow hanging in mid-air until the tab came back.

// The strikes, mirrored from Mascot.svelte (BEAT_START_MS / BEAT_GAP_MS), which
// mirrors them from design/generate_monkey_spine.mjs. Change all three together.
export const QUAKE_BEAT_START_MS = 480;
export const QUAKE_BEAT_GAP_MS = 300;
export const QUAKE_BEATS = 6;
export const strikeAt = (i: number) => QUAKE_BEAT_START_MS + i * QUAKE_BEAT_GAP_MS;

// Long enough for the powder shaken off on strike six to drift most of the way
// down and fade. Inside the trigger's 3s bell hold plus the scatter celebration
// that follows it, so the snow is still settling while the Scatters ring.
export const QUAKE_MS = 4200;

export const frostQuake = $state({ clock: -1 });

let timer: ReturnType<typeof setInterval> | undefined;

export const startFrostQuake = () => {
	clearInterval(timer);
	const t0 = Date.now();
	frostQuake.clock = 0;
	timer = setInterval(() => {
		const t = Date.now() - t0;
		if (t >= QUAKE_MS) {
			clearInterval(timer);
			frostQuake.clock = -1;
			return;
		}
		frostQuake.clock = t;
	}, 16);
};

export const stopFrostQuake = () => {
	clearInterval(timer);
	frostQuake.clock = -1;
};

// THE SHAKE, as an offset for the scene container.
//
// Boomana's jolt, not Boat's. Each strike is a hit that dies in about a quarter
// of a second and each is a little harder than the last, so the six read as a
// build rather than as a machine. Boat adds a slow roll under the jolts because
// a dock FLOATS; frozen ground does not, so there is no roll — just a short low
// tremor between the first strike and the last, which stops when he does.
//
// The jolt has to fit inside the background's overscan. Background.svelte holds
// its drift to 0.3 of the slack for exactly this (OVERSCAN 1.12): at a 1080
// canvas that leaves ~26px spare at the drift's extreme, against a worst jolt
// here of ~15px.
export const quakeShake = (t: number, height: number) => {
	if (t < 0) return { x: 0, y: 0 };
	let x = 0;
	let y = 0;
	for (let i = 0; i < QUAKE_BEATS; i++) {
		const dt = t - strikeAt(i);
		if (dt < 0 || dt > 340) continue;
		const amp = height * 0.0052 * (1 + i * 0.22) * Math.exp(-dt / 80);
		y += amp * Math.cos(dt * 0.085);
		x += amp * 0.55 * Math.sin(dt * 0.11 + i * 1.7);
	}
	const last = strikeAt(QUAKE_BEATS - 1) + 200;
	if (t > QUAKE_BEAT_START_MS && t < last) {
		const r = height * 0.0012;
		x += r * Math.sin(t * 0.09);
		y += r * 0.6 * Math.sin(t * 0.13 + 0.8);
	}
	return { x, y };
};
