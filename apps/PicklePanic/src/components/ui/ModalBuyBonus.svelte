<script lang="ts">
	/**
	 * The feature-buy menu, Pickle Panic's own (DeadwoodExpress's layout): one
	 * card per buy, each with its screenprint card art, a title, what it does,
	 * the price in big figures and one full-width button.
	 *
	 * Replaces the shared ModalBuyBonus, whose cards are text over a flat
	 * panel — the only free-text comment a sibling game's review left was "Bonus
	 * buy menu is too simple". Kept in this app rather than in
	 * components-ui-html: the look is this game's, not the library's.
	 *
	 * The two tiers are told apart at a glance by the Cook meter under the
	 * title: SUPERBONUS opens with its first rung already filled, so every
	 * collection starts at the first multiplier (buy_start_meter, game_config.py).
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

	const { eventEmitter } = getContextEventEmitter<EmitterEventModal>();

	const art = (file: string) => `${base}/assets/pickle/${file}`;
	import config from '../../game/config';
	import { MODE_NAMES } from '../../game/betModeMeta';

	// label: runtime type on a jar's blank label (values are never baked into
	// the art; a blank cream box read as an unfinished asset, review 10-17)
	type Hero = { src: string; w: number; x: number; y: number; r?: number; label?: string };
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
		/** the row under the title: the Cook meter's first rung */
		meter: { on: number; of: number; label: string };
		points: string[];
		hot?: boolean;
	};

	const meter = config.banditMeter as { thresholds: number[]; spinsAdded: number; mults: number[] };
	const firstRung = meter.thresholds[0];
	const spins = (key: 'bonus' | 'superbonus') => (config.betModes[key] as { spins?: number }).spins;
	const PLATE = art('p.png');
	const CARDS: Record<string, Card> = {
		BONUS: {
			title: MODE_NAMES.BONUS.toUpperCase(),
			accent: '#31572c',
			tag: 'FREE SPINS',
			scene: art('bg_base.webp'),
			focus: '60% 70%',
			// Who runs this round, then what it pays out of. The scene used to be a
			// background crop with one jar cut off at its middle (review 2026-10-13).
			heroes: [
				{ src: art('buy_boss.png'), w: 34, x: -46, y: 4 },
				{ src: PLATE, w: 42, x: 4, y: 12, label: 'JAR' },
			],
			meter: { on: 0, of: firstRung, label: 'COOK METER STARTS EMPTY' },
			points: [`${spins('bonus')} free spins`, `${meter.thresholds.join(' / ')} Cooks: +${meter.spinsAdded} spins; 10 / J / Q become Jars`],
		},
		SUPERBONUS: {
			title: MODE_NAMES.SUPERBONUS.toUpperCase(),
			accent: '#c84a36',
			tag: 'SUPER',
			scene: art('bg_feature.webp'),
			focus: '50% 60%',
			heroes: [
				{ src: art('buy_chef.png'), w: 33, x: -46, y: 4 },
				{ src: PLATE, w: 34, x: -6, y: 20, r: -10, label: 'JAR' },
				{ src: PLATE, w: 34, x: 18, y: 14, r: 8, label: 'JAR' },
			],
			meter: { on: firstRung, of: firstRung, label: 'ALL 10 SYMBOLS START AS JARS' },
			points: [`${spins('superbonus')} free spins`, `Cook meter opens at ${firstRung}`],
			hot: true,
		},
	};

	const modes = $derived(stateMetaDerived.betModeMetaList().filter((m) => m.type === 'buy'));
	// social play: no betting words anywhere the player can read
	const social = $derived(stateUrlDerived.social());

	const close = () => (stateModal.modal = null);
	// Stake review 2026-10-15 (Go Banandit): a feature the balance cannot cover is
	// greyed out and cannot be chosen — it never reaches the confirm step or a play request.
	const affordable = (costMultiplier: number) =>
		stateBet.betAmount > 0 && stateBet.betAmount * costMultiplier <= stateBet.balanceAmount;

	const choose = (mode: string) => {
		stateBonus.selectedBetModeKey = mode;
		eventEmitter.broadcast({ type: 'buyBonusConfirm' });
	};
</script>

<!-- One Cook pip of the meter: flat ink, like the in-game ticket. -->
{#snippet pip(lit: boolean)}
	<svg class="stick" viewBox="0 0 28 28" aria-hidden="true">
		<circle cx="15.5" cy="15.5" r="10" fill="#171c1a" />
		<circle cx="13" cy="13" r="10" fill={lit ? '#c45240' : '#f5e6be'} stroke="#171c1a" stroke-width="2.5" />
	</svg>
{/snippet}

{#if stateModal.modal?.name === 'buyBonus'}
	<Popup zIndex={zIndex.modal} onclose={close}>
		<div class="menu">
			<!-- title and amount on one row: a second row of header cost the menu its
			     fit on a 720px-tall screen -->
			<div class="head">
				<div class="titles">
					<h2 style="color: #20231d !important">{social ? 'FEATURES' : 'BUY FEATURE'}</h2>
					<div class="sub">CHOOSE YOUR MENU</div>
				</div>
				<div class="amount"><BetMenuAmountToggle /></div>
			</div>

			<div class="cards">
				{#each modes as mode (mode.mode)}
					{@const card = CARDS[mode.mode]}
					{#if card}
						{@const ok = affordable(mode.costMultiplier)}
						<section class="card" class:hot={card.hot} class:poor={!ok} style:--accent={card.accent}>
							<div class="scene" style:background-image={`url('${card.scene}')`} style:background-position={card.focus ?? 'center'}>
								<div class="light"></div>
								<div class="heroes">
									{#each card.heroes as h, i (i)}
										<div
											class="hero"
											style:--w={`${h.w}%`}
											style:--x={`${h.x}%`}
											style:--y={`${h.y}%`}
											style:--r={`${h.r ?? 0}deg`}
										>
											<img src={h.src} alt="" />
											{#if h.label}<span class="jarlabel">{h.label}</span>{/if}
										</div>
									{/each}
								</div>
								<span class="tag">{card.tag}</span>
							</div>
							<div class="body">
								<h3 style={`color: ${card.accent} !important`}>{card.title}</h3>
								<div class="meter">
									{#each { length: card.meter.of } as _, i (i)}
										{@render pip(i < card.meter.on)}
									{/each}
								</div>
								<div class="meterlabel">{card.meter.label}</div>
								<ul>
									{#each card.points as p (p)}<li>{p}</li>{/each}
								</ul>
								<div class="cost">{mode.costMultiplier}<small>×</small></div>
								<button class="buy" disabled={!ok} aria-disabled={!ok} onclick={() => ok && choose(mode.mode)}>
									{ok ? mode.text.button : 'INSUFFICIENT BALANCE'}
									<span>{numberToCurrencyString(stateBet.betAmount * mode.costMultiplier)}</span>
								</button>
							</div>
						</section>
					{/if}
				{/each}
			</div>
			<div class="foot">RTP: {MODE_NAMES.BONUS} {(config.betModes.bonus.rtp * 100).toFixed(2)}% · {MODE_NAMES.SUPERBONUS} {(config.betModes.superbonus.rtp * 100).toFixed(2)}% · Max win {(config.betModes.base.max_win ?? 10000).toLocaleString()}×</div>
		</div>
	</Popup>
{/if}

<style>
	/* Review 2026-10-17 ("Low quality assets / Inconsistent art style"): the menu
	   was a flat web panel — thin single-colour borders, grey buttons, sans body
	   copy. It now uses the game's own print language: paper #FFF0CF, a fat ink
	   outline with an offset ink shadow (the symbols' drop), cards set slightly
	   askew like order tickets, and ink-outlined buttons in the palette's
	   mustard / tomato that warm up on hover instead of greying. */
	.menu {
		--paper: #fff0cf;
		--green: #31572c;
		--red: #c84a36;
		--mustard: #e9b83e;
		--ink: #20231d;
		position: relative;
		z-index: 3;
		width: min(900px, calc(100vw - 24px));
		max-height: calc(100vh - 20px);
		overflow: auto;
		box-sizing: border-box;
		padding: 20px 22px;
		background: var(--paper);
		border: 6px solid var(--ink);
		border-radius: 10px 14px 9px 16px;
		box-shadow: 10px 10px 0 var(--ink);
		color: var(--ink);
		font-family: var(--gb-display-font, sans-serif);
		text-align: center;
	}
	.head { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 12px; }
	.menu h2 { color: var(--ink) !important; }
	h2 { margin: 0; font: 400 32px var(--gb-display-font, sans-serif); letter-spacing: 2px; text-shadow: 3px 3px 0 var(--mustard); }
	.sub { color: var(--green); font: 400 13px var(--gb-display-font, sans-serif); letter-spacing: 2px; }
	.cards { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 22px; margin-top: 16px; padding: 0 6px 8px 0; }
	.card { --accent: var(--green); display: flex; flex-direction: column; min-width: 0; overflow: hidden; background: var(--paper); border: 5px solid var(--ink); border-radius: 8px; box-shadow: 7px 7px 0 var(--ink); transform: rotate(-0.7deg); }
	.card.hot { transform: rotate(0.8deg); }
	.scene { position: relative; height: 160px; overflow: hidden; background-size: cover; background-position: center; border-bottom: 5px solid var(--ink); }
	.light { display: none; }
	.heroes { position: absolute; inset: 0; }
	.hero { position: absolute; width: var(--w); left: calc(50% + var(--x)); top: var(--y); transform: rotate(var(--r)); pointer-events: none; }
	.hero img { display: block; width: 100%; filter: drop-shadow(4px 4px 0 rgba(32, 35, 29, 0.85)); }
	.jarlabel { position: absolute; left: 50%; top: 61%; transform: translate(-50%, -50%) rotate(-3deg); color: var(--ink); font: 400 clamp(9px, 1.6vw, 15px) var(--gb-display-font, sans-serif); letter-spacing: 1px; }
	.tag { position: absolute; top: 10px; left: 10px; padding: 4px 10px; background: var(--accent); color: var(--paper); border: 3px solid var(--ink); border-radius: 4px; box-shadow: 3px 3px 0 var(--ink); transform: rotate(-4deg); font: 400 12px var(--gb-display-font, sans-serif); letter-spacing: 1px; }
	.body { display: flex; flex: 1; flex-direction: column; padding: 12px; background: var(--paper); }
	.menu h3 { color: var(--accent) !important; }
	h3 { margin: 0 0 7px; font: 400 21px var(--gb-display-font, sans-serif); letter-spacing: 1px; }
	.meter { display: flex; align-items: center; justify-content: center; gap: 4px; min-height: 28px; }
	.stick { width: 21px; height: 28px; }
	.meterlabel { margin-bottom: 7px; color: var(--green); font: 400 11px var(--gb-display-font, sans-serif); letter-spacing: 1px; }
	ul { margin: 0 0 8px; padding: 0; list-style: none; text-align: center; font: 600 13px var(--gb-body-font, sans-serif); line-height: 1.4; }
	li::before { content: ''; display: inline-block; width: 7px; height: 7px; margin: 0 7px 1px 0; background: var(--accent); border: 2px solid var(--ink); transform: rotate(45deg); }
	.cost { margin-top: auto; color: var(--accent); font: 400 44px var(--gb-display-font, sans-serif); text-shadow: 3px 3px 0 var(--ink); }
	.cost small { font-size: 24px; }
	.buy { margin: 10px 6px 6px 0; padding: 10px 8px; border: 4px solid var(--ink); border-radius: 6px; background: var(--accent); color: var(--paper); box-shadow: 5px 5px 0 var(--ink); cursor: pointer; font: 400 16px var(--gb-display-font, sans-serif); letter-spacing: 1px; transition: transform 90ms ease-out, box-shadow 90ms ease-out; }
	.card:not(.hot) .buy { background: var(--mustard); color: var(--ink); }
	.buy:hover, .buy:focus-visible { outline: none; transform: translate(-2px, -2px); box-shadow: 7px 7px 0 var(--ink); filter: saturate(1.15) brightness(1.08); }
	.buy:active { transform: translate(4px, 4px); box-shadow: 1px 1px 0 var(--ink); }
	.card.poor .scene, .card.poor .meter, .card.poor .cost { filter: grayscale(1); opacity: 0.5; }
	.buy:disabled, .card:not(.hot) .buy:disabled { background: #b9ae95; color: #f4ead2; cursor: not-allowed; transform: none; box-shadow: 5px 5px 0 var(--ink); filter: none; }
	.buy span { display: block; margin-top: 2px; font: 700 12px var(--gb-body-font, sans-serif); }
	.foot { margin-top: 12px; color: var(--green); font: 600 12px var(--gb-body-font, sans-serif); }
	@media (max-height: 700px) { .menu { padding: 12px; } .cards { margin-top: 8px; } .scene { height: 95px; } ul { display: none; } .cost { font-size: 28px; } .foot { display: none; } }
	/* Popout S (400x225): the buy buttons must show without scrolling, so the
	   scene art and pips give way to name, difference, cost and button. */
	@media (max-height: 360px) { .menu { padding: 6px 8px; border-width: 4px; overflow: hidden; box-shadow: 5px 5px 0 var(--ink); } .head { gap: 6px; } h2 { font-size: 22px; } .cards { margin-top: 4px; gap: 10px; padding: 0 4px 4px 0; } .card { border-width: 3px; box-shadow: 3px 3px 0 var(--ink); transform: none; } .scene, .meter { display: none; } .body { padding: 5px 6px; } h3 { margin-bottom: 2px; } .meterlabel { margin-bottom: 2px; } .cost { font-size: 22px; text-shadow: 2px 2px 0 var(--ink); } .cost small { font-size: 14px; } .buy { margin: 4px 3px 3px 0; padding: 5px 4px; border-width: 3px; box-shadow: 3px 3px 0 var(--ink); } }
	@media (max-width: 520px) { .menu { padding: 10px; box-shadow: 6px 6px 0 var(--ink); } h2 { font-size: 22px; } .sub { display: none; } .cards { gap: 10px; } .card { border-width: 3px; box-shadow: 4px 4px 0 var(--ink); } .scene { height: 85px; } .body { padding: 6px; } h3 { font-size: 14px; } .meterlabel { font-size: 9px; } .buy { padding: 7px 4px; font-size: 12px; border-width: 3px; box-shadow: 3px 3px 0 var(--ink); } }
</style>
