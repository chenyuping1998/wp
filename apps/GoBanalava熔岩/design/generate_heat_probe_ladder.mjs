// Five small probe icons used by the free-spin surge ladder.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(path.join(root, '../../../tools/gen/noop.js'));
const { Resvg } = require('@resvg/resvg-js');
const out = path.join(root, 'static/assets/sprites/goBananasUi');

for (const lit of [true, false]) {
  const glow = lit ? '#ff9a2e' : '#34353a';
  const body = lit ? '#b9521e' : '#23262b';
  const metal = lit ? '#ffc47b' : '#55565d';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="112" height="192" viewBox="0 0 112 192">
    <defs><linearGradient id="shaft" x1="0" y1="0" x2="1" y2="0"><stop stop-color="#15171b"/>
    <stop offset=".5" stop-color="${body}"/><stop offset="1" stop-color="#111317"/></linearGradient>
    <radialGradient id="core"><stop stop-color="${lit ? '#ffe69a' : '#777879'}"/>
    <stop offset=".42" stop-color="${glow}"/><stop offset="1" stop-color="${body}"/></radialGradient></defs>
    <path d="M56 5 L72 31 L65 46 L47 46 L40 31 Z" fill="${metal}" stroke="#121419" stroke-width="5"/>
    <path d="M42 38 L70 38 L78 152 Q79 170 63 177 L49 177 Q33 170 34 152 Z" fill="url(#shaft)"
      stroke="#111217" stroke-width="6"/>
    <rect x="38" y="76" width="36" height="34" rx="10" fill="url(#core)" stroke="${metal}" stroke-width="5"/>
    <path d="M38 117 L74 117 M38 130 L74 130" stroke="${metal}" stroke-width="5" opacity=".8"/>
    <path d="M43 151 L69 151" stroke="${metal}" stroke-width="7" stroke-linecap="round"/>
  </svg>`;
  const name = lit ? 'ladder_stick_lit.png' : 'ladder_stick_off.png';
  fs.writeFileSync(path.join(out, name), new Resvg(svg).render().asPng());
}
console.log('Wrote heat-probe ladder icons');
