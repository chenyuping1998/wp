<script lang="ts">
	import { stateSound } from 'state-shared';
	import { MainContainer } from 'components-layout';
	import { Container, Text } from 'pixi-svelte';

	import { getContext } from '../context';
	import { uiTheme } from '../theme.svelte';
	import { UI_BASE_FONT_SIZE } from '../constants';
	import { i18nDerived } from '../i18n/i18nDerived';
	import type { LayoutUiProps } from '../types';

	// Side-rail layout: controls live in two vertical rails instead of one bottom
	// bar, which hands the whole middle of the screen to the board. Opted into per
	// game via uiTheme.betBarLayout — every other game keeps the bottom bar.
	//
	//   LEFT   pay table, rules, the oversized Buy Bonus CTA, then sound + audio
	//          settings — every control is on the rail itself, nothing is nested
	//   RIGHT  balance / win / bet readouts, then the spin pod
	//
	// There is deliberately no hamburger. It ended up holding only the sound
	// toggle and the settings panel, and that panel contains nothing but volume
	// sliders — the same master volume the toggle flips. A menu layer that hides
	// two overlapping audio controls is worse than no menu at all.
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

	// Audio controls sit below the Buy Bonus CTA. Positions measured against a
	// 1920x1080 standard box: Buy Bonus ends at 720, sound spans 776–866 (caption
	// to 891), settings 927–1017 (caption to 1042) — 56 / 37 / 38px of air.
	const SOUND_Y = $derived(box.height * 0.76);
	const SETTINGS_Y = $derived(box.height * 0.9);

	// Icon-only buttons give a player nothing to read. Every control that lives
	// directly on a rail gets a caption underneath, so the bar can be understood
	// without pressing anything to find out what it does.
	const captionStyle = $derived({
		fontFamily: uiTheme.fontFamily,
		fontWeight: uiTheme.fontWeight,
		fontSize: UI_BASE_FONT_SIZE * 0.55,
		fill: uiTheme.labelFill,
		stroke: uiTheme.valueStroke,
		strokeThickness: 3,
	});

	// Pay table and game rules are pulled out of the hamburger and onto the rail:
	// a player should not have to open a menu to find the paytable, and reviewers
	// expect both to be reachable in one press.
	const PAYTABLE_Y = $derived(box.height * 0.13);
	const RULES_Y = $derived(box.height * 0.25);
</script>

<Container x={20}>
	{@render props.gameName()}
</Container>

<Container x={context.stateLayoutDerived.canvasSizes().width - 20}>
	{@render props.logo()}
</Container>

<MainContainer standard>
	<!-- ── left rail ─────────────────────────────────────────────────────── -->
	<Container x={leftX} y={PAYTABLE_Y} scale={0.46}>
		{@render props.buttonPayTable({ anchor: 0.5 })}
	</Container>
	<Text
		anchor={{ x: 0.5, y: 0 }}
		x={leftX}
		y={PAYTABLE_Y + 52}
		text={i18nDerived.payTable()}
		style={captionStyle}
	/>

	<Container x={leftX} y={RULES_Y} scale={0.46}>
		{@render props.buttonGameRules({ anchor: 0.5 })}
	</Container>
	<Text
		anchor={{ x: 0.5, y: 0 }}
		x={leftX}
		y={RULES_Y + 52}
		text={i18nDerived.info()}
		style={captionStyle}
	/>

	<!-- oversized feature CTA; themeable via uiTheme.buyBonusRailScale -->
	<Container x={leftX} y={box.height * 0.5} scale={uiTheme.buyBonusRailScale}>
		{@render props.buttonBuyBonus({ anchor: 0.5 })}
	</Container>

	<Container x={leftX} y={SOUND_Y} scale={0.46}>
		{@render props.buttonSoundSwitch({ anchor: 0.5 })}
	</Container>
	<Text
		anchor={{ x: 0.5, y: 0 }}
		x={leftX}
		y={SOUND_Y + 52}
		text={stateSound.volumeValueMaster === 0 ? i18nDerived.soundOff() : i18nDerived.soundOn()}
		style={captionStyle}
	/>

	<Container x={leftX} y={SETTINGS_Y} scale={0.46}>
		{@render props.buttonSettings({ anchor: 0.5 })}
	</Container>
	<Text
		anchor={{ x: 0.5, y: 0 }}
		x={leftX}
		y={SETTINGS_Y + 52}
		text={i18nDerived.settings()}
		style={captionStyle}
	/>

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
