// Gate: the twelve symbols must not animate the same.
//
// Three reviewers rejected this game writing "poor animation". The diagnosis in
// docs/handoff/hot_miami_ANIMATION.md is that every symbol ran ONE shared win
// animation, so a winning flamingo and a winning letter J were the same motion
// with different art inside. That is a thing you can measure, so it is a thing
// that can have a gate instead of an opinion.
//
// TWO tables are checked, because the bug had two halves:
//
//   win   `src/game/symbolWinMotion.ts`  — what a symbol does while it is lit
//   land  `src/game/symbolLandMotion.ts` — what it does as it touches down
//
// Landing was the shared-squash half, and it is seen far more often: every
// symbol lands on every spin, only a few ever win.
//
// Each table is sampled over the window the player actually sees, the channels
// are z-scored against pooled statistics so no single channel dominates, and the
// pairwise RMS distance between traces is reported. A table fails if:
//
//   1. a symbol in SYMBOL_INFO_MAP has no motion entry (it would silently get
//      the bland fallback, which is the original bug for that symbol)
//   2. a symbol's motion is essentially static
//   3. any two symbols are too similar
//   4. an overlay names an asset key that does not exist
//   5. a transform is out of sane bounds
//   6. (landing only) the motion has not returned to rest when it ends
//
// (4) matters more than it looks. `check_sprite_keys.mjs` only scans `key="…"`
// in .svelte files, so keys living in a .ts table are invisible to it — and a
// bad key in Pixi draws nothing at all while logging one line to a console
// nobody is reading during review.
//
// (6) exists because landing is one-shot where winning loops: `ReelSymbol`
// flips the symbol to 'static' the moment the landing reports complete, so any
// residual lean or glow is a one-frame snap. It caught two of the shipped
// landings mid-lean.
//
// Usage: node design/check_symbol_motion.mjs [--report]
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { SYMBOL_WIN_MOTION, HOLD_MS, VISIBLE_FLOOR } = await import(
	path.join(appRoot, 'src/game/symbolWinMotion.ts')
);
const { SYMBOL_LAND_MOTION, LAND_MS, LAND_FLOOR } = await import(
	path.join(appRoot, 'src/game/symbolLandMotion.ts')
);

const problems = [];
const fail = (msg) => {
	problems.push(msg);
	console.log(`  !! ${msg}`);
};

// ── thresholds ───────────────────────────────────────────────────────────────
//
// Correlation distance, in [0, 2]. 1.0 is the value for two motions sharing no
// linear structure at all; below about 0.8 they visibly rhyme. Set from the
// measured spread rather than picked in advance — see --report for where the
// shipped tables actually sit.
//
// If a future change pushes a pair under this, the answer is to give one of them
// a different AXIS of movement or a different TEMPORAL signature (a repeating
// beat against a continuous sway). Making an existing motion merely bigger does
// not help and, before the shape fix below, appeared to make things worse.
//
// Both tables are held to the same bar. The landing table was drafted expecting
// to need a lower one — every landing is the same event, a thing arriving and
// coming to rest inside 240ms, so they all share a decaying envelope — and it
// did, at first, with H1/H4/W clustered at 0.39-0.71. The fix was the motions,
// not the number: give one a single smooth lean instead of a ring-down, give one
// a second thud, give one a rebound past rest. It now sits at 0.95.
const MIN_PAIR_DISTANCE = { win: 0.9, land: 0.9 };
// A symbol whose trace barely varies is static, which passes a difference test
// trivially and fails the player completely.
const MIN_MOTION_ENERGY = 0.35;

// ── the visibility floor ─────────────────────────────────────────────────────
//
// Distance and energy are both computed on z-scored traces, which is to say both
// are blind to amplitude on purpose. That blindness shipped three times: twelve
// motions, provably different from each other, and most of them under 4px on a
// 118px cell. The third `poor animation` came back after they had been made
// visible but not bold, and the instruction was 大破大立 — big or gone.
//
// So the floor is now a build failure rather than a report. A symbol clears it
// by reaching the floor on ANY ONE channel it uses: the flamingo is rotation,
// the boombox is scale, the royals are their neon bloom. The tables raise
// themselves to it (boostToFloor in symbolWinMotion.ts), so this asserts the
// property rather than being the thing that enforces it — which is the point, a
// gate that can only be satisfied by the code it checks proves nothing.
const BLOOM_FLOOR = 0.5;
const floorFor = (label) => (label === 'win' ? VISIBLE_FLOOR : LAND_FLOOR);

const CHANNELS = ['scaleX', 'scaleY', 'rotation', 'dx', 'dy', 'bloomAlpha'];
const SAMPLE_MS = 10;

// The windows the player actually sees.
//
// The win window was 1400ms, "so no symbol is judged on a partial loop" — which
// had it backwards. `Board.svelte` holds a winning cell for WIN_HOLD_MS (480ms)
// and then flips it to postWinStatic, so a symbol built on a 1100ms loop shows
// its first 44% and nothing more. Scoring over 1400ms meant most of the score
// came from time no player has ever seen, and it hid the fact that four symbols
// had beats too long to fit. Judge the visible window; if a beat does not
// complete inside it, that is the bug, not the measurement.
// Taken from the table's own HOLD_MS rather than restated as 600, which is what
// it used to say: SymbolWinAnim holds a winning cell for HOLD_MS and the number
// has since moved (480 -> 620), so a literal here would have quietly gone back
// to scoring a window the player no longer sees.
const WINDOW_MS = { win: HOLD_MS, land: LAND_MS };

// ── 1. every symbol on the board has a motion, in BOTH tables ────────────────
const constants = fs.readFileSync(path.join(appRoot, 'src/game/constants.ts'), 'utf8');
const mapBlock = constants.match(/SYMBOL_INFO_MAP\s*=\s*\{([\s\S]*?)\n\}/);
const boardSymbols = mapBlock
	? [...mapBlock[1].matchAll(/^\s*([A-Z][A-Z0-9]*)\s*:/gm)].map((m) => m[1])
	: null;
if (!boardSymbols) fail('could not read SYMBOL_INFO_MAP from src/game/constants.ts');

const assets = fs.readFileSync(path.join(appRoot, 'src/game/assets.ts'), 'utf8');
const knownAssetKeys = new Set(
	[...assets.matchAll(/^\s{1,2}([A-Za-z][A-Za-z0-9_]*)\s*:\s*\{/gm)].map((m) => m[1]),
);

/**
 * Sample one table, run every check against it, and return its pair distances.
 * Both tables go through the same code deliberately: the win table's own review
 * showed the measurement is easier to get wrong than the animation, so there is
 * only one measurement.
 */
const analyse = (label, table, windowMs, { mustEndAtRest = false } = {}) => {
	const names = Object.keys(table);
	const times = Array.from({ length: Math.floor(windowMs / SAMPLE_MS) + 1 }, (_, i) => i * SAMPLE_MS);

	if (boardSymbols) {
		for (const symbol of boardSymbols) {
			if (!table[symbol]) {
				fail(
					`[${label}] symbol ${symbol} is on the board but has no motion entry — it would fall back to the generic one`,
				);
			}
		}
		for (const symbol of names) {
			if (!boardSymbols.includes(symbol)) fail(`[${label}] table has ${symbol}, which is not a board symbol`);
		}
	}

	// ── sample ─────────────────────────────────────────────────────────────────
	const traces = {};
	const overlayKeysUsed = new Set();
	for (const name of names) {
		traces[name] = times.map((t) => {
			const frame = table[name].frame(t);
			for (const overlay of frame.overlays) overlayKeysUsed.add(overlay.key);

			// ── 5. sane bounds ──
			if (!(frame.scaleX > 0.5 && frame.scaleX < 1.8) || !(frame.scaleY > 0.5 && frame.scaleY < 1.8)) {
				fail(`[${label}] ${name} at t=${t}ms: scale (${frame.scaleX.toFixed(2)}, ${frame.scaleY.toFixed(2)}) is outside 0.5-1.8`);
			}
			if (Math.abs(frame.dx) > 0.25 || Math.abs(frame.dy) > 0.25) {
				fail(`[${label}] ${name} at t=${t}ms: offset (${frame.dx.toFixed(3)}, ${frame.dy.toFixed(3)}) leaves the cell`);
			}
			// Spinners are exempt by declaration. Everything else leaning past ~34
			// degrees is a bug, not a style: at this cell size the art starts
			// clipping its neighbours and reads as the sprite having come loose.
			if (!table[name].spins && Math.abs(frame.rotation) > 0.6) {
				fail(`[${label}] ${name} at t=${t}ms: rotation ${frame.rotation.toFixed(2)} rad is a tumble, not a lean — set spins:true if that is intended`);
			}
			if (frame.bloomAlpha < 0 || frame.bloomAlpha > 1) fail(`[${label}] ${name} at t=${t}ms: bloomAlpha ${frame.bloomAlpha} is outside 0-1`);

			return [...CHANNELS.map((c) => frame[c]), frame.overlays.reduce((sum, o) => sum + o.alpha, 0)];
		});

		// ── 5b. bold enough to be seen at all ──
		const floor = floorFor(label);
		const peak = { rotation: 0, offset: 0, scale: 0, bloom: 0 };
		for (const t of times) {
			const frame = table[name].frame(t);
			peak.rotation = Math.max(peak.rotation, Math.abs(frame.rotation));
			peak.offset = Math.max(peak.offset, Math.abs(frame.dx), Math.abs(frame.dy));
			peak.scale = Math.max(peak.scale, Math.abs(frame.scaleX - 1), Math.abs(frame.scaleY - 1));
			peak.bloom = Math.max(peak.bloom, frame.bloomAlpha);
		}
		const clears =
			peak.rotation >= floor.rotation - 1e-6 ||
			peak.offset >= floor.offset - 1e-6 ||
			peak.scale >= floor.scale - 1e-6 ||
			peak.bloom >= BLOOM_FLOOR;
		if (!clears) {
			fail(
				`[${label}] ${name} never clears the visibility floor: peaks are ` +
					`${(peak.rotation * 57.3).toFixed(1)}deg / ${(peak.offset * 118).toFixed(1)}px / ` +
					`${(peak.scale * 100).toFixed(0)}% / bloom ${peak.bloom.toFixed(2)}, floor is ` +
					`${(floor.rotation * 57.3).toFixed(0)}deg / ${(floor.offset * 118).toFixed(0)}px / ` +
					`${(floor.scale * 100).toFixed(0)}% / bloom ${BLOOM_FLOOR} — make it bigger or take it out`,
			);
		}

		// ── 6. one-shot motions must finish at rest ──
		//
		// Checked past the end as well as at it: a motion that only happens to
		// cross zero at t=LAND_MS is still leaning at t=LAND_MS+16ms, and a frame
		// can land either side of the boundary.
		if (mustEndAtRest) {
			for (const t of [windowMs, windowMs * 1.25]) {
				const frame = table[name].frame(t);
				const off = [
					['scaleX', frame.scaleX - 1, 0.02],
					['scaleY', frame.scaleY - 1, 0.02],
					['rotation', frame.rotation, 0.02],
					['dx', frame.dx, 0.01],
					['dy', frame.dy, 0.01],
					['bloomAlpha', frame.bloomAlpha, 0.05],
					['overlays', frame.overlays.reduce((s, o) => s + o.alpha, 0), 0.05],
				].filter(([, v, limit]) => Math.abs(v) > limit);
				if (off.length) {
					fail(
						`[${label}] ${name} has not settled at t=${Math.round(t)}ms: ` +
							off.map(([c, v]) => `${c}=${v.toFixed(3)}`).join(', ') +
							' — it will snap to rest in one frame when the symbol goes static',
					);
				}
			}
		}
	}

	// ── 4. overlay keys exist ──────────────────────────────────────────────────
	for (const key of overlayKeysUsed) {
		if (!knownAssetKeys.has(key)) {
			fail(`[${label}] overlay uses asset key "${key}", which is not in src/game/assets.ts — Pixi would draw nothing`);
		}
	}

	// ── z-score against pooled stats ───────────────────────────────────────────
	const channelCount = CHANNELS.length + 1;
	const mean = [];
	const stdev = [];
	for (let c = 0; c < channelCount; c++) {
		const values = names.flatMap((n) => traces[n].map((row) => row[c]));
		const m = values.reduce((a, b) => a + b, 0) / values.length;
		mean.push(m);
		stdev.push(Math.sqrt(values.reduce((a, b) => a + (b - m) ** 2, 0) / values.length) || 1);
	}
	const z = {};
	for (const name of names) z[name] = traces[name].map((row) => row.map((v, c) => (v - mean[c]) / stdev[c]));

	// ── 2. each symbol actually moves ──────────────────────────────────────────
	const energy = {};
	for (const name of names) {
		let total = 0;
		for (let c = 0; c < channelCount; c++) {
			const column = z[name].map((row) => row[c]);
			const m = column.reduce((a, b) => a + b, 0) / column.length;
			total += column.reduce((a, b) => a + (b - m) ** 2, 0) / column.length;
		}
		energy[name] = Math.sqrt(total);
		if (energy[name] < MIN_MOTION_ENERGY) {
			fail(`[${label}] ${name} barely moves (energy ${energy[name].toFixed(2)} < ${MIN_MOTION_ENERGY}) — it is effectively a static sprite`);
		}
	}

	// ── 3. no two symbols are alike ────────────────────────────────────────────
	//
	// Distance is measured on SHAPE, not amplitude, and that distinction was a bug
	// in the first version of this file. Comparing raw traces, two quiet motions
	// scored as similar however differently shaped they were — H1 was given a
	// sharper, more distinctive beat and its score against H2 got WORSE, purely
	// because the new motion was smaller. That is the metric answering the wrong
	// question.
	//
	// "Do these two animate the same way?" is a question about shape. So each
	// symbol's trace is centred and scaled to unit length first, and the distance
	// between the unit vectors is what is thresholded — a correlation distance in
	// [0, 2], where 0 means identical motion at any amplitude and 2 means exactly
	// opposed. Whether a motion is big enough to see is a separate question, and it
	// has its own separate check above.
	//
	// It is also why this table can describe shape alone and leave weight to
	// `ReelSymbol`'s per-tier amplitude: scaling a whole motion up or down does
	// not move it in this metric at all.
	const unit = (name) => {
		const flat = [];
		for (let c = 0; c < channelCount; c++) {
			const column = z[name].map((row) => row[c]);
			const m = column.reduce((a, b) => a + b, 0) / column.length;
			for (const v of column) flat.push(v - m);
		}
		const norm = Math.sqrt(flat.reduce((a, b) => a + b * b, 0)) || 1;
		return flat.map((v) => v / norm);
	};
	const shapes = {};
	for (const name of names) shapes[name] = unit(name);

	const pairs = [];
	for (let i = 0; i < names.length; i++) {
		for (let j = i + 1; j < names.length; j++) {
			const a = shapes[names[i]];
			const b = shapes[names[j]];
			let sum = 0;
			for (let k = 0; k < a.length; k++) sum += (a[k] - b[k]) ** 2;
			pairs.push([Math.sqrt(sum), names[i], names[j]]);
		}
	}
	pairs.sort((a, b) => a[0] - b[0]);
	for (const [distance, a, b] of pairs) {
		if (distance < MIN_PAIR_DISTANCE[label]) {
			fail(`[${label}] ${a} and ${b} animate too alike (${distance.toFixed(2)} < ${MIN_PAIR_DISTANCE[label]}) — give one of them a different axis of movement`);
		}
	}

	if (process.argv.includes('--report')) {
		console.log(`\n  [${label}] motion energy per symbol:`);
		console.log('   ' + names.map((n) => `${n}=${energy[n].toFixed(2)}`).join('  '));
		console.log(`  [${label}] closest pairs:`);
		for (const [d, a, b] of pairs.slice(0, 6)) console.log(`    ${d.toFixed(2)}  ${a} / ${b}`);
		console.log(`  [${label}] furthest: ${pairs.at(-1)[0].toFixed(2)}  ${pairs.at(-1)[1]} / ${pairs.at(-1)[2]}`);
	}

	return { names, pairs };
};

const win = analyse('win', SYMBOL_WIN_MOTION, WINDOW_MS.win);
const land = analyse('land', SYMBOL_LAND_MOTION, WINDOW_MS.land, { mustEndAtRest: true });

// ── 7. a symbol's landing must not be its win motion ─────────────────────────
//
// The two tables are checked against each other as well as within themselves.
// Landing and winning are different events and a player sees both within a
// second of each other on a winning spin; if a symbol arrives and pays with the
// same gesture, the win reads as a second landing rather than as a payout.
//
// Compared over the WIN window, not the landing window, and that choice is the
// whole validity of this check. Over 240ms both events are an impulse decaying
// away — so is every landing, that is what landing IS — and the first version,
// which compared over 240ms, scored W at 0.25 and would have failed a Wild whose
// two motions genuinely differ: its win re-punches on a beat at 300ms and 600ms,
// entirely outside the window it was being judged in. Comparing over 600ms, with
// the landing (correctly) at rest after 240ms, asks the question a player asks:
// across everything I can see of each event, are these the same gesture?
const CROSS_MIN = 0.75;
{
	const times = Array.from({ length: Math.floor(WINDOW_MS.win / SAMPLE_MS) + 1 }, (_, i) => i * SAMPLE_MS);
	const shapeOf = (motion) => {
		const rows = times.map((t) => {
			const f = motion.frame(t);
			return [...CHANNELS.map((c) => f[c]), f.overlays.reduce((s, o) => s + o.alpha, 0)];
		});
		const flat = [];
		for (let c = 0; c < CHANNELS.length + 1; c++) {
			const column = rows.map((r) => r[c]);
			const m = column.reduce((a, b) => a + b, 0) / column.length;
			for (const v of column) flat.push(v - m);
		}
		const norm = Math.sqrt(flat.reduce((a, b) => a + b * b, 0)) || 1;
		return flat.map((v) => v / norm);
	};
	const crossed = [];
	for (const name of land.names) {
		if (!SYMBOL_WIN_MOTION[name]) continue;
		const a = shapeOf(SYMBOL_LAND_MOTION[name]);
		const b = shapeOf(SYMBOL_WIN_MOTION[name]);
		let sum = 0;
		for (let k = 0; k < a.length; k++) sum += (a[k] - b[k]) ** 2;
		const d = Math.sqrt(sum);
		crossed.push([d, name]);
		if (d < CROSS_MIN) {
			fail(`[cross] ${name} lands the same way it wins (${d.toFixed(2)} < ${CROSS_MIN}) — the win would read as a second landing`);
		}
	}
	crossed.sort((a, b) => a[0] - b[0]);
	if (process.argv.includes('--report')) {
		console.log('\n  [cross] land vs win, closest:');
		for (const [d, n] of crossed.slice(0, 4)) console.log(`    ${d.toFixed(2)}  ${n}`);
	}
}

console.log(
	problems.length === 0
		? `OK: ${win.names.length} win motions (closest ${win.pairs[0][0].toFixed(2)}/${MIN_PAIR_DISTANCE.win}), ` +
				`${land.names.length} land motions (closest ${land.pairs[0][0].toFixed(2)}/${MIN_PAIR_DISTANCE.land})`
		: `${problems.length} symbol-motion problem(s) found`,
);
process.exit(problems.length === 0 ? 0 : 1);
