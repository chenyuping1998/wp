// check_ui_palette.mjs — the bet bar and the info pages may only use this game's
// own colours.
//
// WHY THIS GATE EXISTS
//
// This app has been reskinned twice (GoBananas -> Hot Miami -> Capo Nostra) and
// both times the SPRITE art was remapped by a script while the vector and CSS
// colours were left where they were. The result each time was a green build and
// a screen with two games on it. Found on 2026-09-09, all of it live:
//
//   game/uiTheme.ts          deep indigo plates (0x1b0f3a / 0x140a30 / 0x23113f),
//                            hot magenta trim (0xff7ab2 / 0x7a1a5e), icy cyan
//                            icons (0xd8f6ff), a mint win accent (0x2ee6a8) and a
//                            cyan bet accent (0x00a8c8) — Hot Miami's palette
//   components/ui/Modals*    GoBananas' banana gold (#ffd75e / #ffe98a / #a87a1e)
//   ModalPayTable.svelte     rgba(255,122,217,.4) — a hot pink glow on the
//                            Scatter row, confirmed with getComputedStyle
//
// Every one of those passed thirteen existing gates, because no gate compared a
// colour against anything.
//
// WHAT IT CHECKS
//
//   1. The reserved signal red #C1272D does not appear on a UI surface at all.
//      ART_BRIEF §0 gives it to the Tommy Gun wild alone so that red on screen
//      means that mechanic. The files that legitimately own it — symbolWinMotion
//      and symbolLandMotion, both keyed strictly to the SW symbol — are not UI
//      surfaces and are not in the scanned set at all, so there is no allowlist
//      to fall out of date. Adding a file to FILES below is the only way to
//      bring one in.
//
//      featureTiers.ts USED to be on that "legitimately owns it" list too, on
//      the assumption that any red in a game-logic file must be Tommy Gun's.
//      Found 2026-09-09: it wasn't — 0xc1272d was colouring THE DON tier's name
//      on the free-spin splash, nothing to do with the wild, in the one file
//      that isn't scanned. A tier accent is exactly the kind of UI-adjacent
//      value this gate exists to catch, so featureTiers.ts is now IN the
//      scanned set below rather than assumed clean by virtue of living in
//      game/. Don't extend that assumption to a new file without actually
//      reading what its red is doing.
//   2. No saturated colour whose HUE is outside this game's two-hue budget.
//      §0: a warm base plus ONE accent (gold or wine), with gunmetal allowed as a
//      cool corrective. So warm hues (red through yellow), blue-greys, and
//      anything desaturated are fine; magenta, purple, cyan and green are not.
//
// Comments are stripped before scanning, so a file may still WRITE DOWN the
// colour it removed — which several of them do, on purpose.
//
// To see what it found rather than just pass/fail: --report

import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const REPORT = process.argv.includes('--report');

// UI surfaces: the bet bar's colours, every DOM modal, and the tier accents a
// player reads on the free-spin splash (see the 2026-09-09 note above on why
// featureTiers.ts is here rather than assumed clean).
const FILES = [
	'src/game/uiTheme.ts',
	'src/game/palette.ts',
	'src/game/featureTiers.ts',
	...readdirSync(join(ROOT, 'src/components/ui'))
		.filter((f) => f.endsWith('.svelte'))
		.map((f) => join('src/components/ui', f)),
];

const SIGNAL_RED = [0xc1, 0x27, 0x2d];
// distance under which two colours count as "the same red" — the exact literal is
// what matters, but a hand-typed near-miss (#c2272d) is the same violation
const RED_TOLERANCE = 12;

// Hue bands that ART_BRIEF §0 excludes, in degrees. Everything in the game's own
// table lands outside them: the golds sit at 47-51, the wines at 356-357, the
// gunmetals at 210-214.
const BANNED_HUES = [
	{ name: 'green', from: 75, to: 165 },
	{ name: 'cyan', from: 165, to: 195 },
	{ name: 'violet/magenta', from: 240, to: 340 },
];
// Below this saturation a colour is a neutral and carries no hue worth policing —
// a 4%-alpha white overlay is not a magenta just because it rounds that way.
//
// 0.12, not the 0.22 this started at. Proven by injection: at 0.22 the gate
// caught three of Hot Miami's four values and let 0xd8f6ff through — the icy
// cyan icon fill, which sits at saturation 0.15 because it is a pale tint and
// still reads unmistakably as ice blue on a gold bar. This game's own palette
// has nothing between 0.12 and 0.22, so the floor can come down without any
// legitimate colour crossing it (bone white is 0.08, pure white 0).
const MIN_SATURATION = 0.12;
// Below this value the colour is effectively black; hue is meaningless there.
const MIN_VALUE = 0.12;

const stripComments = (src) =>
	src
		.replace(/\/\*[\s\S]*?\*\//g, ' ') // /* */ and CSS comments
		.replace(/(^|[^:])\/\/[^\n]*/g, '$1') // // line comments, not http://
		.replace(/<!--[\s\S]*?-->/g, ' '); // svelte markup comments

const hsv = ([r, g, b]) => {
	const R = r / 255,
		G = g / 255,
		B = b / 255;
	const max = Math.max(R, G, B);
	const min = Math.min(R, G, B);
	const d = max - min;
	let h = 0;
	if (d !== 0) {
		if (max === R) h = ((G - B) / d) % 6;
		else if (max === G) h = (B - R) / d + 2;
		else h = (R - G) / d + 4;
		h *= 60;
		if (h < 0) h += 360;
	}
	return { h, s: max === 0 ? 0 : d / max, v: max };
};

const findings = [];
const seen = [];

for (const rel of FILES) {
	const src = stripComments(readFileSync(join(ROOT, rel), 'utf8'));
	const lines = src.split('\n');

	lines.forEach((line, i) => {
		const hits = [];
		// 0xRRGGBB
		for (const m of line.matchAll(/0x([0-9a-fA-F]{6})\b/g))
			hits.push({ text: m[0], rgb: [0, 2, 4].map((k) => parseInt(m[1].slice(k, k + 2), 16)) });
		// #RRGGBB
		for (const m of line.matchAll(/#([0-9a-fA-F]{6})\b/g))
			hits.push({ text: m[0], rgb: [0, 2, 4].map((k) => parseInt(m[1].slice(k, k + 2), 16)) });
		// rgb()/rgba() with literal channels (var(--…) forms carry no numbers and
		// are exactly what this gate wants the code to use instead)
		for (const m of line.matchAll(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/g))
			hits.push({ text: m[0] + ')', rgb: [+m[1], +m[2], +m[3]] });

		for (const hit of hits) {
			const { h, s, v } = hsv(hit.rgb);
			seen.push({ rel, line: i + 1, ...hit, h, s, v });

			const dRed = Math.hypot(...hit.rgb.map((c, k) => c - SIGNAL_RED[k]));
			if (dRed <= RED_TOLERANCE)
				findings.push(
					`${rel}:${i + 1}  ${hit.text} is the reserved Tommy Gun signal red ` +
						`(#C1272D, distance ${dRed.toFixed(0)}). ART_BRIEF §0 gives that colour to ` +
						`one mechanic; it must not appear on a UI surface.`,
				);

			if (s < MIN_SATURATION || v < MIN_VALUE) continue;
			const band = BANNED_HUES.find((b) => h >= b.from && h < b.to);
			if (band)
				findings.push(
					`${rel}:${i + 1}  ${hit.text} is ${band.name} (hue ${h.toFixed(0)}°, ` +
						`sat ${s.toFixed(2)}). ART_BRIEF §0 allows a warm base plus ONE accent ` +
						`(gold or wine), with gunmetal as the cool corrective — no ${band.name}. ` +
						`Use a constant from src/game/palette.ts.`,
				);
		}
	});
}

if (REPORT) {
	console.log(`scanned ${FILES.length} files, ${seen.length} colour literals`);
	const byFile = new Map();
	for (const c of seen) byFile.set(c.rel, (byFile.get(c.rel) ?? 0) + 1);
	for (const [f, n] of [...byFile].sort((a, b) => b[1] - a[1]))
		console.log(`  ${String(n).padStart(4)}  ${f}`);
	const hued = seen.filter((c) => c.s >= MIN_SATURATION && c.v >= MIN_VALUE);
	console.log(`\n${hued.length} of them carry a hue worth checking:`);
	for (const c of hued.sort((a, b) => a.h - b.h))
		console.log(
			`  ${String(Math.round(c.h)).padStart(3)}°  s${c.s.toFixed(2)}  ${c.text.padEnd(24)} ${relative('.', c.rel)}:${c.line}`,
		);
}

if (findings.length) {
	console.error(`!! UI palette: ${findings.length} colour(s) outside ART_BRIEF §0\n`);
	for (const f of findings) console.error('   ' + f);
	console.error(
		'\n   The palette is src/game/palette.ts. If a value genuinely belongs here,\n' +
			'   add it there with a reason rather than typing it into the component.',
	);
	process.exit(1);
}

console.log(`OK: UI palette clean (${seen.length} colour literals across ${FILES.length} files)`);
