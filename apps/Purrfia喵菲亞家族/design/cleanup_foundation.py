from pathlib import Path
import re,json
from PIL import Image, ImageDraw
app=Path(__file__).resolve().parents[1]
def edit(rel,fn):
 p=app/rel;p.write_text(fn(p.read_text(encoding='utf8')),encoding='utf8')
# Remove unused source-theme scene/rig helpers rather than load inert legacy art.
p=app/'src/game/animationTimeline.ts';s=p.read_text(encoding='utf8');a=s.index('export const tumbleTiming');b=s.index('export const multiplierCountMs',a) if 'export const multiplierCountMs' in s else len(s);p.write_text('/** Shared cascade timing; placeholder character animation is app-owned. */\n'+s[a:b],encoding='utf8')
p=app/'src/game/constants.ts';s=p.read_text(encoding='utf8');a=s.index('/** Orb colour');b=s.index('// The board\'s own cell colour',a);s=s[:a]+'export const FEATURE_ACCENT = 0xf2c14e;\n\n'+s[b:];p.write_text(s,encoding='utf8')
for p in (app/'src').rglob('*'):
 if p.suffix not in ('.ts','.svelte','.html','.json','.txt'):continue
 s=p.read_text(encoding='utf8')
 s=s.replace('GAZE_COLOR','FEATURE_ACCENT').replace('MEDUSA_AUDIO','PURRFIA_AUDIO').replace('medusaGazeErrorLogging','purrfiaErrorLogging').replace('medusaTip','boxTip').replace('medusaBannerLayout','purrfiaBannerLayout')
 # Old implementation comments do not describe this game's cluster rules.
 s=re.sub(r'/\*[\s\S]*?\*/','',s)
 s='\n'.join(line for line in s.splitlines() if not re.search(r'//.*(?:Medusa|medusa|MEDUSA|Aegis|snake|orb)',line))
 p.write_text(s+'\n',encoding='utf8')
p=app/'src/game/medusaBannerLayout.json'
if p.exists():p.rename(app/'src/game/purrfiaBannerLayout.json')
# Keep only registry entries that can actually be rendered by the review build.
dead={'fxCrack1','fxCrack2','fxCrack3','mgBgFree','mgBgCloud','mgBgTourist','mgBgIcecream','mgBgFlame','mgTotalPlate','mgTotalPlateMid','mgTotalPlateHigh','mgFrameCapital','mgFrameLintel','mgFrameColumn','mgOrbGreen','mgOrbPurple','mgOrbGold','mgH5'}
p=app/'src/game/assets.ts';s=p.read_text(encoding='utf8');lines=[]
for line in s.splitlines():
 key=line.strip().split(':')[0]
 if key in dead:
  match=re.search("new URL\\('([^']+)'",line)
  if match:
   target=(app/'static'/match[1].replace('../../','')).resolve()
   if not str(target).startswith(str((app/'static').resolve())):raise RuntimeError(target)
   target.unlink(missing_ok=True)
 else:lines.append(line)
p.write_text('\n'.join(lines)+'\n',encoding='utf8')
for rel in ['src/components/SymbolArtMesh.svelte']:
 (app/rel).unlink(missing_ok=True)
im=Image.new('RGBA',(256,256));d=ImageDraw.Draw(im);d.polygon([(43,97),(41,32),(95,65)],fill='#f4f1ea');d.polygon([(213,97),(215,32),(161,65)],fill='#f4f1ea');d.ellipse((34,50,222,227),fill='#f4f1ea');d.ellipse((72,112,100,128),fill='#f2c14e');d.ellipse((157,112,185,128),fill='#f2c14e');d.ellipse((143,91,199,150),outline='#b07a1a',width=8);d.ellipse((115,150,137,164),fill='#e8a0a8');im.save(app/'static/favicon.png')
print('Removed unused source-theme assets; installed neutral cat favicon.')


