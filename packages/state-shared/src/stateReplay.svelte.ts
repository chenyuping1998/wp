import type { BetToResume } from './stateBet.svelte';

// Replay-mode orchestration.
//
// A replay is not a bet: nothing is wagered and no round is ended (see
// handleRequestEndRound's early return), so the same event can be played as many
// times as the player likes. The xstate resumeGame actor clears
// `stateBet.betToResume` the moment it starts, so the round is held here as well
// — that copy is what each re-run restores.
//
// This lives in state-shared rather than in one game because the replay UI in
// components-ui-pixi has to read it. `enabled` is what keeps it inert: a game
// that has not opted in never sets it, so its replay bar looks exactly as it did
// before this existed.
export const stateReplay = $state({
	/** the game has taken over replay playback; without this nothing is shown */
	enabled: false,
	/** the replay round, kept across runs so it can be played again */
	round: null as BetToResume,
	/** the intro card is on screen, waiting for the player to start */
	waiting: false,
	/** a round is playing right now — the replay button is dead while it is */
	running: false,
	/** set by the start button; the game picks this up and runs the round */
	startRequested: false,
});
