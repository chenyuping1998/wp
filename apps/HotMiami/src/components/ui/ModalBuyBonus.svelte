<script lang="ts">
	import { Popup } from 'components-shared';
	import { zIndex } from 'constants-shared/zIndex';
	import { stateModal, stateMetaDerived, stateBet } from 'state-shared';
	import { getContextEventEmitter } from 'utils-event-emitter';
	import { numberToCurrencyString } from 'utils-shared/amount';
	import BetMenuAmountToggle from 'components-ui-html/src/components/BetMenuAmountToggle.svelte';
	import { stateBonus } from 'components-ui-html/src/stateBonus.svelte';
	import type { EmitterEventModal } from 'components-ui-html/src/types';

	import assets from '../../game/assets';
	import { popupGhost } from './popupGhost';
	import { getSocialTerms } from '../../game/socialTerms';

	/**
	 * Hot Miami's feature-buy menu, overriding the shared one.
	 *
	 * The shared `ModalBuyBonus` renders each mode as a title, a line of
	 * description and a price — three text tiers in a list. A sibling game in this
	 * repo shipped exactly that and the only free-text comment its review left was
	 * **"Bonus buy menu is too simple"**; the note in the review log is that
	 * competitors ship illustrated tier cards with distinct art, preview motion and
	 * a clear price hierarchy. It is also the cheapest of that review's three
	 * complaints to answer.
	 *
	 * So each tier gets a CARD: its own backdrop (the three feature skies the game
	 * already ships), its own accent colour, the Scatter count that opens it drawn
	 * rather than described, and a picture of what the tier actually gives you —
	 * the Neon Frames it starts with. Nothing here is new art.
	 *
	 * The escalation is the point: Neon Nights is calm, Sunset Hits warmer and
	 * busier, Ocean Drive gold-framed with the loudest treatment and the biggest
	 * number, so the ladder reads before any of the words do.
	 */
	const { eventEmitter } = getContextEventEmitter<EmitterEventModal>();
	// Read at render time, like the other panels: social() reads the page URL.
	const T = $derived(getSocialTerms());

	const buyList = $derived(
		stateMetaDerived.betModeMetaList().filter((item) => item.type === 'buy'),
	);

	const src = (key: string) => (assets as Record<string, { src?: string }>)[key]?.src ?? '';

	/**
	 * Per-tier art. Keyed by the maths mode so it cannot drift from betModeMeta,
	 * and deliberately built from assets already in the game: the three sky
	 * backdrops, the Scatter symbol and the Neon Frame.
	 *
	 * `frames` is what the tier actually starts with, from the feature rules — 1,
	 * 3 and 20 — but a card cannot draw twenty frames legibly at this size, so the
	 * top tier draws a full grid glyph instead and says the number.
	 */
	const TIER_ART: Record<
		string,
		{
			backdrop: string;
			crop: string;
			accent: string;
			glow: string;
			frames: number;
			framesLabel: string;
			scatters: number;
			rank: number;
		}
	> = {
		BONUS: {
			backdrop: src('hmBgFeature'),
			crop: '18% 50%',
			accent: '#66f6ff',
			glow: 'rgba(102, 246, 255, 0.55)',
			frames: 1,
			framesLabel: '1 sticky Frame',
			scatters: 3,
			rank: 1,
		},
		BONUS_HITS: {
			backdrop: src('hmBgFeature'),
			crop: '82% 50%',
			accent: '#ff8ede',
			glow: 'rgba(255, 142, 222, 0.55)',
			frames: 3,
			framesLabel: '3 sticky Frames',
			scatters: 4,
			rank: 2,
		},
		BONUS_EPIC: {
			backdrop: src('hmBgEpic'),
			crop: '50% 45%',
			accent: '#ffd166',
			glow: 'rgba(255, 209, 102, 0.6)',
			frames: 6,
			framesLabel: 'every position framed',
			scatters: 5,
			rank: 3,
		},
	};

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
		<div class="hm-buy" use:popupGhost>
			<header>
				<h2>{T.featureMenuTitle}</h2>
				<p class="lede">{T.featureMenuLede}</p>
				<div class="amount"><BetMenuAmountToggle /></div>
			</header>

			<div class="cards">
				{#each buyList as betMode (betMode.mode)}
					{@const art = TIER_ART[betMode.mode]}
					{@const cost = costOf(betMode.costMultiplier)}
					{@const canBuy = affordable(betMode.costMultiplier)}
					<section
						class="card"
						class:top={art?.rank === 3}
						style:--accent={art?.accent ?? '#66f6ff'}
						style:--glow={art?.glow ?? 'rgba(102,246,255,0.5)'}
					>
						<!-- the tier's own sky, dimmed so the type stays legible over it -->
						<!--
							Tiers 1 and 2 share the feature sky — the game only ships three
							backdrops — so they are framed on different parts of it. Two
							cards with the identical crop read as one card printed twice.
						-->
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
								{#each Array(art?.frames ?? 1) as _, index (index)}
									<img class="frame" style:animation-delay={`${index * 0.12}s`} src={src('hmFrame')} alt="" />
								{/each}
							</div>
						</div>

						<h3>{betMode.text.title}</h3>
						<p class="gives">{art?.framesLabel}</p>

						<div class="price">
							<span class="mult">{betMode.costMultiplier}×</span>
							<span class="money">{numberToCurrencyString(cost)}</span>
						</div>

						<button type="button" disabled={!canBuy} onclick={() => choose(betMode.mode)}>
							{betMode.text.button}
						</button>
						{#if !canBuy}
							<p class="short">{T.insufficientForMode}</p>
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
		color: #f4e9ff;
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
			color: #ffd166;
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
		grid-template-columns: repeat(3, 1fr);
		gap: 0.8rem;

		/* One column once three cards would be narrower than their own art. The
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
		border-radius: 0.9rem;
		border: 1.5px solid color-mix(in srgb, var(--accent) 55%, transparent);
		background: linear-gradient(180deg, rgba(38, 8, 60, 0.86), rgba(16, 4, 28, 0.94));
		box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.5), 0 6px 22px rgba(0, 0, 0, 0.45);
		animation: cardPulse 3.2s ease-in-out infinite;

		&.top {
			border-width: 2px;
			box-shadow:
				0 0 0 1px rgba(0, 0, 0, 0.5),
				0 0 26px var(--glow),
				0 8px 26px rgba(0, 0, 0, 0.5);
		}
	}

	/* the tier's sky, behind everything, dimmed */
	.backdrop {
		position: absolute;
		inset: 0;
		background-size: cover;
		background-position: center;
		opacity: 0.28;
		filter: saturate(1.15);
	}

	/* preview motion: a slow shine crossing the card, staggered per tier so the
	   three do not sweep in lockstep */
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
		/* The Neon Frame sprite is a hollow border, so it needs size and glow to
		   read as gold at card scale — at 1.45rem it looked like an empty box. */
		width: 2rem;
		height: 2rem;
		opacity: 0.95;
		filter: drop-shadow(0 0 5px rgba(255, 209, 102, 0.75));
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
		color: #1b0725;
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
		color: #ff9db8;
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
			filter: drop-shadow(0 0 4px rgba(255, 209, 102, 0.6));
		}
		50% {
			opacity: 1;
			filter: drop-shadow(0 0 11px rgba(255, 209, 102, 0.95));
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
