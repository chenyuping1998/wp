"""Offline comparison of background layout/veil settings; not a browser capture."""
from pathlib import Path
import argparse,math
import numpy as np
from PIL import Image,ImageDraw,ImageFont
parser=argparse.ArgumentParser();parser.add_argument('output',type=Path);args=parser.parse_args();args.output.mkdir(exist_ok=True,parents=True)
art=Path(__file__).resolve().parents[1]/'static/bloodmoon';W,H=1280,720
def sprite(canvas,file,x,y,w,h,alpha=1,tint=(255,255,255),add=False):
 im=Image.open(art/file).convert('RGBA').resize((round(w),round(h)),Image.Resampling.BILINEAR)
 a=np.asarray(im,dtype=np.float32).copy();a[:,:,:3]*=np.array(tint)/255;a[:,:,3]*=alpha
 im=Image.fromarray(np.uint8(np.clip(a,0,255)))
 layer=Image.new('RGBA',canvas.size);layer.paste(im,(round(x-w/2),round(y-h/2)))
 if add:
  dest=np.asarray(canvas,dtype=np.float32).copy();source=np.asarray(layer,dtype=np.float32)
  dest[:,:,:3]=np.minimum(255,dest[:,:,:3]+source[:,:,:3]*source[:,:,3:4]/255)
  return Image.fromarray(np.uint8(dest))
 return Image.alpha_composite(canvas,layer)
def frame(free,old):
 im=Image.new('RGBA',(W,H),(2,10,21,255));cover=1.035 if old else 1
 im=sprite(im,f'scene/{"free" if free else "base"}.png',W/2,H/2+(3 if old else 0),W*cover,H*cover)
 if free:im=sprite(im,'scene/freeBackgroundGlow.png',W/2,H/2,W*cover,H*cover,.12 if old else .045,add=True)
 veil=Image.new('RGBA',(W,H),(2,10,21,round((.16 if old else .055)*255)));im=Image.alpha_composite(im,veil)
 moon='bloodMoon' if free else 'moon';diameter=H*(.27 if free else .24)
 im=sprite(im,f'scene/{moon}.png',W*.15,H*.17,diameter,diameter,.6 if free else .54,add=True)
 for i in range(3 if old else 2):
  x=W*(.15+i*(.38 if old else .5))+math.sin(i*2)*W*.15;y=H*((.57+i*.11) if old else (.64+i*.14))+math.sin(i)*16
  alpha=(.045+free*.025) if old else (.018+free*.008)
  im=sprite(im,'environment/mist.png',x,y,W*.82,H*(.32 if old else .26),alpha,(164,81,110) if free else (132,173,184))
 return im.convert('RGB')
font=ImageFont.truetype('C:/Windows/Fonts/msjh.ttc',21);sheet=Image.new('RGB',(1280,780),'#090b14');d=ImageDraw.Draw(sheet)
for row,free in enumerate([False,True]):
 for col,old in enumerate([True,False]):
  im=frame(free,old);im.save(args.output/f'background-{"free" if free else "base"}-{"before" if old else "after"}.png')
  sheet.paste(im.resize((640,360),Image.Resampling.LANCZOS),(col*640,row*390+30))
  label=('FG' if free else 'NG')+' · '+('原遮罩／霧層' if old else '調整後（離線圖層參考）')
  d.text((col*640+12,row*390+3),label,font=font,fill='#d9bb84')
sheet.save(args.output/'背景清晰度對照.jpg',quality=94)
print('Rendered NG/FG layer references; source background PNGs were not modified.')
