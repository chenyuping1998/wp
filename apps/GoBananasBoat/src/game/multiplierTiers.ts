// THE FIVE MULTIPLIER TIERS, in one place.
//
// Used by the wheel that picks the round's multiplier (MultiplierPick) and by
// the badge that states it for the rest of the round (FreeSpinMultiplier). They
// have to agree: the plate a player watched land and the badge in the corner are
// the same fact, and a badge in a different colour reads as a different one.
//
// The rims are THIS GAME'S WIN-TIER RAMP, the one the big-win plaques run
// (Win.svelte, TIER_FX): brass, gold, amber, then the hot red the top tier ends
// on. Five tiers, five multipliers. x1 is deliberately COLD — hull steel, the
// colour of the furniture — because it is the result that changes nothing and
// should not look like a prize.
//
// Four things escalate, not just the hue, because hue alone is weak while the
// strip is moving: the rim brightens AND thickens, an inner glow builds inside
// the plate, and the top three gain a halo that spills outside it.
//
// THE FACES STAY DARK, which is what keeps the number readable. Putting the tier
// colour in the face would make x5 a bright amber square under gold type;
// measured, these faces hold the gold number at 10.5:1 or better, while their
// own rims sit 3.6-10.6:1 against them.
export type MultiplierTier = {
	rim: number;
	face: number;
	width: number;
	inner: number;
	halo: number;
};

export const MULTIPLIER_TIERS: MultiplierTier[] = [
	{ rim: 0x5b7a8f, face: 0x16222c, width: 4.5, inner: 0.1, halo: 0 },
	{ rim: 0xd8a334, face: 0x2a2010, width: 5, inner: 0.18, halo: 0 },
	{ rim: 0xffd75e, face: 0x332612, width: 5.5, inner: 0.26, halo: 0.1 },
	{ rim: 0xffa347, face: 0x3a2410, width: 6, inner: 0.34, halo: 0.17 },
	{ rim: 0xff7a4a, face: 0x3c1a0c, width: 7, inner: 0.44, halo: 0.26 },
];

/** the lit edge on the top three tiers — the housing's brass hairline */
export const MULTIPLIER_LIT = 0xffe9a8;

export const tierOf = (multiplier: number) =>
	MULTIPLIER_TIERS[Math.min(MULTIPLIER_TIERS.length, Math.max(1, Math.round(multiplier))) - 1];
