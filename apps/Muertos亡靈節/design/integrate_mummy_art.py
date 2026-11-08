from pathlib import Path
import re,json
ROOT=Path(__file__).resolve().parent.parent
p=ROOT/'src/game/assets.ts';s=p.read_text(encoding='utf-8')
folders={'goBananasSymbolsV3':'mummySymbols','goBananasFrame':'mummyFrame','goBananasBackground':'mummyBackground','goBananasWinBanners':'mummyBanners','goBananasFx':'mummyFx'}
for a,b in folders.items():s=s.replace('/'+a+'/', '/'+b+'/')
s=s.replace('goBananasWinBananas/bananas.json','mummyCoins/coins.json')
assets={'mummyArch':'mummyWheel/arch_base','mummyPlate':'mummyWheel/plate','mummyButton':'mummyWheel/button','mummyButtonLit':'mummyWheel/button_lit',
 'mummyPointer':'mummyWheel/pointer','mummyTile':'mummyWheel/tile_normal','mummyTileHot':'mummyWheel/tile_hot','mummyTileTop':'mummyWheel/tile_top',
 'mummySunRing':'mummyWheel/ring','mummySunNeedle':'mummyWheel/needle','mummySunHub':'mummyWheel/hub',
 'mummyBandage':'mummyTransition/bandage_strip','mummyBandageEnd':'mummyTransition/bandage_end'}
for i in range(1,5):assets['mummySunDisc'+str(i)]='mummyWheel/disc_lv'+str(i)
for key,file in assets.items():
 if key+':' not in s:s=s.replace('export default {',f"export default {{\n\t{key}: {{ type: 'sprite', src: new URL('../../assets/sprites/{file}.png', import.meta.url).href, preload: true }},",1)
p.write_text(s,encoding='utf-8')
# Remove obsolete location-specific moving mesh props and the entire-scene drift.
p=ROOT/'src/components/Background.svelte';s=p.read_text(encoding='utf-8');s=re.sub(r'\s*<BgProps[^>]*/>','',s)
s=s.replace('const OVERSCAN = 1.08;','const OVERSCAN = 1.0;').replace('Array.from({ length: 22 }','Array.from({ length: 10 }').replace('size: 12 + Math.random() * 46','size: 3 + Math.random() * 6').replace('alpha: 0.1 + Math.random() * 0.22','alpha: 0.04 + Math.random() * 0.05')
p.write_text(s,encoding='utf-8')
# A settled board has long holds, staggered tiny gestures, and no pulsing frame.
p=ROOT/'src/game/idleBreathe.ts';s=p.read_text(encoding='utf-8');s=s.replace('IDLE_AMPLITUDE = 0.009','IDLE_AMPLITUDE = 0.002').replace('IDLE_PERIOD_MS = 2600','IDLE_PERIOD_MS = 12000')
s=re.sub(r'const PHASES: number\[\]\[\] = \[[\s\S]*?\n\];','const PHASES: number[][] = Array.from({ length: 5 }, (_, r) => Array.from({ length: 5 }, (_, c) => ((r * 7 + c * 11) % 25) * Math.PI * 2 / 25));',s)
s=s.replace('1 + IDLE_AMPLITUDE * Math.sin((Math.PI * 2 * t) / IDLE_PERIOD_MS + phase);','1 + IDLE_AMPLITUDE * Math.sin(Math.PI * Math.min(1, ((t + phase / (Math.PI * 2) * IDLE_PERIOD_MS) % IDLE_PERIOD_MS) / 800)) ** 2;')
p.write_text(s,encoding='utf-8')
# The visual spec owns the win motion; remove inherited whole-tile jumps and hard pay-frame tracer.
p=ROOT/'src/components/SymbolMeshWin.svelte';s=p.read_text(encoding='utf-8')
s=s.replace('const POP_UP = 0.28;','const POP_UP = 0;').replace('const POP_HOLD = 0.1;','const POP_HOLD = 0;').replace('const HOP_PX = SYMBOL_SIZE * 0.14;','const HOP_PX = 0;')
s=s.replace('const jumper = !props.spec && HIGH_JUMP[spec.symbol] !== undefined;','const jumper = false;')
s=s.replace('const fx = WIN_FX[spec.symbol];','const fx = undefined;')
s=s.replace('const starTex = assets.fxStar as Texture | undefined;','const starTex: Texture | undefined = undefined;')
s=s.replace('const drawFrame = (g: PixiGraphics) => {\n\t\tg.clear();','const drawFrame = (g: PixiGraphics) => {\n\t\tg.clear();\n\t\treturn;')
s=s.replace('drawTrace(t);','// No outlined pay-frame tracer in this theme.')
s=s.replace('root.scale.set(fit * pose.plateHit * cellPop(t));','root.scale.set(fit * pose.plateHit);').replace('root.position.set(props.x ?? 0, (props.y ?? 0) - cellHop(t));','root.position.set(props.x ?? 0, props.y ?? 0);')
p.write_text(s,encoding='utf-8')
# rAF stalls in a background tab. A wall-clock deadline always finishes each wheel phase.
for name in ['FgArcWheel','RareRoulette']:
 p=ROOT/f'src/components/{name}.svelte';s=p.read_text(encoding='utf-8')
 start=s.index('\tconst animate = ');end=s.index('\n\tconst easeOut',start)
 s=s[:start]+'''\tconst animate = (ms: number, step: (t: number) => void) =>
  new Promise<void>((resolve) => {
   let done=false, raf=0;const start=performance.now();
   const finish=()=>{if(done)return;done=true;cancelAnimationFrame(raf);clearTimeout(timer);step(1);resolve();};
   const timer=setTimeout(finish,Math.max(0,ms)+80);
   const tick=(now:number)=>{if(done)return;const t=ms<=0?1:Math.min(1,(now-start)/ms);if(t>=1){finish();return;}step(t);raf=requestAnimationFrame(tick);};
   raf=requestAnimationFrame(tick);
  });'''+s[end:]
 p.write_text(s,encoding='utf-8')
print('Integrated art paths, quiet idle, subject acting, hidden-tab phase deadlines')
