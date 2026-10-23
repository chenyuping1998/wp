<script lang="ts">
 import { Container, Sprite, Graphics, Text } from 'pixi-svelte';
 import { SYMBOL_SIZE } from '../game/constants';
 import { TITLE_FONT, TITLE_FONT_WEIGHT } from '../game/fonts';
 import { HOLD_MS } from '../game/symbolWinMotion';
 import { getSymbolInfo } from '../game/utils';
 type Props = {
  symbolInfo: ReturnType<typeof getSymbolInfo>; symbolName?: string;
  mode?: 'win' | 'land' | 'none'; t?: number; overlayTint?: number; overlayAlpha?: number;
  scale?: number; cell?: {reel:number; row:number}; big?: boolean; swayT?: number;
 };
 const props: Props = $props();
 const width = $derived(SYMBOL_SIZE * props.symbolInfo.sizeRatios.width * (props.scale ?? 1));
 const height = $derived(SYMBOL_SIZE * props.symbolInfo.sizeRatios.height * (props.scale ?? 1));
 const low = $derived((props.symbolName ?? '').startsWith('L'));
 const overlay = $derived((props.overlayAlpha ?? 0) > .01);
 const progress = $derived(Math.max(0, Math.min(1, (props.t ?? 0) / HOLD_MS)));
 // Each object keeps its own movement table. Small ink accents articulate the
 // physical object during its visible win beat; no paper-corner peel.
 const beat = $derived(props.mode === 'win' && !overlay ? Math.sin(Math.PI * progress) : 0);
</script>
<Container>
 <Sprite key={props.symbolInfo.assetKey} anchor={.5} {width} {height}
   tint={overlay ? props.overlayTint ?? 0xffffff : 0xffffff} alpha={overlay ? props.overlayAlpha : 1} />
 {#if beat > .01}
  <Graphics draw={(g)=>{
   g.clear(); const w=width; const h=height; const b=beat;
   const line=(p:number[],color:number,alpha:number)=>{g.poly(p,false);g.stroke({color,width:Math.max(1.2,w*.015),alpha});};
   if(props.symbolName==='H2'){
    // Safehouse windows light in a short, staggered sequence.
    for(let i=0;i<3;i++){g.rect((-0.15+i*.12)*w,-h*.09,w*.055,h*.08);g.fill({color:0xffc38a,alpha:b*(.55+.35*Math.sin(progress*14+i))});}
   }else if(props.symbolName==='H5'){
    // Two chrome wheel spokes turn while the car rocks on its suspension.
    for(const x of [-.25,.25]){const r=w*.052;const a=progress*Math.PI*3;line([x*w-r*Math.cos(a),h*.17-r*Math.sin(a),x*w+r*Math.cos(a),h*.17+r*Math.sin(a)],0xf7f5f0,b*.8);}
   }else if(props.symbolName==='S'){
    // Speaker rings expand on two beats, each inside its own driver.
    const p=(progress*2)%1;
    for(const x of [-.22,.22]){g.circle(x*w,h*.04,w*(.08+p*.075));g.stroke({color:0x2ec4c6,width:w*.015,alpha:(1-p)*b*.75});}
   }else if(props.symbolName==='H4'){
    // A brief carbonated hiss above the bottle cap.
    for(let i=0;i<3;i++)line([(i-1)*w*.055,-h*(.36+b*.05),(i-1)*w*.085,-h*(.40+b*.09)],0xf7f5f0,b*.7);
   }else if(props.symbolName==='W'||props.symbolName==='SW'){
    for(const side of [-1,1])for(let i=0;i<2;i++)line([side*w*.36,-h*.12+i*h*.18,side*w*(.4+b*.04),-h*.16+i*h*.21],props.symbolName==='SW'?0xb22222:0xffc38a,b);
   }
  }} />
 {/if}
 {#if props.symbolName === 'W' && !overlay}
  <Text text="WILD" anchor={.5} y={height*.18}
   style={{fontFamily:TITLE_FONT,fontWeight:TITLE_FONT_WEIGHT,fontSize:width*.13,fill:0xf7f5f0,stroke:{color:0x121212,width:2}}} />
 {/if}
</Container>
