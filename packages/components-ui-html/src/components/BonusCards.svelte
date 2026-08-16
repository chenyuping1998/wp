<script lang="ts">
	import { stateBet, stateModal, type BetModeData } from 'state-shared';
	import { Button } from 'components-shared';
	import { getContextEventEmitter } from 'utils-event-emitter';
	import { numberToCurrencyString } from 'utils-shared/amount';

	import BaseIcon from './BaseIcon.svelte';
	import BonusCard from './BonusCard.svelte';
	import BaseButtonContent from './BaseButtonContent.svelte';
	import { stateBonus } from '../stateBonus.svelte';
	import type { EmitterEventModal } from '../types';

	type Props = {
		list: BetModeData[];
	};

	const props: Props = $props();
	const { eventEmitter } = getContextEventEmitter<EmitterEventModal>();
</script>

{#each props.list as betModeData}
	{#if betModeData.type !== 'default'}
		<BonusCard>
			{#snippet title()}
				<div class="title">
					{betModeData.text.title}
				</div>
			{/snippet}

			{#snippet description()}
				<!--
					Optional icon above the description. Opt-in by construction: it
					renders only when a game puts a non-empty `assets.icon` on the bet
					mode, and every game in this repo other than Triple Witching leaves
					it as the empty string, so none of them change.

					It is an <img src>, not an asset key - these cards are DOM, not
					pixi, so the game supplies a URL.
				-->
				{#if betModeData?.assets?.icon}
					<img class="icon" src={betModeData.assets.icon} alt="" aria-hidden="true" />
				{/if}
				{#if betModeData?.text?.description}
					<div class="description">
						{betModeData.text.description}
					</div>
				{/if}
			{/snippet}

			{#snippet price()}
				<div class="price">
					{`${numberToCurrencyString(stateBet.betAmount * betModeData.costMultiplier)}`}
				</div>
			{/snippet}

			{#snippet button()}
				<Button
					onclick={() => {
						stateBonus.selectedBetModeKey = betModeData.mode;
						eventEmitter.broadcast({ type: 'buyBonusConfirm' });
						eventEmitter.broadcast({ type: 'soundPressGeneral' });
					}}
					disabled={stateBet.betAmount <= 0 ||
						stateBet.balanceAmount < stateBet.betAmount * betModeData.costMultiplier}
				>
					<BaseIcon width="100%" height="2rem" border="2px solid white;" />
					<BaseButtonContent>
						<span style="font-size: 1rem;">{betModeData.text.button}</span>
					</BaseButtonContent>
				</Button>
			{/snippet}
		</BonusCard>
	{/if}
{/each}

<style lang="scss">
	.title {
		font-size: 1rem;
		line-height: 1rem;
		text-align: center;
	}

	.icon {
		display: block;
		height: 1.75rem;
		width: auto;
		margin: 0 auto 0.35rem;
		/* the art is a thin white outline; a little glow keeps it from
		   disappearing into a pale card background */
		filter: drop-shadow(0 0 2px rgba(255, 255, 255, 0.45));
	}

	.description {
		font-size: 0.75rem;
		text-align: center;
		min-height: 4rem;
		white-space: pre-line;
		display: inline-flex;
		align-items: center;
	}

	.description:empty {
		display: none;
	}

	.price {
		font-size: 1rem;
		line-height: 1rem;
		text-align: center;
		white-space: nowrap;
	}
</style>
