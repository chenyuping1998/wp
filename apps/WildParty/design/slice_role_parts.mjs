// Slice party_hostess_v2.png into softly-feathered parts for the 2.5D idle
// rig (PartyHostess.svelte): body (base with part regions erased), head
// (hat+face+upper hair, pivots at the neck) and glass (flute+hand, pivots at
// the wrist). Cut rects overlap the erase rects by MARGIN so small part
// rotations never expose a seam.
//
// Emits the part geometry to src/game/hostessParts.json so the component and
// this slicer can never drift apart.
//
// Usage: node design/slice_role_parts.mjs <dir with node_modules for pngjs>
import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const toolsDir = process.argv[2];
if (!toolsDir) {
	console.error('usage: node slice_role_parts.mjs <dir with node_modules/pngjs>');
	process.exit(1);
}
const require = createRequire(path.join(toolsDir, 'noop.js'));
const { PNG } = require('pngjs');

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CHAR_DIR = path.join(appRoot, 'static/assets/sprites/character');
const src = PNG.sync.read(fs.readFileSync(path.join(CHAR_DIR, 'party_hostess_v2.png')));
const { width: W, height: H } = src;

const FEATHER = 14;
const MARGIN = 12; // how far the cut piece overlaps past the body's erase hole

// part rects in image space + pivot the component rotates around
const PARTS = {
	head: { x: 60, y: 0, w: 188, h: 185, pivotX: 150, pivotY: 180 },
	glass: { x: 0, y: 92, w: 74, h: 168, pivotX: 54, pivotY: 250 },
};

const at = (x, y) => (y * W + x) * 4;

// 0..1 weight: how deep (x,y) sits inside rect, feathered over `f` px.
// Edges lying on the image border don't feather (nothing beyond them).
const insideWeight = (x, y, r, f) => {
	if (x < r.x || y < r.y || x >= r.x + r.w || y >= r.y + r.h) return 0;
	const dists = [];
	if (r.x > 0) dists.push(x - r.x);
	if (r.y > 0) dists.push(y - r.y);
	if (r.x + r.w < W) dists.push(r.x + r.w - 1 - x);
	if (r.y + r.h < H) dists.push(r.y + r.h - 1 - y);
	const d = dists.length ? Math.min(...dists) : f;
	return Math.min(1, d / f);
};

// cut pieces
for (const [name, r] of Object.entries(PARTS)) {
	const out = new PNG({ width: r.w, height: r.h });
	for (let y = 0; y < r.h; y++) {
		for (let x = 0; x < r.w; x++) {
			const sx = r.x + x, sy = r.y + y;
			const so = at(sx, sy), doff = (y * r.w + x) * 4;
			out.data[doff] = src.data[so];
			out.data[doff + 1] = src.data[so + 1];
			out.data[doff + 2] = src.data[so + 2];
			out.data[doff + 3] = Math.round(src.data[so + 3] * insideWeight(sx, sy, r, FEATHER));
		}
	}
	fs.writeFileSync(path.join(CHAR_DIR, `party_hostess_${name}.png`), PNG.sync.write(out));
	console.log(`wrote party_hostess_${name}.png ${r.w}x${r.h}`);
}

// body: erase the part regions, inset by MARGIN so pieces overlap the hole
const body = new PNG({ width: W, height: H });
src.data.copy(body.data);
for (const r of Object.values(PARTS)) {
	const eroded = { x: r.x + MARGIN, y: Math.max(0, r.y + (r.y > 0 ? MARGIN : 0)), w: 0, h: 0 };
	eroded.w = r.w - MARGIN - (r.x + r.w < W ? MARGIN : 0) - (r.x > 0 ? 0 : MARGIN) + (r.x > 0 ? -0 : 0);
	// simpler: shrink every non-border edge by MARGIN
	const ex = r.x > 0 ? r.x + MARGIN : 0;
	const ey = r.y > 0 ? r.y + MARGIN : 0;
	const ex2 = r.x + r.w < W ? r.x + r.w - MARGIN : W;
	const ey2 = r.y + r.h < H ? r.y + r.h - MARGIN : H;
	const er = { x: ex, y: ey, w: ex2 - ex, h: ey2 - ey };
	for (let y = er.y; y < er.y + er.h; y++) {
		for (let x = er.x; x < er.x + er.w; x++) {
			const o = at(x, y);
			body.data[o + 3] = Math.round(body.data[o + 3] * (1 - insideWeight(x, y, er, FEATHER)));
		}
	}
}
fs.writeFileSync(path.join(CHAR_DIR, 'party_hostess_body.png'), PNG.sync.write(body));
console.log(`wrote party_hostess_body.png ${W}x${H}`);

// geometry manifest consumed by PartyHostess.svelte
const manifest = { imageWidth: W, imageHeight: H, parts: PARTS };
fs.writeFileSync(
	path.join(appRoot, 'src/game/hostessParts.json'),
	JSON.stringify(manifest, null, '\t') + '\n',
);
console.log('wrote src/game/hostessParts.json');
