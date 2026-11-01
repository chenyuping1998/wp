<script lang="ts">
	import { onDestroy } from 'svelte';
	import { getContextParent } from 'pixi-svelte';
	import type {Texture} from 'pixi.js';
	import {getContext} from '../game/context';
	import {BOARD_SIZES} from '../game/constants';
	import {createBoardFrameScene} from '../game/boardFrameScene';
	const context=getContext(),parent=getContextParent();let scene=$state.raw<ReturnType<typeof createBoardFrameScene>>();let disposed=false;
	$effect(()=>{const a=context.stateApp.loadedAssets;if(disposed||scene||!a?.mgFrameCapital||!a.mgFrameLintel||!a.mgFrameColumn||!a.mgLogo)return;
		scene=createBoardFrameScene({capital:a.mgFrameCapital as Texture,lintel:a.mgFrameLintel as Texture,column:a.mgFrameColumn as Texture,logo:a.mgLogo as Texture},BOARD_SIZES.width,BOARD_SIZES.height,context.stateLayoutDerived.layoutType()==='portrait');parent.parent.addChild(scene.root);
	});
	$effect(()=>{scene?.setPortrait(context.stateLayoutDerived.layoutType()==='portrait');});
	onDestroy(()=>{disposed=true;scene?.destroy();scene=undefined;});
</script>
