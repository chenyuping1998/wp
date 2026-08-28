<script lang="ts">
	import { stateBet, stateReplay, stateUrlDerived } from 'state-shared';
	import { getContext } from '../game/context';
	import { onMount } from 'svelte';

	const context = getContext();

	// Read once. Everything below is scoped to replay mode — in normal play this
	// component must behave exactly as it always did.
	const isReplay = stateUrlDerived.replay();

	const applyResumeMode = () => {
		if (stateBet.betToResume?.active && stateBet.betToResume.mode) {
			stateBet.activeBetModeKey = stateBet.betToResume.mode;
		}
	};

	onMount(() => {
		applyResumeMode();

		// A replay used to start the instant the canvas appeared, which left the
		// player no chance to see what round was about to run. In replay mode the
		// round now waits behind ReplayIntro's start button; a genuine resumed bet
		// (a real round the player left mid-way) still auto-continues, because
		// that money is already committed.
		if (isReplay) {
			stateReplay.enabled = true;
			stateReplay.round = stateBet.betToResume;
			stateReplay.waiting = true;
			return;
		}

		context.eventEmitter.broadcast({ type: 'resumeBet' });
	});

	// start / replay again
	$effect(() => {
		if (!stateReplay.startRequested) return;
		stateReplay.startRequested = false;

		// Wipe what the previous run left on the board. The resumeGame path never
		// goes through `onNewGameStart`, so without this a replayed feature round
		// would start with the last run's multiplier meter still on screen.
		stateBet.winBookEventAmount = 0;
		context.eventEmitter.broadcast({ type: 'multiplierMeterHide' });

		// resumeGame nulls betToResume out as it starts, so each run re-seeds it
		// from the copy stateReplay is holding.
		stateBet.betToResume = stateReplay.round;
		applyResumeMode();
		context.eventEmitter.broadcast({ type: 'resumeBet' });
	});

	// Track whether a round is playing. The machine stays in 'resumeBet' for the
	// whole presentation — win plaques, free-game outro and all — and only returns
	// to 'idle' once it has played out, so that transition is the end of the round
	// and needs no extra event. The replay button reads `running` to stay dead
	// while the round is in flight.
	//
	// This MUST stay gated on replay mode. Normal play also passes through
	// 'resumeBet' on every launch — the machine is asked to resume, finds no
	// active round, and drops straight back to 'idle' — so an ungated watcher
	// reads that as "the replay just ended".
	//
	// The card is deliberately NOT brought back here: it is shown once, before the
	// first run, and from then on the bar's replay button is the way back in. A
	// panel that covers the board every time the round ends gets in the way of
	// watching it.
	$effect(() => {
		if (!isReplay) return;

		const value = context.stateXstate.value;
		if (value === 'resumeBet') {
			stateReplay.running = true;
		} else if (stateReplay.running && value === 'idle') {
			stateReplay.running = false;
		}
	});
</script>
