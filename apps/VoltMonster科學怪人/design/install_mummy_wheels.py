from pathlib import Path
import re
ROOT=Path(__file__).resolve().parent.parent
p=ROOT/'src/components/BoardFrame.svelte';old=p.read_text(encoding='utf-8');header=old.split('<script lang="ts">')[0]
p.write_text(header+'''<script lang="ts">
 import { Sprite } from 'pixi-svelte';
 import { getContext } from '../game/context';
 const context=getContext();
 const board=$derived(context.stateGameDerived.boardLayout());
</script>
<Sprite key="gbFrameBg" anchor={.5} x={board.x} y={board.y} width={board.width*board.scale*1.28} height={board.height*board.scale*1.28} />
<Sprite key="gbFrameEdge" anchor={.5} x={board.x} y={board.y} width={board.width*board.scale*1.28} height={board.height*board.scale*1.28} />
''',encoding='utf-8')
p=ROOT/'src/components/FgArcWheel.svelte';s=p.read_text(encoding='utf-8').replace("import { Container, Graphics, Text }","import { Container, Graphics, Text, Sprite, Rectangle }")
start=s.index('\tconst drawArch = ');end=s.index('\n\tconst segLabels',start)
s=s[:start]+'''\tconst drawArch = (g: PixiGraphics) => { g.clear(); };
'''+s[end:]
s=s.replace('<Graphics draw={drawArch} />','''<Sprite key="fxGlow" x={CX} y={CY} anchor={.5} width={R_PLATE*3} height={R_PLATE*3} tint={0xf2e8d0} blendMode="add" alpha={flash*.35} />
   <Sprite key="mummyArch" x={CX} y={CY} anchor={{x:.5,y:1}} width={R_OUT*2.16} height={R_OUT*1.16} alpha={open} />
   <Container>
    <Rectangle isMask x={CX-R_OUT*1.1} y={CY-R_OUT*1.2} width={R_OUT*2.2} height={R_OUT*1.2} />
    {#each segLabels as tile (tile.key)}
     <Sprite key={strip[tile.key]>=32?'mummyTileTop':strip[tile.key]>=12?'mummyTileHot':'mummyTile'} x={tile.x} y={tile.y} rotation={tile.rot} anchor={.5} width={W*.22} height={W*.15} alpha={tile.alpha} />
    {/each}
   </Container>
   <Sprite key="mummyPlate" x={CX} y={CY} anchor={.5} width={R_PLATE*2.12} height={R_PLATE*2.12} />
   <Sprite key="mummyPointer" x={CX} y={CY-R_OUT+W*.035} anchor={{x:.5,y:1}} width={W*.075} height={W*.105} alpha={pointerAlpha*open} />
   {#if buttonAlpha>0||buttonBurst>0}
    <Sprite key="mummyButton" x={CX} y={CY-R_OUT-W*.02} anchor={.5} width={W*.16*(1+.08*pulse+.6*buttonBurst)} height={W*.16*(1+.08*pulse+.6*buttonBurst)} alpha={buttonAlpha*(1-buttonBurst)} />
   {/if}''')
s=s.replace('y={CY - R_PLATE * 0.42}','y={CY - R_PLATE * 0.07}').replace('Math.sin(now / 160)','Math.sin(now / 160 + Math.PI/2)')
s=s.replace('pulse = 0.5 + 0.5 * Math.sin(now / 160 + Math.PI/2);','pulse = Math.sin(now * Math.PI * 2 / 1000);')
p.write_text(s,encoding='utf-8')
p=ROOT/'src/components/RareRoulette.svelte';s=p.read_text(encoding='utf-8').replace("import { Container, Graphics, Text }","import { Container, Graphics, Text, Sprite }")
start=s.index('\tconst draw = ');end=s.index('\n\tconst labels',start)
s=s[:start]+'''\tconst draw = (g: PixiGraphics) => {
  g.clear();g.rect(-main.width,-main.height,main.width*3,main.height*3).fill({color:0x020d13,alpha:.78*fade});
 };
 const discKey=$derived((`mummySunDisc${level}`) as 'mummySunDisc1'|'mummySunDisc2'|'mummySunDisc3'|'mummySunDisc4');
'''+s[end:]
s=s.replace('<Graphics {draw} />','''<Graphics {draw} />
   <Container x={CX} y={CY} scale={pop*enter} alpha={fade}>
    <Sprite key="fxGlow" anchor={.5} width={R*3.5} height={R*3.5} tint={ROULETTE_COLORS[level].rim} alpha={.25+popFlash*.4} blendMode="add" />
    <Sprite key={discKey} anchor={.5} width={R*2} height={R*2} />
    <Sprite key="mummySunRing" anchor={.5} width={R*2.35} height={R*2.35} />
    {#if litIndex!==null}
     <Graphics draw={(g:PixiGraphics)=>{g.clear();const a=-Math.PI/2+litIndex!*SEG;g.moveTo(0,0).arc(0,0,R*.98,a-SEG*.47,a+SEG*.47).closePath().fill({color:0xffffff,alpha:.12+.09*Math.sin(rayAngle*20)**2});}} blendMode="add" />
    {/if}
    <Sprite key="mummySunNeedle" anchor={{x:.5,y:620/760}} x={0} y={0} width={R*.33} height={R*.91} rotation={needle} />
    <Sprite key="mummySunHub" anchor={.5} width={R*.33} height={R*.33} />
   </Container>''')
p.write_text(s,encoding='utf-8')
p=ROOT/'src/components/TransitionAnimation.svelte';s=p.read_text(encoding='utf-8').replace("import { Container, Graphics }","import { Container, Graphics, Sprite }")
s=s.replace('<Graphics {draw} />','''{#each Array.from({length:STRIPS},(_,i)=>i) as i}
  {@const size=context.stateLayoutDerived.canvasSizes()}
  {@const diag=Math.hypot(size.width,size.height)}
  {@const across=(i-(STRIPS-1)/2)*diag*1.05/STRIPS}
  {@const along=stripPos(i)*diag*1.3*(i%2===0?1:-1)}
  <Container rotation={SLANT}>
   <!-- Opaque cloth underlay guarantees full coverage despite frayed alpha edges. -->
   <Graphics draw={(g:PixiGraphics)=>{g.clear();g.rect(along-diag*.8,across-diag*.075,diag*1.6,diag*.15).fill({color:0xf2e8d0});}} />
   <Sprite key="mummyBandage" anchor={.5} x={along} y={across} width={diag*1.6} height={diag*.17} />
  </Container>
 {/each}''')
p.write_text(s,encoding='utf-8')
print('Installed textured Scarab/Sun wheels, static frame and linen sweep')
