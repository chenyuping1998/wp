/**
 * Build gate for the layered MG / FG cast (2026-09-28).
 *
 * For each figure: runs hacksaw-character-motion's check_layered_cast (copied
 * in as design/lib_check_layered_cast.mjs so the build does not depend on a
 * user-scope skill path) against the delivered full-canvas layers in
 * design/cast_parts/, posed by the GAME's castMotion.ts with that figure's
 * own tables from layeredCastMotion.ts. Then re-measures the swept ink with
 * design/measure_cast_envelope.mjs and fails if it leaves the
 * LAYERED_X_ENVELOPE that CastFigureLayered.svelte fits beside the board —
 * a table edit that widens the gesture must update the envelope too.
 */
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { LAYERED_X_ENVELOPE } from '../src/game/layeredCastMotion.ts';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FIGURES = [
	['don', 'design/cast_parts/mg/layers.manifest.json', 'DON_TIERS'],
	['hostess', 'design/cast_parts/fg/layers.manifest.json', 'HOSTESS_TIERS'],
];
let failed = false;
for (const [id, manifest, tiers] of FIGURES) {
	try {
		execFileSync('node', ['design/lib_check_layered_cast.mjs', '--manifest', manifest,
			'--motion', 'src/game/castMotion.ts', '--tiers', `src/game/layeredCastMotion.ts#${tiers}`], { cwd: root, stdio: ['ignore', 'ignore', 'inherit'] });
	} catch {
		console.error(`check_cast_layers: ${id} failed the motion gate (run design/lib_check_layered_cast.mjs by hand for the report)`);
		failed = true;
		continue;
	}
	const env = JSON.parse(execFileSync('node', ['design/measure_cast_envelope.mjs', manifest, `src/game/layeredCastMotion.ts#${tiers}`], { cwd: root }).toString());
	const [lo, hi] = LAYERED_X_ENVELOPE[id];
	if (env.x[0] < lo || env.x[1] > hi) {
		console.error(`check_cast_layers: ${id} sweeps x ${env.x[0]}..${env.x[1]}, outside LAYERED_X_ENVELOPE ${lo}..${hi} — the figure would reach the board. Update the envelope in layeredCastMotion.ts.`);
		failed = true;
	} else console.log(`check_cast_layers ${id} ok (sweep ${env.x[0]}..${env.x[1]} inside ${lo}..${hi})`);
}
if (failed) process.exit(1);
