<script lang="ts">
	import { Popup } from 'components-shared';
	import { zIndex } from 'constants-shared/zIndex';
	import { stateBet, stateBetDerived, stateConfig, stateModal } from 'state-shared';
	import { getContextEventEmitter } from 'utils-event-emitter';
	import BaseContent from 'components-ui-html/src/components/BaseContent.svelte';
	import BaseTitle from 'components-ui-html/src/components/BaseTitle.svelte';
	import { i18nDerived } from 'components-ui-html/src/i18n/i18nDerived';
	import type { EmitterEventModal } from 'components-ui-html/src/types';

	import BetStepper from './BetStepper.svelte';
	import { popupGhost } from './popupGhost';

	/**
	 * The Bet menu, this game's own — overriding components-ui-html's ModalBetMenu.
	 *
	 * The shared one was never reskinned, and a restyle from outside could not get
	 * it there, for three separate reasons:
	 *
	 *   · Its chips are `BaseIcon` rectangles that take their border as an INLINE
	 *     style — white for the selected stake, black for the rest. Modals.svelte
	 *     skins every `.rectangle` with `border: … !important`, which is the only
	 *     way to beat an inline style, and so it also wiped out the one thing that
	 *     marked the current bet. The menu showed nine identical chips.
	 *   · Every label sits in a <button>, and <button> does not inherit
	 *     font-family. The modal font rules set it on .pop-up-wrap and its text
	 *     elements, the buttons ignored it, and every number in this menu came out
	 *     in the operating system's default sans.
	 *   · The ± signs are text glyphs (see BetStepper).
	 *
	 * Same state calls as the shared menu, so behaviour is unchanged: every stake
	 * the server offers, de-duplicated, set through setBetAmount.
	 */
	const { eventEmitter } = getContextEventEmitter<EmitterEventModal>();

	const options = $derived(
		stateConfig.betMenuOptions.filter((value, index, array) => array.indexOf(value) === index),
	);

	const isMax = (value: number) => value === options[options.length - 1];

	// As the shared grid formats: bare amounts, K / M above a thousand.
	const format = (value: number) => {
		const abs = Math.abs(value);
		if (abs > 999999) return `${(abs / 1000000).toFixed(2)}M`;
		if (abs > 999) return `${(abs / 1000).toFixed(2)}K`;
		return abs.toFixed(2);
	};

	const choose = (value: number) => {
		stateBetDerived.setBetAmount(value);
		eventEmitter.broadcast({ type: 'soundPressGeneral' });
	};

	const close = () => (stateModal.modal = null);
</script>

{#if stateModal.modal?.name === 'betAmountMenu'}
	<Popup zIndex={zIndex.modal} onclose={close}>
		<BaseContent maxWidth="100%">
			<div class="bet-menu" use:popupGhost>
				<BaseTitle>{i18nDerived.betMenu()}</BaseTitle>
				<div class="rule" aria-hidden="true"></div>
				<span class="prompt">{i18nDerived.selectYourBet()}</span>

				<BetStepper />

				<div class="chips">
					{#each options as option (option)}
						<button
							class="chip"
							class:selected={option === stateBet.betAmount}
							class:max={isMax(option)}
							aria-pressed={option === stateBet.betAmount}
							onclick={() => choose(option)}
						>
							<span class="label">{isMax(option) ? i18nDerived.max() : format(option)}</span>
						</button>
					{/each}
				</div>

				<button class="confirm" data-test="confirm-button" onclick={close}>
					<span class="label">{i18nDerived.confirm()}</span>
				</button>
			</div>
		</BaseContent>
	</Popup>
{/if}

<style lang="scss">
	.bet-menu {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.9rem;
		// The viewport less the panel around it: BaseContent's 1.5rem padding each
		// side, this box's own 0.75rem, and its border. 86vw alone overran a 320px
		// phone by ~10px and clipped both edges of the panel.
		width: min(24rem, calc(100vw - 5rem - 4px));
		max-height: 100%;
		min-height: 0;
		overflow-y: auto;
		// Room for the glows. This is the scroll box, and a scroll box clips its
		// children's shadows at its edge — without the padding CONFIRM's drop
		// shadow was cut off square and read as a dark plate behind the button.
		padding: 0.5rem 0.75rem 0.9rem;
	}

	.bet-menu :global(.ui-modal-title-wrap) {
		color: var(--turf-gold);
		font-size: 1.35rem;
		// Modals.svelte gives the title letter-spacing, and letter-spacing is added
		// AFTER every glyph, the last one included — so a centred title sits half
		// a space left of centre. The indent puts the same space back in front.
		text-indent: 0.06em;
	}

	// A short gold rule with a diamond, the same ornament as the paytable heads.
	.rule {
		position: relative;
		width: 60%;
		height: 1px;
		margin-top: -0.4rem;
		background: linear-gradient(
			90deg,
			transparent,
			rgba(var(--turf-gold-rgb), 0.8) 50%,
			transparent
		);

		&::after {
			content: '';
			position: absolute;
			left: 50%;
			top: 50%;
			width: 6px;
			height: 6px;
			background: var(--turf-gold);
			transform: translate(-50%, -50%) rotate(45deg);
		}
	}

	.prompt {
		font-family: var(--gb-body-font, sans-serif);
		font-size: 0.8rem;
		letter-spacing: 0.14em;
		text-indent: 0.14em;
		text-transform: uppercase;
		color: rgba(var(--turf-bone-rgb), 0.7);
	}

	.chips {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 0.6rem;
		width: 100%;

		@media (max-height: 480px) {
			grid-template-columns: repeat(4, 1fr);
		}
	}

	// Every label in here is centred the same way: the button is a grid with
	// place-items: center and the label has line-height 1, so the line box is
	// the em box and the only offset left is the face's own — measured, see
	// .label below.
	.chip,
	.confirm {
		display: grid;
		place-items: center;
		padding: 0;
		cursor: pointer;
		transition:
			border-color 0.15s ease,
			box-shadow 0.15s ease,
			background 0.15s ease,
			transform 0.1s ease;

		&:active {
			transform: scale(0.96);
		}

		&:focus-visible {
			outline: 2px solid var(--turf-gold-light);
			outline-offset: 2px;
		}
	}

	// The FACE is set on the label, not on the button. Modals.svelte gives every
	// .pop-up-wrap button the body face with !important (so the shared panels'
	// buttons stop falling back to the OS sans), and that beats anything set on
	// these buttons here. The span inherits nothing it does not ask for.
	.label {
		display: block;
		line-height: 1;
		white-space: nowrap;
		font-family: var(--hm-number-font, sans-serif);
	}

	.chip {
		height: 2.6rem;
		border-radius: 8px;
		border: 1px solid rgba(var(--turf-gold-rgb), 0.35);
		background: linear-gradient(
			180deg,
			rgba(var(--turf-ink-rgb), 0.95) 0%,
			rgba(var(--turf-ink-deep-rgb), 1) 100%
		);
		box-shadow: inset 0 1px 0 rgba(var(--turf-bone-rgb), 0.06);
		color: var(--turf-bone);
		font-size: 0.95rem;
		font-weight: 700;
		font-variant-numeric: tabular-nums;

		&:hover {
			border-color: rgba(var(--turf-gold-rgb), 0.8);
			box-shadow: 0 0 12px rgba(var(--turf-gold-rgb), 0.25);
		}

		// MAX is a word, not a number: the title face, spaced like the other caps.
		&.max .label {
			font-family: var(--hm-title-font, serif);
			letter-spacing: 0.12em;
			text-indent: 0.12em;
		}

		// The current stake: a wine chip with a gold edge and gold figures. Wine,
		// not a gold fill — §0 keeps gold to edges and marks, never fields.
		&.selected {
			border: 2px solid var(--turf-gold);
			background: linear-gradient(
				180deg,
				var(--turf-wine) 0%,
				var(--turf-wine-deep) 100%
			);
			color: var(--turf-gold-light);
			box-shadow:
				0 0 14px rgba(var(--turf-gold-rgb), 0.4),
				inset 0 1px 0 rgba(var(--turf-gold-light-rgb), 0.2);
		}
	}

	// Wine with a gold edge and gold lettering, like the selected chip but
	// larger. It is not a gold slab: §0 keeps gold to edges and marks.
	.confirm {
		width: 100%;
		height: 3rem;
		margin-top: 0.3rem;
		border-radius: 10px;
		border: 2px solid var(--turf-gold);
		background: linear-gradient(
			180deg,
			var(--turf-wine) 0%,
			var(--turf-wine-deep) 100%
		);
		box-shadow:
			0 4px 14px rgba(0, 0, 0, 0.5),
			inset 0 1px 0 rgba(var(--turf-gold-light-rgb), 0.25);
		color: var(--turf-gold-light);
		font-weight: 700;
		font-size: 1.1rem;

		.label {
			font-family: var(--hm-title-font, serif);
			letter-spacing: 0.16em;
			text-indent: 0.16em;
		}

		&:hover {
			border-color: var(--turf-gold-light);
			box-shadow:
				0 0 18px rgba(var(--turf-gold-rgb), 0.5),
				inset 0 1px 0 rgba(var(--turf-gold-light-rgb), 0.3);
		}
	}
</style>
