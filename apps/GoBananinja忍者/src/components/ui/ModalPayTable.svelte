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
		H1: 'gbH1',
		H2: 'gbH2',
		H3: 'gbH3',
		H4: 'gbH4',
		L1: 'gbL1',
		L2: 'gbL2',
		L3: 'gbL3',
		L4: 'gbL4',
		L5: 'gbL5',
		W: 'gbW',
		S: 'gbS',
		M: 'gbM',
	};

	const SYMBOL_LABEL: Record<string, string> = {
		H1: 'Combat Helmet',
		H2: 'Pineapple Grenade',
		H3: 'Banana Ammo Crate',
		H4: 'Golden Compass',
		L1: 'A',
		L2: 'K',
		L3: 'Q',
		L4: 'J',
		L5: '10',
		W: 'Wild',
		S: 'Golden Bananas — Scatter',
		M: 'Machete',
	};

	// keep high -> low ordering for readability
	const ORDER = ['W', 'H1', 'H2', 'H3', 'H4', 'L1', 'L2', 'L3', 'L4', 'L5', 'S', 'M'];

	const maxWin = config.betModes?.base?.max_win ?? 10000;

	// Awarded spins by Scatter count, from the maths' freespin_triggers (lifted
	// into config by design/sync_math_config.mjs). Typed into this panel before,
	// while the rules page read it from config — one rule stated from two sources.
	const scatterSpins = Object.values(config.scatterSpins ?? { 3: 8, 4: 10, 5: 12 }).join(', ');

	const imgSrc = (name: string) => {
		const key = SYMBOL_ASSET[name];
		const asset = key ? (assets[key] as { src?: string } | undefined) : undefined;
		return asset?.src ?? '';
	};

	// This is a WAYS game — config.paylines does not exist. Where gen-1 and gen-2
	// drew fifteen mini boards with one lit cell per reel, the thing worth showing
	// here is how the ways COUNT is arrived at, because that is the number a
	// player cannot work out by looking at the board.
	// Read from config, not typed: the worked examples below draw a mini board,
	// and a hard-coded 5 rows would keep drawing the old 5x5 shape after the
	// board changed — a diagram that quietly disagrees with the game.
	const REELS = config.numReels ?? 5;
	const ROWS = config.numRows?.[0] ?? 4;
	const waysCount = (config.numRows ?? []).reduce((a: number, b: number) => a * b, 1);

	// Two worked examples, drawn as mini boards with the matching cells lit. The
	// second is the same board with one reel split, so the two sit side by side
	// and the doubling is visible rather than described.
	//
	// Certification asked for these to be spelled out further: the old pair
	// captioned only the ways product ("2 x 2 x (2 x 2) = 16 ways"), which left
	// two things a reviewer could not confirm from the panel — whether a split
	// reel counts as a second reel for the 3/4/5 lookup, and how the ways figure
	// turns into money. Both examples now carry the whole calculation, and both
	// state the reel count explicitly so the two boards can be read against each
	// other: the split changes the WAYS line and nothing else.
	//
	// Cells are [reel, row] pairs. Reel index 2 in the split example is the cut
	// one: its two matching symbols each count twice, taking the product from
	// 2x2x2 = 8 to 2x2x4 = 16 while the reel count stays at 3.
	type Example = {
		title: string;
		lit: [number, number][];
		split: number[];
		// One entry per reel, aligned under the board: the number this reel
		// contributes to the ways product, or null where the run has ended.
		counts: (string | null)[];
		sum: string;
		ways: number;
	};
	// Rows 0-3: this board has four. An earlier version of these examples lit
	// row 4, which existed on the 5x5 board they were written for and does not
	// exist here — the cell simply never rendered and the arithmetic in the
	// caption stopped matching the picture.
	const LIT: [number, number][] = [
		[0, 1],
		[0, 3],
		[1, 0],
		[1, 2],
		[2, 1],
		[2, 3],
	];

	// The generated config types each symbol's paytable as a union of single-key
	// literals ({"5": n} | {"4": n} | {"3": n}), which does not assign to an index
	// signature. Widened ONCE here rather than at each use — the cast is the file's
	// one baseline type error and there is no reason to have two of it.
	const SYMBOLS = config.symbols as Record<
		string,
		{ paytable?: { [k: string]: number }[] | null }
	>;

	// The example symbol and its pay, read from the maths rather than written
	// into the copy — a worked example that quietly disagrees with the pay table
	// above it is worse than no example. K over three reels; EXAMPLE_KIND is the
	// reel count both boards share, which is the point they are making.
	const EXAMPLE_SYMBOL = 'L2';
	const EXAMPLE_KIND = 3;
	const examplePay = (() => {
		const entry = (SYMBOLS[EXAMPLE_SYMBOL]?.paytable ?? []).find(
			(e) => Object.keys(e)[0] === `${EXAMPLE_KIND}`,
		);
		return entry ? Number(Object.values(entry)[0]) : 0;
	})();
	const exampleLabel = SYMBOL_LABEL[EXAMPLE_SYMBOL] ?? EXAMPLE_SYMBOL;
	// Written out rather than left as "0.2 x 16": the product is the number the
	// player actually receives, and rounding keeps 0.2 x 16 from printing as
	// 3.2000000000000004.
	const exampleWin = (ways: number) => Number((examplePay * ways).toFixed(4));

	const examples: Example[] = [
		{
			title: `${exampleLabel} on reels 1–3, no Machete`,
			lit: LIT,
			split: [],
			counts: ['2', '2', '2', null, null],
			sum: '2 × 2 × 2',
			ways: 8,
		},
		{
			title: `The same board, Machete on reel 3`,
			lit: LIT,
			split: [2],
			// 4, not "2 x 2": the strip is one number per reel and the columns are
			// only ~22px wide. Why it is 4 is the outlined reel above it and the
			// caption beside it.
			counts: ['2', '2', '4', null, null],
			sum: '2 × 2 × 4',
			ways: 16,
		},
	];

	const isLit = (cells: [number, number][], reel: number, row: number) =>
		cells.some(([r, y]) => r === reel && y === row);

	const rows: PayRow[] = ORDER.filter((name) => name in config.symbols).map((name) => {
		const pays = (SYMBOLS[name]?.paytable ?? []).map((entry) => {
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
				{T.paysStart} shown as a multiple of {T.totalBet}, per winning way. Wins
				{T.winsDirection} on adjacent reels, in any position &mdash; there are no fixed lines.
			</p>
			<!--
				Certification read the chips ("5 x 5.2") as five SYMBOLS. They are
				five REELS, and in this game the two are not the same number: a
				Machete-split reel can contribute two of the symbol while still being
				one reel. The chips now say "reels" in full, and this note says what
				the count is and — just as importantly — what it is not.
			-->
			<p class="wp-note">
				Each chip below reads <b>reels</b> then <b>value</b>: the first number is how many
				<strong>adjacent reels</strong>, counted from reel 1, show the symbol &mdash; not how many
				of the symbol are on the board. <strong
					>A Machete-split reel is still one reel</strong
				>; the symbols it doubles raise the {T.ways}, not the reel count.
			</p>

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
									>{T.doesNotPay} &mdash; 3, 4 or 5 Scatters award {scatterSpins} Free Spins</span
								>
							{:else if row.name === 'W'}
								<span class="wp-special"
									>Substitutes for all symbols except Scatter and Machete &mdash; no win of its
									own</span
								>
							{:else if row.name === 'M'}
								<span class="wp-special"
									>Splits every symbol on its reel in two &mdash; no win of its own</span
								>
							{:else if row.pays.length}
								{#each row.pays as pay (pay.count)}
									<span class="wp-pay-chip">
										<b>{pay.count} {pay.count === 1 ? 'reel' : 'reels'}</b>
										<em>{pay.value}&times;</em>
									</span>
								{/each}
							{/if}
						</div>
					</div>
				{/each}
			</div>

			<h3 class="wp-lines-title">{waysCount.toLocaleString()} {T.waysUpper}</h3>
			<p class="wp-note">
				<!-- "beginning on reel 1", not "from reel 1": in social play winsDirection
				     already starts with "start from", and the two collided. -->
				A symbol counts wherever it lands. Wins {T.winsDirection}, beginning on reel 1, and the
				number of {T.ways} is the count on each reel <strong>multiplied together</strong>.
			</p>

			<!--
				Every win in this game is these three steps, so they are stated as
				three steps. Certification asked for a formula: step 3 is it. The
				split-reel rule is attached to step 2 rather than left to the Machete
				paragraph below, because step 2 is the only step it touches — which is
				the answer to "does a split count as two reels?".
			-->
			<ol class="wp-ways-steps">
				<li>
					<b>Reels.</b> Count the adjacent reels showing the symbol, starting at reel 1. That number
					&mdash; 3, 4 or 5 &mdash; is the one in the {T.payTable} above.
					<strong>A split reel counts as one reel</strong>, however many of the symbol it shows.
				</li>
				<li>
					<!-- "Ways" is the same word in social play (socialTerms.ts), so it is
					     written plainly here rather than case-juggled out of T. -->
					<b>Ways.</b> Multiply how many of the symbol sit on each of those reels. On a
					Machete-split reel <strong>each symbol counts twice</strong>.
				</li>
				<li>
					<b>Win.</b> The {T.payTable} value for that reel count &times; the {T.ways}, as a multiple
					of {T.totalBet}.
				</li>
			</ol>

			<div class="wp-ways-examples">
				{#each examples as ex (ex.title)}
					<figure class="wp-ways-example">
						<div class="wp-line-grid">
							{#each Array(ROWS) as _, row (row)}
								{#each Array(REELS) as _, reel (reel)}
									<span
										class="wp-cell"
										class:lit={isLit(ex.lit, reel, row)}
										class:split={ex.split.includes(reel)}
									></span>
								{/each}
							{/each}
						</div>
						<!-- What each reel contributes, printed under the reel it belongs
						     to, so the product in the caption can be traced to the board. -->
						<div class="wp-line-grid wp-count-strip" aria-hidden="true">
							{#each Array(REELS) as _, reel (reel)}
								<span class="wp-count" class:split={ex.split.includes(reel)}
									>{ex.counts[reel] ?? '–'}</span
								>
							{/each}
						</div>
						<figcaption>
							<span class="wp-ways-title">{ex.title}</span>
							<dl class="wp-ways-calc">
								<div>
									<dt>Reels</dt>
									<dd><b>{EXAMPLE_KIND}</b></dd>
								</div>
								<div>
									<dt>{T.ways}</dt>
									<dd>{ex.sum} = <b>{ex.ways}</b></dd>
								</div>
								<div>
									<dt>Win</dt>
									<dd>{examplePay} × {ex.ways} = <b>{exampleWin(ex.ways)}×</b></dd>
								</div>
							</dl>
						</figcaption>
					</figure>
				{/each}
			</div>

			<!--
				The sentence certification actually asked for, stated as its own
				call-out rather than inside a paragraph: the two boards above differ
				only in their WAYS line, and this says why in one line.
			-->
			<p class="wp-note wp-callout">
				Both boards above are <strong>3-reel wins</strong> and both {T.pay} the 3-reel value ({examplePay}&times;).
				The Machete on reel 3 did not make it a 4-reel win &mdash; <strong
					>a split reel is one reel</strong
				>, and what it doubles is the {T.ways}: 8 becomes 16, so the win doubles too.
			</p>

			<p class="wp-note">
				A <strong>Machete</strong> splits every symbol on its reel in two, so each of them counts
				twice. Because {T.ways} multiply across reels, one split reel doubles the {T.ways} of every
				combination running through it &mdash; two split reels quadruple them, and so on. The
				Machete itself does not {T.pay} and is not split, and at most one lands per reel. In Free
				Spins a split lasts to the end of the round.
			</p>

			<p class="wp-note">
				Wild substitutes for all symbols except Scatter and Machete, and does not {T.pay} as a
				symbol of its own. Only the highest win per symbol is {T.paid}. Max win is capped at
				{maxWin.toLocaleString()}&times;
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

	/* ─── payline diagrams: 15 mini 5x5 boards, lit cells in reel gold ─── */
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

	/* Two worked ways examples, side by side so the split's effect is a
	   comparison rather than a claim. Wider than the old payline thumbnails
	   because each carries a caption with the arithmetic. */
	.wp-ways-examples {
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem;
		margin: 0.7rem 0 0.2rem;
	}

	.wp-ways-example {
		flex: 1 1 13rem;
		margin: 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.4rem;
		padding: 0.6rem 0.5rem 0.5rem;
		border-radius: 0.6rem;
		background: rgba(255, 255, 255, 0.04);
		border: 1px solid rgba(255, 255, 255, 0.06);

		figcaption {
			display: flex;
			flex-direction: column;
			align-items: center;
			gap: 0.15rem;
			text-align: center;
		}
	}

	/* The grid's 5 columns are the REELS and stay correct at any row count —
	   20 cells flow into 5 columns as 4 rows. Only the width needs overriding:
	   4.2rem was sized for the old payline thumbnails, and these are figures
	   the player is meant to read. */
	.wp-ways-example .wp-line-grid {
		max-width: 7rem;
	}

	.wp-ways-title {
		font-size: 0.72rem;
		opacity: 0.75;
	}

	/* The per-reel contribution strip, sharing .wp-line-grid so its five columns
	   line up with the five reels above it rather than merely being near them. */
	.wp-count-strip {
		margin-top: 0.15rem;
	}

	.wp-count {
		font-size: 0.62rem;
		line-height: 1;
		text-align: center;
		color: rgba(255, 255, 255, 0.5);

		&.split {
			color: #ffd75e;
			font-weight: 700;
		}
	}

	/* Reels / Ways / Win, one per line with the label held to a fixed column so
	   the three read as a calculation rather than three sentences. */
	.wp-ways-calc {
		margin: 0.15rem 0 0;
		display: flex;
		flex-direction: column;
		gap: 0.1rem;
		font-size: 0.78rem;

		div {
			display: flex;
			align-items: baseline;
			gap: 0.35rem;
		}

		dt {
			flex: 0 0 2.6rem;
			text-align: right;
			opacity: 0.6;
			font-size: 0.68rem;
			text-transform: uppercase;
			letter-spacing: 0.04em;
		}

		dd {
			margin: 0;
			text-align: left;
		}

		b {
			color: #ffd75e;
		}
	}

	/* The three steps every win is made of. */
	.wp-ways-steps {
		margin: 0.5rem 0 0;
		padding-left: 1.15rem;
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
		font-size: 0.82rem;
		line-height: 1.45;
		color: rgba(255, 255, 255, 0.78);

		b {
			color: #ffd75e;
		}

		strong {
			color: rgba(255, 255, 255, 0.95);
		}
	}

	/* The one statement certification asked to be unmissable, so it is not left
	   as another paragraph of body copy. */
	.wp-callout {
		margin-top: 0.55rem;
		padding: 0.55rem 0.7rem;
		border-radius: 0.6rem;
		border: 1px solid rgba(255, 215, 94, 0.3);
		background: rgba(255, 215, 94, 0.07);
	}

	/* A split reel's cells: outlined rather than filled, so "counts twice" reads
	   as a property of the cell instead of a second win. */
	.wp-cell.split {
		box-shadow: inset 0 0 0 1px rgba(255, 215, 94, 0.65);
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

	.wp-pay-chip {
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
