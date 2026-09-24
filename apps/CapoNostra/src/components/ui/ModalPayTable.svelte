<script lang="ts">
	import { Popup } from 'components-shared';
	import { zIndex } from 'constants-shared/zIndex';
	import { stateModal } from 'state-shared';

	import config from '../../game/config';
	import { popupGhost } from './popupGhost';
	import { getSocialTerms } from '../../game/socialTerms';
	import assets from '../../game/assets';

	type PayRow = { name: string; img: string; label: string; pays: { count: number; value: number }[] };

	const SYMBOL_ASSET: Record<string, keyof typeof assets> = {
		H1: 'hmH1',
		H2: 'hmH2',
		H3: 'hmH3',
		H4: 'hmH4',
		L1: 'hmL1',
		L2: 'hmL2',
		L3: 'hmL3',
		L4: 'hmL4',
		H5: 'hmH5',
		W: 'hmW',
		S: 'hmS',
		SW: 'hmSw',
	};

	// Must match the drawn art (ART_BRIEF.md §2). These were still Hot Miami's
	// names — the art is a briefcase of notes and the label read "Flamingo", the
	// art is a whiskey glass and the label read "Boombox". A paytable that names
	// the symbol beside a picture of a different symbol is the single most
	// checkable thing in the panel, and it does not survive submission.
	//
	// "Cash Case" and "Money Case" are both out: design/check_social_words.mjs
	// bans `cash` and `money` in player-facing copy.
	const SYMBOL_LABEL: Record<string, string> = {
		H1: 'Signet Ring',
		H2: 'City Skyline',
		H3: 'Briefcase',
		H4: 'Whiskey & Cigar',
		H5: 'Black Sedan',
		L1: 'Spade',
		L2: 'Heart',
		L3: 'Diamond',
		L4: 'Club',
		W: 'Wild',
		S: 'Vault Door \u2014 Scatter',
		SW: 'Tommy Gun',
	};

	// keep high -> low ordering for readability
	const ORDER = ['W', 'H1', 'H2', 'H3', 'H4', 'H5', 'L1', 'L2', 'L3', 'L4', 'S', 'SW'];

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
		<div class="wp-paytable" use:popupGhost>
			<h2>{T.payTableUpper}</h2>
			<p class="wp-note">
				{T.paysStart} shown as a multiple of {T.totalBet}. Line wins {T.winsDirection} on
				{Object.keys(config.paylines).length} fixed {T.paylines}.
			</p>

			<div class="wp-grid">
				{#each rows as row, i (row.name)}
					<div
						class="wp-row"
						class:wp-row--special={row.name === 'S' || row.name === 'SW'}
						style="animation-delay: {i * 50}ms"
					>
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
									>{T.doesNotPay} &mdash; 3, 4 or 5 Scatters award {FREE_SPINS} Free Spins</span
								>
							{:else if row.name === 'SW'}
								<!-- The Tommy Gun has no paytable entry in config, so without a case of
								     its own the game's headline mechanic would render as a name and an
								     empty cell. Wording kept in step with ModalGameRules. It never pays
								     as itself because it is replaced along with the rest of its reel
								     before lines are evaluated (game_executables.py, expand_special_wilds). -->
								<span class="wp-special"
									>{T.doesNotPayAlone} &mdash; fills its entire reel with Wilds. Scatters in
									that reel are not replaced.</span
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

			<h3 class="wp-lines-title">{paylines.length} {T.paylinesUpper}</h3>
			<p class="wp-note">
				All {paylines.length} lines are always active. Wins {T.winsDirection} from reel 1.
			</p>

			<div class="wp-lines">
				{#each paylines as line (line.id)}
					<div class="wp-line">
						<div class="wp-line-grid">
							{#each Array(ROWS) as _, row (row)}
								{#each Array(REELS) as _, reel (reel)}
									<span class="wp-cell" class:lit={isLit(line.cells, reel, row)}></span>
								{/each}
							{/each}
						</div>
						<span class="wp-line-id">{line.id}</span>
					</div>
				{/each}
			</div>

			<p class="wp-note">
				Wild substitutes for all symbols except the Scatter and the Tommy Gun, and {T.pays} as its
				own symbol. Only the highest win is {T.paid} per line. Max win is capped at {maxWin.toLocaleString()}&times;
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
		color: var(--capo-bone);
		text-align: center;
		/* Body copy in Saira.

		   These two panels are NOT rendered inside .pop-up-wrap — verified in the
		   running game, the parent chain is div > div > body — so every
		   :global(.pop-up-wrap p) rule in Modals.svelte misses them and they
		   inherited the font from <body>, which the shared template still sets to
		   'proxima-nova'. That is a domain-locked Adobe Typekit face this app never
		   loads, so it resolved to the browser's default sans and these panels ran
		   in the operating system's UI font: the exact "standard fonts" finding
		   game/fonts.ts records certification raising once already. Confirmed live
		   with getComputedStyle before the fix, which reported proxima-nova on the
		   paragraph under the PAY TABLE heading. */
		font-family: var(--gb-body-font);
		animation: slideUp 0.4s cubic-bezier(0.22, 1, 0.36, 1) both;

		/* custom scrollbar */
		&::-webkit-scrollbar {
			width: 5px;
		}
		&::-webkit-scrollbar-track {
			background: rgba(var(--capo-bone-rgb), 0.04);
			border-radius: 4px;
		}
		&::-webkit-scrollbar-thumb {
			background: linear-gradient(180deg, var(--capo-gold) 0%, var(--capo-gold-light) 100%);
			border-radius: 4px;
		}

		h2 {
			margin: 0 0 0.25rem;
			font-size: 1.75rem;
			font-weight: 800;
			letter-spacing: 0.1em;
			/* Cinzel, same as the Buy Bonus card and the tier titles. The panel
			   headings were the last player-facing text still in the body face. */
			font-family: var(--hm-title-font);
			background: linear-gradient(135deg, var(--capo-gold-light) 0%, var(--capo-gold) 50%, var(--capo-gold-dark) 100%);
			background-size: 200% auto;
			-webkit-background-clip: text;
			-webkit-text-fill-color: transparent;
			background-clip: text;
			animation: shimmer 4s linear infinite;
			filter: drop-shadow(0 0 18px rgba(var(--capo-gold-rgb), 0.4));
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

	/* ─── payline diagrams: one mini board per payline, lit cells in reel gold.
	   Count and dimensions are derived from config (REELS/ROWS above), so no
	   number belongs in this comment — it used to say "15 mini 5x5 boards" for
	   a 14-payline 5x4 game. ─── */
	.wp-lines-title {
		margin: 0.5rem 0 0;
		font-size: 1.05rem;
		font-weight: 800;
		letter-spacing: 0.14em;
		color: var(--capo-gold);
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
		border: 6px solid transparent;
		border-image: url('/assets/sprites/capoUi/buy_card_frame.svg') 96 stretch;
		border-radius: 0.6rem;
		background: rgba(var(--capo-bone-rgb), 0.04);
		border: 1px solid rgba(var(--capo-bone-rgb), 0.06);
		transition: all 0.25s cubic-bezier(0.22, 1, 0.36, 1);

		&:hover {
			background: rgba(var(--capo-gold-rgb), 0.1);
			border-color: rgba(var(--capo-gold-rgb), 0.24);
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
		background: rgba(var(--capo-bone-rgb), 0.07);

		&.lit {
			background: linear-gradient(160deg, var(--capo-gold-light), var(--capo-gold));
			box-shadow: 0 0 6px rgba(var(--capo-gold-rgb), 0.65);
		}
	}

	.wp-line-id {
		font-size: 0.7rem;
		font-weight: 700;
		letter-spacing: 0.06em;
		color: rgba(var(--capo-gold-rgb), 0.85);
	}

	.wp-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.75rem;
		padding: 0.55rem 0.8rem;
		border: 7px solid transparent;
		border-image: url('/assets/sprites/capoUi/buy_card_frame.svg') 96 stretch;
		border-radius: 0.75rem;
		background: rgba(var(--capo-bone-rgb), 0.04);
		backdrop-filter: blur(8px);
		-webkit-backdrop-filter: blur(8px);
		border: 1px solid rgba(var(--capo-bone-rgb), 0.06);
		transition: all 0.3s cubic-bezier(0.22, 1, 0.36, 1);
		animation: rowSlideIn 0.35s cubic-bezier(0.22, 1, 0.36, 1) both;

		&:hover {
			background: rgba(var(--capo-gold-rgb), 0.1);
			border-color: rgba(var(--capo-gold-rgb), 0.22);
			box-shadow: 0 0 20px rgba(var(--capo-gold-rgb), 0.14),
			            inset 0 0 20px rgba(var(--capo-gold-rgb), 0.05);
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
		/* 2026-09-14: a soft round light behind each thumbnail. The suits and the
		   sedan are drawn dark (charcoal ink on black) and sat straight on the dark
		   row card with nothing behind them — the spade was close to invisible. */
		border-radius: 50%;
		background: radial-gradient(circle, rgba(var(--capo-bone-rgb), 0.2) 0%,
			rgba(var(--capo-bone-rgb), 0.07) 55%, transparent 72%);
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
			background: radial-gradient(circle, rgba(var(--capo-gold-rgb), 0.3) 0%, transparent 70%);
			opacity: 0;
			transition: opacity 0.3s ease;
		}
	}

	.wp-row:hover .wp-symbol-glow {
		img {
			transform: scale(1.12);
			filter: drop-shadow(0 0 8px rgba(var(--capo-gold-light-rgb), 0.6));
		}
		&::after {
			opacity: 1;
		}
	}

	.wp-symbol-name {
		font-size: 0.95rem;
		font-weight: 700;
		letter-spacing: 0.03em;
		color: rgba(var(--capo-bone-rgb), 0.92);
	}

	.wp-pays {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
		justify-content: flex-end;
		font-size: 0.92rem;
	}

	/* 2026-09-14: Scatter and Tommy Gun carry a sentence instead of pay chips.
	   Squeezed into the chip column, the name wrapped onto two lines and the
	   sentence was crammed centre-right. They wrap instead: name on its own line,
	   the sentence below it, left-aligned under the name (3.2rem thumbnail +
	   0.6rem gap). */
	.wp-row--special {
		flex-wrap: wrap;
		row-gap: 0.25rem;

		.wp-symbol-name {
			white-space: nowrap;
		}

		.wp-pays {
			flex: 1 1 100%;
			justify-content: flex-start;
			padding-left: 3.8rem;
		}

		.wp-special {
			text-align: left;
			font-size: 0.85rem;
			line-height: 1.4;
		}
	}

	.wp-pay-chip {
		display: inline-flex;
		align-items: center;
		gap: 0.2rem;
		padding: 0.2rem 0.55rem;
		border-radius: 0.5rem;
		background: rgba(var(--capo-gold-light-rgb), 0.07);
		border: 1px solid rgba(var(--capo-gold-light-rgb), 0.12);
		transition: all 0.25s ease;

		/* Digits, so Orbitron — ART_BRIEF §9.5, "字詞跟美術走，數字跟可讀性走".
		   These chips were inheriting Saira from the panel's body rule, which is
		   the running-text face; a column of pay multipliers is a table of
		   figures and reads better in the number face the bet bar and the frame
		   multipliers already use. Tabular figures so the columns line up. */
		font-family: var(--hm-number-font);
		font-variant-numeric: tabular-nums;

		b {
			color: var(--capo-gold-light);
			font-weight: 800;
		}

		em {
			font-style: normal;
			font-weight: 600;
			background: linear-gradient(135deg, var(--capo-gold-light), var(--capo-gold));
			-webkit-background-clip: text;
			-webkit-text-fill-color: transparent;
			background-clip: text;
		}
	}

	.wp-row:hover .wp-pay-chip {
		background: rgba(var(--capo-gold-light-rgb), 0.12);
		border-color: rgba(var(--capo-gold-light-rgb), 0.2);
		box-shadow: 0 0 8px rgba(var(--capo-gold-light-rgb), 0.12);
	}

	/* The glow here was rgba(255, 122, 217, 0.4) — Hot Miami's hot pink, and the
	   only magenta left anywhere in this game's UI. It sat on the Scatter row,
	   which is one of the two lines a reviewer reads on this panel. Confirmed
	   live before the fix: getComputedStyle reported it on the rendered element,
	   so it was not dead CSS. */
	.wp-special {
		color: var(--capo-gold);
		font-weight: 700;
		text-shadow: 0 0 12px rgba(var(--capo-gold-rgb), 0.4);
	}
</style>
