<script lang="ts">
	/**
	 * The feature-buy menu, GoBoomana's own (DeadwoodExpress's layout, this
	 * game's mine): one card per buy, each with a scene and its hero on top, a
	 * title, what it does, the price in big figures and one full-width button.
	 *
	 * Replaces the shared ModalBuyBonus, whose cards are text over a flat
	 * panel — the only free-text comment a sibling game's review left was "Bonus
	 * buy menu is too simple". Kept in this app rather than in
	 * components-ui-html: the look is this game's, not the library's.
	 *
	 * The tiers are told apart at a glance by how much dynamite is on the card
	 * (one bundle, two, three) and by the blast ladder under the title: how many
	 * reels the FIRST blast covers. Those are the levels the maths opens each
	 * buy at (buy_start_banked 0 / 2 / 4 -> levels 1 / 2 / 3, game_config.py).
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
	import { base } from '$app/paths';
	import config from '../../game/config';

	const { eventEmitter } = getContextEventEmitter<EmitterEventModal>();

	const art = (file: string) => `${base}/assets/sprites/goBananasUi/${file}`;

	type Hero = { src: string; w: number; x: number; y: number; r?: number };
	type Card = {
		/** the meta's titles say BUY (FREE SPINS...), which the button already
		 *  says; the card is named by what it is */
		title: string;
		accent: string;
		tag: string;
		scene: string;
		/** background-position of the scene */
		focus?: string;
		heroes: Hero[];
		/** the row under the title: coin pips (respins) or dynamite sticks (first blast) */
		meter: { kind: 'coins' | 'blast'; on: number; of: number; label: string };
		points: string[];
		hot?: boolean;
	};

	// sized and placed as percentages of the scene, so the card scales whole
	const COIN = `${base}/assets/sprites/goBananasSymbolsV3/p.png`;
	const TNT = `${base}/assets/sprites/goBananasSymbolsV3/dynamite.png`;
	const CARDS: Record<string, Card> = {
		HOLDANDSPIN: {
			title: 'HOLD AND SPIN',
			accent: '#39e5ff',
			tag: 'VAULT',
			scene: art('buy_art_holdandspin.jpg'),
			heroes: [
				{ src: COIN, w: 34, x: -36, y: 26, r: -12 },
				{ src: COIN, w: 34, x: 2, y: 26, r: 10 },
				{ src: COIN, w: 42, x: -21, y: 12 },
			],
			meter: { kind: 'coins', on: 3, of: 3, label: '3 RESPINS' },
			points: ['Coins stick and reset the respins', 'Max win 1,000×'],
		},
		BONUS100: {
			title: 'FREE SPINS',
			accent: '#ff45c4',
			tag: 'FREE SPINS',
			scene: art('buy_art_bonus.jpg'),
			heroes: [{ src: TNT, w: 56, x: -28, y: 14 }],
			meter: { kind: 'blast', on: 1, of: 5, label: 'FIRST BLAST · 1 REEL' },
			points: ['8 free spins', 'Every Neon Bomb widens the next blast'],
		},
		BONUS200: {
			title: 'SUPER FREE SPINS',
			accent: '#a473ff',
			tag: 'SUPER',
			scene: art('buy_art_bonus.jpg'),
			focus: '30% center',
			heroes: [
				{ src: TNT, w: 48, x: -45, y: 22, r: -14 },
				{ src: TNT, w: 48, x: -4, y: 18, r: 10 },
			],
			meter: { kind: 'blast', on: 2, of: 5, label: 'FIRST BLAST · 2 REELS' },
			points: ['8 free spins', 'The blast opens two reels wide'],
		},
		BONUS300: {
			title: 'MAX FREE SPINS',
			accent: '#ffd848',
			tag: 'MAX',
			scene: art('buy_art_bonus.jpg'),
			focus: '70% center',
			heroes: [
				{ src: TNT, w: 44, x: -49, y: 28, r: -20 },
				{ src: TNT, w: 44, x: 5, y: 28, r: 18 },
				{ src: TNT, w: 52, x: -26, y: 10 },
			],
			meter: { kind: 'blast', on: 3, of: 5, label: 'FIRST BLAST · 3 REELS' },
			points: ['8 free spins', 'The blast opens three reels wide'],
			hot: true,
		},
	};

	const modes = $derived(stateMetaDerived.betModeMetaList().filter((m) => m.type === 'buy'));
	// social play: no betting words anywhere the player can read
	const social = $derived(stateUrlDerived.social());

	const close = () => (stateModal.modal = null);
	const choose = (mode: string) => {
		stateBonus.selectedBetModeKey = mode;
		eventEmitter.broadcast({ type: 'buyBonusConfirm' });
	};
</script>

<!-- Five neon charge cells show how wide the opening blast is. -->
{#snippet stick(lit: boolean)}
  <svg class="stick" viewBox="0 0 28 48" aria-hidden="true">
    <rect x="3" y="10" width="22" height="28" rx="10"
      fill={lit ? '#17265a' : '#10172d'}
      stroke={lit ? '#59e3ff' : '#465071'} stroke-width="2" />
    {#if lit}
      <circle cx="14" cy="24" r="7" fill="#b143ec" />
      <path d="M16 15 L10 25 H14 L12 33 L19 22 H15 Z" fill="#fff4fb" />
    {:else}
      <circle cx="14" cy="24" r="5" fill="#28345c" />
    {/if}
  </svg>
{/snippet}

{#if stateModal.modal?.name === 'buyBonus'}
	<Popup zIndex={zIndex.modal} onclose={close}>
		<div class="menu">

			<!-- title and amount on one row: a second row of header cost the menu its
			     fit on a 720px-tall screen -->
			<div class="head">
				<div class="titles">
					<h2>{social ? 'FEATURES' : 'BUY FEATURE'}</h2>
					<div class="sub">CHOOSE YOUR CHARGE</div>
				</div>
				<div class="amount"><BetMenuAmountToggle /></div>
			</div>

			<div class="cards">
				{#each modes as mode (mode.mode)}
					{@const card = CARDS[mode.mode]}
					{#if card}
						<section class="card" class:hot={card.hot} style:--accent={card.accent}>
							<div class="scene" style:background-image={`url('${card.scene}')`} style:background-position={card.focus ?? 'center'}>
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
										/>
									{/each}
								</div>
								<span class="tag">{card.tag}</span>
							</div>
							<div class="body">
								<h3>{card.title}</h3>
								<div class="meter">
									{#each { length: card.meter.of } as _, i (i)}
										{#if card.meter.kind === 'coins'}
											<img class="coin" src={COIN} alt="" />
										{:else}
											{@render stick(i < card.meter.on)}
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
			<div class="foot">All features play at {(config.rtp * 100).toFixed(0)}% RTP · Max win 10,000×</div>
		</div>
	</Popup>
{/if}

<style>
	/* z-index 3: above the Popup's click-to-close layer (2), so a click on a
	   card is not a click outside it. The Popup draws its own close button. */
	.menu {
		--brass: #39dfff;
		--muted: #aab3d1;
		position: relative;
		z-index: 3;
		width: min(1040px, calc(100dvw - 16px));
		max-height: calc(100dvh - 16px);
		overflow-x: hidden;
		overflow-y: auto;
		padding: 24px 24px 20px;
		box-sizing: border-box;
		background: linear-gradient(180deg, #181a3b 0%, #090e25 100%);
		border: 2px solid var(--brass);
		border-radius: 14px;
		box-shadow:
			0 0 0 4px #0008,
			0 24px 60px #000c,
			inset 0 0 40px #0009;
		color: #f7eeff;
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
		background: radial-gradient(circle at 35% 35%, #aefaff, #39bce8 70%);
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
		color: #63eaff !important;
	}
	.menu h3 {
		color: var(--accent) !important;
	}
	h2 {
		margin: 0;
		font: 400 34px var(--gb-display-font, 'Titan One');
		letter-spacing: 2px;
		color: #63eaff;
		text-shadow:
			0 3px 0 #102058,
			0 0 18px #37e6ff88;
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
		background: linear-gradient(180deg, #171d42, #0b1028);
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
		.spark,
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
		background: linear-gradient(180deg, #0000 35%, #0b1028 100%);
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
	/* The heroes are laid out in a box of the scene's full-size proportions,
	   centred and as tall as the scene. When a short screen caps the scene's
	   height, the box shrinks with it and the heroes keep their places —
	   sized off the scene's WIDTH instead, they spilled over the card title. */
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
		filter: drop-shadow(0 8px 10px #000c);
		pointer-events: none;
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
		color: #1a0f05;
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
	.defs {
		position: absolute;
		width: 0;
		height: 0;
	}
	.meter {
		align-items: flex-end;
		min-height: 38px;
	}
	.stick {
		width: 21px;
		height: 36px;
		overflow: visible;
	}
	.spark {
		transform-box: fill-box;
		transform-origin: center;
		animation: fizz 0.5s ease-in-out infinite alternate;
	}
	@keyframes fizz {
		from {
			opacity: 0.75;
			transform: scale(0.85) rotate(0deg);
		}
		to {
			opacity: 1;
			transform: scale(1.15) rotate(25deg);
		}
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
		color: #d9ccb0;
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
		color: #1a0f05;
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
		overflow-wrap: anywhere;
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
		.stick {
			width: 15px;
			height: 26px;
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
			grid-template-columns: minmax(0, 1fr);
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
		.stick {
			width: 15px;
			height: 26px;
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
	@media (max-width: 520px) and (max-height: 300px) {
		.menu {
			padding: 8px 10px;
		}
		.head {
			justify-content: space-between;
		}
		h2 {
			font-size: 20px;
		}
		.cards {
			margin-top: 6px;
		}
		.scene,
		ul {
			display: none;
		}
		.body {
			padding: 8px;
		}
		.meter {
			min-height: 26px;
			margin-bottom: 2px;
		}
		.cost {
			font-size: 25px;
		}
		.buy {
			margin-top: 3px;
		}
	}
	/* ── THE SMALLEST VIEWS (Stake review 2026-10-04: "Popout S" and "Mobile S").
	   Last in the sheet so they win over everything above. */

	/* A NARROW PHONE UPRIGHT (Mobile S, ~320 wide): four columns came out ~70px
	   each — titles broken mid-word, prices cut ("10(", "20("). Two by two
	   instead, and each card drops what the confirmation repeats anyway (the
	   bullets, the meter's caption). */
	@media (max-width: 520px) and (orientation: portrait) {
		.cards {
			grid-template-columns: repeat(2, 1fr);
			gap: 8px;
		}
		.scene {
			max-height: 70px;
		}
		ul,
		.meterlabel,
		.foot,
		.sub {
			display: none;
		}
		h3 {
			font-size: 14px;
		}
		.cost {
			font-size: 28px;
		}
	}

	/* A SHORT WINDOW (Popout S, a couple of hundred px tall): the cards were cut
	   off at the top — the menu showed prices and buttons under a sliver of
	   text. Only what choosing needs: the name, the price, the button. The scene
	   art, the meter and the bullets go; it is all in the confirmation. */
	@media (max-height: 420px) {
		.menu {
			padding: 8px 10px 8px;
			max-height: calc(100vh - 8px);
		}
		.menu::before,
		.menu::after,
		.sub,
		.scene,
		.meter,
		.meterlabel,
		ul,
		.foot {
			display: none;
		}
		h2 {
			font-size: 18px;
		}
		.head {
			gap: 4px 14px;
		}
		.cards {
			grid-template-columns: repeat(4, 1fr);
			gap: 6px;
			margin-top: 6px;
		}
		.body {
			padding: 6px 6px 6px;
		}
		h3 {
			min-height: 0;
			margin-bottom: 2px;
			font-size: 12px;
		}
		.cost {
			font-size: 22px;
		}
		.cost small {
			font-size: 14px;
		}
		.buy {
			margin-top: 4px;
			padding: 5px 4px;
			font-size: 11px;
		}
		.buy span {
			font-size: 10px;
		}
	}
</style>
