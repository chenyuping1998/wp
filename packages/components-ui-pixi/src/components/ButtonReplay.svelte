<script lang="ts">
	import type { ButtonProps } from 'components-pixi';
	import { stateReplay } from 'state-shared';

	import UiButton from './UiButton.svelte';
	import { UI_BASE_SIZE } from '../constants';
	import { getContext } from '../context';
	import { uiTheme } from '../theme.svelte';

	// Replays the round again. Only ever rendered in replay mode, where there is
	// no spin button — nothing is wagered, so this is the one control that makes
	// the game do anything.

	const props: Partial<Omit<ButtonProps, 'children'>> = $props();
	const context = getContext();
	const sizes = $derived({
		width: UI_BASE_SIZE * uiTheme.railButtonScale,
		height: UI_BASE_SIZE * uiTheme.railButtonScale,
	});

	// Dead while the round is in flight: pressing it mid-sequence would ask the
	// state machine to enter resumeBet from inside its own invoke.
	const disabled = $derived(stateReplay.running);

	const onpress = () => {
		context.eventEmitter.broadcast({ type: 'soundPressGeneral' });
		stateReplay.waiting = false;
		stateReplay.startRequested = true;
	};
</script>

<UiButton {...props} {sizes} {onpress} {disabled} icon="replay" />
