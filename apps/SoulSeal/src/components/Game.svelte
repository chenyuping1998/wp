<script lang="ts">
	import { onMount } from 'svelte';

	import { EnablePixiExtension } from 'components-pixi';
	import { EnableHotkey } from 'components-shared';
	import { MainContainer } from 'components-layout';
	import { App, Container, Rectangle, Sprite } from 'pixi-svelte';
	import { stateModal } from 'state-shared';

	import { UI, UiGameName } from 'components-ui-pixi';
	import { GameVersion } from 'components-ui-html';
	import Modals from './ui/Modals.svelte';
	import ReplayIntro from './ui/ReplayIntro.svelte';
	import { stateReplay } from 'state-shared';

	import { getContext } from '../game/context';
	// side-effect import: paints the shared bet bar in the terminal palette
	import '../game/uiTheme';
	import EnableSound from './EnableSound.svelte';
	import EnableGameActor from './EnableGameActor.svelte';
	import ResumeBet from './ResumeBet.svelte';
	import Sound from './Sound.svelte';
	import Background from './Background.svelte';
	import LoadingScreen from './LoadingScreen.svelte';
	import TransitionAnimation from './TransitionAnimation.svelte';
	import BoardFrame from './BoardFrame.svelte';
	import Board from './Board.svelte';
	import ReelDust from './ReelDust.svelte';
	import EntryReveal from './EntryReveal.svelte';
	import Anticipations from './Anticipations.svelte';
	import BoardContainer from './BoardContainer.svelte';
	import ScatterTrigger from './ScatterTrigger.svelte';
	import Collect from './Collect.svelte';
	import WinLines from './WinLines.svelte';
	import CarrierValues from './CarrierValues.svelte';
	import TalismanRail from './TalismanRail.svelte';
	import Win from './Win.svelte';
	import FreeSpinIntro from './FreeSpinIntro.svelte';
	import FreeSpinCounter from './FreeSpinCounter.svelte';
	import RailMilestone from './RailMilestone.svelte';
	import FreeSpinOutro from './FreeSpinOutro.svelte';
	import Transition from './Transition.svelte';
	import TriggerTease from './TriggerTease.svelte';

	const context = getContext();

	// The backdrop is drawn SHARP.
	//
	// It used to sit inside a BlurFilter at strength 4 - a depth-of-field trick to
	// push the reels forward. That was a reasonable call when the backdrop was a
	// generated gradient with nothing in it worth looking at. It stopped being one
	// when a painted night-shrine scene arrived: a moon, a tiled roof, a courtyard
	// wall, all of it smeared into a wash that read as a rendering fault rather
	// than as depth.
	//
	// What the reels are separated from the background by now is the frame - a
	// lit, opaque wooden structure standing in front of it - which is a stronger
	// separation than a blur ever was, and one the player can see the reason for.

	onMount(() => (context.stateLayout.showLoadingScreen = true));

	// The opening transition, owned HERE rather than by the loading screen.
	//
	// It has to outlive the handover. Game shows the loading screen or the game
	// and never both, so a transition mounted inside the loading screen is
	// destroyed by the very swap it is covering - see the note in that file. From
	// here it covers, the swap happens behind it, and it opens onto a game that is
	// already standing.
	let openingTransition = $state(false);

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
		Flat ground under everything, including the loading screen. The loading
		screen paints inside the main-layout box, which does not reach the canvas
		edges on every aspect ratio - without this the game's own backdrop showed
		around it, which is a peek at the game before the game has started.
	-->
	<Rectangle {...context.stateLayoutDerived.canvasSizes()} backgroundColor={0x060b09} />

	{#if context.stateLayout.showLoadingScreen}
		<LoadingScreen
			onstart={() => (openingTransition = true)}
			onloaded={() => (context.stateLayout.showLoadingScreen = false)}
		/>
	{:else}
		<Container>
			<Background />
		</Container>
		<!--
			Corner vignette, at less than half the weight it used to carry.

			It was 0.9, and the comment beside it said what it was for: seating the
			BLURRED scene behind the board. The blur is gone, so the vignette was the
			only thing left obscuring a painted backdrop that is meant to be looked
			at - it took the courtyard corners down to near black and flattened the
			moonlit hills into the frame. At 0.4 it still stops the corners competing
			with the reels without erasing what is in them.
		-->
		<Sprite
			key="fxVignette"
			width={context.stateLayoutDerived.canvasSizes().width}
			height={context.stateLayoutDerived.canvasSizes().height}
			alpha={0.4}
		/>
		<!--
			No gutter smoke.

			IncenseSmoke drew two columns of drifting candle-coloured ribbons in the
			space either side of the board. It was itself a replacement for the
			scaffold's two live price charts, and it inherited their real problem
			along with their geometry: the gutters are where the PAINTED backdrop
			shows, and anything drawn there is drawn over the one part of the scene
			the player can actually see. Two vertical yellow streaks over a courtyard
			wall read as an artefact, not as incense - the scene already has a censer
			in it with smoke coming off it, painted.
		-->

		<ResumeBet />
		<!--
			The reason why <Sound /> is rendered after clicking the loading screen:
			"Autoplay with sound is allowed if: The user has interacted with the domain (click, tap, etc.)."
			Ref: https://developer.chrome.com/blog/autoplay
		-->
		<Sound />

		<MainContainer>
			<BoardFrame />
		</MainContainer>

		<MainContainer>
			<Board />
			<ReelDust />
			<Anticipations />
			<BoardContainer>
				<ScatterTrigger />
				<!-- Both draw against board coordinates: the collect sweeps target
				     individual cells, and the rail sits on the top beam directly
				     above reel 1..5. BoardContainer is not masked, so the rail's
				     negative y is drawn rather than clipped. -->
				<!-- Under Collect: when three carriers pay as a line AND open the
				     gourd, the line is the earlier beat and the sweep draws over it. -->
				<!-- Under the win lines and the collect: both of those are events,
				     and the value on a carrier is a standing fact about the board. -->
				<CarrierValues />
				<WinLines />
				<Collect />
				<TalismanRail />
				<!--
					The trigger tease. Inside BoardContainer because it is drawn in board
					coordinates, and LAST so its additive light is a direct sibling of
					everything it is lighting rather than being buried under it.
				-->
				<TriggerTease />
			</BoardContainer>
		</MainContainer>

		<EntryReveal />

		<UI>
			{#snippet gameName()}
				<UiGameName name="SOUL SEAL" />
			{/snippet}
			{#snippet logo()}
				<!--
					Deliberately empty.

					Every layout draws `gameName` at canvas x=20 and `logo` right-anchored
					at canvas width-20, and the template's games pass the SAME STRING to
					both — so the title is printed twice and the two blocks close on each
					other as the canvas narrows. These are canvas-space text at a fixed
					REM*1.5 (24px, REM is a constant 16), not main-box text, so they do
					not shrink with the layout: the left block is clock + name ≈ 320px and
					the right block ≈ 225px, which collide below about 565px of canvas
					width. Popout S and mobile are both under that, and certification came
					back with a screenshot of "SOUL SEAL" overprinting itself.

					The bug was found on a 15-character title, which is the
					longest in the workspace and so hit the collision first. "SOUL SEAL"
					is 9 characters and would not have triggered it — the fix is kept
					because the latent bug is in the layout, not in any one title.

					Hiding it below a width threshold was the alternative. Printing the
					name once is better: the right-hand copy carried no information the
					left-hand one did not, and a title that appears and disappears with the
					window is its own defect.
				-->
			{/snippet}
		</UI>
		<Win />
		<FreeSpinIntro />
		<FreeSpinCounter />
		<RailMilestone />
		<FreeSpinOutro />
		<Transition />
	{/if}

	<!--
		Outside the branch on purpose: this is the one thing that has to be on
		screen while the two trees are exchanged.
	-->
	{#if openingTransition}
		<TransitionAnimation
			oncover={() => (context.stateLayout.showLoadingScreen = false)}
			oncomplete={() => (openingTransition = false)}
		/>
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
