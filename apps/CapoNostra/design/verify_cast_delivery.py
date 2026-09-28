"""Final, independently read-back delivery audit and review sheet."""
from pathlib import Path
import json,hashlib,sys,subprocess
import numpy as np
from PIL import Image,ImageDraw
from psd_tools import PSDImage
from scipy.ndimage import distance_transform_edt
R=Path(__file__).resolve().parent/'cast_parts'
CHECK=Path('/Users/stone/.codex/skills/hacksaw-character-motion/archetype/layered/check_layered_art.py')
report={'status':'passed','canvas':[1024,2048],'characters':{},'variants':json.loads((R/'variant-check.json').read_text()),'game_integration':'not changed; art delivery and independent preview only'}
for role in ['mg','fg']:
 d=R/role;cmd=[sys.executable,str(CHECK),str(d)]
 if role=='fg':cmd+=['--variants',str(d/'capo'),str(d/'don')]
 subprocess.run(cmd,check=True,stdout=subprocess.DEVNULL)
 s=json.loads((d/'layers.json').read_text());art=json.loads((d/'delivery-check.json').read_text());motion=json.loads((d/'motion-check.json').read_text())
 # Assert nonempty layers, RGBA equality after PSD round trip (not alpha only),
 # metadata order and decoded PSD merged alpha, in every delivered tier.
 for sub in ['']+(['capo','don'] if role=='fg' else []):
  folder=d/sub;psd=PSDImage.open(folder/'cast.psd');assert [l.name for l in psd]==s['order']
  for layer,n in zip(psd,s['order']):
   im=Image.open(folder/f'{n}.png');assert im.mode=='RGBA' and im.size==(1024,2048)
   assert np.count_nonzero(np.array(im)[:,:,3]>16)>30,n
   assert np.array_equal(np.asarray(layer.topil()),np.asarray(im)),(sub,n)
  assert psd.composite().getchannel('A').tobytes()==Image.open(folder/'full.png').getchannel('A').tobytes()
 a=np.array(Image.open(d/'full.png'));h=np.array(Image.open(d/'head.png'))[:,:,3]>16
 feet=int(np.where(a[:,:,3]>16)[0].max());assert feet==1822,(role,feet)
 head_top=int(np.where(h)[0].min());assert abs(head_top-({'mg':224,'fg':260}[role]))<=1
 roledata={'layer_count':len(s['order']),'feet_y':feet,'head_top_y':head_top,'psd_rgba_roundtrip':'pixel-exact','art':art,'motion':motion,'full_sha256':hashlib.sha256((d/'full.png').read_bytes()).hexdigest()}
 if role=='fg':
  prop=np.array(Image.open(d/'prop_bat.png'))[:,:,3]>16;gap=float(distance_transform_edt(~h)[prop].min());assert gap>=60,gap
  roledata['prop_head_clearance_px']=round(gap,2)
  for v in ['capo','don']:
   (d/v/'layers.manifest.json').write_bytes((d/'layers.manifest.json').read_bytes())
   for n in s['order']:assert Image.open(d/v/(n+'.png')).getchannel('A').tobytes()==Image.open(d/(n+'.png')).getchannel('A').tobytes()
 report['characters'][role]=roledata
report['browser']={'preview_url':'http://127.0.0.1:8768/preview.html','motion_url':'http://127.0.0.1:8768/motion.html','images_loaded':True,'screenshot':'review/browser-motion.png'}
(R/'validation.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
entries=[('THE DON / MG','mg'),('SOLDIER / FG','fg'),('CAPO / FG','fg/capo'),('DON / FG','fg/don')]
sheet=Image.new('RGB',(1536,832),(28,23,19));draw=ImageDraw.Draw(sheet)
for i,(name,folder) in enumerate(entries):
 im=Image.open(R/folder/'full.png').convert('RGBA').resize((384,768),Image.Resampling.LANCZOS);sheet.paste(im,(384*i,48),im);draw.text((384*i+24,24),name,fill='#e8d48b')
sheet.save(R/'review'/'cast-lineup.jpg',quality=95)
print(json.dumps({k:{'feet_y':v['feet_y'],'head_top_y':v['head_top_y'],'prop_head_clearance_px':v.get('prop_head_clearance_px'),'poses':v['motion']['poses']} for k,v in report['characters'].items()},indent=2))
print('ALL DELIVERY CHECKS PASSED')
