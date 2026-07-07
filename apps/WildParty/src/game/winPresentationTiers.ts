import type { WinLevelData } from './winLevelMap';

// Shared tier-escalation config for the "big win" celebration spine (used by
// both Win.svelte, for in-spin wins, and FreeSpinOutro.svelte, for the
// free-spins-round total) so the two presentations stay in lockstep instead
// of drifting apart as separately-tuned copies.

// escalating "how big does this FEEL" multiplier — same shake/flash/BigWinFx
// logic for every big-win tier, just scaled up as the tier climbs. Widened
// range (0.8 -> 2.0) plus toning big DOWN below the old baseline of 1, so the
// low and high ends read as clearly different, not just +70%.
export const WIN_TIER_INTENSITY: Partial<Record<WinLevelData['alias'], number>> = {
	big: 0.8,
	superwin: 1.0,
	mega: 1.3,
	epic: 1.6,
	max: 2.0,
};

// marquee starts at mega (not just epic/max) so there's a 3-step ramp
// (sparse/slow -> denser/faster) instead of a hard on/off split
export const WIN_TIER_MARQUEE: Partial<Record<WinLevelData['alias'], { count: number; speed: number }>> = {
	mega: { count: 14, speed: 0.7 },
	epic: { count: 20, speed: 1 },
	max: { count: 26, speed: 1.3 },
};

// higher tiers linger noticeably longer on screen — an easy-to-perceive
// difference that doesn't rely on subtle particle/shake magnitude changes
export const WIN_TIER_LINGER_MS: Partial<Record<WinLevelData['alias'], number>> = {
	big: 1000,
	superwin: 1200,
	mega: 1500,
	epic: 1850,
	max: 2200,
};
