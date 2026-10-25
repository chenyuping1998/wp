// Where the motion kit and the two Spine runtimes live.
//
// spine-generator (E:/stake/spine-generator, override with SPINE_MOTION_KIT) compiles and checks motion on the
// Spine 4.3 runtime it ships; the games play spine-core 4.2.x, which pnpm keeps in wp/node_modules (override with
// SPINE_CORE_42 = path to its dist/index.js). Same convention as GoBananinja's design/spine43/kit.mjs.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const HERE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const WP = path.resolve(HERE, '../..');
export const KIT = process.env.SPINE_MOTION_KIT ?? 'E:/stake/spine-generator';

const url = (p: string) => pathToFileURL(p).href;
export const kitModule = (file: string) => import(url(path.join(KIT, 'src', file)));
export const core43 = () => import(url(path.join(KIT, 'node_modules/@esotericsoftware/spine-core/dist/index.js')));

export function core42Path(): string {
  if (process.env.SPINE_CORE_42) return process.env.SPINE_CORE_42;
  const store = path.join(WP, 'node_modules/.pnpm');
  const dir = fs.existsSync(store) ? fs.readdirSync(store).filter((d) => d.startsWith('@esotericsoftware+spine-core@4.2.')).sort().pop() : undefined;
  if (!dir) throw new Error('找不到 spine-core 4.2（wp/node_modules/.pnpm）；先在 wp 跑 pnpm install，或設 SPINE_CORE_42');
  return path.join(store, dir, 'node_modules/@esotericsoftware/spine-core/dist/index.js');
}
export const core42 = () => import(url(core42Path()));
export const core42Version = () => /spine-core@(4\.2\.\d+)/.exec(core42Path().replace(/\\/g, '/'))?.[1] ?? '4.2';

export function checkKit() {
  if (!fs.existsSync(path.join(KIT, 'src/recipe.ts'))) throw new Error(`找不到 spine-generator：${KIT}（設 SPINE_MOTION_KIT）`);
}
