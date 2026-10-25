// spine-generator's smoothness check (src/check.ts, the runtime half), ported
// to this game's meshes (src/game/meshWin): every part of every act is
// followed on screen and flagged where it
//
//   jolt      its acceleration spikes far above its own typical change (12x,
//             above a floor a viewer notices) — a key whose tangents do not
//             line up, a spring started from the wrong value. At the act's
//             landMs / hitMs / events it is the intended hit (impact), and in
//             the 0.6s after one it is the ringing (ring); both only noted.
//   seam      a loop (the background props) does not come back to where it
//             started, or comes back at a different speed
//   in-sync   in a loop, 80%+ of the moving parts peak on the same frame:
//             stiff (stagger them 2-6 frames)
//
// It does not judge the mesh (check_mesh_wins does that) — only the motion.
//
//   node design/swing/check_mesh_smooth.mjs [name,name...] [--all]

import { register } from 'module';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
register('data:text/javascript,' + encodeURIComponent(`export async function resolve(s, c, next) {
	try { return await next(s, c); } catch (e) { if (s.startsWith('.') && !s.endsWith('.ts')) return next(s + '.ts', c); throw e; } }`));
const dir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../src/game/meshWin');
const rigM = await import(pathToFileURL(path.join(dir, 'meshRig.ts')).href);
const { MESH_ALL, BG_PROPS } = await import(pathToFileURL(path.join(dir, 'index.ts')).href);

const args = process.argv.slice(2);
const only = args.find((a) => !a.startsWith('--'))?.split(',');
const showAll = args.includes('--all');
const loops = new Set(BG_PROPS.map((s) => s.symbol));

const RATE = 240; // samples per second, as the kit
const FPS = 60;
// the kit's floor is 2000 units/s² for a 580-unit figure; a symbol is 256
const FLOOR = 2000 * (256 / 580);
const median = (a) => {
	const s = [...a].sort((x, y) => x - y);
	return s.length ? s[Math.floor(s.length / 2)] : 0;
};

let flagged = 0;
for (const [name, spec] of Object.entries(MESH_ALL)) {
	if (only && !only.includes(name)) continue;
	const rig = rigM.buildRig(spec.rig);
	const D = spec.durationMs / 1000;
	const n = Math.max(2, Math.round(D * RATE));
	const loop = loops.has(spec.symbol);
	// each part followed by a point 20px out along its own axis
	const tracks = rig.bones.map((b) => ({ name: b.name, x: [], y: [] }));
	for (let i = 0; i <= n; i++) {
		const pose = spec.pose(rig, (i / RATE) * 1000);
		rig.bones.forEach((b, k) => {
			const f = rigM.boneFrame(rig, pose, spec.feetY, b.name, [b.x + b.axis[0] * 20, b.y + b.axis[1] * 20]);
			tracks[k].x.push(f.x);
			tracks[k].y.push(f.y);
		});
	}
	const events = [spec.landMs, spec.hitMs, ...(spec.events ?? [])].filter((t) => t >= 0 && t < spec.durationMs).map((t) => t / 1000);
	const issues = [];
	const peaks = [];
	for (const tr of tracks) {
		const speed = [];
		let travel = 0;
		for (let i = 1; i <= n; i++) {
			speed.push(Math.hypot(tr.x[i] - tr.x[i - 1], tr.y[i] - tr.y[i - 1]) * RATE);
			travel = Math.max(travel, Math.hypot(tr.x[i] - tr.x[0], tr.y[i] - tr.y[0]));
		}
		if (travel < 0.5) continue;
		const acc = speed.slice(1).map((v, i) => Math.abs(v - speed[i]) * RATE);
		const typical = median(acc) + 1e-6;
		let last = -1e9;
		acc.forEach((a, i) => {
			const t = (i + 1) / RATE;
			if (a > 12 * typical && a > FLOOR && i - last > RATE * 0.05) {
				last = i;
				const hit = events.some((e) => t - e >= -1 / FPS && t - e <= 2 / FPS);
				// the ringing after a hit: within 0.6s of one, and no harder
				// than the strongest jolt at the hit itself
				const ring = !hit && events.some((e) => t - e > 0 && t - e <= 0.6);
				issues.push({ kind: hit ? 'impact' : ring ? 'ring' : 'jolt', part: tr.name, t, a });
			}
		});
		if (loop) {
			const seam = Math.hypot(tr.x[n] - tr.x[0], tr.y[n] - tr.y[0]);
			if (seam > 0.3) issues.push({ kind: 'seam', part: tr.name, t: D, a: seam });
			const vEnd = speed[speed.length - 1], vStart = speed[0];
			if (Math.abs(vEnd - vStart) > Math.max(8, 0.3 * Math.max(vEnd, vStart))) issues.push({ kind: 'seam-speed', part: tr.name, t: D, a: vEnd - vStart });
			if (travel > 2) {
				let best = 0;
				for (let i = 1; i <= n; i++) if (tr.y[i] < tr.y[best]) best = i;
				peaks.push(Math.round((best / RATE) * FPS));
			}
		}
	}
	if (loop && peaks.length >= 3) {
		const counts = new Map();
		for (const p of peaks) for (const f of [p - 1, p, p + 1]) counts.set(f, (counts.get(f) ?? 0) + 1);
		const [frame, count] = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
		if (count / peaks.length > 0.8) issues.push({ kind: 'in-sync', part: `${count}/${peaks.length}`, t: frame / FPS, a: 0 });
	}
	const bad = issues.filter((i) => i.kind !== 'impact' && i.kind !== 'ring');
	if (bad.length) flagged++;
	if (bad.length || showAll) {
		console.log(`${name}${loop ? ' (loop)' : ''}: ${bad.length ? bad.length + ' issue(s)' : 'smooth'}`);
		for (const i of showAll ? issues : bad)
			console.log(`   ${i.kind.padEnd(10)} ${i.part.padEnd(10)} at ${(i.t * 1000).toFixed(0)}ms${i.kind === 'jolt' || i.kind === 'impact' ? `  (${i.a.toFixed(0)} px/s²)` : i.kind.startsWith('seam') ? `  (${i.a.toFixed(2)})` : ''}`);
	}
}
console.log(`check_mesh_smooth: ${flagged ? `${flagged} act(s) flagged` : 'all acts smooth'}`);
if (flagged) process.exit(1);
