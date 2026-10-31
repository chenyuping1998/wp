<script lang="ts">
	import { stateModal, LEGAL_NOTICE } from 'state-shared';

	import { base } from '$app/paths';

	import TempleInfoShell from './TempleInfoShell.svelte';
	import TempleGuide from './TempleGuide.svelte';
	import config from '../../game/config';
	import { socialTerms } from '../../game/socialTerms';
	import { MEDUSA_GAZE_BET_MODE_META } from '../../game/betModeMeta';

	// One vocabulary map for this page and the pay table (game/socialTerms), so
	// the social build can never ship a sentence that says "pays".
	const T = socialTerms();
	const social = T.social;

	// Controls guide. Each row shows the button's own art from the bet bar, so a
	// player matches what they read to what they see. This panel is DOM, so the
	// icons come from static/ rather than the pixi asset pipeline. Every pressable
	// control is listed — a guide that leaves one out fails the engine guideline.
	const ICONS = `${base}/assets/sprites/medusaUiIcons`;
	type Control = { icons: string[]; name: string; text: string; sign?: boolean; readout?: string; opens?: boolean };
	const controls: Control[] = [
		{
			icons: ['spin'],
			name: 'Spin',
			text: `Starts a round for the current ${T.bet}. The space bar does the same thing. While the board is moving it becomes Stop, which brings it to rest early.`,
		},
		{
			icons: ['decrease', 'increase'],
			name: 'Decrease / increase',
			text: `Steps the ${T.bet} down or up one level per press, through the available ${T.betLevels}. They sit either side of the ${T.bet} readout.`,
		},
		{
			icons: [],
			readout: social ? 'AMOUNT' : 'BET',
			opens: true,
			name: social ? 'Amount' : 'Bet amount',
			text: `Shows the current ${T.bet}. Tap it to open the ${T.betMenu} and choose any of the available ${T.betLevels} directly.`,
		},
		{
			icons: [],
			sign: true,
			name: T.buyBonusName,
			text: `The Aegis shield beside the board. Opens the feature menu, where Free Spins can be ${T.bought} outright for the stated multiple of your ${T.bet}; the amount is shown before you confirm. It is unlit while a round is playing and hidden during Free Spins.`,
		},
		{
			icons: ['autoSpin'],
			name: 'Auto Spin',
			text: 'Plays a chosen number of rounds automatically. Open it to set the count and any stop conditions; the remaining count shows on the button. Press it again to stop early.',
		},
		{
			icons: ['turbo'],
			name: 'Turbo',
			text: "Press once for Turbo (one solid bolt): quicker drops and win presentations. Press again for Turbo 2 (two bolts): the board drops quicker still and each chain step is shorter. A third press turns turbo off. Medusa's multiplier is always shown at a readable speed.",
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
			icons: [],
			readout: 'WIN',
			name: 'Balance and win',
			text: `Balance shows what you have; Win shows what the current round has ${T.paid} so far, counted up as each chain and multiplier lands.`,
		},
		{
			icons: ['payTable'],
			name: T.payTableLabel,
			text: `Lists every symbol and what each count of it ${T.pays}.`,
		},
		{
			icons: ['soundOn'],
			name: 'Sound',
			text: 'Mutes and unmutes the game. Volume is adjusted under Settings.',
		},
	];

	// Every figure is read from the maths config (design/sync_math_config.mjs),
	// never typed in, so the rules cannot drift from what the game pays.
	const entryVerb = social ? 'Play' : 'Buy';
	const rtpPct = `${(config.rtp * 100).toFixed(2)}%`;
	const maxWin = config.betModes?.base?.max_win ?? 15000;
	const reelCount = config.numReels;
	const rowCount = config.numRows?.[0] ?? 6;
	const minPayingCount = 8;
	const fs = config.freeSpins;
	const medusa = config.medusa;
	const freeOnly = medusa.freeValues.filter((v: number) => !medusa.baseValues.includes(v));
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
			text: `Every spin. ${minPayingCount}+ of a symbol anywhere ${T.pays}, chains continue until nothing more does, Medusa may multiply a winning spin, and ${fs.trigger}+ Aegis award ${fs.spins} Free Spins.`,
		},
		{
			name: 'Free Spins',
			price: `${config.betModes?.bonus?.cost}× ${T.bet}`,
			text: MEDUSA_GAZE_BET_MODE_META.BONUS.text.dialog,
		},
	];

	// Per-mode RTP and max win: certification asks for both, clearly, for every mode.
	type BetMode = { cost?: number; rtp?: number; max_win?: number };
	const modeRows = (
		[
			['Base game', 'base', 'Standard play'],
			['Free Spins', 'bonus', `${fs.trigger}+ Aegis, or ${entryVerb.toLowerCase()} for ${config.betModes?.bonus?.cost}×`],
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
	<TempleInfoShell view="rules" chapters={[{id:'how',label:'Quick guide'},{id:'gaze',label:'The gaze'},{id:'free-spins',label:'Free Spins'},{id:'aegis',label:'Aegis'},{id:'controls',label:'Controls'},{id:'rtp',label:'RTP & modes'}]}>
		<div class="wp-rules">
			<TempleGuide/>

			<section class="wp-card" data-chapter="how-detail">
				<h3><span class="wp-accent-bar"></span>How to play</h3>
				<p>
					Medusa Gaze is a {reelCount}&times;{rowCount} {T.payAnywhere} video slot. There are no
					{T.paylines} and symbols do not need to touch: if {minPayingCount} or more of the same symbol
					are anywhere on the board, they {T.pay}. The more of that symbol there are, the higher the
					{T.payValue}. Winning symbols then turn to stone and crumble, the symbols above them fall,
					and new ones drop in from the top &mdash; if that leaves {minPayingCount} or more of a symbol
					again it {T.pays} too, and the chain continues until nothing more {T.pays}. Wins from
					different symbols are added together. The theoretical return to player (RTP) is {rtpPct}.
				</p>
			</section>

			<section class="wp-card" data-chapter="controls">
				<h3><span class="wp-accent-bar"></span>Controls</h3>
				<ul class="wp-controls">
					{#each controls as control (control.name)}
						<li>
							<span class="wp-control-icons" aria-hidden="true">
								{#if control.sign}
									<img class="wp-sign" src={`${base}/assets/sprites/medusaUi/buybonus_plate.png`} alt="" />
								{:else if control.readout}
									<span class="wp-readout"
										>{control.readout}{#if control.opens}<svg viewBox="0 0 12 8"><polyline points="1.5,1.5 6,6 10.5,1.5" /></svg>{/if}</span
									>
								{:else}
									{#each control.icons as name (name)}
										<span class="wp-icon-plate" style:--disc={`url('${base}/assets/sprites/medusaUi/button_disc.png')`}
											><img src={`${ICONS}/${name}.png`} alt="" /></span
										>
									{/each}
								{/if}
							</span>
							<div>
								<span class="wp-control-name">{control.name}</span>
								<span class="wp-control-text">{control.text}</span>
							</div>
						</li>
					{/each}
				</ul>
				<p class="wp-modes-note">Where a win presentation is playing, tapping anywhere skips to the end of it.</p>
			</section>

			<section class="wp-card" data-chapter="modes">
				<h3><span class="wp-accent-bar"></span>Game modes</h3>
				{#each modeCards as mode (mode.name)}
					<p><strong>{mode.name}</strong> &mdash; {T.costLabel}: {mode.price}. {mode.text}</p>
				{/each}
			</section>

			<section class="wp-card" data-chapter="rtp">
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

			<section class="wp-card" data-chapter="gaze">
				<h3><span class="wp-accent-bar"></span>Medusa's multiplier</h3>
				<p>
					When a spin's chain has finished, Medusa may summon and throw a multiplier.
					<strong>It only counts if that spin had a win from the chain.</strong> If the spin had no
					win, the throw shatters and nothing changes.
				</p>
				<p>
					In the base game she throws one multiplier, worth {medusa.baseValues.join('×, ')}×, and the
					spin's whole chain win is multiplied by it.
				</p>
			</section>

			<section class="wp-card" data-chapter="free-spins">
				<h3><span class="wp-accent-bar"></span>Free Spins &mdash; the running total</h3>
				<p>
					In Free Spins Medusa can throw up to {medusa.freeMaxThrows} multipliers on one spin, worth
					{medusa.baseValues.join('×, ')}× or {freeOnly.join('×, ')}×. Every multiplier thrown on a spin
					with a win is <strong>added to a running total</strong>, and that spin's chain win is
					multiplied by the new total.
				</p>
				<ul class="wp-tiers">
					<li>A spin with a win and a throw: the throw is added, then the win is multiplied by the total.</li>
					<li>A spin with a win and no throw: the win is {T.paid} as it is, &times;1. The total is kept.</li>
					<li>A throw on a spin with no win shatters and is not added.</li>
				</ul>
				<p>The running total starts at 0, never goes down during the feature, and resets when the feature ends.</p>
			</section>

			<section class="wp-card" data-chapter="aegis">
				<h3><span class="wp-accent-bar"></span>Aegis &mdash; Scatter</h3>
				<p>
					The Aegis shield can land anywhere and is never removed by a chain. If {scatterPays[0]?.count ?? 4}
					or more are on the board when the chain ends they {T.pay}
					{#each scatterPays as pay, i (pay.count)}{i > 0 ? (i === scatterPays.length - 1 ? ' or ' : ', ') : ''}{pay.value}&times;
						for {pay.count === topScatter ? `${pay.count} or more` : pay.count}{/each}
					the {T.totalBet}. This {T.payout} is never multiplied by Medusa. {fs.trigger} or more Aegis in
					the base game award <strong>{fs.spins} Free Spins</strong>.
				</p>
			</section>

			<section class="wp-card" data-chapter="retrigger">
				<h3><span class="wp-accent-bar"></span>Retriggers</h3>
				<p>
					During Free Spins, {fs.retrigger} or more Aegis on the board when a chain ends add
					<strong>{fs.retriggerSpins} more Free Spins</strong>. There is no maximum number of Free
					Spins; the feature ends when its spins run out or the maximum win is reached. This applies to
					Free Spins won with Aegis and to rounds {T.bought} from the menu.
				</p>
			</section>

			<section class="wp-card" data-chapter="bonus">
				<h3><span class="wp-accent-bar"></span>{T.buyBonusName}</h3>
				<p>
					Instead of waiting for the Aegis, you can {T.buy} direct entry into Free Spins for
					{config.betModes?.bonus?.cost}&times; your {T.bet}. The round opens with {fs.trigger} or more
					Aegis on the board and plays exactly like Free Spins won in the base game, at the same
					{rtpPct} RTP.
				</p>
			</section>

			<section class="wp-card" data-chapter="max">
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
	</TempleInfoShell>
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
		/* wide enough for the two-key stepper, so every row's text starts on one line */
		grid-template-columns: 5rem 1fr;
		align-items: start;
		gap: 0.7rem;
	}

	.wp-control-icons {
		display: flex;
		align-items: center;
		gap: 0.3rem;
	}

	/* the bar's round buttons are drawn on a teal face; the icons are white */
	/* the bar's own disc art behind each icon, so the guide matches the bar */
	.wp-icon-plate {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 2.2rem;
		height: 2.2rem;
		background: var(--disc) center / contain no-repeat;

		img {
			width: 1.4rem;
			height: 1.4rem;
			object-fit: contain;
		}
	}

	.wp-sign {
		width: 3rem;
		height: 3rem;
		object-fit: contain;
	}

	/* the bet readout: caption plus the chevron the bar draws beside it */
	.wp-readout {
		display: inline-flex;
		align-items: center;
		gap: 0.3rem;
		padding: 0.2rem 0.45rem;
		border: 2px solid #2a1f24;
		border-radius: 0.4rem;
		background: #1e4950;
		color: #efe8d8;
		font: 400 0.7rem var(--gb-display-font, sans-serif);
	}
	.wp-readout svg {
		width: 0.7rem;
		height: 0.5rem;
		fill: none;
		stroke: #efe8d8;
		stroke-width: 2;
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

 /* App-owned temple archive; paragraphs retain a readable floor on phones. */
 .wp-rules{box-sizing:border-box;width:100%;max-width:none;max-height:none;overflow:visible;padding:26px;background:transparent;border:0;border-radius:0;box-shadow:none;animation:none;text-align:left;color:#173e43;gap:18px}
 .wp-card{background:#fffaf0;border:1px solid #cec3a4;border-radius:9px;padding:20px;box-shadow:0 3px 0 #ded4bc;animation:none;scroll-margin-top:18px}
 .wp-card h3{font:400 17px/1.35 var(--gb-display-font);color:#173e43;letter-spacing:0;margin:0 0 13px}.wp-card p,.wp-tiers li,.wp-control-text{font-size:14px;line-height:1.7;color:#3b534d;opacity:1}.wp-card p{margin:9px 0}.wp-accent-bar{background:#b89b50}
 .wp-controls{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;list-style:none;padding:0}.wp-controls li{display:grid;grid-template-columns:84px minmax(0,1fr);gap:12px;padding:12px;background:#eee8d8;border:1px solid #d3c9ac;border-radius:7px}.wp-control-icons{justify-content:center;gap:5px;min-width:0;width:auto}.wp-icon-plate{width:36px;height:36px}.wp-control-name{color:#173e43;font-size:14px}.wp-control-text{font-size:12.5px;line-height:1.6}.wp-readout{font-size:12px;color:#173e43}.wp-modes-note,.wp-foot{font-size:12px;line-height:1.7;color:#5a6a60}.wp-modes{font-size:13px}.wp-modes th{color:#173e43;background:#e5ddc8}.wp-tiers li::marker{color:#987528}
 @media(max-width:700px){.wp-controls{grid-template-columns:1fr}}
 @media(max-width:600px){.wp-rules{padding:17px;gap:15px}.wp-card{padding:16px}.wp-card h3{font-size:15px}.wp-card p,.wp-tiers li{font-size:13px;line-height:1.7}.wp-controls li{grid-template-columns:76px minmax(0,1fr);padding:10px}.wp-foot{font-size:11px}}


 @media(max-width:600px){.wp-controls li{display:block}.wp-control-icons{float:left;min-height:36px;margin:0 10px 7px 0;max-width:82px}.wp-control-name{min-height:36px;line-height:1.5;padding-top:7px}.wp-control-text{clear:both;display:block;font-size:13px;line-height:1.65}.wp-icon-plate{width:32px;height:32px}}
 </style>
