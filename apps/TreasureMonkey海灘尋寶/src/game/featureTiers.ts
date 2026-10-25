/**
 * The three free-spin tiers, in one place.
 *
 * Two screens describe the same three features and they must not disagree: the
 * buy menu (betModeMeta.ts, where a player pays for one) and the splash shown as
 * a feature opens (FreeSpinIntro.svelte, where a player has just won one). Until
 * this file existed only the buy menu had the copy, so the splash could only
 * announce a number — a player who triggered BEACH SWEEP with three Scatters was
 * never told what BEACH SWEEP was.
 *
 * Keyed twice on purpose, because the two halves of the game name these tiers
 * differently and neither name is wrong:
 *
 *   `key`   the maths mode (bonus / bonus_hits / bonus_epic), which is what the
 *           buy menu and config.betModes use
 *   `tier`  the book event's own value (soldier / capo / don), which is what
 *           stateGame.bonusTier carries
 *
 * The mapping between them is exactly this table, and it is the only place it is
 * written down.
 */

import type { BonusTier } from './typesBookEvent';

export type FeatureTier = {
	key: 'bonus' | 'bonus_hits' | 'bonus_epic';
	tier: BonusTier;
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
	/** The drawn wordmark for the feature splash (design/source/splash/). */
	titleKey: string;
};

export const FEATURE_TIERS: FeatureTier[] = [
	{
		key: 'bonus',
		tier: 'soldier',
		mode: 'BONUS',
		title: 'BEACH SWEEP',
		scatters: 3,
		summary:
			'10 free spins with one Dig Zone on the grid from the start. All Frames are sticky for the whole feature and are refilled with a new multiplier between spins.',
		splash:
			'ONE DIG ZONE IS ALREADY ON THE GRID. EVERY FRAME STAYS FOR THE WHOLE FEATURE AND IS REFILLED WITH A NEW MULTIPLIER BETWEEN SPINS.',
		accent: 0xf3d397,
		titleKey: 'hmTitleSoldier',
	},
	{
		key: 'bonus_hits',
		tier: 'capo',
		mode: 'BONUS_HITS',
		title: 'HIDDEN COVE',
		scatters: 4,
		summary:
			'10 free spins starting with three sticky Dig Zones. Frame values persist, and any Frame that takes part in a win doubles before the next spin.',
		splash:
			'THREE STICKY DIG ZONES TO START. ANY FRAME THAT TAKES PART IN A WIN DOUBLES ITS VALUE BEFORE THE NEXT SPIN.',
		accent: 0xfff3d2,
		titleKey: 'hmTitleCapo',
	},
	{
		key: 'bonus_epic',
		tier: 'don',
		mode: 'BONUS_EPIC',
		title: 'LOST LAGOON',
		scatters: 5,
		summary:
			'10 free spins starting with three sticky Dig Zones, keeping the doubling rule, and every single spin is guaranteed at least one Detector Sweep — so at least one full reel of Wilds lands on every spin of the feature.',
		splash:
			'THREE STICKY DIG ZONES, WINNING FRAMES STILL DOUBLE, AND EVERY SPIN IS GUARANTEED AT LEAST ONE DETECTOR SWEEP.',
		// Was 0xc1272d — the exact signal red ART_BRIEF.md §0 reserves for the
		// Detector Sweep wild ONLY ("別的地方一律不准用這個紅"), found here 2026-09-09
		// colouring this tier's name on the free-spin splash. Guaranteeing a
		// Detector Sweep every spin doesn't earn an exception; a second thing wearing
		// the alarm colour is exactly what breaks the "red always means Tommy
		// Gun" read. Escalates the two lower tiers' gold ladder (0xf3d397 main →
		// 0xfff3d2 bright) one step further into bone white — the top tier
		// reading as "past gold" rather than borrowing the one colour that has
		// to stay singular.
		accent: 0xfff8e7,
		titleKey: 'hmTitleDon',
	},
];

export const tierByBonusTier = (tier: string | null): FeatureTier | null =>
	FEATURE_TIERS.find((entry) => entry.tier === tier) ?? null;
