<script lang="ts">
import { MainContainer } from 'components-layout';
import { getContext } from '../game/context';
import CastFigureMesh from './CastFigureMesh.svelte';
const c=getContext();
const std=$derived(c.stateLayoutDerived.mainLayoutStandard());
const visible=$derived(c.stateLayoutDerived.canvasSizes().width/c.stateLayoutDerived.canvasSizes().height>1.25 && !c.stateGame.featureSplashShow);
</script>
{#if visible}
<MainContainer standard><CastFigureMesh who="guy" x={std.width*.94} topY={std.height*.15} height={std.height*1.02} groundY={std.height}/></MainContainer>
{/if}
