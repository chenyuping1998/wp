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
	import config from '../game/config';

	const context = getContext();
	const PAPER = 0xfff4e8, INK = 0x202638, PINK = 0x288d91, ORANGE = 0xdc493d;
	const LEAD = 360, STEP = 2200, CUT = 950, HOLD = 1200, OUT = 380;
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
	const card = $derived(W * .28);
	const index = $derived(Math.min(steps.length - 1, Math.max(0, Math.floor((elapsed - LEAD) / STEP))));
	const phase = $derived(Math.max(0, elapsed - LEAD - index * STEP));
	const split = $derived(clamp((phase - CUT - 65) / 600));
	const splitDrift = $derived(1 - (1 - split) ** 3);
	const plate = $derived(clamp((phase - CUT - 260) / 390));
	const resultAt = $derived(LEAD + steps.length * STEP);
	const duration = $derived(resultAt + HOLD + OUT);
	const alpha = $derived(Math.min(clamp(elapsed / 150), 1 - clamp((elapsed - duration + OUT) / OUT)));
	const cutLabel = $derived(removedLabelAtLevel(steps[index] ?? level));
	const cutSymbolKey = $derived(`gb${config.banditMeter.replacements[(steps[index] ?? level) - 1] ?? 'L5'}`);
	const shake = $derived(phase >= CUT && phase < CUT + 150 ? Math.sin((phase - CUT) * .14) * 7 * (1 - (phase - CUT) / 150) : 0);
	const chefWindup = $derived(clamp((phase - 140) / (CUT - 240)));
	const chefStrike = $derived(clamp((phase - CUT + 80) / 280));
	const stampAge = $derived(elapsed - resultAt);
	const result = $derived(elapsed >= resultAt);
	const currentRung = $derived(steps[index] ?? level);
	const rungRevealed = (rung: number) => result ? rung <= level : rung < currentRung || (rung === currentRung && plate > .75);
	const replacementLabel = $derived(`${removedLabelsAtLevel(level)} →`);
	const replacementStyle = $derived(new TextStyle({fontFamily:NUMBER_FONT,fontSize:W*.059,fill:PINK}));
	const replacementTextWidth = $derived(CanvasTextMetrics.measureText(replacementLabel,replacementStyle).width);
	const replacementRowWidth = $derived(replacementTextWidth + W*.025 + W*.11);
	const resultHeadline = $derived(opening ? gameText('plateUpgrade') : `+${spins} ${gameText('extraSpins')}`);
	const drawAwning = (g: PixiGraphics) => {
		g.clear();
		g.poly([-W*.5,-H*.53,W*.49,-H*.53,W*.5,-H*.37,W*.45,-H*.37,W*.42,-H*.35,W*.37,-H*.37,-W*.43,-H*.37,-W*.5,-H*.38]).fill(ORANGE).stroke({color:INK,width:5});
		for(let i=0;i<9;i++) {
			const x=-W*.45+i*W*.105;
			g.poly([x,-H*.52,x+W*.043,-H*.52,x+W*.036,-H*.39,x+W*.018,-H*.37,x,-H*.39]).fill(PAPER);
		}
		g.moveTo(-W*.48,-H*.385).lineTo(W*.47,-H*.385).stroke({color:INK,width:3});
	};
	const drawStage = (g: PixiGraphics) => {
		g.clear();
		g.poly([-W*.48,-H*.47,W*.48,-H*.44,W*.47,H*.46,-W*.47,H*.44]).fill(PAPER).stroke({color:INK,width:6});
		g.moveTo(-W*.45,H*.405).lineTo(W*.44,H*.42).stroke({color:ORANGE,width:3});
		g.moveTo(-W*.43,-H*.30).lineTo(W*.43,-H*.31).stroke({color:PINK,width:3});
	};
	const drawCut = (g: PixiGraphics) => {
		g.clear();
		if (phase < CUT - 320 || phase > CUT + 340) return;
		const p = clamp((phase - CUT + 250) / 280);
		const hingeX = -W*.36 + W*.25*p, hingeY = -H*.13;
		const gape = H*.16*(1-p), tipX = hingeX+W*.16;
		// Kitchen shears: pale steel blades, dark ink edges and red finger loops.
		g.poly([hingeX,hingeY,tipX,hingeY-gape,tipX-W*.035,hingeY-gape+H*.035]).fill(0xd9e5df).stroke({color:INK,width:4});
		g.poly([hingeX,hingeY,tipX,hingeY+gape,tipX-W*.035,hingeY+gape-H*.035]).fill(0xd9e5df).stroke({color:INK,width:4});
		g.ellipse(hingeX-W*.055,hingeY-H*.067,W*.042,H*.057).stroke({color:INK,width:W*.012});
		g.ellipse(hingeX-W*.055,hingeY+H*.067,W*.042,H*.057).stroke({color:INK,width:W*.012});
		g.circle(hingeX,hingeY,W*.017).fill(ORANGE).stroke({color:INK,width:3});
	};
	const drawRungRail = (g: PixiGraphics) => {
		g.clear();
		g.moveTo(-W*.30,H*.20).lineTo(W*.10,H*.20).stroke({width:W*.012,color:INK,alpha:.4});
		const revealed = result ? level : currentRung - 1 + (plate > .75 ? 1 : 0);
		if(revealed>1) g.moveTo(-W*.30,H*.20).lineTo(-W*.30+W*.20*Math.min(2,revealed-1),H*.20).stroke({width:W*.012,color:PINK});
	};
	const drawDebris = (g: PixiGraphics) => {
		g.clear();
		if (split <= 0 || split >= 1) return;
		for (let i = 0; i < 11; i++) {
			const a=i*2.399, r=splitDrift*W*(.09+(i%4)*.032);
			const x=-W*.16+Math.cos(a)*r, y=-H*.13+Math.sin(a)*r + split*split*H*.18;
			const s=(4+i%3)*Math.min(1,(1-split)*3);
			g.poly([x-s,y-s*.7,x+s,y-s,x+s*.22,y+s]).fill(i%3===0?ORANGE:i%3===1?PINK:PAPER).stroke({color:INK,width:1.5});
		}
	};
	const drawImpact = (g: PixiGraphics) => {
		g.clear();
		if (phase < CUT || phase > CUT + 260) return;
		const p=clamp((phase-CUT)/260);
		g.ellipse(-W*.16,-H*.13,card*(.48+.3*p),card*(.48+.3*p)).stroke({color:ORANGE,width:5*(1-p),alpha:1-p});
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
			let stamped=false;
			const tick=(now:number) => {
				elapsed+=Math.min(80,Math.max(0,now-previous)); previous=now;
				for (let i=0;i<steps.length;i++) {
					const local=elapsed-LEAD-i*STEP;
					if(local>=CUT-290&&!windups.has(i)){windups.add(i);context.eventEmitter.broadcast({type:'soundChefSlice'});}
					if(local>=CUT&&!chops.has(i)){
						chops.add(i);context.eventEmitter.broadcast({type:'soundChefChop'});
						context.eventEmitter.broadcast({type:'boardFrameImpact',strength:1.5});
					}
				}
				if(!opening && !stamped && elapsed>=resultAt+90){stamped=true;context.eventEmitter.broadcast({type:'soundStamp'});}
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
			<Graphics draw={drawStage}/>
			<Graphics draw={drawAwning}/>
			<Container x={W*.3+W*.11*chefWindup-W*.22*chefStrike} y={H*.03-H*.025*chefWindup+H*.025*chefStrike} rotation={.04+.09*chefWindup-.23*chefStrike} alpha={result ? .32 : 1}>
				<Sprite key="gbChefCutIn" anchor={.5} width={W*.48} height={W*.48}/>
			</Container>
			<Container x={-W*.16} y={-H*.13} scale={.55+.45*back(clamp(phase/450))}>
				{#each [-1,1] as side (side)}
					<Container x={side*splitDrift*card*.68} y={splitDrift*card*.32} rotation={side*splitDrift*.52} alpha={1-clamp((split-.35)/.65)}>
						<Graphics isMask draw={(g)=>{g.clear();const s=card*.6;g.poly(side===-1?[-s,-s,s,-s,-s,s]:[s,-s,s,s,-s,s]).fill(0xffffff);}}/>
						<Sprite key={cutSymbolKey} anchor={.5} width={card} height={card}/>
						<Text text={cutLabel} anchor={.5} style={{fontFamily:NUMBER_FONT,fontSize:card*.47,fill:INK}}/>
					</Container>
				{/each}
				{#if plate>0}
					<Container y={-H*.045*Math.sin(Math.PI*plate)} scale={back(plate)*.76} rotation={.04*(1-plate)}>
						<Sprite key="gbP" anchor={.5} width={card*1.08} height={card*1.08}/>
					</Container>
				{/if}
			</Container>
			<Graphics draw={drawImpact}/>
			<Graphics draw={drawDebris}/>
			<Graphics draw={drawCut}/>
			{#if !result}<Graphics draw={drawRungRail}/>{/if}
			{#each (result ? [] : [1,2,3]) as rung (rung)}
				<Container x={(rung-2)*W*.20-W*.10} y={H*.20} scale={rung===currentRung && phase>=CUT && phase<CUT+380 ? 1+.2*Math.sin(Math.PI*clamp((phase-CUT)/380)) : 1}>
					<Graphics draw={(g)=>{g.clear();g.roundRect(-W*.045,-W*.036,W*.09,W*.072,W*.015).fill(rungRevealed(rung)?PINK:PAPER).stroke({color:INK,width:3});}}/>
					<Text text={`${config.banditMeter.thresholds[rung-1]}`} anchor={.5} style={{fontFamily:NUMBER_FONT,fontSize:W*.032,fill:INK}}/>
					<Text text={`${removedLabelAtLevel(rung)}→P`} anchor={.5} y={H*.10} style={{fontFamily:GAME_FONT,fontSize:W*.03,fontWeight:GAME_FONT_WEIGHT,fill:rungRevealed(rung)?PINK:INK}}/>
				</Container>
			{/each}
			<Text visible={!result || opening} text={result?resultHeadline:gameText('chefSlice')} anchor={.5} y={-H*.435} scale={result?1+.08*(1-clamp((elapsed-resultAt)/240)):1} style={{fontFamily:GAME_FONT,fontSize:W*.056,fontWeight:GAME_FONT_WEIGHT,fill:PAPER,stroke:{color:INK,width:2},letterSpacing:1}}/>
			{#if result && !opening}
				<Container x={W*.29} y={-H*.04-H*.06*(1-clamp(stampAge/260))} rotation={-.07-.08*(1-clamp(stampAge/260))} scale={back(clamp(stampAge/320))}>
					<Sprite key="v8Stamp" anchor={.5} width={Math.max(W*.32,200/layout.scale)} height={Math.max(W*.32,200/layout.scale)}/>
					<InkNumber text={`+${spins}`} fontSize={W*.095} role="plate" y={-W*.025}/>
					<Text text="SPINS" anchor={.5} y={W*.055} style={{fontFamily:GAME_FONT,fontSize:W*.045,fill:INK}}/>
				</Container>
			{/if}
			{#if result}
				<Text text={replacementLabel} anchor={{x:0,y:.5}} x={-replacementRowWidth/2} y={H*.20} style={replacementStyle}/>
				<Sprite key="gbP" anchor={.5} x={replacementRowWidth/2-W*.055} y={H*.20} width={W*.11} height={W*.11}/>
			{/if}
			<Text text={gameText(opening ? 'firstSpin' : 'nextSpins')} anchor={.5} y={H*.39} style={{fontFamily:GAME_FONT,fontSize:W*.027,fontWeight:GAME_FONT_WEIGHT,fill:INK}}/>
		</Container>
	</MainContainer>
{/if}

<div class="slice-status" role="status" aria-live="polite">{active ? (result ? resultHeadline : phase < CUT ? `${gameText('chefSlice')} ${cutLabel}` : `${cutLabel} → ${gameText('plateUpgrade')}`) : ''}</div>
<style>.slice-status {position:fixed;width:1px;height:1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap;}</style>
