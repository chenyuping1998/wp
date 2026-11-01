"""Verify the installed runtime crops against the current delivered composition."""
from pathlib import Path
import argparse,json,re
import numpy as np
from PIL import Image
APP=Path(__file__).resolve().parent.parent
ap=argparse.ArgumentParser();ap.add_argument('--runtime-root',type=Path);ap.add_argument('--variant',choices=['base','fg']);args=ap.parse_args()
component=(APP/'src/components/CastFigureMesh.svelte').read_text();versions=set(re.findall(r'assets/castLayers/turf/(v\d+)/(?:base|fg)/cast.spine.json',component));assert len(versions)==1
root=args.runtime_root or APP/'static/assets/castLayers/turf'/versions.pop()
for variant in ([args.variant] if args.variant else ['base','fg']):
 who='mg' if variant=='base' else 'fg';folder=root/variant;rig=json.loads((folder/'cast.spine.json').read_text());layers=rig['turf']['layers'];master=Image.open(APP/f'design/rebuild_20261023/cast/{who}/full.png').convert('RGBA');composed=Image.new('RGBA',master.size)
 assert [p['name']for p in layers]==[s['name']for s in rig['slots']],'Runtime order differs from crop order'
 for layer in layers:
  texture=Image.open(folder/(layer['name']+'.png')).convert('RGBA');x,y,w,h=layer['crop'];assert texture.size==(w,h),f'{variant}: crop mismatch';composed.alpha_composite(texture,(x,y))
 a=np.asarray(composed).astype(int);b=np.asarray(master).astype(int);diff=int(np.abs(a-b).max());assert diff<=1,f'{variant}: source/runtime composition differs by {diff} RGBA levels'
 print(f'{variant}: {root.name} actual cropped composition matches current full source, max RGBA error {diff}')
