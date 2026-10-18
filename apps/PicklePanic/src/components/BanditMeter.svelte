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
	import NineSliceArt from './NineSliceArt.svelte';
	import { onDestroy } from 'svelte';
	import { MainContainer } from 'components-layout';
	import { Container, Graphics, Rectangle, Sprite, Text } from 'pixi-svelte';
	import { CanvasTextMetrics, TextStyle, type Graphics as PixiGraphics } from 'pixi.js';
	import { getContext } from '../game/context';
	import { GAME_FONT, GAME_FONT_WEIGHT, NUMBER_FONT } from '../game/fonts';
	import { gameText } from '../game/i18nText';
	import { removedLabelAtLevel, removedLabelsAtLevel } from '../game/chefMeter';

	const context = getContext();
	const PAPER = 0xf5e6be, INK = 0x171c1a, PINK = 0xc45240, ORANGE = 0xdda831;
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
	const CUT_SYMBOL:Record<string,string>={'10':'gbL5',J:'gbL4',Q:'gbL3'};
	const cutLabel = $derived(removedLabelAtLevel(steps[index] ?? level));
	const shake = $derived(phase >= CUT && phase < CUT + 180 ? Math.sin((phase - CUT) * .16) * 11 * (1 - (phase - CUT) / 180) : 0);
	const result = $derived(elapsed >= resultAt);
	const replacementLabel = $derived(`${removedLabelsAtLevel(level)} →`);
	const replacementStyle = $derived(new TextStyle({fontFamily:NUMBER_FONT,fontSize:W*.059,fill:PINK}));
	const replacementTextWidth = $derived(CanvasTextMetrics.measureText(replacementLabel,replacementStyle).width);
	const replacementRowWidth = $derived(replacementTextWidth + W*.025 + W*.11);
	const resultHeadline = $derived(opening ? gameText('plateUpgrade') : `+${spins} ${gameText('extraSpins')}`);

	// The chef in the cut-in is three layers (design/build_cutin_layers.py) so she
	// moves while she chops: wind-up, punch, hit, recoil — user 2026-10-16
	// 「我要 FG 砍圖騰的時候角色也有動態」. Before this the card was one static
	// drawing that only slid and tilted. Times are ms on the same phase clock as
	// the chop (CUT is the hit).
	const CUTIN = 768, SHOULDER = { x: 365, y: 315 }, HIPS = { x: 470, y: 640 };
	const cutinSize = $derived(W * .58);
	const px = (v: number) => (v - CUTIN / 2) * cutinSize / CUTIN;
	const ease = (p: number) => p * p * (3 - 2 * p);
	// ring-out after the hit: starts at 0 (sin) so nothing jumps on the impact frame
	const ring = (t: number, amp: number) => (t < 0 ? 0 : amp * Math.exp(-t / 160) * Math.sin(t / 55));
	const WIND = 200, STRIKE = 110;
	const chef = $derived.by(() => {
		const windup = ease(clamp((phase - WIND) / (CUT - STRIKE - WIND)));
		const strike = ease(clamp((phase - (CUT - STRIKE)) / STRIKE));
		const after = phase - CUT;
		const back = after < 0 ? 0 : ease(clamp(after / 380)); // settling back to rest
		const breathe = Math.sin(elapsed / 260) * .012;
		const wound = windup * (1 - strike);
		const hit = strike * (1 - back);
		// arm: pulls the fist up and back (+rot, smaller), then drives it at the
		// viewer (-rot, bigger) and rings out
		const armRot = .14 * wound - .07 * hit + ring(after, .05);
		const armScale = 1 - .1 * wound + .16 * hit + ring(after, .04);
		// body: leans back on the wind-up, lunges on the hit; the squash is the
		// one thing allowed to snap on the impact frame
		const bodyRot = .035 * wound - .045 * hit + ring(after, .02);
		const bodyX = (.025 * wound - .03 * hit) * cutinSize;
		const squash = after < 0 ? 0 : .06 * Math.exp(-after / 120) * Math.cos(after / 50);
		// shards: hidden until the fist lands, then burst out and settle
		const spark = after < 0 ? 0 : 1;
		const sparkScale = after < 0 ? .5 : 1 + .35 * Math.exp(-after / 120);
		return {
			armRot, armScale: Math.max(.82, armScale),
			bodyRot, bodyX, bodySx: 1 + squash + breathe * .5, bodySy: 1 - squash + breathe,
			spark, sparkScale,
		};
	});
	const rays = (g: PixiGraphics) => {
		g.clear();
		// Comic action burst behind the card: fat ink wedges that stop short of
		// the screen edge. They were 0.03-rad needles running out to 0.75W, which
		// crossed the bet bar and read as scratches on the screen (review 10-18).
		for (let i = 0; i < 18; i++) {
			const a = i * Math.PI * 2 / 18 + .05;
			const r = W * (.3 + (i % 3) * .02), outer = W * (.56 + (i % 2) * .05), half = .05 + (i % 3) * .012;
			g.poly([Math.cos(a-half)*r,Math.sin(a-half)*r,Math.cos(a)*outer,Math.sin(a)*outer,Math.cos(a+half)*r,Math.sin(a+half)*r]).fill({color:i%6===0?PINK:INK,alpha:.42});
		}
	};
	const drawCut = (g: PixiGraphics) => {
		g.clear();
		if (phase < CUT || phase > CUT + 260) return;
		const k = clamp((phase-CUT)/260), radius = W * (.13 + .09*k);
		const points:number[]=[];
		for(let i=0;i<24;i++){
			const a=i*Math.PI/12, r=radius*(i%2===0?1:.48);
			points.push(-W*.16+Math.cos(a)*r,H*.05+Math.sin(a)*r);
		}
		g.poly(points).fill({color:ORANGE,alpha:1-k}).stroke({color:INK,width:4,alpha:1-k});
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
			const windups=new Set<number>(), chops=new Set<number>(), slams=new Set<number>();
			const tick=(now:number) => {
				elapsed+=Math.min(80,Math.max(0,now-previous)); previous=now;
				for (let i=0;i<steps.length;i++) {
					const local=elapsed-LEAD-i*STEP;
					if(local>=CUT-400&&!slams.has(i)){slams.add(i);context.eventEmitter.broadcast({type:'mascotUpgradeSlam'});}
					if(local>=CUT-250&&!windups.has(i)){windups.add(i);context.eventEmitter.broadcast({type:'soundCookSlice'});}
					if(local>=CUT&&!chops.has(i)){
						chops.add(i);context.eventEmitter.broadcast({type:'soundCookChop'});
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
			<NineSliceArt assetKey="gbUiTicketV2" width={W*.96} height={H*.96} x={-W*.48} y={-H*.48} inset={64} top={120} bottom={64}/>
			<Container x={W*.24+W*.2*(1-clamp(phase/400))-W*.16*Math.sin(Math.PI*clamp((phase-CUT)/400))} y={-H*.05} rotation={.05-.08*Math.sin(Math.PI*clamp((phase-CUT)/400))} alpha={result ? .32 : 1}>
				<Container x={px(HIPS.x)+chef.bodyX} y={px(HIPS.y)} rotation={chef.bodyRot} scale={{x:chef.bodySx,y:chef.bodySy}}>
					<Sprite key="gbCookCutInBody" anchor={.5} x={-px(HIPS.x)} y={-px(HIPS.y)} width={cutinSize} height={cutinSize}/>
					<Container x={px(SHOULDER.x)-px(HIPS.x)} y={px(SHOULDER.y)-px(HIPS.y)} rotation={chef.armRot} scale={chef.armScale}>
						<Sprite key="gbCookCutInArm" anchor={.5} x={-px(SHOULDER.x)} y={-px(SHOULDER.y)} width={cutinSize} height={cutinSize}/>
					</Container>
				</Container>
				<Container x={px(150)} y={px(680)} scale={chef.sparkScale} alpha={chef.spark}>
					<Sprite key="gbCookCutInSparks" anchor={.5} x={-px(150)} y={-px(680)} width={cutinSize} height={cutinSize}/>
				</Container>
			</Container>
			<Container x={-W*.16} y={0} scale={.55+.45*back(clamp(phase/450))}>
				{#each [-1,1] as side (side)}
					<Container x={side*split*card*.7} y={side*split*card*.36} rotation={side*split*.6} alpha={1-split}>
						<Graphics isMask draw={(g)=>{g.clear();const s=card*.6;g.poly(side===-1?[-s,-s,s,-s,-s,s]:[s,-s,s,s,-s,s]).fill(0xffffff);}}/>
						<Sprite key="gbSymbolPaper" anchor={.5} width={card} height={card}/>
						<!-- the real royal being smashed, not type on a blank slip (review 10-17) -->
						{#if CUT_SYMBOL[cutLabel]}<Sprite key={CUT_SYMBOL[cutLabel]} anchor={.5} width={card*1.02} height={card*1.02}/>{:else}<Text text={cutLabel} anchor={.5} style={{fontFamily:GAME_FONT,fontSize:card*.49,fontWeight:GAME_FONT_WEIGHT,fill:INK}}/>{/if}
					</Container>
				{/each}
				{#if plate>0}
					<Container y={-H*.065} scale={back(plate)*.86}>
						<Graphics draw={(g)=>{g.clear();g.circle(0,0,card*.46).stroke({width:5,color:PINK});}}/>
						<Sprite key="gbP" anchor={.5} width={card*1.08} height={card*1.08}/>
						<Text text="JAR" anchor={.5} y={card*1.08*.113} rotation={-.05} style={{fontFamily:GAME_FONT,fontSize:card*.15,fill:INK,letterSpacing:1}}/>
					</Container>
				{/if}
			</Container>
			<Graphics draw={drawDebris}/>
			{#if phase>=CUT && phase<CUT+260}<Sprite key="gbFxV2_2" anchor={.5} x={-W*.16} y={H*.05} width={W*.35} height={W*.35} alpha={1-(phase-CUT)/260}/>{/if}
			{#if phase>=CUT && phase<CUT+450}
				<Text text="CRUNCH!" anchor={.5} x={-W*.05} y={-H*.21} rotation={-.14} scale={1+.2*(1-split)} style={{fontFamily:GAME_FONT,fontSize:W*.095,fontWeight:'900',fill:PINK,stroke:{color:INK,width:3}}}/>
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
				<Text text="JAR" anchor={.5} x={replacementRowWidth/2-W*.055} y={H*.22+W*.11*.113} rotation={-.05} style={{fontFamily:GAME_FONT,fontSize:W*.016,fill:INK,letterSpacing:1}}/>
			{:else if plate>0}
				<Text text={`${cutLabel} → ${gameText('plateUpgrade')}`} anchor={.5} y={H*.28} style={{fontFamily:GAME_FONT,fontSize:W*.039,fontWeight:GAME_FONT_WEIGHT,fill:PINK,stroke:{color:INK,width:W*.006,join:'round'}}}/>
			{/if}
			<Text text={gameText(opening ? 'firstSpin' : 'nextSpins')} anchor={.5} y={H*.39} style={{fontFamily:GAME_FONT,fontSize:W*.029,fontWeight:GAME_FONT_WEIGHT,fill:INK}}/>
		</Container>
		{#if phase>=CUT && phase<CUT+75}<Rectangle width={layout.width} height={layout.height} backgroundColor={PAPER} alpha={.8*(1-(phase-CUT)/75)}/>{/if}
	</MainContainer>
{/if}

<div class="slice-status" role="status" aria-live="polite">{active ? (result ? resultHeadline : phase < CUT ? `${gameText('chefSlice')} ${cutLabel}` : `${cutLabel} → ${gameText('plateUpgrade')}`) : ''}</div>
<style>.slice-status {position:fixed;width:1px;height:1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap;}</style>
