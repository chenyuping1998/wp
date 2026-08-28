<script lang="ts">
	import type { Snippet } from 'svelte';

	import { getContextLayout } from 'utils-layout';
	import { EnableSpaceHold } from 'components-shared';

	import UiFadeContainer from './UiFadeContainer.svelte';
	import LayoutDesktop from './LayoutDesktop.svelte';
	import LayoutPortrait from './LayoutPortrait.svelte';
	import LayoutLandscape from './LayoutLandscape.svelte';
	import LayoutTablet from './LayoutTablet.svelte';
	import LayoutSideRail from './LayoutSideRail.svelte';
	import LayoutBottomBar from './LayoutBottomBar.svelte';
	import { uiTheme } from '../theme.svelte';
	import LabelBalance from './LabelBalance.svelte';
	import LabelWin from './LabelWin.svelte';
	import LabelBet from './LabelBet.svelte';
	import ButtonPayTable from './ButtonPayTable.svelte';
	import ButtonGameRules from './ButtonGameRules.svelte';
	import ButtonSettings from './ButtonSettings.svelte';
	import ButtonBuyBonus from './ButtonBuyBonus.svelte';
	import ButtonBet from './ButtonBet.svelte';
	import ButtonTurbo from './ButtonTurbo.svelte';
	import ButtonAutoSpin from './ButtonAutoSpin.svelte';
	import ButtonIncrease from './ButtonIncrease.svelte';
	import ButtonDecrease from './ButtonDecrease.svelte';
	import ButtonMenu from './ButtonMenu.svelte';
	import ButtonMenuClose from './ButtonMenuClose.svelte';
	import ButtonSoundSwitch from './ButtonSoundSwitch.svelte';
	import EnableShortcuts from './EnableShortcuts.svelte';
	import { platformUx } from '../platformUx.svelte';

	type Props = {
		gameName: Snippet;
		logo: Snippet;
	};

	const props: Props = $props();

	const { stateLayoutDerived } = getContextLayout();

	const LAYOUT_COMPONENT_MAP = {
		desktop: LayoutDesktop,
		portrait: LayoutPortrait,
		landscape: LayoutLandscape,
		tablet: LayoutTablet,
	};

	const WIDE_LAYOUT_MAP = {
		sideRail: LayoutSideRail,
		compactBottom: LayoutBottomBar,
	};

	// Runtime override, so the arrangements can be compared on a build that is
	// already deployed instead of rebuilding to switch:
	//
	//   localStorage.setItem('betBarLayout', 'sideRail')       previous layout
	//   localStorage.setItem('betBarLayout', 'compactBottom')  the strip
	//   localStorage.removeItem('betBarLayout')                back to the game's own
	//
	// Reading it once at module scope is deliberate — the layout is chosen when the
	// UI mounts, and a value that changed mid-session would only confuse.
	const override =
		typeof localStorage !== 'undefined' ? localStorage.getItem('betBarLayout') : null;
	const requested = $derived(
		override && override in WIDE_LAYOUT_MAP ? override : uiTheme.betBarLayout,
	);

	// Portrait keeps the full bottom bar whatever the theme asks for — there is no
	// horizontal room for rails or a compact strip on a 1080x1920 box.
	const LayoutComponent = $derived(
		stateLayoutDerived.layoutType() !== 'portrait' && requested in WIDE_LAYOUT_MAP
			? WIDE_LAYOUT_MAP[requested as keyof typeof WIDE_LAYOUT_MAP]
			: LAYOUT_COMPONENT_MAP[stateLayoutDerived.layoutType()],
	);
</script>

<EnableSpaceHold />
<!--
	Shift-gated keyboard shortcuts — only mounted for a game that opted into
	uiTheme.platformUx, so a game without the flag gains no keyboard surface at
	all rather than gaining one that is merely inert.
-->
{#if platformUx()?.shortcuts}
	<EnableShortcuts />
{/if}

<UiFadeContainer>
	<LayoutComponent>
		{#snippet gameName()}
			{@render props.gameName()}
		{/snippet}

		{#snippet logo()}
			{@render props.logo()}
		{/snippet}

		{#snippet amountBalance(labelProps)}
			<LabelBalance {...labelProps} />
		{/snippet}

		{#snippet amountWin(labelProps)}
			<LabelWin {...labelProps} />
		{/snippet}

		{#snippet amountBet(labelProps)}
			<LabelBet {...labelProps} />
		{/snippet}

		{#snippet buttonBuyBonus(buttonProps)}
			<ButtonBuyBonus {...buttonProps} />
		{/snippet}

		{#snippet buttonBet(buttonProps)}
			<ButtonBet {...buttonProps} />
		{/snippet}

		{#snippet buttonTurbo(buttonProps)}
			<ButtonTurbo {...buttonProps} />
		{/snippet}

		{#snippet buttonAutoSpin(buttonProps)}
			<ButtonAutoSpin {...buttonProps} />
		{/snippet}

		{#snippet buttonIncrease(buttonProps)}
			<ButtonIncrease {...buttonProps} />
		{/snippet}

		{#snippet buttonDecrease(buttonProps)}
			<ButtonDecrease {...buttonProps} />
		{/snippet}

		{#snippet buttonMenu(buttonProps)}
			<ButtonMenu {...buttonProps} />
		{/snippet}

		{#snippet buttonMenuClose(buttonProps)}
			<ButtonMenuClose {...buttonProps} />
		{/snippet}

		{#snippet buttonPayTable(buttonProps)}
			<ButtonPayTable {...buttonProps} />
		{/snippet}

		{#snippet buttonGameRules(buttonProps)}
			<ButtonGameRules {...buttonProps} />
		{/snippet}

		{#snippet buttonSettings(buttonProps)}
			<ButtonSettings {...buttonProps} />
		{/snippet}

		{#snippet buttonSoundSwitch(buttonProps)}
			<ButtonSoundSwitch {...buttonProps} />
		{/snippet}
	</LayoutComponent>
</UiFadeContainer>
