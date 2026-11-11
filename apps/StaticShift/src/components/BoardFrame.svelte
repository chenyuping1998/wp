<script lang="ts" module>
 export type EmitterEventBoardFrame={type:'boardFrameGlowShow'}|{type:'boardFrameGlowHide'}|{type:'boardFrameImpact';strength?:number;kind?:'landing'|'collect'|'upgrade'|'win'};
</script>
<script lang="ts">
 // The mixing-desk board frame (2026-11-05 art: design/source-ui-1104,
 // request design/ART_REQUEST_2026-11-04.md §A/B/C).
 //
 // Source geometry, in the frame PNG's own pixels (1640×1400): the transparent
 // opening is exactly 1400×1120 from (120,170), so at half scale it is the
 // board's 700×560 game units and the frame is drawn at scale*0.5 with that
 // opening on the board's top-left corner. The paper nameplate is centred at
 // (820,86); the two VU columns hold 12 empty cells each (x 31–88 and
 // 1552–1609, first cell 389–432, pitch 53.5) which this file lights.
 import { onMount } from 'svelte';
 import { Container, Graphics, Sprite, Text } from 'pixi-svelte';
 import { getContext } from '../game/context';
 import { GAME_FONT } from '../game/fonts';
 import { gameText } from '../game/i18nText';
 import { SYMBOL_SIZE } from '../game/constants';
 import { inkOffsetY } from 'components-ui-pixi/src/inkCenter';
 const c=getContext();
 const b=$derived(c.stateGameDerived.boardLayout());
 const free=$derived(c.stateGame.gameType==='freegame');
 // the free-spins intro/outro faceplate covers the board; its "1,024 WAYS"
 // label stepped out while one is up; on a phone the free-spins ticket sits
 // above the board, so the label yields there in the free game too
 let covered=$state(false);

 const SRC={w:1640,h:1400,openX:120,openY:170,plateX:820,plateY:86,plateW:600};
 const VU={cells:12,top:389,pitch:53.5,h:43,xs:[[31,88],[1552,1609]] as const};
 const k=$derived(b.scale*.5); // source px → screen
 const fx=$derived(b.x-b.width*b.scale/2-SRC.openX*k);
 const fy=$derived(b.y-b.height*b.scale/2-SRC.openY*k);

 // ── VU meters ────────────────────────────────────────────────────────────
 // idle: a slow "programme" bounce (two detuned sines, never still, never
 // busy); every board impact (landing, collect, win, upgrade) kicks the needle
 // and it falls back at a meter's ballistic rate. Left and right are a hair
 // apart, like stereo.
 let level=$state([0,0]);
 let kick=0;
 c.eventEmitter.subscribeOnMount({
  freeSpinIntroShow:()=>(covered=true),freeSpinIntroHide:()=>(covered=false),
  freeSpinOutroShow:()=>(covered=true),freeSpinOutroHide:()=>(covered=false),
  boardFrameImpact:({strength})=>{kick=Math.max(kick,Math.min(1,.35+(strength??.5)*.45));},
 });
 onMount(()=>{
  let id=0;const t0=performance.now();let last=t0;
  const tick=(now:number)=>{
   const dt=Math.min(.1,(now-last)/1000);last=now;const t=(now-t0)/1000;
   kick=Math.max(0,kick-dt*.55);
   const base=free?.42:.30;
   const prog=(s:number)=>base+.10*Math.sin(t*2.1+s)+.06*Math.sin(t*5.3+s*2.7);
   level=[Math.min(1,prog(0)+kick),Math.min(1,prog(1.3)+kick*.92)];
   id=requestAnimationFrame(tick);
  };
  id=requestAnimationFrame(tick);
  return()=>cancelAnimationFrame(id);
 });
 // green bottom half, then yellow, then orange at the top (request §A)
 const cellColor=(i:number)=>i<6?0xb8d080:i<9?0xe0cf6a:0xe7aa53;
 const drawVu=(g:import('pixi.js').Graphics)=>{
  g.clear();
  VU.xs.forEach(([x0,x1],side)=>{
   const lit=Math.round(level[side]*VU.cells);
   for(let i=0;i<lit;i++){
    const y=VU.top+(VU.cells-1-i)*VU.pitch;
    g.rect(x0+3,y+3,x1-x0-6,VU.h-6).fill({color:cellColor(i),alpha:.92});
   }
  });
 };

 const waysText=gameText('ssWaysBoard',{ways:(1024).toLocaleString('en-US')});
 const cells=Array.from({length:20},(_,i)=>({x:Math.floor(i/4),y:i%4}));
</script>

<!-- one paper card per cell, under the symbols -->
<Container x={b.x-b.width*b.scale/2} y={b.y-b.height*b.scale/2} scale={b.scale}>
 {#each cells as cell (cell.x*4+cell.y)}
  <Sprite key="ssCellCard" x={cell.x*SYMBOL_SIZE} y={cell.y*SYMBOL_SIZE} width={SYMBOL_SIZE} height={SYMBOL_SIZE}/>
 {/each}
</Container>

<Container x={fx} y={fy} scale={k}>
 <Sprite key={free?'ssBoardFrameFg':'ssBoardFrame'} width={SRC.w} height={SRC.h}/>
 <Graphics draw={drawVu}/>
 <!-- optically centred on the paper: anchor .5 centres pixi's text BOX, whose
      top keeps room for accents, so the capitals sat 3px low on a 1024×576
      screen (ui_center_audit plate(), 2026-11-09) -->
 {@const waysStyle={fontFamily:GAME_FONT,fontSize:Math.min(46,(SRC.plateW-60)/(waysText.length*.62)),fill:0x15191f,letterSpacing:2}}
 <Text anchor={.5} x={SRC.plateX} y={SRC.plateY-inkOffsetY(waysText,waysStyle)}
  alpha={covered||c.stateGame.winLitCells||(c.stateLayoutDerived.layoutType()==='portrait'&&free)?0:1}
  text={waysText}
  style={waysStyle}/>
</Container>
