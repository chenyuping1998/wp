// The Buy Bonus menu's hero cut-outs (src/components/ui/ModalBuyBonus.svelte).
//
// The cards stand the game's OWN pieces over a starfield — the planet, the
// comet, the Wild, the grow marker and the hold-and-spin coin — so the menu
// shows the player what they are buying into rather than a picture of it.
// The reel sprites are 1024px: far more than a card needs, and they are HTML
// <img>s here, not the pixi textures, so they would download twice. This writes
// 320px copies (area-averaged in premultiplied alpha, so no dark fringes) into
// goBananasUi/buy_*.png.
//
// The coin is p.png's gold disc cut out of its square steel plate: on a card the
// plate reads as a tile, the disc reads as money.
//
// Usage: node design/generate_buy_heroes.mjs   (pngjs from E:\stake\tools\gen)
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';

const require = createRequire('E:/stake/tools/gen/package.json');
const { PNG } = require('pngjs');

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SYM = path.join(appRoot, 'static/assets/sprites/goBananasSymbolsV3');
const OUT = path.join(appRoot, 'static/assets/sprites/goBananasUi');

const read = (f) => PNG.sync.read(fs.readFileSync(path.join(SYM, f)));

// area-average resample to w x h, premultiplied
function resize(src, w, h) {
	const out = new PNG({ width: w, height: h });
	const sx = src.width / w;
	const sy = src.height / h;
	for (let y = 0; y < h; y++)
		for (let x = 0; x < w; x++) {
			const x0 = x * sx, x1 = x0 + sx, y0 = y * sy, y1 = y0 + sy;
			let r = 0, g = 0, b = 0, a = 0, n = 0;
			for (let yy = Math.floor(y0); yy < Math.ceil(y1); yy++) {
				const wy = Math.min(yy + 1, y1) - Math.max(yy, y0);
				for (let xx = Math.floor(x0); xx < Math.ceil(x1); xx++) {
					const wx = Math.min(xx + 1, x1) - Math.max(xx, x0);
					const k = wx * wy;
					const i = (yy * src.width + xx) * 4;
					const al = src.data[i + 3] / 255;
					r += src.data[i] * al * k;
					g += src.data[i + 1] * al * k;
					b += src.data[i + 2] * al * k;
					a += al * k;
					n += k;
				}
			}
			const o = (y * w + x) * 4;
			out.data[o] = a ? Math.round(r / a) : 0;
			out.data[o + 1] = a ? Math.round(g / a) : 0;
			out.data[o + 2] = a ? Math.round(b / a) : 0;
			out.data[o + 3] = Math.round((a / n) * 255);
		}
	return out;
}

// crop to the opaque bounds (plus a margin) so the card's percentages place the
// drawing, not its empty canvas
function trim(src, margin = 6) {
	let x0 = src.width, y0 = src.height, x1 = 0, y1 = 0;
	for (let y = 0; y < src.height; y++)
		for (let x = 0; x < src.width; x++)
			if (src.data[(y * src.width + x) * 4 + 3] > 8) {
				x0 = Math.min(x0, x); x1 = Math.max(x1, x);
				y0 = Math.min(y0, y); y1 = Math.max(y1, y);
			}
	x0 = Math.max(0, x0 - margin); y0 = Math.max(0, y0 - margin);
	x1 = Math.min(src.width - 1, x1 + margin); y1 = Math.min(src.height - 1, y1 + margin);
	const out = new PNG({ width: x1 - x0 + 1, height: y1 - y0 + 1 });
	PNG.bitblt(src, out, x0, y0, out.width, out.height, 0, 0);
	return out;
}

const fit = (src, max) => {
	const k = max / Math.max(src.width, src.height);
	return resize(src, Math.round(src.width * k), Math.round(src.height * k));
};

const write = (name, png) => {
	fs.writeFileSync(path.join(OUT, name), PNG.sync.write(png));
	console.log(`${name} ${png.width}x${png.height}`);
};

write('buy_planet.png', fit(trim(read('h1.png')), 320));
write('buy_comet.png', fit(trim(read('h2.png')), 320));
write('buy_wild.png', fit(trim(read('w.png')), 320));
write('buy_marker.png', fit(trim(read('growMarker.png')), 200));

// the coin: a soft-edged disc out of the plate
{
	const p = read('p.png');
	const cx = 128, cy = 128, R = 92;
	const disc = new PNG({ width: 2 * R + 4, height: 2 * R + 4 });
	for (let y = 0; y < disc.height; y++)
		for (let x = 0; x < disc.width; x++) {
			const sx = cx - R - 2 + x, sy = cy - R - 2 + y;
			const i = (sy * p.width + sx) * 4, o = (y * disc.width + x) * 4;
			const d = Math.hypot(sx + 0.5 - cx, sy + 0.5 - cy);
			const k = Math.max(0, Math.min(1, R - d + 0.5));
			disc.data[o] = p.data[i];
			disc.data[o + 1] = p.data[i + 1];
			disc.data[o + 2] = p.data[i + 2];
			disc.data[o + 3] = Math.round(p.data[i + 3] * k);
		}
	write('buy_coin.png', fit(disc, 128));
}
