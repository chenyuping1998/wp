// The free-game intro/outro plaque: the supplied frame with its black background
// keyed out.
//
// Same problem and same treatment as the win-tier plaques — see keyBackground —
// but no lettering, because the text on this board is live (the spin count
// changes, and the captions are localised into sixteen languages).
//
// Usage: node design/generate_fs_sign.mjs

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { keyBlackBackground } from './keyBackground.mjs';

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(appRoot, 'design/source/triggerFG.png');
const OUT = path.join(appRoot, 'static/assets/sprites/emberForgeFrame/fs_sign.png');

// Interior measured off the source: x 138..1563, y 132..836 of 1706x922. Inset a
// little, because the measurement is the median dark span and runs slightly wide
// of the true stone.
const INTERIOR = { left: 138, right: 1563, top: 132, bottom: 836 };
const INSET = 0.03;
const w = INTERIOR.right - INTERIOR.left;
const h = INTERIOR.bottom - INTERIOR.top;

const { buffer, stats } = keyBlackBackground(fs.readFileSync(SRC), {
	well: {
		left: Math.round(INTERIOR.left + w * INSET),
		right: Math.round(INTERIOR.right - w * INSET),
		top: Math.round(INTERIOR.top + h * INSET),
		bottom: Math.round(INTERIOR.bottom - h * INSET),
	},
	feather: Math.round(h * 0.06),
});

fs.writeFileSync(OUT, buffer);
console.log(
	`fs_sign.png keyed: ${stats.opaquePct.toFixed(0)}% opaque, ${stats.clearPct.toFixed(0)}% clear`,
);
console.log('written to', path.relative(appRoot, OUT));
