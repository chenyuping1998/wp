// @ts-nocheck -- this standalone Node gate runs outside the browser TS config.
// The live cast now uses Spine 4.3. Gate its actual weighted meshes and mixing.
import './check_spine_motion_cast.mjs';
// Retain the legacy rig checks as regression coverage for the source delivery.
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const design = path.dirname(fileURLToPath(import.meta.url));
const app = path.dirname(design);
// Legacy layers moved out of static/ on 10-27 (they no longer ship).
const legacy = path.join(app, 'design/_legacy_assets/castLayers_pre_v5_20261027');
for (const variant of fs.existsSync(legacy) ? ['base', 'feature', 'kingpin'] : []) {
  const result = spawnSync(process.execPath, [
    path.join(design, 'check_layered_cast.mjs'),
    '--manifest', path.join(legacy, variant, 'layers.manifest.json'),
    '--motion', path.join(app, 'src/game/castMotion.ts'),
    '--tiers', path.join(app, 'src/game/layeredCastMotion.ts') + '#LAYERED_TIERS',
    '--state', '{"pose":"layered","rest":{}}', // crossed-arm bind pose
  ], { cwd: app, stdio: 'inherit' });
  if (result.status !== 0) {
    console.error(`Turf layered cast failed in ${variant}`);
    process.exit(result.status || 1);
  }
}
