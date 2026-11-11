from pathlib import Path
import json,numpy as np
from PIL import Image,ImageDraw,ImageFont
P=Path(__file__).resolve().parent;ns={'__file__':str(P/'render_actual_elbows.py')};exec((P/'render_actual_elbows.py').read_text().split("for ch in ['dj','host']:")[0],ns);draw=ns['draw'];prep=ns['prep'];affine=ns['affine'];PAPER='#e5e2d6';F=ImageFont.truetype('/System/Library/Fonts/PingFang.ttc',25);small=ImageFont.truetype('/System/Library/Fonts/PingFang.ttc',19)
for side,title in [('r','近手'),('l','遠手')]:
 sheet=Image.new('RGB',(2760,1900),PAPER);d=ImageDraw.Draw(sheet);d.text((30,12),'第六輪 '+title+'｜r6 同版圖層｜淺紙底 #e5e2d6｜各格右側為站姿對照',font=F,fill='#222222')
 for row,ch in enumerate(['dj','host']):
  D=P/'candidate'/ch;J=json.loads((D/'layout.json').read_text())['joints'];Ts=json.loads((D/'qa/pose-transforms.json').read_text());L=prep(D);spec=json.loads((P/(ch+'-actual-frames.json')).read_text());actual=next(f for f in spec['frames']if f['anim']=='win_big_end'and f['time']==.25);rest=Image.open(D/'qa/joint-rest.png').convert('RGB')
  for col,(label,pose) in enumerate([('伸直 0°','straight0'),('舉過頭','overhead0'),('收手到頭側｜win_big_end 0.25 s','actual')]):
   x=col*920;y=60+row*920;d.text((x+15,y),('DJ'if ch=='dj'else'主持人')+' '+title+' '+label,font=F,fill='#a32727')
   if pose=='actual':
    mats=dict(actual['slots']);points=[]
    for joint,part in [('shoulder','upper'),('elbow','upper'),('wrist','lower')]:points.append((affine(mats[f'arm_{side}_{part}'])@np.array([*J[joint+'_'+side],1]))[:2])
    points=np.array(points);lo=np.floor(points.min(axis=0)-70);hi=np.ceil(points.max(axis=0)+70);im=draw(L,actual['slots'],lo,tuple((hi-lo).astype(int))).convert('RGB')
   else:
    points=[]
    for joint,part in [('shoulder','upper'),('elbow','upper'),('wrist','lower')]:points.append((np.array(Ts[pose][f'arm_{side}_{part}'])@np.array([*J[joint+'_'+side],1]))[:2]+[280,500])
    points=np.array(points);lo=np.floor(points.min(axis=0)-70);hi=np.ceil(points.max(axis=0)+70);im=Image.open(D/'qa'/('joint-'+pose+'.png')).convert('RGB').crop((*lo.astype(int),*hi.astype(int)))
   # Two times original resolution, aspect ratio retained, no flattering extra crop.
   im=im.resize(tuple((np.array(im.size)*2).astype(int)),Image.Resampling.LANCZOS);im.thumbnail((610,810));sheet.paste(im,(x+15,y+70))
   orig=np.array([J['shoulder_'+side],J['elbow_'+side],J['wrist_'+side]])+[280,500];lo=orig.min(axis=0)-55;hi=orig.max(axis=0)+55;stand=rest.crop((*lo,*hi));stand.thumbnail((260,630));sheet.paste(stand,(x+650,y+120));d.text((x+665,y+72),'站姿（同版）',font=small,fill='#333333');d.text((x+15,y+865),'左：角度放大　右：站姿；原骨架角度／原疊圖順序',font=small,fill='#444444')
 sheet.save(P/('第六輪_'+title+'_三角度與站姿.jpg'),quality=98)
 # compact preview only
 sheet.thumbnail((1380,950));sheet.save(P/('review-'+side+'.jpg'),quality=95)
# Single layers, light and dark.
sheet=Image.new('RGB',(2250,800),PAPER);d=ImageDraw.Draw(sheet)
for i,(ch,n)in enumerate([('dj','arm_r_lower'),('host','arm_r_lower'),('dj','arm_r_upper'),('host','arm_l_lower'),('host','hand_r_grip')]):
 im=Image.open(P/'candidate'/ch/'layers'/(n+'.png'));im=im.crop(im.getbbox());im.thumbnail((190,650));x=i*450;d.text((x+8,10),ch+' '+n,font=small,fill='#222222');sheet.paste(im,(x+10,70),im);dark=Image.new('RGBA',(220,700),'#171b24');dark.alpha_composite(im,(8,5));sheet.paste(dark.convert('RGB'),(x+225,65))
sheet.save(P/'第六輪_五張修正單層_淺暗底.jpg',quality=98)
