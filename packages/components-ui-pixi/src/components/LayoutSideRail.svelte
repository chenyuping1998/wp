<script lang="ts">
	import { stateUi } from 'state-shared';
	import { BLACK } from 'constants-shared/colors';
	import { MainContainer } from 'components-layout';
	import { Container, Rectangle } from 'pixi-svelte';

	import { getContext } from '../context';
	import { uiTheme } from '../theme.svelte';
	import type { LayoutUiProps } from '../types';

	// Side-rail layout: controls live in two vertical rails instead of one bottom
	// bar, which hands the whole middle of the screen to the board. Opted into per
	// game via uiTheme.betBarLayout — every other game keeps the bottom bar.
	//
	//   LEFT   Buy Bonus (centred, deliberately oversized — it is the feature CTA
	//          and has a rail to itself), menu at the foot, opening upward
	//   RIGHT  balance / win / bet readouts, then the spin pod
	//
	// Positions are proportional to the standard layout box so the same component
	// serves desktop (1920x1080), landscape and the squarer tablet box.

	const props: LayoutUiProps = $props();
	const context = getContext();

	const box = $derived(context.stateLayoutDerived.mainLayoutStandard());
	// rail width is themeable: games with a wide reel housing pull the rails
	// further out toward the canvas edges (uiTheme.railWidth)
	const leftX = $derived(uiTheme.railWidth * 0.5);
	const rightX = $derived(box.width - uiTheme.railWidth * 0.5);

	// Menu sits at the foot of the left rail and opens upward.
	const MENU_Y = $derived(box.height * 0.88);
	// The menu buttons are UI_BASE_SIZE * 1.3 = 195 wide, so at scale 0.8 each
	// circle is 156 across. Anything under that and the gold outlines cut into
	// each other — spacing is the diameter plus a deliberate 20px of air.
	const MENU_STEP = 176;
</script>

<Container x={20}>
	{@render props.gameName()}
</Container>

<Container x={context.stateLayoutDerived.canvasSizes().width - 20}>
	{@render props.logo()}
</Container>

<MainContainer standard>
	<!-- ── left rail ─────────────────────────────────────────────────────── -->
	<Container x={leftX} y={MENU_Y} scale={0.85}>
		{@render props.buttonMenu({ anchor: 0.5 })}
	</Container>

	<!-- oversized feature CTA; themeable via uiTheme.buyBonusRailScale -->
	<Container x={leftX} y={box.height * 0.5} scale={uiTheme.buyBonusRailScale}>
		{@render props.buttonBuyBonus({ anchor: 0.5 })}
	</Container>

	<!-- ── right rail ────────────────────────────────────────────────────── -->
	<Container x={rightX} y={box.height * 0.13} scale={uiTheme.railPanelScale}>
		{@render props.amountBalance({ stacked: true })}
	</Container>

	<Container x={rightX} y={box.height * 0.27} scale={uiTheme.railPanelScale}>
		{@render props.amountWin({ stacked: true })}
	</Container>

	<Container x={rightX} y={box.height * 0.41} scale={uiTheme.railPanelScale}>
		{@render props.amountBet({ stacked: true })}
	</Container>

	<!-- Spin pod: BET in the middle, -/+ flanking, autospin/turbo below.
	     ButtonBet is UI_BASE_SIZE * 1.12 internally, so at the old 1.05 layout
	     scale it measured 176px across and its gold trim ran into the -/+ pair
	     at ±118. Trimmed to 0.92 (155px) and spread back to ±128, which leaves
	     ~14px of air on each side while the outer buttons still clear the canvas
	     edge and the reel frame. -->
	<Container x={rightX} y={box.height * 0.64} scale={0.92}>
		{@render props.buttonBet({ anchor: 0.5 })}
	</Container>

	<!-- steppers enlarged 0.4 -> 0.5 (60 -> 75 across): they were the smallest
	     controls on screen despite being the most frequently pressed, and the
	     scale also grows the hit area. Still clears the bet button by ~13px. -->
	<Container x={rightX - 128} y={box.height * 0.64} scale={0.5}>
		{@render props.buttonDecrease({ anchor: 0.5 })}
	</Container>

	<Container x={rightX + 128} y={box.height * 0.64} scale={0.5}>
		{@render props.buttonIncrease({ anchor: 0.5 })}
	</Container>

	<Container x={rightX - 96} y={box.height * 0.82} scale={0.6}>
		{@render props.buttonAutoSpin({ anchor: 0.5 })}
	</Container>

	<Container x={rightX + 96} y={box.height * 0.82} scale={0.6}>
		{@render props.buttonTurbo({ anchor: 0.5 })}
	</Container>
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

	<!-- Opens upward out of the menu button at the foot of the rail: close on the
	     button's own spot, options stacked above it. -->
	<MainContainer standard>
		<Container x={leftX} y={MENU_Y}>
			{#each [1, 2, 3, 4] as slot (slot)}
				<Container scale={0.8} y={-slot * MENU_STEP}>
					{#if slot === 1}
						{@render props.buttonPayTable({ anchor: 0.5 })}
					{:else if slot === 2}
						{@render props.buttonGameRules({ anchor: 0.5 })}
					{:else if slot === 3}
						{@render props.buttonSettings({ anchor: 0.5 })}
					{:else}
						{@render props.buttonSoundSwitch({ anchor: 0.5 })}
					{/if}
				</Container>
			{/each}

			<Container scale={0.85}>
				{@render props.buttonMenuClose({ anchor: 0.5 })}
			</Container>
		</Container>
	</MainContainer>
{/if}
