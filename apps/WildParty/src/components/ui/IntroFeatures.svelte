<script lang="ts">
	import { onMount } from 'svelte';
	import { fade } from 'svelte/transition';
	import { base } from '$app/paths';
	import { zIndex } from 'constants-shared/zIndex';

	import { stateUrlDerived } from 'state-shared';
	import { stateApp } from '../../game/stateApp';
	import { stateLayout } from '../../game/stateLayout';
	import config from '../../game/config';
	import { getSocialTerms } from '../../game/socialTerms';

	// The opening card: studio mark, wordmark, volatility, three feature panels,
	// and the tap that starts the game — one screen.
	//
	// The backdrop is a key visual drawn for this screen: the same club, staged
	// wide, with the lower centre deliberately left as an empty dark pool because
	// that is where the wordmark and the three panels sit. design/install_loading_
	// screen.py fits it to 16:9.
	//
	// Everything else is reused — the three panel icons are the actual Wild,
	// Scatter and top-pay symbols off the reels, so the features are illustrated
	// by the things the player is about to see rather than by invented iconography.
	//
	// On the "should this be bespoke at all" question: certification flags "heavy
	// reliance on generic or AI art, standard fonts, emoji icons or gradient
	// fills". The operative word is "generic" — how the art LOOKS. Nothing in
	// either reference document cares whether an asset serves one screen or
	// twenty. (An earlier version of this comment, copied from the sibling Hot
	// Miami, claimed Stake penalises "screen-specific" assets. It does not, and
	// that claim has now been corrected in both places.)
	//
	// The wordmark is set in Orbitron with the palette's liquid-chrome gradient
	// rather than loaded as an image, because Wild Party has no transparent logo
	// asset — the store tile has the lettering baked in. Swap in an <img> here if
	// tile_foreground.png ever gets generated.
	//
	// Every number comes from the maths config on the same principle as the rules
	// panel: it cannot drift from what the game actually pays.

	type Props = { onclose?: () => void };
	const props: Props = $props();

	const T = getSocialTerms();
	const SYMBOLS = `${base}/assets/sprites/wildPartySymbols`;
	const BG = `${base}/assets/sprites/wildPartyBackground`;
	const BRAND = `${base}/assets/sprites/wildPartyBrand`;

	const maxWin = (config.betModes?.base?.max_win ?? 5000).toLocaleString();
	const lineCount = Object.keys(config.paylines).length;
	const buyQuick = config.betModes?.bonus_quick?.cost;
	const buyBonus = config.betModes?.bonus?.cost;
	const buySuper = config.betModes?.bonus_super?.cost;

	// Four of five. A judgement, not a computed figure: a 5,000x cap on 96% RTP
	// with an accumulating multiplier that never resets inside the feature is
	// high, but the base game itself is not especially swingy. Change it here if
	// the maths moves.
	const VOLATILITY = 4;
	const VOLATILITY_MAX = 5;

	const panels: { icons: string[]; title: string; body: string }[] = [
		{
			icons: ['w'],
			title: 'GLOBAL MULTIPLIER',
			body: `The feature runs on one multiplier that applies to <strong>every line win</strong>. It opens at <strong>1&times;&ndash;3&times;</strong>, climbs <strong>+1 for every Wild</strong> that lands, and <strong>never resets</strong> until the round ends.`,
		},
		{
			icons: ['s', 's', 's'],
			title: 'FREE SPINS',
			body: `Three Scatters on reels 3, 4 and 5 award <strong>5 Free Spins</strong>. Land three more inside the feature and it <strong>retriggers for +5</strong>, with the multiplier carrying straight on.`,
		},
		{
			icons: ['h1'],
			title: T.buyBonusName.toUpperCase(),
			body: `Skip the wait at three tiers &mdash; <strong>${buyQuick}&times;</strong>, <strong>${buyBonus}&times;</strong> or <strong>${buySuper}&times;</strong>. Every tier plays at the same ${(config.rtp * 100).toFixed(2)}% RTP; the higher ones simply start hotter.`,
		},
	];

	let show = $state(true);

	// This card is the ONLY opening screen. The pixi loading screen still runs
	// underneath — it is what actually loads the assets and owns the progress bar —
	// but the player never sees it, because the tap is refused until loading has
	// finished.
	//
	// The escape hatch matters. `stateApp.loaded` is set by the asset loader, which
	// lives inside <Authenticate> and renders nothing without a session. A failed
	// authenticate would otherwise leave the player holding a card that cannot be
	// dismissed — strictly worse than no card. After the timeout the tap goes
	// through regardless and whatever is behind it can show its own error.
	const LOAD_TIMEOUT_MS = 12_000;
	let timedOut = $state(false);
	const ready = $derived(stateApp.loaded || timedOut);

	// Ignore the click that is still travelling from whatever opened this screen.
	let armed = $state(false);

	// Fit the card to the window by measuring it and scaling, rather than by
	// hoping the CSS adds up.
	//
	// `max-height: 100vh` on a flex column does not make its children shrink —
	// three paragraphs of panel copy have a natural height and simply overflow,
	// which is what clipped the bottom of the card. And in the Stake Engine
	// desktop tester the toolbar is drawn OVER the page, so even a card that fits
	// 100vh exactly loses its last ~50px behind it.
	//
	// So: measure the stage's natural height, compare against the window minus a
	// reserve for host chrome, and scale down when it does not fit. Never scales
	// up — at comfortable sizes this does nothing at all.
	const BOTTOM_RESERVE_VH = 0.07;
	let stageEl = $state<HTMLElement | null>(null);
	let fitScale = $state(1);

	const fit = () => {
		if (!stageEl) return;
		const natural = stageEl.scrollHeight;
		if (!natural) return;
		const available = window.innerHeight * (1 - BOTTOM_RESERVE_VH);
		fitScale = Math.min(1, available / natural);
	};

	onMount(() => {
		const armId = setTimeout(() => (armed = true), 400);
		const outId = setTimeout(() => (timedOut = true), LOAD_TIMEOUT_MS);
		fit();
		// the wordmark is an image; its load changes the natural height
		const ro = new ResizeObserver(fit);
		if (stageEl) ro.observe(stageEl);
		window.addEventListener('resize', fit);
		return () => {
			clearTimeout(armId);
			clearTimeout(outId);
			ro.disconnect();
			window.removeEventListener('resize', fit);
		};
	});

	const close = () => {
		if (!show || !ready) return;
		// This tap hands the player straight to the board. `showLoadingScreen` is
		// what Game.svelte gates the game body on; clearing it here retires the
		// pixi loader's own PRESS ANYWHERE TO CONTINUE, which would otherwise be a
		// second full-screen page asking for a second tap to do this same job.
		// Both of its preconditions hold at this point: `ready` means assets have
		// loaded, and this click is the user gesture the audio autoplay policy
		// requires before <Sound /> mounts.
		stateLayout.showLoadingScreen = false;
		show = false;
		props.onclose?.();
	};

	// Replay opens straight into the round.
	//
	// A replay is not a new session — the player followed a link to watch one
	// specific past round — so a card asking them to tap before it starts is in
	// the way, and it delays the round a reviewer is trying to check. The card is
	// still mounted rather than skipped: it holds the pixi loading screen's gate
	// shut, and removing it just exposes that older screen instead.
	$effect(() => {
		if (!stateUrlDerived.replay()) return;
		if (show && ready) close();
	});
</script>

{#if show}
	<div
		class="wp-intro"
		style:z-index={zIndex.modal + 20}
		style:--bg={`url("${BG}/loading_screen.png")`}
		onclick={() => armed && ready && close()}
		onkeydown={(e) => (e.key === 'Enter' || e.key === ' ') && armed && ready && close()}
		role="button"
		tabindex="0"
		transition:fade={{ duration: 320 }}
	>
		<div class="wp-scrim"></div>

		<div class="wp-stage" bind:this={stageEl} style:--fit={fitScale}>
			<!--
				The studio mark, carried over from WildPartyLoader rather than
				reinvented — certification requires the platform splash to go while
				the studio's own logo stays, so this is the part that must survive.
				It is the loader's vector star, not static/silverstar.png: that file
				is an opaque photographic casino banner in gold and gems, a different
				art language entirely, and with no alpha it would drop a rectangle
				onto the scene.
			-->
			<div class="wp-studio">
				<svg class="wp-star" viewBox="0 0 100 100" role="img" aria-label="Silverstars Studio">
					<polygon
						points="50,7 61,38 94,38 67,57 77,89 50,70 23,89 33,57 6,38 39,38"
						fill="none"
						stroke="#d8e6ff"
						stroke-width="6"
						stroke-linejoin="round"
					/>
					<text x="50" y="57" text-anchor="middle" dominant-baseline="middle">777</text>
				</svg>
				<span>SILVERSTARS STUDIO</span>
			</div>

			<!--
				The real wordmark, not CSS-gradient text. The generator painted a
				transparency checkerboard into the pixels instead of shipping an alpha
				channel; design/install_logo.py keys it off structurally by flooding in
				from the border and refusing to cross the lockup's closed dark keyline.
			-->
			<img class="wp-logo" src={`${BRAND}/logo.png`} alt="WILD PARTY" />

			<p class="wp-tag">
				5&times;3 &middot; {lineCount}
				{T.paylines.toUpperCase()} &middot; MAX WIN {maxWin}&times;
			</p>

			<div class="wp-vol">
				<span class="wp-vol-label">VOLATILITY</span>
				<span class="wp-bolts" aria-label={`Volatility ${VOLATILITY} of ${VOLATILITY_MAX}`}>
					{#each Array(VOLATILITY_MAX) as _, i (i)}
						<span class="wp-bolt" class:lit={i < VOLATILITY}></span>
					{/each}
				</span>
			</div>

			<div class="wp-panels">
				{#each panels as panel, i (panel.title)}
					<section class="wp-panel" style:--delay={`${i * 110}ms`}>
						<div class="wp-panel-icons" class:multi={panel.icons.length > 1}>
							{#each panel.icons as icon, k (k)}
								<img src={`${SYMBOLS}/${icon}.png`} alt="" aria-hidden="true" />
							{/each}
						</div>
						<h2>{panel.title}</h2>
						<p>{@html panel.body}</p>
					</section>
				{/each}
			</div>

			<p class="wp-cta" class:waiting={!ready}>
				{ready ? 'TAP ANYWHERE TO START' : 'LOADING…'}
			</p>
		</div>
	</div>
{/if}

<style>
	.wp-intro {
		position: fixed;
		inset: 0;
		display: grid;
		place-items: center;
		background-image: var(--bg);
		background-size: cover;
		background-position: center;
		cursor: pointer;
		overflow: hidden;
		font-family: 'Orbitron', 'Trebuchet MS', Arial, sans-serif;
	}

	/* The background art is built to be quiet in the middle so the reels read
	   against it. That is exactly where this card puts its type, so the scrim
	   only has to deepen it rather than hide it. */
	.wp-scrim {
		position: absolute;
		inset: 0;
		background:
			radial-gradient(ellipse at 50% 45%, rgba(10, 4, 16, 0.34) 0%, rgba(10, 4, 16, 0.72) 72%),
			linear-gradient(180deg, rgba(10, 4, 16, 0.1) 0%, rgba(10, 4, 16, 0.55) 100%);
	}

	/*
		The vertical budget is the whole layout problem here. Sizing the stage by
		width alone let the card overflow a short, wide window and clip the panel
		copy off the bottom edge — the browser gives a maximised desktop window
		around 900px of height once its own chrome is taken out, and the logo plus
		three paragraphs does not fit in that on width rules alone.

		So every band is measured in vh and they are budgeted to sum under 100:
		studio 3 + logo 22 + tag 3 + volatility 4 + panels 34 + CTA 4, plus gaps
		and padding. `min-height: 0` lets the panel row actually shrink rather than
		pushing past the bottom, which is the flexbox default it would otherwise
		hit.
	*/
	.wp-stage {
		position: relative;
		width: min(92vw, 1100px);
		max-height: 100vh;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: clamp(0.35rem, 1.1vh, 0.9rem);
		padding: 2.5vh 0;
		box-sizing: border-box;
		transform: scale(var(--fit, 1));
		transform-origin: center center;
	}

	.wp-studio {
		display: flex;
		align-items: center;
		gap: 0.55rem;
		font-size: clamp(0.6rem, 1.4vw, 0.85rem);
		letter-spacing: 0.42em;
		color: #c9b6ff;
		opacity: 0.8;
	}
	.wp-star {
		width: clamp(26px, 3vw, 40px);
		height: clamp(26px, 3vw, 40px);
		filter: drop-shadow(0 0 8px rgba(216, 230, 255, 0.45));
	}
	.wp-star text {
		fill: #d8e6ff;
		font-size: 26px;
		font-weight: 900;
		letter-spacing: 0;
		font-family: 'Orbitron', 'Trebuchet MS', Arial, sans-serif;
	}

	/* Liquid chrome, the same stop order every chrome surface in the game uses —
	   white, cool white, grey-blue, the dark horizon band, then the reflected
	   violet and magenta. The dark band is what stops it reading as flat silver. */
	/* Height-first, not width-first: the wordmark art is 870x646, tall enough
	   that a width rule alone hands it far more of the screen than it should get
	   on a short window. */
	.wp-logo {
		height: clamp(84px, 22vh, 210px);
		width: auto;
		max-width: 78%;
		object-fit: contain;
		display: block;
		filter: drop-shadow(0 0 18px rgba(255, 45, 149, 0.45));
	}

	.wp-tag {
		margin: 0;
		font-size: clamp(0.65rem, 1.5vw, 0.95rem);
		letter-spacing: 0.22em;
		color: #ffffff;
		opacity: 0.86;
	}

	.wp-vol {
		display: flex;
		align-items: center;
		gap: 0.7rem;
		margin-top: 0.2rem;
	}
	.wp-vol-label {
		font-size: clamp(0.55rem, 1.2vw, 0.75rem);
		letter-spacing: 0.3em;
		color: #c9b6ff;
	}
	.wp-bolts {
		display: flex;
		gap: 0.32rem;
	}
	.wp-bolt {
		width: clamp(14px, 1.7vw, 20px);
		height: clamp(6px, 0.7vw, 8px);
		border-radius: 999px;
		background: #31145a;
		box-shadow: inset 0 0 0 1px #0a0410;
	}
	.wp-bolt.lit {
		background: #ff2d95;
		box-shadow:
			inset 0 0 0 1px #0a0410,
			0 0 10px rgba(255, 45, 149, 0.8);
	}

	.wp-panels {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: clamp(0.5rem, 1.4vw, 1.1rem);
		width: 100%;
		min-height: 0;
		margin-top: clamp(0.3rem, 1vh, 0.8rem);
	}

	.wp-panel {
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		padding: clamp(0.7rem, 1.6vh, 1.2rem) clamp(0.5rem, 1vw, 0.9rem);
		border-radius: 14px;
		background: rgba(30, 11, 54, 0.82);
		box-shadow:
			inset 0 0 0 1px rgba(216, 230, 255, 0.32),
			0 6px 22px rgba(10, 4, 16, 0.55);
		animation: wp-rise 420ms both;
		animation-delay: var(--delay);
	}

	@keyframes wp-rise {
		from {
			opacity: 0;
			transform: translateY(14px);
		}
		to {
			opacity: 1;
			transform: none;
		}
	}

	.wp-panel-icons {
		display: flex;
		justify-content: center;
		align-items: center;
		height: clamp(34px, 6.5vh, 72px);
		margin-bottom: 0.5rem;
	}
	.wp-panel-icons img {
		height: 100%;
		width: auto;
		filter: drop-shadow(0 3px 8px rgba(10, 4, 16, 0.7));
	}
	/* Three Scatters overlap into a fan so the row reads as "three of these",
	   not as three separate ideas. */
	.wp-panel-icons.multi img {
		height: 78%;
		margin-inline: -8%;
	}
	.wp-panel-icons.multi img:nth-child(2) {
		height: 100%;
		z-index: 1;
	}

	.wp-panel h2 {
		margin: 0 0 0.35rem;
		font-size: clamp(0.72rem, 1.5vw, 1rem);
		letter-spacing: 0.12em;
		color: #b6ff3d;
		text-shadow: 0 0 10px rgba(182, 255, 61, 0.45);
	}

	.wp-panel p {
		margin: 0;
		font-family: 'Trebuchet MS', 'Segoe UI', Tahoma, Arial, sans-serif;
		font-size: clamp(0.62rem, 1.2vw, 0.84rem);
		line-height: 1.4;
		color: rgba(255, 255, 255, 0.9);
	}
	.wp-panel :global(strong) {
		color: #ffffff;
		font-weight: 700;
	}

	.wp-cta {
		margin: clamp(0.6rem, 1.8vh, 1.2rem) 0 0;
		font-size: clamp(0.7rem, 1.5vw, 0.95rem);
		letter-spacing: 0.28em;
		color: #ffffff;
		animation: wp-pulse 1.7s ease-in-out infinite;
	}
	.wp-cta.waiting {
		color: #c9b6ff;
		animation: none;
		opacity: 0.7;
	}

	@keyframes wp-pulse {
		0%,
		100% {
			opacity: 0.55;
		}
		50% {
			opacity: 1;
		}
	}

	/* Portrait: three columns become one, and the panels lose their artwork —
	   at this width the icons would crowd the copy they are labelling. */
	@media (max-aspect-ratio: 3/4) {
		.wp-panels {
			grid-template-columns: 1fr;
			gap: 0.5rem;
		}
		.wp-panel {
			flex-direction: row;
			align-items: center;
			text-align: left;
			gap: 0.7rem;
			padding: 0.6rem 0.8rem;
		}
		.wp-panel-icons {
			height: clamp(38px, 7vh, 56px);
			margin-bottom: 0;
			flex: 0 0 auto;
		}
	}
</style>
