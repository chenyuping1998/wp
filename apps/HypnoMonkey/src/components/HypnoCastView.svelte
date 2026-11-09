<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { getContextParent } from 'pixi-svelte';
	import { Graphics, type Texture, type Ticker } from 'pixi.js';
	import { getContext } from '../game/context';
	import { createHypnoCastScene } from '../game/hypnoCastScene';
	import assistantRig from '../game/hypnoAssistantData.json';
	import assistantAtlas from '../game/hypnoAssistantAtlas.json';
	import { medusaAnchors, publishMedusaAnchors } from '../game/medusaAnchors.svelte';
	const props=$props<{mode?:'mg'|'fg';portrait:boolean;eyes:{x:number;y:number};scale:number;clipY:number;action:{name:string;token:number;hold?:boolean;rate?:number}}>();
	const context=getContext(),parent=getContextParent();
	let scene=$state.raw<ReturnType<typeof createHypnoCastScene>>();
	let ticker:Ticker|undefined,last=0,disposed=false,media:MediaQueryList|undefined,removeInspection:(()=>void)|undefined;
	const tick=()=>{const now=performance.now();if(!last||document.hidden){last=now;return;}const dt=(now-last)/1000;last=now;scene?.update(dt);if(scene)publishMedusaAnchors(scene.getGazeAnchors());};
	$effect(()=>{
		const texture=context.stateApp.loadedAssets?.[props.mode==='fg'?'mgHypnoAssistantAtlas':'mgHypnoCastAtlas'] as Texture|undefined;
		const app=context.stateApp.pixiApplication;
		if(disposed||scene||!texture||!app)return;
		scene=createHypnoCastScene(texture,props.mode==='fg'?{rig:assistantRig as unknown as NonNullable<Parameters<typeof createHypnoCastScene>[1]>['rig'],atlas:assistantAtlas,facePoints:[{x:443,y:262},{x:537,y:240}],releaseBone:'watch'}:undefined);parent.parent.addChild(scene.root);ticker=app.ticker;ticker.add(tick);
		if(media)scene.setReducedMotion(media.matches);
		if(import.meta.env.DEV&&new URLSearchParams(location.search).has('castqa')) {
			const current=scene;void import('../dev/castControls').then(({installCastControls})=>{if(!disposed)removeInspection=installCastControls(current,props.mode);});
		}
	});
	// Placement comes from game/stageLayout.ts (castPlacement): eyes = where the
	// rig's glasses go, scale = root scale, board units. Portrait has no side
	// strip: like Capo Nostra, the whole figure stands above the board's right
	// half with everything below the hips tucked behind the frame (clipY), so
	// hands, hat and monocle still act.
	let clip:Graphics|undefined;
	$effect(()=>{
		if(!scene)return;
		const {scale,eyes}=props;
		// the tail curls up beside the hips and would show as a cut stub
		scene.setHidden(props.portrait?['tail_1','tail_2','tail_3']:[]);
		scene.root.scale.set(scale);scene.root.position.set(eyes.x-scene.setupEyes.x*scale,eyes.y-scene.setupEyes.y*scale);
		if(props.portrait){
			if(!clip){clip=new Graphics();scene.root.parent?.addChild(clip);}
			clip.clear().rect(-4000,-4000,8000,4000+props.clipY).fill(0xffffff);
			clip.visible=true;scene.root.mask=clip;
		}else {scene.root.mask=null;if(clip)clip.visible=false;}
	});
	$effect(()=>{if(!scene)return;const a=props.action;if(a.name==='rest')scene.reset();else scene.play(a.name,a.hold,a.rate);});
	onMount(()=>{media=matchMedia('(prefers-reduced-motion: reduce)');const changed=()=>scene?.setReducedMotion(media!.matches);const visible=()=>{last=0;};changed();media.addEventListener('change',changed);document.addEventListener('visibilitychange',visible);return()=>{media?.removeEventListener('change',changed);document.removeEventListener('visibilitychange',visible);};});
	onDestroy(()=>{disposed=true;clip?.destroy();removeInspection?.();ticker?.remove(tick);scene?.destroy();scene=undefined;medusaAnchors.ready=false;});
</script>
