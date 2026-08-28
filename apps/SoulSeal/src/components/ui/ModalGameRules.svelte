<script lang="ts">
	import { Popup } from 'components-shared';
	import { zIndex } from 'constants-shared/zIndex';
	import { stateModal } from 'state-shared';

	import { base } from '$app/paths';

	import { MODE_LABELS, isActivateMode } from '../../game/betModeMeta';
	import config from '../../game/config';
	import { RAIL_MILESTONES } from '../../game/types';
	import { getSocialTerms } from '../../game/socialTerms';

	// Shared with the pay table — the two panels describe the same game and must
	// use the same words for it. See socialTerms.ts.
	const T = getSocialTerms();

	// Controls guide. Each row shows the actual button art from the bet bar, so a
	// player matches what they read to what they see rather than decoding a name.
	// Icons come from static/, not the pixi asset pipeline — this panel is DOM.
	const ICONS = `${base}/assets/sprites/soulSealUiIcons`;
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
			text: `Opens the feature menu. Two of its entries switch the reels to a denser set for a higher ${T.bet} on every spin; the other two open free spins directly for the stated multiple. The ${T.cost} is shown before you confirm.`,
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
			text: `Lists every symbol and what it ${T.pays} for 3, 4 and 5 of a kind, what the SPIRIT carrier is worth, and every line the game uses.`,
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
	// sections cannot drift apart. Both are what the maths actually holds -
	// game_config.freespin_triggers is {3: 8, 4: 12, 5: 15} in the base game and
	// {2: 3, 3: 5, 4: 8, 5: 12} in the feature. The numbers that used to sit here
	// were neither, and matched nothing anywhere else in the game.
	const triggerSpins = '8, 12 or 15';
	const retriggerSpins = '3, 5, 8 or 12';
	const baseLines = Object.keys(config.paylines ?? {}).length;
	const reelCount = config.numReels;
	const rowCount = config.numRows?.[0] ?? 3;

	// The carrier's value range, merged into the config from the maths by
	// design/sync_math_config.mjs. See dump_carrier_values.py for why the SDK's
	// own frontend config cannot supply it.
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

	// The rail, from game_events.RAIL_MILESTONES via the client's own copy in
	// game/types. Written as prose here but sourced, because it is three pairs of
	// numbers and prose is where pairs of numbers go stale.
	const railText = RAIL_MILESTONES.map((m) => m.slot).join(', ');
	const railMultipliers = RAIL_MILESTONES.map((m) => `${m.collectMultiplier}×`).join(', then ');
	const railSpins = RAIL_MILESTONES[0].freeSpins;
	const railTotal = RAIL_MILESTONES[RAIL_MILESTONES.length - 1].slot;

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
	const betModeConfig = (config.betModes ?? {}) as Record<string, BetMode>;
	const modeRows = [
		{ label: 'Base game', key: 'base', entry: 'Every spin' },
		// Driven off the maths config, through the shared label table. The hand
		// written list this replaced named bonus2 and bonus3 — modes this game
		// never had — and so the table showed ONE row beside a bar offering four
		// entries. An active mode's cost is per spin, not once, and the entry
		// column has to say so or the two 5x readings are indistinguishable.
		...Object.keys(betModeConfig)
			.filter((key) => key !== 'base')
			.map((key) => ({
				label: MODE_LABELS[key] ?? key,
				key,
				entry: isActivateMode(key)
					? `${betModeConfig[key].cost}× ${T.bet} every spin`
					: `${entryVerb} for ${betModeConfig[key].cost}× ${T.bet}`,
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
			<h2>SOUL SEAL — GAME RULES</h2>

			<section class="wp-card">
				<h3><span class="wp-accent-bar"></span>How to play</h3>
				<p>
					Soul Seal is a {rowCount}&times;{reelCount} video slot played on {baseLines}
					fixed lines. A symbol {T.pays} when it lands on adjacent reels along a line, starting
					from the leftmost reel, and only the highest win on each line counts. Wins on
					different lines are added together. The theoretical return to player (RTP) is
					{rtpPct}.
				</p>
				<p>
					The board never changes shape and the lines never change: {baseLines} lines in
					every mode, main game and free spins alike. What the modes change is how many
					SPIRIT symbols reach the reels, and how a collect is triggered.
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
				<h3><span class="wp-accent-bar"></span>WILD</h3>
				<p>
					WILD substitutes for every symbol except SOUL SEAL and SPIRIT, and {T.pays}
					10&times; the {T.totalBet} for five of its own. It appears on all five reels but
					at most one lands per reel &mdash; that is built into the reel strips rather than
					checked afterwards, so two can never be in view at once on the same reel.
				</p>
				<p>
					It does not substitute for SPIRIT, and that is deliberate rather than an omission.
					A WILD carries no value of its own, so a line of spirits it completed would show
					three spirits on screen and hand over the value of two.
				</p>
			</section>

			<section class="wp-card">
				<h3><span class="wp-accent-bar"></span>SPIRIT (Carrier) &amp; collecting</h3>
				<p>
					Every SPIRIT lands carrying a value printed on its talisman.{#if baseRange && freeRange}
						They run from {baseRange.min}&times; to {baseRange.max.toLocaleString()}&times;
						the {T.totalBet} in the main game, and from {freeRange.min}&times; to
						{freeRange.max.toLocaleString()}&times; in free spins.{/if} A SPIRIT never
					{T.pays} for a match; it {T.pays} what is written on it, and only when it is
					collected.
				</p>
				<p>
					<strong>In the main game</strong> &mdash; 3 or more SPIRIT along a line, counted
					from reel 1, seal the board. <em>Every</em> SPIRIT on screen is then collected,
					not only the ones standing on that line.
				</p>
				<p>
					<strong>In free spins</strong> &mdash; no line is needed. Every WILD on the board
					collects every SPIRIT showing, once each, so a board with two WILDs is collected
					twice over.
				</p>
			</section>

			<section class="wp-card">
				<h3><span class="wp-accent-bar"></span>SOUL SEAL (Scatter)</h3>
				<p>
					SOUL SEAL appears on all five reels, at most once per reel. It does not {T.pay} on
					its own &mdash; its only job is to open the feature. Landing 3, 4 or 5 of them in a
					single spin awards {triggerSpins} free spins respectively. Which of the two
					features those spins run is decided by the same count &mdash; see below.
				</p>
			</section>

			<section class="wp-card">
				<h3><span class="wp-accent-bar"></span>Free spins</h3>
				<p>
					There are two of them, and a round runs one or the other &mdash; never both. Which
					one opens is decided by the SOUL SEAL count when the feature triggers, and it holds
					for the whole feature, retriggers included.
				</p>
				<p>
					<strong>SEALING RITE</strong> &mdash; opened by 3 or 4 SOUL SEAL. Every collect
					fills one slot on the talisman rail, which holds {railTotal}. Slots {railText}
					each award {railSpins} more free spins and step the collect multiplier to
					{railMultipliers}. A board collected twice fills two slots, because the rail counts
					collects and not spins. The rail carries across a retrigger.
				</p>
				<p>
					<strong>GRAND SEALING</strong> &mdash; opened by 5 SOUL SEAL. Every spin lands a
					WILD with a SPIRIT beside it, so every spin collects, and no SPIRIT in it is worth
					less than 5&times;. It has no rail. The guarantee is what it offers in place of
					one: a feature carrying both a guaranteed collect and a rising multiplier compounds
					on itself, and the two are alternatives by design.
				</p>
			</section>

			<!-- Own section rather than a closing sentence inside the feature
			     description: certification asked for retrigger behaviour to be
			     stated where a reviewer scanning headings will find it. -->
			<section class="wp-card">
				<h3><span class="wp-accent-bar"></span>Retriggers</h3>
				<p>
					The feature can be retriggered. Landing 2, 3, 4 or 5 SOUL SEAL symbols during the
					feature awards {retriggerSpins} further spins respectively, added to the spins
					remaining. A retrigger does not switch which feature is running &mdash; that is
					fixed when it opens and holds to the end. This applies both to a feature entered by
					landing SOUL SEAL symbols and to one {T.bought} from the {T.betMenu}.
				</p>
			</section>

			{#if buyCost}
				<section class="wp-card">
					<h3><span class="wp-accent-bar"></span>{T.buyBonusName}</h3>
					<p>
						The menu offers four entries, and they are not all the same kind of thing. The
						two SPIRIT modes are {T.bet} levels: they run the main game on a denser set of
						reels and are charged on every spin for as long as they are switched on. The two
						sealing entries open the free spins directly instead, charged once. Every one of
						them runs at the same {rtpPct} RTP as base play and shares the same
						{maxWin.toLocaleString()}&times; cap.
					</p>
					<ul class="wp-buy-list">
						{#each modeRows.slice(1) as row (row.label)}
							<li><strong>{row.label}</strong> &mdash; {row.entry}</li>
						{/each}
					</ul>
					<!-- "cost"/"costs" is on the restricted list and this is literal
					     template text, so it shows in both modes and cannot use it. -->
					<p class="wp-modes-note">
						A more expensive entry is not a better entry. They differ in what they offer and
						in what they ask for it; the return is the same on all of them.
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
