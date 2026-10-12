// Deterministic low-pay plates: a single letterform system keeps A/K/Q/J/10
// legible at the reel's roughly 140px display size.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(path.join(root, '../../../tools/gen/noop.js'));
const { Resvg } = require('@resvg/resvg-js');
const dir = path.join(root, 'static/assets/sprites/goBanalavaSymbols');
const font = path.join(root, 'static/fonts/TitanOne.ttf');
const letters = [['l1', 'A'], ['l2', 'K'], ['l3', 'Q'], ['l4', 'J'], ['l5', '10']];
// Match the visible cap height, not just the PNG dimensions. Titan One renders
// A/K shorter than Q/J; the two-digit 10 needs a taller, narrower treatment.
const glyphs = {
  A: { size: 680, baseline: 760, width: 1 },
  K: { size: 670, baseline: 750, width: 1 },
  Q: { size: 590, baseline: 690, width: 1 },
  J: { size: 590, baseline: 690, width: 1 },
  '10': { size: 650, baseline: 760, width: .8 },
};

const glyph = (letter) => {
  const { size, baseline, width } = glyphs[letter];
  return `<g transform="translate(512 0) scale(${width} 1) translate(-512 0)">
    <text x="512" y="${baseline}" text-anchor="middle" font-family="Titan One" font-weight="900"
          font-size="${size}" fill="#e3e0d7" stroke="#ede5d3" stroke-width="31"
          paint-order="stroke fill">${letter}</text>
    <text x="512" y="${baseline - 14}" text-anchor="middle" font-family="Titan One" font-weight="900"
          font-size="${size}" fill="#22252a" stroke="#4a4a47" stroke-width="5"
          paint-order="stroke fill">${letter}</text>
  </g>`;
};

const plate = (letter, empty = false) => `
<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <defs>
    <linearGradient id="stone" x1="0" y1="0" x2="1" y2="1">
      <stop stop-color="#b9b3a7"/><stop offset=".48" stop-color="#777770"/>
      <stop offset="1" stop-color="#393b40"/>
    </linearGradient>
    <linearGradient id="face" x1="0" y1="0" x2=".8" y2="1">
      <stop stop-color="#d8d3c7"/><stop offset=".55" stop-color="#a9a8a2"/>
      <stop offset="1" stop-color="#65676b"/>
    </linearGradient>
    <filter id="shadow"><feGaussianBlur stdDeviation="18"/></filter>
  </defs>
  <path d="M165 82 L826 100 L938 175 L926 828 L847 936 L174 927 L85 839 L101 173 Z"
        fill="#080d12" opacity=".58" filter="url(#shadow)"/>
  <path d="M160 82 L827 92 L936 174 L925 827 L846 934 L173 925 L87 837 L100 171 Z"
        fill="url(#stone)" stroke="#1e2329" stroke-width="25" stroke-linejoin="round"/>
  <path d="M172 135 L809 136 L886 198 L882 809 L818 881 L197 879 L140 803 L143 206 Z"
        fill="url(#face)" stroke="#e6ddd1" stroke-width="12" stroke-linejoin="round"/>
  <path d="M140 295 L193 329 L166 478 M817 136 L785 221 L852 263 M222 879 L263 813 L302 846
           M699 881 L760 819 L800 845" fill="none" stroke="#5e5b55" stroke-width="13" opacity=".58"/>
  <path d="M174 736 L241 714 L297 752 M722 276 L773 290 L805 256" fill="none"
        stroke="#f9a84b" stroke-width="6" opacity=".75"/>
  ${empty ? '<path d="M320 584 L495 410 L665 576" fill="none" stroke="#282b30" stroke-width="24" opacity=".48"/>' : glyph(letter)}
</svg>`;

for (const [name, letter] of [...letters, ['x', '']]) {
  const svg = plate(letter, name === 'x');
  const png = new Resvg(svg, { font: { fontFiles: [font], loadSystemFonts: false } }).render().asPng();
  fs.writeFileSync(path.join(dir, `${name}.png`), png);
}
console.log('Wrote L1-L5 and X volcanic stone plates');
