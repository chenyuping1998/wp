<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { getContextParent } from 'pixi-svelte';
	import type { Texture, Ticker } from 'pixi.js';
	import { getContext } from '../game/context';
	import { createMedusaRigScene } from '../game/medusaRigScene';
	import { medusaAnchors,publishMedusaAnchors } from '../game/medusaAnchors.svelte';

	type Action = { name: string; token: number; hold?: boolean; rate?: number };
	const props = $props<{ portrait: boolean; eyes: {x:number;y:number}; figureHeight: number; action: Action }>();
	const context=getContext(),parent=getContextParent();
	let scene=$state.raw<ReturnType<typeof createMedusaRigScene>>();
	let ticker:Ticker|undefined, last=0, disposed=false, media:MediaQueryList|undefined;
	const tick=()=>{const now=performance.now();if(!last||document.hidden){last=now;return;}const dt=(now-last)/1000;last=now;scene?.update(dt);if(scene)publishMedusaAnchors(scene.getGazeAnchors());};
	$effect(()=>{
		const texture=context.stateApp.loadedAssets?.mgCastAtlas as Texture|undefined;
		const app=context.stateApp.pixiApplication;
		if(disposed||scene||!texture||!app)return;
		scene=createMedusaRigScene({'medusa.png':texture},index=>{if(index===1)context.eventEmitter.broadcast({type:'soundOnce',name:'sfx_snake_yawn'});});
		parent.parent.addChild(scene.root);ticker=app.ticker;ticker.add(tick);
		if(media)scene.setReducedMotion(media.matches);
	});
	$effect(()=>{
		if(!scene)return;scene.setPortrait(props.portrait);
		const scale=props.portrait?150/830:props.figureHeight/1960;
		scene.root.scale.set(scale);scene.root.position.set(props.eyes.x+37*scale,props.eyes.y+1520*scale);
	});
	$effect(()=>scene?.setFreegame(context.stateGame.gameType==='freegame'));
	$effect(()=>{if(!scene)return;const action=props.action;if(action.name==='rest')scene.reset();else scene.play(action.name,action.hold,action.rate);});
	onMount(()=>{
		media=matchMedia('(prefers-reduced-motion: reduce)');const preference=()=>scene?.setReducedMotion(media!.matches);const visibility=()=>{last=0;};
		preference();media.addEventListener('change',preference);document.addEventListener('visibilitychange',visibility);
		return()=>{media?.removeEventListener('change',preference);document.removeEventListener('visibilitychange',visibility);};
	});
	onDestroy(()=>{disposed=true;ticker?.remove(tick);scene?.destroy();scene=undefined;medusaAnchors.ready=false;});
</script>
