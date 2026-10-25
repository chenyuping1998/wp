<script lang="ts">
 import {MainContainer} from 'components-layout';import {Sprite} from 'pixi-svelte';
 import FeatureIntro from './FeatureIntro.svelte';import PressToContinue from './PressToContinue.svelte';import {getContext} from '../game/context';
 const props:{onloaded:()=>void}=$props();const context=getContext();
 const layout=$derived(context.stateLayoutDerived.mainLayout());
</script>
{#if context.stateApp.loaded}<FeatureIntro/><PressToContinue onpress={props.onloaded}/>
{:else}<MainContainer><Sprite key="mgLogo" anchor={.5} x={layout.width*.5} y={layout.height*.35} width={Math.min(680,layout.width*.8)} height={Math.min(680,layout.width*.8)*.375}/></MainContainer>{/if}
