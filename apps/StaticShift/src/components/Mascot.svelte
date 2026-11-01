<script lang="ts" module>
 export type EmitterEventMascot = {type:'mascotChestBeat'}|{type:'mascotThrow'}|{type:'mascotGoggleTease'};
</script>
<script lang="ts">
 // THE CAST AS CUT-OUT SPINE RIGS (2026-10-21).
 //
 // Until now each figure was ONE mesh whose head slid down and back on a 2 s
 // clock; the neck stretched and the body stood still, which read as the
 // body squashing in and out (user: 「只是身體伸縮，超級怪」). The figures are
 // now cut into 12 pieces (design/cut_cast_layers.py) on the #7 skeleton
 // (design/generate_cast_spine.mjs): hips bob, the chest breathes, head and
 // arms each keep their own period, feet stay planted, and every reaction is
 // carried by the body — squat, jump, lean — with the arms following.
 import { Container, Graphics, SpineProvider, SpineTrack, Text } from 'pixi-svelte';
 import { onDestroy } from 'svelte';
 import { getContext } from '../game/context';
 import { GAME_FONT } from '../game/fonts';
 const context=getContext();
 const free=$derived(context.stateGame.gameType==='freegame');

 // Skeleton units, measured off the generated rigs (preview sweep over every
 // frame of every animation): HEIGHT is feet to crown at rest, LEFT/RIGHT the
 // furthest any animation this game plays reaches toward / away from the board,
 // JUMP the crown at the top of the cheer, RESTRIGHT the idle reach (portrait:
 // the arms' big swings happen below the card line, behind the board). Re-measure whenever a rig changes.
 const CASTS={
  basegame:{key:'ssSpineDJ',height:905,left:323,right:321,restRight:206,jump:1049},
  freegame:{key:'ssSpineHost',height:904,left:303,right:395,restRight:274,jump:1048},
 } as const;
 const cast=$derived(free?CASTS.freegame:CASTS.basegame);

 const placement=$derived.by(()=>{
  const l=context.stateLayoutDerived.mainLayout(), b=context.stateGameDerived.boardLayout();
  const edge=b.x+b.width*b.scale/2+22, gap=l.width-edge;
  if(gap>=190){
   // beside the board: feet on the floor line, sized as before, then shrunk
   // until the widest reaction fits between the board and the screen edge
   // ("cast never overlaps board" covers the performance, not only the pose)
   const feet=Math.min(b.y+b.height*b.scale*.52,l.height-112);
   const wanted=Math.min((l.height-100)*.80,Math.min(gap*.94,300)*(free?1.77:2.35));
   const scale=Math.min(wanted/cast.height,(gap-20)/(cast.left+cast.right),(feet-4)/cast.jump);
   return {x:Math.min(edge+8+cast.left*scale,l.width-cast.right*scale),feet,scale,clipY:null as number|null};
  }
  // No side band (phone portrait, tablet): waist-up BEHIND the cards, the way
  // Pickle Panic and the crime trilogy do it. This board has no housing to hide
  // the legs, so a mask cuts the figure at the cards' top edge: nothing of it is
  // ever drawn over or between the cards.
  const top=b.y-b.height*b.scale/2-6;
  if(top<220) return null;
  const BURY=.42, scale=(top-8)/(1-BURY)/cast.height;
  return {x:Math.min(l.width*.75,l.width-cast.restRight*scale),feet:top+BURY*cast.height*scale,scale,clipY:top as number|null};
 });

 let animationName=$state('idle');
 let loop=$state(true);
 const ONE_SHOTS=['cheer','chestbeat','hype','nod','alert','glance'];
 // small reactions may cut each other off; the big two each mean something
 const INTERRUPTIBLE=['idle','nod','glance','alert'];
 const play=(name:string,loops=false)=>{animationName=name;loop=loops;};
 const react=(name:string)=>{if(INTERRUPTIBLE.includes(animationName))play(name);};

 // The shout pops over the head on the two big reactions.
 let shout=$state(0);let raf=0;let until=0;
 const pop=()=>{until=performance.now()+850;cancelAnimationFrame(raf);const tick=()=>{const k=Math.max(0,(until-performance.now())/850);shout=Math.sin(k*Math.PI);if(k>0)raf=requestAnimationFrame(tick);};tick();};
 // The DJ drums on his belly; the host holds a mic in one hand, so a chest
 // beat would swing it across her hip — she cheers instead.
 const big=()=>{play(free?'cheer':'chestbeat');pop();};
 // Collects (and the trigger) land almost every free spin, so the host gets
 // 'hype' there — the chest beat's rhythm carried by the body, feet planted —
 // and keeps the jumping cheer for mega+ wins (user 10-22: 連線動態太大).
 const beat=()=>{play(free?'hype':'chestbeat');pop();};

 let glanceTimer=0;
 const scheduleGlance=()=>{
  clearTimeout(glanceTimer);
  const level=1+context.stateGame.banditMeter.level;
  const base=free?Math.max(3500,7000-level*700):8000;
  glanceTimer=setTimeout(()=>{if(placement&&animationName==='idle')play('glance');scheduleGlance();},base+Math.random()*base*.6) as unknown as number;
 };
 scheduleGlance();

 context.eventEmitter.subscribeOnMount({
  mascotChestBeat:beat,
  winUpdate:({winLevelData})=>{
   if(winLevelData?.type!=='big')return;
   const a=winLevelData.alias;
   if(a==='mega'||a==='epic'||a==='max')big();else{play('cheer');pop();}
  },
  winLinesShow:()=>{if(!free&&animationName==='idle')play('nod');},
  banditLevelUp:()=>react('alert'),
  // the pre-trigger tease: he leans in and stares at the reels
  mascotGoggleTease:()=>react('alert'),
  // the broadcast wipe starts: a cheer as the shutter comes down
  mascotThrow:()=>{play('cheer');},
 });
 $effect(()=>{context.stateGame.mascotThrowOrigin=null;});
 onDestroy(()=>{cancelAnimationFrame(raf);clearTimeout(glanceTimer);});
</script>
{#if placement}
 <!-- keyed on the cast and the mode: a new skeleton per figure, and a rotation
      never leaves a stale mask on the container -->
 {#key `${cast.key}-${placement.clipY===null}`}
 <Container>
  {#if placement.clipY!==null}{@const clipY=placement.clipY}<Graphics isMask draw={(g)=>{g.clear();g.rect(-4000,-4000,8000,clipY+4000).fill(0xffffff);}}/>{/if}
  <SpineProvider key={cast.key} x={placement.x} y={placement.feet} scale={placement.scale}>
   <SpineTrack trackIndex={0} {animationName} {loop}
    {...{mixDuration:.16}}
    listener={{complete:(entry)=>{const n=entry.animation?.name;if(n&&ONE_SHOTS.includes(n))play('idle',true);}}}/>
   <SpineTrack trackIndex={1} animationName="flutter" loop />
  </SpineProvider>
  {#if shout>.1}<Text anchor={{x:.5,y:1}} x={placement.x} y={placement.feet-(cast.height+40)*placement.scale} scale={.85+.25*shout} rotation={-.06} text={free?'ON AIR!':'SIGNAL!'} style={{fontFamily:GAME_FONT,fontSize:26,fill:0xb8d080,stroke:{color:0x15191f,width:5}}}/>{/if}
 </Container>
 {/key}
{/if}
