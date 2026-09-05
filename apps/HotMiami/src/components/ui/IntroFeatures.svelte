<script lang="ts">
	import { onMount } from 'svelte';
	import { fade } from 'svelte/transition';
	import { base } from '$app/paths';
	import { stateUrlDerived } from 'state-shared';
	import { stateLayout } from '../../game/stateLayout';
	import { stateApp } from '../../game/stateApp';
	import { zIndex } from 'constants-shared/zIndex';

	import config from '../../game/config';
	import { getSocialTerms } from '../../game/socialTerms';

	// The whole opening: studio mark, game logo, volatility, what the game does,
	// and the tap that starts it — one screen.
	//
	// It used to be three. The studio loader ran on black for 1.6s, then this
	// panel faded in over it, and the pixi loading screen ran underneath both.
	// Every competitive slot does it as a single held card, and so does the
	// reference this was rebuilt against.
	//
	// The look is deliberately borrowed from a GTA loading screen rather than from
	// a UI panel: a full-bleed illustrated scene, a cut-out character group with a
	// hard black outline standing in it, blocky angled panels, and heavy outlined
	// display type. All three of those images already exist in the game — the base
	// background, the store tile's foreground cut-out, and the wordmark — so no new
	// art is drawn for this screen.
	//
	// CORRECTION: this comment used to justify that by saying "Stake's quality
	// guidelines count generic screen-specific assets against a game". They do
	// not, and the claim has been copied out of here into another app since. What
	// certification actually flags is "heavy reliance on generic or AI art,
	// standard fonts, emoji icons or gradient fills" (review-log round 1,
	// restated in certification.md). The operative word is "generic" — how the art
	// LOOKS. Nothing in either document cares whether an asset serves one screen
	// or twenty, and a well-drawn bespoke splash would pass fine.
	//
	// Reuse is still the right default here, for ordinary reasons: it keeps the
	// opening in the same visual language as the board, costs nothing, and avoids
	// rolling the dice on another generated image that might come back reading as
	// stock AI render.
	//
	// Numbers come from the maths config on the same principle as the rules panel:
	// they cannot drift from what the game actually pays.

	type Props = { onclose?: () => void };
	const props: Props = $props();

	const T = getSocialTerms();
	const SYMBOLS = `${base}/assets/sprites/hotMiamiSymbols`;
	const BRAND = `${base}/assets/sprites/hotMiamiBrand`;
	const CAST_MESH = `${base}/assets/meshRigs`;
	const BG = `${base}/assets/sprites/hotMiamiBackground`;

	const maxWin = (config.betModes?.base?.max_win ?? 20000).toLocaleString();
	const lineCount = Object.keys(config.paylines).length;
	const buyCosts = [
		config.betModes?.bonus?.cost,
		config.betModes?.bonus_hits?.cost,
		config.betModes?.bonus_epic?.cost,
	];

	// Four of five. A judgement, not a computed figure: a 20,000x cap on a 96.50%
	// RTP with a 1-in-13.3m top hit is high but not the top of the scale. Change
	// it here if the maths moves.
	const VOLATILITY = 4;
	const VOLATILITY_MAX = 5;

	const panels: { icons: string[]; overlay?: string; title: string; body: string }[] = [
		{
			// The Frame is a hollow border — alone it reads as an empty box. Drawn
			// over a symbol because that is the only way it ever appears in play.
			icons: ['h1'],
			overlay: 'frame',
			title: 'NEON FRAMES',
			body: `Frames land carrying <strong>2&times; to 100&times;</strong>. A Frame multiplies any win whose ${T.payline} crosses it &mdash; and where several take part in one win, their values <strong>add together</strong>.`,
		},
		{
			icons: ['c'],
			title: 'THE COLLECTOR',
			body: `The Collector sweeps <strong>every Frame on the grid</strong>, won or not, and awards the total &times; your ${T.totalBet}. In free games the Frames are sticky &mdash; the longer they build, the bigger the sweep.`,
		},
		{
			// fs.png, not s.png: the registry's hmS points at fs.png and s.png was a
			// byte-identical duplicate that nothing referenced, so it was removed.
			icons: ['fs', 'fs', 'fs'],
			title: 'FREE SPINS',
			body: `3, 4 or 5 Scatters open <strong>Neon Nights</strong>, <strong>Sunset Hits</strong> or <strong>Ocean Drive</strong> &mdash; 10 spins each, more Frames at every tier. ${T.entryVerb} in for ${buyCosts[0]}&times;, ${buyCosts[1]}&times; or ${buyCosts[2]}&times;.`,
		},
	];

	let show = $state(true);

	// This card is the ONLY opening screen. The pixi loading screen still runs
	// underneath it — it is what actually loads the assets and reports progress —
	// but the player never sees it, because the tap is refused until loading has
	// finished. Letting the tap through early just swapped one opening screen for
	// another, which is the thing being removed.
	//
	// The escape hatch matters. `stateApp.loaded` is set by the asset loader, and
	// the asset loader lives inside <Authenticate>, which renders nothing until it
	// has a session. So a failed authenticate — a network blip, a dead RGS — would
	// otherwise leave the player holding an opening card that cannot be dismissed,
	// which is strictly worse than the screen this replaced.
	// After the timeout the tap is allowed through regardless; whatever is behind
	// it can then show its own error.
	const LOAD_TIMEOUT_MS = 12_000;
	let timedOut = $state(false);
	const ready = $derived(stateApp.loaded || timedOut);

	const dismiss = () => {
		show = false;
		props.onclose?.();
	};

	const close = () => {
		if (!show || !ready) return;
		// This tap hands the player straight to the board.
		//
		// `showLoadingScreen` is what Game.svelte gates the game body on, and it
		// used to be cleared by the pixi loading screen's own PRESS ANYWHERE TO
		// CONTINUE — i.e. a second full-screen page, behind this one, asking for a
		// second tap to do the job this tap already did. Clearing it here retires
		// that page. Both preconditions it existed for are met at this point:
		// `ready` means the assets have finished loading, and this click is the
		// user gesture the audio autoplay policy requires before <Sound /> mounts.
		//
		// The loading screen component is still rendered underneath and still owns
		// the progress bar; it is simply never seen, because this card covers it
		// and refuses the tap until loading is done. It remains the visible loader
		// on the replay path (see below) and if this card is ever removed.
		stateLayout.showLoadingScreen = false;
		dismiss();
	};

	// A short arming delay stops a stray click that was aimed at something else
	// from dismissing the card before it has finished appearing.
	let armed = $state(false);
	onMount(() => {
		// Replay gets out of the way immediately — and via `dismiss`, not `close`,
		// on purpose. `close` is refused until the assets are loaded, which at mount
		// they never are, so the replay branch was silently a no-op and the card sat
		// there until the 12s bail-out. `dismiss` also leaves `showLoadingScreen`
		// alone, so replay keeps the loading screen it has always had rather than
		// being handed an unloaded board.
		if (stateUrlDerived.replay()) {
			dismiss();
			return;
		}
		const id = setTimeout(() => (armed = true), 420);
		const bail = setTimeout(() => (timedOut = true), LOAD_TIMEOUT_MS);
		return () => {
			clearTimeout(id);
			clearTimeout(bail);
		};
	});
</script>

{#if show}
	<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
	<div
		class="hm-intro"
		class:armed
		style:z-index={zIndex.modal + 20}
		style:--bg={`url("${BG}/bg_base.png")`}
		onclick={() => armed && ready && close()}
		transition:fade={{ duration: 320 }}
	>
		<div class="hm-scrim"></div>

		<img
			class="hm-cast hm-cast-left"
			src={`${CAST_MESH}/cast_guy/guy_idle.webp`}
			alt=""
			aria-hidden="true"
		/>
		<img
			class="hm-cast hm-cast-right"
			src={`${CAST_MESH}/cast_girl/girl_idle.webp`}
			alt=""
			aria-hidden="true"
		/>

		<div class="hm-stage">
			<img class="hm-logo" src={`${BRAND}/logo.png`} alt="HOT MIAMI" />

			<div class="hm-vol">
				<span class="hm-vol-label">VOLATILITY</span>
				<span class="hm-bolts" aria-label={`Volatility ${VOLATILITY} of ${VOLATILITY_MAX}`}>
					{#each Array(VOLATILITY_MAX) as _, i (i)}
						<!--
							Drawn, not typed. This was `&#9889;` — U+26A1 HIGH VOLTAGE SIGN —
							five times, which every platform renders with its own colour emoji
							font: on macOS five glossy yellow Apple bolts sitting on a magenta
							and cyan neon card, ignoring every colour in this stylesheet.
							Stake's round-1 review named this exact class of thing ("emoji
							icons") and it was the first item on the opening screen.
							`filter: grayscale()` on the unlit ones was the tell that it had
							already gone wrong: you only reach for that when you cannot set
							the fill.
						-->
						<svg
							class="hm-bolt"
							class:lit={i < VOLATILITY}
							viewBox="0 0 24 40"
							aria-hidden="true"
						>
							<path d="M14.6 0 3 22.4h6.9L7.4 40 21 16.2h-7.4L14.6 0Z" />
						</svg>
					{/each}
				</span>
			</div>

			<div class="hm-panels">
				{#each panels as panel, i (panel.title)}
					<section class="hm-panel" style:--delay={`${i * 100}ms`}>
						<div class="hm-panel-icons" class:multi={panel.icons.length > 1}>
							{#each panel.icons as icon, k (k)}
								<img src={`${SYMBOLS}/${icon}.png`} alt="" aria-hidden="true" />
							{/each}
							{#if panel.overlay}
								<img
									class="hm-panel-overlay"
									src={`${SYMBOLS}/${panel.overlay}.png`}
									alt=""
									aria-hidden="true"
								/>
							{/if}
						</div>
						<h2>{panel.title}</h2>
						<p>{@html panel.body}</p>
					</section>
				{/each}
			</div>

			<!--
				No RTP here. It is a number that can move with a maths pass, and this
				card is the one surface a player reads before the first spin — a stale
				figure there is worse than no figure. The rules panel carries RTP per
				mode, read live from the maths config, which is where it belongs.
			-->
			<p class="hm-stats">
				{lineCount} {T.paylinesUpper} &nbsp;/&nbsp; MAX WIN {maxWin}&times;
			</p>
			<p class="hm-cta" class:waiting={!ready}>
				{ready ? 'TAP TO CONTINUE' : 'LOADING…'}
			</p>
		</div>

		<!--
			The studio mark. It stays while the platform splash goes: Stake's
			certification notes treat those as two different things and ask for
			exactly this outcome.
		-->
		<div class="hm-studio">
			<svg class="hm-studio-star" viewBox="0 0 100 100" role="img" aria-label="Silverstars 777">
				<polygon
					points="50,7 61,38 94,38 67,57 77,89 50,70 23,89 33,57 6,38 39,38"
					fill="none"
					stroke="currentColor"
					stroke-width="6"
					stroke-linejoin="round"
				/>
				<text x="50" y="57" text-anchor="middle" dominant-baseline="middle">777</text>
			</svg>
			<span>SILVERSTARS STUDIO</span>
		</div>
	</div>
{/if}

<style lang="scss">
	@keyframes riseIn {
		from {
			opacity: 0;
			transform: translateY(26px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	/* the two walk in from their own side, which is the point of splitting them */
	@keyframes castInLeft {
		from {
			opacity: 0;
			transform: translateX(-46px) scale(1.03);
		}
		to {
			opacity: 1;
			transform: translateX(0) scale(1);
		}
	}

	@keyframes castInRight {
		from {
			opacity: 0;
			transform: translateX(46px) scale(1.03);
		}
		to {
			opacity: 1;
			transform: translateX(0) scale(1);
		}
	}

	/*
		The two of them keep breathing after they have walked in.
		─────────────────────────────────────────────────────────
		Same method as game/idleSway.ts, which does the rigged version on the two
		character SYMBOLS: lifted from Hacksaw's Miami Mayhem background cast (five
		spine skeletons, measured). Four rules, and the two that survive being
		applied to a flat cut-out are the two that matter most:

		  · the loops must not match. His is 8s, hers 5s — they return to the same
		    relative pose once every 40 seconds, so the pair never reads as one
		    animation. This is the cheapest of the four and does the most.
		  · the body barely moves. Their bodies rotate 1-3.3deg while hair reaches
		    27.5. These are single PNGs with no hair layer, so ALL that is available
		    here is the body — which means staying at the bottom of that range is
		    not a compromise, it is the only honest option. 1.1 and 1.4 degrees.
		  · translate AND stretch on the breath. Their persp bone does both on one
		    period; translation alone reads as the whole figure floating.
		  · one irregular hiccup per loop. The uneven stops in the middle of each
		    set below are it — a regular cycle is recognised as a cycle after about
		    two passes, and 8s means a player sees two passes while reading the card.

		transform-origin is the floor, because that is where they are standing.
	*/
	@keyframes castSwayLeft {
		0% {
			transform: rotate(0deg) translateY(0) scaleY(1);
		}
		22% {
			transform: rotate(0.2deg) scaleY(1.0015);
		}
		/* the hiccup: four uneven stops, none of them on the beat */
		47% {
			transform: rotate(0.05deg) scaleY(1.001);
		}
		52% {
			transform: rotate(-0.11deg) scaleY(1.0007);
		}
		58% {
			transform: rotate(0.03deg) scaleY(1.001);
		}
		71% {
			transform: rotate(-0.2deg) scaleY(1.0015);
		}
		100% {
			transform: rotate(0deg) translateY(0) scaleY(1);
		}
	}

	@keyframes castSwayRight {
		0% {
			transform: rotate(0deg) translateY(0) scaleY(1);
		}
		26% {
			transform: rotate(-0.22deg) scaleY(1.0015);
		}
		49% {
			transform: rotate(-0.06deg) scaleY(1.0012);
		}
		55% {
			transform: rotate(0.12deg) scaleY(1.0007);
		}
		61% {
			transform: rotate(-0.04deg) scaleY(1.001);
		}
		74% {
			transform: rotate(0.22deg) scaleY(1.0015);
		}
		100% {
			transform: rotate(0deg) translateY(0) scaleY(1);
		}
	}

	@keyframes ctaPulse {
		0%,
		100% {
			opacity: 0.5;
		}
		50% {
			opacity: 1;
		}
	}

	.hm-intro {
		position: fixed;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: clamp(0.8rem, 2.5vh, 2rem) clamp(1rem, 3vw, 3rem);
		box-sizing: border-box;
		cursor: pointer;
		overflow: hidden;
		color: #fff;
		font-family: var(--gb-body-font, sans-serif);
		background: var(--bg) center / cover no-repeat, #12042a;
		opacity: 0;
		transition: opacity 0.35s ease;
	}

	.hm-intro.armed {
		opacity: 1;
	}

	/* The background is a playfield backdrop, built to sit behind reels — it is
	   too busy to read text over as-is. Darkened from the centre out rather than
	   flatly, so the edges keep the scene and the middle carries the type. */
	.hm-scrim {
		position: absolute;
		inset: 0;
		background:
			radial-gradient(ellipse at 42% 52%, rgba(10, 3, 20, 0.9) 0%, rgba(10, 3, 20, 0.55) 45%, rgba(10, 3, 20, 0.82) 100%),
			linear-gradient(180deg, rgba(10, 3, 20, 0.75) 0%, rgba(10, 3, 20, 0.2) 30%, rgba(10, 3, 20, 0.9) 100%);
	}

	/* Hard black keyline via stacked drop-shadows rather than a border — the
	   subject is a cut-out PNG, so this is the only way to outline its silhouette.
	   Four offsets is enough to close the outline at this size. */
	.hm-cast {
		position: absolute;
		bottom: 0;
		/* One expression for the rendered size, because the horizontal offsets below
		   are fractions of it. The PNG is square, so height and width are the same
		   number and the figures' positions inside it can be given as percentages
		   of either. */
		--cast-h: min(94vh, 52rem);
		height: var(--cast-h);
		width: auto;
		object-fit: contain;
		pointer-events: none;
		/* Hard black keyline via stacked drop-shadows rather than a border — the
		   subject is a cut-out PNG, so this is the only way to outline its
		   silhouette. Four offsets is enough to close it at this size. */
		filter:
			drop-shadow(3px 0 0 #12041f) drop-shadow(-3px 0 0 #12041f) drop-shadow(0 3px 0 #12041f)
			drop-shadow(0 -3px 0 #12041f) drop-shadow(0 12px 26px rgba(0, 0, 0, 0.7));
	}

	/* Each copy keeps one figure. The clip is applied before the drop-shadow
	   filter in the same element, so the cut edge gets outlined along with the
	   rest — which is what stops it reading as a slice. */
	/*
		Clipping alone leaves each figure stranded in the middle of its own copy:
		measured off the alpha channel, the man occupies 26.6%-51.5% of the square
		and the woman 51.5%-73.2%, so anchoring the image to an edge anchors the
		empty part of it. Each copy is pulled outward by the width of its own dead
		margin, less a little, so the pair stands just inside the frame rather than
		flush against it.
	*/
	.hm-cast-left {
		/* His alpha occupies y=85..889 of a 1024px canvas, whereas hers fills her
		   canvas. Compensate for that transparent padding so the VISIBLE figures,
		   not their PNG rectangles, share the same 94vh height and floor line. */
		left: calc(5vw - 15.3vh);
		bottom: -15.8vh;
		height: 120vh;
		/*
			Stepped, not a straight cut. The narrowest column between the two figures
			is x=527 (51.46%), but that is only true above the ankles: in the band
			y840-930 the alpha resolves into four separate feet at x 309-374, 431-536,
			588-664 and 675-728 — his right shoe reaches 536, and hers does not start
			until 588. A single vertical line at 51.46% therefore left an 8px chip of
			his shoe stranded beside her foot, which is exactly what it looked like.
			The step drops to 54.5% (x=558) below 82% height, i.e. between the two.
		*/
		transform-origin: 50% 100%;
		animation: castInLeft 0.6s cubic-bezier(0.22, 1, 0.36, 1) both 0.1s;
	}

	.hm-cast-right {
		right: 5vw;
		transform-origin: 50% 100%;
		animation: castInRight 0.6s cubic-bezier(0.22, 1, 0.36, 1) both 0.16s;
	}

	/* Below this the pair would sit on top of the panels rather than beside them */
	@media (max-width: 62rem) {
		.hm-cast {
			display: none;
		}
	}

	/* A continuous loop is exactly the kind of motion this setting is for. They
	   still walk in — that is a one-shot transition, not ambient motion. */
	@media (prefers-reduced-motion: reduce) {
		.hm-cast-left {
			animation: castInLeft 0.6s cubic-bezier(0.22, 1, 0.36, 1) both 0.1s;
		}

		.hm-cast-right {
			animation: castInRight 0.6s cubic-bezier(0.22, 1, 0.36, 1) both 0.16s;
		}
	}

	.hm-stage {
		position: relative;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: clamp(0.5rem, 1.4vh, 1rem);
		width: min(58rem, 100%);
		/* centred now that a figure stands on each side */
		margin: 0 auto;
	}

	@media (max-width: 62rem) {
		.hm-stage {
			width: min(32rem, 100%);
		}
	}

	.hm-logo {
		width: clamp(12rem, 26vw, 22rem);
		height: auto;
		filter: drop-shadow(0 6px 18px rgba(0, 0, 0, 0.8));
		animation: riseIn 0.5s cubic-bezier(0.22, 1, 0.36, 1) both;
	}

	.hm-vol {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		animation: riseIn 0.5s cubic-bezier(0.22, 1, 0.36, 1) both 0.06s;
	}

	.hm-vol-label {
		font-family: var(--gb-display-font, sans-serif);
		font-size: clamp(0.68rem, 1.4vw, 0.92rem);
		letter-spacing: 0.2em;
		color: #ffd7ee;
	}

	.hm-bolts {
		display: inline-flex;
		align-items: center;
		gap: 0.22rem;
		line-height: 1;
	}

	/* Unlit bolts stay in place so the scale reads as "4 of 5" rather than
	   "some bolts" — but now they are drawn as a hollow bolt in the card's own
	   ink rather than a greyed-out emoji, which is the same distinction the
	   Neon Frames make between a plain frame and a lit one. */
	.hm-bolt {
		height: clamp(0.95rem, 2vw, 1.3rem);
		width: auto;
		display: block;
		overflow: visible;
	}

	.hm-bolt path {
		fill: rgba(255, 215, 238, 0.09);
		stroke: rgba(255, 143, 208, 0.5);
		stroke-width: 1.6;
		stroke-linejoin: round;
	}

	.hm-bolt.lit path {
		/* the same magenta-to-gold the wordmark and the frame tiers already use,
		   so the meter belongs to this game rather than to the OS */
		fill: #ffd75e;
		stroke: #ff2e88;
		stroke-width: 2.2;
		filter: drop-shadow(0 0 6px rgba(255, 143, 208, 0.9))
			drop-shadow(0 0 2px rgba(255, 215, 94, 0.9));
	}

	.hm-panels {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: clamp(0.5rem, 1.2vw, 0.9rem);
		width: 100%;
	}

	/* Below the width where three columns can hold readable body text, stack.
	   The panels are the content, so reflowing beats shrinking. */
	@media (max-width: 46rem) {
		.hm-panels {
			grid-template-columns: 1fr;
		}
	}

	/* Angled corners and a hard keyline instead of a soft neon pill: the card is
	   meant to read as printed signage in the scene, not as an app dialog. */
	/*
		Built to match the character art rather than the UI: the cast is drawn with a
		thick black keyline, flat saturated fill and a hard shadow, so the panels use
		the same three things. A 3px near-black border is the keyline, an inset ring
		supplies the coloured inner line the art uses inside its outlines, and the
		shadow is a hard offset block with no blur — a blurred shadow is a UI idiom
		and reads as a different world from the illustration standing next to it.

		The clip-path corner is kept but cut deeper, because a chamfer that size is
		itself a poster device.
	*/
	.hm-panel {
		position: relative;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.35rem;
		padding: clamp(0.7rem, 1.6vh, 1.1rem) clamp(0.6rem, 1.4vw, 1rem);
		box-sizing: border-box;
		background:
			linear-gradient(180deg, rgba(58, 16, 96, 0.96) 0%, rgba(24, 6, 44, 0.97) 62%, rgba(40, 10, 70, 0.97) 100%);
		border: 3px solid #12041f;
		clip-path: polygon(18px 0, 100% 0, 100% calc(100% - 18px), calc(100% - 18px) 100%, 0 100%, 0 18px);
		box-shadow:
			inset 0 0 0 2px #ff8fd0,
			inset 0 22px 34px -22px rgba(255, 143, 208, 0.5),
			7px 7px 0 rgba(10, 2, 20, 0.75);
		text-align: center;
		animation: riseIn 0.5s cubic-bezier(0.22, 1, 0.36, 1) both;
		animation-delay: var(--delay);
	}

	/* A flat colour band behind the icon, the way a poster blocks in its subject.
	   Sits under everything else and stops the icon floating on the gradient. */
	.hm-panel::before {
		content: '';
		position: absolute;
		inset: 3px 3px auto 3px;
		height: clamp(3.4rem, 8vh, 5rem);
		background: linear-gradient(180deg, rgba(255, 46, 136, 0.34) 0%, rgba(255, 46, 136, 0) 100%);
		pointer-events: none;
	}

	/* Diagonal cyan flash in the top corner — the same accent the dress and the
	   shirt use, and it keeps the three panels from reading as plain boxes. */
	.hm-panel::after {
		content: '';
		position: absolute;
		top: -1px;
		right: -1px;
		width: 46px;
		height: 46px;
		background: linear-gradient(225deg, #4de8e0 0%, #4de8e0 46%, transparent 47%);
		pointer-events: none;
	}

	.hm-panel-icons {
		position: relative;
		z-index: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: clamp(2.6rem, 6vh, 3.9rem);
	}

	.hm-panel-icons img {
		width: clamp(2.6rem, 6vh, 3.9rem);
		height: clamp(2.6rem, 6vh, 3.9rem);
		object-fit: contain;
		filter: drop-shadow(0 3px 9px rgba(0, 0, 0, 0.6));
	}

	/* the Frame sits on the symbol, as it does on the grid */
	.hm-panel-overlay {
		position: absolute;
		inset: 0;
		margin: auto;
		filter: drop-shadow(0 0 10px rgba(255, 209, 102, 0.6));
	}

	/* the three Scatters overlap, the way they read when they land together */
	.hm-panel-icons.multi img:not(:first-child) {
		margin-left: -0.95rem;
	}

	.hm-panel h2 {
		position: relative;
		z-index: 1;
		margin: 0;
		font-family: var(--gb-display-font, sans-serif);
		font-size: clamp(0.82rem, 1.7vw, 1.08rem);
		font-weight: 800;
		letter-spacing: 0.05em;
		color: #ffd75e;
		/* heavy keyline on the type, the way signage in this idiom is drawn */
		text-shadow:
			2px 0 0 #12041f,
			-2px 0 0 #12041f,
			0 2px 0 #12041f,
			0 -2px 0 #12041f,
			0 0 16px rgba(255, 215, 94, 0.5);
	}

	.hm-panel p {
		margin: 0;
		font-size: clamp(0.66rem, 1.15vw, 0.79rem);
		line-height: 1.45;
		opacity: 0.92;
	}

	.hm-panel :global(strong) {
		color: #4de8e0;
		font-weight: 700;
	}

	.hm-stats {
		margin: 0;
		font-family: var(--gb-display-font, sans-serif);
		font-size: clamp(0.68rem, 1.4vw, 0.9rem);
		letter-spacing: 0.12em;
		color: #ff8fd0;
		animation: riseIn 0.5s cubic-bezier(0.22, 1, 0.36, 1) both 0.32s;
	}

	/* While loading it is a status line, not an invitation — the pulse would read
	   as "press me" on something that will not respond. */
	.hm-cta.waiting {
		animation: none;
		opacity: 0.6;
		letter-spacing: 0.14em;
	}

	.hm-cta {
		margin: 0;
		font-family: var(--gb-display-font, sans-serif);
		font-size: clamp(0.78rem, 1.6vw, 1rem);
		letter-spacing: 0.22em;
		text-shadow:
			2px 0 0 #12041f,
			-2px 0 0 #12041f,
			0 2px 0 #12041f,
			0 -2px 0 #12041f;
		animation: ctaPulse 1.7s ease-in-out infinite;
	}

	.hm-studio {
		position: absolute;
		left: clamp(0.8rem, 2vw, 1.6rem);
		bottom: clamp(0.7rem, 2vh, 1.3rem);
		display: flex;
		align-items: center;
		gap: 0.45rem;
		color: rgba(255, 255, 255, 0.72);
		/*
			The studio mark used to be set in Arial, here and inside the star. It was
			inherited from the old HotMiamiLoader, where it was one beat on a screen
			nobody looks at; on this card it is the only piece of studio branding a
			reviewer sees, and it was rendering in the operating system's default
			sans. A wordmark in Arial reads as a placeholder, which is the opposite of
			what a studio mark is for.
			Orbitron via --hm-title-font: self-hosted, already loaded for the game's
			display type, and squared-off enough to sit beside the star.
		*/
		font-family: var(--hm-title-font, var(--gb-display-font, sans-serif));
		font-size: clamp(0.55rem, 1vw, 0.7rem);
		font-weight: 600;
		letter-spacing: 0.14em;
	}

	.hm-studio-star {
		width: clamp(1.1rem, 2.2vw, 1.5rem);
		height: clamp(1.1rem, 2.2vw, 1.5rem);
		flex-shrink: 0;
	}

	.hm-studio-star text {
		fill: currentColor;
		font-family: var(--hm-title-font, var(--gb-display-font, sans-serif));
		/* Orbitron's figures are narrower than Arial's, so 777 no longer fills the
		   star's counter at 26px — 30px restores the optical size it was drawn at. */
		font-size: 30px;
		font-weight: 700;
	}
</style>
