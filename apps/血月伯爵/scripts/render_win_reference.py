"""Rasterize exported native meshes for UV/alpha QA; not a browser screenshot."""
from pathlib import Path
import argparse,json
import numpy as np
from PIL import Image,ImageDraw,ImageFont
parser=argparse.ArgumentParser();parser.add_argument('folder',type=Path);args=parser.parse_args()
data=json.loads((args.folder/'geometry.json').read_text(encoding='utf8'));W,H=data['width'],data['height'];ox,oy=data['origin'];cache={}
def texture(file):
 if file not in cache:cache[file]=np.asarray(Image.open(file).convert('RGBA'),dtype=np.float32)/255
 return cache[file]
def raster(frame):
 dst=np.zeros((H,W,4),np.float32)
 for mesh in frame['meshes']:
  vertices=np.asarray(mesh['vertices'],np.float32).reshape(-1,2);vertices[:,0]+=ox;vertices[:,1]=oy-vertices[:,1]
  uv=np.asarray(mesh['uvs'],np.float32).reshape(-1,2);triangles=np.asarray(mesh['indices']).reshape(-1,3)
  left=max(0,int(np.floor(vertices[:,0].min())));top=max(0,int(np.floor(vertices[:,1].min())))
  right=min(W,int(np.ceil(vertices[:,0].max())));bottom=min(H,int(np.ceil(vertices[:,1].max())))
  if left>=right or top>=bottom:continue
  layer=np.zeros((bottom-top,right-left,4),np.float32);tex=texture(mesh['texture']);th,tw=tex.shape[:2]
  tint=np.array([(mesh['tint']>>16)&255,(mesh['tint']>>8)&255,mesh['tint']&255],np.float32)/255
  for tri in triangles:
   a,b,c=vertices[tri];x0=max(left,int(np.floor(min(a[0],b[0],c[0]))));x1=min(right,int(np.ceil(max(a[0],b[0],c[0]))))
   y0=max(top,int(np.floor(min(a[1],b[1],c[1]))));y1=min(bottom,int(np.ceil(max(a[1],b[1],c[1]))))
   if x0>=x1 or y0>=y1:continue
   den=(b[1]-c[1])*(a[0]-c[0])+(c[0]-b[0])*(a[1]-c[1])
   if abs(den)<1e-8:continue
   yy,xx=np.mgrid[y0:y1,x0:x1];xx=xx+.5;yy=yy+.5
   wa=((b[1]-c[1])*(xx-c[0])+(c[0]-b[0])*(yy-c[1]))/den
   wb=((c[1]-a[1])*(xx-c[0])+(a[0]-c[0])*(yy-c[1]))/den;wc=1-wa-wb
   inside=(wa>=-1e-6)&(wb>=-1e-6)&(wc>=-1e-6)
   if not inside.any():continue
   coords=wa[inside,None]*uv[tri[0]]+wb[inside,None]*uv[tri[1]]+wc[inside,None]*uv[tri[2]]
   tx=np.clip(coords[:,0]*tw-.5,0,tw-1);ty=np.clip(coords[:,1]*th-.5,0,th-1)
   ix=tx.astype(int);iy=ty.astype(int);fx=(tx-ix)[:,None];fy=(ty-iy)[:,None]
   ix1=np.minimum(ix+1,tw-1);iy1=np.minimum(iy+1,th-1)
   pixels=(tex[iy,ix]*(1-fx)+tex[iy,ix1]*fx)*(1-fy)+(tex[iy1,ix]*(1-fx)+tex[iy1,ix1]*fx)*fy
   pixels[:,:3]*=tint;pixels*=mesh['alpha']
   layer[y0-top:y1-top,x0-left:x1-left][inside]=pixels
  dest=dst[top:bottom,left:right]
  if mesh['blend']=='add':dest[:]=np.minimum(1,dest+layer)
  else:dest[:]=layer+dest*(1-layer[:,:,3:4])
 if frame['clip']:
  l,t,r,b=frame['clip'];mask=np.zeros((H,W,1),np.float32);mask[t:b,l:r]=1;dst*=mask
 # Preview on a neutral dark ground, leaving PMA source pixels intact.
 ground=np.array([7,8,17],np.float32)/255
 return Image.fromarray(np.uint8(np.clip(dst[:,:,:3]+ground*(1-dst[:,:,3:4]),0,1)*255))
font=ImageFont.truetype('C:/Windows/Fonts/msjh.ttc',21)
sheet=Image.new('RGB',(1280,4*420),'#090b14');draw=ImageDraw.Draw(sheet)
for i,frame in enumerate(data['frames']):
 image=raster(frame);name=f"{frame['tier']}-{'legacy' if frame['legacy'] else 'fixed'}.png";image.save(args.folder/name)
 row=i//2;col=i%2;sheet.paste(image.resize((640,390),Image.Resampling.LANCZOS),(col*640,row*420+30))
 label=f"{frame['tier'].upper()} · "+('舊座標（破圖對照）' if frame['legacy'] else '修正座標（離線網格渲染）')
 draw.text((col*640+12,row*420+3),label,font=font,fill='#d9bb84')
sheet.save(args.folder/'大獎網格修復對照.jpg',quality=94)
detail=Image.new('RGB',(1280,840),'#090b14');labels=ImageDraw.Draw(detail)
for row,tier in enumerate(['super','epic']):
 for col,legacy in enumerate([True,False]):
  name=f"{tier}-{'legacy' if legacy else 'fixed'}.png"
  detail.paste(Image.open(args.folder/name).resize((640,390),Image.Resampling.LANCZOS),(col*640,row*420+30))
  labels.text((col*640+12,row*420+3),f"{tier.upper()} · "+('修正前' if legacy else '修正後（離線網格渲染）'),font=font,fill='#d9bb84')
detail.save(args.folder/'破圖修復重點對照.jpg',quality=94)
print('Rendered all four native rig comparisons; no browser was used.')
