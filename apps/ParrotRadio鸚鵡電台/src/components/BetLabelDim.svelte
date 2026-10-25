<script lang="ts">
	/**
	 * Greys the BET caption and its chevron while the stake cannot be changed: a
	 * round is running and the bet menu will not open, so the readout must not
	 * look pressable. Both are drawn in uiTheme.betAccent.label by the shared
	 * readout, so this swaps that one colour — nothing in wp/packages changes.
	 * Draws nothing itself.
	 */
	import { onMount } from 'svelte';
	import { uiTheme } from 'components-ui-pixi';
	import { stateReplay } from 'state-shared';

	import { getContext } from '../game/context';

	// what the disabled steppers turn to
	const LOCKED = 0x67645c;
	const context = getContext();
	// the theme's own colour, read once uiTheme.ts has applied
	const normal = uiTheme.betAccent.label;
	const locked = $derived(!stateReplay.enabled && !context.stateXstateDerived.isIdle());

	$effect(() => {
		const label = locked ? LOCKED : normal;
		if (uiTheme.betAccent.label !== label) uiTheme.betAccent = { ...uiTheme.betAccent, label };
	});

	onMount(() => () => {
		uiTheme.betAccent = { ...uiTheme.betAccent, label: normal };
	});
</script>
