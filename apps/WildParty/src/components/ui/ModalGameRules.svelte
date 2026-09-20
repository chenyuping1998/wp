<script lang="ts">
	import { Popup } from 'components-shared';
	import { zIndex } from 'constants-shared/zIndex';
	import { stateModal } from 'state-shared';

	import config from '../../game/config';
	import assets from '../../game/assets';
	import { getSocialTerms } from '../../game/socialTerms';

	// Social play forbids betting terminology in anything the player can read.
	// Resolved here rather than at module scope because getSocialTerms() reads the
	// page URL, which is not available while a module is being evaluated — the
	// trap documented in the stake-engine-slot skill.
	const terms = getSocialTerms();

	const rtpPct = `${(config.rtp * 100).toFixed(2)}%`;
	const lineCount = Object.keys(config.paylines).length;
	const maxWin = config.betModes?.base?.max_win ?? 5000;
	const buyCost = config.betModes?.bonus?.cost;
	const buyQuickCost = config.betModes?.bonus_quick?.cost;
	const buySuperCost = config.betModes?.bonus_super?.cost;
	const reelCount = config.numReels;
	const rowCount = config.numRows?.[0] ?? 3;

	// Controls guide.
	//
	// Certification asks that the game information "explain all buttons and
	// interactive elements", and the rules page listed the features but never the
	// controls. Each row carries the button's ACTUAL art rather than a drawn
	// approximation or a name, so the player is matching what they can see on the
	// bar — a description of an icon is not a guide to it.
	const iconSrc = (key: keyof typeof assets) =>
		(assets[key] as { src?: string } | undefined)?.src ?? '';

	const controls: { icon: string; name: string; what: string }[] = [
		{
			icon: iconSrc('wpIconMenu'),
			name: 'Menu',
			what: `Opens the menu with the game information, ${terms.payTable}, settings and sound controls.`,
		},
		{
			icon: iconSrc('wpIconInfo'),
			name: 'Game Information',
			what: 'Opens this page — how the game works, the features and the rules.',
		},
		{
			icon: iconSrc('wpIconPayTable'),
			name: terms.payTableUpper,
			what: `Shows what every symbol ${terms.pays} for 3, 4 and 5 in a row.`,
		},
		{
			icon: iconSrc('wpIconSettings'),
			name: 'Settings',
			what: 'Music and sound-effect volume, and the quick-play options.',
		},
		{
			icon: iconSrc('wpIconSoundOn'),
			name: 'Sound On',
			what: 'Sound is playing. Select to mute all music and effects.',
		},
		{
			icon: iconSrc('wpIconSoundOff'),
			name: 'Sound Off',
			what: 'Sound is muted. Select to turn music and effects back on.',
		},
		{
			icon: iconSrc('wpIconAutoSpin'),
			name: 'Auto',
			what: 'Choose a number of rounds to play automatically, then confirm to start. Select again at any time to stop.',
		},
		{
			icon: iconSrc('wpIconReplay'),
			name: 'Replay',
			what: 'Plays the last completed round back again.',
		},
	];
</script>

{#if stateModal.modal?.name === 'gameRules'}
	<Popup zIndex={zIndex.modal} onclose={() => (stateModal.modal = null)}>
		<div class="wp-rules">
			<h2>WILD PARTY — GAME RULES</h2>

			<section class="wp-card">
				<h3><span class="wp-accent-bar"></span>How to play</h3>
				<p>
					Wild Party is a {reelCount}&times;{rowCount} video slot with {lineCount} fixed {terms.paylines}.
					{terms.combinationDirection}. Only the highest win is {terms.paid} per line, and all line wins are added
					together. The theoretical return to player (RTP) is {rtpPct}.
				</p>
			</section>

			<section class="wp-card">
				<h3><span class="wp-accent-bar"></span>Wild</h3>
				<p>
					The Wild symbol substitutes for every symbol except the Scatter, helping to
					complete winning {terms.paylines}. Wilds also drive the Global Multiplier during Free Spins.
				</p>
			</section>

			<section class="wp-card">
				<h3><span class="wp-accent-bar"></span>Scatter</h3>
				<p>
					The Scatter symbol appears only on reels 3, 4 and 5. Scatters {terms.scatterPays}
					and do not need to be on a {terms.payline}. Landing 3 Scatters in a single spin
					triggers the Free Spins feature.
				</p>
			</section>

			<section class="wp-card">
				<h3><span class="wp-accent-bar"></span>Free Spins</h3>
				<p>
					3 Scatters award 5 Free Spins. Landing another 3 Scatters during the feature
					retriggers and adds +5 Free Spins. The feature is played on a dedicated reel set
					with more Wilds.
				</p>
			</section>

			<section class="wp-card">
				<h3><span class="wp-accent-bar"></span>Global Multiplier</h3>
				<p>
					Free Spins use a single accumulating Global Multiplier applied to every line win.
					It starts between 1&times; and 3&times; &mdash; one for each {terms.payline} the triggering
					Scatters complete &mdash; and increases by +1 for every Wild that appears during
					Free Spins, up to a maximum of 100&times;. The multiplier stays active for the whole
					feature.
				</p>
			</section>

			{#if buyCost}
				<section class="wp-card">
					<h3><span class="wp-accent-bar"></span>{terms.buyBonusName}</h3>
					<p>
						Instead of waiting for Scatters, you can {terms.buy} direct entry into the Free Spins
						feature at three tiers: Quick ({buyQuickCost}&times;) starts the Global Multiplier
						at 1&times;; Bonus ({buyCost}&times;) starts at a random 1&times;&ndash;3&times;, exactly
						like a natural Scatter trigger; and Super ({buySuperCost}&times;) starts elevated
						with the highest volatility. Every tier plays at the same {rtpPct} RTP.
					</p>
				</section>
			{/if}

			<section class="wp-card">
				<h3><span class="wp-accent-bar"></span>Max Win</h3>
				<p>
					The maximum {terms.payout} is capped at {maxWin.toLocaleString()}&times; the {terms.totalBet}. Once
					the cap is reached the round ends immediately and the maximum win is awarded.
				</p>
			</section>

			<section class="wp-card">
				<h3><span class="wp-accent-bar"></span>Controls</h3>
				<ul class="wp-controls">
					{#each controls as control (control.name)}
						<li>
							<span class="wp-control-icon">
								{#if control.icon}<img src={control.icon} alt={control.name} />{/if}
							</span>
							<span class="wp-control-text">
								<strong>{control.name}</strong>
								{control.what}
							</span>
						</li>
					{/each}
					<li>
						<span class="wp-control-icon wp-control-icon--text">SPIN</span>
						<span class="wp-control-text">
							<strong>Spin</strong>
							Starts a round. The space bar does the same thing. While the reels are turning
							the same control stops them early.
						</span>
					</li>
					<li>
						<span class="wp-control-icon wp-control-icon--text">&minus;&nbsp;+</span>
						<span class="wp-control-text">
							<strong>{terms.betUpper}</strong>
							Lowers or raises the {terms.bet}. Select the value between them to pick from the
							full list.
						</span>
					</li>
					<li>
						<!-- The same polygon UiButton draws for the turbo button, not the
						     ⚡ glyph. That glyph is only UiButton's fallback — the button
						     itself draws a vector bolt, so the emoji would both misdescribe
						     the control and put back the kind of icon certification
						     objected to. -->
						<span class="wp-control-icon">
							<svg viewBox="-34 -50 70 102" aria-hidden="true">
								<polygon
									points="14,-48 -30.8,6 -2.8,6 -16.8,48 33.6,-10 2.8,-10"
									fill="none"
									stroke="#22e4ff"
									stroke-width="5"
									stroke-linejoin="round"
								/>
							</svg>
						</span>
						<span class="wp-control-text">
							<strong>Turbo</strong>
							Speeds the reels up. Select again to return to normal speed.
						</span>
					</li>
				</ul>
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
	.wp-controls {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0.7rem;

		li {
			display: flex;
			align-items: flex-start;
			gap: 0.75rem;
		}
	}

	.wp-control-icon {
		flex: 0 0 2.6rem;
		height: 2.6rem;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 0.6rem;
		background: rgba(255, 255, 255, 0.06);
		border: 1px solid rgba(34, 228, 255, 0.35);

		img,
		svg {
			width: 1.5rem;
			height: 1.5rem;
			object-fit: contain;
		}

		&--text {
			font-size: 0.72rem;
			font-weight: 700;
			letter-spacing: 0.04em;
			color: #22e4ff;
		}
	}

	.wp-control-text {
		flex: 1;
		line-height: 1.45;

		strong {
			display: block;
			color: #fff;
		}
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
		0%, 100% { opacity: 0.7; box-shadow: 0 0 6px rgba(255, 122, 217, 0.3); }
		50% { opacity: 1; box-shadow: 0 0 12px rgba(255, 122, 217, 0.6); }
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
			background: linear-gradient(180deg, #ff7ad9 0%, #ffd34d 100%);
			border-radius: 4px;
		}

		h2 {
			margin: 0 0 0.35rem;
			text-align: center;
			font-size: 1.65rem;
			font-weight: 800;
			letter-spacing: 0.08em;
			background: linear-gradient(135deg, #ffd34d 0%, #ff7ad9 50%, #a855f7 100%);
			background-size: 200% auto;
			-webkit-background-clip: text;
			-webkit-text-fill-color: transparent;
			background-clip: text;
			animation: shimmer 4s linear infinite;
			filter: drop-shadow(0 0 18px rgba(255, 122, 217, 0.5));
		}
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

		&:hover {
			background: rgba(255, 122, 217, 0.05);
			border-color: rgba(255, 122, 217, 0.15);
			box-shadow: 0 0 16px rgba(255, 122, 217, 0.08);
		}

		h3 {
			display: flex;
			align-items: center;
			gap: 0.5rem;
			margin: 0 0 0.35rem;
			font-size: 1.05rem;
			font-weight: 700;
			color: #ff7ad9;
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
		background: linear-gradient(180deg, #ff7ad9, #a855f7);
		flex-shrink: 0;
		animation: accentPulse 3s ease-in-out infinite;
	}

	.wp-divider {
		width: 60%;
		height: 1px;
		margin: 0.25rem auto;
		background: linear-gradient(90deg, transparent, rgba(255, 122, 217, 0.3), rgba(255, 211, 77, 0.2), transparent);
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
