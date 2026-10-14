<script lang="ts">
	import { GAME_FONT, TITLE_FONT, TITLE_FONT_WEIGHT, GAME_FONT_WEIGHT } from '../game/fonts';
	import { onMount } from 'svelte';

	import { BlurFilter } from 'pixi.js';
	import { EnablePixiExtension } from 'components-pixi';
	import { EnableHotkey } from 'components-shared';
	import { MainContainer } from 'components-layout';
	import { App, Container, Sprite, Text, REM } from 'pixi-svelte';
	import { stateModal, stateReplay, stateUi } from 'state-shared';

	import { UI, UiGameName } from 'components-ui-pixi';
	import { GameVersion } from 'components-ui-html';
	import Modals from './ui/Modals.svelte';
	import ReplayIntro from './ui/ReplayIntro.svelte';

	import { getContext } from '../game/context';
	// side-effect import: paints the shared bet bar in the jungle palette
	import '../game/uiTheme';
	import EnableSound from './EnableSound.svelte';
	import EnableGameActor from './EnableGameActor.svelte';
	import ResumeBet from './ResumeBet.svelte';
	import Sound from './Sound.svelte';
	import Background from './Background.svelte';
	import Cast from './Cast.svelte';
	import LoadingScreen from './LoadingScreen.svelte';
	import BoardFrame from './BoardFrame.svelte';
	import Board from './Board.svelte';
	import ReelDust from './ReelDust.svelte';
	import EntryReveal from './EntryReveal.svelte';
	import ScatterBurst from './ScatterBurst.svelte';
	import Searchlights from './Searchlights.svelte';
	import WildColumns from './WildColumns.svelte';
	import Anticipations from './Anticipations.svelte';
	import WinLines from './WinLines.svelte';
	import Win from './Win.svelte';
	import FreeSpinIntro from './FreeSpinIntro.svelte';
	import FreeSpinCounter from './FreeSpinCounter.svelte';
	import FreeSpinOutro from './FreeSpinOutro.svelte';
	import Transition from './Transition.svelte';
	import { castTopStd, cornerLogoScale, nameHitsHousing, portraitBand, portraitLogoBox } from '../game/cornerLogo';
	import { stateGame } from '../game/stateGame.svelte';

	const context = getContext();

	// The corner logo yields to the housing and the prisoner's head in a small
	// popout (game/cornerLogo.ts). hardTimeBrand/logo.png ink: 20%–80% across, down
	// to 74%; the snippet nudges it REM*2.4 right. Cast.svelte: figure top at 0.11.
	const CORNER_LOGO = {
		width: REM * 15,
		height: REM * 15 * (520 / 1200),
		offsetX: REM * 2.4,
		inkLeft: 0.2,
		inkBottom: 0.744,
	};
	const logoScale = $derived(
		cornerLogoScale(context, CORNER_LOGO, stateGame.featureSplashShow ? null : castTopStd(context, 0.11)),
	);
	// "13:42 HARD TIME" ends ~235px in
	// Portrait: the strip above the housing holds the logo (left) and the prisoner's
	// upper body (right, Cast.svelte). The corner logo and the typed name stand
	// down there — the strip's logo carries the title, the clock stays.
	const portrait = $derived(portraitBand(context));
	// hardTimeBrand/logo.png ink, fractions of its 1200×520 canvas
	const LOGO_INK = { left: 0.2, top: 0, right: 0.801, bottom: 0.744 };
	const hideName = $derived(nameHitsHousing(context, 235) || portrait !== null);

	// soft depth-of-field on the jungle scene so the reels read as the subject
	const backgroundBlur = [new BlurFilter({ strength: 4, quality: 3 })];

	onMount(() => (context.stateLayout.showLoadingScreen = true));

	context.eventEmitter.subscribeOnMount({
		buyBonusConfirm: () => {
			stateModal.modal = { name: 'buyBonusConfirm' };
		},
	});
</script>

<App>
	<EnableSound />
	<EnableHotkey />
	<EnableGameActor />
	<EnablePixiExtension />

	<Container filters={backgroundBlur}>
		<Background />
	</Container>
	<!-- corner vignette seats the blurred scene behind the board -->
	<Sprite
		key="fxVignette"
		width={context.stateLayoutDerived.canvasSizes().width}
		height={context.stateLayoutDerived.canvasSizes().height}
		alpha={0.9}
	/>

	{#if context.stateLayout.showLoadingScreen}
		<LoadingScreen onloaded={() => (context.stateLayout.showLoadingScreen = false)} />
	{:else}
		<ResumeBet />
		<!--
			The reason why <Sound /> is rendered after clicking the loading screen:
			"Autoplay with sound is allowed if: The user has interacted with the domain (click, tap, etc.)."
			Ref: https://developer.chrome.com/blog/autoplay
		-->
		<Sound />

		<!-- Someone standing at the right edge; behind the board's housing so the
		     reels always win any overlap. See Cast.svelte. -->
		<Cast />

		<MainContainer>
			<BoardFrame />
		</MainContainer>

		<!-- Portrait: the logo in the strip's left half. A running feature's
		     counter takes that slot (FreeSpinCounter.svelte), so it stands down. -->
		{#if portrait && !stateUi.freeSpinCounterShow}
			{@const logo = portraitLogoBox(portrait, LOGO_INK)}
			<Sprite key="hmLogo" anchor={0.5} x={logo.x} y={logo.y} width={logo.width} height={logo.height} />
		{/if}

		<MainContainer>
			<Board />
			<ReelDust />
			<WildColumns />
			<Searchlights />
			<Anticipations />
			<ScatterBurst />
			<WinLines />
		</MainContainer>

		<EntryReveal />

		<UI>
			{#snippet gameName()}
				<UiGameName name={hideName ? '' : 'HARD TIME'} />
			{/snippet}
			{#snippet logo()}
				<!--
					The top-right title is the house convention (HotMiami, Moooo and
					GoBananas all repeat the game name here), so the CONTENT stays.
					What does not survive a narrow viewport is having it at all: the
					top-left slot already prints the clock and the same name, both are
					pinned 20px from their own edge, and at 375 CSS px wide the two
					strings run into each other — "CAPO NOSTRA" over "CAPO NOSTRA"
					rendered as "CAPO NOSTOSTRA" in portrait.

					Measured on the portrait build: the left string occupies ~260 CSS px
					and this one ~120, so they need ~420 to clear. 480 leaves margin and
					covers Mobile S at 360. Below it the duplicate is simply not drawn —
					nothing is lost, the name is still on screen top-left.
				-->
				{#if context.stateLayoutDerived.canvasSizes().width >= 480}
					<!-- The game's logo art (1200×520), not the name typed in the title
					     font: a plain text title in the corner is one of the things
					     review's "low quality assets" tag lists (2026-09-29 audit). -->
					<!-- ink is only the middle 60% of the 1200×520 canvas, so draw it wider
					     than Capo's full-bleed logo to land the letters at the same size -->
					{#if logoScale > 0 && !portrait}
						<Sprite
							key="hmLogo"
							anchor={{ x: 1, y: 0 }}
							x={CORNER_LOGO.offsetX * logoScale}
							width={CORNER_LOGO.width * logoScale}
							height={CORNER_LOGO.height * logoScale}
						/>
					{/if}
				{/if}
			{/snippet}
		</UI>
		<Win />
		<FreeSpinIntro />
		<FreeSpinCounter />
		<FreeSpinOutro />
		<Transition />
	{/if}
</App>

<!-- DOM, so it lives outside <App> — the pixi tree cannot host HTML. -->
{#if stateReplay.waiting}
	<ReplayIntro
		onstart={() => {
			stateReplay.waiting = false;
			stateReplay.startRequested = true;
		}}
	/>
{/if}

<Modals>
	{#snippet version()}
		<GameVersion version="0.0.0" />
	{/snippet}
</Modals>
