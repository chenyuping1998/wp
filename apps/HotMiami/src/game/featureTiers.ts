/**
 * The three free-spin tiers, in one place.
 *
 * Two screens describe the same three features and they must not disagree: the
 * buy menu (betModeMeta.ts, where a player pays for one) and the splash shown as
 * a feature opens (FreeSpinIntro.svelte, where a player has just won one). Until
 * this file existed only the buy menu had the copy, so the splash could only
 * announce a number — a player who triggered NEON NIGHTS with three Scatters was
 * never told what NEON NIGHTS was.
 *
 * Keyed twice on purpose, because the two halves of the game name these tiers
 * differently and neither name is wrong:
 *
 *   `key`   the maths mode (bonus / bonus_hits / bonus_epic), which is what the
 *           buy menu and config.betModes use
 *   `tier`  the book event's own value (neon_nights / sunset_hits / ocean_drive),
 *           which is what stateGame.bonusTier carries
 *
 * The mapping between them is exactly this table, and it is the only place it is
 * written down.
 */

export type FeatureTier = {
	key: 'bonus' | 'bonus_hits' | 'bonus_epic';
	tier: 'neon_nights' | 'sunset_hits' | 'ocean_drive';
	mode: string;
	title: string;
	scatters: number;
	/** Long form, for the buy dialog. Complete sentences. */
	summary: string;
	/**
	 * Short form, for the splash panel that opens the feature.
	 *
	 * A separate string rather than a truncation of `summary`: the player reading
	 * this one has already won and wants to know what is about to happen, in the
	 * two seconds before they tap. The reference's own feature splashes
	 * (Hacksaw's Miami Mayhem, `*_body`) run to about 40 words in a 690x380 box;
	 * these are shorter still because ours share the screen with the plaque.
	 */
	splash: string;
	/** The tier's own accent, used for its name on the splash. */
	accent: number;
};

export const FEATURE_TIERS: FeatureTier[] = [
	{
		key: 'bonus',
		tier: 'neon_nights',
		mode: 'BONUS',
		title: 'NEON NIGHTS',
		scatters: 3,
		summary:
			'10 free spins with one Neon Frame on the grid from the start. All Frames are sticky for the whole feature and are refilled with a new multiplier between spins.',
		splash:
			'ONE NEON FRAME IS ALREADY ON THE GRID. EVERY FRAME STAYS FOR THE WHOLE FEATURE AND IS REFILLED WITH A NEW MULTIPLIER BETWEEN SPINS.',
		accent: 0xff2e88,
	},
	{
		key: 'bonus_hits',
		tier: 'sunset_hits',
		mode: 'BONUS_HITS',
		title: 'SUNSET HITS',
		scatters: 4,
		summary:
			'10 free spins starting with three sticky Neon Frames. Frame values persist, and any Frame that takes part in a win doubles before the next spin.',
		splash:
			'THREE STICKY NEON FRAMES TO START. ANY FRAME THAT TAKES PART IN A WIN DOUBLES ITS VALUE BEFORE THE NEXT SPIN.',
		accent: 0xffa14a,
	},
	{
		key: 'bonus_epic',
		tier: 'ocean_drive',
		mode: 'BONUS_EPIC',
		title: 'OCEAN DRIVE',
		scatters: 5,
		summary:
			'10 free spins with every position framed from the start, keeping the doubling rule. Collector and Scatter symbols do not appear.',
		splash:
			'EVERY POSITION IS FRAMED FROM THE FIRST SPIN, AND WINNING FRAMES STILL DOUBLE. COLLECTOR AND SCATTER DO NOT APPEAR.',
		accent: 0x00e5ff,
	},
];

export const tierByBonusTier = (tier: string | null): FeatureTier | null =>
	FEATURE_TIERS.find((entry) => entry.tier === tier) ?? null;
