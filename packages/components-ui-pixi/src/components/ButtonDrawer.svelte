<script lang="ts">
	import { cubicInOut } from 'svelte/easing';

	import { stateUi } from 'state-shared';
	import { Text } from 'pixi-svelte';
	import { Button, type ButtonProps } from 'components-pixi';

	import UiSprite from './UiSprite.svelte';
	import { UI_BASE_FONT_SIZE, UI_BASE_SIZE } from '../constants';
	import { getContext } from '../context';
	import { Tween } from 'svelte/motion';
	import { uiTheme } from '../theme.svelte';

	const props: Partial<Omit<ButtonProps, 'children'>> = $props();
	const context = getContext();
	const sizes = { width: UI_BASE_SIZE, height: UI_BASE_SIZE };

	const degreesToRads = (degrees: number) => (degrees * Math.PI) / 180.0;

	const DRAWER_ROTATION = {
		up: degreesToRads(-180),
		down: degreesToRads(0),
	};

	const rotationTween = new Tween(stateUi.drawerFold ? DRAWER_ROTATION.up : DRAWER_ROTATION.down, {
		easing: cubicInOut,
	});

	let moving = $state(false);
	const disabled = $derived(props.disabled || moving);

	const onpress = async () => {
		if (stateUi.drawerFold) {
			await context.eventEmitter.broadcastAsync({ type: 'drawerUnfold' });
		} else {
			await context.eventEmitter.broadcastAsync({ type: 'drawerFold' });
		}
	};

	context.eventEmitter.subscribeOnMount({
		drawerUnfold: async () => {
			if (stateUi.drawerFold) {
				moving = true;
				await rotationTween.set(DRAWER_ROTATION.down);
				stateUi.drawerFold = false;
				moving = false;
			}
		},
		drawerFold: async () => {
			if (!stateUi.drawerFold) {
				moving = true;
				await rotationTween.set(DRAWER_ROTATION.up);
				stateUi.drawerFold = true;
				moving = false;
			}
		},
	});
</script>

<Button {...props} {sizes} {onpress} {disabled} alpha={disabled ? 0.5 : 1}>
	{#snippet children({ center })}
		<!-- without explicit colours this fell back to UiSprite's magenta default
		     (0xd64dff), which showed up as a bright block in the corner once the
		     drawer button was revealed on free-spin entry. Match the rest of the UI. -->
		<UiSprite
			key="base_mobile_drawer"
			{...center}
			anchor={0.5}
			width={sizes.width}
			height={sizes.height}
			backgroundColor={uiTheme.buttonFill}
			borderColor={uiTheme.buttonBorder}
			borderWidth={6}
			borderRadius={sizes.width * 0.5}
		/>
		<Text
			{...center}
			anchor={0.5}
			text="↓"
			style={{
				align: 'center',
				wordWrap: true,
				wordWrapWidth: 200,
				fontFamily: uiTheme.fontFamily,
				fontWeight: uiTheme.fontWeight,
				fontSize: UI_BASE_FONT_SIZE * 0.9,
				fill: 0xffffff,
			}}
			rotation={rotationTween.current}
		/>
	{/snippet}
</Button>
