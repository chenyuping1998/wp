/**
 * THE HIGH SYMBOLS PERFORM IN THEIR CELL.
 *
 * A low symbol's win pops and hops on its own cell (SymbolMeshWin's cellPop /
 * cellHop). The four highs do something no low does: the whole tile crouches,
 * springs up big — swelling toward the camera — does its trick, comes down
 * hard enough to shake the frame and throw dust, takes one smaller bounce and
 * settles. That difference is the point: a player should know it is a high
 * win before reading any number.
 *
 * It STAYS ON ITS CELL. A first version launched the tile a full cell up, over
 * its neighbour; that was asked to go. The spring is carried by scale and
 * squash instead of by height.
 *
 * Each high has its own trick, so a line of mixed highs is a little show:
 *   H1 boombox  no spin: BASS — it sways with the music and thumps (squash
 *               pulses) on every beat after the landing, in time with its
 *               speakers (neonSymbols.ts)
 *   H2 helmet   turns round like a card being flipped
 *   H3 can      a spin
 *   H4 sneaker  a KICKFLIP: a full roll about its long axis (the width goes
 *               through zero once) with a backward flip on top
 *
 * The mesh acting inside the tile (neonSymbols.ts) plays on top.
 *
 * Pure numbers over time, imports nothing: the same function drives the game
 * and can be checked under bare node. Times are win ms at normal speed; the
 * pose is exactly rest at 0 and at the end, so the swap from and back to the
 * static sprite cannot jump.
 */

export type JumpPose = {
	/** squash and stretch about the tile's feet */
	sx: number;
	sy: number;
	/** degrees, clockwise */
	rot: number;
	/** uniform scale on top: nearer the camera in the air */
	pop: number;
	/** 0..1: how hard it is landing this frame (dust, shake) — edge-detected by the caller */
	landed: number;
};

type Trick = 'flip' | 'card' | 'spin' | 'rock' | 'bass' | 'kickflip' | 'groove';
// W is not a high, but it acts here too: its tile GROOVES (see 'groove' below)
export const HIGH_JUMP: Record<string, Trick> = { H1: 'bass', H2: 'card', H3: 'spin', H4: 'kickflip', W: 'groove' };

// the beats, ms
const CROUCH = 130; // squashing down
const TAKEOFF = 130;
const LAND = 600; // first landing
const HOP2_UP = 880; // the second, small bounce
const HOP2_LAND = 1120;
const OUT_MS = 260;

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const smooth = (v: number) => {
	const t = clamp01(v);
	return t * t * (3 - 2 * t);
};
const inOut = (v: number) => {
	const t = clamp01(v);
	return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
};
/** a damped spring kicked at t0, starting at 0 */
const flick = (t: number, t0: number, hz: number, decay: number) =>
	t < t0 ? 0 : Math.exp((-decay * (t - t0)) / 1000) * Math.sin((2 * Math.PI * hz * (t - t0)) / 1000);
/** a quick thump at `at`: up over 40ms, out over ~110 */
const pulse = (t: number, at: number) => (t < at - 40 ? 0 : smooth((t - at + 40) / 40) * Math.exp(-Math.max(0, t - at) / 110));
/** 0 -> 1 -> 0 over [a, b] */
const bump = (t: number, a: number, b: number) => (t <= a || t >= b ? 0 : Math.sin((Math.PI * (t - a)) / (b - a)));

export const REST_JUMP: JumpPose = { sx: 1, sy: 1, rot: 0, pop: 1, landed: 0 };

export const highJump = (symbol: string, t: number, durationMs: number, side = 1): JumpPose => {
	const trick = HIGH_JUMP[symbol];
	if (!trick || t <= 0 || t >= durationMs) return { ...REST_JUMP };
	const home = 1 - smooth((t - (durationMs - OUT_MS)) / OUT_MS);

	// THE WILD GROOVES instead of jumping: it swells up on the hit and then
	// moves with the music — squashing on every beat (in time with its
	// headbang, neonSymbols.ts) and swaying side to side — and never leaves the
	// floor, so no landings, no dust.
	if (trick === 'groove') {
		const beats = [260, 520, 780, 1040].reduce((s, at) => s + pulse(t, at), 0);
		const s = (0.08 * bump(t, 0, 260) - 0.1 * beats) * home;
		const sway = Math.sin((2 * Math.PI * (t - 260)) / 1040) * smooth((t - 200) / 200);
		return {
			sx: 1 - s * 0.7,
			sy: 1 + s,
			rot: side * 6 * sway * home,
			pop: 1 + (0.2 * smooth(t / 260) + 0.04 * beats) * home,
			landed: 0,
		};
	}

	// SQUASH AND STRETCH (y along the jump, x the other way, roughly keeping
	// area): the crouch, the stretch out of it, the smack of each landing
	const launch = bump(t, TAKEOFF, TAKEOFF + 240);
	const fall = bump(t, LAND - 160, LAND);
	const smack = flick(t, LAND, 3.2, 6);
	const smack2 = flick(t, HOP2_LAND, 3.6, 8);
	// down into the crouch, and back to 0 exactly at TAKEOFF, where the launch
	// stretch starts from 0 — so the two hand over with no step
	const crouchIn = t < TAKEOFF ? Math.sin((Math.PI / 2) * smooth(t / CROUCH)) * (1 - smooth((t - (TAKEOFF - 50)) / 50)) : 0;
	const s = -0.18 * crouchIn + 0.2 * launch + 0.08 * fall - 0.26 * smack - 0.12 * smack2 + 0.12 * bump(t, HOP2_UP, HOP2_UP + 140) - 0.14 * bump(t, HOP2_UP - 120, HOP2_UP);
	// the boombox keeps thumping after it lands, on its speakers' beats
	const beats = trick === 'bass' ? 0.1 * (pulse(t, 860) + pulse(t, HOP2_LAND)) + 0.05 * pulse(t, LAND) : 0;
	const sy = 1 + (s - beats) * home;
	const sx = 1 - s * 0.7 * home;

	// THE TRICK, all of it inside the first flight
	const air = smooth((t - TAKEOFF) / (LAND - TAKEOFF - 40));
	let rot = 0;
	let flipX = 1;
	switch (trick) {
		case 'flip':
			rot = -360 * inOut(air) * side;
			break;
		case 'spin':
			rot = 360 * inOut(air) * side;
			break;
		case 'card':
			// round like a card: its width through zero and back, twice
			flipX = Math.cos(2 * Math.PI * inOut(air));
			rot = 8 * Math.sin(Math.PI * air) * side;
			break;
		case 'bass':
			// swaying to the music through the flight
			rot = side * 7 * Math.sin((2 * Math.PI * (t - TAKEOFF)) / (LAND - TAKEOFF)) * bump(t, TAKEOFF, LAND);
			break;
		case 'kickflip':
			// the board-trick roll: width through zero once, and over backwards
			flipX = Math.cos(Math.PI * 2 * inOut(air));
			rot = -360 * inOut(air) * side;
			break;
		case 'rock':
			// nose up leaving, nose down landing, a wobble on each touchdown
			rot = side * (14 * bump(t, TAKEOFF, (TAKEOFF + LAND) / 2) - 14 * bump(t, (TAKEOFF + LAND) / 2, LAND) + 9 * smack + 6 * smack2);
			break;
	}
	// a full turn is the same as none: land square, whatever the trick
	if (t >= LAND) rot = trick === 'rock' || trick === 'bass' ? rot : 0;

	// "in the air" is nearer the camera: the swell carries the spring now that
	// the tile does not rise. A little proud of the board afterwards, breathing.
	const up = Math.sin(Math.PI * clamp01((t - TAKEOFF) / (LAND - TAKEOFF)));
	const up2 = Math.sin(Math.PI * clamp01((t - HOP2_UP) / (HOP2_LAND - HOP2_UP))) * (trick === 'rock' ? 0.4 : 0.22);
	const pop =
		1 +
		(0.24 * up +
			0.24 * up2 +
			0.08 * smooth((t - LAND) / 200) +
			0.025 * Math.sin((t - LAND) / 90) * smooth((t - HOP2_LAND) / 200)) *
			home;

	return {
		sx: sx * flipX,
		sy,
		rot: rot * home,
		pop,
		landed: t >= LAND && t < LAND + 40 ? 1 : t >= HOP2_LAND && t < HOP2_LAND + 40 ? 0.45 : 0,
	};
};
