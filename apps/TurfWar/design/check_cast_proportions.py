"""Compare the exact cropped runtime composition against the native full master.

This catches separately stretched body parts even when mesh/asset gates pass.
Use --runtime-root and --variant base to exercise it on a rejected build.
"""
from pathlib import Path
import argparse,json
import numpy as np
from PIL import Image

APP=Path(__file__).resolve().parent.parent
ap=argparse.ArgumentParser()
ap.add_argument('--runtime-root',type=Path,default=APP/'static/assets/castLayers/turf')
ap.add_argument('--variant',choices=['base','feature','kingpin','fg'])
args=ap.parse_args()
for variant in ([args.variant] if args.variant else ['base','feature','kingpin','fg']):
 who='fg' if variant=='fg' else 'mg'
 master=Image.open(APP/f'design/_incoming/street_cast_crossed_v2/{who}/source/master.png').convert('RGBA')
 folder=args.runtime_root/variant
 manifest=json.loads((folder/'layers.manifest.json').read_text())
 composed=Image.new('RGBA',tuple(manifest['size']))
 for name in manifest['order']:
  layer=next(p for p in manifest['layers'] if p['name']==name)
  texture=Image.open(folder/layer['texture']).convert('RGBA')
  x,y,w,h=layer['crop']
  assert texture.size==(w,h),f'{variant}/{name}: invalid texture crop'
  composed.alpha_composite(texture,(x,y))
 a=np.array(composed).astype(int); b=np.array(master).astype(int)
 assert np.array_equal(a[:,:,3]>16,b[:,:,3]>16),f'{variant}: master silhouette changed — do not resize individual parts'
 diff=int(np.abs(a-b).max())
 assert diff<=1,f'{variant}: runtime differs from full master by {diff} levels'
 print(f'{variant}: full-master silhouette 100%, max RGBA error {diff}; proportions preserved')
