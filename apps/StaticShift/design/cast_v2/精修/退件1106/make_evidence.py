from pathlib import Path
import json,hashlib,math
import numpy as np
from PIL import Image,ImageDraw,ImageFont
P=Path(__file__).resolve().parent;PAPER='#e5e2d6';F=ImageFont.truetype('/System/Library/Fonts/STHeiti Medium.ttc',24)
def tile(ch,side,pose):
 D=P/'candidate'/ch;J=json.loads((D/'layout.json').read_text())['joints'];T=json.loads((D/'qa/pose-transforms.json').read_text());M=np.array(T[pose][f'arm_{side}_upper']);v=np.array([*J['elbow_'+side],1]);xy=(M@v)[:2]+np.array([280,500]);x,y=np.round(xy).astype(int);im=Image.open(D/'qa'/('joint-'+pose+'.png')).convert('RGB').crop((x-120,y-100,x+120,y+100)).resize((480,400),Image.Resampling.NEAREST);out=Image.new('RGB',(500,435),PAPER);out.paste(im,(10,32));label=('DJ'if ch=='dj'else'主持人')+' '+('遠手'if side=='l'else'近手')+' '+{'rest':'站姿對照','straight0':'手臂伸直 0°','overhead0':'手舉過頭'}[pose];ImageDraw.Draw(out).text((8,2),label,font=F,fill='#b02020');return out
rows=[('dj','l'),('host','l'),('dj','r'),('host','r')]
for pose,title in [('straight0','手臂伸直'),('overhead0','手舉過頭')]:
 sheet=Image.new('RGB',(1000,435*4),PAPER)
 for i,(ch,s)in enumerate(rows):sheet.paste(tile(ch,s,pose),(0,i*435));sheet.paste(tile(ch,s,'rest'),(500,i*435))
 sheet.save(P/('第五輪_'+title+'_淺紙底放大.jpg'),quality=98)
out=Image.new('RGB',(1500,435*4),PAPER)
for i,(ch,s)in enumerate(rows):
 for j,pose in enumerate(['straight0','overhead0','rest']):out.paste(tile(ch,s,pose),(j*500,i*435))
out.save(P/'第五輪_肘端總對照.jpg',quality=98)
(P/'evidence-source-hashes.json').write_text(json.dumps({ch:{pose:hashlib.sha256((P/'candidate'/ch/'qa'/('joint-'+pose+'.png')).read_bytes()).hexdigest()for pose in ['rest','straight0','overhead0']}for ch in ['dj','host']},indent=2)+'\n')
print('Fifth-round native 2x elbow proof: straight 0 / overhead / standing, both sides and characters.')
