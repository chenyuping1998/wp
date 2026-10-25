# render each background mesh's rest and worst frame over its plate:
#   python bg_render.py dump.json <plateKey=path>... outdir
import json, sys, os
import numpy as np
from PIL import Image, ImageDraw
dump=json.load(open(sys.argv[1])); outdir=sys.argv[-1]
plates={}
for a in sys.argv[2:-1]:
    k,p=a.split('=',1); plates[k]=np.asarray(Image.open(p).convert('RGB'),float)
def raster(base, tex, uvs, verts, indices, sc, ox, oy):
    out=base.copy(); H,W=out.shape[:2]; th,tw=tex.shape[:2]
    for k in range(0,len(indices),3):
        ids=indices[k:k+3]
        p=np.array([[verts[i*2]*sc-ox, verts[i*2+1]*sc-oy] for i in ids])
        uv=np.array([[uvs[i*2],uvs[i*2+1]] for i in ids])
        x0,y0=np.floor(p.min(0)).astype(int); x1,y1=np.ceil(p.max(0)).astype(int)
        x0,y0,x1,y1=max(x0,0),max(y0,0),min(x1,W-1),min(y1,H-1)
        if x1<x0 or y1<y0: continue
        ys,xs=np.mgrid[y0:y1+1,x0:x1+1]; px,py=xs+.5,ys+.5
        (ax,ay),(bx,by),(cx,cy)=p
        d=(by-cy)*(ax-cx)+(cx-bx)*(ay-cy)
        if abs(d)<1e-9: continue
        l1=((by-cy)*(px-cx)+(cx-bx)*(py-cy))/d; l2=((cy-ay)*(px-cx)+(ax-cx)*(py-cy))/d; l3=1-l1-l2
        m=(l1>=-1e-6)&(l2>=-1e-6)&(l3>=-1e-6)
        if not m.any(): continue
        u=l1*uv[0,0]+l2*uv[1,0]+l3*uv[2,0]; v=l1*uv[0,1]+l2*uv[1,1]+l3*uv[2,1]
        tx=np.clip((u*tw).astype(int),0,tw-1); ty=np.clip((v*th).astype(int),0,th-1)
        out[ys[m],xs[m]]=tex[ty[m],tx[m]]
    return out
os.makedirs(outdir,exist_ok=True)
for r in dump:
    tex=plates.get(r['plate'])
    if tex is None: print('no plate',r['plate']); continue
    sc=tex.shape[1]/r['canvas'][0]
    x0,y0,x1,y1=r['rect']; m=6/ (1 if sc>2 else 1)
    X0=max(0,int((x0)*sc)-20); Y0=max(0,int(y0*sc)-20); X1=min(tex.shape[1],int(x1*sc)+20); Y1=min(tex.shape[0],int(y1*sc)+20)
    base=tex[Y0:Y1,X0:X1]
    rest=raster(base,tex,r['uvs'],r['rest'],r['indices'],sc,X0,Y0)
    peak=raster(base,tex,r['uvs'],r['peak'],r['indices'],sc,X0,Y0)
    diff=np.abs(peak-rest).max(-1,keepdims=True).repeat(3,-1)*3
    zoom=2 if (X1-X0)<500 else 1
    tiles=[Image.fromarray(np.clip(a,0,255).astype(np.uint8)) for a in (rest,peak,diff)]
    w,h=tiles[0].size
    o=Image.new('RGB',(w*3+20,h+18),(30,30,30))
    for i,t in enumerate(tiles): o.paste(t,(i*(w+10),18))
    ImageDraw.Draw(o).text((4,2),f"{r['name']} max {r['maxd']:.1f} @{r['at']}ms  rest | worst | diff x3",fill=(255,230,120))
    o=o.resize((o.width*zoom,o.height*zoom),Image.LANCZOS)
    o.save(os.path.join(outdir,r['name'].replace(':','_')+'.png'))
print('done')
