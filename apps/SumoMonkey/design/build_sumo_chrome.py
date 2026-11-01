"""Reproducible Sumo Monkey arena chrome and store layer composition.
Native plates use quiet ivory paper, hand-inked edges and small muted salmon accents.
Source image deliveries remain separate; this script never edits those sources.
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageOps
import math, shutil, json
APP=Path(__file__).resolve().parents[1]
ROOT=APP/'static/assets/sprites'
INK='#282828'; PAPER='#efeadc'; RED='#b87b60'; BLUE=INK; GOLD=INK
FONT=APP/'static/fonts/sushi/Bungee-Regular.ttf'

def save(group,name,im):
 p=ROOT/group/name;p.parent.mkdir(parents=True,exist_ok=True);im.save(p,optimize=True)
def plate(size,accent=INK,inset=12):
 """Printed paper with uneven ink edges; no lacquer, metallic trim or GUI chrome."""
 w,h=size;im=Image.new('RGBA',size);d=ImageDraw.Draw(im)
 line=max(2,round(min(w,h)*.009));i=inset
 edge=[(i+3,i+5),(w*.34,i),(w*.68,i+3),(w-i-3,i),
       (w-i,h*.34),(w-i-3,h*.68),(w-i,h-i-4),(w*.66,h-i),
       (w*.33,h-i-3),(i,h-i),(i+3,h*.66),(i,h*.35),(i+3,i+5)]
 d.polygon(edge,fill=PAPER);d.line(edge,fill=INK,width=line,joint='curve')
 # Secondary dry-ink edge fragments and a paper fold keep the surface readable.
 for path in [[(i+14,i+14),(w*.27,i+11)],[(w*.73,i+11),(w-i-17,i+9)],
              [(i+10,h*.38),(i+13,h*.57)],[(w*.58,h-i-9),(w*.82,h-i-11)]]:
  d.line(path,fill=INK,width=max(1,line//3))
 f=min(w,h)*.045
 d.polygon([(w-i-f,h-i),(w-i,h-i-f),(w-i,h-i)],fill='#e4e0d4')
 d.line([(w-i-f,h-i),(w-i-f,h-i-f),(w-i,h-i-f)],fill=INK,width=max(1,line//2))
 for n in range(3):
  x=i+12+n*max(4,line*2);d.line((x,h-i-12,x+6,h-i-21),fill=INK,width=max(1,line//3))
 return im

def emblem(size,full=True):
 # Hand-inked vermilion seal: the only significant solid accent in the chrome.
 w,h=size;im=Image.new('RGBA',size);d=ImageDraw.Draw(im);r=min(w,h)*.34;cx=w/2;cy=h/2
 d.ellipse((cx-r,cy-r,cx+r,cy+r),fill=RED if full else PAPER,outline=INK,width=max(2,w//70))
 d.arc((cx-r+7,cy-r+5,cx+r-6,cy+r-5),8,327,fill=INK,width=max(1,w//150))
 d.line([(cx-r*.45,cy),(cx,cy-r*.35),(cx+r*.45,cy),(cx,cy+r*.35),(cx-r*.45,cy)],fill=PAPER if full else INK,width=max(2,w//35),joint='curve')
 return im

def recolor(im):
 # Palette replacement is deterministic and preserves existing glyph alpha.
 import numpy as np
 a=np.asarray(im.convert('RGBA')).copy();rgb=a[:,:,:3];red=(rgb[:,:,0]>rgb[:,:,1]*1.12)&(rgb[:,:,0]>rgb[:,:,2]*1.12);dark=rgb.max(2)<130;light=~red&~dark
 a[red,:3]=[184,123,96];a[dark,:3]=[40,40,40];a[light,:3]=[239,234,220]
 return Image.fromarray(a)

def fitted(im,size):
 im=im.convert('RGBA');im=im.crop(im.getchannel('A').getbbox());im.thumbnail(size,Image.Resampling.LANCZOS)
 out=Image.new('RGBA',size);out.alpha_composite(im,((size[0]-im.width)//2,(size[1]-im.height)//2));return out

def main():
 source=APP/'design/sumo_source'
 atlas=Image.open(source/'symbols.png').convert('RGBA')
 from scipy.ndimage import label, binary_dilation
 import numpy as np
 cw,ch=atlas.width//4,atlas.height//2
 for i,name in enumerate(['h1','h2','h3','h4','w','s','p','rope']):
  # Generated objects cross nominal cell dividers. A padded cell and its
  # dominant connected silhouette retain the full trophy handles and fan.
  pad=round(cw*.25);x=i%4*cw;y=i//4*ch
  im=atlas.crop((x-pad,y-pad,x+cw+pad,y+ch+pad))
  alpha=np.asarray(im.getchannel('A')).copy();ids,_=label(alpha>40)
  counts=np.bincount(ids.ravel());counts[0]=0
  keep=ids==counts.argmax();alpha[~binary_dilation(keep,iterations=2)]=0
  im.putalpha(Image.fromarray(alpha))
  # Targeted ImageGen W revision retains the same runtime slot and margins.
  if name=='w' and (source/'w_manga_final.png').exists():
   im=Image.open(source/'w_manga_final.png').convert('RGBA')
  im=fitted(im,(480,480));out=Image.new('RGBA',(512,512));out.alpha_composite(im,(16,16));save('sumoSymbols',name+'.png',out)
 arena=Image.open(source/'arena.png').convert('RGB').resize((1920,1080),Image.Resampling.LANCZOS)
 save('sumoBackground','bg_base.png',arena)
 # Free game stays in the same quiet manga arena; only a small paper warmth shift.
 import numpy as np
 pix=np.asarray(arena).astype(float);pix[:,:,0]*=1.012;pix[:,:,1]*=1.004;pix[:,:,2]*=.984
 save('sumoBackground','bg_feature.png',Image.fromarray(np.clip(pix,0,255).astype('uint8')))

 for old in ['sushiIcons','sushiFx']:
  new=old.replace('sushi','sumo')
  for p in (ROOT/old).glob('*.png'):save(new,p.name,recolor(Image.open(p)))
 for p in (ROOT/'sushiV8').glob('*.png'):
  name=p.name;size=Image.open(p).size
  if name.startswith('digit_') or name=='ray.png':im=recolor(Image.open(p))
  elif name.startswith('particle_'):
   im=Image.new('RGBA',size);d=ImageDraw.Draw(im);w,h=size;i=int(p.stem.split('_')[-1])
   if i%3==0:d.polygon([(w*.2,h*.1),(w*.8,h*.2),(w*.7,h*.8),(w*.1,h*.65)],fill=RED,outline=INK,width=3)
   else:d.polygon([(w*.5,h*.08),(w*.83,h*.5),(w*.5,h*.91),(w*.15,h*.5)],fill=PAPER,outline=GOLD,width=3)
  elif name.startswith('back_'):
   # High and special objects are independent cutouts, never framed icons.
   im=Image.new('RGBA',size)
  elif name in ['soy_full.png','soy_empty.png','logo_stamp.png','stamp.png']:im=emblem(size,name!='soy_empty.png')
  elif name.endswith('_decor.png'):
   im=Image.new('RGBA',size);d=ImageDraw.Draw(im);w,h=size
   # Rising flags outside the amount/title well.
   for side in [0,1]:
    x=w*(.08 if side==0 else .92);d.line((x,h*.15,x,h*.86),fill=GOLD,width=12)
    d.polygon([(x,h*.15),(x+(-1 if side else 1)*w*.11,h*.22),(x,h*.34)],fill=RED,outline=INK)
  else:
   im=plate(size,RED if 'max' in name else BLUE,inset=max(10,size[0]//30))
   if name.startswith('intro_'):
    im=Image.new('RGBA',size)
    subjects={'intro_collect.png':['w','p'],'intro_slice.png':['s','rope'],'intro_receipt.png':['h1']}.get(name,[])
    for idx,subject in enumerate(subjects):
     pic=fitted(Image.open(ROOT/'sumoSymbols'/f'{subject}.png'),(500,560))
     im.alpha_composite(pic,(int(size[0]/(len(subjects)+1)*(idx+1)-pic.width/2),(size[1]-pic.height)//2))
   elif name.startswith('title_'):
    im=Image.new('RGBA',size);d=ImageDraw.Draw(im)
    text='FREE SPINS' if name=='title_free.png' else 'TOTAL WIN'
    font=ImageFont.truetype(str(FONT),145 if name=='title_free.png' else 170)
    d.text((size[0]/2,size[1]/2),text,font=font,fill=INK,anchor='mm')
   elif name=='logo_board.png':
    # Parchment title ribbon, runtime title remains in the frontend.
    d=ImageDraw.Draw(im);d.line((size[0]*.1,size[1]*.68,size[0]*.9,size[1]*.68),fill=RED,width=18)
  save('sumoV8',name,im)
 # Frontend-free symbol labels and frame ring.
 save('sumoSymbols','low_label.png',plate((512,512),BLUE,20))
 bg=Image.new('RGBA',(1280,1280),PAPER);d=ImageDraw.Draw(bg)
 # Quiet paper under the board, sparse printed rules rather than dark lacquer.
 for y in range(190,1120,150):d.line((145,y,1135,y-2),fill='#e4e0d4',width=2)
 save('sumoFrame','frame_bg.png',bg)
 edge=plate((1280,1280),INK,70);d=ImageDraw.Draw(edge);d.rectangle((140,140,1140,1140),fill=(0,0,0,0))
 # Small salmon registration marks are deliberately kept off the text wells.
 for x,y in [(88,88),(1160,1160)]:d.rectangle((x,y,x+24,y+24),fill=RED)
 save('sumoFrame','frame_edge.png',edge)
 for p in (ROOT/'sushiUi').glob('*.png'):
  size=Image.open(p).size
  im=emblem(size,'on' in p.name or p.name=='spin_plate.png') if p.name.startswith(('spin_','button_')) else plate(size,RED if 'super' in p.name or 'lit' in p.name else BLUE)
  save('sumoUi',p.name,im)
 for p in (ROOT/'sushiScene').glob('*.png'):
  size=Image.open(p).size;im=plate(size,BLUE)
  if p.name=='noren.png':
   im=Image.new('RGBA',size);d=ImageDraw.Draw(im);w,h=size
   for i in range(8):
    x=i*w//8;d.rectangle((x+4,0,x+w//8-4,h),fill=PAPER,outline=INK,width=4)
    seal=emblem((min(w//8-20,h//2),)*2);im.alpha_composite(seal,(x+(w//8-seal.width)//2,h//4))
  elif p.name=='chef_cut_in.png':im=Image.new('RGBA',size)
  save('sumoScene',p.name,im)
 for p in (ROOT/'sushiWinBanners').glob('*.png'):save('sumoWinBanners',p.name,plate(Image.open(p).size,RED if p.stem=='max' else BLUE))
 # Replace inherited leaf confetti with angular salt flecks.
 im=Image.new('RGBA',(128,128));d=ImageDraw.Draw(im);d.polygon([(64,8),(108,58),(73,114),(22,73)],fill=PAPER,outline=INK,width=2);save('sumoFx','fx_leaf.png',im)
 save('sumoFx','collect_bananas.png',Image.open(ROOT/'sumoSymbols/p.png'))
 out=ROOT/'sumoWinPlates';out.mkdir(exist_ok=True)
 meta=json.loads((ROOT/'sushiWinPlates/bananas.json').read_text())
 sheet=Image.new('RGBA',(1280,512));token=Image.open(ROOT/'sumoSymbols/p.png')
 for i,frame in enumerate(meta['frames'].values()):
  pic=fitted(token.rotate((i-4)*7,resample=Image.Resampling.BICUBIC),(240,240))
  sheet.alpha_composite(pic,((i%5)*256+8,(i//5)*256+8))
 sheet.save(out/'bananas.png');(out/'bananas.json').write_text(json.dumps(meta))
 # Contact sheet at player scale: all generated plates are reopened here.
 files=list(ROOT.glob('sumo*/*.png'));cells=[]
 for p in files:
  im=Image.open(p);im.verify()
  im=Image.open(p).convert('RGBA');im.thumbnail((96,96));cells.append((p.name,im))
 sheet=Image.new('RGB',(960,math.ceil(len(cells)/10)*120),'#777777');d=ImageDraw.Draw(sheet)
 for i,(name,im) in enumerate(cells):
  x=i%10*96;y=i//10*120;sheet.paste(im,(x+(96-im.width)//2,y),im);d.text((x+2,y+98),name[:15],fill='white')
 out=APP/'design/sumo';out.mkdir(exist_ok=True);sheet.save(out/'chrome-contact.png')
 print(f'Reopened {len(files)} generated PNGs; contact sheet: {out}/chrome-contact.png')
if __name__=='__main__':main()
