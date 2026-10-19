// How far the cloth actually travels, in canvas pixels, as the game plays it.
//
// For every mesh slot, steps `idle` (track 0) + `flutter` (track 1) + `blink`
// (track 2, when present) with physics at 60fps for one 4.8s loop, and reports
// the largest vertex excursion from that vertex's own loop-average position —
// once with flutter and once without, so what the cloth adds is separated from
// the idle breathing. Then the same for a `slash`, where physics should swing
// the ends after the strike.
//
//   node design/measure_ninja_flow.mjs [json path]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const store = path.resolve(root, '../../node_modules/.pnpm');
const coreDir = fs.readdirSync(store).find((n) => n.startsWith('@esotericsoftware+spine-core@'));
const S = await import(pathToFileURL(path.join(store, coreDir, 'node_modules/@esotericsoftware/spine-core/dist/index.js')).href);
const dir = path.join(root, 'static/assets/spines/goBananinjaMascot');
const jsonPath = process.argv[2] ?? path.join(dir, 'ninja.json');
const atlas = new S.TextureAtlas(fs.readFileSync(path.join(dir, 'ninja.atlas'), 'utf8'));
const data = new S.SkeletonJson(new S.AtlasAttachmentLoader(atlas)).readSkeletonData(JSON.parse(fs.readFileSync(jsonPath, 'utf8')));

const run = (anim, seconds, flutter) => {
	const sk = new S.Skeleton(data);
	const st = new S.AnimationState(new S.AnimationStateData(data));
	st.setAnimation(0, anim, anim === 'idle');
	if (flutter && data.findAnimation('flutter')) st.setAnimation(1, 'flutter', true);
	sk.updateWorldTransform(S.Physics.reset);
	const samples = {};
	for (let f = 0; f < seconds * 60; f++) {
		st.update(1 / 60);
		st.apply(sk);
		sk.update(1 / 60);
		sk.updateWorldTransform(S.Physics.update);
		if (f < 60) continue; // settle physics first
		for (const slot of sk.slots) {
			const a = slot.getAttachment();
			if (!a?.triangles) continue;
			const xy = new Float32Array(a.worldVerticesLength);
			a.computeWorldVertices(slot, 0, xy.length, xy, 0, 2);
			(samples[slot.data.name] ??= []).push(xy);
		}
	}
	const out = {};
	for (const [name, frames] of Object.entries(samples)) {
		const n = frames[0].length;
		let worst = 0;
		for (let i = 0; i < n; i += 2) {
			let mx = 0, my = 0;
			for (const fr of frames) { mx += fr[i]; my += fr[i + 1]; }
			mx /= frames.length; my /= frames.length;
			for (const fr of frames) worst = Math.max(worst, Math.hypot(fr[i] - mx, fr[i + 1] - my));
		}
		out[name] = worst;
	}
	return out;
};

// What the cloth ADDS: the same clip played twice in lock-step, with and without
// flutter and with and without the cloth constraints, and the per-vertex gap.
const pose = (anim, flutter, cloth) => {
	const sk = new S.Skeleton(data);
	const st = new S.AnimationState(new S.AnimationStateData(data));
	st.setAnimation(0, anim, anim === 'idle');
	if (flutter && data.findAnimation('flutter')) st.setAnimation(1, 'flutter', true);
	if (data.findAnimation('blink')) st.setAnimation(2, 'blink', true);
	if (!cloth) for (const p of sk.physicsConstraints) if (/_(flow|cloth)$/.test(p.data.name)) p.mix = 0;
	sk.updateWorldTransform(S.Physics.reset);
	return { sk, st };
};
const step = ({ sk, st }) => {
	st.update(1 / 60); st.apply(sk); sk.update(1 / 60); sk.updateWorldTransform(S.Physics.update);
};
const verts = (sk) => {
	const out = {};
	for (const slot of sk.slots) {
		const a = slot.getAttachment();
		if (!a?.triangles) continue;
		const xy = new Float32Array(a.worldVerticesLength);
		a.computeWorldVertices(slot, 0, xy.length, xy, 0, 2);
		out[slot.data.name] = xy;
	}
	return out;
};
const added = (anim, seconds) => {
	const a = pose(anim, true, true), b = pose(anim, false, false);
	const worst = {};
	for (let f = 0; f < seconds * 60; f++) {
		step(a); step(b);
		const va = verts(a.sk), vb = verts(b.sk);
		for (const name of Object.keys(va)) {
			if (!vb[name] || vb[name].length !== va[name].length) continue;
			for (let i = 0; i < va[name].length; i += 2)
				worst[name] = Math.max(worst[name] ?? 0, Math.hypot(va[name][i] - vb[name][i], va[name][i + 1] - vb[name][i + 1]));
		}
	}
	return worst;
};
for (const anim of ['idle', 'slash', 'cheer']) {
	if (!data.findAnimation(anim)) continue;
	const w = added(anim, anim === 'idle' ? 4.8 : 2.4);
	console.log(`${anim}: px the cloth (flutter + physics) adds, max over vertices and time`);
	for (const [n, v] of Object.entries(w)) if (v > 0.05) console.log(`  ${n.padEnd(24)} ${v.toFixed(1)}`);
}
