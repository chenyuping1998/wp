<script lang="ts">
import { MainContainer } from 'components-layout';
import { getContext } from '../game/context';
import CastFigureMesh from './CastFigureMesh.svelte';
const c=getContext();
const std=$derived(c.stateLayoutDerived.mainLayoutStandard());
const who=$derived<'guy'|'girl'>(c.stateGame.gameType==='freegame'?'girl':'guy');
const visible=$derived(c.stateLayoutDerived.canvasSizes().width/c.stateLayoutDerived.canvasSizes().height>1.25 && !c.stateGame.featureSplashShow);
</script>
{#if visible}
<!-- The conductor in the base game, the veiled passenger in free spins (the
     H2 symbol's full-body figure, 2026-09-26). {#key} remounts the mesh so the
     rig and texture are swapped rather than one figure's rig driving the other's art. -->
{#key who}
<MainContainer standard><CastFigureMesh {who} x={std.width*.94} topY={std.height*.15} height={std.height*1.02} groundY={std.height}/></MainContainer>
{/key}
{/if}
