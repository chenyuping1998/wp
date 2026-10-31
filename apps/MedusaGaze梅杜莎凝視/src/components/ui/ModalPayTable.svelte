<script lang="ts">
	import { stateModal } from 'state-shared';

	import TempleInfoShell from './TempleInfoShell.svelte';
	import config from '../../game/config';
	import assets from '../../game/assets';
	import { socialTerms } from '../../game/socialTerms';

	// Social play forbids gambling terminology; the shared map lives in
	// game/socialTerms so this page and the rules page cannot drift apart.
	const T = socialTerms();

	type PayTier = { label: string; value: number };
	type PayRow = { name: string; img: string; label: string; tiers: PayTier[] };

	const SYMBOL_ASSET: Record<string, keyof typeof assets> = {
		H1: 'mgH1',
		H2: 'mgH2',
		H3: 'mgH3',
		H4: 'mgH4',
		H5: 'mgH5',
		L1: 'mgL1',
		L2: 'mgL2',
		L3: 'mgL3',
		L4: 'mgL4',
		S: 'mgS',
	};

	// What a player matches the picture to (MEDUSA_美術需求單 §4). If the art
	// changes, these names move with it.
	const SYMBOL_LABEL: Record<string, string> = {
		H1: 'Golden Serpent Crown',
		H2: 'Stone Helmet',
		H3: 'Golden Lyre',
		H4: 'Amphora',
		H5: 'Laurel Wreath',
		L1: 'Omega Gem',
		L2: 'Sigma Gem',
		L3: 'Phi Gem',
		L4: 'Psi Gem',
		S: 'Aegis — Scatter',
	};

	// No W: a wild in a pay-anywhere game joins every symbol's count at once.
	const ORDER = ['H1', 'H2', 'H3', 'H4', 'H5', 'L1', 'L2', 'L3', 'L4', 'S'];

	const maxWin = config.betModes?.base?.max_win ?? 15000;
	const fs = config.freeSpins;
	const scatterPays = Object.entries(config.scatterPays)
		.map(([count, value]) => ({ count: Number(count), value: Number(value) }))
		.sort((a, b) => a.count - b.count);
	const topScatter = scatterPays[scatterPays.length - 1]?.count ?? 6;

	const imgSrc = (name: string) => {
		const key = SYMBOL_ASSET[name];
		const asset = key ? (assets[key] as { src?: string } | undefined) : undefined;
		return asset?.src ?? '';
	};

	// The math expands the paytable to one entry per exact count, 8 through 36,
	// with long runs of the same value. Consecutive equal values are collapsed
	// back into the bands the paytable was written as, and the last band is shown
	// open-ended.
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
		const symbol = (config.symbols as unknown as Record<string, { paytable?: { [k: string]: number }[] | null }>)[
			name
		];
		const pays = (symbol.paytable ?? []).map((entry) => {
			const [count, value] = Object.entries(entry)[0];
			return { count: Number(count), value: Number(value) };
		});
		return { name, img: imgSrc(name), label: SYMBOL_LABEL[name] ?? name, tiers: collapseTiers(pays) };
	});

	// Illustrative counts, NOT shapes: each example is a deliberately scattered
	// set at the count that opens a band, because touching makes no difference.
	const EXAMPLE_COLS = 6;
	const EXAMPLE_ROWS = 6;
	const EXAMPLES: { title: string; cells: [number, number][] }[] = [
		{
			title: '8 anywhere',
			cells: [[0, 1], [1, 4], [2, 0], [2, 5], [3, 2], [4, 1], [5, 3], [5, 5]],
		},
		{
			title: '10 anywhere',
			cells: [[0, 0], [0, 3], [1, 1], [1, 5], [2, 2], [3, 0], [3, 4], [4, 1], [4, 5], [5, 2]],
		},
		{
			title: '12 anywhere',
			cells: [
				[0, 0], [0, 2], [0, 4], [1, 1], [1, 3], [2, 0], [2, 5], [3, 2], [3, 4], [4, 1], [4, 3], [5, 5],
			],
		},
	];
	const inShape = (cells: [number, number][], reel: number, row: number) =>
		cells.some(([r, c]) => r === reel && c === row);
</script>

{#if stateModal.modal?.name === 'payTable'}
	<TempleInfoShell view="pays" chapters={[{id:'symbols',label:'The treasures'},{id:'examples',label:'Match anywhere'},{id:'special',label:'Medusa’s gift'}]}>
		<div class="wp-paytable">
			<span class="temple-eyebrow">TREASURES OF THE TEMPLE</span><h2>{T.payTableTitle}</h2>
			<p class="wp-note">
				Values shown as a multiple of the {T.totalBet}. 8 or more of the same symbol anywhere on the
				6&times;6 board {T.pay} &mdash; they do not have to touch, and position does not matter.
			</p>

			<div class="wp-grid" data-chapter="symbols">
				{#each rows as row, i (row.name)}
					<div class="wp-row" style="animation-delay: {i * 40}ms">
						<div class="wp-symbol">
							{#if row.img}
								<img src={row.img} alt={row.label} />
							{/if}
							<span class="wp-symbol-name">{row.label}</span>
						</div>
						<div class="wp-pays">
							{#if row.name === 'S'}
								{#each scatterPays as pay (pay.count)}
									<span class="wp-pay-chip"
										><b>{pay.count === topScatter ? `${pay.count}+` : pay.count}</b><i>:</i><em
											>{pay.value}×</em
										></span
									>
								{/each}
								<span class="wp-special">
									{fs.trigger}+ anywhere award {fs.spins} Free Spins
								</span>
							{:else if row.tiers.length}
								{#each row.tiers as tier (tier.label)}
									<span class="wp-pay-chip"><b>{tier.label}</b><i>:</i><em>{tier.value}×</em></span>
								{/each}
							{:else}
								<!-- design/sync_math_config.mjs rejects unknown symbols; last resort only -->
								<span class="wp-special">Special symbol</span>
							{/if}
						</div>
					</div>
				{/each}
			</div>

			<h3 class="wp-section-title" data-chapter="examples">{T.howSymbolsPay}</h3>
			<p class="wp-note">
				Count the symbol, not its shape. 8 or more of the same symbol anywhere on the board {T.pay};
				the more there are, the higher the band it {T.pays} from.
			</p>

			<div class="wp-examples">
				{#each EXAMPLES as example (example.title)}
					<div class="wp-example">
						<div class="wp-example-grid" style="grid-template-columns:repeat({EXAMPLE_COLS},1fr)">
							{#each Array(EXAMPLE_ROWS) as _unusedRow, row (row)}
								{#each Array(EXAMPLE_COLS) as _unusedReel, reel (reel)}
									<span class="wp-cell" class:lit={inShape(example.cells, reel, row)}></span>
								{/each}
							{/each}
						</div>
						<span class="wp-example-id">{example.title}</span>
					</div>
				{/each}
			</div>

			<h3 class="wp-section-title" data-chapter="special">MEDUSA'S MULTIPLIER</h3>
			<p class="wp-note">
				Winning symbols turn to stone and crumble, and the symbols above fall to replace them; the
				chain continues until nothing more {T.pays}. When it ends, Medusa may throw a multiplier. It
				only counts if that spin had a win: base game values are
				{config.medusa.baseValues.join('×, ')}×, and the whole spin's win is multiplied by it. In Free
				Spins she can throw up to {config.medusa.freeMaxThrows} at once, values up to
				{Math.max(...config.medusa.freeValues)}×; they are added to a running total that multiplies
				the spin. Aegis {T.payout}s are never multiplied. Max win is capped at
				{maxWin.toLocaleString()}&times; {T.totalBet}.
			</p>
		</div>
	</TempleInfoShell>
{/if}

<style lang="scss">
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

	@keyframes rowIn {
		from {
			opacity: 0;
			transform: translateX(-10px);
		}
		to {
			opacity: 1;
			transform: translateX(0);
		}
	}

	/* Flat sitcom-cartoon panel: marble paper, one ink for every outline, coral
	   headings. No gradients and no glow, the same rules the game art follows. */
	.wp-paytable {
		/* above the Popup's full-screen click-to-close layer (z-index 2), or the
		   overlay swallows wheel and touch events and blocks scrolling */
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
		background: #efe8d8;
		border: 5px solid #2a1f24;
		border-radius: 18px;
		color: #2a1f24;
		text-align: center;
		animation: slideUp 0.35s cubic-bezier(0.22, 1, 0.36, 1) both;

		&::-webkit-scrollbar {
			width: 6px;
		}
		&::-webkit-scrollbar-thumb {
			background: #2a1f24;
			border-radius: 4px;
		}

		h2 {
			margin: 0 0 0.25rem;
			font-size: 1.75rem;
			letter-spacing: 0.08em;
			color: #2a1f24;
		}
	}

	.wp-note {
		margin: 0;
		font-size: 0.84rem;
		line-height: 1.5;
		opacity: 0.85;
	}

	.wp-grid {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
	}

	.wp-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.75rem;
		padding: 0.5rem 0.8rem;
		border-radius: 0.75rem;
		background: #fffaf0;
		border: 2px solid #2a1f24;
		animation: rowIn 0.3s cubic-bezier(0.22, 1, 0.36, 1) both;
	}

	.wp-symbol {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		min-width: 10rem;
		text-align: left;

		img {
			width: 3rem;
			height: 3rem;
			object-fit: contain;
		}
	}

	.wp-symbol-name {
		font-size: 0.92rem;
		font-weight: 700;
	}

	.wp-pays {
		display: flex;
		gap: 0.45rem;
		flex-wrap: wrap;
		justify-content: flex-end;
		font-size: 0.9rem;
	}

	.wp-pay-chip {
		display: inline-flex;
		align-items: center;
		gap: 0.2rem;
		padding: 0.18rem 0.5rem;
		border-radius: 0.5rem;
		background: #efe8d8;
		border: 2px solid #2a1f24;

		b {
			font-weight: 800;
			color: #c85a4a;
		}

		/* count and value must not read as one number split in two */
		i {
			font-style: normal;
			font-weight: 700;
			opacity: 0.5;
			margin: 0 0.1rem;
		}

		em {
			font-style: normal;
			font-weight: 700;
		}
	}

	.wp-special {
		flex-basis: 100%;
		text-align: right;
		font-size: 0.82rem;
		font-weight: 700;
		color: #c85a4a;
	}

	.wp-section-title {
		margin: 0.5rem 0 0;
		font-size: 1.05rem;
		letter-spacing: 0.1em;
		color: #c85a4a;
	}

	.wp-examples {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(5rem, 1fr));
		gap: 0.6rem;
	}

	.wp-example {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.3rem;
		padding: 0.45rem 0.35rem 0.35rem;
		border-radius: 0.6rem;
		background: #fffaf0;
		border: 2px solid #2a1f24;
	}

	.wp-example-grid {
		display: grid;
		gap: 2px;
		width: 100%;
		max-width: 5rem;
	}

	.wp-cell {
		aspect-ratio: 1;
		border-radius: 2px;
		background: rgba(42, 31, 36, 0.12);

		&.lit {
			background: #1e4950;
		}
	}

	.wp-example-id {
		font-size: 0.72rem;
		font-weight: 700;
	}

 .wp-paytable{box-sizing:border-box;width:100%;max-width:none;max-height:none;overflow:visible;padding:26px;background:transparent;border:0;border-radius:0;box-shadow:none;animation:none;color:#173e43;gap:18px;text-align:left}.wp-paytable h2{font:400 26px var(--gb-display-font);color:#173e43;text-align:left;margin:0;letter-spacing:.02em}.temple-eyebrow{font-size:10px;letter-spacing:.18em;color:#8d6b26;font-weight:800}.wp-note{font-size:14px;line-height:1.7;opacity:1;color:#425950}.wp-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;scroll-margin-top:18px}.wp-row{display:grid;grid-template-columns:100px minmax(0,1fr);padding:16px;gap:15px;background:#fffaf0;border:1px solid #cbbd9a;border-radius:10px;box-shadow:0 3px 0 #ded4bc;animation:none}.wp-symbol{display:flex;flex-direction:column;align-items:center;min-width:0;gap:8px;text-align:center}.wp-symbol img{width:74px;height:74px}.wp-symbol-name{font-size:12px;color:#173e43;line-height:1.4}.wp-pays{justify-content:flex-start;gap:6px}.wp-pay-chip{display:flex;justify-content:space-between;min-width:110px;padding:7px 9px;box-sizing:border-box;font-size:14px;border:1px solid #c8b994;border-radius:5px;background:#ece4d0;gap:10px}.wp-pay-chip b{color:#35574e;font-size:12px}.wp-pay-chip em{color:#173e43;font-size:17px;font-variant-numeric:tabular-nums}.wp-pay-chip i{display:none}.wp-special{font-size:12px;line-height:1.6;color:#846321;text-align:left}.wp-section-title{font:400 18px var(--gb-display-font);color:#173e43;letter-spacing:.02em;scroll-margin-top:18px}.wp-example{border:1px solid #c9bc99;background:#fffbf2;border-radius:8px;padding:14px}.wp-example-id{font-size:12px;margin-top:6px;color:#173e43}.wp-cell.lit{background:#1e5d5a}.wp-cell{background:#d8d2c0}.wp-examples{grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}
 @media(max-width:760px){.wp-grid{grid-template-columns:1fr}.wp-row{grid-template-columns:92px minmax(0,1fr)}}
 @media(max-width:600px){.wp-paytable{padding:17px}.wp-note{font-size:13px}.wp-paytable h2{font-size:23px}.wp-row{padding:13px;gap:12px;grid-template-columns:86px minmax(0,1fr)}.wp-pays{gap:5px}.wp-pay-chip{min-width:100px;padding:5px 8px}.wp-symbol img{width:65px;height:65px}.wp-symbol-name{font-size:11px}.wp-section-title{font-size:16px}.wp-example{padding:10px}.wp-example-id{font-size:10px}}


 .wp-pays{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px}.wp-pay-chip{min-width:0;display:flex;flex-direction:column;justify-content:center;align-items:center;gap:5px;padding:9px 5px}.wp-pay-chip em{font-size:18px;white-space:nowrap}.wp-special{grid-column:1/-1}
 @media(max-width:600px){.wp-pays{gap:5px}.wp-pay-chip{min-width:0;padding:8px 3px}.wp-pay-chip b{font-size:10px}.wp-pay-chip em{font-size:16px}}
 </style>
