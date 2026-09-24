<script lang="ts">
	import { onDestroy } from 'svelte';

	import { getContextEventEmitter } from 'utils-event-emitter';
	import { createInterruptible } from 'utils-shared/interruptible';
	import { waitForTimeout } from 'utils-shared/wait';

	import type { EmitterEventHotKey } from '../types';

	type Props = {
		hotkey: string;
		disabled?: boolean;
		onpress?: () => void;
		onpressend?: () => void;
		onhold?: () => void;
		onholdend?: () => void;
	};

	const props: Props = $props();
	const context = getContextEventEmitter<EmitterEventHotKey>();
	const interruptible = createInterruptible();
	const WAIT_TO_HOLD_TIMEOUT = 400;
	let isHolding = $state(false);
	let isWaitingToHold = $state(false);
	// The OS repeats keydown while a key is held. This is not a preference and is
	// not gated: no caller wants auto-repeat counted as separate presses, and for
	// the bet button it means one held spacebar can place TWO bets — `onpress`
	// fires on every keydown until `isHolding` flips at WAIT_TO_HOLD_TIMEOUT
	// (400ms), and a machine set to a short repeat delay gets a second one inside
	// that window. Hacksaw guards the same thing the same way (`_keyDowns[" "]`).
	let isDown = false;

	const holdTimeoutStart = async () => {
		isWaitingToHold = true;
		const { interrupted } = await interruptible.add(() => waitForTimeout(WAIT_TO_HOLD_TIMEOUT));
		if (!interrupted) {
			isHolding = true;
			props.onhold?.();
		}
	};

	const holdTimeoutStop = () => {
		isWaitingToHold = false;
		interruptible.interrupt();
		interruptible.clear();
	};

	const keyDown = () => {
		if (isDown) return;
		isDown = true;
		if (!isWaitingToHold) holdTimeoutStart();
		if (!isHolding) props.onpress?.();
	};

	const keyUp = () => {
		isDown = false;
		if (isWaitingToHold) holdTimeoutStop();

		if (isHolding) {
			props.onholdend?.();
		} else {
			props.onpressend?.();
		}

		isHolding = false;
	};

	context.eventEmitter.subscribeOnMount({
		hotKey: (emitterEvent) => {
			if (props.disabled) return;
			if (emitterEvent.key !== props.hotkey) return;
			if (emitterEvent.action === 'keyUp') return keyUp();
			if (emitterEvent.action === 'keyDown') return keyDown();
		},
	});

	$effect(() => {
		if (props.disabled) keyUp();
	});

	onDestroy(() => keyUp());

	$effect(() => {
		if (isHolding) props.onhold?.();
	});
</script>
