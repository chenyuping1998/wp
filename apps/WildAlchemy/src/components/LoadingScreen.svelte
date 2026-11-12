<script lang="ts">
	import { GAME_FONT, GAME_FONT_WEIGHT, BODY_FONT, DISPLAY_FONT, DISPLAY_FONT_WEIGHT } from '../game/fonts';
	import { Container, Graphics, Text, Sprite } from 'pixi-svelte';
	import { FadeContainer } from 'components-pixi';
	import { MainContainer } from 'components-layout';
	import { onMount } from 'svelte';

	import { getContext } from '../game/context';
	import { featureTextVars } from '../game/featureRules';
	import { canvasLine, gameText, trackingFor } from '../game/i18nText';
	import { stateUrlDerived } from 'state-shared';
	import TransitionAnimation from './TransitionAnimation.svelte';
	import PressToContinue from './PressToContinue.svelte';

	type Props = {
		onloaded: () => void;
	};

	const props: Props = $props();
	const context = getContext();
	// dark-brown ink: the words sit straight on the paper plate
	const INK_TEXT = 0x4a2f1c;

	let loadingType = $state<'start' | 'transition'>('start');
	let pulseTick = $state(0);

	const layout = $derived(context.stateLayoutDerived.mainLayout());

	// wildAlchemyScene/brand/logo.png's own proportions, so the mark is never stretched
	const LOGO_W = 1853;
	const LOGO_H = 706;
	const logoWidth = $derived(layout.height > layout.width ? layout.width * 0.78 : Math.min(layout.width * 0.36, layout.height * 0.62));
	const barWidth = $derived(layout.height > layout.width ? layout.width * 0.7 : Math.min(layout.width * 0.42, 460));

	// No figure here: the cast is a Spine rig that plays beside the board
	// (Cast.svelte) and is still being revised; a baked still would be an older
	// drawing than the one the game opens on. The screen is the laboratory
	// itself — Background.svelte's plate and moving layers show through, and
	// the words sit on its bare wall between the columns.
	const portrait = $derived(layout.height > layout.width);
	const logoY = $derived(layout.height * (portrait ? 0.3 : 0.32));
	const barY = $derived(logoY + logoWidth * (LOGO_H / LOGO_W) * 0.5 + layout.height * (portrait ? 0.08 : 0.12));

	// Gameplay tips cycling under the progress bar, so the wait teaches the
	// features instead of just counting. Each line restates a rule from the rules
	// page (rulesText.ts): grid and lines, large symbols, WILD conversion, the
	// Scatter trigger, points, and the multiplier ladder. This screen is the only
	// one a replay shows before its own card (IntroFeatures covers it in normal
	// play), which is how a previous game's tips once shipped unnoticed here.
	// Every line is in the player's language (game/i18nText.ts, 16 locales;
	// social play is English) with its figures filled from featureTextVars.
	const lang = stateUrlDerived.lang();
	const V = featureTextVars(lang);
	const TIPS = [
		gameText('tipGrid', V),
		gameText('tipLarge'),
		gameText('tipWild'),
		gameText('tipScatter', V),
		gameText('tipPoint'),
		gameText('tipStep', V),
		gameText('tipLadder', { ladder: V.ladderClimb }),
	].map(canvasLine);

	// Read the grid and the cap out of the maths config rather than writing them
	// into the string. This line shipped as GoBananas' "5X5, 15 LINES — MAX WIN
	// 10,000X" for the whole build; taking it from config means it cannot state a
	// game other than the one being played.
	const subtitle = canvasLine(`${V.grid} · ${gameText('loadLines', V)} — ${gameText('introMaxWin', V)}`);

	const TIP_MS = 3400;
	// pulseTick already advances every 32ms for the title pulse — reuse it as the
	// tip clock rather than starting a second timer
	const tipElapsed = $derived(pulseTick * 32);
	const tipIndex = $derived(Math.floor(tipElapsed / TIP_MS) % TIPS.length);
	// fade in over the first 12% of a tip's turn and out over the last 12%, so
	// lines cross-dissolve instead of snapping
	const tipAlpha = $derived.by(() => {
		const p = (tipElapsed % TIP_MS) / TIP_MS;
		if (p < 0.12) return p / 0.12;
		if (p > 0.88) return (1 - p) / 0.12;
		return 1;
	});

	// Animate progress bar smoothly
	let animatedProgress = $state(0);
	$effect(() => {
		const target = context.stateApp.loaded ? 100 : 80;
		const interval = setInterval(() => {
			if (animatedProgress < target) {
				animatedProgress = Math.min(animatedProgress + 2, target);
			} else {
				clearInterval(interval);
			}
		}, 25);
		return () => clearInterval(interval);
	});

	onMount(() => {
		const id = setInterval(() => {
			pulseTick += 1;
		}, 32);
		return () => clearInterval(id);
	});
</script>

<!--
	The loading screen: the logo, the grid / lines / max-win line read from the
	maths config, a progress bar and cycling tips, on the base game's
	laboratory (drawn by Background.svelte underneath, already moving). The
	shared studio loader that precedes it is untouched.
-->
<FadeContainer show={loadingType === 'start'}>
	<MainContainer>
		<!-- The real logo, not a typeset stand-in for it -->
		<Sprite
			key="waLogo"
			anchor={0.5}
			x={layout.width * 0.5}
			y={logoY}
			width={logoWidth}
			height={logoWidth * (LOGO_H / LOGO_W)}
		/>

		<Text
			anchor={0.5}
			x={layout.width * 0.5}
			y={logoY + logoWidth * (LOGO_H / LOGO_W) * 0.5 + 26}
			text={subtitle}
			style={{
				fontFamily: BODY_FONT,
				fontSize: portrait ? 26 : Math.max(13, Math.min(19, layout.width * 0.014)),
				fontWeight: '600',
				fill: INK_TEXT,
				letterSpacing: trackingFor(3),
			}}
		/>

		<Container x={layout.width * 0.5} y={barY}>
			<!--
				The bar in the plates' own inks: a walnut channel with an alchemy-gold
				fill and a paler head. Drawn rather than tinted from art so it is
				correct at any width.
			-->
			<Graphics
				draw={(g) => {
					const w = barWidth;
					const h = 10;
					g.clear();
					g.roundRect(-w / 2, -h / 2, w, h, h / 2);
					g.fill({ color: 0x3b2a1e, alpha: 0.95 });
					g.stroke({ width: 2, color: 0x2a1d14, alpha: 0.9 });
					const fill = (w - 6) * (animatedProgress / 100);
					if (fill > 2) {
						g.roundRect(-w / 2 + 3, -h / 2 + 3, fill, h - 6, (h - 6) / 2);
						g.fill({ color: 0xd19b3e, alpha: 0.95 });
						// the leading 40% is paler, so the bar has a direction
						const head = Math.min(fill, fill * 0.4);
						g.roundRect(-w / 2 + 3 + fill - head, -h / 2 + 3, head, h - 6, (h - 6) / 2);
						g.fill({ color: 0xf0d58a, alpha: 0.9 });
					}
				}}
			/>

			{#if !context.stateApp.loaded}
				<Text
					anchor={0.5}
					y={30}
					text={canvasLine(gameText('loadProgress', { pct: Math.round(animatedProgress) }))}
					style={{
						fontFamily: BODY_FONT,
						fontSize: 14,
						fontWeight: '600',
						fill: INK_TEXT,
						letterSpacing: trackingFor(2),
					}}
				/>
			{/if}

			<Text
				anchor={0.5}
				y={context.stateApp.loaded ? 30 : 62}
				alpha={tipAlpha}
				text={TIPS[tipIndex]}
				style={{
					fontFamily: BODY_FONT,
					fontSize: portrait ? 24 : Math.max(13, Math.min(17, layout.width * 0.0125)),
					fontWeight: '600',
					fill: INK_TEXT,
					letterSpacing: trackingFor(2),
					align: 'center',
					wordWrap: true,
					wordWrapWidth: layout.width * (portrait ? 0.82 : 0.42),
				}}
			/>
		</Container>
	</MainContainer>
</FadeContainer>

<!-- press to continue -->
<FadeContainer show={loadingType === 'start' && context.stateApp.loaded}>
	<PressToContinue onpress={() => (loadingType = 'transition')} />
</FadeContainer>

<!-- transition between the loading screen and the game -->
<FadeContainer show={loadingType === 'transition'}>
	<TransitionAnimation oncomplete={props.onloaded} />
</FadeContainer>
