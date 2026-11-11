from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
import json,math,numpy as np,hashlib
P=Path(__file__).resolve().parent;PAPER='#e5e2d6';F=ImageFont.truetype('/System/Library/Fonts/STHeiti Medium.ttc',23)
cases=[{'title':'DJ 屈膝：褲襠內緣','ch':'dj','pose':'knees','box':[690,1290,930,1490]}, {'title':'主持人 屈膝：褲襠內緣','ch':'host','pose':'knees','box':[730,1195,970,1395]}, {'title':'DJ 收胸前：圓順袖頂','ch':'dj','pose':'folded','box':[790,765,1030,965]}]
for ch in ['dj','host']:
 J=json.loads((P/'candidate'/ch/'layout.json').read_text())['joints']
 for side,deg in [('l',20),('r',-15)]:
  k=np.array(J['knee_'+side]);hip=np.array(J['hip_'+side]);a=math.radians(deg);M=np.array([[math.cos(a),-math.sin(a)],[math.sin(a),math.cos(a)]]);xy=M@(k-hip)+hip+np.array([280,500]);rest=k+np.array([280,500]);box=lambda p:[round(p[0]-120),round(p[1]-100),round(p[0]+120),round(p[1]+100)]
  cases.append({'title':('DJ'if ch=='dj'else'主持人')+' 屈膝：'+('左'if side=='l'else'右')+'膝','ch':ch,'pose':'knees','box':box(xy),'rest_box':box(rest)})
def tile(case,version='candidate',pose=None,label=None):
 pose=pose or case['pose'];b=case.get('rest_box',case['box'])if pose=='rest'else case['box'];src=P/version/case['ch']/'qa'/('joint-'+pose+'.png');im=Image.open(src).convert('RGB').crop(b).resize((480,400),Image.Resampling.NEAREST);out=Image.new('RGB',(500,430),PAPER);out.paste(im,(10,28));ImageDraw.Draw(out).text((10,1),label or case['title'],font=F,fill='#b11f1f');return out
# Exactly the attached 3-by-2 composition, repaired original-angle crops.
sheet=Image.new('RGB',(1500,860),PAPER)
items=[tile(cases[0]),tile(cases[0],pose='rest',label='DJ 站姿同位置'),tile(cases[1]),tile(cases[2]),tile(cases[2],pose='rest',label='DJ 站姿同位置'),tile(cases[3])]
for i,t in enumerate(items):sheet.paste(t,((i%3)*500,(i//3)*430))
sheet.save(P/'第三輪_修正放大.jpg',quality=98)
paired=Image.new('RGB',(1000,len(cases)*430),PAPER);triple=Image.new('RGB',(1500,len(cases)*430),PAPER)
for i,c in enumerate(cases):
 for j,t in enumerate([tile(c),tile(c,pose='rest',label='站姿：同部位對照')]):paired.paste(t,(j*500,i*430))
 for j,t in enumerate([tile(c,version='baseline',label='修前 r3：'+c['title']),tile(c,label='修後 r4：'+c['title']),tile(c,pose='rest',label='修後站姿：同部位')]):triple.paste(t,(j*500,i*430))
paired.save(P/'第三輪_逐項站姿對照.jpg',quality=98);triple.save(P/'第三輪_修前修後站姿.jpg',quality=98)
(P/'detail-proof-source.json').write_text(json.dumps({'paper':PAPER,'scale':2,'interpolation':'nearest; actual source pixels','cases':cases,'source_sha256':{ch:{p:hashlib.sha256((P/'candidate'/ch/'qa'/('joint-'+p+'.png')).read_bytes()).hexdigest()for p in ['rest','folded','knees']}for ch in ['dj','host']}},ensure_ascii=False,indent=2)+'\n')
print('Third-round detail evidence written from current original-angle QA.')
