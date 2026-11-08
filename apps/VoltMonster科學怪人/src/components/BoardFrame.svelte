<script lang="ts" module>
	export type EmitterEventBoardFrame =
		| { type: 'boardFrameGlowShow' }
		| { type: 'boardFrameGlowHide' }
		// something slammed into the frame — kick it and flash the brass
		| { type: 'boardFrameImpact'; strength?: number };
</script>

<script lang="ts">
 import { Sprite } from 'pixi-svelte';
 import { getContext } from '../game/context';
 const context=getContext();
 const board=$derived(context.stateGameDerived.boardLayout());
</script>
<Sprite key="gbFrameBg" anchor={.5} x={board.x} y={board.y} width={board.width*board.scale*1.28} height={board.height*board.scale*1.28} />
<Sprite key="gbFrameEdge" anchor={.5} x={board.x} y={board.y} width={board.width*board.scale*1.28} height={board.height*board.scale*1.28} />
