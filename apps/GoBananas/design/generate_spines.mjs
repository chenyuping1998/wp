// GoBananas generated Spine assets (pixi-spine compatible, Spine 4.1 JSON).
// 中國風 set: every symbol gets an idle + a themed win animation (lantern swing,
// ingot rock, firecracker shake, coin flip…); wx gets the expanding-wild
// "悟空 spins the 金箍棒 while growing to fill the reel" animation.
// PNGs must exist already (run generate_art.mjs first) — this script copies
// them next to the spines.
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

// ── shared idle: soft breathing ──────────────────────────────────────────────
const idleAnim = {
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
};

const flashSlot = (peak = 'ffe9a8ff') => ({
	symbol: {
		color: [
			{ time: 0, color: 'ffffffff' },
			{ time: 0.28, color: peak },
			{ time: 0.56, color: 'ffffffff' },
			{ time: 0.84, color: peak },
			{ time: 1.4, color: 'ffffffff' },
		],
	},
});

// ── themed win animations (all 1.4s so game pacing stays uniform) ───────────
const WIN_ANIMS = {
	// 金元寶 — rocks like a boat with a proud puff-up
	h1: {
		bones: {
			symbol: {
				rotate: [
					{ time: 0, value: 0 },
					{ time: 0.2, value: -12 },
					{ time: 0.45, value: 12 },
					{ time: 0.7, value: -8 },
					{ time: 0.95, value: 6 },
					{ time: 1.2, value: -2 },
					{ time: 1.4, value: 0 },
				],
				scale: [
					{ time: 0, x: 1, y: 1 },
					{ time: 0.35, x: 1.4, y: 1.32 },
					{ time: 0.9, x: 1.34, y: 1.4 },
					{ time: 1.4, x: 1, y: 1 },
				],
			},
		},
		slots: flashSlot(),
	},
	// 紅燈籠 — pendulum swing from the hanger with a warm glow
	h2: {
		bones: {
			symbol: {
				rotate: [
					{ time: 0, value: 0 },
					{ time: 0.18, value: -16 },
					{ time: 0.46, value: 16 },
					{ time: 0.74, value: -11 },
					{ time: 1.02, value: 7 },
					{ time: 1.25, value: -3 },
					{ time: 1.4, value: 0 },
				],
				translate: [
					{ time: 0, x: 0, y: 0 },
					{ time: 0.32, x: 10, y: 12 },
					{ time: 0.6, x: -10, y: 12 },
					{ time: 0.88, x: 7, y: 8 },
					{ time: 1.4, x: 0, y: 0 },
				],
				scale: [
					{ time: 0, x: 1, y: 1 },
					{ time: 0.4, x: 1.32, y: 1.32 },
					{ time: 1.0, x: 1.36, y: 1.36 },
					{ time: 1.4, x: 1, y: 1 },
				],
			},
		},
		slots: flashSlot('ffd0a0ff'),
	},
	// 蟠桃 — juicy squash & stretch hop
	h3: {
		bones: {
			symbol: {
				scale: [
					{ time: 0, x: 1, y: 1 },
					{ time: 0.15, x: 1.3, y: 0.82 },
					{ time: 0.38, x: 1.16, y: 1.52 },
					{ time: 0.6, x: 1.42, y: 1.18 },
					{ time: 0.82, x: 1.24, y: 1.44 },
					{ time: 1.1, x: 1.34, y: 1.3 },
					{ time: 1.4, x: 1, y: 1 },
				],
				translate: [
					{ time: 0, x: 0, y: 0 },
					{ time: 0.15, x: 0, y: -14 },
					{ time: 0.42, x: 0, y: 26 },
					{ time: 0.68, x: 0, y: 2 },
					{ time: 0.9, x: 0, y: 16 },
					{ time: 1.15, x: 0, y: 0 },
					{ time: 1.4, x: 0, y: 0 },
				],
			},
		},
		slots: flashSlot('ffc9c9ff'),
	},
	// 鞭炮 — rapid crackling jitter with hot flashes
	h4: {
		bones: {
			symbol: {
				rotate: [
					{ time: 0, value: 0 },
					{ time: 0.1, value: -7 },
					{ time: 0.2, value: 7 },
					{ time: 0.3, value: -6 },
					{ time: 0.4, value: 6 },
					{ time: 0.5, value: -5 },
					{ time: 0.6, value: 5 },
					{ time: 0.72, value: -4 },
					{ time: 0.84, value: 4 },
					{ time: 1.0, value: -2 },
					{ time: 1.2, value: 1 },
					{ time: 1.4, value: 0 },
				],
				translate: [
					{ time: 0, x: 0, y: 0 },
					{ time: 0.15, x: -6, y: 4 },
					{ time: 0.3, x: 6, y: -4 },
					{ time: 0.45, x: -5, y: 3 },
					{ time: 0.6, x: 5, y: -3 },
					{ time: 0.8, x: -3, y: 2 },
					{ time: 1.0, x: 2, y: 0 },
					{ time: 1.4, x: 0, y: 0 },
				],
				scale: [
					{ time: 0, x: 1, y: 1 },
					{ time: 0.3, x: 1.38, y: 1.38 },
					{ time: 1.0, x: 1.38, y: 1.38 },
					{ time: 1.4, x: 1, y: 1 },
				],
			},
		},
		slots: {
			symbol: {
				color: [
					{ time: 0, color: 'ffffffff' },
					{ time: 0.15, color: 'fff3b0ff' },
					{ time: 0.3, color: 'ffffffff' },
					{ time: 0.45, color: 'ffd699ff' },
					{ time: 0.6, color: 'ffffffff' },
					{ time: 0.78, color: 'fff3b0ff' },
					{ time: 1.4, color: 'ffffffff' },
				],
			},
		},
	},
	// 銅錢 — coin flip: squashes on x like it's spinning, with a shine
	p: {
		bones: {
			symbol: {
				scale: [
					{ time: 0, x: 1, y: 1 },
					{ time: 0.14, x: 1.3, y: 1.3 },
					{ time: 0.32, x: 0.16, y: 1.38 },
					{ time: 0.5, x: 1.34, y: 1.34 },
					{ time: 0.68, x: 0.16, y: 1.38 },
					{ time: 0.86, x: 1.34, y: 1.34 },
					{ time: 1.04, x: 0.4, y: 1.36 },
					{ time: 1.2, x: 1.2, y: 1.2 },
					{ time: 1.4, x: 1, y: 1 },
				],
			},
		},
		slots: flashSlot(),
	},
	// 悟空百搭 — cudgel-twirl wiggle, big and lively
	w: {
		bones: {
			symbol: {
				rotate: [
					{ time: 0, value: 0 },
					{ time: 0.2, value: -14 },
					{ time: 0.45, value: 14 },
					{ time: 0.7, value: -10 },
					{ time: 0.95, value: 8 },
					{ time: 1.2, value: -3 },
					{ time: 1.4, value: 0 },
				],
				scale: [
					{ time: 0, x: 1, y: 1 },
					{ time: 0.25, x: 1.45, y: 1.45 },
					{ time: 0.55, x: 1.55, y: 1.55 },
					{ time: 0.85, x: 1.4, y: 1.4 },
					{ time: 1.1, x: 1.5, y: 1.5 },
					{ time: 1.4, x: 1, y: 1 },
				],
				translate: [
					{ time: 0, x: 0, y: 0 },
					{ time: 0.35, x: 0, y: 20 },
					{ time: 0.7, x: 0, y: 0 },
					{ time: 1.05, x: 0, y: 10 },
					{ time: 1.4, x: 0, y: 0 },
				],
			},
		},
		slots: flashSlot('ffe066ff'),
	},
	// 金蟠桃 scatter — triumphant pop and shimmer
	s: {
		bones: {
			symbol: {
				scale: [
					{ time: 0, x: 1, y: 1 },
					{ time: 0.18, x: 1.55, y: 1.55 },
					{ time: 0.4, x: 1.3, y: 1.3 },
					{ time: 0.62, x: 1.5, y: 1.5 },
					{ time: 0.84, x: 1.35, y: 1.35 },
					{ time: 1.06, x: 1.45, y: 1.45 },
					{ time: 1.4, x: 1, y: 1 },
				],
				rotate: [
					{ time: 0, value: 0 },
					{ time: 0.3, value: -10 },
					{ time: 0.6, value: 10 },
					{ time: 0.9, value: -6 },
					{ time: 1.2, value: 3 },
					{ time: 1.4, value: 0 },
				],
			},
		},
		slots: {
			symbol: {
				color: [
					{ time: 0, color: 'ffffffff' },
					{ time: 0.2, color: 'fff59bff' },
					{ time: 0.4, color: 'ffffffff' },
					{ time: 0.6, color: 'ffe066ff' },
					{ time: 0.8, color: 'ffffffff' },
					{ time: 1.0, color: 'fff59bff' },
					{ time: 1.4, color: 'ffffffff' },
				],
			},
		},
	},
};

// generic bounce for royals + dead tile
const genericWin = (small = false) => ({
	bones: {
		symbol: {
			scale: small
				? [
						{ time: 0, x: 1, y: 1 },
						{ time: 0.4, x: 1.12, y: 1.12 },
						{ time: 1.0, x: 1.08, y: 1.08 },
						{ time: 1.4, x: 1, y: 1 },
					]
				: [
						{ time: 0, x: 1, y: 1 },
						{ time: 0.21, x: 1.32, y: 1.32 },
						{ time: 0.42, x: 1.45, y: 1.45 },
						{ time: 0.63, x: 1.2, y: 1.2 },
						{ time: 0.84, x: 1.36, y: 1.36 },
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
	slots: flashSlot(),
});

const symbolSpine = (name) => ({
	skeleton: { hash: `gb-${name}-auto`, spine: '4.1.20', x: -128, y: -128, width: 256, height: 256, images: './' },
	bones: [{ name: 'root' }, { name: 'symbol', parent: 'root' }],
	slots: [{ name: 'symbol', bone: 'symbol', attachment: name }],
	skins: [{ name: 'default', attachments: { symbol: { [name]: { x: 0, y: 0, width: 256, height: 256 } } } }],
	animations: {
		idle: idleAnim,
		win: WIN_ANIMS[name] ?? genericWin(name === 'x'),
	},
});

const REGULAR = ['h1', 'h2', 'h3', 'h4', 'l1', 'l2', 'l3', 'l4', 'l5', 's', 'w', 'p', 'x'];
for (const name of REGULAR) {
	fs.copyFileSync(path.join(SRC, `${name}.png`), path.join(OUT, `${name}.png`));
	fs.writeFileSync(path.join(OUT, `${name}.atlas`), atlasPage(`${name}.png`, 256, 256, name));
	fs.writeFileSync(path.join(OUT, `${name}.json`), JSON.stringify(symbolSpine(name), null, 2) + '\n');
}

// ── expanding wild: 悟空 spins the 金箍棒 and grows to fill the reel ──────────
// Skeleton space: 256 wide × 1280 tall (5 rows of 256), origin at reel center.
// The small monkey (w.png) lands, whips out the cudgel (cudgel.png, child bone
// so it grows with him) and twirls it 3 full turns while growing; on the last
// turn the slot swaps to the full-body wx pose with a golden flash.

// cudgel twirl: keyframes every 120° so pixi-spine interpolates forward
// (rotate diffs are wrapped to ±180°, so steps must stay below that)
const SPIN_TURNS = 3;
const SPIN_START = 0.35;
const SPIN_END = 1.45;
const cudgelRotate = [];
{
	const steps = SPIN_TURNS * 3; // 120° per step
	for (let i = 0; i <= steps; i++) {
		const t = SPIN_START + ((SPIN_END - SPIN_START) * i) / steps;
		cudgelRotate.push({ time: Number(t.toFixed(3)), value: (i * 120) % 360 });
	}
}

const wxSpine = {
	skeleton: { hash: 'gb-wx-auto', spine: '4.1.20', x: -128, y: -640, width: 256, height: 1280, images: './' },
	bones: [
		{ name: 'root' },
		{ name: 'monkey', parent: 'root' },
		// paw pivot of the small monkey pose (w.png): slightly below center
		{ name: 'cudgel', parent: 'monkey', x: 4, y: -44 },
	],
	slots: [
		{ name: 'monkey', bone: 'monkey', attachment: 'w' },
		{ name: 'cudgel', bone: 'cudgel' },
	],
	skins: [
		{
			name: 'default',
			attachments: {
				monkey: {
					w: { x: 0, y: 0, width: 256, height: 256 },
					wx: { x: 0, y: 0, width: 256, height: 1280 },
				},
				// cudgel.png is drawn diagonally at 45°; rotate the attachment so it
				// starts flat in the paw and the bone rotation reads as a clean twirl
				cudgel: { cudgel: { x: 0, y: 0, rotation: 45, width: 256, height: 256 } },
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
			slots: {
				monkey: { attachment: [{ time: 0, name: 'wx' }] },
				cudgel: { attachment: [{ time: 0, name: null }] },
			},
		},
		// Starts at exactly one symbol size on top of the landed W (the small
		// monkey covers it 1:1), hops, twirls the cudgel while growing, then
		// snaps into the full-reel wx pose under a golden flash.
		grow: {
			bones: {
				monkey: {
					scale: [
						{ time: 0, x: 1, y: 1 },
						{ time: 0.15, x: 1.1, y: 0.9 },
						{ time: 0.28, x: 0.95, y: 1.07 },
						{ time: SPIN_START, x: 1, y: 1 },
						{ time: 0.9, x: 1.6, y: 1.6 },
						{ time: SPIN_END, x: 2.4, y: 2.4 },
						{ time: SPIN_END + 0.02, x: 1.06, y: 1.06 },
						{ time: 1.62, x: 0.96, y: 0.96 },
						{ time: 1.8, x: 1.03, y: 1.03 },
						{ time: 2.0, x: 1, y: 1 },
					],
					rotate: [
						{ time: SPIN_START, value: 0 },
						{ time: 0.62, value: -6 },
						{ time: 0.9, value: 6 },
						{ time: 1.18, value: -4 },
						{ time: SPIN_END, value: 0 },
					],
				},
				cudgel: {
					rotate: cudgelRotate,
					// cudgel pops out of the paw, twirls wide, then merges into the pose
					scale: [
						{ time: SPIN_START, x: 0, y: 0 },
						{ time: 0.55, x: 0.95, y: 0.95 },
						{ time: 1.2, x: 1.05, y: 1.05 },
						{ time: SPIN_END, x: 0.3, y: 0.3 },
					],
				},
			},
			slots: {
				monkey: {
					attachment: [
						{ time: 0, name: 'w' },
						{ time: SPIN_END + 0.02, name: 'wx' },
					],
					color: [
						{ time: 1.3, color: 'ffffffff' },
						{ time: SPIN_END, color: 'fff2b0ff' },
						{ time: 1.78, color: 'ffffffff' },
					],
				},
				cudgel: {
					attachment: [
						{ time: 0, name: null },
						{ time: SPIN_START, name: 'cudgel' },
						{ time: SPIN_END, name: null },
					],
				},
			},
		},
	},
};

// multi-page atlas: w + cudgel + wx regions
const wxAtlas =
	atlasPage('w.png', 256, 256, 'w') +
	'\n' +
	atlasPage('cudgel.png', 256, 256, 'cudgel') +
	'\n' +
	atlasPage('wx.png', 256, 1280, 'wx');
fs.copyFileSync(path.join(SRC, 'wx.png'), path.join(OUT, 'wx.png'));
fs.copyFileSync(path.join(SRC, 'cudgel.png'), path.join(OUT, 'cudgel.png'));
fs.writeFileSync(path.join(OUT, 'wx.atlas'), wxAtlas);
fs.writeFileSync(path.join(OUT, 'wx.json'), JSON.stringify(wxSpine, null, 2) + '\n');

console.log('spines written to', OUT);
