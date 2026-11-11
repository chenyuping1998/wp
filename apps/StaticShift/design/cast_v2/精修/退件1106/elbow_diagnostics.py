from pathlib import Path
import json,math
import numpy as np,cv2
from PIL import Image,ImageDraw,ImageFont
P=Path(__file__).resolve().parent;PAPER='#e5e2d6';F=ImageFont.truetype('/System/Library/Fonts/Supplemental/Arial.ttf',18)
def render(im,E,ang):
 a=math.radians(ang);R=np.array([[math.cos(a),-math.sin(a)],[math.sin(a),math.cos(a)]]);M=np.column_stack([R,np.array([160,135])-R@E]);src=np.array(im).astype('float32')/255;src[:,:,:3]*=src[:,:,3:4];out=cv2.warpAffine(src,M,(320,270),flags=cv2.INTER_CUBIC);raw=out[:,:,3:4].copy();out[:,:,:3]=np.where(raw>1e-6,out[:,:,:3]/np.maximum(raw,1e-6),0);out[:,:,3:4]=raw.clip(0,1);return Image.fromarray((out.clip(0,1)*255).round().astype('uint8'))
sheet=Image.new('RGB',(1920,4*570),PAPER)
for row,(ch,s) in enumerate([(ch,s)for ch in ['dj','host']for s in ['l','r']]):
 J=json.loads((P/'baseline'/ch/'layout.json').read_text())['joints'];E=np.array(J['elbow_'+s]);S=np.array(J['shoulder_'+s]);W=np.array(J['wrist_'+s]);ua=math.degrees(math.atan2(*(E-S)[::-1]));la=math.degrees(math.atan2(*(W-E)[::-1]));target=180 if s=='l'else 0
 for col,(case,au,al) in enumerate([('rest',0,0),('straight',target-ua,target-la),('overhead',-90-ua,-90-la)]):
  for i,version in enumerate(['baseline','candidate']):
   d=P/version/ch/'layers';out=Image.new('RGBA',(320,270),PAPER)
   for part,ang in [('upper',au),('lower',al)]:out.alpha_composite(render(Image.open(d/f'arm_{s}_{part}.png').convert('RGBA'),E,ang))
   out=out.resize((640,540),Image.Resampling.NEAREST);x=col*640;y=row*570;# before upper half vs after lower? separate full sheets
   if version=='candidate':sheet.paste(out.convert('RGB'),(x,y+30));ImageDraw.Draw(sheet).text((x+4,y+4),ch+' '+s+' '+case+' repaired',font=F,fill='#ac2020')
   out.convert('RGB').save(P/(ch+'-'+s+'-'+case+'-'+version+'.jpg'),quality=98)
sheet.save(P/'elbows-first-review.jpg',quality=98)
