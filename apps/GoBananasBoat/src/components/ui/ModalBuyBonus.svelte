<script lang="ts">
	/**
	 * The feature-buy menu, GoBananasBoat's own — GoBoomana's layout, this
	 * game's harbour and its cargo. One card per buy: a scene with a pile of
	 * tarp bundles on it (the Mystery crate off the board) and the high pays
	 * popping out of them, a title, a meter, what it does, the price in big
	 * figures and one full-width button.
	 *
	 * Replaces the shared ModalBuyBonus, whose cards are text over a panel —
	 * "Bonus buy menu is too simple" is the one free-text comment a sibling
	 * game's review left. Kept in this app, not components-ui-html: the look is
	 * this game's.
	 *
	 * The free-spin tiers differ in how much cargo comes aboard: crate density
	 * and Full Shipment chance rise with the tier (game_config.py FRB1/2/3). So
	 * the pile of tarp bundles grows, the meter fills a crate at
	 * a time, and more loot pops out of it. (The captain stood on
	 * these cards once; he was too small to do anything for the choice.)
	 *
	 * Choosing a card hands over to the shared ModalBuyBonusConfirm, as the
	 * shared menu did.
	 */
	import { Popup } from 'components-shared';
	import { zIndex } from 'constants-shared/zIndex';
	import { stateModal, stateMetaDerived, stateBet, stateUrlDerived } from 'state-shared';
	import { stateBonus } from 'components-ui-html/src/stateBonus.svelte';
	import BetMenuAmountToggle from 'components-ui-html/src/components/BetMenuAmountToggle.svelte';
	import { getContextEventEmitter } from 'utils-event-emitter';
	import type { EmitterEventModal } from 'components-ui-html/src/types';
	import { numberToCurrencyString } from 'utils-shared/amount';
	import { base } from '$app/paths';

	const { eventEmitter } = getContextEventEmitter<EmitterEventModal>();

	const art = (file: string) => `${base}/assets/sprites/goBananasUi/${file}`;

	type Card = {
		/** the meta's titles say BUY (FREE SPINS...), which the button already
		 *  says; the card is named by what it is */
		title: string;
		accent: string;
		tag: string;
		scene: string;
		/** the tarp bundles, stacked on the scene: where each stands (% of the
		 *  scene box: its centre, its bottom, its width) and what pops out */
		pile?: Bundle[];
		/** Hold and Spin: the Coin pile, and the Coins hopping off it */
		hero?: string;
		/** the row under the title: Coins (respins) or crates (the load) */
		meter: { kind: 'coins' | 'crates'; on: number; of: number; label: string };
		points: string[];
		hot?: boolean;
	};

	type Bundle = { x: number; bottom: number; w: number; loot: string; delay: number; flags?: boolean };

	const COIN = art('buy_coin.png');
	const BUNDLE = art('buy_bundle.png');
	const LOOT = (k: string) => art(`buy_loot_${k}.png`);
	const CRATE = art('buy_crate.png');
	// the accents climb the game's own tier ramp (multiplierTiers, the plaques):
	// brass, amber, the hot red the top tier ends on
	const CARDS: Record<string, Card> = {
		HOLDANDSPIN: {
			title: 'HOLD AND SPIN',
			accent: '#e9c46a',
			tag: 'THE HOLD',
			scene: art('buy_scene_hold.jpg'),
			hero: art('buy_hero_holdandspin.png'),
			meter: { kind: 'coins', on: 3, of: 3, label: '3 RESPINS' },
			points: ['Coins stick and reset the respins', 'Max win 1,000×'],
		},
		BONUS100: {
			title: 'FREE SPINS',
			accent: '#e8b545',
			tag: 'FREE SPINS',
			scene: art('buy_scene_dock.jpg'),
			pile: [{ x: 50, bottom: 4, w: 40, loot: 'h1', delay: 0 }],
			meter: { kind: 'crates', on: 1, of: 3, label: 'CARGO · LIGHT LOAD' },
			points: ['8 free spins', 'x1–x5 multiplier wheel', 'Crates on every spin'],
		},
		BONUS200: {
			title: 'SUPER FREE SPINS',
			accent: '#ffa347',
			tag: 'SUPER',
			scene: art('buy_scene_storm.jpg'),
			pile: [
				{ x: 31, bottom: 4, w: 36, loot: 'h1', delay: 0 },
				{ x: 69, bottom: 4, w: 36, loot: 'h3', delay: 0.9 },
			],
			meter: { kind: 'crates', on: 2, of: 3, label: 'CARGO · HEAVY LOAD' },
			points: ['8 free spins', 'x1–x5 multiplier wheel', 'More crates, more Full Shipments'],
		},
		BONUS300: {
			title: 'MAX FREE SPINS',
			accent: '#ff7a4a',
			tag: 'MAX',
			scene: art('buy_scene_storm.jpg'),
			// a pyramid, the flags planted in the top one
			pile: [
				{ x: 26, bottom: 2, w: 30, loot: 'h2', delay: 0 },
				{ x: 74, bottom: 2, w: 30, loot: 'h3', delay: 0.6 },
				{ x: 50, bottom: 30, w: 30, loot: 'h1', delay: 1.3, flags: true },
			],
			meter: { kind: 'crates', on: 3, of: 3, label: 'CARGO · FULL LOAD' },
			points: ['8 free spins', 'x1–x5 multiplier wheel', 'The most crates and Full Shipments'],
			hot: true,
		},
	};

	/** the Coins that hop off the Hold and Spin pile: % of the scene box */
	const HOPS = [
		{ x: 30, bottom: 38, delay: 0 },
		{ x: 50, bottom: 52, delay: 0.8 },
		{ x: 68, bottom: 38, delay: 1.6 },
	];

	/** one entry per meter slot: lit or not */
	const lights = (card: Card) => Array.from({ length: card.meter.of }, (_, k) => k < card.meter.on);

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
		<div class="menu">
			<!-- title and amount on one row: a second row of header cost the menu its
			     fit on a 720px-tall screen -->
			<div class="head">
				<div class="titles">
					<h2>{social ? 'FEATURES' : 'BUY FEATURE'}</h2>
					<div class="sub">CHOOSE YOUR CARGO</div>
				</div>
				<div class="amount"><BetMenuAmountToggle /></div>
			</div>

			<div class="cards">
				{#each modes as mode (mode.mode)}
					{@const card = CARDS[mode.mode]}
					{#if card}
						<section class="card" class:hot={card.hot} style:--accent={card.accent}>
							<div class="scene" style:background-image={`url('${card.scene}')`}>
								<div class="light"></div>
								<div class="stage">
									{#if card.hero}
										<img class="hero" src={card.hero} alt="" />
										<!-- Coins hopping off the pile, spinning -->
										{#each HOPS as hop (hop.x)}
											<img
												class="hop"
												src={LOOT('coin')}
												alt=""
												style:left={`${hop.x}%`}
												style:bottom={`${hop.bottom}%`}
												style:animation-delay={`${hop.delay}s`}
											/>
										{/each}
									{/if}
									{#each card.pile ?? [] as bundle (bundle.loot)}
										<!-- the loot sits behind the bundle and pops up out of it -->
										<div
											class="bundle"
											style:left={`${bundle.x}%`}
											style:bottom={`${bundle.bottom}%`}
											style:width={`${bundle.w}%`}
											style:--delay={`${bundle.delay}s`}
										>
											<div class="burst"></div>
											<img class="loot" src={LOOT(bundle.loot)} alt="" />
											<img class="tarp" src={BUNDLE} alt="" />
											{#if bundle.flags}<img class="flags" src={LOOT('h4')} alt="" />{/if}
										</div>
									{/each}
								</div>
								<span class="tag">{card.tag}</span>
							</div>
							<div class="body">
								<h3>{card.title}</h3>
								<div class="meter">
									{#each lights(card) as lit}
										{#if card.meter.kind === 'coins'}
											<img class="coin" src={COIN} alt="" />
										{:else}
											<img class="crate" class:off={!lit} src={CRATE} alt="" />
										{/if}
									{/each}
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
			<div class="foot">All features play at 95% RTP · Max win 10,000×</div>
		</div>
	</Popup>
{/if}

<style>
	/* z-index 3: above the Popup's click-to-close layer (2), so a click on a
	   card is not a click outside it. The Popup draws its own close button. */
	.menu {
		/* the game's own palette (game/palette.ts): hull navy, brass trim */
		--brass: #e8b545;
		--muted: #8fa6b8;
		position: relative;
		z-index: 3;
		width: min(1040px, calc(100vw - 32px));
		max-height: calc(100vh - 24px);
		overflow: auto;
		padding: 24px 24px 20px;
		box-sizing: border-box;
		background: linear-gradient(180deg, #172733 0%, #0b141b 100%);
		border: 2px solid var(--brass);
		border-radius: 14px;
		box-shadow:
			0 0 0 4px #0008,
			0 24px 60px #000c,
			inset 0 0 40px #0009;
		color: #ece4cf;
		text-align: center;
		font-family: 'Segoe UI', Tahoma, Arial, sans-serif;
	}
	/* rivets on the frame */
	.menu::before,
	.menu::after {
		content: '';
		position: absolute;
		top: 10px;
		width: 10px;
		height: 10px;
		border-radius: 50%;
		background: radial-gradient(circle at 35% 35%, #ffe7a3, #8a5c14 70%);
	}
	.menu::before {
		left: 10px;
	}
	.menu::after {
		right: 10px;
	}
	/* `.menu h2` / `.menu h3` and !important: the platform skin in Modals.svelte
	   paints every popup heading cream with !important
	   (html[data-ui-skin='platform'] .pop-up-wrap h2), which turned the gold
	   title and every card's coloured name the same off-white. These selectors
	   outrank it. */
	.head {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: center;
		gap: 10px 28px;
	}
	.menu h2 {
		color: #ffd46b !important;
	}
	.menu h3 {
		color: var(--accent) !important;
	}
	h2 {
		margin: 0;
		font: 400 34px var(--gb-display-font, 'Titan One');
		letter-spacing: 2px;
		color: #ffd36a;
		text-shadow:
			0 3px 0 #3a2608,
			0 0 18px #ffd46b55;
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
		background: linear-gradient(180deg, #172733, #0b141b);
		border: 2px solid color-mix(in srgb, var(--accent) 70%, #000);
		box-shadow: 0 8px 22px #000a;
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
	}
	.card.hot {
		animation: hot 1.6s ease-in-out infinite;
	}
	@keyframes hot {
		50% {
			box-shadow:
				0 8px 22px #000a,
				0 0 26px var(--glow);
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.card,
		.card.hot,
		.tarp,
		.loot,
		.burst,
		.flags,
		.hop,
		.buy:hover::after {
			animation: none;
			transition: none;
		}
	}

	.scene {
		position: relative;
		aspect-ratio: 16 / 12;
		max-height: 180px;
		background-size: cover;
	}
	.scene::after {
		content: '';
		position: absolute;
		inset: 0;
		background: linear-gradient(180deg, #0000 45%, #0b141b 100%);
	}
	.light {
		position: absolute;
		left: 50%;
		top: 52%;
		width: 90%;
		aspect-ratio: 1;
		transform: translate(-50%, -50%);
		border-radius: 50%;
		background: radial-gradient(circle, var(--glow) 0%, transparent 65%);
		z-index: 1;
	}
	/* The hero art is drawn for the scene's full 16:12 box, so it is laid over
	   it whole and centred: when a short screen caps the scene's height the
	   picture shrinks with it and the pile keeps its shape. */
	.stage {
		position: absolute;
		left: 50%;
		bottom: 0;
		height: 100%;
		aspect-ratio: 16 / 12;
		transform: translateX(-50%);
		z-index: 2;
		pointer-events: none;
	}
	.hero {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		/* a rim of the card's own light round the Coins */
		filter: drop-shadow(0 0 1px color-mix(in srgb, var(--accent) 60%, #fff));
	}
	/* THE CARGO. Each bundle is the Mystery crate's tarp bundle; its loot
	   stands behind it, peeking over the ropes, and once a cycle it pops up out
	   of it — the bundle squashes as it goes, a flash of the card's light behind
	   it — and drops back in. The bundles take turns (--delay). Sizes are % of
	   the scene box, so the pile keeps its shape at every card size. */
	.stage {
		--pop: 2.6s;
	}
	.bundle {
		position: absolute;
		aspect-ratio: 425 / 380;
		transform: translateX(-50%);
	}
	.tarp {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		transform-origin: 50% 100%;
		filter: drop-shadow(0 6px 6px #000b);
		animation: tarp var(--pop) ease-in-out var(--delay) infinite;
	}
	.loot {
		position: absolute;
		left: 50%;
		bottom: 45%;
		width: 74%;
		transform-origin: 50% 100%;
		transform: translate(-50%, 16%) scale(0.9);
		filter: drop-shadow(0 0 2px color-mix(in srgb, var(--accent) 70%, #fff)) drop-shadow(0 6px 6px #000a);
		animation: pop var(--pop) cubic-bezier(0.3, 0, 0.3, 1) var(--delay) infinite;
	}
	.burst {
		position: absolute;
		left: 50%;
		top: 0;
		width: 130%;
		aspect-ratio: 1;
		border-radius: 50%;
		transform: translate(-50%, -50%) scale(0.3);
		background: radial-gradient(circle, color-mix(in srgb, var(--accent) 70%, #fff) 0%, var(--glow) 35%, transparent 68%);
		opacity: 0;
		animation: burst var(--pop) ease-out var(--delay) infinite;
	}
	/* the signal flags, planted in the top of the pile, flapping */
	.flags {
		position: absolute;
		left: 58%;
		bottom: 70%;
		width: 62%;
		transform-origin: 40% 100%;
		filter: drop-shadow(0 4px 4px #000a);
		animation: flap 1.3s ease-in-out infinite alternate;
	}
	@keyframes pop {
		0%,
		8% {
			transform: translate(-50%, 16%) scale(0.9);
		}
		/* out, stretched */
		20% {
			transform: translate(-50%, -40%) scale(0.92, 1.12) rotate(-6deg);
		}
		/* the hang at the top, turning to the player */
		32% {
			transform: translate(-50%, -48%) scale(1.08) rotate(5deg);
		}
		44% {
			transform: translate(-50%, -43%) scale(1.06) rotate(-2deg);
		}
		/* back in, squashed */
		56% {
			transform: translate(-50%, 20%) scale(0.95, 0.86);
		}
		64%,
		100% {
			transform: translate(-50%, 16%) scale(0.9);
		}
	}
	@keyframes tarp {
		0%,
		4% {
			transform: scale(1);
		}
		/* crouch as the loot pushes out, spring up after it */
		10% {
			transform: scale(1.1, 0.86);
		}
		20% {
			transform: scale(0.95, 1.07);
		}
		28%,
		54% {
			transform: scale(1);
		}
		/* the loot lands back in */
		60% {
			transform: scale(1.07, 0.92);
		}
		68%,
		100% {
			transform: scale(1);
		}
	}
	@keyframes burst {
		0%,
		12% {
			opacity: 0;
			transform: translate(-50%, -50%) scale(0.3);
		}
		22% {
			opacity: 1;
			transform: translate(-50%, -80%) scale(1);
		}
		50%,
		100% {
			opacity: 0;
			transform: translate(-50%, -80%) scale(1.3);
		}
	}
	@keyframes flap {
		from {
			transform: rotate(-5deg);
		}
		to {
			transform: rotate(6deg) scale(1.02, 0.98);
		}
	}
	/* Hold and Spin: Coins hop off the pile, spinning on edge */
	.hop {
		position: absolute;
		width: 17%;
		transform: translateX(-50%);
		filter: drop-shadow(0 0 3px #ffd46b) drop-shadow(0 5px 5px #000a);
		opacity: 0;
		animation: hop 2.4s ease-in-out infinite;
	}
	@keyframes hop {
		0%,
		10% {
			opacity: 0;
			transform: translate(-50%, 20%) rotateY(0deg) scale(0.7);
		}
		18% {
			opacity: 1;
		}
		38% {
			transform: translate(-50%, -110%) rotateY(360deg) scale(1);
		}
		60% {
			opacity: 1;
			transform: translate(-50%, 10%) rotateY(720deg) scale(0.85);
		}
		68%,
		100% {
			opacity: 0;
			transform: translate(-50%, 20%) rotateY(720deg) scale(0.7);
		}
	}
	/* on hover the whole pile rises to meet the pointer */
	@media (hover: hover) {
		.card:hover .stage {
			transform: translateX(-50%) translateY(-4px) scale(1.04);
			transition: transform 0.25s ease;
		}
	}
	.tag {
		position: absolute;
		left: 10px;
		top: 10px;
		z-index: 3;
		padding: 3px 9px;
		border-radius: 20px;
		font: 400 11px var(--gb-display-font, 'Titan One');
		letter-spacing: 1.5px;
		color: #0b141b;
		background: var(--accent);
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
		text-shadow: 0 2px 0 #000;
	}
	.meter {
		display: flex;
		justify-content: center;
		gap: 5px;
		margin-bottom: 6px;
	}
	.meter {
		align-items: flex-end;
		min-height: 38px;
	}
	.crate {
		width: 34px;
		height: 30px;
		object-fit: contain;
		filter: drop-shadow(0 2px 3px #000a);
	}
	/* a crate not on this tier: the same crate, empty-handed */
	.crate.off {
		filter: grayscale(1) brightness(0.35);
		opacity: 0.55;
	}
	.coin {
		width: 24px;
		height: 24px;
		filter: drop-shadow(0 2px 3px #000a);
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
		color: #c9d6df;
	}
	li::before {
		content: '◆';
		position: relative;
		top: -1px;
		margin-right: 7px;
		font-size: 9px;
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
		margin-top: 8px;
		padding: 11px 8px;
		border: 0;
		border-radius: 8px;
		cursor: pointer;
		font: 400 15px var(--gb-display-font, 'Titan One');
		letter-spacing: 1px;
		color: #0b141b;
		background: linear-gradient(
			180deg,
			color-mix(in srgb, var(--accent) 80%, #fff),
			var(--accent) 55%,
			color-mix(in srgb, var(--accent) 70%, #000)
		);
		box-shadow:
			0 3px 0 color-mix(in srgb, var(--accent) 40%, #000),
			inset 0 1px 0 #fff8;
	}
	/* the button answers the pointer: it brightens, lifts, glows in the
	   card's colour and a streak of light runs across it. Pointer devices only,
	   like the card's own lift — a :hover left behind by a tap would keep it lit. */
	.buy {
		position: relative;
		overflow: hidden;
		transition:
			filter 0.15s ease,
			transform 0.15s ease,
			box-shadow 0.15s ease;
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
		opacity: 0;
		pointer-events: none;
	}
	@media (hover: hover) {
		.buy:hover {
			filter: brightness(1.18) saturate(1.1);
			transform: translateY(-2px);
			box-shadow:
				0 5px 0 color-mix(in srgb, var(--accent) 40%, #000),
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
		box-shadow: 0 1px 0 color-mix(in srgb, var(--accent) 40%, #000);
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

	/* SHORT SCREENS (a 1280x720 landscape and down): everything on one screen,
	   no scrolling to find the title or the buttons. The scenes give up height
	   first — they are decoration; the prices and the buttons are not. */
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
		.crate {
			width: 24px;
			height: 22px;
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
		.meterlabel {
			margin-bottom: 4px;
		}
		.buy {
			padding: 8px 6px;
		}
		/* the RTP line is in the game rules; on a phone it cost the menu its fit */
		.foot {
			display: none;
		}
		.crate {
			width: 24px;
			height: 22px;
		}
		.coin {
			width: 20px;
			height: 20px;
		}
		.meterlabel {
			font-size: 10px;
			letter-spacing: 1px;
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
