<script lang="ts">
	import { innerHeight, innerWidth } from 'svelte/reactivity/window';

	import { stateBet, stateReplay, stateUrlDerived } from 'state-shared';
	import { API_AMOUNT_MULTIPLIER } from 'constants-shared/bet';
	import { zIndex } from 'constants-shared/zIndex';
	import { numberToCurrencyString, WIN_MAX_FRACTION_DIGITS } from 'utils-shared/amount';

	import { GO_BANANAS_BET_MODE_META } from '../../game/betModeMeta';

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
		BONUS100: 'Free Spins',
		BONUS200: 'Super Free Spins',
		BONUS300: 'Max Free Spins',
		HOLDANDSPIN: 'Hold and Spin',
	};

	const modeKey = $derived(`${stateBet.activeBetModeKey || 'BASE'}`.toUpperCase());
	const modeLabel = $derived(MODE_LABELS[modeKey] ?? modeKey);
	const costMultiplier = $derived(GO_BANANAS_BET_MODE_META[modeKey]?.costMultiplier ?? 1);

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
	//
	// Stakes are money the player handed over and are always shown to 2 decimals.
	// The WIN is not: a 2.6x payout on a $0.01 stake is $0.026, and at 2 decimals
	// that renders as "$0.03" — more than the round actually paid, and no longer
	// the number the RGS returned. Certification flagged exactly this card.
	// WIN_MAX_FRACTION_DIGITS is a MAXIMUM, so "$331.60" still reads as "$331.60";
	// only a sub-cent amount spends the extra places.

	const totalWin = $derived(
		typeof round?.payout === 'number'
			? round.payout / API_AMOUNT_MULTIPLIER
			: baseBet * payoutMultiplier,
	);

	// FIT THE CARD TO THE VIEWPORT INSTEAD OF SCROLLING IT.
	//
	// The card is one screen of fixed content — six rows, a button and a footnote
	// — and it used to be `max-height: 100%; overflow-y: auto`, which on Popout S
	// (660x400) meant the round could not be started without scrolling a panel
	// that has nothing worth scrolling. Certification asked for it scaled instead.
	//
	// Measured rather than guessed at with breakpoints: the card's height depends
	// on the locale, on social play's longer labels and on the currency string, so
	// a media query tuned to one of those is wrong for the others. `offsetWidth` /
	// `offsetHeight` are LAYOUT sizes and are not affected by the transform, so
	// reading them back while scaled does not feed itself.
	//
	// Only ever shrinks: a small card centred in a large window is correct as it
	// is, and blowing it up to fill a desktop screen would be a different bug.
	let cardElement = $state(null as HTMLDivElement | null);
	let cardSizes = $state({ width: 0, height: 0 });

	// A plain ResizeObserver rather than the utils-resize-observer action: that
	// package is not a dependency of this app, and one observer on one element
	// does not justify adding one. It also catches the late reflow when the
	// display font finishes loading, which a measurement taken on mount does not.
	$effect(() => {
		const element = cardElement;
		if (!element) return;
		const observer = new ResizeObserver(() => {
			cardSizes = { width: element.offsetWidth, height: element.offsetHeight };
		});
		observer.observe(element);
		return () => observer.disconnect();
	});

	// 1rem of breathing room on each side, matching the backdrop's padding.
	const GUTTER = 32;
	const scale = $derived.by(() => {
		const viewportWidth = innerWidth.current ?? 0;
		const viewportHeight = innerHeight.current ?? 0;
		if (!cardSizes.width || !cardSizes.height || !viewportWidth || !viewportHeight) return 1;
		return Math.min(
			1,
			(viewportWidth - GUTTER) / cardSizes.width,
			(viewportHeight - GUTTER) / cardSizes.height,
		);
	});

	const fmtMult = (value: number) => `${Number(value.toFixed(4))}x`;
	// FULL PRECISION (Stake review 2026-10-04, Go Bananas Boat): $0.01 x 125.9 must
	// read $1.259, not $1.26. Up to 6 decimals; Intl prints the fewest that are
	// exact, never fewer than 2.
	const FULL = 6;
	const fmtMoney = (value: number) => numberToCurrencyString(Number(value.toFixed(FULL)), FULL);
</script>

<!-- above the paytable/info layer: the round must not start behind an open panel -->
<div class="replay-backdrop" style:z-index={zIndex.info + 10}>
	<div
		class="replay-card"
		bind:this={cardElement}
		style:transform={`scale(${scale})`}
	>
		<span class="replay-badge">{L.badge}</span>
		<h2>{L.title}</h2>

		<dl class="replay-rows">
			<div class="row">
				<dt>{L.mode}</dt>
				<dd class="accent">{modeLabel}</dd>
			</div>

			<div class="row spacer">
				<dt>{L.baseBet}</dt>
				<dd class="accent">{fmtMoney(baseBet)}</dd>
			</div>
			<div class="row">
				<dt>{L.costMultiplier}</dt>
				<dd class="accent">{fmtMult(costMultiplier)}</dd>
			</div>
			<div class="row highlight">
				<dt>{L.totalCost}</dt>
				<dd class="accent big">{fmtMoney(totalCost)}</dd>
			</div>

			<div class="row spacer">
				<dt>{L.payoutMultiplier}</dt>
				<dd class="win">{fmtMult(payoutMultiplier)}</dd>
			</div>
			<div class="row highlight">
				<dt>{L.totalWin}</dt>
				<dd class="win big">{fmtMoney(totalWin)}</dd>
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
		/* hidden, not auto: the card is scaled to fit (see `scale` above), so a
		   scrollbar here would only ever be a rounding artefact */
		overflow: hidden;
	}

	.replay-card {
		width: min(24rem, 100%);
		/* No max-height and no scrolling of its own — both would clamp the layout
		   height the scale is measured from, and the card would then be sized to
		   fit a box it had already been squeezed into. */
		box-sizing: border-box;
		transform-origin: center center;
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
