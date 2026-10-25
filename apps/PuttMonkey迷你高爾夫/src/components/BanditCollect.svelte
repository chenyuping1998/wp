<script lang="ts" module>
	type Cell = { reel: number; row: number };
	export type EmitterEventBanditCollect =
		| {
				type: 'banditCollect';
				collectors: Cell[];
				/** value in book units (100 = 1x bet) */
				sacks: (Cell & { value: number })[];
				perCollector: number;
				mult: number;
				amount: number;
		  }
		| { type: 'banditCollectClear' };
</script>

<script lang="ts">
 import { onDestroy } from 'svelte';
 import { stateBet } from 'state-shared';
 import { Container, Graphics, Sprite, Text } from 'pixi-svelte';
 import { bookEventAmountToCurrencyString } from 'utils-shared/amount';
 import { getContext } from '../game/context';
 import { SYMBOL_SIZE, BOARD_DIMENSIONS, isBigPrize } from '../game/constants';
 import { getSymbolX } from '../game/utils';
 import BoardContainer from './BoardContainer.svelte';
 import SackBadge, { ballFrame } from './SackBadge.svelte';
 import PropMesh from './PropMesh.svelte';
 import { P_PICK, pPickLift } from '../game/meshWin';
 import { CANVAS, type PointFrame } from '../game/meshWin/meshRig';
 import { NUMBER_FONT } from '../game/fonts';
 import { puttStrokePose, puttSequence, putterSwing } from '../game/collectionMotion';
 import { impact } from '../game/motionKit';
 import { collectionVisual } from '../game/collectionPresentation.svelte';
 const context=getContext();
 const SAUCER=false;
 const PAPER=0xfff6df, RED=0xe5432f, INK=0x1b2a22, MECH=0x3fb4e8;
 const PICK_MS=80, STAMP_MS=520, HOLD_MS=280;
 const CUP_SIZE=SYMBOL_SIZE*.88;
 type Tag={x:number;y:number;shown:number;stamped:boolean;pop:number;catchAt:number};
 type Sack={x:number;y:number;value:number;side:number;cell:string};
 type Flyer={fromX:number;fromY:number;toX:number;toY:number;pickAt:number;start:number;end:number;duration:number;finale:boolean;wind:number;cell:string;value:number;launched:boolean;sunk:boolean};
 let sackBalls=$state<Record<number,PointFrame>>({});
 let sacks=$state<Sack[]>([]),tags=$state<Tag[]>([]),flyers=$state<Flyer[]>([]);
 let mult=$state(1),clock=$state(0),pickStart=$state(-1),stampStart=$state(-1),tagAlpha=$state(1);
 let active=$state<Tag|null>(null),actStart=$state(-1),leaveAt=$state(-1),itemStagger=$state(90);
 let collected=false,raf=0,running=false,previous=0,epoch=0,groupPace=1,restoreAt=-1;
 const ease=(k:number)=>{const v=Math.max(0,Math.min(1,k));return v*v*(3-2*v);};
 const shipBaseY=$derived(context.stateLayoutDerived.layoutType()==='portrait'?22:-42);
 const destination=(tag:Tag)=>({x:tag.x,y:SAUCER?shipBaseY+34:tag.y+SYMBOL_SIZE*.77});
 const ship=$derived(active?{
  x:active.x-80*(1-ease((clock-actStart)/240)),
  y:shipBaseY+Math.sin((clock-actStart)/250)*3-(leaveAt<0?0:100*ease((clock-leaveAt)/220)),
  alpha:leaveAt<0?ease((clock-actStart)/180):1-ease((clock-leaveAt)/220),
  rotation:Math.sin((clock-actStart)/300)*.026
 }:null);
 const beam=$derived(active?ease((clock-actStart-100)/180)*(leaveAt<0?1:1-ease((clock-leaveAt)/160)):0);
 const cup=$derived(active?{...destination(active),open:ease((clock-actStart)/220),alpha:leaveAt<0?1:1-ease((clock-leaveAt)/220),
  // each ball dropping in knocks the pin: up on the hit and back on a spring
  // (motionKit.impact), the cloth answering a beat later
  hop:active.catchAt<0?0:9*impact(clock,active.catchAt,5,.42),
  wave:active.catchAt<0?0:impact(clock,active.catchAt+50,3.4,.35)}:null);
 const poseAt=(f:Flyer,t:number)=>puttStrokePose({x:f.fromX,y:f.fromY},{x:f.toX,y:f.toY},t,f.finale);
 const flyerPos=(f:Flyer)=>{
  const t=Math.max(0,Math.min(1,(clock-f.start)/f.duration)),p=poseAt(f,t),prev=poseAt(f,Math.max(0,t-.035));
  // on the ground from the end of the pick, waiting for the putter
  return {...p,t,prevX:prev.x,prevY:prev.y,visible:clock>=f.pickAt+PICK_MS&&clock<f.end,trailAlpha:0};
 };
 // THE PUTTER (2026-10-23): the golfer's own, cut off his drawing. It hangs
 // from a grip above the ball, on the side away from the cup, and strikes on
 // collectionMotion.putterSwing: the contact is the instant the ball starts.
 // Sized so its head is about two thirds of the ball's width.
 const PUTTER_LEN=SYMBOL_SIZE*1.45,PUTTER_K=PUTTER_LEN/284,BALL_R=CUP_SIZE*.376;
 const putterPos=(f:Flyer)=>{
  const sw=putterSwing(f.wind),age=clock-f.pickAt;
  if(age<0||age>sw.duration+20)return null;
  const dir=f.toX>=f.fromX?1:-1,headHalf=PUTTER_LEN*.134;
  return {
   x:f.fromX-dir*(headHalf+BALL_R*.92),y:f.fromY+BALL_R*.3-PUTTER_LEN,
   rotation:dir*(sw.at(age)-.133),dir,
   alpha:Math.min(1,age/70)*(1-Math.max(0,Math.min(1,(age-sw.hitAt-(sw.duration-sw.hitAt)*.55)/((sw.duration-sw.hitAt)*.45)))),
  };
 };
 const loop=(now:number)=>{
  const dt=Math.min(80,Math.max(0,now-previous));previous=now;
  // The ball collection is this game's centrepiece (2026-10-17): it plays at
  // full length under turbo too. Turbo still shortens the reels and win acts.
  // Only turbo 2 (two bolts) quickens the collection, and only to 1.5x.
  clock+=dt*groupPace*(stateBet.isTurbo&&stateBet.turboLevel===2?1.5:1);
  if(pickStart>=0)for(let i=0;i<sacks.length;i++)
   if(flyers[i]&&clock>=flyers[i].pickAt)collectionVisual.cells[sacks[i].cell]=true;
  if(restoreAt>=0)collectionVisual.alpha=.08+.92*ease((clock-restoreAt)/220);
  for(let i=0;i<flyers.length;i++){
   const flyer=flyers[i];
   if(!flyer.launched&&clock>=flyer.start){flyer.launched=true;context.eventEmitter.broadcast({type:'soundSackLand'});}
   if(!flyer.sunk&&clock>=flyer.start+flyer.duration*(flyer.finale?.89:.78)){flyer.sunk=true;context.eventEmitter.broadcast({type:'soundCollectionSink',index:i});}
  }
  raf=requestAnimationFrame(loop);
 };
 const startClock=()=>{
  if(running)return;
  running=true;previous=performance.now();if(!clock)clock=previous;raf=requestAnimationFrame(loop);
 };
 const stopClock=()=>{running=false;cancelAnimationFrame(raf);};
 const reset=()=>{
  context.eventEmitter.broadcast({type:'soundCollectionStop'});
  epoch++;stopClock();clock=0;sacks=[];sackBalls={};tags=[];flyers=[];active=null;
  pickStart=-1;stampStart=-1;leaveAt=-1;restoreAt=-1;tagAlpha=1;collected=false;
  collectionVisual.cells={};collectionVisual.alpha=1;
 };
 onDestroy(reset);
 const waitUntil=(until:number,token:number)=>new Promise<boolean>(resolve=>{
  const check=()=>{if(token!==epoch)return resolve(false);if(clock>=until)return resolve(true);requestAnimationFrame(check);};
  requestAnimationFrame(check);
 });
 const waitMs=(ms:number,token:number)=>waitUntil(clock+ms,token);
 const pickAge=(i:number)=>{
  if(pickStart<0)return -1;
  const age=clock-(flyers[i]?.pickAt??Infinity);
  return age>=0&&age<PICK_MS?age:-1;
 };
 // the ticket takes each ball as a hit: up and back on the kit's spring
 const tagPop=(tag:Tag)=>tag.pop<0?1:1+.12*impact(clock,tag.pop,4.5,.45);
 const stampScale=()=>{
  if(stampStart<0)return 0;const t=Math.min(1,(clock-stampStart)/STAMP_MS);
  return t<.35?2.2-1.3*ease(t/.35):.9+.1*ease((t-.35)/.65);
 };
 context.eventEmitter.subscribeOnMount({
  banditCollect:async(event)=>{
   reset();const token=epoch;startClock();mult=event.mult;
   const first=event.collectors[0];
   sacks=event.sacks.map(s=>({x:getSymbolX(s.reel),y:s.row*SYMBOL_SIZE-SYMBOL_SIZE/2,
    value:s.value,side:first&&getSymbolX(first.reel)<getSymbolX(s.reel)?-1:1,cell:`${s.reel}:${s.row}`}));
   tags=event.collectors.map(c=>({x:getSymbolX(c.reel),y:c.row*SYMBOL_SIZE-SYMBOL_SIZE/2-SYMBOL_SIZE*.36,
    shown:0,stamped:false,catchAt:-1,pop:-1}));
   const sequence=puttSequence(sacks.length);
   for(let b=0;b<tags.length;b++){
    const tag=tags[b];groupPace=b?1/.7:1;active=tag;actStart=clock;leaveAt=-1;restoreAt=-1;
    collectionVisual.cells={};collectionVisual.alpha=.08;
    // Read left-to-right within a value; save the biggest prize for the last putt.
    sacks=[...sacks].sort((a,b)=>a.value-b.value||a.y-b.y||a.x-b.x);
    context.eventEmitter.broadcast({type:'mascotCollect'});
    context.eventEmitter.broadcast({type:'soundCollectionStart'});
    if(!await waitMs(240,token))return;
    context.eventEmitter.broadcast({type:'soundCollectGrab'});
    pickStart=clock;
    const base=clock,to=destination(tag);
    flyers=sacks.map((s,i)=>({fromX:s.x,fromY:s.y-pPickLift(PICK_MS)*CUP_SIZE/CANVAS,
     toX:to.x,toY:to.y,pickAt:base+sequence[i].pickAt,start:base+sequence[i].start,
     end:base+sequence[i].end,duration:sequence[i].duration,finale:sequence[i].finale,wind:sequence[i].wind,cell:s.cell,
     value:s.value,launched:false,sunk:false}));
    for(let i=0;i<flyers.length;i++){
     if(!await waitUntil(flyers[i].end,token))return;
     context.eventEmitter.broadcast({type:'soundCoinIn',index:i});
     tag.shown+=flyers[i].value;tag.pop=clock;tag.catchAt=clock;
    }
    context.eventEmitter.broadcast({type:'soundCollectionStop'});
    pickStart=-1;flyers=[];leaveAt=clock;restoreAt=clock;
    if(!await waitMs(220,token))return;
    collectionVisual.cells={};collectionVisual.alpha=1;restoreAt=-1;active=null;
   }
   groupPace=1;
   if(mult>1){
    stampStart=clock;
    if(!await waitMs(STAMP_MS*.35,token))return;
    context.eventEmitter.broadcast({type:'soundCollectStamp'});
    for(const tag of tags){tag.stamped=true;tag.shown=event.perCollector*mult;tag.pop=clock;}
    if(!await waitMs(STAMP_MS*.65,token))return;
   }
   if(!await waitMs(HOLD_MS,token))return;
   collected=true;stopClock();
  },
  banditCollectClear:reset,
  winHide:async()=>{
   if(!collected||!tags.length)return;
   collected=false;const token=epoch;groupPace=1;startClock();const at=clock;
   while(tagAlpha>0){tagAlpha=Math.max(0,1-(clock-at)/320);if(!await waitMs(16,token))return;}
   tags=[];stampStart=-1;tagAlpha=1;stopClock();
  }
 });
</script>

{#snippet ink(text: string, size: number, fill: number)}
	<Text
		anchor={0.5}
		{text}
		style={{ fontFamily: NUMBER_FONT, fontSize: size, fontWeight: '400', letterSpacing: 1, fill }}
	/>
{/snippet}

<BoardContainer>

 {#if cup}
  <Container x={cup.x} y={cup.y} scale={cup.open} alpha={cup.alpha}>
   <Graphics draw={(g)=>{
    g.clear();
    g.ellipse(0,3,48,17).fill({color:INK,alpha:.20});
    g.ellipse(0,0,43,14).fill(0x7fb06a).stroke({color:PAPER,width:3});
    g.ellipse(0,-1,33,9).fill(INK);
    g.moveTo(43,-3).lineTo(43,-82-cup.hop).stroke({color:INK,width:3});
    g.poly([43,-82-cup.hop,75,-69-cup.hop-7*cup.wave,43,-57-cup.hop]).fill(PAPER).stroke({color:INK,width:2});
   }}/>
  </Container>
 {/if}

 {#each sacks as sack,i (i)}
  {@const age=pickAge(i)}
  {#if age>=0}
   <PropMesh spec={P_PICK} env={{t:age,side:sack.side}} x={sack.x} y={sack.y} width={CUP_SIZE} height={CUP_SIZE} anchor={0.5} onpose={(rig,pose)=>sackBalls[i]=ballFrame(rig,pose)}/>
   <!-- the value rides the ball's hop and tip (its mesh) -->
   <SackBadge prize={sack.value/100} x={sack.x} y={sack.y} frame={sackBalls[i]}/>
  {/if}
 {/each}
 {#each flyers as flyer,i (i)}
  {@const p=flyerPos(flyer)}
  {@const pt=putterPos(flyer)}
  <!-- the putter keeps its own time: it finishes its follow-through and
       fades even when a quick putt's ball is already down -->
  {#if pt && !SAUCER}
   <Container x={pt.x} y={pt.y} rotation={pt.rotation} alpha={pt.alpha}>
    <Sprite key="gbPutter" anchor={{x:.853,y:.141}} scale={{x:pt.dir*PUTTER_K,y:PUTTER_K}}/>
   </Container>
  {/if}
  {#if p.visible}
   <Graphics draw={(g)=>{
    g.clear();
    if(!SAUCER){
     g.ellipse(p.x,p.y+14*p.scale,24*p.scale,6*p.scale).fill({color:INK,alpha:p.alpha*.17});
    }
    
   }}/>
   <Container x={p.x} y={p.y} scale={p.scale/.88} rotation={p.rotation} alpha={p.alpha}>
    <Sprite key="gbP" anchor={0.5} width={CUP_SIZE} height={CUP_SIZE}/>
    {#if SAUCER}<SackBadge prize={flyer.value/100}/>{/if}
   </Container>
   {#if !SAUCER}
    <!-- the putted ball keeps its tier colour; the number stays upright while it rolls -->
    <SackBadge prize={flyer.value/100} x={p.x} y={p.y} scale={p.scale/.88} alpha={p.alpha}/>
   {/if}
  {/if}
 {/each}

 {#if cup}
  <Graphics draw={(g)=>{
   g.clear();
   g.moveTo(cup.x-40*cup.open,cup.y+2).quadraticCurveTo(cup.x,cup.y+17*cup.open,cup.x+40*cup.open,cup.y+2)
    .stroke({color:PAPER,width:4,alpha:cup.alpha});
  }}/>
 {/if}
	<!-- 3. each Chef's tag: a paper ticket with a red offset print, the way
	     the screenprint plates are built (flat inks, no glow) -->
	<Container alpha={tagAlpha}>
	{#each tags as tag, i (i)}
		{#if tag.shown > 0}
			{@const s = tagPop(tag)}
			{@const amountText = bookEventAmountToCurrencyString(tag.shown)}
			{@const catchPulse = tag.catchAt < 0 ? 0 : Math.max(0, 1 - (clock - tag.catchAt) / 260)}
			
			<Container x={tag.x} y={tag.y} scale={s}>
				<Graphics
					draw={(g) => {
						g.clear();
						const w = SYMBOL_SIZE * 0.92;
						const h = SYMBOL_SIZE * 0.34;
						g.roundRect(-w / 2 + 4, -h / 2 + 4, w, h, 8).fill(RED);
						g.roundRect(-w / 2, -h / 2, w, h, 8).fill(PAPER).stroke({ width: 3, color: INK });
					}}
				/>
				{@render ink(amountText, Math.min(30, 180 / Math.max(6, amountText.length)), isBigPrize(tag.shown) ? RED : INK)}
			</Container>
			{#if tag.stamped || stampStart >= 0}
				{@const st = stampScale()}
				{#if st > 0}
					<Container x={tag.x + SYMBOL_SIZE * 0.38} y={tag.y - SYMBOL_SIZE * 0.22} scale={st} rotation={-0.18}>
						<Graphics
							draw={(g) => {
								g.clear();
								g.circle(0, 0, SYMBOL_SIZE * 0.2).fill(RED).stroke({ width: 3, color: INK });
							}}
						/>
						{@render ink(`×${mult}`, 30, PAPER)}
					</Container>
				{/if}
			{/if}
		{/if}
	{/each}
	</Container>
</BoardContainer>
