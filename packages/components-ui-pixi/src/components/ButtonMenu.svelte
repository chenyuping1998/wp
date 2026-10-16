<script lang="ts">
	import type { ButtonProps } from 'components-pixi';
	import { stateUi } from 'state-shared';

	import UiButton from './UiButton.svelte';
	import { UI_BASE_SIZE } from '../constants';
	import { getContext } from '../context';
	import { uiTheme } from '../theme.svelte';

	const props: Partial<Omit<ButtonProps, 'children'>> = $props();
	const context = getContext();
	// barCapButtonScale only where the bar (and its end caps) exists
	const scale = $derived(
		(context.stateLayoutDerived.layoutType() !== 'portrait' ? uiTheme.barCapButtonScale : undefined) ??
			uiTheme.railButtonScale,
	);
	const sizes = $derived({
		width: UI_BASE_SIZE * scale,
		height: UI_BASE_SIZE * scale,
	});

	const onpress = () => {
		context.eventEmitter.broadcast({ type: 'soundPressGeneral' });
		stateUi.menuOpen = true;
	};
</script>

<UiButton {...props} {sizes} {onpress} icon="menu" />
