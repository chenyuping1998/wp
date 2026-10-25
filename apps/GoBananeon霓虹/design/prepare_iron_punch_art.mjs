// Normalize the imagegen repair and replace only this atlas region.
import fs from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(new URL('../../../../tools/gen/package.json', import.meta.url));
const { PNG } = require('pngjs');
const source = new URL('./source/monkey_neon/', import.meta.url);
const input = PNG.sync.read(fs.readFileSync(new URL('left_leg_0_thigh_clean_master.png', source)));
const width = 153, height = 214;
const clean = new PNG({ width, height });
// Area samples with premultiplied alpha avoid dark cutout edges on downscale.
for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
	const sum = [0, 0, 0, 0];
	for (let sy = 0; sy < 4; sy++) for (let sx = 0; sx < 4; sx++) {
		const ix = Math.min(input.width - 1, Math.floor((x + (sx + 0.5) / 4) * input.width / width));
		const iy = Math.min(input.height - 1, Math.floor((y + (sy + 0.5) / 4) * input.height / height));
		const i = (iy * input.width + ix) * 4, alpha = input.data[i + 3];
		for (let c = 0; c < 3; c++) sum[c] += input.data[i + c] * alpha;
		sum[3] += alpha;
	}
	const i = (y * width + x) * 4;
	for (let c = 0; c < 3; c++) clean.data[i + c] = sum[3] ? Math.round(sum[c] / sum[3]) : 0;
	clean.data[i + 3] = Math.round(sum[3] / 16);
}
fs.writeFileSync(new URL('left_leg_0_thigh_clean.png', source), PNG.sync.write(clean));
const metaFile = new URL('layers.json', source);
const meta = JSON.parse(fs.readFileSync(metaFile, 'utf8'));
meta.layers.find((layer) => layer.name === 'left_leg_0_thigh').file = 'left_leg_0_thigh_clean.png';
fs.writeFileSync(metaFile, JSON.stringify(meta, null, 2) + '\n');
const atlasRoot = new URL('../static/assets/spines/goBananasMonkey/', import.meta.url);
const atlas = fs.readFileSync(new URL('monkey.atlas', atlasRoot), 'utf8');
const match = atlas.match(/left_leg_0_thigh\r?\nbounds:(\d+),(\d+),(\d+),(\d+)/);
if (!match || +match[3] !== width || +match[4] !== height) throw new Error('Thigh atlas region changed');
const pageFile = new URL('monkey.png', atlasRoot);
const page = PNG.sync.read(fs.readFileSync(pageFile));
PNG.bitblt(clean, page, 0, 0, width, height, +match[1], +match[2]);
fs.writeFileSync(pageFile, PNG.sync.write(page));
console.log('Repaired thigh packed; original source layer retained.');
