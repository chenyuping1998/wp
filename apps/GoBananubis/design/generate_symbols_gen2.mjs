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
const REQUIRED = ['h1', 'h2', 'h3', 'h4', 'l1', 'l2', 'l3', 'l4', 'l5', 'w', 's', 'm', 'p', 'x', 'w_fg', 'cudgel'];
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
// The mascot's thrown prop, and the object the transition flies at the board:
// the SCARAB, cut off its plate.
//
// It used to be the pineapple scarab cut out of the jungle h2. The scarab was
// the previous game's object in every sense — the character threw it, the
// transition detonated it, and the win runner rolled one along a payline — and
// none of that survives a jackal god in a temple. The scarab is this game's
// highest-paying symbol and the one object in the set that reads at a glance
// while spinning through the air.
//
// CUT BY COLOUR, not by edges. The old routine flooded in from the border over
// "frame-ish" pixels and needed a green-offset guard to stop it eating a notch
// out of the scarab, because the olive plate and the green scarab sat in the
// same hue. This art does not have that problem: the plate is basalt (r-b about
// 3 across the face) and the scarab is carnelian (r-b about 114), so a plain
// redness threshold separates them cleanly and there is nothing to guard.
//
// Three steps after the threshold, and each one is there for a specific hole:
//
//   · LARGEST ISLAND, which is what discards the four bronze corner studs. They
//     are warm and saturated enough to pass the threshold and always will be;
//     they are also four small blobs against one big one.
//   · FILL, because the beetle's incised seams and its dark contour are not red
//     and would otherwise punch holes straight through the body. Anything the
//     background flood cannot reach from outside is interior and belongs to it.
//   · GROW and FEATHER, so the cut edge is not a hard alias against whatever it
//     flies over.
const cutScarab = (src) => {
	const W = src.width, H = src.height, N = W * H;
	const RED = 60, GROW = 1, FEATHER = 2;

	const red = new Uint8Array(N);
	for (let i = 0; i < N; i++) {
		const r = src.data[i * 4], g = src.data[i * 4 + 1], b = src.data[i * 4 + 2];
		// red-dominant, and dominant over green too: a warm grey passes the first
		// test on its own
		if (r - b > RED && r - g > RED * 0.35) red[i] = 1;
	}

	// everything the outside can reach without crossing red — the rest is body
	const outside = new Uint8Array(N);
	const q = [];
	for (let x = 0; x < W; x++) { q.push(x); q.push((H - 1) * W + x); }
	for (let y = 0; y < H; y++) { q.push(y * W); q.push(y * W + W - 1); }
	while (q.length) {
		const i = q.pop();
		if (outside[i] || red[i]) continue;
		outside[i] = 1;
		const x = i % W, y = (i / W) | 0;
		if (x > 0) q.push(i - 1);
		if (x < W - 1) q.push(i + 1);
		if (y > 0) q.push(i - W);
		if (y < H - 1) q.push(i + W);
	}

	// largest connected island of body, which drops the corner studs
	const label = new Int32Array(N).fill(-1);
	let best = -1, bestSize = 0;
	for (let seed = 0; seed < N; seed++) {
		if (outside[seed] || label[seed] >= 0) continue;
		const stack = [seed];
		let size = 0;
		label[seed] = seed;
		while (stack.length) {
			const i = stack.pop();
			size++;
			const x = i % W, y = (i / W) | 0;
			for (const n of [x > 0 ? i - 1 : -1, x < W - 1 ? i + 1 : -1, y > 0 ? i - W : -1, y < H - 1 ? i + W : -1]) {
				if (n < 0 || outside[n] || label[n] >= 0) continue;
				label[n] = seed;
				stack.push(n);
			}
		}
		if (size > bestSize) { bestSize = size; best = seed; }
	}

	const keep = new Float32Array(N);
	for (let i = 0; i < N; i++) keep[i] = label[i] === best ? 1 : 0;

	for (let g = 0; g < GROW; g++) {
		const grown = Float32Array.from(keep);
		for (let y = 0; y < H; y++)
			for (let x = 0; x < W; x++) {
				const i = y * W + x;
				if (keep[i]) continue;
				if ((x > 0 && keep[i - 1]) || (x < W - 1 && keep[i + 1]) ||
					(y > 0 && keep[i - W]) || (y < H - 1 && keep[i + W])) grown[i] = 1;
			}
		keep.set(grown);
	}

	const soft = new Float32Array(N);
	const R = FEATHER;
	for (let y = 0; y < H; y++)
		for (let x = 0; x < W; x++) {
			let sum = 0, n = 0;
			for (let dy = -R; dy <= R; dy++)
				for (let dx = -R; dx <= R; dx++) {
					const yy = y + dy, xx = x + dx;
					if (yy < 0 || xx < 0 || yy >= H || xx >= W) continue;
					sum += keep[yy * W + xx];
					n++;
				}
			soft[y * W + x] = sum / n;
		}

	const out = new PNG({ width: W, height: H });
	for (let i = 0; i < N; i++) {
		out.data[i * 4] = src.data[i * 4];
		out.data[i * 4 + 1] = src.data[i * 4 + 1];
		out.data[i * 4 + 2] = src.data[i * 4 + 2];
		out.data[i * 4 + 3] = Math.round(255 * soft[i] * (src.data[i * 4 + 3] / 255));
	}
	return out;
};

{
	const own = supplied('scarab');
	if (own) {
		writeOut('scarab', sharpen(resize(readImage(own), CANVAS), 0.3));
		console.log('scarab.png <- supplied cut-out');
	} else if (supplied('h1')) {
		writeOut('scarab', resize(cutScarab(readImage(supplied('h1'))), CANVAS));
		console.log('scarab.png <- cut out of the h1 plate');
	} else {
		throw new Error('scarab needs either its own cut-out or h1 to cut from');
	}
}

// wx: the full-reel WILD panel. ExpandingWilds draws it at SYMBOL_SIZE x
// BOARD_SIZES.height — one reel, five cells — so the art has to be 1:5 or the
// whole panel is stretched to fit.
// ── the sealed tablet's two halves ─────────────────────────────────────────
//
// CUT FROM the m.png that was just written, not drawn separately, so the crack
// shows the same stone that was on the board a frame earlier. MysteryReveal
// draws the sealed tablet as its two halves resting in place and then lets them
// fall — if the halves came from anywhere but the face itself, the tablet would
// change appearance on the frame the break starts, which is the one frame the
// player is looking straight at it.
//
// Entries are [y, x] as fractions of the half-size. A straight split reads as
// the slab being slid apart rather than broken; the offsets are what make it
// stone. This profile used to live in src/game/tabletArt.ts, which drew the whole
// symbol as vector while there was no art for it.
const FRACTURE = [
	[-1, 0],
	[-0.64, 0.12],
	[-0.28, -0.08],
	[0.04, 0.14],
	[0.4, -0.06],
	[0.72, 0.1],
	[1, 0],
];

/** Both halves as full-tile transparent PNGs, so they share one centre. */
const cutShards = (face) => {
	const half = face.width / 2;
	// the fracture as an x for every row, linearly interpolated between profile
	// points — a per-row edge is all a vertical-ish break needs
	const edgeAt = (y) => {
		const t = (y - half) / half; // -1 .. 1
		let i = 0;
		while (i < FRACTURE.length - 2 && FRACTURE[i + 1][0] < t) i++;
		const [y0, x0] = FRACTURE[i];
		const [y1, x1] = FRACTURE[i + 1];
		const f = y1 === y0 ? 0 : (t - y0) / (y1 - y0);
		return half + (x0 + (x1 - x0) * f) * half;
	};
	const make = (side) => {
		const out = new PNG({ width: face.width, height: face.height });
		out.data.fill(0);
		for (let y = 0; y < face.height; y++) {
			const edge = edgeAt(y);
			for (let x = 0; x < face.width; x++) {
				// One pixel of feather across the break, so the halves do not show a
				// hairline of background between them while they are still resting.
				const d = side < 0 ? edge - x : x - edge;
				if (d <= -1) continue;
				const a = Math.min(1, d + 1);
				const i = (y * face.width + x) * 4;
				out.data[i] = face.data[i];
				out.data[i + 1] = face.data[i + 1];
				out.data[i + 2] = face.data[i + 2];
				out.data[i + 3] = Math.round(face.data[i + 3] * a);
			}
		}
		return out;
	};
	return { left: make(-1), right: make(1) };
};

if (supplied('m')) {
	const face = readImage(path.join(OUT_DIR, 'm.png'));
	const { left, right } = cutShards(face);
	writeOut('m_shard_l', left);
	writeOut('m_shard_r', right);
	console.log('m_shard_l/r.png  <- cut from m.png along the fracture');
}

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
