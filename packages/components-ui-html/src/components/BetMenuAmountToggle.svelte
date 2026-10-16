<script lang="ts">
	import { stateBet, stateBetDerived, stateConfig } from 'state-shared';
	import { Button, OptionsToggle } from 'components-shared';
	import { getContextEventEmitter } from 'utils-event-emitter';
	import { numberToCurrencyString } from 'utils-shared/amount';

	import BaseIcon from './BaseIcon.svelte';
	import BaseButtonContent from './BaseButtonContent.svelte';
	import type { EmitterEventModal } from '../types';

	const { eventEmitter } = getContextEventEmitter<EmitterEventModal>();

	const iconSize = '2.5rem';
</script>

<OptionsToggle
	value={stateBet.betAmount}
	options={stateConfig.betAmountOptions}
	onchange={(value) => {
		// Through setBetAmount for the same reason as BetMenuAmountGrid: a raw
		// assignment bypasses the server's limits and the affordability check.
		stateBetDerived.setBetAmount(value);
		eventEmitter.broadcast({ type: 'soundPressGeneral' });
	}}
>
	{#snippet children({ disabledDown, disabledUp, toggleDown, toggleUp })}
		<div class="toggle-wrap">
			<Button data-test="down-button" disabled={disabledDown} onclick={toggleDown}>
				<BaseIcon width={iconSize} height={iconSize} />
				<BaseButtonContent>
					<span class="sign" style="font-size: 2rem;" aria-label="-"></span>
				</BaseButtonContent>
			</Button>

			<span class="amount">{numberToCurrencyString(stateBet.betAmount)}</span>

			<Button data-test="up-button" disabled={disabledUp} onclick={toggleUp}>
				<BaseIcon width={iconSize} height={iconSize} />
				<BaseButtonContent>
					<span class="sign plus" style="font-size: 2rem;" aria-label="+"></span>
				</BaseButtonContent>
			</Button>
		</div>
	{/snippet}
</OptionsToggle>

<style lang="scss">
	/* Drawn, not typed: a '+' or '-' glyph sits on the font's math axis, which
	   is a little below the middle in most faces, so the signs read low in their
	   square (Pickle Panic 2026-10-16). Two bars are centred whatever the font. */
	.sign {
		position: relative;
		display: block;
		width: 0.5em;
		height: 0.5em;
	}
	.sign::before,
	.plus::after {
		content: '';
		position: absolute;
		left: 0;
		top: 50%;
		width: 100%;
		height: 0.09em;
		transform: translateY(-50%);
		background: currentColor;
		border-radius: 0.02em;
	}
	.plus::after {
		transform: translateY(-50%) rotate(90deg);
	}

	.toggle-wrap {
		display: flex;
		flex-direction: row;
		align-items: center;
		gap: 0.5rem;
	}
</style>
