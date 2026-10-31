// Follow-through measured properly: sample each bone's LOCAL rotation through the animation, then for every
// parent→child pair that both rotate, find the time shift that best lines the child up with its parent
// (cross-correlation over one loop) and the amplitude ratio at that shift.
//   node lag.mjs <skeleton> <animation> [minAmp=2]
import { load, poser, r2 } from './lib.mjs';

const [name, animName, minAmp = 2] = process.argv.slice(2);
const { data } = load(name);
const p = poser(data);
const anim = data.findAnimation(animName);
const N = 180, dt = anim.duration / N;
const series = new Map();
for (let i = 0; i < N; i++) {
	const s = p.pose(anim, i * dt);
	for (const b of s.bones) {
		if (!series.has(b.data.name)) series.set(b.data.name, []);
		series.get(b.data.name).push(b.rotation);
	}
}
const centered = (a) => { const m = a.reduce((x, y) => x + y, 0) / a.length; return a.map((v) => v - m); };
const amp = (a) => Math.max(...a) - Math.min(...a);
const rows = [];
for (const b of data.bones) {
	if (!b.parent) continue;
	const c = series.get(b.name), q = series.get(b.parent.name);
	if (amp(c) < +minAmp || amp(q) < +minAmp) continue;
	const cc = centered(c), pc = centered(q);
	let best = 0, bestK = 0;
	const maxK = Math.round(0.4 / dt);
	for (let k = -maxK; k <= maxK; k++) {
		let sum = 0, na = 0, nb = 0;
		for (let i = 0; i < N; i++) { const j = (i - k + N) % N; sum += cc[i] * pc[j]; na += cc[i] ** 2; nb += pc[j] ** 2; }
		const r = sum / Math.sqrt(na * nb);
		if (r > best) { best = r; bestK = k; }
	}
	rows.push({ parent: b.parent.name, bone: b.name, lag: r2(bestK * dt), corr: r2(best), ratio: r2(amp(c) / amp(q)), amp: r2(amp(c)) });
}
console.log(`# ${name} / ${animName}：子骨相對父骨的落後（正＝子較晚）\n`);
console.log('| 父 → 子 | 落後 s | 相關 | 子幅度° | 子/父 幅度 |');
console.log('|---|---|---|---|---|');
for (const r of rows) console.log(`| ${r.parent} → ${r.bone} | ${r.lag} | ${r.corr} | ${r.amp} | ${r.ratio} |`);
