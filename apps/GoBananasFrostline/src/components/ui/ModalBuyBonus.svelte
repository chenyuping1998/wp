<script lang="ts">
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
	const symbol = (name: string) => `${base}/assets/sprites/goBananasSymbolsV3/${name}.png`;
	const scene = `${base}/assets/sprites/goBananasBackground/bg_feature.png`;

	type Card = {
		title: string;
		tag: string;
		accent: string;
		columns: 3 | 5;
		cells: string[];
		metric: string;
		points: string[];
	};

	const CARDS: Record<string, Card> = {
		SUPERSPIN: {
			title: 'SUPER SPIN',
			tag: 'HOLD & SPIN',
			accent: '#78d8f2',
			columns: 3,
			cells: ['p', 'x', 'p', 'x', 'p', 'x', 'p', 'x', 'p'],
			metric: '3 RESPINS',
			points: ['Coins stay on the grid', 'Each new Coin resets the count'],
		},
		BONUS: {
			title: 'FREE SPINS',
			tag: 'STICKY WILD',
			accent: '#f4c66f',
			columns: 5,
			cells: Array.from({ length: 25 }, (_, i) => i % 5 === 2 ? 'w' : 'x'),
			metric: 'EXPANDING WILD',
			points: ['Wilds fill and stay on a reel', 'Multipliers grow up to 100×'],
		},
		SUPERBONUS: {
			title: 'SUPER FREE SPINS',
			tag: '5 SCATTERS',
			accent: '#a7afff',
			columns: 5,
			cells: Array.from({ length: 25 }, (_, i) => [1, 7, 13, 19, 20].includes(i) ? 's' : 'x'),
			metric: '18 FREE SPINS',
			points: ['Guaranteed 5-Scatter start', 'Wilds grow faster and land more often'],
		},
	};

	const modes = $derived(
		stateMetaDerived.betModeMetaList()
			.filter((mode) => mode.type === 'buy')
			.sort((a, b) => a.costMultiplier - b.costMultiplier),
	);
	const social = $derived(stateUrlDerived.social());
	const close = () => (stateModal.modal = null);
	const choose = (mode: string) => {
		stateBonus.selectedBetModeKey = mode;
		eventEmitter.broadcast({ type: 'buyBonusConfirm' });
	};
</script>

{#if stateModal.modal?.name === 'buyBonus'}
	<Popup zIndex={zIndex.modal} onclose={close}>
		<div class="frost-buy-menu">
			<header class="head">
				<div>
					<h2>{social ? 'FEATURES' : 'BUY FEATURE'}</h2>
					<p>CHOOSE YOUR FROSTLINE FEATURE</p>
				</div>
				<div class="amount"><BetMenuAmountToggle /></div>
			</header>

			<div class="cards">
				{#each modes as mode (mode.mode)}
					{@const card = CARDS[mode.mode]}
					{#if card}
						<section class="card" style:--accent={card.accent}>
							<div class="scene" style:background-image={`linear-gradient(180deg, #06142466, #07121dd9), url('${scene}')`}>
								<span class="tag">{card.tag}</span>
								<div class="board" class:three={card.columns === 3} style:--columns={card.columns} aria-hidden="true">
									{#each card.cells as cell, i (i)}
										<img src={symbol(cell)} alt="" />
									{/each}
								</div>
							</div>
							<div class="body">
								<h3>{card.title}</h3>
								<div class="metric">{card.metric}</div>
								<ul>
									{#each card.points as point (point)}<li>{point}</li>{/each}
									{#if mode.maxWin}<li>Max win {mode.maxWin.toLocaleString()}×</li>{/if}
								</ul>
								<div class="price">{mode.costMultiplier}<small>×</small></div>
								<button onclick={() => choose(mode.mode)}>
									{mode.text.button}
									<span>{numberToCurrencyString(stateBet.betAmount * mode.costMultiplier)}</span>
								</button>
							</div>
						</section>
					{/if}
				{/each}
			</div>
			<footer>All features play at {(config.rtp * 100).toFixed(0)}% RTP</footer>
		</div>
	</Popup>
{/if}

<style>
	.frost-buy-menu {
		position: relative;
		z-index: 3;
		width: min(940px, calc(100dvw - 16px));
		max-height: calc(100dvh - 16px);
		overflow: auto;
		box-sizing: border-box;
		padding: 22px;
		border: 2px solid #87bad3;
		border-radius: 14px;
		background: linear-gradient(160deg, #122839, #091723 72%);
		box-shadow: 0 0 0 4px #020a11aa, 0 22px 60px #000b, inset 0 0 35px #8edaff13;
		color: #eef8ff;
		text-align: center;
		font-family: 'Segoe UI', Arial, sans-serif;
	}
	.head {
		display: flex;
		align-items: center;
		justify-content: center;
		flex-wrap: wrap;
		gap: 8px 28px;
	}
	h2 {
		margin: 0;
		font: 400 30px var(--gb-display-font, 'Titan One');
		letter-spacing: 2px;
		color: #def5ff !important;
		text-shadow: 0 3px 0 #123b58, 0 0 18px #60c9ff88;
	}
	.head p {
		margin: 3px 0 0;
		font-size: 12px;
		letter-spacing: 2px;
		color: #9bb8ca;
	}
	.amount { display: flex; justify-content: center; }
	.cards {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 14px;
		margin-top: 18px;
	}
	.card {
		--glow: color-mix(in srgb, var(--accent) 45%, transparent);
		display: grid;
		grid-template-rows: 185px minmax(0, 1fr);
		min-width: 0;
		overflow: hidden;
		border: 2px solid color-mix(in srgb, var(--accent) 70%, #102839);
		border-radius: 11px;
		background: linear-gradient(180deg, #173347, #0c1c2a);
		box-shadow: 0 8px 22px #0008;
		transition: transform .18s ease, box-shadow .18s ease;
	}
	@media (hover: hover) {
		.card:hover { transform: translateY(-5px); box-shadow: 0 12px 25px #000a, 0 0 19px var(--glow); }
	}
	.scene {
		position: relative;
		display: grid;
		place-items: center;
		background-size: cover;
		background-position: center;
	}
	.scene::after {
		content: '';
		position: absolute;
		inset: 55% 0 0;
		background: linear-gradient(transparent, #173347);
		pointer-events: none;
	}
	.tag {
		position: absolute;
		top: 10px;
		left: 10px;
		z-index: 1;
		padding: 4px 9px;
		border-radius: 14px;
		background: var(--accent);
		color: #0c2232;
		font: 400 10px var(--gb-display-font, 'Titan One');
		letter-spacing: 1px;
	}
	.board {
		display: grid;
		grid-template-columns: repeat(var(--columns), minmax(0, 1fr));
		grid-template-rows: repeat(var(--columns), minmax(0, 1fr));
		gap: 2px;
		width: 148px;
		aspect-ratio: 1;
		padding: 5px;
		border: 2px solid color-mix(in srgb, var(--accent) 65%, #102b42);
		border-radius: 8px;
		background: #061b2ce8;
		box-shadow: 0 8px 22px #000b, 0 0 24px var(--glow);
		transform: perspective(450px) rotateX(5deg);
	}
	.board img { display: block; width: 100%; height: 100%; min-width: 0; min-height: 0; object-fit: contain; }
	.board.three { width: 148px; }
	.body {
		display: grid;
		grid-template-rows: 44px 30px minmax(76px, 1fr) auto auto;
		padding: 6px 14px 14px;
	}
	h3 {
		display: grid;
		place-items: center;
		margin: 0;
		font: 400 19px/1.1 var(--gb-display-font, 'Titan One');
		letter-spacing: .5px;
		color: var(--accent) !important;
		text-shadow: 0 2px 0 #000;
	}
	.metric {
		align-self: center;
		padding: 5px 8px;
		border-top: 1px solid color-mix(in srgb, var(--accent) 60%, transparent);
		border-bottom: 1px solid color-mix(in srgb, var(--accent) 60%, transparent);
		color: #d7edf9;
		font-size: 11px;
		font-weight: 700;
		letter-spacing: 1.3px;
	}
	ul {
		margin: 9px 0 5px;
		padding: 0;
		list-style: none;
		text-align: left;
		color: #cbdee9;
		font-size: 13px;
		line-height: 1.55;
	}
	li::before { content: '◆'; margin-right: 7px; color: var(--accent); font-size: 9px; }
	.price {
		font: 400 42px var(--gb-display-font, 'Titan One');
		color: var(--accent);
		text-shadow: 0 3px 0 #000, 0 0 15px var(--glow);
	}
	.price small { margin-left: 2px; font: 700 24px 'Segoe UI', Arial, sans-serif; }
	button {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 8px;
		margin-top: 8px;
		padding: 11px 12px;
		border: 0;
		border-radius: 8px;
		background: linear-gradient(180deg, color-mix(in srgb, var(--accent) 80%, #fff), var(--accent) 60%, color-mix(in srgb, var(--accent) 70%, #000));
		box-shadow: 0 3px 0 color-mix(in srgb, var(--accent) 40%, #000), inset 0 1px 0 #fff8;
		color: #09202e;
		font: 400 14px var(--gb-display-font, 'Titan One');
		cursor: pointer;
	}
	button span { white-space: nowrap; font: 700 14px 'Segoe UI', Arial, sans-serif; }
	button:focus-visible { outline: 3px solid #fff; outline-offset: 3px; }
	footer { margin-top: 14px; color: #92afc0; font-size: 11px; letter-spacing: 1px; }
	@media (max-width: 720px) {
		.frost-buy-menu { padding: 16px; }
		.cards { grid-template-columns: 1fr; max-width: 390px; margin-inline: auto; }
		.card { grid-template-columns: 128px minmax(0, 1fr); grid-template-rows: auto; }
		.board, .board.three { width: 106px; }
		.scene { min-height: 205px; }
		.body { grid-template-rows: auto auto minmax(0, 1fr) auto auto; padding: 8px; }
		h3 { min-height: 34px; font-size: 15px; }
		ul { font-size: 11px; }
		.price { font-size: 28px; }
		.price small { font-size: 18px; }
		button { font-size: 11px; padding: 8px; }
		button span { font-size: 11px; }
	}
	@media (max-width: 360px) {
		.card { grid-template-columns: 100px minmax(0, 1fr); }
		.board, .board.three { width: 84px; padding: 3px; }
		.tag { left: 5px; font-size: 8px; }
	}
	@media (max-height: 580px) and (min-width: 721px) {
		.frost-buy-menu { padding: 12px 18px; }
		.cards { margin-top: 10px; }
		.card { grid-template-rows: 135px minmax(0, 1fr); }
		.board, .board.three { width: 110px; }
		.body { grid-template-rows: 32px 26px minmax(48px, 1fr) auto auto; padding: 4px 10px 10px; }
		h3 { font-size: 16px; }
		ul { font-size: 11px; margin: 5px 0; }
		.price { font-size: 30px; }
	}
	@media (prefers-reduced-motion: reduce) { .card { transition: none; } }
</style>
