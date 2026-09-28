<script lang="ts">
	/**
	 * The Buy Bonus confirmation, GoBananaut's own — the step after a card is
	 * chosen in ModalBuyBonus.
	 *
	 * The shared one is a title, a paragraph and a CONFIRM on a flat panel.
	 * Straight after the space cards it read as a different game's dialog
	 * (seen on the 2026-09-26 capture), so this shows the SAME card, bigger: its
	 * scene and heroes, its colour, its meter (the opening board, or the respin
	 * coins), the full rules text from the bet mode meta, and the price — the
	 * multiplier in big figures with the amount under it — then BACK and the buy.
	 *
	 * The confirm logic is the shared one's, line for line: set the active bet
	 * mode, and for a 'buy' mode broadcast the bet. Closing (X, outside, BACK)
	 * returns to the menu, as the shared one did.
	 */
	import { Popup } from 'components-shared';
	import { zIndex } from 'constants-shared/zIndex';
	import { stateBet, stateModal, stateUi, stateUrlDerived, INFINITY_MARK } from 'state-shared';
	import { stateBonus, stateBonusDerived } from 'components-ui-html/src/stateBonus.svelte';
	import { getContextEventEmitter } from 'utils-event-emitter';
	import type { EmitterEventModal } from 'components-ui-html/src/types';
	import { numberToCurrencyString } from 'utils-shared/amount';

	import BuyBoardMeter from './BuyBoardMeter.svelte';
	import { CARDS, COIN, STARS_FAR, STARS_NEAR } from './buyCards';

	const { eventEmitter } = getContextEventEmitter<EmitterEventModal>();

	const data = $derived(stateBonusDerived.selectedBetModeData());
	const card = $derived(CARDS[data.mode]);
	const social = $derived(stateUrlDerived.social());
	const price = $derived(numberToCurrencyString(stateBet.betAmount * data.costMultiplier));

	const back = () => (stateModal.modal = { name: 'buyBonus' });
	const confirm = () => {
		stateBet.activeBetModeKey = stateBonus.selectedBetModeKey;
		if (data.type === 'buy') eventEmitter.broadcast({ type: 'bet' });
		if (data.type === 'activate') {
			stateUi.autoSpinsLossLimitText = INFINITY_MARK;
			stateUi.autoSpinsSingleWinLimitText = INFINITY_MARK;
		}
		eventEmitter.broadcast({ type: 'soundPressGeneral' });
		stateModal.modal = null;
	};
</script>

{#if stateModal.modal?.name === 'buyBonusConfirm'}
	<Popup zIndex={zIndex.dialog} onclose={back}>
		<div
			class="confirm"
			style:--accent={card?.accent ?? '#5fd4ff'}
			style:--nebula={card?.nebula ?? '#1f4f8f'}
			style:--stars-far={STARS_FAR}
			style:--stars-near={STARS_NEAR}
			role="dialog"
			aria-label={card?.title ?? data.text.title}
		>
			{#if card}
				<div class="scene">
					<div class="stars far"></div>
					<div class="stars near"></div>
					<div class="light"></div>
					<div class="heroes">
						{#each card.heroes as h, i (i)}
							<img
								src={h.src}
								alt=""
								style:--w={`${h.w}%`}
								style:--x={`${h.x}%`}
								style:--y={`${h.y}%`}
								style:--r={`${h.r ?? 0}deg`}
								style:animation-delay={`${-i * 1.7}s`}
							/>
						{/each}
					</div>
					<span class="tag">{card.tag}</span>
				</div>
			{/if}

			<div class="body">
				<h2>{card?.title ?? data.text.title}</h2>
				{#if card}
					<div class="meter">
						{#if card.meter.kind === 'coins'}
							{#each Array.from({ length: card.meter.of }, (_, j) => j) as i (i)}
								<img class="coin" src={COIN} alt="" style:animation-delay={`${i * 0.25}s`} />
							{/each}
						{:else}
							<BuyBoardMeter rows={card.meter.rows} />
						{/if}
					</div>
					<div class="meterlabel">{card.meter.label}</div>
				{/if}

				<p class="rules">{data.text.dialog}</p>

				<div class="price">
					<span class="label">{social ? 'COST' : 'PRICE'}</span>
					<span class="cost">{data.costMultiplier}<small>×</small></span>
					<span class="amount">{price}</span>
				</div>

				<div class="actions">
					<button class="back" onclick={back}>BACK</button>
					<button class="buy" data-test="confirm-button" onclick={confirm}>{data.text.button}</button>
				</div>
			</div>
		</div>
	</Popup>
{/if}

<style>
	/* z-index 3: above the Popup's click-to-close layer, as in ModalBuyBonus */
	.confirm {
		--glow: color-mix(in srgb, var(--accent) 45%, transparent);
		position: relative;
		z-index: 3;
		display: flex;
		flex-direction: column;
		width: min(520px, calc(100vw - 32px));
		max-height: calc(100vh - 24px);
		overflow: auto;
		box-sizing: border-box;
		border-radius: 14px;
		border: 2px solid color-mix(in srgb, var(--accent) 65%, #000);
		background: linear-gradient(180deg, #16202a, #0a0f15);
		box-shadow:
			0 0 0 4px #0008,
			0 0 28px var(--glow),
			0 24px 60px #000c;
		color: #e6eaed;
		text-align: center;
		font-family: 'Segoe UI', Tahoma, Arial, sans-serif;
	}

	/* ── the card's scene, as on the menu ── */
	.scene {
		position: relative;
		flex: none;
		height: 170px;
		overflow: hidden;
		background:
			radial-gradient(ellipse 70% 55% at 70% 30%, color-mix(in srgb, var(--nebula) 85%, transparent), transparent 70%),
			radial-gradient(ellipse 60% 45% at 20% 75%, color-mix(in srgb, var(--accent) 22%, transparent), transparent 70%),
			#04070c;
	}
	.scene::after {
		content: '';
		position: absolute;
		inset: 0;
		z-index: 3;
		background: linear-gradient(180deg, #0000 50%, #16202a 100%);
		pointer-events: none;
	}
	.stars {
		position: absolute;
		top: 0;
		bottom: 0;
		left: 0;
		width: calc(100% + 320px);
		background-size: 320px 240px;
	}
	.stars.far {
		background-image: var(--stars-far);
		animation:
			drift 60s linear infinite,
			twinkle 4.2s ease-in-out infinite alternate;
	}
	.stars.near {
		background-image: var(--stars-near);
		animation:
			drift 34s linear infinite,
			twinkle 2.7s ease-in-out infinite alternate-reverse;
	}
	@keyframes drift {
		to {
			transform: translateX(-320px);
		}
	}
	@keyframes twinkle {
		from {
			opacity: 0.45;
		}
		to {
			opacity: 1;
		}
	}
	.light {
		position: absolute;
		left: 50%;
		top: 55%;
		width: 60%;
		aspect-ratio: 1;
		transform: translate(-50%, -50%);
		border-radius: 50%;
		background: radial-gradient(circle, var(--glow) 0%, transparent 62%);
		z-index: 1;
	}
	.heroes {
		position: absolute;
		top: 0;
		bottom: 0;
		left: 50%;
		aspect-ratio: 16 / 12;
		transform: translateX(-50%);
		z-index: 2;
	}
	.heroes img {
		position: absolute;
		width: var(--w);
		left: calc(50% + var(--x));
		top: var(--y);
		transform: rotate(var(--r));
		filter: drop-shadow(0 6px 10px #000c) drop-shadow(0 0 8px color-mix(in srgb, var(--accent) 35%, transparent));
		pointer-events: none;
		animation: float 5.4s ease-in-out infinite;
	}
	@keyframes float {
		0%,
		100% {
			transform: translateY(0) rotate(var(--r));
		}
		50% {
			transform: translateY(-5%) rotate(calc(var(--r) + 4deg));
		}
	}
	.tag {
		position: absolute;
		left: 12px;
		top: 12px;
		z-index: 4;
		padding: 3px 10px;
		border-radius: 20px;
		font: 400 12px var(--gb-display-font, 'Titan One');
		letter-spacing: 1.5px;
		color: #06121a;
		background: var(--accent);
		box-shadow: 0 0 10px var(--glow);
	}

	/* ── the body ── */
	.body {
		display: flex;
		flex-direction: column;
		padding: 2px 22px 20px;
		min-height: 0;
	}
	/* .confirm h2 and !important: the platform skin paints every popup heading
	   with !important (Modals.svelte), as noted in ModalBuyBonus */
	.confirm h2 {
		color: var(--accent) !important;
	}
	h2 {
		margin: 0 0 8px;
		font: 400 28px/1.1 var(--gb-display-font, 'Titan One');
		letter-spacing: 1px;
		text-shadow:
			0 2px 0 #000,
			0 0 14px var(--glow);
	}
	.meter {
		display: flex;
		align-items: flex-end;
		justify-content: center;
		gap: 6px;
		min-height: 48px;
		--board-w: 132px;
		--board-h: 60px;
	}
	.coin {
		width: 30px;
		height: 30px;
		filter: drop-shadow(0 2px 3px #000a);
		animation: coin 2.4s ease-in-out infinite;
	}
	@keyframes coin {
		0%,
		70%,
		100% {
			transform: scaleX(1);
		}
		80% {
			transform: scaleX(0.15);
		}
	}
	.meterlabel {
		margin: 4px 0 10px;
		font-size: 12px;
		letter-spacing: 1.5px;
		color: #93a8b7;
	}
	.rules {
		margin: 0 0 14px;
		padding: 12px 14px;
		overflow: auto;
		min-height: 0;
		border-radius: 8px;
		background: #0b1015;
		border: 1px solid #44586a;
		font-size: 14px;
		line-height: 1.5;
		text-align: left;
		color: #c9d4dc;
	}

	.price {
		display: grid;
		grid-template-columns: 1fr auto 1fr;
		align-items: center;
		gap: 10px;
		margin-bottom: 14px;
	}
	.price .label {
		justify-self: end;
		font-size: 12px;
		letter-spacing: 2px;
		color: #93a8b7;
	}
	.cost {
		font: 400 48px/1 var(--gb-display-font, 'Titan One');
		color: var(--accent);
		text-shadow:
			0 3px 0 #000,
			0 0 16px var(--glow);
	}
	/* Titan One has no multiplication sign */
	.cost small {
		margin-left: 2px;
		font: 700 28px 'Segoe UI', Arial, sans-serif;
	}
	.price .amount {
		justify-self: start;
		font: 600 16px 'Segoe UI', Arial, sans-serif;
		color: #e6eaed;
	}

	.actions {
		display: grid;
		grid-template-columns: 1fr 2fr;
		gap: 12px;
	}
	button {
		padding: 13px 10px;
		border-radius: 8px;
		cursor: pointer;
		font: 400 16px var(--gb-display-font, 'Titan One');
		letter-spacing: 1px;
		transition:
			filter 0.15s ease,
			transform 0.15s ease,
			box-shadow 0.15s ease;
	}
	.back {
		color: #c9d4dc;
		background: #111820;
		border: 2px solid #62798a;
	}
	.buy {
		position: relative;
		overflow: hidden;
		border: 0;
		color: #06121a;
		background: linear-gradient(
			180deg,
			color-mix(in srgb, var(--accent) 75%, #fff),
			var(--accent) 55%,
			color-mix(in srgb, var(--accent) 65%, #000)
		);
		box-shadow:
			0 3px 0 color-mix(in srgb, var(--accent) 35%, #000),
			0 0 16px var(--glow),
			inset 0 1px 0 #fff8;
	}
	.buy::after {
		content: '';
		position: absolute;
		top: 0;
		bottom: 0;
		left: -60%;
		width: 45%;
		background: linear-gradient(100deg, transparent, #fff9 50%, transparent);
		transform: skewX(-20deg);
		animation: shine 2.8s ease-out infinite;
		pointer-events: none;
	}
	@keyframes shine {
		0% {
			left: -60%;
		}
		35%,
		100% {
			left: 120%;
		}
	}
	/* pointer devices only: a :hover left behind by a tap would stay lit */
	@media (hover: hover) {
		.back:hover {
			border-color: #93a8b7;
			color: #fff;
		}
		.buy:hover {
			filter: brightness(1.15) saturate(1.1);
			transform: translateY(-2px);
			box-shadow:
				0 5px 0 color-mix(in srgb, var(--accent) 35%, #000),
				0 0 26px var(--glow),
				inset 0 1px 0 #fffc;
		}
	}
	button:focus-visible {
		outline: 2px solid #fff;
		outline-offset: 2px;
	}
	button:active {
		transform: translateY(2px);
	}

	@media (prefers-reduced-motion: reduce) {
		.stars,
		.heroes img,
		.coin,
		.buy::after {
			animation: none;
		}
	}

	/* short screens: the scene gives up height first, then the rules scroll */
	@media (max-height: 720px) {
		.scene {
			height: 120px;
		}
		.rules {
			font-size: 13px;
		}
		.cost {
			font-size: 40px;
		}
	}
	@media (max-height: 520px) {
		.confirm {
			width: min(640px, calc(100vw - 32px));
		}
		.scene {
			height: 70px;
		}
		h2 {
			font-size: 20px;
			margin-bottom: 4px;
		}
		.meter {
			min-height: 30px;
			--board-w: 76px;
			--board-h: 35px;
		}
		.coin {
			width: 20px;
			height: 20px;
		}
		.meterlabel {
			margin-bottom: 6px;
		}
		.rules {
			font-size: 12px;
			padding: 8px 10px;
			margin-bottom: 8px;
		}
		.price {
			margin-bottom: 8px;
		}
		.cost {
			font-size: 30px;
		}
		button {
			padding: 9px 8px;
			font-size: 14px;
		}
	}
	@media (max-width: 520px) {
		.body {
			padding: 2px 14px 14px;
		}
		h2 {
			font-size: 22px;
		}
		.scene {
			height: 120px;
		}
		.rules {
			font-size: 13px;
		}
	}
</style>
