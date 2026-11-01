"""Evidence from the actual installed crops/bakes, not a stale preview."""
from pathlib import Path
from PIL import Image,ImageDraw
import numpy as np,json,math,hashlib
from scipy.ndimage import label
A=Path(__file__).resolve().parents[1];R=A.parents[2]
O=R/'dist/sumomonkey-v5-detail';O.mkdir(exist_ok=True)
B=R/'_upload_backups/SumoMonkey-before-v5-detail-20261027'
ns={'__file__':str(A/'design/sumo_redissect_v2_preview.py')}
renderer=(A/'design/sumo_redissect_v2_preview.py').read_text().split('casts = {}')[0]
renderer=renderer.replace('W, H, S = 420, 450, .255','W, H, S = 420, 550, .255').replace('190+x*S, 420+y*S','190+x*S, 520+y*S')
exec(renderer,ns)
render=ns['render'];load=ns['source'];report={}
for cast in ['mg','fg']:
 root=A/'design/sumo_cast'/cast;order=json.loads((root/'layers/layers.json').read_text())['order']
 full=Image.new('RGBA',(1024,1536));parts={};pages=[]
 for ix,n in enumerate(order):
  p=root/'layers'/f'{n}.png';im=Image.open(p).convert('RGBA');full.alpha_composite(im);a=np.asarray(im)
  ids,count=label(a[:,:,3]>0,np.ones((3,3)));sizes=np.bincount(ids.ravel());sizes[0]=0
  parts[n]={'components':count,'island_pixels':int(sizes.sum()-sizes.max()),'sha256':hashlib.sha256(p.read_bytes()).hexdigest()}
  assert count==1,(cast,n,count)
  if ix%4==0:pages.append(Image.new('RGB',(1200,1120),'#efeadc'))
  box=im.getbbox();pic=im.crop(box);pic.thumbnail((570,240))
  for c,bg in enumerate(['#ffffff','#20232a']):
   x=c*600;y=(ix%4)*280;pages[-1].paste(bg,(x,y,x+600,y+280));pages[-1].paste(pic,(x+(600-pic.width)//2,y+30),pic)
   ImageDraw.Draw(pages[-1]).text((x+8,y+8),cast+' '+n,fill='#b87b60')
 for i,p in enumerate(pages):p.save(O/f'{cast}-layers-{i}.png')
 assert np.array_equal(np.asarray(full),np.asarray(Image.open(root/'full.png').convert('RGBA')))
 for f in ['joints.json','layers.json','motion.params.json']:
  assert (root/'layers'/f).read_bytes()==(B/'design/sumo_cast'/cast/'layers'/f).read_bytes()
 new=load(A,cast);old=load(B,cast);frames=[];sheets={}
 for name,clip in new[0]['clips'].items():
  sheet=Image.new('RGB',(1680,1100),'#efeadc')
  for i in range(math.ceil(clip['duration']*15)+1):
   t=min(i/15,clip['duration']);f=Image.new('RGB',(840,550),'#efeadc')
   f.paste(render(*old,name,t,cast+' BEFORE'),(0,0));f.paste(render(*new,name,t,cast+' AFTER'),(420,0));frames.append(f)
  for k,t in enumerate(np.linspace(0,clip['duration'],8)):
   sheet.paste(render(*new,name,float(t),cast+' '+name+f' {t:.2f}s'),((k%4)*420,(k//4)*550))
  sheet.save(O/f'{cast}-{name}.png')
 frames[0].save(O/f'{cast}-before-after.gif',save_all=True,append_images=frames[1:],duration=67,loop=0)
 report[cast]={'parts':parts,'frames':len(frames),'full_exact':True,'joints_order_params_identical':True}
(O/'source-audit.json').write_text(json.dumps(report,indent=2));print('PASS full compositions, connected layers and unchanged recipes. Motion review required:',O)
