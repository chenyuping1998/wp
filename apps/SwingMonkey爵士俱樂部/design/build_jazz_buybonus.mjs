// Swing Monkey's Buy Bonus is a little vinyl record from the club booth.
// Keep the centre clear for the localized Pixi label; hover changes the
// record's printed ink rather than putting a glow or another panel over it.
// Usage: node design/build_jazz_buybonus.mjs E:/stake/tools/gen
import { createRequire } from 'node:module';
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const toolsDir = process.argv[2];
if (!toolsDir) throw new Error('Pass the directory containing @resvg/resvg-js');
const require = createRequire(path.join(toolsDir, 'noop.js'));
const { Resvg } = require('@resvg/resvg-js');
const out = fileURLToPath(new URL('../static/assets/sprites/sushiUi/', import.meta.url));

function svg(hover) {
  const red = hover ? '#e9a455' : '#d9342b';
  const paper = hover ? '#fff4d9' : '#f8eac8';
  const grooves = [258, 274, 290, 306].map((r, i) =>
    `<circle cx="400" cy="400" r="${r}" fill="none" stroke="${i % 2 ? '#766961' : '#a79680'}" stroke-width="${i === 0 ? 5 : 3}" opacity="${hover ? .85 : .63}"/>`
  ).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800">
    <circle cx="400" cy="400" r="324" fill="#161412" stroke="${paper}" stroke-width="12"/>
    <circle cx="400" cy="400" r="313" fill="#26211f" stroke="${red}" stroke-width="18"/>
    ${grooves}
    <circle cx="400" cy="400" r="239" fill="#171514" stroke="${paper}" stroke-width="7"/>
    <circle cx="400" cy="400" r="213" fill="${red}" stroke="#161412" stroke-width="12"/>
    <circle cx="400" cy="400" r="184" fill="${paper}" stroke="#161412" stroke-width="9"/>
    <path d="M166 407 q-18 -50 11 -86 M633 393 q18 50 -11 86" fill="none" stroke="${paper}" stroke-width="9" stroke-linecap="round"/>
  </svg>`;
}
for (const [name, hover] of [['buybonus_jazz.png', false], ['buybonus_jazz_lit.png', true]]) {
  const png = new Resvg(svg(hover), { fitTo: { mode: 'width', value: 800 } }).render().asPng();
  writeFileSync(path.join(out, name), png);
  console.log(name);
}
