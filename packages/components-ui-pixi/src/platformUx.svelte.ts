import { uiTheme } from './theme.svelte';

/**
 * Resolves `uiTheme.platformUx` against the runtime kill switch, and holds the
 * one piece of cross-component state the conventions need.
 *
 * See the long note on `platformUx` in theme.svelte.ts for what the conventions
 * are and where they come from. This file only decides whether they are ON.
 */

// Read once at module scope, the same idiom as the `betBarLayout` override in
// UIDefault.svelte: which behaviours are live is settled when the UI mounts, and
// a value that changed mid-session would only produce a game that behaved two
// different ways in one sitting.
const disabledAtRuntime =
	typeof localStorage !== 'undefined' && localStorage.getItem('platformUx') === 'off';

export const platformUx = () => (disabledAtRuntime ? null : uiTheme.platformUx);

// ── The stake-change clock ───────────────────────────────────────────────────
//
// Hacksaw keeps `_lastBetChange` on the UI singleton and every stake change —
// button, hold-repeat, keyboard — writes it; `placeBet()` reads it. Same shape
// here, because the writers (ButtonIncrease, ButtonDecrease, the shortcuts) and
// the reader (ButtonBetProvider) have no other state in common.
let lastBetChangeAt = 0;
export const markBetChanged = () => {
	lastBetChangeAt = Date.now();
};
export const isBetOnCooldown = () => {
	const ux = platformUx();
	if (!ux || ux.betToSpinCooldownMs <= 0) return false;
	return Date.now() - lastBetChangeAt < ux.betToSpinCooldownMs;
};

// ── The idle clock ───────────────────────────────────────────────────────────
//
// Only ever nudges a player who has ALREADY bet at least once. Hacksaw guards
// the same way (`_lastPlacedBet != 0`) and it matters: the nudge is a reminder
// that the game is waiting, which is a different message from an instruction to
// a player who has not started. It is also why the intro card is not covered by
// this — nothing has been played yet.
let lastBetAt = 0;
export const markBetPlaced = () => {
	lastBetAt = Date.now();
};
export const hasEverBet = () => lastBetAt !== 0;
export const idleFor = () => (lastBetAt === 0 ? 0 : Date.now() - lastBetAt);

// ── Hold-to-repeat ───────────────────────────────────────────────────────────
//
// Hacksaw's stake steppers are not click handlers, they are
// `mousedown/touchstart` + a 150ms timer, and the first step runs immediately
// rather than after one interval. That detail is the whole feel of it: a tap
// behaves exactly like a click, and only a HELD press starts repeating.
//
// Here `Button` still fires its own `onpress` on release, so this deliberately
// does NOT step on the leading edge — it would double every tap. It waits one
// interval and then repeats, which lands the same: tap = one step (from
// onpress), hold = one step then one more every interval.
export const createBetRepeat = (step: () => void) => {
	let timer: ReturnType<typeof setInterval> | null = null;

	const stop = () => {
		if (timer === null) return;
		clearInterval(timer);
		timer = null;
	};

	// Stake review, 2026-10-04 (Deadwood Express): "Player must only be able to
	// increase the bet by clicks" — holding + or − walked the stake up or down
	// without a deliberate press per step. Hold-to-repeat is therefore off for
	// every game, whatever `betRepeatMs` its theme still carries; one press is
	// one step.
	const start = () => {
		stop();
	};

	return { start, stop };
};
