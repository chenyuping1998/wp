// Bag-count icons for the buy-bonus cards: one bag, two bags, three bags.
//
// The three buys differ only in how many modifiers they guarantee, and that is
// the one thing the card's prose is worst at conveying at a glance. A row of
// bags says it before the sentence is read - and the bag is already the thing
// the player watches burst on the board, so it needs no legend.
//
// Drawn in WHITE rather than in the modifiers' own red/gold/purple: a card for
// "two modifiers, drawn when it opens" must not appear to promise which two.
//
// Source is the already de-keyed art in static/, not design/source - it is
// transparent there, and alpha is all this needs.
//
// Usage: node design/generate_buy_icons.mjs <dir containing node_modules with pngjs>
import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const toolDir = process.argv[2];
if (!toolDir) {
	console.error('usage: node generate_buy_icons.mjs <dir with node_modules/pngjs>');
	process.exit(1);
}
const require = createRequire(path.join(toolDir, 'noop.js'));
const { PNG } = require('pngjs');

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(appRoot, 'static/assets/sprites/tripleWitchingBags/expand.png');
const OUT_DIR = path.join(appRoot, 'static/assets/sprites/tripleWitchingUi');

// Small on purpose - these sit inside a card that already carries a title, a
// sentence, a price and a button.
const BAG_W = 52;
const BAG_H = 56;
const GAP = 6;

const src = PNG.sync.read(fs.readFileSync(SRC));

/**
 * Area-average downscale. pngjs has no resampling, and nearest-neighbour on a
 * one-pixel-wide neon outline drops half the line - the bag comes out dashed.
 */
const scaled = (targetW, targetH) => {
	const out = new PNG({ width: targetW, height: targetH });
	const sx = src.width / targetW;
	const sy = src.height / targetH;
	for (let y = 0; y < targetH; y++) {
		for (let x = 0; x < targetW; x++) {
			const x0 = Math.floor(x * sx);
			const x1 = Math.max(x0 + 1, Math.floor((x + 1) * sx));
			const y0 = Math.floor(y * sy);
			const y1 = Math.max(y0 + 1, Math.floor((y + 1) * sy));
			let alpha = 0;
			let count = 0;
			for (let yy = y0; yy < y1; yy++) {
				for (let xx = x0; xx < x1; xx++) {
					alpha += src.data[((src.width * yy + xx) << 2) + 3];
					count++;
				}
			}
			const i = (targetW * y + x) << 2;
			// White, with the source's alpha. The colour is discarded entirely -
			// this is a silhouette of the outline, not a tinted copy.
			out.data[i] = 255;
			out.data[i + 1] = 255;
			out.data[i + 2] = 255;
			out.data[i + 3] = Math.round(alpha / count);
		}
	}
	return out;
};

const bag = scaled(BAG_W, BAG_H);

for (const count of [1, 2, 3]) {
	const width = count * BAG_W + (count - 1) * GAP;
	const out = new PNG({ width, height: BAG_H });
	// PNG buffers start zeroed, which is transparent black - nothing to clear.
	for (let n = 0; n < count; n++) {
		const offset = n * (BAG_W + GAP);
		for (let y = 0; y < BAG_H; y++) {
			for (let x = 0; x < BAG_W; x++) {
				const from = (BAG_W * y + x) << 2;
				const to = (width * y + (x + offset)) << 2;
				out.data[to] = bag.data[from];
				out.data[to + 1] = bag.data[from + 1];
				out.data[to + 2] = bag.data[from + 2];
				out.data[to + 3] = bag.data[from + 3];
			}
		}
	}
	const file = path.join(OUT_DIR, `buy_bags_${count}.png`);
	fs.writeFileSync(file, PNG.sync.write(out));
	console.log(`  buy_bags_${count}.png  ${width}x${BAG_H}`);
}
