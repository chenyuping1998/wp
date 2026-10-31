// Offline frames of src/game/bgAlive.ts over a plate, for a contact sheet:
//   node design/bg_alive/preview.mjs <base|feature> <t,t,...> out.json
// then python -I design/bg_alive/render.py out.json out.png
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const here = path.dirname(fileURLToPath(import.meta.url));
const { aliveSprites } = await import(pathToFileURL(path.resolve(here, '../../src/game/bgAlive.ts')).href);
const [scene, ts, out] = process.argv.slice(2);
fs.writeFileSync(out, JSON.stringify({ scene, frames: ts.split(',').map(Number).map((t) => ({ t, sprites: aliveSprites(scene, t, 0) })) }));
