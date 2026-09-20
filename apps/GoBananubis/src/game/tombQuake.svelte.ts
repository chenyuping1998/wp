// THE TOMB QUAKE: what the chest beat does to the hall when a feature triggers.
//
// He beats his chest four times while the Scatters ring, and on this trigger the
// tomb answers: the whole scene jolts with each strike, and the ceiling sheds
// sand and a few blocks of stone. It is the one moment the game is set INSIDE
// the hall rather than in front of a painting of one.
//
// Ported from Go Boomana's cave quake (game/caveQuake.svelte.ts), which solved the
// same problem — one clock, the camera and the debris all reading it — and kept
// here under this game's own name and timing.
//
// ONE CLOCK, THREE READERS. Game.svelte shakes the scene with it, and the two
// TombRockfall layers (one behind the board, one in front of it) drop stone with
// it. Keeping the clock here, rather than in any one of them, is what keeps the
// jolts and the debris on the same strike.
//
// Trigger only. The chest beat is what the free-game trigger plays, and it is the
// one moment worth moving the room for; doing it more often would wear it out.
//
// Timed with setInterval and Date.now, not requestAnimationFrame, which stops
// dead in a hidden tab (see the pixi-v8 note in this repo's memory). Nothing
// awaits this, but a quake frozen half-way would leave the scene zoomed and
// offset until the tab came back.

// THE STRIKES — the single source for them.
//
// These are the Anubis chest beat's own numbers: four strikes, the first at
// 0.36s and then every 0.42s, over a 2.44s clip. design/generate_anubis_spine.mjs
// prints them ("chestbeat 4 strikes at 0.36, 0.78, 1.20, 1.62s"), and
// design/generate_voice.mjs bakes the roar's grunts onto the same four.
//
// Mascot.svelte used to keep its own copy for its impact stars and board knocks;
// it imports these now, so the stars, the knocks, the shake and the falling
// stone cannot drift apart. Boomana's version mirrored the GORILLA's six strikes
// 0.3s apart — copying those numbers here would have shaken the room on beats
// that no longer exist, which is the same mistake the old roar clip made.
export const BEAT_START_MS = 360;
export const BEAT_GAP_MS = 420;
export const BEATS = 4;
export const strikeAt = (i: number) => BEAT_START_MS + i * BEAT_GAP_MS;

// long enough for the last stone thrown loose on the fourth strike to clear
// the screen
export const QUAKE_MS = 3200;

export const tombQuake = $state({ clock: -1 });

let timer: ReturnType<typeof setInterval> | undefined;

export const startTombQuake = () => {
	clearInterval(timer);
	const t0 = Date.now();
	tombQuake.clock = 0;
	timer = setInterval(() => {
		const t = Date.now() - t0;
		if (t >= QUAKE_MS) {
			clearInterval(timer);
			tombQuake.clock = -1;
			return;
		}
		tombQuake.clock = t;
	}, 16);
};

export const stopTombQuake = () => {
	clearInterval(timer);
	tombQuake.clock = -1;
};

// THE SHAKE, as an offset and a zoom for the scene container.
//
// Each strike is a jolt that dies in about a quarter of a second, and each is a
// little harder than the last, so the four read as a build rather than as a
// machine. Under them runs a low rumble from the first strike until the dust
// settles. Mostly vertical — a fist on a chest, and a ceiling above — with enough
// sideways to stop it looking like a bounce.
//
// Four strikes 0.42s apart are further apart than Boomana's six at 0.3, so each
// jolt is a touch harder: fewer blows, each one has to land.
//
// THE ZOOM IS WHAT KEEPS THE EDGES COVERED. Offset the scene and the canvas edge
// behind it shows; zooming in 2.4% for the duration puts ~1.2% of margin on every
// side, which is more than the largest jolt. It eases in and out, so the zoom
// itself reads as the camera bracing rather than as a jump.
export const quakeShake = (t: number, height: number) => {
	if (t < 0) return { x: 0, y: 0, zoom: 1 };
	const envelope =
		t < BEAT_START_MS
			? t / BEAT_START_MS
			: t > QUAKE_MS - 500
				? Math.max(0, (QUAKE_MS - t) / 500)
				: 1;
	let x = 0;
	let y = 0;
	for (let i = 0; i < BEATS; i++) {
		const dt = t - strikeAt(i);
		if (dt < 0 || dt > 340) continue;
		const amp = height * 0.0052 * (1 + i * 0.25) * Math.exp(-dt / 80);
		y += amp * Math.cos(dt * 0.085);
		x += amp * 0.55 * Math.sin(dt * 0.11 + i * 1.7);
	}
	const rumbleOn = t > BEAT_START_MS && t < strikeAt(BEATS - 1) + 900;
	if (rumbleOn) {
		const r = height * 0.0011;
		y += r * Math.sin(t * 0.061) * Math.sin(t * 0.017);
		x += r * Math.sin(t * 0.047 + 1.3);
	}
	return { x, y, zoom: 1 + 0.024 * envelope };
};
