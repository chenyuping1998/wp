"""Transfer ImageGen lighting onto the SAME FG layer stack; never alter alpha."""
from pathlib import Path
import json
import numpy as np
from PIL import Image
from scipy.ndimage import gaussian_filter, distance_transform_edt
from build_cast_delivery import psd_save, compose
ROOT=Path(__file__).resolve().parent/'cast_parts';D=ROOT/'fg'
spec=json.loads((D/'layers.json').read_text());order=spec['order']
base={n:Image.open(D/f'{n}.png').convert('RGBA') for n in order}
full=Image.open(D/'full.png').convert('RGBA');a=np.asarray(full).astype(float);support=a[:,:,3]>128
# Fit generated lighting to the exact base figure box, then measure only broad
# illumination. Texture, face, geometry and all hidden painted areas stay base.
bbox=full.getchannel('A').point(lambda v:255 if v>128 else 0).getbbox()
reports={}
for variant in ['capo','don']:
 ref=Image.open(ROOT/'source_generated'/f'fg_{variant}.png').convert('RGBA')
 rb=ref.getchannel('A').point(lambda v:255 if v>128 else 0).getbbox()
 aligned=Image.new('RGBA',full.size);aligned.paste(ref.crop(rb).resize((bbox[2]-bbox[0],bbox[3]-bbox[1]),Image.Resampling.LANCZOS),bbox[:2])
 r=np.asarray(aligned).astype(float);valid=support&(r[:,:,3]>128)
 weight=gaussian_filter(valid.astype(float),14)
 gain=np.ones_like(a[:,:,:3])
 for c in range(3):
  numerator=gaussian_filter(r[:,:,c]*valid,14)
  denominator=gaussian_filter(a[:,:,c]*valid,14)
  gain[:,:,c]=np.where(weight>.05,numerator/np.maximum(denominator,4),1)
 # Bound transfer to avoid changed painted detail in the lighting reference
 # affecting facial identity, color keys or hidden underlap texture.
 gain=np.clip(gain,.87,1.32 if variant=='capo' else 1.40)
 if variant=='capo':gain=np.maximum(gain,np.array([1.075,1.035,1.005]))
 folder=D/variant;folder.mkdir(exist_ok=True);out={}
 for n,im in base.items():
  ar=np.asarray(im).copy();rgb=ar[:,:,:3].astype(float)*gain
  if variant=='don':
   # Confine transferred golden rim to each existing alpha footprint. Soft
   # 5 px inner edge prevents a new halo or change in the silhouette.
   alpha=ar[:,:,3]/255.;inside=distance_transform_edt(alpha>.05)
   edge=np.exp(-inside/4.5)*(alpha>0)
   y,x=np.indices(alpha.shape)
   directional=.4+.6*np.clip((x-280)/650,0,1)
   amount=edge*directional*.65
   rgb=rgb*(1-amount[:,:,None])+np.array([224,187,99])*amount[:,:,None]
  # Oxblood material remains distinct from the game's signal-red mechanism.
  red=(rgb[:,:,0]>1.85*rgb[:,:,1])&(rgb[:,:,2]>.55*rgb[:,:,1])&(rgb[:,:,2]<1.7*rgb[:,:,1])
  ceiling=155 if variant=='capo' else 160
  f=np.where(red,np.minimum(1,ceiling/np.maximum(rgb[:,:,0],1)),1)
  rgb*=f[:,:,None]
  ar[:,:,:3]=np.clip(np.rint(rgb),0,255).astype('uint8');ar[ar[:,:,3]==0,:3]=0
  out[n]=Image.fromarray(ar);out[n].save(folder/f'{n}.png')
  assert np.array_equal(np.array(out[n])[:,:,3],np.array(im)[:,:,3])
 comp=compose(out,order);comp.save(folder/'full.png')
 assert comp.getchannel('A').tobytes()==full.getchannel('A').tobytes()
 (folder/'layers.json').write_text(json.dumps(dict(spec,variant=variant),indent=2)+'\n')
 psd_save(folder,out,order,comp)
 reports[variant]={'alpha':'pixel-identical in all 9 layers and composite','psd_rgba':'pixel-exact round trip','lighting_source':f'source_generated/fg_{variant}.png','method':'bounded low-frequency ImageGen illumination transfer; don rim confined inside existing layer alpha'}
(ROOT/'variant-check.json').write_text(json.dumps(reports,indent=2)+'\n')
print(json.dumps(reports,indent=2))
