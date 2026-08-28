// Win animation for a symbol, baked to a sprite sheet.
//
// PROOF OF CONCEPT — currently W (LEVERAGE) only.
//
// The problem this answers: every one of the eleven symbols currently wins with
// the same green ring (components/SymbolWinAnim.svelte). LEVERAGE is the symbol
// the whole feature is built around and it gets the same two-circle treatment as
// a low card.
//
// Spine is not an option here: the supplied symbol art is a single flat raster
// with no parts and no rig. What IS an option is baking the animation offline —
// the same resvg pipeline every other asset in this game already uses — and
// playing the frames back in pixi. To a player that is indistinguishable from a
// skeletal animation; the difference is only in how it was authored.
//
// The supplied artwork is NEVER redrawn or recoloured. It is placed as-is and
// only ever transformed (scale) or lit through its own alpha (the sweep and the
// flash both mask to the art rather than painting over it).
//
// Usage: node design/generate_symbol_anim.mjs <dir with node_modules/@resvg/resvg-js> [symbol]
//   e.g. node design/generate_symbol_anim.mjs E:/stake/tools/gen w
import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const resvgDir = process.argv[2];
if (!resvgDir) {
	console.error('usage: node design/generate_symbol_anim.mjs <dir with node_modules/@resvg/resvg-js> [symbol]');
	process.exit(1);
}
const symbol = (process.argv[3] || 'w').toLowerCase();
const require = createRequire(path.join(resvgDir, 'noop.js'));
const { Resvg } = require('@resvg/resvg-js');

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(appRoot, `static/assets/sprites/marginCallSymbols/${symbol}.png`);
const OUT_DIR = path.join(appRoot, 'design/preview');
const FRAME_DIR = path.join(OUT_DIR, `anim_${symbol}`);
fs.mkdirSync(FRAME_DIR, { recursive: true });

const BULL = '#4bd67f';
const PALE = '#eafff2';
const AMBER = '#f7a83a';

// The cell the game draws a symbol into is 104px. Frames are authored at 3x that
// so the ring and the sparks have room to leave the cell without being clipped,
// and so the sheet still holds up on a high-DPI canvas.
const CELL = 312;
const ART = 176; // the symbol itself at rest, inside the cell
const FRAMES = 30;
const COLS = 6;

const art = fs.readFileSync(SRC).toString('base64');
const artUri = `data:image/png;base64,${art}`;

const clamp01 = (t) => Math.min(1, Math.max(0, t));
const easeOut = (t) => 1 - (1 - clamp01(t)) ** 3;

// Deterministic spark field: the same burst every time, because a win animation
// that is a different shape on every play reads as noise.
const rand = ((seed) => () => {
	seed = (seed * 1103515245 + 12345) % 2147483648;
	return seed / 2147483648;
})(4021);
const SPARKS = Array.from({ length: 10 }, () => {
	// Biased upward: LEVERAGE feeds the meter, which sits above the board, so the
	// burst throws toward it rather than spreading evenly.
	const a = -Math.PI / 2 + (rand() - 0.5) * 2.6;
	return { a, speed: 0.55 + rand() * 0.75, len: 7 + rand() * 13, w: 1.6 + rand() * 1.8 };
});

/**
 * One frame.
 *
 * Beats: CHARGE the symbol draws in and a ring closes onto it; SNAP it pops with
 * a flash and throws a shockwave and sparks; SWEEP a band of light runs across
 * the artwork; SETTLE everything decays back to rest.
 */
const frame = (t) => {
	const c = CELL / 2;
	const half = ART / 2;
	let out = '';

	// ── scale ────────────────────────────────────────────────────────────────
	let sx;
	let sy;
	if (t < 0.22) {
		const u = t / 0.22;
		const s = 1 - 0.10 * u * u; // winds up
		sx = s;
		sy = s;
	} else {
		const p = (t - 0.22) / 0.78;
		const s = 1 + 0.30 * Math.exp(-4.5 * p) * Math.cos(p * 7.5);
		const squash = 0.10 * Math.exp(-7 * p); // wide and flat on the hit
		sx = s * (1 + squash);
		sy = s * (1 - squash);
	}

	// ── halo ─────────────────────────────────────────────────────────────────
	// A ROUNDED RECT, not a disc, and nowhere near opaque. The first pass put a
	// half-opaque green circle behind a dark square tile: wrong shape, and it
	// buried the very artwork the animation exists to draw attention to. The job
	// here is to lift the symbol off the board, not to replace it.
	const glow = t < 0.22 ? 0.04 + 0.10 * (t / 0.22) : 0.14 * Math.exp(-3.4 * ((t - 0.22) / 0.78));
	if (glow > 0.005) {
		for (const [grow, a] of [[46, 0.35], [26, 0.5], [10, 0.7]]) {
			const r = half + grow;
			out +=
				`<rect x="${(c - r).toFixed(1)}" y="${(c - r).toFixed(1)}" width="${(r * 2).toFixed(1)}" ` +
				`height="${(r * 2).toFixed(1)}" rx="${(r * 0.3).toFixed(1)}" fill="${BULL}" ` +
				`opacity="${(glow * a).toFixed(4)}"/>`;
		}
	}

	// ── charge ring, closing onto the tile ───────────────────────────────────
	if (t < 0.24) {
		const u = clamp01(t / 0.22);
		const r = half * (1.75 - 0.6 * easeOut(u));
		out +=
			`<rect x="${(c - r).toFixed(1)}" y="${(c - r).toFixed(1)}" width="${(r * 2).toFixed(1)}" ` +
			`height="${(r * 2).toFixed(1)}" rx="${(r * 0.3).toFixed(1)}" fill="none" stroke="${PALE}" ` +
			`stroke-width="${(1.5 + 2 * u).toFixed(1)}" opacity="${(0.10 + 0.45 * u).toFixed(3)}" ` +
			`stroke-dasharray="${(12 + 24 * (1 - u)).toFixed(1)} ${(9 + 16 * (1 - u)).toFixed(1)}"/>`;
	}

	// ── shockwave, thrown on the snap ────────────────────────────────────────
	// Two, not three. Three concentric rings at three colours read as clutter at
	// 104px, which is the size that actually matters.
	for (const [delay, color, weight] of [[0, PALE, 6], [0.09, BULL, 4]]) {
		const p = clamp01((t - 0.22 - delay) / 0.44);
		if (p <= 0 || p >= 1) continue;
		const r = half * (0.95 + 0.95 * easeOut(p));
		out +=
			`<rect x="${(c - r).toFixed(1)}" y="${(c - r).toFixed(1)}" width="${(r * 2).toFixed(1)}" ` +
			`height="${(r * 2).toFixed(1)}" rx="${(r * 0.3).toFixed(1)}" fill="none" stroke="${color}" ` +
			`stroke-width="${(weight * (1 - p) + 0.8).toFixed(1)}" opacity="${(0.8 * (1 - p) ** 1.3).toFixed(3)}"/>`;
	}

	// ── sparks ───────────────────────────────────────────────────────────────
	const sp = clamp01((t - 0.22) / 0.6);
	if (sp > 0 && sp < 1) {
		for (const s of SPARKS) {
			const d = half * (0.85 + s.speed * easeOut(sp) * 1.15);
			const x = c + Math.cos(s.a) * d;
			const y = c + Math.sin(s.a) * d - sp * 12;
			const tx = x + Math.cos(s.a) * s.len * (1 - sp);
			const ty = y + Math.sin(s.a) * s.len * (1 - sp);
			out +=
				`<path d="M ${x.toFixed(1)} ${y.toFixed(1)} L ${tx.toFixed(1)} ${ty.toFixed(1)}" ` +
				`stroke="${sp < 0.35 ? PALE : BULL}" stroke-width="${(s.w * (1 - sp * 0.7)).toFixed(1)}" ` +
				`stroke-linecap="round" opacity="${(0.85 * (1 - sp) ** 0.8).toFixed(3)}"/>`;
		}
	}

	// ── the artwork itself, scaled about its centre ──────────────────────────
	const g = `translate(${c} ${c}) scale(${sx.toFixed(4)} ${sy.toFixed(4)}) translate(${-half} ${-half})`;
	out += `<g transform="${g}"><image href="${artUri}" x="0" y="0" width="${ART}" height="${ART}"/></g>`;

	// ── flash and sweep, both masked to the ARTWORK's own luminance ──────────
	// This is the part that carries the animation, and it is the reason the
	// artwork does not need to be redrawn: the light appears only where the art
	// already is. On this symbol that means the neon strokes fire and the dark
	// tile stays dark, which is exactly what the piece is drawn to do.
	const flash = t >= 0.22 ? Math.exp(-13 * (t - 0.22)) : 0;
	if (flash > 0.02) {
		out +=
			`<g transform="${g}" mask="url(#artmask)">` +
			`<rect x="0" y="0" width="${ART}" height="${ART}" fill="${PALE}" opacity="${(flash * 0.85).toFixed(3)}"/></g>`;
	}

	const sweepP = clamp01((t - 0.3) / 0.44);
	if (sweepP > 0 && sweepP < 1) {
		const x = -ART * 0.7 + sweepP * ART * 2.2;
		out +=
			`<g transform="${g}" mask="url(#artmask)">` +
			`<rect x="${x.toFixed(1)}" y="${-ART * 0.3}" width="${(ART * 0.34).toFixed(1)}" height="${ART * 1.6}" ` +
			`fill="url(#sweep)" opacity="${(0.95 * Math.sin(sweepP * Math.PI)).toFixed(3)}" ` +
			`transform="rotate(18 ${ART / 2} ${ART / 2})"/></g>`;
	}

	return out;
};

const defs =
	`<mask id="artmask" maskUnits="userSpaceOnUse" x="0" y="0" width="${ART}" height="${ART}">` +
	`<image href="${artUri}" x="0" y="0" width="${ART}" height="${ART}"/></mask>` +
	`<linearGradient id="sweep" x1="0" y1="0" x2="1" y2="0">` +
	`<stop offset="0" stop-color="${PALE}" stop-opacity="0"/>` +
	`<stop offset="0.5" stop-color="#ffffff" stop-opacity="1"/>` +
	`<stop offset="1" stop-color="${PALE}" stop-opacity="0"/></linearGradient>`;

// ── render every frame ─────────────────────────────────────────────────────
//
// Frames are written individually and the preview embeds them one by one. An
// earlier version packed all thirty into one sheet by re-rendering them as
// embedded <image> elements in a second SVG, and that step corrupted colour:
// the later frames came back cyan and lime, hues that appear nowhere in the
// palette. Packing is a shipping concern, not a preview concern, so the preview
// no longer does it - a sheet can be built properly later, from these files.
const frames = [];
for (let i = 0; i < FRAMES; i++) {
	const t = i / (FRAMES - 1);
	const svg =
		`<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" ` +
		`width="${CELL}" height="${CELL}" viewBox="0 0 ${CELL} ${CELL}"><defs>${defs}</defs>${frame(t)}</svg>`;
	const png = new Resvg(svg, { fitTo: { mode: 'width', value: CELL } }).render().asPng();
	frames.push(png);
	fs.writeFileSync(path.join(FRAME_DIR, `${symbol}_${String(i).padStart(2, '0')}.png`), png);
}

// ── a player, so the thing can actually be judged in motion ─────────────────
// Shown at the real in-game cell size as well as large: an animation that reads
// at 300px and turns to mush at 104px has not been judged.
const uris = frames.map((b) => `data:image/png;base64,${b.toString('base64')}`);
const html = `<title>LEVERAGE win animation</title>
<style>
  :root { color-scheme: dark; }
  body { margin:0; background:#060b09; color:#cfe9da;
         font:14px/1.5 "Trebuchet MS",system-ui,sans-serif; padding:28px; }
  h1 { font-size:17px; letter-spacing:2px; color:#4bd67f; margin:0 0 4px; }
  p  { color:#7f9d8c; margin:0 0 22px; }
  .row { display:flex; gap:44px; align-items:flex-end; flex-wrap:wrap; margin-bottom:26px; }
  .item { text-align:center; }
  .cap { color:#7f9d8c; font-size:12px; margin-top:8px; letter-spacing:1px; }
  .stack { position:relative; }
  .stack img { position:absolute; inset:0; width:100%; height:100%; opacity:0; }
  .stack img.on { opacity:1; }
  .board { display:inline-block; padding:10px; background:#0d1611;
           border:1px solid rgba(75,214,127,.25); border-radius:6px; }
  label { color:#7f9d8c; font-size:12px; margin-right:14px; }
  input[type=range] { vertical-align:middle; width:190px; accent-color:#4bd67f; }
</style>
<h1>LEVERAGE — WIN ANIMATION</h1>
<p>${FRAMES} baked frames. Left is the real in-game cell size (104&nbsp;px); the others are for inspection.</p>
<div class="row">
${[104, 208, 312]
	.map(
		(px) =>
			`  <div class="item"><div class="board"><div class="stack" id="s${px}" ` +
			`style="width:${px}px;height:${px}px"></div></div><div class="cap">${px} px${px === 104 ? ' — actual size' : ''}</div></div>`,
	)
	.join('')}
</div>
<div>
  <label>speed <input type="range" id="fps" min="12" max="60" value="32"></label>
  <span id="fpsv" style="color:#4bd67f">32 fps</span>
  <label style="margin-left:26px"><input type="checkbox" id="hold" checked> hold 450 ms between plays</label>
</div>
<script>
  const URIS = ${JSON.stringify(uris)};
  const stacks = [104, 208, 312].map((px) => {
    const el = document.getElementById('s' + px);
    el.innerHTML = URIS.map((u, i) => '<img src="' + u + '"' + (i === 0 ? ' class="on"' : '') + '>').join('');
    return el.querySelectorAll('img');
  });
  let i = 0, last = 0, waitUntil = 0;
  const fps = document.getElementById('fps'), fpsv = document.getElementById('fpsv');
  const hold = document.getElementById('hold');
  fps.addEventListener('input', () => { fpsv.textContent = fps.value + ' fps'; });
  const draw = (prev) => {
    for (const imgs of stacks) { imgs[prev].classList.remove('on'); imgs[i].classList.add('on'); }
  };
  const tick = (now) => {
    if (now >= waitUntil && now - last >= 1000 / +fps.value) {
      last = now;
      const prev = i;
      i = (i + 1) % URIS.length;
      if (i === 0 && hold.checked) waitUntil = now + 450;
      draw(prev);
    }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
</script>`;

const htmlPath = path.join(OUT_DIR, `anim_${symbol}.html`);
fs.writeFileSync(htmlPath, html);

console.log(`wrote ${FRAMES} frames to ${path.relative(appRoot, FRAME_DIR)}`);
console.log(`wrote ${path.relative(appRoot, htmlPath)}  ${(fs.statSync(htmlPath).size / 1024 / 1024).toFixed(1)} MB  — open this to see it move`);
