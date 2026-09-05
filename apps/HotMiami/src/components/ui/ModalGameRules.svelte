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
	const ICONS = `${base}/assets/sprites/hotMiamiUiIcons`;
	// `icons` is a list because a control can be a pair — the stepper is two keys,
	// and showing only one of them would misrepresent it. Buy Bonus has none: on
	// the bar it is a labelled plate rather than a glyph, so there is no icon that
	// would actually match what the player sees.
	const controls = [
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
	// The modes are no longer all on one number: Ocean Drive is priced at 94.17%
	// because its strips carry no Scatter and no Collector (maths game_config.py),
	// while the rest sit at 94.00%. Two sentences below used to assert they were
	// identical, which certification reads as a claim about the game. Derive the
	// span from the config instead, so it collapses back to a single figure by
	// itself if the modes are ever levelled again.
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
			// "3 free spins" — and every mode awards 10. This wording now matches
			// the trigger table further down, which already says "3 Scatters".
			[
				'Neon Nights (3 Scatters)',
				'bonus',
				`${T.entryVerb} for ${config.betModes?.bonus?.cost}× ${T.bet}`,
			],
			[
				'Sunset Hits (4 Scatters)',
				'bonus_hits',
				`${T.entryVerb} for ${config.betModes?.bonus_hits?.cost}× ${T.bet}`,
			],
			[
				'Ocean Drive (5 Scatters)',
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
			<h2>HOT MIAMI — GAME RULES</h2>

			<section class="wp-card">
				<h3><span class="wp-accent-bar"></span>How to play</h3>
				<p>
					Hot Miami is a {reelCount}&times;{rowCount} video slot with {lineCount} fixed
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
						<li class:no-icon={control.icons.length === 0}>
							{#if control.icons.length}
								<span class="wp-control-icons">
									{#each control.icons as name (name)}
										<img src={`${ICONS}/${name}.png`} alt="" aria-hidden="true" />
									{/each}
								</span>
							{/if}
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
					The Neon W substitutes for every symbol except the Scatter and the Collector, and
					{T.pays} as its own symbol on 5 of a kind.
				</p>
			</section>

			<section class="wp-card">
				<h3><span class="wp-accent-bar"></span>Neon Frames</h3>
				<p>
					Neon Frames land on grid positions and reveal a multiplier when the reels settle.
					Possible values are 2&times;, 3&times;, 4&times;, 5&times;, 6&times;, 7&times;,
					8&times;, 9&times;, 10&times;, 25&times;, 50&times; and 100&times;. A Frame counts
					towards a win when the symbol in its position is part of a winning {T.payline}, and the
					win is multiplied by the Frame's value. Where more than one Frame takes part in the
					same win, their values are <strong>added together</strong> and the total is applied.
				</p>
			</section>

			<section class="wp-card">
				<h3><span class="wp-accent-bar"></span>Collector</h3>
				<p>
					The Collector gathers the values of every Neon Frame on the grid, whether or not they
					formed part of a winning combination. The collected total is multiplied by your {T.totalBet}
					and awarded after all line wins have been {T.paid}. Only one Collector appears on the
					grid at a time. It may land on a position that already holds a Frame — that Frame is
					swept with the rest.
				</p>
			</section>

			<section class="wp-card">
				<h3><span class="wp-accent-bar"></span>Scatter &amp; Free Spins</h3>
				<p>
					The FS Scatter appears on all five reels. {T.noPayOnItsOwn}, and does not
					need to land on a {T.payline}. The number of Scatters landing together decides which
					feature opens, and each one awards {baseFreeSpins} free spins:
				</p>
				<ul class="wp-controls">
					<li class="no-icon"><div>
						<span class="wp-control-name">3 Scatters &mdash; Neon Nights</span>
						<span class="wp-control-text">One Frame is on the grid from the start. All Frames
						are sticky and stay until the feature ends; between spins each is refilled with a
						new multiplier.</span>
					</div></li>
					<li class="no-icon"><div>
						<span class="wp-control-name">4 Scatters &mdash; Sunset Hits</span>
						<span class="wp-control-text">Three Frames are on the grid from the start. Frame
						values are sticky, and any Frame that takes part in a win doubles before the next
						spin. Each Frame doubles at most once per spin.</span>
					</div></li>
					<li class="no-icon"><div>
						<span class="wp-control-name">5 Scatters &mdash; Ocean Drive</span>
						<span class="wp-control-text">Every position carries a Frame from the start, with
						the doubling rule of Sunset Hits. Collector and Scatter symbols do not appear in
						this feature.</span>
					</div></li>
				</ul>
			</section>

			<section class="wp-card">
				<h3><span class="wp-accent-bar"></span>Retriggers</h3>
				<p>
					Landing further Scatters together during Neon Nights or Sunset Hits awards extra free
					spins: 2 Scatters award +2, 3 Scatters award +4, 4 Scatters award +6 and 5 Scatters
					award +8. Ocean Drive has no Scatters and therefore cannot be retriggered.
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
				This closing line is DICTATED BY REVIEW, twice, and is not ours to
				word:
				  2026-09-04  "Please remove the word Stake from the General
				              Disclaimer" — it had read "Stake Engine", so it was
				              changed to the studio's own name.
				  2026-09-06  "Please replace Silverstars Studio with Engine" —
				              so it is now exactly "Engine", with no studio name
				              and no "Stake".
				Do not restore a studio name here on the reasoning that a copyright
				notice ought to carry one. It was tried; it came back.
				The required sentence is `disclaimerOpening` above.
			-->
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
		0%, 100% { opacity: 0.7; box-shadow: 0 0 6px rgba(255, 215, 94, 0.3); }
		50% { opacity: 1; box-shadow: 0 0 12px rgba(255, 215, 94, 0.55); }
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
		color: #fff;
		text-align: left;
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
			margin: 0 0 0.35rem;
			text-align: center;
			font-size: 1.65rem;
			font-weight: 800;
			letter-spacing: 0.08em;
			background: linear-gradient(135deg, #ffe98a 0%, #ffd75e 50%, #ff8ede 100%);
			background-size: 200% auto;
			-webkit-background-clip: text;
			-webkit-text-fill-color: transparent;
			background-clip: text;
			animation: shimmer 4s linear infinite;
			filter: drop-shadow(0 0 18px rgba(255, 215, 94, 0.4));
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

	/* Buy Bonus is a labelled plate on the bar, not a glyph — with no icon to
	   show, the text takes the whole row rather than leaving a gap. */
	.wp-controls li.no-icon {
		grid-template-columns: 1fr;
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
		color: #fff3bd;
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
		border-bottom: 1px solid rgba(255, 255, 255, 0.07);
	}

	.wp-modes thead th {
		color: rgba(255, 215, 94, 0.9);
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		font-size: 0.72rem;
		border-bottom-color: rgba(255, 215, 94, 0.35);
	}

	.wp-modes tbody th {
		color: #fff3bd;
		font-weight: 700;
		white-space: nowrap;
	}

	/* RTP and max win are the two numbers being certified — keep them legible
	   rather than letting them sit in body-copy grey */
	.wp-modes tbody td:nth-child(3),
	.wp-modes tbody td:nth-child(4) {
		color: #ffffff;
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
		border-radius: 0.75rem;
		background: rgba(255, 255, 255, 0.03);
		backdrop-filter: blur(6px);
		-webkit-backdrop-filter: blur(6px);
		border: 1px solid rgba(255, 255, 255, 0.05);
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
			background: rgba(255, 215, 94, 0.06);
			border-color: rgba(255, 215, 94, 0.18);
			box-shadow: 0 0 16px rgba(255, 215, 94, 0.1);
		}

		h3 {
			display: flex;
			align-items: center;
			gap: 0.5rem;
			margin: 0 0 0.35rem;
			font-size: 1.05rem;
			font-weight: 700;
			color: #ffd75e;
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
		background: linear-gradient(180deg, #ffd75e, #ff8ede);
		flex-shrink: 0;
		animation: accentPulse 3s ease-in-out infinite;
	}

	.wp-divider {
		width: 60%;
		height: 1px;
		margin: 0.25rem auto;
		background: linear-gradient(90deg, transparent, rgba(255, 215, 94, 0.3), rgba(255, 233, 138, 0.2), transparent);
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
