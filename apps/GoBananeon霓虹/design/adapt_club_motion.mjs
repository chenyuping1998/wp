// Original DJ groove, authored for this PSD rig. No hip/root motion: the feet
// remain planted while the upper body shifts its weight over the fixed stance.
import { bake } from '../../../../spine-generator/src/bake.ts';

export const CLUB_BPM = 125;
export const CLUB_BEAT = 60 / CLUB_BPM;
export const CLUB_LOOP = CLUB_BEAT * 8;

export function applyClubMotion(skeleton) {
	const available = new Set(skeleton.bones.map((bone) => bone.name));
	const wave = (t, period, lag = 0) => Math.sin(2 * Math.PI * (t - lag) / period) - Math.sin(-2 * Math.PI * lag / period);
	const sway = (t, lag = 0) => wave(t, CLUB_BEAT * 4, lag);
	// THE BEAT AS A HIT, not a sine. A sine at the beat period reads as wobble:
	// it spends as long going up as coming down and never lands anywhere. A
	// groove drops ON the kick and recovers through the rest of the beat — a
	// 9% attack, then a long ease back. Peaks sit at k * CLUB_BEAT + lag, so
	// with Mascot's beat lock the drop lands on the kick the player hears.
	const ATTACK = 0.09;
	const hitShape = (phase) => phase < ATTACK
		? (phase / ATTACK) ** 2 * (3 - 2 * phase / ATTACK)
		: (1 - (phase - ATTACK) / (1 - ATTACK)) ** 2.6;
	const hitAt = (t, lag) => hitShape((((t - lag) / CLUB_BEAT) % 1 + 1) % 1);
	const beat = (t, lag = 0) => hitAt(t, lag) - hitAt(0, lag);
	const long = (t, lag = 0) => wave(t, CLUB_LOOP, lag);
	const bones = {}, secondary = {};
	const track = (target, bone, channel, fn) => {
		if (!available.has(bone)) return;
		target[bone] ??= {};
		target[bone][channel] = bake({ duration: CLUB_LOOP, loop: true, value: fn }, { fps: 60, tolerance: 0.025, maxSegment: 0.065 });
	};
	const main = (bone, channel, fn) => track(bones, bone, channel, fn);
	const follow = (bone, fn) => track(secondary, bone, 'rotate', fn);

	// Sway leads; chest rotation follows 55 ms later. On every beat the body
	// drops into the kick (torso first, head 50 ms behind, hair and phones
	// after that) — a groove you can count, still well inside the meshes.
	main('torso', 'translatex', (t) => 8.5 * sway(t) + 1.2 * long(t));
	main('torso', 'translatey', (t) => -4.4 * beat(t, 0.015) + 0.8 * long(t, 0.16));
	main('torso', 'rotate', (t) => 2.2 * sway(t, 0.055) + 0.8 * beat(t, 0.025));
	main('torso', 'scalex', (t) => 1 + 0.0045 * long(t, 0.12));
	main('torso', 'scaley', (t) => 1 + 0.0075 * long(t, 0.12) - 0.006 * beat(t, 0.02));
	// Counterrotation stabilises the gaze; a delayed nod follows the beat.
	main('head', 'rotate', (t) => -2.0 * sway(t, 0.13) + 2.6 * beat(t, 0.07));
	main('head', 'translatex', (t) => -1.3 * sway(t, 0.1));
	main('head', 'translatey', (t) => -2.4 * beat(t, 0.06));
	main('head', 'scaley', (t) => 1 - 0.004 * beat(t, 0.06));
	// Unequal shoulder phases keep the silhouette relaxed and asymmetric.
	main('armL', 'rotate', (t) => -1.45 * sway(t, 0.12) + 1.1 * beat(t, 0.09));
	main('armL_fore', 'rotate', (t) => 1.25 * sway(t, 0.19) - 0.9 * beat(t, 0.15));
	main('armL_hand', 'rotate', (t) => 0.65 * sway(t, 0.24));
	main('armR', 'rotate', (t) => -1.7 * sway(t, 0.18) - 1.2 * beat(t, 0.06));
	main('armR_fore', 'rotate', (t) => 1.8 * sway(t, 0.25) + 1.4 * beat(t, 0.13));
	main('armR_hand', 'rotate', (t) => -0.8 * sway(t, 0.29));

	// Track 1 exclusively owns loose accessories. It intentionally contains no
	// torso, head, arm or DJ finger channels, so gestures remain authoritative.
	follow('helmet', (t) => 0.65 * sway(t, 0.2) + 0.7 * beat(t, 0.11));
	follow('hairTip', (t) => 1.6 * sway(t, 0.29) + 2.0 * beat(t, 0.16));
	follow('phoneL', (t) => -0.8 * sway(t, 0.16) + 1.0 * beat(t, 0.11));
	follow('phoneR', (t) => 0.75 * sway(t, 0.2) - 0.9 * beat(t, 0.13));
	follow('coatL', (t) => 1.3 * sway(t, 0.24) + 0.4 * beat(t, 0.18));
	follow('coatR', (t) => -1.15 * sway(t, 0.27) - 0.35 * beat(t, 0.2));
	follow('cuffL', (t) => 0.8 * sway(t, 0.2) + 0.25 * beat(t, 0.14));
	follow('cuffR', (t) => -0.75 * sway(t, 0.24) - 0.3 * beat(t, 0.17));
	follow('pantL', (t) => 0.4 * sway(t, 0.19));
	follow('pantR', (t) => -0.35 * sway(t, 0.23));
	follow('banana', (t) => 1.15 * sway(t, 0.18) + 0.35 * beat(t, 0.15));
	track(secondary, 'jaw', 'rotate', (t) => 0.35 * long(t, 0.2));

	skeleton.animations.club_idle = { bones };
	skeleton.animations.club_flutter = { bones: secondary };
	skeleton.animations.idle = structuredClone(skeleton.animations.club_idle);
}
