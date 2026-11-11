from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
import numpy as np,math,json
P=Path(__file__).resolve().parent/'精修/v1';F=ImageFont.truetype('/System/Library/Fonts/Supplemental/Arial.ttf',18)
def turn(p,a):
 a=math.radians(a);c,s=math.cos(a),math.sin(a);x,y=p;return np.array([[c,-s,x-c*x+s*y],[s,c,y-s*x-c*y],[0,0,1.]])
def xy(v):return np.array([*v,1.])
for ch in ['dj','host']:
 D=P/ch;J=json.loads((D/'layout.json').read_text())['joints'];checks=[]
 checks.append(('rest','elbow_r',J['elbow_r']));checks.append(('rest','shoulder_r',J['shoulder_r']));checks.append(('rest','neck',J['neck']))
 for side in ['l','r']:
  for pose,(a,b) in [('raised',(120,90) if side=='l' else (-130,150)),('folded',(-15,-85) if side=='l' else (20,-60))]:
   A=turn(J['shoulder_'+side],a);B=A@turn(J['elbow_'+side],b)
   if pose=='raised':checks.append((pose,'shoulder_'+side,J['shoulder_'+side]))
   checks.append((pose,'elbow_'+side,(A@xy(J['elbow_'+side]))[:2]));checks.append((pose,'wrist_'+side,(B@xy(J['wrist_'+side]))[:2]))
 upper=Image.new('RGB',(1280,math.ceil(len(checks)/4)*340),'#171b24')
 for i,(pose,name,p) in enumerate(checks):
  frame=Image.open(D/'qa'/('joint-'+pose+'.png')).convert('RGB');x,y=p+np.array([280,500]);crop=frame.crop((round(x-160),round(y-150),round(x+160),round(y+150)));cx=(i%4)*320;cy=(i//4)*340;upper.paste(crop,(cx,cy+35));ImageDraw.Draw(upper).text((cx+5,cy+6),pose+' '+name,font=F,fill='#eeeeea')
 upper.save(D/'qa/native-upper-joints.png')
 lower=Image.new('RGB',(960,680),'#171b24');i=0
 for side in ['l','r']:
  a,b=(20,-45) if side=='l' else (-15,35);A=turn(J['hip_'+side],a);B=A@turn(J['knee_'+side],b)
  for name,p in [('hip',J['hip_'+side]),('knee',(A@xy(J['knee_'+side]))[:2]),('ankle',(B@xy(J['ankle_'+side]))[:2])]:
   frame=Image.open(D/'qa/joint-knees.png').convert('RGB');x,y=np.array(p)+[280,500];crop=frame.crop((round(x-160),round(y-150),round(x+160),round(y+150)));cx=(i%3)*320;cy=(i//3)*340;lower.paste(crop,(cx,cy+35));ImageDraw.Draw(lower).text((cx+5,cy+6),name+'_'+side,font=F,fill='#eeeeea');i+=1
 lower.save(D/'qa/native-lower-joints.png')
 print(ch,'native joint crops saved')
