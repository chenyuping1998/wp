from pathlib import Path
import re,json,shutil
ROOT=Path(__file__).resolve().parent.parent
p=ROOT/'src/game/assets.ts';s=p.read_text(encoding='utf-8').replace('sprites/goBananasUi/','sprites/mummyUi/')
for key,file in [('gbH3Glow','mummySymbols/h3_glow'),('mummyBuyIcon','mummyUi/buy_icon')]:
 if key+':' not in s:s=s.replace('export default {',f"export default {{\n {key}: {{type:'sprite',src:new URL('../../assets/sprites/{file}.png',import.meta.url).href,preload:true}},",1)
p.write_text(s,encoding='utf-8')
p=ROOT/'src/components/FeatureIntro.svelte';s=p.read_text(encoding='utf-8')
s=re.sub(r'\s*\{#if panel\.(?:symbolKey|panelKey)\}[\s\S]*?\{/if\}','',s);p.write_text(s,encoding='utf-8')
p=ROOT/'src/components/ui/MummyBar.svelte';s=p.read_text(encoding='utf-8').replace('Container, Graphics, Rectangle, Text','Container, Graphics, Rectangle, Text, Sprite')
s=s.replace('<Graphics draw={(g: PixiGraphics) => drawBuyIcon(g, BUY.h * 0.72, INK)} />','<Sprite key="mummyBuyIcon" anchor={.5} width={BUY.h*.8} height={BUY.h*.8} />');p.write_text(s,encoding='utf-8')
# Remove obsolete placeholder paragraphs after each receiving code path has been replaced.
for name in ['FgArcWheel','RareRoulette','TransitionAnimation','FeatureIntro','ui/MummyBar','ui/ModalBuyBonus']:
 p=ROOT/f'src/components/{name}.svelte';s=p.read_text(encoding='utf-8')
 s=re.sub(r'\t// PLACEHOLDER\(art\)[^\n]*(?:\n\t//[^\n]*)*','\t// Production mummy textures: design/source/mummy_delivery.',s)
 s=s.replace('code until the mummy card art lands (PLACEHOLDER(art), see below).','the delivered scene illustrations.')
 p.write_text(s,encoding='utf-8')
# Runtime atlas names preserve the emitter\'s frame identity while changing the art.
p=ROOT/'static/assets/sprites/mummyCoins/coins.json';d=json.loads(p.read_text());d['frames']={f'banana_{i+1:02}.png':frame for i,frame in enumerate(d['frames'].values())};p.write_text(json.dumps(d))
# Only move verified obsolete runtime directories inside THIS app; retain sources for review.
legacy=ROOT/'design/source/legacy_boomana';legacy.mkdir(exist_ok=True)
for relative in ['static/assets/audio/jungle','static/assets/sprites/goBananasSymbolsV3','static/assets/sprites/goBananasFrame','static/assets/sprites/goBananasBackground','static/assets/sprites/goBananasWinBanners','static/assets/sprites/goBananasFx','static/assets/sprites/goBananasUi','static/assets/sprites/goBananasWinBananas','static/assets/spines/goBananasMonkey']:
 target=(ROOT/relative).resolve();assert target.is_relative_to(ROOT.resolve())
 if target.exists():
  destination=legacy/target.name;assert destination.resolve().is_relative_to(legacy.resolve())
  if destination.exists():raise RuntimeError(f'refuse to overwrite legacy source {destination}')
  shutil.move(str(target),str(destination))
print('Cleaned runtime references and retained inherited art/audio outside static assets')
