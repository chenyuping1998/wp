// The gate for the high-pay mesh wins (src/game/meshWin/*).
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
//   9. the LANDING (meshRig.landPose), every spin: at weights 0.7 / 1 / 1.6
//      the same fold, stretch, inversion, limit and pop rules, and it starts
//      and ends on the drawing (the static sprite is on both sides of it)
//  12. the LEAP of the high pays (meshWin/leap.ts): their subject's box stays
//      inside its own tile on every frame, and it ends on the drawing
//  11. the TEASE (a loop held while the spin is undecided): at every
//      intensity, cut off at several points in its cycle, the same rules, and
//      it starts on the drawing and settles exactly back onto it
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
const LEAPM = await import(pathToFileURL(path.join(appRoot, 'src/game/meshWin/leap.ts')).href);
// MESH_LANDS: every mesh symbol — the winners, and the tablet and the coin that
// only land (their "win" pose is their landing, so every rule below applies)
const { MESH_LANDS: MESH_WINS } = await import(pathToFileURL(path.join(appRoot, 'src/game/meshWin/index.ts')).href);

const pick = args[0] && !args[0].startsWith('--') ? args.shift().split(',') : Object.keys(MESH_WINS);
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
	const spec = MESH_WINS[name];
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
			// the high pays' jump, as the game draws it (its stretch needs the
			// frame before, for the speed)
			if (LEAPM.SUBJECT_BOX[name]) {
				const s = LEAPM.leapState();
				const before = Math.max(0, ms - 16);
				LEAPM.applyLeap(spec, spec.pose(rig, before), before, s);
				LEAPM.applyLeap(spec, pose, ms, s);
			}
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

	// 9. the landing
	{
		let lo = Infinity, hi = -Infinity, flips = 0, at = '', ends = 0, pops = 0, over = '';
		for (const k of [0.7, 1, 1.6]) {
			// a POP is a step bigger than the steps on BOTH sides of it, as in the
			// win check; comparing with the previous step alone flagged the
			// landing's impact onset and its bounce, which start fast on purpose
			const LAND = core.landMsOf(spec);
			const steps = new Float64Array(LAND + 1);
			const prev = new Float32Array(V * 2);
			for (let ms = 0; ms <= LAND; ms++) {
				const pose = core.landPose(spec, rig, ms, k);
				pose.bones.forEach((p, b) => {
					const lim = spec.limits[rig.bones[b].name];
					if (!lim) return;
					if (p.angle > lim.pos + 1e-6 || -p.angle > lim.neg + 1e-6)
						over ||= `${rig.bones[b].name} ${p.angle.toFixed(2)}° at ${ms}ms k${k}`;
				});
				core.skin(rig, pose, spec.feetY, out);
				const m = measure(S, out, core.rigidAreaFactor(pose.rigid));
				flips += m.flips;
				if (m.lo < lo) { lo = m.lo; at = `${where(rig, m.tLo)} at ${ms}ms k${k}`; }
				hi = Math.max(hi, m.hi);
				let step = 0;
				if (ms > 0) for (let v = 0; v < V; v++) step = Math.max(step, Math.hypot(out[v * 2] - prev[v * 2], out[v * 2 + 1] - prev[v * 2 + 1]));
				steps[ms] = step;
				prev.set(out);
				if (ms === 0 || ms === LAND) {
					let e = 0;
					for (let i = 0; i < out.length; i++) e = Math.max(e, Math.abs(out[i] - rig.rest[i]));
					ends = Math.max(ends, e);
				}
			}
			for (let ms = 2; ms < LAND; ms++)
				if (steps[ms] > 1 && steps[ms] > 3 * Math.max(steps[ms - 1], steps[ms + 1])) pops++;
		}
		const line = `landing: area ${(lo * 100).toFixed(1)}%..${(hi * 100).toFixed(1)}%, ${flips} inversions, ends off by ${ends.toFixed(4)}px, ${pops} pops (fold ${at})`;
		if (flips || lo < 0.5 || hi > 1.6 || ends > 1e-3 || pops || over) fail(over ? `${line}; past limit: ${over}` : line);
		else ok(line);
	}

	// 11. the TEASE, if the symbol has one: it loops for as long as a spin stays
	//     undecided, and is cut off whenever the last reel stops. At each
	//     intensity: start on the drawing, run, be told to stop at several
	//     points in its cycle, settle — same fold / stretch / inversion / limit /
	//     pop rules throughout, and it must end exactly on the drawing
	if (spec.tease) {
		let lo = Infinity, hi = -Infinity, flips = 0, ends = 0, starts = 0, pops = 0, over = '';
		for (const k of [0.85, 1.05, 1.25]) {
			for (const stopAt of [180, 700, 1400, 2150]) {
				const total = stopAt + core.TEASE_HOME_MS;
				const steps = new Float64Array(total + 1);
				const prev = new Float32Array(V * 2);
				for (let ms = 0; ms <= total; ms++) {
					const pose = core.teasePose(spec, rig, ms, k, ms < stopAt ? -1 : ms - stopAt);
					pose.bones.forEach((p, b) => {
						const lim = spec.limits[rig.bones[b].name];
						if (lim && (p.angle > lim.pos + 1e-6 || -p.angle > lim.neg + 1e-6))
							over ||= `${rig.bones[b].name} ${p.angle.toFixed(2)}° at ${ms}ms k${k}`;
					});
					core.skin(rig, pose, spec.feetY, out);
					const m = measure(S, out, core.rigidAreaFactor(pose.rigid));
					flips += m.flips;
					lo = Math.min(lo, m.lo);
					hi = Math.max(hi, m.hi);
					let step = 0;
					if (ms > 0) for (let v = 0; v < V; v++) step = Math.max(step, Math.hypot(out[v * 2] - prev[v * 2], out[v * 2 + 1] - prev[v * 2 + 1]));
					steps[ms] = step;
					prev.set(out);
					if (ms === 0 || ms === total) {
						let e = 0;
						for (let i = 0; i < out.length; i++) e = Math.max(e, Math.abs(out[i] - rig.rest[i]));
						if (ms === 0) starts = Math.max(starts, e);
						else ends = Math.max(ends, e);
					}
				}
				for (let ms = 2; ms < total; ms++)
					if (steps[ms] > 1 && steps[ms] > 3 * Math.max(steps[ms - 1], steps[ms + 1])) pops++;
			}
		}
		const line = `tease: area ${(lo * 100).toFixed(1)}%..${(hi * 100).toFixed(1)}%, ${flips} inversions, starts off by ${starts.toFixed(4)}px, settles off by ${ends.toFixed(4)}px, ${pops} pops`;
		if (flips || lo < 0.5 || hi > 1.6 || starts > 1e-3 || ends > 1e-3 || pops || over) fail(over ? `${line}; past limit: ${over}` : line);
		else ok(line);
	}

	// 12. the LEAP (meshWin/leap.ts), the high pays' jump: every frame of the
	//     win with the jump added, the subject's box stays inside its own tile
	//     (margin px from every edge), it moves no faster than a pop allows, and
	//     it ends exactly on the drawing
	if (LEAPM.SUBJECT_BOX[name]) {
		const s = LEAPM.leapState();
		const inked = Array.from({ length: V }, (_, v) => S.inkAt(rig.rest[v * 2], rig.rest[v * 2 + 1]));
		let top = Infinity, left = Infinity, right = -Infinity, lift = 0, ends = 0;
		for (let ms = 0; ms <= spec.durationMs; ms++) {
			const pose = spec.pose(rig, ms);
			const restDy = pose.rigid.dy;
			LEAPM.applyLeap(spec, pose, ms, s);
			const b = LEAPM.subjectBounds(spec, pose.rigid);
			top = Math.min(top, b[1]);
			left = Math.min(left, b[0]);
			right = Math.max(right, b[2]);
			lift = Math.max(lift, restDy - pose.rigid.dy);
			// the real drawing, not just its box: parts that move on their own
			// (the chest's lid) can reach past where the box says it ends
			core.skin(rig, pose, spec.feetY, out);
			for (let v = 0; v < V; v++)
				if (inked[v]) {
					top = Math.min(top, out[v * 2 + 1]);
					left = Math.min(left, out[v * 2]);
					right = Math.max(right, out[v * 2]);
				}
			if (ms === spec.durationMs) {
				for (let i = 0; i < out.length; i++) ends = Math.max(ends, Math.abs(out[i] - rig.rest[i]));
			}
		}
		const m = LEAPM.LEAP.margin - 0.01;
		const line = `leap: lifts up to ${lift.toFixed(1)}px, box top ${top.toFixed(1)} left ${left.toFixed(1)} right ${right.toFixed(1)} (inside ${LEAPM.LEAP.margin}..${core.CANVAS - LEAPM.LEAP.margin}), ends off by ${ends.toFixed(4)}px`;
		if (top < m || left < m || right > core.CANVAS - m || ends > 1e-3 || lift < 10) fail(line);
		else ok(line);
	}

	// 10. the WALK cycle, if the subject has one: a whole stride at every
	//     amount, same fold / stretch / inversion / limit rules
	if (spec.walk) {
		let lo = Infinity, hi = -Infinity, flips = 0, over = '';
		for (const amount of [0.25, 0.5, 0.75, 1]) {
			for (let i = 0; i <= 96; i++) {
				const phase = (i / 96) * 2 * Math.PI;
				const pose = spec.walk(rig, phase, amount);
				pose.bones.forEach((p, b) => {
					const lim = spec.limits[rig.bones[b].name];
					if (lim && (p.angle > lim.pos + 1e-6 || -p.angle > lim.neg + 1e-6))
						over ||= `${rig.bones[b].name} ${p.angle.toFixed(2)}° at amount ${amount}`;
				});
				core.skin(rig, pose, spec.feetY, out);
				const m = measure(S, out, core.rigidAreaFactor(pose.rigid));
				flips += m.flips;
				lo = Math.min(lo, m.lo);
				hi = Math.max(hi, m.hi);
			}
		}
		const line = `walk: area ${(lo * 100).toFixed(1)}%..${(hi * 100).toFixed(1)}%, ${flips} inversions`;
		if (flips || lo < 0.5 || hi > 1.6 || over) fail(over ? `${line}; past limit: ${over}` : line);
		else ok(line);
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
// ---- the big-win PLAQUE (src/game/meshWin/plaque.ts) ------------------------
// Not a symbol, same rules: across the whole presentation, at every tier, with
// the count-up landing early, late and never, no triangle may fold under 50%,
// grow past 1.6x or invert, no step may pop, and at rest it must be the art.
if (!mode) {
	const P = await import(pathToFileURL(path.join(appRoot, 'src/game/meshWin/plaque.ts')).href);
	const grid = P.buildPlaqueGrid();
	const T = grid.indices.length / 3, V = grid.rest.length / 2;
	const out = new Float32Array(V * 2), prev = new Float32Array(V * 2);
	const areaOf = (pos, t) => {
		const a = grid.indices[t * 3], b = grid.indices[t * 3 + 1], c = grid.indices[t * 3 + 2];
		return (pos[b * 2] - pos[a * 2]) * (pos[c * 2 + 1] - pos[a * 2 + 1]) - (pos[b * 2 + 1] - pos[a * 2 + 1]) * (pos[c * 2] - pos[a * 2]);
	};
	const restArea = Float64Array.from({ length: T }, (_, t) => areaOf(grid.rest, t));
	let lo = Infinity, hi = -Infinity, flips = 0, pops = 0, restErr = 0;
	for (const mult of [1, 1.3, 1.8])
		for (const landAt of [-1, 1.2, 4]) {
			const steps = [];
			for (let ms = 0; ms <= 6000; ms += 2) {
				const t = ms / 1000;
				P.posePlaque(grid, t, landAt < 0 ? -1 : t - landAt, mult, out);
				for (let k = 0; k < T; k++) {
					const r = areaOf(out, k) / restArea[k];
					if (r <= 0) flips++;
					lo = Math.min(lo, r);
					hi = Math.max(hi, r);
				}
				let step = 0;
				if (ms > 0) for (let v = 0; v < V; v++) step = Math.max(step, Math.hypot(out[v * 2] - prev[v * 2], out[v * 2 + 1] - prev[v * 2 + 1]));
				steps.push(step);
				prev.set(out);
				if (ms === 0) for (let i = 0; i < out.length; i++) restErr = Math.max(restErr, Math.abs(out[i] - grid.rest[i]));
			}
			for (let i = 2; i < steps.length - 1; i++)
				if (steps[i] > 3 && steps[i] > 3 * Math.max(steps[i - 1], steps[i + 1])) pops++;
		}
	const line = `plaque: area ${(lo * 100).toFixed(1)}%..${(hi * 100).toFixed(1)}%, ${flips} inversions, ${pops} pops, starts off the art by ${restErr.toFixed(4)}px`;
	console.log('PLAQUE');
	if (flips || lo < 0.5 || hi > 1.6 || pops || restErr > 1e-3) {
		console.log(`  !! ${line}`);
		process.exitCode = 1;
	} else console.log(`  ok ${line}`);
}

// THE FURNITURE (src/game/meshWin/sheets.ts): the free-game sign, the board
// housing and the counter plaque — the plaque's rules, across every way each
// one gets hit: fold / stretch / inversion, pops, it starts on the art, comes
// back to it, and visibly moves
if (!mode || mode === '--sheets') {
	const SH = await import(pathToFileURL(path.join(appRoot, 'src/game/meshWin/sheets.ts')).href);
	const checkSheet = (label, grid, runs, seconds) => {
		const T = grid.indices.length / 3, V = grid.rest.length / 2;
		const out = new Float32Array(V * 2), prev = new Float32Array(V * 2);
		const areaOf = (pos, t) => {
			const a = grid.indices[t * 3], b = grid.indices[t * 3 + 1], c = grid.indices[t * 3 + 2];
			return (pos[b * 2] - pos[a * 2]) * (pos[c * 2 + 1] - pos[a * 2 + 1]) - (pos[b * 2 + 1] - pos[a * 2 + 1]) * (pos[c * 2] - pos[a * 2]);
		};
		const restArea = Float64Array.from({ length: T }, (_, t) => areaOf(grid.rest, t));
		let lo = Infinity, hi = -Infinity, flips = 0, pops = 0, startErr = 0, endErr = 0, maxMove = 0;
		for (const pose of runs) {
			const steps = [];
			for (let ms = 0; ms <= seconds * 1000; ms += 2) {
				pose(ms / 1000, out);
				for (let k = 0; k < T; k++) {
					const r = areaOf(out, k) / restArea[k];
					if (r <= 0) flips++;
					lo = Math.min(lo, r);
					hi = Math.max(hi, r);
				}
				let step = 0;
				if (ms > 0) for (let v = 0; v < V; v++) step = Math.max(step, Math.hypot(out[v * 2] - prev[v * 2], out[v * 2 + 1] - prev[v * 2 + 1]));
				steps.push(step);
				prev.set(out);
				let e = 0;
				for (let i = 0; i < out.length; i++) e = Math.max(e, Math.abs(out[i] - grid.rest[i]));
				maxMove = Math.max(maxMove, e);
				if (ms === 0) startErr = Math.max(startErr, e);
			}
			let e = 0;
			for (let i = 0; i < out.length; i++) e = Math.max(e, Math.abs(out[i] - grid.rest[i]));
			endErr = Math.max(endErr, e);
			for (let i = 2; i < steps.length - 1; i++)
				if (steps[i] > 3 && steps[i] > 3 * Math.max(steps[i - 1], steps[i + 1])) pops++;
		}
		const line = `${label.toLowerCase()}: area ${(lo * 100).toFixed(1)}%..${(hi * 100).toFixed(1)}%, ${flips} inversions, ${pops} pops, moves up to ${maxMove.toFixed(1)}px, starts off by ${startErr.toFixed(4)}px, settles off by ${endErr.toFixed(2)}px`;
		console.log(label);
		// the sign keeps breathing while it hangs, so it is not held to settling
		const settles = label !== 'SIGN';
		if (flips || lo < 0.5 || hi > 1.6 || pops || startErr > 1e-3 || (settles && endErr > 0.05) || maxMove < 2) {
			console.log(`  !! ${line}`);
			process.exitCode = 1;
		} else console.log(`  ok ${line}`);
	};

	const sign = SH.buildSignGrid();
	checkSheet('SIGN', sign, [-1, 1.4, 3].map((landAt) => (t, out) => SH.poseSign(sign, t, landAt < 0 ? -1 : t - landAt, out)), 7);

	const frame = SH.buildFrameGrid();
	const frameRuns = [
		// the heaviest single knocks, from the middle, a corner and the gorilla's side
		[{ from: [0, 0], at: 0.05, strength: 1.4 }],
		[{ from: [1, 1], at: 0.05, strength: 1.4 }],
		[{ from: [1.15, 0.2], at: 0.05, strength: 1.4 }],
		// five reel stops in a row, at the bottom of each reel
		[0, 1, 2, 3, 4].map((r) => ({ from: [-0.8 + 0.4 * r, 1], at: 0.05 + 0.12 * r, strength: 0.12 })),
		// the chest beat's four strikes, and a transition slam on top of them
		[...[0, 1, 2, 3].map((i) => ({ from: [1.15, 0.2], at: 0.05 + 0.42 * i, strength: i ? 0.38 : 0.5 })), { from: [0, 0], at: 0.9, strength: 1.4 }],
	];
	checkSheet('FRAME', frame, frameRuns.map((knocks) => (t, out) => SH.poseFrame(frame, knocks, t, out)), 3);

	const counter = SH.buildCounterGrid();
	const counterRuns = [
		[{ at: 0.05, force: 1 }],
		[{ at: 0.05, force: 0.38 }],
		// a retrigger landing on a spent spin's knock, and a run badge after
		[{ at: 0.05, force: 0.38 }, { at: 0.3, force: 1 }, { at: 0.9, force: 0.9 }],
	];
	checkSheet('COUNTER', counter, counterRuns.map((knocks) => (t, out) => SH.poseCounter(counter, knocks, t, out)), 4);
}

if (!mode) console.log(process.exitCode ? '\ncheck_mesh_wins: FAILED' : '\ncheck_mesh_wins: all checks passed');
