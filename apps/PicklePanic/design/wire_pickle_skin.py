"""Wire production assets and remove all Sushi skin dependencies from the client."""
from pathlib import Path
import re

APP=Path(__file__).resolve().parents[1]
sprites={
 'v8Ray':'ray.png','v8MenuFrame':'panel.png','v8IntroCollect':'w.png','v8IntroSlice':'upgrade_cutin.png','v8IntroReceipt':'p.png',
 'v8LogoBoard':'panel.png','v8LogoStamp':'w.png','v8Stamp':'stamp.png','v8SoyFull':'p.png','v8SoyEmpty':'chip.png',
 'v8BackH1':'low_label.png','v8BackH2':'low_label.png','v8BackS':'low_label.png','gbSymbolPaper':'low_label.png',
 'gbFrameBg':'frame_bg.png','gbFrameEdge':'frame.png',
 'fxGlow':'star.png','fxStar':'star.png','fxStreak':'streak.png','fxLeaf':'chip.png','fxVignette':'clear.png',
 'gbChefCutIn':'upgrade_cutin.png','gbUiTicker':'ticker.png','gbUiBarStrip':'bar_strip.png',
 'gbUiButtonPrint':'button.png','gbUiButtonPrintOn':'button_on.png','gbUiBuyBonus':'buybonus.png',
 'gbUiBuyBonusStone':'buybonus.png','gbUiBuyBonusStoneLit':'buybonus_hover.png',
 'gbFsSign':'panel.png','gbShutter':'door.png','smDoor':'door.png','smNoren':'warning_bar.png',
 'gbBgBase':'bg_base.webp','gbBgFeature':'bg_feature.webp',
 'gbH1':'h1.png','gbH2':'h2.png','gbH3':'h3.png','gbH4':'h4.png','gbW':'w.png','gbP':'p.png','gbS':'s.png',
 'gbL1':'low_label.png','gbL2':'low_label.png','gbL3':'low_label.png','gbL4':'low_label.png','gbL5':'low_label.png',
}
for n in range(16):sprites[f'v8Particle{n}']='chip.png'
for tier in ['Big','Super','Mega','Epic','Max']:
 sprites['v8Win'+tier]='panel.png';sprites['v8Win'+tier+'Decor']='clear.png'
for kind in ['Intro','Total']:
 sprites['v8Fg'+kind]='panel.png';sprites['v8Fg'+kind+'Decor']='clear.png'
for key in ['Big','Superwin','Mega','Epic','Max']:sprites['gbWinBanner'+key]='panel.png'
for name in ['Menu','MenuExit','Settings','Info','PayTable','SoundOn','SoundOff','AutoSpin','Replay']:
 file={'Menu':'menu','MenuExit':'menuExit','Settings':'settings','Info':'info','PayTable':'payTable','SoundOn':'soundOn','SoundOff':'soundOff','AutoSpin':'autoSpin','Replay':'replay'}[name]
 for prefix in ['gbIcon','gbIconMono']:sprites[prefix+name]='icon_'+file+'.png'
source='// Original Pickle Panic production asset registry. No inherited art.\nexport default {\n'
for key,file in sprites.items():source+=f"\t{key}: {{ type: 'sprite', src: new URL('../../assets/pickle/{file}', import.meta.url).href, preload: true }},\n"
for key,out in [('gbBandit','pickleBoss'),('gbLookout','picklePepper')]:
 source+=f"\t{key}: {{ type: 'spine', src: {{ atlas: new URL('../../assets/spines/{out}/cast.atlas', import.meta.url).href, skeleton: new URL('../../assets/spines/{out}/cast.json', import.meta.url).href, scale: 1 }} }},\n"
source+="\twinBananas: { type: 'spriteSheet', src: new URL('../../assets/pickle/jar_particles.json', import.meta.url).href },\n"
source+="\tsound: { type: 'audio', src: new URL('../../assets/audio/sounds.json', import.meta.url).href, preload: true },\n} as const;\n"
(APP/'src/game/assets.ts').write_text(source)
replacements=[('Sushi Plates','Pickle Jars'),('Sushi Plate','Pickle Jar'),('SUSHI PLATES','PICKLE JARS'),('SUSHI PLATE','PICKLE JAR'),('壽司盤','醃漬罐'),('寿司皿','ピクルス瓶'),('Omakase Boat','Pickle Stack Burger'),('Salmon Nigiri','Pickle Dog'),('Tuna Maki','Fried Pickles'),('Tamago Nigiri','Dill Spears'),('Omakase Course','Extra Dill'),('Dinner Service','Diner Service'),('Chef','Cook'),('CHEF','COOK'),('sushi/','pickle/'),('SushiReceipt','Anton'),('Sushi Monkey','Pickle Panic'),('SUSHI MONKEY','PICKLE PANIC'),('sushi shop','fermentation lab'),('sushi','pickle'),('Sushi','Pickle')]
for p in (APP/'src').rglob('*'):
 if not p.is_file() or p.suffix not in ['.svelte','.ts','.json','.css','.html']:continue
 s=p.read_text()
 for a,b in replacements:s=s.replace(a,b)
 p.write_text(s)
p=APP/'src/game/betModeMeta.ts';s=p.read_text().replace('/assets/sprites/pickleUi/card_','/assets/pickle/card_');s=s.replace('four\n// Cooks counted and every collection doubled','four\n// Cooks counted and every 10 converted to a Jar');p.write_text(s)
# The style-only figure is replaced by the actual own Spine cast.
p=APP/'src/components/Game.svelte';s=p.read_text().replace("\timport StyleTestCast from './StyleTestCast.svelte';\n",'').replace('\t\t\t<!-- Draft only; ship.sh is blocked by WORK_IN_PROGRESS. -->\n\t\t\t<Container alpha={0}><Mascot /></Container>\n\t\t\t<StyleTestCast />','\t\t\t<Mascot />');p.write_text(s)
(APP/'src/components/StyleTestCast.svelte').unlink()
# Actual reel housing opening is measured by alpha at its center.
from PIL import Image
im=Image.open(APP/'static/assets/pickle/frame.png').convert('RGBA')
a=im.getchannel('A');row=[a.getpixel((x,640))<24 for x in range(1280)];gap=[x for x,v in enumerate(row)if v and 100<x<1180]
mid=[x for x in gap if 200<x<1080];left=min(mid);right=max(mid)+1
while left>0 and row[left-1]:left-=1
while right<1280 and row[right]:right+=1
scale=1280/(right-left)
p=APP/'src/components/BoardFrame.svelte';s=p.read_text().replace('const FRAME_SCALE = 1280 / 1000;',f'const FRAME_SCALE = {scale:.8f}; // measured alpha opening {left}..{right}')
p.write_text(s)
p=APP/'src/components/Mascot.svelte';s=p.read_text().replace('beatFx: \'laugh\'','beatFx: \'stars\'').replace('const BEAT_START_MS = laughTiming.startMs;','const BEAT_START_MS = 480;').replace('const BEAT_GAP_MS = laughTiming.gapMs;','const BEAT_GAP_MS = 300;').replace('const BEATS = laughTiming.beats;','const BEATS = 6;')
s=s.replace('art: { height: 879, width: 441 }','art: { height: 862, width: 415 }').replace('art: { height: 879, width: 395 }','art: { height: 862, width: 406 }')
s=s.replace('new DropShadowFilter({ offset: { x: 7, y: 6 }, color: 0x1e1b1a, alpha: 0.72, blur: 0, quality: 1 })','new DropShadowFilter({ offset: { x: 4, y: 3 }, color: 0x171c1a, alpha: 0.48, blur: 0, quality: 1 })')
p.write_text(s)
p=APP/'src/components/BanditMeter.svelte';s=p.read_text().replace('ザクッ!','CRUNCH!').replace("PINK = 0xbd9393, ORANGE = 0xb87b60","PINK = 0xc45240, ORANGE = 0xdda831");p.write_text(s)
# Restore a complete initial board; only the symbol drawings change.
original=(APP.parent/'SushiMonkey/src/game/constants.ts').read_text();block=re.search(r'export const INITIAL_BOARD: RawSymbol\[\]\[\] = \[.*?\n\];',original,re.S).group()
p=APP/'src/game/constants.ts';s=p.read_text();s=re.sub(r'export const INITIAL_BOARD: RawSymbol\[\]\[\] = \[.*?\n\];',lambda m:block,s,flags=re.S);p.write_text(s)
# Locked palette applied to all app-local UI, not shared packages.
colors={'0xefeadc':'0xf5e6be','0x1e1b1a':'0x171c1a','0x282828':'0x171c1a','0xb87b60':'0xc45240','0xbd9393':'0x9d8db7','#efeadc':'#f5e6be','#1e1b1a':'#171c1a','#b87b60':'#c45240','#bd9393':'#9d8db7'}
for p in (APP/'src').rglob('*'):
 if p.is_file() and p.suffix in ['.svelte','.ts','.css']:
  s=p.read_text()
  for a,b in colors.items():s=s.replace(a,b)
  p.write_text(s)
print('Wired',len(sprites),'original sprite keys, two new rigs, and measured frame scale',scale)
