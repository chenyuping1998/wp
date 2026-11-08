<script lang="ts">
 import {onMount} from 'svelte';
 import {Container,Sprite,Graphics,Text} from 'pixi-svelte';
 import {MainContainer} from 'components-layout';
 import {getContext} from '../game/context';
 import {stateBloodMoon as bm,timingFor} from '../game/bloodmoon.svelte';
 import {GAME_FONT} from '../game/fonts';
 import {BOARD} from '../game/geometry';
 import {winEnvelope} from '../game/winMotion';
 import {MotionClock} from '../game/motionClock';
 import {requestPresentationFrame,cancelPresentationFrame} from '../game/frameScheduler';
 import {easeOut,clamp01,ENERGY_END,MULTIPLIER_AT,PLUS_SPINS_AT,backgroundMix,wildIntensity,collectionVisual,panelMotion,winTier} from '../game/presentation';
 import BloodMoonReels from './BloodMoonReels.svelte';
 import BloodMoonEnergy from './BloodMoonEnergy.svelte';
 import BloodMoonCharacter from './BloodMoonCharacter.svelte';
 import BloodMoonAtmosphere from './BloodMoonAtmosphere.svelte';
 import BloodMoonWin from './BloodMoonWin.svelte';
 import BloodMoonTransition from './BloodMoonTransition.svelte';
 const context=getContext();
 let idle=$state(0),reduced=$state(false);
 onMount(()=>{
  const preference=window.matchMedia('(prefers-reduced-motion: reduce)'),clock=new MotionClock(performance.now());
  const visibility=()=>clock.setHidden(document.hidden,performance.now());visibility();document.addEventListener('visibilitychange',visibility);
  const update=()=>reduced=preference.matches;update();preference.addEventListener('change',update);
  let id:number;const tick=(t:number)=>{idle=clock.read(t)/1000;id=requestPresentationFrame(tick);};id=requestPresentationFrame(tick);
  return()=>{cancelPresentationFrame(id);preference.removeEventListener('change',update);document.removeEventListener('visibilitychange',visibility);};
 });
 const layout=$derived.by(context.stateLayoutDerived.mainLayout);
 const portrait=$derived(context.stateLayoutDerived.layoutType()==='portrait');
 const stageWidth=$derived(['portrait','tablet'].includes(context.stateLayoutDerived.layoutType())?1422:1280);
 const scale=$derived(Math.min(layout.width/stageWidth,(layout.height-(portrait?350:140))/BOARD.stageHeight));
 const sx=$derived((layout.width-stageWidth*scale)/2);
 const sy=$derived(Math.max(35,(layout.height-(portrait?350:140)-BOARD.stageHeight*scale)/2));
 const clock=$derived(bm.clock);
 const reveal=$derived(bm.reveal);
 const timing=$derived(reveal?timingFor(reveal,bm.turbo):{stopAt:0,attackAt:2300,fogAt:2600,revealAt:3800,outcomeStep:0,duration:5400});
 const spinning=$derived(bm.phase==='spin');
 const wild=$derived(spinning&&!!reveal?.wildPlan.triggered&&clock>=400&&clock<timing.duration);
 const red=$derived(wildIntensity(reveal,bm.phase,clock,bm.turbo));
 const sceneMix=$derived(backgroundMix(bm.phase,bm.inFree,clock));
 const shake=$derived(!reduced&&wild&&clock>=timing.attackAt&&clock<timing.attackAt+280?Math.sin(clock*.06)*2.5*(1-clamp01((clock-timing.attackAt)/280)):0);
 const bars=$derived(bm.bars.length?bm.bars:Array.from({length:6},(_,c)=>({col:c,size:1,head:0,icons:bm.board[c]})));

 const mergeVisuals=$derived.by(()=>{
  if(!spinning||!reveal)return [];
  return bars.filter(b=>b.size>=3).flatMap(bar=>{
   const active=reveal.mergePlan.filter(step=>step.col===bar.col&&clock>=1500+step.delayMs).at(-1);
   if(!active||clock>timing.stopAt+180)return [];
   const p=active.durationMs?clamp01((clock-1500-active.delayMs)/active.durationMs):1;
   return [{col:bar.col,width:Math.min(bar.size,active.fromSize+(active.toSize-active.fromSize)*easeOut(p)),start:1500+reveal.mergePlan.find(step=>step.col===bar.col)!.delayMs}];
  });
 });
 const reelPlan=$derived({bars,board:bm.board,reveal,turbo:bm.turbo});
 const collection=$derived(bm.phase==='progress'&&bm.progress?collectionVisual(bm.progress.before,bm.progress.after,clock):{points:bm.fg.points,fill:(bm.fg.points%12)/12,pulse:0});
 const visualPoints=$derived(Math.floor(collection.points));
 const visualMultiplier=$derived(bm.phase==='progress'&&bm.progress&&clock<MULTIPLIER_AT?bm.progress.before.multiplier:bm.fg.multiplier);
 const visualTotalSpins=$derived(bm.phase==='progress'&&bm.progress&&clock<PLUS_SPINS_AT?bm.progress.before.spinsTotal:bm.fg.spinsTotal);
 const style={fontFamily:GAME_FONT,fontWeight:'bold' as const,fill:0xf4db9b,stroke:{color:0x27091a,width:5},dropShadow:{color:0x000000,blur:4,distance:2}};
 const showingWins=$derived((bm.phase==='win'||bm.phase==='idle')&&bm.wins.length>0);
 const activeLine=$derived(showingWins?bm.wins[Math.floor((bm.phase==='win'?clock:idle*1000)/900)%bm.wins.length]:null);
 const activeCells=$derived(new Set(activeLine?.positions.map(p=>`${p.col}:${p.row}`)??[]));
 const linePoints=$derived(activeLine?.positions.map(p=>({x:(p.col+.5)*BOARD.cell,y:(p.row+.5)*BOARD.cell}))??[]);
 const lineSpark=$derived.by(()=>{
  if(linePoints.length<2)return {x:0,y:0};
  const travel=(reduced?.5:(idle*.65)%1)*(linePoints.length-1),index=Math.min(linePoints.length-2,Math.floor(travel)),p=travel-index;
  return {x:linePoints[index].x+(linePoints[index+1].x-linePoints[index].x)*p,y:linePoints[index].y+(linePoints[index+1].y-linePoints[index].y)*p};
 });
 const shade=$derived(bm.phase==='win'&&winTier(bm.spinWin)?winEnvelope(clock,bm.duration)*.78:
  bm.phase==='freeStart'||bm.phase==='freeEnd'?panelMotion(clock,bm.duration).alpha*.68:
  bm.phase==='progress'&&bm.progress?.addedSpins&&clock>=MULTIPLIER_AT?panelMotion(clock-MULTIPLIER_AT,bm.duration-MULTIPLIER_AT).alpha*.4:0);
 // Enlarge around the feet: the packed clips contain substantial transparent
 // headroom. This places the visible figure near board height, with the base
 // and FG multiplier ladder kept to its left.
 const characterLayout={x:960,y:-65,width:475,height:750};
</script>

<!-- Background covers any aspect ratio; the playable geometry scales uniformly. -->
<BloodMoonAtmosphere time={idle} {reduced}/>
<MainContainer>
 <Container x={sx+shake} y={sy} {scale}>
  <Sprite key="bmScene_treeLeft" x={-30+Math.sin(reduced?0:idle*.12)*4} y={280} width={270} height={400} alpha={(1-sceneMix)*.6}/>
  <Sprite key="bmScene_treeRight" x={1110+Math.sin(reduced?0:idle*.13+2)*3} y={210} width={280} height={420} alpha={(1-sceneMix)*.5}/>
  <Sprite key="bmFrame_base" x={BOARD.x-BOARD.framePad} y={BOARD.y-BOARD.framePad} width={BOARD.frameSide} height={BOARD.frameSide}/>
  <Sprite key="bmFrame_free" x={BOARD.x-BOARD.framePad} y={BOARD.y-BOARD.framePad} width={BOARD.frameSide} height={BOARD.frameSide} alpha={sceneMix}/>
  <Sprite key="bmFrame_red" x={BOARD.x-BOARD.framePad} y={BOARD.y-BOARD.framePad} width={BOARD.frameSide} height={BOARD.frameSide} alpha={red}/>
  <Sprite key="bmFrame_glow-gold" x={BOARD.x-BOARD.framePad} y={BOARD.y-BOARD.framePad} width={BOARD.frameSide} height={BOARD.frameSide} alpha={.12+sceneMix*.12+(showingWins?.2:0)+.04*Math.sin(reduced?0:idle*.75)} blendMode="add"/>
  <Sprite key="bmFrame_glow-red" x={BOARD.x-BOARD.framePad} y={BOARD.y-BOARD.framePad} width={BOARD.frameSide} height={BOARD.frameSide} alpha={red*.5} blendMode="add"/>
  <Text x={640} y={2} anchor={.5} text="BLOOD MOON COUNT" style={{...style,fontSize:27,letterSpacing:3}}/>
  <Text x={640} y={757} anchor={.5} text={activeLine?`LINE ${String(activeLine.line+1).padStart(2,'0')}   ·   ${activeLine.count} MATCH`:'6 × 6   ·   50 LINES'} style={{...style,fontSize:16,stroke:{color:0x080b15,width:2},fill:activeLine?0xffd58f:0x82bfc6,letterSpacing:4}}/>
  <Container x={BOARD.x} y={BOARD.y}>
   <Graphics draw={g=>g.rect(0,0,BOARD.side,BOARD.side).fill({color:0x041017,alpha:.94})}/>
   <Container>
    <Graphics isMask draw={g=>g.rect(0,0,BOARD.side,BOARD.side).fill(0xffffff)}/>
    <BloodMoonReels plan={reelPlan} clock={spinning?clock:0} {spinning} line={activeLine??null} pop={showingWins&&!reduced?1+.012*(1+Math.sin(idle*5)):1}/>
    {#if showingWins&&activeLine}
     <Graphics alpha={.65+.2*Math.sin(reduced?0:idle*4)} draw={g=>{
      for(let c=0;c<6;c++)for(let r=0;r<6;r++)if(activeCells.has(`${c}:${r}`))g.roundRect(c*BOARD.cell+2,r*BOARD.cell+2,BOARD.cell-4,BOARD.cell-4,4).stroke({color:0xfad975,width:2});
     }}/>
     <Graphics draw={g=>{
      if(linePoints.length>1){
       for(const [i,p] of linePoints.entries())i?g.lineTo(p.x,p.y):g.moveTo(p.x,p.y);
       g.stroke({color:0xffd58d,width:8,alpha:.12});
       for(const [i,p] of linePoints.entries())i?g.lineTo(p.x,p.y):g.moveTo(p.x,p.y);
       g.stroke({color:0xffe5b0,width:2,alpha:.8});
      }
     }}/>
     {#if linePoints.length>1}<Graphics x={lineSpark.x} y={lineSpark.y} draw={g=>g.circle(0,0,5).fill({color:0xffedbc,alpha:.9})}/>{/if}
    {/if}
    {#if spinning && reveal}
     {#each mergeVisuals as merge}
      <Sprite key={`bmFx_merge_${Math.floor(Math.max(0,clock-merge.start)/33.333)%60}`} x={merge.col*BOARD.cell-9} y={-10} width={merge.width*BOARD.cell+18} height={BOARD.side+20} alpha={clock>timing.stopAt?1-(clock-timing.stopAt)/180:1}/>
     {/each}
     {#if wild}
      {#each reveal.wildPlan.targets as target,i}
       {@const local=clock-timing.fogAt-i*35}
       {@const outcome=timing.revealAt+i*timing.outcomeStep}
       {#if local>=0 && clock<outcome}
        <Sprite key={local<450?`bmFx_wildIn_${Math.min(14,Math.floor(local/30))}`:`bmFx_wildLoop_${Math.floor((local-450)/33.333)%30}`} x={target.col*BOARD.cell} y={target.top*BOARD.cell} width={target.size*BOARD.cell} height={target.size*BOARD.cell}/>
       {:else if clock>=outcome && clock<outcome+1000}
        <Sprite key={target.success?`bmFx_wildSuccess_${Math.min(15,Math.floor((clock-outcome)/33.333))}`:`bmFx_wildFail_${Math.min(29,Math.floor((clock-outcome)/33.333))}`} x={target.col*BOARD.cell} y={target.top*BOARD.cell} width={target.size*BOARD.cell} height={target.size*BOARD.cell} alpha={1-clamp01((clock-outcome)/1000)}/>
       {/if}
      {/each}
     {/if}
    {/if}
   </Container>
  </Container>
  <Graphics alpha={.25*(1-red)} draw={g=>g.ellipse(1195,673,110,13).fill(0x020810)}/>
  <BloodMoonCharacter {...characterLayout}/>
  {#if bm.inFree}
   <Container alpha={sceneMix}>
   <Graphics draw={g=>{
    g.roundRect(201,190,50,330,20).fill({color:0x100d1b,alpha:.96}).stroke({color:0xa18156,width:3});
    g.roundRect(210,204,32,304,13).fill({color:0x281b28,alpha:.85}).stroke({color:0x514339,width:1});
    g.moveTo(227,170).lineTo(245,192).lineTo(227,214).lineTo(209,192).closePath().fill(0x7b2342).stroke({color:0xd1a36b,width:2});
    g.moveTo(1049,97).lineTo(1049,675).stroke({color:0x9e7953,width:2,alpha:.5});
    for(const [i,mult] of [2,3,5,8,12].entries())g.roundRect(995,90+i*129,109,63,7).fill({color:0x110b18,alpha:.85}).stroke({color:visualMultiplier>=mult?0xb99a65:0x514340,width:1.5,alpha:.9});
   }}/>
   <Sprite key="bmUi_freeEnergyFrame" x={112} y={492} width={185} height={210}/>
   <Graphics draw={g=>{
    const y=506-collection.fill*295;
    g.roundRect(217,y,16,collection.fill*295+1,5).fill({color:0xffba42,alpha:.8});
    g.roundRect(221,y,5,collection.fill*295+1,2).fill({color:0xffe3a2,alpha:.85});
    g.ellipse(225,y,13,4).fill({color:0xffe5aa,alpha:collection.fill>.01?.65:0});
    if(collection.pulse>0)g.circle(225,330,45+collection.pulse*35).stroke({color:0xffcf81,alpha:collection.pulse*.5,width:3});
   }}/>
   <Text x={227} y={552} anchor={.5} text={`${visualPoints} POINTS`} style={{...style,fontSize:17}}/>
   <Text x={220} y={595} anchor={.5} text={`${bm.fg.spinsPlayed} / ${visualTotalSpins}`} style={{...style,fontSize:27}}/>
   <Text x={220} y={625} anchor={.5} text="FREE SPINS" style={{...style,fontSize:14}}/>
   <Text x={1049} y={48} anchor={.5} text={'BLOOD\nPOWER'} style={{...style,fontSize:13,lineHeight:16,stroke:{color:0x140c18,width:2},letterSpacing:1.5}}/>
   {#each [2,3,5,8,12] as mult,i}
    {@const pop=visualMultiplier===mult&&bm.phase==='progress'&&!reduced?1+.2*Math.sin(clamp01((clock-MULTIPLIER_AT)/450)*Math.PI):1}
    <Sprite key={`bmMultiplier_${mult}`} x={1007-42*(pop-1)} y={100+i*129-21.5*(pop-1)} width={84*pop} height={43*pop} alpha={visualMultiplier>=mult?1:.24}/>
   {/each}
   {#if bm.phase==='progress'&&bm.progress?.addedSpins&&clock>=PLUS_SPINS_AT}
    <Text x={220} y={565-easeOut((clock-PLUS_SPINS_AT)/600)*45} anchor={.5} alpha={1-clamp01((clock-PLUS_SPINS_AT-300)/300)} text={`+${bm.progress.addedSpins}`} style={{...style,fontSize:36,fill:0xffd48c}}/>
   {/if}
   </Container>
  {:else}
   {@const huntPop=wild&&!reduced?1+.14*Math.sin(clamp01((clock-400)/330)*Math.PI):1}
   <Sprite key="bmScene_wildHuntTitle" anchor={.5} x={188} y={280} width={170*huntPop} height={32.65*huntPop} alpha={.7+red*.3}/>
   {#if wild}<Sprite key="bmEnvironment_glint" anchor={.5} x={188} y={280} width={230} height={230} alpha={red*.13} tint={0xcd3658} blendMode="add"/>{/if}
  {/if}

  <BloodMoonEnergy board={bm.board} clock={bm.phase==='progress'?clock:0} active={bm.phase==='progress'&&clock<ENERGY_END}/>
  {#if !reduced&&spinning&&reveal?.wildPlan.triggered&&clock>timing.attackAt&&clock<timing.fogAt+1100}
   <Graphics draw={g=>{for(let i=0;i<11;i++){
    const p=clamp01((clock-timing.attackAt-i*35)/1000);if(p<=0||p>=1)continue;
    const x=1120+(620-1120)*easeOut(p)+Math.sin(p*9+i)*24;
    const y=140+(355-140)*p+Math.sin(p*6+i)*46;
    const wing=7+Math.sin(clock*.023+i)*4;
    g.moveTo(x,y+3).lineTo(x-15,y-wing).lineTo(x-11,y+4).lineTo(x-6,y+2).lineTo(x,y+8).lineTo(x+6,y+2).lineTo(x+11,y+4).lineTo(x+15,y-wing).closePath().fill({color:0x79142e,alpha:.85});
   }}}/>
  {/if}
 </Container>
</MainContainer>
<!-- The veil follows the canvas, rather than forming a rectangle at stage edges. -->
<Graphics alpha={shade} draw={g=>g.rect(0,0,context.stateLayoutDerived.canvasSizes().width,context.stateLayoutDerived.canvasSizes().height).fill(0x080614)}/>
<MainContainer><Container x={sx} y={sy} {scale}>
 <BloodMoonWin {reduced}/>
 <BloodMoonTransition {reduced}/>
</Container></MainContainer>
