from pathlib import Path
import json,numpy as np
from PIL import Image,ImageDraw,ImageFont
from render_core import prep,draw,affine
P=Path(__file__).resolve().parent;F=ImageFont.truetype('/System/Library/Fonts/PingFang.ttc',20)
for ch,anim,t,side,label in [('dj','win_big_loop',.5,'r','20'),('host','win_big',1.,'r','21'),('host','win_big',1.,'l','22')]:
 D=P/'baseline'/ch;J=json.loads((D/'layout.json').read_text())['joints'];f=next(f for f in json.loads((P/(ch+'-actual-frames.json')).read_text())['frames']if f['anim']==anim and f['time']==t);L=prep(D);M=affine(dict(f['slots'])[f'arm_{side}_lower']);center=(M@[*J['wrist_'+side],1])[:2];origin=np.round(center-[100,100]);im=draw(L,f['slots'],origin,(200,200));im.resize((600,600),Image.Resampling.NEAREST).convert('RGB').save(P/'inputs'/('case'+label+'-baseline.png'))
 if label=='21':
  sheet=Image.new('RGB',(1500,600),'#e5e2d6');d=ImageDraw.Draw(sheet)
  for i,n in enumerate(['arm_r_lower','hand_r_grip','hand_r_hatheld']):
   slots=[s for s in f['slots']if s[0]==n]
   if n=='hand_r_grip':slots=[(n,dict(f['slots'])['hand_r_hatheld'])]
   im=draw(L,slots,origin,(200,200)).resize((500,500),Image.Resampling.NEAREST).convert('RGB');sheet.paste(im,(i*500,50));d.text((i*500+5,10),n,font=F,fill='#222222')
  sheet.save(P/'inputs/case21-source-owners.jpg',quality=98)
