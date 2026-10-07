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
	};

	// THE NAMES MUST MATCH THE ART, and these did not: they were the previous
	// generation's mining set — a miner's lamp, an ore cart, crossed pickaxes —
	// against symbol files that draw a gas giant, a comet, a magnetic boot and a
	// life-support pack. A player reading this panel with the board open behind
	// it was being told the wrong name for every high symbol on it.
	//
	// The source of truth for what each file depicts is design/SYMBOL_PROMPTS.md,
	// which is what the art was generated from.
	const SYMBOL_LABEL: Record<string, string> = {
		H1: 'Gas Giant',
		H2: 'Comet',
		H3: 'Magnetic Boot',
		H4: 'Life-Support Pack',
		L1: 'A',
		L2: 'K',
		L3: 'Q',
		L4: 'J',
		L5: '10',
		W: 'Astronaut Helmet — Wild',
		S: 'Emergency Beacon — Scatter',
	};

	// keep high -> low ordering for readability. No 'B': that was the previous
	// generation's Dynamite, and this game has no such symbol — it survived here
	// only because the row builder filters on `name in config.symbols` and so
	// dropped it silently.
	const ORDER = ['W', 'H1', 'H2', 'H3', 'H4', 'L1', 'L2', 'L3', 'L4', 'L5', 'S'];

	const maxWin = config.betModes?.base?.max_win ?? 15000;

	// The Scatter row states the trigger table, and states it from config —
	// sync_math_config lifts scatterSpins straight out of the maths'
	// freespin_triggers. Written as two lists rather than one so the sentence
	// reads "3, 4 or 5 Scatters award 8, 10 or 12 Free Spins" and the reader
	// pairs them off positionally, which is how the maths pairs them.
	const scatterEntries = Object.entries(config.scatterSpins ?? { 3: 8, 4: 10, 5: 12 }).sort(
		(a, b) => Number(a[0]) - Number(b[0]),
	);
	const asList = (parts: string[]) =>
		parts.length < 2 ? (parts[0] ?? '') : `${parts.slice(0, -1).join(', ')} or ${parts.at(-1)}`;
	const scatterCounts = asList(scatterEntries.map(([count]) => count));
	const scatterAwards = asList(scatterEntries.map(([, spins]) => String(spins)));

	const imgSrc = (name: string) => {
		const key = SYMBOL_ASSET[name];
		const asset = key ? (assets[key] as { src?: string } | undefined) : undefined;
		return asset?.src ?? '';
	};

	// This is a WAYS game — config.paylines does not exist. Where gen-1 and gen-2
	// drew fifteen mini boards with one lit cell per reel, the thing worth showing
	// here is how the ways COUNT is arrived at, because that is the number a
	// player cannot work out by looking at the board.
	//
	// Read from config, not typed: the worked examples draw a mini board, and a
	// hard-coded row count would keep drawing the old shape after the board
	// changed — a diagram that quietly disagrees with the game.
	const REELS = config.numReels ?? 5;
	const BASE_ROWS = config.growth?.baseRows ?? 4;
	const MAX_ROWS = config.growth?.maxRows ?? 6;
	// The BASELINE board's ways, which is the headline over the examples. It is
	// not the biggest number this game reaches — see fullWays — but it is the one
	// every round starts from.
	const waysCount = (config.numRows ?? []).reduce((a: number, b: number) => a * b, 1);
	const fullWays = Math.pow(MAX_ROWS, REELS);

	// NO THEORETICAL CEILING IS QUOTED ANYWHERE ON THIS PANEL, and that is a
	// decision with a measurement behind it.
	//
	// It is tempting to head a growing ways game with the biggest arithmetic it
	// admits. In Free Spins every cell of a stretched reel counts twice, so a
	// full board would be (2 x 6)^5 = 248,832 — and this panel said so for a
	// while. That number describes a board on which all thirty cells are the
	// same symbol, and nothing in this game forces that. It is the same class of
	// claim game_config.py rejects when it refuses to advertise
	// 7,776 ways x 5.2 = 40,435x as a max win.
	//
	// Measured on the published books, largest ways figure on a single win:
	//
	//     base game        288   (20,000 books)
	//     free spins    57,600   (20,000 books)
	//
	// So the heading is the BOARD's range — that is what a ways heading means,
	// and it is a shape the player can literally count — with the doubling
	// stated as its own rule below. The 57,600 also settles what the heading
	// cannot: the feature plainly goes past 7,776, which is only possible
	// because the doubling is real.

	// THREE worked examples, drawn as mini boards on the same bottom line.
	//
	// It was two, and they showed the previous generation's Dynamite: a board,
	// then the same board with one reel overwritten by a single symbol. Nothing
	// in this game does that.
	//
	// What this game does has two halves that are easy to run together, so they
	// get one example each and the third is deliberately the SAME board as the
	// second:
	//
	//   1. the baseline — the arithmetic on its own
	//   2. reel 1 stretched to six, so it holds one more matching symbol. This is
	//      the half that happens in the BASE GAME too.
	//   3. the same stretched board in FREE SPINS, where a stretched reel's cells
	//      each count twice. Same picture, different sum — which is the only
	//      honest way to show that the doubling changes nothing about which
	//      boards win, only what they pay.
	//
	// Cells are [reel, rowFromBottom] pairs, counted from the BOTTOM because the
	// board is bottom-anchored and grows upward (see reelYOffset in
	// game/constants) — so a reel's row 0 is the same cell whatever its height.
	type Example = {
		title: string;
		/** each reel's height, so the silhouette matches the board it describes */
		rows: number[];
		lit: [number, number][];
		/** free spins: a reel standing above the baseline counts every cell twice */
		doubled: boolean;
	};

	// The same three matching symbols in all three examples. Reels 3 and 4 hold
	// none, which is why every example is a three-of-a-kind — ways pay from reel
	// 1 and stop at the first reel that does not extend the run.
	const LIT: [number, number][] = [
		[0, 0],
		[0, 2],
		[1, 1],
		[1, 3],
		[2, 0],
		[2, 2],
	];
	// The stretched board holds one more of the same symbol, in one of the two
	// cells the stretch just added at the top of reel 1.
	const LIT_TALL: [number, number][] = [...LIT, [0, 4]];

	const flat = Array(REELS).fill(BASE_ROWS);
	const tall = [MAX_ROWS, ...Array(REELS - 1).fill(BASE_ROWS)];

	const examples: Example[] = [
		{ title: 'The baseline board', rows: flat, lit: LIT, doubled: false },
		{ title: `Reel 1 stretched to ${MAX_ROWS}`, rows: tall, lit: LIT_TALL, doubled: false },
		{ title: 'The same board, in Free Spins', rows: tall, lit: LIT_TALL, doubled: true },
	];

	const isLit = (cells: [number, number][], reel: number, row: number) =>
		cells.some(([r, y]) => r === reel && y === row);

	// THE ARITHMETIC IS COMPUTED FROM THE PICTURE, never typed beside it.
	//
	// The old examples carried their sum and total as strings, and one of them
	// had already drifted: the caption counted a cell in a row the board no
	// longer had. Deriving both from the same `lit` array the grid renders means
	// the caption cannot disagree with the diagram it captions.
	//
	// Ways stop at the first reel with no match, which is what the `break` is —
	// a matching symbol on reel 5 with reel 4 empty pays nothing at all.
	const scoreOf = (ex: Example) => {
		const factors: number[] = [];
		for (let reel = 0; reel < REELS; reel++) {
			const count = ex.lit.filter(([r]) => r === reel).length;
			if (count === 0) break;
			factors.push(count * (ex.doubled && ex.rows[reel] > BASE_ROWS ? 2 : 1));
		}
		return { sum: factors.join(' × '), ways: factors.reduce((a, b) => a * b, 1) };
	};

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
								<!-- Counts and awards both come from config.scatterSpins, which
								     sync_math_config lifts out of the maths' freespin_triggers.
								     Typed here they would be a second copy of the trigger table
								     to keep in step with the rules page and the game. -->
								<span class="wp-special"
									>{T.doesNotPay} &mdash; {scatterCounts} Scatters award {scatterAwards} Free
									Spins</span
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

			<h3 class="wp-lines-title">
				{waysCount.toLocaleString()} &ndash; {fullWays.toLocaleString()} {T.waysUpper}
			</h3>
			<p class="wp-note">
				<!-- "beginning on reel 1", not "from reel 1": in social play winsDirection
				     already starts with "start from", and the two collided. -->
				A symbol counts wherever it lands. Wins {T.winsDirection}, beginning on reel 1, and the
				number of {T.ways} is the count on each reel <strong>multiplied together</strong>. The
				board starts at {BASE_ROWS} rows on every reel and the {T.ways} grow with it &mdash; a
				full {MAX_ROWS}&times;{REELS} board is {fullWays.toLocaleString()}
				{T.ways}. In Free Spins a stretched reel counts twice on top of that, so the figure
				shown on a win can be higher again.
			</p>

			<div class="wp-ways-examples">
				{#each examples as ex (ex.title)}
					{@const score = scoreOf(ex)}
					<figure class="wp-ways-example">
						<!--
							Drawn MAX_ROWS deep whatever the example's reels hold, with the
							cells a short reel does not have left empty at the TOP. That is
							not a rendering convenience: the board is bottom-anchored and
							grows upward, so a diagram that centred the short reels or grew
							them downward would contradict the first spin the player sees.
						-->
						<div class="wp-line-grid">
							{#each Array(MAX_ROWS) as _, displayRow (displayRow)}
								{#each Array(REELS) as _, reel (reel)}
									{@const row = MAX_ROWS - 1 - displayRow}
									{@const exists = row < ex.rows[reel]}
									<span
										class="wp-cell"
										class:void={!exists}
										class:lit={exists && isLit(ex.lit, reel, row)}
										class:grown={exists && row >= BASE_ROWS}
									></span>
								{/each}
							{/each}
						</div>
						<figcaption>
							<span class="wp-ways-title">{ex.title}</span>
							<span class="wp-ways-sum">{score.sum} = <b>{score.ways}</b> {T.ways}</span>
						</figcaption>
					</figure>
				{/each}
			</div>

			<p class="wp-note">
				A <strong>Gravity Charge</strong> rides on an ordinary symbol &mdash; that symbol
				{T.pays} exactly as it always would. When the reels stop, each charge pulls one reel
				<strong>one row taller</strong>, from {BASE_ROWS} rows up to {MAX_ROWS}, filling the
				leftmost reel that is not yet full before moving to the next. The new rows appear at the
				top and are dealt fresh symbols. A taller reel is more chances for a symbol to be there
				at all, and because {T.ways} multiply across reels, one more matching symbol on reel 1
				multiplies every combination running through it.
			</p>

			<p class="wp-note">
				In the base game the reels return to {BASE_ROWS} rows on the next spin. <strong
					>In Free Spins they stay tall for the whole round</strong
				>, and every cell on a reel standing above {BASE_ROWS} rows
				<strong>counts twice</strong> &mdash; so a stretched reel doubles its contribution to the
				{T.ways} on top of the rows it gained. A reel that is doubling is lit and carries an
				<strong>x2</strong> plate at the top, from its very first extra row.
			</p>

			<p class="wp-note">
				Wild substitutes for all symbols except Scatter, and does not {T.pay} as a symbol of its
				own. A Gravity Charge never rides on a Wild or a Scatter. Only the highest win per symbol
				is {T.paid}. Max win is capped at {maxWin.toLocaleString()}&times;
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

	/* ─── the ways examples ─── */
	.wp-lines-title {
		margin: 0.5rem 0 0;
		font-size: 1.05rem;
		font-weight: 800;
		letter-spacing: 0.14em;
		color: #ffd75e;
	}

	/* THREE worked ways examples, side by side, so the stretch and the Free
	   Spins doubling are each a comparison the reader can count rather than a
	   claim they have to take. Wider than the old payline thumbnails because
	   each carries a caption with the arithmetic. */
	.wp-ways-examples {
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem;
		margin: 0.7rem 0 0.2rem;
	}

	.wp-ways-example {
		flex: 1 1 9rem;
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
		max-width: 7.5rem;
	}

	.wp-ways-title {
		font-size: 0.72rem;
		opacity: 0.75;
	}

	.wp-ways-sum {
		font-size: 0.82rem;

		b {
			color: #ffd75e;
		}
	}

	/* A cell a short reel does not have. Invisible, but it still occupies its
	   grid track — which is the whole point: the reels stand on a shared bottom
	   line and the missing rows are the gap ABOVE them, so the silhouette of the
	   diagram is the silhouette of the board. */
	.wp-cell.void {
		background: none;
	}

	/* The rows the stretch added. Outlined in the same hot orange the game uses
	   on a stretched reel, so "these two are new" is a property of the cells
	   rather than something the caption has to claim. A lit cell keeps its gold
	   fill and takes the outline on top, because a new cell that happens to hold
	   a matching symbol is both things at once. */
	.wp-cell.grown {
		box-shadow: inset 0 0 0 1px rgba(255, 140, 26, 0.85);
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
