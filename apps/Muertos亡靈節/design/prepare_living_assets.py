"""Pack generated mouth insert and an isolated linen layer; retain original masters."""
from pathlib import Path
from PIL import Image,ImageDraw,ImageFilter
import shutil
ROOT=Path(__file__).resolve().parent;APP=ROOT.parent;D=ROOT/'source/mummy_delivery';R=APP/'static/assets/spines/mummyCat'
backup=D/'mascot_versions/before_living_face'
if not backup.exists():
 backup.mkdir(parents=True)
 for p in R.iterdir():
  if p.is_file():shutil.copy2(p,backup/p.name)
base=Image.open(backup/'head_idle.png').convert('RGBA');talk=Image.open(D/'originals/head_talk_v1.png').convert('RGBA').resize(base.size,Image.Resampling.LANCZOS)
mask=Image.new('L',base.size);ImageDraw.Draw(mask).rounded_rectangle((98,126,166,176),radius=7,fill=255);mask=mask.filter(ImageFilter.GaussianBlur(1.5))
out=Image.composite(talk,base,mask);out.putalpha(base.getchannel('A'));out.save(R/'head_talk.png')
linen=Image.open(D/'originals/background_linen_v1.png').convert('RGBA');linen.putalpha(linen.getchannel('A').point(lambda v:0 if v<160 else v));linen=linen.crop(linen.getchannel('A').getbbox()).resize((192,1024),Image.Resampling.LANCZOS)
linen.save(APP/'static/assets/sprites/mummyBackground/living_linen.webp',quality=94)
print('Packed mouth-only expression and 192x1024 isolated background linen')
