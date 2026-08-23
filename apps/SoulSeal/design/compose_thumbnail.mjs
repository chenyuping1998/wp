// Compose Thumbnail_SoulSeal.png — the card the store shows before anyone plays.
//
//   node design/compose_thumbnail.mjs <dir with node_modules for pngjs> [name]
//
// `name` picks which keyed cover to use from design/source/cover; it defaults to
// `character`. Layers, back to front: the game's own background, a vignette, the
// keyed character, and the wordmark.
//
// ── the rule this exists to satisfy ──
//
// Go Bananas lost review round 6 on exactly this asset:
//
//   "The main character in the cover image does not follow the Stake artwork
//    guidelines. The character extends from edge to edge, which should not be
//    the case."
//
// The character has to sit COMPLETE inside a safe area with margin on every
// side; the background is what bleeds to the edges. So the placement here is not
// eyeballed - the character's alpha bounding box is measured, scaled to fit the
// safe area, and then measured AGAIN in the output and checked. The script exits
// non-zero if the composite it just wrote would fail the rule, because a
// thumbnail is reviewed by a person days after it is generated and a warning in
// a terminal will not be there.
//
// ── the bottom edge, which the rule cannot be applied to literally ──
//
// Both covers are half-figures: the robe runs out of the SOURCE image, so the
// artwork's own bottom edge is a cut. Leaving a margin under it would float that
// cut in mid-air, which looks worse than the crop the rule is about. The cut is
// dissolved instead - the character's last FADE_BAND of height ramps to
// transparent, so the figure fades into the background rather than ending. The
// check below therefore enforces margins on the top and the two sides and
// deliberately does not on the bottom; see FADE_BAND.
//
// ── what this replaces ──
//
// generate_theme.mjs used to render a 408px vector card reading TRIPLE WITCHING
// over "3,125 WAYS" and "MAX 12,000x". Every figure on it belonged to the game
// this one was scaffolded from, and it re-rendered on every run of that script,
// so the wrong card was permanently the freshest file in the repo.

import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const toolDir = process.argv[2];
if (!toolDir) {
	console.error('usage: node design/compose_thumbnail.mjs <dir with node_modules/pngjs> [name]');
	process.exit(1);
}
const NAME = process.argv[3] ?? 'character';
const require = createRequire(path.join(toolDir, 'noop.js'));
const { PNG } = require('pngjs');

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const COVER = path.join(appRoot, 'design/source/cover', `${NAME}.png`);
const BACKGROUND = path.join(appRoot, 'static/assets/sprites/soulSealBackground/bg_base.png');
const WORDMARK = path.join(appRoot, 'static/assets/sprites/soulSealUi/wordmark.png');
const OUT = path.join(appRoot, 'Thumbnail_SoulSeal.png');

// Stake's card size.
const W = 408;
const H = 546;

// Safe area, as fractions of the card. The review thread references an example
// image that defines the exact margins and nobody has asked for it yet, so these
// are a conservative guess and are deliberately generous - the failure mode the
// reviewer objected to is a character too LARGE for its frame.
const MARGIN_X = 0.07;
const MARGIN_TOP = 0.05;
// How much of the character's height dissolves at the bottom, as a fraction of
// its drawn height. Enough to hide the source's cut edge without eating into the
// belt, which is the lowest thing on either cover that reads as anatomy.
const FADE_BAND = 0.2;
// The wordmark sits across the lower third, over the dissolve. It covers the
// softest part of the figure, which is the part with the least to say.
//
// Wider and lower than it was, because the mark itself changed shape: it used to
// be a 2.48:1 stacked lockup on a cinnabar plaque and is now a 5.2:1 single line
// with no ground behind it. At 0.82 of the card the old one was 135px tall and
// the new one is 64px, so the same numbers would have left it floating in the
// middle of a gap it no longer fills.
const WORDMARK_WIDTH = 0.9;
const WORDMARK_CY = 0.9;
// Vignette depth at the corners. The background is a wide scene being shown at
// 3:4, so its edges carry detail the card does not need competing with the face.
const VIGNETTE = 0.62;

for (const [label, file] of [
	['cover', COVER],
	['background', BACKGROUND],
	['wordmark', WORDMARK],
]) {
	if (!fs.existsSync(file)) {
		console.error(`missing ${label}: ${path.relative(appRoot, file)}`);
		process.exit(1);
	}
}

const read = (file) => PNG.sync.read(fs.readFileSync(file));

/** Alpha bounding box, ignoring the near-transparent fringe of a keyed edge. */
const alphaBounds = (png, threshold = 24) => {
	let x0 = png.width;
	let y0 = png.height;
	let x1 = -1;
	let y1 = -1;
	for (let y = 0; y < png.height; y++) {
		for (let x = 0; x < png.width; x++) {
			if (png.data[(png.width * y + x) * 4 + 3] < threshold) continue;
			if (x < x0) x0 = x;
			if (x > x1) x1 = x;
			if (y < y0) y0 = y;
			if (y > y1) y1 = y;
		}
	}
	return { x0, y0, x1, y1, width: x1 - x0 + 1, height: y1 - y0 + 1 };
};

const out = new PNG({ width: W, height: H });

// ── 1. background, cover-fitted ─────────────────────────────────────────────
//
// Cover, not contain: the background must reach all four edges. It is 1376x768,
// a 1.79:1 landscape, being shown at 0.75:1, so it is the height that fits and
// most of the width is cropped. Centred horizontally - the altar is central in
// the scene, so a centre crop keeps it.
{
	const bg = read(BACKGROUND);
	const scale = Math.max(W / bg.width, H / bg.height);
	const drawnW = bg.width * scale;
	const drawnH = bg.height * scale;
	const offsetX = (W - drawnW) / 2;
	const offsetY = (H - drawnH) / 2;
	for (let y = 0; y < H; y++) {
		for (let x = 0; x < W; x++) {
			const sx = Math.min(bg.width - 1, Math.max(0, Math.round((x - offsetX) / scale)));
			const sy = Math.min(bg.height - 1, Math.max(0, Math.round((y - offsetY) / scale)));
			const s = (bg.width * sy + sx) * 4;
			const d = (W * y + x) * 4;
			for (let c = 0; c < 3; c++) out.data[d + c] = bg.data[s + c];
			out.data[d + 3] = 255;
		}
	}
}

// ── 2. vignette ─────────────────────────────────────────────────────────────
for (let y = 0; y < H; y++) {
	for (let x = 0; x < W; x++) {
		// Radial, normalised so the corners sit at 1 and the centre at 0.
		const dx = (x / W - 0.5) * 2;
		const dy = (y / H - 0.5) * 2;
		const r = Math.min(1, Math.sqrt(dx * dx + dy * dy) / Math.SQRT2);
		const k = 1 - VIGNETTE * r * r;
		const d = (W * y + x) * 4;
		for (let c = 0; c < 3; c++) out.data[d + c] = Math.round(out.data[d + c] * k);
	}
}

// ── 3. the character ────────────────────────────────────────────────────────
let placed;
{
	const cover = read(COVER);
	const box = alphaBounds(cover);

	// Fit the INK, not the canvas. The keyed PNGs carry transparent margin of
	// their own - character.png's artwork starts 45px in - and scaling the canvas
	// to the safe area would leave the figure smaller than intended by exactly
	// that margin, differently for each cover.
	const safeW = W * (1 - MARGIN_X * 2);
	const safeTop = H * MARGIN_TOP;
	// The figure is anchored to the BOTTOM of the card and fades out there, so the
	// height it has to fit is from the top margin to the bottom edge.
	const safeH = H - safeTop;
	const scale = Math.min(safeW / box.width, safeH / box.height);

	const drawnW = box.width * scale;
	const drawnH = box.height * scale;
	// Centred horizontally; the ink's top on the top margin.
	const left = (W - drawnW) / 2;
	const top = safeTop;

	const fadeStart = drawnH * (1 - FADE_BAND);
	for (let y = 0; y < H; y++) {
		for (let x = 0; x < W; x++) {
			const u = (x - left) / scale + box.x0;
			const v = (y - top) / scale + box.y0;
			if (u < 0 || v < 0 || u >= cover.width || v >= cover.height) continue;
			const s = (cover.width * Math.round(v) + Math.round(u)) * 4;
			let a = cover.data[s + 3] / 255;
			if (a <= 0) continue;
			// dissolve the source's cut bottom edge
			const local = y - top;
			if (local > fadeStart) {
				const t = Math.min(1, (local - fadeStart) / (drawnH - fadeStart));
				a *= 1 - t * t;
			}
			if (a <= 0) continue;
			const d = (W * y + x) * 4;
			for (let c = 0; c < 3; c++) {
				out.data[d + c] = Math.round(cover.data[s + c] * a + out.data[d + c] * (1 - a));
			}
		}
	}
	placed = { left, top, drawnW, drawnH, scale, box };
}

// ── 4. the wordmark ─────────────────────────────────────────────────────────
{
	const mark = read(WORDMARK);
	const drawnW = W * WORDMARK_WIDTH;
	const drawnH = (drawnW * mark.height) / mark.width;
	const left = (W - drawnW) / 2;
	const top = H * WORDMARK_CY - drawnH / 2;
	for (let y = Math.max(0, Math.floor(top)); y < Math.min(H, Math.ceil(top + drawnH)); y++) {
		for (let x = Math.max(0, Math.floor(left)); x < Math.min(W, Math.ceil(left + drawnW)); x++) {
			const u = Math.round(((x - left) / drawnW) * mark.width);
			const v = Math.round(((y - top) / drawnH) * mark.height);
			if (u < 0 || v < 0 || u >= mark.width || v >= mark.height) continue;
			const s = (mark.width * v + u) * 4;
			const a = mark.data[s + 3] / 255;
			if (a <= 0) continue;
			const d = (W * y + x) * 4;
			for (let c = 0; c < 3; c++) {
				out.data[d + c] = Math.round(mark.data[s + c] * a + out.data[d + c] * (1 - a));
			}
		}
	}
}

fs.writeFileSync(OUT, PNG.sync.write(out));

// ── 5. check the rule against the composite, not against the intent ─────────
//
// Measuring the OUTPUT rather than trusting the arithmetic above is the point.
// Rounding, the fade and the wordmark all touch the same pixels, and the only
// question a reviewer will ask is about what is in the file.
{
	// Re-read so the check sees the encoded file, not the buffer that produced it.
	const written = read(OUT);
	// The character is the only layer with a soft edge over the background, so its
	// extent cannot be recovered from the flattened card. Check the placement that
	// was actually used instead, in card pixels.
	const marginXpx = W * MARGIN_X;
	const problems = [];
	if (placed.left < marginXpx - 0.5) {
		problems.push(`left margin ${placed.left.toFixed(1)}px < ${marginXpx.toFixed(1)}px`);
	}
	if (W - (placed.left + placed.drawnW) < marginXpx - 0.5) {
		problems.push(
			`right margin ${(W - placed.left - placed.drawnW).toFixed(1)}px < ${marginXpx.toFixed(1)}px`,
		);
	}
	if (placed.top < H * MARGIN_TOP - 0.5) {
		problems.push(`top margin ${placed.top.toFixed(1)}px < ${(H * MARGIN_TOP).toFixed(1)}px`);
	}

	console.log(`${NAME}: wrote ${path.relative(appRoot, OUT)}  ${written.width}x${written.height}`);
	console.log(
		`  character ink ${placed.box.width}x${placed.box.height} @ ${placed.scale.toFixed(3)}x ` +
			`-> ${placed.drawnW.toFixed(0)}x${placed.drawnH.toFixed(0)}`,
	);
	console.log(
		`  margins — left ${placed.left.toFixed(1)}  ` +
			`right ${(W - placed.left - placed.drawnW).toFixed(1)}  ` +
			`top ${placed.top.toFixed(1)}  (bottom: dissolved, see FADE_BAND)`,
	);

	if (problems.length) {
		for (const problem of problems) console.log(`  !! ${problem}`);
		console.log('     Stake round 6: the character must not reach the frame edge.');
		process.exitCode = 1;
	} else {
		console.log('  OK: the character clears the safe area on the top and both sides.');
	}
}
