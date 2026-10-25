<script lang="ts">
	import '../game/gpuAddBlend';
	import { GAME_FONT, GAME_FONT_WEIGHT } from '../game/fonts';
	import { onMount } from 'svelte';

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
	import IdleDirector from './IdleDirector.svelte';
	import ReelDust from './ReelDust.svelte';
	import EntryReveal from './EntryReveal.svelte';
	import ScatterBurst from './ScatterBurst.svelte';
	import ReelBlast from './ReelBlast.svelte';
	import FullBoard from './FullBoard.svelte';
	import { caveQuake, quakeShake } from '../game/caveQuake.svelte';
	import StickyPrizes from './StickyPrizes.svelte';
	import Anticipations from './Anticipations.svelte';
	import WinWays from './WinWays.svelte';
	import Win from './Win.svelte';
	import FreeSpinIntro from './FreeSpinIntro.svelte';
	import FreeSpinCounter from './FreeSpinCounter.svelte';
	import FreeSpinOutro from './FreeSpinOutro.svelte';
	import Transition from './Transition.svelte';

	const context = getContext();

	// The cave quake's camera: offset and zoomed about the canvas centre. The
	// scene is wrapped in it twice, background and board, because the loading
	// screen sits between them in the tree — both read the same numbers, so they
	// move as one. The UI bar is NOT in it: the room shakes, the controls do not.
	const quakeCamera = $derived.by(() => {
		const { width, height } = context.stateLayoutDerived.canvasSizes();
		const shake = quakeShake(caveQuake.clock, height);
		return {
			pivot: { x: width / 2, y: height / 2 },
			x: width / 2 + shake.x,
			y: height / 2 + shake.y,
			scale: shake.zoom,
		};
	});

	// NO BLUR ON THE SCENE (2026-10-04): the user asked for Go Banalchemy's
	// background to be sharp, so the depth-of-field filter the family carries
	// (0.6 base / 1.0 free spins here) is gone, and the plates were upscaled
	// offline to 1920x1080 with Lanczos + a light unsharp mask instead of being
	// stretched on the GPU (originals: design/source/backgrounds_1672/).

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

	<Container {...quakeCamera}>
		<Container>
			<Background />
		</Container>
		<!-- corner vignette seats the scene behind the board. 0.25, not 0.9: at
		     0.9 the corners were ~80% black and the shelves, flasks and lanterns
		     painted there were lost (user, 2026-10-16: 背景要清晰可見); 0.4 -> 0.25
		     with the plates' brightness lift (2026-10-24: 背景要調亮) -->
		<Sprite
			key="fxVignette"
			width={context.stateLayoutDerived.canvasSizes().width}
			height={context.stateLayoutDerived.canvasSizes().height}
			alpha={0.25}
		/>
	</Container>

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

		<Container {...quakeCamera}>
		<!-- the feature's air: lamp warmth and dust behind the reels, and rocks -->

		<MainContainer>
			<!-- Before the frame, so if a narrow layout ever brings the two close
			     the housing is the thing that stays in front. -->
			<Mascot />
			<BoardFrame />
		</MainContainer>

		<MainContainer>
			<Board />
			<!-- picks a settled cell every few seconds for a small idle act -->
			<IdleDirector />
			<ReelDust />
			<ReelBlast />
			<FullBoard />
			<StickyPrizes />
			<Anticipations />
			<ScatterBurst />
			<WinWays />
		</MainContainer>

		<!-- and the few that come down in front of it -->
		</Container>

		<EntryReveal />

		<UI>
			{#snippet gameName()}
				<UiGameName name="GO BANALCHEMY" />
			{/snippet}
			{#snippet logo()}
				<!-- The same name again, top right. Not in portrait: on a phone's
				     width it ran into the clock-and-name on the left and the two
				     printed over each other as one unreadable line. -->
				{#if context.stateLayoutDerived.layoutType() !== 'portrait'}
					<Text
						anchor={{ x: 1, y: 0 }}
						text="GO BANALCHEMY"
						style={{
							fontFamily: GAME_FONT,
							fontSize: REM * 1.5,
							fontWeight: GAME_FONT_WEIGHT,
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
