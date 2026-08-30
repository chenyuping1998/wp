<script lang="ts" module>
	import { stateBet, stateBetDerived, stateModal } from 'state-shared';
</script>

<script lang="ts">
	import OnHotkey from './OnHotkey.svelte';

	const spaceHoldOn = () => {
		stateBet.autoSpinsCounter = 0;
		stateBet.isSpaceHold = true;
		stateBetDerived.updateIsTurbo(true, { persistent: true });
	};

	const spaceHoldOff = () => {
		stateBet.isSpaceHold = false;
		stateBetDerived.updateIsTurbo(false, { persistent: true });
	};

	// The other way to play with the space key, and it needs the same guard as the
	// bet button: holding space over the feature-buy menu or the info panel used to
	// start continuous play behind the open dialog.
	//
	// disabled also RELEASES the hold when it becomes true (OnHotkey's effect), so
	// opening a modal mid-hold stops the run rather than leaving isSpaceHold stuck
	// on with no key to lift.
	const modalOpen = $derived(stateModal.modal !== null);
</script>

<OnHotkey hotkey="Space" disabled={modalOpen} onhold={spaceHoldOn} onholdend={spaceHoldOff} />
