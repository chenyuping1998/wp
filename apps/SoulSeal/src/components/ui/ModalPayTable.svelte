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

	type PayRow = {
		name: string;
		img: string;
		label: string;
		pays: { count: number; value: number }[];
	};

	const SYMBOL_ASSET: Record<string, keyof typeof assets> = {
		H1: 'mcH1',
		H2: 'mcH2',
		H3: 'mcH3',
		H4: 'mcH4',
		L1: 'mcL1',
		L2: 'mcL2',
		L3: 'mcL3',
		L4: 'mcL4',
		L5: 'mcL5',
		M: 'mcM',
		W: 'mcW',
		S: 'mcS',
	};

	// Named for what the art actually depicts.
	//
	// The list this replaces was the scaffold's, and it was a liability as well as
	// wrong: its premium rows were called B-coin, E-coin, T-coin and S-coin after
	// the crypto marks that game's art depicted, one of which was a live
	// trademark. None of that art is in this game any more - the highs are a fox
	// mask, a ritual fan, a dragon coin and a pair of bells - so the names go with
	// it. It also listed an H5 this game does not have, and omitted L5 and the
	// carrier, which is the symbol the whole feature is about.
	const SYMBOL_LABEL: Record<string, string> = {
		H1: 'Fox Mask',
		H2: 'Ritual Fan',
		H3: 'Dragon Coin',
		H4: 'Temple Bells',
		L1: 'A',
		L2: 'K',
		L3: 'Q',
		L4: 'J',
		L5: '10',
		M: 'SPIRIT — Carrier',
		W: 'WILD',
		S: 'SOUL SEAL — Scatter',
	};

	// keep high -> low ordering for readability, specials last
	const ORDER = ['W', 'H1', 'H2', 'H3', 'H4', 'L1', 'L2', 'L3', 'L4', 'L5', 'M', 'S'];

	const maxWin = config.betModes?.base?.max_win ?? 10000;

	const imgSrc = (name: string) => {
		const key = SYMBOL_ASSET[name];
		const asset = key ? (assets[key] as { src?: string } | undefined) : undefined;
		return asset?.src ?? '';
	};

	const REELS = config.numReels;
	const BASE_ROWS = config.numRows?.[0] ?? 3;

	// One line table, from the maths config, because the board never changes
	// shape. The panel used to carry a second one - a 40-line table for a 5x5
	// board - along with two ways tables and a worked example of counting ways.
	// None of it applied to this game, and none of it even rendered: the sidecar
	// keys those sections read (`paylinesExpanded`, `paytables`) are not in the
	// config any more, so three headings sat above empty grids.
	type LineTable = Record<string, number[]>;
	const lineList = Object.entries((config.paylines ?? {}) as LineTable)
		.map(([id, path]) => ({ id: Number(id), path }))
		.sort((a, b) => a.id - b.id);
	const baseLines = lineList.length;

	/** row-major cell list for one line's diagram: 5 reels wide, BASE_ROWS tall */
	const lineCells = (path: number[]) =>
		Array.from({ length: BASE_ROWS * REELS }, (_, i) => path[i % REELS] === Math.floor(i / REELS));

	// The carrier's value range, read from the maths through
	// design/sync_math_config.mjs rather than typed here. The two gametypes have
	// different ladders and the difference is worth stating: the base game's runs
	// from half a stake, the free game's starts at a whole one.
	type Ladder = Record<string, Record<string, number>>;
	const ladders = (config as { carrierValues?: Ladder }).carrierValues;
	const rangeOf = (gametype: string) => {
		const ladder = ladders?.[gametype];
		if (!ladder) return null;
		const values = Object.keys(ladder).map(Number);
		return { min: Math.min(...values), max: Math.max(...values) };
	};
	const baseRange = rangeOf('basegame');
	const freeRange = rangeOf('freegame');

	// Free-spin awards, from the maths (game_config.freespin_triggers). Written
	// once and used by both the scatter row and the prose so the two cannot
	// disagree — which they did, in every other panel that quoted them.
	const TRIGGERS = '3, 4 or 5 award 8, 12 or 15 free spins';

	const rows: PayRow[] = ORDER.filter((name) => name in config.symbols).map((name) => {
		const symbol = (
			config.symbols as Record<string, { paytable?: { [k: string]: number }[] | null }>
		)[name];
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
				beginning on reel 1, and only the highest win on each line counts.
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
			<p class="wp-note">Per line. The same table in every mode.</p>
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
								<span class="wp-special">{T.doesNotPay} &mdash; {TRIGGERS}</span>
							{:else if row.name === 'M'}
								<span class="wp-special">
									{T.doesNotPay} as a symbol &mdash; it {T.pays} the value written on it
								</span>
							{:else if row.pays.length}
								{#each row.pays as pay (pay.count)}
									<span class="wp-pay-chip"><b>{pay.count}</b><em>{pay.value}&times;</em></span>
								{/each}
							{/if}
						</div>
					</div>
				{/each}
			</div>

			<h3 class="wp-lines-title">SPIRIT &mdash; THE CARRIER</h3>
			<p class="wp-note">
				Every SPIRIT lands carrying a value, printed on its talisman. It has no place in
				the table above: it never {T.pays} for a match, and a line of them {T.pays}
				what is written on them.
				{#if baseRange && freeRange}
					Values run from {baseRange.min}&times; to {baseRange.max.toLocaleString()}&times;
					{T.totalBet} in the main game, and from {freeRange.min}&times; to
					{freeRange.max.toLocaleString()}&times; in free spins.
				{/if}
			</p>
			<p class="wp-note">
				<strong>In the main game</strong> &mdash; 3 or more SPIRIT on a line, counted from
				reel 1, seals the board: <em>every</em> SPIRIT showing is collected, not only the
				ones on that line. WILD does not substitute for SPIRIT and breaks the run, because a
				WILD carries no value and a line it completed would show three spirits and hand over
				the value of two.
			</p>
			<p class="wp-note">
				<strong>In free spins</strong> &mdash; no line is needed. Every WILD on the board
				collects every SPIRIT showing, once each, so two WILDs collect the board twice. At
				most one WILD lands per reel.
			</p>

			<h3 class="wp-lines-title">FREE SPINS</h3>
			<p class="wp-note">
				SOUL SEAL appears on all five reels, at most once per reel, and {TRIGGERS}. Landing
				2 or more during free spins adds 3, 5, 8 or 12 more.
			</p>
			<p class="wp-note">
				<strong>SEALING RITE</strong> &mdash; the free spins 3 or 4 SOUL SEAL open, and what the
				100&times; entry opens. Every collect fills one slot on the talisman rail. The
				5th slot, the 9th and the 12th each add 8 free spins and step the collect multiplier
				to 2&times;, then 4&times;, then 10&times;. The rail survives retriggers.
			</p>
			<p class="wp-note">
				<strong>GRAND SEALING</strong> &mdash; the free spins 5 SOUL SEAL open, and what the
				300&times; entry opens. Every spin lands a WILD with a SPIRIT beside it, so every
				spin collects, and no SPIRIT is worth less than 5&times;. It has no rail: the
				guarantee is what it offers instead, and a feature carrying both compounds without
				bound.
			</p>

			<h3 class="wp-lines-title">THE {baseLines} LINES &mdash; {BASE_ROWS}&times;{REELS}</h3>
			<p class="wp-note">
				Every line is read from reel 1 rightwards. Lit cells are the positions the line
				covers.
			</p>
			<div class="wp-lines">
				{#each lineList as line (line.id)}
					<div class="wp-line">
						<div class="wp-line-grid">
							{#each lineCells(line.path) as lit, i (i)}
								<div class="wp-cell" class:lit></div>
							{/each}
						</div>
						<span class="wp-line-id">{line.id}</span>
					</div>
				{/each}
			</div>

			<p class="wp-note">
				WILD substitutes for every symbol except SOUL SEAL and SPIRIT, and {T.pays}
				10&times; for five of its own. Wins on different lines are added together. Max win
				is capped at {maxWin.toLocaleString()}&times; {T.totalBet}.
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
