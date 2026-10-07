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
	import BoardIdle from './BoardIdle.svelte';
	import Board from './Board.svelte';
	import ReelDust from './ReelDust.svelte';
	import EntryReveal from './EntryReveal.svelte';
	import HitStop from './HitStop.svelte';
	import ScatterBurst from './ScatterBurst.svelte';
	import HeldTablets from './HeldTablets.svelte';
	import MysteryReveal from './MysteryReveal.svelte';
	import StickyPrizes from './StickyPrizes.svelte';
	import Anticipations from './Anticipations.svelte';
	import WinLines from './WinLines.svelte';
	import ScatterLand from './ScatterLand.svelte';
	import MultiplierRoll from './MultiplierRoll.svelte';
	import MysteryOracle from './MysteryOracle.svelte';
	import Win from './Win.svelte';
	import FreeSpinIntro from './FreeSpinIntro.svelte';
	import FreeSpinCounter from './FreeSpinCounter.svelte';
	import FreeSpinOutro from './FreeSpinOutro.svelte';
	import Transition from './Transition.svelte';
	import TombRockfall from './TombRockfall.svelte';
	import { tombQuake, quakeShake } from '../game/tombQuake.svelte';

	const context = getContext();

	// The tomb quake's camera: offset and zoomed about the canvas centre. The
	// scene is wrapped in it twice, background and board, because the loading
	// screen sits between them in the tree — both read the same numbers, so they
	// move as one. The UI bar is NOT in it: the hall shakes, the controls do not.
	// Same arrangement as Go Boomana's cave quake, which this is ported from.
	const quakeCamera = $derived.by(() => {
		const { width, height } = context.stateLayoutDerived.canvasSizes();
		const shake = quakeShake(tombQuake.clock, height);
		return {
			pivot: { x: width / 2, y: height / 2 },
			x: width / 2 + shake.x,
			y: height / 2 + shake.y,
			scale: shake.zoom,
		};
	});

	// soft depth-of-field on the jungle scene so the reels read as the subject
	// 0.7, was 4 (2026-09-27): 4 smeared the painted plates — "why is the
	// background always blurry, it cannot be as sharp as Deadwood". The range
	// asked for is 0.6-1, picked per game by what sits beside the board:
	// a dark hall behind the board, but the feature plate's orange door glow
	// sits right behind it — a little more than the minimum.
	const backgroundBlur = [new BlurFilter({ strength: 0.7, quality: 3 })];

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
		<!-- stone and sand falling in the far dark, behind the reels -->
		<TombRockfall layer="back" />

		<MainContainer>
			<!-- Before the frame, so if a narrow layout ever brings the two close
			     the housing is the thing that stays in front. -->
			<Mascot />
			<BoardFrame />
			<!-- no picture of its own: picks which symbol does its idle act -->
			<BoardIdle />
		</MainContainer>

		<MainContainer>
			<Board />
			<ReelDust />
			<!--
				Before MysteryReveal, so a tablet cracking open draws over the held
				overlay rather than under it. They never overlap in practice — the
				overlay only draws cells on reels still in motion and the crack plays
				once everything has stopped — but the order is the one that stays
				right if either of those ever changes.
			-->
			<HeldTablets />
			<MysteryReveal />
			<!-- over the held cells: the wheel has to hide the value it is drawing to -->
			<MultiplierRoll />
			<!-- the run's seal, read once before the free spins that pay off whatever it names -->
			<MysteryOracle />
			<StickyPrizes />
			<!-- under the anticipation columns: a Scatter that has landed keeps a hold -->
			<ScatterLand />
			<Anticipations />
			<ScatterBurst />
			<WinLines />
		</MainContainer>

		<!-- and the few that come down in front of it -->
		<TombRockfall layer="front" />
		</Container>

		<EntryReveal />
		<HitStop />

		<UI>
			{#snippet gameName()}
				<UiGameName name="GO BANANUBIS" />
			{/snippet}
			{#snippet logo()}
				<Text
					anchor={{ x: 1, y: 0 }}
					text="GO BANANUBIS"
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
