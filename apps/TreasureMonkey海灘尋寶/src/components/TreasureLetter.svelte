<script module lang="ts">
 import {GraphicsPath} from 'pixi.js';
 // Original painted letter outlines; deliberately narrower than Titan One.
 // Native vector geometry keeps the same glyphs before and after font loading.
 const OUTLINES={
  A:new GraphicsPath("M-47 60 Q-49 60 -48 57 L-12 -57 Q-11 -60 -7 -60 L8 -60 Q11 -60 12 -57 L48 57 Q49 60 46 60 L29 60 Q27 60 26 57 L17 29 L-18 29 L-27 57 Q-28 60 -30 60 Z M-12 12 L12 12 L0 -29 Z",true),
  K:new GraphicsPath("M-38 -60 L-22 -60 Q-19 -60 -19 -57 L-19 -7 L22 -57 Q24 -60 27 -60 L45 -60 Q48 -60 46 -57 L1 -3 L47 57 Q49 60 46 60 L26 60 Q24 60 22 57 L-10 14 L-19 25 L-19 57 Q-19 60 -22 60 L-38 60 Q-41 60 -41 57 L-41 -57 Q-41 -60 -38 -60 Z",true),
  Q:new GraphicsPath("M-1 -60 C29 -60 46 -40 46 -7 L46 4 Q46 29 31 43 L48 60 Q50 63 47 65 L37 73 Q35 75 32 72 L15 54 Q8 57 -2 57 C-32 57 -48 37 -48 4 L-48 -7 C-48 -40 -31 -60 -1 -60 Z M-1 -40 C-18 -40 -26 -27 -26 -6 L-26 3 C-26 24 -18 37 -1 37 Q4 37 6 35 L-6 22 Q-8 20 -5 18 L4 10 Q6 8 8 10 L20 24 Q25 16 25 3 L25 -6 C25 -27 16 -40 -1 -40 Z",true),
  J:new GraphicsPath("M-35 -60 L36 -60 Q39 -60 39 -57 L39 -43 Q39 -40 36 -40 L24 -40 L24 19 C24 47 11 61 -13 61 C-34 61 -47 49 -47 27 L-47 22 Q-47 19 -44 19 L-29 19 Q-26 19 -26 22 L-26 26 Q-26 41 -13 41 Q2 41 2 20 L2 -40 L-35 -40 Q-38 -40 -38 -43 L-38 -57 Q-38 -60 -35 -60 Z",true),
 };
</script>
<script lang="ts">
 import {Container,Graphics} from 'pixi-svelte';
 import type {Graphics as PixiGraphics} from 'pixi.js';
 let {letter,height,tint=0xffffff}:{letter:'A'|'K'|'Q'|'J';height:number;tint?:number}=$props();
 const geometry=$derived(OUTLINES[letter]);
 const em=$derived(height/(letter==='Q'?135:121));
 const centre=$derived(letter==='Q'?-6.5:letter==='J'?-.5:0);
 const shadow=(g:PixiGraphics)=>g.clear().path(geometry).fill({color:0x81532c,alpha:.58});
 const paint=(g:PixiGraphics)=>g.clear().path(geometry).fill(0xfff0c7).stroke({color:0x563419,width:1.8,join:'round'});
</script>
<Container scale={em} y={centre*em}>
 <Graphics x={1.1} y={2.6} draw={shadow}/>
 <Graphics {tint} draw={paint}/>
</Container>

