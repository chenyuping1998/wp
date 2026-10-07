<script lang="ts">
	import { Popup } from 'components-shared';
	import { zIndex } from 'constants-shared/zIndex';
	import { stateModal } from 'state-shared';

	import config from '../../game/config';
	import assets from '../../game/assets';
	import { socialTerms } from '../../game/socialTerms';

	// Social play forbids gambling terminology; the shared map lives in
	// game/socialTerms so this page and the rules page cannot drift apart.
	const T = socialTerms();

	type PayTier = { label: string; value: number };
	type PayRow = { name: string; img: string; label: string; tiers: PayTier[] };

	const SYMBOL_ASSET: Record<string, keyof typeof assets> = {
		H1: 'cyH1',
		H2: 'cyH2',
		H3: 'cyH3',
		H4: 'cyH4',
		L1: 'cyL1',
		L2: 'cyL2',
		L3: 'cyL3',
		L4: 'cyL4',
		S: 'cyS',
		M: 'cyM',
	};

	// Rank is carried by colour temperature: the high four are warm (crimson,
	// gold, magenta, orange) and carry a gold rim, the low four are cool and a
	// full step darker. If the artwork is replaced, these names have to move with
	// it — they are what a player matches the picture to.
	const SYMBOL_LABEL: Record<string, string> = {
		H1: 'Muscle Car',
		H2: 'Grand Piano',
		H3: 'Jukebox',
		H4: 'Gumball Machine',
		L1: 'Oil Drum',
		L2: 'Shopping Trolley',
		L3: 'Toilet',
		L4: 'Traffic Cone',
		S: 'The Crusher — Scatter',
		M: 'Nitrogen Tank — Multiplier',
	};

	// No W: this game has no wild. See games/CrusherYard/readme.txt.
	const ORDER = ['H1', 'H2', 'H3', 'H4', 'L1', 'L2', 'L3', 'L4', 'S', 'M'];

	const maxWin = config.betModes?.base?.max_win ?? 15000;

	const imgSrc = (name: string) => {
		const key = SYMBOL_ASSET[name];
		const asset = key ? (assets[key] as { src?: string } | undefined) : undefined;
		return asset?.src ?? '';
	};

	// The math expands the paytable to one entry per exact count, 8 through 36,
	// with long runs of the same value. Listing 29 identical chips per symbol would
	// be unreadable, so consecutive equal values are collapsed back into the bands
	// the paytable was actually written as. (The board holds 30 cells, so the
	// entries above that exist only because the tier was written open-ended.)
	const collapseTiers = (pays: { count: number; value: number }[]): PayTier[] => {
		const sorted = [...pays].sort((a, b) => a.count - b.count);
		const tiers: { from: number; to: number; value: number }[] = [];
		for (const pay of sorted) {
			const last = tiers[tiers.length - 1];
			if (last && last.value === pay.value && pay.count === last.to + 1) last.to = pay.count;
			else tiers.push({ from: pay.count, to: pay.count, value: pay.value });
		}
		const top = sorted[sorted.length - 1]?.count ?? 0;
		return tiers.map((tier) => ({
			// The last band runs past what the board can hold, so it is shown
			// open-ended rather than quoting a 36 nobody will ever see.
			label:
				tier.from === tier.to
					? `${tier.from}`
					: tier.to >= top
						? `${tier.from}+`
						: `${tier.from}-${tier.to}`,
			value: tier.value,
		}));
	};

	const rows: PayRow[] = ORDER.filter((name) => name in config.symbols).map((name) => {
		const symbol = (config.symbols as Record<string, { paytable?: { [k: string]: number }[] | null }>)[
			name
		];
		const pays = (symbol.paytable ?? []).map((entry) => {
			const [count, value] = Object.entries(entry)[0];
			return { count: Number(count), value: Number(value) };
		});
		return { name, img: imgSrc(name), label: SYMBOL_LABEL[name] ?? name, tiers: collapseTiers(pays) };
	});

	// Illustrative counts, NOT shapes.
	//
	// The cluster game this panel came from showed three connected blobs, because
	// there the shape was the rule. Here the shape is irrelevant and showing one
	// would teach the wrong thing — a player who reads "these cells must touch"
	// off a diagram will not recognise their own winning board. So each example is
	// a deliberately scattered set at the count that opens a band, and the caption
	// is the count rather than a shape name.
	const EXAMPLE_COLS = 6;
	const EXAMPLE_ROWS = 5;
	const EXAMPLES: { title: string; cells: [number, number][] }[] = [
		{
			title: '8 anywhere',
			cells: [[0, 1], [1, 3], [2, 0], [2, 4], [3, 2], [4, 1], [5, 3], [5, 0]],
		},
		{
			title: '11 anywhere',
			cells: [
				[0, 0], [0, 3], [1, 1], [1, 4], [2, 2], [3, 0], [3, 3], [4, 1], [4, 4], [5, 2], [5, 0],
			],
		},
		{
			title: '14 anywhere',
			cells: [
				[0, 0], [0, 2], [0, 4], [1, 1], [1, 3], [2, 0], [2, 2], [2, 4], [3, 1], [3, 3], [4, 0],
				[4, 2], [4, 4], [5, 1],
			],
		},
	];
	const inShape = (cells: [number, number][], reel: number, row: number) =>
		cells.some(([r, c]) => r === reel && c === row);
</script>
{#if stateModal.modal?.name === 'payTable'}
	<Popup zIndex={zIndex.modal} onclose={() => (stateModal.modal = null)}>
		<div class="wp-paytable">
			<h2>{T.payTableTitle}</h2>
			<p class="wp-note">
				Values shown as a multiple of the {T.totalBet}. 8 or more of the same symbol anywhere on the
				6&times;5 board {T.pay} &mdash; they do not have to touch, and position does not matter.
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
								<span class="wp-special">
									Does not {T.pay} &mdash; 3, 4, 5 or 6 Crushers award 15, 18, 22 or 25 Free Spins
								</span>
							{:else if row.name === 'M'}
								<span class="wp-special">
									Does not {T.pay} &mdash; Free Spins only. Tanks left on the board at the end of a
									spin are added together and multiply that spin
								</span>
							{:else if row.tiers.length}
								{#each row.tiers as tier (tier.label)}
									<span class="wp-pay-chip"><b>{tier.label}</b><i>:</i><em>{tier.value}</em></span>
								{/each}
							{:else}
								<!--
									Reached only if a symbol arrives with no paytable and no case above.
									design/sync_math_config.mjs rejects unknown symbols, so this is a last
									resort rather than an expected branch.
								-->
								<span class="wp-special">Special symbol</span>
							{/if}
						</div>
					</div>
				{/each}
			</div>

			<h3 class="wp-lines-title">{T.howSymbolsPay}</h3>
			<p class="wp-note">
				Count the symbol, not its shape. 8 or more of the same symbol anywhere on the board {T.pay};
				the more there are, the higher the band it {T.pays} from. The examples below are scattered on
				purpose &mdash; touching makes no difference either way.
			</p>

			<div class="wp-lines">
				{#each EXAMPLES as example (example.title)}
					<div class="wp-line">
						<div
							style="display:grid;grid-template-columns:repeat({EXAMPLE_COLS},1fr);gap:2px;width:100%"
						>
							{#each Array(EXAMPLE_ROWS) as _unusedRow, row (row)}
								{#each Array(EXAMPLE_COLS) as _unusedReel, reel (reel)}
									<span class="wp-cell" class:lit={inShape(example.cells, reel, row)}></span>
								{/each}
							{/each}
						</div>
						<span class="wp-line-id">{example.title}</span>
					</div>
				{/each}
			</div>

			<p class="wp-note">
				Winning symbols are crushed and the ones above fall down to replace them; if that leaves 8 or
				more of a symbol again it {T.pays} too, and the chain continues until nothing more {T.pays}.
				During Free Spins the pressure gauge above the board multiplies every {T.payout}, and Nitrogen
				Tanks left on the board multiply the whole spin once it has finished chaining. Max win is
				capped at {maxWin.toLocaleString()}&times; {T.totalBet}.
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

		/* Cluster size and payout used to sit side by side with only a space
		   between them, which read as one number split in two. */
		i {
			color: rgba(255, 233, 138, 0.55);
			font-style: normal;
			font-weight: 700;
			margin: 0 0.1rem;
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
