// Bring delivered symbol art into design/source/gen2_symbols as PNG.
//
//   node design/import_symbols_frost.mjs <toolsDir> <srcDir> <name> [name ...]
//   e.g. node design/import_symbols_frost.mjs "E:/stake/tools/gen" \
//          "C:/Users/cheny/Downloads/冰原" l1 l2 l3 l4 l5 w
//
// ── Why the names are arguments and not a glob ──────────────────────────────
//
// A delivery folder routinely holds more than the batch being accepted. This one
// held twelve files when only six were wanted: h1-h4 and s were held back for a
// re-render, and role.jpg is not a symbol at all. Globbing the folder would have
// silently overwritten five tiles that were deliberately not being changed, and
// nothing downstream would have reported it — generate_symbols_gen2.mjs cannot
// tell a new source from an old one.
//
// So the caller names every file it wants, and anything else in the folder is
// listed and skipped. Overwriting art is not reversible from here; it is only
// reversible because git has the old files.
//
// The source is JPEG, which resvg is the only decoder for in this toolchain —
// the same trick import_backgrounds_frost.mjs uses. Nothing is resized or
// sharpened here: generate_symbols_gen2.mjs owns that, and doing it twice would
// sharpen an already-sharpened tile.
import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const toolsDir = process.argv[2];
const srcDir = process.argv[3];
const names = process.argv.slice(4);
if (!toolsDir || !srcDir || !names.length) {
	console.error(
		'usage: node design/import_symbols_frost.mjs <toolsDir> <srcDir> <name> [name ...]',
	);
	process.exit(1);
}
const require = createRequire(path.join(toolsDir, 'noop.js'));
const { Resvg } = require('@resvg/resvg-js');
const { PNG } = require('pngjs');

const APP = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DEST = path.join(APP, 'design/source/gen2_symbols');

/** Symbol tiles are square; wx is the 1:5 expanding panel. */
const ASPECT = { wx: 5 };
/** Shortest acceptable delivered edge — see the note where it is used. */
const MIN_SHORT_SIDE = { wx: 512, default: 1024 };

const findSource = (name) => {
	for (const ext of ['.png', '.jpg', '.jpeg', '.webp']) {
		const p = path.join(srcDir, name + ext);
		if (fs.existsSync(p)) return p;
	}
	return null;
};

const decode = (file, w, h) => {
	const ext = path.extname(file).slice(1).toLowerCase();
	const mime = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
	const b64 = fs.readFileSync(file).toString('base64');
	const svg =
		`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">` +
		`<image href="data:${mime};base64,${b64}" width="${w}" height="${h}"/></svg>`;
	return PNG.sync.read(new Resvg(svg, { fitTo: { mode: 'width', value: w } }).render().asPng());
};

/** Native pixel size of the delivery, read from the file rather than assumed. */
const probe = (file) => {
	const buf = fs.readFileSync(file);
	if (buf.slice(1, 4).toString() === 'PNG')
		return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) };
	// JPEG: walk the segment chain to the first SOFn marker
	let i = 2;
	while (i < buf.length - 9) {
		if (buf[i] !== 0xff) {
			i++;
			continue;
		}
		const m = buf[i + 1];
		if (m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc)
			return { h: buf.readUInt16BE(i + 5), w: buf.readUInt16BE(i + 7) };
		i += 2 + buf.readUInt16BE(i + 2);
	}
	return null;
};

fs.mkdirSync(DEST, { recursive: true });

const wanted = new Set(names);
const present = fs
	.readdirSync(srcDir)
	.filter((f) => /\.(png|jpe?g|webp)$/i.test(f))
	.map((f) => path.basename(f, path.extname(f)));
const skipped = present.filter((n) => !wanted.has(n));

let failed = 0;
for (const name of names) {
	const src = findSource(name);
	if (!src) {
		console.error(`MISSING  ${name}: nothing named ${name}.{png,jpg,jpeg,webp} in ${srcDir}`);
		failed++;
		continue;
	}
	// A delivery in a different extension does not replace the old file, it
	// SHADOWS it: generate_symbols_gen2.mjs tries .png, then .jpg, then .jpeg and
	// takes the first hit. A stale jungle wx.jpg sat next to a new arctic wx.png
	// exactly once, and only luck (png sorts first) made the new one win.
	const shadowed = ['.png', '.jpg', '.jpeg', '.webp']
		.map((e) => path.join(DEST, name + e))
		.filter((p) => p !== path.join(DEST, `${name}.png`) && fs.existsSync(p));
	if (shadowed.length)
		console.log(
			`  !! ${name}: ${shadowed.map((p) => path.basename(p)).join(', ')} still in the source ` +
				`folder and now shadowed by ${name}.png — delete it, git has the old one`,
		);

	const size = probe(src);
	if (!size) {
		console.error(`UNREADABLE  ${name}: could not read the image header`);
		failed++;
		continue;
	}
	// The art spec asks for 1024 on the short side, but that number is about the
	// SQUARE tiles: generate_symbols_gen2.mjs writes those at 256 and w_fg is a
	// 78% centre crop of w that then gets scaled back up, so the square sources
	// need real headroom. wx is only ever scaled DOWN to 256x1280 and never
	// cropped, so a 464-wide delivery is fine there and warning about it is a
	// false alarm — which is exactly what the first version of this did.
	const short = Math.min(size.w, size.h);
	const minShort = MIN_SHORT_SIDE[name] ?? MIN_SHORT_SIDE.default;
	const ratio = size.w / size.h;
	const want = ASPECT[name] ?? 1;
	const png = decode(src, size.w, size.h);
	const out = path.join(DEST, `${name}.png`);
	const replaced = fs.existsSync(out);
	fs.writeFileSync(out, PNG.sync.write(png));
	console.log(
		`${replaced ? 'replaced' : 'added   '} ${name}.png  ${size.w}x${size.h}` +
			`  <- ${path.basename(src)}` +
			(short < minShort ? `  !! short side ${short} < ${minShort}, the tile will be upscaled` : '') +
			(Math.abs(size.h / size.w - want) > 0.02
				? `  !! aspect ${ratio.toFixed(2)}:1, expected 1:${want}`
				: ''),
	);
}

if (skipped.length) {
	console.log(`\nleft alone in ${srcDir}: ${skipped.join(', ')}`);
}
if (failed) process.exit(1);
console.log('\nnext: node design/check_symbol_legibility.mjs "<toolsDir>" <names>');
