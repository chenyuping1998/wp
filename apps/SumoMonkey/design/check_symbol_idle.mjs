// Gate: every symbol has its OWN visible idle act on a settled board.
//
// Review 2026-11-03 (5.3, "Poor animations"): the settled board never moved.
// Checks, against the sampled output of src/game/symbolIdleMotion.ts:
//   coverage    every symbol has a spec
//   visible     each act moves ≥ 4% scale, ≥ 3° rotation or ≥ 3% offset
//   distinct    no two symbols trace the same act
//   in its cell scale ≤ 1.12, offset ≤ 0.10 cell
//   returns     the last frame of every act is the source pose (no snap)
//   spread      on the 5×4 base board every cell has its own slot, at most one acts at once
// Usage: node design/check_symbol_idle.mjs [--report]
import path from 'path';
import { fileURLToPath } from 'url';
const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { IDLE_SPECS, symbolIdleFrame, idleSlot, IDLE_CYCLE_MS, SLOT_MS } = await import(
	path.join(appRoot, 'src/game/symbolIdleMotion.ts')
);
const REPORT = process.argv.includes('--report');
const SYMBOLS = ['H1', 'H2', 'H3', 'H4', 'L1', 'L2', 'L3', 'L4', 'L5', 'W', 'S', 'P'];
const problems = [];
const curves = {};
const norm = (r) => Math.atan2(Math.sin(r), Math.cos(r));
for (const s of SYMBOLS) {
	const spec = IDLE_SPECS[s];
	if (!spec) { problems.push(`${s}: no idle spec`); continue; }
	if (spec.actMs >= SLOT_MS) problems.push(`${s}: act ${spec.actMs}ms overlaps the next cell's ${SLOT_MS}ms slot`);
	let sc = 0, rot = 0, off = 0, maxS = 1;
	const curve = [];
	for (let i = 0; i <= 60; i++) {
		const f = { scaleX: 1, scaleY: 1, rotation: 0, dx: 0, dy: 0, ...spec.frame(i / 60) };
		sc = Math.max(sc, Math.abs(f.scaleX - 1), Math.abs(f.scaleY - 1));
		rot = Math.max(rot, Math.abs(f.rotation));
		off = Math.max(off, Math.hypot(f.dx, f.dy));
		maxS = Math.max(maxS, f.scaleX, f.scaleY);
		curve.push([f.scaleX - 1, f.scaleY - 1, f.rotation, f.dx, f.dy]);
		if (i === 60) {
			const err = Math.max(Math.abs(f.scaleX - 1), Math.abs(f.scaleY - 1), Math.abs(norm(f.rotation)), Math.abs(f.dx), Math.abs(f.dy));
			if (err > 0.01) problems.push(`${s}: act ends ${err.toFixed(3)} off its source pose (snaps)`);
		}
	}
	if (!(sc >= 0.04 || rot >= (3 * Math.PI) / 180 || off >= 0.03))
		problems.push(`${s}: act not visible (scale ${sc.toFixed(3)}, rot ${((rot * 180) / Math.PI).toFixed(1)}°, off ${off.toFixed(3)})`);
	if (maxS > 1.12) problems.push(`${s}: scale ${maxS.toFixed(3)} leaves its cell`);
	if (off > 0.1) problems.push(`${s}: offset ${off.toFixed(3)} leaves its cell`);
	curves[s] = curve;
	if (REPORT) console.log(`${s.padEnd(3)} act ${spec.actMs}ms  scale ${sc.toFixed(3)} rot ${((rot * 180) / Math.PI).toFixed(1)}° off ${off.toFixed(3)}`);
}
const names = Object.keys(curves);
for (let a = 0; a < names.length; a++)
	for (let b = a + 1; b < names.length; b++) {
		const A = curves[names[a]], B = curves[names[b]];
		let d = 0, n = 0;
		for (let i = 0; i < A.length; i++) for (let k = 0; k < 5; k++) { d += Math.abs(A[i][k] - B[i][k]); n++; }
		const mag = A.flat().reduce((x, y) => x + Math.abs(y), 0) / n + B.flat().reduce((x, y) => x + Math.abs(y), 0) / n;
		if (d / n < 0.35 * mag) problems.push(`${names[a]} and ${names[b]}: idle acts too alike`);
	}
// visible rows of the base board are 1..4 (0 and 5 are the hidden padding)
const slots = new Set();
for (let r = 0; r < 5; r++) for (let row = 1; row <= 4; row++) slots.add(idleSlot(r, row));
if (slots.size !== 20) problems.push(`base board shares idle slots (${slots.size}/20 distinct)`);
let worst = 0;
for (let t = 0; t < IDLE_CYCLE_MS; t += 20) {
	let n = 0;
	for (let r = 0; r < 5; r++) for (let row = 1; row <= 4; row++) {
		const f = symbolIdleFrame(SYMBOLS[(r * 4 + row) % SYMBOLS.length], t, r, row);
		if (f.actU >= 0) n++;
		else if (f.dx || f.dy || f.rotation || f.scaleX !== 1 || f.scaleY !== 1) problems.push('a resting symbol is off its source pose');
	}
	worst = Math.max(worst, n);
}
if (worst > 1) problems.push(`up to ${worst}/20 cells act at once`);
if (problems.length) { console.error('check_symbol_idle FAIL\n  ' + [...new Set(problems)].join('\n  ')); process.exit(1); }
console.log(`check_symbol_idle OK — ${SYMBOLS.length} symbols, each its own act; one cell every ${SLOT_MS}ms`);
