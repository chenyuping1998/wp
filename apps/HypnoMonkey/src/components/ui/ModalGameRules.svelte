<script lang="ts">
	import { Popup } from 'components-shared';
	import { zIndex } from 'constants-shared/zIndex';
	import { stateModal, LEGAL_NOTICE } from 'state-shared';

	import config from '../../game/config';
	import { socialTerms } from '../../game/socialTerms';
	import { MEDUSA_GAZE_BET_MODE_META } from '../../game/betModeMeta';
	import BarIcon from './BarIcon.svelte';

	// One vocabulary map for this page and the pay table (game/socialTerms), so
	// the social build can never ship a sentence that says "pays".
	const T = socialTerms();
	const social = T.social;

	// Controls guide, in the order the controls sit on the bet bar (bar v4,
	// ui/SplitBar.svelte): the buy tile and the menu in the bottom-left corner,
	// the menu panel's rows, the readouts and stake controls along the foot,
	// then Spin with Turbo and Auto Spin in the bottom-right corner. Each row
	// shows the control as the bar draws it (ui/BarIcon.svelte), so a player
	// matches what they read to what they see. Every pressable control is
	// listed — a guide that leaves one out fails the engine guideline.
	type Icon = { kind: 'buy' | 'menu' | 'info' | 'paytable' | 'settings' | 'sfx' | 'music' | 'plate' | 'step' | 'spin' | 'auto' | 'turbo'; label?: string; levelLine?: boolean };
	type Control = { icons: Icon[]; name: string; text: string };
	const controls: Control[] = [
		{
			icons: [{ kind: 'buy' }],
			name: T.buyBonusName,
			text: `The yellow tile in the bottom-left corner, marked with the Hypnotist's pocket watch. Opens the feature menu, where Free Spins can be ${T.bought} outright for the stated multiple of your ${T.bet}; the amount is shown before you confirm, and the ${T.bet} can still be changed from the strip at the foot of that menu. It is unlit while a round is playing and hidden during Free Spins.`,
		},
		{
			icons: [{ kind: 'menu' }],
			name: 'Menu',
			text: `The round button above it. Opens a panel with Info, the ${T.payTable} and Settings, and sliders for the sound and music volume. While the panel is open the button shows an X: press it again, or Esc, to close it.`,
		},
		{
			icons: [{ kind: 'info' }],
			name: 'Info',
			text: 'Opens these game rules.',
		},
		{
			icons: [{ kind: 'paytable' }],
			name: T.payTableLabel,
			text: `Lists every symbol and what each count of it ${T.pays}.`,
		},
		{
			icons: [{ kind: 'settings' }],
			name: 'Settings',
			text: 'Opens the volume controls: master volume, music and sound effects, each set separately.',
		},
		{
			icons: [{ kind: 'sfx' }, { kind: 'music' }],
			name: 'Sound and music',
			text: 'The two sliders in the menu panel: the speaker sets the volume of the sound effects, the note the music. Drag a slider all the way to the left to silence it.',
		},
		{
			icons: [{ kind: 'plate', label: 'WIN' }],
			name: 'Balance and win',
			text: `Along the foot of the screen, BALANCE shows what you have and WIN, in the centre, shows what the current round has ${T.paid} so far, counted up as each chain and multiplier lands.`,
		},
		{
			icons: [{ kind: 'step' }],
			name: 'Decrease / increase',
			text: `The two arrows beside the ${T.bet} readout step the ${T.bet} up or down one level per press, through the available ${T.betLevels}.`,
		},
		{
			icons: [{ kind: 'plate', label: T.betPanel.toUpperCase(), levelLine: true }],
			name: social ? 'Amount' : 'Bet amount',
			text: `Shows the current ${T.bet}; the line along its foot shows where it sits among the ${T.betLevels}. Tap it to open the ${T.betMenu} and choose any level directly.`,
		},
		{
			icons: [{ kind: 'spin' }],
			name: 'Spin',
			text: `The large white button in the bottom-right corner. Starts a round for the current ${T.bet}; the space bar does the same. Its arrows turn while the board is moving — press it again then to play the rest of the round at Turbo speed.`,
		},
		{
			icons: [{ kind: 'turbo' }],
			name: 'Turbo',
			text: "The small bolt button above Spin. Press once for Turbo (the button turns black with a gold bolt): quicker drops and win presentations. Press again for Turbo 2 (two gold bolts): the board drops quicker still and each chain step is shorter. A third press turns turbo off. The Hypnotist's watches are always shown at a readable speed.",
		},
		{
			icons: [{ kind: 'auto' }],
			name: 'Auto Spin',
			text: 'The small button beside Turbo. Opens a panel to choose how many rounds to play automatically, from 10 up to 1000 or unlimited (∞); pick a number, then press Spin to start. While it runs, Spin counts down the rounds left. Press Auto Spin or Spin again to stop.',
		},
	];

	// Every figure is read from the maths config (design/sync_math_config.mjs),
	// never typed in, so the rules cannot drift from what the game pays.
	const entryVerb = social ? 'Play' : 'Buy';
	const rtpPct = `${(config.betModes.base.rtp * 100).toFixed(2)}%`;
	const bonusRtpPct = `${(config.betModes.bonus.rtp * 100).toFixed(2)}%`;
	const maxWin = config.betModes?.base?.max_win ?? 15000;
	const reelCount = config.numReels;
	const rowCount = config.numRows?.[0] ?? 6;
	const minPayingCount = 8;
	const fs = config.freeSpins;
	const medusa = config.hypno;
	const scatterPays = Object.entries(config.scatterPays)
		.map(([count, value]) => ({ count: Number(count), value: Number(value) }))
		.sort((a, b) => a.count - b.count);
	const topScatter = scatterPays[scatterPays.length - 1]?.count ?? 6;

	// Every mode needs a description AND its price (Stake review 2026-10-04). The
	// bought mode reuses the confirmation dialog's own text, so the two read alike.
	const modeCards = [
		{
			name: 'Base game',
			price: `1× ${T.bet}`,
			text: `Every spin. ${minPayingCount}+ of a symbol anywhere ${T.pays}, chains continue until nothing more does, the Hypnotist may multiply a winning spin, and ${fs.trigger}+ Hypno Spirals award ${fs.spins} Free Spins.`,
		},
		{
			name: 'Free Spins',
			price: `${config.betModes?.bonus?.cost}× ${T.bet}`,
			text: MEDUSA_GAZE_BET_MODE_META.BONUS.text.dialog,
		},
		{
			name: 'Super Free Spins',
			price: `${config.betModes?.super?.cost}× ${T.bet}`,
			text: MEDUSA_GAZE_BET_MODE_META.SUPER.text.dialog,
		},
	];

	// Per-mode RTP and max win: certification asks for both, clearly, for every mode.
	type BetMode = { cost?: number; rtp?: number; max_win?: number };
	const modeRows = (
		[
			['Base game', 'base', `Every spin — or land ${fs.trigger} or more Hypno Spirals`],
			['Free Spins', 'bonus', `${entryVerb} for ${config.betModes?.bonus?.cost}×`],
			['Super Free Spins', 'super', `${entryVerb} for ${config.betModes?.super?.cost}×`],
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
			<h2>HYPNO MONKEY — GAME RULES</h2>

			<section class="wp-card">
				<h3><span class="wp-accent-bar"></span>How to play</h3>
				<p>
					Hypno Monkey is a {reelCount}&times;{rowCount} {T.payAnywhere} video slot. There are no
					{T.paylines} and symbols do not need to touch: if {minPayingCount} or more of the same symbol
					are anywhere on the board, they {T.pay}. The more of that symbol there are, the higher the
					{T.payValue}. Winning symbols are then hypnotised away, the symbols above them fall,
					and new ones drop in from the top &mdash; if that leaves {minPayingCount} or more of a symbol
					again it {T.pays} too, and the chain continues until nothing more {T.pays}. Wins from
					different symbols are added together. The theoretical return to player (RTP) is {rtpPct}.
				</p>
			</section>

			<section class="wp-card">
				<h3><span class="wp-accent-bar"></span>Controls</h3>
				<ul class="wp-controls">
					{#each controls as control (control.name)}
						<li>
							<span class="wp-control-icons" aria-hidden="true">
								{#each control.icons as icon, i (i)}
									<span class={icon.kind === 'plate' ? 'wp-bar-icon wp-bar-plate' : 'wp-bar-icon'}
										><BarIcon kind={icon.kind} label={icon.label} levelLine={icon.levelLine} /></span
									>
								{/each}
							</span>
							<div>
								<span class="wp-control-name">{control.name}</span>
								<span class="wp-control-text">{control.text}</span>
							</div>
						</li>
					{/each}
				</ul>
				<p class="wp-modes-note">Where a win presentation is playing, tapping anywhere skips to the end of it. Esc closes the menu and Auto Spin panels.</p>
			</section>

			<section class="wp-card">
				<h3><span class="wp-accent-bar"></span>Game modes</h3>
				{#each modeCards as mode (mode.name)}
					<p><strong>{mode.name}</strong> &mdash; {T.costLabel}: {mode.price}. {mode.text}</p>
				{/each}
			</section>

			<section class="wp-card">
				<h3><span class="wp-accent-bar"></span>RTP &amp; Max Win by mode</h3>
				<!-- scrolls sideways rather than clipping on the narrowest layouts -->
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
					Max wins are multiples of the {T.totalBet}. When a round reaches the cap it ends
					immediately and the capped amount is {T.paid}.
				</p>
			</section>

			<section class="wp-card">
				<h3><span class="wp-accent-bar"></span>The Hypnotist's watch</h3>
				<p>
					A pocket-watch multiplier can drop into its own cell alongside the symbols.
					Its multiplier is collected when the spin's chain has finished.
					<strong>It only counts if that spin had a win from the chain.</strong> If the spin had no
					win, the watch shatters and nothing changes.
				</p>
				<p>
					In the base game he can add up to {medusa.baseMaxThrows} watches on one spin, worth
					{medusa.baseValues.join('×, ')}×; the spin's whole chain win is multiplied by the sum of
					its watches. A spin with no win can throw many more, up to {medusa.deadMaxThrows};
					they all shatter and add nothing.
				</p>
			</section>

			<section class="wp-card">
				<h3><span class="wp-accent-bar"></span>Free Spins &mdash; the running total</h3>
				<p>
					In Free Spins he can add up to {medusa.freeMaxThrows} watches on one spin, worth
					{medusa.freeValues.join('×, ')}×; in Super Free Spins every watch is worth
					{medusa.superValues.join('×, ')}×. Every watch added on a spin
					with a win is <strong>added to a running total</strong>, and that spin's chain win is
					multiplied by the new total.
				</p>
				<ul class="wp-tiers">
					<li>A spin with a win and a watch: the watch is added, then the win is multiplied by the total.</li>
					<li>A spin with a win and no watch: the win is {T.paid} as it is, &times;1. The total is kept.</li>
					<li>Watches on a spin with no win (up to {medusa.deadMaxThrows}) shatter and are not added.</li>
				</ul>
				<p>The running total starts at 0, never goes down during the feature, and resets when the feature ends.</p>
			</section>

			<section class="wp-card">
				<h3><span class="wp-accent-bar"></span>Hypno Spiral &mdash; Scatter</h3>
				<p>
					The Hypno Spiral can land anywhere and is never removed by a chain. If {scatterPays[0]?.count ?? 4}
					or more are on the board when the chain ends they {T.pay}
					{#each scatterPays as pay, i (pay.count)}{i > 0 ? (i === scatterPays.length - 1 ? ' or ' : ', ') : ''}{pay.value}&times;
						for {pay.count === topScatter ? `${pay.count} or more` : pay.count}{/each}
					the {T.totalBet}. This {T.payout} is never multiplied by a watch. {fs.trigger} or more Hypno Spirals in
					the base game award <strong>{fs.spins} Free Spins</strong>.
				</p>
			</section>

			<section class="wp-card">
				<h3><span class="wp-accent-bar"></span>Retriggers</h3>
				<p>
					During Free Spins, {fs.retrigger} or more Hypno Spirals on the board when a chain ends add
					<strong>{fs.retriggerSpins} more Free Spins</strong>. There is no maximum number of Free
					Spins; the feature ends when its spins run out or the maximum win is reached. This applies to
					Free Spins won with Hypno Spirals and to rounds {T.bought} from the menu.
				</p>
			</section>

			<section class="wp-card">
				<h3><span class="wp-accent-bar"></span>{T.buyBonusName}</h3>
				<p>
					Instead of waiting for the Hypno Spirals, you can {T.buy} direct entry into Free Spins for
					{config.betModes?.bonus?.cost}&times; your {T.bet}. The round opens with {fs.trigger} or more
					Hypno Spirals on the board and plays exactly like Free Spins won in the base game, at
					{bonusRtpPct} RTP.
				</p>
			</section>

			<section class="wp-card">
				<h3><span class="wp-accent-bar"></span>Max Win</h3>
				<p>
					The maximum {T.payout} is capped at {maxWin.toLocaleString()}&times; the {T.totalBet} in every
					mode. Once the cap is reached the round ends immediately and the maximum win is {T.paid}.
				</p>
			</section>

			<div class="wp-divider"></div>
			<!-- The legal notice is shared (state-shared/src/legal.ts) — render the constant, never retype it. -->
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

	@keyframes cardIn {
		from {
			opacity: 0;
			transform: translateY(10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	/* Flat sitcom-cartoon panel: marble paper, one ink for every outline, coral
	   headings, gold accent bar. No gradients, no glow — the art rules apply. */
	.wp-rules {
		/* above the Popup's full-screen click-to-close layer (z-index 2), or the
		   overlay swallows wheel and touch events and blocks scrolling */
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
		background: #efe8d8;
		border: 5px solid #2a1f24;
		border-radius: 18px;
		color: #2a1f24;
		text-align: left;
		animation: slideUp 0.35s cubic-bezier(0.22, 1, 0.36, 1) both;

		&::-webkit-scrollbar {
			width: 6px;
		}
		&::-webkit-scrollbar-thumb {
			background: #2a1f24;
			border-radius: 4px;
		}

		h2 {
			margin: 0 0 0.35rem;
			text-align: center;
			font-size: 1.6rem;
			letter-spacing: 0.06em;
			color: #2a1f24;
		}
	}

	.wp-card {
		padding: 0.85rem 1rem;
		border-radius: 0.75rem;
		background: #fffaf0;
		border: 2px solid #2a1f24;
		animation: cardIn 0.35s cubic-bezier(0.22, 1, 0.36, 1) both;

		h3 {
			display: flex;
			align-items: center;
			gap: 0.5rem;
			margin: 0 0 0.35rem;
			font-size: 1.05rem;
			color: #c85a4a;
		}

		p {
			margin: 0 0 0.4rem;
			font-size: 0.88rem;
			line-height: 1.55;
			padding-left: 0.9rem;

			&:last-child {
				margin-bottom: 0;
			}
		}
	}

	.wp-accent-bar {
		display: inline-block;
		width: 4px;
		height: 1.1em;
		border-radius: 2px;
		background: #f2b632;
		flex-shrink: 0;
	}

	/* Controls guide: each row pairs the button's own art with what it does. */
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
		/* wide enough for two icons or one readout plate, so every row's text
		   starts on one line */
		grid-template-columns: 4.6rem 1fr;
		align-items: start;
		gap: 0.7rem;
	}

	.wp-control-icons {
		display: flex;
		align-items: center;
		gap: 0.3rem;
	}

	/* the bar's own controls (ui/BarIcon.svelte), drawn as the v4 bar draws them */
	.wp-bar-icon {
		width: 2.2rem;
		height: 2.2rem;
		flex: none;
		/* nudge down so the glyph optically centres on the first line of text */
		margin-top: -0.1rem;
	}

	/* a readout plate is wider than it is tall: give it the whole column */
	.wp-bar-plate {
		width: 4.4rem;
	}

	.wp-control-name {
		display: block;
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
		border-bottom: 1px solid rgba(42, 31, 36, 0.25);
	}

	.wp-modes thead th {
		color: #c85a4a;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		font-size: 0.72rem;
		border-bottom: 2px solid #2a1f24;
	}

	.wp-modes tbody th {
		font-weight: 700;
		white-space: nowrap;
	}

	/* RTP and max win are the two certified numbers — keep them prominent */
	.wp-modes tbody td:nth-child(3),
	.wp-modes tbody td:nth-child(4) {
		font-weight: 700;
		white-space: nowrap;
	}

	.wp-modes tbody tr:last-child th,
	.wp-modes tbody tr:last-child td {
		border-bottom: none;
	}

	.wp-modes-note {
		margin-top: 0.5rem !important;
		font-size: 0.76rem !important;
		opacity: 0.8;
	}

	.wp-tiers {
		margin: 0.4rem 0 0.5rem;
		padding-left: 1.9rem;
		display: flex;
		flex-direction: column;
		gap: 0.3rem;

		li {
			font-size: 0.85rem;
			line-height: 1.45;
		}
	}

	.wp-divider {
		width: 60%;
		height: 2px;
		margin: 0.25rem auto;
		background: #2a1f24;
		opacity: 0.25;
	}

	.wp-foot {
		margin: 0;
		font-size: 0.75rem;
		opacity: 0.6;
		text-align: center;
		line-height: 1.45;
	}
</style>
