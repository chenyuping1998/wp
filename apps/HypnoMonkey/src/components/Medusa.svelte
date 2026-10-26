<script lang="ts" module>
	import type { MedusaAnimation } from '../game/animationTimeline';
	export type MedusaPose = 'idle'|'peek'|'gaze'|'smug'|'annoyed'|'shock'|'laugh';
	export type EmitterEventMedusa =
		| {type:'medusaPose';pose:MedusaPose;holdMs?:number}
		| {type:'medusaAction';animation:MedusaAnimation;turbo?:boolean;holdMs?:number;releaseMs?:number};
	/** Board coordinates, registered to the painted rig's eye marker. */
	export const medusaEyes=(portrait:boolean,boardWidth:number,boardHeight:number)=>portrait?{x:boardWidth-70,y:-90}:{x:boardWidth+175,y:boardHeight*.28};
</script>

<script lang="ts">
	import { getContext } from '../game/context';
	import { BOARD_SIZES } from '../game/constants';
	import { medusaAnimations } from '../game/animationTimeline';
	import BoardContainer from './BoardContainer.svelte';
	import MedusaRigView from './MedusaRigView.svelte';
	const context=getContext();
	const portrait=$derived(context.stateLayoutDerived.layoutType()==='portrait');
	const eyes=$derived(medusaEyes(portrait,BOARD_SIZES.width,BOARD_SIZES.height));
	let token=0;
	let action=$state<{name:string;token:number;hold?:boolean;rate?:number}>({name:'rest',token:0});
	context.eventEmitter.subscribeOnMount({
		medusaAction:({animation,holdMs,releaseMs})=>{
			let rate=1;
			const clip=medusaAnimations[animation];
			if(releaseMs&&'releaseAtMs' in clip)rate=clip.releaseAtMs/releaseMs;
			if(animation==='gaze_dud'&&holdMs)rate=medusaAnimations.gaze_dud.durationMs/Math.max(120,holdMs);
			action={name:animation,token:++token,hold:animation==='win_big'||animation==='win_max'||animation==='fg_end',rate};
		},
		medusaPose:({pose})=>{
			const names:Record<MedusaPose,string>={idle:'rest',peek:'gaze',gaze:'gaze',smug:'react_small',annoyed:'gaze_dud',shock:'fg_trigger',laugh:'win_big'};
			action={name:names[pose],token:++token,hold:pose==='laugh'};
		},
	});
</script>

<BoardContainer><MedusaRigView {portrait} {eyes} figureHeight={BOARD_SIZES.height*.98} {action}/></BoardContainer>
