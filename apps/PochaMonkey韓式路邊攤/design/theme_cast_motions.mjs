// The pocha cast's own weighted-mesh acting: the boss cooks, the helper serves.
const rot = (pairs) => pairs.map(([time, value]) => ({ time, value }));
const xy = (pairs) => pairs.map(([time, x, y]) => ({ time, x, y }));
const sc = (pairs) => pairs.map(([time, x, y]) => ({ time, x, y }));
const put = (animation, name, timelines) => Object.assign(animation.bones[name] ??= {}, timelines);
const beats = [0, 1, 2, 3, 4, 5].map((i) => 0.48 + 0.3 * i);
const pulse = (a) => rot([[0, 0], ...beats.flatMap((t, i) => [[t, (i % 2 ? -1 : 1) * a], [t + 0.15, (i % 2 ? -1 : 1) * a * 0.35]]), [2.55, 0]]);

export const applyThemeCast = (anims, cast) => {
	if (cast === 'mg') {
		// The stocky stall owner stirs with one hand while checking the pan.
		put(anims.idle, 'torso', { rotate: rot([[0, 0], [1.2, -2], [2.4, 0], [3.6, 2], [4.8, 0]]), scale: sc([[0, 1, 1], [1.2, 1.014, 0.986], [2.4, 1, 1], [3.6, 1.014, 0.986], [4.8, 1, 1]]) });
		put(anims.idle, 'armR', { rotate: rot([[0, 0], [0.6, 4], [1.2, -6], [1.8, 4], [2.4, 0], [3.0, 4], [3.6, -6], [4.2, 4], [4.8, 0]]) });
		put(anims.idle, 'armR_fore', { rotate: rot([[0, 0], [0.6, -4], [1.2, 4], [1.8, -4], [2.4, 0], [3.0, -4], [3.6, 4], [4.2, -4], [4.8, 0]]) });
		put(anims.cheer, 'armR', { rotate: rot([[0, 0], [0.18, -12], [0.4, 13], [0.68, -8], [1.0, 12], [1.4, 0], [1.6, 0]]) });
		put(anims.cheer, 'torso', { scale: sc([[0, 1, 1], [0.18, 1.03, 0.96], [0.4, 0.98, 1.04], [0.68, 1.02, 0.97], [1.0, 0.98, 1.04], [1.6, 1, 1]]) });
		put(anims.chestbeat, 'armR', { rotate: pulse(12) });
		put(anims.chestbeat, 'torso', { rotate: pulse(-3) });
	} else {
		// The part-timer shifts weight between feet and offers a skewer.
		put(anims.idle, 'hip', { translate: xy([[0, 0, 0], [1.5, -5, 2], [3, 0, 0], [4.5, 5, 2], [6, 0, 0]]) });
		put(anims.idle, 'armL', { rotate: rot([[0, 0], [0.75, -3], [1.5, -9], [2.25, -3], [3, 0], [3.75, -3], [4.5, -9], [5.25, -3], [6, 0]]) });
		put(anims.idle, 'torso', { scale: sc([[0, 1, 1], [1.5, 1.015, 0.985], [3, 1, 1], [4.5, 1.015, 0.985], [6, 1, 1]]) });
		put(anims.cheer, 'hip', { translate: xy([[0, 0, 0], [0.22, -5, 13], [0.46, 5, -8], [0.76, -5, 13], [1.06, 5, -8], [1.4, 0, 0], [1.6, 0, 0]]) });
		put(anims.cheer, 'armL', { rotate: rot([[0, 0], [0.22, -13], [0.46, 5], [0.76, -13], [1.06, 5], [1.6, 0]]) });
		put(anims.chestbeat, 'armL', { rotate: pulse(-10) });
		put(anims.chestbeat, 'torso', { rotate: pulse(2.5) });
	}
};
