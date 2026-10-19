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
	import PropMesh from './PropMesh.svelte';
	import { CUTIN } from '../game/meshWin';
	import { GAME_FONT, GAME_FONT_WEIGHT, NUMBER_FONT } from '../game/fonts';
	import { gameText } from '../game/i18nText';
	import { removedLabelAtLevel, removedLabelsAtLevel } from '../game/chefMeter';
	import config from '../game/config';

	const context = getContext();
	const PAPER = 0xf3e9d2, INK = 0x161412, PINK = 0xc2185b, ORANGE = 0xd9342b;
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
	// the board (v8MeterBoard, design/build_swing_fg_sign.py, 2026-10-18): a
	// stage window over the ticket's paper, seam at 0.62 H. The dancer stands on
	// the stage's edge and the card hangs over the stage; the rungs sit on the
	// paper inside its keyline (y 542..731 of 770).
	const DANCER_Y = $derived(-H * .12);
	const RUNG_Y = $derived(H * .28);
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
	const shake = $derived(phase >= CUT && phase < CUT + 180 ? Math.sin((phase - CUT) * .16) * 11 * (1 - (phase - CUT) / 180) : 0);
	const tap = (t: number, at: number, width = 165) => Math.max(0, 1 - Math.abs(t - at) / width);
	const tapBounce = $derived(1 - .1 * tap(phase, 270) - .13 * tap(phase, 490));
	// THE RECORD THROW (2026-10-18). The cane that used to poke out and slash the
	// card read as "a stick suddenly appears" (user); now the dancer slides in
	// with a record on the open palm, rocks back, and frisbees it into the card:
	// it spins across on a low arc, smashes the card at CUT and ricochets off,
	// spinning, up and away — the way the cast used to throw at the board.
	const RELEASE = CUT - 260;
	const wind = $derived(Math.sin(Math.PI * .5 * clamp((phase - 420) / (RELEASE - 420))) * (phase < RELEASE ? 1 : 0));
	const fling = $derived(phase < RELEASE ? 0 : Math.sin(Math.PI * clamp((phase - RELEASE) / 520)) * Math.exp(-Math.max(0, phase - RELEASE) / 900));
	const dancerSwing = $derived(.05 * Math.sin(phase / 115) * (1 - clamp((phase - 420) / 200)) + .15 * wind - .27 * fling);
	const dancerX = $derived(W*.24 + W*.2*(1-clamp(phase/400)) + W*.035*wind - W*.07*fling);
	const dancerY = $derived(DANCER_Y + (1-tapBounce)*H*.12);
	// the open palm on the cut-in art (chef_cut_in.png 1024², at 240,464),
	// carried through the figure's swing and bounce: drawn W*.48 wide
	const hand = (x: number, y: number, rot: number, sc: number) => {
		const lx = -.2656 * W * .48 * sc, ly = -.0469 * W * .48 * sc;
		return { x: x + lx * Math.cos(rot) - ly * Math.sin(rot), y: y + lx * Math.sin(rot) + ly * Math.cos(rot) };
	};
	const TARGET = $derived({ x: -W*.16, y: -H*.13 });
	const disc = $derived.by(() => {
		if (result) return null;
		const size = card * .62;
		if (phase < RELEASE) {
			// on the palm, a little above it, tipped back with the wind-up
			const p = hand(dancerX, dancerY, dancerSwing, tapBounce);
			return { x: p.x, y: p.y - size * .3, rotation: .25 + .5 * wind, size, alpha: clamp(phase / 160) };
		}
		if (phase < CUT) {
			const k = (phase - RELEASE) / (CUT - RELEASE);
			const from = hand(W*.24 + W*.035, DANCER_Y, .15, 1);
			const e = k * (2 - k) * .35 + k * .65; // quick off the hand, keeps its speed
			return {
				x: from.x + (TARGET.x - from.x) * e,
				y: from.y - size * .3 + (TARGET.y - from.y + size * .3) * e - Math.sin(Math.PI * k) * H * .1,
				rotation: .75 - k * Math.PI * 3.2,
				size: size * (1 + .12 * k),
				alpha: 1,
			};
		}
		// the ricochet: off the card up and back, still spinning, gone in 420ms
		const k = (phase - CUT) / 420;
		if (k >= 1) return null;
		return {
			x: TARGET.x - W * .2 * k,
			y: TARGET.y - H * .34 * k + H * .3 * k * k,
			rotation: .75 - Math.PI * 3.2 - k * Math.PI * 2.4,
			size: size * 1.12 * (1 - .3 * k),
			alpha: 1 - k * k,
		};
	});
	const result = $derived(elapsed >= resultAt);
	const stampAge = $derived(elapsed - resultAt);
	const currentRung = $derived(steps[index] ?? level);
	const rungRevealed = (rung: number) => result ? rung <= level : rung < currentRung || (rung === currentRung && plate > .75);
	const replacementLabel = $derived(`${removedLabelsAtLevel(level)} →`);
	const replacementStyle = $derived(new TextStyle({fontFamily:NUMBER_FONT,fontSize:W*.059,fill:PINK}));
	const replacementTextWidth = $derived(CanvasTextMetrics.measureText(replacementLabel,replacementStyle).width);
	const replacementRowWidth = $derived(replacementTextWidth + W*.025 + W*.11);
	const resultHeadline = $derived(opening ? gameText('plateUpgrade') : `+${spins} ${gameText('extraSpins')}`);
	// the smash: a ring off the impact and a few short ink strike lines, gone
	// in under 300ms (the card's two halves and the shards carry the rest)
	const drawCut = (g: PixiGraphics) => {
		g.clear();
		if (phase < CUT || phase > CUT + 300) return;
		const ring = clamp((phase-CUT)/290);
		g.circle(TARGET.x,TARGET.y,W*(.045+.17*ring)).stroke({color:PINK,width:W*.008,alpha:1-ring});
		const burst = clamp((phase-CUT)/200);
		for (let i = 0; i < 8; i++) {
			const a = i * Math.PI / 4 + .3;
			const r0 = card*(.42+.25*burst), r1 = r0 + card*.16*(1-burst);
			g.moveTo(TARGET.x+Math.cos(a)*r0,TARGET.y+Math.sin(a)*r0).lineTo(TARGET.x+Math.cos(a)*r1,TARGET.y+Math.sin(a)*r1)
				.stroke({color:INK,width:W*.007,alpha:1-burst});
		}
	};
	const drawFootfalls = (g: PixiGraphics) => {
		g.clear();
		if (result) return;
		for (const [i,at] of [270,490, CUT].entries()) {
			const pulse = tap(phase,at,145);
			if (pulse <= 0) continue;
			const x = W*(.1+i*.105), y = H*.13;
			g.ellipse(x,y,W*.027*(1+.35*pulse),H*.018).fill({color:INK,alpha:.18+.36*pulse});
			g.moveTo(x-W*.019,y-H*.036).lineTo(x-W*.038,y-H*.064)
				.stroke({color:PINK,width:W*.006,alpha:pulse});
			g.moveTo(x+W*.019,y-H*.036).lineTo(x+W*.038,y-H*.064)
				.stroke({color:PINK,width:W*.006,alpha:pulse});
		}
	};
	const drawRungRail = (g: PixiGraphics) => {
		g.clear();
		g.moveTo(-W*.30,RUNG_Y).lineTo(W*.10,RUNG_Y).stroke({width:W*.012,color:INK,alpha:.4});
		const revealed = result ? level : currentRung - 1 + (plate > .75 ? 1 : 0);
		if(revealed>1) g.moveTo(-W*.30,RUNG_Y).lineTo(-W*.30+W*.20*Math.min(2,revealed-1),RUNG_Y).stroke({width:W*.012,color:PINK});
	};
	const drawDebris = (g: PixiGraphics) => {
		g.clear();
		if (split <= 0 || split >= 1) return;
		for (let i = 0; i < 14; i++) {
			const a = i*2.399, r = splitDrift*W*(.09+(i%4)*.032);
			const x = -W*.16 + Math.cos(a)*r, y = -H*.13+Math.sin(a)*r + split*split*H*.12;
			const s = W*(.004+(i%3)*.0025)*(1-split);
			if (i%3 === 0) {
				g.ellipse(x,y,s*1.8,s).fill({color:PINK,alpha:1-split});
				g.moveTo(x+s*1.4,y).lineTo(x+s*1.4,y-s*4).stroke({color:INK,width:2,alpha:1-split});
			} else {
				g.poly([x,y-s,x+s*2,y,x,y+s,x-s*2,y]).fill({color:i%2?ORANGE:INK,alpha:1-split});
			}
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
			const windups=new Set<number>(), chops=new Set<number>(), reveals=new Set<number>();
			let stamped=false;
			const tick=(now:number) => {
				elapsed+=Math.min(80,Math.max(0,now-previous)); previous=now;
				for (let i=0;i<steps.length;i++) {
					const local=elapsed-LEAD-i*STEP;
					if(local>=CUT-310&&!windups.has(i)){windups.add(i);context.eventEmitter.broadcast({type:'soundChefSlice'});}
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
		<Rectangle width={layout.width} height={layout.height} backgroundColor={INK} alpha={.65*alpha}/>
		<Container x={layout.width/2+shake} y={layout.height*.45} {alpha}>
			<Sprite key="v8MeterBoard" anchor={.5} width={W} height={H}/>
			<Container x={dancerX} y={dancerY} rotation={dancerSwing} scale={tapBounce} alpha={result ? .32 : 1}>
				<!-- what hangs off the figure answers the slide and the hit
				     (game/meshWin/cutIn.ts), on this step's own phase clock -->
				<PropMesh spec={CUTIN} env={{ t: phase, pushT: -1 }} anchor={0.5} width={W*.48} height={W*.48}/>
			</Container>
			<Graphics draw={drawFootfalls}/>
			<Container x={-W*.16} y={-H*.13} scale={.55+.45*back(clamp(phase/450))}>
				{#each [-1,1] as side (side)}
					<Container x={side*splitDrift*card*.68} y={splitDrift*card*.32} rotation={side*splitDrift*.52} alpha={1-clamp((split-.35)/.65)}>
						<Graphics isMask draw={(g)=>{g.clear();const s=card*.6;g.poly(side===-1?[-s,-s,s,-s,-s,s]:[s,-s,s,s,-s,s]).fill(0xffffff);}}/>
						<Sprite key={cutSymbolKey} anchor={.5} width={card} height={card}/>
						<Text text={cutLabel} anchor={.5} style={{fontFamily:GAME_FONT,fontSize:card*.49,fontWeight:GAME_FONT_WEIGHT,fill:INK}}/>
					</Container>
				{/each}
				{#if plate>0}
					<Container y={-H*.045*Math.sin(Math.PI*plate)-H*.06*(1-plate)} rotation={-.45*(1-plate)} scale={back(plate)*.76}>
						<Graphics draw={(g)=>{g.clear();g.circle(0,0,card*.46).stroke({width:5,color:PINK});}}/>
						<Sprite key="gbP" anchor={.5} width={card*1.08} height={card*1.08}/>
					</Container>
				{/if}
			</Container>
			<Graphics draw={drawDebris}/>
			<Graphics draw={drawCut}/>
			{#if disc}
				<!-- the record (the P art itself), in front of the card it smashes -->
				<Sprite key="gbP" anchor={.5} x={disc.x} y={disc.y} rotation={disc.rotation} width={disc.size} height={disc.size} alpha={disc.alpha}/>
			{/if}
			{#if !result}<Graphics draw={drawRungRail}/>{/if}
			{#each (result ? [] : [1,2,3]) as rung (rung)}
				<Container x={(rung-2)*W*.20-W*.10} y={RUNG_Y} scale={rung===currentRung && phase>=CUT && phase<CUT+380 ? 1+.2*Math.sin(Math.PI*clamp((phase-CUT)/380)) : 1}>
					<Graphics draw={(g)=>{g.clear();g.circle(0,0,W*.039).fill(rungRevealed(rung)?PINK:PAPER).stroke({color:INK,width:3});g.circle(0,0,W*.026).stroke({color:rungRevealed(rung)?PAPER:INK,width:1});}}/>
					<Text text={`${config.banditMeter.thresholds[rung-1]}`} anchor={.5} style={{fontFamily:NUMBER_FONT,fontSize:W*.03,fill:rungRevealed(rung)?PAPER:INK}}/>
					<Text text={`${removedLabelAtLevel(rung)}→P`} anchor={.5} y={H*.075} style={{fontFamily:GAME_FONT,fontSize:W*.03,fontWeight:GAME_FONT_WEIGHT,fill:rungRevealed(rung)?PINK:INK}}/>
				</Container>
			{/each}
			<!-- on the stage window's valance: cream (gold for the result) inked -->
			<Text visible={!result || opening} text={result?resultHeadline:gameText('chefSlice')} anchor={.5} y={-H*.4} scale={result?1+.14*(1-clamp((elapsed-resultAt)/240)):1} style={{fontFamily:GAME_FONT,fontSize:W*.052,fontWeight:GAME_FONT_WEIGHT,fill:result?0xf0c25e:PAPER,stroke:{color:INK,width:W*.009,join:'round'},letterSpacing:1}}/>
			{#if result && !opening}
				<Container x={W*.29} y={-H*.04-H*.06*(1-clamp(stampAge/260))} rotation={-.07-.08*(1-clamp(stampAge/260))} scale={back(clamp(stampAge/320))}>
					<Sprite key="v8Stamp" anchor={.5} width={Math.max(W*.32,200/layout.scale)} height={Math.max(W*.32,200/layout.scale)}/>
					<InkNumber text={`+${spins}`} fontSize={W*.095} role="plate" y={-W*.025}/>
					<Text text="SPINS" anchor={.5} y={W*.055} style={{fontFamily:GAME_FONT,fontSize:W*.045,fill:INK}}/>
				</Container>
			{/if}
			{#if result}
				<Text text={replacementLabel} anchor={{x:0,y:.5}} x={-replacementRowWidth/2} y={RUNG_Y} style={replacementStyle}/>
				<Sprite key="gbP" anchor={.5} x={replacementRowWidth/2-W*.055} y={RUNG_Y} width={W*.11} height={W*.11}/>
			{/if}
			<Text text={gameText(opening ? 'firstSpin' : 'nextSpins')} anchor={.5} y={H*.435} style={{fontFamily:GAME_FONT,fontSize:W*.029,fontWeight:GAME_FONT_WEIGHT,fill:INK}}/>
		</Container>
	</MainContainer>
{/if}

<div class="slice-status" role="status" aria-live="polite">{active ? (result ? resultHeadline : phase < CUT ? `${gameText('chefSlice')} ${cutLabel}` : `${cutLabel} → ${gameText('plateUpgrade')}`) : ''}</div>
<style>.slice-status {position:fixed;width:1px;height:1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap;}</style>
