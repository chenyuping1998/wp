<script lang="ts">
	import { GAME_FONT, TITLE_FONT, TITLE_FONT_WEIGHT, GAME_FONT_WEIGHT } from '../game/fonts';
	import { onMount } from 'svelte';

	import { BlurFilter } from 'pixi.js';
	import { EnablePixiExtension } from 'components-pixi';
	import { EnableHotkey } from 'components-shared';
	import { MainContainer } from 'components-layout';
	import { App, Container, Rectangle, Sprite, Text, REM } from 'pixi-svelte';
	import { stateModal, stateReplay, stateUi } from 'state-shared';

	import { UI } from 'components-ui-pixi';
	import GameClock from './GameClock.svelte';
	import { GameVersion } from 'components-ui-html';
	import Modals from './ui/Modals.svelte';
	import ReplayIntro from './ui/ReplayIntro.svelte';

	import { getContext } from '../game/context';
	// side-effect import: paints the shared bet bar in the jungle palette
	import { fitBuyBonusLabel } from '../game/uiTheme';
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
	import Blocks from './Blocks.svelte';
	import WildTransfer from './WildTransfer.svelte';
	import LadderHud from './LadderHud.svelte';
	import WideReels from './WideReels.svelte';
	import WinLines from './WinLines.svelte';
	import Win from './Win.svelte';
	import FreeSpinIntro from './FreeSpinIntro.svelte';
	import FreeSpinCounter from './FreeSpinCounter.svelte';
	import FreeSpinOutro from './FreeSpinOutro.svelte';
	import Transition from './Transition.svelte';
	import { castTopStd, cornerLogoScale, nameHitsHousing, portraitBand, portraitLogoBox } from '../game/cornerLogo';
	import { portraitCompactStrip } from '../game/hudLayout';
	import { stateGame } from '../game/stateGame.svelte';

	const context = getContext();

	// The corner logo yields to the housing and the cast's head in a small
	// popout (game/cornerLogo.ts). wildAlchemyScene/brand/logo.png is 1853x706
	// with its ink edge to edge (4 px keying margin), so no nudge is needed.
	const CORNER_LOGO = {
		width: REM * 15,
		height: REM * 15 * (706 / 1853),
		offsetX: 0,
		inkLeft: 0.003,
		inkBottom: 0.991,
	};
	const logoScale = $derived(
		cornerLogoScale(context, CORNER_LOGO, stateGame.featureSplashShow ? null : castTopStd(context, 0.11)),
	);
	// "13:42 WILD ALCHEMY" ends ~270px in.
	// Portrait: the strip above the housing holds the logo (left) and the cast's
	// upper body (right, Cast.svelte). The corner logo and the typed name stand
	// down there — the strip's logo carries the title, the clock stays.
	// the Buy plate's caption, fitted to the plate in the player's language
	fitBuyBonusLabel();

	const portrait = $derived(portraitBand(context));
	// logo ink, fractions of its 1853x706 canvas
	const LOGO_INK = { left: 0.003, top: 0.007, right: 0.997, bottom: 0.991 };
	// short portrait (320x568): the free-game HUD takes the strip's top line
	// right of the clock (hudLayout.portraitCompactStrip), so the name stands down
	// while a feature runs
	const compactHud = $derived(portraitCompactStrip(context) !== null && stateUi.freeSpinCounterShow);
	const hideName = $derived(nameHitsHousing(context, 270) || portrait !== null || compactHud);

	// soft depth-of-field on the jungle scene so the reels read as the subject
	// (light: ink line art smears into mud under a strong blur)
	const desktopBlur = [new BlurFilter({ strength: 1.6, quality: 2 })];
	const mobileBlur = [new BlurFilter({ strength: 1, quality: 1 })];
	const backgroundBlur = $derived(context.stateLayoutDerived.canvasSizes().width < 600 ? mobileBlur : desktopBlur);

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
	<!-- corner vignette seats the scene behind the board. Light: the backdrop
	     is a paper-and-ink plate and must not go dark (house rule; the cast is
	     warm flat colour with dark-brown outlines and needs the paper behind it) -->
	<Sprite
		key="fxVignette"
		width={context.stateLayoutDerived.canvasSizes().width}
		height={context.stateLayoutDerived.canvasSizes().height}
		alpha={0.2}
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

		<!-- scene tint while a conversion runs (the reference turns the room red;
		     ours is the theme's). Screen space: over the room and the cast, under
		     the housing, the board and the HUD. WildTransfer.svelte drives it. -->
		{#if stateGame.fogTint > 0}
			<Rectangle
				width={context.stateLayoutDerived.canvasSizes().width}
				height={context.stateLayoutDerived.canvasSizes().height}
				backgroundColor={0x2f8f6a}
				alpha={0.28 * stateGame.fogTint}
			/>
		{/if}

		<MainContainer>
			<BoardFrame />
		</MainContainer>

		<!-- Portrait: the logo in the strip's left half. A running feature's
		     counter takes that slot (FreeSpinCounter.svelte), so it stands down. -->
		{#if portrait && !stateUi.freeSpinCounterShow}
			{@const logo = portraitLogoBox(portrait, LOGO_INK)}
			<Sprite key="waLogo" anchor={0.5} x={logo.x} y={logo.y} width={logo.width} height={logo.height} />
		{/if}

		<!-- label: CastSpine puts the warden's striking forearm directly above
		     this layer (over the symbols, under the UI and the win banners) -->
		<MainContainer label="ht-board">
			<Board />
			<ReelDust />
			<WideReels />
			<Blocks />
			<WildTransfer />
			<ScatterBurst />
			<WinLines />
		</MainContainer>
		<LadderHud />

		<EntryReveal />

		<UI>
			{#snippet gameName()}
				<!-- app copy of UiGameName: the shared one is hard-coded white,
				     unreadable on the parchment plate -->
				<GameClock name={hideName ? '' : 'WILD ALCHEMY'} />
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
					<!-- The game's logo art (wildAlchemyScene/brand/logo.png, 1853×706),
					     not the name typed in the title font: a plain text title in the
					     corner is one of the things review's "low quality assets" tag
					     lists (2026-09-29 audit). -->
					{#if logoScale > 0 && !portrait}
						<Sprite
							key="waLogo"
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
