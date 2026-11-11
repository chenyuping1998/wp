from pathlib import Path
import json,math
import numpy as np,cv2
from scipy import ndimage as ndi
from PIL import Image
P=Path(__file__).resolve().parent
code=(P/'verify_revision.py').read_text();ns={'__file__':str(P/'verify_revision.py')};exec(code[:code.index("for ch in ['dj','host']:")],ns);poses=dict(ns['poses']);around=ns['around'];OFF=ns['OFF'];transform=ns['transform']
for ch in ['dj','host']:
 D=P/'candidate'/ch;layout=json.loads((D/'layout.json').read_text());J=layout['joints'];order=layout['draw_order'];L={f.stem:Image.open(f).convert('RGBA')for f in (D/'layers').glob('*.png')};reports=json.loads((D/'qa/pose-outline-report.json').read_text())
 for label,report in reports.items():
  if report['verdict']=='PASS':continue
  pose=poses[label];trans={};swap={}
  for side in ['l','r']:
   a,b=pose.get('arm_'+side,(0,0));A=around(J['shoulder_'+side],a);B=A@around(J['elbow_'+side],b);trans[f'arm_{side}_upper']=A;trans[f'arm_{side}_lower']=B;hn='hand_l_hip'if side=='l'else'hand_r_grip';trans[hn]=B
   if 'hand_'+side in pose:swap[hn]=pose['hand_'+side]
   a,b=pose.get('leg_'+side,(0,0));A=around(J['hip_'+side],a);B=A@around(J['knee_'+side],b);trans[f'leg_{side}_upper']=A;trans[f'leg_{side}_lower']=B
  for n in ['head_idle','hat','glasses']:trans[n]=around(J['neck'],pose.get('head_angle',0))
  trans['neck']=around(J['neck'],pose.get('head_angle',0)*.3)
  if 'head'in pose:swap['head_idle']=pose['head']
  owner=np.full((2160,1600),-1,dtype='int16')
  for i,n in enumerate(order):
   if ch=='dj'and n=='hat'and pose.get('hand_r')=='hand_r_hatheld':continue
   part,xy=transform(L[swap.get(n,n)],OFF@trans.get(n,np.eye(3)));a=np.array(part)[:,:,3];x,y=xy;roi=owner[y:y+a.shape[0],x:x+a.shape[1]];roi[a>160]=i
  out=[]
  for run in report['runs']:
   x0,y0,x1,y1=run['box'];ids,counts=np.unique(owner[y0:y1,x0:x1],return_counts=True);i=int(ids[np.argmax(np.where(ids>=0,counts,0))]);mid=np.array([(x0+x1)/2,(y0+y1)/2,1]);src=np.linalg.inv(OFF@trans.get(order[i],np.eye(3)))@mid;out.append((run['px'],order[i],swap.get(order[i],order[i]),np.round(src[:2],1).tolist()))
  print(ch,label,out)
