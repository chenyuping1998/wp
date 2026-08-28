<script lang="ts">
	import { Popup } from 'components-shared';
	import { zIndex } from 'constants-shared/zIndex';
	import { stateModal } from 'state-shared';

	import config from '../../game/config';
	import assets from '../../game/assets';
	import { getSocialTerms } from '../../game/socialTerms';

	// Social play forbids betting terminology, and this panel is titled with it.
	// Shared with the game rules page so the two cannot describe the same rule in
	// different words. See socialTerms.ts.
	const T = getSocialTerms();

	type PayRow = { name: string; img: string; label: string; pays: { count: number; value: number }[] };

	const SYMBOL_ASSET: Record<string, keyof typeof assets> = {
		H1: 'mcH1',
		H2: 'mcH2',
		H3: 'mcH3',
		H4: 'mcH4',
		H5: 'mcH5',
		L1: 'mcL1',
		L2: 'mcL2',
		L3: 'mcL3',
		L4: 'mcL4',
		W: 'mcW',
		S: 'mcS',
	};

	// Deliberately NOT the names of real coins.
	//
	// The premium art depicts recognisable crypto marks, and at least one of them
	// (the Tether wordmark on H3) is a registered trademark of a company that
	// would have a view about a gambling product using it. Naming the row after
	// the brand does not create the exposure, but it does confirm it in writing,
	// on a page certification reads. The artwork is the real exposure and needs
	// replacing separately - see HANDOFF.
	//
	// These names come from the trading desk the game is set on, which is the
	// game's own vocabulary and belongs to nobody.
	const SYMBOL_LABEL: Record<string, string> = {
		H1: 'B-coin',
		H2: 'E-coin',
		H3: 'T-coin',
		H4: 'S-coin',
		H5: 'Bull',
		L1: 'Green Candle',
		L2: 'Red Candle',
		L3: 'Rally',
		L4: 'Selloff',
		W: 'CONTRACT — Wild',
		S: 'TRIPLE WITCHING — Scatter',
	};

	// keep high -> low ordering for readability
	const ORDER = ['W', 'H1', 'H2', 'H3', 'H4', 'H5', 'L1', 'L2', 'L3', 'L4', 'S'];

	const maxWin = config.betModes?.base?.max_win ?? 10000;

	const imgSrc = (name: string) => {
		const key = SYMBOL_ASSET[name];
		const asset = key ? (assets[key] as { src?: string } | undefined) : undefined;
		return asset?.src ?? '';
	};

	const REELS = 5;
	const BASE_ROWS = config.numRows?.[0] ?? 3;
	const FEATURE_ROWS = 5;
	const baseWays = (BASE_ROWS ** REELS).toLocaleString();
	const featureWays = (FEATURE_ROWS ** REELS).toLocaleString();
	// Line counts. The base figure comes from the maths config so it cannot drift
	// away from what is actually evaluated; 40 is the expanded table, which the
	// frontend config does not carry because the maths only ships the base board.
	// Both tables come from the maths - `paylines` is the SDK's own frontend
	// config, `paylinesExpanded` is merged in by design/sync_math_config.mjs from
	// games/TripleWitching/dump_paylines.py, which writes them out of the same
	// build_paylines() the evaluator uses. Neither is written out by hand here:
	// a client drawing a line the maths does not evaluate is exactly the kind of
	// disagreement certification sends a game back for.
	type LineTable = Record<string, number[]>;
	const toLineList = (table: LineTable | undefined, rows: number) =>
		Object.entries(table ?? {})
			.map(([id, path]) => ({ id: Number(id), path, rows }))
			.sort((a, b) => a.id - b.id);

	const baseLineList = toLineList(config.paylines as LineTable, BASE_ROWS);
	const expandedLineList = toLineList(
		(config as { paylinesExpanded?: LineTable }).paylinesExpanded,
		FEATURE_ROWS,
	);
	const baseLines = baseLineList.length || 20;
	const featureLines = expandedLineList.length || 40;

	/** row-major cell list for one line's diagram: 5 reels wide, `rows` tall */
	const lineCells = (path: number[], rows: number) =>
		Array.from({ length: rows * REELS }, (_, i) => path[i % REELS] === Math.floor(i / REELS));

	// A worked example beats a definition: this is the board most players will
	// mis-count, with 2 of the symbol on reel 1, 1 on reel 2 and 3 on reel 3.
	const WAYS_EXAMPLE = { counts: [2, 1, 3], get product() { return this.counts.reduce((a, b) => a * b, 1); } };

	// The ways tables, which the SDK's own config does not carry - merged in by
	// design/sync_math_config.mjs. Only the paying symbols appear: CONTRACT and
	// TRIPLE WITCHING have no values in any table.
	type PaytableJson = Record<string, { [k: string]: number }[]>;
	const paytables = (config as { paytables?: Record<string, PaytableJson> }).paytables ?? {};
	const readPays = (table: PaytableJson | undefined, name: string) =>
		(table?.[name] ?? []).map((entry) => {
			const [count, value] = Object.entries(entry)[0];
			return { count: Number(count), value: Number(value) };
		});

	const waysRows = ORDER.filter((name) => (paytables.ways243?.[name] ?? []).length > 0).map(
		(name) => ({
			name,
			img: imgSrc(name),
			label: SYMBOL_LABEL[name] ?? name,
			small: readPays(paytables.ways243, name),
			big: readPays(paytables.ways3125, name),
		}),
	);

	const rows: PayRow[] = ORDER.filter((name) => name in config.symbols).map((name) => {
		const symbol = (config.symbols as Record<string, { paytable?: { [k: string]: number }[] | null }>)[
			name
		];
		const pays = (symbol.paytable ?? []).map((entry) => {
			const [count, value] = Object.entries(entry)[0];
			return { count: Number(count), value: Number(value) };
		});
		return { name, img: imgSrc(name), label: SYMBOL_LABEL[name] ?? name, pays };
	});
</script>

{#if stateModal.modal?.name === 'payTable'}
	<Popup zIndex={zIndex.modal} onclose={() => (stateModal.modal = null)}>
		<div class="wp-paytable">
			<h2>{T.payTableUpper}</h2>
			<p class="wp-note">
				{T.paysStart} shown as a multiple of {T.totalBet}, per line. Wins {T.winsDirection},
				beginning on reel 1. A session running WAYS {T.pays} from a different table &mdash;
				see below.
			</p>
			<!--
				The unit banner, and it is not decoration.

				Certification asked for it to be stated next to each symbol whether a
				number is a multiplier or a fixed amount taken off the balance, because a
				bare "50" beside a symbol is genuinely ambiguous - a player holding a
				balance of 500 has no way to tell 50x from a flat 50, and the two differ
				by the size of their own play amount. Three things now say it: this
				banner, the column head over every table, and a "x" suffix on every value.

				"currency" is on the restricted list and was flagged here by review, so
				the sentence names the balance instead. It says the same thing in both
				modes, which is why it stays literal text rather than a pick().
			-->
			<p class="wp-unit">
				<b>&times;</b> Every value in the tables below is a <b>MULTIPLIER</b> of your
				{T.totalBet} &mdash; not a fixed amount off your balance. A value of 50
				means 50&times; your {T.totalBet}.
			</p>

			<h3 class="wp-lines-title">LINE {T.payTableUpper}</h3>
			<p class="wp-note">
				Used by the base game and by any EXPIRY SESSION that is not running WAYS. Per line.
			</p>
			<div class="wp-grid-head">
				<span>SYMBOL</span>
				<span>MATCHES &rarr; MULTIPLIER &times; {T.totalBet}</span>
			</div>
			<div class="wp-grid">
				{#each rows as row, i (row.name)}
					<div class="wp-row" style="animation-delay: {i * 50}ms">
						<div class="wp-symbol">
							{#if row.img}
								<div class="wp-symbol-glow">
									<img src={row.img} alt={row.label} />
								</div>
							{/if}
							<span class="wp-symbol-name">{row.label}</span>
						</div>
						<div class="wp-pays">
							{#if row.name === 'S'}
								<span class="wp-special"
									>{T.doesNotPay} &mdash; 3, 4 or 5 award 10, 12 or 15 free spins</span
								>
							{:else if row.pays.length}
								{#each row.pays as pay (pay.count)}
									<span class="wp-pay-chip"><b>{pay.count}</b><em>{pay.value}&times;</em></span>
								{/each}
							{/if}
						</div>
					</div>
				{/each}
			</div>

			<h3 class="wp-lines-title">HOW WINS ARE COUNTED</h3>
			<p class="wp-note">
				The base game is played on {baseLines} fixed lines. A symbol {T.pays} when it lands on
				adjacent reels along a line, starting from reel 1, and only the highest win on each
				line counts.
			</p>
			<p class="wp-note">
				The EXPIRY SESSION can change this. With EXPAND the board is
				{FEATURE_ROWS}&times;{REELS} and there are {featureLines} lines. With WAYS there are no
				lines at all: a symbol {T.pays} on adjacent reels from reel 1 wherever it sits, for
				{baseWays} ways at {BASE_ROWS}&times;{REELS} and {featureWays} at
				{FEATURE_ROWS}&times;{REELS}.
			</p>
			<h3 class="wp-lines-title">THE {baseLines} BASE LINES &mdash; {BASE_ROWS}&times;{REELS}</h3>
			<p class="wp-note">
				Every line is read from reel 1 rightwards. Lit cells are the positions the line
				covers.
			</p>
			<div class="wp-lines">
				{#each baseLineList as line (line.id)}
					<div class="wp-line">
						<div class="wp-line-grid">
							{#each lineCells(line.path, line.rows) as lit, i (i)}
								<div class="wp-cell" class:lit></div>
							{/each}
						</div>
						<span class="wp-line-id">{line.id}</span>
					</div>
				{/each}
			</div>

			<h3 class="wp-lines-title">THE {featureLines} EXPAND LINES &mdash; {FEATURE_ROWS}&times;{REELS}</h3>
			<p class="wp-note">
				Used only while the EXPIRY SESSION is running EXPAND without WAYS. This is a
				separate table, not the base one extended: a 5-row board has five straight lines
				where a 3-row board has three, so the two are numbered independently and line 4
				here is not line 4 above.
			</p>
			<div class="wp-lines">
				{#each expandedLineList as line (line.id)}
					<div class="wp-line">
						<div class="wp-line-grid">
							{#each lineCells(line.path, line.rows) as lit, i (i)}
								<div class="wp-cell" class:lit></div>
							{/each}
						</div>
						<span class="wp-line-id">{line.id}</span>
					</div>
				{/each}
			</div>

			<h3 class="wp-lines-title">WAYS {T.payTableUpper}</h3>
			<p class="wp-note">
				Used only by an EXPIRY SESSION running WAYS. Per way, not per line.
			</p>
			<p class="wp-note">
				Each board height has its own column, because they are not comparable: the
				{FEATURE_ROWS}&times;{REELS} board has {featureWays} ways against the
				{BASE_ROWS}&times;{REELS} board's {baseWays}, about thirteen times as many, so one
				set of values used on both would make the taller board worth thirteen times the
				shorter one for the same symbols.
			</p>
			<div class="wp-grid-head">
				<span>SYMBOL</span>
				<span>MATCHES &rarr; MULTIPLIER &times; {T.totalBet}</span>
			</div>
			<div class="wp-grid wp-ways-grid">
				{#each waysRows as row (row.name)}
					<div class="wp-row">
						<div class="wp-symbol">
							{#if row.img}
								<div class="wp-symbol-glow"><img src={row.img} alt={row.label} /></div>
							{/if}
							<span class="wp-symbol-name">{row.label}</span>
						</div>
						<div class="wp-pays">
							<span class="wp-ways-tag">{BASE_ROWS}&times;{REELS}</span>
							{#each row.small as pay (pay.count)}
								<span class="wp-pay-chip"><b>{pay.count}</b><em>{pay.value}&times;</em></span>
							{/each}
							<span class="wp-ways-tag">{FEATURE_ROWS}&times;{REELS}</span>
							{#each row.big as pay (pay.count)}
								<span class="wp-pay-chip"><b>{pay.count}</b><em>{pay.value}&times;</em></span>
							{/each}
						</div>
					</div>
				{/each}
			</div>

			<p class="wp-note">
				The number of ways is the count of the symbol on each winning reel multiplied
				together. {WAYS_EXAMPLE.counts[0]} on reel 1, {WAYS_EXAMPLE.counts[1]} on reel 2 and
				{WAYS_EXAMPLE.counts[2]} on reel 3 is {WAYS_EXAMPLE.counts.join(' \u00d7 ')} =
				{WAYS_EXAMPLE.product} ways, each {T.paid} at the 3-of-a-kind value for that board in the
				WAYS table above.
			</p>

			<p class="wp-note">
				CONTRACT substitutes for all symbols except TRIPLE WITCHING and does not {T.pay} as a symbol
				of its own. Every symbol's ways wins are added together. Max win is capped at
				{maxWin.toLocaleString()}&times; {T.totalBet}.
			</p>
		</div>
	</Popup>
{/if}

<style lang="scss">
	/* ─── entrance animation ─── */
	@keyframes slideUp {
		from {
			opacity: 0;
			transform: translateY(18px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	@keyframes rowSlideIn {
		from {
			opacity: 0;
			transform: translateX(-12px);
		}
		to {
			opacity: 1;
			transform: translateX(0);
		}
	}

	@keyframes shimmer {
		0% { background-position: -200% center; }
		100% { background-position: 200% center; }
	}

	.wp-paytable {
		/* sit above the Popup's full-screen click-to-close layer (z-index 2),
		   otherwise the overlay swallows wheel/touch events and blocks scrolling */
		position: relative;
		z-index: 100;
		display: flex;
		flex-direction: column;
		gap: 0.85rem;
		width: min(36rem, 90vw);
		max-width: 36rem;
		max-height: 80vh;
		overflow-y: auto;
		-webkit-overflow-scrolling: touch;
		overscroll-behavior: contain;
		padding: 1.5rem 1.75rem;
		color: #fff;
		text-align: center;
		animation: slideUp 0.4s cubic-bezier(0.22, 1, 0.36, 1) both;

		/* custom scrollbar */
		&::-webkit-scrollbar {
			width: 5px;
		}
		&::-webkit-scrollbar-track {
			background: rgba(255, 255, 255, 0.04);
			border-radius: 4px;
		}
		&::-webkit-scrollbar-thumb {
			background: linear-gradient(180deg, #ffd75e 0%, #ffe98a 100%);
			border-radius: 4px;
		}

		h2 {
			margin: 0 0 0.25rem;
			font-size: 1.75rem;
			font-weight: 800;
			letter-spacing: 0.1em;
			background: linear-gradient(135deg, #ffe98a 0%, #ffd75e 50%, #9ec44a 100%);
			background-size: 200% auto;
			-webkit-background-clip: text;
			-webkit-text-fill-color: transparent;
			background-clip: text;
			animation: shimmer 4s linear infinite;
			filter: drop-shadow(0 0 18px rgba(255, 215, 94, 0.4));
		}
	}

	.wp-note {
		margin: 0;
		font-size: 0.82rem;
		opacity: 0.7;
		line-height: 1.5;
		letter-spacing: 0.02em;
	}

	.wp-grid {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
	}

	/* Unit banner. Deliberately louder than .wp-note — a note at 70% opacity is
	   what the ambiguous version already had, and it was not read. */
	.wp-unit {
		margin: 0;
		padding: 0.5rem 0.75rem;
		border-radius: 0.6rem;
		background: rgba(255, 215, 94, 0.08);
		border: 1px solid rgba(255, 215, 94, 0.28);
		font-size: 0.82rem;
		line-height: 1.5;
		text-align: left;
		color: rgba(255, 255, 255, 0.88);

		b {
			color: #ffd75e;
			font-weight: 800;
		}
	}

	/* Column head over each value table, laid out on the same two-column split as
	   .wp-row so the caption sits over the column it describes. */
	.wp-grid-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.75rem;
		padding: 0 0.8rem;
		font-size: 0.66rem;
		font-weight: 800;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: rgba(255, 215, 94, 0.75);

		span:first-child {
			min-width: 9.5rem;
			text-align: left;
		}
		span:last-child {
			text-align: right;
		}
	}

	/* ─── ways explainer block ─── */
	.wp-ways-tag {
		font-size: 0.66rem;
		font-weight: 800;
		letter-spacing: 0.1em;
		opacity: 0.65;
		align-self: center;
		padding-right: 0.15rem;
	}

	.wp-lines-title {
		margin: 0.5rem 0 0;
		font-size: 1.05rem;
		font-weight: 800;
		letter-spacing: 0.14em;
		color: #ffd75e;
	}

	.wp-lines {
		display: grid;
		/* auto-fit keeps the sheet readable from phone to desktop without
		   hard-coding a column count */
		grid-template-columns: repeat(auto-fit, minmax(4.6rem, 1fr));
		gap: 0.55rem;
	}

	.wp-line {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.28rem;
		padding: 0.45rem 0.3rem 0.35rem;
		border-radius: 0.6rem;
		background: rgba(255, 255, 255, 0.04);
		border: 1px solid rgba(255, 255, 255, 0.06);
		transition: all 0.25s cubic-bezier(0.22, 1, 0.36, 1);

		&:hover {
			background: rgba(255, 215, 94, 0.1);
			border-color: rgba(255, 215, 94, 0.24);
		}
	}

	.wp-line-grid {
		display: grid;
		grid-template-columns: repeat(5, 1fr);
		gap: 2px;
		width: 100%;
		max-width: 4.2rem;
	}

	.wp-cell {
		aspect-ratio: 1;
		border-radius: 2px;
		background: rgba(255, 255, 255, 0.07);

		&.lit {
			background: linear-gradient(160deg, #ffe98a, #ffc93c);
			box-shadow: 0 0 6px rgba(255, 215, 94, 0.65);
		}
	}

	.wp-line-id {
		font-size: 0.7rem;
		font-weight: 700;
		letter-spacing: 0.06em;
		color: rgba(255, 215, 94, 0.85);
	}

	.wp-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.75rem;
		padding: 0.55rem 0.8rem;
		border-radius: 0.75rem;
		background: rgba(255, 255, 255, 0.04);
		backdrop-filter: blur(8px);
		-webkit-backdrop-filter: blur(8px);
		border: 1px solid rgba(255, 255, 255, 0.06);
		transition: all 0.3s cubic-bezier(0.22, 1, 0.36, 1);
		animation: rowSlideIn 0.35s cubic-bezier(0.22, 1, 0.36, 1) both;

		&:hover {
			background: rgba(255, 215, 94, 0.1);
			border-color: rgba(255, 215, 94, 0.22);
			box-shadow: 0 0 20px rgba(255, 215, 94, 0.14),
			            inset 0 0 20px rgba(255, 215, 94, 0.05);
			transform: translateX(4px);
		}
	}

	.wp-symbol {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		min-width: 9.5rem;
	}

	.wp-symbol-glow {
		position: relative;
		width: 3.2rem;
		height: 3.2rem;
		display: flex;
		align-items: center;
		justify-content: center;

		img {
			width: 3rem;
			height: 3rem;
			object-fit: contain;
			transition: transform 0.3s cubic-bezier(0.22, 1, 0.36, 1),
			            filter 0.3s ease;
			position: relative;
			z-index: 1;
		}

		/* glow ring on hover */
		&::after {
			content: '';
			position: absolute;
			inset: -3px;
			border-radius: 50%;
			background: radial-gradient(circle, rgba(255, 215, 94, 0.3) 0%, transparent 70%);
			opacity: 0;
			transition: opacity 0.3s ease;
		}
	}

	.wp-row:hover .wp-symbol-glow {
		img {
			transform: scale(1.12);
			filter: drop-shadow(0 0 8px rgba(255, 233, 138, 0.6));
		}
		&::after {
			opacity: 1;
		}
	}

	.wp-symbol-name {
		font-size: 0.95rem;
		font-weight: 700;
		letter-spacing: 0.03em;
		color: rgba(255, 255, 255, 0.92);
	}

	.wp-pays {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
		justify-content: flex-end;
		font-size: 0.92rem;
	}

	/* A chip is "<count> | <value>x".
	   The two numbers used to be joined by a literal "x", which read as
	   arithmetic - "5 x 50" - and left the value looking like a bare amount. The
	   separator is now a rule, and the only "x" in the chip is the suffix on the
	   value, where it means "multiplier" and nothing else. */
	.wp-pay-chip {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		padding: 0.2rem 0.55rem;
		border-radius: 0.5rem;
		background: rgba(255, 233, 138, 0.07);
		border: 1px solid rgba(255, 233, 138, 0.12);
		transition: all 0.25s ease;

		b {
			color: #ffe98a;
			font-weight: 800;
		}

		em {
			padding-left: 0.4rem;
			border-left: 1px solid rgba(255, 233, 138, 0.22);
			font-style: normal;
			font-weight: 600;
			background: linear-gradient(135deg, #ffe98a, #d8a334);
			-webkit-background-clip: text;
			-webkit-text-fill-color: transparent;
			background-clip: text;
		}
	}

	.wp-row:hover .wp-pay-chip {
		background: rgba(255, 233, 138, 0.12);
		border-color: rgba(255, 233, 138, 0.2);
		box-shadow: 0 0 8px rgba(255, 233, 138, 0.12);
	}

	.wp-special {
		color: #ffd75e;
		font-weight: 700;
		text-shadow: 0 0 12px rgba(255, 122, 217, 0.4);
	}
</style>
