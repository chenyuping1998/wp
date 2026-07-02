// GoBananas generated Spine assets (pixi-spine compatible, Spine 4.1 JSON).
// Regular symbols get idle/win (playful bounce); wx gets the expanding-wild
// "monkey eats a banana and grows" animation. PNGs must exist already
// (run generate_art.mjs first) — this script copies them next to the spines.
// Usage: node design/generate_spines.mjs
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(appRoot, 'static/assets/sprites/goBananasSymbols');
const OUT = path.join(appRoot, 'static/assets/spines/goBananasSymbols');
fs.mkdirSync(OUT, { recursive: true });

const atlasPage = (png, w, h, region) => `${png}
size:${w},${h}
format:RGBA8888
filter:Linear,Linear
repeat:none
${region}
bounds:0,0,${w},${h}
offsets:0,0,${w},${h}
index:-1
`;

// ── regular symbol: single region, idle + playful win bounce (1.4s) ─────────
const symbolSpine = (name) => ({
	skeleton: { hash: `gb-${name}-auto`, spine: '4.1.20', x: -128, y: -128, width: 256, height: 256, images: './' },
	bones: [{ name: 'root' }, { name: 'symbol', parent: 'root' }],
	slots: [{ name: 'symbol', bone: 'symbol', attachment: name }],
	skins: [{ name: 'default', attachments: { symbol: { [name]: { x: 0, y: 0, width: 256, height: 256 } } } }],
	animations: {
		idle: {
			bones: {
				symbol: {
					scale: [
						{ time: 0, x: 1, y: 1 },
						{ time: 0.3, x: 1.03, y: 0.97 },
						{ time: 0.6, x: 1, y: 1 },
						{ time: 0.9, x: 0.98, y: 1.02 },
						{ time: 1.2, x: 1, y: 1 },
					],
				},
			},
		},
		win: {
			bones: {
				symbol: {
					scale: [
						{ time: 0, x: 1, y: 1 },
						{ time: 0.21, x: 1.35, y: 1.35 },
						{ time: 0.42, x: 1.5, y: 1.5 },
						{ time: 0.63, x: 1.22, y: 1.22 },
						{ time: 0.84, x: 1.4, y: 1.4 },
						{ time: 1.12, x: 1, y: 1 },
						{ time: 1.4, x: 1, y: 1 },
					],
					rotate: [
						{ time: 0, value: 0 },
						{ time: 0.28, value: -8 },
						{ time: 0.56, value: 8 },
						{ time: 0.84, value: -4 },
						{ time: 1.12, value: 4 },
						{ time: 1.4, value: 0 },
					],
					translate: [
						{ time: 0, x: 0, y: 0 },
						{ time: 0.35, x: 0, y: 18 },
						{ time: 0.7, x: 0, y: 0 },
						{ time: 1.05, x: 0, y: 9 },
						{ time: 1.4, x: 0, y: 0 },
					],
				},
			},
			slots: {
				symbol: {
					color: [
						{ time: 0, color: 'ffffffff' },
						{ time: 0.28, color: 'ffe9a8ff' },
						{ time: 0.56, color: 'ffffffff' },
						{ time: 0.84, color: 'ffe9a8ff' },
						{ time: 1.4, color: 'ffffffff' },
					],
				},
			},
		},
	},
});

const REGULAR = ['h1', 'h2', 'h3', 'h4', 'l1', 'l2', 'l3', 'l4', 'l5', 's', 'w', 'p', 'x'];
for (const name of REGULAR) {
	fs.copyFileSync(path.join(SRC, `${name}.png`), path.join(OUT, `${name}.png`));
	fs.writeFileSync(path.join(OUT, `${name}.atlas`), atlasPage(`${name}.png`, 256, 256, name));
	fs.writeFileSync(path.join(OUT, `${name}.json`), JSON.stringify(symbolSpine(name), null, 2) + '\n');
}

// ── expanding wild: monkey eats banana → grows to fill the reel ─────────────
// Skeleton space: 256 wide × 1280 tall (5 rows of 256), origin at reel center.
// Slots: banana (s.png) flies into the small monkey (w.png); on the gulp the
// monkey slot swaps attachment to the full-body wx and scales up with a bounce.
const wxSpine = {
	skeleton: { hash: 'gb-wx-auto', spine: '4.1.20', x: -128, y: -640, width: 256, height: 1280, images: './' },
	bones: [
		{ name: 'root' },
		{ name: 'monkey', parent: 'root' },
		{ name: 'banana', parent: 'root', x: 190, y: 140 },
	],
	slots: [
		{ name: 'monkey', bone: 'monkey', attachment: 'w' },
		{ name: 'banana', bone: 'banana' },
	],
	skins: [
		{
			name: 'default',
			attachments: {
				monkey: {
					w: { x: 0, y: 0, width: 256, height: 256 },
					wx: { x: 0, y: 0, width: 256, height: 1280 },
				},
				banana: { s: { x: 0, y: 0, width: 256, height: 256 } },
			},
		},
	],
	animations: {
		idle: {
			bones: {
				monkey: {
					scale: [
						{ time: 0, x: 1, y: 1 },
						{ time: 0.7, x: 1.015, y: 0.99 },
						{ time: 1.4, x: 1, y: 1 },
						{ time: 2.1, x: 0.99, y: 1.012 },
						{ time: 2.8, x: 1, y: 1 },
					],
				},
			},
			slots: { monkey: { attachment: [{ time: 0, name: 'wx' }] } },
		},
		grow: {
			bones: {
				banana: {
					// banana pops in, arcs into the monkey's mouth
					translate: [
						{ time: 0, x: 0, y: 0 },
						{ time: 0.35, x: -120, y: -60 },
						{ time: 0.55, x: -170, y: -130 },
					],
					scale: [
						{ time: 0, x: 0, y: 0 },
						{ time: 0.15, x: 0.55, y: 0.55 },
						{ time: 0.35, x: 0.45, y: 0.45 },
						{ time: 0.55, x: 0.05, y: 0.05 },
					],
					rotate: [
						{ time: 0, value: 0 },
						{ time: 0.55, value: -160 },
					],
				},
				monkey: {
					// chew, gulp, then grow with a bounce into the full-body pose
					scale: [
						{ time: 0, x: 0.34, y: 0.34 },
						{ time: 0.55, x: 0.36, y: 0.32 },
						{ time: 0.7, x: 0.32, y: 0.38 },
						{ time: 0.85, x: 0.38, y: 0.3 },
						{ time: 1.0, x: 0.34, y: 0.34 },
						{ time: 1.35, x: 1.12, y: 1.12 },
						{ time: 1.55, x: 0.96, y: 0.96 },
						{ time: 1.75, x: 1.04, y: 1.04 },
						{ time: 1.95, x: 1, y: 1 },
					],
					rotate: [
						{ time: 0.55, value: 0 },
						{ time: 0.7, value: -5 },
						{ time: 0.85, value: 5 },
						{ time: 1.0, value: 0 },
					],
				},
			},
			slots: {
				monkey: {
					attachment: [
						{ time: 0, name: 'w' },
						{ time: 1.05, name: 'wx' },
					],
					color: [
						{ time: 1.0, color: 'ffffffff' },
						{ time: 1.15, color: 'fff2b0ff' },
						{ time: 1.5, color: 'ffffffff' },
					],
				},
				banana: {
					attachment: [
						{ time: 0, name: 's' },
						{ time: 0.56, name: null },
					],
				},
			},
		},
	},
};

// multi-page atlas: w + s + wx regions
const wxAtlas =
	atlasPage('w.png', 256, 256, 'w') + '\n' + atlasPage('s.png', 256, 256, 's') + '\n' + atlasPage('wx.png', 256, 1280, 'wx');
fs.copyFileSync(path.join(SRC, 'wx.png'), path.join(OUT, 'wx.png'));
fs.writeFileSync(path.join(OUT, 'wx.atlas'), wxAtlas);
fs.writeFileSync(path.join(OUT, 'wx.json'), JSON.stringify(wxSpine, null, 2) + '\n');

console.log('spines written to', OUT);
