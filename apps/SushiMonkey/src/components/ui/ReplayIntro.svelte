<script lang="ts">
	import { stateBet, stateReplay, stateUrlDerived } from 'state-shared';
	import { API_AMOUNT_MULTIPLIER } from 'constants-shared/bet';
	import { zIndex } from 'constants-shared/zIndex';
	import { numberToCurrencyString } from 'utils-shared/amount';

	import { SUSHI_MONKEY_BET_MODE_META } from '../../game/betModeMeta';

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
	// key ("SUPERSPIN") and the buy-card caption ("BUY FREE SPINS") are both wrong
	// here — one is machine naming, the other is a call to action.
	const MODE_LABELS: Record<string, string> = {
		BASE: 'Base Game',
		BONUS: 'Free Spins',
		SUPERBONUS: 'Super Free Spins',
	};

	const modeKey = $derived(`${stateBet.activeBetModeKey || 'BASE'}`.toUpperCase());
	const modeLabel = $derived(MODE_LABELS[modeKey] ?? modeKey);
	const costMultiplier = $derived(SUSHI_MONKEY_BET_MODE_META[modeKey]?.costMultiplier ?? 1);

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

	// The same six rows, handed to the bar so they are still on screen after the
	// card is dismissed and after every run (stateReplay.summary). Stake review on
	// Deadwood Express, 2026-10-04: the bar next to Replay lacked the card's info.
	$effect(() => {
		stateReplay.summary = [
			{ label: L.mode, value: modeLabel },
			{ label: L.baseBet, value: numberToCurrencyString(baseBet) },
			{ label: L.costMultiplier, value: fmtMult(costMultiplier) },
			{ label: L.totalCost, value: numberToCurrencyString(totalCost) },
			{ label: L.payoutMultiplier, value: fmtMult(payoutMultiplier), tone: 'win' },
			{ label: L.totalWin, value: numberToCurrencyString(totalWin), tone: 'win' },
		];
	});
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
		background: rgba(30, 27, 26, 0.78);
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
		/* the game's screenprint plate: paper on a hard ink rim, red offset print */
		background: #efeadc;
		border: 3px solid #1e1b1a;
		box-shadow: 6px 6px 0 #b87b60;
		color: #1e1b1a;
		font-family: var(--gb-body-font, sans-serif);
		text-align: center;
	}

	.replay-badge {
		display: inline-block;
		padding: 0.2rem 0.7rem;
		border-radius: 999px;
		background: #4a4846;
		color: #efeadc;
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
		background: rgba(30, 27, 26, 0.06);
		border: 2px solid #1e1b1a;
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
		background: rgba(31, 92, 74, 0.12);
	}

	dt {
		opacity: 0.75;
	}

	dd {
		margin: 0;
		font-weight: 700;
	}

	.accent {
		color: #b87b60;
	}
	.win {
		color: #4a4846;
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
		background: #b87b60;
		color: #efeadc;
		border: 3px solid #1e1b1a;
		box-shadow: 4px 4px 0 #1e1b1a;
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
