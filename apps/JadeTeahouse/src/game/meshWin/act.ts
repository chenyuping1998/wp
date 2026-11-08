/**
 * THE ACT every high symbol shares (2026-11-06, user: 「優化茶樓，重點在獎圖動態、
 * 動畫、演繹」). Replaces strongLeap for H1–H4, W and S.
 *
 * What was wrong (offline contact sheets, design/render_mesh_wins.py): all six
 * highs did the SAME thing — squash flat, one big 35–40 px leap, hang in the
 * air ~500 ms barely changing, smash flat (sx 1.25 / sy 0.69), small hop. The
 * part motion (lid, spout, cups) was 4–9°, so what read was a sticker
 * jumping; slot-motion-recipes calls that out as the cheap look ("只留整體縮放
 * 跳動＝廉價貼紙感"). A lantern bounced like a ball.
 *
 * Now the jump is the BEAT, not the act: Pragmatic's three-beat rhythm
 * (ppVocabulary PP_WIN_BEATS — anticipate 133, out of the frame 433, back on
 * the card 667, a second smaller beat 1167, rest 1500), a lift of ~20 px, and
 * squash that keeps the area (sx·sy ≈ 1). Each symbol then PERFORMS on top of
 * that beat, with a hold that is longer than the move: the teapot sits down
 * and pours, the gaiwan scrapes its lid, the steamer's buns puff, the tray
 * presents its cups in a wave, the medallion flips, the lantern swings from
 * its hook. The story lives in each symbol's file; this is only the beat.
 */
import { ppTrack, PP_WIN_BEATS, glowPulse, type PPKey } from './ppVocabulary';
import type { RigidPose } from './meshRig';

/** the act's beats (ms): PP's three-beat win plus where each symbol's hold sits */
export const ACT = {
	anticipate: PP_WIN_BEATS.anticipate, // 133: the wind-up
	pop1: PP_WIN_BEATS.pop1, // 433: out of the frame
	back: PP_WIN_BEATS.back, // 667: back on the card
	hold: 1000, // the performance holds until here
	pop2: PP_WIN_BEATS.pop2, // 1167: the second, smaller beat
	land2: 1400,
	done: PP_WIN_BEATS.done, // 1500
} as const;

/** 0..1 height of the subject over its card (negative = the crouch) */
export const actLift = (t: number, second = 0.45): number =>
	ppTrack(t, [
		[0, 0], [ACT.anticipate, -0.12], [ACT.pop1, 1], [ACT.back, 0],
		[ACT.hold, 0], [ACT.pop2, second], [ACT.land2, 0], [ACT.done, 0],
	]);

// the squash, keyed to the lift: wind-up, stretch on the way up and down,
// impact on each landing, a little rebound — sx·sy stays 1
const SQUASH: PPKey[] = [
	[0, 0], [ACT.anticipate, 0.2], [280, -0.1], [ACT.pop1, 0], [600, -0.06],
	[690, 0.17], [790, -0.04], [900, 0, 'settle'],
	[1080, -0.05], [ACT.pop2, 0], [1330, -0.03], [1425, 0.09], [ACT.done, 0, 'settle'],
];

export type ActOptions = {
	/** px at the first beat's top */
	height: number;
	/** the second beat's height as a share of the first */
	second?: number;
	/** squash strength (1 = the keyed curve) */
	squash?: number;
};

/** The beat: the rigid move (before any turn the symbol adds), the air for the
 *  shadow and the backlight, and the rim light pulse on the beats. */
export const stageAct = (t: number, o: ActOptions): { rigid: RigidPose; air: number; lift: number; flash: number } => {
	const lift = actLift(t, o.second ?? 0.45);
	const air = Math.max(0, Math.min(1, lift));
	const a = (o.squash ?? 1) * ppTrack(t, SQUASH);
	const sx = 1 + a * 0.6;
	return {
		rigid: { sx, sy: 1 / sx, rot: 0, pop: 1 + 0.08 * air, dx: 0, dy: -o.height * air },
		air,
		lift,
		flash: glowPulse(t),
	};
};

/** 0 → 1 → (hold) → 0: a pose a symbol moves into, holds, and leaves */
export const holdTrack = (t: number, from: number, inMs: number, until: number, outMs: number): number =>
	ppTrack(t, [[0, 0], [from, 0], [from + inMs, 1], [until, 1, 'hold'], [until + outMs, 0]]);
