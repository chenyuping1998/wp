<script lang="ts">
	import '../game/gpuAddBlend';
	import { onMount } from 'svelte';

	import { EnablePixiExtension } from 'components-pixi';
	import { EnableHotkey } from 'components-shared';
	import { MainContainer } from 'components-layout';
	import { App, Container } from 'pixi-svelte';
	import { stateModal } from 'state-shared';

	import { UI, UiGameName } from 'components-ui-pixi';
	import { GameVersion } from 'components-ui-html';
	import Modals from './ui/Modals.svelte';

	import { getContext } from '../game/context';
	// side-effect import: paints the shared bet bar in this game's palette
	import '../game/uiTheme';
	import EnableSound from './EnableSound.svelte';
	import EnableGameActor from './EnableGameActor.svelte';
	import ResumeBet from './ResumeBet.svelte';
	import Sound from './Sound.svelte';
	import BetLabelDim from './BetLabelDim.svelte';
	import BarMessage from './BarMessage.svelte';
	import Background from './Background.svelte';
	import LoadingScreen from './LoadingScreen.svelte';
	import BoardFrame from './BoardFrame.svelte';
	import Board from './Board.svelte';
import Territory from './Territory.svelte';
import TerritoryTags from './TerritoryTags.svelte';
import DevControls from './DevControls.svelte';
import Character from './Character.svelte';
	import EntryReveal from './EntryReveal.svelte';
	import ScatterBurst from './ScatterBurst.svelte';
	import TumbleLayer from './TumbleLayer.svelte';
	import Anticipations from './Anticipations.svelte';
	import ScatterWins from './ScatterWins.svelte';
	import Win from './Win.svelte';
	import FreeSpinIntro from './FreeSpinIntro.svelte';
	import FreeSpinCounter from './FreeSpinCounter.svelte';
	import FreeSpinOutro from './FreeSpinOutro.svelte';
	import ReplayIntro from './ReplayIntro.svelte';
	import Transition from './Transition.svelte';

	const context = getContext();


	onMount(() => (context.stateLayout.showLoadingScreen = true));

	context.eventEmitter.subscribeOnMount({
		buyBonusConfirm: () => {
			context.eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_buybonus_confirm' });
			stateModal.modal = { name: 'buyBonusConfirm' };
		},
	});
</script>

<App>
	<EnableSound />
	<EnableHotkey />
	<EnableGameActor />
	<EnablePixiExtension />

	<!-- Scene owns fixed architecture and three restrained background actions. -->
	<Background />

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
		<BetLabelDim />
		<BarMessage />

		<MainContainer>
			<BoardFrame />
		</MainContainer>

		<MainContainer>
			<!-- The original character stands beside the board, behind the foreground effects. -->
			<Character />
			<Territory />
			<Board />
			<TumbleLayer />
			<Anticipations />
			<ScatterBurst />
			<TerritoryTags />
			<ScatterWins />
			<!-- after the win marks: the orbs fly over whatever is left on the board -->
			
		</MainContainer>

		<EntryReveal />

		<UI>
			{#snippet gameName()}
				<Container scale={0.62}><UiGameName name="PURRFIA" /></Container>
			{/snippet}
			{#snippet logo()}
				<!-- The painted wordmark is mounted on the fixed board frame. -->
			{/snippet}
		</UI>
		<Win />
		<FreeSpinIntro />
		<FreeSpinCounter />
		<FreeSpinOutro />

		<!--
			Last, so its dimming layer and its press target sit over everything the
			round draws. Inert unless ?replay=true.
		-->
		<ReplayIntro />
		<Transition />
	{/if}
</App>
{#if import.meta.env.DEV}<DevControls />{/if}


<Modals>
	{#snippet version()}
		<GameVersion version="0.0.0" />
	{/snippet}
</Modals>
