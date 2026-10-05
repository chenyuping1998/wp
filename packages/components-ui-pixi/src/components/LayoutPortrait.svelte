<script lang="ts">
	import { Tween } from 'svelte/motion';
	import { cubicInOut } from 'svelte/easing';

	import { stateReplay, stateUi } from 'state-shared';
	import { BLACK } from 'constants-shared/colors';
	import { FadeContainer } from 'components-pixi';
	import { MainContainer } from 'components-layout';
	import { Container, Graphics, Rectangle, Text } from 'pixi-svelte';
	import { waitForResolve } from 'utils-shared/wait';

	import LabelFreeSpinCounter from './LabelFreeSpinCounter.svelte';
	import ButtonDrawer from './ButtonDrawer.svelte';
	import ButtonReplay from './ButtonReplay.svelte';
	import LabelReplayMultiplier from './LabelReplayMultiplier.svelte';
	import UiLabel from './UiLabel.svelte';
	import type { LayoutUiProps } from '../types';
	import { getContext } from '../context';
	import { uiTheme } from '../theme.svelte';
	import { i18nDerived } from '../i18n/i18nDerived';
	import { UI_BASE_FONT_SIZE } from '../constants';

	const props: LayoutUiProps = $props();
	const context = getContext();

	// Replay summary (stateReplay.summary): every row of the replay start card,
	// kept on screen as a 3 × 2 panel under the replay button. See the same
	// branch in LayoutBottomBar (Deadwood review, 2026-10-04).
	const replaySummary = $derived(stateReplay.enabled ? stateReplay.summary : []);
	const hasReplaySummary = $derived(replaySummary.length > 0);
	const SUMMARY_COLS = 3;
	const SUMMARY_COL_W = 330;
	const SUMMARY_ROW_H = 104;
	const SUMMARY_SCALE = 0.62;
	const SUMMARY_TOP = 258; // above the bottom of the standard box; clears the REPLAY caption
	const summaryMaxW = (SUMMARY_COL_W - 30) / SUMMARY_SCALE;
	let summaryLabelWidths = $state<number[]>([]);
	const summaryLabelScale = $derived(
		Math.min(1, ...summaryLabelWidths.filter((w) => w > 0).map((w) => summaryMaxW / w)),
	);

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
				scale={uiTheme.portraitStepButtonScale}
			>
				{@render props.buttonDecrease({ anchor: 0.5 })}
			</Container>

			<Container
				x={context.stateLayoutDerived.mainLayoutStandard().width * 0.5 + 170}
				y={context.stateLayoutDerived.mainLayoutStandard().height - 400}
				scale={uiTheme.portraitStepButtonScale}
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

		{#if hasReplaySummary}
			{@const W = context.stateLayoutDerived.mainLayoutStandard().width}
			{@const H = context.stateLayoutDerived.mainLayoutStandard().height}
			{@const rows = Math.ceil(replaySummary.length / SUMMARY_COLS)}
			<Graphics
				draw={(g) => {
					const w = SUMMARY_COL_W * SUMMARY_COLS + 30;
					g.clear();
					g.roundRect(W / 2 - w / 2, H - SUMMARY_TOP - 18, w, SUMMARY_ROW_H * rows + 26, 22);
					g.fill({ color: uiTheme.panelFill, alpha: 0.88 });
					g.stroke({ width: 4, color: uiTheme.panelBorder, alpha: 0.9 });
				}}
			/>
			{#each replaySummary as row, i (row.label)}
				<Container
					x={W / 2 + SUMMARY_COL_W * ((i % SUMMARY_COLS) - (SUMMARY_COLS - 1) / 2)}
					y={H - SUMMARY_TOP + SUMMARY_ROW_H * Math.floor(i / SUMMARY_COLS)}
					scale={SUMMARY_SCALE}
				>
					<UiLabel
						tiled={false}
						stacked
						label={row.label.toUpperCase()}
						value={row.value}
						maxWidth={summaryMaxW}
						labelScale={summaryLabelScale}
						onlabelwidth={(w) => (summaryLabelWidths[i] = w)}
						accent={row.tone === 'win'
							? uiTheme.winAccent
							: { border: uiTheme.panelBorder, label: uiTheme.balanceLabelFill }}
					/>
				</Container>
			{/each}
		{:else}
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
		{/if}
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
	{#if hasReplaySummary}
		<!-- the summary panel owns the foot of the screen; the counter moves up -->
		{#if stateUi.freeSpinCounterShow}
			<Container
				x={context.stateLayoutDerived.mainLayoutStandard().width * 0.5}
				y={context.stateLayoutDerived.mainLayoutStandard().height - 560}
			>
				<LabelFreeSpinCounter stacked />
			</Container>
		{/if}
	{:else if stateUi.freeSpinCounterShow}
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
