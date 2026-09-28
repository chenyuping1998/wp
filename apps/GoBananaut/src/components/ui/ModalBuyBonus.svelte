<script lang="ts">
	/**
	 * The feature-buy menu, GoBananaut's own. GoBoomana's layout (one card per
	 * buy: a scene with its heroes, a title, a meter, what it does, the price in
	 * big figures and one full-width button), this game's space.
	 *
	 * Replaces the shared ModalBuyBonus plus the card_*.png pictures, which were
	 * text over a flat panel. Kept in this app, not in components-ui-html: the
	 * look is this game's, not the library's.
	 *
	 * THE SCENES are CSS, not pictures: a nebula in the card's colour over two
	 * starfields that twinkle out of step, so the cards weigh nothing and stay
	 * sharp at any size. The heroes are the game's own pieces
	 * (design/generate_buy_heroes.mjs) drifting in zero-g.
	 *
	 * THE METER is the one thing the three free-spin tiers differ by: the board
	 * they OPEN on (betModes[...].start_steps -> reel one at 4 / 5 / 6 rows, and a
	 * stretched reel doubles). It is drawn as the board itself — five reels, the
	 * stretched one lit ice with its x2 — rather than a count, because "how tall
	 * does it start" is a picture, not a number. Hold and spin shows its three
	 * respin coins instead.
	 *
	 * Palette: palette.ts — gunmetal is the capsule, ice is what is live. Orange
	 * is the Scatter's and appears nowhere here; the tiers climb ice -> blue ->
	 * violet instead.
	 *
	 * Choosing a card hands over to the shared ModalBuyBonusConfirm, exactly as
	 * the shared menu did.
	 */
	import { Popup } from 'components-shared';
	import { zIndex } from 'constants-shared/zIndex';
	import { stateModal, stateMetaDerived, stateBet, stateUrlDerived } from 'state-shared';
	import { stateBonus } from 'components-ui-html/src/stateBonus.svelte';
	import BetMenuAmountToggle from 'components-ui-html/src/components/BetMenuAmountToggle.svelte';
	import { getContextEventEmitter } from 'utils-event-emitter';
	import type { EmitterEventModal } from 'components-ui-html/src/types';
	import { numberToCurrencyString } from 'utils-shared/amount';

	import BuyBoardMeter from './BuyBoardMeter.svelte';
	import { CARDS, COIN, MAX_WIN, STARS_FAR, STARS_NEAR } from './buyCards';

	const { eventEmitter } = getContextEventEmitter<EmitterEventModal>();


	const modes = $derived(stateMetaDerived.betModeMetaList().filter((m) => m.type === 'buy'));
	// social play: no betting words anywhere the player can read
	const social = $derived(stateUrlDerived.social());

	const close = () => (stateModal.modal = null);
	const choose = (mode: string) => {
		stateBonus.selectedBetModeKey = mode;
		eventEmitter.broadcast({ type: 'buyBonusConfirm' });
	};
</script>

{#if stateModal.modal?.name === 'buyBonus'}
	<Popup zIndex={zIndex.modal} onclose={close}>
		<div class="menu" style:--stars-far={STARS_FAR} style:--stars-near={STARS_NEAR}>
			<div class="sky" aria-hidden="true"></div>
			<!-- title and amount on one row: a second row of header cost the menu its
			     fit on a 720px-tall screen (GoBoomana) -->
			<div class="head">
				<div class="titles">
					<h2>{social ? 'FEATURES' : 'BUY FEATURE'}</h2>
					<div class="sub">CHOOSE YOUR LAUNCH</div>
				</div>
				<div class="amount"><BetMenuAmountToggle /></div>
			</div>

			<div class="cards">
				{#each modes as mode, n (mode.mode)}
					{@const card = CARDS[mode.mode]}
					{#if card}
						<section class="card" class:hot={card.hot} style:--accent={card.accent} style:--nebula={card.nebula}>
							<div class="scene">
								<div class="stars far" style:animation-delay={`${-n * 1.3}s`}></div>
								<div class="stars near" style:animation-delay={`${-n * 0.9}s`}></div>
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
											style:animation-delay={`${-(i * 1.7 + n * 0.6)}s`}
										/>
									{/each}
								</div>
								<span class="tag">{card.tag}</span>
							</div>
							<div class="body">
								<h3>{card.title}</h3>
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
								<ul>
									{#each card.points as p (p)}<li>{p}</li>{/each}
								</ul>
								<div class="cost">{mode.costMultiplier}<small>×</small></div>
								<button class="buy" onclick={() => choose(mode.mode)}>
									{mode.text.button}
									<span>{numberToCurrencyString(stateBet.betAmount * mode.costMultiplier)}</span>
								</button>
							</div>
						</section>
					{/if}
				{/each}
			</div>
			<div class="foot">All features play at 96% RTP · Max win {MAX_WIN}</div>
		</div>
	</Popup>
{/if}

<style>
	/* z-index 3: above the Popup's click-to-close layer (2), so a click on a
	   card is not a click outside it. The Popup draws its own close button. */
	.menu {
		/* palette.ts: STEEL_EDGE, STEEL_TEXT, ICE_RIM, HULL, INK */
		--steel: #62798a;
		--muted: #93a8b7;
		--ice: #8fe4ff;
		position: relative;
		z-index: 3;
		width: min(1040px, calc(100vw - 32px));
		max-height: calc(100vh - 24px);
		overflow: auto;
		padding: 24px 24px 20px;
		box-sizing: border-box;
		background:
			radial-gradient(ellipse 60% 50% at 15% 0%, #1b3a5a88, transparent 70%),
			radial-gradient(ellipse 50% 60% at 100% 100%, #3a1f5a66, transparent 70%),
			linear-gradient(180deg, #121a22 0%, #070b10 100%);
		border: 2px solid var(--steel);
		border-radius: 14px;
		box-shadow:
			0 0 0 4px #0008,
			0 0 24px #3fb2d433,
			0 24px 60px #000c,
			inset 0 0 0 1px #8fe4ff22,
			inset 0 0 40px #0009;
		color: #e6eaed;
		text-align: center;
		font-family: 'Segoe UI', Tahoma, Arial, sans-serif;
	}
	/* the hull's own faint starfield behind everything */
	.sky {
		position: absolute;
		inset: 0;
		border-radius: inherit;
		background: var(--stars-far) 0 0 / 320px 240px repeat;
		opacity: 0.35;
		pointer-events: none;
	}
	.head,
	.cards,
	.foot {
		position: relative;
	}
	/* capsule bolts on the frame, lit ice */
	.menu::before,
	.menu::after {
		content: '';
		position: absolute;
		top: 10px;
		width: 10px;
		height: 10px;
		border-radius: 50%;
		background: radial-gradient(circle at 35% 35%, #e6f8ff, #3a5a70 70%);
		box-shadow: 0 0 6px #8fe4ff88;
	}
	.menu::before {
		left: 10px;
	}
	.menu::after {
		right: 10px;
	}
	/* `.menu h2` / `.menu h3` and !important: the platform skin in Modals.svelte
	   paints every popup heading with !important
	   (html[data-ui-skin='platform'] .pop-up-wrap h2). These selectors outrank it. */
	.head {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: center;
		gap: 10px 28px;
	}
	.menu h2 {
		color: #c4f1ff !important;
	}
	.menu h3 {
		color: var(--accent) !important;
	}
	h2 {
		margin: 0;
		font: 400 34px var(--gb-display-font, 'Titan One');
		letter-spacing: 2px;
		color: #c4f1ff;
		text-shadow:
			0 3px 0 #0b3a4c,
			0 0 18px #3fb2d488;
	}
	.sub {
		margin: 2px 0 0;
		color: var(--muted);
		font-size: 13px;
		letter-spacing: 3px;
	}
	.amount {
		display: flex;
		justify-content: center;
	}

	.cards {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 16px;
		margin-top: 18px;
	}
	.card {
		--glow: color-mix(in srgb, var(--accent) 45%, transparent);
		display: flex;
		flex-direction: column;
		min-width: 0;
		border-radius: 12px;
		overflow: hidden;
		background: linear-gradient(180deg, #16202a, #0a0f15);
		border: 2px solid color-mix(in srgb, var(--accent) 60%, #000);
		box-shadow:
			0 8px 22px #000a,
			inset 0 1px 0 #ffffff14;
		transition:
			transform 0.18s ease,
			box-shadow 0.18s ease;
	}
	/* Hover only where there is a real pointer: on a touch screen a :hover
	   sticks after the tap, and a card left lifted was one of the "controls stay
	   lit" findings against Deadwood Express. */
	@media (hover: hover) {
		.card:hover {
			transform: translateY(-6px);
			box-shadow:
				0 14px 30px #000c,
				0 0 22px var(--glow);
		}
		.card:hover .heroes img {
			animation-duration: 3.2s;
		}
	}
	.card.hot {
		animation: hot 1.8s ease-in-out infinite;
	}
	@keyframes hot {
		50% {
			box-shadow:
				0 8px 22px #000a,
				0 0 28px var(--glow);
		}
	}

	/* ── THE SCENE: nebula, two starfields, a glow and the heroes ── */
	.scene {
		position: relative;
		aspect-ratio: 16 / 12;
		max-height: 180px;
		overflow: hidden;
		background:
			radial-gradient(ellipse 70% 55% at 70% 30%, color-mix(in srgb, var(--nebula) 85%, transparent), transparent 70%),
			radial-gradient(ellipse 60% 45% at 20% 75%, color-mix(in srgb, var(--accent) 22%, transparent), transparent 70%),
			radial-gradient(ellipse 40% 30% at 85% 85%, color-mix(in srgb, var(--nebula) 55%, transparent), transparent 70%),
			#04070c;
	}
	.scene::after {
		content: '';
		position: absolute;
		inset: 0;
		z-index: 3;
		background: linear-gradient(180deg, #0000 45%, #16202a 100%);
		pointer-events: none;
	}
	.stars {
		position: absolute;
		/* one tile wider than the scene, so the drift below never shows an edge */
		top: 0;
		bottom: 0;
		left: 0;
		width: calc(100% + 320px);
		background-size: 320px 240px;
		background-repeat: repeat;
	}
	.stars.far {
		background-image: var(--stars-far);
		opacity: 0.7;
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
		top: 52%;
		width: 90%;
		aspect-ratio: 1;
		transform: translate(-50%, -50%);
		border-radius: 50%;
		background: radial-gradient(circle, var(--glow) 0%, transparent 62%);
		z-index: 1;
	}
	/* The heroes are laid out in a box of the scene's full-size proportions,
	   centred and as tall as the scene. When a short screen caps the scene's
	   height, the box shrinks with it and the heroes keep their places. */
	.heroes {
		position: absolute;
		top: 0;
		bottom: 0;
		left: 50%;
		aspect-ratio: 16 / 12;
		transform: translateX(-50%);
		z-index: 2;
	}
	/* zero-g: every piece drifts and turns a little on its own clock */
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
		left: 10px;
		top: 10px;
		z-index: 4;
		padding: 3px 9px;
		border-radius: 20px;
		font: 400 11px var(--gb-display-font, 'Titan One');
		letter-spacing: 1.5px;
		color: #06121a;
		background: var(--accent);
		box-shadow: 0 0 10px var(--glow);
	}

	.body {
		display: flex;
		flex: 1;
		flex-direction: column;
		padding: 4px 14px 14px;
	}
	h3 {
		display: grid;
		place-items: center;
		min-height: 42px;
		margin: 0 0 8px;
		font: 400 19px/1.1 var(--gb-display-font, 'Titan One');
		letter-spacing: 1px;
		color: var(--accent);
		text-shadow:
			0 2px 0 #000,
			0 0 12px var(--glow);
	}
	.meter {
		display: flex;
		align-items: flex-end;
		justify-content: center;
		gap: 5px;
		min-height: 48px;
		margin-bottom: 6px;
	}
	.coin {
		width: 26px;
		height: 26px;
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
		margin-bottom: 8px;
		font-size: 11px;
		letter-spacing: 1.5px;
		color: var(--muted);
	}
	ul {
		margin: 0 0 10px;
		padding: 0;
		list-style: none;
		font-size: 13px;
		line-height: 1.55;
		text-align: left;
		color: #c9d4dc;
	}
	li::before {
		content: '✦';
		position: relative;
		top: -1px;
		margin-right: 7px;
		font-size: 10px;
		color: var(--accent);
	}
	.cost {
		margin-top: auto;
		font: 400 44px var(--gb-display-font, 'Titan One');
		color: var(--accent);
		text-shadow:
			0 3px 0 #000,
			0 0 16px var(--glow);
	}
	/* Titan One has no multiplication sign: it fell back to a dot */
	.cost small {
		margin-left: 2px;
		font: 700 26px 'Segoe UI', Arial, sans-serif;
	}
	.buy {
		position: relative;
		overflow: hidden;
		margin-top: 8px;
		padding: 11px 8px;
		border: 0;
		border-radius: 8px;
		cursor: pointer;
		font: 400 15px var(--gb-display-font, 'Titan One');
		letter-spacing: 1px;
		color: #06121a;
		background: linear-gradient(
			180deg,
			color-mix(in srgb, var(--accent) 75%, #fff),
			var(--accent) 55%,
			color-mix(in srgb, var(--accent) 65%, #000)
		);
		box-shadow:
			0 3px 0 color-mix(in srgb, var(--accent) 35%, #000),
			inset 0 1px 0 #fff8;
		transition:
			filter 0.15s ease,
			transform 0.15s ease,
			box-shadow 0.15s ease;
	}
	/* the button answers the pointer: it brightens, lifts, glows in the card's
	   colour and a streak of light runs across it. Pointer devices only. */
	.buy::after {
		content: '';
		position: absolute;
		top: 0;
		bottom: 0;
		left: -60%;
		width: 45%;
		background: linear-gradient(100deg, transparent, #fff9 50%, transparent);
		transform: skewX(-20deg);
		opacity: 0;
		pointer-events: none;
	}
	@media (hover: hover) {
		.buy:hover {
			filter: brightness(1.15) saturate(1.1);
			transform: translateY(-2px);
			box-shadow:
				0 5px 0 color-mix(in srgb, var(--accent) 35%, #000),
				0 0 18px 2px var(--glow),
				0 0 34px var(--glow),
				inset 0 1px 0 #fffc;
		}
		.buy:hover::after {
			opacity: 1;
			animation: shine 0.7s ease-out;
		}
	}
	@keyframes shine {
		from {
			left: -60%;
		}
		to {
			left: 120%;
		}
	}
	.buy:focus-visible {
		outline: 2px solid #fff;
		outline-offset: 2px;
	}
	.buy:active {
		transform: translateY(2px);
		box-shadow: 0 1px 0 color-mix(in srgb, var(--accent) 35%, #000);
	}
	.buy span {
		display: block;
		margin-top: 2px;
		font: 600 12px 'Segoe UI', Arial, sans-serif;
		opacity: 0.8;
	}
	.foot {
		margin-top: 14px;
		font-size: 12px;
		color: var(--muted);
	}

	@media (prefers-reduced-motion: reduce) {
		.card,
		.card.hot,
		.stars,
		.heroes img,
		.coin,
		.buy:hover::after {
			animation: none;
			transition: none;
		}
	}

	/* SHORT SCREENS (a 1280x720 landscape and down): everything on one screen.
	   The scenes give up height first — they are decoration; the prices and the
	   buttons are not. */
	@media (max-height: 820px) and (min-width: 521px) {
		.menu {
			padding: 16px 20px 12px;
		}
		.cards {
			margin-top: 12px;
		}
		.scene {
			max-height: 150px;
		}
		h3 {
			min-height: 0;
			margin-bottom: 6px;
		}
		.meterlabel {
			margin-bottom: 5px;
		}
		ul {
			margin-bottom: 4px;
			line-height: 1.4;
		}
		.cost {
			font-size: 40px;
		}
		.buy {
			padding: 9px 8px;
		}
		.foot {
			margin-top: 8px;
		}
	}
	@media (max-height: 640px) and (min-width: 521px) {
		h2 {
			font-size: 26px;
		}
		.sub {
			display: none;
		}
		.scene {
			max-height: 92px;
		}
		ul {
			font-size: 12px;
		}
		.cost {
			font-size: 30px;
		}
	}

	/* two by two only where there is height for it: a phone on its side keeps
	   the four in a row and sheds detail instead (below) */
	@media (max-width: 860px) and (min-height: 641px) {
		.cards {
			grid-template-columns: repeat(2, 1fr);
		}
	}
	/* A PHONE ON ITS SIDE (about 844 x 390): the four cards, the prices and the
	   buttons, and nothing else. The bullets and the footer go — the same facts
	   are in the confirmation that follows every choice. */
	@media (max-height: 480px) and (min-width: 521px) {
		.menu {
			padding: 10px 14px 10px;
		}
		h2 {
			font-size: 22px;
		}
		.cards {
			gap: 10px;
			margin-top: 8px;
		}
		.scene {
			max-height: 70px;
		}
		.tag {
			top: 6px;
			left: 6px;
			font-size: 9px;
		}
		h3 {
			font-size: 14px;
			margin-bottom: 4px;
		}
		.meter {
			min-height: 28px;
		}
		.meter {
			--board-w: 70px;
			--board-h: 32px;
		}
		.coin {
			width: 18px;
			height: 18px;
		}
		.meterlabel {
			font-size: 9px;
			letter-spacing: 1px;
		}
		ul,
		.foot {
			display: none;
		}
		.cost {
			font-size: 26px;
		}
		.cost small {
			font-size: 18px;
		}
		.buy {
			margin-top: 4px;
			padding: 6px;
			font-size: 13px;
		}
		.body {
			padding: 2px 8px 8px;
		}
	}
	@media (max-width: 520px) {
		.menu {
			padding: 14px 10px 12px;
		}
		.menu::after {
			display: none;
		}
		h2 {
			font-size: 26px;
		}
		.cards {
			gap: 8px;
			margin-top: 12px;
		}
		.body {
			padding: 4px 10px 10px;
		}
		h3 {
			min-height: 0;
			margin-bottom: 4px;
			font-size: 15px;
		}
		.sub {
			display: none;
		}
		.scene {
			max-height: 96px;
		}
		.meter {
			min-height: 30px;
		}
		.meter {
			--board-w: 76px;
			--board-h: 35px;
		}
		.meterlabel {
			margin-bottom: 4px;
			font-size: 10px;
			letter-spacing: 1px;
		}
		/* the RTP line is in the game rules; on a phone it cost the menu its fit */
		.foot {
			display: none;
		}
		.coin {
			width: 20px;
			height: 20px;
		}
		ul {
			margin-bottom: 4px;
			font-size: 11.5px;
			line-height: 1.35;
		}
		.cost {
			font-size: 30px;
		}
	}
</style>
