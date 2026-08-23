<script lang="ts">
	import { stateBet, stateReplay, stateUrlDerived } from 'state-shared';
	import { API_AMOUNT_MULTIPLIER } from 'constants-shared/bet';
	import { zIndex } from 'constants-shared/zIndex';
	import { numberToCurrencyString } from 'utils-shared/amount';

	import { MODE_LABELS, SOUL_SEAL_BET_MODE_META } from '../../game/betModeMeta';

	// Replay start card.
	//
	// A replay used to begin the instant the data arrived, with nothing said about
	// what was being replayed. Certification asks that the cost, the multiplier and
	// the final amount are all visible before it runs, so the round is gated behind
	// this panel.
	//
	// It is shown ONCE, before the first run. Re-running is the bar's replay button
	// instead — a panel that covered the board every time the round ended got in
	// the way of watching it.
	//
	// Stake.us naming: "Base Bet" / "Cost Multiplier" / "Payout Multiplier" are
	// restricted in social play and become "Base Play" / "Feature Multiplier" /
	// "Final Multiplier".

	type Props = {
		onstart: () => void;
	};

	const props: Props = $props();

	const social = stateUrlDerived.social();

	const L = {
		badge: 'REPLAY',
		title: social ? 'Play Replay' : 'Bet Replay',
		mode: 'Mode',
		baseBet: social ? 'Base Play' : 'Base Bet',
		costMultiplier: social ? 'Feature Multiplier' : 'Cost Multiplier',
		// "Total Play Cost" would still carry the restricted word "cost"
		totalCost: social ? 'Total Play Amount' : 'Total Bet Cost',
		payoutMultiplier: social ? 'Final Multiplier' : 'Payout Multiplier',
		totalWin: 'Total Win',
		start: 'Start Replay',
		foot: social
			? 'This is a replay of a previous round. No plays will be placed.'
			: 'This is a replay of a previous bet round. No bets will be placed.',
	};

	// The mode label has to read the way the game itself names the mode. The raw
	// key and the buy-card caption ("BUY SEALING RITE") are both wrong here — one
	// is machine naming, the other is a call to action.
	//
	// Taken from game/betModeMeta rather than listed here. The list that used to
	// sit at this spot named three modes, two of which the maths never shipped,
	// and knew nothing about the two active modes or the 300x buy — so replaying
	// any of those three rounds captioned the card with the raw key.
	const modeKey = $derived(`${stateBet.activeBetModeKey || 'BASE'}`.toUpperCase());
	const modeLabel = $derived(MODE_LABELS[modeKey.toLowerCase()] ?? modeKey);
	const costMultiplier = $derived(SOUL_SEAL_BET_MODE_META[modeKey]?.costMultiplier ?? 1);

	// stateBet.betAmount is the base stake the replay was recorded at; the total
	// cost is that stake times the mode's cost multiplier.
	const baseBet = $derived(stateBet.betAmount);
	const totalCost = $derived(baseBet * costMultiplier);

	// stateReplay.round, not stateBet.betToResume — the latter is cleared the
	// moment the round starts, and this card is shown again afterwards.
	const round = $derived(
		stateReplay.round as unknown as { payoutMultiplier?: number; payout?: number } | null,
	);
	const payoutMultiplier = $derived(round?.payoutMultiplier ?? 0);
	// `payout` is authoritative and comes back in API units. The multiplier is the
	// fallback: like every book amount it is quoted against the base stake, not
	// against the total cost.
	const totalWin = $derived(
		typeof round?.payout === 'number'
			? round.payout / API_AMOUNT_MULTIPLIER
			: baseBet * payoutMultiplier,
	);

	const fmtMult = (value: number) => `${Number(value.toFixed(4))}x`;
</script>

<!-- above the paytable/info layer: the round must not start behind an open panel -->
<div class="replay-backdrop" style:z-index={zIndex.info + 10}>
	<div class="replay-card">
		<span class="replay-badge">{L.badge}</span>
		<h2>{L.title}</h2>

		<dl class="replay-rows">
			<div class="row">
				<dt>{L.mode}</dt>
				<dd class="accent">{modeLabel}</dd>
			</div>

			<div class="row spacer">
				<dt>{L.baseBet}</dt>
				<dd class="accent">{numberToCurrencyString(baseBet)}</dd>
			</div>
			<div class="row">
				<dt>{L.costMultiplier}</dt>
				<dd class="accent">{fmtMult(costMultiplier)}</dd>
			</div>
			<div class="row highlight">
				<dt>{L.totalCost}</dt>
				<dd class="accent big">{numberToCurrencyString(totalCost)}</dd>
			</div>

			<div class="row spacer">
				<dt>{L.payoutMultiplier}</dt>
				<dd class="win">{fmtMult(payoutMultiplier)}</dd>
			</div>
			<div class="row highlight">
				<dt>{L.totalWin}</dt>
				<dd class="win big">{numberToCurrencyString(totalWin)}</dd>
			</div>
		</dl>

		<button class="replay-start" onclick={props.onstart}>
			▶ {L.start}
		</button>

		<p class="replay-foot">{L.foot}</p>
	</div>
</div>

<style lang="scss">
	.replay-backdrop {
		position: fixed;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 1rem;
		background: rgba(6, 10, 4, 0.82);
		backdrop-filter: blur(8px);
		-webkit-backdrop-filter: blur(8px);
		overflow-y: auto;
	}

	.replay-card {
		width: min(24rem, 100%);
		max-height: 100%;
		overflow-y: auto;
		box-sizing: border-box;
		padding: 1.25rem;
		border-radius: 14px;
		background: linear-gradient(180deg, rgba(26, 36, 12, 0.98) 0%, rgba(10, 18, 6, 0.99) 100%);
		border: 1px solid rgba(216, 163, 52, 0.35);
		box-shadow: 0 14px 44px rgba(0, 0, 0, 0.8);
		color: #fff;
		font-family: var(--gb-body-font, sans-serif);
		text-align: center;
	}

	.replay-badge {
		display: inline-block;
		padding: 0.2rem 0.7rem;
		border-radius: 999px;
		background: #ffd75e;
		color: #2a1a04;
		font-weight: 800;
		font-size: 0.7rem;
		letter-spacing: 0.08em;
	}

	h2 {
		margin: 0.55rem 0 1rem;
		font-family: var(--gb-display-font, sans-serif);
		font-weight: 400;
		font-size: 1.5rem;
	}

	.replay-rows {
		margin: 0;
		padding: 0.85rem;
		border-radius: 10px;
		background: rgba(0, 0, 0, 0.35);
		border: 1px solid rgba(255, 255, 255, 0.05);
		text-align: left;
	}

	.row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		padding: 0.32rem 0;
		font-size: 0.85rem;
	}

	/* a blank line between the cost group and the win group, so the two read as
	   separate halves rather than one long list */
	.row.spacer {
		margin-top: 0.7rem;
	}

	.row.highlight {
		margin-top: 0.15rem;
		padding: 0.45rem 0.55rem;
		border-radius: 8px;
		background: rgba(255, 215, 94, 0.07);
	}

	dt {
		opacity: 0.75;
	}

	dd {
		margin: 0;
		font-weight: 700;
	}

	.accent {
		color: #ffd75e;
	}
	.win {
		color: #9ee27a;
	}
	.big {
		font-size: 1.05rem;
	}

	.replay-start {
		display: block;
		width: 100%;
		margin-top: 1rem;
		padding: 0.8rem 1rem;
		border: none;
		border-radius: 10px;
		background: linear-gradient(180deg, #ffe98a 0%, #e0a838 100%);
		color: #2a1a04;
		font-family: var(--gb-display-font, sans-serif);
		font-size: 1.05rem;
		font-weight: 700;
		cursor: pointer;
		transition: filter 0.2s ease, transform 0.1s ease;
	}

	.replay-start:hover {
		filter: brightness(1.08);
	}
	.replay-start:active {
		transform: scale(0.985);
	}

	.replay-foot {
		margin: 0.7rem 0 0;
		font-size: 0.7rem;
		opacity: 0.6;
	}
</style>
