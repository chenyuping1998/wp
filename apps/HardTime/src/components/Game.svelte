<script lang="ts">
	import { GAME_FONT, TITLE_FONT, TITLE_FONT_WEIGHT, GAME_FONT_WEIGHT } from '../game/fonts';
	import { onMount } from 'svelte';

	import { BlurFilter } from 'pixi.js';
	import { EnablePixiExtension } from 'components-pixi';
	import { EnableHotkey } from 'components-shared';
	import { MainContainer } from 'components-layout';
	import { App, Container, Sprite, Text, REM } from 'pixi-svelte';
	import { stateModal, stateReplay } from 'state-shared';

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

	const context = getContext();

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
				<UiGameName name="HARD TIME" />
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
					<Text
						anchor={{ x: 1, y: 0 }}
						text="HARD TIME"
						style={{
							fontFamily: TITLE_FONT,
							fontSize: REM * 1.5,
							fontWeight: TITLE_FONT_WEIGHT,
							lineHeight: REM * 2,
							fill: 0xffffff,
						}}
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
