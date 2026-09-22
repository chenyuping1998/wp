<script lang="ts">
	import { Tween } from 'svelte/motion';
	import { cubicInOut } from 'svelte/easing';

	import { stateReplay, stateUi } from 'state-shared';
	import { BLACK } from 'constants-shared/colors';
	import { FadeContainer } from 'components-pixi';
	import { MainContainer } from 'components-layout';
	import { Container, Rectangle, Text } from 'pixi-svelte';
	import { waitForResolve } from 'utils-shared/wait';

	import LabelFreeSpinCounter from './LabelFreeSpinCounter.svelte';
	import ButtonDrawer from './ButtonDrawer.svelte';
	import ButtonReplay from './ButtonReplay.svelte';
	import LabelReplayMultiplier from './LabelReplayMultiplier.svelte';
	import type { LayoutUiProps } from '../types';
	import { getContext } from '../context';
	import { uiTheme } from '../theme.svelte';
	import { i18nDerived } from '../i18n/i18nDerived';
	import { UI_BASE_FONT_SIZE } from '../constants';

	const props: LayoutUiProps = $props();
	const context = getContext();

	const DRAWER_Y = {
		unfold: 0,
		fold: 550,
	};
	const drawerTween = new Tween(stateUi.drawerFold ? DRAWER_Y.fold : DRAWER_Y.unfold, {
		easing: cubicInOut,
	});

	const DRAWER_BUTTON_Y = {
		unfold: 0,
		fold: 50,
	};
	const drawerButtonTween = new Tween(
		stateUi.drawerFold ? DRAWER_BUTTON_Y.fold : DRAWER_BUTTON_Y.unfold,
		{
			easing: cubicInOut,
		},
	);

	let drawerButtonFadeComplete = $state(() => {});

	context.eventEmitter.subscribeOnMount({
		drawerButtonShow: async () => {
			if (!stateUi.drawerButtonShow) {
				stateUi.drawerButtonShow = true;
				await waitForResolve((resolve) => (drawerButtonFadeComplete = resolve));
			}
		},
		drawerButtonHide: async () => {
			if (stateUi.drawerButtonShow) {
				stateUi.drawerButtonShow = false;
				await waitForResolve((resolve) => (drawerButtonFadeComplete = resolve));
			}
		},
		drawerUnfold: async () => {
			if (stateUi.drawerFold) {
				drawerButtonTween.set(DRAWER_BUTTON_Y.unfold);
				await drawerTween.set(DRAWER_Y.unfold);
			}
		},
		drawerFold: async () => {
			if (!stateUi.drawerFold) {
				drawerButtonTween.set(DRAWER_BUTTON_Y.fold);
				await drawerTween.set(DRAWER_Y.fold);
			}
		},
	});
</script>

<Container x={20}>
	{@render props.gameName()}
</Container>

<Container x={context.stateLayoutDerived.canvasSizes().width - 20}>
	{@render props.logo()}
</Container>

<MainContainer standard alignVertical="bottom">
	<!-- drawer container -->
	<Container y={drawerTween.current}>
		<Container
			x={context.stateLayoutDerived.mainLayoutStandard().width * 0.5 - uiTheme.portraitSideButtonX}
			y={context.stateLayoutDerived.mainLayoutStandard().height - 400}
		>
			{@render props.buttonMenu({ anchor: 0.5 })}
		</Container>

		{#if !stateReplay.enabled}
			<Container
				x={context.stateLayoutDerived.mainLayoutStandard().width * 0.5 + uiTheme.portraitSideButtonX}
				y={context.stateLayoutDerived.mainLayoutStandard().height - 400}
				scale={uiTheme.portraitBuyBonusScale}
			>
				{@render props.buttonBuyBonus({ anchor: 0.5 })}
			</Container>
		{/if}

		<!-- spin pod: [autospin][−][BET][+][turbo] centered on the big bet button.
		     In replay mode the whole pod collapses to [REPLAY][turbo]: nothing is
		     wagered there, so a live spin button would only lead to an error — the
		     replay session has no sessionID to bet with. -->
		{#if stateReplay.enabled}
			<Container
				x={context.stateLayoutDerived.mainLayoutStandard().width * 0.5}
				y={context.stateLayoutDerived.mainLayoutStandard().height - 400}
			>
				<ButtonReplay anchor={0.5} />
			</Container>

			<Text
				anchor={{ x: 0.5, y: 0 }}
				x={context.stateLayoutDerived.mainLayoutStandard().width * 0.5}
				y={context.stateLayoutDerived.mainLayoutStandard().height - 400 + 96}
				text={i18nDerived.replay()}
				style={{
					fontFamily: uiTheme.fontFamily,
					fontWeight: uiTheme.fontWeight,
					fontSize: UI_BASE_FONT_SIZE * 0.62,
					fill: uiTheme.labelFill,
					stroke: uiTheme.valueStroke,
					strokeThickness: 3,
				}}
			/>
		{:else}
			<Container
				x={context.stateLayoutDerived.mainLayoutStandard().width * 0.5}
				y={context.stateLayoutDerived.mainLayoutStandard().height - 400}
				scale={1.2}
			>
				{@render props.buttonBet({ anchor: 0.5 })}
			</Container>

			<Container
				x={context.stateLayoutDerived.mainLayoutStandard().width * 0.5 - 170}
				y={context.stateLayoutDerived.mainLayoutStandard().height - 400}
				scale={0.5}
			>
				{@render props.buttonDecrease({ anchor: 0.5 })}
			</Container>

			<Container
				x={context.stateLayoutDerived.mainLayoutStandard().width * 0.5 + 170}
				y={context.stateLayoutDerived.mainLayoutStandard().height - 400}
				scale={0.5}
			>
				{@render props.buttonIncrease({ anchor: 0.5 })}
			</Container>

			<Container
				x={context.stateLayoutDerived.mainLayoutStandard().width * 0.5 - 285}
				y={context.stateLayoutDerived.mainLayoutStandard().height - 400}
				scale={0.7}
			>
				{@render props.buttonAutoSpin({ anchor: 0.5 })}
			</Container>
		{/if}

		<Container
			x={context.stateLayoutDerived.mainLayoutStandard().width * 0.5 + 285}
			y={context.stateLayoutDerived.mainLayoutStandard().height - 400}
			scale={0.7}
		>
			{@render props.buttonTurbo({ anchor: 0.5 })}
		</Container>

		<Container
			x={context.stateLayoutDerived.mainLayoutStandard().width * 0.5}
			y={context.stateLayoutDerived.mainLayoutStandard().height - 240}
			scale={0.81}
		>
			{#if stateReplay.enabled}
				<LabelReplayMultiplier stacked />
			{:else}
				{@render props.amountBalance({ stacked: true })}
			{/if}
		</Container>
	</Container>

	<Container y={Math.min(drawerTween.current, 350)}>
		<Container
			x={context.stateLayoutDerived.mainLayoutStandard().width * 0.5}
			y={context.stateLayoutDerived.mainLayoutStandard().height - 670}
			scale={0.81}
		>
			{@render props.amountWin({ stacked: true })}
		</Container>
	</Container>
</MainContainer>

<MainContainer standard alignVertical="bottom">
	{#if stateUi.freeSpinCounterShow}
		<Container
			x={context.stateLayoutDerived.mainLayoutStandard().width * 0.5}
			y={context.stateLayoutDerived.mainLayoutStandard().height - 130}
		>
			<LabelFreeSpinCounter stacked />
		</Container>
	{:else}
		<Container
			x={context.stateLayoutDerived.mainLayoutStandard().width * 0.5}
			y={context.stateLayoutDerived.mainLayoutStandard().height - 130}
			scale={0.81}
		>
			{@render props.amountBet({ stacked: true })}
		</Container>
	{/if}

	<!-- drawer button -->
	<FadeContainer
		persistent
		show={stateUi.drawerButtonShow}
		oncomplete={drawerButtonFadeComplete}
		y={drawerButtonTween.current}
	>
		<Container
			x={context.stateLayoutDerived.mainLayoutStandard().width * 0.5 + 440}
			y={context.stateLayoutDerived.mainLayoutStandard().height - 105}
		>
			<ButtonDrawer disabled={!stateUi.drawerButtonShow} anchor={0.5} />
		</Container>
	</FadeContainer>
</MainContainer>

{#if stateUi.menuOpen}
	<Rectangle
		eventMode="static"
		cursor="pointer"
		alpha={0.5}
		anchor={0.5}
		backgroundColor={BLACK}
		width={context.stateLayoutDerived.canvasSizes().width}
		height={context.stateLayoutDerived.canvasSizes().height}
		x={context.stateLayoutDerived.canvasSizes().width * 0.5}
		y={context.stateLayoutDerived.canvasSizes().height * 0.5}
		onpointerup={() => (stateUi.menuOpen = false)}
	/>

	<MainContainer standard alignVertical="bottom">
		<Container
			x={context.stateLayoutDerived.mainLayoutStandard().width * 0.5 - 440}
			y={context.stateLayoutDerived.mainLayoutStandard().height - 400}
		>
			<Container y={-190 - 210 * 3}>
				{@render props.buttonPayTable({ anchor: 0.5 })}
			</Container>

			<Container y={-190 - 210 * 2}>
				{@render props.buttonGameRules({ anchor: 0.5 })}
			</Container>

			<Container y={-190 - 210 * 1}>
				{@render props.buttonSettings({ anchor: 0.5 })}
			</Container>

			<Container y={-190}>
				{@render props.buttonSoundSwitch({ anchor: 0.5 })}
			</Container>

			<Container>
				{@render props.buttonMenuClose({ anchor: 0.5 })}
			</Container>
		</Container>
	</MainContainer>
{/if}
