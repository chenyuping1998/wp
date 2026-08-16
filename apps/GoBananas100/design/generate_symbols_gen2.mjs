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
const supplied = (name) => path.join(SRC_DIR, `${name}.png`);

for (const name of REQUIRED) {
	if (fs.existsSync(supplied(name))) {
		const src = PNG.sync.read(fs.readFileSync(supplied(name)));
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
	if (name === 'w_fg' && fs.existsSync(supplied('w'))) {
		const src = PNG.sync.read(fs.readFileSync(supplied('w')));
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

// wx: the full-reel WILD panel, one plate stretched over five cells.
{
	const W = 256, H = 1280;
	const letters = 'WILD'
		.split('')
		.map(
			(ch, i) =>
				`<text x="${W / 2}" y="${268 + i * 222}" font-family="Impact, Haettenschweiler, sans-serif" font-size="180" font-weight="bold" text-anchor="middle" fill="#e8c23a" stroke="#4a3a08" stroke-width="9" paint-order="stroke">${ch}</text>`,
		)
		.join('');
	fs.writeFileSync(
		path.join(OUT_DIR, 'wx.png'),
		render(plate(letters, W, H), W),
	);
	console.log('wx.png    <- procedural (256x1280 full-reel panel)');
}

console.log(`\nwrote ${REQUIRED.length + 1} files to ${path.relative(appRoot, OUT_DIR)}`);
if (missing.length) {
	console.log(`\n!! STILL ON GEN-1 ART: ${missing.join(', ')}`);
	console.log('   Do not ship. Add these to design/source/gen2_symbols/ — spec in design/GEN2_ART_SPEC.md');
}
