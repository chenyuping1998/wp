<script lang="ts">
	import { Popup } from 'components-shared';
	import { zIndex } from 'constants-shared/zIndex';
	import { stateModal } from 'state-shared';

	import { base } from '$app/paths';

	import config from '../../game/config';
	import { getSocialTerms } from '../../game/socialTerms';

	// Social play forbids betting terminology in player-facing copy, and the rules
	// page is the densest concentration of it in the game. The vocabulary lives in
	// one module shared with the pay table — two panels with their own copies
	// drift, and the drift is what gets flagged.
	const T = getSocialTerms();

	// Controls guide. Each row shows the actual button art from the bet bar, so a
	// player matches what they read to what they see rather than decoding a name.
	// Icons come from static/, not the pixi asset pipeline — this panel is DOM.
	const ICONS = `${base}/assets/sprites/mooooUiIcons`;
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
			// "three free-spin features" was Hot Miami's count. Moooo has two, and it
			// reads them off the maths bundle rather than restating a number that can
			// go stale the next time a mode is added or dropped.
			text: `Opens the feature menu, where either free-spin feature can be ${T.bought} outright for the stated multiple of your ${T.bet}. The ${T.cost} is shown before you confirm.`,
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
				'Free Spins (3 Scatters)',
				'bonus',
				`${T.entryVerb} for ${config.betModes?.bonus?.cost}× ${T.bet}`,
			],
			[
				'Super Free Spins (4 Scatters)',
				'super',
				`${T.entryVerb} for ${config.betModes?.super?.cost}× ${T.bet}`,
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
		<div class="moo-rules">
			<h2>MOOOO — GAME RULES</h2>

			<section class="moo-card">
				<h3><span class="moo-accent-bar"></span>How to play</h3>
				<p>
					Moooo is a {reelCount}&times;{rowCount} video slot with {lineCount} fixed
					{T.paylines}. {T.combinationDirection}. Only the highest win is {T.paid} per line, and
					all line wins are added together. The theoretical return to player (RTP) of base play is {rtpPct}.
				</p>
			</section>

			<!-- Certification asked for a user interaction guide in the game
			     information. Kept as a definition list of the actual on-screen
			     controls, in the order they sit on the bar. -->
			<section class="moo-card">
				<h3><span class="moo-accent-bar"></span>Controls</h3>
				<ul class="moo-controls">
					{#each controls as control (control.name)}
						<li class:no-icon={control.icons.length === 0}>
							{#if control.icons.length}
								<span class="moo-control-icons">
									{#each control.icons as name (name)}
										<img src={`${ICONS}/${name}.png`} alt="" aria-hidden="true" />
									{/each}
								</span>
							{/if}
							<div>
								<span class="moo-control-name">{control.name}</span>
								<span class="moo-control-text">{control.text}</span>
							</div>
						</li>
					{/each}
				</ul>
				<p class="moo-modes-note">
					Where a win presentation is playing, tapping anywhere skips to the end of it.
				</p>
			</section>

			<section class="moo-card">
				<h3><span class="moo-accent-bar"></span>RTP &amp; Max Win by mode</h3>
				<table class="moo-modes">
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
				<p class="moo-modes-note">
					Max win is a multiple of the {T.totalBet}. When a round reaches the cap it ends
					immediately and the capped amount is {T.paid}.
				</p>
			</section>

			<!--
				2026-08-26: everything from here to the end of the Retriggers card used
				to describe HOT MIAMI. Neon W, Neon Frames, the Collector, Neon Nights,
				Sunset Hits, Ocean Drive — none of them exist in this game, and the
				panel a player opens to learn the rules explained a different one. It
				is rewritten from math-sdk/games/moooo/game_config.py, so every number
				below is the number the maths actually uses.
			-->
			<section class="moo-card">
				<h3><span class="moo-accent-bar"></span>Moooo Wild</h3>
				<p>
					The cow substitutes for every symbol except the Scatter and the Milk Churn, and
					{T.pays} as its own symbol on 5 of a kind.
				</p>
				<p>
					When a cow lands, it opens its mouth and fills its whole reel &mdash;
					<strong>but only if that reel crosses a winning {T.payline}</strong>. A cow on a reel
					that takes no part in a win stays a single symbol.
				</p>
			</section>

			<section class="moo-card">
				<h3><span class="moo-accent-bar"></span>The Bell</h3>
				<p>
					Every cow carries a bell, and the bell carries a multiplier. Its colour says which
					band the value comes from, and the colour lands with the cow &mdash; before you know
					whether the reel will fill.
				</p>
				<ul class="moo-controls">
					<li class="no-icon"><div>
						<span class="moo-control-name">Pasture &mdash; brass</span>
						<span class="moo-control-text">2&times; to 10&times;</span>
					</div></li>
					<li class="no-icon"><div>
						<span class="moo-control-name">Prize &mdash; silver</span>
						<span class="moo-control-text">5&times;, 10&times;, 15&times;, 20&times;, 25&times;
						or 50&times;</span>
					</div></li>
					<li class="no-icon"><div>
						<span class="moo-control-name">Champion &mdash; gold</span>
						<span class="moo-control-text">10&times;, 15&times;, 20&times;, 25&times;, 50&times;
						or 100&times;</span>
					</div></li>
				</ul>
				<p>
					Where more than one cow takes part in the same win, their bell values are
					<strong>added together</strong> and the total multiplies that win.
				</p>
			</section>

			<section class="moo-card">
				<h3><span class="moo-accent-bar"></span>Milk Churn &amp; the Milk Meter</h3>
				<p>
					In Free Spins every reel carries a Milk Meter of three steps. A reel&rsquo;s meter is
					not progress towards a prize &mdash; it is a <strong>floor</strong>: it says the
					lowest band a bell on that reel can come from.
				</p>
				<p>
					A Milk Churn landing on a reel raises that reel&rsquo;s meter by one step, and it
					stays raised for the rest of the round. At step&nbsp;2 that reel can no longer roll a
					Pasture bell; at step&nbsp;3 every bell it rolls is Champion. A Churn landing on a reel
					already at the top does nothing.
				</p>
				<!--
					`doesNotPayAlone` is written to open a sentence ("Does not pay on its
					own"), so it cannot be dropped into the middle of one — it rendered as
					"The Milk Churn Does not pay on its own".
				-->
				<p>{T.doesNotPayAlone}. The Milk Churn appears in Free Spins only.</p>
			</section>

			<section class="moo-card">
				<h3><span class="moo-accent-bar"></span>Scatter &amp; Free Spins</h3>
				<p>
					The FS Scatter appears on all five reels. {T.noPayOnItsOwn}, and does not
					need to land on a {T.payline}. Both features award {baseFreeSpins} free spins; the
					number of Scatters decides where the meters START, not how long you play:
				</p>
				<ul class="moo-controls">
					<li class="no-icon"><div>
						<span class="moo-control-name">3 Scatters &mdash; Free Spins</span>
						<span class="moo-control-text">{baseFreeSpins} free spins, every Milk Meter at
						step&nbsp;1.</span>
					</div></li>
					<li class="no-icon"><div>
						<span class="moo-control-name">4 or 5 Scatters &mdash; Super Free Spins</span>
						<span class="moo-control-text">{baseFreeSpins} free spins, every Milk Meter already
						at step&nbsp;2 &mdash; so no reel can roll a Pasture bell for the whole
						round.</span>
					</div></li>
				</ul>
			</section>

			<section class="moo-card">
				<h3><span class="moo-accent-bar"></span>Retriggers</h3>
				<p>
					Landing further Scatters together during Free Spins awards extra spins: 2 Scatters
					award +2, 3 Scatters award +4, 4 Scatters award +6 and 5 Scatters award +8.
				</p>
			</section>

			{#if buyCost}
				<section class="moo-card">
					<h3><span class="moo-accent-bar"></span>Feature Entry</h3>
					<p>
						Instead of waiting for Scatters, each feature can be {T.bought} directly from the {T.betMenu}
						for the {T.cost} shown in the table above. Each mode&rsquo;s own RTP is listed there.
					</p>
				</section>
			{/if}

			<section class="moo-card">
				<h3><span class="moo-accent-bar"></span>Max Win</h3>
				<p>
					The maximum {T.payout} is capped at {maxWin.toLocaleString()}&times; the {T.totalBet}. Once
					the cap is reached the round ends immediately and the maximum win is awarded.
				</p>
			</section>

			<div class="moo-divider"></div>
			<p class="moo-foot">
				{T.disclaimerOpening} A consistent internet connection is required. In
				the event of a disconnection, reload the game to finish any uncompleted rounds. The
				expected return is calculated over many plays. The game display is not representative of
				any physical device and is for illustrative purposes only. Winnings are settled according
				to the amount received from the Remote Game Server and not from events within the web
				browser. TM and &copy; 2026 Stake Engine.
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
		0%, 100% { opacity: 0.7; box-shadow: 0 0 6px rgba(255, 215, 94, 0.3); }
		50% { opacity: 1; box-shadow: 0 0 12px rgba(255, 215, 94, 0.55); }
	}

	.moo-rules {
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
			background: linear-gradient(135deg, #ffe98a 0%, #ffd75e 50%, #e8a13c 100%);
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
	.moo-controls {
		list-style: none;
		margin: 0.5rem 0 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0.55rem;
	}

	.moo-controls li {
		display: grid;
		/* wide enough for the two-key stepper; a single icon sits left-aligned in
		   the same column so every row's text starts on one line */
		grid-template-columns: 4.6rem 1fr;
		align-items: start;
		gap: 0.7rem;
	}

	/* Buy Bonus is a labelled plate on the bar, not a glyph — with no icon to
	   show, the text takes the whole row rather than leaving a gap. */
	.moo-controls li.no-icon {
		grid-template-columns: 1fr;
	}

	.moo-control-icons {
		display: flex;
		align-items: center;
		gap: 0.4rem;
	}

	.moo-controls img {
		width: 2.1rem;
		height: 2.1rem;
		object-fit: contain;
		/* nudge down so the glyph optically centres on the first line of text */
		margin-top: -0.15rem;
	}

	.moo-control-name {
		display: block;
		color: #fff3bd;
		font-weight: 700;
		font-size: 0.86rem;
		line-height: 1.3;
	}

	.moo-control-text {
		display: block;
		font-size: 0.8rem;
		line-height: 1.35;
		opacity: 0.88;
	}

	/* Mode comparison table — RTP and max win per mode, as certification asks
	   these be clearly stated for every mode. Values come from the maths config
	   (see modeRows), so the table cannot drift from what the game pays. */
	.moo-modes {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.82rem;
		margin-top: 0.35rem;
	}

	.moo-modes th,
	.moo-modes td {
		padding: 0.42rem 0.5rem;
		text-align: left;
		border-bottom: 1px solid rgba(255, 255, 255, 0.07);
	}

	.moo-modes thead th {
		color: rgba(255, 215, 94, 0.9);
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		font-size: 0.72rem;
		border-bottom-color: rgba(255, 215, 94, 0.35);
	}

	.moo-modes tbody th {
		color: #fff3bd;
		font-weight: 700;
		white-space: nowrap;
	}

	/* RTP and max win are the two numbers being certified — keep them legible
	   rather than letting them sit in body-copy grey */
	.moo-modes tbody td:nth-child(3),
	.moo-modes tbody td:nth-child(4) {
		color: #ffffff;
		font-weight: 600;
		white-space: nowrap;
	}

	.moo-modes tbody tr:last-child th,
	.moo-modes tbody tr:last-child td {
		border-bottom: none;
	}

	.moo-modes-note {
		margin-top: 0.5rem;
		font-size: 0.76rem;
		opacity: 0.75;
	}

	.moo-card {
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

	.moo-accent-bar {
		display: inline-block;
		width: 3px;
		height: 1.1em;
		border-radius: 2px;
		background: linear-gradient(180deg, #ffd75e, #e8a13c);
		flex-shrink: 0;
		animation: accentPulse 3s ease-in-out infinite;
	}

	.moo-divider {
		width: 60%;
		height: 1px;
		margin: 0.25rem auto;
		background: linear-gradient(90deg, transparent, rgba(255, 215, 94, 0.3), rgba(255, 233, 138, 0.2), transparent);
	}

	.moo-foot {
		margin: 0;
		font-size: 0.75rem;
		opacity: 0.5;
		text-align: center;
		line-height: 1.45;
		letter-spacing: 0.02em;
	}
</style>
