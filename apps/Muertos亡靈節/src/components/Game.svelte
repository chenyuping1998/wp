<script lang="ts">
	import '../game/gpuAddBlend';
	import { GAME_FONT, GAME_FONT_WEIGHT } from '../game/fonts';
	import { onMount } from 'svelte';
	import {onDestroy} from 'svelte';
	import {multiplierImpactAt,multiplierImpactProfile} from '../game/scarabPresentation';
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
	// side-effect import: paints the shared bet bar in the game's palette
	import '../game/uiTheme';
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
	import StickyPrizes from './StickyPrizes.svelte';
	import Anticipations from './Anticipations.svelte';
	import WinLines from './WinLines.svelte';
	import FgArcWheel from './FgArcWheel.svelte';
	import RareRoulette from './RareRoulette.svelte';
	import Win from './Win.svelte';
	import FreeSpinIntro from './FreeSpinIntro.svelte';
	import FreeSpinCounter from './FreeSpinCounter.svelte';
	import FreeSpinOutro from './FreeSpinOutro.svelte';
	import Transition from './Transition.svelte';

	const context = getContext();
	let impactAge=$state(-1),impactValue=$state(1),impactRaf=0;
	context.eventEmitter.subscribeOnMount({fgWheelImpact:({value})=>{
		cancelAnimationFrame(impactRaf);impactValue=value;impactAge=0;
		const start=performance.now(),duration=multiplierImpactProfile(value).duration;
		const tick=(now:number)=>{impactAge=now-start;if(impactAge<duration)impactRaf=requestAnimationFrame(tick);else impactAge=-1;};
		impactRaf=requestAnimationFrame(tick);
	}});
	onDestroy(()=>cancelAnimationFrame(impactRaf));

	// The multiplier's arrival kicks the scene; the controls remain stationary.
	const quakeCamera = $derived.by(() => {
		const { width, height } = context.stateLayoutDerived.canvasSizes();
		const hit=multiplierImpactAt(impactValue,impactAge);
		const overscan=1+Math.max(Math.abs(hit.x)/(width/2),Math.abs(hit.y)/(height/2))*1.1;
		return { pivot: { x: width / 2, y: height / 2 }, x: width / 2+hit.x, y: height / 2+hit.y, scale: overscan };
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
	const blur = new BlurFilter({ strength: BLUR_BASE, quality: 3, resolution: 'inherit', antialias: 'inherit' });
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
		<MainContainer>
			<!-- Before the frame, so if a narrow layout ever brings the two close
			     the housing is the thing that stays in front. -->
			<Mascot />
			<BoardFrame />
		</MainContainer>

		<MainContainer>
			<Board />
			<ReelDust />
			<StickyPrizes />
			<Anticipations />
			<ScatterBurst />
			<WinLines />
			<FgArcWheel />
		</MainContainer>

		</Container>

		<EntryReveal />

		<UI>
			{#snippet gameName()}
				<UiGameName name="MUERTOS" />
			{/snippet}
			{#snippet logo()}
				<!-- The same name again, top right. Not in portrait: on a phone's
				     width it ran into the clock-and-name on the left and the two
				     printed over each other as one unreadable line. -->
				{#if context.stateLayoutDerived.layoutType() !== 'portrait'}
					<Text
						anchor={{ x: 1, y: 0 }}
						text="MUERTOS"
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
		<RareRoulette />
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
