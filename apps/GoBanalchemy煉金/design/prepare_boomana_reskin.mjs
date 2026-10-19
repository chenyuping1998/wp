import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
const require = createRequire('E:/stake/tools/gen/package.json');
const { PNG } = require('pngjs');
const app = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = path.resolve(app, '../GoBoomana');
const out = path.join(app, 'design/source/boomana_reskin_v3');
fs.mkdirSync(out, { recursive: true });
for (const name of ['monkey.json', 'monkey.atlas', 'monkey.png']) {
	const destination = path.join(out, 'boom_' + name);
	if (!fs.existsSync(destination))
		fs.copyFileSync(path.join(source, 'static/assets/spines/goBananasMonkey', name), destination);
}
if (!fs.existsSync(path.join(out, 'parts')))
	fs.cpSync(path.join(source, 'design/source/monkey'), path.join(out, 'parts'), {
		recursive: true,
	});
const png = PNG.sync.read(fs.readFileSync(path.join(out, 'boom_monkey.png')));
const crop = new PNG({ width: png.width, height: png.height - 622 });
PNG.bitblt(png, crop, 0, 622, crop.width, crop.height, 0, 0);
fs.writeFileSync(path.join(out, 'boom_body_atlas.png'), PNG.sync.write(crop));
console.log(out);
