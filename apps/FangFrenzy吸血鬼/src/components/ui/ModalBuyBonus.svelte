<script lang="ts">
	/**
	 * The feature-buy menu, FangFrenzy's own (DeadwoodExpress's layout, this
	 * game's tomb palette): one card per buy, each with an emblem on a lit
	 * scene, a title, what it does, the price in big figures and one full-width
	 * button.
	 *
	 * Replaces the shared ModalBuyBonus, whose cards are text over a flat
	 * panel — the only free-text comment a sibling game's review left was "Bonus
	 * buy menu is too simple". Kept in this app rather than in
	 * components-ui-html: the look is this game's, not the library's.
	 *
	 * Two buys (the 50x hold and spin, the 100x free spins) and three
	 * activations (Scarab 5x / 10x, Moon Boost 1.5x) that stay on, paid per spin,
	 * until switched off from the Buy Bonus button. The emblems are drawn in
	 * the delivered scene illustrations.
	 *
	 * Choosing a card hands over to the shared ModalBuyBonusConfirm, exactly as
	 * the shared menu did.
	 */
	import { Popup } from 'components-shared';
	import { zIndex } from 'constants-shared/zIndex';
	import { stateModal, stateMetaDerived, stateBet, stateUrlDerived } from 'state-shared';
	import { stateBonus } from 'components-ui-html/src/stateBonus.svelte';
	import BuyMenuBetPill from './BuyMenuBetPill.svelte';
	import BuyEmblem from './BuyEmblem.svelte';
	import { getContextEventEmitter } from 'utils-event-emitter';
	import type { EmitterEventModal } from 'components-ui-html/src/types';
	import { numberToCurrencyString } from 'utils-shared/amount';
	import config from '../../game/config';

	const { eventEmitter } = getContextEventEmitter<EmitterEventModal>();

	// The cards are drawn in code in the game's own palette until the card art
	// lands: tomb teal, sandstone, bandage cream, one accent per card
	// (MUMMY_ART_REQUIREMENTS §0.3; sun gold only on the Moon Boost card).
	// Production mummy textures: design/source/mummy_delivery.
	type Card = {
		/** the meta's titles say BUY (FREE SPINS...), which the button already
		 *  says; the card is named by what it is */
		title: string;
		accent: string;
		tag: string;
		emblem: 'coins' | 'arch' | 'scarab' | 'sure' | 'sun';
		/** the row under the title: respin pips (Hold and Spin) and a one-line label */
		meter: { pips: number; label: string };
		points: string[];
		hot?: boolean;
	};

	const CARDS: Record<string, Card> = {
		HOLDANDSPIN: {
			title: 'HOLD AND SPIN',
			accent: '#d39257',
			tag: 'COINS',
			emblem: 'coins',
			meter: { pips: 3, label: '3 RESPINS' },
			points: [
				'Coins stick and reset the respins',
				`Max win ${(config.betModes.holdandspin?.max_win ?? 1000).toLocaleString()}×`,
			],
		},
		BONUS: {
			title: 'FREE SPINS',
			accent: '#2ec4b6',
			tag: 'FREE SPINS',
			emblem: 'arch',
			meter: { pips: 0, label: 'BAT WHEEL' },
			points: [`${config.betModes.bonus.spins} free spins`, 'Every winning spin turns the Bat Wheel'],
			hot: true,
		},
		SCARAB5: {
			title: 'BAT SPIN',
			accent: '#5b8fe0',
			tag: 'ACTIVATE',
			emblem: 'scarab',
			meter: { pips: 0, label: 'BAT WHEEL ON EVERY WIN' },
			points: ['Any line win turns the Bat Wheel', 'Stays on until switched off'],
		},
		SCARAB10: {
			title: 'BAT SURE WIN',
			accent: '#e0604f',
			tag: 'ACTIVATE',
			emblem: 'sure',
			meter: { pips: 0, label: 'A LINE WIN EVERY SPIN' },
			points: ['Every spin lands a line win', 'Every spin turns the Bat Wheel'],
			hot: true,
		},
		SUNBOOST: {
			title: 'MOON BOOST',
			accent: '#ffc23a',
			tag: 'ACTIVATE',
			emblem: 'sun',
			meter: { pips: 0, label: 'MOON WHEEL MORE OFTEN' },
			points: ['The Moon Wheel about 1 spin in 38', 'Stays on until switched off'],
		},
	};

	const modes = $derived(stateMetaDerived.betModeMetaList().filter((m) => m.type === 'buy'));
	const activations = $derived(
		stateMetaDerived.betModeMetaList().filter((m) => m.type === 'activate'),
	);
	const groups = $derived([
		{ key: 'buy', label: '', list: modes },
		{ key: 'activate', label: 'ACTIVATE · ON FOR EVERY SPIN', list: activations },
	]);
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
			<!-- the stake is changed from the pill at the foot (BuyMenuBetPill), as
			     the reference's buy menu does -->
			<div class="head">
				<div class="titles">
					<h2>{social ? 'FEATURES' : 'BUY FEATURE'}</h2>
					<div class="sub">CHOOSE YOUR CURSE</div>
				</div>
			</div>

			{#each groups as group (group.key)}
				{#if group.list.length}
				{#if group.label}<div class="group">{group.label}</div>{/if}
			<div class="cards">
				{#each group.list as mode (mode.mode)}
					{@const card = CARDS[mode.mode]}
					{#if card}
						<section class="card" class:hot={card.hot} style:--accent={card.accent}>
							<div class="scene">
								<div class="light"></div>
								<BuyEmblem kind={card.emblem} accent={card.accent} />
								<span class="tag">{card.tag}</span>
							</div>
							<div class="body">
								<h3>{card.title}</h3>
								<div class="meter">
									{#each { length: card.meter.pips } as _, i (i)}
										<span class="pip"></span>
									{/each}
								</div>
								<div class="meterlabel">{card.meter.label}</div>
								<ul>
									{#each card.points as p (p)}<li>{p}</li>{/each}
								</ul>
								<div class="cost">
									<span class="price-label">{social ? 'PLAY AMOUNT' : group.key === 'activate' ? 'PRICE PER SPIN' : 'FEATURE PRICE'}</span>
									<strong class="price-amount">{numberToCurrencyString(stateBet.betAmount * mode.costMultiplier)}</strong>
									<span class="price-factor">{mode.costMultiplier}× {social ? 'BASE PLAY AMOUNT' : 'BASE BET'}</span>
								</div>
								<button class="buy" onclick={() => choose(mode.mode)}>
									{mode.text.button}
								</button>
							</div>
						</section>
					{/if}
				{/each}
			</div>
				{/if}
			{/each}
			<div class="foot">
				Activations stay on, at their multiple of the {social ? 'play amount' : 'bet'} every spin, until switched off
				with the feature button.<br />
				All features play at {(config.rtp * 100).toFixed(0)}% RTP · Max win {(config.betModes.base?.max_win ?? 10000).toLocaleString()}×
			</div>
		</div>
		<BuyMenuBetPill />
	</Popup>
{/if}

<style>
	/* z-index 3: above the Popup's click-to-close layer (2), so a click on a
	   card is not a click outside it. The Popup draws its own close button. */
	.menu {
		/* sandstone frame on tomb teal (MUMMY_ART_REQUIREMENTS §0.3) */
		--brass: #d9b77a;
		--muted: #a9c3c0;
		position: relative;
		z-index: 3;
		width: min(1040px, calc(100dvw - 16px));
		/* room under it for the bet pill */
		max-height: calc(100dvh - 92px);
		margin-bottom: 64px;
		overflow-x: hidden;
		overflow-y: auto;
		padding: 24px 24px 20px;
		box-sizing: border-box;
		background: linear-gradient(180deg, #123a45 0%, #0b2229 100%);
		border: 2px solid var(--brass);
		border-radius: 14px;
		box-shadow:
			0 0 0 4px #0008,
			0 24px 60px #000c,
			inset 0 0 40px #0009;
		color: #f2e8d0;
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
		background: radial-gradient(circle at 35% 35%, #f2e8d0, #7a5530 70%);
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
		color: #f2e8d0 !important;
	}
	.menu h3 {
		color: var(--accent) !important;
	}
	h2 {
		margin: 0;
		font: 400 34px var(--gb-display-font, 'Titan One');
		letter-spacing: 2px;
		color: #f2e8d0;
		text-shadow:
			0 3px 0 #0b2229,
			0 0 18px #2ec4b655;
	}
	.sub {
		margin: 2px 0 0;
		color: var(--muted);
		font-size: 13px;
		letter-spacing: 3px;
	}
	.group {
		margin-top: 14px;
		font-size: 0.8rem;
		letter-spacing: 0.12em;
		color: var(--muted);
	}
	.cards {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
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
		background: linear-gradient(180deg, #0f2e37, #0b2229);
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

	/* a lit tomb wall: the card's colour glowing on tomb teal, with a band of
	   sandstone courses along the floor */
	.scene {
		position: relative;
		aspect-ratio: 16 / 12;
		max-height: 180px;
		background:
			repeating-linear-gradient(90deg, #0000 0 38px, #0004 38px 40px) bottom / 100% 16% no-repeat,
			linear-gradient(#7a5530, #5a3d22) bottom / 100% 16% no-repeat,
			radial-gradient(120% 90% at 50% 40%, color-mix(in srgb, var(--accent) 34%, #10303a) 0%, #10303a 55%, #0a2027 100%);
	}
	.scene::after {
		content: '';
		position: absolute;
		inset: 0;
		background: linear-gradient(180deg, #0000 55%, #0b2229 100%);
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
	/* the emblem is a 4:3 drawing, centred and as tall as the scene, so a short
	   screen capping the scene's height shrinks it whole instead of cropping */
	.emblem {
		position: absolute;
		top: 6%;
		bottom: 10%;
		left: 50%;
		aspect-ratio: 4 / 3;
		transform: translateX(-50%);
		z-index: 2;
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
		color: #0b2229;
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
		min-height: 24px;
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
	/* a respin: a small bronze coin with the turquoise ring */
	.pip {
		width: 20px;
		height: 20px;
		border-radius: 50%;
		background: radial-gradient(circle at 38% 32%, #f0c08a, #b8743c 55%, #6e3f1c);
		box-shadow:
			inset 0 0 0 3px #2ec4b6,
			0 2px 3px #000a;
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
		color: #d6e2df;
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
		padding: 10px 6px;
		border: 1px solid #86a6a6;
		border-radius: 8px;
		background: #04171c;
		font-variant-numeric: tabular-nums;
	}
	.menu .price-label {display:block;color:#c1d8d5;font:700 11px/1.3 'Segoe UI',Arial,sans-serif;letter-spacing:1px;}
	.menu .price-amount {display:block;margin:4px 0;color:#fff !important;font:800 clamp(24px,2.8vw,36px)/1.15 'Segoe UI',Arial,sans-serif;overflow-wrap:anywhere;}
	.menu .price-factor {display:block;color:#e3c58d;font:700 12px/1.3 'Segoe UI',Arial,sans-serif;}
	@media (max-height:640px) and (min-width:521px) {.cost{padding:6px 4px}.menu .price-amount{font-size:24px}}
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
</style>
