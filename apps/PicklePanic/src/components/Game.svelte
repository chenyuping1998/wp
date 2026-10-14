<script lang="ts">
	import { onMount } from 'svelte';
	import { Tween } from 'svelte/motion';
	import { cubicInOut } from 'svelte/easing';
	import { SECOND } from 'constants-shared/time';

	import { BlurFilter } from 'pixi.js';
	import { EnablePixiExtension } from 'components-pixi';
	import { EnableHotkey } from 'components-shared';
	import { MainContainer } from 'components-layout';
	import { App, Container, Sprite } from 'pixi-svelte';
	import { stateModal, stateBet } from 'state-shared';

	import { UI } from 'components-ui-pixi';
	import GameNameClock from './GameNameClock.svelte';
	import ScatterDing from './ScatterDing.svelte';
	import PickleLogo from './PickleLogo.svelte';
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
	import TransitionAnimation from './TransitionAnimation.svelte';
	let entryDoors=$state(false);
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

	// A touch of depth-of-field on the scene so the reels read as the subject.
	// Screenprint backgrounds are flat colour masses, so the blur stays light;
	// one filter, eased over the same second the plates crossfade.
	const BLUR_BASE = 0;
	const BLUR_FEATURE = 0;
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
			alpha={0}
		/>
	</Container>

	{#if context.stateLayout.showLoadingScreen}
		<LoadingScreen onstart={()=>entryDoors=true} onloaded={() => (context.stateLayout.showLoadingScreen = false)} />
	{:else}
		<ResumeBet />
		<!--
			The reason why <Sound /> is rendered after clicking the loading screen:
			"Autoplay with sound is allowed if: The user has interacted with the domain (click, tap, etc.)."
			Ref: https://developer.chrome.com/blog/autoplay
		-->

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
				<GameNameClock name="" />
			{/snippet}
			<!-- No logo() snippet: the top-right corner printed "PICKLE PANIC" a
			     second time beside the clock-and-name (review 2026-10-13). It stays
			     empty until the drawn logo from the art request arrives. -->
			{#snippet logo()}<PickleLogo x={-110} y={42} width={220} base={false}/>{/snippet}
		</UI>
		<ScatterDing/>
		<BarMessage />
		<Win />
		<FreeSpinIntro />
		<FreeSpinCounter />
		<BanditMeter />
		<FreeSpinOutro />
		<Transition />
	{/if}
	{#if !context.stateLayout.showLoadingScreen||entryDoors}<Sound/>{/if}
	{#if entryDoors}<TransitionAnimation oncover={()=>context.stateLayout.showLoadingScreen=false} oncomplete={()=>entryDoors=false}/>{/if}
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


