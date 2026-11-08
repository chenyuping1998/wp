import fs from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire('E:/stake/tools/gen/');
const { Resvg } = require('@resvg/resvg-js');
import { ICONS } from './icons.mjs';
const INK = '#0a0804', GOLD = '#ecc254';
const shapeSvg = (sh) => sh.c ? `<circle cx="${sh.c[0]}" cy="${sh.c[1]}" r="${sh.c[2]}" fill="${sh.fill === 'ink' ? INK : GOLD}"/>`
  : sh.s ? `<path d="${sh.s}" fill="none" stroke="${sh.fill === 'ink' ? INK : GOLD}" stroke-width="${sh.w}" stroke-linecap="round" stroke-linejoin="round"/>`
  : `<path d="${sh.d}" fill="${sh.fill === 'ink' ? INK : GOLD}"/>`;
// the tile as SplitBar draws it: gold rounded square, 6px ink border, inner hairline; glyph at 0.72 of the tile height
const tile = (name, x) => `<g transform="translate(${x} 0)"><rect x="3" y="3" width="168" height="170" rx="22" fill="${GOLD}" stroke="${INK}" stroke-width="6"/><rect x="12" y="12" width="150" height="152" rx="14" fill="none" stroke="${INK}" stroke-opacity=".35" stroke-width="2"/><g transform="translate(87 88) scale(${172 * 0.72 / 100})">${ICONS[name].map(shapeSvg).join('')}</g></g>`;
const names = Object.keys(ICONS);
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${names.length * 190}" height="176" viewBox="0 0 ${names.length * 190} 176"><rect width="100%" height="100%" fill="#3a3f44"/>${names.map((n, i) => tile(n, i * 190 + 8)).join('')}</svg>`;
fs.writeFileSync('sheet.svg', svg);
fs.writeFileSync('sheet_big.png', new Resvg(svg, { fitTo: { mode: 'width', value: names.length * 190 * 2 } }).render().asPng());
fs.writeFileSync('sheet_small.png', new Resvg(svg, { fitTo: { mode: 'width', value: names.length * 64 } }).render().asPng());
console.log('ok');
