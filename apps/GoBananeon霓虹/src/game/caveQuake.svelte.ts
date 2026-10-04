// THE CAVE QUAKE: what the chest beat does to the mine when a feature triggers.
//
// He beats his chest six times while the Scatters ring, and on this trigger
// the mine answers: the whole scene jolts with each strike, and the roof sheds
// grit and a few rocks. It is the one moment the game is set in a cave rather
// than in front of a painting of one.
//
// ONE CLOCK, THREE READERS. Game.svelte shakes the scene with it, and the two
// StrikeLights layers (one behind the board, one in front of it) flash the
// club lights (GoBoomana dropped rocks here)
// with it. Keeping the clock here, rather than in any one of them, is what
// keeps the jolts and the rocks on the same strike.
//
// Scatter trigger only. The chest beat also plays on mega/epic/max wins, and
// there it stays a celebration: a trigger is the mine reacting to what just
// landed in it, a big win is him reacting to the money, and shaking the room
// on every big win would wear the effect out.
//
// Timed with setInterval and Date.now, not requestAnimationFrame, which stops
// dead in a hidden tab. Nothing awaits this, but a quake frozen half-way would
// leave the scene zoomed and offset until the tab came back.

// The strikes, mirrored from Mascot.svelte (BEAT_START_MS / BEAT_GAP_MS), which
// mirrors them from design/generate_monkey_spine.mjs. Change all three together.
export const QUAKE_BEAT_START_MS = 480;
export const QUAKE_BEAT_GAP_MS = 300;
export const QUAKE_BEATS = 6;
export const strikeAt = (i: number) => QUAKE_BEAT_START_MS + i * QUAKE_BEAT_GAP_MS;

// long enough for the last rocks thrown loose on strike six to clear the screen
export const QUAKE_MS = 3300;

export const caveQuake = $state({ clock: -1 });

let timer: ReturnType<typeof setInterval> | undefined;

export const startCaveQuake = () => {
	clearInterval(timer);
	const t0 = Date.now();
	caveQuake.clock = 0;
	timer = setInterval(() => {
		const t = Date.now() - t0;
		if (t >= QUAKE_MS) {
			clearInterval(timer);
			caveQuake.clock = -1;
			return;
		}
		caveQuake.clock = t;
	}, 16);
};

export const stopCaveQuake = () => {
	clearInterval(timer);
	caveQuake.clock = -1;
};

// THE SHAKE, as an offset and a zoom for the scene container.
//
// Each strike is a jolt that dies in about a quarter of a second, and each is
// a little harder than the last, so the six read as a build rather than as a
// machine. Under them runs a low rumble from the first strike until the dust
// settles. Mostly vertical — a fist on a chest, and a roof above — with enough
// sideways to stop it looking like a bounce.
//
// THE ZOOM IS WHAT KEEPS THE EDGES COVERED. Offset the scene and the canvas
// edge behind it shows; zooming in 2.4% for the duration puts ~1.2% of margin
// on every side, which is more than the largest jolt. It eases in and out, so
// the zoom itself reads as the camera bracing rather than as a jump.
export const quakeShake = (t: number, height: number) => {
	if (t < 0) return { x: 0, y: 0, zoom: 1 };
	const envelope =
		t < QUAKE_BEAT_START_MS
			? t / QUAKE_BEAT_START_MS
			: t > QUAKE_MS - 500
				? Math.max(0, (QUAKE_MS - t) / 500)
				: 1;
	let x = 0;
	let y = 0;
	for (let i = 0; i < QUAKE_BEATS; i++) {
		const dt = t - strikeAt(i);
		if (dt < 0 || dt > 320) continue;
		const amp = height * 0.0042 * (1 + i * 0.22) * Math.exp(-dt / 75);
		y += amp * Math.cos(dt * 0.085);
		x += amp * 0.55 * Math.sin(dt * 0.11 + i * 1.7);
	}
	const rumbleOn = t > QUAKE_BEAT_START_MS && t < strikeAt(QUAKE_BEATS - 1) + 900;
	if (rumbleOn) {
		const r = height * 0.0011;
		y += r * Math.sin(t * 0.061) * Math.sin(t * 0.017);
		x += r * Math.sin(t * 0.047 + 1.3);
	}
	return { x, y, zoom: 1 + 0.024 * envelope };
};
