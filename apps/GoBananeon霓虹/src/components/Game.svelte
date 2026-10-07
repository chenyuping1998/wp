<script lang="ts">
	import { GAME_FONT, GAME_FONT_WEIGHT } from '../game/fonts';
	import { onMount } from 'svelte';
	import { Tween } from 'svelte/motion';
	import { cubicInOut } from 'svelte/easing';
	import { SECOND } from 'constants-shared/time';

	import { BlurFilter } from 'pixi.js';
	import { EnablePixiExtension } from 'components-pixi';
	import { EnableHotkey } from 'components-shared';
	import { MainContainer } from 'components-layout';
	import { App, Container, Sprite, Text, REM } from 'pixi-svelte';
	import { stateModal, stateBet } from 'state-shared';

	import { UI, UiGameName } from 'components-ui-pixi';
	import { GameVersion } from 'components-ui-html';
	import Modals from './ui/Modals.svelte';
	import ReplayIntro from './ui/ReplayIntro.svelte';
	import { stateReplay } from 'state-shared';

	import { getContext } from '../game/context';
	import { HOLD_AND_SPIN_MODE_KEY } from '../game/constants';
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
	import ReelBlast from './ReelBlast.svelte';
	import FullBoard from './FullBoard.svelte';
	import StrikeLights from './StrikeLights.svelte';
	import MineAir from './MineAir.svelte';
	import { caveQuake, quakeShake } from '../game/caveQuake.svelte';
	import StickyPrizes from './StickyPrizes.svelte';
	import Anticipations from './Anticipations.svelte';
	import WinWays from './WinWays.svelte';
	import IdleDirector from './IdleDirector.svelte';
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

	// A touch of depth-of-field on the scene so the reels read as the subject,
	// BY MODE (2026-09-27). It was 4 everywhere, which smeared the painted plates
	// ("why is the background always blurry, it cannot be as sharp as
	// Deadwood"), then 1.0 everywhere; the user then asked for it per mode:
	//   base game      0.6  a calm tunnel — the least the range allows
	//   free spins     1.0  the busiest plate of the family: gold veins,
	//                       crystals, smoke and debris round the board
	//   hold and spin  0.6  the vault is as calm as the base tunnel (the user
	//                       named base and FG only; this follows base)
	// One filter, eased to the new strength over the same second the plates
	// crossfade in (Background.svelte), so the switch is not a jump in focus.
	const BLUR_BASE = 0.6;
	const BLUR_FEATURE = 1.0;
	const blur = new BlurFilter({ strength: BLUR_BASE, quality: 3 });
	const backgroundBlur = [blur];
	const blurTarget = $derived(
		context.stateGame.gameType === 'freegame' && stateBet.activeBetModeKey !== HOLD_AND_SPIN_MODE_KEY
			? BLUR_FEATURE
			: BLUR_BASE,
	);
	const blurTween = new Tween(BLUR_BASE, { duration: SECOND, easing: cubicInOut });
	$effect(() => {
		blurTween.set(blurTarget);
	});
	$effect(() => {
		blur.strength = blurTween.current;
	});

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

		<Container {...quakeCamera}>
		<!-- the feature's air (neon motes, violet glow) and the chest beat's club lights -->
		<MineAir layer="back" />
		<StrikeLights layer="back" />

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
			<ReelBlast />
			<FullBoard />
			<StickyPrizes />
			<Anticipations />
			<ScatterBurst />
			<WinWays />
		</MainContainer>

		<!-- and the glitter and motes in front of it -->
		<StrikeLights layer="front" />
		<MineAir layer="front" />
		</Container>

		<EntryReveal />

		<UI>
			{#snippet gameName()}
				<UiGameName name="GO BANANEON" />
			{/snippet}
			{#snippet logo()}
				<!-- The same name again, top right. Not in portrait: on a phone's
				     width it ran into the clock-and-name on the left and the two
				     printed over each other as one unreadable line. -->
				{#if context.stateLayoutDerived.layoutType() !== 'portrait'}
					<Text
						anchor={{ x: 1, y: 0 }}
						text="GO BANANEON"
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
