"""Mechanical palette normalization, runtime fitting and layer separation.
Raw native generated originals are retained untouched in source/v8.
"""
from pathlib import Path
from PIL import Image,ImageDraw
import numpy as np
APP=Path(__file__).resolve().parents[1];SRC=APP/'design/source/v8';OUT=APP/'static/assets/sprites/sushiV8';OUT.mkdir(exist_ok=True)
palette=np.array([[239,234,220],[228,224,212],[243,240,230],[74,72,70],[40,40,40],[184,123,96],[168,110,86],[189,147,147]],dtype=np.int16)
def normalize(im):
 a=np.asarray(im.convert('RGBA')).copy();rgb=a[:,:,:3].astype(np.int16)
 # Authored common palette post-process, one nearest ink per pixel, no blur.
 distances=np.sum((rgb[:,:,None,:].astype(np.int32)-palette[None,None,:,:])**2,axis=3)
 a[:,:,:3]=palette[np.argmin(distances,axis=2)].astype('uint8');a[:,:,3]=np.where(a[:,:,3]>128,255,0)
 return Image.fromarray(a)
def fit(im,size):
 im=im.crop(im.getchannel('A').getbbox());im.thumbnail((size[0]-16,size[1]-16),Image.Resampling.LANCZOS)
 out=Image.new('RGBA',size);out.alpha_composite(im,((size[0]-im.width)//2,(size[1]-im.height)//2));return out
for p in SRC.glob('*.png'):
 name=p.stem
 if name in ['particles','ray'] or name.startswith(('digit_','title_')):continue
 size=(1600,500) if name.startswith('title_') else (740,1024) if name=='menu_frame' else (1024,640) if name.startswith('intro_') else (1600,1000) if name.startswith('fg_') else (1600,900) if name.startswith('win_') else (1600,600) if name=='logo_board' else (512,512)
 im=normalize(fit(Image.open(p),size))
 if name=='menu_frame':
  # Separate opaque code-native paper backplate under the generated wooden rim.
  paper=Image.new('RGBA',size);ImageDraw.Draw(paper).rectangle((60,150,680,955),fill='#EFEADC');paper.alpha_composite(im)
  # Replace blank print well with exactly the established clean paper surface.
  ImageDraw.Draw(paper).rectangle((88,185,650,900),fill='#EFEADC');im=paper
 if name=='win_mega':
  # Receipt uses two hard inks: eliminate intermediate grey shading.
  a=np.asarray(im).copy();opaque=a[:,:,3]>128;neutral=np.max(a[:,:,:3],axis=2)-np.min(a[:,:,:3],axis=2)<35
  dark=opaque&neutral&(a[:,:,0]<160);light=opaque&neutral&~dark
  a[dark,:3]=[40,40,40];a[light,:3]=[239,234,220];im=Image.fromarray(a)
 if name.startswith(('win_','fg_')):
  a=np.asarray(im).copy();h,w=a.shape[:2];inside=np.zeros((h,w),bool);inside[int(h*.24):int(h*.79),int(w*.16):int(w*.84)]=True
  base=a.copy();base[~inside,3]=0;decor=a.copy();decor[inside,3]=0
  Image.fromarray(base).save(OUT/f'{name}.png',optimize=True);Image.fromarray(decor).save(OUT/f'{name}_decor.png',optimize=True)
 else:im.save(OUT/f'{name}.png',optimize=True)
# Fill variants reuse our established code-native paper frame; no border redraw.
label=Image.open(APP/'static/assets/sprites/sushiSymbols/low_label.png').convert('RGBA');a=np.asarray(label)
for name in ['back_h1','back_h2','back_s']:
 im=label.copy();pix=np.asarray(im).copy();paper=(a[:,:,0]>145)&(a[:,:,1]>140)&(a[:,:,3]>128)
 yy,xx=np.indices(paper.shape)
 if name=='back_h1':pix[paper,:3]=[184,123,96]
 if name=='back_h2':pix[paper&(yy>256),:3]=[184,123,96]
 im=Image.fromarray(pix);d=ImageDraw.Draw(im)
 if name=='back_h1':
  for angle in range(0,360,30):
   import math
   for r in range(170,231,16):
    x=256+math.cos(math.radians(angle))*r;y=256+math.sin(math.radians(angle))*r;d.ellipse((x-3,y-3,x+3,y+3),fill='#4A4846')
 if name=='back_s':
  for r in [175,195,215]:d.ellipse((256-r,256-r,256+r,256+r),outline='#4A4846',width=3)
 im.save(OUT/f'{name}.png',optimize=True)
if (SRC/'particles.png').exists():
 sheet=normalize(Image.open(SRC/'particles.png'));w,h=sheet.size
 for i in range(16):
  cell=sheet.crop(((i%4)*w//4,(i//4)*h//4,(i%4+1)*w//4,(i//4+1)*h//4));cell=normalize(fit(cell,(128,128)));cell.save(OUT/f'particle_{i}.png',optimize=True)
if (SRC/'ray.png').exists():normalize(fit(Image.open(SRC/'ray.png'),(1024,1024))).save(OUT/'ray.png',optimize=True)
print('V8 art fitted, palette normalized, independent bases/decorations exported')
