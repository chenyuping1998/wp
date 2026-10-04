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
	import MysteryReveal from './MysteryReveal.svelte';
import FullShipment from './FullShipment.svelte';
import CargoPick from './CargoPick.svelte';
	import MultiplierPick from './MultiplierPick.svelte';
	import MultiplierStrike from './MultiplierStrike.svelte';
	import StickyPrizes from './StickyPrizes.svelte';
	import Anticipations from './Anticipations.svelte';
	import WinWays from './WinWays.svelte';
	import Win from './Win.svelte';
	import FreeSpinIntro from './FreeSpinIntro.svelte';
	import FreeSpinCounter from './FreeSpinCounter.svelte';
	import IdleDirector from './IdleDirector.svelte';
	import FreeSpinMultiplier from './FreeSpinMultiplier.svelte';
	import FreeSpinOutro from './FreeSpinOutro.svelte';
	import Transition from './Transition.svelte';
import CameraShake from './CameraShake.svelte';
	import HarbourSplash from './HarbourSplash.svelte';
	import { dockSplash, splashShake } from '../game/dockSplash.svelte';

	const context = getContext();

	// The scene's offset: the single-hit CameraShake plus the harbour's six-strike
	// splash (game/dockSplash). Summed rather than one replacing the other, so a
	// cargo lock landing during a splash still lands — both are small, and both
	// fit inside the background's overscan margin together.
	const sceneOffset = $derived.by(() => {
		const { height } = context.stateLayoutDerived.canvasSizes();
		const splash = splashShake(dockSplash.clock, height);
		return {
			x: context.stateGame.cameraShake.x + splash.x,
			y: context.stateGame.cameraShake.y + splash.y,
		};
	});

	// A TOUCH of depth-of-field on the dock so the reels read as the subject.
	// 0.6, Deadwood Express's value: it was 4, which turned 1920px painted plates
	// into a smear — "why is this game's background always blurry, it cannot be
	// as sharp as Deadwood" (2026-09-27). The vignette and the board's own frame
	// already separate the reels from the scene; the blur only has to take the
	// edge off, not the detail.
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

	<!--
		WHAT SHAKES AND WHAT DOES NOT.
		==============================

		Everything that is part of the SCENE — the painted dock, the vignette over
		it, the captain, the housing, the board and every effect drawn into it — is
		inside this container and moves together. That is what makes a shake read as
		the room moving rather than as one object being jiggled inside a still
		picture.

		Deliberately OUTSIDE it:

		  · <UI>, the bet bar. Its buttons are hit targets, and a control that dodges
		    the finger reaching for it is a bug however good it looks.
		  · <Win>, <FreeSpinIntro/Outro>, <Transition>. These are full-screen
		    overlays that sit ON the scene rather than in it, and two of them run
		    their own shake already — Win's plaque slams in with its own camera
		    move, and doubling it would just be noise.

		The offset is written by <CameraShake />, mounted at the end of the tree.
	-->
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

		<!-- same container as the background above; see the note there -->
		<Container x={sceneOffset.x} y={sceneOffset.y}>
			<!-- harbour water running down in the distance, BEHIND the captain and
			     the reels — the depth is what puts a pier above them -->
			<HarbourSplash layer="back" />

			<MainContainer>
				<!-- Before the frame, so if a narrow layout ever brings the two close
				     the housing is the thing that stays in front. -->
				<Mascot />
				<BoardFrame />
			</MainContainer>

			<MainContainer>
				<Board />
				<!-- the settled board's little idle acts (game/idleDirector.ts) -->
				<IdleDirector />
				<ReelDust />
				<MysteryReveal />
				<FullShipment />
				<CargoPick />
				<MultiplierPick />
				<StickyPrizes />
				<Anticipations />
				<ScatterBurst />
				<WinWays />
			</MainContainer>

			<!-- the multiplier coming down onto a win: over the board and over the
			     amounts it is landing on -->
			<MultiplierStrike />

			<!-- ...and in front: the streams off the lip, the spray, the drops on
			     the lens. Kept off the middle of the board by construction. -->
			<HarbourSplash layer="front" />

			<EntryReveal />
		</Container>

		<UI>
			{#snippet gameName()}
				<UiGameName name="GO BANANAS BOAT" />
			{/snippet}
			{#snippet logo()}
				<Text
					anchor={{ x: 1, y: 0 }}
					text="GO BANANAS BOAT"
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
		<FreeSpinMultiplier />
		<FreeSpinOutro />
		<Transition />
		<CameraShake />
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
