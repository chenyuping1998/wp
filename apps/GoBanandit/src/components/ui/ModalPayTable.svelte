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
		P: 'gbP',
	};

	const SYMBOL_LABEL: Record<string, string> = {
		H1: 'The Boss',
		H2: 'The Safecracker',
		H3: 'The Lookout',
		H4: 'The Pickpocket',
		L1: 'A',
		L2: 'K',
		L3: 'Q',
		L4: 'J',
		L5: '10',
		W: 'Bandit — Wild',
		S: 'Vault — Scatter',
		P: 'Banana Sack',
	};

	// keep high -> low ordering for readability
	const ORDER = ['W', 'P', 'H1', 'H2', 'H3', 'H4', 'L1', 'L2', 'L3', 'L4', 'L5', 'S'];

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

	// One worked example, drawn as a mini board with the matching cells lit, so
	// the multiplication is something the player can count.
	type Example = { title: string; lit: [number, number][]; split: number[]; sum: string; ways: number };
	const examples: Example[] = [
		{
			title: 'Three reels',
			lit: [
				[0, 1],
				[0, 3],
				[1, 0],
				[1, 2],
				[2, 1],
				[2, 3],
			],
			split: [],
			sum: '2 × 2 × 2',
			ways: 8,
		},
	];
	const scatterSpins = Object.values(config.scatterSpins ?? {}).join(', ');

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
									<!-- the royals share one blank plate; the reels typeset the
									     letter on it at runtime, so the table has to as well -->
									{#if /^L\d$/.test(row.name)}
										<span class="wp-letter" aria-hidden="true">{row.label}</span>
									{/if}
								</div>
							{/if}
							<span class="wp-symbol-name">{row.label}</span>
						</div>
						<div class="wp-pays">
							{#if row.name === 'S'}
								<span class="wp-special"
									>{T.doesNotPay} &mdash; 3, 4 or 5 Scatters award {scatterSpins} Free Spins</span
								>
							{:else if row.name === 'P'}
								<span class="wp-special">Carries a value; every Bandit on the board collects every Sack</span>
							{:else if row.name === 'W'}
								<span class="wp-special">Substitutes and collects &mdash; reels 2 to 5</span>
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
				When a <strong>Bandit</strong> and a <strong>Banana Sack</strong> are on the board
				together, every Bandit collects the value of every Sack. In Free Spins the Bandit meter
				adds spins and multiplies collections as it fills.
			</p>

			<p class="wp-note">
				The Bandit Wild substitutes for all symbols except Scatter and Banana Sack, and does not {T.pay} as a
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

	/* Two worked ways examples, side by side so the blast's effect is a
	   comparison rather than a claim. Wider than the old payline thumbnails
	   because each carries a caption with the arithmetic. */
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
		max-width: 7rem;
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

	/* A blasted reel's cells: outlined rather than filled, so the filled reel reads
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
			background: radial-gradient(circle, rgba(210, 74, 44, 0.25) 0%, transparent 70%);
			opacity: 0;
			transition: opacity 0.3s ease;
		}
	}

	.wp-letter {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 2;
		font-family: var(--gb-display-font, sans-serif);
		font-size: 1.35rem;
		color: #1e1b1a;
		pointer-events: none;
	}

	.wp-row:hover .wp-symbol-glow {
		img {
			transform: scale(1.12);
			filter: drop-shadow(0 0 6px rgba(210, 74, 44, 0.45));
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

	/* Screenprint modal: keep pay values legible without gradients or halos. */
	.wp-paytable { background: #f2e8d0; border: 5px solid #1f5c4a; color: #1e1b1a; }
	.wp-paytable h2 { background: none; -webkit-text-fill-color: #1f5c4a; color: #1f5c4a; animation: none; filter: none; }
	.wp-paytable::-webkit-scrollbar-thumb { background: #1f5c4a; }
	.wp-row, .wp-row:hover, .wp-ways-example { background: #f2e8d0; border: 2px solid #1f5c4a; box-shadow: none; backdrop-filter: none; -webkit-backdrop-filter: none; transform: none; }
	.wp-cell { background: #d9d7c8; }
	.wp-cell.lit { background: #d24a2c; box-shadow: none; }
	.wp-cell.split { box-shadow: inset 0 0 0 2px #1e1b1a; }
	.wp-symbol-glow::after { display: none; }
	.wp-row:hover .wp-symbol-glow img { filter: none; transform: none; }
	.wp-lines-title, .wp-ways-sum b, .wp-pay-chip em, .wp-special { color: #d24a2c; background: none; -webkit-text-fill-color: currentColor; text-shadow: none; }
	.wp-symbol-name { color: #1e1b1a; }
	.wp-pay-chip, .wp-row:hover .wp-pay-chip { background: #f2e8d0; border: 1px solid #1f5c4a; box-shadow: none; }
	.wp-pay-chip b { color: #1f5c4a; }

	.wp-special {
		color: #d24a2c;
		font-weight: 700;
		text-shadow: none;
	}
</style>
