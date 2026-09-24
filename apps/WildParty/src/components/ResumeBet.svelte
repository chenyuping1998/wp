<script lang="ts">
	import { stateBet, stateReplay, stateUi, stateUrlDerived } from 'state-shared';
	import { getContext } from '../game/context';
	import { onMount } from 'svelte';

	const context = getContext();

	// Read once. Everything below is scoped to replay mode — in normal play this
	// component must behave exactly as it did before.
	const isReplay = stateUrlDerived.replay();

	const applyResumeMode = () => {
		if (stateBet.betToResume?.active && stateBet.betToResume.mode) {
			stateBet.activeBetModeKey = stateBet.betToResume.mode;
		}
	};

	onMount(() => {
		applyResumeMode();

		// The round is kept so it can be run again. Certification passed the replay
		// itself — the URL loads and plays the right event — and failed only
		// "replay allows replaying the event again after completion", because
		// resumeGame nulls betToResume out as it starts, so after one run there was
		// nothing left to replay and the bar's replay button had no round to give.
		//
		// The first run still starts by itself, which is the behaviour that passed;
		// only the way back in is new. Unlike the sibling Go Bananas there is no
		// intro card here, because nothing was reported about the opening.
		if (isReplay) {
			stateReplay.enabled = true;
			stateReplay.round = stateBet.betToResume;
		}

		context.eventEmitter.broadcast({ type: 'resumeBet' });
	});

	// Replay again.
	$effect(() => {
		if (!stateReplay.startRequested) return;
		stateReplay.startRequested = false;

		// Clear what the previous run left behind. resumeGame does not pass through
		// the normal between-spins reset, so without this a replayed free-spin
		// round opens still showing the last run's spin counter and multiplier, and
		// the win figure from the round that already finished.
		stateBet.winBookEventAmount = 0;
		context.stateGame.gameType = 'basegame';
		context.stateGame.globalMultiplier = 1;
		context.stateGame.scatterCounter = 0;
		stateUi.freeSpinCounterShow = false;
		context.eventEmitter.broadcast({ type: 'winLinesHide' });
		context.eventEmitter.broadcast({ type: 'freeSpinCounterHide' });
		context.eventEmitter.broadcast({ type: 'globalMultiplierHide' });
		context.eventEmitter.broadcast({ type: 'boardFrameGlowHide' });

		// resumeGame nulls betToResume out as it starts, so each run re-seeds it
		// from the copy stateReplay is holding.
		stateBet.betToResume = stateReplay.round;
		applyResumeMode();
		context.eventEmitter.broadcast({ type: 'resumeBet' });
	});

	// Track whether a round is in flight, so the replay button stays dead until it
	// has finished. The machine sits in 'resumeBet' for the whole presentation —
	// win plaques, free-game outro and all — and only returns to 'idle' once it has
	// played out, so that transition is the end of the round.
	//
	// This MUST stay gated on replay mode. Normal play also passes through
	// 'resumeBet' on every launch — the machine is asked to resume, finds no active
	// round and drops straight back to 'idle' — so an ungated watcher would read
	// that as "the replay just ended".
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
