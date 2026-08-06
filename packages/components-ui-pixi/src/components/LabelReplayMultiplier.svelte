<script lang="ts">
	import { stateBetDerived } from 'state-shared';

	import UiLabel from './UiLabel.svelte';
	import { uiTheme } from '../theme.svelte';

	// Replaces the Balance readout while a replay is running.
	//
	// Balance is meaningless there — a replay never authenticates, so it would read
	// $0.00 and look broken. This cell instead carries the mode's cost multiplier,
	// which together with the Bet readout next to it makes the round's cost legible
	// straight off the bar: "bet cost and applied multiplier", as certification puts
	// it, without having to reopen the start card.

	type Props = {
		stacked?: boolean;
		tiled?: boolean;
	};

	const props: Props = $props();

	const costMultiplier = $derived(stateBetDerived.activeBetMode()?.costMultiplier ?? 1);
	const value = $derived(`${costMultiplier}x`);
</script>

<UiLabel
	tiled={props.tiled ?? true}
	label="MULTIPLIER"
	{value}
	stacked={props.stacked}
	accent={{ border: uiTheme.panelBorder, label: uiTheme.balanceLabelFill }}
/>
