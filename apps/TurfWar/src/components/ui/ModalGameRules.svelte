<script lang="ts">
	import { Popup } from 'components-shared';
	import { zIndex } from 'constants-shared/zIndex';
	import { stateModal, stateUrlDerived } from 'state-shared';

	import { base } from '$app/paths';

	import config from '../../game/config';
	import { popupGhost } from './popupGhost';
	import { getSocialTerms } from '../../game/socialTerms';
	import {
		commonText,
		numberIn,
		pctIn,
		rulesLang,
		type ControlKey,
		type RulesVars,
	} from '../../game/rulesCommon';
	import { gameRulesText } from '../../game/rulesText';

	// Social play forbids betting terminology in player-facing copy, and the rules
	// page is the densest concentration of it in the game. The vocabulary lives in
	// one module shared with the pay table — two panels with their own copies
	// drift, and the drift is what gets flagged.
	const T = getSocialTerms();
	const social = stateUrlDerived.social();

	// Every sentence comes from game/rulesCommon.ts (the sections all three games
	// share) or game/rulesText.ts (this game's own), in the player's language
	// (2026-10-13 — this page was English-only while the bar and the intro card
	// followed ?lang=). English is built from T, so social play, which is
	// English-only, reads word for word what it read before.
	const lang = rulesLang();
	const C = commonText(lang, T, social);
	const G = gameRulesText(lang, T, social);

	// Controls guide. Each row shows the actual button art from the bet bar, so a
	// player matches what they read to what they see rather than decoding a name.
	// Icons come from static/, not the pixi asset pipeline — this panel is DOM.
	const ICONS = `${base}/assets/sprites/turfUiIcons`;
	// 2026-10-01: the page shows the things it describes. It was a plain-text
	// article — eleven grey slabs of prose — which is the "poor info tab" Deadwood
	// Express was tagged with on its second review. Same copy, now with the
	// symbol, Loot Bag and tier art the game already ships.
	const SYM = `${base}/assets/sprites/turfSymbols`;
	const FRAMES = `${base}/assets/sprites/turfFrames`;
	const SPLASH = `${base}/assets/sprites/turfSplash`;
	const LOGO = `${base}/assets/sprites/turfBrand/logo.png`;
	const UI = `${base}/assets/sprites/turfUi`;
	// Loot Bag sizes and their value ranges (game_config.py frame_size_ladders).
	const BAG_SIZES = [
		{ file: 'frame_1x1', label: '1×1', cells: 1, range: '2×–100×' },
		{ file: 'frame_2x2', label: '2×2', cells: 2, range: '2×–10×' },
		{ file: 'frame_3x3', label: '3×3', cells: 3, range: '2×–8×' },
	];
	const RETRIGGERS = [
		{ scatters: 2, extra: 2 },
		{ scatters: 3, extra: 4 },
		{ scatters: 4, extra: 6 },
		{ scatters: 5, extra: 8 },
	];
	// `icons` is a list because a control can be a pair — the stepper is two keys,
	// and showing only one of them would misrepresent it. Buy Bonus has none: on
	// the bar it is a labelled plate rather than a glyph, so there is no icon that
	// would actually match what the player sees.
	const CONTROL_ICONS: [ControlKey, string[]][] = [
		['spin', ['spin']],
		['stepper', ['decrease', 'increase']],
		['amount', []],
		['buy', []],
		['auto', ['autoSpin']],
		['turbo', ['turbo']],
		['menu', ['menu']],
		['info', ['info']],
		['settings', ['settings']],
		['paytable', ['payTable']],
		['sound', ['soundOn']],
	];
	const controls = CONTROL_ICONS.map(([key, icons]) => ({
		icons,
		plate: key === 'amount' ? C.amountPlate : key === 'buy' ? C.buyPlate : undefined,
		name: C.controls[key][0],
		text: C.controls[key][1],
	}));

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
	// Numbers in the player's locale; English keeps exactly the formatting it had.
	const pct = (value: number) => (lang === 'en' ? `${(value * 100).toFixed(2)}%` : pctIn(lang, value));
	const num = (value: number) => (lang === 'en' ? value.toLocaleString() : numberIn(lang, value));
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

	const vars: RulesVars = {
		game: 'Turf War',
		reels: reelCount,
		rows: rowCount,
		lines: lineCount,
		rtpRange: rtpRangePct,
		rtpLow: pct(rtpLow),
		rtpHigh: pct(rtpHigh),
		maxWin: num(maxWin),
		buyName: C.controls.buy[0],
	};

	// Feature names stay in English in every language, as on the intro card.
	const TIERS = [
		['Lookout', 3],
		['Muscle', 4],
		['Kingpin', 5],
	] as const;

	// Per-mode RTP and max win, read straight out of the maths config rather than
	// written into the prose. Certification asks for both to be clearly stated for
	// every mode available; spelling them out in one table is harder to miss than
	// leaving them scattered through the sections, and taking the numbers from
	// config means they cannot drift away from what the game actually pays.
	type BetMode = { cost?: number; rtp?: number; max_win?: number };
	const buyFor = (cost: number | undefined) =>
		C.buyFor(lang === 'en' || cost === undefined ? String(cost) : num(cost));
	const modeRows = (
		[
			[C.baseGame, 'base', C.everySpin],
			[`${TIERS[0][0]} (${C.scatters(TIERS[0][1])})`, 'bonus', buyFor(config.betModes?.bonus?.cost)],
			[`${TIERS[1][0]} (${C.scatters(TIERS[1][1])})`, 'bonus_hits', buyFor(config.betModes?.bonus_hits?.cost)],
			[`${TIERS[2][0]} (${C.scatters(TIERS[2][1])})`, 'bonus_epic', buyFor(config.betModes?.bonus_epic?.cost)],
		] as const
	).map(([label, key, entry]) => {
		const mode = config.betModes?.[key] as BetMode | undefined;
		return {
			label,
			entry,
			rtp: pct(mode?.rtp ?? config.rtp),
			maxWin: C.maxWinCell(num(mode?.max_win ?? maxWin)),
		};
	});
</script>

{#if stateModal.modal?.name === 'gameRules'}
	<Popup zIndex={zIndex.modal} onclose={() => (stateModal.modal = null)}>
		<div class="wp-rules" use:popupGhost dir={C.dir} style:--wp-plate={`url(${UI}/buybonus_plate.png)`} style:--wp-edge={`url(${UI}/panel_edge.png)`}>
			<header class="wp-head">
				<img class="wp-logo" src={LOGO} alt="Turf War" />
				<h2>{C.gameRulesTitle}</h2>
				<ul class="wp-facts">
					<li><b>{reelCount}&times;{rowCount}</b><span>{C.factGrid}</span></li>
					<li><b>{lineCount}</b><span>{C.factLines}</span></li>
					<li><b>{rtpRangePct}</b><span>RTP</span></li>
					<li><b>{num(maxWin)}&times;</b><span>{C.factMaxWin}</span></li>
				</ul>
			</header>

			<section class="wp-card">
				<h3><span class="wp-accent-bar"></span>{C.howTitle}</h3>
				<p>{C.how(vars)}</p>
			</section>

			<!-- Certification asked for a user interaction guide in the game
			     information. Kept as a definition list of the actual on-screen
			     controls, in the order they sit on the bar. -->
			<section class="wp-card">
				<h3><span class="wp-accent-bar"></span>{C.controlsTitle}</h3>
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
				<p class="wp-modes-note">{C.skipNote}</p>
			</section>

			<section class="wp-card">
				<h3><span class="wp-accent-bar"></span>{C.modesTitle}</h3>
				<table class="wp-modes">
					<thead>
						<tr>
							{#each C.modesHead as head (head)}
								<th scope="col">{head}</th>
							{/each}
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
				<p class="wp-modes-note">{C.modesNote}</p>
			</section>

			<section class="wp-card">
				<h3><span class="wp-accent-bar"></span>{C.wildTitle}</h3>
				<div class="wp-media">
				<img src={`${SYM}/w.png`} alt="" aria-hidden="true" />
				<p>{G.wild}</p>
				</div>
			</section>

			<section class="wp-card">
				<h3><span class="wp-accent-bar"></span>{G.bruiserTitle}</h3>
				<div class="wp-media">
				<img src={`${SYM}/sw.png`} alt="" aria-hidden="true" />
				<p>
					<!-- Reel strips (math turf_war/reels): the Bruiser is on reels 2-4 in the
					     base game but on all five in free spins (FR0); and
					     max_expand_wilds_per_spin = 1 turns any second Bruiser into a
					     plain Wild before the reveal. Fixed 2026-09-27: this used to say
					     "three middle reels" and "more than one can land". -->
					{@html G.bruiser}
				</p>
				</div>
			</section>

			<section class="wp-card">
				<h3><span class="wp-accent-bar"></span>{G.bagsTitle}</h3>
				<div class="wp-bags" aria-hidden="true">
					{#each BAG_SIZES as bag (bag.file)}
						<figure>
							<span class="wp-bag" style:--n={bag.cells}>
								<img class="wp-bag-sym" src={`${SYM}/h3.png`} alt="" />
								<img class="wp-bag-frame" src={`${FRAMES}/${bag.file}.png`} alt="" />
							</span>
							<figcaption><b>{bag.label}</b>{bag.range}</figcaption>
						</figure>
					{/each}
				</div>
				<p>
					{@html G.bags[0]}
					<!-- The ceilings are game_config.py frame_size_ladders: the 2x2 ladder
					     tops out at 10 and the 3x3 at 8, deliberately, so a bigger Frame
					     wins through footprint rather than face value. -->
				</p>
				<p>{@html G.bags[1]}</p>
			</section>

			<section class="wp-card">
				<h3><span class="wp-accent-bar"></span>{G.scoreTitle}</h3>
				<div class="wp-media">
				<span class="wp-bigscore" aria-hidden="true">
					<img src={`${FRAMES}/frame_full.png`} alt="" />
					<b>5&times;&ndash;50&times;</b>
				</span>
				<p>
					{@html G.score}
					<!-- game_config.py fullboard_frame_ladder {5..50}; drawn on any spin
					     including win_criteria=0.0 books, where a full board with no line
					     to multiply pays nothing and is allowed. -->
				</p>
				</div>
			</section>

			<section class="wp-card">
				<h3><span class="wp-accent-bar"></span>{C.scatterTitle}</h3>
				<div class="wp-media">
				<img src={`${SYM}/fs.png`} alt="" aria-hidden="true" />
				<p>{G.scatter(baseFreeSpins)}</p>
				</div>
				<ul class="wp-tiers">
					<li class="wp-tier wp-tier-lookout"><div>
						<img class="wp-tier-title" src={`${SPLASH}/title_lookout.png`} alt="Lookout" />
						<span class="wp-tier-trigger"><img src={`${SYM}/fs.png`} alt="" aria-hidden="true" /><img src={`${SYM}/fs.png`} alt="" aria-hidden="true" /><img src={`${SYM}/fs.png`} alt="" aria-hidden="true" /><b>{C.scatters(3)}</b></span>
						<span class="wp-control-text">{@html G.tiers[0]}</span>
					</div></li>
					<li class="wp-tier wp-tier-muscle"><div>
						<img class="wp-tier-title" src={`${SPLASH}/title_muscle.png`} alt="Muscle" />
						<span class="wp-tier-trigger"><img src={`${SYM}/fs.png`} alt="" aria-hidden="true" /><img src={`${SYM}/fs.png`} alt="" aria-hidden="true" /><img src={`${SYM}/fs.png`} alt="" aria-hidden="true" /><img src={`${SYM}/fs.png`} alt="" aria-hidden="true" /><b>{C.scatters(4)}</b></span>
						<span class="wp-control-text"><!-- game_config.py tier_seed_frames: soldier 1, capo 2, don 1 -->{@html G.tiers[1]}</span>
					</div></li>
					<li class="wp-tier wp-tier-kingpin"><div>
						<img class="wp-tier-title" src={`${SPLASH}/title_kingpin.png`} alt="Kingpin" />
						<span class="wp-tier-trigger"><img src={`${SYM}/fs.png`} alt="" aria-hidden="true" /><img src={`${SYM}/fs.png`} alt="" aria-hidden="true" /><img src={`${SYM}/fs.png`} alt="" aria-hidden="true" /><img src={`${SYM}/fs.png`} alt="" aria-hidden="true" /><img src={`${SYM}/fs.png`} alt="" aria-hidden="true" /><b>{C.scatters(5)}</b></span>
						<span class="wp-control-text">{@html G.tiers[2]}</span>
					</div></li>
				</ul>
			</section>

			<section class="wp-card">
				<h3><span class="wp-accent-bar"></span>{C.retrigTitle}</h3>
				<p>{C.retrig}</p>
				<!-- Stake asked Deadwood Express for this after approval (2026-10-04): "if
				     there is no limit to the number of free spins, clarify". -->
				<p>{C.noLimit}</p>
				<ul class="wp-retrig" aria-hidden="true">
					{#each RETRIGGERS as rt (rt.scatters)}
						<li><span><img src={`${SYM}/fs.png`} alt="" />&times;{rt.scatters}</span><b>+{rt.extra}</b></li>
					{/each}
				</ul>
			</section>

			{#if buyCost}
				<section class="wp-card">
					<h3><span class="wp-accent-bar"></span>{C.entryTitle}</h3>
					<p>{C.entry(vars)}</p>
				</section>
			{/if}

			<section class="wp-card">
				<h3><span class="wp-accent-bar"></span>{C.maxTitle}</h3>
				<p>{C.max(vars)}</p>
			</section>

			<div class="wp-divider"></div>
			<p class="wp-foot">
				{C.foot}
				<!-- Closing line is DICTATED by review, not the studio's to word.
				     Hot Miami's review (2026-09-06) replaced "Silverstars Studio"
				     with exactly "Engine". Do not restore a studio name on reasoning. -->
				TM and &copy; 2026 Engine.
			</p>
		</div>
	</Popup>
{/if}

<style lang="scss">
	/* ── 2026-10-01 illustrated layout ─────────────────────────────────── */
	.wp-head {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.2rem;
	}
	.wp-logo {
		width: min(15rem, 60%);
		height: auto;
		filter: drop-shadow(0 4px 10px rgba(0, 0, 0, 0.7));
	}
	.wp-facts {
		list-style: none;
		margin: 0.35rem 0 0;
		padding: 0;
		display: grid;
		grid-template-columns: repeat(4, minmax(0, 1fr));
		gap: 0.4rem;
		width: 100%;
	}
	.wp-facts li {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 0.3rem 0.1rem;
		border: 12px solid transparent;
		border-image: var(--wp-plate) 130 fill / 24px / 2px stretch;
		text-align: center;
	}
	.wp-facts b {
		color: #ffc38a;
		font-family: var(--hm-title-font, sans-serif);
		font-size: 1rem;
		letter-spacing: 0.03em;
		white-space: nowrap;
	}
	.wp-facts span {
		font-size: 0.66rem;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		opacity: 0.8;
	}
	.wp-media {
		display: grid;
		grid-template-columns: 4.6rem 1fr;
		align-items: center;
		gap: 0.6rem;
	}
	.wp-media > img {
		width: 4.6rem;
		height: 4.6rem;
		object-fit: contain;
		filter: drop-shadow(0 3px 8px rgba(0, 0, 0, 0.7));
	}
	.wp-media p {
		padding-left: 0 !important;
	}
	.wp-bags {
		display: flex;
		justify-content: space-around;
		align-items: flex-end;
		gap: 0.5rem;
		margin: 0.25rem 0 0.6rem;
	}
	.wp-bags figure {
		margin: 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.25rem;
	}
	.wp-bag {
		position: relative;
		display: block;
		width: calc(2.1rem * var(--n));
		height: calc(2.1rem * var(--n));
		background: #0e0f11;
		border-radius: 3px;
	}
	.wp-bag img {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		object-fit: contain;
	}
	.wp-bag-sym {
		padding: 14%;
		box-sizing: border-box;
		opacity: 0.85;
	}
	.wp-bag-frame {
		filter: sepia(0.6) saturate(2.2) hue-rotate(-12deg) brightness(1.25);
	}
	.wp-bags figcaption {
		font-size: 0.74rem;
		text-align: center;
		line-height: 1.25;
	}
	.wp-bags figcaption b {
		display: block;
		color: #ffc38a;
		font-family: var(--hm-title-font, sans-serif);
		font-size: 0.9rem;
	}
	.wp-bigscore {
		position: relative;
		display: grid;
		place-items: center;
		width: 4.6rem;
		height: 4.6rem;
		background: #0e0f11;
		border-radius: 3px;
	}
	.wp-bigscore img {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
	}
	.wp-bigscore b {
		position: relative;
		color: #ffc38a;
		font-family: var(--hm-title-font, sans-serif);
		font-size: 0.78rem;
		text-shadow: 0 0 6px #0e0f11, 0 0 2px #0e0f11;
	}
	.wp-tiers {
		list-style: none;
		margin: 0.6rem 0 0;
		padding: 0;
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 0.5rem;
	}
	@media (max-width: 34rem) {
		.wp-tiers {
			grid-template-columns: 1fr;
		}
	}
	.wp-tier > div {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.3rem;
		height: 100%;
		padding: 0.3rem 0.2rem 0.4rem;
		box-sizing: border-box;
		border: 18px solid transparent;
		border-image: var(--wp-plate) 130 fill / 34px / 4px stretch;
		text-align: center;
	}
	.wp-tier-title {
		width: 100%;
		max-width: 9rem;
		height: auto;
	}
	.wp-tier-trigger {
		display: flex;
		align-items: center;
		gap: 0.1rem;
	}
	.wp-tier-trigger img {
		width: 0.95rem;
		height: 0.95rem;
		object-fit: contain;
	}
	.wp-tier-trigger b {
		margin-left: 0.25rem;
		white-space: nowrap;
		color: #ffc38a;
		font-size: 0.72rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}
	.wp-tier .wp-control-text {
		font-size: 0.76rem;
		line-height: 1.4;
	}
	.wp-retrig {
		list-style: none;
		margin: 0.55rem 0 0;
		padding: 0;
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 0.4rem;
	}
	.wp-retrig li {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 0.2rem 0.1rem;
		border: 12px solid transparent;
		border-image: var(--wp-plate) 130 fill / 24px / 2px stretch;
	}
	.wp-retrig span {
		display: flex;
		align-items: center;
		gap: 0.1rem;
		font-size: 0.8rem;
	}
	.wp-retrig img {
		width: 1.4rem;
		height: 1.4rem;
		object-fit: contain;
	}
	.wp-retrig b {
		color: #ffc38a;
		font-family: var(--hm-title-font, sans-serif);
		font-size: 1.1rem;
	}

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
		0%, 100% { opacity: 0.7; box-shadow: 0 0 6px rgba(255, 195, 138, 0.3); }
		50% { opacity: 1; box-shadow: 0 0 12px rgba(255, 195, 138, 0.55); }
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
		color: #d9d6ce;
		/* Stated, not inherited — see the note in ModalPayTable.svelte. This panel
		   sits outside `.pop-up-wrap` too, so its whole body was in the
		   template's never-loading `proxima-nova` and fell back to the system
		   sans. It is the longest piece of prose in the game. */
		font-family: var(--gb-body-font, sans-serif);
		text-align: left;
		animation: slideUp 0.4s cubic-bezier(0.22, 1, 0.36, 1) both;

		/* custom scrollbar */
		&::-webkit-scrollbar {
			width: 5px;
		}
		&::-webkit-scrollbar-track {
			background: #17191c;
			border-radius: 4px;
		}
		&::-webkit-scrollbar-thumb {
			background: #9c5a22;
			border-radius: 4px;
		}

		h2 {
			margin: 0 0 0.35rem;
			text-align: center;
			font-size: 1.65rem;
			font-weight: 800;
			letter-spacing: 0.08em;
			font-family: var(--hm-title-font);
			color: #d9d6ce;
			font-size: 1.05rem;
			letter-spacing: 0.3em;
			text-transform: uppercase;
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
		/* line the tier entries up with the card paragraph that introduces them */
		padding-left: 0.9rem;
	}

	/* A miniature of the bar's Buy Bonus plate, sized to the same 4.6rem column
	   the glyphs occupy so the row's name lines up with every other row's. */
	.wp-control-plate {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 4.6rem;
		min-height: 2.1rem;
		padding: 0.2rem 0.15rem;
		box-sizing: border-box;
		border: 1px solid rgba(217, 214, 206, 0.45);
		border-radius: 4px;
		background: #14171a;
		color: #d9d6ce;
		/* 0.5rem (8px) -> 0.72rem, ported from Capo Nostra: the only text on the
		   page under 10px, and certification has flagged tiny text before. */
		font-size: 0.72rem;
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
		color: #d9d6ce;
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
		border-bottom: 1px solid #3a3d42;
	}

	.wp-modes thead th {
		color: rgba(255, 195, 138, 0.9);
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		font-size: 0.72rem;
		border-bottom-color: rgba(255, 195, 138, 0.35);
	}

	.wp-modes tbody th {
		color: #d9d6ce;
		font-weight: 700;
		white-space: nowrap;
	}

	/* RTP and max win are the two numbers being certified — keep them legible
	   rather than letting them sit in body-copy grey */
	.wp-modes tbody td:nth-child(3),
	.wp-modes tbody td:nth-child(4) {
		color: #d9d6ce;
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

	/* A concrete slab, not frosted glass. The card was translucent white over a
	   blur — the source game's material, and one this game does not contain
	   anywhere: §0's texture language is poured concrete, rusted metal, taped
	   paper and wet asphalt, and there is no clean glass in it. An opaque
	   near-black panel on a hard concrete edge also stops the rules text from
	   sitting over whatever the reels happen to be showing behind the modal. */
	.wp-card {
		padding: 0.85rem 1rem;
		/* 2026-10-01: the steel panel edge (turfUi/panel_edge.png) nine-sliced
		   round a concrete slab. The url() used to be absolute and was then
		   overridden by a 1px grey border two lines later, so it never drew. */
		border: 12px solid transparent;
		border-image: var(--wp-edge) 40 / 12px stretch;
		background: #17191c padding-box;
		/* the lit top edge of a slab under a street lamp */
		box-shadow: inset 0 1px 0 rgba(91, 95, 102, 0.55);
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
			background: #2a343e padding-box;
		}

		h3 {
			display: flex;
			align-items: center;
			gap: 0.5rem;
			margin: 0 0 0.35rem;
			/* section headings in the title face, like every other heading in the
			   game — the shared `.pop-up-wrap h3` rule does not reach this panel */
			font-family: var(--hm-title-font, 'Arial Narrow', sans-serif);
			font-size: 1.05rem;
			font-weight: 700;
			letter-spacing: 0.05em;
			text-transform: uppercase;
			color: #ffc38a;
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
		background: #f5893d;
		flex-shrink: 0;
		animation: accentPulse 3s ease-in-out infinite;
	}

	.wp-divider {
		width: 60%;
		height: 1px;
		margin: 0.25rem auto;
		background: rgba(255, 195, 138, 0.25);
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
