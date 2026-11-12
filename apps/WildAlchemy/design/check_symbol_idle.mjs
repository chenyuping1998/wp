// Gate: every symbol has its OWN visible idle animation on a settled board.
//
// Review 2026-10-27 (5.3): "could benefit from individual symbol animations, as
// it currently feels too static." The 1% breath was the only idle motion.
// Checks, against the sampled output of game/symbolIdleMotion.ts:
//   coverage    every symbol in SYMBOL list has a spec
//   visible     each act moves ≥ 4% scale, ≥ 3° rotation, ≥ 3% offset or flickers
//   distinct    no two symbols trace the same act (normalised curve distance)
//   in its cell scale ≤ 1.12, offset ≤ 0.10 cell
//   wrap-safe   every loop/cycle divides IDLE_WRAP_MS
//   spread      on a 5×4 board at most 6 cells are mid-act at any instant
// Usage: node design/check_symbol_idle.mjs [--report]
import path from 'path';
import { fileURLToPath } from 'url';
const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { IDLE_SPECS, symbolIdleFrame } = await import(path.join(appRoot, 'src/game/symbolIdleMotion.ts'));
const { IDLE_WRAP_MS } = await import(path.join(appRoot, 'src/game/idleSway.ts'));
const { idlePhase } = await import(path.join(appRoot, 'src/game/idleBreathe.ts'));
const REPORT = process.argv.includes('--report');
const SYMBOLS = ['H1', 'H2', 'H3', 'H4', 'L1', 'L2', 'L3', 'L4', 'W', 'S'];
const problems = [];
const curves = {};
const runtime = (await import('node:fs')).readFileSync(path.join(appRoot, 'src/components/SymbolSprite.svelte'), 'utf8');
if (!runtime.includes('symbolIdleFrame(') || !runtime.includes('!props.dim') || !runtime.includes('!props.focus')) problems.push('idle acts must be wired and gated on dim/tease');
for (const s of SYMBOLS) {
	const spec = IDLE_SPECS[s];
	if (!spec) { problems.push(`${s}: no idle spec`); continue; }
	for (const k of ['loopMs', 'cycleMs']) if (IDLE_WRAP_MS % spec[k]) problems.push(`${s}: ${k} ${spec[k]} does not divide IDLE_WRAP_MS ${IDLE_WRAP_MS}`);
	if (spec.actMs >= spec.cycleMs * 0.5) problems.push(`${s}: act ${spec.actMs}ms is over half its ${spec.cycleMs}ms cycle`);
	let sc = 0, rot = 0, off = 0, flick = 0, maxS = 1, maxOff = 0;
	const curve = [];
	for (let i = 0; i <= 60; i++) {
		const f = { scaleX: 1, scaleY: 1, rotation: 0, dx: 0, dy: 0, alpha: 1, ...spec.frame(i / 60, 0) };
		sc = Math.max(sc, Math.abs(f.scaleX - 1), Math.abs(f.scaleY - 1));
		rot = Math.max(rot, Math.abs(f.rotation));
		off = Math.max(off, Math.hypot(f.dx, f.dy));
		flick = Math.max(flick, 1 - f.alpha);
		maxS = Math.max(maxS, f.scaleX, f.scaleY);
		curve.push([f.scaleX - 1, f.scaleY - 1, f.rotation, f.dx, f.dy, 1 - f.alpha]);
	}
	maxOff = off;
	const visible = spec.overlay || sc >= 0.04 || rot >= (3 * Math.PI) / 180 || off >= 0.03 || flick >= 0.3;
	if (!visible) problems.push(`${s}: act not visible (scale ${sc.toFixed(3)}, rot ${((rot * 180) / Math.PI).toFixed(1)}°, off ${off.toFixed(3)})`);
	if (maxS > 1.12) problems.push(`${s}: scale ${maxS.toFixed(3)} leaves its cell`);
	if (maxOff > 0.1) problems.push(`${s}: offset ${maxOff.toFixed(3)} leaves its cell`);
	curves[s] = curve;
	if (REPORT) console.log(`${s.padEnd(3)} act ${spec.actMs}/${spec.cycleMs}ms  scale ${sc.toFixed(3)} rot ${((rot * 180) / Math.PI).toFixed(1)}° off ${off.toFixed(3)} flick ${flick.toFixed(2)}`);
}
const names = Object.keys(curves);
for (let a = 0; a < names.length; a++)
	for (let b = a + 1; b < names.length; b++) {
		const A = curves[names[a]], B = curves[names[b]];
		let d = 0, n = 0;
		for (let i = 0; i < A.length; i++) for (let k = 0; k < 6; k++) { d += Math.abs(A[i][k] - B[i][k]); n++; }
		const mag = A.flat().reduce((x, y) => x + Math.abs(y), 0) / n + B.flat().reduce((x, y) => x + Math.abs(y), 0) / n;
		if (d / n < 0.35 * mag) problems.push(`${names[a]} and ${names[b]}: idle acts too alike`);
	}
// spread: board of the worst case — every cell the symbol with the shortest cycle
let worst = 0;
for (const s of SYMBOLS) for (let t = 0; t < 20000; t += 40) {
	let n = 0;
	for (let r = 0; r < 5; r++) for (let row = 1; row <= 4; row++) if (symbolIdleFrame(s, t, idlePhase(r, row)).actU >= 0) n++;
	worst = Math.max(worst, n);
}
if (worst > 6) problems.push(`up to ${worst}/20 cells act at once — reads as a block pulse`);
if (REPORT) console.log(`max simultaneous acts on a single-symbol board: ${worst}/20`);
if (problems.length) { console.error('check_symbol_idle FAIL\n  ' + problems.join('\n  ')); process.exit(1); }
console.log(`check_symbol_idle OK — ${SYMBOLS.length} symbols, each its own idle act`);
