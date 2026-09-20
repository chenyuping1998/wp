<script lang="ts">
import { Sprite, Rectangle } from 'pixi-svelte';
import { getContext } from '../game/context';
const context = getContext();
const size = $derived(context.stateLayoutDerived.canvasSizes());
</script>
<Rectangle {...size} backgroundColor={0x071817}/>
<Sprite key={context.stateGame.gameType === 'freegame' ? 'dwBackgroundFeature' : 'dwBackground'} {...size}/>
