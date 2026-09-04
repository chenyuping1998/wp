<script lang="ts">
	import { Popup } from 'components-shared';
	import { zIndex } from 'constants-shared/zIndex';
	import { stateModal, LEGAL_NOTICE } from 'state-shared';

	import { base } from '$app/paths';

	import config from '../../game/config';
	import { getSocialTerms } from '../../game/socialTerms';

	// Shared with the pay table — the two panels describe the same game and must
	// use the same words for it. See socialTerms.ts.
	const T = getSocialTerms();

	// Controls guide. Each row shows the actual button art from the bet bar, so a
	// player matches what they read to what they see rather than decoding a name.
	// Icons come from static/, not the pixi asset pipeline — this panel is DOM.
	const ICONS = `${base}/assets/sprites/goBananasUiIcons`;
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
			text: `Opens the feature menu, where Hold and Spin or any of the three Free Spins rounds can be ${T.bought} outright for the stated multiple of your ${T.bet}. The ${T.cost} is shown before you confirm.`,
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
			text: `Opens the ${T.payTable}, these rules, and the sound and settings controls.`,
		},
		{
			icons: ['payTable'],
			get name() { return T.payTableCaps; },
			text: `Lists every symbol and what it ${T.pays} for 3, 4 and 5 of a kind, and how the ${T.ways} are counted.`,
		},
		{
			icons: ['soundOn'],
			name: 'Sound',
			text: 'Mutes and unmutes the game. Volume is adjusted under Settings.',
		},
	];

	const entryVerb = T.entryVerb;
	const rtpPct = `${(config.rtp * 100).toFixed(2)}%`;
	// The fallback is only reached if the maths config is missing the field, and a
	// wrong one is worse than a crash: it would print a plausible number nobody
	// questions. 1500 was gen-2's cap and survived the change to 10,000 here.
	const maxWin = config.betModes?.base?.max_win ?? 10000;
	const reelCount = config.numReels;
	const rowCount = config.numRows?.[0] ?? 4;

	// Ways, not lines. The product of the row counts: 4x5 gives 1,024. Derived
	// rather than typed, because the board size is config-driven — this comment
	// said 3,125 for a 5x5 board right up until the board became 4x5, which is
	// the exact drift the derivation exists to prevent.
	// config.paylines does not exist in a ways game.
	const waysCount = (config.numRows ?? []).reduce((a: number, b: number) => a * b, 1);

	// Awarded spins by scatter count, straight from the maths' freespin_triggers
	// (design/sync_math_config.mjs lifts it into config). Read rather than typed
	// so the Scatter and Retriggers sections cannot drift apart, and cannot drift
	// from the game.
	const scatterSpins = Object.values(config.scatterSpins ?? { 3: 8, 4: 10, 5: 12 }).join(', ');

	// spins/start_cuts are added to the generated config by
	// design/sync_math_config.mjs, which lifts them out of game_config.py — they
	// are not part of the SDK's exported shape, so the generated type does not
	// know about them.
	type BuyMode = { cost?: number; spins?: number; start_banked?: number };

	// The three buy tiers. Prices, spin counts and banked dynamite all come from
	// config — the last two are lifted out of game_config.py by the sync script,
	// because the SDK's exported config carries nothing about the feature.
	// `as const` on the keys, so each lookup is on a known member of config's
	// generated betModes type rather than an implicit any-index.
	const buyTiers = (['bonus100', 'bonus200', 'bonus300'] as const)
		.map((key) => {
			const mode = config.betModes[key] as BuyMode | undefined;
			// How wide the FIRST blast is, derived from the tier's banked dynamite
			// against the ladder — the rules screen must not carry a second copy of
			// the rungs, or it will drift from the maths the first time they move.
			const banked = mode?.start_banked ?? 0;
			let startReels = 1;
			for (const [level, needed] of Object.entries(config.blastLadder ?? {})) {
				if (banked >= (needed as number)) startReels = Number(level) + 1;
			}
			return { key, cost: mode?.cost, spins: mode?.spins, startReels };
		})
		.filter((t) => t.cost !== undefined && t.spins !== undefined);

	// Per-mode RTP and max win, read straight out of the maths config rather than
	// written into the prose. Certification asks for both to be clearly stated for
	// every mode available; spelling them out in one table is harder to miss than
	// leaving them scattered through the sections, and taking the numbers from
	// config means they cannot drift away from what the game actually pays.
	type BetMode = { cost?: number; rtp?: number; max_win?: number };
	const modeRows = (
		[
			['Base game', 'base', 'Every spin'],
			['Free Spins', 'bonus100', ''],
			['Super Free Spins', 'bonus200', ''],
			['Max Free Spins', 'bonus300', ''],
			['Hold and Spin', 'holdandspin', ''],
		] as const
	).map(([label, key]) => {
		const mode = config.betModes?.[key] as BetMode | undefined;
		return {
			label,
			entry:
				key === 'base'
					? `Every spin — or land 3, 4 or 5 Scatters`
					: `${entryVerb} for ${mode?.cost}× ${T.bet}`,
			rtp: mode?.rtp !== undefined ? `${(mode.rtp * 100).toFixed(2)}%` : rtpPct,
			maxWin: `${(mode?.max_win ?? maxWin).toLocaleString()}×`,
		};
	});

</script>

{#if stateModal.modal?.name === 'gameRules'}
	<Popup zIndex={zIndex.modal} onclose={() => (stateModal.modal = null)}>
		<div class="wp-rules">
			<h2>GO BANANAS DELTA — GAME RULES</h2>

			<section class="wp-card">
				<h3><span class="wp-accent-bar"></span>How to play</h3>
				<p>
					<!-- Written rows-first ("4x5"), which is how this board is referred
					     to in the project. config stores it the other way round, as
					     numReels and numRows, so the order is swapped here rather than
					     the config being renamed. -->
					Go Bananas Delta is a {rowCount}&times;{reelCount} video slot with
					<strong>{waysCount.toLocaleString()} {T.ways}</strong>. There are no fixed lines: a
					symbol counts wherever it lands on a reel. {T.combinationDirection}. A combination
					{T.pays} when the same symbol appears on 3 or more adjacent reels starting from the
					leftmost, and the number of {T.ways} it {T.pays} is the number of that symbol on each
					of those reels multiplied together. Only the highest win per symbol is {T.paid}, and
					wins from different symbols are added together. The theoretical return to player (RTP)
					is {rtpPct}.
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
				<!--
					Scroll wrapper, and the unit lifted out of every row into the header.

					Three of this table's four columns are white-space: nowrap, so they
					cannot shrink: "Hold and Spin", "96.00%" and "10,000× amount" need
					roughly 270px between them before the "How to enter" column gets a
					single pixel. The modal is width: min(36rem, 90vw), which on a
					360px-wide phone leaves 268px inside the padding — so the table was
					already over budget on a layout this game supports, and social play
					was worse than real-money play because "amount" is longer than "bet".

					Removing the per-row unit saves the widest of the three and is a
					content improvement on its own: the note directly under the table
					already says what the multiple is of, so it was being said six times.
				-->
				<div class="wp-modes-scroll">
					<table class="wp-modes">
						<thead>
							<tr>
								<th scope="col">Mode</th>
								<th scope="col">How to enter</th>
								<th scope="col">RTP</th>
								<th scope="col">Max win<br />(&times; {T.totalBet})</th>
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
				</div>
				<p class="wp-modes-note">
					Max win is a multiple of the {T.totalBet}. When a round reaches the cap it ends
					immediately and the capped amount is {T.paid}.
				</p>
			</section>

			<!-- The signature mechanic gets its own section above Wild and Scatter,
			     because it is the thing the game is built around and the only rule
			     a player of other ways games will not already know. -->
			<section class="wp-card">
				<h3><span class="wp-accent-bar"></span>Dynamite &mdash; blasting reels</h3>
				<p>
					A Dynamite can land on any reel, and <strong>at most one per reel</strong>. After the
					reels stop it detonates: every position on that reel becomes
					<strong>one and the same symbol</strong> &mdash; the
					<strong>highest-paying symbol already standing on it</strong>. A reel of four
					matching symbols contributes 4 to the {T.ways}, and because {T.ways} multiply
					across reels, it can turn a board with no combination at all into a paying one.
				</p>
				<p>
					The Dynamite is consumed by its own blast and does not {T.pay}. A Scatter caught in
					a blast is left untouched.
				</p>
			</section>

			<section class="wp-card">
				<h3><span class="wp-accent-bar"></span>The blast meter &mdash; Free Spins</h3>
				<p>
					In Free Spins every Dynamite that lands is <strong>collected</strong>, and the meter
					widens the blast as it fills. The blast covers
					<strong>1 reel, then 2, 3, 4 and finally all 5</strong>. It never falls back, so a
					run only ever gets wider.
				</p>
				<p>
					<strong>Five reels showing one symbol is {waysCount.toLocaleString()} {T.ways} on a
					single spin</strong>, and it is what the meter is climbing towards.
				</p>
			</section>

			<section class="wp-card">
				<h3><span class="wp-accent-bar"></span>Wild</h3>
				<p>
					The Foreman Wild substitutes for every symbol except the Scatter and the Dynamite.
					It does not {T.pay} as a symbol of its own. A Wild caught in a blast is replaced along
					with everything else on that reel.
				</p>
			</section>

			<section class="wp-card">
				<h3><span class="wp-accent-bar"></span>Scatter</h3>
				<p>
					The Golden Bananas Scatter appears on all five reels. It does not {T.pay} on its own
					and does not need to form a combination &mdash; its only job is to open the feature.
					Landing 3, 4 or 5 Scatters in a single spin awards {scatterSpins} Free Spins
					respectively.
				</p>
			</section>

			<!-- Own section rather than a closing sentence inside Free Spins: the
			     statement was already there but buried at the end of a paragraph,
			     and certification asked for it to be clarified. Reviewers scan
			     headings. Verified against the maths — the freegame strip FR0 carries
			     no Scatter at all, so no book in any mode can emit a retrigger. -->
			<section class="wp-card">
				<h3><span class="wp-accent-bar"></span>Retriggers</h3>
				<p>
					<strong>Free Spins cannot be retriggered.</strong> Scatters do not appear on the reels
					during the feature, so no additional free spins can be awarded once it starts: the
					number granted at the start is the number you play. This applies to Free Spins entered
					by landing Scatters and to every round {T.bought} from the {T.betMenu}.
				</p>
			</section>

			<section class="wp-card">
				<h3><span class="wp-accent-bar"></span>Hold and Spin</h3>
				<p>
					A separate prize board {T.bought} from the {T.betMenu} for {config.betModes?.holdandspin
						?.cost}&times; your {T.totalBet}. It does not use {T.ways} or Dynamite. You start
					with 3 respins. Every Coin that lands sticks to the board and resets the respins back
					to 3. When no respins remain, all stuck Coin values are added up and {T.paid} out.
					Maximum win: {config.betModes?.holdandspin?.max_win?.toLocaleString()}&times; the
					{T.totalBet}.
				</p>
			</section>

			{#if buyTiers.length}
				<section class="wp-card">
					<h3><span class="wp-accent-bar"></span>{T.buyBonusName}</h3>
					<p>
						Instead of waiting for Scatters, you can {T.buy} direct entry into Free Spins. Three
						rounds are available. All three play the same number of spins; what a dearer round
						buys is a <strong>blast meter that starts further along</strong>:
					</p>
					<ul class="wp-tiers">
						{#each buyTiers as tier (tier.key)}
							<li>
								<strong>{tier.cost}&times; {T.bet}</strong> &mdash; {tier.spins} Free Spins, first
								blast covers {tier.startReels}
								{tier.startReels === 1 ? 'reel' : 'reels'}
							</li>
						{/each}
					</ul>
					<p>
						Every round runs at the same {rtpPct} RTP as base play. The meter keeps filling from
						there, exactly as in Free Spins won with Scatters.
					</p>
				</section>
			{/if}

			<!-- The cap is PER MODE, and gen-2 was sent back by certification for
			     stating one figure as though it were the game's. It is not: Hold and
			     Spin caps lower than everything else (config.betModes.holdandspin
			     .max_win). Both numbers are read from the config so neither can
			     drift from what the game actually pays. -->
			<section class="wp-card">
				<h3><span class="wp-accent-bar"></span>Max Win</h3>
				<p>
					The maximum {T.payout} is capped at {maxWin.toLocaleString()}&times; the {T.totalBet}.
					Once the cap is reached the round ends immediately and the maximum win is awarded.
					This applies to the base game and to all three Free Spins rounds.
				</p>
				<p>
					<strong>Hold and Spin is capped separately</strong>, at
					{config.betModes?.holdandspin?.max_win?.toLocaleString()}&times; the {T.totalBet}. The
					{maxWin.toLocaleString()}&times; figure above does not apply to it.
				</p>
			</section>

			<div class="wp-divider"></div>
			<!--
				The legal notice is SHARED — state-shared/src/legal.ts — because it is
				the same paragraph in every game and the wording has already had to be
				corrected once across every app that kept its own copy. Render the
				constant; never retype the text here.
			-->
			<p class="wp-foot">{LEGAL_NOTICE}</p>
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
			background: linear-gradient(135deg, #ffe98a 0%, #ffd75e 50%, #9ec44a 100%);
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
	/* The backstop. Even with the unit gone the four columns can run out of room
	   on the narrowest supported layout, and a table that scrolls sideways is
	   readable where a clipped one is not. */
	.wp-modes-scroll {
		overflow-x: auto;
		-webkit-overflow-scrolling: touch;
	}

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

	/* The three buy tiers. A list rather than a table: each row is one short
	   sentence, and a four-column table for three rows of prose reads as
	   scaffolding around nothing. */
	.wp-tiers {
		margin: 0.6rem 0 0.6rem;
		padding-left: 1.1rem;
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
	}

	.wp-tiers li {
		font-size: 0.85rem;
		line-height: 1.45;
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
		background: linear-gradient(180deg, #ffd75e, #9ec44a);
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
