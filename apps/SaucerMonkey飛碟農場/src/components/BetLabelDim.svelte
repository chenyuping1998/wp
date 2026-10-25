<script lang="ts">
	/**
	 * Greys the BET caption and its chevron while the stake cannot be changed
	 * (user, 2026-10-17: a spin is running, the bet menu will not open, and the
	 * readout still looked pressable). Both are drawn in uiTheme.betAccent.label
	 * by the shared LabelBet/UiLabel, so this swaps that one colour — nothing in
	 * wp/packages changes. Draws nothing itself.
	 *
	 * The grey is what the steppers turn when disabled: UiButton tints their
	 * cream art by 0x6b6b6b, which lands on about #67645c.
	 */
	import { onMount } from 'svelte';
	import { uiTheme } from 'components-ui-pixi';
	import { stateReplay } from 'state-shared';

	import { getContext } from '../game/context';

	const LOCKED = 0x67645c;
	const context = getContext();
	// the skin's own colour, read once uiTheme.ts has applied every skin
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
