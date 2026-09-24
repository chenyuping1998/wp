/**
 * Every tier's `titleKey` must exist in the asset registry.
 *
 * check_sprite_keys.mjs reads `key="..."` literals out of the templates and
 * check_assets_exist.mjs reads `src:` paths out of assets.ts. Neither can see
 * FreeSpinIntro's `key={tier.titleKey}`, because the value arrives through a
 * variable — so when the tiers were renamed neon_nights/sunset_hits/ocean_drive
 * -> soldier/capo/don, featureTiers.ts started asking for three keys that did
 * not exist, the new wordmarks sat unregistered on disk, and all the guards
 * stayed green. The feature splash would have opened with no title on it.
 *
 * This closes that one hole rather than trying to solve computed keys in
 * general: the tier table is the only place in this game that addresses an
 * asset by a value instead of a literal, and it is the place a rename touches.
 *
 * Run: node design/check_feature_titles.mjs
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const SRC = join(HERE, '..', 'src', 'game');

const tiers = readFileSync(join(SRC, 'featureTiers.ts'), 'utf8');
const assets = readFileSync(join(SRC, 'assets.ts'), 'utf8');

const wanted = [...tiers.matchAll(/titleKey:\s*'([^']+)'/g)].map((m) => m[1]);
const declared = new Set([...assets.matchAll(/^\t([A-Za-z0-9_]+):\s*\{/gm)].map((m) => m[1]));

if (wanted.length === 0) {
	console.error('FAIL: no titleKey entries found in featureTiers.ts — has the table moved?');
	process.exit(1);
}

const missing = wanted.filter((key) => !declared.has(key));
if (missing.length > 0) {
	console.error(`FAIL: ${missing.length} feature title key(s) are not in the asset registry:`);
	for (const key of missing) console.error(`  ${key}  (featureTiers.ts asks for it; assets.ts does not define it)`);
	process.exit(1);
}

console.log(`OK: ${wanted.length} feature title keys resolve (${wanted.join(', ')})`);
