<script lang="ts" module>
 export type EmitterEventMascot = {type:'mascotChestBeat'}|{type:'mascotThrow'}|{type:'mascotGoggleTease'}|{type:'mascotDud'};
</script>
<script lang="ts">
 // THE CAST AS SPINE 4.3 RIGS (2026-11-09).
 //
 // The DJ (base game) and the host (free game) are the stand34 cast from
 // spine-motion-kit: design/cast_v2/交件 (art r7 / r7.1) rigged in spine_r7*,
 // packed by design/cast_v2/build_game_cast.py, drawn by CastFigure43. Each
 // has the kit's eight clips:
 //   idle          the 4 s breathing loop
 //   idle_fidget   DJ nods to the beat tapping his fist; host tilts her head and smiles
 //   react_small   nod and smile (a small win, a free-spin collect)
 //   gaze          lunges at the board and points (a tease, the trigger, a rung)
 //   gaze_dud      shrug (the tease came to nothing)
 //   win_big → win_big_loop → win_big_end   the big win: headphones / mic raised,
 //                 kept up while the counter runs, put back when it closes
 // Every clip starts and ends on the idle drawings, so any of them can follow
 // any other. The figure faces the board (it stands right of it).
 import { Container, Graphics, Text } from 'pixi-svelte';
 import { onDestroy } from 'svelte';
 import { getContext } from '../game/context';
 import { GAME_FONT } from '../game/fonts';
 import type { CastSpine43 } from '../game/castSpine43';
 import CastFigure43, { loadCast, type CastMeasure, type CastWho } from './CastFigure43.svelte';
 import { Tween } from 'svelte/motion';
 import { cubicOut } from 'svelte/easing';
 import { FRAME, PORTRAIT_CAST_SHARE, stageFrame } from '../game/stageLayout';
 const context=getContext();
 const free=$derived(context.stateGame.gameType==='freegame');
 const who=$derived<CastWho>(free?'host':'dj');

 // Extents come from the rigs themselves (every frame of every clip), so a
 // re-rig can never leave stale numbers here.
 let measures=$state<Partial<Record<CastWho,CastMeasure>>>({});
 for(const w of ['dj','host'] as const) void loadCast(w).then(({measure})=>{measures={...measures,[w]:measure};});
 const cast=$derived(measures[who]??null);

 // WHERE HE STANDS (2026-11-10, Stone 「人物太小隻」, with bar v3).
 // Until now the figure was shrunk until its WIDEST clip fitted between the
 // frame and the screen edge; the point at the board is more than twice the
 // body's width, so the body came out at ~45% of the screen's height. Now the
 // BODY sizes him (every clip but the point) and for the point he steps back
 // (`lean`, the way Pickle Panic's cook steps back to throw), his far side
 // allowed off the screen edge by half its width while he does.
 const placement=$derived.by(()=>{
  if(!cast)return null;
  const l=context.stateLayoutDerived.mainLayout(), b=context.stateGameDerived.boardLayout();
  const canvas=context.stateLayoutDerived.canvasSizes();
  const f=stageFrame({canvas,main:l,standard:context.stateLayoutDerived.mainLayoutStandard(),layoutType:context.stateLayoutDerived.layoutType()});
  const screenRight=f.mx(canvas.width), screenTop=f.my(0);
  // the frame's outer edge (its VU column reaches past the cards), plus air
  const edge=b.x+FRAME.right*b.scale+10, gap=screenRight-edge;
  if(context.stateLayoutDerived.layoutType()!=='portrait'&&gap>=190){
   // beside the board. Feet on the floor line just above the bar pieces under
   // him (the Spin disc and the two knobs rise over the console there).
   const feet=f.my(f.under(canvas.width-gap*f.ms,canvas.width)-10*f.ms);
   // head under the logo's letters (top right, 200x65 screen px) when it shows
   const logo=canvas.width>=760&&gap*f.ms>120;
   const top=screenTop+(logo?58:10)/f.ms;
   const scale=Math.min(
    (feet-top)/cast.height,
    // raised headphones / mic may pass beside the logo but stay on screen
    (feet-screenTop-6/f.ms)/cast.jump,
    (gap-12)/(cast.bodyLeft+cast.bodyRight),
    // the point: arm tip at the frame's edge, his far side half off the screen at most
    gap/(cast.left+cast.bodyRight*.5),
   );
   const x=Math.max(edge+cast.bodyLeft*scale,Math.min(edge+gap/2+(cast.bodyLeft-cast.bodyRight)*scale/2,screenRight-cast.bodyRight*scale-4));
   return {x,feet,scale,clipY:null as number|null,lean:Math.max(0,edge+10+cast.left*scale-x)};
  }
  // No side band (phone portrait, tablet): waist-up BEHIND the board, the way
  // Pickle Panic and the crime trilogy do it. A mask cuts the figure at the
  // FRAME's top edge (its nameplate bar stands 85 units above the cards since
  // the 2026-11-05 frame art): nothing of it is ever drawn over the board.
  const top=b.y-FRAME.top*b.scale-6, room=top-screenTop-8/f.ms;
  if(room<110/f.ms) return null;
  // sized so the highest point of any clip (headphones / mic raised over the
  // head) still lands inside the screen, not only the resting crown; no more
  // of him over the frame than stageLayout left room for
  const BURY=.42, scale=Math.min(room/((1-BURY)*cast.height+Math.max(0,cast.jump-cast.height)),(PORTRAIT_CAST_SHARE*(FRAME.top+FRAME.bottom)*b.scale)/((1-BURY)*cast.height));
  // and the body's reach away from the board stays inside the right edge
  const x=Math.min(f.mx(canvas.width*.74),screenRight-cast.bodyRight*scale-4);
  return {x,feet:top+BURY*cast.height*scale,scale,clipY:top as number|null,lean:Math.max(0,f.mx(4)+cast.left*scale-x)};
 });

 // the step back for the point: out during its anticipation, home as the arm comes down
 const lean=new Tween(0,{duration:360,easing:cubicOut});
 let leanTimer=0;
 const point=()=>{
  clearTimeout(leanTimer);
  void lean.set(placement?.lean??0);
  // home when the CLIP says the arm is coming down, not the wall clock: the figure's time is capped at
  // 0.1 s a frame, so on dropped frames a timer walked him back into the frame with the arm still out (2026-11-11)
  const watch=()=>{
   if(!figure||figure.current()!=='gaze'||figure.clipTime()>=1.25){void lean.set(0,{duration:420});return;}
   leanTimer=setTimeout(watch,50) as unknown as number;
  };
  leanTimer=setTimeout(watch,50) as unknown as number;
 };

 let figure:CastSpine43|null=null;
 const QUIET=['idle','idle_fidget','react_small'];
 const BIG=['win_big','win_big_loop'];
 /** a small reaction never cuts off anything but the quiet clips */
 const react=(name:string)=>{if(figure&&QUIET.includes(figure.current()??'idle')){figure.play(name);if(name==='gaze')point();}};

 // The shout pops over the head on the big moments.
 let shout=$state(0);let raf=0;let until=0;
 const pop=()=>{until=performance.now()+850;cancelAnimationFrame(raf);const tick=()=>{const k=Math.max(0,(until-performance.now())/850);shout=Math.sin(k*Math.PI);if(k>0)raf=requestAnimationFrame(tick);};tick();};

 let fidgetTimer=0;
 const scheduleFidget=()=>{
  clearTimeout(fidgetTimer);
  const level=1+context.stateGame.banditMeter.level;
  const base=free?Math.max(3500,7000-level*700):8000;
  fidgetTimer=setTimeout(()=>{if(placement&&figure?.current()==='idle')figure.play('idle_fidget');scheduleFidget();},base+Math.random()*base*.6) as unknown as number;
 };
 scheduleFidget();

 context.eventEmitter.subscribeOnMount({
  // the trigger's bell hold (base) points at the Scatters; a free-spin collect
  // (almost every spin) only gets the small nod (user 10-22: 連線動態太大)
  mascotChestBeat:()=>{if(free)react('react_small');else{figure?.play('gaze');point();pop();}},
  winUpdate:({winLevelData})=>{
   if(winLevelData?.type!=='big'||!figure)return;
   const a=winLevelData.alias;
   // the long tiers keep the arm up while the counter runs (until winHide)
   if(a==='mega'||a==='epic'||a==='max')figure.play('win_big',['win_big_loop']);
   else figure.play('win_big',['win_big_end','idle']);
   pop();
  },
  winHide:()=>{
   const now=figure?.current();
   if(!figure||!now||!BIG.includes(now))return;
   if(now==='win_big_loop')figure.play('win_big_end');else figure.queue(['win_big_end','idle']);
  },
  // the live win only: the idle replay of the last win re-sends this with
  // fast:true every few seconds, and a nod per replay reads as a twitch
  winLinesShow:({fast})=>{if(!free&&!fast)react('react_small');},
  banditLevelUp:()=>react('gaze'),
  // the pre-trigger tease: lunges at the reels and points
  mascotGoggleTease:()=>react('gaze'),
  // anticipation that came to nothing
  mascotDud:()=>react('gaze_dud'),
  // the broadcast wipe starts: arm up as the shutter comes down
  mascotThrow:()=>{figure?.play('win_big',['win_big_end','idle']);},
 });
 $effect(()=>{context.stateGame.mascotThrowOrigin=null;});
 onDestroy(()=>{cancelAnimationFrame(raf);clearTimeout(fidgetTimer);clearTimeout(leanTimer);figure=null;});
</script>
{#if placement&&cast}
 <!-- keyed on the cast and the mode: a new figure per cast, and a rotation
      never leaves a stale mask on the container -->
 {#key `${who}-${placement.clipY===null}`}
 <Container>
  {#if placement.clipY!==null}{@const clipY=placement.clipY}<Graphics isMask draw={(g)=>{g.clear();g.rect(-4000,-4000,8000,clipY+4000).fill(0xffffff);}}/>{/if}
  <CastFigure43 {who} x={placement.x+lean.current} y={placement.feet} scale={placement.scale} onready={(f)=>{figure=f;}}/>
  {#if shout>.1}<Text anchor={{x:.5,y:1}} x={placement.x+lean.current} y={Math.max(placement.feet-(cast.height+40)*placement.scale,context.stateLayoutDerived.mainLayout().height*-.5)} scale={.85+.25*shout} rotation={-.06} text={free?'ON AIR!':'SIGNAL!'} style={{fontFamily:GAME_FONT,fontSize:26,fill:0xb8d080,stroke:{color:0x15191f,width:5}}}/>{/if}
 </Container>
 {/key}
{/if}
