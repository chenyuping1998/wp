// A conductor's four-count and a tap dancer's syncopated steps deform the cast meshes.
const rot = (pairs) => pairs.map(([time, value]) => ({ time, value }));
const xy = (pairs) => pairs.map(([time, x, y]) => ({ time, x, y }));
const sc = (pairs) => pairs.map(([time, x, y]) => ({ time, x, y }));
const put = (animation, name, timelines) => Object.assign(animation.bones[name] ??= {}, timelines);
const beats = [0, 1, 2, 3, 4, 5].map((i) => 0.48 + 0.3 * i);
const pulse = (a) => rot([[0, 0], ...beats.flatMap((t, i) => [[t, (i % 2 ? -1 : 1) * a], [t + 0.15, (i % 2 ? -1 : 1) * a * 0.3]]), [2.55, 0]]);

export const applyThemeCast = (anims, cast) => {
	if (cast === 'mg') {
		// Marshal marks the beat with his right hand and shoulders.
		put(anims.idle, 'armR', { rotate: rot([[0, 0], [0.3, -8], [0.6, 2], [0.9, -5], [1.2, 4], [1.5, -8], [1.8, 2], [2.1, -5], [2.4, 0], [2.7, -8], [3, 2], [3.3, -5], [3.6, 4], [3.9, -8], [4.2, 2], [4.5, -5], [4.8, 0]]) });
		put(anims.idle, 'torso', { scale: sc([[0, 1, 1], [0.6, 1.01, 0.984], [1.2, 1, 1], [1.8, 1.01, 0.984], [2.4, 1, 1], [3, 1.01, 0.984], [3.6, 1, 1], [4.2, 1.01, 0.984], [4.8, 1, 1]]) });
		put(anims.cheer, 'armR', { rotate: rot([[0, 0], [0.24, -16], [0.48, 3], [0.72, -13], [0.96, 5], [1.2, -15], [1.6, 0]]) });
		put(anims.cheer, 'torso', { rotate: rot([[0, 0], [0.24, -4], [0.48, 2], [0.72, -3], [0.96, 2], [1.2, -4], [1.6, 0]]) });
		put(anims.chestbeat, 'armR', { rotate: pulse(-14) });
		put(anims.chestbeat, 'torso', { rotate: pulse(3) });
	} else {
		// Tap dancer alternates foot plants with a syncopated off-beat hold.
		put(anims.idle, 'hip', { translate: xy([[0, 0, 0], [0.75, -5, 3], [1.5, 2, 0], [2.25, 6, 3], [3, 0, 0], [3.75, -5, 3], [4.5, 2, 0], [5.25, 6, 3], [6, 0, 0]]) });
		put(anims.idle, 'legL', { scale: sc([[0, 1, 1], [0.75, 1, 0.975], [1.5, 1, 1], [3.75, 1, 0.975], [4.5, 1, 1], [6, 1, 1]]) });
		put(anims.idle, 'legR', { scale: sc([[0, 1, 1], [2.25, 1, 0.975], [3, 1, 1], [5.25, 1, 0.975], [6, 1, 1]]) });
		put(anims.idle, 'torso', { rotate: rot([[0, 0], [0.75, -2.5], [1.5, 1], [2.25, 2.5], [3, 0], [3.75, -2.5], [4.5, 1], [5.25, 2.5], [6, 0]]) });
		put(anims.cheer, 'hip', { translate: xy([[0, 0, 0], [0.16, -7, 13], [0.32, 7, -5], [0.52, -7, 13], [0.68, 7, -5], [0.9, -7, 13], [1.1, 7, -5], [1.6, 0, 0]]) });
		put(anims.cheer, 'armL', { rotate: rot([[0, 0], [0.16, -10], [0.52, -16], [0.9, -12], [1.6, 0]]) });
		put(anims.chestbeat, 'armL', { rotate: pulse(-9) });
		put(anims.chestbeat, 'torso', { rotate: pulse(3) });
	}
};
