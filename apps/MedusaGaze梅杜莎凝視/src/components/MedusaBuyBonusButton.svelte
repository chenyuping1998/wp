<script lang="ts">
	import { onDestroy } from 'svelte';
	import { Button,type ButtonProps } from 'components-pixi';
	import { Container,Sprite,Text } from 'pixi-svelte';
	import { stateModal,stateBet,stateBetDerived } from 'state-shared';
	import { i18nDerived } from '../../../../packages/components-ui-pixi/src/i18n/i18nDerived';
	import { getContext } from '../game/context';
	import { GAME_FONT,GAME_FONT_WEIGHT } from '../game/fonts';
	const props:Partial<Omit<ButtonProps,'children'>>=$props();const context=getContext();
	const sizes={width:135,height:135},plate=146;
	const disabled=$derived(!context.stateXstateDerived.isIdle());
	const active=$derived(stateBetDerived.activeBetMode()?.type==='activate');
	let pop=$state(0),shine=$state(0),raf=0;
	const hitArea={contains:(x:number,y:number)=>{
		const u=(x-sizes.width/2)/plate+.5,v=(y-sizes.height/2)/plate+.5;
		const points=[[.5,.04],[.90,.20],[.96,.42],[.90,.71],[.5,.96],[.10,.71],[.04,.42],[.10,.20]];let inside=false;
		for(let i=0,j=points.length-1;i<points.length;j=i++){const a=points[i],b=points[j];if((a[1]>v)!==(b[1]>v)&&u<(b[0]-a[0])*(v-a[1])/(b[1]-a[1])+a[0])inside=!inside;}return inside;
	}};
	function hover(value:boolean){
		if(!value||disabled)return;context.eventEmitter.broadcast({type:'soundOnce',name:'sfx_buybonus_hover'});
		cancelAnimationFrame(raf);const start=performance.now();const tick=(now:number)=>{const t=(now-start)/650;pop=t<.25?1-(1-t/.25)**3:t<1?(1-(t-.25)/.75)**3:0;shine=t>.15&&t<.65?Math.sin((t-.15)/.5*Math.PI):0;if(t<1)raf=requestAnimationFrame(tick);};raf=requestAnimationFrame(tick);
	}
	function press(){context.eventEmitter.broadcast({type:'soundOnce',name:'sfx_btn_general'});if(active)stateBet.activeBetModeKey='BASE';else stateModal.modal={name:'buyBonus'};}
	onDestroy(()=>cancelAnimationFrame(raf));
</script>
<Button {...props} {sizes} {disabled} {hitArea} onpress={press} onhover={hover}>
	{#snippet children({center})}
		<Container {...center} scale={1+.06*pop}>
			<Sprite key="mgUiBuyBonus" anchor={.5} width={plate} height={plate} tint={disabled?0x8e9695:0xffffff}/>
			{#if shine>0}<Sprite key="fxStreak" anchor={.5} x={-plate*.015} y={-plate*.22} width={plate*.27} height={plate*.025} rotation={-.25} alpha={shine*.8} blendMode="add"/>{/if}
			<Text x={0} y={plate*.205} anchor={.5} text={active?i18nDerived.disable():i18nDerived.buyBonus()} alpha={disabled?.6:1} style={{fontFamily:GAME_FONT,fontWeight:GAME_FONT_WEIGHT,fontSize:11.6,lineHeight:13.0,wordWrap:true,wordWrapWidth:70,align:'center',fill:0x102f36}}/>
		</Container>
	{/snippet}
</Button>
