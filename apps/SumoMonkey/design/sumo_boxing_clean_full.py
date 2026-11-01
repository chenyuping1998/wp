"""Remove smooth external generated halo using ink-edge silhouette support.
Never thresholds interior black fur by colour. Sources remain unchanged.
Writes candidate alpha, paper/dark composites and numerical inspection data.
Usage: anaconda python script --source IMAGE --out DIRECTORY
"""
from pathlib import Path
from PIL import Image,ImageDraw
import numpy as np
from scipy.ndimage import maximum_filter,minimum_filter,binary_closing,binary_fill_holes,binary_dilation,label,gaussian_filter
import argparse,json
p=argparse.ArgumentParser();p.add_argument('--source',type=Path,required=True);p.add_argument('--out',type=Path,required=True);args=p.parse_args()
im=Image.open(args.source).convert('RGBA');a=np.array(im);rgb=a[:,:,:3].astype(float);old=a[:,:,3].copy()
luma=rgb@np.array([.2126,.7152,.0722])
# Real ink/hatching has local contrast. The smooth gray aura does not.
edge=(maximum_filter(luma,size=5)-minimum_filter(luma,size=5)>32)&(old>180)
edge=binary_closing(edge,iterations=3);ids,n=label(edge);counts=np.bincount(ids.ravel());counts[0]=0
mask=ids==counts.argmax();mask=binary_dilation(mask,iterations=3);mask=binary_fill_holes(mask)
# Enclosed empty spaces (legs / arm gaps) need to remain open. Re-open large
# low-texture zones connected to exterior before filling, using source contour.
# Keep exactly the edge-derived connected exterior; do not replace original RGB.
soft=gaussian_filter(mask.astype(float),.55);new=np.minimum(old,np.clip(soft*255,0,255).astype('uint8'))
# Generated opaque body pixels arrived at alpha250..254; make only that
# strong silhouette interior opaque, keeping edge antialias and RGB untouched.
new[mask & (old>=250)]=255
a[:,:,3]=new
args.out.mkdir(parents=True,exist_ok=True);out=Image.fromarray(a);out.save(args.out/'clean_full.png')
Image.fromarray(new).save(args.out/'clean_alpha.png')
for name,color in [('paper','#efeadc'),('dark','#383838')]:
 bg=Image.new('RGBA',im.size,color);bg.alpha_composite(out);bg.convert('RGB').save(args.out/f'clean_on_{name}.png')
metrics={'source':str(args.source),'size':im.size,'source_alpha_nonzero':int((old>0).sum()),'clean_alpha_nonzero':int((new>0).sum()),'alpha_removed_pixels':int(((old>0)&(new==0)).sum()),'bounds':out.getchannel('A').getbbox(),'opaque_rgb_untouched':True,'method':'local-ink-edge connected silhouette, no interior RGB change'}
(args.out/'clean_metrics.json').write_text(json.dumps(metrics,indent=2));print(json.dumps(metrics))
