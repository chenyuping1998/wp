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
	const beat = (t, lag = 0) => wave(t, CLUB_BEAT, lag);
	const long = (t, lag = 0) => wave(t, CLUB_LOOP, lag);
	const bones = {}, secondary = {};
	const track = (target, bone, channel, fn) => {
		if (!available.has(bone)) return;
		target[bone] ??= {};
		target[bone][channel] = bake({ duration: CLUB_LOOP, loop: true, value: fn }, { fps: 60, tolerance: 0.025, maxSegment: 0.065 });
	};
	const main = (bone, channel, fn) => track(bones, bone, channel, fn);
	const follow = (bone, fn) => track(secondary, bone, 'rotate', fn);

	// Sway leads; chest rotation follows 55 ms later. The fast pulse is small
	// enough to read as weight rather than a jumping cutout.
	main('torso', 'translatex', (t) => 8.5 * sway(t) + 1.2 * long(t));
	main('torso', 'translatey', (t) => -1.7 * (1 - Math.cos(2 * Math.PI * t / CLUB_BEAT)) + 0.8 * long(t, 0.16));
	main('torso', 'rotate', (t) => 2.2 * sway(t, 0.055) + 0.35 * beat(t, 0.025));
	main('torso', 'scalex', (t) => 1 + 0.0045 * long(t, 0.12));
	main('torso', 'scaley', (t) => 1 + 0.0075 * long(t, 0.12) + 0.0015 * beat(t, 0.04));
	// Counterrotation stabilises the gaze; a delayed nod follows the beat.
	main('head', 'rotate', (t) => -2.0 * sway(t, 0.13) + 1.05 * beat(t, 0.075));
	main('head', 'translatex', (t) => -1.3 * sway(t, 0.1));
	main('head', 'translatey', (t) => 0.85 * beat(t, 0.11));
	main('head', 'scaley', (t) => 1 - 0.0025 * beat(t, 0.07));
	// Unequal shoulder phases keep the silhouette relaxed and asymmetric.
	main('armL', 'rotate', (t) => -1.45 * sway(t, 0.12) + 0.65 * beat(t, 0.1));
	main('armL_fore', 'rotate', (t) => 1.25 * sway(t, 0.19) - 0.55 * beat(t, 0.16));
	main('armL_hand', 'rotate', (t) => 0.65 * sway(t, 0.24));
	main('armR', 'rotate', (t) => -1.7 * sway(t, 0.18) - 0.75 * beat(t, 0.06));
	main('armR_fore', 'rotate', (t) => 1.8 * sway(t, 0.25) + 0.9 * beat(t, 0.14));
	main('armR_hand', 'rotate', (t) => -0.8 * sway(t, 0.29));

	// Track 1 exclusively owns loose accessories. It intentionally contains no
	// torso, head, arm or DJ finger channels, so gestures remain authoritative.
	follow('helmet', (t) => 0.65 * sway(t, 0.2) + 0.35 * beat(t, 0.12));
	follow('hairTip', (t) => 1.6 * sway(t, 0.29) + 1.05 * beat(t, 0.18));
	follow('phoneL', (t) => -0.8 * sway(t, 0.16) + 0.6 * beat(t, 0.12));
	follow('phoneR', (t) => 0.75 * sway(t, 0.2) - 0.55 * beat(t, 0.14));
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
