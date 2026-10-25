<script lang="ts">
	import { Container, Sprite, Text } from 'pixi-svelte';
	import { MainContainer } from 'components-layout';
	import { onMount } from 'svelte';
	import { getContext } from '../game/context';
	import { CanvasTextMetrics, TextStyle } from 'pixi.js';
	import { GAME_FONT, GAME_FONT_WEIGHT, BODY_FONT, NUMBER_FONT } from '../game/fonts';

	const context = getContext();
	// Measured inside the actual paper silhouette of this theme's 1024x640 master.
 const receipt = { x:690, y:355, width:0.40 };
 const receiptText = '10,000×';
 const receiptSize = (width:number) => {
  const metric=CanvasTextMetrics.measureText(receiptText,new TextStyle({fontFamily:NUMBER_FONT,fontSize:100,fontWeight:'400'}));
  return Math.min(width*.22,width*receipt.width/metric.width*100);
 };
	const layout = $derived(context.stateLayoutDerived.mainLayout());
	const stacked = $derived(layout.width / layout.height < 1.2);
	const logoWidth = $derived(Math.min(layout.width * 0.82, 680));
	const cardW = $derived(stacked ? layout.width * 0.87 : Math.min(layout.width * 0.25, 490));
	const cardH = $derived(stacked ? layout.height * 0.21 : Math.min(layout.height * 0.57, cardW * 1.38));
	let introMs = $state(0);
	onMount(() => {
		const start = performance.now();
		let frame = 0;
		const tick = (now: number) => {
			introMs = Math.min(1100, now - start);
			if (introMs < 1100) frame = requestAnimationFrame(tick);
		};
		frame = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(frame);
	});
	const entryTail = (index: number) => {
		const progress = Math.max(0, Math.min(1, (introMs - index * 105) / 480));
		return (1 - progress) ** 2;
	};
	const panels = [
		{ key: 'v8IntroCollect', title: 'GOLFER', body: 'Each Golfer collects all Balls.' },
		{ key: 'v8IntroSlice', title: 'FREE SPINS', body: '4 / 8 / 12 Golfers: +10 spins.\n10 / J / Q → Balls.' },
		{ key: 'v8IntroReceipt', title: 'MAX WIN', body: 'Up to 10,000× your bet per round.' },
	];
</script>

<MainContainer>
	<Container x={layout.width * 0.5} y={layout.height * (stacked ? 0.115 : 0.15)}>
		<Sprite key="v8LogoBoard" anchor={0.5} width={logoWidth} height={logoWidth * 0.375} />
	</Container>
	{#each panels as panel, i}
		{@const cx = stacked ? layout.width * 0.5 : layout.width * (0.23 + i * 0.27)}
		{@const cy = stacked ? layout.height * (0.35 + i * 0.225) : layout.height * 0.57}
		{@const tail = entryTail(i)}
		<Container x={cx} y={cy - 34 * tail} rotation={(i - 1) * 0.02 * tail} alpha={1 - tail}>
			<Sprite key="v8MenuFrame" anchor={0.5} width={cardW} height={cardH} />
			{@const pw=cardW*(stacked?(i===2?.52:.38):(i===2?.88:.79))}
   {@const sceneX=stacked?-cardW*(i===2?.22:.25):0}
   {@const sceneY=stacked?0:-cardH*.16}
   <Sprite key={panel.key} anchor={.5} x={sceneX} y={sceneY} width={pw} height={pw*.625}/>
   {#if i===2}
    <Text text={receiptText} anchor={.5}
     x={sceneX+pw*(receipt.x/1024-.5)}
     y={sceneY+pw*.625*(receipt.y/640-.5)}
     style={{fontFamily:NUMBER_FONT,fontWeight:'400',fontSize:receiptSize(pw),fill:0x141a22,letterSpacing:0}}/>
   {/if}
			<Text text={panel.title} anchor={0.5}
				x={stacked ? cardW * (i===2?.26:.20) : 0} y={stacked ? -cardH * 0.28 : cardH * 0.12}
				style={{ fontFamily: GAME_FONT, fontWeight: GAME_FONT_WEIGHT,
					fontSize: stacked ? Math.max(19, cardW * 0.05) : cardW * 0.082,
					fill: 0x13201a }} />
			<Text text={panel.body} anchor={{ x: 0.5, y: 0 }}
				x={stacked ? cardW * (i===2?.26:.20) : 0} y={stacked ? -cardH * 0.12 : cardH * 0.23}
				style={{ fontFamily: BODY_FONT, fontSize: stacked ? Math.max(16, cardW * 0.035) : cardW * 0.052,
					lineHeight: stacked ? Math.max(21, cardW * 0.046) : cardW * 0.067,
					fill: 0x13201a, align: 'center', wordWrap: true, breakWords: false,
					wordWrapWidth: cardW * (stacked ? (i===2?.36:.46) : .75) }} />
		</Container>
	{/each}
</MainContainer>
