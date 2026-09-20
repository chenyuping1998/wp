<script lang="ts">
	import { Popup } from 'components-shared';
	import { zIndex } from 'constants-shared/zIndex';
	import { stateModal } from 'state-shared';

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
			text: `Opens the feature menu, where Free Spins or Super Spin can be ${T.bought} outright for the stated multiple of your ${T.bet}. The ${T.cost} is shown before you confirm.`,
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
			text: `Lists every symbol and what it ${T.pays} for 3, 4 and 5 of a kind, plus the ${T.paylines}.`,
		},
		{
			icons: ['soundOn'],
			name: 'Sound',
			text: 'Mutes and unmutes the game. Volume is adjusted under Settings.',
		},
	];

	const entryVerb = T.entryVerb;
	const rtpPct = `${(config.rtp * 100).toFixed(2)}%`;
	const lineCount = Object.keys(config.paylines).length;
	const maxWin = config.betModes?.base?.max_win ?? 15000;
	const buyCost = config.betModes?.bonus?.cost;
	// THE SPIN AWARDS, TAKEN FROM THE MATHS RATHER THAN WRITTEN DOWN HERE.
	//
	// `scatterSpins` is game_config.py's freespin_triggers, and each bet mode's
	// `scatterTriggers` is the Scatter count that mode's entry forces — both
	// scraped by design/sync_math_config.mjs, which also refuses to build if a
	// mode forces a count the trigger table does not award spins for.
	//
	// They are read rather than restated because restating them is what went
	// wrong: this page, the pay table, the loading tips and the feature card all
	// said "4 or 5 Scatters award 12 or 15 Free Spins" while every distribution in
	// the maths forced five — a sentence no book in the shipped game supported,
	// repeated in four places.
	const spinsFor = (config.scatterSpins ?? {}) as Record<string, number>;
	const scatterCounts = Object.keys(spinsFor)
		.map(Number)
		.sort((a, b) => a - b);
	const asList = (values: (string | number)[]) =>
		values.length > 1 ? `${values.slice(0, -1).join(', ')} or ${values[values.length - 1]}` : `${values[0]}`;
	const scatterCountList = asList(scatterCounts);
	const scatterSpinList = asList(scatterCounts.map((n) => spinsFor[n]));

	/** What a bought entry lands and what that Scatter count is worth. */
	const boughtEntry = (key: 'bonus100' | 'bonus' | 'superbonus') => {
		const triggers = (config.betModes?.[key] as { scatterTriggers?: Record<string, number> })
			?.scatterTriggers;
		const count = Object.keys(triggers ?? {})[0];
		return count ? { count: Number(count), spins: spinsFor[count] } : null;
	};
	const boughtEntry100 = boughtEntry('bonus100');
	const boughtFree = boughtEntry('bonus');
	const boughtSuper = boughtEntry('superbonus');
	const reelCount = config.numReels;
	const rowCount = config.numRows?.[0] ?? 3;

	// Per-mode RTP and max win, read straight out of the maths config rather than
	// written into the prose. Certification asks for both to be clearly stated for
	// every mode available; spelling them out in one table is harder to miss than
	// leaving them scattered through the sections, and taking the numbers from
	// config means they cannot drift away from what the game actually pays.
	type BetMode = { cost?: number; rtp?: number; max_win?: number };
	const modeRows = (
		[
			['Base game', 'base', 'Every spin'],
			// The 100x entry buy. Certification asks for RTP and max win to be
			// stated for every mode the player can reach, so a mode added to the buy
			// menu has to arrive in this table on the same day.
			[
				'Free Spins (100×)',
				'bonus100',
				`${entryVerb} for ${config.betModes?.bonus100?.cost}× ${T.bet}`,
			],
			['Free Spins (200×)', 'bonus', `${entryVerb} for ${config.betModes?.bonus?.cost}× ${T.bet}`],
			// The 500x buy. It was absent from this table while having its own RTP
			// and its own max win in the maths — which is the one thing the table
			// exists to state for every mode the player can reach.
			[
				'Super Free Spins',
				'superbonus',
				`${entryVerb} for ${config.betModes?.superbonus?.cost}× ${T.bet}`,
			],
			['Super Spin', 'superspin', `${entryVerb} for ${config.betModes?.superspin?.cost}× ${T.bet}`],
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
		<div class="wp-rules">
			<h2>GO BANANUBIS — GAME RULES</h2>

			<section class="wp-card">
				<h3><span class="wp-accent-bar"></span>How to play</h3>
				<p>
					Go Bananubis is a {reelCount}&times;{rowCount} video slot with {lineCount} fixed
					{T.paylines}. {T.combinationDirection}. Only the highest win is {T.paid} per line, and all
					line wins are added together. The theoretical return to player (RTP) is {rtpPct}.
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
					The Wild substitutes for every symbol except the Scatter and a sealed Tablet, and
					also {T.pays} as its own symbol on 3, 4 or 5 of a kind. It behaves the same way in
					the base game and in Free Spins &mdash; it does not expand and it does not stick.
				</p>
			</section>

			<section class="wp-card">
				<h3><span class="wp-accent-bar"></span>Scatter</h3>
				<p>
					The Golden Bananas Scatter appears on all five reels. It does not {T.pay} on its own and
					does not need to land on a {T.payline} &mdash; its only job is to open the feature.
					Landing {scatterCountList} Scatters in a single spin awards {scatterSpinList} Free Spins
					respectively.
					{#if boughtEntry100 && boughtFree && boughtSuper}
						A {T.bought} entry lands its own Scatters and is {T.paid} the same way &mdash; each
						one opens on the count it names, and the spins follow from the table above:
						{boughtEntry100.count} Scatters for {boughtEntry100.spins} spins,
						{boughtFree.count} for {boughtFree.spins}, and Super Free Spins on
						{boughtSuper.count} for {boughtSuper.spins}. The number of spins is always the number
						the board in front of you is worth.
					{/if}
				</p>
			</section>

			<section class="wp-card">
				<h3><span class="wp-accent-bar"></span>Sealed Tablets</h3>
				<p>
					Sealed Tablets can land anywhere on the board. When the reels stop, every Tablet
					on the board breaks open at once and they all hold
					<strong>one and the same symbol</strong>. A Tablet never {T.pays} as itself &mdash;
					by the time the board is read there are none left, only what was under them.
				</p>
			</section>

			<section class="wp-card">
				<h3><span class="wp-accent-bar"></span>Free Spins &amp; the Seal</h3>
				<p>
					During Free Spins the whole round carries <strong>one seal</strong>: every Tablet,
					on every spin, holds the same symbol. And once a Tablet is opened it
					<strong>stays on the board</strong> for the rest of the round, so the same symbol
					builds up spin after spin.
				</p>
				<p>
					Every opened Tablet also carries a win multiplier from
					<strong>2&times; to 50&times;</strong>. The value is
					<strong>drawn again on every spin</strong> &mdash; it can go up or down. Multipliers
					of all opened Tablets on a winning {T.payline} are added together, so a line running
					through several of them can apply far more than 50&times;.
				</p>
			</section>

			<!-- Own section rather than a closing sentence inside Free Spins: the
			     statement was already there but buried at the end of a paragraph,
			     and certification asked for it to be clarified. Reviewers scan
			     headings. Verified against the maths — no book in any mode emits
			     freeSpinRetrigger. -->
			<section class="wp-card">
				<h3><span class="wp-accent-bar"></span>Retriggers</h3>
				<p>
					<strong>Free Spins cannot be retriggered.</strong> Landing further Scatters while the
					feature is running does not award additional free spins, and the number of spins
					granted when the feature starts is the number you play. This applies to Free Spins
					entered by landing Scatters, to Free Spins {T.bought} from the {T.betMenu}, and to
					Super Free Spins.
				</p>

			</section>

			<section class="wp-card">
				<h3><span class="wp-accent-bar"></span>Super Spin</h3>
				<p>
					A hold-and-spin style bonus {T.bought} from the {T.betMenu} for {config.betModes?.superspin
						?.cost}&times; your {T.totalBet}. You start with 3 respins. Every Coin that lands
					sticks to the board and resets the respins back to 3. When no respins remain, all
					stuck Coin values are added up and {T.paid} out. Maximum win:
					{config.betModes?.superspin?.max_win?.toLocaleString()}&times; the {T.totalBet}.
				</p>
			</section>

			{#if buyCost}
				<section class="wp-card">
					<h3><span class="wp-accent-bar"></span>{T.buyBonusName}</h3>
					<p>
						Instead of waiting for Scatters, you can {T.buy} direct entry into the Free Spins
						feature for {buyCost}&times; your {T.totalBet}. The round opens on a real triggering
						board and plays the spins that board is worth &mdash; there are no extra spins
						granted behind the scenes. {T.buyBonusName} runs at the same {rtpPct} RTP.
					</p>
				</section>
			{/if}

			<!-- The cap is PER MODE, and this section used to state one figure as
			     though it were the game's. Certification asked for it to be amended
			     because it does not apply to Super Spin, which the maths caps at
			     2,000x rather than the line games' cap (config.betModes.superspin.max_win).
			     Both numbers are read from the config so neither can drift from
			     what the game actually pays. -->
			<section class="wp-card">
				<h3><span class="wp-accent-bar"></span>Max Win</h3>
				<p>
					The maximum {T.payout} is capped at {maxWin.toLocaleString()}&times; the {T.totalBet}.
					Once the cap is reached the round ends immediately and the maximum win is awarded.
					This applies to the base game, to Free Spins and to Super Free Spins.
				</p>
				<p>
					<strong>Super Spin is capped separately</strong>, at
					{config.betModes?.superspin?.max_win?.toLocaleString()}&times; the {T.totalBet}. The
					{maxWin.toLocaleString()}&times; figure above does not apply to it.
				</p>
			</section>

			<div class="wp-divider"></div>
			<p class="wp-foot">
				Malfunction voids all wins and plays. A consistent internet connection is required. In
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
