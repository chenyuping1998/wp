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
 import SackBadge, { tagFrame } from './SackBadge.svelte';
 import PropMesh from './PropMesh.svelte';
 import { P_PICK, P_PICK_MS, P_FLY_MS, pPickLift } from '../game/meshWin';
 import { CANVAS, type PointFrame } from '../game/meshWin/meshRig';
 import { NUMBER_FONT, GAME_FONT } from '../game/fonts';
 import { abductionPose, puttPose, collectionStagger } from '../game/collectionMotion';
 import { collectionVisual } from '../game/collectionPresentation.svelte';
 const context=getContext();
 const SAUCER=true;
 const PAPER=0xf6f0dc, RED=0xe8433a, INK=0x141a33, MECH=0x7cf05a;
 // the cow's double take and her flight are one mesh act (meshWin/acts.ts
 // P_PICK, 2026-10-23); its two halves set the beat here
 const PICK_MS=SAUCER?P_PICK_MS:180, FLY_MS=SAUCER?P_FLY_MS:1040, STAMP_MS=520, HOLD_MS=280;
 const CUP_SIZE=SYMBOL_SIZE*.88;
 type Tag={x:number;y:number;shown:number;stamped:boolean;pop:number;catchAt:number};
 type Sack={x:number;y:number;value:number;side:number;cell:string};
 type Flyer={fromX:number;fromY:number;toX:number;toY:number;start:number;value:number;launched:boolean;sunk:boolean};
 let sackTags=$state<Record<number,PointFrame>>({});
 let sacks=$state<Sack[]>([]),tags=$state<Tag[]>([]),flyers=$state<Flyer[]>([]);
 let mult=$state(1),clock=$state(0),pickStart=$state(-1),stampStart=$state(-1),tagAlpha=$state(1);
 let active=$state<Tag|null>(null),actStart=$state(-1),leaveAt=$state(-1),itemStagger=$state(90);
 let collected=false,raf=0,running=false,previous=0,epoch=0,groupPace=1,restoreAt=-1;
 // the first cow of a collection yelps (once per round)
 let moo=$state(false);
 const ease=(k:number)=>{const v=Math.max(0,Math.min(1,k));return v*v*(3-2*v);};
 const shipBaseY=$derived(context.stateLayoutDerived.layoutType()==='portrait'?22:-42);
 const destination=(tag:Tag)=>({x:tag.x,y:SAUCER?shipBaseY+34:tag.y+SYMBOL_SIZE*.77});
 // the saucer gulps each cow it swallows: it dips and squashes, then rides back up
 const gulp=(tag:Tag)=>{if(tag.catchAt<0)return 0;const k=(clock-tag.catchAt)/280;return k<0||k>1?0:Math.sin(k*Math.PI)*(1-.5*k);};
 const ship=$derived(active?{
  x:active.x-80*(1-ease((clock-actStart)/240)),
  y:shipBaseY+Math.sin((clock-actStart)/250)*3-(leaveAt<0?0:100*ease((clock-leaveAt)/220))+7*gulp(active),
  gulp:gulp(active),
  alpha:leaveAt<0?ease((clock-actStart)/180):1-ease((clock-leaveAt)/220),
  rotation:Math.sin((clock-actStart)/300)*.026
 }:null);
 const beam=$derived(active?ease((clock-actStart-100)/180)*(leaveAt<0?1:1-ease((clock-leaveAt)/160)):0);
 const cup=$derived(active?{...destination(active),open:ease((clock-actStart)/220),alpha:leaveAt<0?1:1-ease((clock-leaveAt)/220)}:null);
 const poseAt=(f:Flyer,t:number)=>(SAUCER?abductionPose:puttPose)({x:f.fromX,y:f.fromY},{x:f.toX,y:f.toY},t);
 const flyerPos=(f:Flyer)=>{
  const t=Math.max(0,Math.min(1,(clock-f.start)/FLY_MS)),p=poseAt(f,t),prev=poseAt(f,Math.max(0,t-.035));
  return {...p,t,prevX:prev.x,prevY:prev.y,visible:clock>=f.start&&t<1,trailAlpha:.32*(1-t)};
 };
 /** where cow i is now: on her cell for the take, then up the beam; null
  *  before her turn and after she is swallowed */
 const cowAt=(i:number)=>{
  if(pickStart<0)return null;
  const ph=clock-pickStart-i*itemStagger;
  if(ph<0||ph>=PICK_MS+FLY_MS)return null;
  const s=sacks[i];
  if(ph<PICK_MS)return {ph,x:s.x,y:s.y,scale:1,rotation:0,alpha:1};
  const f=flyers[i];
  if(!f)return null;
  const p=poseAt(f,(ph-PICK_MS)/FLY_MS);
  return {ph,x:p.x,y:p.y,scale:p.scale/.88,rotation:p.rotation,alpha:p.alpha};
 };
 const MOO_IN=90,MOO_OUT=980;
 // the snap of her double take (acts.ts P_PICK: 90-170ms)
 const COW_STARTLE_MS=110;
 const mooAt=()=>{
  if(!moo||pickStart<0||!sacks.length)return null;
  const ph=clock-pickStart;
  if(ph<MOO_IN||ph>MOO_OUT)return null;
  const s=sacks[0],k=(ph-MOO_IN)/140;
  return {x:s.x-s.side*SYMBOL_SIZE*.46,y:s.y-SYMBOL_SIZE*.5,side:s.side,
   scale:k<1?.4+.6*(1+2.70158*Math.pow(k-1,3)+1.70158*Math.pow(k-1,2)):1,
   alpha:1-ease((ph-(MOO_OUT-160))/160)};
 };
 const loop=(now:number)=>{
  const dt=Math.min(80,Math.max(0,now-previous));previous=now;
  // The cow collection is this game's centrepiece (2026-10-17): it plays at
  // full length under turbo too. Turbo still shortens the reels and win acts.
  // Only the second tier (two bolts) quickens it, and only to 1.5x.
  clock+=dt*groupPace*(stateBet.isTurbo&&stateBet.turboLevel===2?1.5:1);
  if(pickStart>=0)for(let i=0;i<sacks.length;i++)
   if(clock>=pickStart+i*itemStagger)collectionVisual.cells[sacks[i].cell]=true;
  if(restoreAt>=0)collectionVisual.alpha=.08+.92*ease((clock-restoreAt)/220);
  if(!SAUCER)for(const flyer of flyers)if(!flyer.launched&&clock>=flyer.start){
   flyer.launched=true;context.eventEmitter.broadcast({type:'soundSackLand'});
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
  if(active||pickStart>=0)context.eventEmitter.broadcast({type:'mascotCollectEnd'});
  epoch++;stopClock();clock=0;sacks=[];sackTags={};tags=[];flyers=[];active=null;
  pickStart=-1;stampStart=-1;leaveAt=-1;restoreAt=-1;tagAlpha=1;collected=false;moo=false;
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
  const age=clock-pickStart-i*itemStagger;
  return age>=0&&age<PICK_MS?age:-1;
 };
 const tagPop=(tag:Tag)=>{const t=(clock-tag.pop)/220;return t>=0&&t<1?1+.25*Math.sin(t*Math.PI):1;};
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
   itemStagger=collectionStagger(sacks.length);
   for(let b=0;b<tags.length;b++){
    const tag=tags[b];groupPace=b?1/.7:1;active=tag;actStart=clock;leaveAt=-1;restoreAt=-1;moo=SAUCER&&b===0;
    collectionVisual.cells={};collectionVisual.alpha=.08;
    context.eventEmitter.broadcast({type:'mascotCollect'});
    context.eventEmitter.broadcast({type:'soundCollectionStart'});
    if(!await waitMs(240,token))return;
    context.eventEmitter.broadcast({type:'soundCollectGrab'});
    pickStart=clock;
    const base=clock+PICK_MS,to=destination(tag);
    flyers=sacks.map((s,i)=>({fromX:s.x,fromY:s.y-pPickLift(PICK_MS)*CUP_SIZE/CANVAS,
     toX:to.x,toY:to.y,start:base+i*itemStagger,value:s.value,launched:false,sunk:false}));
    for(let i=0;i<flyers.length;i++){
     if(!await waitUntil(flyers[i].start+FLY_MS,token))return;
     context.eventEmitter.broadcast({type:'soundCoinIn',index:i});

     tag.shown+=flyers[i].value;tag.pop=clock;tag.catchAt=clock;
    }
    context.eventEmitter.broadcast({type:'soundCollectionStop'});
    pickStart=-1;flyers=[];leaveAt=clock;restoreAt=clock;
    if(!await waitMs(220,token))return;
    collectionVisual.cells={};collectionVisual.alpha=1;restoreAt=-1;active=null;
   }
   groupPace=1;
   context.eventEmitter.broadcast({type:'mascotCollectEnd'});
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

 {#if ship && beam>0}
  <Graphics draw={(g)=>{
   g.clear();
   const y0=ship.y+30; const y1=BOARD_DIMENSIONS.y*SYMBOL_SIZE;
   g.poly([ship.x-16,y0,ship.x+16,y0,BOARD_DIMENSIONS.x*SYMBOL_SIZE+10,y1,-10,y1])
    .fill({color:MECH,alpha:beam*.075});
   g.poly([ship.x-8,y0,ship.x+8,y0,ship.x+85,y1,ship.x-85,y1])
    .fill({color:MECH,alpha:beam*.085});
   for(let i=0;i<24;i++){
    const height=y1-y0,y=y0+((i*29-clock*.075)%height+height)%height;
    const x=ship.x+Math.sin(i*2.7)*(14+(y-y0)*.17);
    g.circle(x,y,1.6).fill({color:MECH,alpha:beam*.45});
   }
   g.ellipse(ship.x,y0+5,26,8).stroke({color:MECH,width:2.5,alpha:beam*.8});
  }}/>
 {/if}

 {#each sacks as sack,i (i)}
  {@const cow=SAUCER?cowAt(i):null}
  {#if cow}
   <!-- one mesh per cow, from her double take to the saucer's hatch; the
        tag rides her tag bone the whole way -->
   <Container x={cow.x} y={cow.y} scale={cow.scale} rotation={cow.rotation} alpha={cow.alpha}>
    <!-- startled the instant she turns and sees the saucer (the snap of
         the double take), and stays that way all the way up -->
    <PropMesh spec={P_PICK} sprite={cow.ph>=COW_STARTLE_MS?'gbPShock':'gbP'} env={{t:cow.ph,side:sack.side}} width={CUP_SIZE} height={CUP_SIZE} anchor={0.5} onpose={(rig,pose)=>sackTags[i]=tagFrame(rig,pose)}/>
    <SackBadge prize={sack.value/100} frame={sackTags[i]}/>
   </Container>
  {:else if !SAUCER}
   {@const age=pickAge(i)}
   {#if age>=0}
    <PropMesh spec={P_PICK} env={{t:age,side:sack.side}} x={sack.x} y={sack.y} width={CUP_SIZE} height={CUP_SIZE} anchor={0.5} onpose={(rig,pose)=>sackTags[i]=tagFrame(rig,pose)}/>
    <SackBadge prize={sack.value/100} x={sack.x} y={sack.y} frame={sackTags[i]}/>
   {/if}
  {/if}
 {/each}
 {#if !SAUCER}
 {#each flyers as flyer,i (i)}
  {@const p=flyerPos(flyer)}
  {#if p.visible}
   <Graphics draw={(g)=>{
    g.clear();
    g.ellipse(p.x,p.y+14*p.scale,24*p.scale,6*p.scale).fill({color:INK,alpha:p.alpha*.17});
    if(p.t<.11){
     const tap=Math.sin(p.t/.11*Math.PI)*9;
     g.moveTo(flyer.fromX-40+tap,flyer.fromY-46).lineTo(flyer.fromX-16+tap,flyer.fromY-15)
      .stroke({color:INK,width:4,alpha:1-p.t/.11});
     g.roundRect(flyer.fromX-28+tap,flyer.fromY-17,25,7,2).fill(PAPER).stroke({color:INK,width:2});
    }
    g.moveTo(p.prevX,p.prevY).lineTo(p.x,p.y).stroke({color:MECH,width:3,alpha:p.trailAlpha});
   }}/>
   <Container x={p.x} y={p.y} scale={p.scale/.88} rotation={p.rotation} alpha={p.alpha}>
    <Sprite key="gbP" anchor={0.5} width={CUP_SIZE} height={CUP_SIZE}/>
   </Container>
   <Text text={`${flyer.value/100}x`} anchor={0.5} x={p.x} y={p.y} scale={p.scale/.88} alpha={p.alpha}
    style={{fontFamily:NUMBER_FONT,fontSize:String(flyer.value/100).length>2?14:18,fill:INK}}/>
  {/if}
 {/each}
 {/if}

 <!-- "MOO?!" — the first cow's reaction to being abducted, left hanging in
      the air where she was as she is carried off -->
 {#if SAUCER}
  {@const m=mooAt()}
  {#if m}
   <Container x={m.x} y={m.y} scale={m.scale} alpha={m.alpha}>
    <Graphics draw={(g)=>{
     g.clear();
     const w=96;
     const h=40;
     const tx=m.side*w*.3;
     g.roundRect(-w/2+3,-h/2+3,w,h,14).fill({color:INK,alpha:.85});
     g.poly([tx-8,h/2-2,tx+8,h/2-2,tx+m.side*20,h/2+16]).fill(PAPER).stroke({color:INK,width:3,join:'round'});
     g.roundRect(-w/2,-h/2,w,h,14).fill(PAPER).stroke({color:INK,width:3});
     g.rect(tx-7,h/2-6,14,6).fill(PAPER);
    }}/>
    <Text text="MOO?!" anchor={0.5} y={-2}
     style={{fontFamily:GAME_FONT,fontSize:22,fill:INK,letterSpacing:1}}/>
   </Container>
  {/if}
 {/if}

 {#if ship}
  <Sprite key="gbCollectorShip" anchor={0.5} x={ship.x} y={ship.y} width={205*(1+.07*ship.gulp)} height={205*(1-.06*ship.gulp)}
   rotation={ship.rotation} alpha={ship.alpha}/>
 {/if}
	<!-- 3. each Chef's tag: a paper ticket with a red offset print, the way
	     the screenprint plates are built (flat inks, no glow) -->
	<Container alpha={tagAlpha}>
	{#each tags as tag, i (i)}
		{#if tag.shown > 0}
			{@const s = tagPop(tag)}
			{@const amountText = bookEventAmountToCurrencyString(tag.shown)}
			{@const catchPulse = tag.catchAt < 0 ? 0 : Math.max(0, 1 - (clock - tag.catchAt) / 260)}
			{#if catchPulse > 0}<Graphics draw={(g) => {g.clear();g.circle(tag.x,tag.y,SYMBOL_SIZE*(.22+.16*(1-catchPulse))).stroke({color:RED,width:3*catchPulse,alpha:catchPulse});}}/>{/if}
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
