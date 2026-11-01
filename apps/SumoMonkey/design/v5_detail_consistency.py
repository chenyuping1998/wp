"""Bind the accepted source, Spine, crop and final build revisions."""
from pathlib import Path
from PIL import Image,ImageSequence
import json,numpy as np,hashlib
A=Path(__file__).resolve().parents[1];R=A.parents[2];O=R/'dist/sumomonkey-v5-detail'
report={};overlaps={};h=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
for c in ['mg','fg']:
 root=A/f'design/sumo_cast/{c}';boxes=json.loads((root/'crops.json').read_text());entries={}
 for n,box in boxes.items():
  source=root/f'layers/{n}.png';src=Image.open(source).convert('RGBA');spine=Image.open(root/f'{c}_spine/images/{n}.png').convert('RGBA');crop_path=A/f'static/assets/sumoCast/{c}/{n}.png';crop=Image.open(crop_path).convert('RGBA')
  recon=Image.new('RGBA',(1024,1536));recon.paste(crop,(box[0],box[1]))
  assert np.array_equal(np.asarray(src),np.asarray(recon)),(c,n,'crop')
  assert np.array_equal(np.asarray(src),np.asarray(spine)),(c,n,'spine')
  assert h(crop_path)==h(A/f'build/assets/sumoCast/{c}/{n}.png'),(c,n,'build')
  entries[n]={'source_spine_pixels_exact':True,'crop_roundtrip_exact':True,'build_crop_exact':True,'source_sha256':h(source)}
 report[c]=entries;j=json.loads((root/'layers/joints.json').read_text());overlaps[c]={}
 for side,tag in [('front','F'),('back','B')]:
  up=np.asarray(Image.open(root/f'layers/leg_{side}_upper.png'))[:,:,3];lo=np.asarray(Image.open(root/f'layers/leg_{side}_lower.png'))[:,:,3]
  yy,xx=np.nonzero((up>128)&(lo>128));p=np.array(list(j['knee'+tag].values()));q=np.array(list(j['ankle'+tag].values()));v=(q-p)/np.linalg.norm(q-p)
  extent=np.ptp(np.column_stack([xx,yy])@v);assert extent>=40,(c,side,extent);overlaps[c][side+'_knee_overlap_px']=round(float(extent),2)
 frames=[]
 with Image.open(O/f'{c}-before-after.gif') as gif:
  for f in ImageSequence.Iterator(gif):frames.append(f.convert('RGB').crop((420,0,840,550)))
 frames[0].save(root/f'{c}_spine/預覽.gif',save_all=True,append_images=frames[1:],duration=67,loop=0)
(O/'revision-consistency.json').write_text(json.dumps(report,indent=2))
(O/'joint-overlap.json').write_text(json.dumps(overlaps,indent=2))
print('PASS all28 sources = Spine images = runtime crop roundtrip = build assets; knee overlaps',overlaps)
