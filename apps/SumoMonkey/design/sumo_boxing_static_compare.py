"""Source-fidelity and proportional evidence; every figure scales uniformly.
Reads old cast directly from backup tar, never extracts into the live app.
"""
from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
import tarfile,io
ROOT=Path(__file__).resolve().parent;REPO=ROOT.parents[3]
OUT=REPO/'dist/sumomonkey-boxing-evidence';OUT.mkdir(parents=True,exist_ok=True)
DELIVERY=REPO/'角色生圖_相撲猴/交件'
ARCHIVE=REPO/'_upload_backups/SumoMonkey-before-boxing-20261024/cast-and-motion.tgz'
font=ImageFont.truetype(str(ROOT.parent/'static/fonts/sushi/Archivo-variable.ttf'),24)
small=ImageFont.truetype(str(ROOT.parent/'static/fonts/sushi/Archivo-variable.ttf'),17)
def figure(path):
 im=Image.open(path).convert('RGBA');return im.crop(im.getchannel('A').point(lambda a:255 if a>128 else 0).getbbox())
def old(cast):
 with tarfile.open(ARCHIVE) as archive:
  data=archive.extractfile(f'design/sumo_cast/{cast}/full.png').read()
 return figure(io.BytesIO(data))
def panel(figures,path):
 cw,ch=700,1080;floor=990;visual_h=880
 canvas=Image.new('RGB',(cw*len(figures),ch),'#efeadc');d=ImageDraw.Draw(canvas)
 for i,(title,im) in enumerate(figures):
  # Same visible height and ground; no limb or body stretching.
  scale=visual_h/im.height;size=(round(im.width*scale),visual_h)
  resized=im.resize(size,Image.Resampling.LANCZOS)
  canvas.paste(resized,(i*cw+(cw-resized.width)//2,floor-visual_h),resized)
  d.line((i*cw+10,floor,cw*(i+1)-10,floor),fill='#aaa69d',width=1)
  d.text((i*cw+cw//2,40),title,font=font,anchor='mm',fill='#282828')
  d.text((i*cw+cw//2,1030),'Same visible height / same floor',font=small,anchor='mm',fill='#4a4846')
 canvas.save(path)
mg=figure(ROOT/'sumo_cast/mg/full.png');fg=figure(ROOT/'sumo_cast/fg/full.png')
request_mg=figure(DELIVERY/'MG/clean_full.png');request_fg=figure(DELIVERY/'FG/clean_full.png')
bandit=figure('/Users/stone/tools/spine-generator/examples/characters/bandit-monkey/full.png')
panel([('Bandit reference',bandit),('Live reconstructed MG',mg),('Live reconstructed FG',fg)],OUT/'compare-full.png')
panel([('Previous MG',old('mg')),('Live reconstructed MG',mg),('Previous FG',old('fg')),('Live reconstructed FG',fg)],OUT/'before-after-full.png')
print(OUT/'compare-full.png');print(OUT/'before-after-full.png')

panel([('Request MG clean full',request_mg),('Live reconstructed MG',mg),('Request FG clean full',request_fg),('Live reconstructed FG',fg)],OUT/'request-vs-live-full.png')
