import { LEVEL_PARTICLE_COIN_MAP } from 'constants-shared/particleCoin';

/**
 * Per-win-level tuning for the banana spray, local to this game.
 *
 * Why not edit the shared LEVEL_PARTICLE_COIN_MAP: it lives in
 * packages/constants-shared and every other game in the repo reads it. Widening
 * the density curve there would change WildParty and EmberForge too, for a
 * decision that is about this game's art. Overriding locally keeps that blast
 * radius at zero.
 *
 * `frequency` is SECONDS BETWEEN EMISSIONS, so lower means more. The shared map
 * only moves it from 0.2 to 0.1 across six tiers — roughly 5 to 10 bananas a
 * second, a doubling, while speed over the same range quadruples. The result is
 * that a max win reads as *faster* than a substantial one but barely as *more*,
 * which is the opposite of what a top-tier win should look like.
 *
 * The curve below stretches density instead: about 4 a second at the bottom,
 * about 26 at the top. The bottom tiers are deliberately thinner than the shared
 * map — a "substantial" win spraying almost as hard as a max win is what flattened
 * the ladder in the first place.
 *
 * Ceiling check: the base fountain config caps at maxParticles 100 with a 6s
 * particle lifetime, so the sustainable rate is 100/6 ≈ 16/s. The top three tiers
 * are deliberately above that — they run in short bursts during a win count-up,
 * not indefinitely, and hitting the cap there simply means the screen stays full,
 * which for a max win is the intent. Raise maxParticles rather than the rate if
 * the top end ever needs to last longer.
 */
export const LEVEL_PARTICLE_BANANA_MAP = {
	...LEVEL_PARTICLE_COIN_MAP,
	substantial: {
		...LEVEL_PARTICLE_COIN_MAP.substantial,
		frequency: 0.26, // ~4/s
	},
	big: {
		...LEVEL_PARTICLE_COIN_MAP.big,
		frequency: 0.17, // ~6/s
	},
	superwin: {
		...LEVEL_PARTICLE_COIN_MAP.superwin,
		frequency: 0.11, // ~9/s
	},
	mega: {
		...LEVEL_PARTICLE_COIN_MAP.mega,
		frequency: 0.075, // ~13/s
	},
	epic: {
		...LEVEL_PARTICLE_COIN_MAP.epic,
		frequency: 0.052, // ~19/s
	},
	max: {
		...LEVEL_PARTICLE_COIN_MAP.max,
		frequency: 0.038, // ~26/s
	},
} as const;
