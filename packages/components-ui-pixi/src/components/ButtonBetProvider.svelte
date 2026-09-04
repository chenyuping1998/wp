<script lang="ts" module>
	export type ButtonBetKey = 'spin_default' | 'spin_disabled' | 'stop_default' | 'stop_disabled';
</script>

<script lang="ts">
	import type { Snippet } from 'svelte';

	import { stateBet, stateBetDerived, stateModal, stateUi } from 'state-shared';

	import { getContext } from '../context';
	import { isBetOnCooldown, markBetPlaced, platformUx } from '../platformUx.svelte';

	type Props = {
		children: Snippet<
			[
				{
					key: ButtonBetKey;
					onpress: () => void;
				},
			]
		>;
	};

	const props: Props = $props();
	const context = getContext();

	let stopDisabled = $state(false);

	const bet = () => {
		// Hacksaw's `placeBet()` runs five guards before it commits, and this is the
		// one that is about money rather than state: `now - _lastBetChange < 500`.
		// Without it a press that lands in the same gesture as a stake change bets
		// an amount the player has not read yet — most easily by holding the +
		// button and hitting spin as it lets go. Off unless the game opted into
		// uiTheme.platformUx.
		if (isBetOnCooldown()) return;

		// Starting a round closes what is open, also from `placeBet()` — it shuts
		// seven panels, this app has two. Left open, a modal covers the board for
		// the whole spin it is paying for.
		if (platformUx()?.closePanelsOnSpin) {
			stateModal.modal = null;
			// ONLY when the player can open it again.
			//
			// In portrait the drawer is not a panel — it holds the bet controls,
			// autoplay, game info and the balance. Folding it unconditionally here
			// deleted the game's primary controls on the first spin and left no way
			// back: `stateUi.drawerButtonShow` is false by default and is only
			// turned on when free spins begin, so the button that reopens the drawer
			// was hidden AND disabled, and nothing broadcasts `drawerUnfold` in the
			// base game. Reported by Stake review on 2026-09-04 against Hot Miami;
			// CapoNostra and Moooo opt into the same flag and had the same fault.
			//
			// Broadcast only. ButtonDrawer owns `stateUi.drawerFold` and skips its
			// own fold animation when the flag is already true, so setting it here
			// would close the drawer by teleporting it shut.
			if (stateUi.drawerButtonShow) {
				context.eventEmitter.broadcast({ type: 'drawerFold' });
			}
		}

		markBetPlaced();
		if (stateBetDerived.activeBetMode()?.type === 'buy') stateBet.activeBetModeKey = 'BASE';
		context.eventEmitter.broadcast({ type: 'bet' });
	};

	const stop = () => {
		if (!stopDisabled) {
			if (stateBetDerived.hasAutoBetCounter()) stateBet.autoSpinsCounter = 0;
			context.eventEmitter.broadcast({ type: 'stopButtonClick' });
		}
	};

	const onpress = () => {
		context.eventEmitter.broadcast({ type: 'soundPressBet' });

		if (context.stateXstateDerived.isIdle()) {
			bet();
		} else {
			stop();
		}
	};

	const getKey = () => {
		if (context.stateXstateDerived.isIdle()) {
			if (!stateBetDerived.isBetCostAvailable()) return 'spin_disabled';
			return 'spin_default';
		}

		if (!context.stateXstateDerived.isIdle()) {
			if (stopDisabled) return 'stop_disabled';
			if (stateBetDerived.hasAutoBetCounter()) return 'stop_default';
			if (stateBet.isTurbo) return 'stop_disabled';
			return 'stop_default';
		}

		return 'spin_default';
	};

	const key = $derived.by(getKey);

	context.eventEmitter.subscribeOnMount({
		stopButtonClick: () => (stopDisabled = true),
		stopButtonEnable: () => (stopDisabled = false),
	});
</script>

{@render props.children({ key, onpress })}
