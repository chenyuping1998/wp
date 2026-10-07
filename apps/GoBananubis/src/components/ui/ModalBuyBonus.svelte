<script lang="ts">
	/**
	 * The feature-buy menu, Go Bananubis's own: Go Boomana's layout (one card per
	 * buy — a scene with its heroes standing in it, a name, a meter, what it
	 * does, the price in big figures and one full-width button), dressed as a
	 * tomb. It replaces the shared ModalBuyBonus, whose cards are text over a
	 * flat panel. Kept in this app rather than in components-ui-html: the look is
	 * this game's, not the library's.
	 *
	 * EGYPTIAN, AND PLAYFUL WITH IT. Every picture on a card is the game's own
	 * art (design/generate_buy_menu_art.py): the three background plates as the
	 * scenes, the symbols as the heroes. On top of that:
	 *   · a sunburst of Ra turns slowly behind the heroes of the top tier, and
	 *     behind any card under the pointer
	 *   · the heroes float, a little out of step with each other, like relics
	 *     lifted off an altar
	 *   · a band of inlay — turquoise, lapis, carnelian, gold, the colours of the
	 *     usekh collar and the sign's frame — runs across the top of each card
	 *   · the menu wears the winged sun on its crest
	 *
	 * The tiers are told apart at a glance by their colour, their scene and the
	 * meter under the name: how many Scatters the round opens on, as Scatter
	 * tiles lit N of 5 (the free-spin buys), or three Coins (Super Spin). Every
	 * number comes from the maths through BUY_FACTS (game/betModeMeta.ts).
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

	import { BUY_FACTS } from '../../game/betModeMeta';

	const { eventEmitter } = getContextEventEmitter<EmitterEventModal>();

	const art = (file: string) => `${base}/assets/sprites/goBananasUi/${file}`;

	type Hero = { src: string; w: number; x: number; y: number; r?: number };
	type Card = {
		/** named by what it is; the button says BUY */
		title: string;
		accent: string;
		tag: string;
		scene: string;
		/** background-position of the scene */
		focus?: string;
		heroes: Hero[];
		meter: { kind: 'scatters' | 'coins'; on: number; of: number; label: string };
		points: string[];
		hot?: boolean;
	};

	const TABLET = art('buy_tablet.png');
	const COIN = art('buy_coin.png');
	const SCATTER = art('buy_scatter.png');
	const SCARAB = art('buy_scarab.png');
	const EYE = art('buy_eye.png');
	const CHEST = art('buy_chest.png');
	const ANUBIS = art('buy_anubis.png');

	const TABLETS = 'Opened Tablets stay for the whole round';
	const MULTS = 'Each Tablet 2×–50×, redrawn every spin';
	const scatters = (n: number, spins: number) => `${n} SCATTERS · ${spins} FREE SPINS`;

	// heroes are placed as percentages of the scene, so the card scales whole
	const CARDS: Record<string, Card> = {
		BONUS100: {
			title: 'FREE SPINS',
			accent: '#3fd0b8',
			tag: 'TOMB',
			scene: art('buy_scene_hall.jpg'),
			heroes: [
				{ src: TABLET, w: 46, x: -25, y: 12, r: -5 },
				{ src: SCARAB, w: 22, x: 10, y: 50, r: 18 },
			],
			meter: {
				kind: 'scatters',
				on: BUY_FACTS.BONUS100.scatters,
				of: 5,
				label: scatters(BUY_FACTS.BONUS100.scatters, BUY_FACTS.BONUS100.spins),
			},
			points: [TABLETS, MULTS],
		},
		BONUS: {
			title: 'MORE FREE SPINS',
			accent: '#f5b83d',
			tag: 'TEMPLE',
			scene: art('buy_scene_sanctum.jpg'),
			focus: '35% center',
			heroes: [
				{ src: TABLET, w: 38, x: -45, y: 16, r: -12 },
				{ src: TABLET, w: 38, x: 7, y: 16, r: 10 },
				{ src: EYE, w: 36, x: -18, y: 56 },
			],
			meter: {
				kind: 'scatters',
				on: BUY_FACTS.BONUS.scatters,
				of: 5,
				label: scatters(BUY_FACTS.BONUS.scatters, BUY_FACTS.BONUS.spins),
			},
			points: [TABLETS, MULTS],
		},
		SUPERBONUS: {
			title: 'SUPER FREE SPINS',
			accent: '#ff5f3f',
			tag: 'PHARAOH',
			scene: art('buy_scene_sanctum.jpg'),
			focus: '65% center',
			heroes: [
				{ src: CHEST, w: 34, x: -54, y: 46, r: -10 },
				{ src: TABLET, w: 30, x: 22, y: 44, r: 12 },
				{ src: ANUBIS, w: 46, x: -23, y: 6 },
			],
			meter: {
				kind: 'scatters',
				on: BUY_FACTS.SUPERBONUS.scatters,
				of: 5,
				label: scatters(BUY_FACTS.SUPERBONUS.scatters, BUY_FACTS.SUPERBONUS.spins),
			},
			points: ['The richest Tablets, every spin', TABLETS],
			hot: true,
		},
		SUPERSPIN: {
			title: 'SUPER SPIN',
			accent: '#f7d97a',
			tag: 'TREASURY',
			scene: art('buy_scene_crypt.jpg'),
			heroes: [
				{ src: COIN, w: 34, x: -38, y: 30, r: -12 },
				{ src: COIN, w: 34, x: 4, y: 30, r: 10 },
				{ src: COIN, w: 42, x: -21, y: 12 },
			],
			meter: { kind: 'coins', on: 3, of: 3, label: '3 RESPINS' },
			points: ['Coins stick and reset the respins', `Max win ${BUY_FACTS.superspinCap}×`],
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

<!-- The winged sun, as on the free-game sign's crest: the menu wears it. -->
{#snippet wingedSun()}
	<svg class="crest" viewBox="0 0 220 44" aria-hidden="true">
		<defs>
			<linearGradient id="gbu-gold" x1="0" x2="0" y1="0" y2="1">
				<stop offset="0" stop-color="#fff0b8" /><stop offset=".45" stop-color="#e8b44a" /><stop offset="1" stop-color="#8a5a18" />
			</linearGradient>
			<radialGradient id="gbu-sun" cx=".38" cy=".35">
				<stop offset="0" stop-color="#ffb4a0" /><stop offset=".45" stop-color="#d23a22" /><stop offset="1" stop-color="#6a0e06" />
			</radialGradient>
		</defs>
		{#each [-1, 1] as side (side)}
			<g transform={`translate(110 22) scale(${side} 1)`}>
				{#each [0, 1, 2, 3] as i (i)}
					<path
						d={`M 16 ${-6 + i * 5} Q 50 ${-12 + i * 5} ${96 - i * 12} ${-10 + i * 6} L ${94 - i * 12} ${-6 + i * 6} Q 50 ${-6 + i * 5} 16 ${-1 + i * 5} Z`}
						fill={i === 1 ? '#2f7fd0' : i === 2 ? '#35c4a8' : 'url(#gbu-gold)'}
						stroke="#4a2c08"
						stroke-width=".8"
					/>
				{/each}
			</g>
		{/each}
		<circle cx="110" cy="22" r="13" fill="url(#gbu-sun)" stroke="url(#gbu-gold)" stroke-width="3" />
		<ellipse cx="106" cy="17" rx="4" ry="2.5" fill="#fff" opacity=".45" />
	</svg>
{/snippet}

{#if stateModal.modal?.name === 'buyBonus'}
	<Popup zIndex={zIndex.modal} onclose={close}>
		<div class="menu">
			{@render wingedSun()}
			<!-- title and amount on one row: a second row of header costs the menu
			     its fit on a 720px-tall screen (Boomana's finding) -->
			<div class="head">
				<div class="titles">
					<h2>{social ? 'FEATURES' : 'BUY FEATURE'}</h2>
					<div class="sub">OPEN THE TOMB</div>
				</div>
				<div class="amount"><BetMenuAmountToggle /></div>
			</div>

			<div class="cards">
				{#each modes as mode (mode.mode)}
					{@const card = CARDS[mode.mode]}
					{#if card}
						<section class="card" class:hot={card.hot} style:--accent={card.accent}>
							<div class="scene" style:background-image={`url('${card.scene}')`} style:background-position={card.focus ?? 'center'}>
								<div class="rays"></div>
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
											style:--d={`${-i * 0.9}s`}
										/>
									{/each}
								</div>
								<span class="tag">{card.tag}</span>
							</div>
							<div class="inlay" aria-hidden="true"></div>
							<div class="body">
								<h3>{card.title}</h3>
								<div class="meter">
									{#each { length: card.meter.of } as _, i (i)}
										<img
											class={card.meter.kind === 'coins' ? 'coin' : 'pip'}
											class:off={i >= card.meter.on}
											src={card.meter.kind === 'coins' ? COIN : SCATTER}
											alt=""
										/>
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
			<div class="foot">All features play at {BUY_FACTS.rtpPercent}% RTP · Max win {BUY_FACTS.lineCap}×</div>
		</div>
	</Popup>
{/if}

<style>
	/* z-index 3: above the Popup's click-to-close layer (2), so a click on a
	   card is not a click outside it. The Popup draws its own close button. */
	.menu {
		--gold: #d8a84a;
		--muted: #bfae8c;
		position: relative;
		z-index: 3;
		width: min(1040px, calc(100vw - 32px));
		max-height: calc(100vh - 24px);
		overflow: auto;
		padding: 30px 24px 20px;
		box-sizing: border-box;
		/* basalt, warmed from underneath like the sanctum's door */
		background:
			radial-gradient(120% 60% at 50% 115%, #5a2a0c55, transparent 60%),
			linear-gradient(180deg, #1b1712 0%, #100d0a 100%);
		border: 2px solid var(--gold);
		border-radius: 14px;
		box-shadow:
			0 0 0 4px #0009,
			0 0 0 5px #d8a84a44,
			0 24px 60px #000c,
			inset 0 0 40px #0009;
		color: #f1e4c6;
		text-align: center;
		font-family: 'Segoe UI', Tahoma, Arial, sans-serif;
	}
	/* square studs, the symbol plates' copper */
	.menu::before,
	.menu::after {
		content: '';
		position: absolute;
		top: 10px;
		width: 10px;
		height: 10px;
		transform: rotate(45deg);
		background: linear-gradient(135deg, #ffd9a0, #8a5424 70%);
		box-shadow: 0 1px 2px #000;
	}
	.menu::before {
		left: 12px;
	}
	.menu::after {
		right: 12px;
	}
	.crest {
		display: block;
		width: 190px;
		height: 38px;
		margin: -18px auto 2px;
		filter: drop-shadow(0 3px 4px #000c);
	}
	/* `.menu h2` / `.menu h3` and !important: the platform skin in Modals.svelte
	   paints every popup heading cream with !important, which turned the gold
	   title and every card's coloured name the same off-white (Boomana's finding).
	   These selectors outrank it. */
	.head {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: center;
		gap: 10px 28px;
	}
	.menu h2 {
		color: #ffd36a !important;
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
			0 3px 0 #6b3a0c,
			0 0 18px #ff9a2a66;
	}
	.sub {
		margin: 2px 0 0;
		color: var(--muted);
		font-size: 13px;
		letter-spacing: 4px;
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
		background: linear-gradient(180deg, #1c1711, #100d09);
		border: 2px solid color-mix(in srgb, var(--accent) 70%, #000);
		box-shadow: 0 8px 22px #000a;
		transition:
			transform 0.18s ease,
			box-shadow 0.18s ease;
	}
	/* Hover only where there is a real pointer: on a touch screen a :hover
	   sticks after the tap, and a card left lifted was one of the "controls stay
	   lit" findings against Deadwood Express. */
	/* NOTHING ON A CARD MOVES UNTIL THE POINTER IS ON IT: the glow, the sun's
	   rays and the floating heroes all start on hover (the top tier used to
	   pulse and turn its rays at rest, which read as the card being busy by
	   itself). The animations are declared always and PAUSED, and hover runs
	   them, so leaving a card freezes it where it is instead of snapping back. */
	@media (hover: hover) {
		.card:hover {
			transform: translateY(-6px);
			box-shadow:
				0 14px 30px #000c,
				0 0 22px var(--glow);
		}
		.card:hover .rays {
			opacity: 0.55;
		}
		.card:hover .rays,
		.card:hover .heroes img {
			animation-play-state: running;
		}
	}
	/* the top tier still stands out at rest — a steady glow, no motion */
	.card.hot {
		box-shadow:
			0 8px 22px #000a,
			0 0 18px var(--glow);
	}

	.scene {
		position: relative;
		aspect-ratio: 16 / 12;
		max-height: 180px;
		overflow: hidden;
		background-size: cover;
	}
	.scene::after {
		content: '';
		position: absolute;
		inset: 0;
		background: linear-gradient(180deg, #0000 40%, #100d09 100%);
		z-index: 2;
	}
	/* the sunburst of Ra: alternating wedges of the card's colour, turning */
	.rays {
		position: absolute;
		left: 50%;
		top: 46%;
		width: 150%;
		aspect-ratio: 1;
		translate: -50% -50%;
		border-radius: 50%;
		background: repeating-conic-gradient(
			from 0deg,
			color-mix(in srgb, var(--accent) 55%, transparent) 0deg 7deg,
			transparent 7deg 18deg
		);
		mask-image: radial-gradient(circle, #000 12%, transparent 62%);
		-webkit-mask-image: radial-gradient(circle, #000 12%, transparent 62%);
		opacity: 0;
		z-index: 1;
		transition: opacity 0.3s ease;
		animation: turn 18s linear infinite paused;
		pointer-events: none;
	}
	@keyframes turn {
		to {
			rotate: 360deg;
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
		background: radial-gradient(circle, var(--glow) 0%, transparent 65%);
		z-index: 1;
	}
	/* The heroes are laid out in a box of the scene's full-size proportions,
	   centred and as tall as the scene, so a capped scene height shrinks the box
	   and the heroes keep their places (Boomana's finding: sized off the
	   scene's width, they spilled over the card title). */
	.heroes {
		position: absolute;
		top: 0;
		bottom: 0;
		left: 50%;
		aspect-ratio: 16 / 12;
		transform: translateX(-50%);
		z-index: 3;
	}
	/* relics lifted off an altar: each floats on its own phase (--d) */
	.heroes img {
		position: absolute;
		width: var(--w);
		left: calc(50% + var(--x));
		top: var(--y);
		rotate: var(--r);
		filter: drop-shadow(0 8px 10px #000c);
		pointer-events: none;
		animation: float 2.8s ease-in-out infinite paused;
		animation-delay: var(--d);
	}
	@keyframes float {
		50% {
			translate: 0 -5%;
		}
	}
	.tag {
		position: absolute;
		left: 10px;
		top: 10px;
		z-index: 4;
		padding: 3px 9px;
		border-radius: 3px;
		font: 400 11px var(--gb-display-font, 'Titan One');
		letter-spacing: 1.5px;
		color: #1a0f05;
		background: var(--accent);
		box-shadow:
			0 0 0 1px #0008,
			inset 0 1px 0 #fff8;
	}
	/* a strip of collar inlay between the picture and the words */
	.inlay {
		height: 6px;
		background: repeating-linear-gradient(
			90deg,
			#35c4a8 0 10px,
			#1a0f05 10px 12px,
			#2f7fd0 12px 22px,
			#1a0f05 22px 24px,
			#d2452a 24px 34px,
			#1a0f05 34px 36px,
			#e8b44a 36px 46px,
			#1a0f05 46px 48px
		);
		border-top: 1px solid #e8b44a;
		border-bottom: 1px solid #e8b44a;
		opacity: 0.9;
	}

	.body {
		display: flex;
		flex: 1;
		flex-direction: column;
		padding: 8px 14px 14px;
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
		align-items: center;
		justify-content: center;
		gap: 4px;
		min-height: 34px;
		margin-bottom: 6px;
	}
	.pip {
		width: 30px;
		height: 30px;
		border-radius: 4px;
		filter: drop-shadow(0 2px 3px #000a);
	}
	/* the Scatters the round does NOT open on: the same tile, unlit */
	.pip.off {
		filter: grayscale(1) brightness(0.35);
		opacity: 0.8;
	}
	.coin {
		width: 26px;
		height: 26px;
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
		color: #dccdae;
	}
	/* an ankh for a bullet */
	li::before {
		content: '☥';
		margin-right: 7px;
		/* a symbol face on every platform, or it can come out as a missing-glyph box */
		font-family: 'Segoe UI Symbol', 'Apple Symbols', 'Noto Sans Symbols', 'DejaVu Sans', sans-serif;
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

	@media (prefers-reduced-motion: reduce) {
		.card,
		.rays,
		.heroes img,
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
			padding: 24px 20px 12px;
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
			padding: 16px 14px 10px;
		}
		/* the Popup's close button sits over this stud at this size */
		.menu::after {
			display: none;
		}
		.crest {
			width: 130px;
			height: 26px;
			margin-top: -10px;
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
			min-height: 24px;
		}
		.pip {
			width: 20px;
			height: 20px;
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
			padding: 4px 8px 8px;
		}
	}
	@media (max-width: 520px) {
		.menu {
			padding: 22px 10px 12px;
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
			padding: 6px 10px 10px;
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
			min-height: 26px;
		}
		.pip {
			width: 22px;
			height: 22px;
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
