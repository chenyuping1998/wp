// Go Bananas 100 (gen-2) symbol set.
//
// The gen-1 set was transparent cut-outs sitting on a board that drew its own
// grid. The gen-2 art is the opposite: every symbol is a fully opaque riveted
// metal plate, so the symbols ARE the grid and BoardFrame's reel separators
// come out (see design/generate_theme_jungle.mjs). Nothing here chroma-keys, and
// nothing here should introduce transparency into a supplied symbol — a keyed
// hole would show the board through what is meant to read as armour plate.
//
// Sources live in design/source/gen2_symbols/. Output is a NEW folder
// (goBananasSymbolsV3) rather than an edit of V2, because the old filenames are
// on the CDN and would be served from cache.
//
// Symbols not yet supplied fall back to their gen-1 art so the game still
// boots, and are listed loudly at the end. Ship nothing while that list is
// non-empty — see design/GEN2_ART_SPEC.md for what is outstanding.
//
// Usage: node design/generate_symbols_gen2.mjs <dir with node_modules for @resvg/resvg-js + pngjs>
import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const toolsDir = process.argv[2];
if (!toolsDir) {
	console.error('usage: node generate_symbols_gen2.mjs <toolsDir>');
	process.exit(1);
}
const require = createRequire(path.join(toolsDir, 'noop.js'));
const { Resvg } = require('@resvg/resvg-js');
const { PNG } = require('pngjs');

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC_DIR = path.join(appRoot, 'design/source/gen2_symbols');
const OUT_DIR = path.join(appRoot, 'static/assets/sprites/goBananasSymbolsV3');
const FALLBACK_DIR = path.join(appRoot, 'static/assets/sprites/goBananasSymbolsV2');
const FONT_DIR = path.join(appRoot, 'static/fonts');
fs.mkdirSync(OUT_DIR, { recursive: true });

const CANVAS = 256;

// Sampled off the delivered l1 plate after processing (bevel #7c7767 top down to
// #6d6a5b bottom, face #696550 → #464033, rivet #e9e2d0). The procedural pieces
// have to sit in the same olive-steel family as the royals or they read as a
// different game's assets — and p/x are the entire superspin board, so they are
// judged against each other and against nothing else.
const PLATE = {
	edgeLight: '#8a8472',
	edgeMid: '#7c7767',
	edgeDark: '#5b5749',
	faceLight: '#696550',
	faceDark: '#464033',
	rivet: '#e9e2d0',
};

const render = (svg, w = CANVAS) =>
	new Resvg(svg, {
		fitTo: { mode: 'width', value: w },
		font: { fontDirs: [FONT_DIR], loadSystemFonts: true },
	})
		.render()
		.asPng();

// Source art arrives as either PNG or JPEG. pngjs cannot read JPEG and the only
// other library here is resvg, so JPEG is decoded by wrapping it in a one-element
// SVG and rendering that at native size — resvg decodes embedded rasters, which
// makes it a JPEG decoder we already have. Cheaper than adding a dependency to
// the shared tools install for one file format.
const readImage = (file) => {
	if (/\.(jpe?g)$/i.test(file)) {
		const b64 = fs.readFileSync(file).toString('base64');
		// Probe dimensions first: resvg needs them on the wrapper, and an <image>
		// with no explicit size is laid out at its intrinsic size, which is exactly
		// what a zero-size viewport-less render reports back.
		const probe = new Resvg(
			`<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><image xlink:href="data:image/jpeg;base64,${b64}"/></svg>`,
		);
		const { width, height } = probe;
		const svg =
			`<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${width}" height="${height}">` +
			`<image width="${width}" height="${height}" xlink:href="data:image/jpeg;base64,${b64}"/></svg>`;
		return PNG.sync.read(new Resvg(svg, { fitTo: { mode: 'width', value: width } }).render().asPng());
	}
	return PNG.sync.read(fs.readFileSync(file));
};

// Resolve a symbol's source file, whichever extension it was delivered in.
const findSource = (dir, name) =>
	['.png', '.jpg', '.jpeg']
		.map((ext) => path.join(dir, name + ext))
		.find((p) => fs.existsSync(p));

// ── supplied art: square + resize, nothing else ────────────────────────────
//
// The sources are never square and never uniform: the delivered sheet's rows
// came out 305×381, 305×355 and 301×322. Since the board no longer draws
// separators, the plates ARE the grid, so every tile must end up the same size
// or the wall shows gaps.
//
// This scales each axis independently rather than padding or cropping to
// square. Padding extends the edge pixel outward, which visibly thickens the
// bezel on two sides of that one tile; cropping eats the bezel outright. Both
// break the seam. A non-uniform scale distorts the subject a little — the 381px
// row is squashed harder than the 322px row, so those subjects read slightly
// squatter — but every bezel stays intact and identical, which is what the seam
// needs. If the source rows are ever made uniform, this becomes a plain
// uniform scale with no distortion at all.
const resize = (png, size) => {
	const out = new PNG({ width: size, height: size });
	const scaleX = png.width / size;
	const scaleY = png.height / size;
	for (let y = 0; y < size; y++) {
		for (let x = 0; x < size; x++) {
			const fx = Math.min(png.width - 1, x * scaleX);
			const fy = Math.min(png.height - 1, y * scaleY);
			const x0 = Math.floor(fx), y0 = Math.floor(fy);
			const x1 = Math.min(png.width - 1, x0 + 1), y1 = Math.min(png.height - 1, y0 + 1);
			const tx = fx - x0, ty = fy - y0;
			const d = (y * size + x) * 4;
			for (let c = 0; c < 4; c++) {
				const p = (px, py) => png.data[(py * png.width + px) * 4 + c];
				out.data[d + c] = Math.round(
					p(x0, y0) * (1 - tx) * (1 - ty) +
						p(x1, y0) * tx * (1 - ty) +
						p(x0, y1) * (1 - tx) * ty +
						p(x1, y1) * tx * ty,
				);
			}
		}
	}
	return out;
};

// Unsharp mask. The supplied art is 132–152px going to 256, so it arrives soft;
// this recovers the plate's rivets and scratch detail. Harmless at 1:1 or when
// downscaling from a larger source, so it runs unconditionally.
const sharpen = (png, amount) => {
	if (amount <= 0) return png;
	const src = Buffer.from(png.data);
	const at = (x, y, c) =>
		src[
			(Math.max(0, Math.min(png.height - 1, y)) * png.width + Math.max(0, Math.min(png.width - 1, x))) * 4 + c
		];
	for (let y = 0; y < png.height; y++) {
		for (let x = 0; x < png.width; x++) {
			const d = (y * png.width + x) * 4;
			for (let c = 0; c < 3; c++) {
				const blur =
					(at(x - 1, y, c) + at(x + 1, y, c) + at(x, y - 1, c) + at(x, y + 1, c) + at(x, y, c) * 4) / 8;
				png.data[d + c] = Math.max(0, Math.min(255, Math.round(at(x, y, c) + amount * (at(x, y, c) - blur))));
			}
		}
	}
	return png;
};

// ── procedural plate ───────────────────────────────────────────────────────
// Shared chrome for the pieces that were procedural in gen-1 too (p/x/w_fg/
// cudgel/wx): the same riveted bezel the painted plates have, so a coin or a
// dead tile sits in the grid without announcing itself as a different asset.
const plateDefs = `
	<linearGradient id="face" x1="0" y1="0" x2="0.35" y2="1">
		<stop offset="0" stop-color="${PLATE.faceLight}"/>
		<stop offset="1" stop-color="${PLATE.faceDark}"/>
	</linearGradient>
	<linearGradient id="bezel" x1="0" y1="0" x2="0.4" y2="1">
		<stop offset="0" stop-color="${PLATE.edgeLight}"/>
		<stop offset="0.45" stop-color="${PLATE.edgeMid}"/>
		<stop offset="1" stop-color="${PLATE.edgeDark}"/>
	</linearGradient>
	<radialGradient id="vign" cx="0.42" cy="0.36" r="0.78">
		<stop offset="0.55" stop-color="#000000" stop-opacity="0"/>
		<stop offset="1" stop-color="#000000" stop-opacity="0.28"/>
	</radialGradient>
	<filter id="grain"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="3"/>
		<feColorMatrix type="saturate" values="0"/>
		<feComposite operator="in" in2="SourceGraphic"/></filter>`;

// Sized to match the delivered plates, whose rivets read at roughly 5% of the
// tile — the first pass was half that and vanished at 256.
const rivet = (x, y) => `
	<circle cx="${x}" cy="${y}" r="15" fill="#2b2820" opacity="0.55"/>
	<circle cx="${x}" cy="${y}" r="13" fill="${PLATE.edgeDark}"/>
	<circle cx="${x}" cy="${y}" r="10.5" fill="${PLATE.rivet}"/>
	<circle cx="${x - 3}" cy="${y - 3}" r="4" fill="#fffdf4" opacity="0.7"/>`;

// `inner` is drawn on the plate face; `w`/`h` let wx reuse this at 256×1280.
const plate = (inner, w = 512, h = 512) => `
<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
	<defs>${plateDefs}</defs>
	<rect x="0" y="0" width="${w}" height="${h}" rx="26" fill="url(#bezel)"/>
	<rect x="22" y="22" width="${w - 44}" height="${h - 44}" rx="14" fill="url(#face)"/>
	<rect x="22" y="22" width="${w - 44}" height="${h - 44}" rx="14" fill="#000" opacity="0.18" filter="url(#grain)"/>
	<!-- inner shadow line: the delivered plates have a hard step from bezel to
	     recessed face, and without it the procedural tiles read as flat. -->
	<rect x="23" y="23" width="${w - 46}" height="${h - 46}" rx="13" fill="none" stroke="#2b2820" stroke-width="4" opacity="0.75"/>
	<rect x="27" y="27" width="${w - 54}" height="${h - 54}" rx="11" fill="none" stroke="${PLATE.edgeLight}" stroke-width="2" opacity="0.3"/>
	${inner}
	<rect x="0" y="0" width="${w}" height="${h}" rx="26" fill="url(#vign)"/>
	<rect x="1.5" y="1.5" width="${w - 3}" height="${h - 3}" rx="25" fill="none" stroke="#20241c" stroke-width="3"/>
	${rivet(34, 34)}${rivet(w - 34, 34)}${rivet(34, h - 34)}${rivet(w - 34, h - 34)}
</svg>`;

const PROCEDURAL = {
	// Superspin prize coin. Brass, not the scatter's high-saturation gold — the
	// two never share a screen but they do share a paytable.
	p: () =>
		plate(`
		<circle cx="256" cy="256" r="150" fill="#6b5312"/>
		<circle cx="256" cy="256" r="140" fill="url(#coinFace)"/>
		<circle cx="256" cy="256" r="118" fill="none" stroke="#8a6b18" stroke-width="6" opacity="0.7"/>
		<path d="M200 320 Q256 150 320 250 Q290 330 200 320 Z" fill="#c9a132" opacity="0.85"/>
		<defs><radialGradient id="coinFace" cx="0.38" cy="0.3" r="0.85">
			<stop offset="0" stop-color="#f3d982"/><stop offset="0.6" stop-color="#d8b23f"/>
			<stop offset="1" stop-color="#96731a"/></radialGradient></defs>`),
	// Empty superspin cell. Deliberately the flattest tile in the set: it is the
	// backdrop the held coins have to pop against.
	x: () =>
		plate(`
		<rect x="70" y="70" width="372" height="372" rx="10" fill="#2b2f26"/>
		<path d="M170 170 L342 342 M342 170 L170 342" stroke="#3e4437" stroke-width="16" stroke-linecap="round"/>`),
	// Close-up card the wild swaps to mid win-animation.
	w_fg: () => null, // filled from w.png below — needs the supplied art
	// Prop the wild twirls. Transparent: it is a spine attachment drawn OVER a
	// plate, not a plate itself.
	cudgel: () => `
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
	<defs><linearGradient id="ban" x1="0" y1="0" x2="1" y2="1">
		<stop offset="0" stop-color="#ffe98a"/><stop offset="0.5" stop-color="#e8c23a"/>
		<stop offset="1" stop-color="#9c7712"/></linearGradient></defs>
	<path d="M96 150 Q150 400 400 402 Q360 340 330 300 Q220 300 168 138 Z" fill="url(#ban)" stroke="#6b5210" stroke-width="10" stroke-linejoin="round"/>
	<path d="M120 165 Q170 370 370 384" fill="none" stroke="#fff6c4" stroke-width="10" opacity="0.5"/>
	<rect x="86" y="118" width="60" height="44" rx="10" fill="#5c4a12" transform="rotate(-28 116 140)"/>
</svg>`,
};

// ── build ──────────────────────────────────────────────────────────────────
const REQUIRED = ['h1', 'h2', 'h3', 'h4', 'l1', 'l2', 'l3', 'l4', 'l5', 'w', 's', 'p', 'x', 'w_fg', 'cudgel'];
const missing = [];

const writeOut = (name, png) => fs.writeFileSync(path.join(OUT_DIR, `${name}.png`), PNG.sync.write(png));
const supplied = (name) => findSource(SRC_DIR, name);

for (const name of REQUIRED) {
	if (supplied(name)) {
		const src = readImage(supplied(name));
		const out = sharpen(resize(src, CANVAS), Math.min(src.width, src.height) < CANVAS ? 0.7 : 0.25);
		writeOut(name, out);
		console.log(
			`${name}.png  <- supplied ${src.width}x${src.height}` +
				(Math.min(src.width, src.height) < CANVAS ? '  (upscaled — see GEN2_ART_SPEC.md §1)' : ''),
		);
		continue;
	}

	const proc = PROCEDURAL[name]?.();
	if (proc) {
		writeOut(name, PNG.sync.read(render(proc, CANVAS)));
		console.log(`${name}.png  <- procedural`);
		continue;
	}

	// w_fg is the wild's close-up: derive it from the supplied wild rather than
	// asking for a second painting of the same character.
	if (name === 'w_fg' && supplied('w')) {
		const src = readImage(supplied('w'));
		// centre crop to 78% of each axis = the character's head fills the card.
		// Cropping proportionally rather than to a square keeps the source's own
		// aspect, so resize() applies exactly the same squash the full w tile got
		// and the close-up matches the tile the player just saw.
		const kw = Math.round(src.width * 0.78);
		const kh = Math.round(src.height * 0.78);
		const ox = Math.round((src.width - kw) / 2);
		const oy = Math.round((src.height - kh) / 2);
		const cropped = new PNG({ width: kw, height: kh });
		for (let y = 0; y < kh; y++)
			for (let x = 0; x < kw; x++) {
				const s = ((y + oy) * src.width + (x + ox)) * 4;
				const d = (y * kw + x) * 4;
				for (let c = 0; c < 4; c++) cropped.data[d + c] = src.data[s + c];
			}
		writeOut(name, sharpen(resize(cropped, CANVAS), 0.6));
		console.log(`w_fg.png  <- derived from w.png`);
		continue;
	}

	const fallback = path.join(FALLBACK_DIR, `${name}.png`);
	if (fs.existsSync(fallback)) {
		fs.copyFileSync(fallback, path.join(OUT_DIR, `${name}.png`));
		missing.push(name);
		console.log(`${name}.png  <- GEN-1 FALLBACK`);
	} else {
		throw new Error(`no source, no procedural rule and no gen-1 fallback for ${name}`);
	}
}

// grenade: the transition prop, and the one asset here that MUST be a cut-out.
//
// TransitionAnimation drops it over the live scene and GrenadeRunner flies it
// along the win lines, so it is seen against the board rather than in a cell.
// Both used to draw `gbH2` — which in gen-2 is an opaque riveted plate, so what
// actually fell down the screen was a tile, bezel and rivets included.
//
// Cut from the gen-2 h2 so the prop is the same painting as the symbol. Two
// things make that cut awkward, and both were learned the hard way:
//
//   · COLOUR CANNOT SEPARATE THEM. The plate face samples at 57,59,41 and the
//     grenade body at 61,73,9 — same hue family, overlapping brightness. Worse,
//     the body's facet highlights are gold, so a "strip anything gold" rule for
//     the frame eats the subject too. Only the OUTLINE separates them.
//   · THE SUBJECT OVERLAPS THE FRAME BAND. Stripping the frame as a fixed inset
//     rectangle (the first version, 13%) sheared the bottom off the body and the
//     lever, because the grenade very nearly touches the frame's inner edge.
//
// So the frame is peeled by flood, not by geometry, and the gold-or-dark test
// that peels it is confined to a band along the border where only frame can be:
//
//   1. blur, then Sobel — the blur kills the plate's mottling, which would
//      otherwise read as edges everywhere and block the flood immediately
//   2. peel frame and black corners inward from the border, gold-or-dark, but
//      only within BAND of an edge so the body's gold facets are never eligible
//   3. from there, spread through the plate face, blocked by strong edges
//   4. dilate the background by GROW to eat the band of plate left hugging the
//      silhouette, which the edge rule always leaves behind
//   5. largest island, then fill interior holes
//
// EDGE_TH and GROW trade two artefacts against each other, and NEITHER end is
// clean — this is the honest limit of an automatic cut on this artwork:
//
//   aggressive (26 / 2)   no fringe, but the body's shadowed left side is eaten
//                         away: that shadow runs to values like 9,10,3 and is
//                         indistinguishable from plate on every channel, the
//                         G-R guard included
//   conservative (14 / 0) body intact, but a wide ragged plate fringe survives,
//                         which reads as a torn sticker
//
// 18 / 1 is the middle and what ships: fringe mostly gone, body mostly whole,
// with a residual bite low on the left. If that ever matters the fix is not a
// better threshold — it is a hand-made cut-out dropped in as
// design/source/gen2_symbols/grenade.png, which this function then skips.
const cutGrenade = (src) => {
	const W = src.width, H = src.height, N = W * H;
	const EDGE_TH = 18, BAND = 0.2, GROW = 1, FEATHER = 2;

	const lum = new Float32Array(N);
	for (let i = 0, j = 0; i < src.data.length; i += 4, j++)
		lum[j] = src.data[i] * 0.299 + src.data[i + 1] * 0.587 + src.data[i + 2] * 0.114;
	const L = (x, y) => lum[Math.max(0, Math.min(H - 1, y)) * W + Math.max(0, Math.min(W - 1, x))];
	const bl = new Float32Array(N);
	for (let y = 0; y < H; y++)
		for (let x = 0; x < W; x++) {
			let s = 0;
			for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) s += L(x + dx, y + dy);
			bl[y * W + x] = s / 25;
		}
	const B = (x, y) => bl[Math.max(0, Math.min(H - 1, y)) * W + Math.max(0, Math.min(W - 1, x))];
	const edge = new Float32Array(N);
	for (let y = 0; y < H; y++)
		for (let x = 0; x < W; x++) {
			const gx = -B(x-1,y-1) - 2*B(x-1,y) - B(x-1,y+1) + B(x+1,y-1) + 2*B(x+1,y) + B(x+1,y+1);
			const gy = -B(x-1,y-1) - 2*B(x,y-1) - B(x+1,y-1) + B(x-1,y+1) + 2*B(x,y+1) + B(x+1,y+1);
			edge[y * W + x] = Math.hypot(gx, gy);
		}

	const band = Math.round(Math.min(W, H) * BAND);
	const nearBorder = (x, y) => Math.min(x, y, W - 1 - x, H - 1 - y) < band;
	const isGold = (i) => {
		const r = src.data[i * 4], g = src.data[i * 4 + 1], b = src.data[i * 4 + 2];
		return r > 120 && r - b > 50 && g > b && g < r;
	};
	const frameish = (i) => isGold(i) || lum[i] < 42;
	// Body guard. The plate face and the grenade DO overlap in hue and brightness,
	// but not in green offset: sampled across both, G-R averages -1.8 on the face
	// and +9.7 on the body. Without this the flood squeezed through a soft spot on
	// the body’s lower left and ate a visible notch out of it, which GROW then
	// widened and “largest island” happily kept. The lever and ring are grey
	// (G-R near 0) and are not covered here — they are held by their own outlines.
	const isBody = (i) => src.data[i * 4 + 1] - src.data[i * 4] >= 4;

	const bg = new Uint8Array(N);
	const q = [];
	for (let x = 0; x < W; x++) { q.push([x, 0]); q.push([x, H - 1]); }
	for (let y = 0; y < H; y++) { q.push([0, y]); q.push([W - 1, y]); }
	while (q.length) {
		const [x, y] = q.pop();
		if (x < 0 || y < 0 || x >= W || y >= H) continue;
		const i = y * W + x;
		if (bg[i] || !nearBorder(x, y) || !frameish(i)) continue;
		bg[i] = 1;
		q.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
	}

	const q2 = [];
	for (let i = 0; i < N; i++) if (bg[i]) q2.push(i);
	while (q2.length) {
		const c = q2.pop();
		const cx = c % W, cy = (c / W) | 0;
		for (const [nx, ny] of [[cx+1,cy],[cx-1,cy],[cx,cy+1],[cx,cy-1]]) {
			if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
			const ni = ny * W + nx;
			if (bg[ni] || edge[ni] > EDGE_TH || isBody(ni)) continue;
			bg[ni] = 1; q2.push(ni);
		}
	}

	for (let g = 0; g < GROW; g++) {
		const add = [];
		for (let y = 0; y < H; y++)
			for (let x = 0; x < W; x++) {
				const i = y * W + x;
				if (bg[i]) continue;
				if ((x > 0 && bg[i-1]) || (x < W-1 && bg[i+1]) || (y > 0 && bg[i-W]) || (y < H-1 && bg[i+W]))
					add.push(i);
			}
		for (const i of add) bg[i] = 1;
	}

	const lab = new Int32Array(N).fill(-1);
	let best = -1, bestN = 0;
	for (let s0 = 0; s0 < N; s0++) {
		if (bg[s0] || lab[s0] >= 0) continue;
		const st = [s0]; lab[s0] = s0; let n = 0;
		while (st.length) {
			const c = st.pop(); n++;
			const cx = c % W, cy = (c / W) | 0;
			for (const [nx, ny] of [[cx+1,cy],[cx-1,cy],[cx,cy+1],[cx,cy-1]]) {
				if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
				const ni = ny * W + nx;
				if (bg[ni] || lab[ni] >= 0) continue;
				lab[ni] = s0; st.push(ni);
			}
		}
		if (n > bestN) { bestN = n; best = s0; }
	}
	const fg = new Uint8Array(N);
	for (let i = 0; i < N; i++) if (!bg[i] && lab[i] === best) fg[i] = 1;

	// Closing (dilate then erode) to repair what the flood still bit out.
	//
	// isBody stops the leak wherever the body has colour, but the deepest shadow
	// on its lower left runs to values like 9,10,3 — G-R of 1, below the guard, and
	// indistinguishable from plate on every other axis too. Rather than chase a
	// classifier that cannot exist, repair the mask: a closing fills notches up to
	// about 2*CLOSE wide and leaves the silhouette otherwise untouched. CLOSE stays
	// well under the lever-to-body gap (~10px at source scale) so it cannot weld
	// the two together.
	const CLOSE = 3;
	const morph = (mask, times, grow) => {
		for (let k = 0; k < times; k++) {
			const hits = [];
			for (let y = 0; y < H; y++)
				for (let x = 0; x < W; x++) {
					const i = y * W + x;
					if (mask[i] === (grow ? 1 : 0)) continue;
					const n = (x > 0 && mask[i-1]) || (x < W-1 && mask[i+1]) || (y > 0 && mask[i-W]) || (y < H-1 && mask[i+W]);
					if (grow ? n : !((x > 0 ? mask[i-1] : 1) && (x < W-1 ? mask[i+1] : 1) && (y > 0 ? mask[i-W] : 1) && (y < H-1 ? mask[i+W] : 1))) hits.push(i);
				}
			for (const i of hits) mask[i] = grow ? 1 : 0;
		}
	};
	morph(fg, CLOSE, true);
	morph(fg, CLOSE, false);

	const reach = new Uint8Array(N); const q3 = [];
	for (let x = 0; x < W; x++) { q3.push(x); q3.push((H - 1) * W + x); }
	for (let y = 0; y < H; y++) { q3.push(y * W); q3.push(y * W + W - 1); }
	while (q3.length) {
		const c = q3.pop();
		if (reach[c] || fg[c]) continue;
		reach[c] = 1;
		const cx = c % W, cy = (c / W) | 0;
		for (const [nx, ny] of [[cx+1,cy],[cx-1,cy],[cx,cy+1],[cx,cy-1]]) {
			if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
			const ni = ny * W + nx;
			if (!reach[ni] && !fg[ni]) q3.push(ni);
		}
	}
	for (let i = 0; i < N; i++) if (!fg[i] && !reach[i]) fg[i] = 1;

	const alpha = new Float32Array(N);
	for (let y = 0; y < H; y++)
		for (let x = 0; x < W; x++) {
			let s0 = 0, c = 0;
			for (let dy = -FEATHER; dy <= FEATHER; dy++)
				for (let dx = -FEATHER; dx <= FEATHER; dx++) {
					const nx = x + dx, ny = y + dy;
					if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
					s0 += fg[ny * W + nx]; c++;
				}
			alpha[y * W + x] = s0 / c;
		}

	let bx0 = W, bx1 = -1, by0 = H, by1 = -1;
	for (let y = 0; y < H; y++)
		for (let x = 0; x < W; x++)
			if (alpha[y * W + x] > 0.02) {
				if (x < bx0) bx0 = x; if (x > bx1) bx1 = x;
				if (y < by0) by0 = y; if (y > by1) by1 = y;
			}
	const bw = bx1 - bx0 + 1, bh = by1 - by0 + 1, side = Math.max(bw, bh);
	const out = new PNG({ width: side, height: side });
	out.data.fill(0);
	const ox = Math.floor((side - bw) / 2), oy = Math.floor((side - bh) / 2);
	for (let y = 0; y < bh; y++)
		for (let x = 0; x < bw; x++) {
			const si = (by0 + y) * W + (bx0 + x);
			const di = ((oy + y) * side + (ox + x)) * 4;
			const a = Math.max(0, Math.min(1, (alpha[si] - 0.15) / 0.7));
			out.data[di] = src.data[si * 4];
			out.data[di + 1] = src.data[si * 4 + 1];
			out.data[di + 2] = src.data[si * 4 + 2];
			out.data[di + 3] = Math.round(a * 255);
		}
	return out;
};

{
	const own = supplied('grenade');
	if (own) {
		writeOut('grenade', sharpen(resize(readImage(own), CANVAS), 0.3));
		console.log('grenade.png <- supplied cut-out');
	} else if (supplied('h2')) {
		writeOut('grenade', resize(cutGrenade(readImage(supplied('h2'))), CANVAS));
		console.log('grenade.png <- cut out of the gen-2 h2 plate');
	} else {
		throw new Error('grenade needs either its own cut-out or h2 to cut from');
	}
}

// wx: the full-reel WILD panel. ExpandingWilds draws it at SYMBOL_SIZE x
// BOARD_SIZES.height — one reel, five cells — so the art has to be 1:5 or the
// whole panel is stretched to fit.
const WX_W = 256, WX_H = 1280, WX_ASPECT = WX_H / WX_W;

// Grow a panel to 1:5 by lengthening it, not by stretching it.
//
// The delivered art is 1:3.03. Rendered straight into the 1:5 slot everything in
// it would be pulled 65% taller — a visibly elongated character. Instead the
// extra height is inserted as *more panel*: a band of the artwork is repeated to
// push the bottom frame down, leaving the art above it at its true proportions
// and leaving clear space where the multiplier badge sits (91% down the reel).
//
// The band to draw from is found, not hardcoded: within the bottom sixth, the
// window of rows whose CENTRE is darkest. In this composition that is the gap
// between the WILD sub-panel's bottom frame and the outer frame — rows that are
// background plus the two side rails, so continuing them reads as the rails
// simply running longer. A band containing frame detail would smear into a bar.
//
// The fill is a linear blend from the band's first row to its last, NOT a repeat
// of the band. Repeating (even ping-ponged) turns the rails' highlights into a
// sawtooth of horizontal stripes, which is what the first attempt looked like.
// The rails are straight metal, so interpolating between two of their rows gives
// exactly what they should be: continuous, seamless at both joins.
const extendPanelToAspect = (src, aspect) => {
	const targetH = Math.round(src.width * aspect);
	if (targetH <= src.height) return src;
	const add = targetH - src.height;

	const lum = (x, y) => {
		const i = (src.width * y + x) * 4;
		return (src.data[i] + src.data[i + 1] + src.data[i + 2]) / 3;
	};
	const cx0 = Math.round(src.width * 0.25), cx1 = Math.round(src.width * 0.75);
	const rowLum = [];
	for (let y = 0; y < src.height; y++) {
		let s = 0;
		for (let x = cx0; x < cx1; x++) s += lum(x, y);
		rowLum.push(s / (cx1 - cx0));
	}

	// darkest window of MIN_BAND rows inside the bottom sixth, excluding the very
	// last rows so the outer bottom frame is never consumed
	const MIN_BAND = 16;
	const searchFrom = Math.round(src.height * (5 / 6));
	const searchTo = src.height - MIN_BAND - Math.round(src.height * 0.015);
	let best = { start: searchFrom, score: Infinity };
	for (let y = searchFrom; y <= searchTo; y++) {
		let s = 0;
		for (let k = 0; k < MIN_BAND; k++) s += rowLum[y + k];
		if (s < best.score) best = { start: y, score: s };
	}
	const bandStart = best.start;
	const bandLen = MIN_BAND;

	const out = new PNG({ width: src.width, height: targetH });
	const copyRow = (sy, dy) => {
		const s = sy * src.width * 4;
		const d = dy * out.width * 4;
		src.data.copy(out.data, d, s, s + src.width * 4);
	};

	for (let y = 0; y < bandStart; y++) copyRow(y, y);

	const fillRows = bandLen + add;
	const topRow = bandStart;
	const botRow = bandStart + bandLen - 1;
	for (let i = 0; i < fillRows; i++) {
		const t = fillRows === 1 ? 0 : i / (fillRows - 1);
		const dOff = (bandStart + i) * out.width * 4;
		const aOff = topRow * src.width * 4;
		const bOff = botRow * src.width * 4;
		for (let k = 0; k < src.width * 4; k++) {
			out.data[dOff + k] = Math.round(src.data[aOff + k] * (1 - t) + src.data[bOff + k] * t);
		}
	}

	for (let y = bandStart + bandLen; y < src.height; y++) copyRow(y, y + add);
	return out;
};

// Non-square, so it does not go through resize() — that one squares its output.
const resizeTo = (png, w, h) => {
	const out = new PNG({ width: w, height: h });
	const sx = png.width / w, sy = png.height / h;
	for (let y = 0; y < h; y++) {
		for (let x = 0; x < w; x++) {
			const fx = Math.min(png.width - 1, x * sx), fy = Math.min(png.height - 1, y * sy);
			const x0 = Math.floor(fx), y0 = Math.floor(fy);
			const x1 = Math.min(png.width - 1, x0 + 1), y1 = Math.min(png.height - 1, y0 + 1);
			const tx = fx - x0, ty = fy - y0;
			const d = (y * w + x) * 4;
			for (let c = 0; c < 4; c++) {
				const p = (px, py) => png.data[(py * png.width + px) * 4 + c];
				out.data[d + c] = Math.round(
					p(x0, y0) * (1 - tx) * (1 - ty) + p(x1, y0) * tx * (1 - ty) +
						p(x0, y1) * (1 - tx) * ty + p(x1, y1) * tx * ty,
				);
			}
		}
	}
	return out;
};

{
	const wxSrc = supplied('wx');
	if (wxSrc) {
		const src = readImage(wxSrc);
		const grown = extendPanelToAspect(src, WX_ASPECT);
		writeOut('wx', sharpen(resizeTo(grown, WX_W, WX_H), 0.3));
		console.log(
			`wx.png    <- supplied ${src.width}x${src.height} (1:${(src.height / src.width).toFixed(2)})` +
				` -> extended to ${grown.width}x${grown.height} (1:5) -> ${WX_W}x${WX_H}`,
		);
	} else {
		const letters = 'WILD'
			.split('')
			.map(
				(ch, i) =>
					`<text x="${WX_W / 2}" y="${268 + i * 222}" font-family="Impact, Haettenschweiler, sans-serif" font-size="180" font-weight="bold" text-anchor="middle" fill="#e8c23a" stroke="#4a3a08" stroke-width="9" paint-order="stroke">${ch}</text>`,
			)
			.join('');
		fs.writeFileSync(path.join(OUT_DIR, 'wx.png'), render(plate(letters, WX_W, WX_H), WX_W));
		console.log('wx.png    <- procedural (256x1280 full-reel panel)');
	}
}

console.log(`\nwrote ${REQUIRED.length + 1} files to ${path.relative(appRoot, OUT_DIR)}`);
if (missing.length) {
	console.log(`\n!! STILL ON GEN-1 ART: ${missing.join(', ')}`);
	console.log('   Do not ship. Add these to design/source/gen2_symbols/ — spec in design/GEN2_ART_SPEC.md');
}
