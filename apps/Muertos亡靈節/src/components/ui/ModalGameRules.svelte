<script lang="ts">
	import { Popup } from 'components-shared';
	import { zIndex } from 'constants-shared/zIndex';
	import { stateModal, LEGAL_NOTICE } from 'state-shared';


	import config from '../../game/config';
	import { getSocialTerms } from '../../game/socialTerms';
	import BarIcon from './BarIcon.svelte';

	// Shared with the pay table — the two panels describe the same game and must
	// use the same words for it. See socialTerms.ts.
	const T = getSocialTerms();

	// Controls guide, in the order the controls sit on the bet bar (v3 bar,
	// MummyBar.svelte). Each row shows the control as the bar draws it
	// (BarIcon.svelte), so a player matches what they read to what they see.
	type Control = { icon: 'buy' | 'menu' | 'bet' | 'spin' | 'auto' | 'turbo'; name: string; text: string };
	const controls: Control[] = [
		{
			icon: 'buy',
			name: T.buyBonusName,
			text: `Opens the feature menu (see below). Shows ON while an activation is running; press it to switch the activation off.`,
		},
		{
			icon: 'menu',
			name: 'Menu',
			text: `Game info, ${T.payTable}, settings, and sound and music volume.`,
		},
		{
			icon: 'bet',
			name: `${T.bet === 'bet' ? 'Bet' : 'Amount'} and balance`,
			text: `The arrows change the ${T.bet} one step per press; press the amount to pick from the full list. Your balance and last win are shown beside it.`,
		},
		{
			icon: 'spin',
			name: 'Spin',
			text: 'Starts a round (or press the space bar). Press again while the reels turn to speed the round up.',
		},
		{
			icon: 'auto',
			name: 'Auto Spin',
			text: 'Choose a number of rounds, then press Spin. Press Auto Spin again to stop.',
		},
		{
			icon: 'turbo',
			name: 'Turbo',
			text: 'Faster spins and win presentations. On when the button is black with a gold bolt.',
		},
	];

	const entryVerb = T.entryVerb;
	const rtpPct = `${(config.rtp * 100).toFixed(2)}%`;
	// The fallback is only reached if the maths config is missing the field, and a
	// wrong one is worse than a crash: it would print a plausible number nobody
	// questions. 1500 was gen-2's cap and survived the change to 10,000 here.
	const maxWin = config.betModes?.base?.max_win ?? 10000;
	const reelCount = config.numReels;
	const rowCount = config.numRows?.[0] ?? 5;
	const lineCount = Object.keys((config as unknown as { paylines?: Record<string, number[]> }).paylines ?? {}).length;

	// Awarded spins by scatter count, straight from the maths' freespin_triggers
	// (design/sync_math_config.mjs lifts it into config).
	const scatterSpins = Object.values(config.scatterSpins ?? { 3: 10, 4: 12, 5: 15 }).join(', ');

	const cfg = config as unknown as {
		fgWheelValues: number[];
		rouletteSegments: Record<number, (number | 'UP')[]>;
	};
	const wheelValues = cfg.fgWheelValues.map((v) => `${v}×`).join(', ');
	const rouletteLevels = [1, 2, 3, 4].map((level) => {
		const values = cfg.rouletteSegments[level].filter((v): v is number => v !== 'UP');
		return {
			level,
			min: Math.min(...values),
			max: Math.max(...values),
			levelUp: cfg.rouletteSegments[level].includes('UP'),
		};
	});

	type BuyMode = { cost?: number; spins?: number };
	const buy = config.betModes.bonus as BuyMode | undefined;

	// Per-mode RTP and max win, read straight out of the maths config.
	type BetMode = { cost?: number; rtp?: number; max_win?: number };
	const modeRows = (
		[
			['Base game', 'base'],
			['Free Spins', 'bonus'],
			['Hold and Spin', 'holdandspin'],
			['Fiesta Spin', 'scarab5'],
			['Fiesta Sure Win', 'scarab10'],
			['Marigold Boost', 'sunboost'],
		] as const
	).map(([label, key]) => {
		const mode = config.betModes?.[key] as BetMode | undefined;
		return {
			label,
			entry:
				key === 'base'
					? 'Normal spin'
					: key.startsWith('scarab') || key === 'sunboost'
						? `${mode?.cost}× ${T.bet} per spin`
						: `${entryVerb} for ${mode?.cost}× ${T.bet}`,
			rtp: mode?.rtp !== undefined ? `${(mode.rtp * 100).toFixed(2)}%` : rtpPct,
			maxWin: `${(mode?.max_win ?? maxWin).toLocaleString()}×`,
		};
	});

</script>

{#if stateModal.modal?.name === 'gameRules'}
	<Popup zIndex={zIndex.modal} onclose={() => (stateModal.modal = null)}>
		<div class="wp-rules">
			<h2>MUERTOS — GAME RULES</h2>

			<section class="wp-card">
				<h3><span class="wp-accent-bar"></span>How to play</h3>
				<p>
					{reelCount}&times;{rowCount} reels, <strong>{lineCount} fixed {T.paylines}</strong>.
					{T.combinationDirection}; 3 or more of a kind wins. Each {T.payline} {T.pays} its highest
					win only, and all {T.paylines} add up. RTP {rtpPct}.
				</p>
			</section>

			<!-- Certification asked for a user interaction guide in the game
			     information. Kept as a definition list of the actual on-screen
			     controls, in the order they sit on the bar. -->
			<section class="wp-card">
				<h3><span class="wp-accent-bar"></span>Controls</h3>
				<ul class="wp-controls">
					{#each controls as control (control.name)}
						<li>
							<span class="wp-control-icons"><span class="wp-bar-icon"><BarIcon kind={control.icon} /></span></span>
							<div>
								<span class="wp-control-name">{control.name}</span>
								<span class="wp-control-text">{control.text}</span>
							</div>
						</li>
					{/each}
				</ul>
				<p class="wp-modes-note">
					Tap anywhere to skip a win presentation.
				</p>
			</section>

			<section class="wp-card">
				<h3><span class="wp-accent-bar"></span>RTP &amp; Max Win by mode</h3>
				<!--
					Scroll wrapper, and the unit lifted out of every row into the header.

					Three of this table's four columns are white-space: nowrap, so they
					cannot shrink: "Hold and Spin", the RTP value and "10,000× amount" need
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
			</section>

			<section class="wp-card">
				<h3><span class="wp-accent-bar"></span>Free Spins &amp; the Fiesta Wheel</h3>
				<p>
					3, 4 or 5 Scatters award {scatterSpins} Free Spins. The multiplier starts at 1&times;.
					<strong>Every free spin with a win turns the Fiesta Wheel</strong> ({wheelValues}) before
					the win is {T.paid}. The result becomes the new multiplier for every winning
					{T.payline}; it never goes down and lasts the whole feature.
				</p>
				<p>
					Spins without a win don't turn the wheel. Press SPIN to turn it (Auto Spin and Turbo turn
					it for you). The result is set when the spin starts.
				</p>
			</section>

			<!-- Its own heading: certification asked for the retrigger rule to be
			     easy to find. Verified against the maths — FR0 carries no Scatter. -->
			<section class="wp-card">
				<h3><span class="wp-accent-bar"></span>Retriggers</h3>
				<p>
					<strong>Free Spins cannot be retriggered.</strong> No Scatters appear during the feature,
					whether it was won or {T.bought}.
				</p>
			</section>

			<section class="wp-card">
				<h3><span class="wp-accent-bar"></span>Marigold Wheel</h3>
				<p>
					Any base game round can end on the Marigold Wheel (after its Free Spins, if any). It has four
					levels:
				</p>
				<ul class="wp-tiers">
					{#each rouletteLevels as lv (lv.level)}
						<li>
							<strong>Level {lv.level}</strong> &mdash; {lv.min.toLocaleString()}&times;&ndash;{lv.max.toLocaleString()}&times;{lv.levelUp
								? ' + LEVEL UP'
								: ''}
						</li>
					{/each}
				</ul>
				<p>
					LEVEL UP spins the next level. Any other segment awards that multiple of the
					{T.totalBet}, added to the round's win. Tap to skip the countdown; the result is set when
					the round starts.
				</p>
			</section>

			<section class="wp-card">
				<h3><span class="wp-accent-bar"></span>Wild &amp; Scatter</h3>
				<p>
					<strong>Wild</strong> replaces every symbol except the Scatter; 5 Wilds {T.pay} like 5 of
					the top symbol.
				</p>
				<p>
					<strong>Scatter</strong> appears in the base game only, anywhere on the reels. It doesn't
					{T.pay} by itself &mdash; it opens Free Spins.
				</p>
			</section>

			<section class="wp-card">
				<h3><span class="wp-accent-bar"></span>Hold and Spin</h3>
				<p>
					{T.entryVerb} for {config.betModes?.holdandspin?.cost}&times; your {T.totalBet}. A separate
					coin board with 3 respins; every Coin that lands sticks and resets the respins to 3. When
					they run out, all Coin values are added up and {T.paid}.
				</p>
			</section>

			<section class="wp-card">
				<h3><span class="wp-accent-bar"></span>Feature menu</h3>
				<p>Opened with {T.buyBonusName}. The {T.cost} is shown before you confirm.</p>
				<ul class="wp-tiers">
					{#if buy?.cost}
						<li>
							<strong>Free Spins ({buy.cost}&times;)</strong> &mdash; {buy.spins} Free Spins, exactly
							as if won with Scatters.
						</li>
					{/if}
					<li>
						<strong>Hold and Spin ({config.betModes?.holdandspin?.cost}&times;)</strong> &mdash; see
						above.
					</li>
				</ul>
				<p>
					<strong>Activations</strong> stay on, charging their multiple of the {T.bet} every spin,
					until you switch them off with the {T.buyBonusName} button:
				</p>
				<ul class="wp-tiers">
					<li>
						<strong>Fiesta Spin ({config.betModes.scarab5.cost}&times;)</strong> &mdash; any base game
						win turns the Fiesta Wheel for that spin.
					</li>
					<li>
						<strong>Fiesta Sure Win ({config.betModes.scarab10.cost}&times;)</strong> &mdash; every
						spin wins and turns the Fiesta Wheel.
					</li>
					<li>
						<strong>Marigold Boost ({config.betModes.sunboost.cost}&times;)</strong> &mdash; the Marigold Wheel
						comes far more often.
					</li>
				</ul>
			</section>

			<!-- The cap is PER MODE (gen-2 was sent back for stating one figure as the
			     game's); both numbers come from the config. -->
			<section class="wp-card">
				<h3><span class="wp-accent-bar"></span>Max Win</h3>
				<p>
					<strong>{maxWin.toLocaleString()}&times;</strong> the {T.totalBet} in every mode except Hold
					and Spin, which caps at
					<strong>{config.betModes?.holdandspin?.max_win?.toLocaleString()}&times;</strong>. Reaching
					the cap ends the round and {T.pays} the capped amount.
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
		0%, 100% { opacity: 0.7; box-shadow: 0 0 6px rgba(46, 196, 182, 0.3); }
		50% { opacity: 1; box-shadow: 0 0 12px rgba(46, 196, 182, 0.55); }
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
			background: linear-gradient(180deg, #2ec4b6 0%, #f2e8d0 100%);
			border-radius: 4px;
		}

		h2 {
			margin: 0 0 0.35rem;
			text-align: center;
			font-size: 1.65rem;
			font-weight: 800;
			letter-spacing: 0.08em;
			background: linear-gradient(135deg, #f2e8d0 0%, #2ec4b6 50%, #d9b77a 100%);
			background-size: 200% auto;
			-webkit-background-clip: text;
			-webkit-text-fill-color: transparent;
			background-clip: text;
			animation: shimmer 4s linear infinite;
			filter: drop-shadow(0 0 18px rgba(46, 196, 182, 0.4));
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
		/* one icon column, so every row's text starts on one line */
		grid-template-columns: 2.8rem 1fr;
		align-items: start;
		gap: 0.7rem;
	}

	.wp-control-icons {
		display: flex;
		align-items: center;
		gap: 0.4rem;
	}

	.wp-bar-icon {
		width: 2.3rem;
		height: 2.3rem;
		flex: none;
		/* nudge down so the glyph optically centres on the first line of text */
		margin-top: -0.15rem;
	}

	.wp-control-name {
		display: block;
		color: #f2e8d0;
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
		color: rgba(46, 196, 182, 0.9);
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		font-size: 0.72rem;
		border-bottom-color: rgba(46, 196, 182, 0.35);
	}

	.wp-modes tbody th {
		color: #f2e8d0;
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
			background: rgba(46, 196, 182, 0.06);
			border-color: rgba(46, 196, 182, 0.18);
			box-shadow: 0 0 16px rgba(46, 196, 182, 0.1);
		}

		h3 {
			display: flex;
			align-items: center;
			gap: 0.5rem;
			margin: 0 0 0.35rem;
			font-size: 1.05rem;
			font-weight: 700;
			color: #2ec4b6;
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
		background: linear-gradient(180deg, #2ec4b6, #d9b77a);
		flex-shrink: 0;
		animation: accentPulse 3s ease-in-out infinite;
	}

	.wp-divider {
		width: 60%;
		height: 1px;
		margin: 0.25rem auto;
		background: linear-gradient(90deg, transparent, rgba(46, 196, 182, 0.3), rgba(242, 232, 208, 0.2), transparent);
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
