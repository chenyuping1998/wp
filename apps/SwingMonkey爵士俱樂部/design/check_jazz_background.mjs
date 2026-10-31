import assert from 'node:assert/strict';
import { register } from 'node:module';
register('data:text/javascript,' + encodeURIComponent(`export async function resolve(s,c,next){try{return await next(s,c);}catch(e){if(s.startsWith('.')&&!s.endsWith('.ts'))return next(s+'.ts',c);throw e;}}`));
const { BG_PROPS } = await import('../src/game/meshWin/bgProps.ts');
const { buildRig, skin } = await import('../src/game/meshWin/meshRig.ts');
const area = (p, a, b, c) => (p[b * 2] - p[a * 2]) * (p[c * 2 + 1] - p[a * 2 + 1]) - (p[b * 2 + 1] - p[a * 2 + 1]) * (p[c * 2] - p[a * 2]);
for (const spec of BG_PROPS) {
	const rig = buildRig(spec.rig), out = new Float32Array(rig.rest.length);
	const [x0, y0, x1, y1] = spec.rect;
	let min = Infinity, max = 0, movement = 0;
	for (let t = 0; t <= 24000; t += 50) {
		const beat = t % 650 < 200 ? Math.sin(Math.PI * (t % 650) / 200) ** 2 : 0;
		skin(rig, spec.drive(rig, { t, gustT: t % 5000, beat }), spec.feetY, out);
		for (let v = 0; v < out.length; v += 2) {
			assert.ok(Number.isFinite(out[v]) && Number.isFinite(out[v + 1]));
			const x = rig.rest[v], y = rig.rest[v + 1];
			const delta = Math.hypot(out[v] - x, out[v + 1] - y);
			movement = Math.max(movement, delta);
			if (Math.min(Math.abs(x - x0), Math.abs(x - x1), Math.abs(y - y0), Math.abs(y - y1)) < 0.001)
				assert.ok(delta < 0.001, `${spec.symbol}: moving patch boundary at ${t}ms`);
		}
		for (let i = 0; i < rig.indices.length; i += 3) {
			const [a, b, c] = rig.indices.subarray(i, i + 3);
			const center = [(rig.rest[a * 2] + rig.rest[b * 2] + rig.rest[c * 2]) / 3, (rig.rest[a * 2 + 1] + rig.rest[b * 2 + 1] + rig.rest[c * 2 + 1]) / 3];
			if (spec.inked && !spec.inked(center)) continue;
			const ratio = area(out, a, b, c) / area(rig.rest, a, b, c);
			min = Math.min(min, ratio); max = Math.max(max, ratio);
			assert.ok(ratio >= 0.5 && ratio <= 1.6, `${spec.symbol}: area ${ratio.toFixed(3)} at ${t}ms`);
		}
	}
	console.log(`${spec.symbol}: 24s idle/win/beat cycle, pinned borders, area ${(min * 100).toFixed(1)}..${(max * 100).toFixed(1)}%, movement ${movement.toFixed(1)}px`);
}
console.log('Jazz background QA passed.');
