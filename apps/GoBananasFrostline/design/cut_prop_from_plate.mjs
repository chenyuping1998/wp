// Cut a symbol's subject off its opaque plate, for use as a thrown/rolled prop.
//
//   node design/cut_prop_from_plate.mjs <toolsDir> <symbol> [out]
//   e.g. node design/cut_prop_from_plate.mjs "E:/stake/tools/gen" h2 grenade
//
// Reads design/source/gen2_symbols/<symbol>.png and writes
// design/source/gen2_symbols/<out>.png with a transparent background.
// generate_symbols_gen2.mjs then carries it through to the sprite folder as a
// supplied cut-out, exactly as it did for the jungle grenade.
//
// ── Why region growing and not a colour threshold ───────────────────────────
//
// Measured on the delivered h2 (a green signal flare on an ice plate):
//
//     plate      saturation 0.336   greenness -1.7
//     canister   saturation 0.375   greenness +10.6
//
// One axis separates and it separates by only 12 levels — and, worse, the parts
// of the subject that are NOT green are the ones that matter most: the steel
// pull-ring and the cap. A global "keep what is green" test cuts those off, and
// widening the tolerance until they survive brings the plate back with them.
// That is the trap the art skill describes: loosening one constant to save one
// feature quietly re-opens another.
//
// So nothing here tests the subject at all. It floods INWARD FROM THE BORDER and
// removes only what is CONNECTED to the border and continuous in colour with it.
// The ring is in the middle of the tile, so the flood never reaches it, whatever
// colour it is. The plate's own gradient is handled because each pixel is
// compared against the neighbour that recruited it, not against a global value.
import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const toolsDir = process.argv[2];
const symbol = process.argv[3];
const outName = process.argv[4] ?? `${symbol}_cut`;
if (!toolsDir || !symbol) {
	console.error('usage: node design/cut_prop_from_plate.mjs <toolsDir> <symbol> [out]');
	process.exit(1);
}
const require = createRequire(path.join(toolsDir, 'noop.js'));
const { PNG } = require('pngjs');

const APP = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(APP, 'design/source/gen2_symbols');

/** How far a pixel may sit from its recruiting neighbour and still be plate. */
const STEP_TOLERANCE = 26;
/** Islands smaller than this share of the largest are soft-edge confetti. */
const SCRAP_SHARE = 0.02;

const file = path.join(SRC, `${symbol}.png`);
if (!fs.existsSync(file)) {
	console.error(`no source: ${path.relative(APP, file)}`);
	process.exit(1);
}
const png = PNG.sync.read(fs.readFileSync(file));
const W = png.width;
const H = png.height;
const N = W * H;
const rgb = (i) => [png.data[i * 4], png.data[i * 4 + 1], png.data[i * 4 + 2]];
const dist = (a, b) => Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2]);

// ── flood inward from every border pixel ───────────────────────────────────
const isPlate = new Uint8Array(N);
const stack = [];
for (let x = 0; x < W; x++) {
	stack.push(x, (H - 1) * W + x);
}
for (let y = 0; y < H; y++) {
	stack.push(y * W, y * W + W - 1);
}
for (const i of stack) isPlate[i] = 1;

while (stack.length) {
	const i = stack.pop();
	const c = rgb(i);
	const x = i % W;
	const y = (i / W) | 0;
	const push = (j) => {
		if (isPlate[j]) return;
		if (dist(rgb(j), c) > STEP_TOLERANCE) return;
		isPlate[j] = 1;
		stack.push(j);
	};
	if (x > 0) push(i - 1);
	if (x < W - 1) push(i + 1);
	if (y > 0) push(i - W);
	if (y < H - 1) push(i + W);
}

let removed = 0;
for (let i = 0; i < N; i++) if (isPlate[i]) removed++;

// ── guard: an implausible share is a failed cut, not a good one ────────────
//
// A cut that ate the subject's outline once measured as "70.5% removed", which
// reads like success. The subject of a centred symbol tile is roughly a fifth to
// a half of it, so anything outside that band is refused rather than written.
const keptShare = 1 - removed / N;
if (keptShare < 0.08 || keptShare > 0.65) {
	console.error(
		`refusing to write: the cut kept ${(keptShare * 100).toFixed(1)}% of the tile, ` +
			`which is outside the plausible 8-65% for a centred subject.`,
	);
	console.error('Raise or lower STEP_TOLERANCE and look at the magenta proof before trusting it.');
	process.exit(1);
}

// ── drop detached scraps ───────────────────────────────────────────────────
const label = new Int32Array(N).fill(-1);
const sizes = [];
for (let seed = 0; seed < N; seed++) {
	if (isPlate[seed] || label[seed] !== -1) continue;
	const id = sizes.length;
	let size = 0;
	const s = [seed];
	label[seed] = id;
	while (s.length) {
		const i = s.pop();
		size++;
		const x = i % W;
		const y = (i / W) | 0;
		const push = (j) => {
			if (isPlate[j] || label[j] !== -1) return;
			label[j] = id;
			s.push(j);
		};
		if (x > 0) push(i - 1);
		if (x < W - 1) push(i + 1);
		if (y > 0) push(i - W);
		if (y < H - 1) push(i + W);
	}
	sizes.push(size);
}
const largest = Math.max(...sizes, 1);
let scrapped = 0;
for (let i = 0; i < N; i++) {
	const id = label[i];
	if (id >= 0 && sizes[id] < largest * SCRAP_SHARE) {
		isPlate[i] = 1;
		scrapped++;
	}
}

// ── write, with a one-pixel alpha feather so the edge is not stair-stepped ──
for (let i = 0; i < N; i++) png.data[i * 4 + 3] = isPlate[i] ? 0 : 255;
const alpha = new Uint8Array(N);
for (let i = 0; i < N; i++) alpha[i] = png.data[i * 4 + 3];
for (let y = 1; y < H - 1; y++) {
	for (let x = 1; x < W - 1; x++) {
		const i = y * W + x;
		if (!alpha[i]) continue;
		const n = alpha[i - 1] + alpha[i + 1] + alpha[i - W] + alpha[i + W];
		if (n < 4 * 255) png.data[i * 4 + 3] = Math.round(n / 4);
	}
}

const out = path.join(SRC, `${outName}.png`);
fs.writeFileSync(out, PNG.sync.write(png));

// bounding box of what survived, so the caller can see it is centred and whole
let minX = W;
let minY = H;
let maxX = 0;
let maxY = 0;
for (let i = 0; i < N; i++) {
	if (png.data[i * 4 + 3] < 8) continue;
	const x = i % W;
	const y = (i / W) | 0;
	if (x < minX) minX = x;
	if (x > maxX) maxX = x;
	if (y < minY) minY = y;
	if (y > maxY) maxY = y;
}
console.log(`${symbol}.png -> ${outName}.png`);
console.log(`  kept ${(keptShare * 100).toFixed(1)}% of the tile, dropped ${scrapped} scrap px`);
console.log(
	`  subject bounds x ${minX}..${maxX} (${maxX - minX}px), y ${minY}..${maxY} (${maxY - minY}px) of ${W}x${H}`,
);
if (minX < 4 || minY < 4 || maxX > W - 5 || maxY > H - 5) {
	console.log('  !! the subject touches the canvas edge — the flood probably leaked');
}
