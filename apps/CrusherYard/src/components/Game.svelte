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
	// side-effect import: paints the shared bet bar in the yard palette
	import '../game/uiTheme';
	import EnableSound from './EnableSound.svelte';
	import EnableGameActor from './EnableGameActor.svelte';
	import ResumeBet from './ResumeBet.svelte';
	import Sound from './Sound.svelte';
	import Background from './Background.svelte';
	import LoadingScreen from './LoadingScreen.svelte';
	import BoardFrame from './BoardFrame.svelte';
	import Board from './Board.svelte';
	import ReelDust from './ReelDust.svelte';
	import EntryReveal from './EntryReveal.svelte';
	import ScatterBurst from './ScatterBurst.svelte';
	import PressureGauge from './PressureGauge.svelte';
	import TankPayout from './TankPayout.svelte';
	import TumbleLayer from './TumbleLayer.svelte';
	import SpinLedger from './SpinLedger.svelte';
	import QuenchFlash from './QuenchFlash.svelte';
	import Anticipations from './Anticipations.svelte';
	import ScatterWins from './ScatterWins.svelte';
	import Win from './Win.svelte';
	import FreeSpinIntro from './FreeSpinIntro.svelte';
	import FreeSpinCounter from './FreeSpinCounter.svelte';
	import FreeSpinOutro from './FreeSpinOutro.svelte';
	import ReplayIntro from './ReplayIntro.svelte';
	import Transition from './Transition.svelte';

	const context = getContext();

	// soft depth-of-field on the yard scene so the board reads as the subject
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

		<MainContainer>
			<BoardFrame />
		</MainContainer>

		<MainContainer>
			<!--
				Order is the draw order. Unlike the heat grid this replaced, the
				pressure gauge is a single readout that lives ABOVE the board rather
				than under the symbols, so it does not have to straddle these layers —
				it is mounted after them, further down, with the rest of the panels.
			-->
			<Board />
			<ReelDust />
			<TumbleLayer />
			<Anticipations />
			<ScatterBurst />
			<ScatterWins />
			<!--
				After the win marks: the tanks resolve once the board has gone quiet,
				and their numbers fly over whatever is left on it.
			-->
			<TankPayout />
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
				<UiGameName name="CRUSHER YARD" />
			{/snippet}
			{#snippet logo()}
				<Text
					anchor={{ x: 1, y: 0 }}
					text="CRUSHER YARD"
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
		<PressureGauge />
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
