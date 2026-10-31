<script lang="ts">
	import Popup from './InfoPopup.svelte';
	import InfoShell from './InfoShell.svelte';
	import { zIndex } from 'constants-shared/zIndex';
	import { stateModal, LEGAL_NOTICE } from 'state-shared';

	import { base } from '$app/paths';

	import config from '../../game/config';
	import assets from '../../game/assets';
	import { uiTheme } from 'components-ui-pixi';
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
	const controlIcon = (name: string) => {
		const key = uiTheme.icons[name] as keyof typeof assets | undefined;
		const icon = key ? assets[key] as {src?:string} : undefined;
		return icon?.src ?? `${ICONS}/${name}.png`;
	};
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


	// ── the polished layout (2026-10-17) ──────────────────────────────────
	// Review: "game info should be more polished". The rules were a column of
	// text cards in gen-1's jungle gold. Now: a header with the game's own art,
	// the four numbers a player looks for first, and every feature shown with
	// the symbol it is about plus a small diagram of what it does. Same words,
	// same certified figures (all still read from config).
	const SYM = `${base}/assets/sprites/goBanalchemySymbols`;
	const sym = (name: string) => `${SYM}/${name}.png`;
	const HERO = `${base}/assets/sprites/goBanalchemyUi/buy_art_lab.png`;

	const spinCounts = Object.values(config.scatterSpins ?? { 3: 8, 4: 10, 5: 12 }) as number[];
	const facts = [
		{ value: waysCount.toLocaleString(), label: T.ways },
		{ value: rtpPct, label: 'RTP' },
		{ value: `${maxWin.toLocaleString()}×`, label: 'Max win' },
		{ value: `${Math.min(...spinCounts)}–${Math.max(...spinCounts)}`, label: 'Free Spins' },
	];

	// the Reagent, before and after: a reel holding a 10, the Tongs, a J and the
	// Reagent becomes four Tongs — the highest-value symbol already on it
	const reagentBefore = ['l5', 'h3', 'l4', 'b'];
	const reagentAfter = ['h3', 'h3', 'h3', 'h3'];

	// the reaction meter: how many reels each step covers
	const meterSteps = [1, 2, 3, 4, 5];
</script>

{#if stateModal.modal?.name === 'gameRules'}
	<Popup zIndex={zIndex.modal} onclose={() => (stateModal.modal = null)}>
		<div class="al-rules info-page">
			<InfoShell kind="rules">
			<header class="al-hero" style={`--hero: url(${HERO})`}>
				<span class="al-kicker">Game rules</span>
				<h2>Go Banalchemy</h2>
				<p class="al-tagline">
					{rowCount}&times;{reelCount} reels &middot; Reagents transmute whole reels
				</p>
			</header>

			<div class="al-facts">
				{#each facts as fact (fact.label)}
					<div class="al-fact">
						<span class="al-fact-value">{fact.value}</span>
						<span class="al-fact-label">{fact.label}</span>
					</div>
				{/each}
			</div>

			<section class="al-card">
				<h3>How to play</h3>
				<p>
					Go Banalchemy is a {rowCount}&times;{reelCount} video slot with
					<strong>{waysCount.toLocaleString()} {T.ways}</strong>. There are no fixed lines: a
					symbol counts wherever it lands on a reel. {T.combinationDirection}. A combination
					{T.pays} when the same symbol appears on 3 or more adjacent reels starting from the
					leftmost, and the number of {T.ways} it {T.pays} is the number of that symbol on each
					of those reels multiplied together. Only the highest win per symbol is {T.paid}, and
					wins from different symbols are added together. The theoretical return to player (RTP)
					is {rtpPct}.
				</p>
			</section>

			<!-- The signature mechanic first, with a picture of what it does. -->
			<section class="al-card al-feature">
				<img class="al-feature-icon" src={sym('b')} alt="" aria-hidden="true" />
				<div class="al-feature-body">
					<h3>Reagent &mdash; transmuting reels</h3>
					<p>
						A Reagent can land on any reel, and <strong>at most one per reel</strong>. After the
						reels stop it reacts: every position on that reel becomes
						<strong>one and the same symbol</strong> &mdash; the
						<strong>highest-value symbol already standing on it</strong>. A reel of four
						matching symbols contributes 4 to the {T.ways}, and because {T.ways} multiply
						across reels, it can turn a board with no combination at all into a winning one.
					</p>
					<figure class="al-transmute" aria-hidden="true">
						<div class="al-reel">
							{#each reagentBefore as name, i (i)}
								<img src={sym(name)} alt="" />
							{/each}
						</div>
						<span class="al-arrow">&rarr;</span>
						<div class="al-reel al-reel-lit">
							{#each reagentAfter as name, i (i)}
								<img src={sym(name)} alt="" />
							{/each}
						</div>
					</figure>
					<p>
						The Reagent is consumed by its own reaction and does not {T.pay}. A Scatter caught
						in a reaction is left untouched.
					</p>
				</div>
			</section>

			<section class="al-card">
				<h3>The reaction meter &mdash; Free Spins</h3>
				<p>
					In Free Spins every Reagent that lands is <strong>collected</strong>, and the meter
					widens the reaction as it fills. The reaction covers
					<strong>1 reel, then 2, 3, 4 and finally all 5</strong>. It never falls back, so a
					run only ever gets wider.
				</p>
				<ol class="al-meter" aria-hidden="true">
					{#each meterSteps as n (n)}
						<li>
							<span class="al-meter-reels">
								{#each meterSteps as r (r)}
									<i class:on={r <= n}></i>
								{/each}
							</span>
							<span class="al-meter-label">{n === 5 ? 'All 5' : n}</span>
						</li>
					{/each}
				</ol>
				<p>
					<strong>Five reels showing one symbol is {waysCount.toLocaleString()} {T.ways} on a
					single spin</strong>, and it is what the meter is climbing towards.
				</p>
			</section>

			<section class="al-card al-feature">
				<img class="al-feature-icon" src={sym('w')} alt="" aria-hidden="true" />
				<div class="al-feature-body">
					<h3>Alchemist Wild</h3>
					<p>
						The Alchemist Wild substitutes for every symbol except the Scatter and the Reagent.
						It does not {T.pay} as a symbol of its own. A Wild caught in a reaction is replaced
						along with everything else on that reel.
					</p>
				</div>
			</section>

			<section class="al-card al-feature">
				<img class="al-feature-icon" src={sym('s')} alt="" aria-hidden="true" />
				<div class="al-feature-body">
					<h3>Scatter &mdash; Free Spins</h3>
					<p>
						The Golden Bananas Scatter appears on all five reels. It does not {T.pay} on its own
						and does not need to form a combination &mdash; its only job is to open the feature.
						Landing 3, 4 or 5 Scatters in a single spin awards {scatterSpins} Free Spins
						respectively.
					</p>
					<!-- Own heading-level statement: certification asked for it to be
					     clarified, and reviewers scan for it. Verified against the
					     maths — the freegame strip carries no Scatter, so no book in any
					     mode can emit a retrigger. -->
					<p class="al-callout">
						<strong>Free Spins cannot be retriggered.</strong> Scatters do not appear on the
						reels during the feature, so no additional free spins can be awarded once it starts:
						the number granted at the start is the number you play. This applies to Free Spins
						entered by landing Scatters and to every round {T.bought} from the {T.betMenu}.
					</p>
				</div>
			</section>

			{#if buyTiers.length}
				<section class="al-card">
					<h3>{T.buyBonusName}</h3>
					<p>
						Instead of waiting for Scatters, you can {T.buy} direct entry into Free Spins. Three
						rounds are available. All three play the same number of spins; each higher tier
						starts the <strong>reaction meter further along</strong>:
					</p>
					<div class="al-tiers">
						{#each buyTiers as tier (tier.key)}
							<div class="al-tier">
								<span class="al-tier-cost">{tier.cost}&times;</span>
								<span class="al-tier-unit">{T.bet}</span>
								<span class="al-tier-spins">{tier.spins} Free Spins</span>
								<span class="al-meter-reels al-tier-meter" aria-hidden="true">
									{#each meterSteps as r (r)}
										<i class:on={r <= tier.startReels}></i>
									{/each}
								</span>
								<span class="al-tier-note">
									First reaction covers {tier.startReels}
									{tier.startReels === 1 ? 'reel' : 'reels'}
								</span>
							</div>
						{/each}
					</div>
					<p>
						Every round runs at the same {rtpPct} RTP as base play. The meter keeps filling from
						there, exactly as in Free Spins won with Scatters.
					</p>
				</section>
			{/if}

			<section class="al-card al-feature">
				<img class="al-feature-icon" src={sym('p')} alt="" aria-hidden="true" />
				<div class="al-feature-body">
					<h3>Hold and Spin</h3>
					<p>
						A separate prize board {T.bought} from the {T.betMenu} for {config.betModes?.holdandspin
							?.cost}&times; your {T.totalBet}. It does not use {T.ways} or Reagents. You start
						with 3 respins. Every Coin that lands sticks to the board and resets the respins back
						to 3. When no respins remain, all stuck Coin values are added up and {T.paid} out.
						Maximum win: {config.betModes?.holdandspin?.max_win?.toLocaleString()}&times; the
						{T.totalBet}.
					</p>
				</div>
			</section>

			<section class="al-card">
				<h3>RTP &amp; Max Win by mode</h3>
				<!-- Scroll wrapper: three of the four columns cannot shrink, and a
				     table that scrolls sideways on the narrowest phone is readable
				     where a clipped one is not. -->
				<div class="al-modes-scroll">
					<table class="al-modes">
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
				<p class="al-note">
					Max win is a multiple of the {T.totalBet}. When a round reaches the cap it ends
					immediately and the capped amount is {T.paid}.
				</p>
			</section>

			<!-- The cap is PER MODE: Hold and Spin caps lower than everything else.
			     Both numbers come from config. -->
			<section class="al-card">
				<h3>Max Win</h3>
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

			<!-- Certification asked for a user interaction guide. The actual
			     on-screen controls, in the order they sit on the bar, each with
			     its own button art. -->
			<section class="al-card">
				<h3>Controls</h3>
				<ul class="al-controls">
					{#each controls as control (control.name)}
						<li class:no-icon={control.icons.length === 0}>
							{#if control.icons.length}
								<span class="al-control-icons">
									{#each control.icons as name (name)}
										<img src={controlIcon(name)} alt="" aria-hidden="true" />
									{/each}
								</span>
							{/if}
							<div>
								<span class="al-control-name">{control.name}</span>
								<span class="al-control-text">{control.text}</span>
							</div>
						</li>
					{/each}
				</ul>
				<p class="al-note">
					Where a win presentation is playing, tapping anywhere skips to the end of it.
				</p>
			</section>

			<!-- The legal notice is SHARED (state-shared/src/legal.ts): render the
			     constant, never retype it. -->
			<p class="al-foot">{LEGAL_NOTICE}</p>
			</InfoShell>
		</div>
	</Popup>
{/if}

<style lang="scss">
	/* Go Banalchemy's palette — the bet bar's (game/uiTheme.ts): teal glass,
	   copper trim, cream type, a mint accent. */
	.al-rules {
		--teal-deep: #0b252b;
		--teal: #0f3438;
		--teal-lit: #14454a;
		--copper: #c58b55;
		--copper-lit: #e7b47c;
		--cream: #f4f4df;
		--mist: #c6e5d3;
		--mint: #5fd6a8;

		/* above the Popup's full-screen click-to-close layer (z-index 2), or it
		   swallows wheel/touch and blocks scrolling */
		position: relative;
		z-index: 100;
		display: flex;
		flex-direction: column;
		gap: 0.8rem;
		width: min(38rem, 92vw);
		max-height: 82vh;
		overflow-y: auto;
		-webkit-overflow-scrolling: touch;
		overscroll-behavior: contain;
		padding: 0 0.15rem 0.5rem 0;
		color: var(--cream);
		text-align: left;
		animation: al-rise 0.35s cubic-bezier(0.22, 1, 0.36, 1) both;

		&::-webkit-scrollbar {
			width: 6px;
		}
		&::-webkit-scrollbar-thumb {
			background: var(--copper);
			border-radius: 3px;
		}
	}

	@keyframes al-rise {
		from {
			opacity: 0;
			transform: translateY(12px);
		}
		to {
			opacity: 1;
			transform: none;
		}
	}

	/* ── header: the laboratory, the name, the line under it ── */
	.al-hero {
		position: relative;
		margin: 0 0 0.2rem;
		padding: 2.1rem 1.5rem 1.2rem;
		border-radius: 10px;
		background:
			linear-gradient(180deg, rgba(7, 26, 30, 0.15) 0%, rgba(7, 26, 30, 0.88) 78%, #0b252b 100%),
			var(--hero) center 35% / cover no-repeat;
		border-bottom: 2px solid var(--copper);
		text-align: center;

		h2 {
			margin: 0.15rem 0 0.25rem;
			font-size: clamp(1.7rem, 5.2vw, 2.3rem);
			line-height: 1.05;
			color: var(--cream);
			text-transform: uppercase;
			text-shadow:
				0 2px 0 #4a2e14,
				0 3px 10px rgba(0, 0, 0, 0.6);
		}
	}

	.al-kicker {
		display: inline-block;
		padding: 0.18rem 0.7rem;
		border: 1px solid var(--copper);
		border-radius: 999px;
		background: rgba(11, 37, 43, 0.75);
		color: var(--copper-lit);
		font-size: 0.68rem;
		letter-spacing: 0.18em;
		text-transform: uppercase;
	}

	.al-tagline {
		margin: 0;
		color: var(--mist);
		font-size: 0.86rem;
	}

	/* ── the four numbers ── */
	.al-facts {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 0.5rem;

		@media (max-width: 460px) {
			grid-template-columns: repeat(2, 1fr);
		}
	}

	.al-fact {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.15rem;
		padding: 0.6rem 0.3rem 0.5rem;
		border: 1px solid rgba(197, 139, 85, 0.55);
		border-radius: 8px;
		background: linear-gradient(180deg, var(--teal-lit) 0%, var(--teal) 100%);
	}

	.al-fact-value {
		font-family: var(--gb-display-font);
		font-size: 1.15rem;
		color: var(--cream);
		white-space: nowrap;
	}

	.al-fact-label {
		font-size: 0.66rem;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: var(--copper-lit);
	}

	/* ── cards ── */
	.al-card {
		padding: 0.95rem 1.05rem;
		border-radius: 10px;
		background: rgba(15, 52, 56, 0.72);
		border: 1px solid rgba(197, 139, 85, 0.32);
		box-shadow: inset 0 1px 0 rgba(244, 244, 223, 0.05);

		h3 {
			margin: 0 0 0.45rem;
			padding-bottom: 0.35rem;
			font-size: 1.08rem;
			color: var(--copper-lit);
			border-bottom: 1px solid rgba(197, 139, 85, 0.25);
		}

		p {
			margin: 0 0 0.55rem;
			font-size: 0.88rem;
			line-height: 1.58;
			color: rgba(244, 244, 223, 0.9);

			&:last-child {
				margin-bottom: 0;
			}
		}

		strong {
			color: var(--cream);
		}
	}

	/* a feature card: its symbol to the left of the text */
	.al-feature {
		display: grid;
		grid-template-columns: 4.4rem 1fr;
		gap: 0.9rem;
		align-items: start;

		@media (max-width: 420px) {
			grid-template-columns: 3.2rem 1fr;
			gap: 0.65rem;
		}
	}

	.al-feature-icon {
		width: 100%;
		aspect-ratio: 1;
		object-fit: contain;
		border-radius: 8px;
		filter: drop-shadow(0 3px 6px rgba(0, 0, 0, 0.45));
	}

	.al-callout {
		padding: 0.55rem 0.7rem;
		border-left: 3px solid var(--mint);
		border-radius: 0 6px 6px 0;
		background: rgba(95, 214, 168, 0.08);
	}

	/* the Reagent, before -> after */
	.al-transmute {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.9rem;
		margin: 0.2rem 0 0.7rem;
	}

	.al-reel {
		display: grid;
		grid-template-rows: repeat(4, 2.3rem);
		gap: 0.2rem;
		padding: 0.25rem;
		border-radius: 6px;
		border: 1px solid rgba(197, 139, 85, 0.45);
		background: var(--teal-deep);

		img {
			width: 2.3rem;
			height: 2.3rem;
			object-fit: contain;
		}
	}

	.al-reel-lit {
		border-color: var(--mint);
		box-shadow: 0 0 0 1px rgba(95, 214, 168, 0.35);
	}

	.al-arrow {
		font-size: 1.5rem;
		color: var(--copper-lit);
	}

	/* the reaction meter: five steps, each a strip of five reels */
	.al-meter {
		display: grid;
		grid-template-columns: repeat(5, 1fr);
		gap: 0.4rem;
		margin: 0.15rem 0 0.7rem;
		padding: 0;
		list-style: none;

		li {
			display: flex;
			flex-direction: column;
			align-items: center;
			gap: 0.3rem;
		}
	}

	.al-meter-reels {
		display: flex;
		gap: 2px;

		i {
			width: 0.42rem;
			height: 1.35rem;
			border-radius: 2px;
			background: rgba(244, 244, 223, 0.12);
		}

		i.on {
			background: linear-gradient(180deg, #8ff0c6, var(--mint));
		}
	}

	.al-meter-label {
		font-size: 0.72rem;
		color: var(--mist);
	}

	/* the three bought rounds */
	.al-tiers {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 0.5rem;
		margin: 0.2rem 0 0.7rem;

		@media (max-width: 460px) {
			grid-template-columns: 1fr;
		}
	}

	.al-tier {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.2rem;
		padding: 0.7rem 0.4rem;
		border-radius: 8px;
		border: 1px solid rgba(197, 139, 85, 0.5);
		background: linear-gradient(180deg, var(--teal-lit), var(--teal-deep));
		text-align: center;
	}

	.al-tier-cost {
		font-family: var(--gb-display-font);
		font-size: 1.45rem;
		line-height: 1;
		color: var(--cream);
	}

	.al-tier-unit {
		font-size: 0.68rem;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: var(--copper-lit);
	}

	.al-tier-spins {
		margin-top: 0.25rem;
		font-size: 0.84rem;
		font-weight: 700;
	}

	.al-tier-meter {
		margin: 0.15rem 0;

		i {
			height: 0.9rem;
		}
	}

	.al-tier-note {
		font-size: 0.74rem;
		color: var(--mist);
	}

	/* the per-mode figures */
	.al-modes-scroll {
		overflow-x: auto;
		-webkit-overflow-scrolling: touch;
	}

	.al-modes {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.82rem;

		th,
		td {
			padding: 0.45rem 0.55rem;
			text-align: left;
		}

		thead th {
			color: var(--copper-lit);
			font-size: 0.7rem;
			letter-spacing: 0.08em;
			text-transform: uppercase;
			border-bottom: 1px solid rgba(197, 139, 85, 0.5);
		}

		tbody tr:nth-child(odd) {
			background: rgba(244, 244, 223, 0.035);
		}

		tbody th {
			color: var(--cream);
			white-space: nowrap;
		}

		/* RTP and max win are the certified figures: never body-copy grey */
		tbody td:nth-child(3),
		tbody td:nth-child(4) {
			color: var(--cream);
			font-weight: 700;
			white-space: nowrap;
		}
	}

	.al-note {
		margin-top: 0.55rem !important;
		font-size: 0.76rem !important;
		color: var(--mist) !important;
	}

	/* the controls guide: the button's own art beside what it does */
	.al-controls {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.6rem 1rem;
		margin: 0.3rem 0 0;
		padding: 0;
		list-style: none;

		@media (max-width: 520px) {
			grid-template-columns: 1fr;
		}

		li {
			display: grid;
			grid-template-columns: 4.4rem 1fr;
			gap: 0.6rem;
			align-items: start;
		}

		li.no-icon {
			grid-template-columns: 1fr;
		}

		img {
			width: 2rem;
			height: 2rem;
			object-fit: contain;
		}
	}

	.al-control-icons {
		display: flex;
		gap: 0.35rem;
	}

	.al-control-name {
		display: block;
		color: var(--cream);
		font-weight: 700;
		font-size: 0.85rem;
	}

	.al-control-text {
		display: block;
		font-size: 0.78rem;
		line-height: 1.4;
		color: rgba(244, 244, 223, 0.8);
	}

	.al-foot {
		margin: 0.2rem 0 0;
		padding-top: 0.7rem;
		border-top: 1px solid rgba(197, 139, 85, 0.25);
		font-size: 0.74rem;
		line-height: 1.5;
		text-align: center;
		color: rgba(198, 229, 211, 0.65);
	}
</style>
