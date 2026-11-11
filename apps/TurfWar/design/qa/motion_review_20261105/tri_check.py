# per-slot inked-triangle area ratio vs bind pose across a pose dump
import sys, json, numpy as np
from PIL import Image
APP='/Users/stone/stake-engine/wp/apps/TurfWar/'
variant, poses = sys.argv[1:3]; who={'base':'mg','fg':'fg'}[variant]
import os
mesh={l['name']:l for l in json.load(open(os.environ.get('MESH',APP+f'design/rebuild_20261023/kit/{who}/mesh.json')))}
frames=json.load(open(poses))
for name,l in mesh.items():
  tex=np.asarray(Image.open(APP+f'static/assets/castLayers/turf/v5/{variant}/{name}.png'))[...,3]
  th,tw=tex.shape
  B=np.asarray(l['verts']); T=np.asarray(l['tris']).reshape(-1,3); UV=np.asarray(l['uvs'])
  c=UV[T].mean(1); ink=tex[np.clip((c[:,1]*th).astype(int),0,th-1),np.clip((c[:,0]*tw).astype(int),0,tw-1)]>40
  def area(V): a,b,cc=V[T[:,0]],V[T[:,1]],V[T[:,2]]; return 0.5*((b[:,0]-a[:,0])*(cc[:,1]-a[:,1])-(b[:,1]-a[:,1])*(cc[:,0]-a[:,0]))
  a0=area(B); worst_lo=(9,None); worst_hi=(0,None); flips=0
  for f in frames:
    V=np.asarray([s for s in f['slots'] if s['name']==name][0]['verts'])
    r=area(V)/np.where(np.abs(a0)<1e-6,1e-6,a0); r=r[ink]
    flips+=int((r<0).sum())
    i=r.argmin(); j=r.argmax()
    if r[i]<worst_lo[0]: worst_lo=(r[i],f['label'],c[ink][i]*[l['crop'][2],l['crop'][3]]+l['crop'][:2])
    if r[j]>worst_hi[0]: worst_hi=(r[j],f['label'],c[ink][j]*[l['crop'][2],l['crop'][3]]+l['crop'][:2])
  print(f"{variant} {name:8s} min {worst_lo[0]:.2f} @{worst_lo[1]} xy{np.round(worst_lo[2]).tolist()}  max {worst_hi[0]:.2f} @{worst_hi[1]} xy{np.round(worst_hi[2]).tolist()} flips {flips}")
