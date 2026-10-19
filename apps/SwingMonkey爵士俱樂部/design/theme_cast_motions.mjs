import { LAUGH } from './laugh_motion_v9.mjs';
// A conductor's four-count and a tap dancer's syncopated steps deform the cast meshes.
const rot = (pairs) => pairs.map(([time, value]) => ({ time, value }));
const xy = (pairs) => pairs.map(([time, x, y]) => ({ time, x, y }));
const sc = (pairs) => pairs.map(([time, x, y]) => ({ time, x, y }));
const put = (animation, name, timelines) => Object.assign(animation.bones[name] ??= {}, timelines);
const beats = Array.from({ length: LAUGH.beats }, (_, i) => (LAUGH.startMs + i * LAUGH.gapMs) / 1000);
const settle = LAUGH.endMs / 1000;
const pulse = (a) => rot([[0, 0], ...beats.flatMap((t, i) => [[t, (i % 2 ? -1 : 1) * a], [t + 0.15, (i % 2 ? -1 : 1) * a * 0.3]]), [settle, 0]]);

export const applyThemeCast = (anims, cast) => {
	if (cast === 'mg') {
		// Bandleader marks the beat with his right hand and shoulders.
		put(anims.idle, 'armR', { rotate: rot([[0, 0], [0.3, -8], [0.6, 2], [0.9, -5], [1.2, 4], [1.5, -8], [1.8, 2], [2.1, -5], [2.4, 0], [2.7, -8], [3, 2], [3.3, -5], [3.6, 4], [3.9, -8], [4.2, 2], [4.5, -5], [4.8, 0]]) });
		put(anims.idle, 'torso', { scale: sc([[0, 1, 1], [0.6, 1.01, 0.984], [1.2, 1, 1], [1.8, 1.01, 0.984], [2.4, 1, 1], [3, 1.01, 0.984], [3.6, 1, 1], [4.2, 1.01, 0.984], [4.8, 1, 1]]) });
		put(anims.cheer, 'armR', { rotate: rot([[0, 0], [0.24, -23], [0.48, 10], [0.72, -20], [0.96, 14], [1.2, -22], [1.6, 0]]) });
		put(anims.cheer, 'armR_fore', { rotate: rot([[0,0],[0.29,5],[0.55,-10],[0.8,6],[1.04,-12],[1.29,-4],[1.6,0]]) });
		put(anims.cheer, 'torso', { rotate: rot([[0, 0], [0.24, -4], [0.48, 2], [0.72, -3], [0.96, 2], [1.2, -4], [1.6, 0]]) });
		// The bandleader cues the brass, steps across and holds the downbeat.
		put(anims.cheer, 'root', { translate: xy([[0,0,0],[0.16,-21,0],[0.42,-48,8],[0.68,-15,21],[0.96,56,1],[1.22,60,0],[1.44,20,0],[1.7,0,0]]) });
		put(anims.cheer, 'hip', { translate: xy([[0,0,0],[0.16,-9,-9],[0.42,-13,13],[0.68,5,-6],[0.96,14,17],[1.22,6,-4],[1.7,0,0]]) });
		put(anims.cheer, 'armL', { rotate: rot([[0,0],[0.2,-7],[0.46,-17],[0.72,-10],[1,-20],[1.28,-8],[1.7,0]]) });
		put(anims.cheer, 'head', { rotate: rot([[0,0],[0.42,-5],[0.96,7],[1.26,4],[1.7,0]]) });
		put(anims.nod, 'armR', { rotate: rot([[0,0],[0.15,-8],[0.37,16],[0.6,6],[0.8,0]]) });
		put(anims.chestbeat, 'armR', { rotate: pulse(-14) });
		put(anims.chestbeat, 'torso', { rotate: pulse(2.2) });
	} else {
		// Tap dancer alternates foot plants with a syncopated off-beat hold.
		put(anims.idle, 'hip', { translate: xy([[0, 0, 0], [0.75, -5, 3], [1.5, 2, 0], [2.25, 6, 3], [3, 0, 0], [3.75, -5, 3], [4.5, 2, 0], [5.25, 6, 3], [6, 0, 0]]) });
		put(anims.idle, 'legL', { scale: sc([[0, 1, 1], [0.75, 1, 0.975], [1.5, 1, 1], [3.75, 1, 0.975], [4.5, 1, 1], [6, 1, 1]]) });
		put(anims.idle, 'legR', { scale: sc([[0, 1, 1], [2.25, 1, 0.975], [3, 1, 1], [5.25, 1, 0.975], [6, 1, 1]]) });
		put(anims.idle, 'torso', { rotate: rot([[0, 0], [0.75, -2.5], [1.5, 1], [2.25, 2.5], [3, 0], [3.75, -2.5], [4.5, 1], [5.25, 2.5], [6, 0]]) });
		put(anims.cheer, 'hip', { translate: xy([[0, 0, 0], [0.16, -7, 13], [0.32, 7, -5], [0.52, -7, 13], [0.68, 7, -5], [0.9, -7, 13], [1.1, 7, -5], [1.6, 0, 0]]) });
		put(anims.cheer, 'armL', { rotate: rot([[0, 0], [0.16, -10], [0.52, -16], [0.9, -12], [1.6, 0]]) });
		// A tap phrase: cross-step, heel drop, answer on the opposite foot.
		put(anims.cheer, 'root', { translate: xy([[0,0,0],[0.16,-27,0],[0.4,-59,9],[0.66,-19,20],[0.94,65,1],[1.2,69,0],[1.4,23,0],[1.6,0,0]]) });
		put(anims.cheer, 'hip', { translate: xy([[0,0,0],[0.16,-12,-9],[0.4,-17,17],[0.66,7,-7],[0.94,17,19],[1.2,7,-5],[1.6,0,0]]) });
		put(anims.cheer, 'torso', { rotate: rot([[0,0],[0.16,-3],[0.4,-5],[0.66,3],[0.94,6],[1.2,3],[1.6,0]]) });
		put(anims.cheer, 'armR', { rotate: rot([[0,0],[0.2,9],[0.44,19],[0.7,11],[0.98,28],[1.25,12],[1.6,0]]) });
		put(anims.cheer, 'armR_fore', { rotate: rot([[0,0],[0.27,-3],[0.52,9],[0.77,-3],[1.05,11],[1.3,3],[1.6,0]]) });
		put(anims.cheer, 'head', { rotate: rot([[0,0],[0.4,-5],[0.94,6],[1.2,3],[1.6,0]]) });
		put(anims.nod, 'hip', { translate: xy([[0,0,0],[0.14,-5,-4],[0.38,5,8],[0.9,0,0]]) });
		put(anims.chestbeat, 'armL', { rotate: pulse(-9) });
		put(anims.chestbeat, 'armR_fore', { rotate: pulse(6) });
		put(anims.chestbeat, 'torso', { rotate: pulse(3) });
	}
	// Keep both feet grounded during the upper-body celebration.
  for (const key of anims.cheer.bones.root.translate) key.x *= 0.36;
  // Let the acting read bigger through shoulders and torso, while the feet
  // retain their planted travel and the painted joints stay overlapped.
  const widen = (clip, bone, gain) => {
    for (const key of anims[clip].bones[bone]?.rotate ?? []) key.value *= gain;
  };
  for (const arm of ['armL', 'armR']) {
    widen('idle', arm, 1.08);
    widen('nod', arm, 1.12);
    widen('cheer', arm, cast === 'mg' ? 1.2 : 1.14);
    widen('chestbeat', arm, cast === 'mg' ? 1.05 : 1.16);
  }
  for (const fore of ['armL_fore', 'armR_fore']) {
    widen('cheer', fore, 1.12);
    widen('chestbeat', fore, cast === 'mg' ? 1.05 : 1.12);
  }
  widen('cheer', 'torso', cast === 'mg' ? 1.18 : 1.12);
  widen('cheer', 'head', 1.08);
  widen('chestbeat', 'torso', cast === 'mg' ? 1 : 1.18);
};
