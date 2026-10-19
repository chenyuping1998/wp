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
		B: 'gbB',
	};

	const SYMBOL_LABEL: Record<string, string> = {
		H1: 'Elixir Lantern',
		H2: 'Amethyst Crystal',
		H3: 'Crucible Tongs',
		H4: 'Flask Cart',
		L1: 'A',
		L2: 'K',
		L3: 'Q',
		L4: 'J',
		L5: '10',
		W: 'Alchemist Wild',
		S: 'Golden Bananas — Scatter',
		B: 'Reagent',
	};

	// keep high -> low ordering for readability
	const ORDER = ['W', 'H1', 'H2', 'H3', 'H4', 'L1', 'L2', 'L3', 'L4', 'L5', 'S', 'B'];

	const maxWin = config.betModes?.base?.max_win ?? 10000;

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
	// second is the same board with one reel blasted, so the two sit side by side
	// and the doubling is visible rather than described.
	//
	// Cells are [reel, row] pairs. Reel 2 in the second example is the blasted one:
	// its two matching symbols each count twice, taking the product from
	// 2x2x2 = 8 to 2x4x2 = 16.
	type Example = {
		title: string;
		lit: [number, number][];
		split: number[];
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
	// A blasted reel is entirely one symbol, so every row of it counts.
	const LIT_BLASTED: [number, number][] = [
		[0, 1],
		[0, 3],
		[1, 0],
		[1, 2],
		[2, 0],
		[2, 1],
		[2, 2],
		[2, 3],
	];
	// The two examples are the SAME board before and after a detonation, so the
	// blast's effect is a comparison the player can count rather than a claim.
	// Reel 3 filling means all four of its rows now match, which is why the third
	// factor goes from 2 to 4.
	const examples: Example[] = [
		{
			title: 'Three reels, no Reagent',
			lit: LIT,
			split: [],
			sum: '2 × 2 × 2',
			ways: 8,
		},
		{
			title: 'The same board, reel 3 transmuted',
			lit: LIT_BLASTED,
			split: [2],
			sum: '2 × 2 × 4',
			ways: 16,
		},
	];

	const isLit = (cells: [number, number][], reel: number, row: number) =>
		cells.some(([r, y]) => r === reel && y === row);

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
			<header class="al-head">
				<span class="al-kicker">Go Banalchemy</span>
				<h2>{T.payTableUpper}</h2>
			</header>
			<p class="wp-note">
				{T.paysStart} shown as a multiple of {T.totalBet}, per winning way. Wins
				{T.winsDirection} on adjacent reels, in any position &mdash; there are no fixed lines.
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
									>{T.doesNotPay} &mdash; 3, 4 or 5 Scatters award 8, 10 or 12 Free Spins</span
								>
							{:else if row.pays.length}
								{#each row.pays as pay (pay.count)}
									<span class="wp-pay-chip"><b>{pay.count}</b> &times; <em>{pay.value}</em></span>
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
						<figcaption>
							<span class="wp-ways-title">{ex.title}</span>
							<span class="wp-ways-sum">{ex.sum} = <b>{ex.ways}</b> {T.ways}</span>
						</figcaption>
					</figure>
				{/each}
			</div>

			<p class="wp-note">
				Each <strong>Reagent</strong> chooses the highest-value symbol already on its own reel
				and fills that reel with it, so every row counts. Because {T.ways} multiply across reels,
				a transmuted reel can turn a board with no combination at all into a winning one. In Free
				Spins the reaction widens, carrying its chosen symbol onto neighbouring reels. Where
				reactions overlap, the higher-value source symbol wins. A reaction can cover all five
				reels.
			</p>

			<p class="wp-note">
				Wild substitutes for all symbols except Scatter and Reagent, and does not {T.pay} as a
				symbol of its own. Only the highest win per symbol is {T.paid}. Max win is capped at
				{maxWin.toLocaleString()}&times;
				{T.totalBet}.
			</p>
		</div>
	</Popup>
{/if}

<style lang="scss">
	/* Go Banalchemy's palette (2026-10-17, review: "game info should be more
	   polished") — the same teal glass, copper trim and cream type as the game
	   rules and the bet bar. No shimmer, no hover glow: a reference sheet. */
	.wp-paytable {
		--teal-deep: #0b252b;
		--teal: #0f3438;
		--teal-lit: #14454a;
		--copper: #c58b55;
		--copper-lit: #e7b47c;
		--cream: #f4f4df;
		--mist: #c6e5d3;
		--mint: #5fd6a8;

		/* above the Popup's click-to-close layer, or it swallows scrolling */
		position: relative;
		z-index: 100;
		display: flex;
		flex-direction: column;
		gap: 0.8rem;
		width: min(38rem, 92vw);
		max-height: 82vh;
		overflow-y: auto;
		-webkit-overflow-scrolling: touch;
		overscroll-behavior: contain;
		padding: 0 0.15rem 0.5rem 0;
		color: var(--cream);
		text-align: center;
		animation: al-rise 0.35s cubic-bezier(0.22, 1, 0.36, 1) both;

		&::-webkit-scrollbar {
			width: 6px;
		}
		&::-webkit-scrollbar-thumb {
			background: var(--copper);
			border-radius: 3px;
		}

		h2 {
			margin: 0.2rem 0 0;
			font-size: clamp(1.5rem, 4.6vw, 1.95rem);
			color: var(--cream);
			text-shadow: 0 2px 0 #4a2e14;
		}
	}

	@keyframes al-rise {
		from {
			opacity: 0;
			transform: translateY(12px);
		}
		to {
			opacity: 1;
			transform: none;
		}
	}

	.al-head {
		padding-bottom: 0.6rem;
		border-bottom: 2px solid var(--copper);
	}

	.al-kicker {
		display: inline-block;
		padding: 0.18rem 0.7rem;
		border: 1px solid var(--copper);
		border-radius: 999px;
		color: var(--copper-lit);
		font-size: 0.68rem;
		letter-spacing: 0.18em;
		text-transform: uppercase;
	}

	.wp-note {
		margin: 0;
		font-size: 0.82rem;
		line-height: 1.55;
		color: rgba(244, 244, 223, 0.82);

		strong {
			color: var(--cream);
		}
	}

	/* the symbols: two columns of cards, art beside its pays */
	.wp-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.5rem;

		@media (max-width: 520px) {
			grid-template-columns: 1fr;
		}
	}

	.wp-row {
		display: flex;
		align-items: center;
		gap: 0.7rem;
		padding: 0.55rem 0.7rem;
		border-radius: 10px;
		background: linear-gradient(180deg, rgba(20, 69, 74, 0.85), rgba(15, 52, 56, 0.85));
		border: 1px solid rgba(197, 139, 85, 0.35);
		text-align: left;
		animation: al-rise 0.3s cubic-bezier(0.22, 1, 0.36, 1) both;
	}

	.wp-symbol {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.2rem;
		width: 4.6rem;
		flex-shrink: 0;
	}

	.wp-symbol-glow {
		width: 3.6rem;
		height: 3.6rem;

		img {
			width: 100%;
			height: 100%;
			object-fit: contain;
			filter: drop-shadow(0 3px 5px rgba(0, 0, 0, 0.45));
		}
	}

	.wp-symbol-name {
		font-size: 0.68rem;
		line-height: 1.2;
		text-align: center;
		color: var(--copper-lit);
	}

	.wp-pays {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		flex: 1;
	}

	.wp-pay-chip {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		padding: 0.16rem 0.55rem;
		border-radius: 5px;
		background: rgba(11, 37, 43, 0.75);
		border: 1px solid rgba(197, 139, 85, 0.25);
		font-size: 0.8rem;
		color: var(--mist);

		b {
			color: var(--cream);
		}

		em {
			font-style: normal;
			font-weight: 700;
			color: var(--cream);
		}
	}

	.wp-special {
		font-size: 0.78rem;
		line-height: 1.4;
		color: var(--mist);
	}

	/* the ways section */
	.wp-lines-title {
		margin: 0.5rem 0 0;
		padding-top: 0.6rem;
		border-top: 1px solid rgba(197, 139, 85, 0.3);
		font-size: 1.1rem;
		letter-spacing: 0.12em;
		color: var(--copper-lit);
	}

	/* the same board before and after a reaction, side by side */
	.wp-ways-examples {
		display: flex;
		flex-wrap: wrap;
		gap: 0.7rem;
		margin: 0.4rem 0 0.2rem;
	}

	.wp-ways-example {
		flex: 1 1 9rem;
		margin: 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.45rem;
		padding: 0.7rem 0.5rem 0.55rem;
		border-radius: 10px;
		background: rgba(15, 52, 56, 0.72);
		border: 1px solid rgba(197, 139, 85, 0.32);

		figcaption {
			display: flex;
			flex-direction: column;
			align-items: center;
			gap: 0.15rem;
		}

		.wp-line-grid {
			max-width: 7.5rem;
		}
	}

	.wp-line-grid {
		display: grid;
		grid-template-columns: repeat(5, 1fr);
		gap: 3px;
		width: 100%;
	}

	.wp-cell {
		aspect-ratio: 1;
		border-radius: 3px;
		background: rgba(244, 244, 223, 0.1);

		&.lit {
			background: linear-gradient(180deg, #8ff0c6, var(--mint));
		}

		/* a transmuted reel: outlined in copper, so the filled reel reads as a
		   property of the cell rather than a second win */
		&.split {
			box-shadow: inset 0 0 0 1.5px var(--copper-lit);
		}
	}

	.wp-ways-title {
		font-size: 0.74rem;
		color: var(--mist);
	}

	.wp-ways-sum {
		font-size: 0.84rem;

		b {
			color: var(--mint);
		}
	}
</style>
