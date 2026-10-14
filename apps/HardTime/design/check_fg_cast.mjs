// @ts-nocheck — standalone Node design guard, executed by the build.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const delivery=path.join(root,'design/_incoming/fg');
const source=JSON.parse(fs.readFileSync(path.join(delivery,'layers.manifest.json')));
const runtime=JSON.parse(fs.readFileSync(path.join(root,'static/assets/castLayers/warden/layers.json')));
assert.deepEqual(runtime.order,source.order);
for (const part of runtime.layers) {
 const original=source.layers.find(p=>p.name===part.name);
 assert.deepEqual(part.rig,original.rig,'production geometry must match the measured rig');
 const png=fs.readFileSync(path.join(root,'static/assets/castLayers/warden',part.texture));
 assert.deepEqual([png.readUInt32BE(16),png.readUInt32BE(20)],part.crop.slice(2),'crop UV dimensions match the texture');
}
process.argv.push('--manifest',path.join(delivery,'layers.manifest.json'),'--motion',path.join(root,'src/game/castMotion.ts'),'--tiers',path.join(root,'src/game/layeredCastMotion.ts#WARDEN_TIERS'),'--state','{}');
await import('./lib_check_fg_layered_cast.mjs');
