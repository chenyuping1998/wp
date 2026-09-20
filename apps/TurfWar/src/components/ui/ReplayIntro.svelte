<script lang="ts">
	import { stateBet, stateReplay, stateUrlDerived } from 'state-shared';
	import { API_AMOUNT_MULTIPLIER } from 'constants-shared/bet';
	import { zIndex } from 'constants-shared/zIndex';
	import { numberToCurrencyString, WIN_MAX_FRACTION_DIGITS } from 'utils-shared/amount';

	import { TURF_WAR_BET_MODE_META } from '../../game/betModeMeta';
	import { FEATURE_TIERS } from '../../game/featureTiers';

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
	// key ("BONUS_HITS") and the buy-card caption ("BUY 500×") are both wrong here
	// — one is machine naming, the other is a call to action.
	//
	// Derived from FEATURE_TIERS rather than written out again. The hardcoded copy
	// that was here still said "Neon Nights" / "Sunset Hits" / "Ocean Drive" long
	// after the tiers became Lookout / Muscle / Kingpin everywhere else, which is
	// exactly what a third handwritten list of the same three names gets you.
	const MODE_LABELS: Record<string, string> = {
		BASE: 'Base Game',
		...Object.fromEntries(FEATURE_TIERS.map((tier) => [tier.mode, tier.title])),
	};

	const modeKey = $derived(`${stateBet.activeBetModeKey || 'BASE'}`.toUpperCase());
	const modeLabel = $derived(MODE_LABELS[modeKey] ?? modeKey);
	const costMultiplier = $derived(TURF_WAR_BET_MODE_META[modeKey]?.costMultiplier ?? 1);

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
				<!--
					Four decimals, like every other win figure. A stake is 2dp, but a
					win of 2000 book units on a minimum stake is $0.002 and renders as
					"$0.00" at 2dp — no longer matching the JSON the server sent, which
					is the certification line "Game displays sub-cent payouts
					correctly". The replay panel is exactly the surface that gets
					missed when sweeping for this.
				-->
				<dd class="win big">{numberToCurrencyString(totalWin, WIN_MAX_FRACTION_DIGITS)}</dd>
			</div>
		</dl>

		<!--
			The play mark is drawn, not typed. It was a literal ▶ (U+25B6 BLACK
			RIGHT-POINTING TRIANGLE), which most platforms hand to the colour emoji
			font — so on the magenta button it arrived as a black-and-white system
			glyph at whatever size and baseline that font chose, ignoring the button's
			colour entirely. Same class of defect as the volatility bolts on the
			opening card, same fix.
		-->
		<button class="replay-start" onclick={props.onstart}>
			<svg class="replay-start-mark" viewBox="0 0 12 14" aria-hidden="true">
				<path d="M1 1v12l10-6z" />
			</svg>
			{L.start}
		</button>

		<p class="replay-foot">{L.foot}</p>
	</div>
</div>

<style lang="scss">
	/* Turf War palette: near-black card, sodium-orange trim, headings in the same
	   condensed face as the Buy Bonus card and the panel titles. Replay is a
	   screen the operator opens from a round history, so it is as player-facing
	   as the paytable and cannot be the one panel still in an older game's
	   colours. Cost stays sodium orange and the win bone white, so the two halves
	   still separate without a second hue.

	   The card body was still a WARM brown gradient (rgba(34,27,20) over
	   rgba(14,11,8)) — Capo Nostra's mahogany, which this game does not contain.
	   §0's dark is a COOL near-black; under the same sodium trim the difference
	   is the whole difference between a lit room and a street at night. */
	.replay-backdrop {
		position: fixed;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 1rem;
		background: rgba(14, 15, 17, 0.86);
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
		background: linear-gradient(180deg, rgba(23, 25, 28, 0.98) 0%, rgba(14, 15, 17, 0.99) 100%);
		border: 1px solid rgba(217, 214, 206, 0.4);
		box-shadow: 0 14px 44px rgba(0, 0, 0, 0.8);
		color: #d9d6ce;
		font-family: var(--gb-body-font, sans-serif);
		text-align: center;
	}

	.replay-badge {
		display: inline-block;
		padding: 0.2rem 0.7rem;
		border-radius: 999px;
		background: #f5893d;
		color: #0e0f11;
		font-weight: 800;
		font-size: 0.7rem;
		letter-spacing: 0.08em;
	}

	h2 {
		margin: 0.55rem 0 1rem;
		/* Oswald 700, not 400. The fallback here used to be a serif and the weight
		   was set for one — a condensed grotesque at 400 is a caption weight and
		   read lighter than the body copy under it. */
		font-family: var(--hm-title-font, 'Arial Narrow', sans-serif);
		font-weight: 700;
		font-size: 1.5rem;
		letter-spacing: 0.04em;
		text-transform: uppercase;
	}

	.replay-rows {
		margin: 0;
		padding: 0.85rem;
		border-radius: 10px;
		background: rgba(0, 0, 0, 0.35);
		border: 1px solid rgba(58, 61, 66, 0.9);
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
		background: rgba(217, 214, 206, 0.09);
	}

	dt {
		opacity: 0.75;
	}

	dd {
		margin: 0;
		font-weight: 700;
	}

	.accent {
		color: #f5893d;
	}
	.win {
		color: #d9d6ce;
	}
	.big {
		font-size: 1.05rem;
	}

	.replay-start {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		width: 100%;
		margin-top: 1rem;
		padding: 0.8rem 1rem;
		border: none;
		border-radius: 10px;
		background: linear-gradient(180deg, #d9d6ce 0%, #f5893d 100%);
		color: #0e0f11;
		font-family: var(--hm-title-font, 'Arial Narrow', sans-serif);
		font-size: 1.05rem;
		font-weight: 700;
		cursor: pointer;
		transition:
			filter 0.2s ease,
			transform 0.1s ease;
	}

	/* Sized off the label rather than in rem, so the mark tracks the button text
	   at any root size. `currentColor` is the point of drawing it: it takes the
	   button's own ink, which the emoji glyph could not. */
	.replay-start-mark {
		height: 0.85em;
		width: auto;
		fill: currentColor;
		flex: none;
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
