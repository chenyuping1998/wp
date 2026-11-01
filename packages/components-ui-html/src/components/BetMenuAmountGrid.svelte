<script lang="ts">
	import { OptionsGrid } from 'components-shared';
	import { stateBet, stateBetDerived, stateConfig } from 'state-shared';

	import BaseIcon from './BaseIcon.svelte';
	import BaseButtonContent from './BaseButtonContent.svelte';
	import { i18nDerived } from '../i18n/i18nDerived';

	// Every stake the server offers, de-duplicated.
	//
	// This used to keep only the first 14/17 entries plus the last one, which on a
	// ladder longer than that silently dropped the middle of the range — a player
	// could not select a stake the server had told us was available. The menu is
	// the UI for the server's betting parameters, so it lists all of them and lets
	// the grid wrap.
	const options = $derived(
		stateConfig.betMenuOptions.filter((value, index, array) => array.indexOf(value) === index),
	);

	const isMaxValue = (value: number) => value === options[options.length - 1];
	// Stake review, 2026-10-20 (Sushi Monkey): "all values are displayed fully
	// without K or M abbreviations" — so 1,000.00, never 1.00K. The longest
	// labels step the type down instead so they still fit three to a row.
	const formatValue = (value: number) =>
		Math.abs(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
	const labelSize = (text: string) => (text.length > 10 ? '0.72rem' : text.length > 8 ? '0.82rem' : '1rem');
</script>

<!--
	Assigned through setBetAmount, not straight onto stateBet.betAmount.
	A raw assignment skips every check in correctBetAmount — the server's
	min/max, and affordability — so the menu could hand out a stake the player
	could not cover (MAX on a $3.40 balance selected $100.00) while the +/-
	steppers, which do go through it, could not. One entry point, one set of
	rules.
-->
<OptionsGrid
	value={stateBet.betAmount}
	{options}
	onchange={(value) => stateBetDerived.setBetAmount(value)}
>
	{#snippet option({ option })}
		<BaseIcon
			width="100%"
			height="2rem"
			border={option === stateBet.betAmount ? '2px white solid' : '2px black solid'}
		/>
		<BaseButtonContent>
			{@const label = isMaxValue(option) ? i18nDerived.max() : formatValue(option)}
			<span style="font-size: {labelSize(label)}; white-space: nowrap;">{label}</span>
		</BaseButtonContent>
	{/snippet}
</OptionsGrid>
