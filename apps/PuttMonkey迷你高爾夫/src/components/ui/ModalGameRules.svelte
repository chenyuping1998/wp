<script lang="ts">
	import { Popup } from 'components-shared';
	import { zIndex } from 'constants-shared/zIndex';
	import { stateModal, stateUrlDerived, LEGAL_NOTICE } from 'state-shared';

	import { base } from '$app/paths';

	import config from '../../game/config';
	import { removedLabelAtLevel, removedLabelsAtLevel } from '../../game/chefMeter';
	import { getSocialTerms } from '../../game/socialTerms';
	import { MODE_NAMES } from '../../game/betModeMeta';
	import assets from '../../game/assets';
	import CourseGuide from './CourseGuide.svelte';

	// Shared with the pay table — the two panels describe the same game and must
	// use the same words for it. See socialTerms.ts.
	const T = getSocialTerms();
	const social = stateUrlDerived.social();

	// Controls guide. Each row shows the actual button art from the bet bar, so a
	// player matches what they read to what they see rather than decoding a name.
	// Icons come from static/, not the pixi asset pipeline — this panel is DOM.
	const ICONS = `${base}/assets/sprites/sushiIcons`;
	// `icons` is a list because a control can be a pair — the stepper is two keys,
	// and showing only one of them would misrepresent it. Two controls are not
	// glyphs on the bar, so they are drawn as what the player sees instead: Buy
	// Bonus is the lettered hanging plate (`sign`), and the bet readout is its
	// caption with the chevron that opens the menu (`readout`). Engine guideline
	// 235 fails a guide that leaves out any pressable control — the readout,
	// Info and Settings were missing.
	type Control = { icons: string[]; name: string; text: string; sign?: string; readout?: string };
	const controls: Control[] = [
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
			// the bar's readout: caption, amount and the chevron that says it opens
			readout: social ? 'AMOUNT' : 'BET',
			name: social ? 'Amount' : 'Bet amount',
			text: `Shows the current ${T.bet}. Tap it to open the ${T.betMenu} and choose any of the available ${T.betLevels} directly.`,
		},
		{
			icons: [],
			// the bar's own hanging plate, lettered as the bar letters it
			sign: T.buyBonusName.toUpperCase(),
			name: T.buyBonusName,
			text: `Opens the feature menu, where either Free Spins round can be ${T.bought} outright for the stated multiple of your ${T.bet}. The ${T.cost} is shown before you confirm.`,
		},
		{
			icons: ['autoSpin'],
			name: 'Auto Spin',
			text: 'Plays a chosen number of rounds automatically. Open it to set the count and any stop conditions; press it again to stop early.',
		},
		{
			icons: ['turbo'],
			name: 'Turbo',
			text: 'Press once for Turbo (one bolt): quicker spins and win presentations. Press again for Turbo 2 (two bolts): the reels stop quicker still and Ball collections play faster. A third press turns turbo off.',
		},
		{
			icons: ['menu'],
			name: 'Menu',
			text: `Opens the ${T.payTable}, these rules, and the sound and settings controls.`,
		},
		{
			icons: ['info'],
			name: 'Info',
			text: 'Opens these game rules.',
		},
		{
			icons: ['settings'],
			name: 'Settings',
			text: 'Opens the volume controls: master volume, music and sound effects, each set separately.',
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

	// spins/start_meter and banditMeter are added to the generated config by
	// design/sync_math_config.mjs, which lifts them out of game_config.py — they
	// are not part of the SDK's exported shape.
	type BuyMode = { cost?: number; spins?: number; start_meter?: number };
	const meter = config.banditMeter as { thresholds: number[]; spinsAdded: number; mults: number[] };
	const rungs = meter.thresholds.map((at, i) => ({ at, removed: removedLabelAtLevel(i + 1) }));
	const levelAt = (count: number) => meter.thresholds.filter((t) => count >= t).length;

	const buyTiers = (['bonus', 'superbonus'] as const)
		.map((key) => {
			const mode = config.betModes[key] as BuyMode | undefined;
			const start = mode?.start_meter ?? 0;
			return { key, name: key === 'bonus' ? MODE_NAMES.BONUS : MODE_NAMES.SUPERBONUS, cost: mode?.cost, spins: mode?.spins, start, startMult: meter.mults[levelAt(start)] };
		})
		.filter((t) => t.cost !== undefined && t.spins !== undefined);

	// The most Free Spins a round can reach: its opening spins plus every meter
	// mark still above where it starts (each adds spinsAdded once). Stake asked
	// Deadwood Express (2026-10-04) to state the maximum, or say there is none.
	const maxSpinsFrom = (spins: number, start: number) =>
		spins + meter.spinsAdded * (meter.thresholds.length - levelAt(start));
	const maxScatterSpins = maxSpinsFrom(Math.max(...Object.values(config.scatterSpins ?? { 5: 15 }).map(Number)), 0);

	// Per-mode RTP and max win, read straight out of the maths config. Certification
	// asks for both to be clearly stated for every mode available.
	type BetMode = { cost?: number; rtp?: number; max_win?: number };
	const modeRows = (
		[
			['Base game', 'base'],
			[MODE_NAMES.BONUS, 'bonus'],
			[MODE_NAMES.SUPERBONUS, 'superbonus'],
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

	// "The game info looks basic" (review, 2026-10-30). The rules are laid out as
	// a mini-golf course: every section is a numbered hole, the course map at the
	// top jumps to it, and each mechanic gets a picture built from the game's own
	// symbol art. The certified wording below is unchanged — the pictures sit
	// beside it, never instead of it.
	type Hole = { id: string; short: string; title: string };
	const holes: Hole[] = [
		{ id: 'play', short: 'Play', title: 'How to play' },
		{ id: 'controls', short: 'Controls', title: 'Controls' },
		{ id: 'modes', short: 'Modes', title: 'RTP & Max Win by mode' },
		{ id: 'balls', short: 'Balls', title: 'Balls & the Golfer' },
		{ id: 'meter', short: 'Meter', title: 'The Golfer meter — Free Spins' },
		{ id: 'wild', short: 'Wild', title: 'Wild' },
		{ id: 'scatter', short: 'Flags', title: 'Scatter' },
		{ id: 'retrigger', short: 'Retriggers', title: 'Retriggers' },
		...(buyTiers.length ? [{ id: 'bonus', short: 'Bonus', get title() { return T.buyBonusName; } }] : []),
		{ id: 'maxwin', short: 'Max Win', title: 'Max Win' },
	];
	const hole = (id: string) => holes.find((h) => h.id === id)!;
	const holeNo = (id: string) => holes.indexOf(hole(id)) + 1;

	let rulesEl: HTMLDivElement | undefined = $state();
	const jumpTo = (id: string) =>
		rulesEl?.querySelector(`#rules-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

	const sym = (key: string) => (assets as unknown as Record<string, { src: string }>)[`gb${key}`]?.src;

	// Ways example: Windmills on reels 1-3 in a 1, 2, 1 pattern = 2 ways of 3 of
	// a kind. Fillers are plain symbols only — no Wild, Scatter or Ball, which
	// would each need explaining. Rows are listed per reel, top to bottom.
	const waysBoard = [
		['L2', 'H1', 'L4', 'H3'],
		['H1', 'L5', 'H1', 'L1'],
		['H4', 'L3', 'L2', 'H1'],
		['L4', 'H2', 'L1', 'L5'],
		['H3', 'L1', 'H4', 'L2'],
	];
	const waysCounts = waysBoard.slice(0, 3).map((reel) => reel.filter((s) => s === 'H1').length);
	const waysExample = waysCounts.reduce((a, b) => a * b, 1);

	// Collection example, one value from each end of the base game list.
	const cupValues = config.jadeCupValues.base as number[];
	const exampleBalls = [cupValues[3] ?? 5, cupValues[6] ?? 20];
	const exampleSum = exampleBalls.reduce((a, b) => a + b, 0);

	const scatterRows = Object.entries(config.scatterSpins ?? {}).map(([count, spins]) => ({
		count: Number(count),
		spins: Number(spins),
	}));
	const CARD_ART: Record<string, string> = {
		bonus: `${base}/assets/sprites/sushiUi/card_bonus.png`,
		superbonus: `${base}/assets/sprites/sushiUi/card_superbonus.png`,
	};
</script>

{#snippet holeHead(id: string)}
	<h3 id={`rules-${id}`}>
		<span class="hole-pin" aria-hidden="true"><span>{holeNo(id)}</span></span>
		<span class="hole-label"><small>Hole {holeNo(id)}</small>{hole(id).title}</span>
	</h3>
{/snippet}

{#snippet ball(value: number)}
	<span class="eg-ball"><img src={sym('P')} alt="" /><b>{value}&times;</b></span>
{/snippet}

{#snippet tip(text: string)}
	<div class="caddie-tip">
		<img src={sym('W')} alt="" aria-hidden="true" />
		<p><strong>Golfer&rsquo;s tip</strong>{text}</p>
	</div>
{/snippet}

{#if stateModal.modal?.name === 'gameRules'}
	<Popup zIndex={zIndex.modal} onclose={() => (stateModal.modal = null)}>
		<div class="wp-rules" bind:this={rulesEl}>
			<h2>PUTT MONKEY — GAME RULES</h2>
			<CourseGuide
				waysLabel={T.ways}
				rtp={rtpPct}
				maxWin={`${maxWin.toLocaleString()}×`}
				holes={holes.map((h) => ({ id: h.id, label: h.short }))}
				onjump={jumpTo}
			/>

			<section class="wp-card">
				{@render holeHead('play')}
				<p>
					<!-- Reels × rows ("5×4"), the order players and the industry use,
					     so it says five reels of four, not four reels of five. -->
					Putt Monkey is a {reelCount}&times;{rowCount} video slot with
					<strong>{waysCount.toLocaleString()} {T.ways}</strong>. There are no fixed lines: a
					symbol counts wherever it lands on a reel. {T.combinationDirection}. A combination
					{T.pays} when the same symbol appears on 3 or more adjacent reels starting from the
					leftmost, and the number of {T.ways} it {T.pays} is the number of that symbol on each
					of those reels multiplied together. Only the highest win per symbol is {T.paid}, and
					wins from different symbols are added together. The theoretical return to player (RTP)
					is {rtpPct}.
				</p>
				<figure class="eg">
					<div class="eg-board" aria-hidden="true">
						{#each waysBoard as reel, r}
							<div class="eg-reel" class:counted={r < 3}>
								{#each reel as s, row}
									<span class="eg-cell" class:hit={r < 3 && s === 'H1'} style:--d={`${r * 0.12 + row * 0.03}s`}>
										<img src={sym(s)} alt="" />
									</span>
								{/each}
								<em>{r < 3 ? waysCounts[r] : '–'}</em>
							</div>
						{/each}
					</div>
					<figcaption>
						Windmills on reels 1, 2 and 3: <strong>{waysCounts.join(' × ')} = {waysExample} {T.ways}</strong> of
						3 of a kind. Reel 4 has none, so the run stops there.
					</figcaption>
				</figure>
			</section>

			<!-- Certification asked for a user interaction guide in the game
			     information. Kept as a definition list of the actual on-screen
			     controls, in the order they sit on the bar. -->
			<section class="wp-card">
				{@render holeHead('controls')}
				<ul class="wp-controls">
					{#each controls as control (control.name)}
						<li class:no-icon={control.icons.length === 0 && !control.sign && !control.readout}>
							{#if control.sign}
								<span class="wp-control-icons"><span class="wp-sign" style:background-image={`url('${base}/assets/sprites/sushiUi/buybonus_plate.png')`}>{control.sign}</span></span>
							{:else if control.readout}
								<span class="wp-control-icons" aria-hidden="true">
									<span class="wp-readout">{control.readout}<svg viewBox="0 0 12 8"><polyline points="1.5,1.5 6,6 10.5,1.5" /></svg></span>
								</span>
							{:else if control.icons.length}
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
				{@render holeHead('modes')}
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
				<!-- The math opens every direct-entry round with a set-up board that only places
				     the Scatters; it is not evaluated. On 22.9% of those boards a ways line is
				     visible and on 4.8% a Wild sits beside a collect symbol, none of it paid.
				     The player is not short-changed, so the copy says so rather than the maths
				     changing (design/check_copy_claims.py, 2026-10-09). -->
				<p class="wp-modes-note">
					When Free Spins are entered directly from the menu, the opening board only lands the
					Scatters that start the feature. Nothing else on that board is evaluated: it gives no
					ways wins and no collections.
				</p>
			</section>

			<!-- The signature mechanic gets its own section above Wild and Scatter,
			     because it is the thing the game is built around and the only rule
			     a player of other ways games will not already know. -->
			<section class="wp-card">
				{@render holeHead('balls')}
				<p>
					<strong>Balls</strong> land carrying a value printed on them. Base game values are
					{config.jadeCupValues.base.join('×, ')}×; Free Spins also allow
					{config.jadeCupValues.free.filter((value: number) => !config.jadeCupValues.base.includes(value)).join('×, ')}×.
					A Ball does not form combinations and does not {T.pay} on its own.
				</p>
				<p>
					The <strong>Golfer</strong> is the Wild. It appears on reels 2 to 5. Whenever at least
					one Golfer and at least one Ball are on the board after the reels stop,
					<strong>every Golfer collects the total value of every Ball</strong>: two Golfers
					collect it twice. The collection is added to any {T.ways} win on the same spin. This
					happens in the base game as well as in Free Spins.
				</p>
				<figure class="eg">
					<div class="eg-sum" aria-hidden="true">
						<span class="eg-golfer"><img src={sym('W')} alt="" /></span>
						<span class="eg-op">collects</span>
						{@render ball(exampleBalls[0])}
						<span class="eg-op">+</span>
						{@render ball(exampleBalls[1])}
						<span class="eg-op">=</span>
						<span class="eg-total">{exampleSum}&times;</span>
					</div>
					<div class="eg-sum eg-sum-2" aria-hidden="true">
						<span class="eg-golfer"><img src={sym('W')} alt="" /></span>
						<span class="eg-golfer"><img src={sym('W')} alt="" /></span>
						<span class="eg-op">2 Golfers &rarr; 2 &times; {exampleSum}&times; =</span>
						<span class="eg-total">{exampleSum * 2}&times;</span>
					</div>
					<figcaption>
						One Golfer with Balls of {exampleBalls[0]}&times; and {exampleBalls[1]}&times; collects
						{exampleSum}&times; the {T.bet}. A second Golfer collects the same Balls again.
					</figcaption>
				</figure>
				{@render tip('A Ball on its own just sits on the green. It is worth something only when a Golfer lands on the same spin to collect it.')}
			</section>

			<section class="wp-card">
				{@render holeHead('meter')}
				<p>
					In Free Spins every Golfer that lands is counted, whether or not there is a Ball to
					collect. Each time the count reaches the next mark, <strong>{meter.spinsAdded} extra Free
					Spins</strong> are added and the <strong>next low symbol type is replaced by Balls</strong> for every
					later free spin:
				</p>
				<!-- The track is the picture of the list beside it; the list stays,
				     because it is the certified sentence. -->
				<ol class="meter-track" aria-hidden="true">
					<li class="meter-tee"><span class="meter-dot">0</span><span class="meter-cap">Tee off</span></li>
					{#each rungs as rung, i (rung.at)}
						<li>
							<span class="meter-dot">{rung.at}</span>
							<span class="meter-swap">
								<img class="meter-old" src={sym(config.banditMeter.replacements[i])} alt="" />
								<span class="meter-arrow">&rarr;</span>
								<img src={sym('P')} alt="" />
							</span>
							<span class="meter-cap">+{meter.spinsAdded} spins</span>
						</li>
					{/each}
				</ol>
				<ul class="wp-tiers">
					{#each rungs as rung (rung.at)}
						<li><strong>{rung.at} Golfers</strong> &mdash; +{meter.spinsAdded} spins, all {rung.removed} symbols become Balls</li>
					{/each}
				</ul>
				<p>
					All collections remain at &times;1. Replacements persist for the rest of the feature
					and take effect on the next spin, across all five reels. Earlier replacements remain active.
				</p>
				{@render tip('Every Golfer counts toward the meter, even on a spin with no Ball for it to collect.')}
			</section>

			<section class="wp-card">
				{@render holeHead('wild')}
				<p class="with-art">
					<img class="side-art" src={sym('W')} alt="" aria-hidden="true" />
					The Golfer Wild substitutes for every symbol except the Scatter and the Ball. It
					does not {T.pay} as a symbol of its own.
				</p>
			</section>

			<section class="wp-card">
				{@render holeHead('scatter')}
				<p class="with-art">
					<img class="side-art" src={sym('S')} alt="" aria-hidden="true" />
					The Golden Flag Scatter appears on all five reels in the base game. It does not {T.pay} on its
					own and does not need to form a combination &mdash; its only job is to open the feature.
					Landing 3, 4 or 5 Scatters in a single spin awards {scatterSpins} Free Spins
					respectively.
				</p>
				<div class="flag-rows" aria-hidden="true">
					{#each scatterRows as row (row.count)}
						<div class="flag-row">
							<span class="flags">
								{#each Array(row.count) as _, i}<img src={sym('S')} alt="" style:--i={i} />{/each}
							</span>
							<span class="flag-spins"><b>{row.spins}</b> Free Spins</span>
						</div>
					{/each}
				</div>
			</section>

			<section class="wp-card">
				{@render holeHead('retrigger')}
				<p>
					<strong>Scatters cannot retrigger Free Spins.</strong> Scatters do not appear on the
					reels during the feature. Extra spins come only from the Golfer meter, as described
					above. This applies to Free Spins entered by landing Scatters and to every round
					{T.bought} from the {T.betMenu}.
				</p>
				<p>
					<strong>Maximum Free Spins.</strong> The meter has {meter.thresholds.length} marks and each
					adds spins once, so a feature can reach at most <strong>{maxScatterSpins} Free Spins</strong>
					when opened by Scatters{#each buyTiers as tier (tier.key)}, {maxSpinsFrom(tier.spins ?? 0, tier.start)}
						in {tier.name}{/each}. The feature ends when its spins run out or the
					maximum win is reached.
				</p>
			</section>

			{#if buyTiers.length}
				<section class="wp-card">
					{@render holeHead('bonus')}
					<p>
						Instead of waiting for Scatters, you can {T.buy} direct entry into Free Spins. Two
						rounds are available, both with the same number of spins:
					</p>
					<ul class="bonus-cards">
						{#each buyTiers as tier (tier.key)}
							<li>
								<span class="bonus-art" style:background-image={`url('${CARD_ART[tier.key]}')`} aria-hidden="true">
									<span class="bonus-price">{tier.cost}&times;</span>
								</span>
								<span class="bonus-text">
									<strong>{tier.name}</strong>, {tier.cost}&times; {T.bet} &mdash; {tier.spins} Free Spins,
									{#if tier.start > 0}
										the Golfer meter starts at {tier.start}; all {removedLabelsAtLevel(levelAt(tier.start))} symbols are already Balls
									{:else}
										the Golfer meter starts empty
									{/if}
								</span>
							</li>
						{/each}
					</ul>
					<p>
						Every round runs at the same {rtpPct} RTP as base play. The meter keeps counting from
						there, exactly as in Free Spins won with Scatters.
					</p>
				</section>
			{/if}

			<section class="wp-card">
				{@render holeHead('maxwin')}
				<p>
					The maximum {T.payout} is capped at {maxWin.toLocaleString()}&times; the {T.totalBet}
					in every mode. Once the cap is reached the round ends immediately and the maximum win
					is awarded.
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

	@keyframes cellHit {
		0% { transform: scale(1); }
		45% { transform: scale(1.18); }
		100% { transform: scale(1); }
	}

	@keyframes flagPop {
		from { opacity: 0; transform: translateY(6px) rotate(-8deg); }
		to { opacity: 1; transform: none; }
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

	/* Buy Bonus: the bar's hanging plate in miniature, cropped to the board */
	.wp-sign {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 4.4rem;
		height: 1.9rem;
		background-size: 4.6rem auto;
		background-position: center 52%;
		background-repeat: no-repeat;
		color: #1b2a22;
		font: 400 0.62rem var(--gb-display-font, sans-serif);
		letter-spacing: 0.04em;
		white-space: nowrap;
	}

	/* the bet readout: caption plus the chevron the bar draws beside it */
	.wp-readout {
		display: inline-flex;
		align-items: center;
		gap: 0.3rem;
		padding: 0.2rem 0.45rem;
		border: 2px solid #2f5e36;
		background: #fff6df;
		color: #1b2a22;
		font: 400 0.7rem var(--gb-display-font, sans-serif);
	}
	.wp-readout svg {
		width: 0.7rem;
		height: 0.5rem;
		fill: none;
		stroke: #1b2a22;
		stroke-width: 2;
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

	.wp-divider {
		width: 60%;
		height: 1px;
		margin: 0.25rem auto;
		background: linear-gradient(90deg, transparent, rgba(255, 215, 94, 0.3), rgba(255, 233, 138, 0.2), transparent);
	}

	/* Screenprint modal: flat ink and paper replace the inherited metallic skin. */
	.wp-rules { background: #fff6df; border: 5px solid #2f5e36; color: #1b2a22; }
	.wp-rules h2 { background: none; -webkit-text-fill-color: #2f5e36; color: #2f5e36; animation: none; filter: none; }
	.wp-rules::-webkit-scrollbar-thumb { background: #2f5e36; }
	.wp-card, .wp-card:hover { background: #fff6df; border: 2px solid #2f5e36; box-shadow: none; backdrop-filter: none; -webkit-backdrop-filter: none; }
	.wp-card h3, .wp-modes thead th { color: #e5432f; }
	.wp-divider { background: #e5432f; animation: none; box-shadow: none; }
	.wp-control-name, .wp-modes tbody th, .wp-modes tbody td:nth-child(3), .wp-modes tbody td:nth-child(4) { color: #1b2a22; }
	.wp-modes th, .wp-modes td { border-bottom-color: #2f5e36; }

	/* ── Course layout (2026-10-31) ────────────────────────────────────────
	   Every section is a numbered hole: a flag pin carries the number and the
	   heading reads "Hole n" over the title. Pictures are the game's own symbol
	   art; motion plays once on open and then holds still. */
	.wp-rules { scroll-padding-top: 0.5rem; }
	.wp-card { scroll-margin-top: 0.5rem; }
	.wp-card h3 { gap: 0.6rem; margin-bottom: 0.55rem; }
	.hole-pin {
		position: relative;
		flex-shrink: 0;
		width: 2rem;
		height: 2.1rem;
	}
	/* pole + pennant, the pennant carrying the hole number */
	.hole-pin::before {
		content: '';
		position: absolute;
		left: 0.35rem;
		top: 0.05rem;
		bottom: 0;
		width: 3px;
		border-radius: 2px;
		background: #2f5e36;
	}
	.hole-pin::after {
		content: '';
		position: absolute;
		left: 0.05rem;
		bottom: -0.1rem;
		width: 0.95rem;
		height: 0.32rem;
		border-radius: 50%;
		background: #2f5e36;
		opacity: 0.35;
	}
	.hole-pin span {
		position: absolute;
		left: 0.5rem;
		top: 0;
		display: grid;
		place-items: center;
		width: 1.45rem;
		height: 1.15rem;
		padding-right: 0.25rem;
		clip-path: polygon(0 0, 100% 50%, 0 100%);
		background: #e5432f;
		color: #fff6df;
		font: 400 0.68rem var(--gb-display-font, sans-serif);
		line-height: 1;
	}
	.hole-label { display: flex; flex-direction: column; line-height: 1.15; color: #1b2a22; }
	.hole-label small {
		font-size: 0.62rem;
		font-weight: 800;
		letter-spacing: 0.18em;
		text-transform: uppercase;
		color: #e5432f;
	}

	/* worked examples */
	.eg {
		margin: 0.75rem 0 0;
		padding: 0.7rem;
		border: 2px dashed #2f5e3680;
		border-radius: 0.6rem;
		background: #f1e7c6;
	}
	.eg figcaption {
		margin-top: 0.55rem;
		font-size: 0.78rem;
		line-height: 1.45;
		color: #2f4a3a;
		text-align: center;
	}
	.eg-board {
		display: grid;
		grid-template-columns: repeat(5, minmax(0, 2.9rem));
		justify-content: center;
		gap: 0.25rem;
	}
	.eg-reel { display: flex; flex-direction: column; gap: 0.2rem; align-items: center; }
	.eg-reel em {
		font: 400 0.8rem var(--gb-display-font, sans-serif);
		font-style: normal;
		color: #2f5e3699;
	}
	.eg-reel.counted em { color: #e5432f; }
	.eg-cell {
		display: block;
		width: 100%;
		aspect-ratio: 1;
		border-radius: 0.35rem;
		background: #fff6df;
		border: 1px solid #2f5e3633;
		opacity: 0.45;
	}
	.eg-cell img { width: 100%; height: 100%; object-fit: contain; display: block; }
	.eg-cell.hit {
		opacity: 1;
		border: 2px solid #e5432f;
		box-shadow: 0 0 0 2px #fff6df, 0 3px 0 #2f5e36;
		animation: cellHit 0.5s ease-out var(--d) 1 both;
	}
	.eg-sum {
		display: flex;
		align-items: center;
		justify-content: center;
		flex-wrap: wrap;
		gap: 0.4rem;
	}
	.eg-sum-2 { margin-top: 0.5rem; padding-top: 0.5rem; border-top: 1px dashed #2f5e3650; }
	.eg-golfer img { width: 2.8rem; height: 2.8rem; display: block; }
	.eg-sum-2 .eg-golfer img { width: 2.2rem; height: 2.2rem; }
	.eg-ball { position: relative; display: inline-grid; place-items: center; width: 2.7rem; height: 2.7rem; }
	.eg-ball img { position: absolute; inset: 0; width: 100%; height: 100%; }
	.eg-ball b {
		position: relative;
		font: 400 0.82rem var(--gb-display-font, sans-serif);
		color: #2f5e36;
		text-shadow: 0 0 3px #fff, 0 0 3px #fff;
	}
	.eg-op { font-size: 0.78rem; font-weight: 700; color: #2f4a3a; }
	.eg-total {
		padding: 0.15rem 0.55rem;
		border-radius: 999px;
		background: #e5432f;
		color: #fff6df;
		font: 400 1rem var(--gb-display-font, sans-serif);
		box-shadow: 0 2px 0 #8f2416;
	}

	/* caddie aside */
	.caddie-tip {
		display: flex;
		align-items: flex-start;
		gap: 0.55rem;
		margin-top: 0.7rem;
	}
	.caddie-tip img { flex-shrink: 0; width: 2.4rem; height: 2.4rem; }
	.wp-card .caddie-tip p {
		position: relative;
		padding: 0.45rem 0.65rem;
		border-radius: 0.6rem;
		background: #2f5e36;
		color: #fff6df;
		font-size: 0.8rem;
		line-height: 1.45;
		opacity: 1;
	}
	.caddie-tip p::before {
		content: '';
		position: absolute;
		left: -0.4rem;
		top: 0.8rem;
		border: 0.4rem solid transparent;
		border-left: 0;
		border-right-color: #2f5e36;
	}
	.caddie-tip strong {
		display: block;
		font-size: 0.62rem;
		letter-spacing: 0.16em;
		text-transform: uppercase;
		color: #ffd75e;
	}

	/* meter track */
	.meter-track {
		list-style: none;
		position: relative;
		display: grid;
		grid-template-columns: repeat(4, minmax(0, 1fr));
		margin: 0.8rem 0 0.2rem;
		padding: 0;
	}
	.meter-track::before {
		content: '';
		position: absolute;
		left: 12.5%;
		right: 12.5%;
		top: 0.8rem;
		height: 4px;
		border-radius: 2px;
		background: repeating-linear-gradient(90deg, #2f5e36 0 8px, transparent 8px 13px);
	}
	.meter-track li { position: relative; display: flex; flex-direction: column; align-items: center; gap: 0.3rem; }
	.meter-dot {
		display: grid;
		place-items: center;
		width: 1.7rem;
		height: 1.7rem;
		border-radius: 50%;
		background: #fff;
		border: 2px solid #2f5e36;
		color: #1b2a22;
		font: 400 0.8rem var(--gb-display-font, sans-serif);
		box-shadow: inset -3px -3px 0 #2f5e3622;
	}
	.meter-tee .meter-dot { background: #2f5e36; color: #fff6df; }
	.meter-swap { display: flex; align-items: center; gap: 0.1rem; }
	.meter-swap img { width: 1.9rem; height: 1.9rem; }
	.meter-old { opacity: 0.55; filter: grayscale(0.6); }
	.meter-arrow { font-size: 0.8rem; color: #e5432f; font-weight: 800; }
	.meter-cap {
		font-size: 0.68rem;
		font-weight: 800;
		color: #e5432f;
		text-align: center;
	}
	.meter-tee .meter-cap { color: #2f5e36; margin-top: 1.9rem; }

	/* symbol beside its paragraph */
	.with-art::after { content: ''; display: table; clear: both; }
	.side-art {
		float: right;
		width: 3.6rem;
		height: 3.6rem;
		margin: -0.3rem 0 0.2rem 0.6rem;
	}

	/* scatter count → spins */
	.flag-rows { display: flex; flex-direction: column; gap: 0.35rem; margin-top: 0.7rem; }
	.flag-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.6rem;
		padding: 0.25rem 0.6rem;
		border-radius: 0.5rem;
		background: #f1e7c6;
	}
	.flags { display: flex; }
	.flags img {
		width: 2rem;
		height: 2rem;
		margin-right: -0.55rem;
		animation: flagPop 0.35s ease-out calc(var(--i) * 0.08s + 0.2s) both;
	}
	.flag-spins { font-size: 0.8rem; color: #2f4a3a; white-space: nowrap; }
	.flag-spins b { font: 400 1.1rem var(--gb-display-font, sans-serif); color: #e5432f; margin-right: 0.15rem; }

	/* bonus cards — the buy menu's own card art */
	.bonus-cards {
		list-style: none;
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 0.6rem;
		margin: 0.7rem 0;
		padding: 0;
	}
	.bonus-cards li {
		display: flex;
		flex-direction: column;
		overflow: hidden;
		border: 2px solid #2f5e36;
		border-radius: 0.6rem;
		background: #fff6df;
		box-shadow: 3px 3px 0 #2f5e36;
	}
	.bonus-art {
		position: relative;
		display: block;
		aspect-ratio: 4 / 3;
		/* the cards are 600x840 with the picture in the top half */
		background-size: 136% auto;
		background-position: 50% 3%;
		border-bottom: 2px solid #2f5e36;
	}
	.bonus-price {
		position: absolute;
		right: 0.35rem;
		bottom: 0.35rem;
		padding: 0.1rem 0.45rem;
		border-radius: 999px;
		background: #e5432f;
		color: #fff6df;
		font: 400 0.9rem var(--gb-display-font, sans-serif);
		box-shadow: 0 2px 0 #8f2416;
	}
	.bonus-text { padding: 0.5rem 0.6rem; font-size: 0.78rem; line-height: 1.4; }
	@media (max-width: 420px) {
		.bonus-cards { grid-template-columns: 1fr; }
		.eg-board { grid-template-columns: repeat(5, minmax(0, 2.4rem)); }
	}

	@media (prefers-reduced-motion: reduce) {
		.eg-cell.hit, .flags img { animation: none; }
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
