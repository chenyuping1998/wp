import json, numpy as np, sys
mesh={v:json.load(open(f'/Users/stone/stake-engine/wp/apps/TurfWar/design/rebuild_20261023/kit/{w}/mesh.json')) for v,w in [('base','mg'),('fg','fg')]}
for v in ['base','fg']:
  L=[l for l in mesh[v] if l['name']=='body'][0]; bind=np.asarray(L['verts']); vis=set(L['visibleVertices'])
  ymax=bind[list(vis),1].max(); sole=np.array([i in vis and bind[i,1]>ymax-40 for i in range(len(bind))])
  mid=(bind[sole,0].min()+bind[sole,0].max())/2; F=sole&(bind[:,0]>mid); B=sole&(bind[:,0]<=mid)
  for a in ['idle','punch','celebrate']:
    fr=json.load(open(f'final/{v}-{a}.json')); o=[]
    for f in fr:
      b=np.asarray([s for s in f['slots'] if s['name']=='body'][0]['verts']); o.append((b[F].mean(0)-bind[F].mean(0), b[B].mean(0)-bind[B].mean(0)))
    o=np.asarray(o)
    print(v,a,'front dx %.1f..%.1f dy %.1f..%.1f | back dx %.1f..%.1f dy %.1f..%.1f'%(o[:,0,0].min(),o[:,0,0].max(),o[:,0,1].min(),o[:,0,1].max(),o[:,1,0].min(),o[:,1,0].max(),o[:,1,1].min(),o[:,1,1].max()))
