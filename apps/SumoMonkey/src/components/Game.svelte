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

	import { UI } from 'components-ui-pixi';
	import GameNameClock from './GameNameClock.svelte';
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
	import BarMessage from './BarMessage.svelte';
	import Background from './Background.svelte';
	import LoadingScreen from './LoadingScreen.svelte';
	import BoardFrame from './BoardFrame.svelte';
	import Mascot from './Mascot.svelte';
	import Board from './Board.svelte';
	import ReelDust from './ReelDust.svelte';
	import EntryReveal from './EntryReveal.svelte';
	import ScatterBurst from './ScatterBurst.svelte';
	import BanditCollect from './BanditCollect.svelte';
	import BanditMeter from './BanditMeter.svelte';
	import Anticipations from './Anticipations.svelte';
	import WinWays from './WinWays.svelte';
	import Win from './Win.svelte';
	import FreeSpinIntro from './FreeSpinIntro.svelte';
	import FreeSpinCounter from './FreeSpinCounter.svelte';
	import FreeSpinOutro from './FreeSpinOutro.svelte';
	import Transition from './Transition.svelte';
	import SignalScene from './SignalScene.svelte';

	const context = getContext();

	// Where the top-right wordmark is drawn (landscape, 760px and wider) it is the
	// game's only name on screen; elsewhere the small one beside the clock is.
	const wideHeader = $derived(
		context.stateLayoutDerived.layoutType() !== 'portrait' && context.stateLayoutDerived.canvasSizes().width >= 760,
	);
	const headerLogoW = $derived(Math.round(Math.min(260, Math.max(200, context.stateLayoutDerived.canvasSizes().width * 0.2))));

	// A touch of depth-of-field on the scene so the reels read as the subject.
	// Screenprint backgrounds are flat colour masses, so the blur stays light;
	// one filter, eased over the same second the plates crossfade.
	const BLUR_BASE = 0.6;
	const BLUR_FEATURE = 1.0;
	const blur = new BlurFilter({ strength: BLUR_BASE, quality: 3 });
	const backgroundBlur = [blur];
	const blurTarget = $derived(context.stateGame.gameType === 'freegame' ? BLUR_FEATURE : BLUR_BASE);
	const blurTween = new Tween(BLUR_BASE, { duration: SECOND, easing: cubicInOut });
	$effect(() => {
		blurTween.set(blurTarget);
	});
	$effect(() => {
		blur.strength = blurTween.current;
	});

	onMount(() => {
		context.stateLayout.showLoadingScreen = true;
	});

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
	<SignalScene>

	<Container>
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

		<Container>

		<MainContainer>
			<!-- Before the frame, so if a narrow layout ever brings the two close
			     the housing is the thing that stays in front. -->
			<Mascot />
			<BoardFrame />
		</MainContainer>

		<MainContainer>
			<Board />
			<ReelDust />
			<BanditCollect />
			<Anticipations />
			<ScatterBurst />
			<WinWays />
		</MainContainer>

		</Container>

		<EntryReveal />

		<UI>
			{#snippet gameName()}
				<!-- fixed-size text: in a 400×225 pop-out it ran down onto the board
				     frame, so it shrinks with the window below 450px tall -->
				<Container scale={Math.max(0.55, Math.min(1, context.stateLayoutDerived.canvasSizes().height / 450))}>
					<!-- one name on screen: the small wordmark only where the top-right one is not drawn -->
					<GameNameClock name="SUMO MONKEY" showLogo={!wideHeader} />
				</Container>
			{/snippet}
			{#snippet logo()}
				<!-- The same name again, top right. Not in portrait: on a phone's
				     width it ran into the clock-and-name on the left and the two
				     printed over each other as one unreadable line. -->
				<!-- ...nor in a small pop-out window: both names are fixed-size text,
				     and below ~760px they ran together as "SUMO MONKEYSUMO MONKEY"
				     (Stake flagged the same on Deadwood Express, 2026-10-04). The
				     clock-and-name on the left still says it. -->
				<!-- ...nor behind an open modal: the modal's close button sits in the
				     same corner and cut the name off as "SUMO MONK×". -->
				<!-- ...and it is now the only wordmark on a wide screen (the one beside
				     the clock is dropped there, UI check 2026-11-07 U2), so it grows with
				     the window from the old 200×50 up to 260×65 on 1300px and wider. -->
				{#if wideHeader && !stateModal.modal}
					<Sprite key="sumoLogoHeader" anchor={{ x: 1, y: 0 }} width={headerLogoW} height={headerLogoW / 4} />
				{/if}
			{/snippet}
		</UI>
		<BarMessage />
		<Win />
		<FreeSpinIntro />
		<FreeSpinCounter />
		<BanditMeter />
		<FreeSpinOutro />
		<Transition />
	{/if}
	</SignalScene>
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


