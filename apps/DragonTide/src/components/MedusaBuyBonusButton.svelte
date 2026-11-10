<script lang="ts">
	import { onDestroy } from 'svelte';
	import { Button,type ButtonProps } from 'components-pixi';
	import { Container,Sprite,Text } from 'pixi-svelte';
	import { stateModal,stateBet,stateBetDerived } from 'state-shared';
	import { i18nDerived } from '../../../../packages/components-ui-pixi/src/i18n/i18nDerived';
	import { getContext } from '../game/context';
	import { GAME_FONT, TITLE_FONT,GAME_FONT_WEIGHT } from '../game/fonts';
	import geometry from '../game/artGeometry.json';
	const props:Partial<Omit<ButtonProps,'children'>>=$props();const context=getContext();
	// the palace gate (buybonus.png, 640 square): drawn a little wider than the button box,
	// pressed and hovered only inside its own outline (polygon measured on the art)
	const sizes={width:135,height:135},plate=170;
	const well=geometry.buyBonus.well,outline=geometry.buyBonus.hit;
	const disabled=$derived(!context.stateXstateDerived.isIdle());
	const active=$derived(stateBetDerived.activeBetMode()?.type==='activate');
	let pop=$state(0),shine=$state(0),hovered=$state(false),raf=0;
	const hitArea={contains:(x:number,y:number)=>{
		const u=(x-sizes.width/2)/plate+.5,v=(y-sizes.height/2)/plate+.5;
		let inside=false;
		for(let i=0,j=outline.length-1;i<outline.length;j=i++){const a=outline[i],b=outline[j];if((a[1]>v)!==(b[1]>v)&&u<(b[0]-a[0])*(v-a[1])/(b[1]-a[1])+a[0])inside=!inside;}return inside;
	}};
	function hover(value:boolean){
		hovered=value&&!disabled;
		if(!value||disabled)return;context.eventEmitter.broadcast({type:'soundOnce',name:'sfx_buybonus_hover'});
		cancelAnimationFrame(raf);const start=performance.now();const tick=(now:number)=>{const t=(now-start)/650;pop=t<.25?1-(1-t/.25)**3:t<1?(1-(t-.25)/.75)**3:0;shine=t>.15&&t<.65?Math.sin((t-.15)/.5*Math.PI):0;if(t<1)raf=requestAnimationFrame(tick);};raf=requestAnimationFrame(tick);
	}
	function press(){context.eventEmitter.broadcast({type:'soundOnce',name:'sfx_btn_general'});if(active)stateBet.activeBetModeKey='BASE';else stateModal.modal={name:'buyBonus'};}
	onDestroy(()=>cancelAnimationFrame(raf));
</script>
<Button {...props} {sizes} {disabled} {hitArea} onpress={press} onhover={hover}>
	{#snippet children({center})}
		<Container {...center} scale={1+.06*pop}>
			<Sprite key={hovered&&!disabled?'mgUiBuyBonusLit':'mgUiBuyBonus'} anchor={.5} width={plate} height={plate} alpha={disabled?.65:1}/>
			{#if shine>0}<Sprite key="fxStreak" anchor={.5} x={-plate*.015} y={-plate*.2} width={plate*.27} height={plate*.025} rotation={-.25} alpha={shine*.8} blendMode="add"/>{/if}
		</Container>
		<!-- on the gate's plain jade plaque: cream lettering inked in deep jade -->
		<Text x={center.x+plate*(well.x-.5)} y={center.y+plate*(well.y-.5)} anchor={.5} text={active?i18nDerived.disable():i18nDerived.buyBonus()} alpha={disabled?.6:1} style={{fontFamily:TITLE_FONT,fontWeight:GAME_FONT_WEIGHT,fontSize:16,lineHeight:17,wordWrap:true,wordWrapWidth:plate*well.w*.9,align:'center',fill:0xfff2d6,stroke:{color:0x16302d,width:2.5}}}/>
	{/snippet}
</Button>
