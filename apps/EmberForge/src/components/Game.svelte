<script lang="ts">
	import { GAME_FONT, GAME_FONT_WEIGHT } from '../game/fonts';
	import { onMount } from 'svelte';

	import { BlurFilter } from 'pixi.js';
	import { EnablePixiExtension } from 'components-pixi';
	import { EnableHotkey } from 'components-shared';
	import { MainContainer } from 'components-layout';
	import { App, Container, Sprite, Text, REM } from 'pixi-svelte';
	import { stateModal } from 'state-shared';

	import { UI, UiGameName } from 'components-ui-pixi';
	import { GameVersion } from 'components-ui-html';
	import Modals from './ui/Modals.svelte';

	import { getContext } from '../game/context';
	// side-effect import: paints the shared bet bar in the forge palette
	import '../game/uiTheme';
	import EnableGameActor from './EnableGameActor.svelte';
	import ResumeBet from './ResumeBet.svelte';
	import Sound from './Sound.svelte';
	import Background from './Background.svelte';
	import LoadingScreen from './LoadingScreen.svelte';
	import BoardFrame from './BoardFrame.svelte';
	import BoardCamera from './BoardCamera.svelte';
	import Board from './Board.svelte';
	import ReelDust from './ReelDust.svelte';
	import EntryReveal from './EntryReveal.svelte';
	import ScatterBurst from './ScatterBurst.svelte';
	import GridMultipliers from './GridMultipliers.svelte';
	import GridMultiplierBadges from './GridMultiplierBadges.svelte';
	import TumbleLayer from './TumbleLayer.svelte';
	import SpinLedger from './SpinLedger.svelte';
	import QuenchFlash from './QuenchFlash.svelte';
	import Anticipations from './Anticipations.svelte';
	import ClusterWins from './ClusterWins.svelte';
	import Win from './Win.svelte';
	import FreeSpinIntro from './FreeSpinIntro.svelte';
	import FreeSpinCounter from './FreeSpinCounter.svelte';
	import FreeSpinOutro from './FreeSpinOutro.svelte';
	import ReplayIntro from './ReplayIntro.svelte';
	import Transition from './Transition.svelte';

	const context = getContext();

	// soft depth-of-field on the forge scene so the board reads as the subject
	const backgroundBlur = [new BlurFilter({ strength: 4, quality: 3 })];

	onMount(() => (context.stateLayout.showLoadingScreen = true));

	context.eventEmitter.subscribeOnMount({
		buyBonusConfirm: () => {
			stateModal.modal = { name: 'buyBonusConfirm' };
		},
	});
</script>

<App>
	<!--
		<EnableSound /> used to be here. It loaded the template's howler bank and
		asked Howler to mute itself when the tab was hidden — but every sound in this
		game is a plain HTMLAudioElement, which Howler has no say over. Sound.svelte
		owns those elements and now does the muting itself.
	-->
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

		<MainContainer>
			<BoardFrame />
		</MainContainer>

		<MainContainer>
			<!--
				Everything the round draws on the playfield leans in together as a
				tumble chain deepens. Inside the container, so the push cannot move the
				board relative to its own effects — the heat plates, the win frames and
				the numbers all have to travel with the symbols they belong to.

				The painted frame is deliberately OUTSIDE it: the room does not move,
				the camera does.
			-->
			<BoardCamera>
				<!--
					Order is the draw order, and the heat grid deliberately straddles the
					board. Its edge and bloom go UNDER the symbols — that is the surface
					they sit on. Its multiplier numbers go OVER them, further down, or the
					artwork covers the number.
				-->
				<GridMultipliers />
				<Board />
				<ReelDust />
				<TumbleLayer />
				<Anticipations />
				<ScatterBurst />
				<ClusterWins />
				<!-- over the symbols: the numbers must stay readable -->
				<GridMultiplierBadges />
			</BoardCamera>
		</MainContainer>

		<!-- full-canvas, so it sits outside the board container -->
		<QuenchFlash />

		<EntryReveal />

		<!--
			Before <UI> deliberately. Pixi draws in mount order, so anything after the
			UI lands on top of the menu when it opens — which is what put the ledger
			over the menu items.
		-->
		<SpinLedger />

		<UI>
			{#snippet gameName()}
				<UiGameName name="EMBER FORGE" />
			{/snippet}
			{#snippet logo()}
				<Text
					anchor={{ x: 1, y: 0 }}
					text="EMBER FORGE"
					style={{
						fontFamily: GAME_FONT,
						fontSize: REM * 1.5,
						fontWeight: GAME_FONT_WEIGHT,
						lineHeight: REM * 2,
						fill: 0xffffff,
					}}
				/>
			{/snippet}
		</UI>
		<Win />
		<FreeSpinIntro />
		<FreeSpinCounter />
		<FreeSpinOutro />

		<!--
			Last, so its dimming layer and its press target sit over everything the
			round draws. Inert unless ?replay=true.
		-->
		<ReplayIntro />
		<Transition />
	{/if}
</App>

<Modals>
	{#snippet version()}
		<GameVersion version="0.0.0" />
	{/snippet}
</Modals>
