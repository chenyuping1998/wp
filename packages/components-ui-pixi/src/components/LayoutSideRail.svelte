<script lang="ts">
	import { stateUi } from 'state-shared';
	import { BLACK } from 'constants-shared/colors';
	import { MainContainer } from 'components-layout';
	import { Container, Rectangle } from 'pixi-svelte';

	import { getContext } from '../context';
	import type { LayoutUiProps } from '../types';

	// Side-rail layout: controls live in two vertical rails instead of one bottom
	// bar, which hands the whole middle of the screen to the board. Opted into per
	// game via uiTheme.betBarLayout — every other game keeps the bottom bar.
	//
	//   LEFT   menu (top), Buy Bonus (centred, deliberately oversized — it is the
	//          feature CTA and has a rail to itself)
	//   RIGHT  balance / win / bet readouts, then the spin pod
	//
	// Positions are proportional to the standard layout box so the same component
	// serves desktop (1920x1080), landscape and the squarer tablet box.

	const props: LayoutUiProps = $props();
	const context = getContext();

	const box = $derived(context.stateLayoutDerived.mainLayoutStandard());
	const RAIL = 400;
	const leftX = $derived(RAIL * 0.5);
	const rightX = $derived(box.width - RAIL * 0.5);
</script>

<Container x={20}>
	{@render props.gameName()}
</Container>

<Container x={context.stateLayoutDerived.canvasSizes().width - 20}>
	{@render props.logo()}
</Container>

<MainContainer standard>
	<!-- ── left rail ─────────────────────────────────────────────────────── -->
	<Container x={leftX} y={box.height * 0.11} scale={0.85}>
		{@render props.buttonMenu({ anchor: 0.5 })}
	</Container>

	<!-- 3x the size it had in the bottom bar (0.8 -> 2.4) -->
	<Container x={leftX} y={box.height * 0.5} scale={2.4}>
		{@render props.buttonBuyBonus({ anchor: 0.5 })}
	</Container>

	<!-- ── right rail ────────────────────────────────────────────────────── -->
	<Container x={rightX} y={box.height * 0.13} scale={0.62}>
		{@render props.amountBalance({ stacked: true })}
	</Container>

	<Container x={rightX} y={box.height * 0.27} scale={0.62}>
		{@render props.amountWin({ stacked: true })}
	</Container>

	<Container x={rightX} y={box.height * 0.41} scale={0.62}>
		{@render props.amountBet({ stacked: true })}
	</Container>

	<!-- spin pod: BET in the middle, -/+ flanking, autospin/turbo below -->
	<Container x={rightX} y={box.height * 0.64} scale={1.05}>
		{@render props.buttonBet({ anchor: 0.5 })}
	</Container>

	<Container x={rightX - 128} y={box.height * 0.64} scale={0.42}>
		{@render props.buttonDecrease({ anchor: 0.5 })}
	</Container>

	<Container x={rightX + 128} y={box.height * 0.64} scale={0.42}>
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

	<!-- menu opens downward from the menu button, staying inside the left rail -->
	<MainContainer standard>
		<Container x={leftX} y={box.height * 0.11}>
			{#each [1, 2, 3, 4] as slot (slot)}
				<Container scale={0.8} y={slot * 132}>
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
