<script lang="ts">
	import { Popup } from 'components-shared';
	import { zIndex } from 'constants-shared/zIndex';
	import { stateModal, stateMetaDerived, stateBet } from 'state-shared';
	import { getContextEventEmitter } from 'utils-event-emitter';
	import { numberToCurrencyString } from 'utils-shared/amount';
	import { stateBonus } from 'components-ui-html/src/stateBonus.svelte';
	import type { EmitterEventModal } from 'components-ui-html/src/types';

	import assets from '../../game/assets';
	import { popupGhost } from './popupGhost';
	import BetStepper from './BetStepper.svelte';
	import { gameRulesText } from '../../game/rulesText';
	import { rulesLang } from '../../game/rulesCommon';
	import { stateUrlDerived } from 'state-shared';
	import { getSocialTerms } from '../../game/socialTerms';
	import { gameText } from '../../game/i18nText';
	import { FEATURE_RULES } from '../../game/featureRules';

	/**
	 * The feature-buy menu, overriding the shared one: one CARD per buy mode
	 * (FREE GAME 100×, SUPER FREE GAME 250×) — the feature scene behind it, the
	 * Scatter count that opens it and the WILD card it plays for drawn rather
	 * than described, and the price. The card wears the parchment frame
	 * (waPanel) over a sepia field; colours come from game/palette.ts.
	 */
	const { eventEmitter } = getContextEventEmitter<EmitterEventModal>();
	// Read at render time, like the other panels: social() reads the page URL.
	const T = $derived(getSocialTerms());
	const buyList = $derived(
		stateMetaDerived.betModeMetaList().filter((item) => item.type === 'buy'),
	);

	// The menu's own copy: the player's language in real-money play
	// (game/i18nText.ts, 16 locales), socialTerms' vetted English in social play.
	const social = $derived(stateUrlDerived.social());
	const L = $derived({
		title: social ? T.featureMenuTitle : gameText('buyMenuTitle'),
		lede: social ? T.featureMenuLede : gameText('buyMenuLede', { n: buyList.length }),
		short: social ? T.insufficientForMode : gameText('buyShort'),
	});
	const rtl = $derived(rulesLang() === 'ar' ? 'rtl' : undefined);

	const src = (key: string) => (assets as unknown as Record<string, { src?: string }>)[key]?.src ?? '';

	/** Per-tier art, keyed by the maths mode so it cannot drift from betModeMeta. */
	const G = $derived(gameRulesText(rulesLang(), T, stateUrlDerived.social()));
	const TIER_ART = $derived<Record<string, { backdrop: string; crop: string; accent: string; glow: string; lights: number; givesLabel: string; scatters: number; rank: number }>>({
		BONUS: { backdrop: src('waSceneFgBase'), crop: '50% 0%', accent: '#c8973a', glow: 'rgba(200,151,58,.55)', lights: 1, givesLabel: G.tiers[0], scatters: FEATURE_RULES.triggerCells, rank: 1 },
		SUPER_BONUS: { backdrop: src('waWinSuperBg'), crop: '50% 45%', accent: '#ead2a0', glow: 'rgba(63,138,110,.6)', lights: 2, givesLabel: G.tiers[1], scatters: 0, rank: 2 },
	});

	const costOf = (multiplier: number) => stateBet.betAmount * multiplier;
	const affordable = (multiplier: number) =>
		stateBet.betAmount > 0 && stateBet.balanceAmount >= costOf(multiplier);

	const choose = (mode: string) => {
		stateBonus.selectedBetModeKey = mode;
		eventEmitter.broadcast({ type: 'buyBonusConfirm' });
		eventEmitter.broadcast({ type: 'soundPressGeneral' });
	};
</script>

{#if stateModal.modal?.name === 'buyBonus'}
	<Popup zIndex={zIndex.modal} onclose={() => (stateModal.modal = null)}>
		<div class="hm-buy" use:popupGhost dir={rtl}>
			<header>
				<h2>{L.title}</h2>
				<p class="lede">{L.lede}</p>
				<div class="amount"><BetStepper /></div>
			</header>

			<div class="cards">
				{#each buyList as betMode (betMode.mode)}
					{@const art = TIER_ART[betMode.mode]}
					{@const cost = costOf(betMode.costMultiplier)}
					{@const canBuy = affordable(betMode.costMultiplier)}
					<section
						class="card"
						style:--card-frame={`url("${src('waPanel')}")`}
						class:top={art?.rank === 2}
						style:--accent={art?.accent ?? '#c8973a'}
						style:--glow={art?.glow ?? 'rgba(200,151,58,0.5)'}
					>
						<!-- the tier's own scene, dimmed so the type stays legible over it:
						     FREE GAME the tower-top sky it opens on (waSceneFgBase), SUPER
						     FREE GAME the SUPER WIN scene (waWinSuperBg) — two different
						     pictures so the cards never read as one card printed twice -->
						{#if art?.backdrop}
							<div
								class="backdrop"
								style:background-image={`url(${art.backdrop})`}
								style:background-position={art.crop}
							></div>
						{/if}
						<div class="shine" style:animation-delay={`${(art?.rank ?? 1) * 0.7}s`}></div>

						<div class="art">
							<!-- what OPENS the tier, drawn rather than described -->
							<div class="scatters">
								{#each Array(art?.scatters ?? 3) as _, index (index)}
									<img
										class="scatter"
										style:animation-delay={`${index * 0.18}s`}
										src={src('hmS')}
										alt=""
									/>
								{/each}
							</div>
							<!-- and what the tier GIVES you -->
							<div class="frames">
								{#each Array(art?.lights ?? 1) as _, index (index)}
									<img class="frame" style:animation-delay={`${index * 0.12}s`} src={src('hmW')} alt="" />
								{/each}
							</div>
						</div>

						<h3>{betMode.text.title}</h3>
						<p class="gives">{art?.givesLabel}</p>

						<div class="price">
							<span class="mult">{betMode.costMultiplier}×</span>
							<span class="money">{numberToCurrencyString(cost)}</span>
						</div>

						<button type="button" disabled={!canBuy} onclick={() => choose(betMode.mode)}>
							{betMode.text.button}
						</button>
						{#if !canBuy}
							<p class="short">{L.short}</p>
						{/if}
					</section>
				{/each}
			</div>
		</div>
	</Popup>
{/if}

<style lang="scss">
	.hm-buy {
		/*
		 * Sit above Popup's full-screen click-to-close layer, which is z-index 2
		 * INSIDE the same stacking context. Without this the panel renders under
		 * it: everything is visible, nothing is clickable, and a click on a card
		 * closes the menu instead of buying — which is exactly how this shipped and
		 * was reported as "the buy bonus can't be clicked".
		 *
		 * z-index only applies to a positioned element, so `position: relative` is
		 * load-bearing here, not decoration. ModalPayTable carries the same pair
		 * with the same comment; this one was written without it.
		 */
		position: relative;
		z-index: 100;
		width: min(94vw, 61rem);
		max-height: 88vh;
		overflow-y: auto;
		padding: 1.1rem 1.1rem 1.4rem;
		color: var(--capo-bone);
		font-family: var(--gb-body-font);
	}

	header {
		text-align: center;
		margin-bottom: 0.9rem;

		h2 {
			font-family: var(--hm-title-font);
			font-size: 1.5rem;
			letter-spacing: 0.06em;
			margin: 0 0 0.2rem;
			color: var(--capo-gold);
		}

		.lede {
			margin: 0 auto 0.7rem;
			max-width: 34rem;
			font-size: 0.82rem;
			line-height: 1.35;
			opacity: 0.85;
		}

		.amount {
			display: flex;
			justify-content: center;
		}
	}

	.cards {
		display: grid;
		/* two buys (FREE GAME, SUPER FREE GAME): two columns, centred — a third
		   empty column left the pair hugging the left of the panel */
		grid-template-columns: repeat(2, minmax(0, 19rem));
		justify-content: center;
		gap: 0.8rem;

		/* One column once two cards would be narrower than their own art. The
		   shared menu's cards were reported unreadable on Mobile S, so the floor
		   here is a column count rather than a font size. */
		@media (max-width: 46rem) {
			grid-template-columns: 1fr;
		}
	}

	.card {
		position: relative;
		overflow: hidden;
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 0.9rem 0.8rem 1rem;
		/*
			The drawn Art Deco frame, 9-sliced.

			This was a 1.5px CSS hairline on a rounded rect — the one panel in the
			game with no artwork on it, and the one where the player commits money.
			The card is responsive (two columns, one on narrow screens, and its
			height follows the copy), so the frame is a border-image: the 96px
			corners never distort and the edges stretch between them.

			background-clip: padding-box keeps the card's own gradient inside the
			frame instead of running under it and darkening the metal.
		*/
		border-style: solid;
		border-width: 1.7rem;
		/* waPanel (ui-modal-b, 1060×673 runtime): parchment frame with verdigris
		   corner leaves; 58 source px takes the whole frame band and its corners */
		border-image: var(--card-frame) 58 stretch;
		background: linear-gradient(180deg, rgba(var(--capo-ink-rgb), 0.9), rgba(var(--capo-ink-deep-rgb), 0.96));
		background-clip: padding-box;
		box-shadow: 0 6px 22px rgba(0, 0, 0, 0.45);
		animation: cardPulse 3.2s ease-in-out infinite;

		/* The tier no longer separates itself by border colour — every card wears
		   the same frame. The top tier keeps its glow, and the accent still marks
		   the title and the button. */
		&.top {
			box-shadow:
				0 0 26px var(--glow),
				0 8px 26px rgba(0, 0, 0, 0.5);
		}
	}

	/* the tier's scene, behind the icons only: it fades out above the title so
	   the copy and every number (cost multiple, amount) sit on the plain sepia
	   field, never on the illustration (house rule E1) */
	.backdrop {
		position: absolute;
		inset: 0;
		background-size: cover;
		background-position: center;
		opacity: 0.3;
		filter: saturate(1.15);
		-webkit-mask-image: linear-gradient(180deg, #000 0%, #000 22%, transparent 42%);
		mask-image: linear-gradient(180deg, #000 0%, #000 22%, transparent 42%);
	}

	/* preview motion: a slow shine crossing the card, staggered per tier so the
	   cards do not sweep in lockstep */
	.shine {
		position: absolute;
		top: -60%;
		left: -55%;
		width: 45%;
		height: 220%;
		transform: rotate(18deg);
		background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.16), transparent);
		animation: shine 5.6s ease-in-out infinite;
		pointer-events: none;
	}

	.art {
		position: relative;
		width: 100%;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.35rem;
		margin-bottom: 0.5rem;
	}

	.scatters {
		display: flex;
		justify-content: center;
		gap: 0.15rem;
	}

	.scatter {
		width: 2.1rem;
		height: 2.1rem;
		filter: drop-shadow(0 0 6px var(--glow));
		animation: bob 2.4s ease-in-out infinite;
	}

	.frames {
		display: flex;
		justify-content: center;
		gap: 0.1rem;
		min-height: 1.5rem;
	}

	.frame {
		/* The WILD card sprite is a framed card, so it needs size and glow to
		   read as gold at card scale — at 1.45rem it looked like an empty box. */
		width: 2rem;
		height: 2rem;
		opacity: 0.95;
		filter: drop-shadow(0 0 5px rgba(var(--capo-gold-rgb), 0.75));
		animation: framePulse 2.8s ease-in-out infinite;
	}

	h3 {
		position: relative;
		margin: 0.1rem 0 0.15rem;
		font-family: var(--hm-title-font);
		font-size: 1.02rem;
		letter-spacing: 0.05em;
		color: var(--accent);
		text-align: center;
	}

	.gives {
		position: relative;
		margin: 0 0 0.55rem;
		padding: 0 0.35rem;
		font-size: 0.74rem;
		min-height: 1.6em;
		text-align: center;
		opacity: 0.82;
	}

	.price {
		position: relative;
		display: flex;
		flex-direction: column;
		align-items: center;
		margin-bottom: 0.6rem;

		.mult {
			font-family: var(--hm-title-font);
			font-size: 1.55rem;
			line-height: 1;
			color: #fff;
			text-shadow: 0 0 12px var(--glow);
		}

		.money {
			font-size: 0.8rem;
			opacity: 0.85;
		}
	}

	.card.top .price .mult {
		font-size: 1.9rem;
	}

	button {
		position: relative;
		width: 100%;
		padding: 0.5rem 0.4rem;
		border: 0;
		border-radius: 0.5rem;
		cursor: pointer;
		font-family: var(--hm-title-font);
		font-size: 0.85rem;
		letter-spacing: 0.04em;
		color: var(--capo-ink-deep);
		background: linear-gradient(180deg, var(--accent), color-mix(in srgb, var(--accent) 65%, #000));
		box-shadow: 0 2px 0 rgba(0, 0, 0, 0.45);

		&:disabled {
			cursor: not-allowed;
			filter: grayscale(0.8) brightness(0.7);
		}
	}

	.short {
		position: relative;
		margin: 0.35rem 0 0;
		font-size: 0.68rem;
		text-align: center;
		color: var(--capo-gold-light);
	}

	@keyframes shine {
		0%,
		62% {
			transform: translateX(0) rotate(18deg);
		}
		100% {
			transform: translateX(320%) rotate(18deg);
		}
	}

	@keyframes bob {
		0%,
		100% {
			transform: translateY(0);
		}
		50% {
			transform: translateY(-0.16rem);
		}
	}

	@keyframes framePulse {
		0%,
		100% {
			opacity: 0.78;
			filter: drop-shadow(0 0 4px rgba(var(--capo-gold-rgb), 0.6));
		}
		50% {
			opacity: 1;
			filter: drop-shadow(0 0 11px rgba(var(--capo-gold-rgb), 0.95));
		}
	}

	@keyframes cardPulse {
		0%,
		100% {
			border-color: color-mix(in srgb, var(--accent) 45%, transparent);
		}
		50% {
			border-color: color-mix(in srgb, var(--accent) 85%, transparent);
		}
	}

	/* Motion here is decoration, not information: anyone who has asked their
	   system to stop animating gets the cards without it. */
	@media (prefers-reduced-motion: reduce) {
		.card,
		.shine,
		.scatter,
		.frame {
			animation: none;
		}
	}
</style>
