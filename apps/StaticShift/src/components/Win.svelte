<script lang="ts" module>
	import type { WinLevelData } from '../game/winLevelMap';

	export type EmitterEventWin =
		| { type: 'winShow' }
		| { type: 'winHide' }
		| { type: 'winUpdate'; amount: number; winLevelData: WinLevelData };
</script>

<script lang="ts">
	import { everyFrame } from '../game/frameLoop';
	import { onDestroy } from 'svelte';
	import { Container, Graphics, Sprite, Text } from 'pixi-svelte';
	import { GAME_FONT, GAME_FONT_WEIGHT, NUMBER_FONT } from '../game/fonts';
	import BannerMesh from './BannerMesh.svelte';
	import { FadeContainer, WinCountUpProvider } from 'components-pixi';
	import { waitForResolve, waitForTimeout } from 'utils-shared/wait';
	import { bookEventAmountToCurrencyString, bookEventAmountToCountUpString } from 'utils-shared/amount';
	import { CanvasSizeRectangle, MainContainer } from 'components-layout';
	import { OnMount } from 'components-shared';

	import WinCoins from './WinCoins.svelte';
	import BigWinFx from './BigWinFx.svelte';
	
	import GoldText from './GoldText.svelte';
	import PressToContinue from './PressToContinue.svelte';
	import { SYMBOL_SIZE } from '../game/constants';
	import { getContext } from '../game/context';
	import { gameText } from '../game/i18nText';

	const context = getContext();

	// screenprint tier plaques (design/build_screenprint_ui.py) — 1000×560: a
	// coloured title band (the tier NAME is runtime type, below) over a paper
	// well the amount rolls in
	const BANNER_KEY: Record<string, string> = {
		big: 'gbWinBannerBig',
		superwin: 'gbWinBannerSuperwin',
		mega: 'gbWinBannerMega',
		epic: 'gbWinBannerEpic',
		max: 'gbWinBannerMax',
	};
	const BANNER_RATIO = 560 / 1000;
	// the tier names, set in the display face on the plaque's title band (never
	// baked into the art); the yellow MAX band takes ink, the others paper
	const TIER_TITLE: Record<string, string> = {
		big: gameText('winBig'),
		superwin: gameText('winSuper'),
		mega: gameText('winMega'),
		epic: gameText('winEpic'),
		max: gameText('introMaxWinTitle'),
	};
	// longer locales ("ЭПИЧЕСКИЙ ВЫИГРЫШ") shrink to the title band instead of
	// running off the plaque: ~0.62em per glyph plus the 4px tracking
	const titleScale = (title: string, bw: number, bh: number) =>
		Math.min(1, (bw * 0.62) / Math.max(1, title.length * (bh * 0.17 * 0.62 + 4)));
	// presentation intensity scales with the tier
	const TIER_FX: Record<string, { mult: number; glowTint: number }> = {
		big: { mult: 1, glowTint: 0xe5e2d6 },
		superwin: { mult: 1.25, glowTint: 0xe5e2d6 },
		mega: { mult: 1.5, glowTint: 0xf4c21b },
		epic: { mult: 1.8, glowTint: 0xf4c21b },
		max: { mult: 2.2, glowTint: 0xf4c21b },
	};

	let show = $state(false);
 $effect(()=>{context.stateGame.winCelebrationShow=show && winLevelData?.type === 'big';});
	let amountWidth = $state(0);
	let amount = $state(0);
	let winLevelData = $state<WinLevelData>();
	let oncomplete = $state(() => {});
	let onCountUpComplete = $state(() => {});


 // One semantic contact drives scene, ink flash, audio and the plaque settle.
 let shake=$state({x:0,y:0});let flash=$state(0);let punch=$state(1);
 let fxNow=$state(-1),fxRaf=0;
 const stopBannerFx=()=>{cancelAnimationFrame(fxRaf);fxNow=-1;flash=0;};
 const startBannerFx=()=>{
  stopBannerFx();const start=performance.now();let contact=false;
  const tick=(now:number)=>{
   fxNow=(now-start)/1000;const power=winLevelData?(TIER_FX[winLevelData.alias]?.mult??1):1;
   if(!contact && fxNow>=.145){contact=true;
    context.eventEmitter.broadcast({type:'boardFrameImpact',kind:'win',strength:.40+power*.46});
    context.eventEmitter.broadcast({type:'soundBigWinBlast'});
    context.eventEmitter.broadcast({type:'soundWinTier',tier:winLevelData!.alias});
    performance.mark('staticshift:win-contact:'+winLevelData!.alias);
   }
   const since=fxNow-.145;
   flash=since>=0&&since<.065?(power>=1.8?.42:.18)*(1-since/.065):0;
   // Plaque itself stays centred; only the world receives the downward impulse.
   shake={x:0,y:0};punch=1;fxRaf=requestAnimationFrame(tick);
  };fxRaf=requestAnimationFrame(tick);
 };
 onDestroy(stopBannerFx);

 // Small-win stamp: 1.45 → 1 over 140 ms with a slight counter-turn, then a
 // 60 ms settle — the same contact language as the plaque, a size down.
 let smallPop=$state({scale:1,rotation:0});let popRaf=0;
 const startSmallPop=()=>{
  cancelAnimationFrame(popRaf);const start=performance.now();
  const tick=(now:number)=>{const t=(now-start)/1000;
   if(t<.14){const k=1-(1-t/.14)**3;smallPop={scale:1.45-.45*k,rotation:-.07*(1-k)};}
   else if(t<.2){const k=(t-.14)/.06;smallPop={scale:1-.04*Math.sin(k*Math.PI),rotation:0};}
   else{smallPop={scale:1,rotation:0};return;}
   popRaf=requestAnimationFrame(tick);};
  popRaf=requestAnimationFrame(tick);
 };
 onDestroy(()=>cancelAnimationFrame(popRaf));
 const TICKET_W=SYMBOL_SIZE*3.3,TICKET_H=SYMBOL_SIZE*1.08;
 const drawTicket=(g: import('pixi.js').Graphics)=>{
  const w=TICKET_W/2,h=TICKET_H/2;g.clear();
  // off-register shadow plate, then the ink ticket with a paper keyline
  g.poly([-w+10,-h+12,w+12,-h+8,w+9,h+12,-w+8,h+10]).fill({color:0x15191f,alpha:.55});
  g.poly([-w,-h+3,-w*.2,-h,w,-h+2,w-3,h,w*.3,h+2,-w+2,h-1]).fill(0x22252e).stroke({width:5,color:0x15191f});
  g.poly([-w+9,-h+11,w-10,-h+10,w-11,h-9,-w+10,h-10]).stroke({width:2,color:0xe5e2d6,alpha:.55});
 };
 const bannerPose=$derived.by(()=>{
  const t=Math.max(0,fxNow);const strength=winLevelData?(TIER_FX[winLevelData.alias]?.mult??1):1;
  const scale=t<.145?1.55-.55*(1-(1-t/.145)**2):t<.205?1:1+.035*Math.sin(Math.min(1,(t-.205)/.15)*Math.PI)*Math.max(0,1-(t-.205)/.15);
  return{scale,glow:0,blink:t>=.145&&t<.205?.1*(1-(t-.145)/.06):0};
 });

	context.eventEmitter.subscribeOnMount({
		winShow: () => (show = true),
		winHide: () => {
			show = false;
			stopBannerFx();
		},
		winUpdate: async (emitterEvent) => {
			amount = emitterEvent.amount;
			winLevelData = emitterEvent.winLevelData;
			if (emitterEvent.winLevelData.type === 'big') {
				startBannerFx();
			}
			await waitForResolve((resolve) => (oncomplete = resolve));
		},
	});
</script>

<!-- 140 ms for a small win: the shared 400 ms default ate most of its time on
     screen, so the amount only ever showed half-transparent -->
<FadeContainer {show} duration={winLevelData?.type === 'big' ? 400 : 140}>
	{#if winLevelData}
		{@const isBigWin = winLevelData.type === 'big'}
		{@const duration = winLevelData.presentDuration}
		<WinCountUpProvider {amount} {duration} oncomplete={() => onCountUpComplete()}>
			{#snippet children({ countUpAmount, startCountUp, finishCountUp, countUpCompleted })}
				{#if isBigWin}
					<CanvasSizeRectangle backgroundColor={0x000000} backgroundAlpha={0.5} />
				{/if}

				<OnMount
					onmount={async () => {
						if (!isBigWin) startSmallPop();
						// impact hold: freeze a few frames under the white flash before
						// the numbers start rolling
						if (isBigWin) await waitForTimeout(205);
						await startCountUp();
						// a small win has to be read before the ways take over the board
						await waitForTimeout(isBigWin ? 700 : 420);
						oncomplete();
					}}
				/>

				<!-- behind the plaque: falling in front of it, the bananas buried the
				     tier name and the amount the whole presentation is there to show -->
				{#if isBigWin && ['epic','max'].includes(winLevelData!.alias)}<WinCoins emit={!countUpCompleted} levelAlias={winLevelData!.alias} />{/if}

				{#if isBigWin}
					{@const fx = TIER_FX[winLevelData!.alias] ?? TIER_FX.big}
					<MainContainer>
						<BigWinFx
							x={context.stateGameDerived.boardLayout().x + shake.x * 0.4}
							y={context.stateGameDerived.boardLayout().y + shake.y * 0.4}
							intensity={fx.mult}
						/>
					</MainContainer>
				{/if}

				<MainContainer>
					<Container
						x={context.stateGameDerived.boardLayout().x + shake.x}
						y={context.stateGameDerived.boardLayout().y + shake.y}
						scale={punch}
					>
						{#if isBigWin}
							{@const alias = winLevelData!.alias}
							{@const fx = TIER_FX[alias] ?? TIER_FX.big}
							{@const bannerKey = BANNER_KEY[alias] ?? BANNER_KEY.big}
							{@const bw = SYMBOL_SIZE * 5.2}
							{@const bh = bw * BANNER_RATIO}
							<Container scale={bannerPose.scale}>
								<!-- the plaque as a mesh: jelly on the slam, the title bulging with
								     each flare, a squash when the count lands (meshWin/banner.ts).
								     Its additive flare copy rides the same geometry. -->
								<BannerMesh key={bannerKey} width={bw} height={bh} blink={bannerPose.blink} landed={countUpCompleted} />
								<Text
									anchor={0.5}
									y={bh * (183 / 560 - 0.5)}
									scale={titleScale(TIER_TITLE[alias] ?? TIER_TITLE.big, bw, bh)}
									text={TIER_TITLE[alias] ?? TIER_TITLE.big}
									style={{
										fontFamily: GAME_FONT,
										fontSize: bh * 0.17,
										fontWeight: GAME_FONT_WEIGHT,
										letterSpacing: 4,
										fill: 0x15191f,
									}}
								/>
								<!-- amount rolls inside the plaque's paper well, in ink -->
								<Container y={bh * (395 / 560 - 0.5)} scale={Math.min(1, (bw * 0.6) / Math.max(1, amountWidth))}>
									<Text
										anchor={0.5}
										text={bookEventAmountToCountUpString(countUpAmount, amount)}
										onresize={(size) => (amountWidth = size.width)}
										style={{ fontFamily: NUMBER_FONT, fontSize: bh * 0.2, fontWeight: '400', letterSpacing: 2, fill: 0x15191f }}
									/>
								</Container>
							</Container>
						{:else}
							<!-- small wins: the amount is stamped onto an ink ticket, never
							     straight over the symbol art, and lands with a short slam -->
							<Container scale={smallPop.scale} rotation={smallPop.rotation}>
								<Graphics draw={drawTicket} />
								<GoldText
									maxWidth={SYMBOL_SIZE * 2.9}
									text={bookEventAmountToCountUpString(countUpAmount, amount)}
									fontSize={SYMBOL_SIZE * 0.78}
								/>
							</Container>
						{/if}
					</Container>
				</MainContainer>

				{#if flash > 0}
					<CanvasSizeRectangle backgroundColor={0xe5e2d6} backgroundAlpha={flash} />
				{/if}

				<!-- a small win rolls and moves on by itself: the press still skips
				     it, but the prompt only shows on the plaques that wait -->
				<PressToContinue
					position="betweenBoardAndBottom"
					showLabel={isBigWin}
					onpress={() => (countUpCompleted ? oncomplete() : finishCountUp())}
				/>
			{/snippet}
		</WinCountUpProvider>
	{/if}
</FadeContainer>
