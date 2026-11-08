"""Offline visual QA of exported production meshes. Does not replace Stake QA.
Renders mesh/plate/light layers to MP4 and stills, with actual triangle sampling.
"""
from pathlib import Path
import json,math,subprocess,sys
import numpy as np
from PIL import Image,ImageDraw,ImageFont
import imageio_ffmpeg
ROOT=Path(__file__).resolve().parent;APP=ROOT.parent;OUT=ROOT/('preview_mummy_20261107/living_scene' if '--living' in sys.argv else 'preview_mummy_20261107/motion_polish')
FONT=ImageFont.truetype(str(APP/'static/fonts/LilitaOne.ttf'),20)
cache={}
def tex(name):
 if name not in cache:
  a=np.asarray(Image.open(APP/name).convert('RGBA')).astype(np.float32)/255;a[:,:,:3]*=a[:,:,3:];cache[name]=a
 return cache[name]
def sample(a,u,v):
 h,w=a.shape[:2];u=np.clip(u,0,w-1.001);v=np.clip(v,0,h-1.001)
 x=u.astype(np.int32);y=v.astype(np.int32);fx=(u-x)[:,None];fy=(v-y)[:,None]
 return a[y,x]*(1-fx)*(1-fy)+a[y,x+1]*fx*(1-fy)+a[y+1,x]*(1-fx)*fy+a[y+1,x+1]*fx*fy
def raster(buf,a,dst,uv,tris,opacity=1,add=False,glow=None,flash=0,sheen=None,shine=-1):
 H,W=buf.shape[:2];P,U=dst[tris],uv[tris]
 x0=np.clip(np.floor(P[:,:,0].min(1)).astype(int),0,W-1);x1=np.clip(np.ceil(P[:,:,0].max(1)).astype(int),0,W-1)
 y0=np.clip(np.floor(P[:,:,1].min(1)).astype(int),0,H-1);y1=np.clip(np.ceil(P[:,:,1].max(1)).astype(int),0,H-1)
 w=x1-x0+1;h=y1-y0+1;cnt=w*h;tid=np.repeat(np.arange(len(tris)),cnt)
 off=np.arange(tid.size)-np.repeat(np.cumsum(cnt)-cnt,cnt)
 px=x0[tid]+off%w[tid];py=y0[tid]+off//w[tid];cx=px+.5;cy=py+.5
 aa,b,c=P[tid,0],P[tid,1],P[tid,2]
 den=(b[:,1]-c[:,1])*(aa[:,0]-c[:,0])+(c[:,0]-b[:,0])*(aa[:,1]-c[:,1]);den=np.where(abs(den)<1e-8,1e-8,den)
 l0=((b[:,1]-c[:,1])*(cx-c[:,0])+(c[:,0]-b[:,0])*(cy-c[:,1]))/den
 l1=((c[:,1]-aa[:,1])*(cx-c[:,0])+(aa[:,0]-c[:,0])*(cy-c[:,1]))/den;l2=1-l0-l1
 ok=(l0>=-1e-5)&(l1>=-1e-5)&(l2>=-1e-5)
 tid,px,py,l0,l1,l2=[x[ok] for x in [tid,px,py,l0,l1,l2]]
 coords=l0[:,None]*U[tid,0]+l1[:,None]*U[tid,1]+l2[:,None]*U[tid,2]
 col=sample(a,coords[:,0]*a.shape[1],coords[:,1]*a.shape[0])
 if glow is not None and flash>0:col[:,:3]+=sample(glow,coords[:,0]*glow.shape[1],coords[:,1]*glow.shape[0])[:,:3]*flash*np.array([.95,.91,.82])
 if sheen is not None and shine>=0:
  cell=round(shine*23);sp=sample(sheen,(cell%6+coords[:,0])*128,(cell//6+coords[:,1])*128);col[:,:3]+=sp[:,:3]
 col*=opacity
 # One mesh layer, so shared triangle edges never alpha-composite twice.
 loX,hiX=int(px.min()),int(px.max())+1;loY,hiY=int(py.min()),int(py.max())+1
 layer=np.zeros((hiY-loY,hiX-loX,4),np.float32);layer[py-loY,px-loX]=col
 target=buf[loY:hiY,loX:hiX]
 if add:target[:,:,:3]+=layer[:,:,:3]
 else:target[:,:,:3]=target[:,:,:3]*(1-layer[:,:,3:])+layer[:,:,:3]
def movie(name,w,h,fps):
 return subprocess.Popen([imageio_ffmpeg.get_ffmpeg_exe(),'-y','-v','error','-f','rawvideo','-pixel_format','rgb24','-video_size',f'{w}x{h}','-framerate',str(fps),'-i','pipe:0','-an','-c:v','libx264','-crf','18','-pix_fmt','yuv420p','-movflags','+faststart',str(OUT/name)],stdin=subprocess.PIPE)
def finish(p):
 p.stdin.close();assert p.wait()==0
def rgb(a):return Image.fromarray((np.clip(a[:,:,:3],0,1)*255).astype(np.uint8))
def awards():
 meta=json.loads((OUT/'awards.json').read_text());raw=np.fromfile(OUT/'awards.bin',np.float32);offset=0;items=[]
 for s in meta['items']:
  n=meta['n']*s['verts'];s['poses']=raw[offset:offset+n].reshape(meta['n'],-1,2);offset+=n
  s['uvs']=np.array(s['uvs']).reshape(-1,2);s['indices']=np.array(s['indices']).reshape(-1,3);items.append(s)
 p=movie('awards.mp4',960,760,meta['fps']);stills=[]
 for f in range(meta['n']):
  sheet=Image.new('RGB',(960,760),'#102d34');draw=ImageDraw.Draw(sheet);draw.text((24,12),'VOLT MONSTER - SYMBOL ACTING / OFFLINE MESH PREVIEW',font=FONT,fill='#eed7a1')
  for k,s in enumerate(items):
   buf=np.zeros((288,288,4),np.float32);buf[:,:,:3]=[.06,.17,.20];buf[:,:,3]=1
   if s['plate']:
    a=tex(s['plate']);buf[16:272,16:272,:3]=a[:,:,:3]+buf[16:272,16:272,:3]*(1-a[:,:,3:])
   d=s['frames'][f];raster(buf,tex(s['subject']),s['poses'][f]+16,s['uvs'],s['indices'],glow=tex(s['glow']),flash=d['flash'],sheen=tex(s['sheenTexture']),shine=d['sheen'])
   tile=rgb(buf).resize((224,224),Image.Resampling.LANCZOS);x=16+k%4*236;y=54+k//4*232;sheet.paste(tile,(x,y));draw.text((x+4,y+2),s['name'],font=FONT,fill='#f4d49b')
  draw.text((728,540),f'{f/meta["fps"]:.2f}s / 1.50s act',font=FONT,fill='#e4d2ae');draw.text((728,572),'anticipate - act - settle',font=FONT,fill='#b6ccc8')
  p.stdin.write(np.asarray(sheet).tobytes())
  if f in [0,10,28,40]:sheet.save(OUT/f'awards_{f:02}.png');stills.append(sheet.resize((480,380)))
 finish(p);contact=Image.new('RGB',(960,760));
 for i,im in enumerate(stills):contact.paste(im,(i%2*480,i//2*380))
 contact.save(OUT/'awards_contact.png');print('Rendered awards.mp4',flush=True)
def energy(t,seed):return .5*math.sin(t*.0067+seed)+.3*math.sin(t*.0113+seed*1.7)+.2*math.sin(t*.0181+seed*2.3)
def backgrounds():
 meta=json.loads((OUT/'backgrounds.json').read_text());raw=np.fromfile(OUT/'backgrounds.bin',np.float32);offset=0;p=movie('backgrounds.mp4',960,576,meta['fps']);stills=[]
 for mode in meta['modes']:
  for s in mode['items']:
   n=meta['n']*s['verts'];s['poses']=raw[offset:offset+n].reshape(meta['n'],-1,2);offset+=n;s['uvs']=np.array(s['uvs']).reshape(-1,2);s['indices']=np.array(s['indices']).reshape(-1,3)
  far=Image.open(APP/mode['far']).convert('RGBA').resize((960,540),Image.Resampling.LANCZOS);base=np.asarray(far).astype(np.float32)/255
  props=np.asarray(Image.open(APP/mode['props']).convert('RGBA').resize((960,540),Image.Resampling.LANCZOS)).astype(np.float32)/255
  for f in range(meta['n']):
   buf=base.copy();t=f/meta['fps']*1000
   for s in mode['items']:
    if not s.get('surface'):continue
    raster(buf,tex(s['texture']),s['poses'][f]*.5,s['uvs'],s['indices'])
   buf[:,:,:3]=buf[:,:,:3]*(1-props[:,:,3:])+props[:,:,:3]*props[:,:,3:]
   for s in mode['items']:
    if s.get('surface'):continue
    pos=(s['poses'][f]+[s['p']['x'],s['p']['y']])*.5;opacity=.4+.09*energy(t,s['p']['x']/130) if s['fire'] else 1
    raster(buf,tex(s['texture']),pos,s['uvs'],s['indices'],opacity,s['fire'])
   sheet=Image.new('RGB',(960,576),'#102d34');sheet.paste(rgb(buf),(0,36));ImageDraw.Draw(sheet).text((16,8),f'{mode["mode"].upper()} / {t/1000:.2f}s - PINNED LINEN AND FLAME FLOW / OFFLINE',font=FONT,fill='#eed7a1');p.stdin.write(np.asarray(sheet).tobytes())
   if f in [0,40,120]:
    sheet.save(OUT/f'background_{mode["mode"]}_{f:03}.png')
    if f==40:stills.append(sheet)
  print('Rendered background',mode['mode'],flush=True)
 finish(p);contact=Image.new('RGB',(960,576*3))
 for i,im in enumerate(stills):contact.paste(im,(0,i*576))
 contact.save(OUT/'background_contact.png')
if __name__=='__main__':awards();backgrounds()
