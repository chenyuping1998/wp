/**
 * The three free-spin tiers, in one place.
 *
 * Two screens describe the same three features and they must not disagree: the
 * buy menu (betModeMeta.ts, where a player pays for one) and the splash shown as
 * a feature opens (FreeSpinIntro.svelte, where a player has just won one). Until
 * this file existed only the buy menu had the copy, so the splash could only
 * announce a number — a player who triggered LOCKDOWN with three Scatters was
 * never told what LOCKDOWN was.
 *
 * Keyed twice on purpose, because the two halves of the game name these tiers
 * differently and neither name is wrong:
 *
 *   `key`   the maths mode (bonus / bonus_hits / bonus_epic), which is what the
 *           buy menu and config.betModes use
 *   `tier`  the book event's own value (lockdown / riot / breakout), which is
 *           what stateGame.bonusTier carries
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
	/**
	 * The drawn wordmark for the feature splash (design/source/splash/).
	 *
	 * Still the `hmTitle*` keys, which are Capo Nostra's SOLDIER / CAPO / THE DON
	 * artwork — the tier NAMES changed with the theme but the art has not been
	 * redrawn yet, so these deliberately point at the wrong pictures rather than
	 * at nothing. Replacing them is part of the art integration pass; the
	 * dead-asset audit must not sign this off as correct just because it renders.
	 */
	titleKey: string;
};

export const FEATURE_TIERS: FeatureTier[] = [
	{
		key: 'bonus',
		tier: 'lockdown',
		mode: 'BONUS',
		title: 'LOCKDOWN',
		scatters: 3,
		summary:
			'8 free spins. Every Searchlight that lands stays lit for the whole feature, so the beams build up spin after spin.',
		splash:
			'8 FREE SPINS. EVERY SEARCHLIGHT STAYS LIT FOR THE WHOLE FEATURE.',
		accent: 0x8e9499,
		titleKey: 'hmTitleLockdown',
	},
	{
		key: 'bonus_hits',
		tier: 'riot',
		mode: 'BONUS_HITS',
		title: 'RIOT',
		scatters: 4,
		summary:
			'8 free spins. The first spin is guaranteed an extra Searchlight, and more of them land than in Lockdown. A beam that reaches a reel already lit doubles every cell the two share.',
		splash:
			'THE FIRST SPIN IS GUARANTEED A SEARCHLIGHT. A SECOND BEAM ON THE SAME REEL DOUBLES WHERE THEY OVERLAP.',
		accent: 0xa98a68,
		titleKey: 'hmTitleRiot',
	},
	{
		key: 'bonus_epic',
		tier: 'breakout',
		mode: 'BONUS_EPIC',
		title: 'BREAKOUT',
		scatters: 5,
		summary:
			'8 free spins. The first spin is guaranteed an extra Searchlight, and beams land more often than in any other tier. With beams sticky for the whole feature, reels are re-lit again and again — and every overlap doubles.',
		splash:
			'THE FIRST SPIN IS GUARANTEED A SEARCHLIGHT, AND BEAMS LAND FASTER THAN ANY OTHER TIER. EVERY OVERLAP DOUBLES.',
		// Was the Tommy Gun's signal red on Capo Nostra, moved to bone white when
		// a second thing wearing the alarm colour was judged to break the "red
		// always means the special wild" read. Hard Time reserves its own signal
		// colour for the searchlight beam (ART_AUDIO_BRIEF.md §0), so the same
		// rule applies and this stays off it.
		accent: 0xe6dfd1,
		titleKey: 'hmTitleBreakout',
	},
];

export const tierByBonusTier = (tier: string | null): FeatureTier | null =>
	FEATURE_TIERS.find((entry) => entry.tier === tier) ?? null;
