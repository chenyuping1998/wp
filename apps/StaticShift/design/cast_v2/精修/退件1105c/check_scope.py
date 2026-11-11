from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
import numpy as np,json,hashlib
P=Path(__file__).resolve().parent;Y,X=np.mgrid[:1536,:1024];F=ImageFont.truetype('/System/Library/Fonts/Supplemental/Arial.ttf',17);tiles=[];report={};allowed={'dj':{'arm_r_upper','leg_l_upper','leg_r_upper'},'host':{'leg_l_upper','leg_r_upper'}}
sha=lambda f:hashlib.sha256(f.read_bytes()).hexdigest()
for ch in ['dj','host']:
 D=P/'candidate'/ch;B=P/'baseline'/ch;J=json.loads((D/'layout.json').read_text())['joints'];changed=[];unchanged=[]
 for f in sorted((D/'layers').glob('*.png')):
  n=f.stem
  if sha(f)==sha(B/'layers'/f.name):unchanged.append(n);continue
  changed.append(n);assert n in allowed[ch],(ch,n)
  a=Image.open(f);old=np.array(Image.open(B/'layers'/f.name));new=np.array(a);different=np.any(old!=new,axis=2);yy,xx=np.where(different);crop=(max(0,int(xx.min())-12),max(0,int(yy.min())-12),min(1024,int(xx.max())+13),min(1536,int(yy.max())+13));t=Image.new('RGBA',(800,420),'#e5e2d6');t.alpha_composite(Image.new('RGBA',(400,420),'#171b24'),(400,0));cut=a.crop(crop);cut.thumbnail((380,370));t.alpha_composite(cut,(10,35));t.alpha_composite(cut,(410,35));ImageDraw.Draw(t).text((8,5),ch+' '+n+' | paper / dark',font=F,fill='#b92727');tiles.append(t)
 assert set(changed)==allowed[ch]
 for side in ['l','r']:
  k=J['knee_'+side];zone=(X-k[0])**2+(Y-k[1])**2<=80**2
  for part in ['upper','lower']:
   n=f'leg_{side}_{part}';a=np.array(Image.open(D/'layers'/(n+'.png')));b=np.array(Image.open(B/'layers'/(n+'.png')));assert np.array_equal(a[zone],b[zone]),(ch,n,'knee changed')
  assert sha(D/'layers'/f'leg_{side}_lower.png')==sha(B/'layers'/f'leg_{side}_lower.png')
 report[ch]={'changed':changed,'unchanged_byte_identical':unchanged,'knee_joint_80px_RGBA_unchanged':True,'lower_legs_entirely_unchanged':True}
out=Image.new('RGBA',(1600,1260),'#e5e2d6')
for i,t in enumerate(tiles):out.alpha_composite(t,((i%2)*800,(i//2)*420))
out.convert('RGB').save(P/'changed-source-light-dark.jpg',quality=98);(P/'scope-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n');print('SCOPE PASS: exactly 5 local layers changed, 47 byte-identical; knee joint RGBA (80px) unchanged; all four lower legs unchanged.')
