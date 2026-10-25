// How much the shoulder shuriken quivers (its spring, relative to the arm it
// is stuck in) in each clip, played as the game plays it: flutter on track 1,
// physics stepped at 60fps.   node design/spine43/measure_shuriken.mjs [clip...]
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { APP, RIG } from './kit.mjs';

const store = path.resolve(APP, '../../node_modules/.pnpm');
const coreDir = fs.readdirSync(store).find((n) => n.startsWith('@esotericsoftware+spine-core@'));
const S = await import(pathToFileURL(path.join(store, coreDir, 'node_modules/@esotericsoftware/spine-core/dist/index.js')).href);
const dir = path.dirname(RIG);
const atlas = new S.TextureAtlas(fs.readFileSync(path.join(dir, 'ninja.atlas'), 'utf8'));
const data = new S.SkeletonJson(new S.AtlasAttachmentLoader(atlas)).readSkeletonData(JSON.parse(fs.readFileSync(RIG, 'utf8')));
const clips = process.argv.slice(2).length ? process.argv.slice(2) : ['slash', 'split_finale', 'scatter_slash', 'throwit', 'cheer', 'nod', 'idle'];
for (const name of clips) {
	const sk = new S.Skeleton(data);
	const st = new S.AnimationState(new S.AnimationStateData(data));
	st.setAnimation(0, name, false);
	st.setAnimation(1, 'flutter', true);
	sk.setToSetupPose();
	st.apply(sk);
	sk.updateWorldTransform(S.Physics.reset);
	const root = sk.findBone('shuriken_root'), arm = sk.findBone('armL');
	const rest = root.data.rotation;
	const D = data.findAnimation(name).duration;
	let lo = 0, hi = 0, swings = 0, last = 0, line = '';
	for (let i = 1; i <= Math.round((D + 0.6) * 60); i++) {
		st.update(1 / 60); sk.update(1 / 60); st.apply(sk); sk.updateWorldTransform(S.Physics.update);
		const off = ((root.getWorldRotationX() - arm.getWorldRotationX() - rest + 540) % 360) - 180;
		lo = Math.min(lo, off); hi = Math.max(hi, off);
		if (Math.sign(off) !== Math.sign(last) && Math.abs(off) > 1) swings++;
		if (Math.abs(off) > 0.5) last = off;
		if (i % 6 === 0) line += off.toFixed(1) + ' ';
	}
	console.log(`${name.padEnd(13)} ${lo.toFixed(1)}..${hi.toFixed(1)} deg, ${swings} swings past 1deg\n   ${line}`);
}
