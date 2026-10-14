<script lang="ts">
	import { Popup } from 'components-shared';
	import { zIndex } from 'constants-shared/zIndex';
	import { stateModal, stateUrlDerived } from 'state-shared';

	import { base } from '$app/paths';

	import config from '../../game/config';
	import { popupGhost } from './popupGhost';
	import { getSocialTerms } from '../../game/socialTerms';
	import {
		commonText,
		numberIn,
		pctIn,
		rulesLang,
		type ControlKey,
		type RulesVars,
	} from '../../game/rulesCommon';
	import { gameRulesText } from '../../game/rulesText';

	// Social play forbids betting terminology in player-facing copy, and the rules
	// page is the densest concentration of it in the game. The vocabulary lives in
	// one module shared with the pay table — two panels with their own copies
	// drift, and the drift is what gets flagged.
	const T = getSocialTerms();
	const social = stateUrlDerived.social();

	// Every sentence comes from game/rulesCommon.ts (the sections all three games
	// share) or game/rulesText.ts (this game's own), in the player's language
	// (2026-10-13 — this page was English-only while the bar and the intro card
	// followed ?lang=). English is built from T, so social play, which is
	// English-only, reads word for word what it read before.
	const lang = rulesLang();
	const C = commonText(lang, T, social);
	const G = gameRulesText(lang, T, social);

	// Controls guide. Each row shows the actual button art from the bet bar, so a
	// player matches what they read to what they see rather than decoding a name.
	// Icons come from static/, not the pixi asset pipeline — this panel is DOM.
	const ICONS = `${base}/assets/sprites/capoUiIcons`;
	// `icons` is a list because a control can be a pair — the stepper is two keys,
	// and showing only one of them would misrepresent it. Buy Bonus has none: on
	// the bar it is a labelled plate rather than a glyph, so there is no icon that
	// would actually match what the player sees. Engine guideline 235 fails a
	// guide that leaves out any pressable control; the bet readout is one (tapping
	// it opens the bet menu), so it is listed with its caption as a plate too.
	const CONTROL_ICONS: [ControlKey, string[]][] = [
		['spin', ['spin']],
		['stepper', ['decrease', 'increase']],
		['amount', []],
		['buy', []],
		['auto', ['autoSpin']],
		['turbo', ['turbo']],
		['menu', ['menu']],
		['info', ['info']],
		['settings', ['settings']],
		['paytable', ['payTable']],
		['sound', ['soundOn']],
	];
	const controls = CONTROL_ICONS.map(([key, icons]) => ({
		icons,
		plate: key === 'amount' ? C.amountPlate : key === 'buy' ? C.buyPlate : undefined,
		name: C.controls[key][0],
		text: C.controls[key][1],
	}));

	// The modes are not all on one number: they climb with the price ladder
	// (maths game_config.py — 94.58 / 94.63 / 94.67 / 94.78 as of the
	// 2026-09-03 retarget). Two sentences below used to assert they were
	// identical, which certification reads as a claim about the game. Derive
	// the span from the config instead, so it collapses back to a single figure
	// by itself if the modes are ever levelled again, and tracks any future
	// retarget without needing this comment updated again.
	const modeRtpValues = Object.values(
		(config.betModes ?? {}) as Record<string, { rtp?: number }>,
	)
		.map((mode) => mode?.rtp)
		.filter((value): value is number => typeof value === 'number');
	const rtpLow = modeRtpValues.length ? Math.min(...modeRtpValues) : config.rtp;
	const rtpHigh = modeRtpValues.length ? Math.max(...modeRtpValues) : config.rtp;
	// Numbers in the player's locale; English keeps exactly the formatting it had.
	const pct = (value: number) => (lang === 'en' ? `${(value * 100).toFixed(2)}%` : pctIn(lang, value));
	const num = (value: number) => (lang === 'en' ? value.toLocaleString() : numberIn(lang, value));
	const rtpRangePct = rtpLow === rtpHigh ? pct(rtpLow) : `${pct(rtpLow)}–${pct(rtpHigh)}`;
	const lineCount = Object.keys(config.paylines).length;
	const maxWin = config.betModes?.base?.max_win ?? 20000;
	const buyCost = config.betModes?.bonus?.cost;
	// Every tier awards the same number of spins; the scatter count selects which
	// tier is played rather than how long it lasts (maths: freespin_triggers).
	const baseFreeSpins = 10;
	const reelCount = config.numReels;
	// 4, not 3 — this game is 5x4. The old ?? 3 would have printed "5X3" if the
	// key ever went missing, disagreeing with LoadingScreen and ModalPayTable,
	// which both fall back to 4.
	const rowCount = config.numRows?.[0] ?? 4;

	const vars: RulesVars = {
		game: 'Capo Nostra',
		reels: reelCount,
		rows: rowCount,
		lines: lineCount,
		rtpRange: rtpRangePct,
		rtpLow: pct(rtpLow),
		rtpHigh: pct(rtpHigh),
		maxWin: num(maxWin),
		buyName: C.controls.buy[0],
	};

	// Feature names stay in English in every language, as on the intro card.
	const TIERS = [
		['Soldier', 3],
		['Capo', 4],
		['The Don', 5],
	] as const;

	// Per-mode RTP and max win, read straight out of the maths config rather than
	// written into the prose. Certification asks for both to be clearly stated for
	// every mode available; spelling them out in one table is harder to miss than
	// leaving them scattered through the sections, and taking the numbers from
	// config means they cannot drift away from what the game actually pays.
	//
	// "(N Scatters)", not the old "(N FS)". FS is the Scatter symbol's name on
	// the reels, but in a table of free-spin modes "3 FS" reads as "3 free spins"
	// — and every mode awards 10. This wording matches the trigger list further
	// down, which says "3 Scatters" too.
	type BetMode = { cost?: number; rtp?: number; max_win?: number };
	const buyFor = (cost: number | undefined) => C.buyFor(lang === 'en' || cost === undefined ? String(cost) : num(cost));
	const modeRows = (
		[
			[C.baseGame, 'base', C.everySpin],
			[`${TIERS[0][0]} (${C.scatters(TIERS[0][1])})`, 'bonus', buyFor(config.betModes?.bonus?.cost)],
			[`${TIERS[1][0]} (${C.scatters(TIERS[1][1])})`, 'bonus_hits', buyFor(config.betModes?.bonus_hits?.cost)],
			[`${TIERS[2][0]} (${C.scatters(TIERS[2][1])})`, 'bonus_epic', buyFor(config.betModes?.bonus_epic?.cost)],
		] as const
	).map(([label, key, entry]) => {
		const mode = config.betModes?.[key] as BetMode | undefined;
		return {
			label,
			entry,
			rtp: pct(mode?.rtp ?? config.rtp),
			maxWin: C.maxWinCell(num(mode?.max_win ?? maxWin)),
		};
	});
</script>

{#if stateModal.modal?.name === 'gameRules'}
	<Popup zIndex={zIndex.modal} onclose={() => (stateModal.modal = null)}>
		<div class="wp-rules" use:popupGhost dir={C.dir}>
			<h2>CAPO NOSTRA — {C.gameRulesCaps}</h2>

			<section class="wp-card">
				<h3><span class="wp-accent-bar"></span>{C.howTitle}</h3>
				<p>{C.how(vars)}</p>
			</section>

			<!-- Certification asked for a user interaction guide in the game
			     information. Kept as a definition list of the actual on-screen
			     controls, in the order they sit on the bar. -->
			<section class="wp-card">
				<h3><span class="wp-accent-bar"></span>{C.controlsTitle}</h3>
				<ul class="wp-controls">
					{#each controls as control (control.name)}
						<li>
							<span class="wp-control-icons">
								{#each control.icons as name (name)}
									<img src={`${ICONS}/${name}.png`} alt="" aria-hidden="true" />
								{/each}
								<!--
									Buy Bonus has no glyph on the bar, it has a labelled plate, so
									the icon column carries a miniature of that plate. Dropping the
									column entirely (what `no-icon` did here) pulled this one row's
									name 4.6rem left of every other one, and it stopped reading as
									an entry in the list at all — it read as a section heading
									sitting between "Decrease / increase" and "Auto Spin".
								-->
								{#if control.plate}
									<span class="wp-control-plate">{control.plate}</span>
								{/if}
							</span>
							<div>
								<span class="wp-control-name">{control.name}</span>
								<span class="wp-control-text">{control.text}</span>
							</div>
						</li>
					{/each}
				</ul>
				<p class="wp-modes-note">{C.skipNote}</p>
			</section>

			<section class="wp-card">
				<h3><span class="wp-accent-bar"></span>{C.modesTitle}</h3>
				<table class="wp-modes">
					<thead>
						<tr>
							{#each C.modesHead as head (head)}
								<th scope="col">{head}</th>
							{/each}
						</tr>
					</thead>
					<tbody>
						{#each modeRows as row (row.label)}
							<tr>
								<th scope="row">{row.label}</th>
								<td>{row.entry}</td>
								<td>{row.rtp}</td>
								<td>{row.maxWin}</td>
							</tr>
						{/each}
					</tbody>
				</table>
				<p class="wp-modes-note">{C.modesNote}</p>
			</section>

			<section class="wp-card">
				<h3><span class="wp-accent-bar"></span>{C.wildTitle}</h3>
				<p>{G.wild}</p>
			</section>

			<section class="wp-card">
				<h3><span class="wp-accent-bar"></span>{G.caseTitle}</h3>
				<!-- Reel strips (math capo_nostra/reels): the Tommy Gun is on reels 2-4
				     in the base game but on all five in free spins (FR0), and the
				     Scatter only on reels 3-5 in free spins. Fixed 2026-09-27. -->
				<p>{@html G.case}</p>
			</section>

			<section class="wp-card">
				<h3><span class="wp-accent-bar"></span>{G.framesTitle}</h3>
				<!-- The ceilings are game_config.py frame_size_ladders: the 2x2 ladder
				     tops out at 10 and the 3x3 at 8, deliberately, so a bigger Frame
				     wins through footprint rather than face value. This said "2x to 10x
				     on the larger Frames", which advertises a 3x3 at 9x or 10x that the
				     maths cannot produce. -->
				<p>{@html G.frames[0]}</p>
				<p>{@html G.frames[1]}</p>
			</section>

			<section class="wp-card">
				<h3><span class="wp-accent-bar"></span>{C.scatterTitle}</h3>
				<p>{G.scatter(baseFreeSpins)}</p>
				<ul class="wp-controls">
					{#each TIERS as [name, count], i (name)}
						<li class="no-icon"><div>
							<span class="wp-control-name">{C.scatters(count)} &mdash; {name}</span>
							<span class="wp-control-text">{@html G.tiers[i]}</span>
						</div></li>
					{/each}
				</ul>
			</section>

			<section class="wp-card">
				<h3><span class="wp-accent-bar"></span>{C.retrigTitle}</h3>
				<p>{C.retrig}</p>
				<!-- Stake asked Deadwood Express for this after approval (2026-10-04): "if
				     there is no limit to the number of free spins, clarify". -->
				<p>{C.noLimit}</p>
			</section>

			{#if buyCost}
				<section class="wp-card">
					<h3><span class="wp-accent-bar"></span>{C.entryTitle}</h3>
					<p>{C.entry(vars)}</p>
				</section>
			{/if}

			<section class="wp-card">
				<h3><span class="wp-accent-bar"></span>{C.maxTitle}</h3>
				<p>{C.max(vars)}</p>
			</section>

			<div class="wp-divider"></div>
			<p class="wp-foot">
				{C.foot}
				<!-- Closing line is DICTATED by review, not the studio's to word.
				     Hot Miami's review (2026-09-06) replaced "Silverstars Studio"
				     with exactly "Engine". Do not restore a studio name on reasoning.
				     Verify against the BUILD, not src:
				     grep -c "Silverstars Studio" apps/CapoNostra/build/index.html  -> 0 -->
				TM and &copy; 2026 Engine.
			</p>
		</div>
	</Popup>
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

	@keyframes cardFadeIn {
		from {
			opacity: 0;
			transform: translateY(10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	@keyframes shimmer {
		0% { background-position: -200% center; }
		100% { background-position: 200% center; }
	}

	@keyframes accentPulse {
		0%, 100% { opacity: 0.7; box-shadow: 0 0 6px rgba(var(--capo-gold-rgb), 0.3); }
		50% { opacity: 1; box-shadow: 0 0 12px rgba(var(--capo-gold-rgb), 0.55); }
	}

	.wp-rules {
		/* sit above the Popup's full-screen click-to-close layer (z-index 2),
		   otherwise the overlay swallows wheel/touch events and blocks scrolling */
		position: relative;
		z-index: 100;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		width: min(36rem, 90vw);
		max-width: 36rem;
		max-height: 80vh;
		overflow-y: auto;
		-webkit-overflow-scrolling: touch;
		overscroll-behavior: contain;
		padding: 1.5rem 1.75rem;
		color: var(--capo-bone);
		text-align: left;
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
			margin: 0 0 0.35rem;
			text-align: center;
			font-size: 1.65rem;
			font-weight: 800;
			letter-spacing: 0.08em;
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

	/* Controls guide — each row pairs the button's own art with what it does, so
	   the guide can be matched against the bar by sight rather than by name. */
	.wp-controls {
		list-style: none;
		margin: 0.5rem 0 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0.55rem;
	}

	.wp-controls li {
		display: grid;
		/* wide enough for the two-key stepper; a single icon sits left-aligned in
		   the same column so every row's text starts on one line */
		grid-template-columns: 4.6rem 1fr;
		align-items: start;
		gap: 0.7rem;
	}

	/* Rows that are genuinely text-only (the mode table notes below) still take
	   the whole width. The Controls list no longer uses this: see the miniature
	   plate in .wp-control-plate. */
	.wp-controls li.no-icon {
		grid-template-columns: 1fr;
	}

	/* A miniature of the bar's Buy Bonus plate, sized to the same 4.6rem column
	   the glyphs occupy so the row's name lines up with every other row's.

	   Its face was #14171a — the platform-chrome grey from uiTheme.ts's hacksaw
	   block, copied here while that skin was the default. It is a picture of the
	   bar, so it has to track whichever bar is actually drawn; now that the game's
	   own skin is the default it takes the game's own panel colour. */
	.wp-control-plate {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 4.6rem;
		min-height: 2.1rem;
		padding: 0.2rem 0.15rem;
		box-sizing: border-box;
		border: 1px solid rgba(var(--capo-gold-light-rgb), 0.45);
		border-radius: 4px;
		background: var(--capo-ink);
		color: var(--capo-bone);
		/* 0.5rem -> 0.72rem (2026-09-14): 0.5rem is 8px on the 16px root, and a
		   DOM audit of this page flagged it as the only text under 10px.
		   Certification has rejected unreadably small text on this project
		   before. "BUY BONUS" at 0.72rem still fits the 4.6rem plate. */
		font-size: 0.72rem;
		font-weight: 700;
		letter-spacing: 0.04em;
		line-height: 1.15;
		text-align: center;
		text-transform: uppercase;
	}

	.wp-control-icons {
		display: flex;
		align-items: center;
		gap: 0.4rem;
	}

	.wp-controls img {
		width: 2.1rem;
		height: 2.1rem;
		object-fit: contain;
		/* nudge down so the glyph optically centres on the first line of text */
		margin-top: -0.15rem;
	}

	.wp-control-name {
		display: block;
		color: var(--capo-bone);
		font-weight: 700;
		font-size: 0.86rem;
		line-height: 1.3;
	}

	.wp-control-text {
		display: block;
		font-size: 0.8rem;
		line-height: 1.35;
		opacity: 0.88;
	}

	/* Mode comparison table — RTP and max win per mode, as certification asks
	   these be clearly stated for every mode. Values come from the maths config
	   (see modeRows), so the table cannot drift from what the game pays. */
	.wp-modes {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.82rem;
		margin-top: 0.35rem;
	}

	.wp-modes th,
	.wp-modes td {
		padding: 0.42rem 0.5rem;
		text-align: left;
		border-bottom: 1px solid rgba(var(--capo-bone-rgb), 0.07);
	}

	.wp-modes thead th {
		color: rgba(var(--capo-gold-rgb), 0.9);
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		font-size: 0.72rem;
		border-bottom-color: rgba(var(--capo-gold-rgb), 0.35);
	}

	.wp-modes tbody th {
		color: var(--capo-bone);
		font-weight: 700;
		white-space: nowrap;
	}

	/* RTP and max win are the two numbers being certified — keep them legible
	   rather than letting them sit in body-copy grey. And set them in the number
	   face (Orbitron, --hm-number-font) with tabular figures, per ART_BRIEF §9.5:
	   they are a column of values to be compared down the page, which is exactly
	   what proportional running-text figures make harder. */
	.wp-modes tbody td:nth-child(3),
	.wp-modes tbody td:nth-child(4) {
		color: var(--capo-bone);
		font-family: var(--hm-number-font);
		font-variant-numeric: tabular-nums;
		font-weight: 600;
		white-space: nowrap;
	}

	.wp-modes tbody tr:last-child th,
	.wp-modes tbody tr:last-child td {
		border-bottom: none;
	}

	.wp-modes-note {
		margin-top: 0.5rem;
		font-size: 0.76rem;
		opacity: 0.75;
	}

	/* 2026-09-14: the three Scatter tier entries (li.no-icon) started flush with
	   the card edge, while the paragraph introducing them is indented 0.9rem
	   like every card paragraph — so the list read as sitting outside its own
	   section. Declared after the base li.no-icon rule so it wins. */
	.wp-controls li.no-icon {
		padding-left: 0.9rem;
	}

	.wp-card {
		padding: 0.85rem 1rem;
		border: 8px solid transparent;
		border-image: url('/assets/sprites/capoUi/buy_card_frame.svg') 96 stretch;
		border-radius: 0.75rem;
		background: rgba(var(--capo-bone-rgb), 0.03);
		backdrop-filter: blur(6px);
		-webkit-backdrop-filter: blur(6px);
		border: 1px solid rgba(var(--capo-bone-rgb), 0.05);
		transition: all 0.3s cubic-bezier(0.22, 1, 0.36, 1);
		animation: cardFadeIn 0.4s cubic-bezier(0.22, 1, 0.36, 1) both;

		&:nth-child(2) { animation-delay: 0.05s; }
		&:nth-child(3) { animation-delay: 0.1s; }
		&:nth-child(4) { animation-delay: 0.15s; }
		&:nth-child(5) { animation-delay: 0.2s; }
		&:nth-child(6) { animation-delay: 0.25s; }
		&:nth-child(7) { animation-delay: 0.3s; }
		&:nth-child(8) { animation-delay: 0.35s; }
		&:nth-child(9) { animation-delay: 0.4s; }
		&:nth-child(10) { animation-delay: 0.45s; }
		&:nth-child(11) { animation-delay: 0.5s; }

		&:hover {
			background: rgba(var(--capo-gold-rgb), 0.06);
			border-color: rgba(var(--capo-gold-rgb), 0.18);
			box-shadow: 0 0 16px rgba(var(--capo-gold-rgb), 0.1);
		}

		h3 {
			display: flex;
			align-items: center;
			gap: 0.5rem;
			margin: 0 0 0.35rem;
			font-size: 1.05rem;
			font-weight: 700;
			color: var(--capo-gold);
		}

		p {
			margin: 0;
			font-size: 0.88rem;
			line-height: 1.55;
			opacity: 0.88;
			padding-left: 0.9rem;
		}
	}

	.wp-accent-bar {
		display: inline-block;
		width: 3px;
		height: 1.1em;
		border-radius: 2px;
		background: linear-gradient(180deg, var(--capo-gold), var(--capo-gold-dark));
		flex-shrink: 0;
		animation: accentPulse 3s ease-in-out infinite;
	}

	.wp-divider {
		width: 60%;
		height: 1px;
		margin: 0.25rem auto;
		background: linear-gradient(90deg, transparent, rgba(var(--capo-gold-rgb), 0.3), rgba(var(--capo-gold-light-rgb), 0.2), transparent);
	}

	.wp-foot {
		margin: 0;
		font-size: 0.75rem;
		opacity: 0.5;
		text-align: center;
		line-height: 1.45;
		letter-spacing: 0.02em;
	}
</style>
