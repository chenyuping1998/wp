// @ts-nocheck -- this standalone Node gate runs outside the browser TS config.
// Pose the exact shipped layers with the game's motion table in all three modes.
// check_layered_cast.mjs is the local copy of the character-motion skill gate.
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const design = path.dirname(fileURLToPath(import.meta.url));
const app = path.dirname(design);
for (const variant of ['base', 'feature', 'kingpin']) {
  const result = spawnSync(process.execPath, [
    path.join(design, 'check_layered_cast.mjs'),
    '--manifest', path.join(app, 'static/assets/castLayers/turf', variant, 'layers.manifest.json'),
    '--motion', path.join(app, 'src/game/castMotion.ts'),
    '--tiers', path.join(app, 'src/game/layeredCastMotion.ts') + '#LAYERED_TIERS',
    '--state', '{"pose":"layered"}',
  ], { cwd: app, stdio: 'inherit' });
  if (result.status !== 0) {
    console.error(`Turf layered cast failed in ${variant}`);
    process.exit(result.status || 1);
  }
}
