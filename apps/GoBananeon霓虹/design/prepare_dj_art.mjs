import fs from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(new URL('../../../../tools/gen/package.json', import.meta.url));
const { PNG } = require('pngjs');
const master = PNG.sync.read(fs.readFileSync(new URL('./source/monkey_neon/dj_hand_master.png', import.meta.url)));
const width = 512, height = 768, out = new PNG({ width, height });
for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
	const sum = [0, 0, 0, 0];
	for (let sy = 0; sy < 2; sy++) for (let sx = 0; sx < 2; sx++) {
		const ix = Math.min(master.width - 1, Math.floor((x + (sx + 0.5) / 2) * master.width / width));
		const iy = Math.min(master.height - 1, Math.floor((y + (sy + 0.5) / 2) * master.height / height));
		const i = (iy * master.width + ix) * 4, a = master.data[i + 3];
		for (let c = 0; c < 3; c++) sum[c] += master.data[i + c] * a;
		sum[3] += a;
	}
	const i = (y * width + x) * 4;
	for (let c = 0; c < 3; c++) out.data[i + c] = sum[3] ? Math.round(sum[c] / sum[3]) : 0;
	out.data[i + 3] = Math.round(sum[3] / 4);
}
fs.writeFileSync(new URL('../static/assets/spines/goBananasMonkey/dj_hand.png', import.meta.url), PNG.sync.write(out));
console.log('DJ hand: 512x768 transparent atlas page prepared');
