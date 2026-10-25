import assert from 'node:assert/strict';
import { createReelBlur } from '../src/game/reelMotion.ts';

const sweep = (fps) => {
	const blur = createReelBlur(200), key = {};
	let value = 0;
	for (let i = 0; i <= fps / 2; i++) {
		const t = i * 1000 / fps;
		value = blur.sample({ now: t, offset: t * 4, key, motion: 'spinning' });
	}
	return { blur, key, value };
};
const at30 = sweep(30), at60 = sweep(60);
assert.ok(Math.abs(at30.value - at60.value) < 0.01, 'Blur depends on frame rate');
assert.ok(at60.value > 20 && at60.value <= 28, 'Full-speed sweep is not bounded');
const rebase = at60.blur.sample({ now: 516, offset: -8000, key: {}, motion: 'spinning' });
assert.equal(rebase, at60.value, 'Padding replacement causes a blur flash');
const key = {};
at60.blur.sample({ now: 532, offset: 0, key, motion: 'bouncing' });
let sharpened = rebase;
for (let i = 1; i <= 8; i++) sharpened = at60.blur.sample({ now: 532 + 16 * i, offset: i * 1.6, key, motion: 'bouncing' });
assert.ok(sharpened < rebase * 0.1, 'Blur obscures the stop and landing');
assert.equal(at60.blur.sample({ now: 676, offset: 15, key, motion: 'stopped' }), 0, 'Stopped strip remains blurred');
console.log('OK: reel blur is frame-rate independent; strip replacement is stable; stop sharpens before landing');
