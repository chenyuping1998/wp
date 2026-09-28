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
	// side-effect import: paints the shared bet bar in the arctic palette
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
	import ExpandingWilds from './ExpandingWilds.svelte';
	import StickyPrizes from './StickyPrizes.svelte';
	import Anticipations from './Anticipations.svelte';
	import WinLines from './WinLines.svelte';
	import Win from './Win.svelte';
	import FreeSpinIntro from './FreeSpinIntro.svelte';
	import FreeSpinCounter from './FreeSpinCounter.svelte';
	import FreeSpinOutro from './FreeSpinOutro.svelte';
	import Transition from './Transition.svelte';
	import SnowShed from './SnowShed.svelte';
	import { frostQuake, quakeShake } from '../game/frostQuake.svelte';

	const context = getContext();

	// The scene's offset during the chest-beat quake (game/frostQuake). The
	// background, the mascot and the board all move together and the bet bar does
	// not: the world takes the hit, the controls stay where the hand is.
	const sceneOffset = $derived.by(() =>
		quakeShake(frostQuake.clock, context.stateLayoutDerived.canvasSizes().height),
	);

	// soft depth-of-field on the scene so the reels read as the subject
	// 0.8, was 4 (2026-09-27): 4 smeared the painted plates — "why is the
	// background always blurry, it cannot be as sharp as Deadwood". The range
	// asked for is 0.6-1, picked per game by what sits beside the board:
	// the brightest plates of the family (mean luminance 69) with hard ice
	// edges beside the board; softened so pale ice does not compete with it.
	const backgroundBlur = [new BlurFilter({ strength: 0.8, quality: 3 })];

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

	<Container x={sceneOffset.x} y={sceneOffset.y}>
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

		<!-- same offset as the background above: the scene takes the quake as one -->
		<Container x={sceneOffset.x} y={sceneOffset.y}>
			<!-- snow coming down in the distance, BEHIND the mascot and the reels —
			     the depth is what puts a ledge above them -->
			<SnowShed layer="back" />

			<MainContainer>
				<!-- Before the frame, so if a narrow layout ever brings the two close
				     the housing is the thing that stays in front. -->
				<Mascot />
				<BoardFrame />
			</MainContainer>

			<MainContainer>
				<Board />
				<ReelDust />
				<ExpandingWilds />
				<StickyPrizes />
				<Anticipations />
				<ScatterBurst />
				<WinLines />
			</MainContainer>

			<!-- ...and in front: the clumps off the ledge, the bouncing graupel, the
			     powder. Kept off the middle of the board by construction. -->
			<SnowShed layer="front" />

			<EntryReveal />
		</Container>

		<UI>
			{#snippet gameName()}
				<UiGameName name="GO BANANAS FROSTLINE" />
			{/snippet}
			{#snippet logo()}
				<Text
					anchor={{ x: 1, y: 0 }}
					text="GO BANANAS FROSTLINE"
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
