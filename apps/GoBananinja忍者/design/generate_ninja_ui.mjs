// Ninja UI artwork. Run: node design/generate_ninja_ui.mjs
// Geometry follows the Delta/Boat ticker and Buy Bonus sprite slots.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const resvgDir = process.argv[2];
if (!resvgDir) throw new Error('Usage: node design/generate_ninja_ui.mjs <directory with @resvg/resvg-js>');
const require = createRequire(path.join(path.resolve(resvgDir), 'noop.js'));
const { Resvg } = require('@resvg/resvg-js');
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(root, 'static/assets/sprites/goBananasUi');
const symbols = path.join(root, 'static/assets/sprites/goBananasSymbolsV3');
fs.mkdirSync(out, { recursive: true });
const save = (name, svg, width) => {
	fs.writeFileSync(path.join(out, name), new Resvg(svg, { fitTo: { mode: 'width', value: width } }).render().asPng());
	console.log(name);
};
const image = (name, x, y, size, opacity = 1) => {
	const uri = fs.readFileSync(path.join(symbols, `${name}.png`)).toString('base64');
	return `<image href="data:image/png;base64,${uri}" x="${x}" y="${y}" width="${size}" height="${size}" opacity="${opacity}"/>`;
};
const defs = `<defs>
 <linearGradient id="lacquer" x2="0" y2="1"><stop stop-color="#263944"/><stop offset=".28" stop-color="#15252e"/><stop offset="1" stop-color="#081219"/></linearGradient>
 <linearGradient id="edge" x2="0" y2="1"><stop stop-color="#f4dfa5"/><stop offset=".5" stop-color="#a87932"/><stop offset="1" stop-color="#493316"/></linearGradient>
 <linearGradient id="crimson" x2="0" y2="1"><stop stop-color="#d8423f"/><stop offset="1" stop-color="#641a27"/></linearGradient>
 <radialGradient id="moon"><stop stop-color="#d7e4e4"/><stop offset=".7" stop-color="#7895a0"/><stop offset="1" stop-color="#7895a0" stop-opacity="0"/></radialGradient>
 <pattern id="weave" width="18" height="18" patternUnits="userSpaceOnUse"><path d="M0 18L18 0M-5 5L5 -5M13 23L23 13" stroke="#70828b" opacity=".11" stroke-width="2"/></pattern>
 </defs>`;
const shuriken = (x,y,s,fill='#c7d1ce') => `<g transform="translate(${x} ${y}) scale(${s})"><path d="M0 -40L10 -12 38 -30 23 -3 43 10 13 11 20 41 -5 22 -28 36 -18 6 -43 -8 -12 -12Z" fill="${fill}" stroke="#17242a" stroke-width="3"/><circle r="7" fill="#0d1b24" stroke="#e8c16e" stroke-width="3"/></g>`;

const ticker = `<svg xmlns="http://www.w3.org/2000/svg" width="652" height="146" viewBox="0 0 652 146">${defs}
 <rect x="5" y="5" width="642" height="136" rx="21" fill="url(#lacquer)" stroke="#060c12" stroke-width="6"/>
 <rect x="8" y="8" width="636" height="130" rx="19" fill="url(#weave)"/>
 <rect x="13" y="13" width="626" height="120" rx="14" fill="none" stroke="url(#edge)" stroke-width="5"/>
 <path d="M32 28H620M32 118H620" stroke="#e7c982" opacity=".3" stroke-width="2"/>
 <path d="M25 31v84M627 31v84" stroke="#a52831" stroke-width="5"/>
 ${[27,625].flatMap(x=>[30,116].map(y=>`<circle cx="${x}" cy="${y}" r="5" fill="#b99a61" stroke="#20190d" stroke-width="2"/>`)).join('')}
 </svg>`;
save('ticker_plate.png', ticker, 652);

const buy = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="640" viewBox="0 0 640 640">${defs}
 <rect x="10" y="10" width="620" height="620" rx="66" fill="url(#lacquer)" stroke="#060c12" stroke-width="9"/>
 <rect x="18" y="18" width="604" height="604" rx="57" fill="url(#weave)"/>
 <rect x="23" y="23" width="594" height="594" rx="53" fill="none" stroke="url(#edge)" stroke-width="10"/>
 <rect x="40" y="40" width="560" height="560" rx="39" fill="none" stroke="#bb3039" stroke-width="3"/>
 <path d="M100 235Q320 270 540 235M105 476Q320 450 535 476" fill="none" stroke="#e4c374" opacity=".5" stroke-width="3"/>
 ${shuriken(320,148,1.7)}
 <path d="M270 218h100" stroke="url(#crimson)" stroke-width="7" stroke-linecap="round"/>
 ${[76,564].flatMap(x=>[76,564].map(y=>`<circle cx="${x}" cy="${y}" r="9" fill="#bb9255" stroke="#20190d" stroke-width="3"/>`)).join('')}
 </svg>`;
save('buybonus_plate.png', buy, 640);

// Additive hover layer: only the crest, lacquer hairline and four glints light
// up. Transparent everywhere else, so no pale square covers the label.
const buyLit = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="640" viewBox="0 0 640 640">
<defs><radialGradient id="halo"><stop stop-color="#fff2b0" stop-opacity=".65"/><stop offset=".45" stop-color="#d84e4e" stop-opacity=".28"/><stop offset="1" stop-color="#d84e4e" stop-opacity="0"/></radialGradient></defs>
<circle cx="320" cy="148" r="145" fill="url(#halo)"/>
<path d="M320 72L337 126 391 91 364 143 408 165 348 166 358 215 312 184 267 205 283 154 232 138 294 126Z" fill="none" stroke="#ffe9aa" stroke-width="7" opacity=".8"/>
<rect x="40" y="40" width="560" height="560" rx="39" fill="none" stroke="#e3484b" stroke-width="4" opacity=".62"/>
<path d="M103 234Q320 267 537 234M108 476Q320 450 532 476" fill="none" stroke="#ffe3a0" stroke-width="4" opacity=".5"/>
${[76,564].flatMap(x=>[76,564].map(y=>`<path d="M${x-16} ${y}h32M${x} ${y-16}v32" stroke="#fff0b4" stroke-width="4" opacity=".8"/>`)).join('')}
</svg>`;
save('buybonus_lit.png', buyLit, 640);

const specs = [
 { name:'holdandspin', accent:'#7ec2a6', count:0, motif: image('p',230,93,230)+image('p',75,185,145,.88)+image('p',485,188,145,.88) },
 { name:'bonus100', accent:'#d9b56b', count:1, motif: image('m',250,86,210)+image('h1_split',432,196,138,.94) },
 { name:'bonus200', accent:'#e09b5d', count:2, motif: image('m',103,86,185)+image('m',418,86,185)+image('h2_split',285,210,150,.95) },
 { name:'bonus300', accent:'#db6055', count:3, motif: image('m',40,116,164)+image('m',278,68,190)+image('m',516,116,164) },
];
for (const s of specs) {
	const scene = `<svg xmlns="http://www.w3.org/2000/svg" width="720" height="400" viewBox="0 0 720 400">${defs}
 <rect width="720" height="400" fill="url(#lacquer)"/><rect width="720" height="400" fill="url(#weave)"/>
 <circle cx="515" cy="110" r="125" fill="url(#moon)" opacity=".75"/>
 <path d="M0 260Q140 112 268 266Q370 153 470 270Q580 120 720 252V400H0Z" fill="#0c1d25"/>
 <path d="M0 320Q145 208 255 322Q390 224 515 326Q620 230 720 312V400H0Z" fill="#081117"/>
 <path d="M27 280V70h16v210M-6 72h140v15H-6M18 100h96v10H18M682 280V70h16v210M606 72h140v15H606M625 100h96v10h-96" fill="#3b2329" stroke="#a67444" stroke-width="3"/>
 <ellipse cx="360" cy="270" rx="280" ry="100" fill="${s.accent}" opacity=".13"/>
 ${s.motif}
 <rect x="0" y="0" width="720" height="400" fill="none" stroke="url(#edge)" stroke-width="9"/>
 <path d="M0 390H720" stroke="#ae3038" stroke-width="10"/>
 </svg>`;
	save(`buy_scene_${s.name}.png`, scene, 720);
}
