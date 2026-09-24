<script lang="ts">
	import { Popup } from 'components-shared';
	import { zIndex } from 'constants-shared/zIndex';
	import { stateModal } from 'state-shared';

	import config from '../../game/config';
	import { getSocialTerms } from '../../game/socialTerms';
	import assets from '../../game/assets';

	type PayRow = { name: string; img: string; label: string; pays: { count: number; value: number }[] };

	const SYMBOL_ASSET: Record<string, keyof typeof assets> = {
		H1: 'mooooH1',
		H2: 'mooooH2',
		H3: 'mooooH3',
		H4: 'mooooH4',
		L1: 'mooooL1',
		L2: 'mooooL2',
		L3: 'mooooL3',
		L4: 'mooooL4',
		H5: 'mooooH5',
		W: 'mooooW',
		S: 'mooooS',
		M: 'mooooM',
	};

	// Must match the drawn art, and it did not.
	//
	// Every one of these was Hot Miami's: a player opening the pay table of a
	// dusk-county-fair cow game was shown a rosette labelled "Neon Diamond", a
	// milk bottle labelled "Flamingo" and a hay bale labelled "Boombox", beside a
	// row for a "Collector" this game does not have — while the Milk Churn, which
	// drives the whole free game, had no row at all, because its symbol is `M` and
	// the table was looking for `C`.
	//
	// Names come from docs/handoff/moooo_SYMBOLS.md, the record the art was drawn
	// from.
	const SYMBOL_LABEL: Record<string, string> = {
		H1: 'Champion Rosette',
		H2: 'Runner-up Ribbon',
		H3: 'Milk Bottle',
		H4: 'Hay Bale',
		H5: 'Feed Bucket',
		L1: 'Horseshoe',
		L2: 'Clover',
		L3: 'Wheat Sheaf',
		L4: 'Hen\u2019s Egg',
		W: 'Moooo Wild',
		S: 'FS \u2014 Scatter',
		M: 'Milk Churn',
	};

	// keep high -> low ordering for readability
	const ORDER = ['W', 'H1', 'H2', 'H3', 'H4', 'H5', 'L1', 'L2', 'L3', 'L4', 'S', 'M'];

	const maxWin = config.betModes?.base?.max_win ?? 20000;

	const imgSrc = (name: string) => {
		const key = SYMBOL_ASSET[name];
		const asset = key ? (assets[key] as { src?: string } | undefined) : undefined;
		return asset?.src ?? '';
	};

	// Social play forbids betting terminology in player-facing copy. The words are
	// shared with ModalGameRules through one module rather than re-declared here —
	// this panel and that one describe the same game, and when each kept its own
	// copy the two drifted, which is precisely what certification flagged.
	const T = getSocialTerms();

	// Every tier awards the same number of free spins; the Scatter count selects
	// which tier is played rather than how long it lasts (maths: freespin_triggers
	// is {3: 10, 4: 10, 5: 10}). Kept in step with ModalGameRules.
	const FREE_SPINS = 10;

	// Fixed paylines, each an array of row indices (0 = top row). Rendered below
	// as mini boards with the line's cells lit, so a player can see the actual
	// shapes instead of being told a number.
	//
	// Both dimensions come from config. They were hardcoded 5x5 for this 5x4
	// game, so every payline thumbnail drew a permanently dead bottom row.
	const REELS = config.numReels;
	const ROWS = config.numRows?.[0] ?? 4;
	const paylines = Object.entries(config.paylines as Record<string, number[]>)
		.map(([id, cells]) => ({ id: Number(id), cells }))
		.sort((a, b) => a.id - b.id);

	const isLit = (cells: number[], reel: number, row: number) => cells[reel] === row;

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
		<div class="moo-paytable">
			<h2>{T.payTableUpper}</h2>
			<p class="moo-note">
				{T.paysStart} shown as a multiple of {T.totalBet}. Line wins {T.winsDirection} on
				{Object.keys(config.paylines).length} fixed {T.paylines}.
			</p>

			<div class="moo-grid">
				{#each rows as row, i (row.name)}
					<div class="moo-row" style="animation-delay: {i * 50}ms">
						<div class="moo-symbol">
							{#if row.img}
								<div class="moo-symbol-glow">
									<img src={row.img} alt={row.label} />
								</div>
							{/if}
							<span class="moo-symbol-name">{row.label}</span>
						</div>
						<div class="moo-pays">
							{#if row.name === 'S'}
								<span class="moo-special"
									>{T.doesNotPay} &mdash; 3, 4 or 5 Scatters award {FREE_SPINS} Free Spins</span
								>
							{:else if row.name === 'M'}
								<!-- The Milk Churn has no paytable entry in config, so without a case of
								     its own the free game's whole progression mechanic renders as a name
								     and an empty cell. Wording kept in step with ModalGameRules. -->
								<span class="moo-special"
									>{T.doesNotPayAlone} &mdash; in Free Spins, raises that reel&rsquo;s Milk
									Meter by one step for the rest of the round.</span
								>
							{:else if row.name === 'W'}
								<!-- The Wild pays 5-of-a-kind like any symbol, but the expansion and the
								     bell are why a player is looking at this row, so they are said here
								     rather than only in the rules panel. -->
								{#each row.pays as pay (pay.count)}
									<span class="moo-pay-chip"><b>{pay.count}</b> &times; <em>{pay.value}</em></span>
								{/each}
								<span class="moo-special"
									>Fills its reel when that reel crosses a winning {T.payline}, and its bell
									multiplies the win.</span
								>
							{:else if row.pays.length}
								{#each row.pays as pay (pay.count)}
									<span class="moo-pay-chip"><b>{pay.count}</b> &times; <em>{pay.value}</em></span>
								{/each}
							{/if}
						</div>
					</div>
				{/each}
			</div>

			<h3 class="moo-lines-title">{paylines.length} {T.paylinesUpper}</h3>
			<p class="moo-note">
				All {paylines.length} lines are always active. Wins {T.winsDirection} from reel 1.
			</p>

			<div class="moo-lines">
				{#each paylines as line (line.id)}
					<div class="moo-line">
						<div class="moo-line-grid">
							{#each Array(ROWS) as _, row (row)}
								{#each Array(REELS) as _, reel (reel)}
									<span class="moo-cell" class:lit={isLit(line.cells, reel, row)}></span>
								{/each}
							{/each}
						</div>
						<span class="moo-line-id">{line.id}</span>
					</div>
				{/each}
			</div>

			<p class="moo-note">
				The Moooo Wild substitutes for all symbols except the Scatter and the Milk Churn, and
				{T.pays} as its own symbol. Only the highest win is {T.paid} per line. Max win is capped at {maxWin.toLocaleString()}&times;
				{T.totalBet}.
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

	.moo-paytable {
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
			background: linear-gradient(135deg, #ffe98a 0%, #ffd75e 50%, #e8a13c 100%);
			background-size: 200% auto;
			-webkit-background-clip: text;
			-webkit-text-fill-color: transparent;
			background-clip: text;
			animation: shimmer 4s linear infinite;
			filter: drop-shadow(0 0 18px rgba(255, 215, 94, 0.4));
		}
	}

	.moo-note {
		margin: 0;
		font-size: 0.82rem;
		opacity: 0.7;
		line-height: 1.5;
		letter-spacing: 0.02em;
	}

	.moo-grid {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
	}

	/* ─── payline diagrams: one mini board per payline, lit cells in reel gold.
	   Count and dimensions are derived from config (REELS/ROWS above), so no
	   number belongs in this comment — it used to say "15 mini 5x5 boards" for
	   a 14-payline 5x4 game. ─── */
	.moo-lines-title {
		margin: 0.5rem 0 0;
		font-size: 1.05rem;
		font-weight: 800;
		letter-spacing: 0.14em;
		color: #ffd75e;
	}

	.moo-lines {
		display: grid;
		/* auto-fit keeps the sheet readable from phone to desktop without
		   hard-coding a column count */
		grid-template-columns: repeat(auto-fit, minmax(4.6rem, 1fr));
		gap: 0.55rem;
	}

	.moo-line {
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

	.moo-line-grid {
		display: grid;
		grid-template-columns: repeat(5, 1fr);
		gap: 2px;
		width: 100%;
		max-width: 4.2rem;
	}

	.moo-cell {
		aspect-ratio: 1;
		border-radius: 2px;
		background: rgba(255, 255, 255, 0.07);

		&.lit {
			background: linear-gradient(160deg, #ffe98a, #ffc93c);
			box-shadow: 0 0 6px rgba(255, 215, 94, 0.65);
		}
	}

	.moo-line-id {
		font-size: 0.7rem;
		font-weight: 700;
		letter-spacing: 0.06em;
		color: rgba(255, 215, 94, 0.85);
	}

	.moo-row {
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

	.moo-symbol {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		min-width: 9.5rem;
	}

	.moo-symbol-glow {
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

	.moo-row:hover .moo-symbol-glow {
		img {
			transform: scale(1.12);
			filter: drop-shadow(0 0 8px rgba(255, 233, 138, 0.6));
		}
		&::after {
			opacity: 1;
		}
	}

	.moo-symbol-name {
		font-size: 0.95rem;
		font-weight: 700;
		letter-spacing: 0.03em;
		color: rgba(255, 255, 255, 0.92);
	}

	.moo-pays {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
		justify-content: flex-end;
		font-size: 0.92rem;
	}

	.moo-pay-chip {
		display: inline-flex;
		align-items: center;
		gap: 0.2rem;
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
			font-style: normal;
			font-weight: 600;
			background: linear-gradient(135deg, #ffe98a, #d8a334);
			-webkit-background-clip: text;
			-webkit-text-fill-color: transparent;
			background-clip: text;
		}
	}

	.moo-row:hover .moo-pay-chip {
		background: rgba(255, 233, 138, 0.12);
		border-color: rgba(255, 233, 138, 0.2);
		box-shadow: 0 0 8px rgba(255, 233, 138, 0.12);
	}

	.moo-special {
		color: #ffd75e;
		font-weight: 700;
		text-shadow: 0 0 12px rgba(255, 122, 217, 0.4);
	}
</style>
