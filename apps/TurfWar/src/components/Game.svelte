<script lang="ts">
 import StreetLabel from './StreetLabel.svelte';
	import { GAME_FONT, TITLE_FONT, TITLE_FONT_WEIGHT, GAME_FONT_WEIGHT } from '../game/fonts';
	import { onMount } from 'svelte';


	import { EnablePixiExtension } from 'components-pixi';
	import { EnableHotkey } from 'components-shared';
	import { MainContainer } from 'components-layout';
	import { App, Container, Sprite, Text, REM } from 'pixi-svelte';
	import { stateModal, stateReplay, stateUi } from 'state-shared';

	import { UI as SharedUI, UiGameName } from 'components-ui-pixi';
	import TurfUI from './TurfUI.svelte';
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
	import NeonFrames from './NeonFrames.svelte';
	import WildColumns from './WildColumns.svelte';
	import BigScore from './BigScore.svelte';
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
	const UI = $derived(stateReplay.enabled ? SharedUI : TurfUI);

	// The corner logo yields to the housing and the cast's head in a small popout
	// (game/cornerLogo.ts). turfBrand/logo.png ink runs edge to edge (1%–99%, down
	// to 97%). Cast.svelte stands the figure's top at 0.145 of the box.
	const CORNER_LOGO = {
		width: REM * 11,
		height: REM * 11 * (520 / 1200),
		offsetX: 0,
		inkLeft: 0.013,
		inkBottom: 0.969,
	};
	const logoScale = $derived(
		cornerLogoScale(context, CORNER_LOGO, stateGame.featureSplashShow ? null : castTopStd(context, 0.145)),
	);
	// "13:42 TURF WAR" ends ~215px in
	// Portrait: the strip above the housing holds the logo (left) and the guy's
	// upper body (right, Cast.svelte). The corner logo and the typed name stand
	// down there — the strip's logo carries the title, the clock stays.
	const portrait = $derived(portraitBand(context));
	// turfBrand/logo.png ink, fractions of its 1200×520 canvas
	const LOGO_INK = { left: 0.013, top: 0.029, right: 0.985, bottom: 0.969 };
	const hideName = $derived(nameHitsHousing(context, 215) || portrait !== null);

	// soft depth-of-field on the jungle scene so the reels read as the subject


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

	<Background />

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
			<StreetLabel text="TURF WAR" artKey="hmLogo" anchor={0.5} x={logo.x} y={logo.y} width={logo.width} height={logo.height} />
		{/if}

		<MainContainer>
			<Board />
			<ReelDust />
			<WildColumns />
			<NeonFrames />
			<BigScore />
			<Anticipations />
			<ScatterBurst />
			<WinLines />
		</MainContainer>

		<EntryReveal />

		<UI>
			{#snippet gameName()}
				<Container tint={0x121212}><UiGameName name={hideName ? '' : 'TURF WAR'} /></Container>
			{/snippet}
			{#snippet logo()}
				<!--
					The top-right title is the house convention (HotMiami, Moooo and
					GoBananas all repeat the game name here), so the CONTENT stays.
					What does not survive a narrow viewport is having it at all: the
					top-left slot already prints the clock and the same name, both are
					pinned 20px from their own edge, and at 375 CSS px wide the two
					strings run into each other — "TURF WAR" over "TURF WAR"
					rendered as "CAPO NOSTOSTRA" in portrait.

					Measured on the portrait build: the left string occupies ~260 CSS px
					and this one ~120, so they need ~420 to clear. 480 leaves margin and
					covers Mobile S at 360. Below it the duplicate is simply not drawn —
					nothing is lost, the name is still on screen top-left.
				-->
				{#if context.stateLayoutDerived.canvasSizes().width >= 480 && logoScale > 0 && !portrait}
					<!-- The game's logo art (1200×520, ink edge to edge), not the name
					     typed in the title font: a plain text title in the corner is one
					     of the things review's "low quality assets" tag lists. -->
					<StreetLabel text="TURF WAR" artKey="hmLogo"
						anchor={{ x: 1, y: 0 }}
						width={CORNER_LOGO.width * logoScale}
						height={CORNER_LOGO.height * logoScale}
					/>
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
