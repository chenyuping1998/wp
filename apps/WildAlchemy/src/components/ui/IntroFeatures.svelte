<script lang="ts">
	import { onMount } from 'svelte';
	import { fade } from 'svelte/transition';
	import { stateUrlDerived } from 'state-shared';
	import { stateLayout } from '../../game/stateLayout';
	import { stateApp } from '../../game/stateApp';
	import { zIndex } from 'constants-shared/zIndex';

	import config from '../../game/config';
	import assets from '../../game/assets';
	import sceneLayout from '../../game/sceneLayout.json';
	import { FEATURE_RULES, MAX_BLOCK } from '../../game/featureRules';
	import { getSocialTerms } from '../../game/socialTerms';
	import { gameText } from '../../game/i18nText';
	import { gameRulesText } from '../../game/rulesText';
	import { numberIn, rulesLang } from '../../game/rulesCommon';

	// The opening card: studio mark, game logo, volatility, the four things the
	// game does, and the tap that starts it — one screen, in Wild Alchemy's own
	// look (2026-11-11; until then it was still the inherited prison card).
	//
	// Everything on it is this game's art, read through the asset registry so a
	// renamed file fails check_assets_exist instead of drawing a broken image:
	//   · the laboratory backdrop — the MG plate plus its object layers, placed
	//     from game/sceneLayout.json exactly as Background/SceneLife place them,
	//     with the same kinds of motion (swing, flicker, glow, rising steam) done
	//     in CSS because this card is DOM, not pixi;
	//   · the logo (waLogo), the parchment card frame (waPanel) for every panel;
	//   · symbols and HUD pieces as the panel icons.
	// No character: the cast is a Spine rig still under revision (Cast.svelte),
	// and a baked still here would be an older drawing than the one on the board.
	//
	// Every number comes from the maths config or game/featureRules.ts — the
	// card never states a figure the game does not pay.

	type Props = { onclose?: () => void };
	const props: Props = $props();

	const T = getSocialTerms();
	// The card follows ?lang= (game/i18nText.ts, 16 locales). Social play keeps
	// the English below, which is worded through socialTerms.
	const social = stateUrlDerived.social();
	const lang = rulesLang();
	const G = gameRulesText(lang, T, social);
	const tx = (key: Parameters<typeof gameText>[0], en: string, vars?: Record<string, string | number>) =>
		social ? en : gameText(key, vars);

	type Registry = Record<string, { src?: string } | undefined>;
	const src = (key: string) => (assets as unknown as Registry)[key]?.src ?? '';

	// grouped the player's way (20.000 in de); Latin digits, no Lingui needed
	const maxWin = lang === 'en' ? (config.betModes?.base?.max_win ?? 20000).toLocaleString('en-US') : numberIn(lang, config.betModes?.base?.max_win ?? 20000);
	const lineCount = Object.keys(config.paylines).length;
	const buyCost = (key: 'bonus' | 'super_bonus') => config.betModes[key].cost;
	const ladder = FEATURE_RULES.ladder
		.slice(1)
		.map((m) => `×${m}`)
		.join('\u00a0·\u00a0'); // no-break: the ladder never splits across lines
	const vars = {
		max: MAX_BLOCK,
		lines: lineCount,
		cells: FEATURE_RULES.triggerCells,
		fs: FEATURE_RULES.freeSpins,
		pts: FEATURE_RULES.pointsPerStep,
		plus: FEATURE_RULES.spinsPerStep,
		ladder,
		b1: buyCost('bonus'),
		b2: buyCost('super_bonus'),
		sm: FEATURE_RULES.superStartMult,
		ss: FEATURE_RULES.superSpins,
	};
	const fill = (text: string) => text.replace(/\{(\w+)\}/g, (m, name) => (name in vars ? String(vars[name as keyof typeof vars]) : m));

	// Four of five. A judgement, not a computed figure: a 20,000× cap with the
	// top hit near 1 in 13.3 million in the base game (math 2026-11-09 run).
	const VOLATILITY = 4;
	const VOLATILITY_MAX = 5;

	type Icon = { key: string; size?: 'sm' | 'lg' };
	type Panel = { icons: Icon[]; arrow?: boolean; plate?: string; title: string; body: string };
	const panels: Panel[] = [
		{
			icons: [{ key: 'hmL1', size: 'sm' }, { key: 'hmH1', size: 'lg' }],
			title: G.lightTitle,
			body: tx('introLarge', fill('Symbols land as 1×1 or 2×2 and merge while the reels spin into blocks up to {max}×{max}. Every visible cell counts on the {lines} lines.'), vars),
		},
		{
			icons: [{ key: 'hmH2' }, { key: 'waWH2' }],
			arrow: true,
			title: G.beamsTitle,
			body: tx('introWild', 'The Alchemist tries to turn each person symbol into WILD — each one succeeds or fails on its own. It can happen on any base spin and is tried on every free spin.'),
		},
		{
			icons: [{ key: 'hmS' }, { key: 'waFlaskBody' }],
			title: tx('freeSpins', 'FREE SPINS'),
			body: tx('introFree', fill('{cells} or more visible Scatter cells award {fs} free spins. Each WILD cell is 1 point; every {pts} points climb the multiplier {ladder} and add {plus} spins.'), vars),
		},
		{
			icons: [],
			// the bar's own label; NOT rulesCommon — its locales call Lingui, which
			// has no locale yet while this card is up (it threw in zh, 2026-11-11)
			plate: tx('introBuyTitle', T.buyBonusName.toUpperCase()),
			title: tx('introBuyTitle', T.buyBonusName.toUpperCase()),
			body: tx('introBuy', fill(`FREE GAME for {b1}× your ${T.bet}, or SUPER FREE GAME for {b2}× — it starts at ×{sm} with {ss} spins.`), vars),
		},
	];

	// ── the laboratory behind the card (sceneLayout.json, MG) ────────────────
	type Motion = { type?: string; period?: number; amp?: number; phase?: number; dist?: number; alpha?: number };
	type Layer = { key?: string; x?: number; y?: number; ax?: number; ay?: number; s?: number; only?: string; motion?: Motion };
	const PLATE_W = 1920;
	const PLATE_H = 1080;
	const mg = (sceneLayout as unknown as { mg: { base: string; layers: Layer[] } }).mg;
	const plateSrc = src(mg.base);
	let portrait = $state(false);
	const sceneLayers = $derived(
		mg.layers
			.map((layer, index) => ({ ...layer, index, url: layer.key ? src(layer.key) : '' }))
			.filter((layer) => layer.url && layer.x !== undefined && layer.y !== undefined)
			// Landscape draws the plate's 'land' objects. Portrait draws the plate
			// alone: its 'port' objects (two candlesticks) are placed for the board
			// screen, and on this card they land behind the panels with their flames
			// hidden — candles with no flame.
			.filter((layer) => !portrait && (!layer.only || layer.only === 'both' || layer.only === 'land')),
	);
	// natural widths, filled in as each layer loads (its drawn width is native × s)
	let natural = $state<Record<number, number>>({});
	const onLayerLoad = (index: number, e: Event) => {
		natural = { ...natural, [index]: (e.currentTarget as HTMLImageElement).naturalWidth };
	};

	let show = $state(true);

	// Fit the stage to the window. Stake review of a sibling game, Popout S:
	// the opening card ran off the top of a small popout. The stage is measured
	// at its natural size and scaled down to fit.
	let stage = $state<HTMLElement>();
	let studio = $state<HTMLElement>();
	let fit = $state(1);
	// Portrait: the stage spans the width, so the studio mark in the bottom-left
	// corner sat under the TAP TO CONTINUE strip (320x568, QA 11-11 B4). The mark's
	// height is kept clear below the stage — the card's bottom padding grows by it
	// and the fit leaves it out. Landscape keeps the mark beside the centred stage.
	let studioReserve = $state(0);
	const measure = () => {
		portrait = window.innerHeight > window.innerWidth;
		if (!stage) return;
		const w = stage.offsetWidth;
		const h = stage.offsetHeight;
		if (!w || !h) return;
		studioReserve = portrait && studio ? Math.ceil(window.innerHeight - studio.getBoundingClientRect().top) + 4 : 0;
		// the card's own padding is clamp(0.8rem, 2.5vh, 2rem) top and bottom
		const pad = Math.min(32, Math.max(12.8, window.innerHeight * 0.025));
		const padY = pad + Math.max(pad, studioReserve);
		fit = Math.min(1, (window.innerHeight - padY) / h, (window.innerWidth * 0.98) / w);
	};
	$effect(() => {
		if (!stage) return;
		measure();
		const ro = new ResizeObserver(measure);
		ro.observe(stage);
		window.addEventListener('resize', measure);
		return () => {
			ro.disconnect();
			window.removeEventListener('resize', measure);
		};
	});

	// This card is the ONLY opening screen. The pixi loading screen still runs
	// underneath it — it is what actually loads the assets — but the tap is
	// refused until loading has finished. After the timeout the tap is allowed
	// through regardless (a failed authenticate must not leave a card that
	// cannot be dismissed); whatever is behind it can then show its own error.
	const LOAD_TIMEOUT_MS = 12_000;
	let timedOut = $state(false);
	const ready = $derived(stateApp.loaded || timedOut);

	const dismiss = () => {
		show = false;
		props.onclose?.();
	};

	const close = () => {
		if (!show || !ready) return;
		// This tap hands the player straight to the board: it is also the user
		// gesture the audio autoplay policy needs, and the assets are in.
		stateLayout.showLoadingScreen = false;
		dismiss();
	};

	// Enter continues, exactly as the click does. Not Space: that is the spin key.
	const onkey = (e: KeyboardEvent) => {
		if (e.key !== 'Enter' || !show || !armed || !ready) return;
		e.preventDefault();
		close();
	};

	// A short arming delay stops a stray click from dismissing the card before
	// it has finished appearing.
	let armed = $state(false);
	onMount(() => {
		// Replay gets out of the way immediately, via `dismiss` (not `close`, which
		// is refused until the assets are loaded) and leaving `showLoadingScreen`
		// alone, so replay keeps its own loading screen.
		if (stateUrlDerived.replay()) {
			dismiss();
			return;
		}
		portrait = window.innerHeight > window.innerWidth;
		const id = setTimeout(() => (armed = true), 420);
		const bail = setTimeout(() => (timedOut = true), LOAD_TIMEOUT_MS);
		return () => {
			clearTimeout(id);
			clearTimeout(bail);
		};
	});
</script>

<svelte:window onkeydown={onkey} />

{#if show}
	<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
	<div
		class="wa-intro"
		class:armed
		style:z-index={zIndex.modal + 20}
		style:--frame={`url("${src('waPanel')}")`}
		style:padding-bottom={studioReserve ? `${studioReserve}px` : undefined}
		onclick={() => armed && ready && close()}
		transition:fade={{ duration: 320 }}
	>
		<!-- the laboratory, cover-fitted like the board's own backdrop -->
		<div class="wa-scene" aria-hidden="true">
			{#if plateSrc}
				<img class="wa-plate" src={plateSrc} alt="" />
			{/if}
			{#each sceneLayers as layer (layer.index)}
				{@const m = layer.motion ?? {}}
				<div
					class="wa-layer"
					style:left={`${((layer.x ?? 0) / PLATE_W) * 100}%`}
					style:top={`${((layer.y ?? 0) / PLATE_H) * 100}%`}
					style:width={natural[layer.index] ? `${((natural[layer.index] * (layer.s ?? 1)) / PLATE_W) * 100}%` : undefined}
					style:transform={`translate(${-(layer.ax ?? 0.5) * 100}%, ${-(layer.ay ?? 0.5) * 100}%)`}
					style:visibility={natural[layer.index] ? 'visible' : 'hidden'}
				>
					<img
						class={`wa-move wa-${m.type ?? 'still'}`}
						src={layer.url}
						alt=""
						style:transform-origin={`${(layer.ax ?? 0.5) * 100}% ${(layer.ay ?? 0.5) * 100}%`}
						style:--period={`${m.period ?? 2}s`}
						style:--amp={`${m.amp ?? 2}deg`}
						style:--delay={`${-(m.phase ?? 0)}s`}
						style:--rise={`${-(m.dist ?? 50) * 0.5}%`}
						onload={(e) => onLayerLoad(layer.index, e)}
					/>
				</div>
			{/each}
		</div>
		<!-- paper wash: the plate pushed back toward paper behind the type (house
		     rule: lighten the backdrop, never a dark scrim) -->
		<div class="wa-wash"></div>

		<div class="wa-stage" class:portrait bind:this={stage} style:transform={fit < 1 ? `scale(${fit})` : undefined}>
			<img class="wa-logo" src={src('waLogo')} alt="WILD ALCHEMY" />

			<div class="wa-vol">
				<span class="wa-vol-label">{tx('introVolatility', 'VOLATILITY')}</span>
				<span class="wa-bolts" aria-label={`Volatility ${VOLATILITY} of ${VOLATILITY_MAX}`}>
					{#each Array(VOLATILITY_MAX) as _, i (i)}
						<!-- drawn, not typed: a ⚡ glyph renders as a colour emoji -->
						<svg class="wa-bolt" class:lit={i < VOLATILITY} viewBox="0 0 24 40" aria-hidden="true">
							<path d="M14.6 0 3 22.4h6.9L7.4 40 21 16.2h-7.4L14.6 0Z" />
						</svg>
					{/each}
				</span>
			</div>

			<div class="wa-panels">
				{#each panels as panel, i (i)}
					<section class="wa-panel" style:--delay={`${i * 90}ms`}>
						<div class="wa-panel-icons">
							{#each panel.icons as icon, k (k)}
								{#if panel.arrow && k > 0}
									<svg class="wa-arrow" viewBox="0 0 24 16" aria-hidden="true">
										<path d="M1 8h17M13 2l7 6-7 6" />
									</svg>
								{/if}
								<img class={`wa-icon ${icon.size ?? ''}`} src={src(icon.key)} alt="" aria-hidden="true" />
							{/each}
							{#if panel.plate}
								<span class="wa-buy-plate" style:--plate={`url("${src('waUiBuy')}")`}>{panel.plate}</span>
							{/if}
						</div>
						<div class="wa-panel-text">
							<h2 dir="auto">{panel.title}</h2>
							<p dir="auto">{panel.body}</p>
						</div>
					</section>
				{/each}
			</div>

			<!--
				No RTP here: it moves with a maths pass, and a stale figure on the first
				screen is worse than none. The rules panel carries RTP per mode, read
				live from the maths config. The line count and the cap sit on their own
				parchment strip — numbers never sit on the illustration.
			-->
			<div class="wa-foot">
				<p class="wa-stats" dir="auto">
					{tx('introPaylines', `${lineCount} ${T.paylinesUpper}`, { lines: lineCount })} &nbsp;/&nbsp; {tx('introMaxWin', `MAX WIN ${maxWin}×`, { max: maxWin })}
				</p>
				<p class="wa-cta" class:waiting={!ready} dir="auto">
					{ready ? tx('introTap', 'TAP TO CONTINUE') : tx('introLoading', 'LOADING…')}
				</p>
			</div>
		</div>

		<!-- The studio mark. It stays while the platform splash goes. -->
		<div class="wa-studio" bind:this={studio}>
			<svg class="wa-studio-star" viewBox="0 0 100 100" role="img" aria-label="Silverstars 777">
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
			transform: translateY(22px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	@keyframes ctaPulse {
		0%,
		100% {
			opacity: 0.55;
		}
		50% {
			opacity: 1;
		}
	}

	/* backdrop motions, after SceneLife.svelte's kinds */
	@keyframes swing {
		0%,
		100% {
			transform: rotate(calc(var(--amp) * -1));
		}
		50% {
			transform: rotate(var(--amp));
		}
	}

	@keyframes flicker {
		0%,
		100% {
			transform: scale(1, 1);
			opacity: 1;
		}
		23% {
			transform: scale(0.96, 1.06);
			opacity: 0.92;
		}
		51% {
			transform: scale(1.03, 0.95);
			opacity: 1;
		}
		77% {
			transform: scale(0.98, 1.04);
			opacity: 0.88;
		}
	}

	@keyframes glow {
		0%,
		100% {
			opacity: 0.82;
		}
		50% {
			opacity: 1;
		}
	}

	@keyframes rise {
		0% {
			transform: translateY(0) scale(0.92);
			opacity: 0;
		}
		25% {
			opacity: 0.8;
		}
		100% {
			transform: translateY(var(--rise)) scale(1.08);
			opacity: 0;
		}
	}

	.wa-intro {
		position: fixed;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: clamp(0.8rem, 2.5vh, 2rem) clamp(1rem, 3vw, 3rem);
		box-sizing: border-box;
		cursor: pointer;
		overflow: hidden;
		color: var(--capo-ink);
		font-family: var(--gb-body-font, sans-serif);
		background: var(--capo-parchment);
		opacity: 0;
		transition: opacity 0.35s ease;
	}

	.wa-intro.armed {
		opacity: 1;
	}

	/* 16:9 box that covers the window, centred — the board's backdrop fit */
	.wa-scene {
		position: absolute;
		left: 50%;
		top: 50%;
		width: max(100vw, calc(100vh * 16 / 9));
		aspect-ratio: 16 / 9;
		transform: translate(-50%, -50%);
		pointer-events: none;
	}

	.wa-plate {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		display: block;
	}

	.wa-layer {
		position: absolute;
	}

	.wa-move {
		display: block;
		width: 100%;
		height: auto;
	}

	.wa-swing,
	.wa-flutter {
		animation: swing var(--period) ease-in-out infinite var(--delay);
	}

	.wa-flicker {
		animation: flicker 1s ease-in-out infinite var(--delay);
	}

	.wa-glow,
	.wa-twinkle {
		animation: glow var(--period) ease-in-out infinite var(--delay);
	}

	.wa-rise {
		animation: rise var(--period) ease-out infinite var(--delay);
	}

	/* The plate pushed back toward paper behind the type; the edges keep the
	   scene. Paper, not a dark scrim: this backdrop is parchment. */
	.wa-wash {
		position: absolute;
		inset: 0;
		pointer-events: none;
		background: radial-gradient(
			ellipse 62% 70% at 50% 52%,
			rgba(var(--capo-bone-rgb), 0.72) 0%,
			rgba(var(--capo-bone-rgb), 0.45) 55%,
			rgba(var(--capo-bone-rgb), 0.08) 100%
		);
	}

	.wa-stage {
		position: relative;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: clamp(0.45rem, 1.3vh, 0.9rem);
		width: min(66rem, 100%);
		margin: 0 auto;
		flex-shrink: 0;
		transform-origin: 50% 50%;
	}

	.wa-stage.portrait {
		width: min(30rem, 100%);
	}

	.wa-logo {
		width: clamp(13rem, 28vw, 24rem);
		height: auto;
		filter: drop-shadow(0 4px 10px rgba(var(--capo-ink-deep-rgb), 0.35));
		animation: riseIn 0.5s cubic-bezier(0.22, 1, 0.36, 1) both;
	}

	.wa-stage.portrait .wa-logo {
		width: min(80vw, 22rem);
	}

	.wa-vol {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		animation: riseIn 0.5s cubic-bezier(0.22, 1, 0.36, 1) both 0.06s;
	}

	.wa-vol-label {
		font-family: var(--hm-title-font, var(--gb-display-font, sans-serif));
		font-size: clamp(0.72rem, 1.4vw, 0.95rem);
		font-weight: 700;
		letter-spacing: 0.2em;
		color: var(--capo-ink);
	}

	.wa-bolts {
		display: inline-flex;
		align-items: center;
		gap: 0.22rem;
		line-height: 1;
	}

	.wa-bolt {
		height: clamp(1rem, 2vw, 1.35rem);
		width: auto;
		display: block;
		overflow: visible;
	}

	/* unlit: hollow, in the ink; lit: ochre with the ink keyline */
	.wa-bolt path {
		fill: transparent;
		stroke: rgba(var(--capo-ink-rgb), 0.45);
		stroke-width: 1.8;
		stroke-linejoin: round;
	}

	.wa-bolt.lit path {
		fill: var(--capo-gold);
		stroke: var(--capo-ink);
		stroke-width: 2;
	}

	.wa-panels {
		display: grid;
		grid-template-columns: repeat(4, minmax(0, 1fr));
		gap: clamp(0.5rem, 1.1vw, 0.85rem);
		width: 100%;
	}

	/* Narrow landscape (a small popout) keeps four columns; narrow portrait
	   stacks them as rows with the icon on the left. */
	.wa-stage.portrait .wa-panels {
		grid-template-columns: 1fr;
		gap: 0.45rem;
	}

	/* The parchment card frame (waPanel, 1060×673 — the same plate the Buy
	   menu cards and the free-game panels use), nine-sliced so its corner
	   leaves never stretch. */
	.wa-panel {
		position: relative;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.35rem;
		padding: 0.35rem 0.4rem 0.45rem;
		box-sizing: border-box;
		border-style: solid;
		border-width: 15px;
		border-image: var(--frame) 58 fill stretch;
		text-align: center;
		filter: drop-shadow(0 5px 10px rgba(var(--capo-ink-deep-rgb), 0.28));
		animation: riseIn 0.5s cubic-bezier(0.22, 1, 0.36, 1) both;
		animation-delay: var(--delay);
	}

	.wa-stage.portrait .wa-panel {
		display: grid;
		grid-template-columns: 5.6rem 1fr;
		align-items: center;
		gap: 0.55rem;
		padding: 0.15rem 0.3rem;
		border-width: 12px;
		text-align: start;
	}

	.wa-panel-icons {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.25rem;
		min-height: 3.6rem;
	}

	.wa-icon {
		width: 3.3rem;
		height: 3.3rem;
		object-fit: contain;
		filter: drop-shadow(0 2px 4px rgba(var(--capo-ink-deep-rgb), 0.35));
	}

	.wa-icon.sm {
		width: 2rem;
		height: 2rem;
		align-self: flex-end;
	}

	.wa-icon.lg {
		width: 3.6rem;
		height: 3.6rem;
	}

	.wa-stage.portrait .wa-panel-icons {
		min-height: 2.6rem;
		gap: 0.1rem;
	}

	.wa-stage.portrait .wa-icon {
		width: 2.1rem;
		height: 2.1rem;
	}

	.wa-stage.portrait .wa-arrow {
		width: 0.8rem;
	}

	.wa-stage.portrait .wa-icon.sm {
		width: 1.4rem;
		height: 1.4rem;
	}

	.wa-stage.portrait .wa-icon.lg {
		width: 2.6rem;
		height: 2.6rem;
	}

	.wa-arrow {
		width: 1.1rem;
		height: auto;
		flex-shrink: 0;
	}

	.wa-arrow path {
		fill: none;
		stroke: var(--capo-wine);
		stroke-width: 2.6;
		stroke-linecap: round;
		stroke-linejoin: round;
	}

	/* the bar's own Buy plate in miniature, its label set in ink on it */
	.wa-buy-plate {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 6.4rem;
		height: 3rem;
		padding: 0 0.7rem;
		box-sizing: border-box;
		background: var(--plate) center / 100% 100% no-repeat;
		font-family: var(--hm-title-font, var(--gb-display-font, sans-serif));
		font-size: 0.66rem;
		font-weight: 800;
		line-height: 1.05;
		letter-spacing: 0.04em;
		text-align: center;
		text-transform: uppercase;
		color: var(--capo-ink);
	}

	.wa-stage.portrait .wa-buy-plate {
		width: 4.4rem;
		height: 2.1rem;
		padding: 0 0.45rem;
		font-size: 0.5rem;
	}

	.wa-panel-text {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		min-width: 0;
	}

	.wa-panel h2 {
		margin: 0;
		font-family: var(--hm-title-font, var(--gb-display-font, sans-serif));
		font-size: clamp(0.82rem, 1.5vw, 1.02rem);
		font-weight: 800;
		letter-spacing: 0.05em;
		text-transform: uppercase;
		color: var(--capo-wine);
	}

	.wa-panel p {
		margin: 0;
		font-size: clamp(0.7rem, 1.1vw, 0.8rem);
		line-height: 1.42;
		color: var(--capo-ink);
	}

	.wa-stage.portrait .wa-panel h2 {
		font-size: 0.84rem;
	}

	.wa-stage.portrait .wa-panel p {
		font-size: 0.72rem;
		line-height: 1.35;
	}

	.wa-foot {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.2rem;
		padding: 0.15rem 1.2rem;
		border-style: solid;
		border-width: 12px;
		border-image: var(--frame) 58 fill stretch;
		filter: drop-shadow(0 4px 8px rgba(var(--capo-ink-deep-rgb), 0.25));
		animation: riseIn 0.5s cubic-bezier(0.22, 1, 0.36, 1) both 0.36s;
	}

	.wa-stats {
		margin: 0;
		font-family: var(--hm-title-font, var(--gb-display-font, sans-serif));
		font-size: clamp(0.72rem, 1.4vw, 0.92rem);
		font-weight: 700;
		letter-spacing: 0.12em;
		color: var(--capo-ink);
	}

	.wa-cta {
		margin: 0;
		font-family: var(--hm-title-font, var(--gb-display-font, sans-serif));
		font-size: clamp(0.8rem, 1.6vw, 1rem);
		font-weight: 800;
		letter-spacing: 0.22em;
		color: var(--capo-wine);
		animation: ctaPulse 1.7s ease-in-out infinite;
	}

	/* While loading it is a status line, not an invitation. */
	.wa-cta.waiting {
		animation: none;
		opacity: 0.6;
		letter-spacing: 0.14em;
		color: var(--capo-ink);
	}

	.wa-studio {
		position: absolute;
		left: clamp(0.8rem, 2vw, 1.6rem);
		bottom: clamp(0.7rem, 2vh, 1.3rem);
		display: flex;
		align-items: center;
		gap: 0.45rem;
		color: var(--capo-ink);
		font-family: var(--hm-title-font, var(--gb-display-font, sans-serif));
		font-size: clamp(0.55rem, 1vw, 0.7rem);
		font-weight: 700;
		letter-spacing: 0.14em;
	}

	.wa-studio-star {
		width: clamp(1.1rem, 2.2vw, 1.5rem);
		height: clamp(1.1rem, 2.2vw, 1.5rem);
		flex-shrink: 0;
	}

	.wa-studio-star text {
		fill: currentColor;
		font-family: var(--hm-title-font, var(--gb-display-font, sans-serif));
		font-size: 30px;
		font-weight: 700;
	}

	/* Ambient loops are decoration: skipped under reduced motion. */
	@media (prefers-reduced-motion: reduce) {
		.wa-move,
		.wa-cta {
			animation: none !important;
		}
	}
</style>
