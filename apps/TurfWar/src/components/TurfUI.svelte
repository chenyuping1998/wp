<script lang="ts">
	import type { Snippet } from 'svelte';
	import LayoutBottomBar from 'components-ui-pixi/src/components/LayoutBottomBar.svelte';
	import LayoutPortrait from 'components-ui-pixi/src/components/LayoutPortrait.svelte';
	import { getContext } from '../game/context';

	import { EnableSpaceHold } from 'components-shared';

	import UiFadeContainer from './TurfUiFade.svelte';
	import LabelBalance from 'components-ui-pixi/src/components/LabelBalance.svelte';
	import LabelWin from 'components-ui-pixi/src/components/LabelWin.svelte';
	import LabelBet from 'components-ui-pixi/src/components/LabelBet.svelte';
	import ButtonPayTable from 'components-ui-pixi/src/components/ButtonPayTable.svelte';
	import ButtonGameRules from 'components-ui-pixi/src/components/ButtonGameRules.svelte';
	import ButtonSettings from 'components-ui-pixi/src/components/ButtonSettings.svelte';
	import ButtonBuyBonus from 'components-ui-pixi/src/components/ButtonBuyBonus.svelte';
	import ButtonBet from 'components-ui-pixi/src/components/ButtonBet.svelte';
	import ButtonTurbo from 'components-ui-pixi/src/components/ButtonTurbo.svelte';
	import ButtonAutoSpin from 'components-ui-pixi/src/components/ButtonAutoSpin.svelte';
	import ButtonIncrease from 'components-ui-pixi/src/components/ButtonIncrease.svelte';
	import ButtonDecrease from 'components-ui-pixi/src/components/ButtonDecrease.svelte';
	import ButtonMenu from 'components-ui-pixi/src/components/ButtonMenu.svelte';
	import ButtonMenuClose from 'components-ui-pixi/src/components/ButtonMenuClose.svelte';
	import ButtonSoundSwitch from 'components-ui-pixi/src/components/ButtonSoundSwitch.svelte';
	import EnableShortcuts from 'components-ui-pixi/src/components/EnableShortcuts.svelte';
	import { platformUx } from 'components-ui-pixi/src/platformUx.svelte';

	type Props = {
		gameName: Snippet;
		logo: Snippet;
	};

	const props: Props = $props();


	// Same strip as the approved Capo Nostra / Deadwood / Banandit builds
	// (「turf UI BAR 參考其他送審過關的改」 2026-10-25). The app-local TurfConsole
	// drew a 150-tall slab with a small boxed spin and oversized steppers — the
	// bar tagged "Poor bet UI bar" on 10-23. Geometry lives in uiTheme.ts.
	const context = getContext();
	const LayoutComponent = $derived(
		context.stateLayoutDerived.layoutType() === 'portrait' ? LayoutPortrait : LayoutBottomBar,
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
