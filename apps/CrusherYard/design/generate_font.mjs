// Crusher Yard display faces — two industrial cuts of one skeleton, built from
// scratch as real TrueType files. No font library involved: glyphs are defined
// as centre-line strokes, expanded to outlines, and packed into the TTF tables
// directly.
//
//   node design/generate_font.mjs <dir with node_modules for @resvg/resvg-js>
//   node design/generate_font.mjs <dir> --stencil
//
// ── two faces, and why they are not interchangeable ──
//
//   Yard Plate    solid, heavy, squared. The INTERFACE face: bet bar readouts,
//                 win amounts, the pressure gauge label. Runs down to ~14px and
//                 has to carry money.
//   Yard Stencil  the same skeleton with bridges cut through the strokes, the
//                 way a stencil plate has to hold its counters. The TITLE face:
//                 loading screen (52px), press-to-continue (28px), free-game
//                 outro. Never used below 28px.
//
// That split is the whole design. A bridged numeral at bet-bar size either
// closes up into a solid stroke or reads as a broken glyph, and the one thing
// this font absolutely must render unambiguously is a balance. So the bridges
// live on the face that is only ever set large, and the face doing the work is
// plain.
//
// ── why straight strokes make this tractable ──
//
// Neither face has a curve in it, so every glyph is a set of straight segments.
// Each becomes one rectangular contour, and TrueType fills with the non-zero
// winding rule, so overlapping same-wound contours union for free — no path
// booleans, no quadratic control points. The whole `glyf` table is on-curve
// points. Bridging is then just splitting a segment in two, which costs nothing
// the unbridged version did not already cost.
//
// ── scope ──
//
// Latin caps, digits and the punctuation the UI actually uses. Lowercase maps to
// the same outlines, as display faces usually do. Everything else — CJK, Arabic,
// Devanagari from the 16 locales — is deliberately absent: browsers fall back
// PER CHARACTER, so putting this first in the stack styles the Latin text and
// lets every other script drop through to the faces behind it untouched.

import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Two faces come out of one skeleton. `--stencil` cuts bridges through the
// strokes and widens the metrics to pay for them; see bridgeSegments.
const argv = process.argv.slice(2);
const STENCIL = argv.includes('--stencil');
const resvgDir = argv.find((a) => !a.startsWith('--'));
const require = createRequire(path.join(resvgDir ?? 'E:/stake/tools/gen', 'noop.js'));

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = path.join(appRoot, 'static/fonts');
fs.mkdirSync(OUT_DIR, { recursive: true });

const FAMILY = STENCIL ? 'Yard Stencil' : 'Yard Plate';
const PS_NAME = STENCIL ? 'YardStencil-Regular' : 'YardPlate-Regular';
const OUT_TTF = path.join(OUT_DIR, STENCIL ? 'YardStencil.ttf' : 'YardPlate.ttf');

// ── metrics ─────────────────────────────────────────────────────────────────
const UPM = 1000;
const CAP = 720; // cap height
// Raised to clear stacked Vietnamese diacritics (circumflex plus a tone mark)
// without them falling outside the declared ascent.
const ASC = 980;
const DESC = -200;
// Stroke weight. The ceiling is set by the counters: at a 420-unit letter box a
// weight of 148 closes the middles of O, B and 8 outright — the overlapping
// stroke quads fill the gap they are supposed to leave. Both faces here run
// heavier than the 128 that box allowed, and pay for it with a WIDER box rather
// than by thinning: industrial plate lettering is heavy, and thinning it to fit
// a narrow slot is what makes a machine face read as a condensed decorative one.
//
// The stencil face is heavier still, because a bridge removes mass from the
// middle of every stroke it cuts. At the plate weight the bridged strokes look
// starved either side of the gap.
const SW = STENCIL ? 142 : 134; // stroke weight
// Both boxes are 440 wide — 20 more than the face this replaced — which is what
// buys the extra weight without closing the counters. The stencil box simply
// sits further right in a wider advance, so the extra letterspacing that stencil
// lettering needs comes from the advance rather than from squeezing the glyph.
const L = STENCIL ? 96 : 74;
const R = STENCIL ? 536 : 514;
const M = (L + R) / 2;
const C = CAP / 2;
const ADV = STENCIL ? 640 : 594; // default advance

// ── glyph definitions ───────────────────────────────────────────────────────
// Each entry is a list of [x1, y1, x2, y2] centre-line segments. Angular by
// construction: a circle is a hexagon, a bowl is a pair of straight facets.
const T = CAP;
const B = 0;
const q = (t) => L + (R - L) * t; // fraction across the letter box

const GLYPHS = {
	A: [[L, B, M, T], [R, B, M, T], [q(0.22), 250, q(0.78), 250]],
	B: [[L, B, L, T], [L, T, q(0.82), T - 90], [q(0.82), T - 90, L, C], [L, C, q(0.9), C - 100], [q(0.9), C - 100, L, B]],
	C: [[R, T - 90, q(0.35), T], [q(0.35), T, L, C + 110], [L, C + 110, L, C - 110], [L, C - 110, q(0.35), B], [q(0.35), B, R, B + 90]],
	D: [[L, B, L, T], [L, T, q(0.66), T], [q(0.66), T, R, C + 100], [R, C + 100, R, C - 100], [R, C - 100, q(0.66), B], [q(0.66), B, L, B]],
	E: [[L, B, L, T], [L, T, R, T], [L, C, q(0.78), C], [L, B, R, B]],
	F: [[L, B, L, T], [L, T, R, T], [L, C, q(0.78), C]],
	G: [[R, T - 90, q(0.35), T], [q(0.35), T, L, C + 110], [L, C + 110, L, C - 110], [L, C - 110, q(0.35), B], [q(0.35), B, R, B + 90], [R, B + 90, R, C - 40], [R, C - 40, q(0.58), C - 40]],
	H: [[L, B, L, T], [R, B, R, T], [L, C, R, C]],
	I: [[M, B, M, T]],
	J: [[q(0.78), T, q(0.78), C - 90], [q(0.78), C - 90, q(0.42), B], [q(0.42), B, L, B + 120]],
	K: [[L, B, L, T], [R, T, L, C], [L, C, R, B]],
	L: [[L, B, L, T], [L, B, R, B]],
	M: [[L, B, L, T], [R, B, R, T], [L, T, M, C - 40], [R, T, M, C - 40]],
	N: [[L, B, L, T], [R, B, R, T], [L, T, R, B]],
	O: [[q(0.35), T, q(0.65), T], [q(0.65), T, R, C + 130], [R, C + 130, R, C - 130], [R, C - 130, q(0.65), B], [q(0.65), B, q(0.35), B], [q(0.35), B, L, C - 130], [L, C - 130, L, C + 130], [L, C + 130, q(0.35), T]],
	P: [[L, B, L, T], [L, T, q(0.86), T - 100], [q(0.86), T - 100, L, C - 20]],
	Q: [[q(0.35), T, q(0.65), T], [q(0.65), T, R, C + 130], [R, C + 130, R, C - 130], [R, C - 130, q(0.65), B], [q(0.65), B, q(0.35), B], [q(0.35), B, L, C - 130], [L, C - 130, L, C + 130], [L, C + 130, q(0.35), T], [q(0.6), C - 60, R + 30, B - 110]],
	R: [[L, B, L, T], [L, T, q(0.86), T - 100], [q(0.86), T - 100, L, C - 20], [q(0.44), C - 20, R, B]],
	S: [[R, T - 80, q(0.3), T], [q(0.3), T, L, C + 90], [L, C + 90, R, C - 90], [R, C - 90, q(0.7), B], [q(0.7), B, L, B + 80]],
	T: [[L, T, R, T], [M, B, M, T]],
	U: [[L, T, L, C - 110], [L, C - 110, q(0.34), B], [q(0.34), B, q(0.66), B], [q(0.66), B, R, C - 110], [R, C - 110, R, T]],
	V: [[L, T, M, B], [R, T, M, B]],
	W: [[L, T, q(0.27), B], [q(0.27), B, M, C - 20], [M, C - 20, q(0.73), B], [q(0.73), B, R, T]],
	X: [[L, T, R, B], [R, T, L, B]],
	Y: [[L, T, M, C - 30], [R, T, M, C - 30], [M, C - 30, M, B]],
	Z: [[L, T, R, T], [R, T, L, B], [L, B, R, B]],

	0: [[q(0.35), T, q(0.65), T], [q(0.65), T, R, C + 130], [R, C + 130, R, C - 130], [R, C - 130, q(0.65), B], [q(0.65), B, q(0.35), B], [q(0.35), B, L, C - 130], [L, C - 130, L, C + 130], [L, C + 130, q(0.35), T], [q(0.32), C - 90, q(0.68), C + 90]],
	1: [[L + 30, T - 150, M, T], [M, T, M, B], [q(0.18), B, q(0.82), B]],
	2: [[L, T - 100, q(0.35), T], [q(0.35), T, R, T - 120], [R, T - 120, L, B], [L, B, R, B]],
	3: [[L, T - 90, q(0.35), T], [q(0.35), T, R, T - 130], [R, T - 130, q(0.45), C], [q(0.45), C, R, C - 130], [R, C - 130, q(0.35), B], [q(0.35), B, L, B + 90]],
	4: [[q(0.72), B, q(0.72), T], [q(0.72), T, L, 230], [L, 230, R, 230]],
	5: [[R, T, L, T], [L, T, L, C + 30], [L, C + 30, q(0.7), C + 30], [q(0.7), C + 30, R, C - 120], [R, C - 120, q(0.35), B], [q(0.35), B, L, B + 90]],
	6: [[R, T - 90, q(0.4), T], [q(0.4), T, L, C], [L, C, L, C - 120], [L, C - 120, q(0.4), B], [q(0.4), B, R, C - 120], [R, C - 120, q(0.4), C], [q(0.4), C, L, C]],
	7: [[L, T, R, T], [R, T, q(0.3), B]],
	8: [[q(0.35), T, q(0.65), T], [q(0.65), T, R, T - 130], [R, T - 130, q(0.6), C], [q(0.6), C, R, C - 130], [R, C - 130, q(0.65), B], [q(0.65), B, q(0.35), B], [q(0.35), B, L, C - 130], [L, C - 130, q(0.4), C], [q(0.4), C, L, T - 130], [L, T - 130, q(0.35), T]],
	9: [[L, B + 90, q(0.6), B], [q(0.6), B, R, C], [R, C, R, C + 120], [R, C + 120, q(0.6), T], [q(0.6), T, L, C + 120], [L, C + 120, q(0.6), C], [q(0.6), C, R, C]],
};

// ── diacritics ──────────────────────────────────────────────────────────────
//
// The 16 Stake locales are not all Latin, but six of them (fr pl pt tr vi fi)
// are MOSTLY Latin with a handful of accented characters. Those are the ones
// that matter here: a locale whose script is entirely absent falls back cleanly
// and renders in one consistent face, whereas a locale that is 95% covered
// renders two faces inside the same word. Vietnamese was the worst at 69.8%.
//
// Accents are drawn in the same straight-stroke idiom and composed onto the base
// letter, so a new accented character costs one table entry rather than a new
// drawing. Two bands: the first accent sits just above the cap, a stacked tone
// mark above that.
const A1 = 760; // first accent band, lower edge
const A2 = 880; // stacked tone mark, lower edge
const ACCENTS = {
	acute: [[M - 55, A1, M + 65, A1 + 110]],
	grave: [[M - 65, A1 + 110, M + 55, A1]],
	circumflex: [[M - 95, A1 + 10, M, A1 + 115], [M, A1 + 115, M + 95, A1 + 10]],
	breve: [[M - 95, A1 + 115, M - 40, A1 + 10], [M - 40, A1 + 10, M + 40, A1 + 10], [M + 40, A1 + 10, M + 95, A1 + 115]],
	tilde: [[M - 105, A1 + 30, M - 35, A1 + 110], [M - 35, A1 + 110, M + 35, A1 + 20], [M + 35, A1 + 20, M + 105, A1 + 100]],
	diaeresis: [[M - 85, A1 + 15, M - 85, A1 + 105], [M + 85, A1 + 15, M + 85, A1 + 105]],
	dotAbove: [[M, A1 + 15, M, A1 + 105]],
	hookAbove: [[M - 20, A1, M - 20, A1 + 100], [M - 20, A1 + 100, M + 70, A1 + 60]],
	// stacked tone marks, sitting above a circumflex or breve
	acuteHigh: [[M - 55, A2, M + 65, A2 + 100]],
	graveHigh: [[M - 65, A2 + 100, M + 55, A2]],
	tildeHigh: [[M - 105, A2 + 20, M - 35, A2 + 90], [M - 35, A2 + 90, M + 35, A2 + 10], [M + 35, A2 + 10, M + 105, A2 + 80]],
	hookHigh: [[M - 20, A2, M - 20, A2 + 90], [M - 20, A2 + 90, M + 70, A2 + 55]],
	// below the baseline
	dotBelow: [[M, -95, M, -185]],
	cedilla: [[M + 20, -40, M + 20, -110], [M + 20, -110, M - 60, -190]],
	ogonek: [[M + 110, -40, M + 110, -110], [M + 110, -110, M + 190, -190]],
	// struck through the letter body
	strokeL: [[L - 40, 190, L + 190, 330]],
	strokeD: [[L - 70, C, L + 150, C]],
	horn: [[R - 20, T - 30, R + 80, T + 60]],
};

// base letter + accent components. Every character here was found by
// design/check_font_coverage.mjs, which reads the real locale strings.
const COMPOSED = {
	'\u00c0': ['A', 'grave'],
	'\u00c1': ['A', 'acute'],
	'\u00c2': ['A', 'circumflex'],
	'\u00c3': ['A', 'tilde'],
	'\u00c4': ['A', 'diaeresis'],
	'\u00c7': ['C', 'cedilla'],
	'\u00c9': ['E', 'acute'],
	'\u00cd': ['I', 'acute'],
	'\u00d2': ['O', 'grave'],
	'\u00d3': ['O', 'acute'],
	'\u00d6': ['O', 'diaeresis'],
	'\u00d9': ['U', 'grave'],
	'\u00dc': ['U', 'diaeresis'],
	'\u0104': ['A', 'ogonek'],
	'\u0106': ['C', 'acute'],
	'\u0110': ['D', 'strokeD'],
	'\u0130': ['I', 'dotAbove'],
	'\u0141': ['L', 'strokeL'],
	'\u015a': ['S', 'acute'],
	'\u015e': ['S', 'cedilla'],
	'\u01af': ['U', 'horn'],
	'\u1ea0': ['A', 'dotBelow'],
	'\u1ea4': ['A', 'circumflex', 'acuteHigh'],
	'\u1eae': ['A', 'breve', 'acuteHigh'],
	'\u1ebe': ['E', 'circumflex', 'acuteHigh'],
	'\u1ec2': ['E', 'circumflex', 'hookHigh'],
	'\u1ec4': ['E', 'circumflex', 'tildeHigh'],
	'\u1ed4': ['O', 'circumflex', 'hookHigh'],
	'\u1ee2': ['O', 'horn', 'dotBelow'],
	'\u1ee4': ['U', 'dotBelow'],
	'\u1ef2': ['Y', 'grave'],
};

// Punctuation and symbols, each with its own advance.
const NARROW = 300;
const PUNCT = {
	'.': { adv: 280, s: [[140, B, 140, B + SW]] },
	',': { adv: 280, s: [[150, B + SW, 150, B], [150, B, 80, B - 130]] },
	':': { adv: 280, s: [[140, C - 150, 140, C - 150 + SW], [140, C + 110, 140, C + 110 + SW]] },
	';': { adv: 280, s: [[140, C + 110, 140, C + 110 + SW], [150, C - 90, 150, C - 150], [150, C - 150, 80, C - 260]] },
	"'": { adv: 240, s: [[120, T, 120, T - 190]] },
	'!': { adv: 280, s: [[140, T, 140, 210], [140, B, 140, B + SW]] },
	'?': { adv: 460, s: [[60, T - 110, 190, T], [190, T, 380, T - 120], [380, T - 120, 220, 300], [220, B, 220, B + SW]] },
	'-': { adv: 420, s: [[80, C, 340, C]] },
	'+': { adv: 520, s: [[90, C, 430, C], [260, C - 170, 260, C + 170]] },
	'/': { adv: 440, s: [[60, B - 60, 380, T + 60]] },
	'%': { adv: 700, s: [[80, T, 620, B], [110, T - 90, 250, T - 90], [110, T - 90, 110, T - 230], [250, T - 90, 250, T - 230], [110, T - 230, 250, T - 230], [450, 230, 590, 230], [450, 230, 450, 90], [590, 230, 590, 90], [450, 90, 590, 90]] },
	'(': { adv: 340, s: [[250, T + 40, 90, C + 120], [90, C + 120, 90, C - 120], [90, C - 120, 250, B - 40]] },
	')': { adv: 340, s: [[90, T + 40, 250, C + 120], [250, C + 120, 250, C - 120], [250, C - 120, 90, B - 40]] },
	$: { adv: ADV, s: [[R, T - 140, q(0.3), T - 60], [q(0.3), T - 60, L, C + 60], [L, C + 60, R, C - 60], [R, C - 60, q(0.7), B + 60], [q(0.7), B + 60, L, B + 140], [M, T + 70, M, B - 70]] },
	'*': { adv: 440, s: [[220, C - 160, 220, C + 160], [90, C - 90, 350, C + 90], [350, C - 90, 90, C + 90]] },
	'=': { adv: 520, s: [[90, C + 90, 430, C + 90], [90, C - 90, 430, C - 90]] },
	'#': { adv: 620, s: [[180, B, 240, T], [380, B, 440, T], [80, 230, 560, 230], [80, 470, 560, 470]] },
	// Separator used by the spin ledger header. Without it the string simply lost
	// the character to the fallback face mid-word.
	'·': { adv: 280, s: [[140, C - 50, 140, C + 50]] },
	// Typographic punctuation. Not required by any string today — the coverage
	// check confirms that — but localised copy reaches for curly quotes and
	// dashes routinely, and one missing character is all it takes to put a
	// second typeface inside a word.
	'\u2019': { adv: 240, s: [[120, T, 90, T - 190]] },
	'\u2018': { adv: 240, s: [[90, T, 120, T - 190]] },
	'\u201c': { adv: 380, s: [[90, T, 120, T - 190], [230, T, 260, T - 190]] },
	'\u201d': { adv: 380, s: [[120, T, 90, T - 190], [260, T, 230, T - 190]] },
	'\u2013': { adv: 500, s: [[80, C, 420, C]] },
	'\u2014': { adv: 640, s: [[60, C, 580, C]] },
	// Currency marks. The balance readout is whatever currency the player is in,
	// so leaving these to the fallback would put one Titan One glyph next to runic
	// digits on every non-dollar account.
	'£': { adv: ADV, s: [[R, T - 90, q(0.42), T], [q(0.42), T, q(0.28), C + 60], [q(0.28), C + 60, q(0.28), B], [L, B, R, B], [L, C + 40, q(0.72), C + 40]] },
	'€': { adv: ADV, s: [[R, T - 90, q(0.42), T], [q(0.42), T, q(0.2), C + 110], [q(0.2), C + 110, q(0.2), C - 110], [q(0.2), C - 110, q(0.42), B], [q(0.42), B, R, B + 90], [L, C + 70, q(0.78), C + 70], [L, C - 70, q(0.78), C - 70]] },
	'¥': { adv: ADV, s: [[L, T, M, C], [R, T, M, C], [M, C, M, B], [q(0.12), C - 60, q(0.88), C - 60], [q(0.12), C - 200, q(0.88), C - 200]] },
	'¢': { adv: ADV, s: [[q(0.9), T - 180, q(0.42), T - 90], [q(0.42), T - 90, q(0.22), C], [q(0.22), C, q(0.42), B + 90], [q(0.42), B + 90, q(0.9), B + 180], [M, T, M, B]] },
};

// ── stroke expansion ────────────────────────────────────────────────────────
/**
 * One segment becomes one rectangular contour. Ends are extended by half the
 * stroke weight so that meeting strokes fill their corner instead of leaving a
 * notch — with non-zero winding the overlap simply unions.
 */
const strokeToContour = ([x1, y1, x2, y2], weight = SW) => {
	const dx = x2 - x1;
	const dy = y2 - y1;
	const len = Math.hypot(dx, dy) || 1;
	const ux = dx / len;
	const uy = dy / len;
	const ext = weight * 0.5;
	const ax = x1 - ux * ext;
	const ay = y1 - uy * ext;
	const bx = x2 + ux * ext;
	const by = y2 + uy * ext;
	const px = (uy * weight) / 2;
	const py = (-ux * weight) / 2;

	const pts = [
		[ax + px, ay + py],
		[bx + px, by + py],
		[bx - px, by - py],
		[ax - px, ay - py],
	].map(([x, y]) => [Math.round(x), Math.round(y)]);

	// Force a consistent winding across every contour in the font: mixed winding
	// with the non-zero rule would punch holes where strokes overlap.
	const area = pts.reduce((sum, [x, y], i) => {
		const [nx, ny] = pts[(i + 1) % pts.length];
		return sum + (x * ny - nx * y);
	}, 0);
	return area < 0 ? pts.reverse() : pts;
};

// ── bridges (the stencil face only) ────────────────────────────────────────
/**
 * Cut the gaps a stencil plate needs to hold its counters together.
 *
 * Three things this gets right that a naive version does not:
 *
 * 1. THE GAP IS MEASURED ALONG THE STROKE, not as a horizontal band across the
 *    glyph. A band of fixed height cuts a length of band/sin(angle) out of a
 *    stroke, so the diagonals of A, V, W and X would end up with gaps half as
 *    wide again as the stems of E and H. The band only chooses WHERE; the cut
 *    length is constant.
 *
 * 2. THE CAPS ARE PAID FOR. strokeToContour extends every segment by SW/2 at
 *    each end, so cutting a geometric length G leaves a visible gap of G - SW.
 *    BRIDGE_GAP is therefore sized as SW plus the gap actually wanted.
 *
 * 3. THE BANDS AVOID THE CROSSBARS. Everything structural in this skeleton sits
 *    between 230 and 360 — A's bar at 250, the 4's at 230, and the waist of B,
 *    E, F and H at 360. A bridge cut through that zone severs the bar from the
 *    stem it hangs off and leaves it floating in mid-air. 0.78 and 0.22 of the
 *    cap are clear of all of it.
 *
 * Glyphs in BRIDGE_SOLID are exempt. They are the ones whose only vertical is a
 * lone stem with nothing else touching it, so every piece a bridge produces
 * floats free and the letter reads as broken rather than as stencilled. Real
 * stencil faces leave these solid for the same reason.
 */
/**
 * Glyphs that stay solid, and why a geometric rule cannot decide this.
 *
 * Whether a bridge reads depends on the glyph's TOPOLOGY, not its measurements:
 *
 *   · a stem with bars hanging off it (E F H L P R T) survives being cut. Each
 *     piece keeps a bar, the pieces stay in line, and the eye completes it —
 *     which is exactly what a stencil bridge is supposed to do.
 *   · a closed loop (O Q 0) survives too. Cut it anywhere and it is still a
 *     ring; there is another way round.
 *   · an OPEN CHAIN of short facets does not. S, C, G, J and most of the digits
 *     are built that way, and a cut anywhere on the chain does not leave a
 *     stroke with a gap in it — it detaches a whole arm, which then floats with
 *     nothing near it. The first cut of this face put a bridge through the
 *     middle of S and it read as two unrelated marks.
 *
 * Connectivity does not separate these cases either: E is a tree, so cutting
 * its stem disconnects the glyph, and E is precisely the case that works.
 * Real stencil faces are decided glyph by glyph for the same reason.
 */
const BRIDGE_SOLID = new Set(['C', 'G', 'J', 'S', '2', '3', '5', '6', '8', '9']);

const BRIDGE_BANDS = [CAP * 0.7, CAP * 0.3];
const BRIDGE_GAP = SW + 80; // geometric; the caps eat SW, so ~80 units show
/** A junction this close to the gap counts as inside it. */
const BRIDGE_JUNCTION_MARGIN = 12;

/**
 * Points where two or more segments meet. A cut that swallows one of these
 * detaches whatever hangs off it — the crossbar of A, the waist of E — and
 * leaves it floating in mid-air with nothing to attach to.
 *
 * This replaced a "each surviving piece must be longer than its own end cap"
 * test, which was both too strict and aimed at the wrong thing. Too strict
 * because on a full-height stem it rejected BOTH bands outright (the far piece
 * is 0.3 of the length, and half the gap eats most of it), so the first cut of
 * this face had almost no visible bridges at all. Aimed at the wrong thing
 * because a short stub is harmless: neighbouring segments overlap it and the
 * union covers it. What is NOT harmless is severing an anchor.
 */
const junctionsOf = (segments) => {
	const uses = new Map();
	const key = (x, y) => `${Math.round(x)},${Math.round(y)}`;
	for (const [x1, y1, x2, y2] of segments) {
		for (const k of [key(x1, y1), key(x2, y2)]) uses.set(k, (uses.get(k) ?? 0) + 1);
	}
	return [...uses.entries()]
		.filter(([, n]) => n > 1)
		.map(([k]) => k.split(',').map(Number));
};

const cutAtBand = (segments, band, junctions) => {
	const out = [];
	for (const seg of segments) {
		const [x1, y1, x2, y2] = seg;
		const dx = x2 - x1;
		const dy = y2 - y1;
		const len = Math.hypot(dx, dy);
		// A horizontal stroke cannot be meaningfully cut by a horizontal band, and
		// trying divides by dy. Crossbars stay whole.
		if (Math.abs(dy) <= Math.abs(dx) || len === 0) {
			out.push(seg);
			continue;
		}
		const tc = (band - y1) / dy;
		const half = BRIDGE_GAP / 2 / len;
		// Clamped rather than rejected when the gap runs past an end — but ONLY
		// past an end that another segment continues through.
		//
		// Clamping at a junction is free: the neighbour's own stroke covers the
		// stub, which is the only reason the bowls of O and 0 can be bridged at
		// all, their facets being shorter than one gap. Clamping at a FREE
		// terminal is not free — there is nothing there to cover it, so the cut
		// stops being a bridge and becomes "this stroke is now shorter". That is
		// what chewed S, G and J into fragments on the first pass: their skeletons
		// are chains of short facets whose outer ends are free terminals.
		const isJunction = (x, y) =>
			junctions.some(([jx, jy]) => Math.hypot(jx - x, jy - y) <= BRIDGE_JUNCTION_MARGIN);
		let t0 = tc - half;
		let t1 = tc + half;
		if (t0 < 0) {
			if (!isJunction(x1, y1)) {
				out.push(seg);
				continue;
			}
			t0 = 0;
		}
		if (t1 > 1) {
			if (!isJunction(x2, y2)) {
				out.push(seg);
				continue;
			}
			t1 = 1;
		}
		if (!(t1 > t0) || (t0 === 0 && t1 === 1)) {
			out.push(seg);
			continue;
		}
		const at = (t) => [x1 + dx * t, y1 + dy * t];
		const [ax, ay] = at(t0);
		const [bx, by] = at(t1);

		const swallowsJunction = junctions.some(([jx, jy]) => {
			const along = ((jx - x1) * dx + (jy - y1) * dy) / (len * len);
			if (along <= t0 || along >= t1) return false;
			const [px, py] = at(along);
			return Math.hypot(jx - px, jy - py) <= BRIDGE_JUNCTION_MARGIN;
		});
		if (swallowsJunction) {
			out.push(seg);
			continue;
		}

		if (t0 > 0) out.push([x1, y1, ax, ay]);
		if (t1 < 1) out.push([bx, by, x2, y2]);
	}
	return out;
};

const bridgeSegments = (segments, allow) => {
	if (!STENCIL || !allow) return segments;
	const junctions = junctionsOf(segments);
	let out = segments;
	for (const band of BRIDGE_BANDS) out = cutAtBand(out, band, junctions);
	return out;
};

// ── glyph set ───────────────────────────────────────────────────────────────
const glyphs = [{ name: '.notdef', adv: ADV, contours: [], codes: [] }];
// `bridge: false` for punctuation. A comma or a decimal point is shorter than
// one bridge gap, so BRIDGE_MIN_KEEP would reject the cut anyway — but saying so
// explicitly is what stops a future larger mark from being quietly severed. The
// one mark that MUST never be bridged is the decimal point, because a broken
// separator in a currency amount is not a style choice.
const addGlyph = (name, adv, segments, codes, { bridge = true } = {}) => {
	const contours = bridgeSegments(segments, bridge && !BRIDGE_SOLID.has(name)).map(
		(segment) => strokeToContour(segment),
	);
	glyphs.push({ name, adv, contours, codes });
};

// Word space follows the advance, so both faces space words the same way
// relative to their own letters.
addGlyph('space', STENCIL ? 340 : 316, [], [0x20]);

for (const [ch, segments] of Object.entries(GLYPHS)) {
	const codes = [ch.charCodeAt(0)];
	// Lowercase reuses the capital, as display faces normally do.
	if (ch >= 'A' && ch <= 'Z') codes.push(ch.toLowerCase().charCodeAt(0));
	addGlyph(ch, ADV, segments, codes);
}
for (const [ch, parts] of Object.entries(COMPOSED)) {
	const [base, ...marks] = parts;
	const segments = [...GLYPHS[base], ...marks.flatMap((mark) => ACCENTS[mark])];
	// Lowercase maps to the same outline, as with the unaccented letters — but
	// only when the lowercase is a SINGLE code point.
	//
	// Turkish İ (U+0130) lowercases to "i" + COMBINING DOT ABOVE, two code points,
	// and taking codePointAt(0) of that yields U+0069 — which the plain I glyph
	// already claims. Two glyphs mapping one codepoint produces a duplicate cmap
	// segment, and a format 4 cmap requires strictly increasing endCodes, so the
	// browser's sanitiser rejected the entire file. resvg's parser did not care,
	// which is why the specimen looked perfect while nothing rendered in game.
	const lower = ch.toLowerCase();
	const codes = [ch.codePointAt(0)];
	if (lower !== ch && [...lower].length === 1) codes.push(lower.codePointAt(0));
	// Accented glyphs are registered under a `uXXXX` name, so BRIDGE_SOLID's
	// lookup by glyph name cannot see them. The base letter's decision has to be
	// forwarded explicitly, or Ç and Ś would be bridged while C and S are not.
	addGlyph(`u${ch.codePointAt(0).toString(16)}`, ADV, segments, codes, {
		bridge: !BRIDGE_SOLID.has(base),
	});
}

for (const [ch, def] of Object.entries(PUNCT)) {
	addGlyph(`u${ch.charCodeAt(0)}`, def.adv ?? NARROW, def.s, [ch.charCodeAt(0)], {
		bridge: false,
	});
}
// × as a separate codepoint, drawn like the multiplication sign players expect
addGlyph('multiply', 460, [[90, C - 150, 370, C + 150], [370, C - 150, 90, C + 150]], [0x00d7], {
	bridge: false,
});

// A duplicate codepoint is not a warning: cmap format 4 segments must have
// strictly increasing endCodes, so two glyphs claiming one code silently
// produces a file every browser refuses to load. Fail here instead.
{
	const seen = new Map();
	for (const glyph of glyphs) {
		for (const code of glyph.codes ?? []) {
			if (seen.has(code)) {
				throw new Error(
					`duplicate codepoint U+${code.toString(16).toUpperCase()} claimed by ` +
						`${seen.get(code)} and ${glyph.name}`,
				);
			}
			seen.set(code, glyph.name);
		}
	}
}

// ── binary writers ──────────────────────────────────────────────────────────
class Writer {
	constructor() {
		this.parts = [];
		this.length = 0;
	}
	push(buf) {
		this.parts.push(buf);
		this.length += buf.length;
		return this;
	}
	u8(v) { const b = Buffer.alloc(1); b.writeUInt8(v & 0xff); return this.push(b); }
	u16(v) { const b = Buffer.alloc(2); b.writeUInt16BE(v & 0xffff); return this.push(b); }
	i16(v) { const b = Buffer.alloc(2); b.writeInt16BE(Math.max(-32768, Math.min(32767, v))); return this.push(b); }
	u32(v) { const b = Buffer.alloc(4); b.writeUInt32BE(v >>> 0); return this.push(b); }
	buf() { return Buffer.concat(this.parts, this.length); }
}

const pad4 = (buf) => {
	const rem = buf.length % 4;
	return rem === 0 ? buf : Buffer.concat([buf, Buffer.alloc(4 - rem)]);
};

const checksum = (buf) => {
	const padded = pad4(buf);
	let sum = 0;
	for (let i = 0; i < padded.length; i += 4) sum = (sum + padded.readUInt32BE(i)) >>> 0;
	return sum >>> 0;
};

// ── glyf / loca ─────────────────────────────────────────────────────────────
const bounds = { xMin: 0, yMin: 0, xMax: 0, yMax: 0 };
const glyfParts = [];
const locaOffsets = [0];
let maxPoints = 0;
let maxContours = 0;

for (const glyph of glyphs) {
	if (glyph.contours.length === 0) {
		glyphMetrics(glyph, null);
		glyfParts.push(Buffer.alloc(0));
		locaOffsets.push(locaOffsets[locaOffsets.length - 1]);
		continue;
	}

	const all = glyph.contours.flat();
	const xs = all.map((p) => p[0]);
	const ys = all.map((p) => p[1]);
	const gb = {
		xMin: Math.min(...xs),
		yMin: Math.min(...ys),
		xMax: Math.max(...xs),
		yMax: Math.max(...ys),
	};
	glyphMetrics(glyph, gb);

	const w = new Writer();
	w.i16(glyph.contours.length);
	w.i16(gb.xMin).i16(gb.yMin).i16(gb.xMax).i16(gb.yMax);

	let acc = -1;
	for (const contour of glyph.contours) {
		acc += contour.length;
		w.u16(acc);
	}
	maxContours = Math.max(maxContours, glyph.contours.length);
	maxPoints = Math.max(maxPoints, acc + 1);

	w.u16(0); // instructionLength

	// Every point is on-curve: straight strokes need no control points.
	for (let i = 0; i <= acc; i += 1) w.u8(0x01);

	let prevX = 0;
	for (const contour of glyph.contours) {
		for (const [x] of contour) {
			w.i16(x - prevX);
			prevX = x;
		}
	}
	let prevY = 0;
	for (const contour of glyph.contours) {
		for (const [, y] of contour) {
			w.i16(y - prevY);
			prevY = y;
		}
	}

	const buf = pad4(w.buf());
	glyfParts.push(buf);
	locaOffsets.push(locaOffsets[locaOffsets.length - 1] + buf.length);
}

function glyphMetrics(glyph, gb) {
	glyph.lsb = gb ? gb.xMin : 0;
	glyph.bbox = gb;
	if (!gb) return;
	bounds.xMin = Math.min(bounds.xMin, gb.xMin);
	bounds.yMin = Math.min(bounds.yMin, gb.yMin);
	bounds.xMax = Math.max(bounds.xMax, gb.xMax);
	bounds.yMax = Math.max(bounds.yMax, gb.yMax);
}

const glyfTable = Buffer.concat(glyfParts);
const locaWriter = new Writer();
for (const offset of locaOffsets) locaWriter.u32(offset);
const locaTable = locaWriter.buf();

// ── cmap (format 4) ─────────────────────────────────────────────────────────
const mapping = [];
glyphs.forEach((glyph, id) => {
	for (const code of glyph.codes ?? []) mapping.push([code, id]);
});
mapping.sort((a, b) => a[0] - b[0]);

const segments = [];
for (const [code, id] of mapping) {
	const last = segments[segments.length - 1];
	if (last && code === last.end + 1 && id === last.startGlyph + (code - last.start)) {
		last.end = code;
	} else {
		segments.push({ start: code, end: code, startGlyph: id });
	}
}
segments.push({ start: 0xffff, end: 0xffff, startGlyph: 0 });

const segCount = segments.length;
const sub = new Writer();
sub.u16(4);
sub.u16(16 + segCount * 8);
sub.u16(0);
sub.u16(segCount * 2);
const searchRange = 2 * Math.pow(2, Math.floor(Math.log2(segCount)));
sub.u16(searchRange);
sub.u16(Math.log2(searchRange / 2));
sub.u16(segCount * 2 - searchRange);
for (const s of segments) sub.u16(s.end);
sub.u16(0);
for (const s of segments) sub.u16(s.start);
for (const s of segments) {
	// idDelta is modular 16-bit arithmetic, so it must be written as a RAW u16.
	// Masking to unsigned and then writing through the signed helper clamped every
	// negative delta to 32767, which mapped almost the whole alphabet to .notdef —
	// the font parsed cleanly and simply drew nothing.
	sub.u16(s.start === 0xffff ? 1 : (s.startGlyph - s.start) & 0xffff);
}
for (let i = 0; i < segCount; i += 1) sub.u16(0);
const cmapSub = sub.buf();

const cmapWriter = new Writer();
cmapWriter.u16(0).u16(1);
cmapWriter.u16(3).u16(1).u32(12);
cmapWriter.push(cmapSub);
const cmapTable = cmapWriter.buf();

// ── remaining tables ────────────────────────────────────────────────────────
const advances = glyphs.map((g) => g.adv);
const maxAdv = Math.max(...advances);

const hmtxWriter = new Writer();
for (const glyph of glyphs) hmtxWriter.u16(glyph.adv).i16(glyph.lsb ?? 0);
const hmtxTable = hmtxWriter.buf();

const headWriter = new Writer();
headWriter.u32(0x00010000).u32(0x00010000).u32(0).u32(0x5f0f3cf5);
headWriter.u16(0x0003).u16(UPM);
headWriter.u32(0).u32(0).u32(0).u32(0); // created / modified
headWriter.i16(bounds.xMin).i16(bounds.yMin).i16(bounds.xMax).i16(bounds.yMax);
headWriter.u16(0).u16(8).i16(2).i16(1).i16(0);
const headTable = headWriter.buf();

const hheaWriter = new Writer();
hheaWriter.u32(0x00010000);
hheaWriter.i16(ASC).i16(DESC).i16(90);
hheaWriter.u16(maxAdv).i16(bounds.xMin).i16(0).i16(bounds.xMax);
hheaWriter.i16(1).i16(0).i16(0);
hheaWriter.i16(0).i16(0).i16(0).i16(0);
hheaWriter.i16(0).u16(glyphs.length);
const hheaTable = hheaWriter.buf();

const maxpWriter = new Writer();
maxpWriter.u32(0x00010000).u16(glyphs.length);
maxpWriter.u16(maxPoints).u16(maxContours).u16(0).u16(0).u16(2);
maxpWriter.u16(0).u16(0).u16(0).u16(0).u16(0).u16(0).u16(0).u16(0);
const maxpTable = maxpWriter.buf();

const os2Writer = new Writer();
os2Writer.u16(4);
os2Writer.i16(Math.round(ADV * 0.9));
os2Writer.u16(700).u16(5).i16(0);
os2Writer.i16(700).i16(-200).i16(200).i16(500).i16(-300).i16(400).i16(0).i16(0).i16(0).i16(0);
// sFamilyClass, then panose[10].
//
// sFamilyClass was missing. Every field after it was therefore written two bytes
// early and the table came out 94 bytes long — but version 4 is defined as 96,
// and a browser's font sanitiser rejects the whole file on that mismatch alone.
// Which it did: `document.fonts` reported a load error for the face and every Text in
// the game silently rendered in the fallback, so the carved face has never once
// been on screen. resvg's parser is lenient and drew the specimen happily, which
// is why the generator looked correct for so long — a specimen proves the glyphs,
// not the file.
os2Writer.i16(0);
os2Writer.i16(0).i16(0).i16(0).i16(0).i16(0);
os2Writer.u32(0x00000003).u32(0).u32(0).u32(0); // unicode ranges: latin
os2Writer.push(Buffer.from('EMFG', 'ascii'));
os2Writer.u16(0x0040); // regular
os2Writer.u16(0x20).u16(0xd7);
os2Writer.i16(ASC).i16(DESC).i16(90);
os2Writer.u16(ASC).u16(-DESC);
os2Writer.u32(0).u32(0);
os2Writer.i16(520).i16(CAP);
os2Writer.u16(0).u16(0).u16(0);
const os2Table = os2Writer.buf();

const postWriter = new Writer();
postWriter.u32(0x00030000).u32(0).i16(0).i16(0).u32(0);
postWriter.u32(0).u32(0).u32(0).u32(0);
const postTable = postWriter.buf();

const NAMES = [
	[1, FAMILY],
	[2, 'Regular'],
	[3, `${FAMILY} Regular`],
	[4, `${FAMILY} Regular`],
	[5, 'Version 1.000'],
	[6, PS_NAME],
];
const nameRecords = [];
const nameStrings = [];
let stringOffset = 0;
for (const [id, value] of NAMES) {
	const buf = Buffer.from(value, 'utf16le').swap16();
	nameRecords.push({ id, length: buf.length, offset: stringOffset });
	nameStrings.push(buf);
	stringOffset += buf.length;
}
const nameWriter = new Writer();
nameWriter.u16(0).u16(nameRecords.length).u16(6 + nameRecords.length * 12);
for (const record of nameRecords) {
	nameWriter.u16(3).u16(1).u16(0x0409).u16(record.id).u16(record.length).u16(record.offset);
}
for (const buf of nameStrings) nameWriter.push(buf);
const nameTable = nameWriter.buf();

// ── assemble ────────────────────────────────────────────────────────────────
const tables = [
	['OS/2', os2Table],
	['cmap', cmapTable],
	['glyf', glyfTable],
	['head', headTable],
	['hhea', hheaTable],
	['hmtx', hmtxTable],
	['loca', locaTable],
	['maxp', maxpTable],
	['name', nameTable],
	['post', postTable],
].sort((a, b) => (a[0] < b[0] ? -1 : 1));

const numTables = tables.length;
const searchRangeT = 16 * Math.pow(2, Math.floor(Math.log2(numTables)));
const header = new Writer();
header.u32(0x00010000).u16(numTables).u16(searchRangeT);
header.u16(Math.log2(searchRangeT / 16)).u16(numTables * 16 - searchRangeT);

let offset = 12 + numTables * 16;
const directory = new Writer();
const bodies = [];
for (const [tag, buf] of tables) {
	const padded = pad4(buf);
	directory.push(Buffer.from(tag, 'ascii'));
	directory.u32(checksum(buf));
	directory.u32(offset);
	directory.u32(buf.length);
	bodies.push(padded);
	offset += padded.length;
}

let font = Buffer.concat([header.buf(), directory.buf(), ...bodies]);

// head.checkSumAdjustment, which can only be computed once the whole file exists
const headEntryIndex = tables.findIndex(([tag]) => tag === 'head');
let headOffset = 12 + numTables * 16;
for (let i = 0; i < headEntryIndex; i += 1) headOffset += pad4(tables[i][1]).length;
const adjustment = (0xb1b0afba - checksum(font)) >>> 0;
font.writeUInt32BE(adjustment, headOffset + 8);

fs.writeFileSync(OUT_TTF, font);
console.log(
	`wrote ${path.relative(appRoot, OUT_TTF)}  ${(font.length / 1024).toFixed(1)} KB  ` +
		`${glyphs.length} glyphs, ${mapping.length} codepoints`,
);

// ── validate ────────────────────────────────────────────────────────────────
// resvg parses with ttf-parser and simply draws nothing if the file is
// malformed, so a specimen that renders is proof the tables are correct. This is
// the only browser-free check available, and a font that silently fails to load
// is otherwise indistinguishable from one that loaded and looks the same as the
// fallback.
if (resvgDir) {
	const { Resvg } = require('@resvg/resvg-js');
	// Sizes, not just glyphs. The whole reason there are two faces is that one of
	// them has to survive bet-bar size, so the specimen sets the same strings at
	// 58, 28 and 15px — 15 being roughly where the gauge label and the bar
	// readouts actually land. A specimen set only at display size cannot show the
	// failure this split exists to prevent.
	const rows = [
		{ size: 58, text: 'CRUSHER YARD' },
		{ size: 58, text: 'BALANCE WIN BET' },
		{ size: 58, text: 'ABCDEFGHIJKLM' },
		{ size: 58, text: 'NOPQRSTUVWXYZ' },
		{ size: 58, text: '0123456789' },
		{ size: 28, text: 'PRESS ANYWHERE TO CONTINUE' },
		{ size: 28, text: '$1,234.56   15,000\u00d7   PRESI\u00d3N PRESS\u00c3O' },
		{ size: 15, text: 'BALANCE $1,234.56    BET $2.00    WIN $18,402.75    PRESSURE x13' },
		{ size: 15, text: 'FREE SPINS 7 / 15    TOTAL $1,000.00    0123456789' },
	];
	const W = 1100;
	const svg = (() => {
		let y = 34;
		const body = rows
			.map((row) => {
				y += row.size * 1.5;
				const escaped = row.text.replace(/&/g, '&amp;').replace(/</g, '&lt;');
				return `<text x="40" y="${y}" font-family="${FAMILY}" font-size="${row.size}" fill="#ffd9a0">${escaped}</text>`;
			})
			.join('');
		return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${y + 40}">
		<rect width="100%" height="100%" fill="#14181d"/>
		<text x="40" y="24" font-family="monospace" font-size="14" fill="#5b656d">${FAMILY}</text>
		${body}
	</svg>`;
	})();
	const png = new Resvg(svg, {
		font: { fontFiles: [OUT_TTF], loadSystemFonts: false, defaultFontFamily: FAMILY },
		fitTo: { mode: 'width', value: W },
	})
		.render()
		.asPng();
	const specimen = path.join(
		appRoot,
		STENCIL ? 'design/font_specimen_stencil.png' : 'design/font_specimen.png',
	);
	fs.writeFileSync(specimen, png);
	console.log(`specimen: ${path.relative(appRoot, specimen)}`);
	console.log('  (glyphs visible in the specimen = the TTF parses under ttf-parser)');
}
