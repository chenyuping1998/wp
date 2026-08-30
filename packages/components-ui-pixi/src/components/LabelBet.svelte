<script lang="ts">
	import { Container } from 'pixi-svelte';
	import { stateBetDerived, stateModal, stateReplay } from 'state-shared';
	import { numberToCurrencyString } from 'utils-shared/amount';

	import UiLabel from './UiLabel.svelte';
	import { getContext } from '../context';
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
	const context = getContext();
	const label = $derived(
		stateBetDerived.activeBetMode()?.text.betAmountLabel || i18nDerived.betAmount(),
	);
	const value = $derived(numberToCurrencyString(stateBetDerived.betCost()));
	// A replay plays a recorded round at a recorded stake, so the bet menu has
	// nothing to change — and in replay mode the server never sent any bet levels,
	// so opening it would show an empty list.
	const disabled = $derived(stateReplay.enabled || !context.stateXstateDerived.isIdle());
	let hovered = $state(false);

	const onpress = () => {
		if (disabled) return;
		context.eventEmitter.broadcast({ type: 'soundPressGeneral' });
		stateModal.modal = { name: 'betAmountMenu' };
	};
</script>

<Container
	eventMode="static"
	cursor={stateReplay.enabled ? 'default' : disabled ? 'not-allowed' : 'pointer'}
	onpointerup={onpress}
	onpointerover={() => (hovered = true)}
	onpointerout={() => (hovered = false)}
>
	<UiLabel
		tiled={props.tiled ?? true}
		interactive={!stateReplay.enabled}
		hovered={hovered && !disabled}
		{label}
		{value}
		stacked={props.stacked}
		accent={uiTheme.betAccent}
		maxWidth={props.maxWidth}
	/>
</Container>
