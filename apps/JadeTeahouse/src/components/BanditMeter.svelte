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
	import { onDestroy } from 'svelte';
	import { MainContainer } from 'components-layout';
	import { Container, Rectangle, Sprite, Text } from 'pixi-svelte';
	import { CanvasTextMetrics, TextStyle } from 'pixi.js';
	import { getContext } from '../game/context';
	import { GAME_FONT, GAME_FONT_WEIGHT, NUMBER_FONT } from '../game/fonts';
	import { gameText } from '../game/i18nText';
	import { removedLabelAtLevel, removedLabelsAtLevel } from '../game/chefMeter';
	import config from '../game/config';
	import { CUTIN } from '../game/meshWin';
	import PropMesh from './PropMesh.svelte';
	import CardShatter from './CardShatter.svelte';
	import LightRays from './LightRays.svelte';
	import FxBurst from './FxBurst.svelte';

	const context = getContext();
	// The jade and gold of the rest of the game. These were Sushi Monkey's pink
	// and terracotta print inks, the last of them on screen.
	const PAPER = 0xefeadc, INK = 0x282828, PINK = 0x5f9e83, ORANGE = 0xa8722c;
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
	const plate = $derived(clamp((phase - CUT - 260) / 390));
	const resultAt = $derived(LEAD + steps.length * STEP);
	const duration = $derived(resultAt + HOLD + OUT);
	const alpha = $derived(Math.min(clamp(elapsed / 150), 1 - clamp((elapsed - duration + OUT) / OUT)));
	const cutLabel = $derived(removedLabelAtLevel(steps[index] ?? level));
	const cutSymbolKey = $derived(`gb${config.banditMeter.replacements[(steps[index] ?? level) - 1] ?? 'L5'}`);
	const shake = $derived(phase >= CUT && phase < CUT + 180 ? Math.sin((phase - CUT) * .16) * 11 * (1 - (phase - CUT) / 180) : 0);
	const result = $derived(elapsed >= resultAt);
	const stampAge = $derived(elapsed - resultAt);
	const replacementLabel = $derived(`${removedLabelsAtLevel(level)} →`);
	const replacementStyle = $derived(new TextStyle({fontFamily:NUMBER_FONT,fontSize:W*.059,fill:PINK}));
	const replacementTextWidth = $derived(CanvasTextMetrics.measureText(replacementLabel,replacementStyle).width);
	const replacementRowWidth = $derived(replacementTextWidth + W*.025 + W*.11);
	const resultHeadline = $derived(opening ? gameText('plateUpgrade') : `+${spins} ${gameText('extraSpins')}`);
	// THE CUT, REDONE (2026-10-31, user: "fg收集升級動畫也太粗糙"). The slash used
	// to be three stacked stroke lines drawn in code, the debris eleven little
	// polygons and the new cup sat in a flat gold ring. Now: the card breaks
	// into shards of its own art (CardShatter, from Strike Monkey), a light
	// flashes where the fan struck, and the Jade Cup DROPS into the empty slot
	// out of the air, squashes, and settles in a pool of light with tea leaves
	// thrown off it. The "+N" is the same cinnabar chop as the intro board's.
	const shatterT = $derived(!result && phase >= CUT && phase < CUT + 800 ? phase - CUT : -1);
	const flash = $derived(phase >= CUT ? Math.exp(-(phase - CUT) / 170) : 0);
	// the cup: falls over the first 60% of `plate`, squashes on landing, settles
	const cupFall = $derived(clamp(plate / 0.6));
	const cupY = $derived(-H * 0.3 * (1 - cupFall) ** 2);
	const cupLand = $derived(plate > 0.6 ? Math.sin(Math.PI * clamp((plate - 0.6) / 0.4)) : 0);
	const cupLanded = $derived(plate >= 0.6);
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
			const windups=new Set<number>(), chops=new Set<number>(), reveals=new Set<number>();
			let stamped=false;
			const tick=(now:number) => {
				elapsed+=Math.min(80,Math.max(0,now-previous)); previous=now;
				for (let i=0;i<steps.length;i++) {
					const local=elapsed-LEAD-i*STEP;
					if(local>=CUT-250&&!windups.has(i)){windups.add(i);context.eventEmitter.broadcast({type:'soundChefSlice'});}
					if(local>=CUT&&!chops.has(i)){
						chops.add(i);context.eventEmitter.broadcast({type:'soundChefChop'});
						context.eventEmitter.broadcast({type:'boardFrameImpact',strength:1.5});
					}
					if(local>=CUT+560&&!reveals.has(i)){reveals.add(i);context.eventEmitter.broadcast({type:'soundLadderUp',level:steps[i]});}
				}
				if(!opening && !stamped && elapsed>=resultAt+190){stamped=true;context.eventEmitter.broadcast({type:'soundStamp'});}
				if(elapsed>=duration){stop();return;}
				raf=requestAnimationFrame(tick);
			};
			raf=requestAnimationFrame(tick);
		}),
	});
</script>

{#if active}
	<MainContainer>
		<Rectangle width={layout.width} height={layout.height} backgroundColor={INK} alpha={.45*alpha}/>
		<Container x={layout.width/2+shake} y={layout.height*.45} {alpha}>
			<!-- the scroll's paper, gold-bracketed (sushiV8/cutin_paper.png), not a
			     flat polygon drawn in code -->
			<Sprite key="v8CutinPaper" anchor={.5} width={W*.97} height={H*.96}/>
			<Container x={W*.24+W*.2*(1-clamp(phase/400))-W*.16*Math.sin(Math.PI*clamp((phase-CUT)/400))} y={-H*.05} rotation={.05-.3*Math.sin(Math.PI*clamp((phase-CUT)/400))} alpha={result ? .32 : 1}>
				<!-- her fan, tassels, sleeve and hem answer the slide and the slash
				     (game/meshWin/cutIn.ts), on this step's own phase clock -->
				<PropMesh spec={CUTIN} env={{ t: phase }} anchor={0.5} width={W*.58} height={W*.58}/>
			</Container>
			<Container x={-W*.16} y={-H*.13}>
				{#key index}
					{#if phase < CUT && !result}
						<!-- the low card, whole, until the fan strikes it -->
						<Container scale={.55+.45*back(clamp(phase/450))}>
							<Sprite key={cutSymbolKey} anchor={.5} width={card} height={card}/>
							<Text text={cutLabel} anchor={.5} style={{fontFamily:GAME_FONT,fontSize:card*.49,fontWeight:GAME_FONT_WEIGHT,fill:INK}}/>
						</Container>
					{/if}
					{#if shatterT >= 0}
						<CardShatter textureKey={cutSymbolKey} label={cutLabel} labelFont={GAME_FONT} labelColor="#282828"
							size={card} x={0} y={card * .42} t={shatterT} />
					{/if}
					{#if flash > 0.01}
						<Sprite key="fxSoftGlow" anchor={.5} blendMode="add" tint={0xfff1c8} width={card*2.2} height={card*2.2} alpha={.7*flash}/>
					{/if}
					{#if plate > 0}
						<!-- light pooled behind the new cup, rays turning slowly -->
						<LightRays radius={card*1.15} alpha={.9*clamp((plate-.5)/.5)} colors={[0xe6c27a, 0x8fc9ad]} />
						<Sprite key="fxSoftGlow" anchor={.5} blendMode="add" tint={0xe6c27a} width={card*1.9} height={card*1.9} alpha={.45*clamp((plate-.55)/.45)}/>
						<Container y={cupY} scale={{x:.82*(1+.16*cupLand), y:.82*(1-.16*cupLand)}}>
							<Sprite key="gbP" anchor={{x:.5,y:.55}} width={card*1.08} height={card*1.08}/>
						</Container>
						{#if cupLanded}
							<FxBurst flavour="tea" y={card*.1} scale={1.1} />
						{/if}
					{/if}
				{/key}
			</Container>
			<Text visible={!result || opening} text={result?resultHeadline:gameText('chefSlice')} anchor={.5} y={-H*.43} scale={result?1+.14*(1-clamp((elapsed-resultAt)/240)):1} style={{fontFamily:GAME_FONT,fontSize:W*.052,fontWeight:GAME_FONT_WEIGHT,fill:result?ORANGE:INK,stroke:{color:PAPER,width:4},letterSpacing:1}}/>
			{#if result && !opening}
				{@const sz = Math.max(W*.3, 190/layout.scale)}
				<!-- the cinnabar chop, upright, pressed on with a small overshoot -->
				<Container x={W*.29} y={-H*.04-H*.06*(1-clamp(stampAge/260))} scale={back(clamp(stampAge/320))}>
					<Sprite key="v8FgSeal" anchor={.5} width={sz} height={sz}/>
					<Text text={`+${spins}`} anchor={.5} y={-sz*.07} style={{fontFamily:GAME_FONT,fontWeight:'700',fontSize:sz*.36,fill:0xfaeed6}}/>
					<Text text="SPINS" anchor={.5} y={sz*.2} style={{fontFamily:GAME_FONT,fontWeight:'700',fontSize:sz*.12,letterSpacing:2,fill:0xfaeed6}}/>
				</Container>
			{/if}
			{#if result}
				<Text text={replacementLabel} anchor={{x:0,y:.5}} x={-replacementRowWidth/2} y={H*.20} style={replacementStyle}/>
				<Sprite key="gbP" anchor={.5} x={replacementRowWidth/2-W*.055} y={H*.20} width={W*.11} height={W*.11}/>
			{/if}
			<Text text={gameText(opening ? 'firstSpin' : 'nextSpins')} anchor={.5} y={H*.39} style={{fontFamily:GAME_FONT,fontSize:W*.029,fontWeight:GAME_FONT_WEIGHT,fill:INK}}/>
		</Container>
	</MainContainer>
{/if}

<div class="slice-status" role="status" aria-live="polite">{active ? (result ? resultHeadline : phase < CUT ? `${gameText('chefSlice')} ${cutLabel}` : `${cutLabel} → ${gameText('plateUpgrade')}`) : ''}</div>
<style>.slice-status {position:fixed;width:1px;height:1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap;}</style>
