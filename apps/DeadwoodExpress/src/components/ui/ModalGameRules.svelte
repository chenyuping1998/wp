<script lang="ts">
	import { Popup } from 'components-shared';
	import { stateModal } from 'state-shared';
	import { zIndex } from 'constants-shared/zIndex';

	import config from '../../game/config';
	import { FEATURE_TIERS } from '../../game/featureTiers';
	import { getSocialTerms } from '../../game/socialTerms';
	import assets from '../../game/assets';
	import { popupGhost } from './popupGhost';

	// Review 2026-09-26 marked this panel "poor info tab". It was one plain-text
	// article; it is now laid out as cards with the game's own art, and every
	// number on it is read from the maths config so the page cannot drift from
	// what the game pays.
	const T = getSocialTerms();
	const rules = config.featureRules;

	const pct = (value: number) => `${(value * 100).toFixed(2)}%`;
	const reels = config.numReels;
	const rows = config.numRows[0];
	const lineCount = Object.keys(config.paylines).length;
	const maxWin = config.betModes.base.max_win;
	const rtps = Object.values(config.betModes).map((mode) => mode.rtp);
	const rtpText =
		Math.min(...rtps) === Math.max(...rtps)
			? pct(rtps[0])
			: `${pct(Math.min(...rtps))}–${pct(Math.max(...rtps))}`;
	const wildFive = (config.symbols.W.paytable ?? [])
		.map((entry) => Object.entries(entry)[0])
		.find(([count]) => Number(count) === reels)?.[1];

	const facts = [
		{ value: `${reels}×${rows}`, label: 'Grid' },
		{ value: `${lineCount}`, label: `Fixed ${T.paylines}` },
		{ value: rtpText, label: 'RTP' },
		{ value: `${maxWin.toLocaleString()}×`, label: 'Max win' },
	];

	// The dial's colour ladder (MultiplierWheel / wheelState): 40–90 gold,
	// 100–190 coral, 200 magenta. The chips repeat it so the page and the wheel
	// read as the same object.
	const chipTone = (value: number) =>
		value >= 200 ? 'top' : value >= 100 ? 'high' : value >= 40 ? 'mid' : 'low';

	const tiers = FEATURE_TIERS.map((tier) => {
		const values = rules.wheelValues[tier.tier];
		return {
			...tier,
			values,
			range: `${Math.min(...values)}×–${Math.max(...values)}×`,
			cost: config.betModes[tier.key].cost,
			trigger:
				tier.key === 'bonus_hits' ? `${tier.scatters} or more Scatters` : `${tier.scatters} Scatters`,
			art: `./assets/deadwood/${tier.key === 'bonus' ? 'card_standard' : 'card_premium'}.png`,
		};
	});

	const retriggers = Object.entries(rules.retriggerAwards).map(([count, spins]) => ({ count, spins }));

	const modeRows = [
		{ label: 'Base game', key: 'base' as const, entry: 'Every spin' },
		...tiers.map((tier) => ({
			// FEATURE_TIERS titles are set in capitals for the splash; the table reads
			// in title case beside "Base game".
			label: tier.title.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()),
			key: tier.key,
			entry: `${T.entryVerb} for ${tier.cost}× ${T.bet}`,
		})),
	].map((row) => ({
		...row,
		rtp: pct(config.betModes[row.key].rtp),
		maxWin: `${config.betModes[row.key].max_win.toLocaleString()}×`,
	}));

	// Spin, turbo and the stepper are drawn as pixi vectors on the bar, so they
	// have no image file; small inline glyphs stand in for them here.
	const controls: { icon?: string; glyph?: 'spin' | 'turbo' | 'stepper'; plate?: string; name: string; text: string }[] = [
		{ glyph: 'spin', name: 'Spin', text: `Starts a round at the current ${T.bet}. The space bar does the same. While the reels turn it becomes Stop, which brings them to rest early.` },
		{ glyph: 'stepper', name: 'Decrease / increase', text: `Steps the ${T.bet} through the available ${T.betLevels}.` },
		{ plate: T.buyBonusName, name: T.buyBonusName, text: `Opens the two feature cards. Either feature can be ${T.bought} directly; the ${T.cost} is shown before you confirm.` },
		{ icon: assets.hmIconAutoSpin.src, name: 'Auto Spin', text: 'Plays a chosen number of rounds automatically. Press it again to stop the remaining rounds.' },
		{ glyph: 'turbo', name: 'Turbo', text: 'Shortens reel motion and win presentations. Lit means turbo is on.' },
		{ icon: assets.hmIconMenu.src, name: 'Menu', text: `Opens the ${T.payTableCaps.toLowerCase()}, these rules, sound and settings.` },
		{ icon: assets.hmIconPayTable.src, name: T.payTableCaps, text: `Every symbol's value for 3, 4 and 5 of a kind, and the ${lineCount} ${T.paylines}.` },
		{ icon: assets.hmIconSoundOn.src, name: 'Sound', text: 'Turns game audio on or off.' },
		{ icon: assets.hmIconSettings.src, name: 'Settings', text: 'Adjusts the available game settings.' },
	];
</script>

{#if stateModal.modal?.name === 'gameRules'}
	<Popup zIndex={zIndex.modal} onclose={() => (stateModal.modal = null)}>
		<div class="dw-rules" use:popupGhost>
			<header>
				<img class="logo" src="./assets/deadwood/logo.png" alt="Deadwood Express" />
				<h2>Game Rules</h2>
			</header>

			<div class="facts">
				{#each facts as fact (fact.label)}
					<div><strong>{fact.value}</strong><span>{fact.label}</span></div>
				{/each}
			</div>

			<section>
				<h3>How to play</h3>
				<p>
					Deadwood Express is a {reels}-reel, {rows}-row video slot with {lineCount} fixed {T.paylines}.
					{T.combinationDirection}. Only the highest win is {T.paid} on each line, and wins on different
					lines are added together. Values are shown in the {T.payTableCaps.toLowerCase()} as multiples of
					the {T.baseBet}.
				</p>
			</section>

			<section>
				<h3>Special symbols</h3>
				<div class="symbol">
					<img src={assets.hmW.src} alt="Wild" />
					<div>
						<h4>Wild</h4>
						<p>
							Substitutes for every symbol except the Scatter. {reels} Wilds on a {T.payline}
							{T.pays} {wildFive}× as its own symbol.
						</p>
					</div>
				</div>
				<div class="symbol">
					<img src={assets.hmS.src} alt="Scatter" />
					<div>
						<h4>Scatter</h4>
						<p>
							Counts anywhere on the reels and does not need a {T.payline}. {T.noPayOnItsOwn}. Landing
							Scatters opens a free-spin feature, and the number that lands chooses which one.
						</p>
					</div>
				</div>
			</section>

			<section>
				<h3>Free spin features</h3>
				<div class="tiers">
					{#each tiers as tier (tier.key)}
						<article class="tier" style:--accent={`#${tier.accent.toString(16).padStart(6, '0')}`}>
							<img src={tier.art} alt="" />
							<div class="tier-body">
								<h4>{tier.title}</h4>
								<dl>
									<dt>Trigger</dt><dd>{tier.trigger}</dd>
									<dt>Free spins</dt><dd>{rules.initialSpins}</dd>
									<dt>Wheel</dt><dd>{tier.range}</dd>
									<dt>Direct entry</dt><dd>{tier.cost}× {T.bet}</dd>
								</dl>
								<div class="chips" aria-label={`${tier.title} wheel values`}>
									{#each tier.values as value (value)}
										<span class={chipTone(value)}>{value}×</span>
									{/each}
								</div>
							</div>
						</article>
					{/each}
				</div>
			</section>

			<section>
				<h3>Steam pressure wheel</h3>
				<ol class="steps">
					<li><b>1</b><span>A free spin lands at least one winning line.</span></li>
					<li><b>2</b><span>The wheel turns once and stops on a value equal to or higher than the multiplier you hold.</span></li>
					<li><b>3</b><span>That value multiplies every line win on the same spin, and is held for the rest of the feature.</span></li>
				</ol>
				<p>
					The multiplier never decreases. A spin with no line win does not turn the wheel and does not
					reset it. Until the first winning spin no multiplier is held. Extra free spins keep the held
					multiplier.
				</p>
			</section>

			<section>
				<h3>Extra free spins</h3>
				<p>Scatters landing together during either feature add free spins:</p>
				<div class="retriggers">
					{#each retriggers as row (row.count)}
						<div><span>{row.count} Scatters</span><strong>+{row.spins}</strong></div>
					{/each}
				</div>
				<p class="cap-note">
					There is no limit to the number of free spins that can be won — extra free spins can be
					added any number of times. The feature ends when all free spins have been played, or
					immediately if the {maxWin.toLocaleString()}× max win is reached.
				</p>
			</section>

			<section>
				<h3>RTP &amp; max win by mode</h3>
				<table>
					<thead>
						<tr><th scope="col">Mode</th><th scope="col">How to enter</th><th scope="col">RTP</th><th scope="col">Max win</th></tr>
					</thead>
					<tbody>
						{#each modeRows as row (row.key)}
							<tr><th scope="row">{row.label}</th><td>{row.entry}</td><td class="num">{row.rtp}</td><td class="num">{row.maxWin}</td></tr>
						{/each}
					</tbody>
				</table>
				<p class="note">
					Max win is a multiple of the {T.baseBet}, not of the feature-entry {T.cost}. When a round
					reaches it, the round ends immediately, including any remaining free spins. RTP is a
					theoretical long-term average; individual results vary.
				</p>
			</section>

			<section>
				<h3>Controls</h3>
				<ul class="controls">
					{#each controls as control (control.name)}
						<li>
							<span class="icon">
								{#if control.icon}
									<img src={control.icon} alt="" />
								{:else if control.plate}
									<span class="plate">{control.plate}</span>
								{:else if control.glyph === 'spin'}
									<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 12a8 8 0 0 1-14 5.3M4 12a8 8 0 0 1 14-5.3" /><path d="M18 2.5v4.2h-4.2M6 21.5v-4.2h4.2" /></svg>
								{:else if control.glyph === 'turbo'}
									<svg viewBox="0 0 24 24" aria-hidden="true"><path class="fill" d="M13.5 2 5 13.5h6L9.5 22 19 9.5h-6.2z" /></svg>
								{:else}
									<svg class="wide" viewBox="0 0 48 22" aria-hidden="true"><circle cx="11" cy="11" r="9" /><circle cx="37" cy="11" r="9" /><path d="M7 11h8M33 11h8M37 7v8" /></svg>
								{/if}
							</span>
							<div><strong>{control.name}</strong><span>{control.text}</span></div>
						</li>
					{/each}
				</ul>
			</section>

			<footer>
				<p>
					{T.disclaimerOpening} A consistent internet connection is required. In the event of a disconnection,
					reload the game to finish any uncompleted rounds. The expected return is calculated over many plays. The
					game display is not representative of any physical device and is for illustrative purposes only.
					Winnings are settled according to the amount received from the Remote Game Server and not from events
					within the web browser.
				</p>
				<!-- "Engine." is dictated by review (Hot Miami 2026-09-06: "replace Silverstars Studio with Engine"). Do not change it to a studio name. -->
				<p>TM and © 2026 Engine.</p>
			</footer>
		</div>
	</Popup>
{/if}

<style lang="scss">
	.dw-rules {
		--ink: #0b1d19;
		--panel: #10281f;
		--brass: #af8c55;
		--gold: #e2c07f;
		--spectral: #8dddc3;
		--bone: #e8e4d4;
		/* above Popup's click-to-close layer, or it swallows scrolling */
		position: relative;
		z-index: 100;
		width: min(44rem, 92vw);
		max-height: 84vh;
		overflow-y: auto;
		overscroll-behavior: contain;
		-webkit-overflow-scrolling: touch;
		box-sizing: border-box;
		padding: 1.4rem 1.6rem 1.2rem;
		display: flex;
		flex-direction: column;
		gap: 0.9rem;
		color: var(--bone);
		background:
			radial-gradient(ellipse at 50% 0%, rgba(141, 221, 195, 0.12), transparent 60%),
			linear-gradient(180deg, #0f2620, var(--ink));
		border: 1px solid var(--brass);
		box-shadow: inset 0 0 0 4px var(--ink), inset 0 0 0 5px rgba(175, 140, 85, 0.45), 0 20px 60px rgba(0, 0, 0, 0.6);
		font: 400 0.9rem/1.6 var(--gb-body-font);
		text-align: left;

		&::-webkit-scrollbar { width: 6px; }
		&::-webkit-scrollbar-thumb { background: var(--brass); border-radius: 3px; }
	}

	header {
		text-align: center;
		.logo { width: min(18rem, 70%); height: auto; display: block; margin: 0 auto -0.2rem; }
	}

	h2,
	h3,
	h4 {
		font-family: var(--hm-title-font);
		font-weight: 800;
		margin: 0;
	}

	h2 {
		color: var(--gold);
		font-size: 1rem;
		letter-spacing: 0.4em;
		text-transform: uppercase;
	}

	h3 {
		display: flex;
		align-items: center;
		gap: 0.7rem;
		margin-bottom: 0.55rem;
		color: var(--gold);
		font-size: 0.98rem;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		&::after { content: ''; flex: 1; height: 1px; background: linear-gradient(90deg, rgba(175, 140, 85, 0.7), transparent); }
	}

	h4 { color: var(--spectral); font-size: 0.95rem; letter-spacing: 0.08em; }

	p { margin: 0; }

	section {
		padding: 0.9rem 1rem;
		background: rgba(232, 228, 212, 0.035);
		border: 1px solid rgba(175, 140, 85, 0.28);
		border-radius: 6px;
	}

	.facts {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 0.5rem;
		div {
			display: flex;
			flex-direction: column;
			align-items: center;
			padding: 0.55rem 0.3rem;
			border: 1px solid rgba(175, 140, 85, 0.45);
			border-radius: 6px;
			background: rgba(11, 29, 25, 0.8);
		}
		strong { font: 700 1.1rem/1.2 var(--gb-body-font); color: var(--gold); font-variant-numeric: tabular-nums; }
		span { font-size: 0.7rem; letter-spacing: 0.12em; text-transform: uppercase; opacity: 0.75; text-align: center; }
	}

	.symbol {
		display: flex;
		gap: 0.9rem;
		align-items: center;
		& + & { margin-top: 0.7rem; }
		img { width: 4.2rem; height: 4.2rem; object-fit: contain; flex-shrink: 0; filter: drop-shadow(0 3px 8px rgba(0, 0, 0, 0.6)); }
	}

	.tiers { display: grid; grid-template-columns: 1fr 1fr; gap: 0.7rem; }

	.tier {
		display: flex;
		gap: 0.7rem;
		padding: 0.6rem;
		border: 1px solid var(--accent);
		border-radius: 6px;
		background: rgba(11, 29, 25, 0.75);
		img { width: 5.2rem; aspect-ratio: 2 / 3; object-fit: cover; border-radius: 3px; flex-shrink: 0; align-self: flex-start; }
		h4 { color: var(--accent); margin-bottom: 0.3rem; }
	}

	.tier-body { min-width: 0; }

	dl {
		display: grid;
		grid-template-columns: auto 1fr;
		gap: 0.1rem 0.6rem;
		margin: 0 0 0.45rem;
		font-size: 0.8rem;
		dt { opacity: 0.7; }
		dd { margin: 0; font-weight: 600; }
	}

	.chips {
		display: flex;
		flex-wrap: wrap;
		gap: 0.2rem;
		span {
			padding: 0.05rem 0.3rem;
			border-radius: 3px;
			font: 600 0.66rem/1.5 var(--gb-body-font);
			background: rgba(141, 221, 195, 0.12);
			color: var(--spectral);
		}
		.mid { background: rgba(226, 192, 127, 0.16); color: var(--gold); }
		.high { background: rgba(240, 128, 104, 0.18); color: #f3a08c; }
		.top { background: rgba(224, 96, 196, 0.22); color: #f19be0; }
	}

	.steps {
		list-style: none;
		margin: 0 0 0.6rem;
		padding: 0;
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 0.5rem;
		li {
			display: flex;
			flex-direction: column;
			gap: 0.35rem;
			padding: 0.6rem;
			border-radius: 6px;
			background: rgba(141, 221, 195, 0.07);
			border: 1px solid rgba(141, 221, 195, 0.25);
			font-size: 0.8rem;
			line-height: 1.45;
		}
		b {
			width: 1.5rem;
			height: 1.5rem;
			display: grid;
			place-items: center;
			border-radius: 50%;
			background: var(--spectral);
			color: var(--ink);
			font: 800 0.8rem/1 var(--hm-title-font);
		}
	}

	.retriggers {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 0.5rem;
		margin-top: 0.5rem;
		div {
			display: flex;
			flex-direction: column;
			align-items: center;
			padding: 0.45rem;
			border-radius: 6px;
			border: 1px solid rgba(175, 140, 85, 0.4);
		}
		span { font-size: 0.75rem; opacity: 0.8; }
		strong { font: 700 1.1rem/1.3 var(--gb-body-font); color: var(--spectral); }
	}

	table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.82rem;
		th,
		td { padding: 0.4rem 0.45rem; text-align: left; border-bottom: 1px solid rgba(232, 228, 212, 0.08); }
		thead th { color: var(--gold); font-size: 0.7rem; letter-spacing: 0.08em; text-transform: uppercase; border-bottom-color: rgba(175, 140, 85, 0.5); }
		tbody th { white-space: nowrap; }
		.num { font-family: var(--gb-body-font); font-variant-numeric: tabular-nums; white-space: nowrap; }
		tr:last-child > * { border-bottom: none; }
	}

	.cap-note { margin-top: 0.7rem; }
	.note { margin-top: 0.55rem; font-size: 0.76rem; opacity: 0.75; }

	.controls {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
		li { display: grid; grid-template-columns: 4.4rem 1fr; gap: 0.7rem; align-items: start; }
		.icon { display: flex; justify-content: center; }
		img,
		svg { width: 2.1rem; height: 2.1rem; }
		svg.wide { width: 4rem; }
		svg { fill: none; stroke: var(--gold); stroke-width: 1.7; stroke-linecap: round; stroke-linejoin: round; }
		svg .fill { fill: var(--gold); stroke: none; }
		strong { display: block; font-size: 0.86rem; }
		span:not(.icon):not(.plate) { display: block; font-size: 0.8rem; line-height: 1.4; opacity: 0.85; }
	}

	.plate {
		display: grid;
		place-items: center;
		width: 4.4rem;
		min-height: 2.1rem;
		border: 1px solid var(--brass);
		border-radius: 4px;
		background: #163c31;
		color: var(--gold);
		font: 700 0.55rem/1.15 var(--hm-title-font);
		text-align: center;
		text-transform: uppercase;
	}

	footer {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
		padding-top: 0.6rem;
		border-top: 1px solid rgba(175, 140, 85, 0.35);
		font-size: 0.72rem;
		line-height: 1.5;
		text-align: center;
		opacity: 0.6;
	}

	@media (max-width: 620px) {
		.dw-rules { padding: 1rem; }
		.facts { grid-template-columns: repeat(2, 1fr); }
		.tiers,
		.steps { grid-template-columns: 1fr; }
		.retriggers { grid-template-columns: repeat(2, 1fr); }
		table { font-size: 0.74rem; }
	}
</style>
