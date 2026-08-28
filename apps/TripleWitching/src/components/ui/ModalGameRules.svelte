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
	const ICONS = `${base}/assets/sprites/tripleWitchingUiIcons`;
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
			text: `Opens the feature menu, where an EXPIRY SESSION can be ${T.bought} outright for the stated multiple of your ${T.bet}. Three entries are offered - one, two or all three modifiers guaranteed - and the ${T.cost} is shown before you confirm.`,
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
			text: `Lists every symbol and what it ${T.pays} for 3, 4 and 5 of a kind - once for lines and once for ways - plus every line the game uses and how ways are counted.`,
		},
		{
			icons: ['soundOn'],
			name: 'Sound',
			text: 'Mutes and unmutes the game. Volume is adjusted under Settings.',
		},
	];

	const entryVerb = T.entryVerb;
	const rtpPct = `${(config.rtp * 100).toFixed(2)}%`;
	const maxWin = config.betModes?.base?.max_win ?? 10000;
	const buyCost = config.betModes?.bonus?.cost;
	// One source for the awarded-spins figures so the Scatter and Retriggers
	// sections cannot drift apart (see the maths: config.freespin_triggers).
	const triggerSpins = '10, 12 or 15';
	const retriggerSpins = '3, 5, 7 or 10';
	// Ways counts, quoted only in the WAYS modifier's description - the base game
	// is a lines game and these numbers do not apply to it. Every reel's symbol
	// count multiplied together: 5x3 is 243 and the expanded 5x5 is 3,125.
	const baseWays = (3 ** 5).toLocaleString();
	const featureWays = (5 ** 5).toLocaleString();
	// Line counts. The maths ships both tables; 20 is what the base board uses.
	const baseLines = Object.keys(config.paylines ?? {}).length || 20;
	const featureLines = 40;
	const reelCount = config.numReels;
	const rowCount = config.numRows?.[0] ?? 3;

	// Per-mode RTP and max win, read straight out of the maths config rather than
	// written into the prose. Certification asks for both to be clearly stated for
	// every mode available; spelling them out in one table is harder to miss than
	// leaving them scattered through the sections, and taking the numbers from
	// config means they cannot drift away from what the game actually pays.
	type BetMode = { cost?: number; rtp?: number; max_win?: number };
	// Built from the maths config, not listed by hand: the game gained two more
	// buys after this table was written, and a hand-written list would still be
	// showing two modes while the bar offered four. Certification asks for RTP
	// and max win for EVERY mode available.
	const BUY_LABELS: Record<string, string> = {
		bonus: 'Expiry Session',
		bonus2: 'Double Expiry',
		bonus3: 'Triple Expiry',
	};
	const betModeConfig = (config.betModes ?? {}) as Record<string, BetMode>;
	const modeRows = [
		{ label: 'Base game', key: 'base', entry: 'Every spin' },
		...Object.keys(BUY_LABELS)
			.filter((key) => key in betModeConfig)
			.map((key) => ({
				label: BUY_LABELS[key],
				key,
				entry: `${entryVerb} for ${betModeConfig[key].cost}× ${T.bet}`,
			})),
	].map(({ label, key, entry }) => {
		const mode = betModeConfig[key];
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
			<h2>TRIPLE WITCHING — GAME RULES</h2>

			<section class="wp-card">
				<h3><span class="wp-accent-bar"></span>How to play</h3>
				<p>
					Triple Witching is a {rowCount}&times;{reelCount} video slot played on {baseLines}
					fixed lines. A symbol {T.pays} when it lands on adjacent reels along a line, starting
					from the leftmost reel, and only the highest win on each line counts. Wins on
					different lines are added together. The theoretical return to player (RTP) is
					{rtpPct}.
				</p>
				<p>
					The EXPIRY SESSION can change both of those things: the EXPAND modifier takes the
					board to {featureLines} lines, and the WAYS modifier stops using lines altogether.
					The panel below says which modifiers a session is running.
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
				<h3><span class="wp-accent-bar"></span>CONTRACT (Wild)</h3>
				<p>
					CONTRACT substitutes for every symbol except TRIPLE WITCHING. It does not {T.pay} as a
					symbol of its own and never lands on reel 1. It is nothing more than a substitute
					unless the EXPIRY SESSION is running the MULTIPLIER modifier, in which case each one
					also carries a value.
				</p>
			</section>

			<section class="wp-card">
				<h3><span class="wp-accent-bar"></span>TRIPLE WITCHING (Scatter)</h3>
				<p>
					TRIPLE WITCHING appears on all five reels, at most once per reel. It does not {T.pay} on
					its own &mdash; its only job is to open the feature. Landing 3, 4 or 5 of them in a
					single spin awards {triggerSpins} free spins respectively.
				</p>
			</section>

			<section class="wp-card">
				<h3><span class="wp-accent-bar"></span>Expiry Session</h3>
				<p>
					Every EXPIRY SESSION runs one, two or all three of the modifiers below. Which ones it
					has is decided when the session opens, and they stay the same for the whole of it,
					retriggers included.
				</p>
				<p>
					<strong>EXPAND</strong> &mdash; the board opens two extra rows on every reel and
					becomes 5&times;5. Under lines that is 40 lines instead of 20; under WAYS it is
					{featureWays} instead of {baseWays}.
				</p>
				<p>
					<strong>MULTIPLIER</strong> &mdash; every CONTRACT symbol carries a value from
					2&times; to 25&times;. The values of all the CONTRACT symbols on a spin are added
					together and the total applies to that spin's win. It applies to that spin only and
					nothing carries over to the next one.
				</p>
				<p>
					<strong>WAYS</strong> &mdash; wins are counted as ways instead of along lines. Any
					combination of matching symbols on adjacent reels from reel 1 wins, in any position.
				</p>
			</section>

			<!-- Own section rather than a closing sentence inside the feature
			     description: certification asked for retrigger behaviour to be
			     stated where a reviewer scanning headings will find it. -->
			<section class="wp-card">
				<h3><span class="wp-accent-bar"></span>Retriggers</h3>
				<p>
					The feature can be retriggered. Landing 2 or more TRIPLE WITCHING symbols during the
					feature awards {retriggerSpins} further spins respectively, added to the spins
					remaining. A retrigger does not change which modifiers are running &mdash; they are
					fixed when the session opens and hold to the end of it. This applies both to a
					feature entered by landing TRIPLE WITCHING symbols and to one {T.bought} from the
					{T.betMenu}.
				</p>
			</section>

			{#if buyCost}
				<section class="wp-card">
					<h3><span class="wp-accent-bar"></span>{T.buyBonusName}</h3>
					<p>
						Instead of waiting for TRIPLE WITCHING symbols, you can {T.buy} direct entry into an
						EXPIRY SESSION. Three entries are offered, and they differ only in how many of the
						three modifiers are guaranteed &mdash; every one of them runs at the same {rtpPct}
						RTP as base play, and all of them share the same {maxWin.toLocaleString()}&times;
						cap.
					</p>
					<ul class="wp-buy-list">
						{#each modeRows.slice(1) as row (row.label)}
							<li><strong>{row.label}</strong> &mdash; {row.entry}</li>
						{/each}
					</ul>
					<!-- "cost"/"costs" is on the restricted list and this is literal
					     template text, so it shows in both modes and cannot use it. -->
					<p class="wp-modes-note">
						A guaranteed entry is not a better entry. The three differ in what they guarantee
						and in what they ask for it; the return is the same on all of them.
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

	.wp-buy-list {
		margin: 0.4rem 0 0;
		padding-left: 1.1rem;
		font-size: 0.85rem;
		line-height: 1.5;
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
