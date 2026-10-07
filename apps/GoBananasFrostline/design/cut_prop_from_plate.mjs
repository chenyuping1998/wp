// Cut a symbol's subject off its opaque plate, for use as a thrown/rolled prop.
//
//   node design/cut_prop_from_plate.mjs <toolsDir> <symbol> [out] [--from=<file>]
//   e.g. node design/cut_prop_from_plate.mjs "E:/stake/tools/gen" h2 grenade \
//          --from="C:/Users/cheny/Downloads/冰原/h2.jpg"
//
// Writes design/source/gen2_symbols/<out>.png with a transparent background,
// plus <out>_proof.png — the same cut composited on magenta, which is the only
// way to see what the alpha actually did. generate_symbols_gen2.mjs then carries
// the cut-out through to the sprite folder as supplied art.
//
// ── What went wrong four times, and what finally separated ─────────────────
//
// Every earlier attempt flooded the plate by COLOUR CONTINUITY — each pixel
// compared against the neighbour that recruited it. Measured on the flat arctic
// h2 that looks like it should work:
//
//     plate's own worst single step      12     (it is a smooth gradient)
//     step into the subject's outline    71
//     step into the green body          151
//     step from the BEZEL into the plate 243
//
// Two things defeat it anyway.
//
// The bezel. A flood seeded on the image border starts inside the light bezel and
// cannot cross the 243 step into the plate at any tolerance that does not also
// eat the subject. Seeding inside the bezel fixes that much.
//
// The one that actually matters: A FLOOD CAN WALK ROUND A BARRIER. It only has to
// find one soft place. Where the drop shadow darkens the plate, plate to outline
// falls to about 35; from inside the outline, outline to shaded green is 30. So
// at tolerance 30 the flood entered the outline somewhere in the shadow, ran all
// the way round inside it, stepped into the shaded green and then walked the
// body's own smooth gradient to the top. It removed 98.3% of the tile and left
// the cap, the ring and a sliver of lever — see the proof from that run. No
// single-tolerance walk survives this, which is why lowering the number never
// converged: there is no barrier that is high everywhere.
//
// ── What separates: B MINUS R ──────────────────────────────────────────────
//
// The plate is blue and nothing on the grenade is. Measured over the whole tile:
//
//     subject (body, cap, ring, outline)   B-R  -13 .. 11
//     the valley between                        10 .. 29   1.5% of all pixels
//     plate (incl. bezel and drop shadow)       29 .. 59
//
// A threshold at 20 sits in the valley with about 9 units of margin on each side,
// and it is a per-pixel test, so there is nothing for a flood to walk around. It
// also removes the gap inside the pull ring for free — that gap is plate, it is
// blue, and it does not need to be reachable from outside.
//
// This is NOT a general cut-out. It works because every plate in this game is
// slate blue and this subject has no blue in it. The saturation/greenness tests
// tried before failed precisely because they keyed on the SUBJECT, whose steel
// parts are neutral; keying on the PLATE is what makes the steel survive.
import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const toolsDir = process.argv[2];
const rest = process.argv.slice(3);
const fromArg = rest.find((a) => a.startsWith('--from='));
const positional = rest.filter((a) => !a.startsWith('--'));
const symbol = positional[0];
const outName = positional[1] ?? `${symbol}_cut`;
if (!toolsDir || !symbol) {
	console.error(
		'usage: node design/cut_prop_from_plate.mjs <toolsDir> <symbol> [out] [--from=<file>]',
	);
	process.exit(1);
}
const require = createRequire(path.join(toolsDir, 'noop.js'));
const { PNG } = require('pngjs');
const { Resvg } = require('@resvg/resvg-js');

const APP = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(APP, 'design/source/gen2_symbols');

/**
 * Blue-minus-red at or above which a pixel is plate. The valley between the two
 * populations runs 10..29 on this art; 20 is its middle.
 */
const BLUE_MIN = 20;
/** Islands smaller than this share of the largest are soft-edge confetti. */
const SCRAP_SHARE = 0.02;
/** Breathing room around the cropped prop, as a share of its longest side. */
const PROP_MARGIN = 0.04;

// ── read, decoding jpeg through resvg if that is what was handed over ───────
const sourceFile = fromArg ? fromArg.slice(7) : path.join(SRC, `${symbol}.png`);
if (!fs.existsSync(sourceFile)) {
	console.error(`no source: ${sourceFile}`);
	process.exit(1);
}
const readImage = (file) => {
	if (file.toLowerCase().endsWith('.png')) return PNG.sync.read(fs.readFileSync(file));
	const ext = path.extname(file).slice(1).toLowerCase();
	const mime = ext === 'webp' ? 'image/webp' : 'image/jpeg';
	const b64 = fs.readFileSync(file).toString('base64');
	// resvg needs a size; take it from the jpeg's own SOF marker so nothing is
	// resampled on the way in.
	const buf = fs.readFileSync(file);
	let w = 1024;
	let h = 1024;
	for (let i = 2; i < buf.length - 9; ) {
		if (buf[i] !== 0xff) {
			i++;
			continue;
		}
		const m = buf[i + 1];
		if (m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc) {
			h = buf.readUInt16BE(i + 5);
			w = buf.readUInt16BE(i + 7);
			break;
		}
		i += 2 + buf.readUInt16BE(i + 2);
	}
	const svg =
		`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">` +
		`<image href="data:${mime};base64,${b64}" width="${w}" height="${h}"/></svg>`;
	return PNG.sync.read(new Resvg(svg, { fitTo: { mode: 'width', value: w } }).render().asPng());
};

const png = readImage(sourceFile);
const W = png.width;
const H = png.height;
const N = W * H;
const R = (i) => png.data[i * 4];
const G = (i) => png.data[i * 4 + 1];
const B = (i) => png.data[i * 4 + 2];
const stepTo = (a, b) => Math.abs(R(a) - R(b)) + Math.abs(G(a) - G(b)) + Math.abs(B(a) - B(b));

// ── 1. the plate is everything blue enough ─────────────────────────────────
const isPlate = new Uint8Array(N);
for (let i = 0; i < N; i++) if (B(i) - R(i) >= BLUE_MIN) isPlate[i] = 1;

// A tile whose B-R is not actually bimodal is not this kind of plate, and the
// threshold would be a guess. Refuse rather than produce a confident bad cut.
{
	let valley = 0;
	for (let i = 0; i < N; i++) {
		const v = B(i) - R(i);
		if (v >= BLUE_MIN - 10 && v < BLUE_MIN + 10) valley++;
	}
	const pct = (valley / N) * 100;
	console.log(`  [split] ${pct.toFixed(1)}% of pixels sit within 10 of the B-R threshold`);
	if (pct > 12) {
		console.error(
			`refusing to run: ${pct.toFixed(1)}% of the tile sits in the B-R valley, so plate and ` +
				`subject are not cleanly separated by blueness on this image.`,
		);
		process.exit(1);
	}
}

let removed = 0;
for (let i = 0; i < N; i++) if (isPlate[i]) removed++;
console.log(`  [plate] ${((removed / N) * 100).toFixed(1)}% of the tile is plate`);

// ── 3. plausibility, before anything is written ────────────────────────────
//
// A cut that ate the subject's outline once measured as "70.5% removed", which
// reads like success. The subject of a centred symbol tile is roughly a fifth to
// a half of it, so anything outside that band is refused rather than written.
//
// The proof is written even when the guard refuses. Telling the reader to go and
// look at a file that a failing run never produced is how three attempts at this
// were debugged blind.
const writeProof = (name) => {
	const proof = new PNG({ width: W, height: H });
	for (let i = 0; i < N; i++) {
		const a = isPlate[i] ? 0 : 1;
		proof.data[i * 4] = Math.round(R(i) * a + 255 * (1 - a));
		proof.data[i * 4 + 1] = Math.round(G(i) * a);
		proof.data[i * 4 + 2] = Math.round(B(i) * a + 255 * (1 - a));
		proof.data[i * 4 + 3] = 255;
	}
	const p = path.join(SRC, `${name}_proof.png`);
	fs.writeFileSync(p, PNG.sync.write(proof));
	return path.relative(APP, p);
};

const keptShare = 1 - removed / N;
if (keptShare < 0.08 || keptShare > 0.65) {
	console.error(
		`refusing to write: the cut kept ${(keptShare * 100).toFixed(1)}% of the tile, ` +
			`which is outside the plausible 8-65% for a centred subject.`,
	);
	console.error(`Adjust BLUE_MIN and look at ${writeProof(outName)}`);
	process.exit(1);
}

// ── 4. drop detached scraps ────────────────────────────────────────────────
const label = new Int32Array(N).fill(-1);
const sizes = [];
for (let s = 0; s < N; s++) {
	if (isPlate[s] || label[s] !== -1) continue;
	const id = sizes.length;
	let size = 0;
	const q = [s];
	label[s] = id;
	while (q.length) {
		const i = q.pop();
		size++;
		const x = i % W;
		const y = (i / W) | 0;
		const push = (j) => {
			if (isPlate[j] || label[j] !== -1) return;
			label[j] = id;
			q.push(j);
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

// ── 5. write, with a one-pixel alpha feather ───────────────────────────────
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

// ── 6. crop to the subject and pad to square ───────────────────────────────
//
// A prop is a standalone object, so the plate's framing is dead weight. Left as
// it came out, this cut filled 30% x 69% of its canvas against the jungle prop's
// 93% x 99%, and generate_symbols_gen2.mjs scales the whole canvas to a fixed
// size — so the new grenade would have rolled along the win line at about a
// third of the old one's width. Nothing would have errored.
//
// Padded to SQUARE rather than cropped tight: the generator resizes to a square
// canvas, so handing it a 306x711 subject would stretch it to nearly twice its
// width. The old prop survived that only because it happened to be near-square
// already (1225x1284).
const bbox = () => {
	let x0 = W;
	let y0 = H;
	let x1 = 0;
	let y1 = 0;
	for (let i = 0; i < N; i++) {
		if (png.data[i * 4 + 3] < 8) continue;
		const x = i % W;
		const y = (i / W) | 0;
		if (x < x0) x0 = x;
		if (x > x1) x1 = x;
		if (y < y0) y0 = y;
		if (y > y1) y1 = y;
	}
	return { x0, y0, x1, y1 };
};
const bb = bbox();
const bw = bb.x1 - bb.x0 + 1;
const bh = bb.y1 - bb.y0 + 1;
const side = Math.round(Math.max(bw, bh) * (1 + PROP_MARGIN));
const cropped = new PNG({ width: side, height: side });
const ox = bb.x0 - Math.round((side - bw) / 2);
const oy = bb.y0 - Math.round((side - bh) / 2);
for (let y = 0; y < side; y++) {
	for (let x = 0; x < side; x++) {
		const sx = ox + x;
		const sy = oy + y;
		const d = (y * side + x) * 4;
		if (sx < 0 || sy < 0 || sx >= W || sy >= H) {
			cropped.data[d + 3] = 0;
			continue;
		}
		const si = (sy * W + sx) * 4;
		for (let c = 0; c < 4; c++) cropped.data[d + c] = png.data[si + c];
	}
}

const out = path.join(SRC, `${outName}.png`);
fs.writeFileSync(out, PNG.sync.write(cropped));

// Alpha is invisible in a viewer that paints its own background, and every
// failed attempt at this looked fine until it was composited.
const proofPath = writeProof(outName);

console.log(`${path.basename(sourceFile)} -> ${outName}.png  (${W}x${H})`);
console.log(
	`  kept ${(keptShare * 100).toFixed(1)}% of the tile, dropped ${scrapped} scrap px`,
);
console.log(
	`  subject was ${bw}x${bh} at x ${bb.x0}, y ${bb.y0}; written as ${side}x${side} square`,
);
console.log(`  proof: ${proofPath}  — LOOK AT IT before using the cut`);
if (bb.x0 < 4 || bb.y0 < 4 || bb.x1 > W - 5 || bb.y1 > H - 5) {
	console.log('  !! the subject reached the source edge — the plate test probably leaked');
}
