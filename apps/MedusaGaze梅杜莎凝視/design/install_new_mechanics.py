"""Brief-authorized Pillow sizing, alpha preservation and contact sheets."""
from pathlib import Path
import json,shutil
from PIL import Image,ImageOps,ImageDraw
import numpy as np
APP=Path(__file__).resolve().parent.parent;OUT=APP/'design/source/medusagaze/new-mechanics';OUT.mkdir(exist_ok=True)
SPR=APP/'static/assets/sprites';records=json.loads((APP/'design/new_mechanics_generations.json').read_text(encoding='utf-8'))
installed=[]
for r in records:
 name=r['name'];source=Path(r['path']);shutil.copy2(source,OUT/(name+'_original.png'));im=Image.open(source).convert('RGBA')
 if name.startswith('card_'):folder='medusaUi';file=name+'.png';size=(720,1040);im=ImageOps.fit(im,size,method=Image.Resampling.LANCZOS)
 elif name=='stone' or name.startswith('crack'):
  folder='medusaSymbols' if name=='stone' else 'medusaFx';file='st.png' if name=='stone' else 'stone_crack_'+name[-1]+'.png';size=(512,512)
  # Use the identical whole-canvas transform for all fracture frames.
  im=im.resize((450,450),Image.Resampling.LANCZOS);canvas=Image.new('RGBA',size);canvas.alpha_composite(im,(31,31));im=canvas
 else:
  folder='medusaUi';file={'panel':'ladder_panel','pip_on':'snake_pip_on','pip_off':'snake_pip_off'}.get(name,'ladder_'+name)+'.png'
  size=(400,128) if name=='panel' else (64,64) if name.startswith('pip_') else (256,256)
  box=im.getbbox();im=im.crop(box);im=ImageOps.contain(im,size,Image.Resampling.LANCZOS);canvas=Image.new('RGBA',size);canvas.alpha_composite(im,((size[0]-im.width)//2,(size[1]-im.height)//2));im=canvas
 target=SPR/folder/file
 if target.exists() and not (OUT/('previous_'+file)).exists():shutil.copy2(target,OUT/('previous_'+file))
 im.save(target);installed.append((name,target))
# Purely soft additive texture; no opaque edges or stars.
y,x=np.mgrid[-1:1:256j,-1:1:1024j];a=np.exp(-x*x*7-y*y*4)*(.75+.25*np.cos(y*3+x*4));rgba=np.zeros((256,1024,4),dtype=np.uint8);rgba[:,:,:3]=[95,242,228];rgba[:,:,3]=(a*160).astype('uint8');Image.fromarray(rgba).save(SPR/'medusaFx/gaze_sweep.png')
sheet=Image.new('RGB',(1200,900),'#183c43');d=ImageDraw.Draw(sheet)
for i,(name,path) in enumerate(installed):
 tile=Image.open(path).convert('RGBA');tile.thumbnail((210,235),Image.Resampling.LANCZOS);xx=(i%5)*240+(240-tile.width)//2;yy=(i//5)*300+25;sheet.paste(tile,(xx,yy),tile);d.text(((i%5)*240+12,(i//5)*300+270),name,fill='#fff0ba')
sheet.save(APP/'design/source/medusagaze/_sheets/new_mechanics.png')
board=Image.new('RGB',(900,900),'#153e44')
for row in range(6):
 for col in range(6):
  name='st' if (row*7+col)%5==0 else ['h1','h2','h3','h4','h5','l1','l2','l3','l4'][(row*6+col)%9]
  im=Image.open(SPR/'medusaSymbols'/(name+'.png')).convert('RGBA').resize((140,140),Image.Resampling.LANCZOS);board.paste(im,(col*150+5,row*150+5),im)
board.save(APP/'design/source/medusagaze/_sheets/new_mechanics_board.png')
print('Installed',len(installed)+1,'assets and two contact sheets.')
