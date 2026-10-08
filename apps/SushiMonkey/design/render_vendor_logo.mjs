// Render the SILVERSTARS STUDIO vendor mark to PNG.
//
// The mark has never existed as a file: WildPartyLoader.svelte draws it live as
// an inline <svg> polygon plus two <div>s of text, styled with clamp() sizes.
// That is fine for the loader and useless for anything else — a store listing, a
// slide, a sequel's splash — so this re-authors the same geometry as a
// standalone SVG and rasterises it with resvg.
//
// Two things are deliberately copied rather than "improved":
//
//   * The polygon's ten points are the loader's verbatim. Its centre of mass is
//     at (50, 48) in the 100-unit box, not (50, 50) — the star sits slightly
//     high. Re-centring it would make this stop matching what ships.
//   * The face is Arial Bold. The loader asks for weight 900, and Arial has no
//     900, so a browser resolves it to Bold (700). Arial Black is a *different
//     family* and is not what renders on screen. See the note in
//     WildPartyLoader.svelte — this is the vendor's mark and must not drift.
//
// Sizes are the maxima of the loader's clamp() expressions, i.e. what a wide
// viewport shows: 240px star, 64px title.
//
// Usage:  node design/render_vendor_logo.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

// resvg and pngjs live in the shared image toolchain, not in this app.
const GEN = 'E:/stake/tools/gen/node_modules';
const { Resvg } = await import(pathToFileURL(`${GEN}/@resvg/resvg-js/index.js`).href);
const { PNG } = await import(pathToFileURL(`${GEN}/pngjs/lib/png.js`).href);

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(HERE, 'vendor_logo');
fs.mkdirSync(OUT, { recursive: true });

// --- layout (CSS px, matching the loader's clamp() maxima) -------------------
const STAR = 240; // .wp-star-wrap  width: clamp(140px, 20vw, 240px)
const GAP_STAR = 13.6; // .wp-loader-inner  gap: 0.85rem
const FS = 64; // .wp-title  font-size: clamp(2rem, 4.2vw, 4rem)
const GAP_LINE = 4; // .wp-title  gap: 0.25rem
const TRACK = FS * 0.12; // letter-spacing: 0.12em
const CAP = 0.716; // Arial cap height, em
const XH = 0.519; // Arial x-height, em

// Generous canvas; the transparent version is cropped to its own alpha bounds
// afterwards, so over-sizing here costs nothing and guarantees the glow and the
// widest line ("SILVERSTARS") are never clipped.
const W = 900;
const PAD_TOP = 40;

// line-height is 1, so each title line's box is exactly FS tall. Centre the caps
// in that box: baseline = boxTop + (FS + capHeight) / 2.
const baseline = (boxTop) => boxTop + (FS + CAP * FS) / 2;
const line1Top = PAD_TOP + STAR + GAP_STAR;
const line2Top = line1Top + FS + GAP_LINE;
const H = Math.ceil(line2Top + FS + PAD_TOP);

const starX = (W - STAR) / 2;

// dominant-baseline:middle aligns to half the x-height above the baseline, which
// is what the browser does with the "777" — not half the cap height. Resolved
// here rather than emitted as an attribute because resvg's support for the
// property is partial, and a silently ignored attribute would shift the digits.
const innerBaseline = 56 + (XH * 18) / 2;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <!-- filter: drop-shadow(0 0 10px rgba(255,255,255,.25)) -->
    <filter id="starGlow" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="0" dy="0" stdDeviation="5" flood-color="#ffffff" flood-opacity="0.25"/>
    </filter>
    <!-- text-shadow: 0 0 16px rgba(255,255,255,.28) -->
    <filter id="textGlow" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="0" dy="0" stdDeviation="8" flood-color="#ffffff" flood-opacity="0.28"/>
    </filter>
  </defs>

  <g filter="url(#starGlow)" transform="translate(${starX} ${PAD_TOP}) scale(${STAR / 100})">
    <polygon points="50,7 61,38 94,38 67,57 77,89 50,70 23,89 33,57 6,38 39,38"
             fill="none" stroke="#ffffff" stroke-width="5.5" stroke-linejoin="round"/>
    <text x="50" y="${innerBaseline}" text-anchor="middle"
          font-family="Arial" font-weight="bold" font-size="18" fill="#ffffff">777</text>
  </g>

  <g filter="url(#textGlow)" font-family="Arial" font-weight="bold" font-size="${FS}"
     letter-spacing="${TRACK}" fill="#ffffff" text-anchor="middle">
    <text x="${W / 2}" y="${baseline(line1Top)}">SILVERSTARS</text>
    <text x="${W / 2}" y="${baseline(line2Top)}">STUDIO</text>
  </g>
</svg>`;

fs.writeFileSync(path.join(OUT, 'silverstars_logo.svg'), svg);

const render = (zoom) => {
	const r = new Resvg(svg, {
		fitTo: { mode: 'zoom', value: zoom },
		font: { fontDirs: ['C:/Windows/Fonts'], defaultFontFamily: 'Arial', loadSystemFonts: true },
	});
	return PNG.sync.read(r.render().asPng());
};

// Tight crop to the drawn pixels. Measured from alpha only, so the glow decides
// the bounds rather than a guessed margin.
const bounds = (png) => {
	let x0 = png.width, y0 = png.height, x1 = -1, y1 = -1;
	for (let y = 0; y < png.height; y++) {
		for (let x = 0; x < png.width; x++) {
			if (png.data[(y * png.width + x) * 4 + 3] > 2) {
				if (x < x0) x0 = x;
				if (x > x1) x1 = x;
				if (y < y0) y0 = y;
				if (y > y1) y1 = y;
			}
		}
	}
	return { x0, y0, x1, y1 };
};

const crop = (png, m) => {
	const b = bounds(png);
	const x0 = Math.max(0, b.x0 - m);
	const y0 = Math.max(0, b.y0 - m);
	const w = Math.min(png.width, b.x1 + m + 1) - x0;
	const h = Math.min(png.height, b.y1 + m + 1) - y0;
	const out = new PNG({ width: w, height: h });
	PNG.bitblt(png, out, x0, y0, w, h, 0, 0);
	return out;
};

const onBlack = (png) => {
	const out = new PNG({ width: png.width, height: png.height });
	for (let i = 0; i < png.data.length; i += 4) {
		const a = png.data[i + 3] / 255;
		for (let c = 0; c < 3; c++) out.data[i + c] = Math.round(png.data[i + c] * a);
		out.data[i + 3] = 255;
	}
	return out;
};

const write = (name, png) => {
	fs.writeFileSync(path.join(OUT, name), PNG.sync.write(png));
	console.log(`  ${name.padEnd(34)} ${png.width}x${png.height}`);
};

for (const [zoom, tag] of [[1, '1x'], [2, '2x'], [4, '4x']]) {
	const cropped = crop(render(zoom), Math.round(24 * zoom));
	write(`silverstars_logo_${tag}.png`, cropped);
	if (tag === '2x') write('silverstars_logo_black_2x.png', onBlack(cropped));
}

console.log(`\n✔ done -> ${OUT}`);
