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
	import ReplayIntro from './ui/ReplayIntro.svelte';
	import { stateReplay } from 'state-shared';

	import { getContext } from '../game/context';
	// side-effect import: paints the shared bet bar in the jungle palette
	import '../game/uiTheme';
	import EnableSound from './EnableSound.svelte';
	import EnableGameActor from './EnableGameActor.svelte';
	import ResumeBet from './ResumeBet.svelte';
	import Sound from './Sound.svelte';
	import Background from './Background.svelte';
	import LoadingScreen from './LoadingScreen.svelte';
	import BoardFrame from './BoardFrame.svelte';
	import Mascot from './Mascot.svelte';
	import Board from './Board.svelte';
	import ReelDust from './ReelDust.svelte';
	import EntryReveal from './EntryReveal.svelte';
	import ScatterBurst from './ScatterBurst.svelte';
	import ScatterLand from './ScatterLand.svelte';
	import IdleActors from './IdleActors.svelte';
	import ReelGrow from './ReelGrow.svelte';
	import ReelLid from './ReelLid.svelte';
	import StickyPrizes from './StickyPrizes.svelte';
	import Anticipations from './Anticipations.svelte';
	import WinWays from './WinWays.svelte';
	import BarWays from './BarWays.svelte';
	import Win from './Win.svelte';
	import FreeSpinIntro from './FreeSpinIntro.svelte';
	import FreeSpinCounter from './FreeSpinCounter.svelte';
	import FreeSpinOutro from './FreeSpinOutro.svelte';
	import Transition from './Transition.svelte';

	const context = getContext();

	// soft depth-of-field on the jungle scene so the reels read as the subject
	// 0.6, was 4 (2026-09-27): 4 smeared the painted plates — "why is the
	// background always blurry, it cannot be as sharp as Deadwood". The range
	// asked for is 0.6-1, picked per game by what sits beside the board:
	// the board sits in the dark window of the hull and the detail is all on the
	// sides — the contrast is there already; this only takes the edge off.
	const backgroundBlur = [new BlurFilter({ strength: 0.6, quality: 3 })];

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
			<!-- Before the frame, so if a narrow layout ever brings the two close
			     the housing is the thing that stays in front. -->
			<Mascot />
			<BoardFrame />
		</MainContainer>

		<MainContainer>
			<Board />
			<ReelDust />
			<!-- Between the symbols and the stretch FX on purpose: the shutter sits
			     over the empty rows a short reel leaves, and ReelGrow's cover has to
			     be able to close over the shutter as well as over the new cell. -->
			<ReelLid />
			<ReelGrow />
			<StickyPrizes />
			<Anticipations />
			<ScatterBurst />
			<ScatterLand />
			<IdleActors />
			<WinWays />
		</MainContainer>

		<EntryReveal />

		<UI>
			{#snippet gameName()}
				<UiGameName name="GO BANANAUT" />
			{/snippet}
			{#snippet logo()}
				<Text
					anchor={{ x: 1, y: 0 }}
					text="GO BANANAUT"
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
		<!-- over the bar: the board's ways in its empty Win→Bet cell -->
		<BarWays />
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
