// Preview the free-spin plate exactly as FreeSpinIntro draws it.
//
// The plate art and the text layout are sized from two different places -
// FS_PANEL in generate_theme.mjs and the ratios in FreeSpinAnimation.svelte -
// and when they disagreed the words fell outside the panel. The game needs an
// RGS session to reach this screen, so it cannot be checked by running it.
//
// This composes the same layout offline. The dashed box is the content area the
// text is laid out in; every word has to sit inside the panel behind it.
//
// Usage: node design/preview_feature_plate.mjs <dir with node_modules>
import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const toolDir = process.argv[2];
if (!toolDir) {
	console.error('usage: node preview_feature_plate.mjs <dir with node_modules>');
	process.exit(1);
}
const require = createRequire(path.join(toolDir, 'noop.js'));
const { Resvg } = require('@resvg/resvg-js');
const { PNG } = require('pngjs');

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FONT_DIR = path.join(appRoot, 'static/fonts');
const SIGN = path.join(appRoot, 'static/assets/sprites/tripleWitchingFrame/fs_sign.png');
const OUT = path.join(appRoot, 'design/preview_feature_plate.png');

const read = (file, name) => {
	const src = fs.readFileSync(path.join(appRoot, file), 'utf8');
	const m = src.match(new RegExp(`${name}\\s*=\\s*([0-9.]+)`));
	if (!m) throw new Error(`could not read ${name} from ${file}`);
	return Number(m[1]);
};

const SYMBOL_SIZE = read('src/game/constants.ts', 'SYMBOL_SIZE');
const NUM_REELS = read('src/game/constants.ts', 'NUM_REELS');

const anim = fs.readFileSync(path.join(appRoot, 'src/components/FreeSpinAnimation.svelte'), 'utf8');
const signScale = Number(anim.match(/SIGN_WIDTH = SYMBOL_SIZE \* NUM_REELS \* ([0-9.]+)/)[1]);
const ratio = eval(anim.match(/SIGN_RATIO = ([0-9 /]+);/)[1]);
const boxW = Number(anim.match(/width: SIGN_SIZES\.width \* ([0-9.]+)/)[1]);
const boxH = Number(anim.match(/height: SIGN_SIZES\.height \* ([0-9.]+)/)[1]);
const childOffset = Number(anim.match(/y=\{SIGN_SIZES\.height \* ([0-9.]+)\}/)[1]);

const width = Math.round(SYMBOL_SIZE * NUM_REELS * signScale);
const height = Math.round(width / ratio);
const area = { width: width * boxW, height: height * boxH };
const offsetY = height * childOffset;

const TITLE = 'FREE SPINS';
const SUBTITLE = 'AWARDED';
const COUNT = '12';

const titleSize = Math.min(area.width * 0.13, (area.width * 1.5) / TITLE.length);
const subSize = Math.min(area.width * 0.05, (area.width * 1.1) / SUBTITLE.length);
const countSize = area.width * 0.24;

const text = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="${-width / 2} ${-height / 2} ${width} ${height}">
	<g transform="translate(0 ${offsetY})">
		<rect x="${-area.width / 2}" y="${-area.height / 2}" width="${area.width}" height="${area.height}"
			fill="none" stroke="#00ff88" stroke-width="2" stroke-dasharray="8 6" opacity="0.8"/>
		<text x="0" y="${-area.height * 0.26}" font-family="Titan One" font-size="${titleSize}"
			text-anchor="middle" dominant-baseline="central" letter-spacing="6"
			fill="#ffd75e" stroke="#54330a" stroke-width="6" paint-order="stroke">${TITLE}</text>
		<text x="0" y="${area.height * 0.08}" font-family="Titan One" font-size="${countSize}"
			text-anchor="middle" dominant-baseline="central"
			fill="#fff7d6" stroke="#3a2408" stroke-width="8" paint-order="stroke">${COUNT}</text>
		<text x="0" y="${area.height * 0.32}" font-family="Titan One" font-size="${subSize}"
			text-anchor="middle" dominant-baseline="central" letter-spacing="4"
			fill="#f5e3c3" stroke="#2c1c08" stroke-width="3" paint-order="stroke">${SUBTITLE}</text>
	</g>
</svg>`;

const layer = PNG.sync.read(
	new Resvg(text, {
		fitTo: { mode: 'width', value: width },
		font: { fontDirs: [FONT_DIR], loadSystemFonts: true, defaultFontFamily: 'Titan One' },
	})
		.render()
		.asPng(),
);
const plate = PNG.sync.read(fs.readFileSync(SIGN));

const sheet = new PNG({ width: width + 40, height: height + 40 });
for (let i = 0; i < sheet.data.length; i += 4) {
	sheet.data[i] = 18;
	sheet.data[i + 1] = 20;
	sheet.data[i + 2] = 22;
	sheet.data[i + 3] = 255;
}
const over = (src, srcW, srcH, scaled) => {
	for (let y = 0; y < height; y++) {
		for (let x = 0; x < width; x++) {
			const sx = scaled ? Math.floor((x / width) * srcW) : x;
			const sy = scaled ? Math.floor((y / height) * srcH) : y;
			const si = (sy * srcW + sx) * 4;
			const a = src[si + 3] / 255;
			if (a === 0) continue;
			const di = ((y + 20) * sheet.width + (x + 20)) * 4;
			for (let c = 0; c < 3; c++) {
				sheet.data[di + c] = Math.round(src[si + c] * a + sheet.data[di + c] * (1 - a));
			}
		}
	}
};
over(plate.data, plate.width, plate.height, true);
over(layer.data, layer.width, layer.height, false);

fs.writeFileSync(OUT, PNG.sync.write(sheet));
console.log(`plate ${width}x${height}  content area ${Math.round(area.width)}x${Math.round(area.height)}`);
console.log(`title ${titleSize.toFixed(0)}px  count ${countSize.toFixed(0)}px  subtitle ${subSize.toFixed(0)}px`);
console.log(`wrote ${path.relative(appRoot, OUT)}`);
