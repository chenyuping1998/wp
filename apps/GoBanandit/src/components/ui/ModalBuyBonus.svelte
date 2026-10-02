<script lang="ts">
	/**
	 * The feature-buy menu, Go Banandit's own (DeadwoodExpress's layout): one
	 * card per buy, each with its screenprint card art, a title, what it does,
	 * the price in big figures and one full-width button.
	 *
	 * Replaces the shared ModalBuyBonus, whose cards are text over a flat
	 * panel — the only free-text comment a sibling game's review left was "Bonus
	 * buy menu is too simple". Kept in this app rather than in
	 * components-ui-html: the look is this game's, not the library's.
	 *
	 * The two tiers are told apart at a glance by the Bandit meter under the
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

	const art = (file: string) => `${base}/assets/sprites/${file}`;
	import config from '../../game/config';

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
		/** the row under the title: the Bandit meter's first rung */
		meter: { on: number; of: number; label: string };
		points: string[];
		hot?: boolean;
	};

	const meter = config.banditMeter as { thresholds: number[]; spinsAdded: number; mults: number[] };
	const firstRung = meter.thresholds[0];
	const spins = (key: 'bonus' | 'superbonus') => (config.betModes[key] as { spins?: number }).spins;
	const SACK = art('bananditSymbols/p.png');
	const CARDS: Record<string, Card> = {
		BONUS: {
			title: 'FREE SPINS',
			accent: '#1f5c4a',
			tag: 'FREE SPINS',
			scene: art('bananditBackground/bg_base.png'),
			focus: '60% 70%',
			heroes: [{ src: SACK, w: 56, x: -28, y: 14 }],
			meter: { on: 0, of: firstRung, label: 'BANDIT METER STARTS EMPTY' },
			points: [`${spins('bonus')} free spins`, `Every ${firstRung} Bandits: +${meter.spinsAdded} spins, bigger collections`],
		},
		SUPERBONUS: {
			title: 'SUPER FREE SPINS',
			accent: '#d24a2c',
			tag: 'SUPER',
			scene: art('bananditBackground/bg_feature.png'),
			focus: '50% 60%',
			heroes: [
				{ src: SACK, w: 50, x: -47, y: 20, r: -12 },
				{ src: SACK, w: 50, x: -3, y: 16, r: 10 },
			],
			meter: { on: firstRung, of: firstRung, label: `COLLECTIONS START AT ×${meter.mults[1]}` },
			points: [`${spins('superbonus')} free spins`, `Bandit meter opens at ${firstRung}`],
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

<!-- One Bandit pip of the meter: flat ink, like the in-game ticket. -->
{#snippet pip(lit: boolean)}
	<svg class="stick" viewBox="0 0 28 28" aria-hidden="true">
		<circle cx="15.5" cy="15.5" r="10" fill="#1e1b1a" />
		<circle cx="13" cy="13" r="10" fill={lit ? '#d24a2c' : '#f2e8d0'} stroke="#1e1b1a" stroke-width="2.5" />
	</svg>
{/snippet}

{#if stateModal.modal?.name === 'buyBonus'}
	<Popup zIndex={zIndex.modal} onclose={close}>
		<div class="menu">
			<!-- title and amount on one row: a second row of header cost the menu its
			     fit on a 720px-tall screen -->
			<div class="head">
				<div class="titles">
					<h2 style="color: #1e1b1a !important">{social ? 'FEATURES' : 'BUY FEATURE'}</h2>
					<div class="sub">CHOOSE YOUR JOB</div>
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
								<button class="buy" onclick={() => choose(mode.mode)}>
									{mode.text.button}
									<span>{numberToCurrencyString(stateBet.betAmount * mode.costMultiplier)}</span>
								</button>
							</div>
						</section>
					{/if}
				{/each}
			</div>
			<div class="foot">All features play at 96% RTP · Max win 10,000×</div>
		</div>
	</Popup>
{/if}

<style>
	.menu {
		--paper: #f2e8d0;
		--green: #1f5c4a;
		--red: #d24a2c;
		--ink: #1e1b1a;
		position: relative;
		z-index: 3;
		width: min(900px, calc(100vw - 24px));
		max-height: calc(100vh - 20px);
		overflow: auto;
		box-sizing: border-box;
		padding: 20px;
		background: var(--paper);
		border: 6px solid var(--green);
		color: var(--ink);
		font-family: var(--gb-body-font), Arial, sans-serif;
		text-align: center;
	}
	.head { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 12px; }
	.menu h2 { color: var(--ink) !important; }
	h2 { margin: 0; font: 400 30px var(--gb-display-font, sans-serif); letter-spacing: 2px; }
	.sub { color: var(--green); font-size: 13px; font-weight: 800; letter-spacing: 2px; }
	.cards { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; margin-top: 16px; }
	.card { --accent: var(--green); display: flex; flex-direction: column; min-width: 0; overflow: hidden; background: var(--paper); border: 4px solid var(--accent); }
	.card.hot { border-color: var(--red); }
	.scene { position: relative; height: 160px; overflow: hidden; background-size: cover; background-position: center; border-bottom: 4px solid var(--accent); }
	.light { display: none; }
	.heroes { position: absolute; inset: 0; }
	.heroes img { position: absolute; width: var(--w); left: calc(50% + var(--x)); top: var(--y); transform: rotate(var(--r)); pointer-events: none; }
	.tag { position: absolute; top: 10px; left: 10px; padding: 4px 9px; background: var(--paper); color: var(--ink); font: 400 11px var(--gb-display-font, sans-serif); letter-spacing: 1px; }
	.body { display: flex; flex: 1; flex-direction: column; padding: 12px; background: var(--paper); }
	.menu h3 { color: var(--accent) !important; }
	h3 { margin: 0 0 7px; font: 400 19px var(--gb-display-font, sans-serif); letter-spacing: 1px; }
	.meter { display: flex; align-items: center; justify-content: center; gap: 4px; min-height: 28px; }
	.stick { width: 21px; height: 28px; }
	.meterlabel { margin-bottom: 7px; color: var(--green); font-size: 11px; font-weight: 800; letter-spacing: 1px; }
	ul { margin: 0 0 8px; padding: 0; list-style: none; text-align: center; font-size: 13px; line-height: 1.4; }
	li::before { content: '◆'; margin-right: 6px; color: var(--accent); font-size: 8px; }
	.cost { margin-top: auto; color: var(--accent); font: 400 40px var(--gb-display-font, sans-serif); }
	.cost small { font-size: 23px; }
	.buy { margin-top: 8px; padding: 10px 8px; border: 0; background: var(--accent); color: var(--paper); cursor: pointer; font: 400 15px var(--gb-display-font, sans-serif); letter-spacing: 1px; }
	.buy:hover, .buy:focus-visible { outline: 3px solid var(--ink); outline-offset: 2px; }
	.buy:active { transform: translate(2px, 2px); }
	.buy span { display: block; margin-top: 2px; font: 700 12px var(--gb-body-font, sans-serif); }
	.foot { margin-top: 12px; color: var(--green); font-size: 12px; font-weight: 700; }
	@media (max-height: 700px) { .menu { padding: 12px; } .cards { margin-top: 8px; } .scene { height: 95px; } ul { display: none; } .cost { font-size: 28px; } .foot { display: none; } }
	@media (max-width: 520px) { .menu { padding: 10px; } h2 { font-size: 22px; } .sub { display: none; } .cards { gap: 8px; } .scene { height: 85px; } .body { padding: 6px; } h3 { font-size: 14px; } .meterlabel { font-size: 9px; } .buy { padding: 7px 4px; font-size: 12px; } }
</style>
