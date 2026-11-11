// @ts-nocheck — standalone Node design guard, executed by the build.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
// The crossed-arms FG layers no longer ship (live cast = v5 Spine); they were moved out of static/ on 10-27.
const legacy=path.join(root,'design/_legacy_assets/castLayers_pre_v5_20261027');
if(!fs.existsSync(path.join(legacy,'fg'))){console.log('check_fg_cast: legacy FG layers not present, skipped');process.exit(0);}
const delivery=path.join(root,'design/_incoming/street_cast_crossed_v2/fg');
const source=JSON.parse(fs.readFileSync(path.join(delivery,'layers.manifest.json')));
const runtime=JSON.parse(fs.readFileSync(path.join(legacy,'fg/layers.manifest.json')));
assert.deepEqual(runtime.order,source.order);
for (const part of runtime.layers) {
 const original=source.layers.find(p=>p.name===part.name);
 assert.deepEqual(part.rig,original.rig,'production geometry must match the measured rig');
 const png=fs.readFileSync(path.join(legacy,'fg',part.texture));
 assert.deepEqual([png.readUInt32BE(16),png.readUInt32BE(20)],part.crop.slice(2),'crop UV dimensions match the texture');
}
process.argv.push('--manifest',path.join(delivery,'layers.manifest.json'),'--motion',path.join(root,'src/game/castMotion.ts'),'--tiers',path.join(root,'src/game/layeredCastMotion.ts#KINGPIN_TIERS'),'--state','{"pose":"layered","rest":{}}'); // rest = CastFigureMesh FG_REST
await import('./lib_check_fg_layered_cast.mjs');
