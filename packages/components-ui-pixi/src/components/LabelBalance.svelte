<script lang="ts">
	import { Tween } from 'svelte/motion';

	import { stateBet } from 'state-shared';
	import { numberToCurrencyString } from 'utils-shared/amount';

	import UiLabel from './UiLabel.svelte';
	import { i18nDerived } from '../i18n/i18nDerived';
	import { uiTheme } from '../theme.svelte';

	type Props = {
		stacked?: boolean;
		// Draw the framed plate behind the readout. On by default so every existing
		// layout is unchanged; the compact bottom bar turns it off, because there the
		// whole strip is one frame and a plate per readout is a box inside a box.
		tiled?: boolean;
		// the cell this readout must stay inside — see UiLabel
		maxWidth?: number;
	};

	const props: Props = $props();
	const balanceTween = new Tween(stateBet.balanceAmount);
	const label = $derived(i18nDerived.balance());
	const value = $derived(numberToCurrencyString(balanceTween.current));

	$effect(() => {
		balanceTween.set(stateBet.balanceAmount);
	});
</script>

<UiLabel tiled={props.tiled ?? true} {label} {value} stacked={props.stacked} accent={{ border: uiTheme.panelBorder, label: uiTheme.balanceLabelFill }} maxWidth={props.maxWidth} />
