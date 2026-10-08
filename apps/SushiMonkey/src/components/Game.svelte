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
				<GameNameClock name="SUSHI MONKEY" />
			{/snippet}
			{#snippet logo()}
				<!-- The same name again, top right. Not in portrait: on a phone's
				     width it ran into the clock-and-name on the left and the two
				     printed over each other as one unreadable line. -->
				<!-- ...nor in a small pop-out window: both names are fixed-size text,
				     and below ~760px they ran together as "SUSHI MONKEYSUSHI MONKEY"
				     (Stake flagged the same on Deadwood Express, 2026-10-04). The
				     clock-and-name on the left still says it. -->
				{#if context.stateLayoutDerived.layoutType() !== 'portrait' && context.stateLayoutDerived.canvasSizes().width >= 760}
					<Text
						anchor={{ x: 1, y: 0 }}
						text="SUSHI MONKEY"
						style={{
							fontFamily: GAME_FONT,
							fontSize: REM * 1.5,
							fontWeight: GAME_FONT_WEIGHT,
							lineHeight: REM * 2,
							// ink on a paper rim: white was lost on the cream sky
							fill: 0x1e1b1a,
							stroke: { color: 0xefeadc, width: 5, join: 'round' },
						}}
					/>
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


