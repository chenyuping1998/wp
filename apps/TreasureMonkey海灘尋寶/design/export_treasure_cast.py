"""Flatten the registered runtime rig for the opening card."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageChops
import json
ROOT=Path(__file__).resolve().parents[1]
ART=ROOT/'static/assets/treasure'
def export_cast(who,parts):
 full=Image.new('RGBA',(480,720))
 for layer in ['tail','legs','arm_r']+(['arm_l_back'] if who=='lifeguard' else [])+['body','tool','arm_l','head']:
  name='arm_l' if layer=='arm_l_back' else layer
  p=parts[name]
  tile=Image.open(ART/f'{who}_{name}.png').convert('RGBA')
  if name=='body' or (who=='lifeguard' and layer=='arm_l'):
   # Same UV boundary as createCastSkin; no repainting of source artwork.
   left=[];right=[]
   for row in range(17):
    v=row/16;u=min(1,v/(.58 if name=='body' else .56));inset=(.22 if name=='body' else .55)*(1-u*u*(3-2*u))
    if name=='body' and p.get('trimSleeves'):
     u=min(1,max(0,v/.18 if v<.18 else (v-.18)/.50));sm=u*u*(3-2*u)
     inset=.22+.10*sm if v<.18 else .32*(1-sm)
    left.append((inset*tile.width,v*tile.height))
    right.append(((1-inset if name=='body' else 1)*tile.width,v*tile.height))
   mask=Image.new('L',tile.size);ImageDraw.Draw(mask).polygon(left+right[::-1],fill=255)
   tile.putalpha(ImageChops.multiply(tile.getchannel('A'),mask))
  tile=tile.resize((p['w'],p['h']),Image.Resampling.LANCZOS)
  full.alpha_composite(tile,(round(p['x']-p['w']*p['ax']),round(p['y']-p['h']*p['ay'])))
 full.save(ART/f'{who}_full.png')
if __name__=='__main__':
 rig=json.loads((ROOT/'src/game/treasureCastRig.json').read_text(encoding='utf-8'))
 for who,parts in rig.items():export_cast(who,parts)
 print('Exported opening figures from the registered runtime rig.')
