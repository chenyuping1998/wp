<script lang="ts">
	import type { ButtonProps } from 'components-pixi';
	import { stateBet, stateBetDerived } from 'state-shared';

	import UiButton from './UiButton.svelte';
	import { UI_BASE_SIZE } from '../constants';
	import { getContext } from '../context';
	import { uiTheme } from '../theme.svelte';
	import { cycleTurbo } from '../turbo';

	const props: Partial<Omit<ButtonProps, 'children'>> = $props();
	const context = getContext();
	const sizes = $derived.by(() => {
		const scale = uiTheme.turboButtonScale ?? uiTheme.railButtonScale;
		return { width: UI_BASE_SIZE * scale, height: UI_BASE_SIZE * scale };
	});
	const active = $derived(stateBet.isTurbo);
	const disabled = $derived(stateBet.isSpaceHold);

	const onpress = () => {
		context.eventEmitter.broadcast({ type: 'soundPressGeneral' });
		cycleTurbo();
	};
	// the second tier's icon, only where a game offers one (uiTheme.turboTiers)
	const tier = $derived(active && uiTheme.turboTiers > 1 ? stateBet.turboLevel : 1);

	context.eventEmitter.subscribeOnMount({
		stopButtonClick: () => stateBetDerived.updateIsTurbo(true, { persistent: false }),
		stopButtonEnable: () => stateBetDerived.updateIsTurbo(false, { persistent: false }),
	});
</script>

<UiButton {...props} {sizes} {active} {onpress} {disabled} {tier} icon="turbo" />
