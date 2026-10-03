// The gate for the symbol and UI meshes (src/game/meshWin/*).
//
// It poses each REAL rig with the REAL pose code — the meshWin modules import
// nothing outside their folder, so bare node (22.18+, type stripping) can load
// them — and fails, per symbol, on:
//
//   1. weights: every vertex sums to 1, none negative
//   2. rest: at 0ms the mesh sits exactly on the drawing, so the swap from the
//      static sprite to the win cannot jump
//   3. the MESH: across the whole beat plus the board's longest hold, at normal
//      and turbo speed, every INKED triangle keeps its sign, stays >= 50% of its
//      rest area and grows <= 1.6x — after dividing out the rigid whole-subject
//      move, which scales every triangle alike and distorts nothing. Triangles
//      owned by a `collapsible` bone (a blink) are exempt from the ratio but
//      still may never invert.
//   4. limits: no bone rotated past its measured limit, by sign
//   5. every bone OWNS inked pixels (>= 12 inked vertices it dominates) — a
//      bone sitting in the air passes 3 by moving nothing
//   6. every bone ACTS: its owned inked vertices travel >= 1.5px against the
//      rigid move at some point in the beat
//   7. CONTINUITY: sampled every 1ms, no step may be a POP — over 1px AND
//      more than 3x the steps either side of it. (Fast is fine: a squash
//      releasing at turbo legitimately moves 10px in 8ms. A pop is a step that
//      does not shrink with its neighbours.) A spring started at +1 instead of
//      0 made the ankh's loop jump 10% in one frame on the landing, and nothing
//      above could see it.
//   A GROUP bone — a parent that owns no pixels itself because its children
//   claim them all (h3's banana load) — is exempt from 5 and 6: it acts
//   through its children, and they are checked.
//
// Area alone cannot see a limb drawn to a point with its area intact; that is
// what the zoomed renders are for (render_mesh_wins.py, fed by --dump).
//
// Usage:
//   node design/check_mesh_wins.mjs [toolsDir] [H1,H2]              gate
//   node design/check_mesh_wins.mjs [toolsDir] H2 --limits          joint sweep
//   node design/check_mesh_wins.mjs [toolsDir] H2 --dump out.json [ms,ms,...]
// toolsDir is where pngjs lives (default E:/stake/tools/gen).

import { createRequire, register } from 'module';
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

// the meshWin modules import each other without an extension, as vite expects;
// node needs to be told to try `.ts`
register(
	'data:text/javascript,' +
		encodeURIComponent(`export async function resolve(s, c, next) {
			try { return await next(s, c); } catch (e) {
				if (s.startsWith('.') && !s.endsWith('.ts')) return next(s + '.ts', c);
				throw e;
			}
		}`),
);

const args = process.argv.slice(2);
const toolsDir = args[0] && /[\\/]/.test(args[0]) ? args.shift() : 'E:/stake/tools/gen';
const require = createRequire(path.join(toolsDir, 'noop.js'));
const { PNG } = require('pngjs');

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const core = await import(pathToFileURL(path.join(appRoot, 'src/game/meshWin/meshRig.ts')).href);
const { MESH_WINS, COIN, COUNTER } = await import(pathToFileURL(path.join(appRoot, 'src/game/meshWin/index.ts')).href);
const MESH_SPECS = { ...MESH_WINS, COIN, COUNTER };

const pick = args[0] && !args[0].startsWith('--') ? args.shift().split(',') : Object.keys(MESH_SPECS);
const mode = args[0];

const load = (spec) => {
	const rig = core.buildRig(spec.rig);
	const B = rig.bones.length, V = rig.rest.length / 2, T = rig.indices.length / 3;
	// where the drawing matters: the cut subject's alpha, or a panel symbol's
	// own `inked` region (its subject is painted on the stone, not cut off it)
	let inkAt;
	if (spec.mode === 'panel') {
		inkAt = (x, y) => spec.inked([x, y]);
	} else {
		const file = path.join(appRoot, 'static/assets/sprites/goBananasSymbolsV3', `${spec.symbol.toLowerCase()}_subject.png`);
		const png = PNG.sync.read(fs.readFileSync(file));
		inkAt = (x, y) => {
			const xi = Math.max(0, Math.min(png.width - 1, Math.round(x)));
			const yi = Math.max(0, Math.min(png.height - 1, Math.round(y)));
			return png.data[(yi * png.width + xi) * 4 + 3] > 128;
		};
	}
	const inked = new Uint8Array(T);
	for (let t = 0; t < T; t++) {
		const vs = [0, 1, 2].map((k) => rig.indices[t * 3 + k]);
		const pts = vs.map((v) => [rig.rest[v * 2], rig.rest[v * 2 + 1]]);
		pts.push([(pts[0][0] + pts[1][0] + pts[2][0]) / 3, (pts[0][1] + pts[1][1] + pts[2][1]) / 3]);
		inked[t] = pts.some(([x, y]) => inkAt(x, y)) ? 1 : 0;
	}
	const dominant = new Int32Array(V);
	for (let v = 0; v < V; v++) {
		let top = 0;
		for (let b = 1; b < B; b++) if (rig.weights[v * B + b] > rig.weights[v * B + top]) top = b;
		dominant[v] = top;
	}
	// a triangle is exempt from the ratio if collapsible bones hold >= 10% of
	// it: a blink squeezes the lids AND stretches the skin just outside them
	const collapsible = new Set((spec.collapsible ?? []).map((n) => rig.bones.findIndex((b) => b.name === n)));
	const exempt = new Uint8Array(T);
	for (let t = 0; t < T; t++) {
		let w = 0;
		for (let k = 0; k < 3; k++) {
			const v = rig.indices[t * 3 + k];
			for (const b of collapsible) w += rig.weights[v * B + b] / 3;
		}
		exempt[t] = w >= 0.1 ? 1 : 0;
	}
	return { spec, rig, B, V, T, inkAt, inked, dominant, exempt };
};

const area = (rig, pos, t) => {
	const a = rig.indices[t * 3], b = rig.indices[t * 3 + 1], c = rig.indices[t * 3 + 2];
	return (pos[b * 2] - pos[a * 2]) * (pos[c * 2 + 1] - pos[a * 2 + 1]) - (pos[b * 2 + 1] - pos[a * 2 + 1]) * (pos[c * 2] - pos[a * 2]);
};
const where = (rig, t) => {
	const v = rig.indices[t * 3];
	return `(${rig.rest[v * 2].toFixed(0)},${rig.rest[v * 2 + 1].toFixed(0)})`;
};

const measure = (S, pos, rigid) => {
	let lo = Infinity, hi = -Infinity, flips = 0, tLo = -1, tHi = -1;
	for (let t = 0; t < S.T; t++) {
		if (!S.inked[t]) continue;
		const r = area(S.rig, pos, t) / S.restArea[t] / rigid;
		if (r <= 0) flips++;
		if (S.exempt[t]) continue;
		if (r < lo) { lo = r; tLo = t; }
		if (r > hi) { hi = r; tHi = t; }
	}
	return { lo, hi, flips, tLo, tHi };
};

for (const name of pick) {
	const spec = MESH_SPECS[name];
	if (!spec) throw new Error(`no mesh win for ${name}`);
	const S = load(spec);
	const { rig, B, V } = S;
	S.restArea = Float64Array.from({ length: S.T }, (_, t) => area(rig, rig.rest, t));
	const out = new Float32Array(V * 2);

	// ---- --dump -------------------------------------------------------------
	if (mode === '--dump') {
		const file = args[1];
		const ages = (args[2] ?? '0,110,220,330,450,600,750,900,1050,1200,1300,1380,1450,1700')
			.split(',').map(Number);
		const frames = ages.map((ms) => {
			const pose = spec.pose(rig, ms);
			core.skin(rig, pose, spec.feetY, out);
			const verts = Array.from(out);
			core.skin(rig, { ...pose, rigid: core.restRigid() }, spec.feetY, out);
			return {
				ms, verts, local: Array.from(out), flash: pose.flash, sheen: pose.sheen,
				air: pose.air, plateHit: pose.plateHit, rigid: pose.rigid,
			};
		});
		fs.writeFileSync(file, JSON.stringify({
			symbol: spec.symbol, mode: spec.mode ?? 'cut', feetY: spec.feetY, canvas: core.CANVAS,
			uvs: Array.from(rig.uvs), indices: Array.from(rig.indices), frames,
		}));
		console.log(`${name}: dumped ${frames.length} frames -> ${file}`);
		continue;
	}

	// ---- --limits: one joint, one direction, until the mesh gives ------------
	if (mode === '--limits') {
		const sweep = (b, sign) => {
			let last = 0, why = '';
			for (let deg = 0.5; deg <= 60; deg += 0.5) {
				const pose = core.restPose(rig);
				pose.bones[b].angle = sign * deg;
				core.skin(rig, pose, spec.feetY, out);
				const m = measure(S, out, 1);
				if (m.flips || m.lo < 0.5 || m.hi > 1.6) {
					const t = m.hi > 1.6 ? m.tHi : m.tLo;
					why = `${where(rig, t)} ${m.flips ? 'inverts' : m.hi > 1.6 ? `${(m.hi * 100).toFixed(0)}%` : `${(m.lo * 100).toFixed(0)}%`}`;
					break;
				}
				last = deg;
			}
			return `${String(last).padStart(4)}° ${why.padEnd(20)}`;
		};
		console.log(name);
		rig.bones.forEach((bone, b) => {
			if (bone.parent < 0) return;
			const lim = spec.limits[bone.name];
			console.log(`  ${bone.name.padEnd(8)} + ${sweep(b, 1)}  - ${sweep(b, -1)}  table +${lim?.pos ?? '?'} -${lim?.neg ?? '?'}`);
		});
		continue;
	}

	// ---- the gate --------------------------------------------------------------
	let failures = 0;
	const fail = (m) => { console.log(`  !! ${m}`); failures++; };
	const ok = (m) => console.log(`  ok ${m}`);
	console.log(name);

	// 1. weights
	{
		let worst = 0, negative = 0;
		for (let v = 0; v < V; v++) {
			let s = 0;
			for (let b = 0; b < B; b++) {
				const w = rig.weights[v * B + b];
				if (w < 0) negative++;
				s += w;
			}
			worst = Math.max(worst, Math.abs(s - 1));
		}
		if (worst > 1e-5 || negative) fail(`weights: max |sum-1| ${worst}, ${negative} negative`);
		else ok(`weights sum to 1 on all ${V} vertices`);
	}

	// 2. rest at BOTH ends: the win starts from the static sprite and hands
	//    back to it, so the first and last frames must be the drawing exactly
	{
		const offRest = (ms) => {
			const pose = spec.pose(rig, ms);
			core.skin(rig, pose, spec.feetY, out);
			let err = 0;
			for (let i = 0; i < out.length; i++) err = Math.max(err, Math.abs(out[i] - rig.rest[i]));
			return { err, flash: pose.flash, hit: Math.abs(pose.plateHit - 1), sheen: pose.sheen };
		};
		const a = offRest(0), z = offRest(spec.durationMs);
		if (a.err > 1e-3) fail(`0ms is not the drawing: max offset ${a.err.toFixed(4)}px`);
		else if (z.err > 1e-3 || z.flash > 1e-3 || z.hit > 1e-4 || z.sheen >= 0)
			fail(`${spec.durationMs}ms does not end at rest: offset ${z.err.toFixed(3)}px, flash ${z.flash.toFixed(3)}, knock ${z.hit.toFixed(4)}, sheen ${z.sheen}`);
		else ok(`starts and ends on the drawing`);
	}

	// 8. PANEL: the frame is nailed down and the rigid move (which would carry
	//    the frame with it) stays at rest, all beat long
	if (spec.mode === 'panel') {
		const frame = rig.bones.findIndex((b) => b.name === 'frame');
		let worst = 0, rigidOff = 0;
		const fixed = [];
		for (let v = 0; v < V; v++) if (rig.weights[v * B + frame] > 0.999) fixed.push(v);
		for (let ms = 0; ms <= 2600; ms += 8) {
			const pose = spec.pose(rig, ms);
			const r = pose.rigid;
			rigidOff = Math.max(rigidOff, Math.abs(r.sx - 1), Math.abs(r.sy - 1), Math.abs(r.pop - 1), Math.abs(r.rot), Math.abs(r.dx), Math.abs(r.dy));
			core.skin(rig, pose, spec.feetY, out);
			for (const v of fixed) worst = Math.max(worst, Math.hypot(out[v * 2] - rig.rest[v * 2], out[v * 2 + 1] - rig.rest[v * 2 + 1]));
		}
		if (rigidOff > 1e-9) fail(`panel: the rigid move is used (off by ${rigidOff}) — it would move the frame`);
		else if (worst > 0.05) fail(`panel: the frame moves ${worst.toFixed(3)}px`);
		else ok(`panel: frame still (${fixed.length} vertices), rigid move unused`);
	}

	// 3 + 4 + 6. sweep the beat
	{
		let lo = Infinity, hi = -Infinity, flips = 0, atLo = '', atHi = '';
		const peak = rig.bones.map(() => ({ pos: 0, neg: 0 }));
		const travel = new Float64Array(B);
		const rigidOut = new Float32Array(V * 2);
		// continuity, at normal speed, 1ms apart
		const prev = new Float32Array(V * 2);
		const steps = new Float64Array(2601);
		const stepAt = new Int32Array(2601);
		for (let ms = 0; ms <= 2600; ms++) {
			core.skin(rig, spec.pose(rig, ms), spec.feetY, out);
			if (ms > 0)
				for (let v = 0; v < V; v++) {
					const d = Math.hypot(out[v * 2] - prev[v * 2], out[v * 2 + 1] - prev[v * 2 + 1]);
					if (d > steps[ms]) { steps[ms] = d; stepAt[ms] = v; }
				}
			prev.set(out);
		}
		const pops = [];
		for (let ms = 2; ms < 2600; ms++)
			if (steps[ms] > 1 && steps[ms] > 3 * Math.max(steps[ms - 1], steps[ms + 1])) {
				const v = stepAt[ms];
				pops.push(`${steps[ms].toFixed(2)}px at ${ms}ms (${rig.rest[v * 2].toFixed(0)},${rig.rest[v * 2 + 1].toFixed(0)})`);
			}
		let fastest = 0;
		for (let ms = 1; ms <= 2600; ms++) fastest = Math.max(fastest, steps[ms]);
		if (pops.length) fail(`continuity: ${pops.length} pop(s): ${pops.slice(0, 3).join('; ')}`);
		else ok(`continuity: no pops (fastest ${fastest.toFixed(2)}px per ms)`);
		const END = 2600; // Board's WIN_ANIM_MAX_MS: the longest a win can stay up
		for (const speed of [1, 2]) {
			for (let ms = 0; ms <= END; ms += 4) {
				const pose = spec.pose(rig, ms * speed);
				pose.bones.forEach((p, b) => {
					peak[b].pos = Math.max(peak[b].pos, p.angle);
					peak[b].neg = Math.max(peak[b].neg, -p.angle);
				});
				core.skin(rig, pose, spec.feetY, out);
				const m = measure(S, out, core.rigidAreaFactor(pose.rigid));
				flips += m.flips;
				if (m.lo < lo) { lo = m.lo; atLo = `${where(rig, m.tLo)} at ${ms}ms x${speed}`; }
				if (m.hi > hi) { hi = m.hi; atHi = `${where(rig, m.tHi)} at ${ms}ms x${speed}`; }
				if (speed === 1) {
					// travel of each bone's own inked vertices against the rigid move
					core.skin(rig, { ...core.restPose(rig), rigid: pose.rigid }, spec.feetY, rigidOut);
					for (let v = 0; v < V; v++) {
						if (!S.inkAt(rig.rest[v * 2], rig.rest[v * 2 + 1])) continue;
						const d = Math.hypot(out[v * 2] - rigidOut[v * 2], out[v * 2 + 1] - rigidOut[v * 2 + 1]);
						const b = S.dominant[v];
						if (d > travel[b]) travel[b] = d;
					}
				}
			}
		}
		const line = `mesh: area ${(lo * 100).toFixed(1)}%..${(hi * 100).toFixed(1)}%, ${flips} inversions (fold ${atLo}; stretch ${atHi})`;
		if (flips || lo < 0.5 || hi > 1.6) fail(line);
		else ok(line);

		const ownedBy = new Int32Array(B);
		for (let v = 0; v < V; v++) if (S.inkAt(rig.rest[v * 2], rig.rest[v * 2 + 1])) ownedBy[S.dominant[v]]++;
		S.isGroup = (b) => ownedBy[b] < 12 && rig.bones.some((x) => x.parent === b);
		rig.bones.forEach((bone, b) => {
			if (bone.parent < 0) return;
			const lim = spec.limits[bone.name];
			if (!lim) { fail(`${bone.name} has no measured limit`); return; }
			if (S.isGroup(b)) { ok(`${bone.name} is a group (acts through its children)`); return; }
			const l = `${bone.name} turns +${peak[b].pos.toFixed(2)}/${lim.pos} -${peak[b].neg.toFixed(2)}/${lim.neg}, travels ${travel[b].toFixed(1)}px`;
			if (peak[b].pos > lim.pos + 1e-6 || peak[b].neg > lim.neg + 1e-6) fail(`${l} — past its limit`);
			else if (travel[b] < 1.5) fail(`${l} — does not visibly act`);
			else ok(l);
		});
	}

	// 5. ownership
	{
		const owned = new Int32Array(B);
		for (let v = 0; v < V; v++) if (S.inkAt(rig.rest[v * 2], rig.rest[v * 2 + 1])) owned[S.dominant[v]]++;
		rig.bones.forEach((bone, b) => {
			if (owned[b] < 12 && !S.isGroup(b)) fail(`${bone.name} dominates only ${owned[b]} inked vertices — it is not on the drawing`);
		});
		ok(`ownership: ${rig.bones.map((b, i) => `${b.name} ${owned[i]}`).join(', ')}`);
	}

	if (failures) {
		console.log(`  ${name}: ${failures} failure(s)`);
		process.exitCode = 1;
	}
}
if (!mode) console.log(process.exitCode ? '\ncheck_mesh_wins: FAILED' : '\ncheck_mesh_wins: all checks passed');
