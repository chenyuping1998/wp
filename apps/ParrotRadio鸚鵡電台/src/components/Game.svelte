<script lang="ts">
 import {onMount} from 'svelte';
 import {App,Container} from 'pixi-svelte';
 import {EnablePixiExtension} from 'components-pixi';
 import {EnableHotkey} from 'components-shared';
 import {MainContainer} from 'components-layout';
 import {UI,UiGameName} from 'components-ui-pixi';
 import {GameVersion} from 'components-ui-html';
 import {stateModal} from 'state-shared';
 import {getContext} from '../game/context';
 import '../game/uiTheme';
 import EnableGameActor from './EnableGameActor.svelte';
 import ResumeBet from './ResumeBet.svelte';
 import Sound from './Sound.svelte';
 import BarMessage from './BarMessage.svelte';
 import BetLabelDim from './BetLabelDim.svelte';
 import Background from './Background.svelte';
 import LoadingScreen from './LoadingScreen.svelte';
 import BoardFrame from './BoardFrame.svelte';
 import Board from './Board.svelte';
 import TumbleLayer from './TumbleLayer.svelte';
 import ScatterWins from './ScatterWins.svelte';
 import ParrotFeature from './ParrotFeature.svelte';
 import Character from './Character.svelte';
 import Win from './Win.svelte';
 import FreeSpinIntro from './FreeSpinIntro.svelte';
 import FreeSpinOutro from './FreeSpinOutro.svelte';
 import FreeSpinCounter from './FreeSpinCounter.svelte';
 import ReplayIntro from './ReplayIntro.svelte';
 import Transition from './Transition.svelte';
 import Modals from './ui/Modals.svelte';
 const context=getContext();
 onMount(()=>context.stateLayout.showLoadingScreen=true);
 context.eventEmitter.subscribeOnMount({buyBonusConfirm:()=>{stateModal.modal={name:'buyBonusConfirm'};}});
</script>
<App>
 <EnableHotkey/><EnableGameActor/><EnablePixiExtension/><Background/>
 {#if context.stateLayout.showLoadingScreen}
  <LoadingScreen onloaded={()=>context.stateLayout.showLoadingScreen=false}/>
 {:else}
  <ResumeBet/><Sound/><BetLabelDim/><BarMessage/>
  <MainContainer><Character/><BoardFrame/><Board/><TumbleLayer/><ScatterWins/><ParrotFeature/></MainContainer>
  <UI>{#snippet gameName()}<Container scale={0.62}><UiGameName name="PARROT RADIO"/></Container>{/snippet}{#snippet logo()}{/snippet}</UI>
  <Win/><FreeSpinIntro/><FreeSpinCounter/><FreeSpinOutro/><ReplayIntro/><Transition/>
 {/if}
</App>
<Modals>{#snippet version()}<GameVersion version="0.1.0"/>{/snippet}</Modals>
