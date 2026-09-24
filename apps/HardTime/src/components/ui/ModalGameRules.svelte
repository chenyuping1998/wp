<script lang="ts">
	import { Popup } from 'components-shared';
	import { zIndex } from 'constants-shared/zIndex';
	import { stateModal } from 'state-shared';

	import { base } from '$app/paths';

	import config from '../../game/config';
	import { popupGhost } from './popupGhost';
	import { getSocialTerms } from '../../game/socialTerms';

	// Social play forbids betting terminology in player-facing copy, and the rules
	// page is the densest concentration of it in the game. The vocabulary lives in
	// one module shared with the pay table — two panels with their own copies
	// drift, and the drift is what gets flagged.
	const T = getSocialTerms();

	// Controls guide. Each row shows the actual button art from the bet bar, so a
	// player matches what they read to what they see rather than decoding a name.
	// Icons come from static/, not the pixi asset pipeline — this panel is DOM.
	// hardTimeUiIcons, not capoUiIcons. This is built as a TEMPLATE LITERAL —
	// `${ICONS}/${name}.png` — so the folder and the filename never appear next to
	// each other in the source. A grep for "sprites/capoUiIcons/" finds nothing,
	// which is how the dead-asset pass deleted the folder on 2026-09-15 and left
	// every control icon in this panel a broken image. Path-literal greps cannot
	// see a split path; the build's asset guard reads assets.ts and this is a DOM
	// panel, so nothing caught it either.
	const ICONS = `${base}/assets/sprites/hardTimeUiIcons`;
	// `icons` is a list because a control can be a pair — the stepper is two keys,
	// and showing only one of them would misrepresent it. Buy Bonus has none: on
	// the bar it is a labelled plate rather than a glyph, so there is no icon that
	// would actually match what the player sees.
	const controls: { icons: string[]; plate?: string; name: string; text: string }[] = [
		{
			icons: ['spin'],
			name: 'Spin',
			text: `Starts a round for the current ${T.bet}. The space bar does the same thing. While the reels are turning it becomes Stop, which brings them to rest early.`,
		},
		{
			icons: ['decrease', 'increase'],
			name: 'Decrease / increase',
			text: `Steps the ${T.bet} up or down through the available ${T.betLevels}.`,
		},
		{
			icons: [],
			plate: T.buyBonusName,
			name: T.buyBonusName,
			text: `Opens the feature menu, where any of the three free-spin features can be ${T.bought} outright for the stated multiple of your ${T.bet}. The ${T.cost} is shown before you confirm.`,
		},
		{
			icons: ['autoSpin'],
			name: 'Auto Spin',
			text: 'Plays a chosen number of rounds automatically. Open it to set the count and any stop conditions; press it again to stop early.',
		},
		{
			icons: ['turbo'],
			name: 'Turbo',
			text: 'Shortens the spin and win presentations. Lit means turbo is on.',
		},
		{
			icons: ['menu'],
			name: 'Menu',
			text: `Opens the ${T.payTableCaps.toLowerCase()}, these rules, and the sound and settings controls.`,
		},
		{
			icons: ['payTable'],
			name: T.payTableCaps,
			text: `Lists every symbol and what it ${T.pays} for 3, 4 and 5 of a kind, plus the ${T.paylines}.`,
		},
		{
			icons: ['soundOn'],
			name: 'Sound',
			text: 'Mutes and unmutes the game. Volume is adjusted under Settings.',
		},
	];

	const rtpPct = `${(config.rtp * 100).toFixed(2)}%`;
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
	const pct = (value: number) => `${(value * 100).toFixed(2)}%`;
	const rtpRangePct = rtpLow === rtpHigh ? pct(rtpLow) : `${pct(rtpLow)}\u2013${pct(rtpHigh)}`;
	const lineCount = Object.keys(config.paylines).length;
	// Fallback 12000, not Capo Nostra's 20000 — it can only be read if the config
	// is missing, and then it would advertise a cap this game cannot pay.
	const maxWin = config.betModes?.base?.max_win ?? 12000;
	const buyCost = config.betModes?.bonus?.cost;
	// Every tier awards the same number of spins; the scatter count selects which
	// tier is played rather than how long it lasts (maths: freespin_triggers).
	// 8, not 10 — see the note on FREE_SPINS in ModalPayTable.svelte. Both were
	// left at Capo Nostra's count by the scaffold copy, and both are player-facing.
	const baseFreeSpins = 8;
	const reelCount = config.numReels;
	// 4, not 3 — this game is 5x4. The old ?? 3 would have printed "5X3" if the
	// key ever went missing, disagreeing with LoadingScreen and ModalPayTable,
	// which both fall back to 4.
	const rowCount = config.numRows?.[0] ?? 4;

	// Per-mode RTP and max win, read straight out of the maths config rather than
	// written into the prose. Certification asks for both to be clearly stated for
	// every mode available; spelling them out in one table is harder to miss than
	// leaving them scattered through the sections, and taking the numbers from
	// config means they cannot drift away from what the game actually pays.
	type BetMode = { cost?: number; rtp?: number; max_win?: number };
	const modeRows = (
		[
			['Base game', 'base', 'Every spin'],
			// "(N Scatters)", not the old "(N FS)". FS is the Scatter symbol's name
			// on the reels, but in a table of free-spin modes "3 FS" reads as
			// "3 free spins" — and every mode awards 8. This wording now matches
			// the trigger table further down, which already says "3 Scatters".
			[
				'Lockdown (3 Scatters)',
				'bonus',
				`${T.entryVerb} for ${config.betModes?.bonus?.cost}× ${T.bet}`,
			],
			[
				'Riot (4 Scatters)',
				'bonus_hits',
				`${T.entryVerb} for ${config.betModes?.bonus_hits?.cost}× ${T.bet}`,
			],
			[
				'Breakout (5 Scatters)',
				'bonus_epic',
				`${T.entryVerb} for ${config.betModes?.bonus_epic?.cost}× ${T.bet}`,
			],
		] as const
	).map(([label, key, entry]) => {
		const mode = config.betModes?.[key] as BetMode | undefined;
		return {
			label,
			entry,
			rtp: mode?.rtp !== undefined ? `${(mode.rtp * 100).toFixed(2)}%` : rtpPct,
			maxWin: `${(mode?.max_win ?? maxWin).toLocaleString()}×`,
		};
	});
</script>

{#if stateModal.modal?.name === 'gameRules'}
	<Popup zIndex={zIndex.modal} onclose={() => (stateModal.modal = null)}>
		<div class="wp-rules" use:popupGhost>
			<h2>HARD TIME — GAME RULES</h2>

			<section class="wp-card">
				<h3><span class="wp-accent-bar"></span>How to play</h3>
				<p>
					Hard Time is a {reelCount}&times;{rowCount} video slot with {lineCount} fixed
					{T.paylines}. {T.combinationDirection}. Only the highest win is {T.paid} per line, and
					all line wins are added together. The theoretical return to player (RTP) is {rtpRangePct},
					depending on the mode played &mdash; every mode's figure is listed in the table below.
				</p>
			</section>

			<!-- Certification asked for a user interaction guide in the game
			     information. Kept as a definition list of the actual on-screen
			     controls, in the order they sit on the bar. -->
			<section class="wp-card">
				<h3><span class="wp-accent-bar"></span>Controls</h3>
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
				<p class="wp-modes-note">
					Where a win presentation is playing, tapping anywhere skips to the end of it.
				</p>
			</section>

			<section class="wp-card">
				<h3><span class="wp-accent-bar"></span>RTP &amp; Max Win by mode</h3>
				<table class="wp-modes">
					<thead>
						<tr>
							<th scope="col">Mode</th>
							<th scope="col">How to enter</th>
							<th scope="col">RTP</th>
							<th scope="col">Max win</th>
						</tr>
					</thead>
					<tbody>
						{#each modeRows as row (row.label)}
							<tr>
								<th scope="row">{row.label}</th>
								<td>{row.entry}</td>
								<td>{row.rtp}</td>
								<td>{row.maxWin} {T.bet}</td>
							</tr>
						{/each}
					</tbody>
				</table>
				<p class="wp-modes-note">
					Max win is a multiple of the {T.totalBet}. When a round reaches the cap it ends
					immediately and the capped amount is {T.paid}.
				</p>
			</section>

			<section class="wp-card">
				<h3><span class="wp-accent-bar"></span>Wild</h3>
				<p>
					The Wild substitutes for every symbol except the Scatter and the Searchlight, and
					{T.pays} as its own symbol on 5 of a kind.
				</p>
			</section>

			<section class="wp-card">
				<h3><span class="wp-accent-bar"></span>Searchlight</h3>
				<p>
					When a Searchlight lands, it lights its reel <strong>from its own position down to
					the bottom</strong> &mdash; never upward. Every lit position becomes a
					<strong>Wild</strong> before any wins are evaluated, and carries a multiplier of
					<strong>1&times; to 100&times;</strong>. A Searchlight landing on the top row lights
					four positions; one landing on the bottom row lights a single position. Scatters in
					that reel are not replaced. The Searchlight {T.doesNotPay.toLowerCase()} as a symbol
					of its own, and more than one can land on the same spin.
				</p>
				<p>
					A lit position counts towards a win when it is part of a winning {T.payline}, and the
					win is multiplied by its value. Where a {T.payline} crosses more than one lit
					position, every multiplier above 1&times; is <strong>added together</strong> and the total is applied &mdash; a 1&times; position adds nothing.
				</p>
			</section>

			<section class="wp-card">
				<h3><span class="wp-accent-bar"></span>Overlapping Beams</h3>
				<p>
					When a Searchlight lands on a reel that is <strong>already lit</strong>, every
					position the two beams share has its existing multiplier <strong>doubled</strong>,
					to a maximum of 100&times;. Positions the new beam reaches for the first time take
					the new Searchlight's own value instead.
				</p>
			</section>

			<section class="wp-card">
				<h3><span class="wp-accent-bar"></span>Scatter &amp; Free Spins</h3>
				<p>
					The Scatter appears on all five reels in the base game, and on reels 3 to 5 during free spins. {T.noPayOnItsOwn}, and does not
					need to land on a {T.payline}. The number of Scatters landing together decides which
					feature opens, and each one awards {baseFreeSpins} free spins. In every feature,
					<strong>every beam stays lit until the feature ends</strong>, so Searchlights build
					up across the spins and beams meeting on one reel double where they overlap:
				</p>
				<ul class="wp-controls">
					<li class="no-icon"><div>
						<span class="wp-control-name">3 Scatters &mdash; Lockdown</span>
						<span class="wp-control-text">The feature opens with the grid dark. Every
						Searchlight that lands stays lit for the rest of the feature.</span>
					</div></li>
					<li class="no-icon"><div>
						<span class="wp-control-name">4 Scatters &mdash; Riot</span>
						<span class="wp-control-text">The first free spin is guaranteed an extra Searchlight, and Searchlights land more often than in Lockdown.</span>
					</div></li>
					<li class="no-icon"><div>
						<span class="wp-control-name">5 Scatters &mdash; Breakout</span>
						<span class="wp-control-text">The first free spin is guaranteed an extra Searchlight, and the feature lands <strong>more Searchlights than any other tier</strong> &mdash; so beams
						meet on the same reel more often, and every overlap doubles.</span>
					</div></li>
				</ul>
			</section>

			<section class="wp-card">
				<h3><span class="wp-accent-bar"></span>Retriggers</h3>
				<p>
					Landing further Scatters together during a feature awards extra free spins:
					2 Scatters award +2, 3 Scatters award +4, 4 Scatters award +6 and 5 Scatters
					award +8. This applies in all three features.
				</p>
			</section>

			{#if buyCost}
				<section class="wp-card">
					<h3><span class="wp-accent-bar"></span>Feature Entry</h3>
					<p>
						Instead of waiting for Scatters, each feature can be {T.bought} directly from the {T.betMenu}
						for the {T.cost} shown in the table above. Each mode's RTP is shown there alongside its
						{T.cost}; across all modes it ranges from {pct(rtpLow)} to {pct(rtpHigh)}.
					</p>
				</section>
			{/if}

			<section class="wp-card">
				<h3><span class="wp-accent-bar"></span>Max Win</h3>
				<p>
					The maximum {T.payout} is capped at {maxWin.toLocaleString()}&times; the {T.totalBet}. Once
					the cap is reached the round ends immediately and the maximum win is awarded.
				</p>
			</section>

			<div class="wp-divider"></div>
			<p class="wp-foot">
				{T.disclaimerOpening} A consistent internet connection is required. In
				the event of a disconnection, reload the game to finish any uncompleted rounds. The
				expected return is calculated over many plays. The game display is not representative of
				any physical device and is for illustrative purposes only. Winnings are settled according
				to the amount received from the Remote Game Server and not from events within the web
				browser. TM and &copy; 2026 Engine.
			</p>
			<!--
				"Engine." is DICTATED by review, not chosen. Do not "correct" it to a
				studio name.

				Hot Miami took two rounds on this exact line. 2026-09-04: "remove the
				word Stake from the General Disclaimer" — the fix reasoned about it and
				put the studio's name in. 2026-09-06 came back with the literal
				instruction: "replace Silverstars Studio with Engine". It is not the
				studio's line even though it reads like one.

				Hard Time inherited "Silverstars Studio" through the scaffold copy and
				would have shipped the already-rejected wording — which is precisely the
				regression game-reskin/references/review-findings.md §1 predicted would
				happen to the next person on perfectly sensible grounds.
			-->
			<!-- verify against the BUILD, not src: a shared component can reintroduce it
			     grep -rl "Silverstars\|Stake Engine" apps/HardTime/build/ | wc -l  -> 0 -->
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
		font-size: 0.5rem;
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

	.wp-card {
		padding: 0.85rem 1rem;
		border: 8px solid transparent;
		border-image: url('/assets/sprites/hardTimeUi/buy_card_frame.svg') 96 stretch;
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
