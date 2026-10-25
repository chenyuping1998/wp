import config from './config';

/** Width per Dynamite before the current spin's Dynamites are collected. */
export const startingBlastLevel = (mode: string): number => {
	const tier = Object.entries(config.betModes).find(([key]) => key === mode.toLowerCase())?.[1];
	const banked = tier && 'start_banked' in tier ? tier.start_banked : 0;
	return 1 + Object.values(config.blastLadder).filter((needed) => banked >= needed).length;
};

export const BLAST_PROGRESSION =
	'Dynamites are collected before detonation. Reaching a meter threshold widens every Dynamite in that same spin. Multiple Dynamites combine their coverage, up to all five reels.';
