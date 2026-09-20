<script lang="ts">
	import { Popup } from 'components-shared';
	import { zIndex } from 'constants-shared/zIndex';
	import { stateModal } from 'state-shared';

	import config from '../../game/config';
	import assets from '../../game/assets';
	import { getSocialTerms } from '../../game/socialTerms';
	import { SYMBOL_LABEL } from '../../game/symbolLabels';

	// Social play forbids betting terminology in anything the player can read.
	// Resolved here rather than at module scope because getSocialTerms() reads the
	// page URL, which is not available while a module is being evaluated — the
	// trap documented in the stake-engine-slot skill.
	const terms = getSocialTerms();

	type PayRow = { name: string; img: string; label: string; pays: { count: number; value: number }[] };

	const SYMBOL_ASSET: Record<string, keyof typeof assets> = {
		H1: 'wpH1',
		H2: 'wpH2',
		H3: 'wpH3',
		H4: 'wpH4',
		L1: 'wpL1',
		L2: 'wpL2',
		L3: 'wpL3',
		L4: 'wpL4',
		W: 'wpW',
		S: 'wpS',
	};

	// keep high -> low ordering for readability
	const ORDER = ['W', 'H1', 'H2', 'H3', 'H4', 'L1', 'L2', 'L3', 'L4', 'S'];

	const maxWin = config.betModes?.base?.max_win ?? 5000;

	const imgSrc = (name: string) => {
		const key = SYMBOL_ASSET[name];
		const asset = key ? (assets[key] as { src?: string } | undefined) : undefined;
		return asset?.src ?? '';
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
			<h2>{terms.payTableUpper}</h2>
			<p class="wp-note">{terms.paysStart} shown as a multiple of {terms.totalBet}. Line wins {terms.winsDirection} on {Object.keys(config.paylines).length} fixed {terms.paylines}.</p>

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
								<span class="wp-special">3 Scatters (reels 3-5) trigger 5 Free Spins</span>
							{:else if row.pays.length}
								{#each row.pays as pay (pay.count)}
									<span class="wp-pay-chip"><b>{pay.count}</b> &times; <em>{pay.value}</em></span>
								{/each}
							{/if}
						</div>
					</div>
				{/each}
			</div>

			<p class="wp-note">Wild substitutes for all symbols except Scatter. Max win is capped at {maxWin.toLocaleString()}&times; {terms.totalBet}.</p>

			<h3 class="wp-section">{terms.paylinesUpper}</h3>
			<p class="wp-note">All {Object.keys(config.paylines).length} lines are always active. Highlighted cells show each line's shape across the {config.numReels} reels; wins start from the leftmost reel.</p>
			<div class="wp-lines">
				{#each Object.entries(config.paylines) as [lineNo, rowsOfLine] (lineNo)}
					<div class="wp-line">
						<span>{lineNo}</span>
						<svg viewBox="0 0 62 38" aria-label={`${terms.payline} ${lineNo}`}>
							{#each [0, 1, 2] as r (r)}
								{#each [0, 1, 2, 3, 4] as c (c)}
									{@const active = (rowsOfLine as number[])[c] === r}
									<rect
										x={2 + c * 12}
										y={2 + r * 12}
										width="10"
										height="10"
										rx="2.2"
										fill={active ? '#ffd34d' : 'rgba(255,255,255,0.06)'}
										stroke={active ? '#ffe9a0' : 'rgba(216,168,78,0.22)'}
										stroke-width={active ? 0.8 : 0.5}
									/>
								{/each}
							{/each}
						</svg>
					</div>
				{/each}
			</div>

			<h3 class="wp-section">FEATURES</h3>
			<div class="wp-features">
				<div class="wp-feature">
					<b>FREE SPINS</b>
					<p>3 Scatters on reels 3, 4 and 5 award 5 Free Spins. Free Spins can be retriggered.</p>
				</div>
				<div class="wp-feature">
					<b>GLOBAL MULTIPLIER</b>
					<p>During Free Spins a single Global Multiplier applies to every line win. It starts at 1&times;&ndash;3&times; &mdash; one for each {terms.payline} the triggering Scatters complete &mdash; then adds +1 for every Wild that lands (up to 100&times;), and never resets during the feature.</p>
				</div>
				<div class="wp-feature">
					<b>{terms.buyBonusName.toUpperCase()}</b>
					<p>{terms.entryVerb} direct entry into Free Spins at three tiers: Quick 50&times; (starts 1&times;), Bonus 100&times; (starts 1&times;&ndash;3&times;, same as a natural trigger) or Super 200&times; (elevated start, higher volatility). All tiers play at the same {(config.rtp * 100).toFixed(2)}% RTP.</p>
				</div>
			</div>
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
			background: linear-gradient(180deg, #ff7ad9 0%, #ffd34d 100%);
			border-radius: 4px;
		}

		.wp-section {
			margin: 0.9rem 0 0.1rem;
			font-size: 1.15rem;
			font-weight: 800;
			letter-spacing: 0.12em;
			color: #ffd34d;
		}

		.wp-lines {
			display: grid;
			grid-template-columns: repeat(5, 1fr);
			gap: 0.45rem;

			.wp-line {
				display: flex;
				flex-direction: column;
				gap: 3px;
				background: rgba(255, 255, 255, 0.05);
				border: 1px solid rgba(216, 168, 78, 0.45);
				border-radius: 8px;
				padding: 0.3rem 0.3rem 0.28rem;

				span {
					font-size: 0.62rem;
					font-weight: 700;
					line-height: 1;
					text-align: center;
					color: #ffd34d;
				}

				svg {
					width: 100%;
					display: block;
				}
			}
		}

		.wp-features {
			display: flex;
			flex-direction: column;
			gap: 0.5rem;
			text-align: left;

			.wp-feature {
				background: rgba(255, 255, 255, 0.05);
				border: 1px solid rgba(216, 168, 78, 0.45);
				border-radius: 10px;
				padding: 0.6rem 0.85rem;

				b {
					color: #ffd34d;
					letter-spacing: 0.08em;
					font-size: 0.85rem;
				}

				p {
					margin: 0.25rem 0 0;
					font-size: 0.8rem;
					line-height: 1.45;
					color: #e8ddf5;
				}
			}
		}

		h2 {
			margin: 0 0 0.25rem;
			font-size: 1.75rem;
			font-weight: 800;
			letter-spacing: 0.1em;
			background: linear-gradient(135deg, #ffd34d 0%, #ff7ad9 50%, #a855f7 100%);
			background-size: 200% auto;
			-webkit-background-clip: text;
			-webkit-text-fill-color: transparent;
			background-clip: text;
			animation: shimmer 4s linear infinite;
			filter: drop-shadow(0 0 18px rgba(255, 122, 217, 0.5));
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
			background: rgba(255, 122, 217, 0.08);
			border-color: rgba(255, 122, 217, 0.2);
			box-shadow: 0 0 20px rgba(255, 122, 217, 0.12),
			            inset 0 0 20px rgba(255, 122, 217, 0.04);
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
			background: radial-gradient(circle, rgba(255, 122, 217, 0.3) 0%, transparent 70%);
			opacity: 0;
			transition: opacity 0.3s ease;
		}
	}

	.wp-row:hover .wp-symbol-glow {
		img {
			transform: scale(1.12);
			filter: drop-shadow(0 0 8px rgba(255, 211, 77, 0.6));
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

	/* every symbol pays on exactly 3/4/5 of a kind — lock the chips into three
	   equal columns so the numbers line up across every row instead of
	   wrapping raggedly at their natural widths */
	.wp-pays {
		display: grid;
		grid-template-columns: repeat(3, 4.7rem);
		gap: 0.4rem;
		justify-content: end;
		font-size: 0.92rem;
		font-variant-numeric: tabular-nums;
	}

	.wp-pay-chip {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.2rem;
		/* symmetric padding + a locked line-height so the glyphs sit optically
		   centred — without it the text rode low in the pill */
		padding: 0.34rem 0.35rem;
		line-height: 1;
		border-radius: 0.5rem;
		background: rgba(255, 211, 77, 0.06);
		border: 1px solid rgba(255, 211, 77, 0.1);
		transition: all 0.25s ease;

		b {
			color: #ffd34d;
			font-weight: 800;
			line-height: 1;
		}

		em {
			font-style: normal;
			font-weight: 700;
			line-height: 1;
			/* brighter stops than the old #ffd34d→#ffaa00: the dark orange end
			   made the values read dim at this size */
			background: linear-gradient(135deg, #ffe9a8, #ffc24d);
			-webkit-background-clip: text;
			-webkit-text-fill-color: transparent;
			background-clip: text;
		}
	}

	.wp-row:hover .wp-pay-chip {
		background: rgba(255, 211, 77, 0.1);
		border-color: rgba(255, 211, 77, 0.2);
		box-shadow: 0 0 8px rgba(255, 211, 77, 0.1);
	}

	.wp-special {
		/* Scatter has no 3/4/5 table — let its note span the whole chip grid */
		grid-column: 1 / -1;
		text-align: right;
		color: #ff7ad9;
		font-weight: 700;
		text-shadow: 0 0 12px rgba(255, 122, 217, 0.4);
	}
</style>
