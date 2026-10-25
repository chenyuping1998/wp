// Reuse stake's measured Iron Jaw presets, with Neon-specific joint mapping.
// Only bone timelines cross the version boundary: the temporary 4.3 skeleton
// contains no art or constraints. The shipped skeleton/meshes stay in 4.1 format.
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { compileRecipe } from '../../../../spine-generator/src/recipe.ts';
import { applyIronPunch } from './adapt_iron_punch.mjs';
import { applyDjScratch } from './adapt_dj_scratch.mjs';
import { applyClubMotion } from './adapt_club_motion.mjs';

export function applyIronIdle(skeleton) {
	const period = 1.99;
	const wave = (bone, channel, amplitude, phase, offset = 0) => ({
		bone, channel, type: 'wave', amplitude, period, peakAt: phase * period, offset,
	});
	const recipe = {
		fps: 60, facing: -1, characterHeight: 884, maxSegment: 0.12,
		// The torso is the upper-body root: moving the hip would drag both feet.
		// Hands have no IK targets, so use restrained joint rotations, not fist offsets.
		roles: { hip: 'torso', head: 'head' },
		animations: ['weave', 'bounce'].map((kind) => ({
			name: `iron_idle_${kind}`, preset: `fighter-idle-${kind}`,
			params: { period, intensity: kind === 'weave' ? 0.55 : 0.38, hair: 'none' },
			tracks: [
				wave('torso', 'scaleX', 0.004, 0.42, 1),
				wave('torso', 'scaleY', 0.009, 0.42, 1),
				wave('armL', 'rotate', 1.3, 0.1),
				wave('armR', 'rotate', 1.1, 0.6),
				wave('armL_fore', 'rotate', 1.5, 0.18),
				wave('armR_fore', 'rotate', 1.3, 0.68),
			],
		})),
	};
	const boneRig = { skeleton: { spine: '4.3.13' }, bones: skeleton.bones, slots: [], skins: [], animations: {} };
	const { json } = compileRecipe(boneRig, recipe);
	skeleton.animations.idle_original ??= structuredClone(skeleton.animations.idle);
	for (const [name, animation] of Object.entries(json.animations)) skeleton.animations[name] = animation;
	skeleton.animations.idle = structuredClone(json.animations.iron_idle_weave);
	applyIronPunch(skeleton);
	applyDjScratch(skeleton);
	applyClubMotion(skeleton);
	return recipe;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === fs.realpathSync(process.argv[1])) {
	const target = new URL('../static/assets/spines/goBananasMonkey/monkey.json', import.meta.url);
	const skeleton = JSON.parse(fs.readFileSync(target, 'utf8'));
	const recipe = applyIronIdle(skeleton);
	fs.writeFileSync(target, JSON.stringify(skeleton, null, 2) + '\n');
	fs.writeFileSync(new URL('./neon_iron_idle.recipe.json', import.meta.url), JSON.stringify(recipe, null, 2) + '\n');
	console.log('Neon: original club idle + secondary groove applied; Iron variants/original idle retained; skeleton format unchanged.');
}
