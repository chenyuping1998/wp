<script lang="ts" module>
	export type EmitterEventBanditMeter = {
		type: 'banditLevelUp';
		level: number;
		mult: number;
		spinsAdded: number;
		levelsGained?: number;
		opening?: boolean;
	};
</script>

<script lang="ts">
	import InkNumber from './InkNumber.svelte';
	import { onDestroy } from 'svelte';
	import { MainContainer } from 'components-layout';
	import { Container, Graphics, Rectangle, Sprite, Text } from 'pixi-svelte';
	import { CanvasTextMetrics, TextStyle, type Graphics as PixiGraphics } from 'pixi.js';
	import { getContext } from '../game/context';
	import { GAME_FONT, GAME_FONT_WEIGHT, NUMBER_FONT } from '../game/fonts';
	import { gameText } from '../game/i18nText';
	import { removedLabelAtLevel, removedLabelsAtLevel } from '../game/chefMeter';

	const context = getContext();
	const PAPER = 0xefeadc, INK = 0x282828, PINK = 0xbd9393, ORANGE = 0xb87b60;
	const LEAD = 320, STEP = 1850, CUT = 680, HOLD = 1050, OUT = 350;
	let active = $state(false), elapsed = $state(0), level = $state(0), spins = $state(0);
	let steps = $state<number[]>([]);
	let opening = $state(false);
	let raf = 0;
	let finish: (() => void) | undefined;
	const clamp = (v: number) => Math.max(0, Math.min(1, v));
	const back = (p: number) => 1 + 2.7 * (p - 1) ** 3 + 1.7 * (p - 1) ** 2;
	const layout = $derived(context.stateLayoutDerived.mainLayout());
	const W = $derived(Math.min(layout.width * .92, 870));
	const H = $derived(Math.min(layout.height * .66, W * .77));
	const card = $derived(W * .34);
	const index = $derived(Math.min(steps.length - 1, Math.max(0, Math.floor((elapsed - LEAD) / STEP))));
	const phase = $derived(Math.max(0, elapsed - LEAD - index * STEP));
	const split = $derived(clamp((phase - CUT) / 560));
	const plate = $derived(clamp((phase - CUT - 420) / 320));
	const resultAt = $derived(LEAD + steps.length * STEP);
	const duration = $derived(resultAt + HOLD + OUT);
	const alpha = $derived(Math.min(clamp(elapsed / 150), 1 - clamp((elapsed - duration + OUT) / OUT)));
	const cutLabel = $derived(removedLabelAtLevel(steps[index] ?? level));
	const shake = $derived(phase >= CUT && phase < CUT + 180 ? Math.sin((phase - CUT) * .16) * 11 * (1 - (phase - CUT) / 180) : 0);
	const result = $derived(elapsed >= resultAt);
	const replacementLabel = $derived(`${removedLabelsAtLevel(level)} →`);
	const replacementStyle = $derived(new TextStyle({fontFamily:NUMBER_FONT,fontSize:W*.059,fill:PINK}));
	const replacementTextWidth = $derived(CanvasTextMetrics.measureText(replacementLabel,replacementStyle).width);
	const replacementRowWidth = $derived(replacementTextWidth + W*.025 + W*.11);
	const resultHeadline = $derived(opening ? gameText('plateUpgrade') : `+${spins} ${gameText('extraSpins')}`);
	const rays = (g: PixiGraphics) => {
		g.clear();
		for (let i = 0; i < 22; i++) {
			const a = i * Math.PI * 2 / 22 + .05;
			const r = W * (.29 + (i % 3) * .025), outer = W * .75;
			g.poly([Math.cos(a-.014)*r,Math.sin(a-.014)*r,Math.cos(a)*outer,Math.sin(a)*outer,Math.cos(a+.014)*r,Math.sin(a+.014)*r]).fill({color:i%4===0?PINK:INK,alpha:.6});
		}
	};
	const drawCut = (g: PixiGraphics) => {
		g.clear();
		const p = clamp((phase - CUT + 130) / 240);
		if (phase < CUT - 130 || phase > CUT + 260) return;
		const x1 = -W*.47, y1 = H*.31, x2 = x1 + W*1.08*p, y2 = y1-H*.67*p;
		g.moveTo(x1,y1).lineTo(x2,y2).stroke({width:W*.065,color:INK});
		g.moveTo(x1,y1).lineTo(x2,y2).stroke({width:W*.045,color:PINK});
		g.moveTo(x1,y1).lineTo(x2,y2).stroke({width:W*.012,color:PAPER});
	};
	const drawDebris = (g: PixiGraphics) => {
		g.clear();
		if (split <= 0 || split >= 1) return;
		for (let i = 0; i < 26; i++) {
			const a=i*2.399, r=split*W*(.18+(i%5)*.035);
			const x=-W*.16+Math.cos(a)*r, y=Math.sin(a)*r + split*split*H*.3;
			const s=(3+i%4)*Math.min(1,(1-split)*3);
			g.poly([x-s,y-s,x+s,y-s*.4,x+s*.5,y+s,x-s*.7,y+s*.4]).fill(i%3===0?PINK:PAPER).stroke({color:INK,width:1.5});
		}
	};
	const stop = () => { cancelAnimationFrame(raf); active = false; const done = finish; finish = undefined; done?.(); };
	onDestroy(stop);
	context.eventEmitter.subscribeOnMount({
		banditLevelUp: (event) => new Promise<void>((resolve) => {
			stop();
			level=event.level; spins=event.spinsAdded; opening=event.opening ?? false;
			const gained=Math.min(event.level,Math.max(1,event.levelsGained ?? 1));
			steps=Array.from({length:gained},(_,i)=>event.level-gained+i+1);
			elapsed=0; active=true; finish=resolve;
			let previous=performance.now();
			const windups=new Set<number>(), chops=new Set<number>();
			const tick=(now:number) => {
				elapsed+=Math.min(80,Math.max(0,now-previous)); previous=now;
				for (let i=0;i<steps.length;i++) {
					const local=elapsed-LEAD-i*STEP;
					if(local>=CUT-250&&!windups.has(i)){windups.add(i);context.eventEmitter.broadcast({type:'soundChefSlice'});}
					if(local>=CUT&&!chops.has(i)){
						chops.add(i);context.eventEmitter.broadcast({type:'soundChefChop'});
						context.eventEmitter.broadcast({type:'boardFrameImpact',strength:1.5});
					}
				}
				if(elapsed>=duration){stop();return;}
				raf=requestAnimationFrame(tick);
			};
			raf=requestAnimationFrame(tick);
		}),
	});
</script>

{#if active}
	<MainContainer>
		<Rectangle width={layout.width} height={layout.height} backgroundColor={INK} alpha={.65*alpha}/>
		<Container x={layout.width/2+shake} y={layout.height*.45} {alpha}>
			<Graphics draw={rays}/>
			<Graphics draw={(g)=>{g.clear();g.poly([-W*.48,-H*.48,W*.48,-H*.43,W*.47,H*.47,-W*.47,H*.43]).fill(PAPER).stroke({color:INK,width:5});}}/>
			<Container x={W*.24+W*.2*(1-clamp(phase/400))-W*.16*Math.sin(Math.PI*clamp((phase-CUT)/400))} y={-H*.05} rotation={.05-.3*Math.sin(Math.PI*clamp((phase-CUT)/400))} alpha={result ? .32 : 1}>
				<Sprite key="gbChefCutIn" anchor={.5} width={W*.58} height={W*.58}/>
			</Container>
			<Container x={-W*.16} y={0} scale={.55+.45*back(clamp(phase/450))}>
				{#each [-1,1] as side (side)}
					<Container x={side*split*card*.7} y={side*split*card*.36} rotation={side*split*.6} alpha={1-split}>
						<Graphics isMask draw={(g)=>{g.clear();const s=card*.6;g.poly(side===-1?[-s,-s,s,-s,-s,s]:[s,-s,s,s,-s,s]).fill(0xffffff);}}/>
						<Sprite key="gbSymbolPaper" anchor={.5} width={card} height={card}/>
						<Text text={cutLabel} anchor={.5} style={{fontFamily:GAME_FONT,fontSize:card*.49,fontWeight:GAME_FONT_WEIGHT,fill:INK}}/>
					</Container>
				{/each}
				{#if plate>0}
					<Container y={-H*.065} scale={back(plate)*.86}>
						<Graphics draw={(g)=>{g.clear();g.circle(0,0,card*.46).stroke({width:5,color:PINK});}}/>
						<Sprite key="gbP" anchor={.5} width={card*1.08} height={card*1.08}/>
					</Container>
				{/if}
			</Container>
			<Graphics draw={drawDebris}/>
			<Graphics draw={drawCut}/>
			{#if phase>=CUT && phase<CUT+450}
				<Text text="ザクッ!" anchor={.5} x={-W*.05} y={-H*.21} rotation={-.14} scale={1+.2*(1-split)} style={{fontFamily:GAME_FONT,fontSize:W*.095,fontWeight:'900',fill:PINK,stroke:{color:INK,width:3}}}/>
			{/if}
			<Text visible={!result || opening} text={result?resultHeadline:gameText('chefSlice')} anchor={.5} y={-H*.35} scale={result?1+.14*(1-clamp((elapsed-resultAt)/240)):1} style={{fontFamily:GAME_FONT,fontSize:W*.066,fontWeight:GAME_FONT_WEIGHT,fill:result?ORANGE:INK,stroke:{color:PAPER,width:4},letterSpacing:1}}/>
			{#if result && !opening}
				<Container x={W*.29} y={-H*.04} rotation={-.07}>
					<Sprite key="v8Stamp" anchor={.5} width={Math.max(W*.32,200/layout.scale)} height={Math.max(W*.32,200/layout.scale)}/>
					<InkNumber text={`+${spins}`} fontSize={W*.095} role="plate" y={-W*.025}/>
					<Text text="SPINS" anchor={.5} y={W*.055} style={{fontFamily:GAME_FONT,fontSize:W*.045,fill:INK}}/>
				</Container>
			{/if}
			{#if result}
				<Text text={replacementLabel} anchor={{x:0,y:.5}} x={-replacementRowWidth/2} y={H*.22} style={replacementStyle}/>
				<Sprite key="gbP" anchor={.5} x={replacementRowWidth/2-W*.055} y={H*.22} width={W*.11} height={W*.11}/>
			{:else if plate>0}
				<Text text={`${cutLabel} → ${gameText('plateUpgrade')}`} anchor={.5} y={H*.28} style={{fontFamily:GAME_FONT,fontSize:W*.039,fontWeight:GAME_FONT_WEIGHT,fill:PINK}}/>
			{/if}
			<Text text={gameText(opening ? 'firstSpin' : 'nextSpins')} anchor={.5} y={H*.39} style={{fontFamily:GAME_FONT,fontSize:W*.029,fontWeight:GAME_FONT_WEIGHT,fill:INK}}/>
		</Container>
		{#if phase>=CUT && phase<CUT+75}<Rectangle width={layout.width} height={layout.height} backgroundColor={PAPER} alpha={.8*(1-(phase-CUT)/75)}/>{/if}
	</MainContainer>
{/if}

<div class="slice-status" role="status" aria-live="polite">{active ? (result ? resultHeadline : phase < CUT ? `${gameText('chefSlice')} ${cutLabel}` : `${cutLabel} → ${gameText('plateUpgrade')}`) : ''}</div>
<style>.slice-status {position:fixed;width:1px;height:1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap;}</style>
