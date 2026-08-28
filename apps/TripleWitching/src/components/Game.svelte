<script lang="ts">
	import { onMount } from 'svelte';

	import { BlurFilter } from 'pixi.js';
	import { EnablePixiExtension } from 'components-pixi';
	import { EnableHotkey } from 'components-shared';
	import { MainContainer } from 'components-layout';
	import { App, Container, Rectangle, Sprite } from 'pixi-svelte';
	import { stateModal } from 'state-shared';

	import { UI, UiGameName } from 'components-ui-pixi';
	import { GameVersion } from 'components-ui-html';
	import Modals from './ui/Modals.svelte';
	import ReplayIntro from './ui/ReplayIntro.svelte';
	import { stateReplay } from 'state-shared';

	import { getContext } from '../game/context';
	// side-effect import: paints the shared bet bar in the terminal palette
	import '../game/uiTheme';
	import EnableSound from './EnableSound.svelte';
	import EnableGameActor from './EnableGameActor.svelte';
	import ResumeBet from './ResumeBet.svelte';
	import Sound from './Sound.svelte';
	import Background from './Background.svelte';
	import TickerChart from './TickerChart.svelte';
	import LoadingScreen from './LoadingScreen.svelte';
	import BoardFrame from './BoardFrame.svelte';
	import Board from './Board.svelte';
	import ReelDust from './ReelDust.svelte';
	import EntryReveal from './EntryReveal.svelte';
	import Anticipations from './Anticipations.svelte';
	import BoardContainer from './BoardContainer.svelte';
	import BoardExpandFx from './BoardExpandFx.svelte';
	import ScatterTrigger from './ScatterTrigger.svelte';
	import MultiplierMeter from './MultiplierMeter.svelte';
	import FeatureBags from './FeatureBags.svelte';
	import Win from './Win.svelte';
	import FreeSpinIntro from './FreeSpinIntro.svelte';
	import FreeSpinCounter from './FreeSpinCounter.svelte';
	import FreeSpinOutro from './FreeSpinOutro.svelte';
	import Transition from './Transition.svelte';

	const context = getContext();

	// soft depth-of-field on the backdrop so the reels read as the subject
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

	<!--
		Flat ground under everything, including the loading screen. The loading
		screen paints inside the main-layout box, which does not reach the canvas
		edges on every aspect ratio - without this the game's own backdrop showed
		around it, which is a peek at the game before the game has started.
	-->
	<Rectangle {...context.stateLayoutDerived.canvasSizes()} backgroundColor={0x060b09} />

	{#if context.stateLayout.showLoadingScreen}
		<LoadingScreen onloaded={() => (context.stateLayout.showLoadingScreen = false)} />
	{:else}
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
		<!--
			The ticker is above the vignette and outside the blur on purpose: it is
			the one part of the backdrop meant to be read, and both of those layers
			exist to push the backdrop away. It draws only in the gutters beside the
			board, so being sharp up here costs the reels nothing.
		-->
		<TickerChart />

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
			<Board />
			<ReelDust />
			<Anticipations />
			<BoardContainer>
				<ScatterTrigger />
				<BoardExpandFx />
				<!-- In BoardContainer, not beside it: the bags sit above reels 1,
				     3 and 5 and take their x straight from getSymbolX, so there is
				     no board->main transform between them and the reels they point
				     at. BoardContainer is not masked - BoardMask lives inside
				     Board - so negative y is drawn, not clipped. -->
				<FeatureBags />
			</BoardContainer>

			<!-- MultiplierMeter draws in main-box space and brings its own
			     MainContainer: it has to be able to clamp itself to the top of the
			     screen, which board space cannot express -->
			<MultiplierMeter />
		</MainContainer>

		<EntryReveal />

		<UI>
			{#snippet gameName()}
				<UiGameName name="TRIPLE WITCHING" />
			{/snippet}
			{#snippet logo()}
				<!--
					Deliberately empty.

					Every layout draws `gameName` at canvas x=20 and `logo` right-anchored
					at canvas width-20, and the template's games pass the SAME STRING to
					both — so the title is printed twice and the two blocks close on each
					other as the canvas narrows. These are canvas-space text at a fixed
					REM*1.5 (24px, REM is a constant 16), not main-box text, so they do
					not shrink with the layout: the left block is clock + name ≈ 320px and
					the right block ≈ 225px, which collide below about 565px of canvas
					width. Popout S and mobile are both under that, and certification came
					back with a screenshot of "TRIPLE WITCHING" overprinting itself.

					"TRIPLE WITCHING" is 15 characters, the longest title in the workspace,
					which is why this game hit it first — the other seven have the same
					latent bug at a narrower breakpoint.

					Hiding it below a width threshold was the alternative. Printing the
					name once is better: the right-hand copy carried no information the
					left-hand one did not, and a title that appears and disappears with the
					window is its own defect.
				-->
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
