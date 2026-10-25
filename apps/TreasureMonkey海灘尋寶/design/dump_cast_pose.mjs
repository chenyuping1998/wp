/**
 * dump_cast_pose.mjs — 把角色在幾個時間點的網格頂點位置吐成 JSON，給畫圖用。
 *
 * 不是 gate，是「讓人看見」的工具。姿勢完全由 src/game/castMotion.ts 算，
 * 跟遊戲裡跑的是同一份程式（check_cast_motion.mjs 也是這樣做的）——
 * 這支只負責把結果寫出來，不自己推導任何矩陣。
 *
 *   node design/dump_cast_pose.mjs --tier=trigger --times=0,200,420,650,900,1250
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { TIERS, MOTION_SCALE, buildWeightIndex, composeBoneMatrices, skinVertices } =
	await import(path.join(appRoot, 'src/game/castMotion.ts'));

const arg = (name, dflt) => {
	const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
	return hit ? hit.slice(name.length + 3) : dflt;
};

const who = arg('who', 'guy');
const tierName = arg('tier', 'trigger');
const times = arg('times', '0,200,420,650,900,1250').split(',').map(Number);
const tier = TIERS[tierName];
if (!tier) throw new Error(`no tier '${tierName}'`);

const rig = JSON.parse(
	fs.readFileSync(path.join(appRoot, `static/assets/meshRigs/cast_${who}/${who}.rig.json`), 'utf8'),
);
const rest = new Float32Array(rig.verts.length * 2);
rig.verts.forEach((v, i) => {
	rest[i * 2] = v[0];
	rest[i * 2 + 1] = v[1];
});
const index = buildWeightIndex(rig);
const matrices = rig.bones.map(() => new Float32Array(6));
const posed = new Float32Array(rig.verts.length * 2);

// A fixed idle phase for every frame, so a contact sheet shows the REACTION and
// not the sway drifting underneath it. `--live` advances the idle with the beat
// instead, which is what the game actually looks like — use it for the GIFs.
const LIVE = process.argv.includes('--live');
const IDLE_AT_MS = 0;

const frames = times.map((ageMs) => {
	composeBoneMatrices(
		rig,
		{
			timeMs: LIVE ? IDLE_AT_MS + Math.max(ageMs, 0) : IDLE_AT_MS,
			tier,
			reactionAge: ageMs < 0 ? null : ageMs,
			durationMs: tier.durationMs,
			speed: 1,
			motionScale: MOTION_SCALE[who],
		},
		matrices,
	);
	skinVertices(rest, index, matrices, posed);
	return { ageMs, verts: Array.from(posed) };
});

const out = {
	who,
	tier: tierName,
	motionScale: MOTION_SCALE[who],
	size: rig.size,
	figure_box: rig.figure_box,
	tris: rig.tris,
	restVerts: rig.verts,
	frames,
};
const dest = arg('out', path.join(appRoot, 'design', `cast_pose_${tierName}.json`));
fs.writeFileSync(dest, JSON.stringify(out));
console.log('wrote', path.relative(appRoot, dest), `— ${frames.length} frames, scale ${out.motionScale}`);
