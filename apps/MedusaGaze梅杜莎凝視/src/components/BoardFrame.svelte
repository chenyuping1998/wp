<script lang="ts" module>
	export type EmitterEventBoardFrame =
		| {type:'boardFrameGlowShow'} | {type:'boardFrameGlowHide'} | {type:'boardFrameImpact';strength?:number};
</script>
<script lang="ts">
	import { getContext } from '../game/context';
	import BoardContainer from './BoardContainer.svelte';
	import BoardFrameArt from './BoardFrameArt.svelte';
	const context=getContext();
	// Compatibility contracts remain; prize art owns the anticipation/impact.
	context.eventEmitter.subscribeOnMount({boardFrameGlowShow:()=>{},boardFrameGlowHide:()=>{},boardFrameImpact:()=>{}});
</script>
<BoardContainer><BoardFrameArt/></BoardContainer>
