<script lang="ts">
	import { onMount } from 'svelte';
	import type { Snippet } from 'svelte';
	import { Container, Sprite } from 'pixi-svelte';
	type Props = { tier:string; width:number; height:number; closing:boolean; children:Snippet };
	const props:Props=$props();
	const tiers:Record<string,{key:string;intensity:number;props:string[]}>={
		big:{key:'v8WinBig',intensity:1,props:['gbS']},
		superwin:{key:'v8WinSuper',intensity:1.12,props:['gbS','gbFxV2_3']},
		mega:{key:'v8WinMega',intensity:1.3,props:['gbP','gbFxV2_4','gbFxV2_5']},
		epic:{key:'v8WinEpic',intensity:1.48,props:['gbFxV2_9','gbFxV2_10','gbFxV2_6','gbFxV2_7']},
		max:{key:'v8WinMax',intensity:1.65,props:['gbFxV2_4','gbFxV2_5','gbFxV2_7','gbFxV2_8']},
	};
	const spec=$derived(tiers[props.tier]??tiers.big);
	let time=$state(0), now=$state(0), exitAt=$state(-1), born=$state(0),previous=$state<string|null>(null),changedAt=$state(0);
	let lastTier='';
	$effect(()=>{const next=props.tier;if(next!==lastTier){previous=lastTier||null;lastTier=next;born=performance.now();changedAt=born;}});
	$effect(()=>{ exitAt=props.closing?performance.now():-1; });
	const clamp=(n:number)=>Math.max(0,Math.min(1,n));
	const backOut=(p:number)=>1+2.6*(p-1)**3+1.6*(p-1)**2;
	const backIn=(p:number)=>p*p*(2.6*p-1.6);
	const pose=$derived.by(()=>{
		const k=backOut(clamp(time/420));
		const settle=time<340?0:clamp((time-340)/300);
		const squash=settle===0?0:settle<.27?Math.sin(settle/.27*Math.PI/2):Math.cos((settle-.27)/.73*Math.PI/2);
		const breath=time>640?1+.015*Math.sin((time-640)/2000*Math.PI*2):1;
		const out=exitAt<0?0:clamp((now-exitAt)/360);
		return {y:props.height*1.2*(1-k)-props.height*1.2*backIn(out),
			x:(1+.12*squash)*breath,sy:(1-.14*squash)*breath,alpha:1-out};
	});
	const flying=(i:number)=>{
		const p=clamp((time-70-i*40)/430), ease=backOut(p), side=i%2?-1:1;
		const endX=props.width*(.32+(i>1?.10:0))*side;
		const endY=props.height*(i>1?.27:-.23);
		const swing=p<1?0:Math.sin((time-500-i*40)/220*Math.PI*2)*.07*Math.exp(-(time-500-i*40)/500);
		const idle=.052*Math.sin(time/2000*Math.PI*2+i*.9);
		const out=exitAt<0?0:clamp((now-exitAt+i*20)/250);
		return {x:endX*ease,y:endY*ease-props.height*.24*Math.sin(p*Math.PI)-out*props.height,
			rotation:side*.22*p+swing+idle,scale:Math.max(0,.35+.65*p)*(1-out),alpha:clamp(p*5)*(1-out)};
	};
	onMount(()=>{
		born=performance.now();let raf=0;
		const tick=(stamp:number)=>{now=stamp;time=stamp-born;raf=requestAnimationFrame(tick);};
		raf=requestAnimationFrame(tick);return()=>cancelAnimationFrame(raf);
	});
</script>

{#if previous&&now-changedAt<160}
	<Container scale={1-.15*clamp((now-changedAt)/160)} alpha={1-clamp((now-changedAt)/160)}><Sprite key={tiers[previous].key} anchor={.5} width={props.width} height={props.height}/></Container>
{/if}
<Container y={pose.y} scale={{x:pose.x,y:pose.sy}} alpha={pose.alpha}>
	{#if spec.intensity>=1.3}<Sprite key="gbWinBurstV2" anchor={.5} rotation={time/1000*Math.PI/15} width={props.width*spec.intensity*.83} height={props.width*spec.intensity*.83} alpha={.55}/>{/if}
	<Sprite key={spec.key} anchor={.5} width={props.width} height={props.height}/>
	{#each spec.props as key,i (`${key}-${i}`)}
		{@const p=flying(i)}
		<Container x={p.x} y={p.y} rotation={p.rotation} scale={p.scale} alpha={p.alpha}>
			<Sprite {key} anchor={.5} width={props.width*(key==='gbS'?.17:.14)} height={props.width*(key==='gbS'?.17:.14)}/>
		</Container>
	{/each}
	{@render props.children()}
</Container>
