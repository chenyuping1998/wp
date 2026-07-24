<script lang="ts">
	import { stateSound, stateUi } from 'state-shared';
	import { BLACK } from 'constants-shared/colors';
	import { MainContainer } from 'components-layout';
	import { Container, Rectangle, Text } from 'pixi-svelte';

	import { getContext } from '../context';
	import { uiTheme } from '../theme.svelte';
	import { UI_BASE_FONT_SIZE } from '../constants';
	import { i18nDerived } from '../i18n/i18nDerived';
	import type { LayoutUiProps } from '../types';

	// Side-rail layout: controls live in two vertical rails instead of one bottom
	// bar, which hands the whole middle of the screen to the board. Opted into per
	// game via uiTheme.betBarLayout — every other game keeps the bottom bar.
	//
	//   LEFT   the oversized Buy Bonus CTA, and a menu holding pay table, rules,
	//          sound and audio settings
	//   RIGHT  balance / win / bet readouts, then the spin pod
	//
	// The four secondary controls are nested rather than on the rail. An earlier
	// pass put them all out in the open, which made every one reachable in a
	// single press but left the rail a column of five same-sized circles with the
	// feature CTA buried among them. Collapsing the reference and audio controls
	// leaves exactly one thing competing with Buy Bonus for attention.
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

	// Icon-only buttons give a player nothing to read. Every control gets a caption
	// underneath, so the bar can be understood without pressing anything to find
	// out what it does.
	const captionStyle = $derived({
		fontFamily: uiTheme.fontFamily,
		fontWeight: uiTheme.fontWeight,
		fontSize: UI_BASE_FONT_SIZE * 0.55,
		fill: uiTheme.labelFill,
		stroke: uiTheme.valueStroke,
		strokeThickness: 3,
	});

	// The menu sits low on the rail and opens upward, so the items land in free
	// space rather than off the top of a tall screen. At scale 0.46 a button is
	// ~90px across, so 130px of pitch keeps the circles clear of each other — the
	// items must not intersect, which is what made the first version look broken.
	const MENU_Y = $derived(box.height * 0.88);
	const MENU_PITCH = 130;
	const menuItemY = (i: number) => MENU_Y - MENU_PITCH * (i + 1);
</script>

<Container x={20}>
	{@render props.gameName()}
</Container>

<Container x={context.stateLayoutDerived.canvasSizes().width - 20}>
	{@render props.logo()}
</Container>

<MainContainer standard>
	<!-- ── left rail ─────────────────────────────────────────────────────── -->
	<!-- oversized feature CTA; themeable via uiTheme.buyBonusRailScale -->
	<Container x={leftX} y={box.height * 0.5} scale={uiTheme.buyBonusRailScale}>
		{@render props.buttonBuyBonus({ anchor: 0.5 })}
	</Container>

	{#if !stateUi.menuOpen}
		<Container x={leftX} y={MENU_Y} scale={0.46}>
			{@render props.buttonMenu({ anchor: 0.5 })}
		</Container>
		<Text
			anchor={{ x: 0.5, y: 0 }}
			x={leftX}
			y={MENU_Y + 52}
			text={i18nDerived.menu()}
			style={captionStyle}
		/>
	{/if}

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
	     Enlarged so the primary action carries the weight it should: bet 185px
	     across (ButtonBet is UI_BASE_SIZE * 1.12 internally, x1.1 here) and the
	     steppers 87px, spread to ±148. Every clearance was measured against the
	     things it could collide with, on a 1920x1080 standard box:
	       · bet ↔ stepper       12px
	       · outer edge → canvas  9px
	       · inner edge → reel frame right edge (1468) 61px
	       · above → BET readout 156px, below → autoSpin 57px
	     Going further (1.15 / ±155) puts the outer stepper exactly on the canvas
	     edge, so this is one step inside the limit. -->
	<Container x={rightX} y={box.height * 0.64} scale={1.1}>
		{@render props.buttonBet({ anchor: 0.5 })}
	</Container>

	<Container x={rightX - 148} y={box.height * 0.64} scale={0.58}>
		{@render props.buttonDecrease({ anchor: 0.5 })}
	</Container>

	<Container x={rightX + 148} y={box.height * 0.64} scale={0.58}>
		{@render props.buttonIncrease({ anchor: 0.5 })}
	</Container>

	<Container x={rightX - 96} y={box.height * 0.82} scale={0.6}>
		{@render props.buttonAutoSpin({ anchor: 0.5 })}
	</Container>
	<Text
		anchor={{ x: 0.5, y: 0 }}
		x={rightX - 96}
		y={box.height * 0.82 + 52}
		text={i18nDerived.autoSpin()}
		style={captionStyle}
	/>

	<Container x={rightX + 96} y={box.height * 0.82} scale={0.6}>
		{@render props.buttonTurbo({ anchor: 0.5 })}
	</Container>
	<Text
		anchor={{ x: 0.5, y: 0 }}
		x={rightX + 96}
		y={box.height * 0.82 + 52}
		text={i18nDerived.turbo()}
		style={captionStyle}
	/>
</MainContainer>

<!--
	Menu, opening upward out of the rail. Order runs bottom-to-top sound → audio
	settings → rules → pay table, which puts the one control a player toggles
	repeatedly nearest the button they just pressed and leaves the two reference
	panels furthest away. Same order as the bottom-bar layouts read top-down, so
	the two arrangements stay learnable as one.
-->
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

	<MainContainer standard>
		<Container x={leftX} y={menuItemY(0)} scale={0.46}>
			{@render props.buttonSoundSwitch({ anchor: 0.5 })}
		</Container>
		<Text
			anchor={{ x: 0.5, y: 0 }}
			x={leftX}
			y={menuItemY(0) + 52}
			text={stateSound.volumeValueMaster === 0 ? i18nDerived.soundOff() : i18nDerived.soundOn()}
			style={captionStyle}
		/>

		<Container x={leftX} y={menuItemY(1)} scale={0.46}>
			{@render props.buttonSettings({ anchor: 0.5 })}
		</Container>
		<Text
			anchor={{ x: 0.5, y: 0 }}
			x={leftX}
			y={menuItemY(1) + 52}
			text={i18nDerived.settings()}
			style={captionStyle}
		/>

		<Container x={leftX} y={menuItemY(2)} scale={0.46}>
			{@render props.buttonGameRules({ anchor: 0.5 })}
		</Container>
		<Text
			anchor={{ x: 0.5, y: 0 }}
			x={leftX}
			y={menuItemY(2) + 52}
			text={i18nDerived.info()}
			style={captionStyle}
		/>

		<Container x={leftX} y={menuItemY(3)} scale={0.46}>
			{@render props.buttonPayTable({ anchor: 0.5 })}
		</Container>
		<Text
			anchor={{ x: 0.5, y: 0 }}
			x={leftX}
			y={menuItemY(3) + 52}
			text={i18nDerived.payTable()}
			style={captionStyle}
		/>

		<!-- close sits exactly where the menu button was, so the control the
		     player just pressed does not move under their cursor -->
		<Container x={leftX} y={MENU_Y} scale={0.46}>
			{@render props.buttonMenuClose({ anchor: 0.5 })}
		</Container>
		<Text
			anchor={{ x: 0.5, y: 0 }}
			x={leftX}
			y={MENU_Y + 52}
			text={i18nDerived.menuExit()}
			style={captionStyle}
		/>
	</MainContainer>
{/if}
